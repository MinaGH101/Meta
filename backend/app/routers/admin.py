import json
import uuid
from pathlib import Path
from typing import Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..excel_tables import dumps_sheets, loads_sheets, parse_excel_upload
from ..deps import get_admin_user
from ..models import (
    ContactMessage, EjraProject, EjraProjectImage, NezaratProject, NezaratProjectImage,
    NezaratRegion, NezaratTableRow, NezaratTableWorkbook, PageContent, TarahiProject,
    TarahiProjectImage, TarahiProjectSection, User, OutboundMessage, OutboundMessageRecipient,
)
from ..schemas import (
    AdminUserUpdate, ContactOut, ContactUpdate, EjraProjectCreate, EjraProjectOut,
    EjraProjectUpdate, NezaratProjectCreate, NezaratProjectOut, NezaratProjectUpdate,
    NezaratRegionCreate, NezaratRegionOut, NezaratRegionUpdate, NezaratTableRowCreate,
    NezaratTableRowOut, NezaratTableRowUpdate, NezaratWorkbookOut, PageContentIn, PageContentOut,
    ProjectImageOut, ProjectImageUpdate, TarahiProjectCreate, TarahiProjectOut, TarahiProjectUpdate,
    TarahiProjectSectionCreate, TarahiProjectSectionOut, TarahiProjectSectionUpdate,
    UserOut, AdminUserCreate, OutboundMessageCreate, OutboundMessageOut, ProjectImageReferenceCreate,
)
from ..storage import remove_media_file, save_image
from ..security import hash_password

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_or_404(db: Session, model, item_id: uuid.UUID):
    item = db.get(model, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


def commit_or_conflict(db: Session, detail: str = "Duplicate slug"):
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=detail) from exc


def remove_project_images(project) -> None:
    for image in project.images:
        remove_media_file(image.file_url)


