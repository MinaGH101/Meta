"""replace global Tarahi categories with project sections

Revision ID: a1f4c82d91b7
Revises: e5c1b8f9a401
Create Date: 2026-07-27
"""

from typing import Sequence, Union
from uuid import uuid4

from alembic import op
import sqlalchemy as sa


revision: str = "a1f4c82d91b7"
down_revision: Union[str, None] = "e5c1b8f9a401"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(name)


def _has_column(table: str, column: str) -> bool:
    return _has_table(table) and any(
        item["name"] == column for item in sa.inspect(op.get_bind()).get_columns(table)
    )


def upgrade() -> None:
    if not _has_table("tarahi_project_sections"):
        op.create_table(
            "tarahi_project_sections",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("project_id", sa.Uuid(), nullable=False),
            sa.Column("slug", sa.String(length=80), nullable=False),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.ForeignKeyConstraint(["project_id"], ["tarahi_projects.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("project_id", "slug", name="uq_tarahi_project_section_slug"),
        )
        op.create_index(
            "ix_tarahi_project_sections_project_id",
            "tarahi_project_sections",
            ["project_id"],
        )

    if not _has_column("tarahi_project_images", "section_id"):
        op.add_column(
            "tarahi_project_images",
            sa.Column("section_id", sa.Uuid(), nullable=True),
        )

    bind = op.get_bind()
    sections = sa.table(
        "tarahi_project_sections",
        sa.column("id", sa.Uuid()),
        sa.column("project_id", sa.Uuid()),
        sa.column("slug", sa.String()),
        sa.column("name", sa.String()),
        sa.column("display_order", sa.Integer()),
    )
    images = sa.table(
        "tarahi_project_images",
        sa.column("project_id", sa.Uuid()),
        sa.column("section_id", sa.Uuid()),
    )

    category_lookup: dict[object, tuple[str, str]] = {}
    if _has_table("tarahi_categories"):
        for row in bind.execute(sa.text("SELECT id, slug, name FROM tarahi_categories")).mappings():
            category_lookup[row["id"]] = (row["slug"], row["name"])

    category_column = _has_column("tarahi_projects", "category_id")
    project_sql = "SELECT id, category_id FROM tarahi_projects" if category_column else "SELECT id FROM tarahi_projects"
    for order, row in enumerate(bind.execute(sa.text(project_sql)).mappings()):
        category = category_lookup.get(row.get("category_id"))
        slug, name = category if category else ("design", "طراحی")
        section_id = uuid4()
        bind.execute(
            sections.insert().values(
                id=section_id,
                project_id=row["id"],
                slug=slug,
                name=name,
                display_order=order,
            )
        )
        bind.execute(
            images.update()
            .where(images.c.project_id == row["id"])
            .values(section_id=section_id)
        )

    with op.batch_alter_table("tarahi_project_images") as batch_op:
        batch_op.alter_column("section_id", existing_type=sa.Uuid(), nullable=False)
        batch_op.create_foreign_key(
            "fk_tarahi_project_images_section_id",
            "tarahi_project_sections",
            ["section_id"],
            ["id"],
            ondelete="CASCADE",
        )
        batch_op.create_index(
            "ix_tarahi_project_images_section_id",
            ["section_id"],
        )

    if category_column:
        inspector = sa.inspect(bind)
        for foreign_key in inspector.get_foreign_keys("tarahi_projects"):
            if foreign_key.get("constrained_columns") == ["category_id"] and foreign_key.get("name"):
                op.drop_constraint(foreign_key["name"], "tarahi_projects", type_="foreignkey")
        op.execute("DROP INDEX IF EXISTS ix_tarahi_projects_category_id")
        with op.batch_alter_table("tarahi_projects") as batch_op:
            batch_op.drop_column("category_id")

    if _has_table("tarahi_categories"):
        op.drop_table("tarahi_categories")


def downgrade() -> None:
    if not _has_table("tarahi_categories"):
        op.create_table(
            "tarahi_categories",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("slug", sa.String(length=80), nullable=False),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_tarahi_categories_slug", "tarahi_categories", ["slug"], unique=True)

    category_id = uuid4()
    categories = sa.table(
        "tarahi_categories",
        sa.column("id", sa.Uuid()),
        sa.column("slug", sa.String()),
        sa.column("name", sa.String()),
        sa.column("description", sa.Text()),
        sa.column("display_order", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
    )
    op.get_bind().execute(
        categories.insert().values(
            id=category_id,
            slug="design",
            name="طراحی",
            description=None,
            display_order=0,
            is_active=True,
        )
    )

    with op.batch_alter_table("tarahi_projects") as batch_op:
        batch_op.add_column(sa.Column("category_id", sa.Uuid(), nullable=True))
    op.execute(
        sa.text("UPDATE tarahi_projects SET category_id = :category_id").bindparams(
            category_id=category_id
        )
    )
    with op.batch_alter_table("tarahi_projects") as batch_op:
        batch_op.alter_column("category_id", existing_type=sa.Uuid(), nullable=False)
        batch_op.create_foreign_key(
            "fk_tarahi_projects_category_id",
            "tarahi_categories",
            ["category_id"],
            ["id"],
            ondelete="RESTRICT",
        )
        batch_op.create_index("ix_tarahi_projects_category_id", ["category_id"])

    with op.batch_alter_table("tarahi_project_images") as batch_op:
        batch_op.drop_index("ix_tarahi_project_images_section_id")
        batch_op.drop_constraint("fk_tarahi_project_images_section_id", type_="foreignkey")
        batch_op.drop_column("section_id")

    op.drop_table("tarahi_project_sections")
