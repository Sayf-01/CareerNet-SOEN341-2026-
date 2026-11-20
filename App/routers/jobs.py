import os

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from App.core.dependencies import get_current_user
from App.core.rate_limit import recommendations_limiter
from App.crud.jobs import search_jobs, get_job
from App.database.connection import get_db
from App.models.profile import Profile
from App.models.resumeFile import ResumeFile
from App.models.user import User, UserRole
from App.schemas.job import JobListResponse, JobDetail
from App.schemas.job_recommendation import JobRecommendation, RecommendationList
from App.services.ai_matching import MatchingUnavailableError, match_jobs
from App.services.job_candidates import get_candidate_jobs, fallback_recommendations
from App.services.resume_text import ResumeTextError, extract_resume_text


router = APIRouter(prefix="/jobs", tags=["jobs"])

# ---------- LA-12: job recommendations ----------

_RATE_LIMITED = "You have used your hourly AI limit. Please try again later."
_NO_PROFILE = "Add skills or a headline to your profile first."


@router.get("/recommendations", response_model=RecommendationList, tags=["recommendations"])
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return up to 5 personalised job recommendations for the logged-in job seeker.

    * Recruiter → 403.
    * No token   → 401.
    * No headline and no skills → 409.
    * Rate limit exceeded → 429.
    * AI error → keyword fallback with mode="fallback".
    """
    # 1. Job seekers only
    if current_user.role == UserRole.RECRUITER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter access required",
        )

    # 2. Build the profile – fetch only public non-PII fields; never log name/email/phone
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    headline = (profile.headline or "").strip() if profile else ""
    skills: list[str] = (
        [s for s in (profile.skills or []) if isinstance(s, str) and s.strip()]
        if profile
        else []
    )

    if not headline and not skills:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=_NO_PROFILE)

    # 3. Rate limiter (5 AI calls per user per hour)
    if not recommendations_limiter.allow(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=_RATE_LIMITED
        )

    # 4. Try to include resume text (best-effort; failures never block the request)
    resume_text = ""
    resume_used = False
    latest_resume = (
        db.query(ResumeFile)
        .filter(ResumeFile.user_id == current_user.id)
        .order_by(ResumeFile.uploaded_at.desc())
        .first()
    )
    if latest_resume is not None:
        try:
            resume_text = extract_resume_text(
                latest_resume.content_type, latest_resume.file_data
            )
            resume_used = True
        except ResumeTextError:
            pass  # no resume text — that's fine

    profile_data = {
        "headline": headline,
        "summary": (profile.summary or "") if profile else "",
        "skills": skills,
        "location": (profile.location or "") if profile else "",
        "resume_text": resume_text,  # never the user's name, email, phone or user id
    }

    # 5. Get candidates and call the matching service; fall back on any error
    candidates = get_candidate_jobs(db, current_user.id)

    try:
        scored = match_jobs(profile_data, candidates)
        mode = "ai" if os.getenv("AI_MATCHING_MODE", "fake").lower() == "real" else "fake"
    except MatchingUnavailableError:
        fallback = fallback_recommendations(db, current_user.id)
        return RecommendationList(
            items=[JobRecommendation(**item) for item in fallback["items"]],
            mode="fallback",
            resume_used=False,
            message=fallback.get("message"),
        )

    items = [JobRecommendation(**item) for item in scored]
    message = None if items else "No matching jobs found yet."
    return RecommendationList(
        items=items, mode=mode, resume_used=resume_used, message=message
    )


# ---------- existing routes ----------


@router.get("", response_model=JobListResponse)
def list_jobs(
    keyword: str | None = None,
    location: str | None = None,
    category: str | None = None,
    page: int = Query(default=1, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List open jobs with optional search filters."""

    result = search_jobs(
        db=db,
        keyword=keyword,
        location=location,
        category=category,
        page=page,
        include_closed=False,
    )

    return result


@router.get("/{id}", response_model=JobDetail)
def job_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve the full details of a job."""

    job = get_job(db=db, job_id=id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    return job
