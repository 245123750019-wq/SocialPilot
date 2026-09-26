from sqlalchemy import Column, Integer, DateTime, Text, ForeignKey
from app.database.database import Base


class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    schedule_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(
        Integer,
        ForeignKey("posts.post_id"),
        nullable=True
    )
    scheduled_at = Column(DateTime, nullable=False)
    published_at = Column(DateTime, nullable=True)
    status = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)