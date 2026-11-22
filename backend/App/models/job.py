
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime, timezone
from App.database.base import Base


class Job(Base):
    #Stores job postings created by recruiters
    # or added as sample jobs.

    __tablename__ = "jobs"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Recruiter who posted the job
    recruiter_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    # Job information
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)

    # Job status
    status = Column(String(20), default="open", nullable=False)

    # Date job was posted
    posted_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
