from typing import Literal
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):

    name: str

    email: EmailStr

    password: str

    role: Literal["user", "admin"] = "user"

    admin_code: str | None = None


class LoginRequest(BaseModel):

    email: EmailStr

    password: str