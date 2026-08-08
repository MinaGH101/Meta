"""separate Tarahi covers and add section descriptions

Revision ID: b8e21d742c19
Revises: a1f4c82d91b7
Create Date: 2026-07-27
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8e21d742c19"
down_revision: Union[str, None] = "a1f4c82d91b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    section_columns = {column["name"] for column in inspector.get_columns("tarahi_project_sections")}
    if "description" not in section_columns:
        op.add_column("tarahi_project_sections", sa.Column("description", sa.Text(), nullable=True))

    with op.batch_alter_table("tarahi_project_images") as batch_op:
        batch_op.alter_column("section_id", existing_type=sa.Uuid(), nullable=True)

    # Preserve the current visible project cover while separating it from the
    # subgroup albums. All remaining images stay in their migrated subgroup.
    op.execute(
        sa.text(
            "UPDATE tarahi_project_images "
            "SET section_id = NULL "
            "WHERE is_cover = TRUE"
        )
    )


def downgrade() -> None:
    # Put covers into the first available subgroup before restoring NOT NULL.
    op.execute(
        sa.text(
            "UPDATE tarahi_project_images AS image "
            "SET section_id = ("
            "  SELECT section.id FROM tarahi_project_sections AS section "
            "  WHERE section.project_id = image.project_id "
            "  ORDER BY section.display_order, section.created_at LIMIT 1"
            ") WHERE image.section_id IS NULL"
        )
    )
    with op.batch_alter_table("tarahi_project_images") as batch_op:
        batch_op.alter_column("section_id", existing_type=sa.Uuid(), nullable=False)
    op.drop_column("tarahi_project_sections", "description")
