# LA-4 tests: GET /api/v1/applications/me/summary

from tests.conftest import API

JOB = {
    "title": "Frontend Developer",
    "company": "Acme",
    "location": "Montreal",
    "category": "Software Development",
    "description": "Build the job board UI in React.",
}

ALL_ZERO = {"Applied": 0, "Under Review": 0, "Interview": 0, "Offered": 0, "Rejected": 0}


# ---------- helpers (copied from tests/test_application_status.py) ----------

def login_as(client, email, role):
    client.post(
        f"{API}/auth/register",
        json={"full_name": "Test User", "email": email, "password": "Password123!", "role": role},
    )
    token = client.post(
        f"{API}/auth/login", json={"email": email, "password": "Password123!"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def post_job(client, recruiter):
    return client.post(f"{API}/recruiter/jobs", json=JOB, headers=recruiter).json()["id"]


def apply_to(client, seeker, job_id):
    # upload a resume, then apply with it
    resume_id = client.post(
        f"{API}/resumes",
        files={"file": ("cv.pdf", b"%PDF-1.4 test", "application/pdf")},
        headers=seeker,
    ).json()["id"]
    return client.post(
        f"{API}/applications", json={"job_id": job_id, "resume_id": resume_id}, headers=seeker
    ).json()["id"]


def set_status(client, headers, application_id, status):
    return client.patch(
        f"{API}/applications/{application_id}/status", json={"status": status}, headers=headers
    )


def summary(client, headers):
    return client.get(f"{API}/applications/me/summary", headers=headers)


# ---------- tests ----------

def test_new_user_gets_total_zero_and_five_zeros(client):
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")

    response = summary(client, seeker)

    assert response.status_code == 200
    assert response.json() == {"total": 0, "by_status": ALL_ZERO}


def test_counts_follow_status_changes(client):
    # 3 applications, then the recruiter moves one to Interview and one to Rejected
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")
    first = apply_to(client, seeker, post_job(client, recruiter))
    second = apply_to(client, seeker, post_job(client, recruiter))
    apply_to(client, seeker, post_job(client, recruiter))
    assert set_status(client, recruiter, first, "Interview").status_code == 200
    assert set_status(client, recruiter, second, "Rejected").status_code == 200

    body = summary(client, seeker).json()

    assert body["total"] == 3
    assert body["by_status"] == {**ALL_ZERO, "Applied": 1, "Interview": 1, "Rejected": 1}


def test_total_equals_sum_of_statuses(client):
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")
    apply_to(client, seeker, post_job(client, recruiter))
    apply_to(client, seeker, post_job(client, recruiter))

    body = summary(client, seeker).json()

    assert body["total"] == sum(body["by_status"].values()) == 2
    assert list(body["by_status"]) == ["Applied", "Under Review", "Interview", "Offered", "Rejected"]


def test_other_users_applications_are_not_counted(client):
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    alice = login_as(client, "alice@example.com", "JOB_SEEKER")
    bob = login_as(client, "bob@example.com", "JOB_SEEKER")
    apply_to(client, alice, post_job(client, recruiter))
    apply_to(client, alice, post_job(client, recruiter))

    assert summary(client, bob).json() == {"total": 0, "by_status": ALL_ZERO}
    assert summary(client, alice).json()["total"] == 2


def test_no_token_gives_401(client):
    assert client.get(f"{API}/applications/me/summary").status_code == 401

# ---------- LA-5: GET /applications/me/activity ----------

from datetime import datetime, timedelta, timezone

from App.database.connection import get_db
from App.main import app
from App.models.application import Application


def set_applied_at(application_id, days_ago):
    # Moves an application's date back in time, straight in the test database.
    db = next(app.dependency_overrides[get_db]())
    application = db.get(Application, application_id)
    application.applied_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
    db.commit()
    db.close()


def activity(client, headers, days=None):
    url = f"{API}/applications/me/activity" + (f"?days={days}" if days is not None else "")
    return client.get(url, headers=headers)


def utc_day(days_ago):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).date().isoformat()


def test_activity_default_is_30_days_ending_today(client):
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")

    response = activity(client, seeker)

    assert response.status_code == 200
    body = response.json()
    assert body["days"] == 30
    assert len(body["points"]) == 30
    assert body["points"][-1]["date"] == utc_day(0)   # ends today
    assert body["points"][0]["date"] == utc_day(29)   # oldest first
    assert all(point["count"] == 0 for point in body["points"])  # empty days show 0


def test_applications_appear_on_the_right_days(client):
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")
    apply_to(client, seeker, post_job(client, recruiter))
    apply_to(client, seeker, post_job(client, recruiter))
    three_days_ago = apply_to(client, seeker, post_job(client, recruiter))
    set_applied_at(three_days_ago, days_ago=3)

    points = {p["date"]: p["count"] for p in activity(client, seeker, days=7).json()["points"]}

    assert len(points) == 7
    assert points[utc_day(0)] == 2
    assert points[utc_day(3)] == 1
    assert points[utc_day(1)] == 0
    assert sum(points.values()) == 3


def test_applications_older_than_the_period_are_not_counted(client):
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")
    old = apply_to(client, seeker, post_job(client, recruiter))
    set_applied_at(old, days_ago=10)

    body = activity(client, seeker, days=7).json()

    assert sum(p["count"] for p in body["points"]) == 0


def test_days_outside_7_to_90_gives_400(client):
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")

    assert activity(client, seeker, days=6).status_code == 400
    assert activity(client, seeker, days=91).status_code == 400
    assert activity(client, seeker, days=90).status_code == 200


def test_activity_counts_only_my_applications(client):
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    alice = login_as(client, "alice@example.com", "JOB_SEEKER")
    bob = login_as(client, "bob@example.com", "JOB_SEEKER")
    apply_to(client, alice, post_job(client, recruiter))

    assert sum(p["count"] for p in activity(client, bob).json()["points"]) == 0
    assert sum(p["count"] for p in activity(client, alice).json()["points"]) == 1


def test_activity_without_token_gives_401(client):
    assert client.get(f"{API}/applications/me/activity").status_code == 401