def upload_image_for_project(db: Session, project, image_model, folder: str, file: UploadFile, alt_text: str | None, caption: str | None, is_cover: bool, auto_cover: bool = True, **extra_fields):
    if is_cover:
        for image in project.images:
            image.is_cover = False
    item = image_model(
        project_id=project.id,
        file_url=save_image(file, f"{folder}/{project.id}"),
        alt_text=alt_text,
        caption=caption,
        is_cover=is_cover or (auto_cover and len(project.images) == 0),
        display_order=len(project.images),
        **extra_fields,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def add_image_reference(db: Session, project, image_model, payload: ProjectImageReferenceCreate, auto_cover: bool = True, **extra_fields):
    file_name = payload.file_name.strip().replace("\\", "/").split("/")[-1]
    if not file_name or file_name in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid image file name")
    if payload.is_cover:
        for image in project.images:
            image.is_cover = False
    item = image_model(
        project_id=project.id,
        file_url=f"/images/{file_name}",
        alt_text=payload.alt_text or project.name,
        caption=payload.caption,
        display_order=payload.display_order,
        is_cover=payload.is_cover or (auto_cover and len(project.images) == 0),
        **extra_fields,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_image(db: Session, item, image_model, payload: ProjectImageUpdate):
    data = payload.model_dump(exclude_unset=True)
    file_name = data.pop("file_name", None)
    if file_name is not None:
        safe_name = file_name.strip().replace("\\", "/").split("/")[-1]
        if not safe_name or safe_name in {".", ".."}:
            raise HTTPException(status_code=400, detail="Invalid image file name")
        item.file_url = f"/images/{safe_name}"
    if data.get("is_cover"):
        for image in db.scalars(select(image_model).where(image_model.project_id == item.project_id)):
            image.is_cover = False
    for key, value in data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


def set_tarahi_cover(
    db: Session,
    project: TarahiProject,
    file_url: str,
    alt_text: str | None,
    caption: str | None,
) -> TarahiProjectImage:
    current = next((image for image in project.images if image.is_cover), None)
    old_url = current.file_url if current else None
    for image in project.images:
        image.is_cover = False
    if current:
        current.file_url = file_url
        current.alt_text = alt_text or project.name
        current.caption = caption
        current.section_id = None
        current.display_order = -1
        current.is_cover = True
        item = current
    else:
        item = TarahiProjectImage(
            project_id=project.id,
            section_id=None,
            file_url=file_url,
            alt_text=alt_text or project.name,
            caption=caption,
            display_order=-1,
            is_cover=True,
        )
        db.add(item)
    db.commit()
    db.refresh(item)
    if old_url and old_url != file_url:
        remove_media_file(old_url)
    return item


# Nezarat regions
@router.get("/nezarat/regions", response_model=list[NezaratRegionOut])
def list_nezarat_regions(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return list(db.scalars(select(NezaratRegion).order_by(NezaratRegion.display_order, NezaratRegion.name)))


@router.post("/nezarat/regions", response_model=NezaratRegionOut, status_code=201)
def create_nezarat_region(payload: NezaratRegionCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = NezaratRegion(**payload.model_dump())
    db.add(item)
    commit_or_conflict(db, "Nezarat region slug already exists")
    db.refresh(item)
    return item


@router.patch("/nezarat/regions/{item_id}", response_model=NezaratRegionOut)
def update_nezarat_region(item_id: uuid.UUID, payload: NezaratRegionUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, NezaratRegion, item_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    commit_or_conflict(db, "Nezarat region slug already exists")
    db.refresh(item)
    return item


@router.delete("/nezarat/regions/{item_id}", status_code=204)
def delete_nezarat_region(item_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, NezaratRegion, item_id)
    if item.projects:
        raise HTTPException(status_code=409, detail="Move or delete projects in this region first")
    db.delete(item)
    db.commit()


# Tarahi projects
@router.get("/tarahi/projects", response_model=list[TarahiProjectOut])
def list_tarahi_projects(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    query = select(TarahiProject).options(
        selectinload(TarahiProject.images),
        selectinload(TarahiProject.sections).selectinload(TarahiProjectSection.images),
    ).order_by(TarahiProject.display_order, TarahiProject.created_at)
    return list(db.scalars(query).unique())


@router.post("/tarahi/projects", response_model=TarahiProjectOut, status_code=201)
def create_tarahi_project(payload: TarahiProjectCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = TarahiProject(**payload.model_dump())
    db.add(item)
    commit_or_conflict(db, "Tarahi project slug already exists")
    return db.scalar(
        select(TarahiProject)
        .options(
            selectinload(TarahiProject.images),
            selectinload(TarahiProject.sections).selectinload(TarahiProjectSection.images),
        )
        .where(TarahiProject.id == item.id)
    )


@router.patch("/tarahi/projects/{item_id}", response_model=TarahiProjectOut)
def update_tarahi_project(item_id: uuid.UUID, payload: TarahiProjectUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, TarahiProject, item_id)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(item, key, value)
    commit_or_conflict(db, "Tarahi project slug already exists")
    return db.scalar(
        select(TarahiProject)
        .options(
            selectinload(TarahiProject.images),
            selectinload(TarahiProject.sections).selectinload(TarahiProjectSection.images),
        )
        .where(TarahiProject.id == item.id)
    )


@router.delete("/tarahi/projects/{item_id}", status_code=204)
def delete_tarahi_project(item_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, TarahiProject, item_id)
    remove_project_images(item)
    db.delete(item)
    db.commit()


@router.post("/tarahi/projects/{item_id}/sections", response_model=TarahiProjectSectionOut, status_code=201)
def create_tarahi_section(item_id: uuid.UUID, payload: TarahiProjectSectionCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    get_or_404(db, TarahiProject, item_id)
    item = TarahiProjectSection(project_id=item_id, **payload.model_dump())
    db.add(item)
    commit_or_conflict(db, "This section slug is already used in the project")
    db.refresh(item)
    return item


@router.patch("/tarahi/sections/{item_id}", response_model=TarahiProjectSectionOut)
def update_tarahi_section(item_id: uuid.UUID, payload: TarahiProjectSectionUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, TarahiProjectSection, item_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    commit_or_conflict(db, "This section slug is already used in the project")
    db.refresh(item)
    return item


@router.delete("/tarahi/sections/{item_id}", status_code=204)
def delete_tarahi_section(item_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, TarahiProjectSection, item_id)
    urls = [image.file_url for image in item.images]
    db.delete(item)
    db.commit()
    for url in urls:
        remove_media_file(url)


@router.post("/tarahi/projects/{item_id}/images", response_model=ProjectImageOut, status_code=201)
def upload_tarahi_image(item_id: uuid.UUID, file: UploadFile = File(...), section_id: uuid.UUID | None = Form(default=None), alt_text: str | None = Form(default=None), caption: str | None = Form(default=None), is_cover: bool = Form(default=False), db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    project = get_or_404(db, TarahiProject, item_id)
    if is_cover:
        return set_tarahi_cover(
            db, project, save_image(file, f"tarahi-cover/{project.id}"),
            alt_text, caption,
        )
    if not section_id:
        raise HTTPException(status_code=400, detail="section_id is required for subgroup images")
    section = get_or_404(db, TarahiProjectSection, section_id)
    if section.project_id != project.id:
        raise HTTPException(status_code=400, detail="Section does not belong to this project")
    return upload_image_for_project(
        db, project, TarahiProjectImage, "tarahi", file, alt_text, caption,
        False, auto_cover=False, section_id=section.id,
    )


@router.post("/tarahi/projects/{item_id}/image-references", response_model=ProjectImageOut, status_code=201)
def reference_tarahi_image(item_id: uuid.UUID, payload: ProjectImageReferenceCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    project = get_or_404(db, TarahiProject, item_id)
    if payload.is_cover:
        file_name = payload.file_name.strip().replace("\\", "/").split("/")[-1]
        if not file_name or file_name in {".", ".."}:
            raise HTTPException(status_code=400, detail="Invalid image file name")
        return set_tarahi_cover(
            db, project, f"/images/{file_name}",
            payload.alt_text, payload.caption,
        )
    if not payload.section_id:
        raise HTTPException(status_code=400, detail="section_id is required for subgroup images")
    section = get_or_404(db, TarahiProjectSection, payload.section_id)
    if section.project_id != project.id:
        raise HTTPException(status_code=400, detail="Section does not belong to this project")
    return add_image_reference(
        db, project, TarahiProjectImage, payload,
        auto_cover=False, section_id=section.id,
    )


@router.patch("/tarahi/images/{item_id}", response_model=ProjectImageOut)
def update_tarahi_image(item_id: uuid.UUID, payload: ProjectImageUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, TarahiProjectImage, item_id)
    if payload.is_cover:
        item.section_id = None
    return update_image(db, item, TarahiProjectImage, payload)


@router.delete("/tarahi/images/{item_id}", status_code=204)
def delete_tarahi_image(item_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, TarahiProjectImage, item_id)
    remove_media_file(item.file_url)
    db.delete(item)
    db.commit()


# Nezarat projects
@router.get("/nezarat/projects", response_model=list[NezaratProjectOut])
def list_nezarat_projects(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    query = select(NezaratProject).options(selectinload(NezaratProject.region), selectinload(NezaratProject.images)).order_by(NezaratProject.display_order, NezaratProject.created_at)
    return list(db.scalars(query).unique())


@router.post("/nezarat/projects", response_model=NezaratProjectOut, status_code=201)
def create_nezarat_project(payload: NezaratProjectCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    get_or_404(db, NezaratRegion, payload.region_id)
    item = NezaratProject(**payload.model_dump())
    db.add(item)
    commit_or_conflict(db, "Nezarat project slug already exists")
    return db.scalar(select(NezaratProject).options(selectinload(NezaratProject.region), selectinload(NezaratProject.images)).where(NezaratProject.id == item.id))


@router.patch("/nezarat/projects/{item_id}", response_model=NezaratProjectOut)
def update_nezarat_project(item_id: uuid.UUID, payload: NezaratProjectUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, NezaratProject, item_id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("region_id"):
        get_or_404(db, NezaratRegion, data["region_id"])
    for key, value in data.items():
        setattr(item, key, value)
    commit_or_conflict(db, "Nezarat project slug already exists")
    return db.scalar(select(NezaratProject).options(selectinload(NezaratProject.region), selectinload(NezaratProject.images)).where(NezaratProject.id == item.id))


@router.delete("/nezarat/projects/{item_id}", status_code=204)
def delete_nezarat_project(item_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, NezaratProject, item_id)
    remove_project_images(item)
    db.delete(item)
    db.commit()


@router.post("/nezarat/projects/{item_id}/images", response_model=ProjectImageOut, status_code=201)
def upload_nezarat_image(item_id: uuid.UUID, file: UploadFile = File(...), alt_text: str | None = Form(default=None), caption: str | None = Form(default=None), is_cover: bool = Form(default=False), db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return upload_image_for_project(db, get_or_404(db, NezaratProject, item_id), NezaratProjectImage, "nezarat", file, alt_text, caption, is_cover)


@router.post("/nezarat/projects/{item_id}/image-references", response_model=ProjectImageOut, status_code=201)
def reference_nezarat_image(item_id: uuid.UUID, payload: ProjectImageReferenceCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return add_image_reference(db, get_or_404(db, NezaratProject, item_id), NezaratProjectImage, payload)


@router.patch("/nezarat/images/{item_id}", response_model=ProjectImageOut)
def update_nezarat_image(item_id: uuid.UUID, payload: ProjectImageUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return update_image(db, get_or_404(db, NezaratProjectImage, item_id), NezaratProjectImage, payload)


@router.delete("/nezarat/images/{item_id}", status_code=204)
def delete_nezarat_image(item_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, NezaratProjectImage, item_id)
    remove_media_file(item.file_url)
    db.delete(item)
    db.commit()


# Ejra projects
@router.get("/ejra/projects", response_model=list[EjraProjectOut])
def list_ejra_projects(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return list(db.scalars(select(EjraProject).options(selectinload(EjraProject.images)).order_by(EjraProject.display_order, EjraProject.created_at)).unique())


@router.post("/ejra/projects", response_model=EjraProjectOut, status_code=201)
def create_ejra_project(payload: EjraProjectCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = EjraProject(**payload.model_dump())
    db.add(item)
    commit_or_conflict(db, "Ejra project slug already exists")
    return db.scalar(select(EjraProject).options(selectinload(EjraProject.images)).where(EjraProject.id == item.id))


@router.patch("/ejra/projects/{item_id}", response_model=EjraProjectOut)
def update_ejra_project(item_id: uuid.UUID, payload: EjraProjectUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, EjraProject, item_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    commit_or_conflict(db, "Ejra project slug already exists")
    return db.scalar(select(EjraProject).options(selectinload(EjraProject.images)).where(EjraProject.id == item.id))


@router.delete("/ejra/projects/{item_id}", status_code=204)
def delete_ejra_project(item_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, EjraProject, item_id)
    remove_project_images(item)
    db.delete(item)
    db.commit()


@router.post("/ejra/projects/{item_id}/images", response_model=ProjectImageOut, status_code=201)
def upload_ejra_image(item_id: uuid.UUID, file: UploadFile = File(...), alt_text: str | None = Form(default=None), caption: str | None = Form(default=None), is_cover: bool = Form(default=False), db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return upload_image_for_project(db, get_or_404(db, EjraProject, item_id), EjraProjectImage, "ejra", file, alt_text, caption, is_cover)


@router.post("/ejra/projects/{item_id}/image-references", response_model=ProjectImageOut, status_code=201)
def reference_ejra_image(item_id: uuid.UUID, payload: ProjectImageReferenceCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return add_image_reference(db, get_or_404(db, EjraProject, item_id), EjraProjectImage, payload)


@router.patch("/ejra/images/{item_id}", response_model=ProjectImageOut)
def update_ejra_image(item_id: uuid.UUID, payload: ProjectImageUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return update_image(db, get_or_404(db, EjraProjectImage, item_id), EjraProjectImage, payload)


@router.delete("/ejra/images/{item_id}", status_code=204)
def delete_ejra_image(item_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, EjraProjectImage, item_id)
    remove_media_file(item.file_url)
    db.delete(item)
    db.commit()


# Nezarat Excel workbook
@router.get("/nezarat/table-workbook", response_model=NezaratWorkbookOut)
def get_nezarat_workbook(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = db.scalar(select(NezaratTableWorkbook).where(NezaratTableWorkbook.is_active.is_(True)).order_by(NezaratTableWorkbook.updated_at.desc()))
    if not item:
        return NezaratWorkbookOut()
    return NezaratWorkbookOut(
        id=item.id,
        source_filename=item.source_filename,
        sheets=loads_sheets(item.sheets_json),
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.post("/nezarat/table-workbook", response_model=NezaratWorkbookOut)
def upload_nezarat_workbook(file: UploadFile = File(...), db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    try:
        sheets = parse_excel_upload(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    item = db.scalar(select(NezaratTableWorkbook).where(NezaratTableWorkbook.is_active.is_(True)).order_by(NezaratTableWorkbook.updated_at.desc()))
    if not item:
        item = NezaratTableWorkbook()
        db.add(item)
    item.source_filename = Path(file.filename or "nezarat.xlsx").name
    item.sheets_json = dumps_sheets(sheets)
    item.is_active = True
    db.commit()
    db.refresh(item)
    return NezaratWorkbookOut(
        id=item.id,
        source_filename=item.source_filename,
        sheets=sheets,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.delete("/nezarat/table-workbook", status_code=204)
def delete_nezarat_workbook(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    items = list(db.scalars(select(NezaratTableWorkbook).where(NezaratTableWorkbook.is_active.is_(True))))
    for item in items:
        db.delete(item)
    db.commit()


# Nezarat table
@router.get("/nezarat/table", response_model=list[NezaratTableRowOut])
def list_nezarat_table(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return list(db.scalars(select(NezaratTableRow).order_by(NezaratTableRow.table_status, NezaratTableRow.display_order, NezaratTableRow.created_at)))


@router.post("/nezarat/table", response_model=NezaratTableRowOut, status_code=201)
def create_nezarat_table_row(payload: NezaratTableRowCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = NezaratTableRow(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/nezarat/table/{item_id}", response_model=NezaratTableRowOut)
def update_nezarat_table_row(item_id: uuid.UUID, payload: NezaratTableRowUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, NezaratTableRow, item_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/nezarat/table/{item_id}", status_code=204)
def delete_nezarat_table_row(item_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, NezaratTableRow, item_id)
    db.delete(item)
    db.commit()


# Page content, messages and users
@router.get("/page-contents", response_model=list[PageContentOut])
def list_page_contents(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return [PageContentOut.from_orm_item(item) for item in db.scalars(select(PageContent).order_by(PageContent.key))]


@router.put("/page-contents/{key}", response_model=PageContentOut)
def upsert_page_content(key: str, payload: PageContentIn, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = db.scalar(select(PageContent).where(PageContent.key == key))
    if not item:
        item = PageContent(key=key, title=payload.title, content_json=json.dumps(payload.content, ensure_ascii=False), is_published=payload.is_published)
        db.add(item)
    else:
        item.title = payload.title
        item.content_json = json.dumps(payload.content, ensure_ascii=False)
        item.is_published = payload.is_published
    db.commit()
    db.refresh(item)
    return PageContentOut.from_orm_item(item)


@router.get("/contacts", response_model=list[ContactOut])
def list_contacts(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return list(db.scalars(select(ContactMessage).order_by(ContactMessage.created_at.desc())))


@router.patch("/contacts/{item_id}", response_model=ContactOut)
def update_contact(item_id: uuid.UUID, payload: ContactUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, ContactMessage, item_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/contacts/{item_id}", status_code=204)
def delete_contact(item_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, ContactMessage, item_id)
    db.delete(item)
    db.commit()


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return list(db.scalars(select(User).order_by(User.created_at.desc())))


@router.patch("/users/{item_id}", response_model=UserOut)
def update_user(item_id: uuid.UUID, payload: AdminUserUpdate, db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    item = get_or_404(db, User, item_id)
    data = payload.model_dump(exclude_unset=True)
    if item.id == admin_user.id and (data.get("role") == "user" or data.get("is_active") is False):
        raise HTTPException(status_code=400, detail="You cannot remove your own admin access")
    password = data.pop("password", None)
    email = data.get("email")
    if email is not None:
        email = str(email).lower().strip()
        duplicate = db.scalar(select(User).where(User.email == email, User.id != item.id))
        if duplicate:
            raise HTTPException(status_code=409, detail="An account with this email already exists")
        data["email"] = email
    phone = data.get("phone")
    if phone is not None:
        phone = str(phone).strip() or None
        if phone and db.scalar(select(User).where(User.phone == phone, User.id != item.id)):
            raise HTTPException(status_code=409, detail="An account with this phone number already exists")
        data["phone"] = phone
    for key, value in data.items():
        setattr(item, key, value)
    if password:
        item.password_hash = hash_password(password)
    db.commit()
    db.refresh(item)
    return item


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(payload: AdminUserCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    email = payload.email.lower().strip()
    phone = payload.phone.strip() if payload.phone else None
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    if phone and db.scalar(select(User).where(User.phone == phone)):
        raise HTTPException(status_code=409, detail="An account with this phone number already exists")
    item = User(
        full_name=payload.full_name.strip(),
        email=email,
        phone=phone,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/users/{item_id}", status_code=204)
def delete_user(item_id: uuid.UUID, db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    if item_id == admin_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    item = get_or_404(db, User, item_id)
    db.delete(item)
    db.commit()


@router.get("/messages/incoming", response_model=list[ContactOut])
def incoming_messages(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return list(db.scalars(select(ContactMessage).order_by(ContactMessage.created_at.desc())))


@router.get("/messages/outgoing", response_model=list[OutboundMessageOut])
def outgoing_messages(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    query = (
        select(OutboundMessage)
        .options(
            selectinload(OutboundMessage.created_by),
            selectinload(OutboundMessage.recipients).selectinload(OutboundMessageRecipient.user),
        )
        .order_by(OutboundMessage.created_at.desc())
    )
    return list(db.scalars(query).unique())


@router.post("/messages/outgoing", response_model=OutboundMessageOut, status_code=201)
def create_outgoing_message(payload: OutboundMessageCreate, db: Session = Depends(get_db), admin_user: User = Depends(get_admin_user)):
    unique_ids = list(dict.fromkeys(payload.user_ids))
    users = list(db.scalars(select(User).where(User.id.in_(unique_ids), User.is_active.is_(True))))
    if len(users) != len(unique_ids):
        raise HTTPException(status_code=400, detail="One or more recipients are invalid or inactive")
    item = OutboundMessage(
        created_by_id=admin_user.id,
        subject=payload.subject.strip(),
        body=payload.body.strip(),
        channel=payload.channel,
        status="queued",
    )
    db.add(item)
    db.flush()
    for user in users:
        db.add(OutboundMessageRecipient(message_id=item.id, user_id=user.id, delivery_status="pending"))
    db.commit()
    return db.scalar(
        select(OutboundMessage)
        .options(
            selectinload(OutboundMessage.created_by),
            selectinload(OutboundMessage.recipients).selectinload(OutboundMessageRecipient.user),
        )
        .where(OutboundMessage.id == item.id)
    )


@router.delete("/messages/outgoing/{item_id}", status_code=204)
def delete_outgoing_message(item_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    item = get_or_404(db, OutboundMessage, item_id)
    db.delete(item)
    db.commit()
