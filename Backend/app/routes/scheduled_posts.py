from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.post import Post
from app.models.scheduled_post import ScheduledPost
from app.models.social_account import SocialAccount
from app.schemas.scheduled_post import ScheduledPostResponse
from app.core.security import get_current_user_id


router = APIRouter(
    prefix="/scheduled-posts",
    tags=["Scheduled Posts"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[ScheduledPostResponse])
def get_scheduled_posts(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            ScheduledPost,
            Post,
            SocialAccount
        )
        .join(
            Post,
            ScheduledPost.post_id == Post.post_id
        )
        .join(
            SocialAccount,
            Post.account_id == SocialAccount.account_id
        )
        .filter(
            SocialAccount.user_id == user_id
        )
        .order_by(
            ScheduledPost.scheduled_at
        )
        .all()
    )

    response = []

    for scheduled_post, post, social_account in results:

        scheduled_time = scheduled_post.scheduled_at

        response.append(
            ScheduledPostResponse(
                id=scheduled_post.schedule_id,
                date=scheduled_time.strftime("%Y-%m-%d"),
                time=scheduled_time.strftime("%H:%M"),
                content=post.content,
                platforms=[social_account.platform],
                status=scheduled_post.status or "Scheduled"
            )
        )

    return response