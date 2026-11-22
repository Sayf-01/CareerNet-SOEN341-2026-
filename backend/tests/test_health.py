from App.core.security import hash_password, verify_password


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_password_hashing():
    hashed = hash_password("Password123!")
    assert hashed != "Password123!"
    assert verify_password("Password123!", hashed)
    assert not verify_password("wrong-password", hashed)