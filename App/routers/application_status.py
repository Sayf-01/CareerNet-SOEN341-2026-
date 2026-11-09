
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
    """Allow a recruiter to update an application to their own job."""

    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(
            status_code=403,
            detail="Recruiter access required",
        )

    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(
            Application.id == id,
            Job.recruiter_id == current_user.id,
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    application.status = data.status
    application.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(application)

    return ApplicationStatusResponse(
        id=application.id,
        status=application.status,
        updated_at=application.updated_at,
    )
