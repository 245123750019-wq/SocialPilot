import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR

from app.database.database import SessionLocal
from app.models.publishing_queue import PublishingQueue
from app.services.publishing_service import process_queue_item

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def scheduler_job_listener(event):
    if event.exception:
        logger.error(
            "SCHEDULER JOB FAILED: %s",
            event.job_id,
            exc_info=(
                type(event.exception),
                event.exception,
                event.exception.__traceback__,
            ),
        )
    else:
        logger.info("SCHEDULER JOB EXECUTED: %s", event.job_id)


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


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            check_publishing_queue,
            "interval",
            minutes=1,
            id="publishing_queue_checker",
            replace_existing=True
        )
        scheduler.add_listener(
            scheduler_job_listener,
            EVENT_JOB_EXECUTED | EVENT_JOB_ERROR,
        )
        scheduler.start()
        logger.info("Publishing scheduler started; checking every minute.")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Publishing scheduler stopped.")
