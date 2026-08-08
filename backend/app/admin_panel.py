from __future__ import annotations

from html import escape
import jinja2
from pathlib import Path
import re
from typing import Any
from urllib.parse import urlencode
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from starlette.datastructures import FormData, UploadFile
from starlette.middleware import Middleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import HTMLResponse, RedirectResponse
from sqladmin import Admin, BaseView, expose
from sqladmin.authentication import AuthenticationBackend

from .config import settings
from .database import SessionLocal, engine
from .excel_tables import dumps_sheets, loads_sheets, parse_excel_upload
from .models import (
    ContactMessage,
    EjraProject,
    EjraProjectImage,
    NezaratProject,
    NezaratProjectImage,
    NezaratRegion,
    NezaratTableRow,
    NezaratTableWorkbook,
    OutboundMessage,
    OutboundMessageRecipient,
    TarahiProject,
    TarahiProjectImage,
    TarahiProjectSection,
    User,
)
from .security import hash_password, verify_password
from .storage import remove_media_file, save_image


ADMIN_BASE_URL = "/admin"
ADMIN_PUBLIC_URL = f"{settings.admin_public_prefix.rstrip('/')}{ADMIN_BASE_URL}"


class AdminAuthentication(AuthenticationBackend):
    def __init__(self, secret_key: str) -> None:
        super().__init__(secret_key)
        self.middlewares = [
            Middleware(
                SessionMiddleware,
                secret_key=secret_key,
                same_site="lax",
                https_only=settings.environment == "production",
                max_age=8 * 60 * 60,
            )
        ]

    async def login(self, request: Request) -> bool:
        form = await request.form()
        email = str(form.get("username") or "").strip().lower()
        password = str(form.get("password") or "")
        with SessionLocal() as db:
            user = db.scalar(select(User).where(User.email == email))
            if not user or not user.is_active or user.role != "admin":
                return False
            if not verify_password(password, user.password_hash):
                return False
            request.session.update({"admin_user_id": str(user.id), "admin_email": user.email})
        return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool | RedirectResponse:
        raw_user_id = request.session.get("admin_user_id")
        if not raw_user_id:
            return RedirectResponse(f"{ADMIN_PUBLIC_URL}/login", status_code=302)
        try:
            user_id = UUID(str(raw_user_id))
        except (TypeError, ValueError):
            request.session.clear()
            return RedirectResponse(f"{ADMIN_PUBLIC_URL}/login", status_code=302)
        with SessionLocal() as db:
            user = db.get(User, user_id)
            if not user or not user.is_active or user.role != "admin":
                request.session.clear()
                return RedirectResponse(f"{ADMIN_PUBLIC_URL}/login", status_code=302)
        return True


class MetaAdmin(Admin):
    async def login(self, request: Request):
        assert self.authentication_backend is not None
        context: dict[str, str] = {}
        if request.method == "GET":
            return await self.templates.TemplateResponse(request, "sqladmin/login.html")
        ok = await self.authentication_backend.login(request)
        if not ok:
            context["error"] = "Invalid credentials."
            return await self.templates.TemplateResponse(
                request, "sqladmin/login.html", context, status_code=400
            )
        return RedirectResponse(f"{ADMIN_PUBLIC_URL}/management", status_code=302)

    async def logout(self, request: Request):
        assert self.authentication_backend is not None
        await self.authentication_backend.logout(request)
        return RedirectResponse(f"{ADMIN_PUBLIC_URL}/login", status_code=302)


def configure_admin_template_urls(admin: Admin) -> None:
    @jinja2.pass_context
    def public_url_for(context: dict, route_name: str, **path_params: Any) -> str:
        request = context["request"]
        url = request.url_for(route_name, **path_params)
        path = url.path
        if route_name.startswith("admin:") and settings.admin_public_prefix:
            prefix = settings.admin_public_prefix.rstrip("/")
            if not path.startswith(f"{prefix}/"):
                path = f"{prefix}{path}"
        return path

    admin.templates.env.globals["url_for"] = public_url_for


PROJECT_CONFIG: dict[str, dict[str, Any]] = {
    "tarahi": {
        "label": "طراحی",
        "model": TarahiProject,
        "image_model": TarahiProjectImage,
        "relation_model": None,
        "relation_field": None,
        "relation_label": None,
        "extra_field": None,
        "supports_sections": True,
    },
    "nezarat": {
        "label": "نظارت",
        "model": NezaratProject,
        "image_model": NezaratProjectImage,
        "relation_model": NezaratRegion,
        "relation_field": "region_id",
        "relation_label": "منطقه",
        "extra_field": "orientation",
        "supports_sections": False,
    },
    "ejra": {
        "label": "اجرا",
        "model": EjraProject,
        "image_model": EjraProjectImage,
        "relation_model": None,
        "relation_field": None,
        "relation_label": None,
        "extra_field": None,
        "supports_sections": False,
    },
}


def h(value: object | None) -> str:
    return escape("" if value is None else str(value), quote=True)


def selected(current: object | None, expected: object) -> str:
    return "selected" if str(current or "") == str(expected) else ""


def checked(value: bool) -> str:
    return "checked" if value else ""


def bool_from_form(form: FormData, name: str) -> bool:
    return str(form.get(name) or "").lower() in {"1", "true", "on", "yes"}


def int_from_form(form: FormData, name: str, default: int = 0) -> int:
    raw = str(form.get(name) or "").strip()
    return int(raw) if raw else default


def clean_slug(raw: str, prefix: str) -> str:
    value = raw.strip().lower()
    value = re.sub(r"[^\w\-]+", "-", value, flags=re.UNICODE)
    value = re.sub(r"-+", "-", value).strip("-")
    return value[:170] or f"{prefix}-{uuid4().hex[:10]}"


def clean_image_name(raw: str) -> str:
    value = raw.strip().replace("\\", "/").split("/")[-1]
    if not value or value in {".", ".."} or not re.fullmatch(r"[^/]+\.(?:jpg|jpeg|png|webp)", value, flags=re.I):
        raise ValueError(f"Invalid image name: {raw}")
    return value


def parse_iso_date(raw: str):
    from datetime import date
    return date.fromisoformat(raw) if raw else None


def notice_url(*, area: str, project_type: str = "tarahi", success: str | None = None, error: str | None = None, edit: UUID | None = None, message_view: str = "received") -> RedirectResponse:
    params = {"area": area, "type": project_type, "message_view": message_view}
    if success:
        params["success"] = success
    if error:
        params["error"] = error
    if edit:
        params["edit"] = str(edit)
    return RedirectResponse(f"{ADMIN_PUBLIC_URL}/management?{urlencode(params)}", status_code=303)


def error_text(exc: Exception) -> str:
    if isinstance(exc, HTTPException):
        return str(exc.detail)
    if isinstance(exc, IntegrityError):
        return "This value is already used, or the record is still referenced."
    return str(exc) or exc.__class__.__name__


def current_admin_id(request: Request) -> UUID:
    return UUID(str(request.session["admin_user_id"]))


def admin_image_src(file_url: str) -> str:
    if file_url.startswith("/images/"):
        return settings.frontend_public_url.rstrip("/") + file_url
    return file_url


def image_uploads(form: FormData, field: str = "images") -> list[UploadFile]:
    return [item for item in form.getlist(field) if isinstance(item, UploadFile) and item.filename]


def project_values(form: FormData, config: dict[str, Any], existing: Any | None = None) -> dict[str, Any]:
    name = str(form.get("name") or "").strip()
    if not name:
        raise ValueError("Project name is required.")
    state = str(form.get("state") or "open").lower()
    if state not in {"open", "closed"}:
        raise ValueError("Invalid project state.")
    slug_source = str(form.get("slug") or "").strip() or (existing.slug if existing else name)
    values: dict[str, Any] = {
        "name": name,
        "slug": clean_slug(slug_source, config["label"].lower()),
        "metraj": str(form.get("metraj") or "").strip() or None,
        "location": str(form.get("location") or "").strip() or None,
        "description": str(form.get("description") or "").strip(),
        "state": state,
        "year": str(form.get("year") or "").strip() or None,
        "display_order": int_from_form(form, "display_order"),
    }
    relation_field = config["relation_field"]
    if relation_field:
        raw = str(form.get(relation_field) or "").strip()
        if not raw:
            raise ValueError(f"{config['relation_label']} is required.")
        values[relation_field] = UUID(raw)
    if config["extra_field"]:
        values[config["extra_field"]] = str(form.get(config["extra_field"]) or "").strip() or None
    return values


