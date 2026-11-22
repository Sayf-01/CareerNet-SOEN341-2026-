
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, LargeBinary
from datetime import datetime, timezone
from App.database.base import Base


class ResumeFile(Base):
    
    #Stores uploaded resume files in the database.
    # Each resume belongs to one user.
    
    __tablename__ = "resume_files"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Connect the resume to its owner
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # Resume information
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)

    # Actual PDF or Word document
    file_data = Column(LargeBinary, nullable=False)

    # Date and time of upload
    uploaded_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
