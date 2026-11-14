from typing import Literal

from pydantic import BaseModel, Field


class Improvement(BaseModel):
    """One piece of advice: a short title and what to change."""

    title: str = Field(max_length=120)
    suggestion: str = Field(max_length=600)


class ResumeFeedback(BaseModel):
    """The AI feedback answer for one resume (the shared contract for US-6).

    Used by Youssef's AI service (YO-10), the endpoint (LA-10) and the frontend panel.
    mode is "ai" when a real AI service answered, "fake" for the canned answer (no key needed).
    """

    summary: str = Field(max_length=800)
    strengths: list[str] = Field(default_factory=list, max_length=8)
    improvements: list[Improvement] = Field(default_factory=list, max_length=8)
    missing_sections: list[str] = Field(default_factory=list, max_length=8)
    keywords: list[str] = Field(default_factory=list, max_length=15)
    mode: Literal["ai", "fake"]