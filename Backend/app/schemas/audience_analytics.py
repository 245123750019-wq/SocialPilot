from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AudienceAnalyticsCreate(BaseModel):
    followers_count: int = Field(default=0, ge=0)
    follower_growth: int = 0


class AudienceAnalyticsResponse(BaseModel):
    analytics_id: int
    account_id: int
    followers_count: int
    follower_growth: int
    recorded_at: Optional[datetime] = None

    class Config:
        from_attributes = True
class AudienceInsightCreate(BaseModel):
    age_group: Optional[str] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    active_time: Optional[str] = None
    audience_count: int = Field(default=0, ge=0)


class AudienceInsightResponse(BaseModel):
    insight_id: int
    account_id: int
    age_group: Optional[str] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    active_time: Optional[str] = None
    audience_count: int
    recorded_at: Optional[datetime] = None

    class Config:
        from_attributes = True