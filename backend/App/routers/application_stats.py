from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from App.application_statuses import ALL_STATUSES
from App.core.dependencies import get_current_user
from App.database.connection import get_db
from App.models.application import Application
from App.models.user import User
from App.schemas.analytics import ActivityOverTime, DayCount, StatusSummary

# Dashboard numbers for the logged-in job seeker (LA-4, LA-5).
router = APIRouter(prefix="/applications", tags=["application stats"])


@router.get("/me/summary", response_model=StatusSummary)
def my_status_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """How many of my applications are in each status. All five statuses are always listed."""
    # One row per status the user actually has, e.g. [("Applied", 2), ("Interview", 1)]
    rows = (
        db.query(Application.status, func.count(Application.id))
        .filter(Application.user_id == current_user.id)
        .group_by(Application.status)
        .all()
    )

    # Start every status at 0 (so the frontend chart always has five bars), then fill in the counts
    by_status = {status: 0 for status in ALL_STATUSES}
    for status, count in rows:
        if status in by_status:
            by_status[status] = count

    return StatusSummary(total=sum(by_status.values()), by_status=by_status)


@router.get("/me/activity", response_model=ActivityOverTime)
def my_activity(
    days: int = Query(30, ge=7, le=90),  # 7 to 90 days; anything else becomes a 400
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """How many applications I sent on each of the last `days` days (UTC), oldest first, 0 on empty days."""
    # All dates are UTC, so the answer is the same on every computer and in the tests.
    today = datetime.now(timezone.utc).date()
    first_day = today - timedelta(days=days - 1)  # e.g. days=30: today and the 29 days before

    # Read my application times since the start of the first day
    start = datetime.combine(first_day, datetime.min.time(), tzinfo=timezone.utc)
    applied_times = (
        db.query(Application.applied_at)
        .filter(Application.user_id == current_user.id, Application.applied_at >= start)
        .all()
    )

    # Count per day in Python (not SQL), so it works the same on PostgreSQL and SQLite
    counts = Counter()
    for (applied_at,) in applied_times:
        if applied_at.tzinfo is None:  # SQLite gives times without a time zone: treat them as UTC
            applied_at = applied_at.replace(tzinfo=timezone.utc)
        counts[applied_at.astimezone(timezone.utc).date()] += 1

    # One entry for every day in the range, using 0 when nothing was sent that day
    points = []
    for i in range(days):
        day = first_day + timedelta(days=i)
        points.append(DayCount(date=day.isoformat(), count=counts.get(day, 0)))

    return ActivityOverTime(days=days, points=points)