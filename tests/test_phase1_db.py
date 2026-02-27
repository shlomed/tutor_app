from database.db import get_connection, init_db

EXPECTED_TABLES = {
    "Users",
    "Courses",
    "Subjects",
    "Topics",
    "SubTopics",
    "UserProgress",
    "ChatSessions",
}


def _create_course(conn, name="קורס בדיקה") -> int:
    """Helper: create a course and return its ID."""
    conn.execute("INSERT INTO Courses (name) VALUES (?)", (name,))
    return conn.execute("SELECT last_insert_rowid()").fetchone()[0]


class TestAllTablesCreated:
    def test_all_tables_exist(self):
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        names = {r["name"] for r in rows}
        assert EXPECTED_TABLES <= names  # sqlite_sequence is also present; that's fine

    def test_subjects_columns(self):
        with get_connection() as conn:
            cols = {r["name"] for r in conn.execute("PRAGMA table_info(Subjects)")}
        assert {"id", "course_id", "name"} <= cols

    def test_topics_columns(self):
        with get_connection() as conn:
            cols = {r["name"] for r in conn.execute("PRAGMA table_info(Topics)")}
        assert {"id", "subject_id", "name"} <= cols

    def test_subtopics_columns(self):
        with get_connection() as conn:
            cols = {r["name"] for r in conn.execute("PRAGMA table_info(SubTopics)")}
        assert {"id", "topic_id", "name"} <= cols

    def test_userprogress_columns(self):
        with get_connection() as conn:
            cols = {r["name"] for r in conn.execute("PRAGMA table_info(UserProgress)")}
        assert {"id", "user_id", "subtopic_id", "status", "xp_earned",
                "assistance_level_used", "updated_at"} <= cols

    def test_chatsessions_columns(self):
        with get_connection() as conn:
            cols = {r["name"] for r in conn.execute("PRAGMA table_info(ChatSessions)")}
        assert {"id", "user_id", "subtopic_id", "role", "content", "created_at"} <= cols


class TestSyllabusRelationships:
    def test_insert_full_syllabus_tree(self):
        with get_connection() as conn:
            course_id = _create_course(conn)
            conn.execute(
                "INSERT INTO Subjects (course_id, name) VALUES (?, ?)",
                (course_id, "מתמטיקה"),
            )
            subject_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

            conn.execute(
                "INSERT INTO Topics (subject_id, name) VALUES (?, ?)",
                (subject_id, "אלגברה"),
            )
            topic_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

            conn.execute(
                "INSERT INTO SubTopics (topic_id, name) VALUES (?, ?)",
                (topic_id, "משוואות ממעלה ראשונה"),
            )

        with get_connection() as conn:
            subtopic = conn.execute(
                """SELECT st.name FROM SubTopics st
                   JOIN Topics t ON t.id = st.topic_id
                   JOIN Subjects s ON s.id = t.subject_id
                   WHERE s.name = 'מתמטיקה'"""
            ).fetchone()
        assert subtopic is not None
        assert subtopic["name"] == "משוואות ממעלה ראשונה"

    def test_userprogress_unique_constraint(self):
        import pytest

        with get_connection() as conn:
            conn.execute(
                "INSERT INTO Users (username, name, hashed_password) VALUES (?, ?, ?)",
                ("u1", "User One", "hash"),
            )
            user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            course_id = _create_course(conn, "פיזיקה קורס")
            conn.execute(
                "INSERT INTO Subjects (course_id, name) VALUES (?, ?)",
                (course_id, "פיזיקה"),
            )
            subject_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            conn.execute(
                "INSERT INTO Topics (subject_id, name) VALUES (?, ?)",
                (subject_id, "מכניקה"),
            )
            topic_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            conn.execute(
                "INSERT INTO SubTopics (topic_id, name) VALUES (?, ?)",
                (topic_id, "תנועה אחידה"),
            )
            subtopic_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

            conn.execute(
                "INSERT INTO UserProgress (user_id, subtopic_id) VALUES (?, ?)",
                (user_id, subtopic_id),
            )

        import sqlite3

        with pytest.raises(Exception):
            with get_connection() as conn:
                conn.execute(
                    "INSERT INTO UserProgress (user_id, subtopic_id) VALUES (?, ?)",
                    (user_id, subtopic_id),
                )
