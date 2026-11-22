# SA-9 tests for the recruiter endpoints (YO-3)

from tests.conftest import API
from App.main import app
from App.database.connection import get_db
from App.models.application import Application

JOB = {
    "title": "Frontend Developer",
    "company": "Acme",
    "location": "Montreal",
    "category": "Software Development",
    "description": "Build the job board UI in React.",
}


def login_as(client, email, role):
    # registers a user with this role and returns their token header + user id
    user = client.post(
        f"{API}/auth/register",
        json={"full_name": "Test User", "email": email, "password": "Password123!", "role": role},
    ).json()["user"]
    token = client.post(
        f"{API}/auth/login", json={"email": email, "password": "Password123!"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, user["id"]


def add_application(user_id, job_id):
    # the apply endpoint isn't merged yet, so put the application in the db directly
    db = next(app.dependency_overrides[get_db]())
    db.add(Application(user_id=user_id, job_id=job_id))
    db.commit()
    db.close()


# ---------- creating jobs ----------

def test_create_job_requires_login(client):
    response = client.post(f"{API}/recruiter/jobs", json=JOB)
    assert response.status_code == 401


def test_job_seeker_cannot_create_job(client):
    seeker, _ = login_as(client, "seeker@example.com", "JOB_SEEKER")

    response = client.post(f"{API}/recruiter/jobs", json=JOB, headers=seeker)

    assert response.status_code == 403
    assert response.json() == {"detail": "Recruiter access required"}


def test_recruiter_creates_job(client):
    recruiter, _ = login_as(client, "recruiter@example.com", "RECRUITER")

    response = client.post(f"{API}/recruiter/jobs", json=JOB, headers=recruiter)

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == JOB["title"]
    assert body["category"] == JOB["category"]
    assert body["status"] == "open"


def test_created_job_shows_up_in_job_list(client):
    recruiter, _ = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker, _ = login_as(client, "seeker@example.com", "JOB_SEEKER")
    client.post(f"{API}/recruiter/jobs", json=JOB, headers=recruiter)

    response = client.get(f"{API}/jobs", headers=seeker)

    assert [job["title"] for job in response.json()["items"]] == [JOB["title"]]


# validation errors are 400 in this project (see the API cheat sheet)

def test_missing_field_is_rejected(client):
    recruiter, _ = login_as(client, "recruiter@example.com", "RECRUITER")
    no_title = {k: v for k, v in JOB.items() if k != "title"}

    response = client.post(f"{API}/recruiter/jobs", json=no_title, headers=recruiter)

    assert response.status_code == 400


def test_blank_field_is_rejected(client):
    recruiter, _ = login_as(client, "recruiter@example.com", "RECRUITER")

    response = client.post(f"{API}/recruiter/jobs", json={**JOB, "title": "   "}, headers=recruiter)

    assert response.status_code == 400


def test_unknown_category_is_rejected(client):
    recruiter, _ = login_as(client, "recruiter@example.com", "RECRUITER")

    response = client.post(f"{API}/recruiter/jobs", json={**JOB, "category": "Cooking"}, headers=recruiter)

    assert response.status_code == 400


# ---------- viewing applicants ----------

def test_recruiter_sees_applicants_for_own_job(client):
    recruiter, _ = login_as(client, "recruiter@example.com", "RECRUITER")
    _, seeker_id = login_as(client, "seeker@example.com", "JOB_SEEKER")
    job_id = client.post(f"{API}/recruiter/jobs", json=JOB, headers=recruiter).json()["id"]
    add_application(seeker_id, job_id)

    response = client.get(f"{API}/recruiter/jobs/{job_id}/applications", headers=recruiter)

    assert response.status_code == 200
    applications = response.json()
    assert len(applications) == 1
    # no profile yet, so the name falls back to the email
    assert applications[0]["applicant_name"] == "seeker@example.com"
    assert applications[0]["status"] == "Applied"


def test_job_with_no_applications_returns_empty_list(client):
    recruiter, _ = login_as(client, "recruiter@example.com", "RECRUITER")
    job_id = client.post(f"{API}/recruiter/jobs", json=JOB, headers=recruiter).json()["id"]

    response = client.get(f"{API}/recruiter/jobs/{job_id}/applications", headers=recruiter)

    assert response.status_code == 200
    assert response.json() == []


def test_cannot_see_another_recruiters_applicants(client):
    owner, _ = login_as(client, "owner@example.com", "RECRUITER")
    other, _ = login_as(client, "other@example.com", "RECRUITER")
    job_id = client.post(f"{API}/recruiter/jobs", json=JOB, headers=owner).json()["id"]

    response = client.get(f"{API}/recruiter/jobs/{job_id}/applications", headers=other)

    assert response.status_code == 404