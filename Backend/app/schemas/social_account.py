from pydantic import BaseModel


class SocialAccountCreate(BaseModel):
    platform: str
    account_name: str
    access_token: str


class SocialAccountResponse(BaseModel):
    id: int
    platform: str
    account_name: str

    class Config:
        from_attributes = True
