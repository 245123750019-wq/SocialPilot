from pydantic import BaseModel
from datetime import date
from typing import Optional


class CampaignCreate(BaseModel):
    campaign_name: str
    description: Optional[str] = None
    status: str = "draft"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float = 0
    revenue: float = 0


class CampaignUpdate(BaseModel):
    campaign_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    revenue: Optional[float] = None


class CampaignResponse(BaseModel):
    campaign_id: int
    user_id: Optional[int] = None
    campaign_name: str
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float
    revenue: float
    roi_percentage: float

    class Config:
        from_attributes = True