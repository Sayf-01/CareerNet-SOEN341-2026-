from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, UniqueConstraint
from datetime import datetime, timezone
from App.database.base import Base

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resume_files.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), nullable=False, server_default="Applied")
    applied_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True),server_default=func.now(),onupdate=func.now(),nullable=False)
    cover_note = Column(String(1000), nullable=True)  # optional message to the recruiter

    __table_args__ = (UniqueConstraint('user_id', 'job_id', name='uq_application_user_job'),)