def add_uploaded_images(db, section: str, project: Any, image_model: Any, uploads: list[UploadFile], alt_text: str | None, caption: str | None, section_id: UUID | None = None, allow_cover: bool = True) -> int:
    if not uploads:
        return 0
    max_order = db.scalar(select(func.max(image_model.display_order)).where(image_model.project_id == project.id))
    next_order = int(max_order if max_order is not None else -1) + 1
    has_cover = db.scalar(select(image_model.id).where(image_model.project_id == project.id, image_model.is_cover.is_(True))) is not None
    saved: list[str] = []
    try:
        for index, upload in enumerate(uploads):
            file_url = save_image(upload, folder=f"{section}-{project.id}")
            saved.append(file_url)
            values = dict(
                project_id=project.id,
                file_url=file_url,
                alt_text=alt_text or project.name,
                caption=caption,
                display_order=next_order + index,
                is_cover=allow_cover and not has_cover and index == 0,
            )
            if section_id is not None:
                values["section_id"] = section_id
            db.add(image_model(**values))
        db.flush()
    except Exception:
        for url in saved:
            remove_media_file(url)
        raise
    return len(saved)


def replace_tarahi_cover(db, project: TarahiProject, upload: UploadFile) -> None:
    current = db.scalar(
        select(TarahiProjectImage).where(
            TarahiProjectImage.project_id == project.id,
            TarahiProjectImage.is_cover.is_(True),
        )
    )
    new_url = save_image(upload, folder=f"tarahi-cover-{project.id}")
    for image in project.images:
        if image is not current:
            image.is_cover = False
    if current:
        old_url = current.file_url
        current.file_url = new_url
        current.section_id = None
        current.alt_text = project.name
        current.is_cover = True
        remove_media_file(old_url)
    else:
        db.add(
            TarahiProjectImage(
                project_id=project.id,
                section_id=None,
                file_url=new_url,
                alt_text=project.name,
                display_order=-1,
                is_cover=True,
            )
        )
    db.flush()


def add_named_images(db, project: Any, image_model: Any, raw_names: str, alt_text: str | None, caption: str | None, section_id: UUID | None = None) -> int:
    names = [clean_image_name(line) for line in raw_names.splitlines() if line.strip()]
    if not names:
        return 0
    max_order = db.scalar(select(func.max(image_model.display_order)).where(image_model.project_id == project.id))
    next_order = int(max_order if max_order is not None else -1) + 1
    has_cover = db.scalar(select(image_model.id).where(image_model.project_id == project.id, image_model.is_cover.is_(True))) is not None
    for index, name in enumerate(names):
        values = dict(
            project_id=project.id,
            file_url=f"/images/{name}",
            alt_text=alt_text or project.name,
            caption=caption,
            display_order=next_order + index,
            is_cover=not has_cover and index == 0,
        )
        if section_id is not None:
            values["section_id"] = section_id
        db.add(image_model(**values))
    db.flush()
    return len(names)


def load_project(db, section: str, project_id: UUID):
    config = PROJECT_CONFIG[section]
    options = [selectinload(config["model"].images)]
    if section == "tarahi":
        options.append(selectinload(TarahiProject.sections).selectinload(TarahiProjectSection.images))
    elif section == "nezarat":
        options.append(selectinload(NezaratProject.region))
    return db.scalar(select(config["model"]).options(*options).where(config["model"].id == project_id))


def delete_project(db, project: Any) -> None:
    urls = [image.file_url for image in project.images]
    db.delete(project)
    db.commit()
    for url in urls:
        remove_media_file(url)


def update_project_image(db, config: dict[str, Any], form: FormData) -> UUID:
    image = db.get(config["image_model"], UUID(str(form.get("image_id") or "")))
    if not image:
        raise ValueError("Image not found.")
    project_id = image.project_id
    replacement = image_uploads(form, "replacement_image")
    if replacement:
        old_url = image.file_url
        image.file_url = save_image(replacement[0], folder=f"replacement-{project_id}")
        remove_media_file(old_url)
    else:
        raw_path = str(form.get("file_url") or "").strip()
        if raw_path.startswith("/media/"):
            image.file_url = raw_path
        elif raw_path:
            image.file_url = f"/images/{clean_image_name(raw_path)}"
    image.alt_text = str(form.get("alt_text") or "").strip() or None
    image.caption = str(form.get("caption") or "").strip() or None
    image.display_order = int_from_form(form, "image_display_order")
    if config["supports_sections"]:
        section_id = UUID(str(form.get("section_id") or ""))
        section = db.get(TarahiProjectSection, section_id)
        if not section or section.project_id != project_id:
            raise ValueError("بخش طراحی انتخاب‌شده معتبر نیست.")
        image.section_id = section.id
    if bool_from_form(form, "is_cover"):
        db.execute(update(config["image_model"]).where(config["image_model"].project_id == project_id).values(is_cover=False))
        image.is_cover = True
    db.commit()
    return project_id


def delete_project_image(db, config: dict[str, Any], image_id: UUID) -> UUID:
    image = db.get(config["image_model"], image_id)
    if not image:
        raise ValueError("Image not found.")
    project_id = image.project_id
    was_cover = image.is_cover
    old_url = image.file_url
    db.delete(image)
    db.flush()
    if was_cover and not config["supports_sections"]:
        replacement = db.scalar(select(config["image_model"]).where(config["image_model"].project_id == project_id).order_by(config["image_model"].display_order))
        if replacement:
            replacement.is_cover = True
    db.commit()
    remove_media_file(old_url)
    return project_id


