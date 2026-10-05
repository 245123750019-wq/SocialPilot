"""merge migration heads

Revision ID: 9f994307e21e
Revises: 570eff2603a0, add_post_analytics
Create Date: 2026-10-05 21:46:52.256876

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f994307e21e'
down_revision: Union[str, Sequence[str], None] = ('570eff2603a0', 'add_post_analytics')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
