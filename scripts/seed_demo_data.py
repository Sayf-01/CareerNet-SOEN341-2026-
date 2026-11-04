# KA-8: fills the database with demo accounts, jobs, applications and notifications,
# so the dashboard, the notifications and the recruiter screens have something to show.
# Run from the project root:  python -m scripts.seed_demo_data
# It writes to whatever DATABASE_URL points to. Never run it inside tests.

from datetime import datetime, timedelta, timezone
from typing import get_args

from sqlalchemy.engine import make_url

import App.models  # noqa: F401  (registers every model so the foreign keys resolve)
from App.application_statuses import APPLIED, INTERVIEW, OFFERED, REJECTED, UNDER_REVIEW
from App.core.security import hash_password
from App.crud import notifications
from App.database.connection import DATABASE_URL, SessionLocal
from App.models.application import Application
from App.models.job import Job
from App.models.user import User, UserRole
from App.schemas.recruiter import JobCategory

RECRUITER_EMAIL = "demo.recruiter@example.com"
SEEKER_EMAIL = "demo.seeker@example.com"
PASSWORD = "DemoPass123!"

CATEGORIES = list(get_args(JobCategory))  # the fixed category list from the recruiter schema

# The demo recruiter's company
RECRUITER_COMPANY = "Aurora Robotics"

# 5 jobs posted by the demo recruiter: (title, location, category, description)
RECRUITER_JOBS = [
    ("Robotics Software Developer", "Montreal", "Software Development",
     "Write the Python and C++ that steers our warehouse robots, from path planning to live dashboards."),
    ("Computer Vision Engineer", "Remote", "Data and AI",
     "Train models that let our robots recognize parcels, shelves and people in real time."),
    ("Product Designer, Robot Control App", "Montreal", "Design",
     "Design the app operators use to watch, guide and pause a whole fleet of robots."),
    ("Growth Marketer", "Toronto", "Marketing",
     "Launch the campaigns that introduce our robots to warehouses across Canada."),
    ("Customer Success Specialist", "Remote", "Customer Support",
     "Help new clients get their first robots running, and keep them happy after launch."),
]

# 7 more jobs from other companies: (title, company, location, category, description)
OTHER_JOBS = [
    ("Game Developer", "Pixel Forge Studios", "Montreal", "Software Development",
     "Build gameplay features for an indie adventure game in Unity and C#."),
    ("Satellite Data Analyst", "Northern Orbit", "Ottawa", "Data and AI",
     "Turn satellite images into maps that track Canadian forests and sea ice."),
    ("Fintech Backend Developer", "Loonie Pay", "Toronto", "Software Development",
     "Build the APIs behind a mobile payment app used by students across the country."),
    ("Quantitative Analyst Intern", "Glacier Capital", "Montreal", "Finance",
     "Test trading strategies in Python and help the team measure market risk."),
    ("Motion Designer", "Neon Moose Studio", "Vancouver", "Design",
     "Animate trailers, logos and app intros for tech and gaming clients."),
    ("Esports Marketing Coordinator", "Maple Esports", "Toronto", "Marketing",
     "Run the social media and live events for a growing team of pro players."),
    ("AI Chatbot Support Lead", "Helpwave", "Remote", "Customer Support",
     "Train the AI assistant that answers customer questions, and step in when it gets stuck."),
]

# One row per application: (days ago, status). All five statuses appear.
# Index 2 is the Interview, on a recruiter job, with the interview tomorrow.
APPLICATIONS = [
    (29, REJECTED), (27, UNDER_REVIEW), (24, INTERVIEW), (21, OFFERED), (18, APPLIED),
    (15, REJECTED), (12, UNDER_REVIEW), (10, APPLIED), (7, OFFERED), (5, UNDER_REVIEW),
    (3, APPLIED), (1, APPLIED),
]


def confirm_target() -> bool:
    # shows which database will be changed (host only, never the password) and asks first
    url = make_url(DATABASE_URL)
    print(f"WARNING: this will add demo data to the database on {url.host} ({url.database}).")
    return input("Type YES to continue: ").strip() == "YES"


def seed_demo_data():
    db = SessionLocal()
    try:
        # Safe to run twice: stop if the demo recruiter already exists
        if db.query(User).filter(User.email == RECRUITER_EMAIL).first():
            print("Demo data already exists. Nothing was added.")
            return

        if not confirm_target():
            print("Cancelled. Nothing was added.")
            return

        now = datetime.now(timezone.utc)

        # 1. Demo accounts (passwords hashed like a normal registration)
        recruiter = User(full_name="Demo Recruiter", email=RECRUITER_EMAIL,
                         hashed_password=hash_password(PASSWORD), role=UserRole.RECRUITER)
        seeker = User(full_name="Demo Job Seeker", email=SEEKER_EMAIL,
                      hashed_password=hash_password(PASSWORD), role=UserRole.JOB_SEEKER)
        db.add_all([recruiter, seeker])
        db.flush()  # gives them ids

        # 2. Jobs: 5 for the demo recruiter, 7 from other companies
        jobs = []
        for i, (title, location, category, description) in enumerate(RECRUITER_JOBS):
            assert category in CATEGORIES
            jobs.append(Job(recruiter_id=recruiter.id, title=title, company=RECRUITER_COMPANY,
                            location=location, category=category, status="open",
                            description=description, posted_at=now - timedelta(days=35 - i)))
        for i, (title, company, location, category, description) in enumerate(OTHER_JOBS):
            assert category in CATEGORIES
            jobs.append(Job(title=title, company=company, location=location, category=category,
                            status="open", description=description,
                            posted_at=now - timedelta(days=33 - i)))
        db.add_all(jobs)
        db.flush()

        # 3. Applications spread over the last 30 days
        applications = []
        for job, (days_ago, status) in zip(jobs, APPLICATIONS):
            applied_at = now - timedelta(days=days_ago)
            changed_at = applied_at if status == APPLIED else min(applied_at + timedelta(days=2), now)
            interview_at = None
            if status == INTERVIEW:
                # tomorrow, within the next 24 hours, so a reminder shows up too
                interview_at = (now + timedelta(hours=20)).replace(minute=0, second=0, microsecond=0)
            applications.append(Application(user_id=seeker.id, job_id=job.id, status=status,
                                            applied_at=applied_at, updated_at=changed_at,
                                            interview_at=interview_at))
        db.add_all(applications)
        db.flush()

        # 4. Notifications, using the KA-7 service (it flushes, we commit once below)
        for job, application in zip(jobs, applications):
            if job.recruiter_id == recruiter.id:
                notifications.notify_new_application(
                    db, recruiter_id=recruiter.id, application_id=application.id,
                    job_title=job.title, applicant_name=seeker.full_name)
            if application.status != APPLIED:
                notifications.notify_status_change(
                    db, user_id=seeker.id, application_id=application.id, job_title=job.title,
                    new_status=application.status, interview_at=application.interview_at)
        notifications.generate_interview_reminders(db, seeker.id, now=now)

        db.commit()  # everything is saved together, or nothing is

        print(f"Demo data added: 2 accounts, {len(jobs)} jobs, {len(applications)} applications, "
              f"{notifications.count_unread(db, seeker.id)} notifications for the job seeker and "
              f"{notifications.count_unread(db, recruiter.id)} for the recruiter.")
        print("Demo logins (password for both: " + PASSWORD + "):")
        print(f"  Job seeker: {SEEKER_EMAIL}")
        print(f"  Recruiter:  {RECRUITER_EMAIL}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()