ADMIN_CSS = """
@font-face{font-family:Shabnam;src:local("Shabnam"),url("https://cdnjs.cloudflare.com/ajax/libs/shabnam-font/5.0.1/Shabnam.woff2") format("woff2");font-display:swap}
:root{--bg:#f1f2f3;--panel:#fff;--panel2:#f7f7f8;--field:#fff;--line:#d9dde1;--text:#17191c;--muted:#6f7780;--red:#bd3039;--red2:#9e252e;--green:#237a51;--danger:#c53641;--shadow:0 10px 30px rgba(19,25,31,.08)}
html[data-theme="dark"]{--bg:#151718;--panel:#1d2022;--panel2:#17191b;--field:#131517;--line:#34393e;--text:#f5f6f7;--muted:#a0a7ad;--shadow:0 14px 34px rgba(0,0,0,.24);color-scheme:dark}
*{box-sizing:border-box}html{color-scheme:light}body{margin:0;background:radial-gradient(circle at 88% 0,rgba(189,48,57,.12),transparent 28%),var(--bg);color:var(--text);font:14px/1.75 Shabnam,Tahoma,sans-serif;direction:rtl}a{color:inherit}.top{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:18px;justify-content:space-between;padding:12px 22px;background:color-mix(in srgb,var(--panel) 90%,transparent);border-bottom:1px solid var(--line);backdrop-filter:blur(14px)}.brand-wrap{display:flex;align-items:center;gap:10px}.brand-mark{width:9px;height:32px;background:var(--red);border-radius:8px}.brand{font-weight:900;font-size:15px}.topnav,.tabs,.actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.topnav a,.tabs a,.icon-button{padding:8px 12px;text-decoration:none;border:1px solid transparent;border-radius:6px;color:var(--muted);background:transparent}.topnav a:hover,.topnav a.active,.tabs a:hover,.tabs a.active{background:var(--panel2);border-color:var(--line);color:var(--text)}.icon-button{cursor:pointer;font:inherit}.wrap{max-width:1540px;margin:auto;padding:22px}.tabs{margin-bottom:16px}.page-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.page-head h1{font-size:22px;margin:0}.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:16px;margin-bottom:16px;box-shadow:var(--shadow)}.card h1,.card h2,.card h3{margin-top:0}.card h2{font-size:16px}.muted{color:var(--muted)}.layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,390px);gap:16px;align-items:start}.stack{min-width:0}.split{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}.full{grid-column:1/-1}.span2{grid-column:span 2}.form-section{border:1px solid var(--line);background:var(--panel2);border-radius:7px;padding:13px;margin-bottom:11px}.form-section-title{font-weight:900;margin-bottom:10px;color:var(--text)}
label{display:grid;gap:5px;color:var(--muted);font-weight:700;font-size:12px}input,textarea,select{width:100%;min-height:40px;padding:9px 10px;background:var(--field);color:var(--text);border:1px solid var(--line);border-radius:6px;font:inherit;pointer-events:auto;user-select:text;opacity:1}textarea{min-height:86px;resize:vertical}select[multiple]{min-height:150px}input:focus,textarea:focus,select:focus{outline:3px solid rgba(189,48,57,.13);border-color:var(--red)}input[type=checkbox]{width:17px;min-height:17px;accent-color:var(--red)}input[type=file]{padding:7px}.inline-check{display:flex;align-items:center;gap:7px;min-height:40px}
button,.button{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:8px 13px;border:1px solid var(--red);border-radius:6px;background:var(--red);color:#fff;font-weight:850;cursor:pointer;text-decoration:none;font-family:inherit}button:hover,.button:hover{background:var(--red2)}button.secondary,.button.secondary{background:transparent;border-color:var(--line);color:var(--text)}button.danger,.button.danger{background:transparent;border-color:rgba(197,54,65,.55);color:var(--danger)}.notice{padding:11px 13px;border-radius:6px;margin-bottom:14px;border:1px solid}.notice.ok{border-color:rgba(35,122,81,.55);background:rgba(35,122,81,.1)}.notice.error{border-color:rgba(197,54,65,.55);background:rgba(197,54,65,.1)}
.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:7px}table{width:100%;border-collapse:collapse;min-width:720px}th,td{padding:10px;border-bottom:1px solid var(--line);text-align:right;vertical-align:middle}th{color:var(--muted);font-size:12px;background:var(--panel2)}.empty{padding:24px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:7px}.project{display:grid;grid-template-columns:94px 1fr auto;gap:12px;align-items:center;padding:11px;background:var(--panel2);border:1px solid var(--line);border-radius:7px;margin-bottom:9px}.project h3{margin:0 0 4px;font-size:14px}.cover{width:94px;height:68px;object-fit:cover;border-radius:6px;background:#0d0f10}.placeholder{display:grid;place-items:center;color:var(--muted)}.meta{color:var(--muted);font-size:11px}.images{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin-top:12px}.image-card{background:var(--panel2);border:1px solid var(--line);border-radius:7px;overflow:hidden}.image-card img{display:block;width:100%;height:120px;object-fit:cover}.image-body{padding:10px}.badge{display:inline-block;padding:2px 7px;border-radius:12px;background:var(--red);color:#fff;font-size:10px}.taxonomy{display:grid;gap:7px}.taxonomy-item{padding:9px;background:var(--panel2);border:1px solid var(--line);border-radius:6px}.taxonomy-fields{display:grid;grid-template-columns:1fr 1fr 75px auto;gap:8px}.message{padding:13px;background:var(--panel2);border:1px solid var(--line);border-radius:7px;margin-bottom:9px}.message-head{display:flex;justify-content:space-between;gap:12px}.message-body{white-space:pre-wrap;margin-top:9px}.pill{display:inline-block;padding:2px 7px;border:1px solid var(--line);border-radius:12px;color:var(--muted);font-size:10px}details.compact{background:var(--panel);border:1px solid var(--line);border-radius:8px;margin-bottom:16px;box-shadow:var(--shadow)}details.compact>summary{list-style:none;cursor:pointer;padding:14px 16px;font-weight:900;display:flex;align-items:center;justify-content:space-between}details.compact>summary::-webkit-details-marker{display:none}details.compact>summary:after{content:"＋";color:var(--red);font-size:18px}details.compact[open]>summary:after{content:"−"}.details-body{padding:0 16px 16px;border-top:1px solid var(--line)}.modal-shell{position:fixed;inset:0;z-index:50;background:rgba(5,7,9,.58);backdrop-filter:blur(7px);display:grid;place-items:center;padding:20px}.modal-card{width:min(980px,100%);max-height:92vh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 26px 70px rgba(0,0,0,.35)}.modal-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:var(--panel);border-bottom:1px solid var(--line)}.modal-body{padding:16px}
.excel-current{display:grid;gap:12px;margin:14px 0;padding:13px;border:1px solid var(--line);border-radius:6px;background:var(--panel2)}.excel-sheets{display:flex;flex-wrap:wrap;gap:7px}.excel-upload-form{display:grid;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}.excel-upload-form button{justify-self:start}.excel-upload-form input[type=file]{padding:8px;background:var(--field)}.section-manager{grid-template-columns:repeat(auto-fit,minmax(310px,1fr));align-items:start}.section-manager .taxonomy-item{margin:0}.section-manager details.compact{margin:0;box-shadow:none}.modal-body{overflow-x:hidden}.upload-picker{display:flex;align-items:center;justify-content:center;min-height:42px;padding:8px 12px;border:1px dashed var(--red);border-radius:6px;color:var(--red);cursor:pointer;background:rgba(189,48,57,.05)}.upload-picker input{display:none}.upload-preview{display:grid;grid-template-columns:repeat(auto-fill,minmax(105px,1fr));gap:8px;margin-top:10px}.upload-preview:empty{display:none}.upload-preview img,.section-image img{width:100%;height:92px;object-fit:cover;border-radius:5px;background:#111}.section-images{display:grid;grid-template-columns:repeat(auto-fill,minmax(125px,1fr));gap:8px;margin-top:12px}.section-image{padding:7px;border:1px solid var(--line);border-radius:6px;background:var(--field)}.section-image form{margin-top:6px}.section-image button{width:100%;min-height:32px;padding:5px}.cover-editor{display:grid;grid-template-columns:180px minmax(0,1fr);gap:13px;align-items:center}.cover-editor>img,.cover-placeholder{width:180px;height:118px;object-fit:cover;border-radius:6px;background:var(--field);border:1px solid var(--line)}.cover-placeholder{display:grid;place-items:center;color:var(--muted)}
@media(max-width:1050px){.layout,.split{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr 1fr}.project{grid-template-columns:82px 1fr}.project>.actions{grid-column:1/-1}.cover{width:82px;height:62px}}@media(max-width:680px){.wrap{padding:12px}.top{padding:10px 12px;align-items:flex-start}.topnav{overflow:auto;flex-wrap:nowrap}.form-grid,.taxonomy-fields,.cover-editor{grid-template-columns:1fr}.full,.span2{grid-column:auto}.project{grid-template-columns:1fr}.cover{width:100%;height:175px}.cover-editor>img,.cover-placeholder{width:100%;height:170px}.page-head{align-items:flex-start;flex-direction:column}.modal-shell{padding:0}.modal-card{height:100%;max-height:100%;border-radius:0}}
"""


def layout(title: str, body: str, area: str, project_type: str = "tarahi") -> HTMLResponse:
    top_links = [
        ("projects", "پروژه‌ها", f"{ADMIN_PUBLIC_URL}/management?area=projects&type={project_type}"),
        ("users", "کاربران", f"{ADMIN_PUBLIC_URL}/management?area=users"),
        ("messages", "پیام‌ها", f"{ADMIN_PUBLIC_URL}/management?area=messages&message_view=received"),
    ]
    nav = "".join(f'<a class="{"active" if key == area else ""}" href="{url}">{label}</a>' for key, label, url in top_links)
    script = """<script>(function(){const root=document.documentElement;const saved=localStorage.getItem('meta-admin-theme')||'dark';root.dataset.theme=saved;window.toggleAdminTheme=function(){const next=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=next;localStorage.setItem('meta-admin-theme',next)};window.previewAdminImages=function(input,targetId,single){const target=document.getElementById(targetId);if(!target)return;target.innerHTML='';Array.from(input.files||[]).slice(0,single?1:50).forEach(file=>{const image=document.createElement('img');image.src=URL.createObjectURL(file);image.alt=file.name;target.appendChild(image)})}})();</script>"""
    return HTMLResponse(f"""<!doctype html><html lang="fa" dir="rtl" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{h(title)}</title><style>{ADMIN_CSS}</style>{script}</head><body><header class="top"><div class="brand-wrap"><span class="brand-mark"></span><div class="brand">پنل مدیریت متا</div></div><nav class="topnav">{nav}<a href="/docs">مستندات API</a></nav><div class="actions"><button type="button" class="icon-button" onclick="toggleAdminTheme()">تغییر پوسته</button><a class="button secondary" href="{ADMIN_PUBLIC_URL}/logout">خروج</a></div></header><main class="wrap">{body}</main></body></html>""")


