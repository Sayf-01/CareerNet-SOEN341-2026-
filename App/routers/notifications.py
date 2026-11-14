from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from App.core.dependencies import get_current_user
from App.crud import notifications as notification_service
from App.database.connection import get_db
from App.models.application import Application
from App.models.user import User
from App.schemas.notification import MarkAllReadResult, NotificationItem, NotificationList

# The bell icon: list my notifications and mark them as read (LA-7).
# All the database work is done by Kaila's functions in App/crud/notifications.py (KA-7).
router = APIRouter(prefix="/notifications", tags=["notifications"])


def to_item(db: Session, notification) -> NotificationItem:
    """Turns a notification row into the answer, adding the interview date of its application."""
    interview_at = None
    if notification.application_id is not None:
        application = db.get(Application, notification.application_id)
        if application is not None:
            interview_at = application.interview_at
    return NotificationItem(
        id=notification.id,
        type=notification.type,
        message=notification.message,
        is_read=notification.is_read,
        created_at=notification.created_at,
        application_id=notification.application_id,
        interview_at=interview_at,
    )


@router.get("", response_model=NotificationList)
def my_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """My notifications, newest first, and how many are unread."""
    # First create any interview reminders that are due, then save them
    notification_service.generate_interview_reminders(db, current_user.id)
    db.commit()  # Kaila's functions never commit: the endpoint does

    notifications = notification_service.list_notifications(db, current_user.id, unread_only=unread_only)
    return NotificationList(
        items=[to_item(db, notification) for notification in notifications],
        unread_count=notification_service.count_unread(db, current_user.id),
    )


@router.post("/read-all", response_model=MarkAllReadResult)
def mark_all_my_notifications_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Marks all of my notifications as read."""
    updated = notification_service.mark_all_read(db, current_user.id)
    db.commit()
    return MarkAllReadResult(updated=updated)


@router.post("/{id}/read", response_model=NotificationItem)
def mark_my_notification_read(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marks one of my notifications as read. Someone else's, or one that does not exist, gives 404."""
    notification = notification_service.mark_read(db, current_user.id, id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.commit()
    return to_item(db, notification)