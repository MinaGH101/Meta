import os

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("MEDIA_ROOT", "/tmp/meta-test-media-routing")
os.environ.setdefault("SEED_INITIAL_DATA", "true")

from fastapi.testclient import TestClient
from app.main import app


def test_public_admin_routes_are_served_under_api_prefix():
    with TestClient(app) as client:
        response = client.get("/api/admin/management", follow_redirects=False)
        assert response.status_code in {302, 303}
        assert response.headers["location"] == "/api/admin/login"

        login_page = client.get("/api/admin/login")
        assert login_page.status_code == 200
        assert "/api/admin/login" in login_page.text


def test_legacy_internal_admin_url_does_not_leak_after_login():
    with TestClient(app) as client:
        login = client.post(
            "/api/admin/login",
            data={"username": "admin@example.com", "password": "ChangeMe123!"},
            follow_redirects=False,
        )
        assert login.status_code in {302, 303}
        assert login.headers["location"] == "/api/admin/management"


def test_duplicate_api_prefix_is_accepted_as_compatibility_guard():
    with TestClient(app) as client:
        response = client.get("/api/api/v1/auth/me")
        assert response.status_code == 401
        assert response.json()["detail"] == "Not authenticated"


def test_public_api_route_uses_single_api_prefix():
    with TestClient(app) as client:
        root = client.get("/api/")
        assert root.status_code == 200
        assert root.json()["api"] == "/api/v1"
        assert root.json()["admin"] == "/api/admin/"
        assert root.json()["docs"] == "/api/docs"

        me = client.get("/api/v1/auth/me")
        assert me.status_code == 401
        assert me.json()["detail"] == "Not authenticated"