def notices(request: Request) -> str:
    success = request.query_params.get("success")
    error = request.query_params.get("error")
    return (f'<div class="notice ok">{h(success)}</div>' if success else "") + (f'<div class="notice error">{h(error)}</div>' if error else "")


def project_tabs(active: str) -> str:
    return '<nav class="tabs">' + "".join(
        f'<a class="{"active" if item == active else ""}" href="{ADMIN_PUBLIC_URL}/management?area=projects&type={item}">{label}</a>'
        for item, label in (("tarahi", "طراحی"), ("nezarat", "نظارت"), ("ejra", "اجرا"))
    ) + "</nav>"


def relation_options(relations: list[Any], current: UUID | None) -> str:
    return "".join(f'<option value="{item.id}" {selected(current, item.id)}>{h(item.name)}</option>' for item in relations)


def tarahi_section_options(project: TarahiProject, current: UUID | None = None) -> str:
    return "".join(
        f'<option value="{item.id}" {selected(current, item.id)}>{h(item.name)}</option>'
        for item in project.sections
    )


def tarahi_sections_panel(project: TarahiProject | None) -> str:
    if not project:
        return ""
    items = []
    for item in project.sections:
        preview_id = f"section-preview-{item.id}"
        images = "".join(
            f"""<article class="section-image">
              <img src="{h(admin_image_src(image.file_url))}" alt="{h(image.alt_text or item.name)}">
              <form method="post" onsubmit="return confirm('این تصویر حذف شود؟')">
                <input type="hidden" name="action" value="delete_image">
                <input type="hidden" name="project_type" value="tarahi">
                <input type="hidden" name="image_id" value="{image.id}">
                <button class="danger" aria-label="حذف تصویر"><span aria-hidden="true">🗑</span>&nbsp; حذف تصویر</button>
              </form>
            </article>"""
            for image in item.images
        )
        items.append(
            f"""<details class="compact taxonomy-item">
              <summary>{h(item.name)} <span class="muted">{len(item.images)} تصویر</span></summary>
              <div class="details-body">
              <form method="post" enctype="multipart/form-data">
                <input type="hidden" name="project_type" value="tarahi">
                <input type="hidden" name="project_id" value="{project.id}">
                <input type="hidden" name="section_id" value="{item.id}">
                <div class="form-grid">
                  <label>نام زیرگروه<input name="section_name" value="{h(item.name)}" required></label>
                  <label>شناسه<input name="section_slug" value="{h(item.slug)}"></label>
                  <label>ترتیب<input type="number" name="section_display_order" value="{item.display_order}"></label>
                  <label class="full">توضیحات (اختیاری)<textarea name="section_description">{h(item.description)}</textarea></label>
                  <label class="full upload-picker">＋ افزودن تصویر
                    <input type="file" name="section_images" accept="image/jpeg,image/png,image/webp" multiple onchange="previewAdminImages(this,'{preview_id}',false)">
                  </label>
                </div>
                <div id="{preview_id}" class="upload-preview"></div>
                <div class="actions" style="margin-top:10px">
                  <button name="action" value="save_section" class="secondary">ذخیره زیرگروه</button>
                  <button name="action" value="delete_section" class="danger" onclick="return confirm('این زیرگروه و تصاویر آن حذف شود؟')">حذف زیرگروه</button>
                </div>
              </form>
              <div class="section-images">{images or '<div class="empty">هنوز تصویری در این زیرگروه نیست.</div>'}</div>
              </div>
            </details>"""
        )
    return f"""<details class="compact" open>
      <summary>زیرگروه‌های پروژه <span class="muted">{len(project.sections)} مورد</span></summary>
      <div class="details-body">
        <p class="muted">برای نمونه: طراحی، سازه و برق. هر زیرگروه توضیحات اختیاری و چند تصویر مستقل دارد.</p>
        <form method="post" enctype="multipart/form-data">
          <input type="hidden" name="action" value="save_section">
          <input type="hidden" name="project_type" value="tarahi">
          <input type="hidden" name="project_id" value="{project.id}">
          <div class="form-grid">
            <label>نام زیرگروه<input name="section_name" placeholder="مثلاً سازه" required></label>
            <label>شناسه<input name="section_slug" placeholder="خودکار"></label>
            <label>ترتیب<input type="number" name="section_display_order" value="0"></label>
            <label class="full">توضیحات (اختیاری)<textarea name="section_description"></textarea></label>
            <label class="full upload-picker">＋ افزودن تصویر
              <input type="file" name="section_images" accept="image/jpeg,image/png,image/webp" multiple onchange="previewAdminImages(this,'new-section-preview',false)">
            </label>
          </div>
          <div id="new-section-preview" class="upload-preview"></div>
          <button style="margin-top:11px">ایجاد زیرگروه</button>
        </form>
        <div class="taxonomy section-manager" style="margin-top:13px">{''.join(items) or '<div class="empty">هنوز زیرگروهی برای این پروژه ساخته نشده است.</div>'}</div>
      </div>
    </details>"""


