"""Shared pytest fixtures.

Each test runs against a fresh, isolated SQLite database (a temp file via
DATABASE_URL) seeded with the demo catalog, so tests never touch the real DB.
"""

import os
import sys
import tempfile

import pytest

# Make `src` importable (same path trick main.py uses).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture()
def app():
    # Point the app at a throwaway database for this test.
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(db_fd)
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

    # Import after setting the env var so create_app picks it up.
    from src.main import create_app

    application = create_app()
    application.config.update(TESTING=True)
    yield application

    os.environ.pop("DATABASE_URL", None)
    try:
        os.remove(db_path)
    except OSError:
        pass


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def admin_token(client):
    """A JWT for the seeded admin account."""
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@kahrabaplus.com", "password": "admin123"},
    )
    assert res.status_code == 200, res.get_json()
    return res.get_json()["token"]


@pytest.fixture()
def auth(admin_token):
    """Authorization header dict for the admin."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def product(client):
    """The first seeded product (full detail dict)."""
    res = client.get("/api/products", query_string={"per_page": 1})
    return res.get_json()["products"][0]
