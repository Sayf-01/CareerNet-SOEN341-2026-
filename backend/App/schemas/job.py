
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class JobListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company: str
    location: str
    category: str
    posted_at: datetime


class JobDetail(JobListItem):
    description: str
    status: str


class JobListResponse(BaseModel):
    items: list[JobListItem]
    total: int
