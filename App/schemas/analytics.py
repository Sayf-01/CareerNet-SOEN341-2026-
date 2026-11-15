from pydantic import BaseModel


class StatusSummary(BaseModel):
    """Answer of GET /applications/me/summary: how many of my applications are in each status."""

    total: int
    by_status: dict[str, int]  # always all five statuses, 0 when there are none

class DayCount(BaseModel):
    """How many applications were sent on one day."""

    date: str  # "YYYY-MM-DD" (UTC)
    count: int


class ActivityOverTime(BaseModel):
    """Answer of GET /applications/me/activity: one entry per day, oldest first, 0 on empty days."""

    days: int
    points: list[DayCount]