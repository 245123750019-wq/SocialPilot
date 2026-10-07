from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database.database import SessionLocal

from app.models.publishing_queue import PublishingQueue
from app.models.publishing_log import PublishingLog
from app.models.post import Post
from app.models.social_account import SocialAccount

from app.schemas.publishing_queue import (
    PublishingQueueResponse,
    QueueStatusUpdate
)

from app.core.security import get_current_user_id
from app.services.publishing_service import process_queue_item


router = APIRouter(
    prefix="/publishing-queue",
    tags=["Publishing Queue"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ==================================================
# GET PUBLISHING QUEUE
# ==================================================

@router.get(
    "/",
    response_model=list[PublishingQueueResponse]
)
def get_publishing_queue(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    results = (
        db.query(
            PublishingQueue,
            Post,
            SocialAccount
        )
        .join(
            Post,
            PublishingQueue.post_id == Post.post_id
        )
        .join(
            SocialAccount,
            Post.account_id == SocialAccount.account_id
        )
        .filter(
            SocialAccount.user_id == user_id
        )
        .order_by(
            PublishingQueue.scheduled_time
        )
        .all()
    )

    response = []

    for queue_item, post, account in results:

        response.append(
            PublishingQueueResponse(
                queue_id=queue_item.queue_id,
                post_id=queue_item.post_id,
                platform=queue_item.platform,
                scheduled_time=(
                    queue_item.scheduled_time.isoformat()
                ),
                status=queue_item.status or "Pending",
                priority=queue_item.priority or 0,
                retry_count=queue_item.retry_count or 0,
                content=post.content
            )
        )

    return response

# ==================================================
# GET USER DRAFTS
# ==================================================

@router.get("/drafts")
def get_user_drafts(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    drafts = (
        db.query(Post)
        .filter(
            Post.user_id == user_id,
            Post.status == "draft"
        )
        .order_by(
            Post.post_id.desc()
        )
        .all()
    )

    return [
        {
            "post_id": draft.post_id,
            "content": draft.content,
            "status": draft.status,
            "post_type": draft.post_type
        }
        for draft in drafts
    ]


# ==================================================
# UPDATE QUEUE STATUS
# ==================================================

@router.patch("/{queue_id}")
def update_queue_status(
    queue_id: int,
    status_data: QueueStatusUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    result = (
        db.query(
            PublishingQueue,
            Post,
            SocialAccount
        )
        .join(
            Post,
            PublishingQueue.post_id == Post.post_id
        )
        .join(
            SocialAccount,
            Post.account_id == SocialAccount.account_id
        )
        .filter(
            PublishingQueue.queue_id == queue_id,
            SocialAccount.user_id == user_id
        )
        .first()
    )

    if not result:

        raise HTTPException(
            status_code=404,
            detail="Queue item not found"
        )

    queue_item, post, account = result

    new_status = status_data.status.lower()

    allowed_statuses = {
    "scheduled",
    "pending",
    "published",
    "failed",
    "cancelled"
    }

    if new_status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. "
                "Use scheduled, pending, published or failed."
            )
        )

    # --------------------------------------------------
    # Update queue status
    # --------------------------------------------------

    queue_item.status = new_status

    # --------------------------------------------------
    # Update post status
    # --------------------------------------------------

    post.status = new_status

    # --------------------------------------------------
    # Create / update publishing log
    # --------------------------------------------------

    if new_status in {"published", "failed"}:

        existing_log = (
            db.query(PublishingLog)
            .filter(
                PublishingLog.queue_id == queue_item.queue_id
            )
            .first()
        )

        if existing_log:

            existing_log.status = new_status

            if new_status == "published":
                existing_log.published_at = datetime.now(
                    timezone.utc
                )

            existing_log.retry_count = (
                queue_item.retry_count or 0
            )

        else:

            publishing_log = PublishingLog(
                queue_id=queue_item.queue_id,
                post_id=queue_item.post_id,
                platform=queue_item.platform,
                status=new_status,
                published_at=(
                    datetime.now(timezone.utc)
                    if new_status == "published"
                    else None
                ),
                error_message=(
                    "Publishing failed."
                    if new_status == "failed"
                    else None
                ),
                retry_count=(
                    queue_item.retry_count or 0
                )
            )

            db.add(publishing_log)

    db.commit()

    return {
        "message": "Queue status updated successfully",
        "queue_id": queue_item.queue_id,
        "status": queue_item.status
    }
    # ==================================================
# PROCESS QUEUE ITEM
# ==================================================

@router.post("/{queue_id}/process")
def process_queue(
    queue_id: int,
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    result = (
        db.query(
            PublishingQueue,
            Post,
            SocialAccount
        )
        .join(
            Post,
            PublishingQueue.post_id == Post.post_id
        )
        .join(
            SocialAccount,
            Post.account_id == SocialAccount.account_id
        )
        .filter(
            PublishingQueue.queue_id == queue_id,
            SocialAccount.user_id == user_id
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Queue item not found"
        )

    queue_item, post, account = result

    if queue_item.status == "published":
        raise HTTPException(
            status_code=400,
            detail="Queue item is already published."
        )

    # Add the publishing work to FastAPI's background tasks.
    background_tasks.add_task(
        process_queue_item,
        queue_item.queue_id
    )

    return {
        "message": "Publishing task added to background queue.",
        "queue_id": queue_item.queue_id,
        "status": "processing"
    }