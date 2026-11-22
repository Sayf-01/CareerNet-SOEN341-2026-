# SA-9 tests for application status tracking (YO-2)

from tests.conftest import API

JOB = {
    "title": "Frontend Developer",
    "company": "Acme",
    "location": "Montreal",
    "category": "Software Development",
    "description": "Build the job board UI in React.",
}


def login_as(client, email, role):
    client.post(
        f"{API}/auth/register",
        json={"full_name": "Test User", "email": email, "password": "Password123!", "role": role},
    )
    token = client.post(
        f"{API}/auth/login", json={"email": email, "password": "Password123!"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def post_job(client, recruiter):
    return client.post(f"{API}/recruiter/jobs", json=JOB, headers=recruiter).json()["id"]


def apply_to(client, seeker, job_id):
    # upload a resume, then apply with it
    resume_id = client.post(
        f"{API}/resumes",
        files={"file": ("cv.pdf", b"%PDF-1.4 test", "application/pdf")},
        headers=seeker,
    ).json()["id"]
    return client.post(
        f"{API}/applications", json={"job_id": job_id, "resume_id": resume_id}, headers=seeker
    ).json()["id"]


def set_status(client, headers, application_id, status):
    return client.patch(
        f"{API}/applications/{application_id}/status", json={"status": status}, headers=headers
    )


# ---------- my applications ----------

def test_my_applications_requires_login(client):
    response = client.get(f"{API}/applications/me")
    assert response.status_code == 401


def test_new_job_seeker_has_no_applications(client):
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")

    response = client.get(f"{API}/applications/me", headers=seeker)

    assert response.status_code == 200
    assert response.json() == []


def test_new_application_shows_as_applied(client):
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")
    apply_to(client, seeker, post_job(client, recruiter))

    response = client.get(f"{API}/applications/me", headers=seeker)

    assert response.status_code == 200
    applications = response.json()
    assert len(applications) == 1
    assert applications[0]["job_title"] == JOB["title"]
    assert applications[0]["company"] == JOB["company"]
    assert applications[0]["status"] == "Applied"


def test_job_seekers_only_see_their_own_applications(client):
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    alice = login_as(client, "alice@example.com", "JOB_SEEKER")
    bob = login_as(client, "bob@example.com", "JOB_SEEKER")
    job_id = post_job(client, recruiter)
    apply_to(client, alice, job_id)

    response = client.get(f"{API}/applications/me", headers=bob)

    assert response.json() == []


# ---------- updating the status ----------

def test_recruiter_status_change_is_visible_to_job_seeker(client):
    # acceptance test #84
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")
    application_id = apply_to(client, seeker, post_job(client, recruiter))

    response = set_status(client, recruiter, application_id, "Interview")

    assert response.status_code == 200
    assert response.json()["status"] == "Interview"
    mine = client.get(f"{API}/applications/me", headers=seeker).json()
    assert mine[0]["status"] == "Interview"


def test_every_allowed_status_can_be_set(client):
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")
    application_id = apply_to(client, seeker, post_job(client, recruiter))

    for status in ["Under Review", "Interview", "Offered", "Rejected", "Applied"]:
        response = set_status(client, recruiter, application_id, status)
        assert response.status_code == 200
        assert response.json()["status"] == status


def test_unknown_status_is_rejected(client):
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")
    application_id = apply_to(client, seeker, post_job(client, recruiter))

    response = set_status(client, recruiter, application_id, "Hired")

    assert response.status_code == 400
    # status didn't change
    assert client.get(f"{API}/applications/me", headers=seeker).json()[0]["status"] == "Applied"


def test_status_change_requires_login(client):
    response = client.patch(f"{API}/applications/1/status", json={"status": "Interview"})
    assert response.status_code == 401


def test_job_seeker_cannot_change_status(client):
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")
    application_id = apply_to(client, seeker, post_job(client, recruiter))

    response = set_status(client, seeker, application_id, "Offered")

    assert response.status_code == 403


def test_recruiter_cannot_change_status_on_another_recruiters_job(client):
    owner = login_as(client, "owner@example.com", "RECRUITER")
    other = login_as(client, "other@example.com", "RECRUITER")
    seeker = login_as(client, "seeker@example.com", "JOB_SEEKER")
    application_id = apply_to(client, seeker, post_job(client, owner))

    response = set_status(client, other, application_id, "Rejected")

    assert response.status_code == 404
    assert client.get(f"{API}/applications/me", headers=seeker).json()[0]["status"] == "Applied"


def test_unknown_application_is_404(client):
    recruiter = login_as(client, "recruiter@example.com", "RECRUITER")

    response = set_status(client, recruiter, 9999, "Interview")

    assert response.status_code == 404
    assert response.json() == {"detail": "Application not found"}