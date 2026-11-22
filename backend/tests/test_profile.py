from tests.conftest import API

# Each test logs in as a user, then calls the profile endpoints with their token.

PROFILE = {
    "full_name": "Lamees Ibeid",
    "headline": "Software engineering student",
    "location": "Montreal",
    "phone": "514-555-0100",
    "summary": "Backend developer on CareerNet.",
    "skills": ["Python", "FastAPI"],
}


def login_as(client, email):
    # Registers a job seeker with this email and returns their token header.
    client.post(f"{API}/auth/register",
                json={"full_name": "Test User", "email": email, "password": "Password123!", "role": "JOB_SEEKER"})
    token = client.post(f"{API}/auth/login", json={"email": email, "password": "Password123!"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_profile_before_saving_is_404(client, auth_headers):
    # A new user has no profile yet -> 404 (the frontend then shows an empty form).
    response = client.get(f"{API}/profile/me", headers=auth_headers)
    assert response.status_code == 404
    assert response.json() == {"detail": "Profile not created yet."}


def test_save_then_get_profile(client, auth_headers):
    # Saving returns the profile, and reading it back gives the same data.
    saved = client.put(f"{API}/profile/me", json=PROFILE, headers=auth_headers)
    assert saved.status_code == 200
    assert saved.json() == PROFILE

    response = client.get(f"{API}/profile/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == PROFILE


def test_second_save_updates_the_same_profile(client, auth_headers):
    # Saving twice updates the existing profile instead of creating a second one.
    client.put(f"{API}/profile/me", json=PROFILE, headers=auth_headers)
    client.put(f"{API}/profile/me", json={**PROFILE, "location": "Toronto"}, headers=auth_headers)
    assert client.get(f"{API}/profile/me", headers=auth_headers).json()["location"] == "Toronto"


def test_only_full_name_is_required(client, auth_headers):
    # Optional fields left out come back as "" and skills as [].
    response = client.put(f"{API}/profile/me", json={"full_name": "Lamees Ibeid"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"full_name": "Lamees Ibeid", "headline": "", "location": "",
                               "phone": "", "summary": "", "skills": []}


def test_blank_full_name_is_rejected(client, auth_headers):
    # A name made only of spaces is invalid.
    response = client.put(f"{API}/profile/me", json={**PROFILE, "full_name": "   "}, headers=auth_headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "full_name: Full name is required"


def test_too_many_skills_is_rejected(client, auth_headers):
    # More than 30 skills is invalid.
    response = client.put(f"{API}/profile/me", json={**PROFILE, "skills": [f"s{i}" for i in range(31)]},
                          headers=auth_headers)
    assert response.status_code == 400


def test_summary_over_2000_characters_is_rejected(client, auth_headers):
    # A summary longer than 2000 characters is invalid.
    response = client.put(f"{API}/profile/me", json={**PROFILE, "summary": "a" * 2001}, headers=auth_headers)
    assert response.status_code == 400


def test_users_only_see_their_own_profile(client, auth_headers):
    # User A saves a profile; user B still gets 404 (B can't see A's profile).
    client.put(f"{API}/profile/me", json=PROFILE, headers=auth_headers)
    other_user = login_as(client, "other@example.com")
    assert client.get(f"{API}/profile/me", headers=other_user).status_code == 404


def test_profile_needs_login(client):
    # No token -> 401, and a fake token -> 401.
    assert client.get(f"{API}/profile/me").status_code == 401
    fake = {"Authorization": "Bearer not.a.real.token"}
    assert client.put(f"{API}/profile/me", json=PROFILE, headers=fake).status_code == 401


def test_second_put_returns_200_and_updates_existing_profile(client, auth_headers):
    # Checks a second PUT updates the same profile and returns the new values.
    first = client.put(f"{API}/profile/me", json=PROFILE, headers=auth_headers)
    assert first.status_code == 200

    updated = {**PROFILE, "location": "Toronto", "headline": "Senior backend engineer"}
    second = client.put(f"{API}/profile/me", json=updated, headers=auth_headers)
    assert second.status_code == 200
    assert client.get(f"{API}/profile/me", headers=auth_headers).json()["location"] == "Toronto"


def test_missing_full_name_is_rejected_400(client, auth_headers):
    # Validation errors return 400 in this project (global handler in App/main.py).
    payload = {key: value for key, value in PROFILE.items() if key != "full_name"}
    response = client.put(f"{API}/profile/me", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "full_name" in response.json()["detail"]


def test_summary_over_2000_chars_is_rejected_400(client, auth_headers):
    # Validation errors return 400 in this project (global handler in App/main.py).
    response = client.put(f"{API}/profile/me", json={**PROFILE, "summary": "a" * 2001}, headers=auth_headers)
    assert response.status_code == 400
    assert "summary" in response.json()["detail"]


def test_more_than_30_skills_is_rejected_400(client, auth_headers):
    # Validation errors return 400 in this project (global handler in App/main.py).
    response = client.put(f"{API}/profile/me", json={**PROFILE, "skills": [f"s{i}" for i in range(31)]}, headers=auth_headers)
    assert response.status_code == 400
    assert "skills" in response.json()["detail"]


def test_put_without_token_returns_401(client):
    # Checks PUT /profile/me rejects unauthenticated requests with 401.
    response = client.put(f"{API}/profile/me", json=PROFILE)
    assert response.status_code == 401


def test_user_b_cannot_overwrite_user_a_profile(client):
    # Checks user B cannot mutate user A's profile even after creating their own profile.
    user_a = login_as(client, "user-a@example.com")
    user_b = login_as(client, "user-b@example.com")

    client.put(f"{API}/profile/me", json=PROFILE, headers=user_a)
    assert client.get(f"{API}/profile/me", headers=user_b).status_code == 404

    b_profile = {**PROFILE, "full_name": "User B", "location": "Toronto"}
    b_response = client.put(f"{API}/profile/me", json=b_profile, headers=user_b)
    assert b_response.status_code == 200

    a_response = client.get(f"{API}/profile/me", headers=user_a)
    assert a_response.status_code == 200
    assert a_response.json() == PROFILE

    b_after = client.get(f"{API}/profile/me", headers=user_b)
    assert b_after.status_code == 200
    assert b_after.json()["full_name"] == "User B"