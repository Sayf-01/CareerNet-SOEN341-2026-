from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


JobCategory = Literal[
    "Software Development",
    "Data and AI",
    "Design",
    "Marketing",
    "Finance",
    "Customer Support",
]


class CreateJobRequest(BaseModel):
    title: str = Field(min_length=1)
    company: str = Field(min_length=1)
    location: str = Field(min_length=1)
    category: JobCategory
    description: str = Field(min_length=1)

    @field_validator("title", "company", "location", "description")
    @classmethod
    def cannot_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field cannot be empty")
        return value


class ReceivedApplication(BaseModel):
    application_id: int
    applicant_name: str
    resume_id: int | None
    status: str
    applied_at: datetime

class RecruiterJobListItem(BaseModel):
    id: int
    title: str
    company: str
    location: str
    category: str
    status: str
    posted_at: datetime
    application_count: int