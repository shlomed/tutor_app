"""End-to-end tests for the FastAPI API layer.

Uses FastAPI's TestClient so no actual server is started.
The autouse tmp_database fixture from conftest.py ensures isolation.
"""

import pytest
from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _register(username="testuser", name="Test User", password="test12345"):
    return client.post(
        "/api/auth/register",
        json={"username": username, "name": name, "password": password},
    )


def _login(username="testuser", password="test12345"):
    return client.post(
        "/api/auth/login",
        data={"username": username, "password": password},
    )


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _register_and_login(username="testuser", name="Test User", password="test12345"):
    _register(username, name, password)
    resp = _login(username, password)
    return resp.json()["access_token"]


# ===========================================================================
# Health
# ===========================================================================

class TestHealth:
    def test_health_endpoint(self):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


# ===========================================================================
# Auth
# ===========================================================================

class TestAuthRegister:
    def test_register_success(self):
        resp = _register()
        assert resp.status_code == 200
        assert resp.json()["message"] == "נרשמת בהצלחה!"

    def test_register_duplicate_username(self):
        _register("dup_user", "User 1", "password1!")
        resp = _register("dup_user", "User 2", "password2!")
        assert resp.status_code == 409

    def test_register_short_password_rejected(self):
        resp = _register("short", "Short", "abc")
        assert resp.status_code == 422  # Pydantic validation error


class TestAuthLogin:
    def test_login_success(self):
        _register()
        resp = _login()
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["name"] == "Test User"
        assert isinstance(data["user_id"], int)

    def test_login_wrong_password(self):
        _register()
        resp = _login(password="wrongpassword")
        assert resp.status_code == 401

    def test_login_nonexistent_user(self):
        resp = _login("nobody", "password123")
        assert resp.status_code == 401


class TestAuthMe:
    def test_me_returns_user_info(self):
        token = _register_and_login()
        resp = client.get("/api/auth/me", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert data["name"] == "Test User"
        assert "user_id" in data

    def test_me_without_token_returns_401(self):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_me_with_invalid_token_returns_401(self):
        resp = client.get("/api/auth/me", headers=_auth_header("invalid.token.here"))
        assert resp.status_code == 401


# ===========================================================================
# Courses
# ===========================================================================

class TestCourses:
    def test_list_courses_empty(self):
        token = _register_and_login()
        resp = client.get("/api/courses", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_create_course(self):
        token = _register_and_login()
        resp = client.post(
            "/api/courses",
            json={"name": "מתמטיקה 5 יחידות"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "מתמטיקה 5 יחידות"
        assert isinstance(data["id"], int)

    def test_list_courses_after_create(self):
        token = _register_and_login()
        client.post("/api/courses", json={"name": "קורס א"}, headers=_auth_header(token))
        client.post("/api/courses", json={"name": "קורס ב"}, headers=_auth_header(token))

        resp = client.get("/api/courses", headers=_auth_header(token))
        assert resp.status_code == 200
        courses = resp.json()
        assert len(courses) == 2
        names = {c["name"] for c in courses}
        assert "קורס א" in names
        assert "קורס ב" in names

    def test_delete_course(self):
        token = _register_and_login()
        create_resp = client.post(
            "/api/courses", json={"name": "למחוק"}, headers=_auth_header(token)
        )
        course_id = create_resp.json()["id"]

        resp = client.delete(f"/api/courses/{course_id}", headers=_auth_header(token))
        assert resp.status_code == 200

        courses = client.get("/api/courses", headers=_auth_header(token)).json()
        assert all(c["id"] != course_id for c in courses)

    def test_rename_course(self):
        token = _register_and_login()
        create_resp = client.post(
            "/api/courses", json={"name": "כללי"}, headers=_auth_header(token)
        )
        course_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/courses/{course_id}",
            json={"name": "אנגלית כיתה ח"},
            headers=_auth_header(token),
        )
        assert resp.status_code == 200

        courses = client.get("/api/courses", headers=_auth_header(token)).json()
        renamed = [c for c in courses if c["id"] == course_id][0]
        assert renamed["name"] == "אנגלית כיתה ח"

    def test_rename_course_requires_auth(self):
        resp = client.put("/api/courses/1", json={"name": "test"})
        assert resp.status_code == 401

    def test_courses_require_auth(self):
        resp = client.get("/api/courses")
        assert resp.status_code == 401


# ===========================================================================
# Progress
# ===========================================================================

class TestProgress:
    def test_dashboard_empty(self):
        token = _register_and_login()
        resp = client.get("/api/progress/dashboard", headers=_auth_header(token))
        assert resp.status_code == 200

    def test_update_progress(self):
        token = _register_and_login()

        # Create a course with syllabus to get a subtopic_id
        course_resp = client.post(
            "/api/courses", json={"name": "test course"}, headers=_auth_header(token)
        )
        course_id = course_resp.json()["id"]

        resp = client.put(
            "/api/progress",
            json={
                "subtopic_id": 1,
                "status": "completed",
                "xp_earned": 10,
                "assistance_level_used": 0,
            },
            headers=_auth_header(token),
        )
        assert resp.status_code == 200
        assert resp.json()["message"] == "ההתקדמות עודכנה"

    def test_progress_requires_auth(self):
        resp = client.get("/api/progress/dashboard")
        assert resp.status_code == 401


# ===========================================================================
# Full auth flow integration
# ===========================================================================

class TestFullAuthFlow:
    def test_register_login_me_flow(self):
        # 1. Register
        reg_resp = _register("flowuser", "Flow User", "flowpass123")
        assert reg_resp.status_code == 200

        # 2. Login
        login_resp = _login("flowuser", "flowpass123")
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        user_id = login_resp.json()["user_id"]

        # 3. /me
        me_resp = client.get("/api/auth/me", headers=_auth_header(token))
        assert me_resp.status_code == 200
        assert me_resp.json()["username"] == "flowuser"
        assert me_resp.json()["user_id"] == user_id

    def test_register_login_create_course_flow(self):
        # Full flow: register → login → create course → list courses
        token = _register_and_login("fullflow", "Full Flow", "password123")

        # Create course
        create_resp = client.post(
            "/api/courses",
            json={"name": "אלגברה"},
            headers=_auth_header(token),
        )
        assert create_resp.status_code == 201

        # List courses
        list_resp = client.get("/api/courses", headers=_auth_header(token))
        assert list_resp.status_code == 200
        assert len(list_resp.json()) >= 1
        assert any(c["name"] == "אלגברה" for c in list_resp.json())
