import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR

from app.database.database import SessionLocal
from app.models.publishing_queue import PublishingQueue
from app.services.publishing_service import process_queue_item
from app.models import SocialAccount, AudienceAnalytics
from app.services.social_analytics_service import fetch_instagram_follower_count
import os

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()



def scheduler_job_listener(event):
    if event.exception:
        message = f"SCHEDULER JOB FAILED: {event.job_id}: {event.exception}"
        print(message, flush=True)
        logger.error(message)
    else:
        message = f"SCHEDULER JOB EXECUTED: {event.job_id}"
        print(message, flush=True)
        logger.info(message)



def check_publishing_queue():
    db = SessionLocal()

    try:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        logger.info("Publishing queue check started.")

        queue_items = (
            db.query(PublishingQueue)
            .filter(
                PublishingQueue.status == "scheduled",
                PublishingQueue.scheduled_time <= now
            )
            .all()
        )

        if queue_items:
            logger.info(
                "Publishing scheduler found %s eligible queue item(s).",
                len(queue_items),
            )

        for queue_item in queue_items:
            logger.info(
                "Processing publishing queue item %s.",
                queue_item.queue_id,
            )
            process_queue_item(queue_item.queue_id)

    except Exception:
        logger.exception("Publishing queue check failed.")
    finally:
        db.close()


def refresh_instagram_audience():
    """Save daily follower snapshots for connected Instagram accounts."""
    db = SessionLocal()

    try:
        instagram_user_id = os.getenv("INSTAGRAM_USER_ID")
        if not instagram_user_id:
            logger.error("INSTAGRAM_USER_ID is not configured.")
            return


        accounts = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.account_id == 26,
                SocialAccount.platform.ilike("instagram"),
                SocialAccount.access_token.isnot(None),
                SocialAccount.access_token != "",
            )
            .all()
        )


        for account in accounts:
            try:
                followers_count = fetch_instagram_follower_count(
                    instagram_user_id,
                    account.access_token,
                )

                previous = (
                    db.query(AudienceAnalytics)
                    .filter(
                        AudienceAnalytics.account_id == account.account_id
                    )
                    .order_by(AudienceAnalytics.recorded_at.desc())
                    .first()
                )

                if previous and previous.followers_count == followers_count:
                    logger.info(
                        "Follower count unchanged for Instagram account %s.",
                        account.account_id,
                    )
                    continue

                growth = (
                    followers_count - previous.followers_count
                    if previous
                    else 0
                )

                snapshot = AudienceAnalytics(
                    account_id=account.account_id,
                    followers_count=followers_count,
                    follower_growth=growth,
                    recorded_at=datetime.utcnow(),
                )

                db.add(snapshot)
                db.commit()

                logger.info(
                    "Saved audience snapshot for account %s: "
                    "%s followers, growth %s.",
                    account.account_id,
                    followers_count,
                    growth,
                )

            except Exception:
                db.rollback()
                logger.exception(
                    "Audience refresh failed for account %s.",
                    account.account_id,
                )

    except Exception:
        db.rollback()
        logger.exception("Instagram audience refresh job failed.")
    finally:
        db.close()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            check_publishing_queue,
            "interval",
            minutes=1,
            id="publishing_queue_checker",
            replace_existing=True
        )

        scheduler.add_job(
            refresh_instagram_audience,
            "cron",
            hour=0,
            minute=0,
            id="daily_instagram_audience_refresh",
            replace_existing=True
        )

        scheduler.add_listener(
            scheduler_job_listener,
            EVENT_JOB_EXECUTED | EVENT_JOB_ERROR,
        )
        scheduler.start()
        logger.info("Publishing scheduler started; checking every minute.")
        logger.info("Daily Instagram audience refresh scheduled at midnight.")



def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Publishing scheduler stopped.")
