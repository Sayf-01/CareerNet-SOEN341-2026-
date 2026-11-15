# LA-8 tests: applying to a job notifies the recruiter who posted it

from App.database.connection import get_db
from App.main import app
from App.models.job import Job
from App.models.notification import Notification
from tests.conftest import API

JOB = {
    "title": "Frontend Developer",
    "company": "Acme",
    "location": "Montreal",
    "category": "Software Development",
    "description": "Build the job board UI in React.",
}


# ---------- helpers ----------

def login_as(client, email, role, full_name="Test User"):
    # registers and logs in; returns the headers and the user's id
    user_id = client.post(
        f"{API}/auth/register",
        json={"full_name": full_name, "email": email, "password": "Password123!", "role": role},
    ).json()["user"]["id"]
    token = client.post(
        f"{API}/auth/login", json={"email": email, "password": "Password123!"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, user_id


def post_job(client, recruiter):
    return client.post(f"{API}/recruiter/jobs", json=JOB, headers=recruiter).json()["id"]


def apply_to(client, seeker, job_id):
    # uploads a resume, then applies with it; returns the response
    resume_id = client.post(
        f"{API}/resumes",
        files={"file": ("cv.pdf", b"%PDF-1.4 test", "application/pdf")},
        headers=seeker,
    ).json()["id"]
    return client.post(f"{API}/applications", json={"job_id": job_id, "resume_id": resume_id}, headers=seeker)


def notifications_of(user_id):
    # reads a user's notifications straight from the test database
    db = next(app.dependency_overrides[get_db]())
    rows = db.query(Notification).filter(Notification.user_id == user_id).all()
    result = [(row.type, row.message, row.application_id) for row in rows]
    db.close()
    return result


# ---------- tests ----------

def test_applying_notifies_the_recruiter_once(client):
    recruiter, recruiter_id = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker, _ = login_as(client, "seeker@example.com", "JOB_SEEKER", full_name="Sara Khan")
    job_id = post_job(client, recruiter)

    response = apply_to(client, seeker, job_id)

    assert response.status_code == 201
    notes = notifications_of(recruiter_id)
    assert len(notes) == 1
    note_type, message, application_id = notes[0]
    assert note_type == "application_received"
    assert "Frontend Developer" in message
    assert "Sara Khan" in message
    assert application_id == response.json()["id"]


def test_job_without_recruiter_works_and_creates_no_notification(client):
    seeker, _ = login_as(client, "seeker@example.com", "JOB_SEEKER")
    db = next(app.dependency_overrides[get_db]())
    job = Job(**JOB)  # like the seeded jobs: no recruiter
    db.add(job)
    db.commit()
    job_id = job.id
    db.close()

    response = apply_to(client, seeker, job_id)

    assert response.status_code == 201
    db = next(app.dependency_overrides[get_db]())
    assert db.query(Notification).count() == 0
    db.close()


def test_duplicate_application_creates_no_second_notification(client):
    recruiter, recruiter_id = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker, _ = login_as(client, "seeker@example.com", "JOB_SEEKER")
    job_id = post_job(client, recruiter)
    apply_to(client, seeker, job_id)

    second = apply_to(client, seeker, job_id)

    assert second.status_code == 409
    assert len(notifications_of(recruiter_id)) == 1


def test_job_seeker_gets_no_notification(client):
    recruiter, _ = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker, seeker_id = login_as(client, "seeker@example.com", "JOB_SEEKER")

    apply_to(client, seeker, post_job(client, recruiter))

    assert notifications_of(seeker_id) == []