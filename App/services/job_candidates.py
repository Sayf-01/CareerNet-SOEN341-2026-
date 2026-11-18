# KA-14: picks the jobs the AI job matching can recommend, and scores them with keywords.
# The keyword score is also the fallback when the AI is off or gives a bad answer.
# Only profile skills, headline and location are used, never name, email or phone.

import re

from sqlalchemy import exists
from sqlalchemy.orm import Session

from App.models.application import Application
from App.models.job import Job
from App.models.profile import Profile

MAX_CANDIDATES = 30  # the AI only looks at this many jobs
TOP_N = 5  # how many recommendations we return

SKILL_POINTS = 10  # per skill found in the job
MAX_SKILL_POINTS = 80  # skills can give at most this much
HEADLINE_POINTS = 10  # a headline word is in the job title
LOCATION_POINTS = 10  # same location as the profile

MIN_HEADLINE_WORD = 3  # skip tiny words like "a" or "of" in the headline
MAX_REASON = 200  # each reason must stay short (matches the schema)


def get_candidate_jobs(db: Session, user_id: int, limit: int = MAX_CANDIDATES):
    # Open jobs the user has not applied to, newest first, in one query (no loop over jobs)
    already_applied = exists().where(
        Application.job_id == Job.id,
        Application.user_id == user_id,
    )
    return (
        db.query(Job)
        .filter(Job.status == "open", ~already_applied)
        .order_by(Job.posted_at.desc(), Job.id.desc())  # id breaks ties, so the order is always the same
        .limit(max(limit, 0))
        .all()
    )


def _has_word(word: str, text: str) -> bool:
    # True if word appears as a whole word, any case ("java" does not match "javascript")
    # Lookarounds instead of \b so skills like "c++" or "c#" still work
    pattern = r"(?<!\w)" + re.escape(word) + r"(?!\w)"
    return re.search(pattern, text, re.IGNORECASE) is not None


def _short(text: str) -> str:
    # cut a reason that is too long
    return text if len(text) <= MAX_REASON else text[: MAX_REASON - 3] + "..."


def keyword_score(profile, job):
    # Returns (score from 0 to 100, list of reasons). An empty or missing profile gives (0, []).
    if profile is None:
        return 0, []

    score = 0
    reasons = []
    job_text = f"{job.title or ''} {job.description or ''}"

    # +10 for each skill found in the title or description, at most 80
    skills = [s.strip() for s in (profile.skills or []) if isinstance(s, str) and s.strip()]
    matched = []
    for skill in skills:
        if skill.lower() not in (m.lower() for m in matched) and _has_word(skill, job_text):
            matched.append(skill)
    if matched:
        score += min(len(matched) * SKILL_POINTS, MAX_SKILL_POINTS)
        reasons.append(_short("Matches your skills: " + ", ".join(m.lower() for m in matched)))

    # +10 if a word from the headline is in the job title
    headline_words = re.findall(r"\w[\w+#]*", profile.headline or "")
    for word in headline_words:
        if len(word) >= MIN_HEADLINE_WORD and _has_word(word, job.title or ""):
            score += HEADLINE_POINTS
            reasons.append(_short(f"Job title matches your headline: {word.lower()}"))
            break  # only counts once

    # +10 if the location is the same (any case, extra spaces ignored)
    profile_location = (profile.location or "").strip().lower()
    if profile_location and profile_location == (job.location or "").strip().lower():
        score += LOCATION_POINTS
        reasons.append(_short(f"Same location: {job.location.strip()}"))

    return min(score, 100), reasons


def fallback_recommendations(db: Session, user_id: int):
    # Top 5 candidate jobs by keyword score, in the RecommendationList shape with mode "fallback".
    # Plain dicts for now; LA-12 can turn them into the schema once it exists.
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    jobs = get_candidate_jobs(db, user_id)

    scored = []
    for job in jobs:  # jobs are already loaded, so no query happens in this loop
        score, reasons = keyword_score(profile, job)
        if score > 0:  # a job with no match has no reason to be recommended
            scored.append((score, job, reasons))

    # Best score first; sorted() keeps the newest-first order for equal scores
    scored = sorted(scored, key=lambda item: item[0], reverse=True)[:TOP_N]

    items = [
        {
            "job_id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "category": job.category,
            "score": score,
            "reasons": reasons,
        }
        for score, job, reasons in scored
    ]
    return {
        "items": items,
        "mode": "fallback",
        "resume_used": False,
        "message": None if items else "No matching jobs found yet.",
    }
