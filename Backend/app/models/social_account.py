from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.database import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform = Column(String, nullable=False)
    account_name = Column(String, nullable=False)
    access_token = Column(String, nullable=False)