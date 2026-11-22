from tests.conftest import API  # Remove register_user import

def test_login_success(client):
    # Manually register the specific test user
    client.post(
        f"{API}/auth/register",
        json={"full_name": "Youssef", "email": "youssef@example.com", "password": "Password123!", "role": "JOB_SEEKER"},
    )

    response = client.post(
        f"{API}/auth/login",
        json={"email": "youssef@example.com", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "youssef@example.com"

def test_login_wrong_password(client):
    client.post(
        f"{API}/auth/register",
        json={"full_name": "Youssef", "email": "youssef@example.com", "password": "Password123!", "role": "JOB_SEEKER"},
    )

    response = client.post(
        f"{API}/auth/login",
        json={"email": "youssef@example.com", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."

def test_login_nonexistent_email(client):
    response = client.post(
        f"{API}/auth/login",
        json={"email": "doesnotexist@example.com", "password": "Password123!"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."

def test_login_email_is_case_insensitive(client):
    client.post(
        f"{API}/auth/register",
        json={"full_name": "Youssef", "email": "youssef@example.com", "password": "Password123!", "role": "JOB_SEEKER"},
    )

    response = client.post(
        f"{API}/auth/login",
        json={"email": "YOUSSEF@EXAMPLE.COM", "password": "Password123!"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "youssef@example.com"

def test_login_never_returns_password(client):
    client.post(
        f"{API}/auth/register",
        json={"full_name": "Youssef", "email": "youssef@example.com", "password": "Password123!", "role": "JOB_SEEKER"},
    )

    response = client.post(
        f"{API}/auth/login",
        json={"email": "youssef@example.com", "password": "Password123!"},
    )
    data = response.json()
    assert "password" not in data["user"]
    assert "hashed_password" not in data["user"]
