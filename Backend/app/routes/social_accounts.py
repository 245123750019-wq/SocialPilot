import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from googleapiclient.discovery import build

from app.database.database import SessionLocal
from app.models.social_account import SocialAccount
from app.schemas.social_account import (
    SocialAccountCreate,
    SocialAccountResponse
)
from app.core.security import (
    get_current_user_id,
    create_oauth_state,
    get_oauth_data_from_state
)
from app.services.youtube_oauth import create_youtube_flow


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
@router.get("/youtube/connect")
def connect_youtube(
    user_id: int = Depends(get_current_user_id)
):
    flow = create_youtube_flow()

    oauth_state = create_oauth_state(
        user_id=user_id,
        code_verifier=flow.code_verifier
    )

    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=oauth_state
    )

    return {
        "authorization_url": authorization_url
    }


@router.get("/youtube/callback")
def youtube_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    oauth_data = get_oauth_data_from_state(state)

    user_id = oauth_data["user_id"]
    code_verifier = oauth_data["code_verifier"]

    flow = create_youtube_flow(
        code_verifier=code_verifier
    )

    flow.fetch_token(code=code)

    oauth_data = get_oauth_data_from_state(state)

    user_id = oauth_data["user_id"]
    code_verifier = oauth_data["code_verifier"]

    flow = create_youtube_flow(
        code_verifier=code_verifier
    )

    flow.fetch_token(code=code)

    credentials = flow.credentials

    youtube = build(
        "youtube",
        "v3",
        credentials=credentials
    )

    response = youtube.channels().list(
        part="snippet",
        mine=True
    ).execute()

    channels = response.get("items", [])

    if not channels:
        raise HTTPException(
            status_code=404,
            detail="No YouTube channel found"
        )

    channel = channels[0]

    channel_title = channel["snippet"]["title"]

    new_account = SocialAccount(
        user_id=user_id,
        platform="YouTube",
        username=channel_title,
        access_token=credentials.token,
        refresh_token=credentials.refresh_token
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return {
        "message": "YouTube account connected successfully",
        "account_id": new_account.account_id,
        "channel_name": channel_title
    }

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