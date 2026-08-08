"""split project models

Revision ID: c7b0f6a2d103
Revises: f343dadf985d
Create Date: 2026-07-19

This migration is intentionally defensive. Earlier development builds called
Base.metadata.create_all() before Alembic completed, so some existing volumes
already contain the target tables while alembic_version is still on the prior
revision. Every operation below is safe for both a fresh database and those
partially initialized development volumes.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c7b0f6a2d103"
down_revision: Union[str, None] = "f343dadf985d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return _inspector().has_table(name)


def _has_column(table: str, column: str) -> bool:
    if not _has_table(table):
        return False
    return any(item["name"] == column for item in _inspector().get_columns(table))


def timestamps():
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    ]


def project_columns():
    return [
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("metraj", sa.String(length=120), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("state", sa.String(length=20), nullable=False),
        sa.Column("year", sa.String(length=20), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        *timestamps(),
        sa.PrimaryKeyConstraint("id"),
    ]


def image_columns(project_table: str):
    return [
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("file_url", sa.String(length=500), nullable=False),
        sa.Column("alt_text", sa.String(length=255), nullable=True),
        sa.Column("caption", sa.String(length=500), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("is_cover", sa.Boolean(), nullable=False),
        *timestamps(),
        sa.ForeignKeyConstraint(["project_id"], [f"{project_table}.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    ]


def upgrade() -> None:
    # Remove the obsolete generic schema only when it exists.
    for table in ("project_images", "projects", "categories", "supervision_rows"):
        if _has_table(table):
            op.drop_table(table)

    # Convert page content JSON to the current text-backed API representation.
    # SQLite needs Alembic batch mode for ALTER/DROP COLUMN, while PostgreSQL
    # can apply those operations directly.
    if _has_table("page_contents"):
        dialect = op.get_bind().dialect.name
        had_content = _has_column("page_contents", "content")
        added_content_json = not _has_column("page_contents", "content_json")

        if added_content_json:
            op.add_column("page_contents", sa.Column("content_json", sa.Text(), nullable=True))
            if had_content:
                if dialect == "postgresql":
                    op.execute("UPDATE page_contents SET content_json = content::text WHERE content_json IS NULL")
                else:
                    op.execute("UPDATE page_contents SET content_json = CAST(content AS TEXT) WHERE content_json IS NULL")
            else:
                op.execute("UPDATE page_contents SET content_json = '{}' WHERE content_json IS NULL")

        if added_content_json or had_content:
            if dialect == "sqlite":
                with op.batch_alter_table("page_contents") as batch_op:
                    if added_content_json:
                        batch_op.alter_column(
                            "content_json",
                            existing_type=sa.Text(),
                            nullable=False,
                            server_default=sa.text("'{}'"),
                        )
                    if had_content:
                        batch_op.drop_column("content")
            else:
                if added_content_json:
                    op.alter_column(
                        "page_contents",
                        "content_json",
                        existing_type=sa.Text(),
                        nullable=False,
                        server_default=sa.text("'{}'"),
                    )
                if had_content:
                    op.drop_column("page_contents", "content")

    if not _has_table("tarahi_categories"):
        op.create_table(
            "tarahi_categories",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("slug", sa.String(length=80), nullable=False),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("display_order", sa.Integer(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            *timestamps(),
            sa.PrimaryKeyConstraint("id"),
        )
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_tarahi_categories_slug ON tarahi_categories (slug)")

    if not _has_table("nezarat_regions"):
        op.create_table(
            "nezarat_regions",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("slug", sa.String(length=80), nullable=False),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column("display_order", sa.Integer(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            *timestamps(),
            sa.PrimaryKeyConstraint("id"),
        )
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_nezarat_regions_slug ON nezarat_regions (slug)")

    if not _has_table("tarahi_projects"):
        columns = project_columns()
        columns.insert(1, sa.Column("category_id", sa.Uuid(), nullable=False))
        columns.insert(-1, sa.ForeignKeyConstraint(["category_id"], ["tarahi_categories.id"], ondelete="RESTRICT"))
        op.create_table("tarahi_projects", *columns)
    op.execute("CREATE INDEX IF NOT EXISTS ix_tarahi_projects_category_id ON tarahi_projects (category_id)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_tarahi_projects_slug ON tarahi_projects (slug)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tarahi_projects_state ON tarahi_projects (state)")

    if not _has_table("nezarat_projects"):
        columns = project_columns()
        columns.insert(1, sa.Column("region_id", sa.Uuid(), nullable=False))
        columns.insert(8, sa.Column("orientation", sa.String(length=120), nullable=True))
        columns.insert(-1, sa.ForeignKeyConstraint(["region_id"], ["nezarat_regions.id"], ondelete="RESTRICT"))
        op.create_table("nezarat_projects", *columns)
    op.execute("CREATE INDEX IF NOT EXISTS ix_nezarat_projects_region_id ON nezarat_projects (region_id)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_nezarat_projects_slug ON nezarat_projects (slug)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_nezarat_projects_state ON nezarat_projects (state)")

    if not _has_table("ejra_projects"):
        op.create_table("ejra_projects", *project_columns())
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_ejra_projects_slug ON ejra_projects (slug)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_ejra_projects_state ON ejra_projects (state)")

    image_specs = (
        ("tarahi_project_images", "tarahi_projects"),
        ("nezarat_project_images", "nezarat_projects"),
        ("ejra_project_images", "ejra_projects"),
    )
    for table, project_table in image_specs:
        if not _has_table(table):
            op.create_table(table, *image_columns(project_table))
        op.execute(f"CREATE INDEX IF NOT EXISTS ix_{table}_project_id ON {table} (project_id)")

    if not _has_table("nezarat_table_rows"):
        op.create_table(
            "nezarat_table_rows",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("table_status", sa.String(length=20), nullable=False),
            sa.Column("region", sa.String(length=80), nullable=True),
            sa.Column("metraj", sa.String(length=120), nullable=True),
            sa.Column("allowed_floors", sa.String(length=80), nullable=True),
            sa.Column("project_stage", sa.String(length=120), nullable=True),
            sa.Column("year", sa.String(length=20), nullable=True),
            sa.Column("address", sa.Text(), nullable=True),
            sa.Column("referral_date", sa.Date(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("display_order", sa.Integer(), nullable=False),
            sa.Column("is_published", sa.Boolean(), nullable=False),
            *timestamps(),
            sa.PrimaryKeyConstraint("id"),
        )
    op.execute("CREATE INDEX IF NOT EXISTS ix_nezarat_table_rows_table_status ON nezarat_table_rows (table_status)")


def downgrade() -> None:
    for table in (
        "nezarat_table_rows",
        "ejra_project_images",
        "nezarat_project_images",
        "tarahi_project_images",
        "ejra_projects",
        "nezarat_projects",
        "tarahi_projects",
        "nezarat_regions",
        "tarahi_categories",
    ):
        if _has_table(table):
            op.drop_table(table)
    if _has_table("page_contents") and not _has_column("page_contents", "content"):
        op.add_column("page_contents", sa.Column("content", sa.JSON(), nullable=True))
        if _has_column("page_contents", "content_json"):
            if op.get_bind().dialect.name == "postgresql":
                op.execute("UPDATE page_contents SET content = content_json::json")
            else:
                op.execute("UPDATE page_contents SET content = content_json")
            op.alter_column("page_contents", "content", nullable=False)
            op.drop_column("page_contents", "content_json")
