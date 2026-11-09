from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from App.application_statuses import INTERVIEW
from App.models.application import Application
from App.models.job import Job
from App.models.notification import Notification

# Notification types
APPLICATION_RECEIVED = "application_received"  # to the recruiter
STATUS_CHANGED = "status_changed"  # to the job seeker
INTERVIEW_INVITED = "interview_invited"  # to the job seeker
INTERVIEW_REMINDER = "interview_reminder"  # to the job seeker, the day before

# Rule for every function here: db.add + db.flush, but NEVER db.commit.
# The caller commits, so a notification is saved together with the change that caused it.


def _as_utc(dt: datetime) -> datetime:
    # SQLite (tests) gives dates back without a time zone: treat those as UTC
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _format_date(dt: datetime) -> str:
    # e.g. "November 12, 2026 at 14:00 UTC"
    return _as_utc(dt).strftime("%B %d, %Y at %H:%M UTC")


def create_notification(
    db: Session,
    user_id: int,
    type: str,
    message: str,
    application_id: int | None = None,
    event_key: str | None = None,
):
    """Adds a notification. Returns None if this user already has one with the same event_key."""
    if event_key is not None:
        already = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.event_key == event_key)
            .first()
        )
        if already is not None:
            return None

    notification = Notification(
        user_id=user_id,
        type=type,
        message=message[:255],  # the column holds 255 characters
        application_id=application_id,
        event_key=event_key,
    )
    db.add(notification)
    db.flush()  # gives it an id, without committing
    return notification


def notify_new_application(db: Session, *, recruiter_id: int, application_id: int, job_title: str, applicant_name: str):
    """Tells the recruiter someone applied to their posting."""
    return create_notification(
        db,
        recruiter_id,
        APPLICATION_RECEIVED,
        f"New application for {job_title} from {applicant_name}",
        application_id=application_id,
    )


def notify_status_change(
    db: Session,
    *,
    user_id: int,
    application_id: int,
    job_title: str,
    new_status: str,
    interview_at: datetime | None = None,
):
    """Tells the job seeker their status changed. Interview gives an invitation instead."""
    if new_status == INTERVIEW:
        message = f"You have been invited to interview for {job_title}"
        if interview_at is not None:
            message += f" on {_format_date(interview_at)}"
        return create_notification(db, user_id, INTERVIEW_INVITED, message, application_id=application_id)

    return create_notification(
        db,
        user_id,
        STATUS_CHANGED,
        f"Your application for {job_title} is now {new_status}",
        application_id=application_id,
    )


def list_notifications(db: Session, user_id: int, unread_only: bool = False, limit: int = 50):
    """The user's notifications, newest first."""
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(limit).all()


def count_unread(db: Session, user_id: int) -> int:
    """How many unread notifications the user has (the number on the bell)."""
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .count()
    )


def mark_read(db: Session, user_id: int, notification_id: int):
    """Marks one notification as read. Returns None if it is not this user's."""
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if notification is None:
        return None
    notification.is_read = True
    db.flush()
    return notification


def mark_all_read(db: Session, user_id: int) -> int:
    """Marks all of the user's notifications as read and returns how many changed."""
    unread = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .all()
    )
    for notification in unread:
        notification.is_read = True
    db.flush()
    return len(unread)


def generate_interview_reminders(db: Session, user_id: int, now: datetime | None = None):
    """(P2) Creates one reminder for each interview in the next 24 hours.

    Called each time the user opens their notifications, so no background timer is needed.
    The event_key includes the interview time, so a rescheduled interview reminds again.
    Returns the list of new reminders.
    """
    now = _as_utc(now) if now is not None else datetime.now(timezone.utc)
    rows = (
        db.query(Application, Job.title)
        .join(Job, Job.id == Application.job_id)
        .filter(
            Application.user_id == user_id,
            Application.status == INTERVIEW,
            Application.interview_at.is_not(None),
        )
        .all()
    )

    created = []
    for application, job_title in rows:
        when = _as_utc(application.interview_at)
        if now <= when <= now + timedelta(hours=24):  # compare in Python: safe with and without time zones
            reminder = create_notification(
                db,
                user_id,
                INTERVIEW_REMINDER,
                f"Reminder: your interview for {job_title} is on {_format_date(when)}",
                application_id=application.id,
                event_key=f"reminder:{application.id}:{when.isoformat()}",
            )
            if reminder is not None:
                created.append(reminder)
    return created