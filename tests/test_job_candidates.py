# KA-14 tests for candidate jobs, keyword score and fallback recommendations.

from datetime import datetime, timedelta, timezone

from App.main import app
from App.database.connection import get_db
from App.models.application import Application
from App.models.job import Job
from App.models.profile import Profile
from App.models.user import User, UserRole
from App.services import job_candidates as svc

START = datetime(2026, 11, 1, 9, 0, tzinfo=timezone.utc)  # fixed dates so the order never depends on the clock


def new_session():
    # a session on the test database (same way as the other service tests)
    return next(app.dependency_overrides[get_db]())


def make_user(db, email="seeker@example.com"):
    # creates a job seeker directly in the database
    user = User(full_name="Test", email=email, hashed_password="x", role=UserRole.JOB_SEEKER)
    db.add(user)
    db.commit()
    return user


def make_job(db, title="Backend Developer", description="Build APIs.", location="Montreal",
             status="open", days=0):
    # creates a job; a bigger "days" means a newer job
    job = Job(title=title, company="Acme", location=location, category="Software Development",
              description=description, status=status, posted_at=START + timedelta(days=days))
    db.add(job)
    db.commit()
    return job


def make_profile(db, user_id, skills=None, headline=None, location=None):
    # creates a profile with only the fields the score uses
    profile = Profile(user_id=user_id, skills=skills or [], headline=headline, location=location)
    db.add(profile)
    db.commit()
    return profile


class FakeProfile:
    # a profile without the database, for the pure scoring tests
    def __init__(self, skills=None, headline=None, location=None):
        self.skills = skills or []
        self.headline = headline
        self.location = location


class FakeJob:
    # a job without the database, for the pure scoring tests
    def __init__(self, title="Developer", description="", location="Toronto"):
        self.title = title
        self.description = description
        self.location = location


# ---------- get_candidate_jobs ----------

def test_applied_jobs_are_excluded(client):
    db = new_session()
    user = make_user(db)
    applied = make_job(db, title="Applied Job")
    other = make_job(db, title="Other Job")
    db.add(Application(user_id=user.id, job_id=applied.id))
    db.commit()
    ids = [job.id for job in svc.get_candidate_jobs(db, user.id)]
    assert ids == [other.id]
    db.close()


def test_other_users_applications_do_not_hide_jobs(client):
    db = new_session()
    me = make_user(db)
    someone = make_user(db, email="other@example.com")
    job = make_job(db)
    db.add(Application(user_id=someone.id, job_id=job.id))
    db.commit()
    assert [j.id for j in svc.get_candidate_jobs(db, me.id)] == [job.id]
    db.close()


def test_closed_jobs_are_excluded(client):
    db = new_session()
    user = make_user(db)
    make_job(db, status="closed")
    open_job = make_job(db)
    assert [j.id for j in svc.get_candidate_jobs(db, user.id)] == [open_job.id]
    db.close()


def test_newest_first_and_limit(client):
    db = new_session()
    user = make_user(db)
    for day in range(35):
        make_job(db, title=f"Job {day}", days=day)
    jobs = svc.get_candidate_jobs(db, user.id)
    assert len(jobs) == 30  # default limit
    assert jobs[0].title == "Job 34"  # newest first
    assert jobs[-1].title == "Job 5"
    assert len(svc.get_candidate_jobs(db, user.id, limit=3)) == 3
    db.close()


def test_same_date_ordered_by_id(client):
    db = new_session()
    user = make_user(db)
    first = make_job(db, title="First")
    second = make_job(db, title="Second")  # same posted_at, higher id
    assert [j.id for j in svc.get_candidate_jobs(db, user.id)] == [second.id, first.id]
    db.close()


# ---------- keyword_score ----------

def test_each_skill_gives_10_points():
    job = FakeJob(title="Backend Developer", description="We use Python and SQL daily.")
    score, reasons = svc.keyword_score(FakeProfile(skills=["Python", "SQL", "Rust"]), job)
    assert score == 20
    assert reasons == ["Matches your skills: python, sql"]


