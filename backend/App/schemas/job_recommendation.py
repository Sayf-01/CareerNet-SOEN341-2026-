"""LA-12 / Team Guide §4: shared contract for job recommendations.

JobRecommendation  — one scored match.
RecommendationList — the envelope returned by GET /api/v1/jobs/recommendations.

Youssef (YO-14 docs), Dany (DA-11 panel) and Lamees (LA-12 endpoint) all import
from here so the response shape is defined in one place.
"""

from typing import Literal

from pydantic import BaseModel, Field


class JobRecommendation(BaseModel):
    """One recommended job with its AI or keyword score."""

    job_id: int
    title: str
    company: str
    location: str
    category: str
    score: int = Field(ge=0, le=100, description="Match quality 0–100.")
    reasons: list[str] = Field(
        default_factory=list,
        description="Short sentences explaining the match (each ≤ 200 chars).",
    )


class RecommendationList(BaseModel):
    """Envelope returned by GET /api/v1/jobs/recommendations.

    items       – up to 5 JobRecommendation entries, best score first.
    mode        – "ai" (real model answered), "fake" (no key / test), "fallback" (AI error).
    resume_used – True when the user's latest resume text was sent to the model.
    message     – set when items is empty or the caller should see a notice.
    """

    items: list[JobRecommendation] = Field(default_factory=list)
    mode: Literal["ai", "fake", "fallback"]
    resume_used: bool = False
    message: str | None = None
