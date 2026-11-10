from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from App.core.dependencies import require_recruiter
from App.database.connection import get_db
from App.models.user import User
from App.models.job import Job
from App.models.application import Application
from App.models.profile import Profile
from App.schemas.job import JobDetail
from App.schemas.recruiter import CreateJobRequest, ReceivedApplication, RecruiterJobListItem, JobUpdate
from App.job_statuses import OPEN, ARCHIVED

router = APIRouter(prefix="/recruiter", tags=["recruiter"])
@router.get("/jobs", response_model=list[RecruiterJobListItem])
def list_my_postings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """List all postings belonging to the logged-in recruiter."""

    results = (
        db.query(Job, func.count(Application.id))
        .outerjoin(Application, Application.job_id == Job.id)
        .filter(Job.recruiter_id == current_user.id)
        .group_by(Job.id)
        .order_by(Job.posted_at.desc(), Job.id.desc())
        .all()
    )

    return [
        RecruiterJobListItem(
            id=job.id,
            title=job.title,
            company=job.company,
            location=job.location,
            category=job.category,
            status=job.status,
            posted_at=job.posted_at,
            application_count=count,
        )
        for job, count in results
    ]

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


@router.patch("/jobs/{id}", response_model=JobDetail)
def update_job(
    id: int,
    data: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """Edit a job posting owned by the recruiter."""

    job = (
        db.query(Job)
        .filter(
            Job.id == id,
            Job.recruiter_id == current_user.id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    changes = data.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(
            status_code=400,
            detail="Send at least one field to change",
        )

    for field, value in changes.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    return job


@router.post("/jobs/{id}/archive", response_model=JobDetail)
def archive_job(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """Archive a job posting owned by the recruiter."""

    job = (
        db.query(Job)
        .filter(
            Job.id == id,
            Job.recruiter_id == current_user.id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = ARCHIVED

    db.commit()
    db.refresh(job)

    return job


@router.post("/jobs/{id}/unarchive", response_model=JobDetail)
def unarchive_job(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """Reopen an archived job posting."""

    job = (
        db.query(Job)
        .filter(
            Job.id == id,
            Job.recruiter_id == current_user.id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = OPEN

    db.commit()
    db.refresh(job)

    return job

@router.get(
    "/jobs/{id}/applications",
    response_model=list[ReceivedApplication],
)
def get_job_applications(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """View applications received for a recruiter's own job."""

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

    results = (
        db.query(Application, User, Profile)
        .join(User, Application.user_id == User.id)
        .outerjoin(Profile, Profile.user_id == User.id)
        .filter(Application.job_id == id)
        .order_by(Application.applied_at.desc())
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