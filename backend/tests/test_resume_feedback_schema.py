# LA-11 tests: the ResumeFeedback answer shape (App/schemas/resume_feedback.py)

import pytest
from pydantic import ValidationError

from App.schemas.resume_feedback import Improvement, ResumeFeedback

VALID = {
    "summary": "A clear resume with solid backend experience.",
    "strengths": ["Clear project descriptions", "Relevant skills"],
    "improvements": [{"title": "Add numbers", "suggestion": "Show the impact of each project with numbers."}],
    "missing_sections": ["Certifications"],
    "keywords": ["Python", "FastAPI"],
    "mode": "fake",
}


def test_valid_answer_is_accepted():
    feedback = ResumeFeedback(**VALID)
    assert feedback.mode == "fake"
    assert feedback.improvements[0] == Improvement(
        title="Add numbers", suggestion="Show the impact of each project with numbers."
    )


def test_summary_over_800_characters_is_refused():
    with pytest.raises(ValidationError):
        ResumeFeedback(**{**VALID, "summary": "a" * 801})


def test_mode_other_than_ai_or_fake_is_refused():
    with pytest.raises(ValidationError):
        ResumeFeedback(**{**VALID, "mode": "real"})


def test_lists_default_to_empty():
    feedback = ResumeFeedback(summary="Short summary.", mode="ai")
    assert feedback.strengths == []
    assert feedback.improvements == []
    assert feedback.missing_sections == []
    assert feedback.keywords == []


def test_improvement_without_suggestion_is_refused():
    with pytest.raises(ValidationError):
        ResumeFeedback(**{**VALID, "improvements": [{"title": "Add numbers"}]})


def test_too_many_keywords_are_refused():
    with pytest.raises(ValidationError):
        ResumeFeedback(**{**VALID, "keywords": [f"k{i}" for i in range(16)]})