from datetime import datetime, timezone

from tests.conftest import API
from tests.test_recruiter import JOB, login_as, add_application

from App.main import app
from App.database.connection import get_db
from App.models.application import Application
from App.models.notification import Notification


def setup_application(client):
    """Create a recruiter, a job seeker, a job and an application."""

    recruiter, _ = login_as(
        client, "recruiter@example.com", "RECRUITER"
    )
    seeker, seeker_id = login_as(
        client, "seeker@example.com", "JOB_SEEKER"
    )

    response = client.post(
        f"{API}/recruiter/jobs",
        json=JOB,
        headers=recruiter,
    )
    assert response.status_code == 201
    job_id = response.json()["id"]

    add_application(seeker_id, job_id)

    db = next(app.dependency_overrides[get_db]())
    try:
        application = db.query(Application).filter(
            Application.user_id == seeker_id,
            Application.job_id == job_id,
        ).first()

        application_id = application.id
    finally:
        db.close()

    return recruiter, seeker, seeker_id, job_id, application_id


def get_notifications(user_id):
    """Read saved notifications directly from the test database."""

    db = next(app.dependency_overrides[get_db]())
    try:
        notifications = db.query(Notification).filter(
            Notification.user_id == user_id
        ).order_by(Notification.id).all()

        return [
            {
                "type": notification.type,
                "message": notification.message,
                "application_id": notification.application_id,
            }
            for notification in notifications
        ]
    finally:
        db.close()


def set_status(client, recruiter, application_id, status, interview_at=None):
    body = {"status": status}

    if interview_at is not None:
        body["interview_at"] = interview_at

    return client.patch(
        f"{API}/applications/{application_id}/status",
        json=body,
        headers=recruiter,
    )


# ---------- YO-7 automated tests ----------


def test_status_change_creates_notification(client):
    recruiter, seeker, seeker_id, job_id, application_id = (
        setup_application(client)
    )

    response = set_status(
        client, recruiter, application_id, "Under Review"
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Under Review"

    notifications = get_notifications(seeker_id)

    assert len(notifications) == 1
    assert notifications[0]["type"] == "status_changed"
    assert notifications[0]["application_id"] == application_id


def test_interview_creates_invitation_and_saves_date(client):
    recruiter, seeker, seeker_id, job_id, application_id = (
        setup_application(client)
    )

    response = set_status(
        client,
        recruiter,
        application_id,
        "Interview",
        "2026-11-20T14:00:00Z",
    )

    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "Interview"
    assert datetime.fromisoformat(
        data["interview_at"].replace("Z", "+00:00")
    ).replace(tzinfo=timezone.utc) == datetime(
        2026, 11, 20, 14, 0, tzinfo=timezone.utc
    )

    notifications = get_notifications(seeker_id)

    assert len(notifications) == 1
    assert notifications[0]["type"] == "interview_invited"
    assert "November 20, 2026" in notifications[0]["message"]


def test_same_status_does_not_duplicate_notification(client):
    recruiter, seeker, seeker_id, job_id, application_id = (
        setup_application(client)
    )

    first = set_status(
        client, recruiter, application_id, "Under Review"
    )
    second = set_status(
        client, recruiter, application_id, "Under Review"
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert len(get_notifications(seeker_id)) == 1


def test_interview_date_change_creates_notification(client):
    recruiter, seeker, seeker_id, job_id, application_id = (
        setup_application(client)
    )

    first = set_status(
        client, recruiter, application_id,
        "Interview", "2026-11-20T14:00:00Z"
    )
    second = set_status(
        client, recruiter, application_id,
        "Interview", "2026-11-21T15:00:00Z"
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert len(get_notifications(seeker_id)) == 2


def test_interview_date_with_other_status_returns_400(client):
    recruiter, seeker, seeker_id, job_id, application_id = (
        setup_application(client)
    )

    response = set_status(
        client,
        recruiter,
        application_id,
        "Offered",
        "2026-11-20T14:00:00Z",
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "interview_at is only allowed when the status is Interview"
    )


def test_leaving_interview_clears_date(client):
    recruiter, seeker, seeker_id, job_id, application_id = (
        setup_application(client)
    )

    set_status(
        client,
        recruiter,
        application_id,
        "Interview",
        "2026-11-20T14:00:00Z",
    )

    response = set_status(
        client, recruiter, application_id, "Offered"
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Offered"
    assert response.json()["interview_at"] is None


def test_job_seeker_cannot_update_status(client):
    recruiter, seeker, seeker_id, job_id, application_id = (
        setup_application(client)
    )

    response = set_status(
        client, seeker, application_id, "Interview"
    )

    assert response.status_code == 403


def test_other_recruiter_cannot_update_status(client):
    recruiter, seeker, seeker_id, job_id, application_id = (
        setup_application(client)
    )

    other, _ = login_as(
        client, "other@example.com", "RECRUITER"
    )

    response = set_status(
        client, other, application_id, "Interview"
    )

    assert response.status_code == 404


def test_interview_date_visible_in_application_lists(client):
    recruiter, seeker, seeker_id, job_id, application_id = (
        setup_application(client)
    )

    set_status(
        client,
        recruiter,
        application_id,
        "Interview",
        "2026-11-20T14:00:00Z",
    )

    seeker_response = client.get(
        f"{API}/applications/me",
        headers=seeker,
    )

    assert seeker_response.status_code == 200
    assert seeker_response.json()[0]["interview_at"] is not None

    recruiter_response = client.get(
        f"{API}/recruiter/jobs/{job_id}/applications",
        headers=recruiter,
    )

    assert recruiter_response.status_code == 200
    assert recruiter_response.json()[0]["interview_at"] is not None