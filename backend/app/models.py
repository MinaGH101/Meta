import uuid
from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def uuid4() -> uuid.UUID:
    return uuid.uuid4()


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class User(Base, TimestampMixin):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user", index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    refresh_sessions: Mapped[list["RefreshSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    def __str__(self) -> str:
        return self.email or self.phone or self.full_name


class RefreshSession(Base):
    __tablename__ = "refresh_sessions"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user: Mapped[User] = relationship(back_populates="refresh_sessions")


class NezaratRegion(Base, TimestampMixin):
    __tablename__ = "nezarat_regions"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    projects: Mapped[list["NezaratProject"]] = relationship(back_populates="region")

    def __str__(self) -> str:
        return self.name


class TarahiProject(Base, TimestampMixin):
    __tablename__ = "tarahi_projects"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    metraj: Mapped[str | None] = mapped_column(String(120))
    location: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    state: Mapped[str] = mapped_column(String(20), default="open", index=True, nullable=False)
    year: Mapped[str | None] = mapped_column(String(20))
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sections: Mapped[list["TarahiProjectSection"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="TarahiProjectSection.display_order",
    )
    images: Mapped[list["TarahiProjectImage"]] = relationship(back_populates="project", cascade="all, delete-orphan", order_by="TarahiProjectImage.display_order")

    def __str__(self) -> str:
        return self.name


class TarahiProjectSection(Base, TimestampMixin):
    __tablename__ = "tarahi_project_sections"
    __table_args__ = (UniqueConstraint("project_id", "slug", name="uq_tarahi_project_section_slug"),)
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tarahi_projects.id", ondelete="CASCADE"), index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(80), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    project: Mapped[TarahiProject] = relationship(back_populates="sections")
    images: Mapped[list["TarahiProjectImage"]] = relationship(
        back_populates="section",
        cascade="all, delete-orphan",
        order_by="TarahiProjectImage.display_order",
    )

    def __str__(self) -> str:
        return self.name


class NezaratProject(Base, TimestampMixin):
    __tablename__ = "nezarat_projects"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    region_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("nezarat_regions.id", ondelete="RESTRICT"), index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    metraj: Mapped[str | None] = mapped_column(String(120))
    location: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    state: Mapped[str] = mapped_column(String(20), default="open", index=True, nullable=False)
    year: Mapped[str | None] = mapped_column(String(20))
    orientation: Mapped[str | None] = mapped_column(String(120))
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    region: Mapped[NezaratRegion] = relationship(back_populates="projects")
    images: Mapped[list["NezaratProjectImage"]] = relationship(back_populates="project", cascade="all, delete-orphan", order_by="NezaratProjectImage.display_order")

    def __str__(self) -> str:
        return self.name


class EjraProject(Base, TimestampMixin):
    __tablename__ = "ejra_projects"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    metraj: Mapped[str | None] = mapped_column(String(120))
    location: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    state: Mapped[str] = mapped_column(String(20), default="open", index=True, nullable=False)
    year: Mapped[str | None] = mapped_column(String(20))
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    images: Mapped[list["EjraProjectImage"]] = relationship(back_populates="project", cascade="all, delete-orphan", order_by="EjraProjectImage.display_order")

    def __str__(self) -> str:
        return self.name


class TarahiProjectImage(Base, TimestampMixin):
    __tablename__ = "tarahi_project_images"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tarahi_projects.id", ondelete="CASCADE"), index=True)
    # A null section identifies the single project cover. Album images belong
    # to a section and are never used as the project cover.
    section_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tarahi_project_sections.id", ondelete="CASCADE"), index=True)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(255))
    caption: Mapped[str | None] = mapped_column(String(500))
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    project: Mapped[TarahiProject] = relationship(back_populates="images")
    section: Mapped[TarahiProjectSection | None] = relationship(back_populates="images")


class NezaratProjectImage(Base, TimestampMixin):
    __tablename__ = "nezarat_project_images"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("nezarat_projects.id", ondelete="CASCADE"), index=True)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(255))
    caption: Mapped[str | None] = mapped_column(String(500))
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    project: Mapped[NezaratProject] = relationship(back_populates="images")


class EjraProjectImage(Base, TimestampMixin):
    __tablename__ = "ejra_project_images"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ejra_projects.id", ondelete="CASCADE"), index=True)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(255))
    caption: Mapped[str | None] = mapped_column(String(500))
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    project: Mapped[EjraProject] = relationship(back_populates="images")


class NezaratTableRow(Base, TimestampMixin):
    __tablename__ = "nezarat_table_rows"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    table_status: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # live | ended
    region: Mapped[str | None] = mapped_column(String(80))
    metraj: Mapped[str | None] = mapped_column(String(120))
    allowed_floors: Mapped[str | None] = mapped_column(String(80))
    project_stage: Mapped[str | None] = mapped_column(String(120))
    year: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(Text)
    referral_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class NezaratTableWorkbook(Base, TimestampMixin):
    __tablename__ = "nezarat_table_workbooks"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    source_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    sheets_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)


class PageContent(Base, TimestampMixin):
    __tablename__ = "page_contents"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ContactMessage(Base, TimestampMixin):
    __tablename__ = "contact_messages"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="new", index=True, nullable=False)
    admin_reply: Mapped[str | None] = mapped_column(Text)


class OutboundMessage(Base, TimestampMixin):
    __tablename__ = "outbound_messages"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)  # email | phone
    status: Mapped[str] = mapped_column(String(20), default="queued", index=True, nullable=False)
    created_by: Mapped[User] = relationship(foreign_keys=[created_by_id])
    recipients: Mapped[list["OutboundMessageRecipient"]] = relationship(
        back_populates="message", cascade="all, delete-orphan", order_by="OutboundMessageRecipient.created_at"
    )


class OutboundMessageRecipient(Base):
    __tablename__ = "outbound_message_recipients"
    __table_args__ = (UniqueConstraint("message_id", "user_id", name="uq_outbound_message_recipient"),)
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid4)
    message_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("outbound_messages.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    delivery_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    message: Mapped[OutboundMessage] = relationship(back_populates="recipients")
    user: Mapped[User] = relationship()
