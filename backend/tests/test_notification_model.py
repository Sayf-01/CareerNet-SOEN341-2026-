# KA-6 tests for the notifications table.

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from App.main import app
from App.database.connection import get_db
from App.models.notification import Notification
from App.models.user import User, UserRole


def new_session():
    # a session on the test database (same way as test_applications_extra.py)
    return next(app.dependency_overrides[get_db]())


def make_user(db, email="t@example.com"):
    # creates a job seeker directly in the database
    user = User(full_name="Test", email=email, hashed_password="x", role=UserRole.JOB_SEEKER)
    db.add(user)
    db.commit()
    return user


def test_notification_can_be_saved(client):
    db = new_session()
    user = make_user(db)
    db.add(Notification(user_id=user.id, type="status_changed", message="Hello"))
    db.commit()

    saved = db.query(Notification).one()
    assert saved.message == "Hello"
    assert saved.is_read is False  # default
    assert saved.created_at is not None  # set by the database
    assert saved.application_id is None
    db.close()


def test_same_user_and_event_key_is_refused(client):
    db = new_session()
    user = make_user(db)
    db.add(Notification(user_id=user.id, type="interview_reminder", message="A", event_key="reminder:1"))
    db.commit()

    # same user + same event_key breaks uq_notification_user_event
    db.add(Notification(user_id=user.id, type="interview_reminder", message="B", event_key="reminder:1"))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
    assert db.query(Notification).count() == 1
    db.close()


def test_same_event_key_for_different_users_is_accepted(client):
    db = new_session()
    a = make_user(db, "a@example.com")
    b = make_user(db, "b@example.com")
    db.add(Notification(user_id=a.id, type="interview_reminder", message="A", event_key="reminder:1"))
    db.add(Notification(user_id=b.id, type="interview_reminder", message="B", event_key="reminder:1"))
    db.commit()
    assert db.query(Notification).count() == 2
    db.close()


def test_two_empty_event_keys_are_accepted(client):
    db = new_session()
    user = make_user(db)
    db.add(Notification(user_id=user.id, type="status_changed", message="A"))
    db.add(Notification(user_id=user.id, type="status_changed", message="B"))
    db.commit()
    assert db.query(Notification).count() == 2
    db.close()


def test_deleting_user_deletes_notifications(client):
    db = new_session()
    # SQLite only follows ON DELETE rules when foreign keys are switched on
    db.execute(text("PRAGMA foreign_keys=ON"))
    try:
        user = make_user(db)
        db.add(Notification(user_id=user.id, type="status_changed", message="A"))
        db.commit()

        db.execute(text("DELETE FROM users WHERE id = :id"), {"id": user.id})
        db.commit()
        assert db.query(Notification).count() == 0
    finally:
        db.execute(text("PRAGMA foreign_keys=OFF"))  # leave the test database as we found it
        db.close()