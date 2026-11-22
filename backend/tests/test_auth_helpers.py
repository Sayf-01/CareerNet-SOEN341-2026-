# KA-9 tests: every protected route answers login problems the same way.

from datetime import datetime, timedelta, timezone

import jwt
import pytest

from tests.conftest import API
from App.main import app
from App.core.security import ALGORITHM, SECRET_KEY
from App.database.connection import get_db
from App.models.user import User

JOB = {
    "title": "Frontend Developer",
    "company": "Acme",
    "location": "Montreal",
    "category": "Software Development",
    "description": "Build the job board UI in React.",
}

# One route from each old helper: profile used deps.py, jobs and recruiter used dependencies.py
ROUTES = [
    ("get", f"{API}/profile/me"),
    ("get", f"{API}/jobs"),
    ("post", f"{API}/recruiter/jobs"),
]

# No header, a header without "Bearer", and a fake token
BAD_HEADERS = [
    {},
    {"Authorization": "Token abc"},
    {"Authorization": "Bearer garbage"},
]


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


def call(client, method, url, headers):
    # sends the request; the recruiter route gets a valid job body
    if method == "post":
        return client.post(url, json=JOB, headers=headers)
    return client.get(url, headers=headers)


@pytest.mark.parametrize("method,url", ROUTES)
@pytest.mark.parametrize("headers", BAD_HEADERS)
def test_bad_login_gives_same_401(client, method, url, headers):
    # every route gives the same 401 message for every kind of bad login
    response = call(client, method, url, headers)
    assert response.status_code == 401
    assert response.json()["detail"] == "Not logged in."


@pytest.mark.parametrize("method,url", ROUTES)
def test_expired_token_gives_401(client, method, url):
    # a real signed token whose time ran out an hour ago
    _, user_id = login_as(client, "old@example.com", "RECRUITER")
    past = datetime.now(timezone.utc) - timedelta(hours=1)
    token = jwt.encode({"sub": str(user_id), "exp": past}, SECRET_KEY, algorithm=ALGORITHM)
    response = call(client, method, url, {"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Not logged in."


@pytest.mark.parametrize("method,url", ROUTES)
def test_deleted_user_gives_401(client, method, url):
    # the token is valid, but the account no longer exists
    headers, user_id = login_as(client, "gone@example.com", "RECRUITER")
    db = next(app.dependency_overrides[get_db]())
    db.delete(db.get(User, user_id))
    db.commit()
    db.close()
    response = call(client, method, url, headers)
    assert response.status_code == 401
    assert response.json()["detail"] == "Not logged in."


def test_job_seeker_on_recruiter_route_gives_403(client):
    # logged in, but the wrong type of user
    headers, _ = login_as(client, "seeker@example.com", "JOB_SEEKER")
    response = client.post(f"{API}/recruiter/jobs", json=JOB, headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Recruiter access required"


def test_recruiter_route_still_works_when_logged_in(client):
    # sanity check: a real recruiter can still create a job
    headers, _ = login_as(client, "rec@example.com", "RECRUITER")
    response = client.post(f"{API}/recruiter/jobs", json=JOB, headers=headers)
    assert response.status_code == 201