def project_form(section: str, project: Any | None, relations: list[Any]) -> str:
    config = PROJECT_CONFIG[section]
    relation_html = ""
    if config["relation_model"]:
        current = getattr(project, config["relation_field"], None) if project else None
        relation_html = f'<label>{config["relation_label"]}<select name="{config["relation_field"]}" required><option value="">انتخاب کنید</option>{relation_options(relations, current)}</select></label>'
    extra = f'<label>جهت یا موقعیت<input name="orientation" value="{h(project.orientation if project else "")}"></label>' if config["extra_field"] else ""
    title = f"ویرایش پروژه {h(project.name)}" if project else f"ایجاد پروژه {config['label']}"
    if section == "tarahi":
        cover = next((image for image in project.images if image.is_cover), None) if project else None
        cover_preview = (
            f'<img src="{h(admin_image_src(cover.file_url))}" alt="{h(project.name)}">'
            if cover else
            '<div class="cover-placeholder">بدون تصویر کاور</div>'
        )
        image_fields = f"""<div class="form-section">
          <div class="form-section-title">تصویر کاور پروژه</div>
          <div class="cover-editor">
            {cover_preview}
            <div>
              <label class="upload-picker">＋ انتخاب تصویر کاور
                <input type="file" name="cover_image" accept="image/jpeg,image/png,image/webp" onchange="previewAdminImages(this,'cover-preview',true)">
              </label>
              <div id="cover-preview" class="upload-preview"></div>
              <p class="muted">فقط یک تصویر ذخیره می‌شود؛ انتخاب تصویر جدید، کاور قبلی را جایگزین می‌کند.</p>
              {f'<input type="hidden" name="image_id" value="{cover.id}"><button type="submit" name="action" value="delete_image" class="danger" onclick="return confirm(\'تصویر کاور حذف شود؟\')"><span aria-hidden="true">🗑</span>&nbsp; حذف کاور</button>' if cover else ''}
            </div>
          </div>
        </div>"""
    else:
        image_fields = """<div class="form-section"><div class="form-section-title">تصاویر پروژه</div><div class="form-grid"><label class="span2">آپلود تصاویر جدید<input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple><span class="muted">چند تصویر را هم‌زمان انتخاب کنید.</span></label><label>متن جایگزین<input name="alt_text"></label><label class="span2">نام تصاویر موجود<textarea name="existing_image_names" placeholder="1.jpg&#10;2.jpg"></textarea><span class="muted">فقط نام فایل ذخیره می‌شود و فایل باید در مسیر تصاویر فرانت وجود داشته باشد.</span></label><label>عنوان تصویر<input name="caption"></label></div></div>"""
    images_panel = project_image_cards(section, project) if project and section != "tarahi" else ""
    sections_panel = tarahi_sections_panel(project) if section == "tarahi" else ""
    return f"""<div class="modal-shell"><section class="modal-card"><div class="modal-head"><h2 style="margin:0">{title}</h2><a class="button secondary" href="{ADMIN_PUBLIC_URL}/management?area=projects&type={section}">بستن</a></div><div class="modal-body"><form method="post" enctype="multipart/form-data" autocomplete="off"><input type="hidden" name="project_type" value="{section}">{f'<input type="hidden" name="project_id" value="{project.id}">' if project else ''}<div class="form-section"><div class="form-section-title">اطلاعات اصلی</div><div class="form-grid">{relation_html}<label>نام پروژه<input name="name" value="{h(project.name if project else '')}" required></label><label>شناسه URL<input name="slug" value="{h(project.slug if project else '')}" placeholder="خودکار از نام پروژه"></label><label>متراژ<input name="metraj" value="{h(project.metraj if project else '')}"></label><label>موقعیت<input name="location" value="{h(project.location if project else '')}"></label><label>وضعیت<select name="state"><option value="open" {selected(project.state if project else 'open','open')}>باز / در حال انجام</option><option value="closed" {selected(project.state if project else 'open','closed')}>بسته / پایان‌یافته</option></select></label><label>سال<input name="year" value="{h(project.year if project else '')}"></label>{extra}<label>ترتیب نمایش<input type="number" name="display_order" value="{h(project.display_order if project else 0)}"></label></div></div><div class="form-section"><div class="form-section-title">توضیحات</div><label>شرح پروژه<textarea name="description">{h(project.description if project else '')}</textarea></label></div>{image_fields}<div class="actions"><button type="submit" name="action" value="save_project">{'ذخیره تغییرات' if project else 'ایجاد پروژه'}</button><a class="button secondary" href="{ADMIN_PUBLIC_URL}/management?area=projects&type={section}">انصراف</a></div></form>{sections_panel}{images_panel}</div></section></div>"""


def project_image_cards(section: str, project: Any | None) -> str:
    if not project:
        return ""
    if not project.images:
        return '<details class="compact"><summary>تصاویر پروژه</summary><div class="details-body"><div class="empty" style="margin-top:13px">هنوز تصویری ثبت نشده است.</div></div></details>'
    cards = []
    for image in project.images:
        display_path = image.file_url.removeprefix("/images/") if image.file_url.startswith("/images/") else image.file_url
        section_field = f'<label>بخش طراحی<select name="section_id" required>{tarahi_section_options(project, image.section_id)}</select></label>' if section == "tarahi" else ""
        cards.append(f"""<article class="image-card"><img src="{h(admin_image_src(image.file_url))}" alt="{h(image.alt_text or project.name)}"><div class="image-body">{'<span class="badge">تصویر اصلی</span>' if image.is_cover else ''}<form method="post" enctype="multipart/form-data"><input type="hidden" name="action" value="update_image"><input type="hidden" name="project_type" value="{section}"><input type="hidden" name="image_id" value="{image.id}"><div class="form-grid">{section_field}<label class="full">نام فایل یا آدرس<input name="file_url" value="{h(display_path)}"></label><label>متن جایگزین<input name="alt_text" value="{h(image.alt_text)}"></label><label>عنوان<input name="caption" value="{h(image.caption)}"></label><label>ترتیب<input type="number" name="image_display_order" value="{image.display_order}"></label><label class="inline-check"><input type="checkbox" name="is_cover" {checked(image.is_cover)}> تصویر اصلی</label><label class="full">جایگزینی فایل<input type="file" name="replacement_image" accept="image/jpeg,image/png,image/webp"></label></div><div class="actions" style="margin-top:9px"><button class="secondary">ذخیره تصویر</button></div></form><form method="post" onsubmit="return confirm('این تصویر حذف شود؟')" style="margin-top:8px"><input type="hidden" name="action" value="delete_image"><input type="hidden" name="project_type" value="{section}"><input type="hidden" name="image_id" value="{image.id}"><button class="danger">حذف تصویر</button></form></div></article>""")
    return f'<details class="compact"><summary>تصاویر پروژه <span class="muted">{len(project.images)} تصویر</span></summary><div class="details-body"><div class="images">{"".join(cards)}</div></div></details>'


def relation_panel(section: str, relations: list[Any]) -> str:
    config = PROJECT_CONFIG[section]
    if not config["relation_model"]:
        return '<details class="compact"><summary>دسته‌بندی‌ها</summary><div class="details-body"><p class="muted">پروژه‌های اجرا دسته‌بندی ندارند.</p></div></details>'
    items = []
    for relation in relations:
        desc = getattr(relation, "description", "") or ""
        items.append(f"""<form method="post" class="taxonomy-item"><input type="hidden" name="project_type" value="{section}"><input type="hidden" name="relation_id" value="{relation.id}"><div class="taxonomy-fields"><label>نام<input name="relation_name" value="{h(relation.name)}" required></label><label>شناسه<input name="relation_slug" value="{h(relation.slug)}"></label><label>ترتیب<input type="number" name="relation_display_order" value="{relation.display_order}"></label><label class="inline-check"><input type="checkbox" name="relation_is_active" {checked(relation.is_active)}> فعال</label>{f'<label class="full">توضیح<textarea name="relation_description">{h(desc)}</textarea></label>' if section == 'tarahi' else ''}</div><div class="actions" style="margin-top:8px"><button name="action" value="save_relation" class="secondary">ذخیره</button><button name="action" value="delete_relation" class="danger" onclick="return confirm('این مورد حذف شود؟')">حذف</button></div></form>""")
    return f"""<details class="compact"><summary>مدیریت {config['relation_label']}‌ها <span class="muted">{len(relations)} مورد</span></summary><div class="details-body"><form method="post" style="margin-top:13px"><input type="hidden" name="action" value="save_relation"><input type="hidden" name="project_type" value="{section}"><div class="form-grid"><label>نام<input name="relation_name" required></label><label>شناسه<input name="relation_slug" placeholder="خودکار"></label><label>ترتیب<input type="number" name="relation_display_order" value="0"></label><label class="inline-check"><input type="checkbox" name="relation_is_active" checked> فعال</label>{'<label class="full">توضیح<textarea name="relation_description"></textarea></label>' if section == 'tarahi' else ''}</div><button style="margin-top:11px">افزودن {config['relation_label']}</button></form><div class="taxonomy" style="margin-top:13px">{''.join(items) or '<div class="empty">موردی ثبت نشده است.</div>'}</div></div></details>"""


def project_list(section: str, projects: list[Any]) -> str:
    if not projects:
        return '<div class="empty">پروژه‌ای ثبت نشده است.</div>'
    rows = []
    for project in projects:
        cover = next((img for img in project.images if img.is_cover), None)
        if cover is None and section != "tarahi" and project.images:
            cover = project.images[0]
        relation = f"{len(project.sections)} بخش طراحی" if section == "tarahi" else project.region.name if section == "nezarat" else "پروژه اجرا"
        cover_html = f'<img class="cover" src="{h(admin_image_src(cover.file_url))}" alt="{h(project.name)}">' if cover else '<div class="cover placeholder">بدون تصویر</div>'
        state_label = "باز" if project.state == "open" else "بسته"
        rows.append(f"""<article class="project">{cover_html}<div><h3>{h(project.name)}</h3><div class="meta">{h(relation)} · {h(project.location or '—')} · {h(project.metraj or '—')} · {state_label} · {len(project.images)} تصویر</div><div class="muted">{h((project.description or '')[:150])}</div></div><div class="actions"><a class="button secondary" href="{ADMIN_PUBLIC_URL}/management?area=projects&type={section}&edit={project.id}">ویرایش</a><form method="post" onsubmit="return confirm('پروژه و تصاویر آن حذف شود؟')"><input type="hidden" name="action" value="delete_project"><input type="hidden" name="project_type" value="{section}"><input type="hidden" name="project_id" value="{project.id}"><button class="danger">حذف</button></form></div></article>""")
    return "".join(rows)


