from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.post import Post
from app.models.scheduled_post import ScheduledPost
from app.models.social_account import SocialAccount
from app.models.publishing_queue import PublishingQueue
from app.models.campaign import Campaign

from app.schemas.post import (
    PostCreate,
    DraftCreate,
    PostResponse
)

from app.core.security import get_current_user_id


router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_next_date(current_date, frequency):

    if frequency == "daily":
        return current_date + timedelta(days=1)

    if frequency == "weekly":
        return current_date + timedelta(days=7)

    if frequency == "monthly":

        month = current_date.month
        year = current_date.year

        if month == 12:
            month = 1
            year += 1
        else:
            month += 1

        import calendar

        last_day = calendar.monthrange(
            year,
            month
        )[1]

        day = min(
            current_date.day,
            last_day
        )

        return current_date.replace(
            year=year,
            month=month,
            day=day
        )

    return None


# ==================================================
# SAVE DRAFT
# ==================================================

@router.post(
    "/draft",
    response_model=PostResponse
)
def create_draft(
    draft_data: DraftCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    if not draft_data.content.strip():

        raise HTTPException(
            status_code=400,
            detail="Draft content cannot be empty."
        )

        new_post = Post(
        user_id=user_id,
        content=draft_data.content.strip(),
        status="draft",
        post_type=draft_data.post_type
    )

    db.add(new_post)

    db.commit()

    db.refresh(new_post)

    return PostResponse(
        message="Draft saved successfully",
        post_ids=[new_post.post_id]
    )

# ==================================================
# CREATE / SCHEDULE POST
# ==================================================

@router.post(
    "/",
    response_model=PostResponse
)
def create_post(
    post_data: PostCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------
    # Validate platforms
    # --------------------------------------------------

    if not post_data.platforms:

        raise HTTPException(
            status_code=400,
            detail="Please select at least one platform."
        )

    # --------------------------------------------------
    # Convert scheduled date/time
    # --------------------------------------------------

    try:

        scheduled_datetime = datetime.fromisoformat(
            post_data.scheduled_at
        )

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail="Invalid scheduled date/time."
        )

    # --------------------------------------------------
    # Find connected account for each platform
    # --------------------------------------------------

    selected_accounts = []

    for platform in post_data.platforms:

        account = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == platform
            )
            .first()
        )

        if not account:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"No connected {platform} account found. "
                    f"Please connect your {platform} account first."
                )
            )

        selected_accounts.append(account)

    post_ids = []

    # ==================================================
    # CAMPAIGN VALIDATION
    # ==================================================

    if post_data.campaign_id is not None:
        campaign = (
            db.query(Campaign)
            .filter(
                Campaign.campaign_id == post_data.campaign_id,
                Campaign.user_id == user_id
            )
            .first()
        )

        if not campaign:
            raise HTTPException(
                status_code=404,
                detail="Campaign not found or does not belong to the current user."
            )

    # ==================================================
    # ONE-TIME POST
    # ==================================================

    if post_data.schedule_type == "once":

        for account in selected_accounts:

            # ------------------------------------------
            # Create post
            # ------------------------------------------

            new_post = Post(
                account_id=account.account_id,
                content=post_data.content,
                media_url=post_data.media_url,
                campaign_id=post_data.campaign_id,
                scheduled_time=scheduled_datetime,
                scheduled_at=scheduled_datetime,
                status="scheduled",
                post_type=post_data.post_type
            )

            db.add(new_post)

            db.flush()

            # ------------------------------------------
            # Create scheduled post record
            # ------------------------------------------

            scheduled_post = ScheduledPost(
                post_id=new_post.post_id,
                scheduled_at=scheduled_datetime,
                status="scheduled"
            )

            db.add(scheduled_post)

            # ------------------------------------------
            # Create publishing queue record
            # ------------------------------------------

            queue_item = PublishingQueue(
                post_id=new_post.post_id,
                platform=account.platform,
                scheduled_time=scheduled_datetime,
                status="scheduled",
                priority=0,
                retry_count=0,
                created_at=datetime.now(timezone.utc)
            )

            db.add(queue_item)

            post_ids.append(
                new_post.post_id
            )

    # ==================================================
    # RECURRING POST
    # ==================================================

    else:

        # --------------------------------------------------
        # Validate recurring settings
        # --------------------------------------------------

        if not post_data.end_date:

            raise HTTPException(
                status_code=400,
                detail="End date is required for recurring posts."
            )

        if not post_data.recurring_frequency:

            raise HTTPException(
                status_code=400,
                detail="Recurring frequency is required."
            )

        try:

            end_datetime = datetime.fromisoformat(
                f"{post_data.end_date}T23:59:59"
            )

        except ValueError:

            raise HTTPException(
                status_code=400,
                detail="Invalid recurring end date."
            )

        if end_datetime < scheduled_datetime:

            raise HTTPException(
                status_code=400,
                detail="End date must be after the start date."
            )

        # --------------------------------------------------
        # Create recurring post for each account
        # --------------------------------------------------

        for account in selected_accounts:

            new_post = Post(
                account_id=account.account_id,
                content=post_data.content,
                media_url=post_data.media_url,
                campaign_id=post_data.campaign_id,
                scheduled_time=scheduled_datetime,
                scheduled_at=scheduled_datetime,
                status="scheduled",
                post_type=post_data.post_type
            )

            db.add(new_post)

            db.flush()

            post_ids.append(
                new_post.post_id
            )

            # ------------------------------------------
            # Generate each recurring date
            # ------------------------------------------

            current_datetime = scheduled_datetime

            while current_datetime <= end_datetime:

                # --------------------------------------
                # Scheduled post record
                # --------------------------------------

                scheduled_post = ScheduledPost(
                    post_id=new_post.post_id,
                    scheduled_at=current_datetime,
                    status="scheduled"
                )

                db.add(scheduled_post)

                # --------------------------------------
                # Publishing queue record
                # --------------------------------------

                queue_item = PublishingQueue(
                    post_id=new_post.post_id,
                    platform=account.platform,
                    scheduled_time=current_datetime,
                    status="scheduled",
                    priority=0,
                    retry_count=0,
                    created_at=datetime.now(timezone.utc)
                )

                db.add(queue_item)

                # --------------------------------------
                # Calculate next recurring date
                # --------------------------------------

                next_datetime = get_next_date(
                    current_datetime,
                    post_data.recurring_frequency
                )

                if next_datetime is None:
                    break

                current_datetime = next_datetime

    # ==================================================
    # SAVE EVERYTHING
    # ==================================================

    db.commit()

    return PostResponse(
        message="Post scheduled successfully",
        post_ids=post_ids
    )