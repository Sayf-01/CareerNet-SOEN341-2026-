from datetime import datetime, timedelta, timezone
from App.core.rate_limit import RateLimiter, feedback_limiter
from tests.conftest import API
from tests.resume_samples import SAMPLE_RESUME_TEXT, make_pdf_bytes
from tests.test_profile import login_as

NOW = datetime(2026, 11, 13, 12, 0, tzinfo=timezone.utc)  # fixed time so tests never depend on the clock


def test_five_pass_and_the_sixth_is_refused():
    limiter = RateLimiter()
    for i in range(5):
        assert limiter.allow(1, now=NOW + timedelta(minutes=i)) is True
    assert limiter.allow(1, now=NOW + timedelta(minutes=5)) is False


def test_passes_again_after_60_minutes():
    limiter = RateLimiter()
    for _ in range(5):
        limiter.allow(1, now=NOW)
    assert limiter.allow(1, now=NOW + timedelta(minutes=59)) is False  # still inside the hour
    assert limiter.allow(1, now=NOW + timedelta(minutes=60)) is True  # the old ones expired


def test_two_users_do_not_share_a_count():
    limiter = RateLimiter()
    for _ in range(5):
        limiter.allow(1, now=NOW)
    assert limiter.allow(1, now=NOW) is False  # user 1 is out
    assert limiter.allow(2, now=NOW) is True  # user 2 is not affected


def test_reset_clears_everyone():
    limiter = RateLimiter()
    for _ in range(5):
        limiter.allow(1, now=NOW)
    limiter.reset()
    assert limiter.allow(1, now=NOW) is True


def test_feedback_endpoint_returns_429_after_5_calls(client):
    # the endpoint in fake mode: 5 requests work, the 6th is refused
    feedback_limiter.reset()
    seeker = login_as(client, "seeker@example.com")
    upload = client.post(f"{API}/resumes", headers=seeker,
                         files={"file": ("cv.pdf", make_pdf_bytes(SAMPLE_RESUME_TEXT), "application/pdf")})
    resume_id = upload.json()["id"]

    for _ in range(5):
        assert client.post(f"{API}/resumes/{resume_id}/feedback", headers=seeker).status_code == 200

    response = client.post(f"{API}/resumes/{resume_id}/feedback", headers=seeker)
    assert response.status_code == 429
    assert response.json()["detail"] == "You asked for feedback several times. Please try again later."