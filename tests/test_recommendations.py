"""LA-12 tests for GET /api/v1/jobs/recommendations.

Coverage targets (from the sprint guide):
  200 fake mode        – job seeker with a profile gets up to 5 results
  403 recruiter        – recruiter is rejected
  401 no token         – missing auth header is rejected
  409 empty profile    – no headline and no skills -> 409
  429 rate limit       – 6th request within the hour -> 429
  fallback on AI error – MatchingUnavailableError -> mode="fallback"
  applied jobs excluded – jobs the user applied to never appear
  max 5 items          – at most 5 recommendations
  scores 0-100         – every score is in range
  route reached        – FastAPI does NOT confuse "recommendations" with a job id
"""

import pytest
from unittest.mock import patch

from App.core.rate_limit import recommendations_limiter
from App.main import app
from App.database.connection import get_db
from App.models.application import Application
from App.models.job import Job
from App.models.profile import Profile
from App.models.user import User, UserRole
from tests.conftest import API


# ---------- autouse reset so tests don't bleed into each other ----------

@pytest.fixture(autouse=True)
def reset_recommendations_limit():
    recommendations_limiter.reset()
    yield


# ---------- helpers ----------

def _new_session():
    return next(app.dependency_overrides[get_db]())


def _register_and_login(client, email, role="JOB_SEEKER"):
    client.post(
        f"{API}/auth/register",
        json={
            "full_name": "Test User",
            "email": email,
            "password": "Password123!",
            "role": role,
        },
    )
    token = client.post(
        f"{API}/auth/login",
        json={"email": email, "password": "Password123!"},
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _make_job(db, title="Python Developer", description="Build APIs with Python.",
              location="Montreal", category="Software Development", status="open"):
    job = Job(
        title=title,
        company="Acme Corp",
        location=location,
        category=category,
        description=description,
        status=status,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def _add_profile(db, user_id, headline="Python Developer", skills=None, location="Montreal"):
    profile = Profile(
        user_id=user_id,
        headline=headline,
        skills=skills or ["Python", "FastAPI"],
        location=location,
    )
    db.add(profile)
    db.commit()
    return profile


def _get_user_id(db, email):
    return db.query(User).filter(User.email == email).first().id


def get_recs(client, headers):
    return client.get(f"{API}/jobs/recommendations", headers=headers)


# ---------- tests ----------

def test_route_is_reached_not_treated_as_job_id(client):
    """FastAPI must NOT read "recommendations" as an integer job id (would give 422)."""
    # Even without a profile the response must be 401 or 409 or 200, never 422.
    headers = _register_and_login(client, "reach@example.com")
    r = get_recs(client, headers)
    assert r.status_code != 422, "Route was matched as /{id} — move /recommendations above /{id}"


def test_no_token_gives_401(client):
    r = client.get(f"{API}/jobs/recommendations")
    assert r.status_code == 401


def test_recruiter_gives_403(client):
    headers = _register_and_login(client, "recruiter@example.com", role="RECRUITER")
    r = get_recs(client, headers)
    assert r.status_code == 403


def test_empty_profile_gives_409(client):
    """No headline and no skills → 409 with the prescribed detail message."""
    headers = _register_and_login(client, "noprofile@example.com")
    r = get_recs(client, headers)
    assert r.status_code == 409
    assert r.json()["detail"] == "Add skills or a headline to your profile first."


def test_profile_with_only_skills_no_headline_gives_200(client):
    """Skills alone (no headline) are enough to pass the 409 check."""
    headers = _register_and_login(client, "skillsonly@example.com")
    db = _new_session()
    uid = _get_user_id(db, "skillsonly@example.com")
    _add_profile(db, uid, headline="", skills=["Python"])

    r = get_recs(client, headers)
    assert r.status_code == 200


def test_job_seeker_with_profile_gets_200_in_fake_mode(client):
    """Happy path: job seeker with matching jobs gets a 200 RecommendationList."""
    headers = _register_and_login(client, "seeker@example.com")
    db = _new_session()
    uid = _get_user_id(db, "seeker@example.com")
    _add_profile(db, uid)
    _make_job(db)

    r = get_recs(client, headers)
    assert r.status_code == 200
    body = r.json()
    assert "items" in body
    assert "mode" in body
    assert "resume_used" in body
    assert body["mode"] in {"ai", "fake", "fallback"}


def test_response_shape_matches_recommendation_list(client):
    """Every field in the contract is present."""
    headers = _register_and_login(client, "shape@example.com")
    db = _new_session()
    uid = _get_user_id(db, "shape@example.com")
    _add_profile(db, uid)
    _make_job(db)

    body = get_recs(client, headers).json()
    assert set(body.keys()) >= {"items", "mode", "resume_used", "message"}
    for item in body["items"]:
        assert set(item.keys()) >= {"job_id", "title", "company", "location", "category", "score", "reasons"}


def test_scores_are_between_0_and_100(client):
    """No score may be below 0 or above 100."""
    headers = _register_and_login(client, "scores@example.com")
    db = _new_session()
    uid = _get_user_id(db, "scores@example.com")
    _add_profile(db, uid)
    for i in range(8):
        _make_job(db, title=f"Python Developer {i}")

    body = get_recs(client, headers).json()
    for item in body["items"]:
        assert 0 <= item["score"] <= 100


def test_at_most_5_items(client):
    """Even with many matching jobs the response has at most 5 items."""
    headers = _register_and_login(client, "max5@example.com")
    db = _new_session()
    uid = _get_user_id(db, "max5@example.com")
    _add_profile(db, uid)
    for i in range(10):
        _make_job(db, title=f"Python Developer {i}", description="Python FastAPI backend")

    body = get_recs(client, headers).json()
    assert len(body["items"]) <= 5


def test_applied_jobs_never_appear(client):
    """Jobs the user has already applied to must not be recommended."""
    headers = _register_and_login(client, "applied@example.com")
    db = _new_session()
    uid = _get_user_id(db, "applied@example.com")
    _add_profile(db, uid)

    job = _make_job(db, title="Python Developer", description="Python FastAPI backend roles")

    # Apply to the only job
    application = Application(user_id=uid, job_id=job.id, status="pending")
    db.add(application)
    db.commit()

    body = get_recs(client, headers).json()
    returned_ids = [item["job_id"] for item in body["items"]]
    assert job.id not in returned_ids


def test_rate_limit_gives_429_on_sixth_request(client):
    """The 6th request within the hour must be rejected with 429."""
    headers = _register_and_login(client, "ratelimit@example.com")
    db = _new_session()
    uid = _get_user_id(db, "ratelimit@example.com")
    _add_profile(db, uid)
    _make_job(db)

    for _ in range(5):
        r = get_recs(client, headers)
        assert r.status_code == 200

    r = get_recs(client, headers)
    assert r.status_code == 429


def test_ai_error_gives_fallback_mode(client):
    """When match_jobs raises MatchingUnavailableError the endpoint falls back gracefully."""
    headers = _register_and_login(client, "fallback@example.com")
    db = _new_session()
    uid = _get_user_id(db, "fallback@example.com")
    _add_profile(db, uid)
    _make_job(db, title="Python Developer", description="Python FastAPI work")

    from App.services.ai_matching import MatchingUnavailableError

    with patch("App.routers.jobs.match_jobs", side_effect=MatchingUnavailableError("boom")):
        r = get_recs(client, headers)

    assert r.status_code == 200
    assert r.json()["mode"] == "fallback"


def test_other_users_data_not_included(client):
    """The response items must only contain jobs, never other users' personal data."""
    headers_a = _register_and_login(client, "usera@example.com")
    headers_b = _register_and_login(client, "userb@example.com")
    db = _new_session()
    uid_a = _get_user_id(db, "usera@example.com")
    uid_b = _get_user_id(db, "userb@example.com")
    _add_profile(db, uid_a)
    _add_profile(db, uid_b)
    _make_job(db)

    body_a = get_recs(client, headers_a).json()
    body_b = get_recs(client, headers_b).json()

    # Verify there are no user ids / emails in the items
    for item in body_a["items"] + body_b["items"]:
        assert "user_id" not in item
        assert "email" not in item
        assert "phone" not in item



def test_resume_text_is_used_when_the_user_has_a_resume(client):
    """With a readable resume uploaded, the answer says the resume was used."""
    from tests.resume_samples import SAMPLE_RESUME_TEXT, make_pdf_bytes

    headers = _register_and_login(client, "withresume@example.com")
    db = _new_session()
    uid = _get_user_id(db, "withresume@example.com")
    _add_profile(db, uid)
    _make_job(db)
    client.post(
        f"{API}/resumes",
        files={"file": ("cv.pdf", make_pdf_bytes(SAMPLE_RESUME_TEXT), "application/pdf")},
        headers=headers,
    )

    r = get_recs(client, headers)

    assert r.status_code == 200
    assert r.json()["resume_used"] is True


def test_unreadable_resume_does_not_block_recommendations(client):
    """A resume whose text cannot be read is skipped, not an error."""
    headers = _register_and_login(client, "scan@example.com")
    db = _new_session()
    uid = _get_user_id(db, "scan@example.com")
    _add_profile(db, uid)
    _make_job(db)
    client.post(
        f"{API}/resumes",
        files={"file": ("cv.doc", b"old word file", "application/msword")},
        headers=headers,
    )

    r = get_recs(client, headers)

    assert r.status_code == 200
    assert r.json()["resume_used"] is False
