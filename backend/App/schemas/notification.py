from datetime import datetime

from pydantic import BaseModel


class NotificationItem(BaseModel):
    """One notification in the bell list."""

    id: int
    type: str  # application_received, status_changed, interview_invited or interview_reminder
    message: str
    is_read: bool
    created_at: datetime
    application_id: int | None = None  # the application it is about, if any
    interview_at: datetime | None = None  # the interview date of that application, if any


class NotificationList(BaseModel):
    """Answer of GET /notifications: the notifications and how many are unread (the number on the bell)."""

    items: list[NotificationItem]
    unread_count: int


class MarkAllReadResult(BaseModel):
    """Answer of POST /notifications/read-all: how many notifications were changed to read."""

    updated: int