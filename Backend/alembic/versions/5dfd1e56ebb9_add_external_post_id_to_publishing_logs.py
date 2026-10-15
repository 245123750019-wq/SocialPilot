"""add external post id to publishing logs

Revision ID: 5dfd1e56ebb9
Revises: cd8f3ca52ee8
Create Date: 2026-10-15 14:14:45.063122

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5dfd1e56ebb9'
down_revision: Union[str, Sequence[str], None] = 'cd8f3ca52ee8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    op.add_column(
        "publishing_logs",
        sa.Column("external_post_id", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("publishing_logs", "external_post_id")
