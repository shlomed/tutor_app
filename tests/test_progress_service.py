from database.db import get_connection
from services.progress_service import get_user_dashboard, update_progress


def _seed_user_and_subtopic() -> tuple[int, int]:
    """Insert a test user and a subtopic (with course), return (user_id, subtopic_id)."""
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO Users (username, name, hashed_password) VALUES (?, ?, ?)",
            ("tester", "Test User", "hash"),
        )
        user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.execute("INSERT INTO Courses (name) VALUES (?)", ("קורס בדיקה",))
        course_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.execute(
            "INSERT INTO Subjects (course_id, name) VALUES (?, ?)",
            (course_id, "מתמטיקה"),
        )
        subject_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.execute("INSERT INTO Topics (subject_id, name) VALUES (?, ?)", (subject_id, "אלגברה"))
        topic_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.execute("INSERT INTO SubTopics (topic_id, name) VALUES (?, ?)", (topic_id, "משוואות"))
        subtopic_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    return user_id, subtopic_id


def _get_course_id() -> int:
    """Get the course_id created by _seed_user_and_subtopic."""
    with get_connection() as conn:
        return conn.execute("SELECT id FROM Courses LIMIT 1").fetchone()["id"]


class TestUpdateProgress:
    def test_insert_new_progress(self):
        user_id, subtopic_id = _seed_user_and_subtopic()
        update_progress(user_id, subtopic_id, "in_progress")

        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM UserProgress WHERE user_id = ? AND subtopic_id = ?",
                (user_id, subtopic_id),
            ).fetchone()
        assert row["status"] == "in_progress"
        assert row["xp_earned"] == 0

    def test_upsert_existing_progress(self):
        user_id, subtopic_id = _seed_user_and_subtopic()
        update_progress(user_id, subtopic_id, "in_progress")
        update_progress(user_id, subtopic_id, "completed", xp_earned=100, assistance_level_used=0)

        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM UserProgress WHERE user_id = ? AND subtopic_id = ?",
                (user_id, subtopic_id),
            ).fetchone()
        assert row["status"] == "completed"
        assert row["xp_earned"] == 100


class TestGetUserDashboard:
    def test_empty_dashboard(self):
        user_id, _ = _seed_user_and_subtopic()
        dashboard = get_user_dashboard(user_id)
        assert dashboard["total_subtopics"] == 1
        assert dashboard["completed_subtopics"] == 0
        assert dashboard["details"] == []

    def test_dashboard_with_progress(self):
        user_id, subtopic_id = _seed_user_and_subtopic()
        update_progress(user_id, subtopic_id, "completed", xp_earned=70, assistance_level_used=1)

        dashboard = get_user_dashboard(user_id)
        assert dashboard["completed_subtopics"] == 1
        assert len(dashboard["details"]) == 1
        assert dashboard["details"][0]["xp_earned"] == 70

    def test_dashboard_filtered_by_course(self):
        user_id, subtopic_id = _seed_user_and_subtopic()
        update_progress(user_id, subtopic_id, "completed", xp_earned=100)

        course_id = _get_course_id()
        dashboard = get_user_dashboard(user_id, course_id=course_id)
        assert dashboard["total_subtopics"] == 1
        assert dashboard["completed_subtopics"] == 1
