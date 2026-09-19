"""update Nezarat map regions

Revision ID: 9ad7c6e0a4b2
Revises: f6d2a91c4e07
Create Date: 2026-09-19
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "9ad7c6e0a4b2"
down_revision: Union[str, None] = "f6d2a91c4e07"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    now_sql = "CURRENT_TIMESTAMP"

    bind.execute(
        sa.text(
            "UPDATE nezarat_regions "
            "SET name = :name, updated_at = " + now_sql + " "
            "WHERE slug = :slug"
        ),
        {"slug": "karaj", "name": "سایر مناطق تهران"},
    )

    exists = bind.execute(
        sa.text("SELECT 1 FROM nezarat_regions WHERE slug = :slug"),
        {"slug": "shemshak"},
    ).first()
    if not exists:
        bind.execute(
            sa.text(
                "INSERT INTO nezarat_regions "
                "(id, slug, name, display_order, is_active, created_at, updated_at) "
                "VALUES (:id, :slug, :name, :display_order, :is_active, "
                + now_sql
                + ", "
                + now_sql
                + ")"
            ),
            {
                "id": "9ad7c6e0-a4b2-4f2b-9127-138970059001",
                "slug": "shemshak",
                "name": "شمشک",
                "display_order": 23,
                "is_active": True,
            },
        )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text("UPDATE nezarat_regions SET name = :name WHERE slug = :slug"),
        {"slug": "karaj", "name": "کرج"},
    )
    bind.execute(sa.text("DELETE FROM nezarat_regions WHERE slug = :slug"), {"slug": "shemshak"})
