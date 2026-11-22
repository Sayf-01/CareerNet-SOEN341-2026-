from tests.conftest import API
from tests.test_recruiter import JOB, login_as
from tests.test_resumes import upload, PDF


RESUME_DATA = b"%PDF-1.4 test applicant resume"


def setup_resume_application(client):
    """Create a recruiter, applicant, job, resume and application."""

    recruiter, _ = login_as(
        client, "recruiter@example.com", "RECRUITER"
    )
    seeker, _ = login_as(
        client, "seeker@example.com", "JOB_SEEKER"
    )

    job_response = client.post(
        f"{API}/recruiter/jobs",
        json=JOB,
        headers=recruiter,
    )
    assert job_response.status_code == 201
    job_id = job_response.json()["id"]

    resume_response = upload(
        client,
        seeker,
        name="applicant.pdf",
        data=RESUME_DATA,
        content_type=PDF,
    )
    assert resume_response.status_code == 201
    resume_id = resume_response.json()["id"]

    application_response = client.post(
        f"{API}/applications",
        json={
            "job_id": job_id,
            "resume_id": resume_id,
        },
        headers=seeker,
    )
    assert application_response.status_code == 201
    application_id = application_response.json()["id"]

    return recruiter, seeker, application_id, resume_id


def test_owner_recruiter_can_download_resume(client):
    recruiter, seeker, application_id, resume_id = (
        setup_resume_application(client)
    )

    response = client.get(
        f"{API}/applications/{application_id}/resume",
        headers=recruiter,
    )

    assert response.status_code == 200
    assert response.content == RESUME_DATA
    assert response.headers["content-type"] == PDF
    assert response.headers["content-disposition"] == (
        'attachment; filename="applicant.pdf"'
    )


def test_other_recruiter_cannot_download_resume(client):
    recruiter, seeker, application_id, resume_id = (
        setup_resume_application(client)
    )

    other, _ = login_as(
        client, "other@example.com", "RECRUITER"
    )

    response = client.get(
        f"{API}/applications/{application_id}/resume",
        headers=other,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Resume not found."


def test_job_seeker_cannot_download_through_recruiter_endpoint(client):
    recruiter, seeker, application_id, resume_id = (
        setup_resume_application(client)
    )

    response = client.get(
        f"{API}/applications/{application_id}/resume",
        headers=seeker,
    )

    assert response.status_code == 403


def test_resume_download_requires_login(client):
    recruiter, seeker, application_id, resume_id = (
        setup_resume_application(client)
    )

    response = client.get(
        f"{API}/applications/{application_id}/resume"
    )

    assert response.status_code == 401


def test_deleted_resume_returns_404(client):
    recruiter, seeker, application_id, resume_id = (
        setup_resume_application(client)
    )

    delete_response = client.delete(
        f"{API}/resumes/{resume_id}",
        headers=seeker,
    )
    assert delete_response.status_code == 204

    response = client.get(
        f"{API}/applications/{application_id}/resume",
        headers=recruiter,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Resume not found."