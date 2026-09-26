from pydantic import BaseModel
from typing import Literal


class PostCreate(BaseModel):
    content: str
    platforms: list[str]
    scheduled_at: str
    status: str = "scheduled"

    schedule_type: Literal["once", "recurring"] = "once"
    recurring_frequency: str | None = None
    end_date: str | None = None
    post_type: str = "Text"
    media_url: str | None = None
    campaign_id: int | None = None


class DraftCreate(BaseModel):
    content: str
    post_type: str = "Text"


class PostResponse(BaseModel):
    message: str
    post_ids: list[int]