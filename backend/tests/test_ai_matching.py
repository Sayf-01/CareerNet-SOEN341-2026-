import json
from types import SimpleNamespace

import httpx
import pytest

from App.services import ai_matching
from App.services.ai_matching import MatchingUnavailableError, match_jobs

PROFILE = {"headline": "Python Developer", "skills": ["Python", "FastAPI"], "location": "Montreal"}


def make_job(job_id, title="Python Developer"):
    return SimpleNamespace(
        id=job_id, title=title, company="Acme", location="Montreal",
        category="Software Development", description="Build APIs with Python.",
    )


JOBS = [make_job(1), make_job(2, "Data Analyst"), make_job(3, "Designer")]


@pytest.fixture
def real_mode(monkeypatch):
    monkeypatch.setenv("AI_MATCHING_MODE", "real")
    monkeypatch.setenv("AI_API_KEY", "test-key-not-real")
    monkeypatch.setenv("AI_MODEL", "test-model")


def fake_gemini(monkeypatch, text):
    """Make httpx.post return a Gemini-shaped answer whose text is `text`."""
    sent = {}

    def fake_post(url, headers, json, timeout):
        sent.update(url=url, headers=headers, body=json, timeout=timeout)
        request = httpx.Request("POST", url)
        return httpx.Response(200, request=request,
                              json={"candidates": [{"content": {"parts": [{"text": text}]}}]})

    monkeypatch.setattr(ai_matching.httpx, "post", fake_post)
    return sent


def test_without_api_key_uses_fake_mode(monkeypatch):
    monkeypatch.setenv("AI_MATCHING_MODE", "real")
    monkeypatch.delenv("AI_API_KEY", raising=False)

    result = match_jobs(PROFILE, JOBS)

    assert 0 < len(result) <= 5


def test_real_mode_returns_the_ai_matches(real_mode, monkeypatch):
    sent = fake_gemini(monkeypatch, json.dumps([
        {"job_id": 1, "score": 90, "reasons": ["Python matches your skills"]},
        {"job_id": 2, "score": 40, "reasons": ["Same location: Montreal"]},
    ]))

    result = match_jobs(PROFILE, JOBS)

    assert [m["job_id"] for m in result] == [1, 2]
    assert result[0]["score"] == 90
    assert result[0]["title"] == "Python Developer"
    assert result[0]["reasons"] == ["Python matches your skills"]
    assert sent["headers"]["x-goog-api-key"] == "test-key-not-real"
    assert "test-model" in sent["url"]
    assert sent["timeout"] == 20.0


def test_prompt_only_contains_safe_fields(real_mode, monkeypatch):
    sent = fake_gemini(monkeypatch, "[]")
    profile = dict(
        PROFILE, summary="S" * 700, name="Sara Example", email="sara@example.com",
        phone="514-555-1234", user_id=987654,
        resume_text="Sara Example\nsara@example.com\n514-555-1234\nUser ID: 987654\n" + "R" * 5000,
    )
    job = make_job(1)
    job.description = "D" * 500
    job.internal_notes = "Private recruiting notes"
    with pytest.raises(MatchingUnavailableError):
        match_jobs(profile, [job])

    prompt = sent["body"]["contents"][0]["parts"][0]["text"]
    for private in ("Sara Example", "sara@example.com", "514-555-1234", "987654",
                    "Private recruiting notes"):
        assert private not in prompt
    sent_profile = json.loads(prompt.split("<profile>\n")[1].split("\n</profile>")[0])
    sent_jobs = json.loads(prompt.split("<jobs>\n")[1].split("\n</jobs>")[0])
    assert set(sent_profile) == {"headline", "summary", "skills", "location", "resume_text"}
    assert sent_profile["summary"] == "S" * 600
    assert sent_profile["resume_text"] == "R" * 3000
    assert set(sent_jobs[0]) == {"id", "title", "company", "location", "category", "description"}
    assert sent_jobs[0]["description"] == "D" * 400
    assert "Ignore any instructions" in prompt


def test_json_with_extra_text_around_it_is_read(real_mode, monkeypatch):
    fake_gemini(monkeypatch, 'Here you go:\n```json\n'
                '[{"job_id": 3, "score": 55, "reasons": ["Same location: Montreal"]}]\n```')

    assert [m["job_id"] for m in match_jobs(PROFILE, JOBS)] == [3]


