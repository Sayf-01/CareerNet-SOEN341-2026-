from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from App.application_statuses import ALL_STATUSES
from App.core.dependencies import get_current_user
from App.database.connection import get_db
from App.models.application import Application
from App.models.user import User
from App.schemas.analytics import StatusSummary

# Dashboard numbers for the logged-in job seeker (LA-4).
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