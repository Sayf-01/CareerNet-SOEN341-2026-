from tests.conftest import API

from App.database.connection import get_db
from App.main import app
from App.models.application import Application
from App.models.job import Job
from App.models.resumeFile import ResumeFile

PDF = "application/pdf"
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def register_user(client, email="resume-user@example.com"):
    client.post(
        f"{API}/auth/register",
        json={
            "full_name": "Resume User",
            "email": email,
            "password": "Password123!",
            "role": "JOB_SEEKER",
        },
    )


def login_headers(client, email="resume-user@example.com"):
    register_user(client, email=email)
    token = client.post(
        f"{API}/auth/login",
        json={"email": email, "password": "Password123!"},
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def upload_pdf(client, headers, *, name="resume.pdf", data=b"%PDF-1.4 test", content_type=PDF):
    return client.post(
        f"{API}/resumes",
        files={"file": (name, data, content_type)},
        headers=headers,
    )


def make_job():
    db = next(app.dependency_overrides[get_db]())
    try:
        job = Job(
            title="Backend Intern",
            company="CareerNet",
            location="Montreal",
            category="Software",
            description="Build APIs.",
            status="open",
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job.id
    finally:
        db.close()


def saved_resume_count():
    db = next(app.dependency_overrides[get_db]())
    try:
        return db.query(ResumeFile).count()
    finally:
        db.close()


def saved_application_count():
    db = next(app.dependency_overrides[get_db]())
    try:
        return db.query(Application).count()
    finally:
        db.close()


def test_list_empty_returns_empty_list(client):
    # Checks listing resumes returns an empty list for a brand-new user.
    headers = login_headers(client)
    response = client.get(f"{API}/resumes", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


def test_list_response_does_not_include_file_bytes(client):
    # Checks the resume list contains metadata but never includes stored file bytes.
    # Set up
    headers = login_headers(client)
    upload_pdf(client, headers)

    # Action
    response = client.get(f"{API}/resumes", headers=headers)

    # Check
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert set(response.json()[0]) == {
        "id",
        "filename",
        "content_type",
        "size_bytes",
        "uploaded_at",
    }


def test_upload_exactly_5mb_is_accepted(client):
    # Checks the 5 MB boundary is accepted without rejecting a valid PDF.
    headers = login_headers(client)
    payload = b"A" * (5 * 1024 * 1024)
    response = upload_pdf(client, headers, data=payload)
    assert response.status_code == 201
    assert response.json()["size_bytes"] == len(payload)


def test_missing_resume_id_returns_404_for_download_replace_and_delete(client):
    # Checks missing resume ids are rejected consistently for download, replace and delete.
    headers = login_headers(client)
    missing_id = 999999

    download = client.get(f"{API}/resumes/{missing_id}/download", headers=headers)
    assert download.status_code == 404

    replace = client.put(
        f"{API}/resumes/{missing_id}",
        files={"file": ("missing.pdf", b"not found", PDF)},
        headers=headers,
    )
    assert replace.status_code == 404

    delete = client.delete(f"{API}/resumes/{missing_id}", headers=headers)
    assert delete.status_code == 404


def test_delete_then_download_returns_404(client):
    # Checks deleting a resume removes it and subsequent download attempts are 404.
    headers = login_headers(client)
    created = upload_pdf(client, headers)
    resume_id = created.json()["id"]

    delete_response = client.delete(f"{API}/resumes/{resume_id}", headers=headers)
    assert delete_response.status_code == 204

    download_response = client.get(f"{API}/resumes/{resume_id}/download", headers=headers)
    assert download_response.status_code == 404


def test_wrong_file_type_is_rejected_without_storing_resume(client):
    # Checks a wrong file type returns 422 without storing a resume.
    # Set up
    headers = login_headers(client)

    # Action
    response = upload_pdf(
        client,
        headers,
        name="not-a-resume.exe",
        data=b"not a resume",
        content_type="application/octet-stream",
    )

    # Check
    assert response.status_code == 422
    assert saved_resume_count() == 0


def test_file_over_5mb_is_rejected_without_storing_resume(client):
    # Checks a file over 5 MiB returns 422 without storing a resume.
    # Set up
    headers = login_headers(client)
    payload = b"A" * (5 * 1024 * 1024 + 1)

    # Action
    response = upload_pdf(client, headers, data=payload)

    # Check
    assert response.status_code == 422
    assert saved_resume_count() == 0


def test_empty_file_is_rejected_without_storing_resume(client):
    # Checks an empty file returns 422 without storing a resume.
    # Set up
    headers = login_headers(client)

    # Action
    response = upload_pdf(client, headers, data=b"")

    # Check
    assert response.status_code == 422
    assert saved_resume_count() == 0


def test_other_user_cannot_change_resume_and_owner_data_stays_unchanged(client):
    # Checks another user cannot download, replace, or delete a resume or alter its owner copy.
    # Set up
    owner_headers = login_headers(client, "resume-owner@example.com")
    original_data = b"%PDF-1.4 owner's original resume"
    resume_id = upload_pdf(
        client, owner_headers, name="original.pdf", data=original_data
    ).json()["id"]
    other_headers = login_headers(client, "resume-other@example.com")

    # Action
    download = client.get(
        f"{API}/resumes/{resume_id}/download", headers=other_headers
    )
    replace = client.put(
        f"{API}/resumes/{resume_id}",
        files={"file": ("changed.pdf", b"changed", PDF)},
        headers=other_headers,
    )
    delete = client.delete(f"{API}/resumes/{resume_id}", headers=other_headers)

    # Check
    assert download.status_code == 404
    assert replace.status_code == 404
    assert delete.status_code == 404
    owner_list = client.get(f"{API}/resumes", headers=owner_headers)
    owner_download = client.get(
        f"{API}/resumes/{resume_id}/download", headers=owner_headers
    )
    assert owner_list.status_code == 200
    assert [resume["filename"] for resume in owner_list.json()] == ["original.pdf"]
    assert owner_download.content == original_data


def test_deleted_resume_cannot_be_used_to_apply(client):
    # Checks a deleted resume is rejected when applying and creates no application.
    # Set up
    headers = login_headers(client)
    resume_id = upload_pdf(client, headers).json()["id"]
    job_id = make_job()
    deleted = client.delete(f"{API}/resumes/{resume_id}", headers=headers)
    assert deleted.status_code == 204

    # Action
    response = client.post(
        f"{API}/applications",
        json={"job_id": job_id, "resume_id": resume_id},
        headers=headers,
    )

    # Check
    assert response.status_code == 404
    assert saved_application_count() == 0
