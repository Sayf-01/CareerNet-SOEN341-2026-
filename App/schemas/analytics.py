from pydantic import BaseModel


class StatusSummary(BaseModel):
    """Answer of GET /applications/me/summary: how many of my applications are in each status."""

    total: int
    by_status: dict[str, int]  # always all five statuses, 0 when there are none