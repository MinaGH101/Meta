from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..excel_tables import loads_sheets
from ..deps import get_optional_user, get_current_user
from ..models import (
    ContactMessage, EjraProject, NezaratProject, NezaratRegion, NezaratTableRow, NezaratTableWorkbook,
    PageContent, TarahiProject, TarahiProjectSection, User,
)
from ..schemas import (
    ContactCreate, ContactOut, EjraProjectOut, NezaratProjectOut, NezaratRegionOut,
    NezaratTableRowOut, NezaratWorkbookOut, PageContentOut, TarahiProjectOut,
)

router = APIRouter(tags=["Public Website"])

REGION_ALIASES = {
    "karaj": ("karaj", "کرج", "سایر مناطق تهران"),
    "shemshak": ("shemshak", "شمشک"),
}


@router.get("/tarahi/projects", response_model=list[TarahiProjectOut])
def tarahi_projects(
    state: str | None = Query(default=None, pattern="^(open|closed)$"),
    db: Session = Depends(get_db),
):
    query = select(TarahiProject).options(
        selectinload(TarahiProject.images),
        selectinload(TarahiProject.sections).selectinload(TarahiProjectSection.images),
    ).order_by(TarahiProject.display_order, TarahiProject.created_at)
    if state:
        query = query.where(TarahiProject.state == state)
    return list(db.scalars(query).unique())


@router.get("/tarahi/projects/{slug}", response_model=TarahiProjectOut)
def tarahi_project(slug: str, db: Session = Depends(get_db)):
    item = db.scalar(
        select(TarahiProject)
        .options(
            selectinload(TarahiProject.images),
            selectinload(TarahiProject.sections).selectinload(TarahiProjectSection.images),
        )
        .where(TarahiProject.slug == slug)
    )
    if not item:
        raise HTTPException(status_code=404, detail="Tarahi project not found")
    return item


@router.get("/nezarat/regions", response_model=list[NezaratRegionOut])
def nezarat_regions(db: Session = Depends(get_db)):
    return list(db.scalars(select(NezaratRegion).where(NezaratRegion.is_active.is_(True)).order_by(NezaratRegion.display_order, NezaratRegion.name)))


@router.get("/nezarat/projects", response_model=list[NezaratProjectOut])
def nezarat_projects(
    region: str | None = None,
    state: str | None = Query(default=None, pattern="^(open|closed)$"),
    db: Session = Depends(get_db),
):
    query = select(NezaratProject).options(selectinload(NezaratProject.region), selectinload(NezaratProject.images)).order_by(NezaratProject.display_order, NezaratProject.created_at)
    if region:
        region_values = REGION_ALIASES.get(region, (region,))
        query = query.join(NezaratProject.region).where(or_(NezaratRegion.slug.in_(region_values), NezaratRegion.name.in_(region_values)))
    if state:
        query = query.where(NezaratProject.state == state)
    return list(db.scalars(query).unique())


@router.get("/nezarat/projects/{slug}", response_model=NezaratProjectOut)
def nezarat_project(slug: str, db: Session = Depends(get_db)):
    item = db.scalar(select(NezaratProject).options(selectinload(NezaratProject.region), selectinload(NezaratProject.images)).where(NezaratProject.slug == slug))
    if not item:
        raise HTTPException(status_code=404, detail="Nezarat project not found")
    return item


@router.get("/nezarat/table-workbook", response_model=NezaratWorkbookOut)
def nezarat_table_workbook(db: Session = Depends(get_db)):
    workbook = db.scalar(
        select(NezaratTableWorkbook)
        .where(NezaratTableWorkbook.is_active.is_(True))
        .order_by(NezaratTableWorkbook.updated_at.desc(), NezaratTableWorkbook.created_at.desc())
    )
    if workbook:
        return NezaratWorkbookOut(
            id=workbook.id,
            source_filename=workbook.source_filename,
            sheets=loads_sheets(workbook.sheets_json),
            created_at=workbook.created_at,
            updated_at=workbook.updated_at,
        )

    # Backward-compatible view for databases that still contain manually entered rows.
    rows = list(
        db.scalars(
            select(NezaratTableRow)
            .where(NezaratTableRow.is_published.is_(True))
            .order_by(NezaratTableRow.table_status, NezaratTableRow.display_order, NezaratTableRow.created_at)
        )
    )
    live_rows = [
        [row.region, row.metraj, row.allowed_floors, row.project_stage, row.year]
        for row in rows if row.table_status == "live"
    ]
    ended_rows = [
        [row.metraj, row.region, row.address, row.referral_date.isoformat() if row.referral_date else None]
        for row in rows if row.table_status == "ended"
    ]
    sheets = []
    if live_rows:
        sheets.append({"name": "پروژه‌های جاری", "columns": ["منطقه", "متراژ مجاز", "طبقات مجاز", "مرحله پروژه", "سال"], "rows": live_rows})
    if ended_rows:
        sheets.append({"name": "پروژه‌های پایان‌یافته", "columns": ["متراژ", "منطقه", "آدرس", "تاریخ ارجاع کار"], "rows": ended_rows})
    return NezaratWorkbookOut(sheets=sheets)


@router.get("/nezarat/table", response_model=list[NezaratTableRowOut])
def nezarat_table(
    status_value: str = Query(alias="status", pattern="^(live|ended)$"),
    db: Session = Depends(get_db),
):
    return list(db.scalars(select(NezaratTableRow).where(NezaratTableRow.table_status == status_value, NezaratTableRow.is_published.is_(True)).order_by(NezaratTableRow.display_order, NezaratTableRow.created_at)))


@router.get("/ejra/projects", response_model=list[EjraProjectOut])
def ejra_projects(
    state: str | None = Query(default=None, pattern="^(open|closed)$"),
    db: Session = Depends(get_db),
):
    query = select(EjraProject).options(selectinload(EjraProject.images)).order_by(EjraProject.display_order, EjraProject.created_at)
    if state:
        query = query.where(EjraProject.state == state)
    return list(db.scalars(query).unique())


@router.get("/ejra/projects/{slug}", response_model=EjraProjectOut)
def ejra_project(slug: str, db: Session = Depends(get_db)):
    item = db.scalar(select(EjraProject).options(selectinload(EjraProject.images)).where(EjraProject.slug == slug))
    if not item:
        raise HTTPException(status_code=404, detail="Ejra project not found")
    return item


@router.get("/page-content/{key}", response_model=PageContentOut)
def page_content(key: str, db: Session = Depends(get_db)):
    page = db.scalar(select(PageContent).where(PageContent.key == key, PageContent.is_published.is_(True)))
    if not page:
        raise HTTPException(status_code=404, detail="Page content not found")
    return PageContentOut.from_orm_item(page)


@router.post("/contact", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(payload: ContactCreate, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    item = ContactMessage(user_id=user.id if user else None, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/contact/mine", response_model=list[ContactOut])
def my_contacts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return list(db.scalars(select(ContactMessage).where(ContactMessage.user_id == user.id).order_by(ContactMessage.created_at.desc())))
