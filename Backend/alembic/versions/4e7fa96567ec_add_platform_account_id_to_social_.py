
"""add platform account id to social accounts

Revision ID: 4e7fa96567ec
Revises: 5dfd1e56ebb9
"""

from alembic import op
import sqlalchemy as sa

revision = "4e7fa96567ec"
down_revision = "5dfd1e56ebb9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "social_accounts",
        sa.Column("platform_account_id", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("social_accounts", "platform_account_id")
