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


# ---------- YO-5: Edit and archive postings ----------

def test_edit_one_field_preserves_others(client):
    recruiter, _ = login_as(
        client, "edit@example.com", "RECRUITER"
    )
    job_id = create_job(client, recruiter, "Original Title")

    response = client.patch(
        f"{API}/recruiter/jobs/{job_id}",
        json={"title": "Updated Title"},
        headers=recruiter,
    )

    assert response.status_code == 200

    job = response.json()
    assert job["title"] == "Updated Title"
    assert job["company"] == JOB["company"]
    assert job["location"] == JOB["location"]
    assert job["category"] == JOB["category"]
    assert job["description"] == JOB["description"]


def test_empty_edit_body_returns_400(client):
    recruiter, _ = login_as(
        client, "empty@example.com", "RECRUITER"
    )
    job_id = create_job(client, recruiter)

    response = client.patch(
        f"{API}/recruiter/jobs/{job_id}",
        json={},
        headers=recruiter,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Send at least one field to change"
    )


def test_invalid_edit_category_returns_400(client):
    recruiter, _ = login_as(
        client, "category@example.com", "RECRUITER"
    )
    job_id = create_job(client, recruiter)

    response = client.patch(
        f"{API}/recruiter/jobs/{job_id}",
        json={"category": "Cooking"},
        headers=recruiter,
    )

    assert response.status_code == 400


def test_cannot_edit_another_recruiters_job(client):
    owner, _ = login_as(
        client, "owner@example.com", "RECRUITER"
    )
    other, _ = login_as(
        client, "other@example.com", "RECRUITER"
    )
    job_id = create_job(client, owner)

    response = client.patch(
        f"{API}/recruiter/jobs/{job_id}",
        json={"title": "Unauthorized Edit"},
        headers=other,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Job not found"


def test_job_seeker_cannot_edit_posting(client):
    recruiter, _ = login_as(
        client, "recruiter@example.com", "RECRUITER"
    )
    seeker, _ = login_as(
        client, "seeker@example.com", "JOB_SEEKER"
    )
    job_id = create_job(client, recruiter)

    response = client.patch(
        f"{API}/recruiter/jobs/{job_id}",
        json={"title": "Unauthorized Edit"},
        headers=seeker,
    )

    assert response.status_code == 403


def test_archive_hides_job_from_public_search(client):
    recruiter, _ = login_as(
        client, "archive@example.com", "RECRUITER"
    )
    seeker, _ = login_as(
        client, "seeker@example.com", "JOB_SEEKER"
    )
    job_id = create_job(client, recruiter, "Archive Test Job")

    response = client.post(
        f"{API}/recruiter/jobs/{job_id}/archive",
        headers=recruiter,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "archived"

    public_response = client.get(
        f"{API}/jobs",
        headers=seeker,
    )

    assert public_response.status_code == 200

    public_ids = [
        job["id"]
        for job in public_response.json()["items"]
    ]
    assert job_id not in public_ids

    recruiter_response = client.get(
        f"{API}/recruiter/jobs",
        headers=recruiter,
    )

    assert recruiter_response.status_code == 200
    assert any(
        job["id"] == job_id and job["status"] == "archived"
        for job in recruiter_response.json()
    )


def test_unarchive_restores_job_to_public_search(client):
    recruiter, _ = login_as(
        client, "reopen@example.com", "RECRUITER"
    )
    seeker, _ = login_as(
        client, "seeker@example.com", "JOB_SEEKER"
    )
    job_id = create_job(client, recruiter, "Reopen Test Job")

    client.post(
        f"{API}/recruiter/jobs/{job_id}/archive",
        headers=recruiter,
    )

    response = client.post(
        f"{API}/recruiter/jobs/{job_id}/unarchive",
        headers=recruiter,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "open"

    public_response = client.get(
        f"{API}/jobs",
        headers=seeker,
    )

    public_ids = [
        job["id"]
        for job in public_response.json()["items"]
    ]

    assert job_id in public_ids


def test_archiving_twice_is_allowed(client):
    recruiter, _ = login_as(
        client, "twice@example.com", "RECRUITER"
    )
    job_id = create_job(client, recruiter)

    first = client.post(
        f"{API}/recruiter/jobs/{job_id}/archive",
        headers=recruiter,
    )

    second = client.post(
        f"{API}/recruiter/jobs/{job_id}/archive",
        headers=recruiter,
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["status"] == "archived"


def test_archived_job_keeps_applications(client):
    recruiter, _ = login_as(
        client, "apps@example.com", "RECRUITER"
    )
    _, seeker_id = login_as(
        client, "seeker@example.com", "JOB_SEEKER"
    )
    job_id = create_job(client, recruiter)

    add_application(seeker_id, job_id)

    archive_response = client.post(
        f"{API}/recruiter/jobs/{job_id}/archive",
        headers=recruiter,
    )
    assert archive_response.status_code == 200

    response = client.get(
        f"{API}/recruiter/jobs/{job_id}/applications",
        headers=recruiter,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == "Applied"


def test_other_recruiter_cannot_archive_or_unarchive(client):
    owner, _ = login_as(
        client, "owner@example.com", "RECRUITER"
    )
    other, _ = login_as(
        client, "other@example.com", "RECRUITER"
    )
    job_id = create_job(client, owner)

    for action in ("archive", "unarchive"):
        response = client.post(
            f"{API}/recruiter/jobs/{job_id}/{action}",
            headers=other,
        )
        assert response.status_code == 404


def test_job_seeker_cannot_archive_or_unarchive(client):
    recruiter, _ = login_as(
        client, "owner@example.com", "RECRUITER"
    )
    seeker, _ = login_as(
        client, "seeker@example.com", "JOB_SEEKER"
    )
    job_id = create_job(client, recruiter)

    for action in ("archive", "unarchive"):
        response = client.post(
            f"{API}/recruiter/jobs/{job_id}/{action}",
            headers=seeker,
        )
        assert response.status_code == 403

def test_cannot_apply_to_archived_job(client):
    recruiter, _ = login_as(
        client, "recruiter@example.com", "RECRUITER"
    )
    seeker, _ = login_as(
        client, "seeker@example.com", "JOB_SEEKER"
    )

    job_id = create_job(client, recruiter, "Archived Job")

    archive_response = client.post(
        f"{API}/recruiter/jobs/{job_id}/archive",
        headers=recruiter,
    )
    assert archive_response.status_code == 200

    response = client.post(
        f"{API}/applications",
        json={
            "job_id": job_id,
            "resume_id": 999,
        },
        headers=seeker,
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "This job is closed."