from pydantic import BaseModel


class SocialAccountCreate(BaseModel):
    platform: str
    username: str
    access_token: str | None = None


class SocialAccountResponse(BaseModel):
    account_id: int
    platform: str
    username: str

    class Config:
        from_attributes = True