def nezarat_table_panel(workbook: NezaratTableWorkbook | None) -> str:
    if workbook:
        sheets = loads_sheets(workbook.sheets_json)
        sheet_items = "".join(
            f'<span class="pill">{h(sheet.get("name", "Sheet"))} · {len(sheet.get("rows", []))} ردیف · {len(sheet.get("columns", []))} ستون</span>'
            for sheet in sheets
        )
        current = f"""<div class="excel-current"><div><strong>{h(workbook.source_filename)}</strong><div class="muted" style="margin-top:5px">آخرین بروزرسانی: {h(workbook.updated_at)}</div></div><div class="excel-sheets">{sheet_items}</div><form method="post" onsubmit="return confirm('جدول اکسل حذف شود؟')"><input type="hidden" name="action" value="delete_table_workbook"><input type="hidden" name="project_type" value="nezarat"><button class="danger">حذف جدول</button></form></div>"""
    else:
        current = '<div class="empty">هنوز فایل اکسل برای جدول پروژه‌های نظارت بارگذاری نشده است.</div>'

    return f"""<details class="compact" open><summary>جدول اکسل پروژه‌های نظارت</summary><div class="details-body"><p class="muted">هر شیت فایل به‌صورت یک تب مستقل در صفحه نظارت نمایش داده می‌شود. ردیف اول هر شیت عنوان ستون‌ها است و بارگذاری جدید، جدول فعلی را جایگزین می‌کند.</p>{current}<form method="post" enctype="multipart/form-data" class="excel-upload-form"><input type="hidden" name="action" value="upload_table_workbook"><input type="hidden" name="project_type" value="nezarat"><label>فایل Excel<input type="file" name="excel_file" accept=".xlsx,.xlsm,.xltx,.xltm" required></label><button>بارگذاری و جایگزینی جدول</button></form></div></details>"""


def render_projects(request: Request, section: str) -> HTMLResponse:
    config = PROJECT_CONFIG[section]
    with SessionLocal() as db:
        relations = list(db.scalars(select(config["relation_model"]).order_by(config["relation_model"].display_order, config["relation_model"].name))) if config["relation_model"] else []
        edit_project = None
        if request.query_params.get("edit"):
            try:
                edit_project = load_project(db, section, UUID(request.query_params["edit"]))
            except ValueError:
                edit_project = None
        options = [selectinload(config["model"].images)]
        if section == "tarahi": options.append(selectinload(TarahiProject.sections).selectinload(TarahiProjectSection.images))
        if section == "nezarat": options.append(selectinload(NezaratProject.region))
        projects = list(db.scalars(select(config["model"]).options(*options).order_by(config["model"].display_order, config["model"].created_at.desc())).unique())
        workbook = db.scalar(
            select(NezaratTableWorkbook)
            .where(NezaratTableWorkbook.is_active.is_(True))
            .order_by(NezaratTableWorkbook.updated_at.desc())
        ) if section == "nezarat" else None
        show_form = request.query_params.get("new") == "1" or edit_project is not None
        header = f'<div class="page-head"><div><h1>مدیریت پروژه‌های {config["label"]}</h1><div class="muted">{len(projects)} پروژه ثبت شده</div></div><a class="button" href="{ADMIN_PUBLIC_URL}/management?area=projects&type={section}&new=1">پروژه جدید</a></div>'
        listing = f'<section class="card"><h2>فهرست پروژه‌ها</h2>{project_list(section, projects)}</section>'
        side = f'{relation_panel(section, relations) if config["relation_model"] else ""}{nezarat_table_panel(workbook) if section == "nezarat" else ""}'
        content = f'<div class="layout"><div>{listing}</div><aside>{side}</aside></div>' if side else listing
        body = f"""{notices(request)}{project_tabs(section)}{header}{content}{project_form(section, edit_project, relations) if show_form else ''}"""
        return layout(f"پروژه‌های {config['label']}", body, "projects", section)


def render_users(request: Request) -> HTMLResponse:
    with SessionLocal() as db:
        edit_user = None
        if request.query_params.get("edit"):
            try: edit_user = db.get(User, UUID(request.query_params["edit"]))
            except ValueError: pass
        users = list(db.scalars(select(User).order_by(User.created_at.desc())))
        rows = "".join(f"""<tr><td>{h(u.full_name)}</td><td>{h(u.email)}</td><td>{h(u.phone)}</td><td>{'مدیر' if u.role == 'admin' else 'کاربر'}</td><td>{'فعال' if u.is_active else 'غیرفعال'}</td><td><div class="actions"><a class="button secondary" href="{ADMIN_PUBLIC_URL}/management?area=users&edit={u.id}">ویرایش</a><form method="post" onsubmit="return confirm('این کاربر حذف شود؟')"><input type="hidden" name="action" value="delete_user"><input type="hidden" name="user_id" value="{u.id}"><button class="danger">حذف</button></form></div></td></tr>""" for u in users) or '<tr><td colspan="6">کاربری ثبت نشده است.</td></tr>'
        form = f"""<details class="compact" {'open' if edit_user else ''}><summary>{'ویرایش کاربر' if edit_user else 'ایجاد کاربر جدید'}</summary><div class="details-body"><form method="post" style="margin-top:13px"><input type="hidden" name="action" value="save_user">{f'<input type="hidden" name="user_id" value="{edit_user.id}">' if edit_user else ''}<div class="form-grid"><label>نام کامل<input name="full_name" value="{h(edit_user.full_name if edit_user else '')}" required></label><label>ایمیل<input type="email" name="email" value="{h(edit_user.email if edit_user else '')}" required></label><label>تلفن<input name="phone" value="{h(edit_user.phone if edit_user else '')}"></label><label>رمز عبور<input type="password" name="password" {'placeholder="برای حفظ رمز خالی بگذارید"' if edit_user else 'required'}></label><label>نقش<select name="role"><option value="user" {selected(edit_user.role if edit_user else 'user','user')}>کاربر</option><option value="admin" {selected(edit_user.role if edit_user else 'user','admin')}>مدیر</option></select></label><label class="inline-check"><input type="checkbox" name="is_active" {checked(edit_user.is_active if edit_user else True)}> فعال</label></div><div class="actions" style="margin-top:13px"><button>{'ذخیره' if edit_user else 'ایجاد کاربر'}</button>{f'<a class="button secondary" href="{ADMIN_PUBLIC_URL}/management?area=users">لغو</a>' if edit_user else ''}</div></form></div></details>"""
        body = f"""{notices(request)}<div class="page-head"><div><h1>مدیریت کاربران</h1><div class="muted">{len(users)} کاربر</div></div></div>{form}<section class="card"><div class="table-wrap"><table><thead><tr><th>نام</th><th>ایمیل</th><th>تلفن</th><th>نقش</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{rows}</tbody></table></div></section>"""
        return layout("کاربران", body, "users")


