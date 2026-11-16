import App.routers.resumes as resumes_router
from App.services.ai_feedback import AIUnavailableError
from tests.conftest import API
from tests.resume_samples import SAMPLE_RESUME_TEXT, make_docx_bytes, make_pdf_bytes
from tests.test_profile import login_as

PDF = "application/pdf"
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
DOC = "application/msword"

FEEDBACK_KEYS = {"summary", "strengths", "improvements", "missing_sections", "keywords"}


# ---------- helpers ----------

def upload(client, headers, name, data, content_type):
    # uploads a resume and returns its id
    response = client.post(f"{API}/resumes", files={"file": (name, data, content_type)}, headers=headers)
    assert response.status_code == 201
    return response.json()["id"]


def feedback(client, headers, resume_id):
    return client.post(f"{API}/resumes/{resume_id}/feedback", headers=headers)


# ---------- tests ----------

def test_readable_pdf_gives_fake_feedback(client):
    seeker = login_as(client, "seeker@example.com")
    resume_id = upload(client, seeker, "cv.pdf", make_pdf_bytes(SAMPLE_RESUME_TEXT), PDF)

    response = feedback(client, seeker, resume_id)

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "fake"
    assert FEEDBACK_KEYS <= set(body)


def test_readable_docx_gives_200(client):
    seeker = login_as(client, "seeker@example.com")
    resume_id = upload(client, seeker, "cv.docx", make_docx_bytes(SAMPLE_RESUME_TEXT), DOCX)

    assert feedback(client, seeker, resume_id).status_code == 200


def test_someone_elses_resume_gives_404(client):
    alice = login_as(client, "alice@example.com")
    bob = login_as(client, "bob@example.com")
    resume_id = upload(client, alice, "cv.pdf", make_pdf_bytes(SAMPLE_RESUME_TEXT), PDF)

    response = feedback(client, bob, resume_id)

    assert response.status_code == 404
    assert response.json() == {"detail": "Resume not found."}


def test_missing_resume_gives_404(client):
    seeker = login_as(client, "seeker@example.com")

    assert feedback(client, seeker, 9999).status_code == 404


def test_pdf_with_no_text_gives_422(client):
    seeker = login_as(client, "seeker@example.com")
    resume_id = upload(client, seeker, "scan.pdf", make_pdf_bytes(""), PDF)  # like a scanned file

    response = feedback(client, seeker, resume_id)

    assert response.status_code == 422
    assert response.json() == {"detail": "We could not read text from this file."}


def test_old_doc_file_gives_422(client):
    seeker = login_as(client, "seeker@example.com")
    resume_id = upload(client, seeker, "cv.doc", b"old word file", DOC)

    response = feedback(client, seeker, resume_id)

    assert response.status_code == 422
    assert response.json() == {"detail": "We could not read text from this file."}


def test_ai_unavailable_gives_503(client, monkeypatch):
    seeker = login_as(client, "seeker@example.com")
    resume_id = upload(client, seeker, "cv.pdf", make_pdf_bytes(SAMPLE_RESUME_TEXT), PDF)

    def broken_ai(text):
        raise AIUnavailableError("AI service unavailable")

    # replace Youssef's function, only for this test, with one that always fails
    monkeypatch.setattr(resumes_router, "generate_resume_feedback", broken_ai)

    response = feedback(client, seeker, resume_id)

    assert response.status_code == 503
    assert response.json() == {"detail": "AI feedback is temporarily unavailable."}


def test_no_token_gives_401(client):
    assert client.post(f"{API}/resumes/1/feedback").status_code == 401


def test_response_does_not_contain_the_resume_text(client):
    seeker = login_as(client, "seeker@example.com")
    resume_id = upload(client, seeker, "cv.pdf", make_pdf_bytes(SAMPLE_RESUME_TEXT), PDF)

    answer = feedback(client, seeker, resume_id).text

    for private_detail in ("Alex Morgan", "alex.morgan@example.com", "Northwind Labs"):
        assert private_detail not in answer