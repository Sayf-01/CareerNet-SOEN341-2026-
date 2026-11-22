
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from datetime import datetime, timezone
from App.database.base import Base


class Profile(Base):
    
    # Stores professional profile information for each user.
    # Each user can have only one profile.
    
    __tablename__ = "profiles"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Link to existing users table
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    # Profile information
    full_name = Column(String(100))
    headline = Column(String(255))
    location = Column(String(100))
    phone = Column(String(30))
    summary = Column(Text)
    skills = Column(JSON)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