def render_messages(request: Request, view: str) -> HTMLResponse:
    with SessionLocal() as db:
        users = list(db.scalars(select(User).where(User.is_active.is_(True)).order_by(User.full_name)))
        received = list(db.scalars(select(ContactMessage).order_by(ContactMessage.created_at.desc())))
        sent = list(db.scalars(select(OutboundMessage).options(selectinload(OutboundMessage.created_by), selectinload(OutboundMessage.recipients).selectinload(OutboundMessageRecipient.user)).order_by(OutboundMessage.created_at.desc())).unique())
        tabs = '<nav class="tabs">' + ''.join(f'<a class="{"active" if view == key else ""}" href="{ADMIN_PUBLIC_URL}/management?area=messages&message_view={key}">{label}</a>' for key,label in (("received","دریافتی"),
        # ("sent","ارسالی"),("compose","ارسال پیام")
        )) + '</nav>'
        if view == "compose":
            options = ''.join(f'<option value="{u.id}">{h(u.full_name)} — {h(u.email)} — {h(u.phone)}</option>' for u in users)
            content = f"""<section class="card" style="max-width:900px"><h1>ارسال پیام</h1><p class="muted">ارسال واقعی ایمیل یا پیامک بعداً به سرویس‌دهنده متصل می‌شود.</p><form method="post"><input type="hidden" name="action" value="send_message"><div class="form-grid"><label class="full">گیرندگان<select name="recipient_ids" multiple required>{options}</select></label><label>کانال<select name="channel"><option value="email">ایمیل</option><option value="phone">تلفن / پیامک</option></select></label><label>موضوع<input name="subject" required></label><label class="full">متن پیام<textarea name="message_body" required></textarea></label></div><button style="margin-top:14px">ثبت پیام</button></form></section>"""
        elif view == "sent":
            cards = ''.join(f"""<article class="message"><div class="message-head"><strong>{h(m.subject)}</strong><span class="pill">{h(m.channel)} · {h(m.status)}</span></div><div class="meta">از: {h(m.created_by.email)} · به: {h(', '.join((r.user.email or r.user.phone or r.user.full_name) for r in m.recipients))} · {h(m.created_at)}</div><div class="message-body">{h(m.body)}</div><form method="post" onsubmit="return confirm('این پیام حذف شود؟')" style="margin-top:10px"><input type="hidden" name="action" value="delete_sent_message"><input type="hidden" name="message_id" value="{m.id}"><button class="danger">حذف</button></form></article>""" for m in sent) or '<div class="empty">پیام ارسالی وجود ندارد.</div>'
            content = f'<section class="card"><h1>پیام‌های ارسالی</h1>{cards}</section>'
        else:
            cards = ''.join(f"""<article class="message"><div class="message-head"><strong>{h(m.subject)}</strong><span class="pill">{h(m.status)}</span></div><div class="meta">از: {h(m.name)} · {h(m.email)} · کاربر: {h(m.user_id or 'مهمان')} · {h(m.created_at)}</div><div class="message-body">{h(m.message)}</div><form method="post" onsubmit="return confirm('این پیام حذف شود؟')" style="margin-top:10px"><input type="hidden" name="action" value="delete_received_message"><input type="hidden" name="message_id" value="{m.id}"><button class="danger">حذف</button></form></article>""" for m in received) or '<div class="empty">پیام دریافتی وجود ندارد.</div>'
            content = f'<section class="card"><h1>پیام‌های دریافتی</h1>{cards}</section>'
        return layout("پیام‌ها", f"{notices(request)}{tabs}{content}", "messages")


async def handle_projects_post(request: Request, form: FormData, section: str) -> RedirectResponse:
    config = PROJECT_CONFIG[section]
    action = str(form.get("action") or "")
    edit_id = None
    try:
        with SessionLocal() as db:
            if action == "save_project":
                raw_id = str(form.get("project_id") or "").strip()
                project = load_project(db, section, UUID(raw_id)) if raw_id else config["model"]()
                if project is None: raise ValueError("Project not found.")
                values = project_values(form, config, project if raw_id else None)
                if config["relation_model"] and not db.get(config["relation_model"], values[config["relation_field"]]):
                    raise ValueError(f"{config['relation_label']} not found.")
                for key,value in values.items(): setattr(project,key,value)
                if not raw_id: db.add(project)
                db.flush()
                upload_count = 0
                name_count = 0
                if section == "tarahi":
                    cover_uploads = image_uploads(form, "cover_image")
                    if cover_uploads:
                        replace_tarahi_cover(db, project, cover_uploads[0])
                        upload_count = 1
                else:
                    uploads = image_uploads(form)
                    existing_names = str(form.get("existing_image_names") or "")
                    upload_count = add_uploaded_images(
                        db, section, project, config["image_model"], uploads,
                        str(form.get("alt_text") or "").strip() or None,
                        str(form.get("caption") or "").strip() or None,
                    )
                    name_count = add_named_images(
                        db, project, config["image_model"], existing_names,
                        str(form.get("alt_text") or "").strip() or None,
                        str(form.get("caption") or "").strip() or None,
                    )
                db.commit()
                return notice_url(area="projects", project_type=section, success=f"Project saved. {upload_count + name_count} image(s) added.", edit=project.id)
            if action == "delete_project":
                project = load_project(db, section, UUID(str(form.get("project_id") or "")))
                if not project: raise ValueError("Project not found.")
                delete_project(db, project)
                return notice_url(area="projects", project_type=section, success="Project deleted.")
            if action == "update_image":
                edit_id = update_project_image(db, config, form)
                return notice_url(area="projects", project_type=section, success="Image updated.", edit=edit_id)
            if action == "delete_image":
                edit_id = delete_project_image(db, config, UUID(str(form.get("image_id") or "")))
                return notice_url(area="projects", project_type=section, success="Image deleted.", edit=edit_id)
            if action in {"save_section", "delete_section"}:
                if section != "tarahi":
                    raise ValueError("بخش‌های طراحی فقط برای پروژه‌های طراحی هستند.")
                project = db.get(TarahiProject, UUID(str(form.get("project_id") or "")))
                if not project:
                    raise ValueError("پروژه پیدا نشد.")
                edit_id = project.id
                raw_section_id = str(form.get("section_id") or "").strip()
                item = db.get(TarahiProjectSection, UUID(raw_section_id)) if raw_section_id else TarahiProjectSection(project_id=project.id)
                if not item or item.project_id != project.id:
                    raise ValueError("بخش طراحی پیدا نشد.")
                if action == "delete_section":
                    urls = [image.file_url for image in item.images]
                    db.delete(item)
                    db.commit()
                    for url in urls:
                        remove_media_file(url)
                    return notice_url(area="projects", project_type=section, success="بخش طراحی حذف شد.", edit=project.id)
                name = str(form.get("section_name") or "").strip()
                if not name:
                    raise ValueError("نام بخش طراحی الزامی است.")
                item.name = name
                item.slug = clean_slug(str(form.get("section_slug") or name), "section")[:80]
                item.description = str(form.get("section_description") or "").strip() or None
                item.display_order = int_from_form(form, "section_display_order")
                if not raw_section_id:
                    db.add(item)
                db.flush()
                uploads = image_uploads(form, "section_images")
                upload_count = add_uploaded_images(
                    db,
                    "tarahi",
                    project,
                    TarahiProjectImage,
                    uploads,
                    item.name,
                    None,
                    item.id,
                    allow_cover=False,
                )
                db.commit()
                return notice_url(area="projects", project_type=section, success=f"زیرگروه ذخیره شد. {upload_count} تصویر افزوده شد.", edit=project.id)
            if action == "upload_table_workbook":
                if section != "nezarat":
                    raise ValueError("جدول اکسل فقط برای پروژه‌های نظارت است.")
                upload = form.get("excel_file")
                if not isinstance(upload, UploadFile) or not upload.filename:
                    raise ValueError("فایل اکسل را انتخاب کنید.")
                sheets = parse_excel_upload(upload)
                workbook = db.scalar(
                    select(NezaratTableWorkbook)
                    .where(NezaratTableWorkbook.is_active.is_(True))
                    .order_by(NezaratTableWorkbook.updated_at.desc())
                )
                if not workbook:
                    workbook = NezaratTableWorkbook()
                    db.add(workbook)
                workbook.source_filename = Path(upload.filename).name
                workbook.sheets_json = dumps_sheets(sheets)
                workbook.is_active = True
                db.commit()
                return notice_url(area="projects", project_type=section, success=f"فایل اکسل با {len(sheets)} شیت ذخیره شد.")
            if action == "delete_table_workbook":
                if section != "nezarat":
                    raise ValueError("جدول اکسل فقط برای پروژه‌های نظارت است.")
                workbooks = list(db.scalars(select(NezaratTableWorkbook).where(NezaratTableWorkbook.is_active.is_(True))))
                for workbook in workbooks:
                    db.delete(workbook)
                db.commit()
                return notice_url(area="projects", project_type=section, success="جدول اکسل حذف شد.")
            if action == "save_table_row":
                if section != "nezarat":
                    raise ValueError("Table rows belong to Nezarat.")
                raw_id = str(form.get("row_id") or "").strip()
                row = db.get(NezaratTableRow, UUID(raw_id)) if raw_id else NezaratTableRow()
                if not row:
                    raise ValueError("Table row not found.")
                status = str(form.get("table_status") or "live")
                if status not in {"live", "ended"}:
                    raise ValueError("Invalid table status.")
                row.table_status = status
                row.region = str(form.get("region") or "").strip() or None
                row.metraj = str(form.get("metraj") or "").strip() or None
                row.allowed_floors = str(form.get("allowed_floors") or "").strip() or None
                row.project_stage = str(form.get("project_stage") or "").strip() or None
                row.year = str(form.get("table_year") or "").strip() or None
                row.address = str(form.get("address") or "").strip() or None
                row.referral_date = parse_iso_date(str(form.get("referral_date") or "").strip())
                row.description = str(form.get("table_description") or "").strip() or None
                row.display_order = int_from_form(form, "table_display_order")
                row.is_published = bool_from_form(form, "is_published")
                if not raw_id:
                    db.add(row)
                db.commit()
                return notice_url(area="projects", project_type=section, success="Nezarat table row saved.")
            if action == "delete_table_row":
                if section != "nezarat":
                    raise ValueError("Table rows belong to Nezarat.")
                row = db.get(NezaratTableRow, UUID(str(form.get("row_id") or "")))
                if not row:
                    raise ValueError("Table row not found.")
                db.delete(row)
                db.commit()
                return notice_url(area="projects", project_type=section, success="Nezarat table row deleted.")
            if action in {"save_relation", "delete_relation"}:
                model = config["relation_model"]
                if not model: raise ValueError("This project type has no categories.")
                raw_id = str(form.get("relation_id") or "").strip()
                relation = db.get(model, UUID(raw_id)) if raw_id else model()
                if not relation: raise ValueError("Category or region not found.")
                if action == "delete_relation":
                    if relation.projects: raise ValueError("Move or delete its projects first.")
                    db.delete(relation); db.commit()
                    return notice_url(area="projects", project_type=section, success="Category/region deleted.")
                name = str(form.get("relation_name") or "").strip()
                if not name: raise ValueError("Name is required.")
                relation.name = name
                relation.slug = clean_slug(str(form.get("relation_slug") or name), section)
                relation.display_order = int_from_form(form, "relation_display_order")
                relation.is_active = bool_from_form(form, "relation_is_active")
                if section == "tarahi": relation.description = str(form.get("relation_description") or "").strip() or None
                if not raw_id: db.add(relation)
                db.commit()
                return notice_url(area="projects", project_type=section, success="Category/region saved.")
            raise ValueError("Unknown action.")
    except Exception as exc:
        return notice_url(area="projects", project_type=section, error=error_text(exc), edit=edit_id)


