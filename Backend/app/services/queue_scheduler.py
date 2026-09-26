from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.database.database import SessionLocal
from app.models.publishing_queue import PublishingQueue
from app.services.publishing_service import process_queue_item


scheduler = BackgroundScheduler()


def check_publishing_queue():
    db = SessionLocal()

    try:
        now = datetime.now(timezone.utc)

        queue_items = (
            db.query(PublishingQueue)
            .filter(
                PublishingQueue.status == "scheduled",
                PublishingQueue.scheduled_time <= now
            )
            .all()
        )

        for queue_item in queue_items:
            process_queue_item(queue_item.queue_id)

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

        scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()