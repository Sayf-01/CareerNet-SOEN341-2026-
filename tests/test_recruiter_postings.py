from datetime import datetime, timedelta, timezone

from tests.conftest import API
from tests.test_recruiter import JOB, login_as, add_application

from App.main import app
from App.database.connection import get_db
from App.models.job import Job


def create_job(client, headers, title="Developer"):
    """Create a posting using the existing recruiter endpoint."""
    response = client.post(
        f"{API}/recruiter/jobs",
        json={**JOB, "title": title},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_recruiter_with_no_postings(client):
    recruiter, _ = login_as(
        client, "recruiter@example.com", "RECRUITER"
    )

    response = client.get(
        f"{API}/recruiter/jobs", headers=recruiter
    )

    assert response.status_code == 200
    assert response.json() == []


def test_recruiter_sees_only_own_postings(client):
    recruiter1, _ = login_as(
        client, "recruiter1@example.com", "RECRUITER"
    )
    recruiter2, _ = login_as(
        client, "recruiter2@example.com", "RECRUITER"
    )

    own_job_id = create_job(client, recruiter1, "My Job")
    create_job(client, recruiter2, "Someone Else's Job")

    response = client.get(
        f"{API}/recruiter/jobs", headers=recruiter1
    )

    assert response.status_code == 200

    jobs = response.json()
    assert len(jobs) == 1
    assert jobs[0]["id"] == own_job_id
    assert jobs[0]["title"] == "My Job"


def test_application_count_includes_zero(client):
    recruiter, _ = login_as(
        client, "recruiter@example.com", "RECRUITER"
    )
    _, seeker1_id = login_as(
        client, "seeker1@example.com", "JOB_SEEKER"
    )
    _, seeker2_id = login_as(
        client, "seeker2@example.com", "JOB_SEEKER"
    )

    job_with_apps = create_job(
        client, recruiter, "Job With Applications"
    )
    job_without_apps = create_job(
        client, recruiter, "Job Without Applications"
    )

    add_application(seeker1_id, job_with_apps)
    add_application(seeker2_id, job_with_apps)

    response = client.get(
        f"{API}/recruiter/jobs", headers=recruiter
    )

    assert response.status_code == 200

    counts = {
        job["id"]: job["application_count"]
        for job in response.json()
    }

    assert counts[job_with_apps] == 2
    assert counts[job_without_apps] == 0


def test_postings_are_newest_first(client):
    recruiter, _ = login_as(
        client, "recruiter@example.com", "RECRUITER"
    )

    older_id = create_job(client, recruiter, "Older Job")
    newer_id = create_job(client, recruiter, "Newer Job")

    db = next(app.dependency_overrides[get_db]())

    try:
        now = datetime.now(timezone.utc)

        older = db.get(Job, older_id)
        newer = db.get(Job, newer_id)

        older.posted_at = now - timedelta(days=5)
        newer.posted_at = now

        db.commit()
    finally:
        db.close()

    response = client.get(
        f"{API}/recruiter/jobs", headers=recruiter
    )

    assert response.status_code == 200

    ids = [job["id"] for job in response.json()]
    assert ids == [newer_id, older_id]


def test_job_seeker_cannot_list_recruiter_postings(client):
    seeker, _ = login_as(
        client, "seeker@example.com", "JOB_SEEKER"
    )

    response = client.get(
        f"{API}/recruiter/jobs", headers=seeker
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Recruiter access required"


def test_listing_postings_requires_login(client):
    response = client.get(f"{API}/recruiter/jobs")

    assert response.status_code == 401
