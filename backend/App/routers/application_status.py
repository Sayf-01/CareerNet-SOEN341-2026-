from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from App.core.dependencies import get_current_user
from App.database.connection import get_db
from App.models.application import Application
from App.models.job import Job
from App.models.user import User, UserRole
from App.schemas.application import (
    ApplicationListItem,
    ApplicationStatusUpdate,
    ApplicationStatusResponse,
)
from App.crud.notifications import notify_status_change

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("/me", response_model=list[ApplicationListItem])
def my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return applications belonging to the logged-in user."""

    results = (
        db.query(Application, Job)
        .join(Job, Application.job_id == Job.id)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.applied_at.desc(), Application.id.desc())
        .all()
    )

    return [
        ApplicationListItem(
            id=application.id,
            job_title=job.title,
            company=job.company,
            status=application.status,
            applied_at=application.applied_at,
            updated_at=application.updated_at,
            interview_at=application.interview_at,
        )
        for application, job in results
    ]

@router.patch(
    "/{id}/status",
    response_model=ApplicationStatusResponse,
)
def update_application_status(
    id: int,
    data: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update status, interview date, and notify the job seeker."""

    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(
            status_code=403,
            detail="Recruiter access required",
        )

    result = (
        db.query(Application, Job)
        .join(Job, Application.job_id == Job.id)
        .filter(
            Application.id == id,
            Job.recruiter_id == current_user.id,
        )
        .first()
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    application, job = result
    new_status = data.status

    # Interview dates are only allowed for Interview status.
    if new_status != "Interview" and data.interview_at is not None:
        raise HTTPException(
            status_code=400,
            detail=(
                "interview_at is only allowed "
                "when the status is Interview"
            ),
        )

    # Normalize dates to UTC for consistent comparisons.
    def as_utc(value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    old_interview_at = as_utc(application.interview_at)

    if new_status == "Interview":
        if data.interview_at is not None:
            new_interview_at = as_utc(data.interview_at)
        else:
            # Keep any previously scheduled interview date.
            new_interview_at = old_interview_at
    else:
        # Remove the date when leaving Interview status.
        new_interview_at = None

    status_changed = application.status != new_status
    date_changed = old_interview_at != new_interview_at

    # Do not create notifications for repeated identical updates.
    if status_changed or date_changed:
        application.status = new_status
        application.interview_at = new_interview_at
        application.updated_at = datetime.now(timezone.utc)

        notify_status_change(
            db,
            user_id=application.user_id,
            application_id=application.id,
            job_title=job.title,
            new_status=new_status,
            interview_at=new_interview_at,
        )

        # Save both the application update and notification together.
        db.commit()
        db.refresh(application)

    return ApplicationStatusResponse(
        id=application.id,
        status=application.status,
        updated_at=application.updated_at,
        interview_at=application.interview_at,
    )