from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.social_account import SocialAccount
from app.schemas.social_account import (
    SocialAccountCreate,
    SocialAccountResponse
)
from app.core.security import get_current_user_id


router = APIRouter(
    prefix="/social-accounts",
    tags=["Social Accounts"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=SocialAccountResponse)
def connect_social_account(
    account_data: SocialAccountCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    new_account = SocialAccount(
        user_id=user_id,
        platform=account_data.platform,
        username=account_data.username,
        access_token=account_data.access_token
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return new_account


@router.get("/", response_model=list[SocialAccountResponse])
def get_social_accounts(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    accounts = (
        db.query(SocialAccount)
        .filter(SocialAccount.user_id == user_id)
        .all()
    )

    return accounts


@router.get("/{account_id}", response_model=SocialAccountResponse)
def get_social_account(
    account_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.account_id == account_id,
            SocialAccount.user_id == user_id
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Social account not found"
        )

    return account


@router.delete("/{account_id}")
def disconnect_social_account(
    account_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.account_id == account_id,
            SocialAccount.user_id == user_id
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Social account not found"
        )

    db.delete(account)
    db.commit()

    return {
        "message": "Social account disconnected successfully"
    }