from datetime import datetime

from pydantic import BaseModel


class ResumeOut(BaseModel):
    """Resume details sent back to the frontend. Never includes the file itself."""

    id: int
    filename: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime