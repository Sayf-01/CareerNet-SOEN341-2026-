# KA-7 tests for the notification service (App/crud/notifications.py).

from datetime import datetime, timedelta, timezone

from App.main import app
from App.crud import notifications as svc
from App.database.connection import get_db
from App.models.application import Application
from App.models.job import Job
from App.models.notification import Notification
from App.models.user import User, UserRole

NOW = datetime(2026, 11, 10, 12, 0, tzinfo=timezone.utc)  # fixed "now" so the tests never depend on the clock


def new_session():
    # a session on the test database (same way as test_applications_extra.py)
    return next(app.dependency_overrides[get_db]())


def make_user(db, email="seeker@example.com", role=UserRole.JOB_SEEKER):
    # creates a user directly in the database
    user = User(full_name="Test", email=email, hashed_password="x", role=role)
    db.add(user)
    db.commit()
    return user


def make_application(db, user_id, status="Interview", interview_at=None, title="Backend Developer"):
    # creates a job and an application for it
    job = Job(title=title, company="Acme", location="Montreal",
              category="Software Development", description="Build APIs.")
    db.add(job)
    db.commit()
    application = Application(user_id=user_id, job_id=job.id, status=status, interview_at=interview_at)
    db.add(application)
    db.commit()
    return application


# ---------- create_notification ----------

def test_create_notification(client):
    db = new_session()
    user = make_user(db)
    n = svc.create_notification(db, user.id, svc.STATUS_CHANGED, "Hello")
    assert n.id is not None  # flushed, so it has an id
    assert n.is_read is False
    assert db.query(Notification).count() == 1
    db.close()


def test_same_event_key_twice_gives_one_row(client):
    db = new_session()
    user = make_user(db)
    first = svc.create_notification(db, user.id, svc.INTERVIEW_REMINDER, "A", event_key="reminder:1")
    second = svc.create_notification(db, user.id, svc.INTERVIEW_REMINDER, "B", event_key="reminder:1")
    assert first is not None
    assert second is None
    assert db.query(Notification).count() == 1
    db.close()


def test_service_does_not_commit(client):
    # the caller decides: a rollback removes the notification
    db = new_session()
    user = make_user(db)
    svc.create_notification(db, user.id, svc.STATUS_CHANGED, "Hello")
    db.rollback()
    assert db.query(Notification).count() == 0
    db.close()


# ---------- notify_* ----------

def test_notify_new_application(client):
    db = new_session()
    recruiter = make_user(db, "rec@example.com", UserRole.RECRUITER)
    n = svc.notify_new_application(db, recruiter_id=recruiter.id, application_id=None,
                                   job_title="Backend Developer", applicant_name="Kaila")
    assert n.type == "application_received"
    assert n.message == "New application for Backend Developer from Kaila"
    assert n.user_id == recruiter.id
    db.close()


def test_notify_status_change(client):
    db = new_session()
    user = make_user(db)
    application = make_application(db, user.id, status="Under Review")
    n = svc.notify_status_change(db, user_id=user.id, application_id=application.id,
                                 job_title="Backend Developer", new_status="Under Review")
    assert n.type == "status_changed"
    assert n.message == "Your application for Backend Developer is now Under Review"
    assert n.application_id == application.id
    db.close()


def test_status_change_to_interview_gives_invitation(client):
    db = new_session()
    user = make_user(db)
    when = datetime(2026, 11, 12, 14, 0, tzinfo=timezone.utc)
    n = svc.notify_status_change(db, user_id=user.id, application_id=None,
                                 job_title="Backend Developer", new_status="Interview", interview_at=when)
    assert n.type == "interview_invited"
    assert n.message == "You have been invited to interview for Backend Developer on November 12, 2026 at 14:00 UTC"
    db.close()


def test_interview_invitation_without_date(client):
    db = new_session()
    user = make_user(db)
    n = svc.notify_status_change(db, user_id=user.id, application_id=None,
                                 job_title="Backend Developer", new_status="Interview")
    assert n.message == "You have been invited to interview for Backend Developer"
    db.close()


