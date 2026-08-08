"""admin users and outbound messages

Revision ID: d9a72f130a20
Revises: c7b0f6a2d103
Create Date: 2026-07-19
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d9a72f130a20"
down_revision: Union[str, None] = "c7b0f6a2d103"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(name)


def upgrade() -> None:
    if not _has_table("outbound_messages"):
        op.create_table(
            "outbound_messages",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("created_by_id", sa.Uuid(), nullable=False),
            sa.Column("subject", sa.String(length=255), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("channel", sa.String(length=20), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
            sa.PrimaryKeyConstraint("id"),
        )
    op.execute("CREATE INDEX IF NOT EXISTS ix_outbound_messages_created_by_id ON outbound_messages (created_by_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_outbound_messages_status ON outbound_messages (status)")

    if not _has_table("outbound_message_recipients"):
        op.create_table(
            "outbound_message_recipients",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("message_id", sa.Uuid(), nullable=False),
            sa.Column("user_id", sa.Uuid(), nullable=False),
            sa.Column("delivery_status", sa.String(length=20), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.ForeignKeyConstraint(["message_id"], ["outbound_messages.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("message_id", "user_id", name="uq_outbound_message_recipient"),
        )
    op.execute("CREATE INDEX IF NOT EXISTS ix_outbound_message_recipients_message_id ON outbound_message_recipients (message_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_outbound_message_recipients_user_id ON outbound_message_recipients (user_id)")


def downgrade() -> None:
    if _has_table("outbound_message_recipients"):
        op.drop_table("outbound_message_recipients")
    if _has_table("outbound_messages"):
        op.drop_table("outbound_messages")
