
from pydantic import BaseModel


class PublishingLogResponse(BaseModel):
    log_id: int
    post_id: int
    queue_id: int | None
    platform: str
    status: str
    published_at: str | None
    error_message: str | None
    retry_count: int
    content: str
    media_url: str | None = None
    post_type: str | None = None
    account_id: int | None = None
    username: str | None = None
    external_post_id: str | None = None
