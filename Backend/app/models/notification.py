
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from app.database.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    link = Column(String(500), nullable=True)

    created_at = Column(DateTime, nullable=False)
