import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

#  Load the variables from the .env file
load_dotenv()

# Grab the DATABASE_URL variable
DATABASE_URL = os.getenv("DATABASE_URL")

#  Handling a common quirk where cloud URLS use 'postgres://' instead of 'postgresql://'
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create the engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# FastAPI Dependency 
def get_db():
    """
    Creates a temporary database session for a single API request,
    and automatically closes it when the request is done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()