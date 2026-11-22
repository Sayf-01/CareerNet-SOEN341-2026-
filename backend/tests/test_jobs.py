# SA-9 tests for the job endpoints (YO-1)

import pytest

from tests.conftest import API
from App.main import app
from App.database.connection import get_db
from App.models.job import Job


@pytest.fixture
def add_job(client):
    # adds a job directly to the test db so we don't need the recruiter endpoint
    def _add_job(**overrides):
        job = {
            "title": "Backend Developer",
            "company": "Acme",
            "location": "Montreal",
            "category": "Software Development",
            "description": "Build APIs with FastAPI.",
            "status": "open",
            **overrides,
        }
        db = next(app.dependency_overrides[get_db]())
        row = Job(**job)
        db.add(row)
        db.commit()
        job_id = row.id
        db.close()
        return job_id

    return _add_job


def titles(response):
    return sorted(job["title"] for job in response.json()["items"])


def test_jobs_require_login(client):
    response = client.get(f"{API}/jobs")
    assert response.status_code == 401


def test_open_job_appears_in_list(client, auth_headers, add_job):
    add_job(title="Backend Developer")

    response = client.get(f"{API}/jobs", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert titles(response) == ["Backend Developer"]


def test_closed_jobs_are_not_listed(client, auth_headers, add_job):
    add_job(title="Open Job")
    add_job(title="Closed Job", status="closed")

    response = client.get(f"{API}/jobs", headers=auth_headers)

    assert titles(response) == ["Open Job"]


def test_keyword_search_matches_title_company_or_description(client, auth_headers, add_job):
    add_job(title="Python Developer")
    add_job(title="Designer", company="PythonCorp")
    add_job(title="Analyst", description="You will use python daily.")
    add_job(title="Accountant", description="Excel and taxes.")

    # uppercase on purpose, search should ignore case
    response = client.get(f"{API}/jobs", params={"keyword": "PYTHON"}, headers=auth_headers)

    assert titles(response) == ["Analyst", "Designer", "Python Developer"]


def test_location_and_category_filters(client, auth_headers, add_job):
    add_job(title="MTL Dev", location="Montreal", category="Software Development")
    add_job(title="TO Dev", location="Toronto", category="Software Development")
    add_job(title="MTL Designer", location="Montreal", category="Design")

    response = client.get(
        f"{API}/jobs",
        params={"location": "montreal", "category": "Software Development"},
        headers=auth_headers,
    )

    assert titles(response) == ["MTL Dev"]


def test_search_with_no_match_returns_empty_list(client, auth_headers, add_job):
    add_job(title="Backend Developer")

    response = client.get(f"{API}/jobs", params={"keyword": "astronaut"}, headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["total"] == 0


def test_pagination_returns_10_per_page(client, auth_headers, add_job):
    for i in range(12):
        add_job(title=f"Job {i}")

    page_1 = client.get(f"{API}/jobs", params={"page": 1}, headers=auth_headers).json()
    page_2 = client.get(f"{API}/jobs", params={"page": 2}, headers=auth_headers).json()

    assert page_1["total"] == 12
    assert len(page_1["items"]) == 10
    assert len(page_2["items"]) == 2


def test_job_detail_returns_full_job(client, auth_headers, add_job):
    job_id = add_job(title="Backend Developer", description="Build APIs with FastAPI.")

    response = client.get(f"{API}/jobs/{job_id}", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == job_id
    assert body["title"] == "Backend Developer"
    assert body["description"] == "Build APIs with FastAPI."
    assert body["status"] == "open"


def test_unknown_job_is_404(client, auth_headers):
    response = client.get(f"{API}/jobs/9999", headers=auth_headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "Job not found"}