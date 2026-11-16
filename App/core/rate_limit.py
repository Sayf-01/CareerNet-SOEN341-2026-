# KA-13: limits how often each user can ask for AI resume feedback (5 per hour).
# Kept in memory: it resets when the server restarts, which is fine for this project.

from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock

MAX_REQUESTS = 5  # requests allowed per user...
WINDOW = timedelta(minutes=60)  # ...in this much time


class RateLimiter:
    def __init__(self, max_requests: int = MAX_REQUESTS, window: timedelta = WINDOW):
        self.max_requests = max_requests
        self.window = window
        self._requests = defaultdict(deque)  # user id -> times of their recent requests
        self._lock = Lock()  # two requests at once can't both slip through

    def allow(self, user_id: int, now: datetime | None = None) -> bool:
        """True (and records the request) if the user is under the limit, False otherwise."""
        now = now or datetime.now(timezone.utc)
        with self._lock:
            times = self._requests[user_id]
            # forget requests older than the window
            while times and now - times[0] >= self.window:
                times.popleft()
            if len(times) >= self.max_requests:
                return False
            times.append(now)
            return True

    def reset(self) -> None:
        """Clears every user's count (used by tests)."""
        with self._lock:
            self._requests.clear()


# The one shared limiter the feedback endpoint uses
feedback_limiter = RateLimiter()