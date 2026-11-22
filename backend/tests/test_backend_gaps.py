# KA-15: tests for the lines coverage said were never run (error paths and edge cases)

import io
from datetime import datetime, timezone

import pytest
from pypdf import PdfReader, PdfWriter
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from App.crud import notifications as notification_service
from App.database import connection
from App.database.connection import get_db
from App.main import app
from App.models.application import Application
from App.models.job import Job
from App.routers.applications import ALREADY_APPLIED
from App.routers.auth import DUPLICATE_EMAIL
from App.services.resume_text import PDF, UNREADABLE, ResumeTextError, extract_resume_text
from tests.conftest import API
from tests.resume_samples import SAMPLE_RESUME_TEXT, make_pdf_bytes
from tests.test_notifications import login_as
from tests.test_resumes import upload

INTERVIEW = datetime(2030, 1, 15, 14, 0, tzinfo=timezone.utc)  # far away so no reminder gets made


def fail_commit(self):
    # pretends another request saved the same row a split second before us
    raise IntegrityError("INSERT", {}, Exception("unique rule"))


def new_session():
    # same test database the client uses
    return next(app.dependency_overrides[get_db]())


def make_job_and_application(user_id, interview_at=None):
    # a job plus an application to it, saved straight in the database
    db = new_session()
    job = Job(title="Backend Intern", company="CareerNet", location="Montreal",
              category="Software", description="Build APIs.")
    db.add(job)
    db.commit()
    application = Application(user_id=user_id, job_id=job.id, status="Interview", interview_at=interview_at)
    db.add(application)
    db.commit()
    ids = job.id, application.id
    db.close()
    return ids


def add_notification(user_id, application_id):
    # a notification linked to an application
    db = new_session()
    notification_service.create_notification(
        db, user_id, notification_service.INTERVIEW_INVITED, "You got an interview", application_id=application_id
    )
    db.commit()
    db.close()


# resume_text.py: a password-protected PDF

def test_password_protected_pdf_is_unreadable():
    writer = PdfWriter(clone_from=PdfReader(io.BytesIO(make_pdf_bytes(SAMPLE_RESUME_TEXT))))
    writer.encrypt("secret")
    locked = io.BytesIO()
    writer.write(locked)

    with pytest.raises(ResumeTextError) as error:
        extract_resume_text(PDF, locked.getvalue())
    assert str(error.value) == UNREADABLE
    assert "Alex" not in str(error.value)  # the message never shows resume text


# auth.py: two sign ups with the same email at the same time

def test_register_race_on_same_email_is_409(client, monkeypatch):
    monkeypatch.setattr(Session, "commit", fail_commit)
    body = {"full_name": "Race", "email": "race@example.com", "password": "Password123!", "role": "JOB_SEEKER"}

    response = client.post(f"{API}/auth/register", json=body)
    assert response.status_code == 409
    assert response.json()["detail"] == DUPLICATE_EMAIL

    # the failed sign up was rolled back, so the email is still free
    monkeypatch.undo()
    assert client.post(f"{API}/auth/register", json=body).status_code == 201


# applications.py: two clicks on Apply at the same time

def test_apply_race_on_same_job_is_409(client, auth_headers, monkeypatch):
    resume_id = upload(client, auth_headers).json()["id"]
    db = new_session()
    job = Job(title="Data Intern", company="CareerNet", location="Montreal",
              category="Software", description="Clean data.")
    db.add(job)
    db.commit()
    job_id = job.id
    db.close()

    monkeypatch.setattr(Session, "commit", fail_commit)
    response = client.post(f"{API}/applications", json={"job_id": job_id, "resume_id": resume_id},
                           headers=auth_headers)
    assert response.status_code == 409
    assert response.json()["detail"] == ALREADY_APPLIED

    # the failed apply was rolled back, so no application was saved
    monkeypatch.undo()
    db = new_session()
    assert db.query(Application).count() == 0
    db.close()


# routers/notifications.py: the interview date shown with a notification

def test_notification_shows_the_interview_date(client):
    headers, user_id = login_as(client, "seeker@example.com")
    _, application_id = make_job_and_application(user_id, interview_at=INTERVIEW)
    add_notification(user_id, application_id)

    items = client.get(f"{API}/notifications", headers=headers).json()["items"]
    assert len(items) == 1
    assert items[0]["application_id"] == application_id
    assert items[0]["interview_at"].startswith("2030-01-15T14:00")


def test_notification_without_interview_date_has_none(client):
    headers, user_id = login_as(client, "seeker@example.com")
    _, application_id = make_job_and_application(user_id, interview_at=None)
    add_notification(user_id, application_id)

    items = client.get(f"{API}/notifications", headers=headers).json()["items"]
    assert items[0]["interview_at"] is None


def test_notification_for_a_missing_application_has_no_date(client):
    headers, user_id = login_as(client, "seeker@example.com")
    add_notification(user_id, application_id=9999)  # the application doesn't exist anymore

    items = client.get(f"{API}/notifications", headers=headers).json()["items"]
    assert items[0]["application_id"] == 9999
    assert items[0]["interview_at"] is None


# database/connection.py: get_db always closes the session

class FakeSession:
    def __init__(self):
        self.closed = False

    def close(self):
        self.closed = True


def test_get_db_closes_the_session_after_the_request(monkeypatch):
    fake = FakeSession()
    monkeypatch.setattr(connection, "SessionLocal", lambda: fake)

    requests = connection.get_db()
    assert next(requests) is fake
    assert fake.closed is False  # still open during the request

    requests.close()  # the request is done
    assert fake.closed is True
