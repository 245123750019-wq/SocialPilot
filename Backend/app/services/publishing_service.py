from datetime import datetime, timezone
from sqlalchemy import update
import os

from app.database.database import SessionLocal
from app.models.publishing_queue import PublishingQueue
from app.models.publishing_log import PublishingLog
from app.models.post import Post
from app.models.social_account import SocialAccount
from app.models.notification import Notification

from app.services.instagram_service import publish_instagram_image
from app.services.x_service import publish_x_post
from app.services.youtube_service import publish_youtube_video
from app.services.facebook_service import publish_facebook_post


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

        # Only process items that are still scheduled.
        if queue_item.status != "scheduled":
            print(
                f"Queue item {queue_id} is not scheduled; "
                f"current status: {queue_item.status}",
                flush=True,
            )
            return

        # Atomically claim the queue item before doing any other work.
        claim_result = db.execute(
            update(PublishingQueue)
            .where(
                PublishingQueue.queue_id == queue_id,
                PublishingQueue.status == "scheduled",
            )
            .values(status="pending")
        )
        db.commit()

        if claim_result.rowcount != 1:
            print(
                f"Queue item {queue_id} was already claimed.",
                flush=True,
            )
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

            if os.getenv("INSTAGRAM_DRY_RUN", "true").lower() == "true":
                print("INSTAGRAM DRY RUN: Validation passed", flush=True)
                print(f"Instagram user ID configured: {bool(instagram_user_id)}", flush=True)
                print(f"Access token available: {bool(social_account.access_token)}", flush=True)
                print(f"Image URL available: {bool(post.media_url)}", flush=True)
                print(f"Caption available: {post.content is not None}", flush=True)

                # Mark the dry-run as completed to prevent repeated scheduler processing.
                queue_item.status = "dry_run"
                db.commit()
                print("DRY RUN COMPLETE: No post was published.", flush=True)
                return
            else:
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
        # FACEBOOK
        # ==================================================

        elif queue_item.platform == "Facebook":

            social_account = (
                db.query(SocialAccount)
                .filter(
                    SocialAccount.account_id == post.account_id,
                    SocialAccount.user_id == post.user_id,
                    SocialAccount.platform == "Facebook"
                )
                .first()
            )

            if not social_account:
                raise Exception("Facebook social account not found.")

            if not social_account.access_token:
                raise Exception(
                    "Facebook Page access token is not configured."
                )

            page_id = os.getenv("FACEBOOK_PAGE_ID")

            if not page_id:
                raise Exception("Facebook Page ID is not configured.")

            result = publish_facebook_post(
                page_id=page_id,
                access_token=social_account.access_token,
                message=post.content or "",
                image_url=post.media_url if post.post_type == "Image" else None,
            )

            print("Facebook publishing result:", result, flush=True)



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

            # ----------------------------------------
            # Convert stored upload path to local filesystem path
            # ----------------------------------------
            # --------------------------------------------------
            # Preserve Supabase Storage object paths
            # --------------------------------------------------
            video_path = post.media_url

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

        notification_user_id = post.user_id

        if notification_user_id is None and post.account_id is not None:
            social_account = (
                db.query(SocialAccount)
                .filter(SocialAccount.account_id == post.account_id)
                .first()
            )

            if social_account:
                notification_user_id = social_account.user_id

        if notification_user_id is not None:
            db.add(
                Notification(
                    user_id=notification_user_id,
                    title="Post Published Successfully",
                    message=f"Your {queue_item.platform} post was published successfully.",
                    notification_type="publishing_success",
                    is_read=False,
                    link="/publishing-logs",
                    created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                )
            )

        db.commit()


    except Exception as error:
        db.rollback()

        queue_item = (
            db.query(PublishingQueue)
            .filter(PublishingQueue.queue_id == queue_id)
            .first()
        )

        if queue_item and queue_item.status != "cancelled":
            queue_item.status = "failed"

            db.add(
                PublishingLog(
                    queue_id=queue_item.queue_id,
                    post_id=queue_item.post_id,
                    platform=queue_item.platform,
                    status="failed",
                    published_at=None,
                    error_message=str(error),
                    retry_count=queue_item.retry_count or 0,
                )
            )

            post = (
                db.query(Post)
                .filter(Post.post_id == queue_item.post_id)
                .first()
            )

            notification_user_id = (
                post.user_id if post and post.user_id is not None
                else None
            )

            if notification_user_id is None and post and post.account_id is not None:
                social_account = (
                    db.query(SocialAccount)
                    .filter(SocialAccount.account_id == post.account_id)
                    .first()
                )

                if social_account:
                    notification_user_id = social_account.user_id

            if notification_user_id is not None:
                db.add(
                    Notification(
                        user_id=notification_user_id,
                        title="Post Publishing Failed",
                        message=(
                            f"Your {queue_item.platform} post failed to publish. "
                            f"Reason: {str(error)}"
                        ),
                        notification_type="publishing_failure",
                        is_read=False,
                        link="/publishing-logs",
                        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                    )
                )
            db.commit()

    finally:
        db.close()