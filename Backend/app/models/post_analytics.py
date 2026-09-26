from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from app.database.database import Base


class PostAnalytics(Base):
    __tablename__ = "post_analytics"

    analytics_id = Column(Integer, primary_key=True, index=True)

    post_id = Column(
        Integer,
        ForeignKey("posts.post_id"),
        nullable=False
    )

    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)

    reach = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)

    engagement_rate = Column(Float, default=0.0)

    recorded_at = Column(DateTime, nullable=True)