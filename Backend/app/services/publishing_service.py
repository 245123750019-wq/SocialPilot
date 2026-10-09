from datetime import datetime, timezone
import os

from app.database.database import SessionLocal
from app.models.publishing_queue import PublishingQueue
from app.models.publishing_log import PublishingLog
from app.models.post import Post
from app.models.social_account import SocialAccount

from app.services.instagram_service import publish_instagram_image
from app.services.x_service import publish_x_post
from app.services.youtube_service import publish_youtube_video


def process_queue_item(queue_id: int):
    """
    Process one publishing queue item in the background.
    """

    db = SessionLocal()

    try:
        queue_item = (
            db.query(PublishingQueue)
            .filter(
                PublishingQueue.queue_id == queue_id
            )
            .first()
        )

        if not queue_item:
            return

        # Do not process an item that is already completed.
        if queue_item.status == "published":
            return

        post = (
            db.query(Post)
            .filter(
                Post.post_id == queue_item.post_id
            )
            .first()
        )

        if not post:
            queue_item.status = "failed"

            db.add(
                PublishingLog(
                    queue_id=queue_item.queue_id,
                    post_id=queue_item.post_id,
                    platform=queue_item.platform,
                    status="failed",
                    published_at=None,
                    error_message="Post not found.",
                    retry_count=queue_item.retry_count or 0
                )
            )

            db.commit()
            return

        # Mark queue item as processing.
        queue_item.status = "pending"

        db.commit()

        # ==================================================
        # INSTAGRAM
        # ==================================================

        if queue_item.platform == "Instagram":

            social_account = (
                db.query(SocialAccount)
                .filter(
                    SocialAccount.account_id == post.account_id
                )
                .first()
            )

            if not social_account:
                raise Exception(
                    "Instagram social account not found."
                )

            if not social_account.access_token:
                raise Exception(
                    "Instagram access token is not configured yet."
                )

            instagram_user_id = os.getenv(
                "INSTAGRAM_USER_ID"
            )

            if not instagram_user_id:
                raise Exception(
                    "Instagram User ID is not configured yet."
                )

            if not post.media_url:
                raise Exception(
                    "Instagram image URL is missing."
                )

            result = publish_instagram_image(
                instagram_user_id=instagram_user_id,
                access_token=social_account.access_token,
                image_url=post.media_url,
                caption=post.content
            )

            print(
                "Instagram publishing result:",
                result
            )

        # ==================================================
        # X
        # ==================================================

        elif queue_item.platform == "X":

            social_account = (
                db.query(SocialAccount)
                .filter(
                    SocialAccount.account_id == post.account_id
                )
                .first()
            )

            if not social_account:
                raise Exception(
                    "X social account not found."
                )

            if not social_account.access_token:
                raise Exception(
                    "X access token is not configured."
                )

            result = publish_x_post(
                access_token=social_account.access_token,
                text=post.content
            )

            print(
                "X publishing result:",
                result
            )

        # ==================================================
        # YOUTUBE
        # ==================================================

        elif queue_item.platform == "YouTube":

            social_account = (
                db.query(SocialAccount)
                .filter(
                    SocialAccount.account_id == post.account_id
                )
                .first()
            )

            if not social_account:
                raise Exception(
                    "YouTube social account not found."
                )

            if not social_account.access_token:
                raise Exception(
                    "YouTube access token is not configured."
                )

            if not social_account.refresh_token:
                raise Exception(
                    "YouTube refresh token is not configured."
                )

            if not post.media_url:
                raise Exception(
                    "YouTube video file is missing."
                )

            # --------------------------------------------------
            # Convert stored upload path to local filesystem path
            # --------------------------------------------------

            video_path = post.media_url

            # If the database contains a relative upload path,
# Convert only local relative paths to absolute paths.
# Supabase Storage object paths must remain unchanged.
            if (
                video_path
                and not os.path.isabs(video_path)
                and not video_path.startswith("uploads/")
            ):
                backend_dir = os.path.abspath(
                    os.path.join(
                        os.path.dirname(__file__),
                        "..",
                        ".."
                    )
                )
                video_path = os.path.join(backend_dir, video_path)

            result = publish_youtube_video(
                access_token=social_account.access_token,
                refresh_token=social_account.refresh_token,
                video_path=video_path,
                title=post.content,
                description=post.content
            )

            print(
                "YouTube publishing result:",
                result
            )

        else:

            # Other platforms remain simulated for now.
            pass

        # ==================================================
        # MARK AS PUBLISHED
        # ==================================================

        published_time = datetime.now(timezone.utc)

        queue_item.status = "published"

        post.status = "published"

        publishing_log = PublishingLog(
            queue_id=queue_item.queue_id,
            post_id=queue_item.post_id,
            platform=queue_item.platform,
            status="published",
            published_at=published_time,
            error_message=None,
            retry_count=queue_item.retry_count or 0
        )

        db.add(publishing_log)

        db.commit()

    except Exception as error:

        db.rollback()

        queue_item = (
            db.query(PublishingQueue)
            .filter(
                PublishingQueue.queue_id == queue_id
            )
            .first()
        )

        if queue_item:

            queue_item.status = "failed"

            db.add(
                PublishingLog(
                    queue_id=queue_item.queue_id,
                    post_id=queue_item.post_id,
                    platform=queue_item.platform,
                    status="failed",
                    published_at=None,
                    error_message=str(error),
                    retry_count=queue_item.retry_count or 0
                )
            )

            db.commit()

    finally:
        db.close()