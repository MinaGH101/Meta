import os
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("SEED_INITIAL_DATA", "false")
from fastapi.testclient import TestClient
from app.main import app


def test_live_health():
    with TestClient(app) as client:
        assert client.get("/health/live").json() == {"status": "ok"}
