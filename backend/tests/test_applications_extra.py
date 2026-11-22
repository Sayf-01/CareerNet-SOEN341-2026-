from App.database.connection import get_db
from App.main import app
from App.models.application import Application
from App.models.job import Job
from App.models.user import User
from tests.conftest import API


def register_user(client, email="apply-user@example.com"):
    client.post(
        f"{API}/auth/register",
        json={
            "full_name": "Apply User",
            "email": email,
            "password": "Password123!",
            "role": "JOB_SEEKER",
        },
    )


def login_headers(client, email="apply-user@example.com"):
    register_user(client, email=email)
    token = client.post(
        f"{API}/auth/login",
        json={"email": email, "password": "Password123!"},
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def upload_resume(client, headers):
    return client.post(
        f"{API}/resumes",
        files={"file": ("resume.pdf", b"%PDF-1.4 test", "application/pdf")},
        headers=headers,
    )


def make_job(status="open"):
    db = next(app.dependency_overrides[get_db]())
    job = Job(
        title="Backend Developer",
        company="CareerNet",
        location="Montreal",
        category="Software",
        description="Build APIs.",
        status=status,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    job_id = job.id
    db.close()
    return job_id


def apply(client, headers, job_id, resume_id):
    return client.post(
        f"{API}/applications",
        json={"job_id": job_id, "resume_id": resume_id},
        headers=headers,
    )


def saved_applications():
    db = next(app.dependency_overrides[get_db]())
    try:
        return [
            (row.user_id, row.job_id, row.resume_id)
            for row in db.query(Application).all()
        ]
    finally:
        db.close()


def saved_user_id(email):
    db = next(app.dependency_overrides[get_db]())
    try:
        return db.query(User.id).filter(User.email == email).scalar()
    finally:
        db.close()


def saved_cover_note(application_id):
    db = next(app.dependency_overrides[get_db]())
    try:
        application = db.get(Application, application_id)
        return application.cover_note
    finally:
        db.close()


def test_apply_without_cover_note_succeeds(client):
    # Checks the application payload can omit the cover note and still be accepted.
    headers = login_headers(client)
    resume_id = upload_resume(client, headers).json()["id"]
    job_id = make_job()

    response = apply(client, headers, job_id, resume_id)

    assert response.status_code == 201
    assert response.json()["status"] == "Applied"


def test_missing_job_id_or_resume_id_is_400(client):
    # Checks validation errors from missing required fields return 400 in this project.
    headers = login_headers(client)
    upload_resume(client, headers)

    missing_job = client.post(
        f"{API}/applications",
        json={"resume_id": 1},
        headers=headers,
    )
    assert missing_job.status_code == 400

    missing_resume = client.post(
        f"{API}/applications",
        json={"job_id": 1},
        headers=headers,
    )
    assert missing_resume.status_code == 400


def test_two_job_seekers_can_apply_to_same_job(client):
    # Checks two different users can both apply to the same open job.
    user_a = login_headers(client, "user-a@example.com")
    user_b = login_headers(client, "user-b@example.com")

    resume_a = upload_resume(client, user_a).json()["id"]
    resume_b = upload_resume(client, user_b).json()["id"]
    job_id = make_job()

    first = apply(client, user_a, job_id, resume_a)
    second = apply(client, user_b, job_id, resume_b)

    assert first.status_code == 201
    assert second.status_code == 201
    assert second.json()["status"] == "Applied"


def test_nonexistent_resume_id_is_404(client):
    # Checks applying with a resume id that does not exist returns 404.
    headers = login_headers(client)
    job_id = make_job()

    response = apply(client, headers, job_id, 999999)

    assert response.status_code == 404
    assert response.json()["detail"] == "Resume not found."


def test_successful_apply_persists_one_application_row(client):
    # Checks a successful application stores exactly one row for this user, job, and resume.
    # Set up
    email = "persisted-apply@example.com"
    headers = login_headers(client, email)
    resume_id = upload_resume(client, headers).json()["id"]
    job_id = make_job()

    # Action
    response = apply(client, headers, job_id, resume_id)

    # Check
    assert response.status_code == 201
    assert saved_applications() == [(saved_user_id(email), job_id, resume_id)]


def test_closed_job_rejection_creates_no_application(client):
    # Checks applying to a closed job is rejected without storing an application.
    # Set up
    headers = login_headers(client)
    resume_id = upload_resume(client, headers).json()["id"]
    job_id = make_job(status="closed")

    # Action
    response = apply(client, headers, job_id, resume_id)

    # Check
    assert response.status_code == 422
    assert saved_applications() == []


def test_missing_job_rejection_creates_no_application(client):
    # Checks applying to a nonexistent job is rejected without storing an application.
    # Set up
    headers = login_headers(client)
    resume_id = upload_resume(client, headers).json()["id"]

    # Action
    response = apply(client, headers, 999999, resume_id)

    # Check
    assert response.status_code == 404
    assert saved_applications() == []


def test_foreign_resume_rejection_creates_no_application(client):
    # Checks using another user's resume is rejected without storing an application.
    # Set up
    owner_headers = login_headers(client, "resume-owner@example.com")
    resume_id = upload_resume(client, owner_headers).json()["id"]
    other_headers = login_headers(client, "resume-other@example.com")
    job_id = make_job()

    # Action
    response = apply(client, other_headers, job_id, resume_id)

    # Check
    assert response.status_code == 404
    assert saved_applications() == []


def test_nonexistent_resume_rejection_creates_no_application(client):
    # Checks using a nonexistent resume is rejected without storing an application.
    # Set up
    headers = login_headers(client)
    job_id = make_job()

    # Action
    response = apply(client, headers, job_id, 999999)

    # Check
    assert response.status_code == 404
    assert saved_applications() == []


def test_recruiter_apply_rejection_creates_no_application(client):
    # Checks a recruiter cannot apply and no application row is stored.
    # Set up
    email = "recruiter-apply@example.com"
    client.post(
        f"{API}/auth/register",
        json={
            "full_name": "Apply Recruiter",
            "email": email,
            "password": "Password123!",
            "role": "RECRUITER",
        },
    )
    token = client.post(
        f"{API}/auth/login",
        json={"email": email, "password": "Password123!"},
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    job_id = make_job()

    # Action
    response = apply(client, headers, job_id, 1)

    # Check
    assert response.status_code == 403
    assert saved_applications() == []


def test_duplicate_rejection_leaves_exactly_one_application(client):
    # Checks a duplicate application is rejected and leaves one row for the user and job.
    # Set up
    email = "duplicate-apply@example.com"
    headers = login_headers(client, email)
    resume_id = upload_resume(client, headers).json()["id"]
    job_id = make_job()
    first = apply(client, headers, job_id, resume_id)
    assert first.status_code == 201

    # Action
    duplicate = apply(client, headers, job_id, resume_id)

    # Check
    assert duplicate.status_code == 409
    assert saved_applications() == [(saved_user_id(email), job_id, resume_id)]


def test_apply_without_token_creates_no_application(client):
    # Checks applying without a token returns 401 and stores no application.
    # Set up
    headers = login_headers(client)
    resume_id = upload_resume(client, headers).json()["id"]
    job_id = make_job()

    # Action
    response = client.post(
        f"{API}/applications",
        json={"job_id": job_id, "resume_id": resume_id},
    )

    # Check
    assert response.status_code == 401
    assert saved_applications() == []


def test_cover_note_of_1000_characters_is_accepted_and_saved(client):
    # Checks a cover note at the 1000-character limit is accepted and saved exactly.
    # Set up
    headers = login_headers(client)
    resume_id = upload_resume(client, headers).json()["id"]
    job_id = make_job()
    note = "a" * 1000

    # Action
    response = client.post(
        f"{API}/applications",
        json={"job_id": job_id, "resume_id": resume_id, "cover_note": note},
        headers=headers,
    )

    # Check
    assert response.status_code == 201
    assert saved_cover_note(response.json()["id"]) == note


def test_cover_note_over_1000_returns_400_without_application(client):
    # Checks a 1001-character cover note returns 400 and stores no application.
    # Set up
    headers = login_headers(client)
    resume_id = upload_resume(client, headers).json()["id"]
    job_id = make_job()

    # Action
    response = client.post(
        f"{API}/applications",
        json={"job_id": job_id, "resume_id": resume_id, "cover_note": "a" * 1001},
        headers=headers,
    )

    # Check
    assert response.status_code == 400
    assert saved_applications() == []