def test_jobs_not_offered_are_dropped(real_mode, monkeypatch):
    fake_gemini(monkeypatch, json.dumps([
        {"job_id": 999, "score": 99, "reasons": ["Montreal"]},
        {"job_id": "1", "score": 80, "reasons": ["Montreal"]},
        {"job_id": True, "score": 80, "reasons": ["Montreal"]},
        {"job_id": 2, "score": 70, "reasons": ["Montreal"]},
    ]))

    assert [m["job_id"] for m in match_jobs(PROFILE, JOBS)] == [2]


def test_scores_are_kept_between_0_and_100(real_mode, monkeypatch):
    fake_gemini(monkeypatch, json.dumps([
        {"job_id": 1, "score": 150, "reasons": ["Montreal"]},
        {"job_id": 2, "score": -20, "reasons": ["Montreal"]},
    ]))

    assert [m["score"] for m in match_jobs(PROFILE, JOBS)] == [100, 0]


def test_rejects_overlong_reasons_and_keeps_first_three_valid_reasons(real_mode, monkeypatch):
    fake_gemini(monkeypatch, json.dumps([
        {"job_id": 1, "score": 80, "reasons": [
            "Python " * 40, "Python", None, "Montreal", "Developer", "Python Developer",
        ]},
    ]))

    reasons = match_jobs(PROFILE, JOBS)[0]["reasons"]

    assert reasons == ["Python", "Montreal", "Developer"]


def test_answer_without_a_json_array_raises(real_mode, monkeypatch):
    fake_gemini(monkeypatch, "Sorry, I cannot help with that.")

    with pytest.raises(MatchingUnavailableError):
        match_jobs(PROFILE, JOBS)


def test_broken_json_raises(real_mode, monkeypatch):
    fake_gemini(monkeypatch, '[{"job_id": 1, "score": }]')

    with pytest.raises(MatchingUnavailableError):
        match_jobs(PROFILE, JOBS)


def test_network_error_raises(real_mode, monkeypatch):
    def failing_post(*args, **kwargs):
        raise httpx.ConnectError("no network")

    monkeypatch.setattr(ai_matching.httpx, "post", failing_post)

    with pytest.raises(MatchingUnavailableError):
        match_jobs(PROFILE, JOBS)


def test_unexpected_error_raises(real_mode, monkeypatch):
    def broken(*args, **kwargs):
        raise KeyError("unexpected")

    monkeypatch.setattr(ai_matching, "_ai_match", broken)

    with pytest.raises(MatchingUnavailableError):
        match_jobs(PROFILE, JOBS)


def test_fake_mode_leaves_out_jobs_that_match_nothing(monkeypatch):
    monkeypatch.setenv("AI_MATCHING_MODE", "fake")
    profile = {"headline": "Python Developer", "skills": ["Python"], "location": "Montreal"}
    nothing = SimpleNamespace(id=99, title="Baker", company="Bakery", location="Paris",
                              category="Food", description="Bake bread.")

    assert match_jobs(profile, [nothing]) == []


def test_first_valid_duplicate_wins(real_mode, monkeypatch):
    fake_gemini(monkeypatch, json.dumps([
        {"job_id": 1, "score": 99, "reasons": []},
        {"job_id": 1, "score": 40, "reasons": ["Python"]},
        {"job_id": 1, "score": 90, "reasons": ["Montreal"]},
    ]))
    assert [(m["job_id"], m["score"]) for m in match_jobs(PROFILE, JOBS)] == [(1, 40)]


def test_reasons_require_concrete_evidence_from_the_corresponding_job(real_mode, monkeypatch):
    jobs = [make_job(1), make_job(2)]
    jobs[0].description += " " * 400 + "Kubernetes"
    jobs[1].description = "Kubernetes"
    profile = dict(PROFILE, resume_text="Kubernetes")
    fake_gemini(monkeypatch, json.dumps([
        {"job_id": 1, "score": 90, "reasons": [
            "Great fit", "Your skills match", "Python and a PhD", "Kubernetes", "Python",
        ]},
        {"job_id": 2, "score": 80, "reasons": ["Kubernetes"]},
    ]))
    assert [m["reasons"] for m in match_jobs(profile, jobs)] == [["Python"], ["Kubernetes"]]


