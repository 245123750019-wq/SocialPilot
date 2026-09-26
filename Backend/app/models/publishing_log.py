from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.database.database import Base


class PublishingLog(Base):
    __tablename__ = "publishing_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    queue_id = Column(
        Integer,
        ForeignKey("publishing_queue.queue_id"),
        nullable=True
    )
    post_id = Column(
        Integer,
        ForeignKey("posts.post_id"),
        nullable=True
    )
    platform = Column(String(50), nullable=False)
    status = Column(String(20), nullable=True)
    published_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, nullable=True)