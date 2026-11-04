from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from App.application_statuses import APPLIED
from App.core.dependencies import get_current_user
from App.crud.jobs import get_job  # Kaila's job lookup
from App.crud.resumes import get_resume  # Kaila's resume lookup (only finds the user's own resumes)
from App.database.connection import get_db
from App.models.application import Application
from App.models.user import User, UserRole
from App.schemas.application import ApplicationCreate, ApplicationCreated

router = APIRouter(prefix="/applications", tags=["applications"])

ALREADY_APPLIED = "You have already applied to this job."


@router.post("", response_model=ApplicationCreated, status_code=status.HTTP_201_CREATED)
def apply_for_job(
    data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """A job seeker applies to a job with one of their own resumes."""

    # Rule 1: only job seekers can apply
    if current_user.role != UserRole.JOB_SEEKER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only job seekers can apply to jobs.")

    # Rule 2: the job must exist and be open
    job = get_job(db, data.job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    if job.status != "open":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="This job is closed.")

    # Rule 3: the resume must belong to the logged-in user
    if get_resume(db, current_user.id, data.resume_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    # Rule 4: no applying twice to the same job
    already = db.query(Application).filter(
        Application.user_id == current_user.id, Application.job_id == data.job_id
    ).first()
    if already:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=ALREADY_APPLIED)

    application = Application(
        user_id=current_user.id,
        job_id=data.job_id,
        resume_id=data.resume_id,
        status=APPLIED,
        applied_at=datetime.now(timezone.utc),
         cover_note=data.cover_note,
    )
    db.add(application)
    try:
        db.commit()
    except IntegrityError:  # two clicks at the same moment: the table's unique rule catches it
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=ALREADY_APPLIED)
    db.refresh(application)

    return ApplicationCreated(id=application.id, status=application.status, applied_at=application.applied_at)