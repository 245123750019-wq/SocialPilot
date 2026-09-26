from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PostAnalyticsCreate(BaseModel):
    likes: int = Field(default=0, ge=0)
    comments: int = Field(default=0, ge=0)
    shares: int = Field(default=0, ge=0)
    reach: int = Field(default=0, ge=0)
    impressions: int = Field(default=0, ge=0)
    clicks: int = Field(default=0, ge=0)


class PostAnalyticsResponse(BaseModel):
    analytics_id: int
    post_id: int
    likes: int
    comments: int
    shares: int
    reach: int
    impressions: int
    clicks: int
    engagement_rate: float
    recorded_at: Optional[datetime] = None

    class Config:
        from_attributes = True