import os

# Use a throwaway in-memory database for tests. Must be set BEFORE importing the app.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-unit-tests-123456"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from App.database.base import Base
from App.database.connection import get_db
from App.main import app

engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)  # fresh tables for every test
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


# ---------- Fixtures shared by the test files ----------

API = "/api/v1"

@pytest.fixture
def registered_user(client):
    """Fixture to register a clean test user and return their details."""
    payload = {
        "full_name": "Lamees Ibeid",
        "email": "lamees@example.com",
        "password": "Password123!",
        "role": "JOB_SEEKER"
    }
    client.post(f"{API}/auth/register", json=payload)
    return payload

@pytest.fixture
def auth_headers(client, registered_user):
    """Fixture that logs in the registered user and returns Bearer token headers."""
    response = client.post(
        f"{API}/auth/login", 
        json={"email": registered_user["email"], "password": registered_user["password"]}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(autouse=True)
def reset_feedback_limit():
    # every test starts with fresh AI feedback counts, so one test can't use up another's limit
    from App.core.rate_limit import feedback_limiter
    feedback_limiter.reset()
    yield