# ---------- list, count, mark ----------

def test_list_count_and_unread_only(client):
    db = new_session()
    user = make_user(db)
    other = make_user(db, "other@example.com")
    first = svc.create_notification(db, user.id, svc.STATUS_CHANGED, "first")
    svc.create_notification(db, user.id, svc.STATUS_CHANGED, "second")
    svc.create_notification(db, other.id, svc.STATUS_CHANGED, "not mine")
    first.is_read = True
    db.flush()

    assert [n.message for n in svc.list_notifications(db, user.id)] == ["second", "first"]  # newest first
    assert [n.message for n in svc.list_notifications(db, user.id, unread_only=True)] == ["second"]
    assert len(svc.list_notifications(db, user.id, limit=1)) == 1
    assert svc.count_unread(db, user.id) == 1
    db.close()


def test_mark_read_only_for_owner(client):
    db = new_session()
    owner = make_user(db)
    stranger = make_user(db, "stranger@example.com")
    n = svc.create_notification(db, owner.id, svc.STATUS_CHANGED, "Hello")

    assert svc.mark_read(db, stranger.id, n.id) is None  # not theirs
    assert svc.count_unread(db, owner.id) == 1
    assert svc.mark_read(db, owner.id, n.id).is_read is True
    assert svc.count_unread(db, owner.id) == 0
    db.close()


def test_mark_all_read_returns_count(client):
    db = new_session()
    user = make_user(db)
    for i in range(3):
        svc.create_notification(db, user.id, svc.STATUS_CHANGED, f"n{i}")
    assert svc.mark_all_read(db, user.id) == 3
    assert svc.count_unread(db, user.id) == 0
    assert svc.mark_all_read(db, user.id) == 0  # nothing left to mark
    db.close()


# ---------- generate_interview_reminders (P2) ----------

def test_interview_in_5_hours_gets_one_reminder(client):
    db = new_session()
    user = make_user(db)
    make_application(db, user.id, interview_at=NOW + timedelta(hours=5))

    created = svc.generate_interview_reminders(db, user.id, now=NOW)
    assert len(created) == 1
    assert created[0].type == "interview_reminder"
    assert created[0].message == "Reminder: your interview for Backend Developer is on November 10, 2026 at 17:00 UTC"

    assert svc.generate_interview_reminders(db, user.id, now=NOW) == []  # second call creates none
    assert db.query(Notification).count() == 1
    db.close()


def test_no_reminder_for_interview_3_days_away(client):
    db = new_session()
    user = make_user(db)
    make_application(db, user.id, interview_at=NOW + timedelta(days=3))
    assert svc.generate_interview_reminders(db, user.id, now=NOW) == []
    db.close()


def test_no_reminder_for_past_interview(client):
    db = new_session()
    user = make_user(db)
    make_application(db, user.id, interview_at=NOW - timedelta(hours=1))
    assert svc.generate_interview_reminders(db, user.id, now=NOW) == []
    db.close()


def test_no_reminder_when_status_is_not_interview(client):
    db = new_session()
    user = make_user(db)
    make_application(db, user.id, status="Applied", interview_at=NOW + timedelta(hours=5))
    assert svc.generate_interview_reminders(db, user.id, now=NOW) == []
    db.close()


def test_rescheduled_interview_reminds_again(client):
    # the event_key includes the time, so a new time gives a new reminder
    db = new_session()
    user = make_user(db)
    application = make_application(db, user.id, interview_at=NOW + timedelta(hours=5))
    assert len(svc.generate_interview_reminders(db, user.id, now=NOW)) == 1

    application.interview_at = NOW + timedelta(hours=8)
    db.commit()
    assert len(svc.generate_interview_reminders(db, user.id, now=NOW)) == 1
    assert db.query(Notification).count() == 2
    db.close()