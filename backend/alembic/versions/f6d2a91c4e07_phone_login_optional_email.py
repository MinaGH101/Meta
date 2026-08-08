"""phone login and optional registration email

Revision ID: f6d2a91c4e07
Revises: b8e21d742c19
Create Date: 2026-08-07
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "f6d2a91c4e07"
down_revision: Union[str, None] = "b8e21d742c19"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())


def _has_index(table: str, name: str) -> bool:
    return any(index["name"] == name for index in _inspector().get_indexes(table))


def upgrade() -> None:
    if op.get_bind().dialect.name == "sqlite":
        with op.batch_alter_table("users") as batch_op:
            batch_op.alter_column("email", existing_type=sa.String(length=255), nullable=True)
    else:
        op.alter_column("users", "email", existing_type=sa.String(length=255), nullable=True)
    if not _has_index("users", "ix_users_phone"):
        op.create_index("ix_users_phone", "users", ["phone"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    missing_email = bind.execute(sa.text("SELECT COUNT(*) FROM users WHERE email IS NULL")).scalar_one()
    if missing_email:
        raise RuntimeError("Cannot downgrade while users without email exist")
    if _has_index("users", "ix_users_phone"):
        op.drop_index("ix_users_phone", table_name="users")
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("users") as batch_op:
            batch_op.alter_column("email", existing_type=sa.String(length=255), nullable=False)
    else:
        op.alter_column("users", "email", existing_type=sa.String(length=255), nullable=False)
