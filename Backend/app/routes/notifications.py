
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.notification import Notification
from app.core.security import get_current_user_id

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_notifications(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return [
        {
            "notification_id": item.notification_id,
            "title": item.title,
            "message": item.message,
            "notification_type": item.notification_type,
            "is_read": item.is_read,
            "link": item.link,
            "created_at": item.created_at.isoformat(),
        }
        for item in notifications
    ]


@router.get("/unread-count")
def get_unread_count(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
        .count()
    )
    return {"unread_count": count}


@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    item = (
        db.query(Notification)
        .filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")

    item.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.patch("/read-all")
def mark_all_as_read(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
        .update({"is_read": True}, synchronize_session=False)
    )
    db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    item = (
        db.query(Notification)
        .filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(item)
    db.commit()
    return {"message": "Notification deleted successfully"}
