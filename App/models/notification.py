from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, false, func,
)
from App.database.base import Base


class Notification(Base):
    # Stores the notifications shown in a user's bell icon (KA-6).

    __tablename__ = "notifications"

    # Primary key
    id = Column(Integer, primary_key=True)

    # Who the notification is for (deleted together with the user)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # application_received, status_changed, interview_invited or interview_reminder
    type = Column(String(30), nullable=False)
    message = Column(String(255), nullable=False)

    # The application it is about (kept, but emptied, if the application is deleted)
    application_id = Column(
        Integer,
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Unread until the user opens it
    is_read = Column(Boolean, nullable=False, default=False, server_default=false())

    # Set by the database when the row is saved
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Stops the same reminder from being created twice (empty for normal notifications)
    event_key = Column(String(100), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "event_key", name="uq_notification_user_event"),
    )