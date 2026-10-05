from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from app.database.database import Base


class Post(Base):
    __tablename__ = "posts"

    post_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
    Integer,
    ForeignKey("users.user_id"),
    nullable=True
)

    # Campaign relationship will be connected later.
    # The shared database allows this column to be NULL.
    campaign_id = Column(Integer, nullable=True)

    account_id = Column(
        Integer,
        ForeignKey("social_accounts.account_id"),
        nullable=True
    )

    content = Column(Text, nullable=False)
    media_url = Column(Text, nullable=True)
    scheduled_time = Column(DateTime, nullable=True)
    status = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=True)
    post_type = Column(Text, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)