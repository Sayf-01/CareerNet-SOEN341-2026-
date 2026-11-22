# LA-7 tests: GET /notifications, POST /notifications/read-all, POST /notifications/{id}/read

from App.crud import notifications as notification_service
from App.database.connection import get_db
from App.main import app
from tests.conftest import API


# ---------- helpers ----------

def login_as(client, email):
    # registers and logs in a job seeker; returns the headers and the user's id
    user_id = client.post(
        f"{API}/auth/register",
        json={"full_name": "Test User", "email": email, "password": "Password123!", "role": "JOB_SEEKER"},
    ).json()["user"]["id"]
    token = client.post(
        f"{API}/auth/login", json={"email": email, "password": "Password123!"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, user_id


def add_notification(user_id, message="Hello"):
    # puts a notification straight in the test database with Kaila's function; returns its id
    db = next(app.dependency_overrides[get_db]())
    notification = notification_service.create_notification(db, user_id, "status_changed", message)
    db.commit()
    notification_id = notification.id
    db.close()
    return notification_id


def notifications(client, headers, unread_only=False):
    url = f"{API}/notifications" + ("?unread_only=true" if unread_only else "")
    return client.get(url, headers=headers)


def mark_read(client, headers, notification_id):
    return client.post(f"{API}/notifications/{notification_id}/read", headers=headers)


# ---------- tests ----------

def test_new_user_gets_an_empty_list(client):
    seeker, _ = login_as(client, "seeker@example.com")

    response = notifications(client, seeker)

    assert response.status_code == 200
    assert response.json() == {"items": [], "unread_count": 0}


def test_list_is_newest_first(client):
    seeker, seeker_id = login_as(client, "seeker@example.com")
    add_notification(seeker_id, "first")
    add_notification(seeker_id, "second")

    body = notifications(client, seeker).json()

    assert [item["message"] for item in body["items"]] == ["second", "first"]
    assert body["unread_count"] == 2
    assert set(body["items"][0]) == {
        "id", "type", "message", "is_read", "created_at", "application_id", "interview_at",
    }


def test_unread_only_hides_read_notifications(client):
    seeker, seeker_id = login_as(client, "seeker@example.com")
    first = add_notification(seeker_id, "first")
    add_notification(seeker_id, "second")
    mark_read(client, seeker, first)

    body = notifications(client, seeker, unread_only=True).json()

    assert [item["message"] for item in body["items"]] == ["second"]


def test_marking_one_read_lowers_unread_count(client):
    seeker, seeker_id = login_as(client, "seeker@example.com")
    first = add_notification(seeker_id)
    add_notification(seeker_id)

    response = mark_read(client, seeker, first)

    assert response.status_code == 200
    assert response.json()["is_read"] is True
    assert notifications(client, seeker).json()["unread_count"] == 1


def test_another_users_notification_gives_404(client):
    alice, alice_id = login_as(client, "alice@example.com")
    bob, _ = login_as(client, "bob@example.com")
    notification_id = add_notification(alice_id)

    response = mark_read(client, bob, notification_id)

    assert response.status_code == 404
    assert response.json() == {"detail": "Notification not found"}
    assert notifications(client, alice).json()["unread_count"] == 1  # still unread for Alice


def test_unknown_notification_gives_404(client):
    seeker, _ = login_as(client, "seeker@example.com")

    assert mark_read(client, seeker, 9999).status_code == 404


def test_read_all_returns_the_right_number(client):
    seeker, seeker_id = login_as(client, "seeker@example.com")
    add_notification(seeker_id)
    add_notification(seeker_id)

    response = client.post(f"{API}/notifications/read-all", headers=seeker)

    assert response.json() == {"updated": 2}
    assert notifications(client, seeker).json()["unread_count"] == 0


def test_no_token_gives_401(client):
    assert client.get(f"{API}/notifications").status_code == 401
    assert client.post(f"{API}/notifications/read-all").status_code == 401
    assert client.post(f"{API}/notifications/1/read").status_code == 401