import json
import uuid
from datetime import date, datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

SLUG_PATTERN = r"^[^\s/\\?#]+$"


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserOut(ORMModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr | None = None
    phone: str | None = None
    avatar_url: str | None = None
    role: str
    is_active: bool


class AdminUserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=160)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: str | None = Field(default=None, pattern="^(admin|user)$")
    is_active: bool | None = None


class RegisterIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr | None = None
    phone: str = Field(min_length=1, max_length=32)
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    phone: str = Field(min_length=1, max_length=32)
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class LogoutIn(RefreshIn):
    pass


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=160)
    phone: str | None = Field(default=None, max_length=32)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class TaxonomyBase(BaseModel):
    slug: str = Field(min_length=1, max_length=80, pattern=SLUG_PATTERN)
    name: str = Field(min_length=1, max_length=120)
    display_order: int = 0
    is_active: bool = True


class NezaratRegionCreate(TaxonomyBase):
    pass


class NezaratRegionUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=80, pattern=SLUG_PATTERN)
    name: str | None = Field(default=None, min_length=1, max_length=120)
    display_order: int | None = None
    is_active: bool | None = None


class NezaratRegionOut(NezaratRegionCreate, ORMModel):
    id: uuid.UUID


class ProjectImageOut(ORMModel):
    id: uuid.UUID
    section_id: uuid.UUID | None = None
    file_url: str
    alt_text: str | None = None
    caption: str | None = None
    display_order: int
    is_cover: bool


class ProjectImageUpdate(BaseModel):
    file_name: str | None = Field(default=None, min_length=1, max_length=255)
    alt_text: str | None = Field(default=None, max_length=255)
    caption: str | None = Field(default=None, max_length=500)
    display_order: int | None = None
    is_cover: bool | None = None


class TarahiProjectSectionCreate(BaseModel):
    slug: str = Field(min_length=1, max_length=80, pattern=SLUG_PATTERN)
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    display_order: int = 0


class TarahiProjectSectionUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=80, pattern=SLUG_PATTERN)
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    display_order: int | None = None


class TarahiProjectSectionOut(TarahiProjectSectionCreate, ORMModel):
    id: uuid.UUID
    project_id: uuid.UUID
    images: list[ProjectImageOut] = Field(default_factory=list)


class ProjectFields(BaseModel):
    slug: str = Field(min_length=1, max_length=180, pattern=SLUG_PATTERN)
    name: str = Field(min_length=1, max_length=255)
    metraj: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=255)
    description: str = ""
    state: str = Field(default="open", pattern="^(open|closed)$")
    year: str | None = Field(default=None, max_length=20)
    display_order: int = 0


class ProjectUpdateFields(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=180, pattern=SLUG_PATTERN)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    metraj: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=255)
    description: str | None = None
    state: str | None = Field(default=None, pattern="^(open|closed)$")
    year: str | None = Field(default=None, max_length=20)
    display_order: int | None = None


class TarahiProjectCreate(ProjectFields):
    pass


class TarahiProjectUpdate(ProjectUpdateFields):
    pass


class TarahiProjectOut(ProjectFields, ORMModel):
    id: uuid.UUID
    sections: list[TarahiProjectSectionOut] = Field(default_factory=list)
    images: list[ProjectImageOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class NezaratProjectCreate(ProjectFields):
    region_id: uuid.UUID
    orientation: str | None = Field(default=None, max_length=120)


class NezaratProjectUpdate(ProjectUpdateFields):
    region_id: uuid.UUID | None = None
    orientation: str | None = Field(default=None, max_length=120)


class NezaratProjectOut(ProjectFields, ORMModel):
    id: uuid.UUID
    region_id: uuid.UUID
    region: NezaratRegionOut
    orientation: str | None = None
    images: list[ProjectImageOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class EjraProjectCreate(ProjectFields):
    pass


class EjraProjectUpdate(ProjectUpdateFields):
    pass


class EjraProjectOut(ProjectFields, ORMModel):
    id: uuid.UUID
    images: list[ProjectImageOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class NezaratTableRowBase(BaseModel):
    table_status: str = Field(pattern="^(live|ended)$")
    region: str | None = Field(default=None, max_length=80)
    metraj: str | None = Field(default=None, max_length=120)
    allowed_floors: str | None = Field(default=None, max_length=80)
    project_stage: str | None = Field(default=None, max_length=120)
    year: str | None = Field(default=None, max_length=20)
    address: str | None = None
    referral_date: date | None = None
    description: str | None = None
    display_order: int = 0
    is_published: bool = True


class NezaratTableRowCreate(NezaratTableRowBase):
    pass


class NezaratTableRowUpdate(BaseModel):
    table_status: str | None = Field(default=None, pattern="^(live|ended)$")
    region: str | None = Field(default=None, max_length=80)
    metraj: str | None = Field(default=None, max_length=120)
    allowed_floors: str | None = Field(default=None, max_length=80)
    project_stage: str | None = Field(default=None, max_length=120)
    year: str | None = Field(default=None, max_length=20)
    address: str | None = None
    referral_date: date | None = None
    description: str | None = None
    display_order: int | None = None
    is_published: bool | None = None


class NezaratTableRowOut(NezaratTableRowBase, ORMModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class NezaratWorkbookSheet(BaseModel):
    name: str
    columns: list[str] = Field(default_factory=list)
    rows: list[list[Any]] = Field(default_factory=list)


class NezaratWorkbookOut(BaseModel):
    id: uuid.UUID | None = None
    source_filename: str | None = None
    sheets: list[NezaratWorkbookSheet] = Field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PageContentIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: dict = Field(default_factory=dict)
    is_published: bool = True


class PageContentOut(BaseModel):
    id: uuid.UUID
    key: str
    title: str
    content: dict
    is_published: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm_item(cls, item):
        try:
            content = json.loads(item.content_json or "{}")
        except json.JSONDecodeError:
            content = {}
        return cls(id=item.id, key=item.key, title=item.title, content=content, is_published=item.is_published, created_at=item.created_at, updated_at=item.updated_at)


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    subject: str = Field(min_length=2, max_length=255)
    message: str = Field(min_length=5, max_length=10000)


class ContactUpdate(BaseModel):
    status: str | None = Field(default=None, pattern="^(new|reviewing|answered|closed)$")
    admin_reply: str | None = None


class ContactOut(ContactCreate, ORMModel):
    id: uuid.UUID
    user_id: uuid.UUID | None = None
    status: str
    admin_reply: str | None = None
    created_at: datetime
    updated_at: datetime


class AdminUserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="user", pattern="^(admin|user)$")
    is_active: bool = True


class ProjectImageReferenceCreate(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    section_id: uuid.UUID | None = None
    alt_text: str | None = Field(default=None, max_length=255)
    caption: str | None = Field(default=None, max_length=500)
    display_order: int = 0
    is_cover: bool = False


class OutboundMessageCreate(BaseModel):
    subject: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1)
    channel: str = Field(pattern="^(email|phone)$")
    user_ids: list[uuid.UUID] = Field(min_length=1)


class OutboundRecipientOut(ORMModel):
    id: uuid.UUID
    user_id: uuid.UUID
    delivery_status: str
    user: UserOut


class OutboundMessageOut(ORMModel):
    id: uuid.UUID
    created_by_id: uuid.UUID
    subject: str
    body: str
    channel: str
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: UserOut
    recipients: list[OutboundRecipientOut] = Field(default_factory=list)