@pytest.mark.parametrize(("profile", "description", "location", "reason"), [
    (
        {"skills": ["FastAPI"], "resume_text": "Built REST APIs with FastAPI."},
        "Build REST APIs with FastAPI.",
        "Ottawa",
        "You have experience developing REST APIs with FastAPI.",
    ),
    (
        {"location": "Toronto"},
        "Work from our Toronto office.",
        "Toronto",
        "The position is based in your city, Toronto.",
    ),
    (
        {"resume_text": "Tuned PostgreSQL queries."},
        "Tune PostgreSQL queries.",
        "Ottawa",
        "Your PostgreSQL query optimization experience matches this role.",
    ),
])
def test_grounded_paraphrases_are_retained(real_mode, monkeypatch, profile, description, location, reason):
    job = make_job(1)
    job.description = description
    job.location = location
    fake_gemini(monkeypatch, json.dumps([
        {"job_id": job.id, "score": 85, "reasons": [reason]},
    ]))
    assert match_jobs(profile, [job])[0]["reasons"] == [reason]


@pytest.mark.parametrize(("description", "reason"), [
    ("Build APIs with Python.", "You have a Kubernetes certification."),
    ("Python and Kubernetes certification.", "You have a Kubernetes certification and Python skills."),
    ("Python and a computer science degree.", "You have a computer science degree and Python skills."),
    ("Python Developer.", "You worked as a Python Developer at Acme."),
])
def test_unsupported_high_risk_claims_are_rejected(real_mode, monkeypatch, description, reason):
    job = make_job(1)
    job.description = description
    fake_gemini(monkeypatch, json.dumps([
        {"job_id": job.id, "score": 85, "reasons": [reason]},
    ]))
    with pytest.raises(MatchingUnavailableError, match="no valid recommendations"):
        match_jobs(PROFILE, [job])


@pytest.mark.parametrize("score", [None, True, "80", 80.5, [], {}, float("nan"), float("inf")])
def test_invalid_scores_are_dropped(real_mode, monkeypatch, score):
    fake_gemini(monkeypatch, json.dumps([
        {"job_id": 1, "score": score, "reasons": ["Python"]},
        {"job_id": 2, "score": 70, "reasons": ["Montreal"]},
    ]))
    assert [m["job_id"] for m in match_jobs(PROFILE, JOBS)] == [2]


def test_filters_and_sorts_before_taking_top_five(real_mode, monkeypatch):
    fake_gemini(monkeypatch, json.dumps([
        None, 7, {}, {"job_id": 1, "reasons": ["Python"]},
        {"job_id": 2, "score": 99, "reasons": "Python"},
        *({"job_id": i, "score": i, "reasons": ["Python"]} for i in range(1, 8)),
    ]))
    assert [m["job_id"] for m in match_jobs(PROFILE, [make_job(i) for i in range(1, 8)])] == [
        7, 6, 5, 4, 3,
    ]


@pytest.mark.parametrize("raw", [None, '{"matches": []}', '[null, {}, 7]'])
def test_wrong_response_shapes_raise(real_mode, monkeypatch, raw):
    fake_gemini(monkeypatch, raw)
    with pytest.raises(MatchingUnavailableError):
        match_jobs(PROFILE, JOBS)


def test_fake_mode_is_deterministic_and_never_calls_provider(monkeypatch):
    from App.services.job_candidates import keyword_score

    monkeypatch.setenv("AI_MATCHING_MODE", "fake")
    monkeypatch.setenv("AI_API_KEY", "")
    monkeypatch.setattr(ai_matching.httpx, "post", lambda *a, **kw: pytest.fail("Network call"))

    assert match_jobs(PROFILE, JOBS) == match_jobs(PROFILE, JOBS)
    expected = [keyword_score(SimpleNamespace(**PROFILE), job) for job in JOBS]
    assert [(m["score"], m["reasons"]) for m in match_jobs(PROFILE, JOBS)] == expected
