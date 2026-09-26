from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.publishing_log import PublishingLog
from app.models.post import Post
from app.models.social_account import SocialAccount
from app.schemas.publishing_log import PublishingLogResponse
from app.core.security import get_current_user_id


router = APIRouter(
    prefix="/publishing-logs",
    tags=["Publishing Logs"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get(
    "/",
    response_model=list[PublishingLogResponse]
)
def get_publishing_logs(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    results = (
        db.query(
            PublishingLog,
            Post,
            SocialAccount
        )
        .join(
            Post,
            PublishingLog.post_id == Post.post_id
        )
        .join(
            SocialAccount,
            Post.account_id == SocialAccount.account_id
        )
        .filter(
            SocialAccount.user_id == user_id
        )
        .order_by(
            PublishingLog.published_at.desc().nullslast()
        )
        .all()
    )

    response = []

    for log, post, account in results:

        response.append(
            PublishingLogResponse(
                log_id=log.log_id,
                post_id=log.post_id,
                queue_id=log.queue_id,
                platform=log.platform,
                status=log.status or "pending",
                published_at=(
                    log.published_at.isoformat()
                    if log.published_at
                    else None
                ),
                error_message=log.error_message,
                retry_count=log.retry_count or 0,
                content=post.content
            )
        )

    return response