from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.database.database import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    account_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=True)
    platform = Column(String(50), nullable=False)
    username = Column(String(100), nullable=False)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=True)