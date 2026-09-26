from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database.database import Base


class PublishingQueue(Base):
    __tablename__ = "publishing_queue"

    queue_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    post_id = Column(
        Integer,
        ForeignKey("posts.post_id"),
        nullable=True
    )

    platform = Column(
        String(50),
        nullable=False
    )

    scheduled_time = Column(
        DateTime,
        nullable=False
    )

    status = Column(
        String(20),
        nullable=True
    )

    priority = Column(
        Integer,
        nullable=True
    )

    retry_count = Column(
        Integer,
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=True
    )