from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from App.core.dependencies import get_current_user
from App.crud import resumes as resume_crud  # Kaila's resume functions
from App.database.connection import get_db
from App.models.user import User
from App.resume_rules import ALLOWED_RESUME_TYPES, MAX_RESUME_BYTES  # Kaila's limits file
from App.schemas.resume import ResumeOut

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