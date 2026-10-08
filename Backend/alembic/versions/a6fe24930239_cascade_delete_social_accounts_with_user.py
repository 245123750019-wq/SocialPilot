"""cascade delete social accounts with user

Revision ID: a6fe24930239
Revises: 499e02ab31e7
Create Date: 2026-10-08 10:15:05.386917

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a6fe24930239'
down_revision: Union[str, Sequence[str], None] = '499e02ab31e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
