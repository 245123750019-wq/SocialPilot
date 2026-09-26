from pydantic import BaseModel


class ScheduledPostResponse(BaseModel):
    id: int
    date: str
    time: str
    content: str
    platforms: list[str]
    status: str