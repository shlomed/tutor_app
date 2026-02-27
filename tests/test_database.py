import sqlite3

from database.db import get_connection, init_db


class TestInitDb:
    def test_creates_users_table(self):
        with get_connection() as conn:
            tables = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        table_names = [t["name"] for t in tables]
        assert "Users" in table_names

    def test_creates_courses_table(self):
        with get_connection() as conn:
            tables = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        table_names = [t["name"] for t in tables]
        assert "Courses" in table_names

    def test_users_table_has_correct_columns(self):
        with get_connection() as conn:
            columns = conn.execute("PRAGMA table_info(Users)").fetchall()
        col_names = [c["name"] for c in columns]
        assert "id" in col_names
        assert "username" in col_names
        assert "name" in col_names
        assert "hashed_password" in col_names
        assert "created_at" in col_names

    def test_courses_table_has_correct_columns(self):
        with get_connection() as conn:
            columns = conn.execute("PRAGMA table_info(Courses)").fetchall()
        col_names = [c["name"] for c in columns]
        assert "id" in col_names
        assert "name" in col_names
        assert "created_at" in col_names

    def test_subjects_table_has_course_id(self):
        with get_connection() as conn:
            columns = conn.execute("PRAGMA table_info(Subjects)").fetchall()
        col_names = [c["name"] for c in columns]
        assert "course_id" in col_names

    def test_idempotent(self):
        """Calling init_db() twice should not raise."""
        init_db()
        init_db()


class TestGetConnection:
    def test_yields_connection_with_row_factory(self):
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO Users (username, name, hashed_password) VALUES (?, ?, ?)",
                ("alice", "Alice", "hash123"),
            )

        with get_connection() as conn:
            row = conn.execute("SELECT * FROM Users WHERE username='alice'").fetchone()
        assert row["username"] == "alice"
        assert row["name"] == "Alice"

    def test_rollback_on_exception(self):
        try:
            with get_connection() as conn:
                conn.execute(
                    "INSERT INTO Users (username, name, hashed_password) VALUES (?, ?, ?)",
                    ("bob", "Bob", "hash456"),
                )
                raise ValueError("forced error")
        except ValueError:
            pass

        with get_connection() as conn:
            row = conn.execute("SELECT * FROM Users WHERE username='bob'").fetchone()
        assert row is None
