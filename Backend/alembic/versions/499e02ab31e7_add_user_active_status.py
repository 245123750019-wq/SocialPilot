"""add user active status

Revision ID: 499e02ab31e7
Revises: d8793dc99966
Create Date: 2026-10-06 17:46:55.097143

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "499e02ab31e7"
down_revision: Union[str, Sequence[str], None] = "d8793dc99966"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add active status to users."""

    op.add_column(
        "users",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true()
        )
    )

    op.alter_column(
        "users",
        "is_active",
        server_default=None
    )


def downgrade() -> None:
    """Remove active status from users."""

    op.drop_column(
        "users",
        "is_active"
    )
