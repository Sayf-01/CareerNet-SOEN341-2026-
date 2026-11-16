from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from App.core.dependencies import get_current_user
from App.core.rate_limit import feedback_limiter
from App.crud import resumes as resume_crud  
from App.database.connection import get_db
from App.models.user import User
from App.resume_rules import ALLOWED_RESUME_TYPES, MAX_RESUME_BYTES  
from App.schemas.resume import ResumeOut
from App.schemas.resume_feedback import ResumeFeedback  
from App.services.ai_feedback import AIUnavailableError, generate_resume_feedback  
from App.services.resume_text import ResumeTextError, extract_resume_text  

router = APIRouter(prefix="/resumes", tags=["resumes"])

ALLOWED_EXTENSIONS = (".pdf", ".doc", ".docx")
BAD_FILE = "Only PDF or Word files up to 5 MB are allowed."
NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")


async def read_valid_file(file: UploadFile) -> tuple[str, str, bytes]:
    """Reads the uploaded file and checks it. Returns (filename, content_type, bytes).

    Bad type, wrong extension, empty or over 5 MB -> 422 with a clear message.
    """
    data = await file.read()
    filename = file.filename or "resume"

    if file.content_type not in ALLOWED_RESUME_TYPES or not filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=BAD_FILE)
    if len(data) == 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="The file is empty.")
    if len(data) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=BAD_FILE)

    return filename, file.content_type, data


@router.post("", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a new resume (PDF or Word, up to 5 MB)."""
    filename, content_type, data = await read_valid_file(file)
    return resume_crud.save_resume(db, current_user.id, filename, content_type, data)


@router.get("", response_model=list[ResumeOut])
def list_my_resumes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List my resumes (details only, no file contents)."""
    return resume_crud.list_resumes(db, current_user.id)


@router.get("/{resume_id}/download")
def download_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send the file back so the browser downloads it."""
    resume = resume_crud.get_resume(db, current_user.id, resume_id)
    if resume is None:  # missing OR someone else's -> same 404, so ids can't be guessed
        raise NOT_FOUND

    safe_name = resume.filename.replace('"', "")
    return Response(
        content=resume.file_data,
        media_type=resume.content_type,
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'},
    )


@router.put("/{resume_id}", response_model=ResumeOut)
async def replace_resume(
    resume_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Replace the file of one of my resumes."""
    filename, content_type, data = await read_valid_file(file)
    updated = resume_crud.replace_resume(db, current_user.id, resume_id, filename, content_type, data)
    if updated is None:
        raise NOT_FOUND
    return updated


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete one of my resumes."""
    if not resume_crud.delete_resume(db, current_user.id, resume_id):
        raise NOT_FOUND

# ---------- LA-10: AI feedback on one of my resumes ----------

UNREADABLE = "We could not read text from this file."
AI_UNAVAILABLE = "AI feedback is temporarily unavailable."
RATE_LIMITED = "You asked for feedback several times. Please try again later."


@router.post("/{resume_id}/feedback", response_model=ResumeFeedback)
def resume_feedback(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI feedback on one of my resumes. Nothing is saved, and the resume text is never logged or returned."""
    # 0. At most 5 feedback requests per user per hour
    if not feedback_limiter.allow(current_user.id):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=RATE_LIMITED)
    # 1. The resume must be mine (someone else's or a missing one gives 404)
    resume = resume_crud.get_resume(db, current_user.id, resume_id)
    if resume is None:
        raise NOT_FOUND

    # 2. Turn the file into text (Kaila, KA-12)
    try:
        text = extract_resume_text(resume.content_type, resume.file_data)
    except ResumeTextError:
        # our own message only: the error's message is not shown
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=UNREADABLE) from None

    # 3. Ask for feedback (Youssef, YO-10): fake answer by default, real AI when configured
    try:
        return generate_resume_feedback(text)
    except AIUnavailableError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=AI_UNAVAILABLE) from None