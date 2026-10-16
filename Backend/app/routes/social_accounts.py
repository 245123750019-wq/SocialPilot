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
from app.services.meta_oauth import (
    create_instagram_authorization_url,
    exchange_instagram_code,
    get_instagram_profile,
    create_facebook_authorization_url,
    exchange_facebook_code,
    get_facebook_pages,
)
from app.services.x_oauth import (
    generate_code_verifier,
    create_x_authorization_url,
    exchange_code_for_token,
    get_x_user
)


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
@router.get("/x/connect")
def connect_x(
    user_id: int = Depends(get_current_user_id)
):
    code_verifier = generate_code_verifier()

    oauth_state = create_oauth_state(
    user_id=user_id,
    code_verifier=code_verifier,
    purpose="x_oauth"
)

    authorization_url = create_x_authorization_url(
        state=oauth_state,
        code_verifier=code_verifier
    )

    return {
        "authorization_url": authorization_url
    }
@router.get("/x/callback")
def x_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    oauth_data = get_oauth_data_from_state(
        state,
        expected_purpose="x_oauth"
    )

    user_id = oauth_data["user_id"]
    code_verifier = oauth_data["code_verifier"]

    token_data = exchange_code_for_token(
        code=code,
        code_verifier=code_verifier
    )

    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")

    if not access_token:
        raise HTTPException(
            status_code=400,
            detail="X did not return an access token"
        )

    x_user = get_x_user(access_token)

    x_username = x_user["data"]["username"]
    x_user_id = str(x_user["data"]["id"])

    new_account = SocialAccount(
        user_id=user_id,
        platform="X",
        username=x_username,
        platform_account_id=x_user_id,
        access_token=access_token,
        refresh_token=refresh_token
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return {
        "message": "X account connected successfully",
        "account_id": new_account.account_id
    }


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
    channel_id = channel["id"]

    existing_account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.user_id == user_id,
            SocialAccount.platform == "YouTube"
        )
        .order_by(
            SocialAccount.account_id.desc()
        )
        .first()
    )

    if existing_account:
        existing_account.username = channel_title
        existing_account.platform_account_id = channel_id
        existing_account.access_token = credentials.token

        if credentials.refresh_token:
            existing_account.refresh_token = (
                credentials.refresh_token
            )

        db.commit()
        db.refresh(existing_account)

        return {
            "message": "YouTube account connected successfully",
            "account_id": existing_account.account_id,
            "channel_name": channel_title
        }

    new_account = SocialAccount(
        user_id=user_id,
        platform="YouTube",
        username=channel_title,
        platform_account_id=channel_id,
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

@router.get("/instagram/connect")
def connect_instagram(
    user_id: int = Depends(get_current_user_id)
):
    oauth_state = create_oauth_state(
        user_id=user_id,
        code_verifier="meta_oauth",
        purpose="instagram_oauth"
    )

    authorization_url = create_instagram_authorization_url(
        state=oauth_state
    )

    return {"authorization_url": authorization_url}


@router.get("/instagram/callback")
def instagram_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    oauth_data = get_oauth_data_from_state(
        state,
        expected_purpose="instagram_oauth"
    )

    user_id = oauth_data["user_id"]

    try:
        token_data = exchange_instagram_code(code)
        access_token = token_data["access_token"]
        profile = get_instagram_profile(access_token)

        instagram_user_id = str(
            profile.get("user_id")
            or profile.get("id")
            or token_data.get("user_id")
            or ""
        )
        username = profile.get("username")

        if not instagram_user_id or not username:
            raise HTTPException(
                status_code=400,
                detail="Instagram did not return the expected account details."
            )

        account = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == "Instagram",
                SocialAccount.platform_account_id == instagram_user_id
            )
            .first()
        )

        if account:
            account.username = username
            account.access_token = access_token
        else:
            account = SocialAccount(
                user_id=user_id,
                platform="Instagram",
                username=username,
                platform_account_id=instagram_user_id,
                access_token=access_token
            )
            db.add(account)

        db.commit()

        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:3000"
        )
        return RedirectResponse(
            url=f"{frontend_url}/social-accounts?connected=instagram",
            status_code=303
        )

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Instagram connection failed: {str(exc)}"
        )

@router.get("/facebook/connect")
def connect_facebook(
    user_id: int = Depends(get_current_user_id)
):
    oauth_state = create_oauth_state(
        user_id=user_id,
        code_verifier="meta_oauth",
        purpose="facebook_oauth"
    )

    authorization_url = create_facebook_authorization_url(
        state=oauth_state
    )

    return {"authorization_url": authorization_url}


@router.get("/facebook/callback")
def facebook_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    oauth_data = get_oauth_data_from_state(
        state,
        expected_purpose="facebook_oauth"
    )
    user_id = oauth_data["user_id"]

    try:
        token_data = exchange_facebook_code(code)
        user_access_token = token_data["access_token"]
        pages = get_facebook_pages(user_access_token)

        configured_page_id = os.getenv("FACEBOOK_PAGE_ID")

        if configured_page_id:
            pages = [
                page for page in pages
                if str(page["id"]) == str(configured_page_id)
            ]

        if not pages:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No matching Facebook Page was returned. "
                    "Check Page access and permissions."
                )
            )

        # Use the configured Page when available; otherwise use
        # the first Page returned by Facebook.
        page = pages[0]
        page_id = str(page["id"])
        page_name = page["name"]
        page_access_token = page["access_token"]

        account = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == "Facebook",
                SocialAccount.platform_account_id == page_id
            )
            .first()
        )

        if account:
            account.username = page_name
            account.access_token = page_access_token
            account.refresh_token = None
        else:
            account = SocialAccount(
                user_id=user_id,
                platform="Facebook",
                username=page_name,
                platform_account_id=page_id,
                access_token=page_access_token
            )
            db.add(account)

        db.commit()

        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:3000"
        )
        return RedirectResponse(
            url=f"{frontend_url}/social-accounts?connected=facebook",
            status_code=303
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Facebook connection failed. Check the backend logs."
        )


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
        .filter(
            SocialAccount.user_id == user_id,
            SocialAccount.access_token.isnot(None)
        )
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
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
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
            detail="Social account not found."
        )

    # Keep the social account record because existing posts
    # may still reference it.
    account.access_token = None
    account.refresh_token = None

    db.commit()

    return {
        "message": "Social account disconnected successfully."
    }