def test_skills_are_whole_words_and_any_case():
    job = FakeJob(description="We write JAVASCRIPT and C++.")
    score, _ = svc.keyword_score(FakeProfile(skills=["java", "javascript", "c++"]), job)
    assert score == 20  # "java" does not match inside "javascript"


def test_skill_points_stop_at_80():
    skills = [f"skill{i}" for i in range(10)]
    job = FakeJob(description=" ".join(skills))
    score, _ = svc.keyword_score(FakeProfile(skills=skills), job)
    assert score == 80


def test_same_skill_twice_counts_once():
    score, _ = svc.keyword_score(FakeProfile(skills=["Python", "python"]), FakeJob(description="python"))
    assert score == 10


def test_headline_word_in_title_gives_10():
    job = FakeJob(title="Senior Data Engineer")
    score, reasons = svc.keyword_score(FakeProfile(headline="Data analyst"), job)
    assert score == 10
    assert reasons == ["Job title matches your headline: data"]


def test_headline_counts_once_and_ignores_tiny_words():
    job = FakeJob(title="Data Engineer at a startup")
    score, _ = svc.keyword_score(FakeProfile(headline="a data engineer"), job)
    assert score == 10  # two matching words still give 10; "a" is ignored


def test_same_location_gives_10():
    score, reasons = svc.keyword_score(FakeProfile(location=" montreal "), FakeJob(location="Montreal"))
    assert score == 10
    assert reasons == ["Same location: Montreal"]


def test_all_rules_together_reach_100():
    skills = [f"s{i}" for i in range(8)]
    job = FakeJob(title="Python Developer", description=" ".join(skills), location="Toronto")
    profile = FakeProfile(skills=skills, headline="Python developer", location="Toronto")
    score, reasons = svc.keyword_score(profile, job)
    assert score == 100
    assert len(reasons) == 3


def test_empty_or_missing_profile_scores_0():
    job = FakeJob(title="Python Developer", description="python", location="Toronto")
    assert svc.keyword_score(FakeProfile(), job) == (0, [])
    assert svc.keyword_score(None, job) == (0, [])


# ---------- fallback_recommendations ----------

def test_fallback_returns_top_5_best_first(client):
    db = new_session()
    user = make_user(db)
    make_profile(db, user.id, skills=["python", "sql", "docker"], location="Montreal")
    make_job(db, title="No match", description="Sales", location="Paris", days=0)
    for day in range(1, 7):
        make_job(db, title=f"One skill {day}", description="python", location="Paris", days=day)
    best = make_job(db, title="Best", description="python sql docker", location="Montreal", days=7)

    result = svc.fallback_recommendations(db, user.id)
    assert result["mode"] == "fallback"
    assert result["resume_used"] is False
    assert result["message"] is None
    assert len(result["items"]) == 5
    assert result["items"][0]["job_id"] == best.id
    assert result["items"][0]["score"] == 40
    # equal scores keep the newest first
    assert [i["title"] for i in result["items"][1:]] == ["One skill 6", "One skill 5", "One skill 4", "One skill 3"]
    assert set(result["items"][0]) == {"job_id", "title", "company", "location", "category", "score", "reasons"}
    db.close()


def test_fallback_skips_applied_and_unmatched_jobs(client):
    db = new_session()
    user = make_user(db)
    make_profile(db, user.id, skills=["python"])
    applied = make_job(db, description="python")
    make_job(db, description="sales only")
    db.add(Application(user_id=user.id, job_id=applied.id))
    db.commit()
    result = svc.fallback_recommendations(db, user.id)
    assert result["items"] == []
    assert result["message"] == "No matching jobs found yet."
    db.close()


def test_fallback_without_profile_is_empty(client):
    db = new_session()
    user = make_user(db)
    make_job(db, description="python")
    assert svc.fallback_recommendations(db, user.id)["items"] == []
    db.close()
