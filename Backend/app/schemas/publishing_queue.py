from pydantic import BaseModel


class PublishingQueueResponse(BaseModel):
    queue_id: int
    post_id: int
    platform: str
    scheduled_time: str
    status: str
    priority: int
    retry_count: int
    content: str


class QueueStatusUpdate(BaseModel):
    status: str