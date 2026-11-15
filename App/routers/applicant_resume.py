from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from App.core.dependencies import require_recruiter
from App.crud.resumes import get_resume_for_recruiter
from App.database.connection import get_db
from App.models.user import User


router = APIRouter(
    prefix="/applications",
    tags=["applications"],
)


@router.get("/{application_id}/resume")
def download_applicant_resume(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """Allow recruiters to download resumes for their own applicants."""

    resume = get_resume_for_recruiter(
        db,
        application_id=application_id,
        recruiter_id=current_user.id,
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )

    safe_name = resume.filename.replace('"', "")

    return Response(
        content=resume.file_data,
        media_type=resume.content_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="{safe_name}"'
            )
        },
    )