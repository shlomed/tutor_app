from database.db import get_connection
from services.pedagogy_service import _load_history, _save_message, clear_chat_history


def _seed_user_and_subtopic() -> tuple[int, int]:
    """Insert a test user and subtopic (with course), return (user_id, subtopic_id)."""
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO Users (username, name, hashed_password) VALUES (?, ?, ?)",
            ("chat_tester", "Chat Tester", "hash"),
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


class TestChatPersistence:
    def test_save_and_load_messages(self):
        user_id, subtopic_id = _seed_user_and_subtopic()

        _save_message(user_id, subtopic_id, "user", "מה זה משוואה?")
        _save_message(user_id, subtopic_id, "assistant", "שאלה מצוינת! בוא נחשוב...")

        history = _load_history(user_id, subtopic_id)
        assert len(history) == 2
        assert history[0].content == "מה זה משוואה?"
        assert history[1].content == "שאלה מצוינת! בוא נחשוב..."

    def test_clear_chat_history(self):
        user_id, subtopic_id = _seed_user_and_subtopic()

        _save_message(user_id, subtopic_id, "user", "שאלה")
        _save_message(user_id, subtopic_id, "assistant", "תשובה")
        clear_chat_history(user_id, subtopic_id)

        history = _load_history(user_id, subtopic_id)
        assert len(history) == 0

    def test_history_isolated_per_subtopic(self):
        user_id, subtopic_id = _seed_user_and_subtopic()

        # Create a second subtopic
        with get_connection() as conn:
            topic_id = conn.execute("SELECT id FROM Topics LIMIT 1").fetchone()["id"]
            conn.execute("INSERT INTO SubTopics (topic_id, name) VALUES (?, ?)", (topic_id, "אחר"))
            other_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

        _save_message(user_id, subtopic_id, "user", "הודעה 1")
        _save_message(user_id, other_id, "user", "הודעה 2")

        h1 = _load_history(user_id, subtopic_id)
        h2 = _load_history(user_id, other_id)
        assert len(h1) == 1
        assert len(h2) == 1
        assert h1[0].content == "הודעה 1"
        assert h2[0].content == "הודעה 2"