async def handle_users_post(request: Request, form: FormData) -> RedirectResponse:
    action = str(form.get("action") or "")
    try:
        with SessionLocal() as db:
            if action == "save_user":
                raw_id = str(form.get("user_id") or "").strip()
                user = db.get(User, UUID(raw_id)) if raw_id else User()
                if not user: raise ValueError("User not found.")
                email = str(form.get("email") or "").strip().lower()
                name = str(form.get("full_name") or "").strip()
                password = str(form.get("password") or "")
                if not name or not email: raise ValueError("Name and email are required.")
                duplicate = db.scalar(select(User).where(User.email == email, User.id != user.id)) if raw_id else db.scalar(select(User).where(User.email == email))
                if duplicate: raise ValueError("Email already exists.")
                phone = str(form.get("phone") or "").strip() or None
                phone_duplicate = db.scalar(select(User).where(User.phone == phone, User.id != user.id)) if raw_id and phone else db.scalar(select(User).where(User.phone == phone)) if phone else None
                if phone_duplicate: raise ValueError("Phone number already exists.")
                if not raw_id and len(password) < 8: raise ValueError("Password must be at least 8 characters.")
                user.full_name=name; user.email=email; user.phone=phone; user.role=str(form.get("role") or "user"); user.is_active=bool_from_form(form,"is_active")
                if password:
                    if len(password) < 8: raise ValueError("Password must be at least 8 characters.")
                    user.password_hash=hash_password(password)
                if not raw_id: db.add(user)
                db.commit()
                return notice_url(area="users", success="User saved.")
            if action == "delete_user":
                user_id = UUID(str(form.get("user_id") or ""))
                if user_id == current_admin_id(request): raise ValueError("You cannot delete your own account.")
                user = db.get(User,user_id)
                if not user: raise ValueError("User not found.")
                db.delete(user); db.commit()
                return notice_url(area="users", success="User deleted.")
            raise ValueError("Unknown action.")
    except Exception as exc:
        return notice_url(area="users", error=error_text(exc))


async def handle_messages_post(request: Request, form: FormData, view: str) -> RedirectResponse:
    action = str(form.get("action") or "")
    try:
        with SessionLocal() as db:
            if action == "send_message":
                recipient_ids = list(dict.fromkeys(UUID(str(value)) for value in form.getlist("recipient_ids")))
                if not recipient_ids: raise ValueError("Select at least one user.")
                users = list(db.scalars(select(User).where(User.id.in_(recipient_ids), User.is_active.is_(True))))
                if len(users) != len(recipient_ids): raise ValueError("One or more recipients are invalid.")
                channel = str(form.get("channel") or "email")
                if channel not in {"email","phone"}: raise ValueError("Invalid channel.")
                subject = str(form.get("subject") or "").strip(); body = str(form.get("message_body") or "").strip()
                if not subject or not body: raise ValueError("Subject and message are required.")
                item = OutboundMessage(created_by_id=current_admin_id(request), subject=subject, body=body, channel=channel, status="queued")
                db.add(item); db.flush()
                for user in users: db.add(OutboundMessageRecipient(message_id=item.id,user_id=user.id,delivery_status="pending"))
                db.commit()
                return notice_url(area="messages", message_view="sent", success="Message queued.")
            if action == "delete_sent_message":
                item=db.get(OutboundMessage,UUID(str(form.get("message_id") or "")))
                if not item: raise ValueError("Message not found.")
                db.delete(item); db.commit()
                return notice_url(area="messages", message_view="sent", success="Sent message deleted.")
            if action == "delete_received_message":
                item=db.get(ContactMessage,UUID(str(form.get("message_id") or "")))
                if not item: raise ValueError("Message not found.")
                db.delete(item); db.commit()
                return notice_url(area="messages", message_view="received", success="Received message deleted.")
            raise ValueError("Unknown action.")
    except Exception as exc:
        return notice_url(area="messages", message_view=view, error=error_text(exc))


class ManagementAdmin(BaseView):
    name = "Management"
    icon = "fa-solid fa-sliders"

    @expose("/management", methods=["GET", "POST"])
    async def management(self, request: Request):
        area = request.query_params.get("area", "projects")
        section = request.query_params.get("type", "tarahi")
        view = request.query_params.get("message_view", "received")
        if section not in PROJECT_CONFIG: section = "tarahi"
        if view not in {"received","sent","compose"}: view = "received"
        if request.method == "POST":
            form = await request.form()
            if area == "users": return await handle_users_post(request, form)
            if area == "messages": return await handle_messages_post(request, form, view)
            post_section = str(form.get("project_type") or section)
            if post_section not in PROJECT_CONFIG: post_section = "tarahi"
            return await handle_projects_post(request, form, post_section)
        if area == "users": return render_users(request)
        if area == "messages": return render_messages(request, view)
        return render_projects(request, section)


def setup_admin(app: FastAPI) -> Admin:
    admin = MetaAdmin(
        app,
        engine,
        title="Meta Holding Management",
        base_url=ADMIN_BASE_URL,
        authentication_backend=AdminAuthentication(settings.secret_key),
        debug=settings.environment != "production",
    )
    configure_admin_template_urls(admin)
    admin.add_view(ManagementAdmin)
    return admin
