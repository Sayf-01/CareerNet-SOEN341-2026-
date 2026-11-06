# When we use alembic, instead of it trying to find the models in the database folder, it will look for them in this file.

# Import database models so Alembic can discover them

from App.models.user import User
from App.models.profile import Profile
from App.models.resumeFile import ResumeFile
from App.models.job import Job
from .application import Application
