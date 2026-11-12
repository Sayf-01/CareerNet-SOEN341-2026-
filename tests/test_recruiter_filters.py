from datetime import datetime, timezone

from tests.conftest import API
from tests.test_recruiter import JOB, login_as, add_application

from App.main import app
from App.database.connection import get_db
from App.models.application import Application


def create_job(client, recruiter):
    response = client.post(
        f"{API}/recruiter/jobs",
        json=JOB,
        headers=recruiter,
    )
    assert response.status_code == 201
    return response.json()["id"]


def make_application(user_id, job_id, applied_at, status="Applied"):
    """Create an application with a controlled date and status."""
    db = next(app.dependency_overrides[get_db]())

    try:
        application = Application(
            user_id=user_id,
            job_id=job_id,
            status=status,
            applied_at=datetime.fromisoformat(applied_at),
        )
        db.add(application)
        db.commit()
        db.refresh(application)
        return application.id
    finally:
        db.close()


def setup_applications(client):
    recruiter, _ = login_as(
        client, "recruiter@example.com", "RECRUITER"
    )
    job_id = create_job(client, recruiter)

    _, seeker1 = login_as(
        client, "seeker1@example.com", "JOB_SEEKER"
    )
    _, seeker2 = login_as(
        client, "seeker2@example.com", "JOB_SEEKER"
    )
    _, seeker3 = login_as(
        client, "seeker3@example.com", "JOB_SEEKER"
    )

    app1 = make_application(
        seeker1, job_id, "2026-11-01T00:00:00+00:00", "Applied"
    )
    app2 = make_application(
        seeker2, job_id, "2026-11-05T12:00:00+00:00", "Interview"
    )
    app3 = make_application(
        seeker3, job_id, "2026-11-10T23:59:59+00:00", "Applied"
    )

    return recruiter, job_id, app1, app2, app3


def test_no_filters_returns_all_applications(client):
    recruiter, job_id, app1, app2, app3 = setup_applications(client)

    response = client.get(
        f"{API}/recruiter/jobs/{job_id}/applications",
        headers=recruiter,
    )

    assert response.status_code == 200
    assert [a["application_id"] for a in response.json()] == [
        app3, app2, app1
    ]


def test_status_filter(client):
    recruiter, job_id, app1, app2, app3 = setup_applications(client)

    response = client.get(
        f"{API}/recruiter/jobs/{job_id}/applications",
        params={"status": "Applied"},
        headers=recruiter,
    )

    assert response.status_code == 200
    assert {a["application_id"] for a in response.json()} == {
        app1, app3
    }


def test_date_filter_includes_both_boundaries(client):
    recruiter, job_id, app1, app2, app3 = setup_applications(client)

    response = client.get(
        f"{API}/recruiter/jobs/{job_id}/applications",
        params={
            "date_from": "2026-11-01",
            "date_to": "2026-11-10",
        },
        headers=recruiter,
    )

    assert response.status_code == 200
    assert {a["application_id"] for a in response.json()} == {
        app1, app2, app3
    }


def test_status_and_dates_work_together(client):
    recruiter, job_id, app1, app2, app3 = setup_applications(client)

    response = client.get(
        f"{API}/recruiter/jobs/{job_id}/applications",
        params={
            "status": "Applied",
            "date_from": "2026-11-05",
            "date_to": "2026-11-10",
        },
        headers=recruiter,
    )

    assert response.status_code == 200
    assert [a["application_id"] for a in response.json()] == [app3]


def test_invalid_status_returns_400(client):
    recruiter, job_id, *_ = setup_applications(client)

    response = client.get(
        f"{API}/recruiter/jobs/{job_id}/applications",
        params={"status": "RandomStatus"},
        headers=recruiter,
    )

    assert response.status_code == 400


def test_invalid_date_returns_400(client):
    recruiter, job_id, *_ = setup_applications(client)

    response = client.get(
        f"{API}/recruiter/jobs/{job_id}/applications",
        params={"date_from": "not-a-date"},
        headers=recruiter,
    )

    assert response.status_code == 400


def test_reversed_date_range_returns_400(client):
    recruiter, job_id, *_ = setup_applications(client)

    response = client.get(
        f"{API}/recruiter/jobs/{job_id}/applications",
        params={
            "date_from": "2026-11-10",
            "date_to": "2026-11-01",
        },
        headers=recruiter,
    )

    assert response.status_code == 400


def test_other_recruiter_cannot_filter_applications(client):
    owner, job_id, *_ = setup_applications(client)

    other, _ = login_as(
        client, "other@example.com", "RECRUITER"
    )

    response = client.get(
        f"{API}/recruiter/jobs/{job_id}/applications",
        params={"status": "Applied"},
        headers=other,
    )

    assert response.status_code == 404