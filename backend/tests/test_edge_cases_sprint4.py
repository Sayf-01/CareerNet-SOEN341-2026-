# Sprint 4: tests for the last lines the coverage report showed as never run
# (AI feedback error handling, job update rules, startup helpers, error handler)

import importlib.util
import json
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from App.main import app
from App.schemas.recruiter import JobUpdate
from App.services import ai_feedback, ai_matching
from App.services.ai_feedback import AIUnavailableError

VALID = {
    "summary": "Good resume.",
    "strengths": ["Clear."],
    "improvements": [{"title": "Metrics", "suggestion": "Add numbers."}],
    "missing_sections": ["Projects"],
    "keywords": ["Python"],
}


def make_valid(**changes):
    data = json.loads(json.dumps(VALID))
    data.update(changes)
    return json.dumps(data)


# ----- AI feedback: reading the provider and its answer -----

def configure(monkeypatch, mode="real", key="test-key-not-real", model="test-model"):
    monkeypatch.setenv("AI_FEEDBACK_MODE", mode)
    monkeypatch.setenv("AI_API_KEY", key)
    monkeypatch.setenv("AI_MODEL", model)


def test_provider_call_needs_a_key_and_a_model(monkeypatch):
    configure(monkeypatch, model="")
    with pytest.raises(AIUnavailableError, match="No provider"):
        ai_feedback._call_provider("prompt")


def test_provider_answer_must_not_be_empty(monkeypatch):
    configure(monkeypatch)

    class Response:
        def raise_for_status(self):
            pass

        def json(self):
            return {"candidates": [{"content": {"parts": [{"text": "   "}]}}]}

    monkeypatch.setattr(httpx, "post", lambda *a, **k: Response())
    with pytest.raises(AIUnavailableError, match="unavailable"):
        ai_feedback._call_provider("prompt")


def test_parse_rejects_non_text():
    with pytest.raises(AIUnavailableError):
        ai_feedback._parse_feedback(None)


@pytest.mark.parametrize(
    "raw",
    [
        "no json here",
        "} backwards {",
        "{not valid json}",
        make_valid(summary=5),
        make_valid(strengths="not a list"),
        make_valid(strengths=[1, 2]),
        make_valid(keywords=[None]),
        make_valid(improvements=["just text"]),
        make_valid(improvements=[{"title": 1, "suggestion": "x"}]),
        make_valid(improvements=[{"title": "x", "suggestion": 2}]),
        json.dumps({"summary": "only this"}),
    ],
)
def test_parse_rejects_answers_with_the_wrong_shape(raw):
    with pytest.raises(AIUnavailableError, match="could not be read"):
        ai_feedback._parse_feedback(raw)


def test_parse_rejects_json_that_is_not_an_object(monkeypatch):
    monkeypatch.setattr(ai_feedback.json, "loads", lambda text: ["a", "list"])
    with pytest.raises(AIUnavailableError, match="could not be read"):
        ai_feedback._parse_feedback("{}")


def test_parse_accepts_a_valid_answer_and_marks_it_ai():
    result = ai_feedback._parse_feedback("text before " + make_valid() + " text after")
    assert result.mode == "ai"
    assert result.keywords == ["Python"]


def test_unexpected_errors_become_ai_unavailable(monkeypatch):
    configure(monkeypatch)
    monkeypatch.setattr(ai_feedback, "_call_provider", lambda prompt: 1 / 0)
    with pytest.raises(AIUnavailableError, match="unavailable"):
        ai_feedback.generate_resume_feedback("resume text")


# ----- AI matching: answer that is not a list -----

def test_matching_rejects_an_answer_that_is_not_a_list(monkeypatch):
    monkeypatch.setattr(ai_matching.json, "loads", lambda text: {"not": "a list"})
    with pytest.raises(ai_matching.MatchingUnavailableError, match="parse"):
        ai_matching._parse_matches("[1]", [])


# ----- Job update rules -----

@pytest.mark.parametrize("field", ["title", "company", "location", "description"])
@pytest.mark.parametrize("value", [None, "", "   "])
def test_job_update_rejects_blank_text_fields(field, value):
    with pytest.raises(ValidationError):
        JobUpdate(**{field: value})


def test_job_update_rejects_a_null_category():
    with pytest.raises(ValidationError):
        JobUpdate(category=None)


def test_job_update_trims_text_and_allows_missing_fields():
    update = JobUpdate(title="  New title ")
    assert update.title == "New title"
    assert update.company is None


# ----- Database URL fix-up -----

def load_connection_module(monkeypatch, url):
    # Load a private copy of connection.py with a fake engine, so the real one is untouched.
    import sqlalchemy

    created = {}

    def fake_create_engine(database_url, *args, **kwargs):
        created["url"] = database_url
        return object()

    monkeypatch.setenv("DATABASE_URL", url)
    monkeypatch.setattr(sqlalchemy, "create_engine", fake_create_engine)
    path = Path(__file__).resolve().parent.parent / "App" / "database" / "connection.py"
    spec = importlib.util.spec_from_file_location("connection_copy", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, created


def test_postgres_scheme_is_changed_to_postgresql(monkeypatch):
    module, created = load_connection_module(monkeypatch, "postgres://user:pw@host/db")
    assert module.DATABASE_URL == "postgresql://user:pw@host/db"
    assert created["url"] == "postgresql://user:pw@host/db"


def test_other_database_urls_are_left_alone(monkeypatch):
    module, _ = load_connection_module(monkeypatch, "sqlite:///./x.db")
    assert module.DATABASE_URL == "sqlite:///./x.db"


# ----- Unexpected errors -----

def test_unexpected_server_errors_return_a_plain_500():
    async def boom():
        raise RuntimeError("secret internal detail")

    app.add_api_route("/api/v1/_test_boom", boom, methods=["GET"])
    try:
        response = TestClient(app, raise_server_exceptions=False).get("/api/v1/_test_boom")
    finally:
        app.router.routes.pop()

    assert response.status_code == 500
    assert response.json() == {"detail": "Internal server error."}
    assert "secret" not in response.text


def test_job_update_accepts_a_valid_category():
    assert JobUpdate(category="Design").category == "Design"
