# KA-13 tests for App/core/rate_limit.py

from datetime import datetime, timedelta, timezone

from App.core.rate_limit import RateLimiter

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