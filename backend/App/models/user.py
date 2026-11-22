from sqlalchemy import Column, Integer, String, DateTime, Enum
from datetime import datetime, timezone
import enum
from App.database.base import Base

class UserRole(str, enum.Enum):
    JOB_SEEKER = "JOB_SEEKER"
    RECRUITER = "RECRUITER"

# "Base" is basically the interface that allows python to manipulate the database. It is the base class that all models will inherit from. 
class User(Base):
    """
    The User model defines the 'users' table structure in the PostgreSQL database.
    It stores credentials required for user registration and login.
    """
    __tablename__ = "users"

    # Primary key 
    id = Column(Integer, primary_key=True, index=True)
    
    # Registration details
    full_name = Column(String(50), index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    
    # Secure login detail (this will be stored as a HASHED password, never plaintext)
    hashed_password = Column(String(255), nullable=False)
    
    # Role of users (Job seeker or Recruiter) 
    role = Column(Enum(UserRole), nullable=False, default=UserRole.JOB_SEEKER)
    
    # Audit trail (tracks when the user registered)
    created_at = Column(
    DateTime(timezone=True),
    default=lambda: datetime.now(timezone.utc),
    nullable=False
) 
