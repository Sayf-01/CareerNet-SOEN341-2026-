from tests.conftest import API
from tests.test_profile import login_as

# Each test logs in, then uploads/lists/downloads/replaces/deletes resumes with that token.

PDF = "application/pdf"
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def upload(client, headers, name="resume.pdf", data=b"%PDF-1.4 fake pdf", content_type=PDF):
    # Sends a file the same way the browser's file picker does.
    return client.post(f"{API}/resumes", files={"file": (name, data, content_type)}, headers=headers)


def test_upload_pdf(client, auth_headers):
    # A valid PDF -> 201 with its details (and never the file itself).
    response = upload(client, auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["filename"] == "resume.pdf"
    assert body["content_type"] == PDF
    assert body["size_bytes"] == len(b"%PDF-1.4 fake pdf")
    assert set(body) == {"id", "filename", "content_type", "size_bytes", "uploaded_at"}


def test_upload_word_file(client, auth_headers):
    # A Word file (.docx) is also accepted.
    assert upload(client, auth_headers, name="cv.docx", content_type=DOCX).status_code == 201


def test_list_shows_my_resumes(client, auth_headers):
    # After two uploads, the list shows both.
    upload(client, auth_headers, name="first.pdf")
    upload(client, auth_headers, name="second.pdf")
    response = client.get(f"{API}/resumes", headers=auth_headers)
    assert response.status_code == 200
    assert sorted(r["filename"] for r in response.json()) == ["first.pdf", "second.pdf"]


def test_download_returns_the_same_file(client, auth_headers):
    # Downloading gives back exactly the bytes that were uploaded.
    resume_id = upload(client, auth_headers, data=b"%PDF my real content").json()["id"]
    response = client.get(f"{API}/resumes/{resume_id}/download", headers=auth_headers)
    assert response.status_code == 200
    assert response.content == b"%PDF my real content"
    assert response.headers["content-type"] == PDF
    assert response.headers["content-disposition"] == 'attachment; filename="resume.pdf"'


def test_replace_changes_the_file(client, auth_headers):
    # Replacing swaps the file and its name.
    resume_id = upload(client, auth_headers).json()["id"]
    response = client.put(f"{API}/resumes/{resume_id}", files={"file": ("new.docx", b"word file", DOCX)},
                          headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["filename"] == "new.docx"
    assert client.get(f"{API}/resumes/{resume_id}/download", headers=auth_headers).content == b"word file"


def test_delete_removes_it(client, auth_headers):
    # Deleting -> 204, the list is empty, and deleting again -> 404.
    resume_id = upload(client, auth_headers).json()["id"]
    assert client.delete(f"{API}/resumes/{resume_id}", headers=auth_headers).status_code == 204
    assert client.get(f"{API}/resumes", headers=auth_headers).json() == []
    assert client.delete(f"{API}/resumes/{resume_id}", headers=auth_headers).status_code == 404


def test_wrong_file_type_is_422(client, auth_headers):
    # An .exe (or any non PDF/Word file) is refused.
    response = upload(client, auth_headers, name="virus.exe", content_type="application/octet-stream")
    assert response.status_code == 422
    assert response.json() == {"detail": "Only PDF or Word files up to 5 MB are allowed."}


def test_file_over_5mb_is_422(client, auth_headers):
    # One byte over 5 MB is refused.
    response = upload(client, auth_headers, data=b"a" * (5 * 1024 * 1024 + 1))
    assert response.status_code == 422


def test_empty_file_is_422(client, auth_headers):
    response = upload(client, auth_headers, data=b"")
    assert response.status_code == 422
    assert response.json() == {"detail": "The file is empty."}


def test_cannot_touch_someone_elses_resume(client, auth_headers):
    # User B can't list, download, replace or delete user A's resume -> 404 (not 403).
    resume_id = upload(client, auth_headers).json()["id"]
    other_user = login_as(client, "other@example.com")

    assert client.get(f"{API}/resumes", headers=other_user).json() == []
    assert client.get(f"{API}/resumes/{resume_id}/download", headers=other_user).status_code == 404
    assert client.put(f"{API}/resumes/{resume_id}", files={"file": ("x.pdf", b"x", PDF)},
                      headers=other_user).status_code == 404
    assert client.delete(f"{API}/resumes/{resume_id}", headers=other_user).status_code == 404


def test_resumes_need_login(client):
    # No token -> 401.
    assert client.get(f"{API}/resumes").status_code == 401
    assert upload(client, {}).status_code == 401