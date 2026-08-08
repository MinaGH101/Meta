"""add uploaded Nezarat Excel workbook

Revision ID: e5c1b8f9a401
Revises: d9a72f130a20
Create Date: 2026-07-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e5c1b8f9a401"
down_revision: Union[str, None] = "d9a72f130a20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(name)


def upgrade() -> None:
    if not _has_table("nezarat_table_workbooks"):
        op.create_table(
            "nezarat_table_workbooks",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("source_filename", sa.String(length=255), nullable=False),
            sa.Column("sheets_json", sa.Text(), nullable=False, server_default=sa.text("'[]'")),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
    op.execute("CREATE INDEX IF NOT EXISTS ix_nezarat_table_workbooks_is_active ON nezarat_table_workbooks (is_active)")


def downgrade() -> None:
    if _has_table("nezarat_table_workbooks"):
        op.drop_table("nezarat_table_workbooks")
