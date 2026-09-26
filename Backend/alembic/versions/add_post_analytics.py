"""add post analytics table"""

from alembic import op
import sqlalchemy as sa


revision = "add_post_analytics"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "post_analytics",
        sa.Column("analytics_id", sa.Integer(), primary_key=True),
        sa.Column(
            "post_id",
            sa.Integer(),
            sa.ForeignKey("posts.post_id"),
            nullable=False
        ),
        sa.Column("likes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comments", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("shares", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reach", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("impressions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("clicks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "engagement_rate",
            sa.Float(),
            nullable=False,
            server_default="0"
        ),
        sa.Column("recorded_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("post_analytics")