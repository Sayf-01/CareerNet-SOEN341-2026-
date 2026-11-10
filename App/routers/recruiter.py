from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.core.dependencies import require_recruiter
from App.database.connection import get_db
from App.models.user import User
from App.models.job import Job
from App.models.application import Application
from App.models.profile import Profile
from App.schemas.job import JobDetail
from App.schemas.recruiter import CreateJobRequest, ReceivedApplication
from datetime import date, datetime, time, timedelta, timezone
from App.application_statuses import ALL_STATUSES

router = APIRouter(prefix="/recruiter", tags=["recruiter"])


@router.post("/jobs", response_model=JobDetail, status_code=status.HTTP_201_CREATED)
def create_job(
    data: CreateJobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """Allow a recruiter to create a job posting."""

    new_job = Job(
        recruiter_id=current_user.id,
        title=data.title,
        company=data.company,
        location=data.location,
        category=data.category,
        description=data.description,
        status="open",
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job


@router.get(
    "/jobs/{id}/applications",
    response_model=list[ReceivedApplication],
)
def get_job_applications(
    id: int,
    status: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """View and filter applications for the recruiter's own job."""

    # Verify that the recruiter owns this job.
    job = (
        db.query(Job)
        .filter(
            Job.id == id,
            Job.recruiter_id == current_user.id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    # Validate application status.
    if status is not None and status not in ALL_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid application status",
        )

    # Validate date range.
    if (
        date_from is not None
        and date_to is not None
        and date_from > date_to
    ):
        raise HTTPException(
            status_code=400,
            detail="date_from cannot be after date_to",
        )

    # Start with all applications for this job.
    query = (
        db.query(Application, User, Profile)
        .join(User, Application.user_id == User.id)
        .outerjoin(Profile, Profile.user_id == User.id)
        .filter(Application.job_id == id)
    )

    # Apply the optional status filter.
    if status is not None:
        query = query.filter(Application.status == status)

    # Include the entire starting day (UTC).
    if date_from is not None:
        start = datetime.combine(
            date_from, time.min, tzinfo=timezone.utc
        )
        query = query.filter(Application.applied_at >= start)

    # Include the entire ending day (UTC).
    if date_to is not None:
        end = datetime.combine(
            date_to + timedelta(days=1),
            time.min,
            tzinfo=timezone.utc,
        )
        query = query.filter(Application.applied_at < end)

    # Return newest applications first.
    results = (
        query.order_by(Application.applied_at.desc())
        .all()
    )

    return [
        ReceivedApplication(
            application_id=application.id,
            applicant_name=(
                profile.full_name
                if profile and profile.full_name
                else user.email
            ),
            resume_id=application.resume_id,
            status=application.status,
            applied_at=application.applied_at,
        )
        for application, user, profile in results
    ]