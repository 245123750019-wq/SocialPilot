from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from app.database.database import Base


class AudienceAnalytics(Base):
    __tablename__ = "audience_analytics"

    analytics_id = Column(Integer, primary_key=True, index=True)

    account_id = Column(
        Integer,
        ForeignKey("social_accounts.account_id"),
        nullable=False
    )

    followers_count = Column(Integer, nullable=False, default=0)

    follower_growth = Column(Integer, nullable=False, default=0)

    recorded_at = Column(DateTime, nullable=True)


class AudienceInsight(Base):
    __tablename__ = "audience_insights"

    insight_id = Column(Integer, primary_key=True, index=True)

    account_id = Column(Integer, nullable=False)

    age_group = Column(String(50), nullable=True)

    gender = Column(String(50), nullable=True)

    location = Column(String(100), nullable=True)

    active_time = Column(String(50), nullable=True)

    audience_count = Column(Integer, default=0)

    recorded_at = Column(DateTime, nullable=True)