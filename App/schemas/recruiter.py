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
    interview_at: datetime | None = None

class RecruiterJobListItem(BaseModel):
    id: int
    title: str
    company: str
    location: str
    category: str
    status: str
    posted_at: datetime
    application_count: int

class JobUpdate(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    category: JobCategory | None = None
    description: str | None = None

    @field_validator("title", "company", "location", "description")
    @classmethod
    def cannot_be_blank(cls, value: str | None) -> str:
        if value is None or not value.strip():
            raise ValueError("Field cannot be empty")
        return value.strip()

    @field_validator("category")
    @classmethod
    def category_cannot_be_null(cls, value):
        if value is None:
            raise ValueError("Category cannot be empty")
        return value
