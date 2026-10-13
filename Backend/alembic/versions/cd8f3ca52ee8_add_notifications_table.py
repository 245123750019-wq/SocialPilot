
"""add notifications table

Revision ID: cd8f3ca52ee8
Revises: a6fe24930239
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "cd8f3ca52ee8"
down_revision: Union[str, Sequence[str], None] = "a6fe24930239"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("notification_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("notification_type", sa.String(length=50), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column("link", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.user_id"],
            ondelete="CASCADE",
        ),
    )

    op.create_index(
        "ix_notifications_notification_id",
        "notifications",
        ["notification_id"],
        unique=False,
    )
    op.create_index(
        "ix_notifications_user_id",
        "notifications",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_index("ix_notifications_notification_id", table_name="notifications")
    op.drop_table("notifications")
