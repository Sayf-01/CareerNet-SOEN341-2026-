from datetime import datetime, timezone
from sqlalchemy.orm import Session, defer
from App.models.resumeFile import ResumeFile
from App.models.application import Application
from App.models.job import Job

def _details(resume):
    # Resume info without the file itself
    return {
        "id": resume.id,
        "user_id": resume.user_id,
        "filename": resume.filename,
        "content_type": resume.content_type,
        "size_bytes": resume.size_bytes,
        "uploaded_at": resume.uploaded_at,
    }


def save_resume(db: Session, user_id: int, filename: str, content_type: str, data: bytes):
    """Store a new resume and return its details (without the file bytes)."""
    resume = ResumeFile(
        user_id=user_id,
        filename=filename,
        content_type=content_type,
        size_bytes=len(data),
        file_data=data,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return _details(resume)


def list_resumes(db: Session, user_id: int):
    """Return the details of all of a user's resumes, newest first.

    The file bytes are not loaded, so listing stays fast.
    """
    resumes = (
        db.query(ResumeFile)
        .options(defer(ResumeFile.file_data))
        .filter(ResumeFile.user_id == user_id)
        .order_by(ResumeFile.uploaded_at.desc())
        .all()
    )
    return [_details(r) for r in resumes]


def get_resume(db: Session, user_id: int, resume_id: int):
    """Return one resume INCLUDING its file bytes, or None if it does not
    exist or does not belong to this user."""
    return (
        db.query(ResumeFile)
        .filter(ResumeFile.id == resume_id, ResumeFile.user_id == user_id)
        .first()
    )


def replace_resume(db: Session, user_id: int, resume_id: int, filename: str, content_type: str, data: bytes):
    """Swap the file of an existing resume and update its upload date.

    Returns the new details, or None if the resume does not belong to this user.
    """
    resume = get_resume(db, user_id, resume_id)
    if resume is None:
        return None

    resume.filename = filename
    resume.content_type = content_type
    resume.size_bytes = len(data)
    resume.file_data = data
    resume.uploaded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(resume)
    return _details(resume)


def delete_resume(db: Session, user_id: int, resume_id: int):
    """Delete a resume. Returns True if it existed (and belonged to this user),
    False otherwise."""
    resume = get_resume(db, user_id, resume_id)
    if resume is None:
        return False

    db.delete(resume)
    db.commit()
    return True


def get_resume_for_recruiter(
    db: Session,
    application_id: int,
    recruiter_id: int,
):
    """Get an applicant's resume only when the recruiter owns the job."""

    return (
        db.query(ResumeFile)
        .join(
            Application,
            Application.resume_id == ResumeFile.id,
        )
        .join(
            Job,
            Application.job_id == Job.id,
        )
        .filter(
            Application.id == application_id,
            Application.user_id == ResumeFile.user_id,
            Job.recruiter_id == recruiter_id,
        )
        .first()
    )