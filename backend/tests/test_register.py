from tests.conftest import API  # Remove register_user from here

# Status codes: 201 = created, 400 = invalid input, 409 = email already used.

def test_register_job_seeker(client):
    # Send a clean registration request to the backend
    response = client.post(
        f"{API}/auth/register",
        json={
            "full_name": "Lamees Ibeid",
            "email": "lamees@example.com",
            "password": "Password123!",
            "role": "JOB_SEEKER"
        },
    )
    
    # Verify the backend's response matches exactly what we expect
    assert response.status_code == 201
    body = response.json()
    assert body["message"] == "Registration successful!"
    assert body["user"] == {
        "id": 1,
        "full_name": "Lamees Ibeid",
        "email": "lamees@example.com",
        "role": "JOB_SEEKER",
    }


def test_register_recruiter(client):
    # This test manually triggers client.post, so it doesn't need the helper fixture
    response = client.post(
        f"{API}/auth/register",
        json={"full_name": "Lamees Ibeid", "email": "rec@example.com", "password": "Password123!", "role": "RECRUITER"},
    )
    assert response.status_code == 201
    assert response.json()["user"]["role"] == "RECRUITER"

def test_response_never_contains_password(client):
    response = client.post(
        f"{API}/auth/register",
        json={"full_name": "Lamees Ibeid", "email": "pwd-test@example.com", "password": "Password123!", "role": "JOB_SEEKER"},
    )
    text = response.text.lower()
    assert "password" not in text
    assert "hash" not in text

def test_duplicate_email_any_casing_is_409(client):
    client.post(
        f"{API}/auth/register",
        json={"full_name": "Lamees Ibeid", "email": "lamees@example.com", "password": "Password123!", "role": "JOB_SEEKER"},
    )
    response = client.post(
        f"{API}/auth/register",
        json={"full_name": "Lamees Ibeid", "email": "LAMEES@Example.com", "password": "Password123!", "role": "JOB_SEEKER"},
    )
    assert response.status_code == 409
    assert response.json() == {"detail": "An account with this email already exists."}

def test_invalid_email_is_400_with_string_detail(client):
    response = client.post(
        f"{API}/auth/register",
        json={"full_name": "Lamees Ibeid", "email": "not-an-email", "password": "Password123!", "role": "JOB_SEEKER"},
    )
    assert response.status_code == 400
    assert isinstance(response.json()["detail"], str)

def test_short_password_is_400(client):
    response = client.post(
        f"{API}/auth/register",
        json={"full_name": "Lamees Ibeid", "email": "short-pass@example.com", "password": "short", "role": "JOB_SEEKER"},
    )
    assert response.status_code == 400
    assert response.json()["detail"].startswith("password")

def test_missing_role_is_400(client):
    response = client.post(
        f"{API}/auth/register",
        json={"full_name": "Lamees Ibeid", "email": "lamees@example.com", "password": "Password123!"},
    )
    assert response.status_code == 400
    assert response.json()["detail"].startswith("role")

def test_blank_full_name_is_400(client):
    response = client.post(
        f"{API}/auth/register",
        json={"full_name": "   ", "email": "a@b.com", "password": "Password123!", "role": "JOB_SEEKER"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "full_name: Full name is required"

def test_missing_field_is_400(client):
    response = client.post(f"{API}/auth/register", json={"email": "a@b.com"})
    assert response.status_code == 400

def test_cors_allows_frontend_origin(client):
    response = client.options(
        f"{API}/auth/register",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
