"""add user id to posts

Revision ID: d8793dc99966
Revises: 9f994307e21e
Create Date: 2026-10-05 21:47:17.100266

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d8793dc99966"
down_revision: Union[str, Sequence[str], None] = "9f994307e21e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add user_id column to posts table."""
    op.add_column(
        "posts",
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=True
        )
    )


def downgrade() -> None:
    """Remove user_id column from posts table."""
    op.drop_column("posts", "user_id")
