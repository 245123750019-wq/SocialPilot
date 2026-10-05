from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext



SECRET_KEY = "socialpilot-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user_id(
    token: str = Depends(oauth2_scheme)
) -> int:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise credentials_exception

        return int(user_id)

    except (jwt.JWTError, ValueError):
        raise credentials_exception
from app.models.user import User
from app.database.database import SessionLocal


def require_role(required_role: str):

    def role_checker(
        user_id: int = Depends(get_current_user_id)
    ):
        db = SessionLocal()

        try:
            user = db.query(User).filter(
                User.user_id == user_id
            ).first()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            if user.role != required_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )

            return user

        finally:
            db.close()

    return role_checker
def create_oauth_state(
    user_id: int,
    code_verifier: str,
    purpose: str = "youtube_oauth"
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=10)

    payload = {
        "user_id": user_id,
        "purpose": purpose,
        "code_verifier": code_verifier,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_oauth_data_from_state(
    state: str,
    expected_purpose: str = "youtube_oauth"
) -> dict:
    try:
        payload = jwt.decode(
            state,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        if payload.get("purpose") != expected_purpose:
            raise ValueError("Invalid OAuth state")

        user_id = payload.get("user_id")
        code_verifier = payload.get("code_verifier")

        if user_id is None or code_verifier is None:
            raise ValueError("Missing OAuth data")

        return {
            "user_id": int(user_id),
            "code_verifier": code_verifier
        }

    except (jwt.JWTError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OAuth state"
        )