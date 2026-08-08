import os
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("MEDIA_ROOT", "/tmp/meta-test-media")
os.environ.setdefault("SEED_INITIAL_DATA", "false")
from fastapi.testclient import TestClient
from app.main import app


def test_register_login_and_profile_with_phone_without_email():
    with TestClient(app) as client:
        registered = client.post("/api/v1/auth/register", json={"full_name": "Test User", "phone": "09123456789", "password": "StrongPass123!"})
        assert registered.status_code == 201, registered.text
        pair = registered.json()
        assert pair["user"]["email"] is None
        assert pair["user"]["phone"] == "09123456789"
        headers = {"Authorization": f"Bearer {pair['access_token']}"}
        profile = client.get("/api/v1/auth/me", headers=headers)
        assert profile.status_code == 200
        assert profile.json()["email"] is None
        assert profile.json()["phone"] == "09123456789"
        login = client.post("/api/v1/auth/login", json={"phone": "09123456789", "password": "StrongPass123!"})
        assert login.status_code == 200
        refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": login.json()["refresh_token"]})
        assert refreshed.status_code == 200, refreshed.text


def test_registration_rejects_duplicate_phone_number():
    with TestClient(app) as client:
        first = client.post("/api/v1/auth/register", json={"full_name": "First User", "phone": "09120000000", "password": "StrongPass123!"})
        assert first.status_code == 201, first.text
        second = client.post("/api/v1/auth/register", json={"full_name": "Second User", "email": "second@example.com", "phone": "09120000000", "password": "StrongPass123!"})
        assert second.status_code == 409, second.text
