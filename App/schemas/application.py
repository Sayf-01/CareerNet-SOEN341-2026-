from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal

class ApplicationCreate(BaseModel):
    """What the frontend sends to POST /applications."""
    job_id: int
    resume_id: int
    cover_note: str | None = Field(default=None, max_length=1000)  # optional message to the recruiter

class ApplicationCreated(BaseModel):
    """What the backend sends back after a successful application."""
    id: int
    status: str
    applied_at: datetime
    message: str = "Application submitted"

class ApplicationListItem(BaseModel):
    id: int
    job_title: str
    company: str
    status: str
    applied_at: datetime
    updated_at: datetime
    interview_at: datetime | None = None

class ApplicationStatusUpdate(BaseModel):
    status: Literal[
        "Applied",
        "Under Review",
        "Interview",
        "Offered",
        "Rejected",
    ]
    interview_at: datetime | None = None

class ApplicationStatusResponse(BaseModel):
    id: int
    status: str
    updated_at: datetime
    interview_at: datetime | None = None