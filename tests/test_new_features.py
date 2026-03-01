"""Tests for the new features: XP accumulation, course description,
student learning preferences, and universal context helpers."""

from database.db import get_connection
from services.progress_service import (
    accumulate_question_xp,
    get_subtopic_progress,
    update_progress,
)
from services.auth_service import (
    register_user,
    get_learning_preferences,
    update_learning_preferences,
    get_user_by_username,
)
from services.syllabus_service import create_course, get_all_courses
from services.pedagogy_service import _get_course_context, _student_context_block


def _seed(*, description: str = "") -> tuple[int, int, int]:
    """Insert user + course (with description) + subtopic, return (user_id, subtopic_id, course_id)."""
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO Users (username, name, hashed_password) VALUES (?, ?, ?)",
            ("testuser", "Test User", "hash"),
        )
        user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.execute(
            "INSERT INTO Courses (name, description) VALUES (?, ?)",
            ("קורס בדיקה", description),
        )
        course_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
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
            (topic_id, "משוואות"),
        )
        subtopic_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    return user_id, subtopic_id, course_id


# ─── XP Accumulation ───


class TestAccumulateQuestionXp:
    def test_creates_new_record(self):
        user_id, subtopic_id, _ = _seed()
        result = accumulate_question_xp(user_id, subtopic_id, 100, 0)
        assert result["xp_earned"] == 100
        assert result["status"] == "in_progress"

    def test_accumulates_on_conflict(self):
        user_id, subtopic_id, _ = _seed()
        accumulate_question_xp(user_id, subtopic_id, 100, 0)
        result = accumulate_question_xp(user_id, subtopic_id, 70, 1)
        assert result["xp_earned"] == 170
        assert result["assistance_level_used"] == 1

    def test_three_questions_accumulate(self):
        user_id, subtopic_id, _ = _seed()
        accumulate_question_xp(user_id, subtopic_id, 100, 0)
        accumulate_question_xp(user_id, subtopic_id, 70, 1)
        result = accumulate_question_xp(user_id, subtopic_id, 40, 2)
        assert result["xp_earned"] == 210
        assert result["assistance_level_used"] == 3


class TestGetSubtopicProgress:
    def test_returns_none_when_no_record(self):
        user_id, subtopic_id, _ = _seed()
        assert get_subtopic_progress(user_id, subtopic_id) is None

    def test_returns_progress_after_accumulation(self):
        user_id, subtopic_id, _ = _seed()
        accumulate_question_xp(user_id, subtopic_id, 100, 0)
        progress = get_subtopic_progress(user_id, subtopic_id)
        assert progress is not None
        assert progress["xp_earned"] == 100
        assert progress["status"] == "in_progress"


class TestUpdateProgressPreservesXp:
    def test_marking_completed_preserves_accumulated_xp(self):
        user_id, subtopic_id, _ = _seed()
        # Accumulate XP from questions
        accumulate_question_xp(user_id, subtopic_id, 100, 0)
        accumulate_question_xp(user_id, subtopic_id, 70, 1)

        # Mark completed with xp_earned=0 (finish practice button)
        update_progress(user_id, subtopic_id, "completed")

        progress = get_subtopic_progress(user_id, subtopic_id)
        assert progress["status"] == "completed"
        assert progress["xp_earned"] == 170  # preserved, not zeroed


# ─── Course Description ───


class TestCourseDescription:
    def test_create_course_with_description(self):
        cid = create_course("כפל לכיתה ב", description="קורס כפל בסיסי לתלמידי כיתה ב")
        courses = get_all_courses()
        course = next(c for c in courses if c["id"] == cid)
        assert course["description"] == "קורס כפל בסיסי לתלמידי כיתה ב"

    def test_create_course_without_description(self):
        cid = create_course("מתמטיקה 5 יח")
        courses = get_all_courses()
        course = next(c for c in courses if c["id"] == cid)
        assert course["description"] == ""

    def test_course_context_with_description(self):
        _, subtopic_id, _ = _seed(description="קורס לתלמידי כיתה ב, רמה בסיסית")
        ctx = _get_course_context(subtopic_id)
        assert "קורס בדיקה" in ctx
        assert "קורס לתלמידי כיתה ב, רמה בסיסית" in ctx

    def test_course_context_without_description(self):
        _, subtopic_id, _ = _seed()
        ctx = _get_course_context(subtopic_id)
        assert "קורס בדיקה" in ctx


# ─── Student Learning Preferences ───


class TestLearningPreferences:
    def test_default_empty_preferences(self):
        register_user("alice", "Alice", "password123")
        user = get_user_by_username("alice")
        assert user["learning_preferences"] == ""

    def test_get_learning_preferences_empty(self):
        register_user("bob", "Bob", "password123")
        from services.auth_service import get_user_id

        uid = get_user_id("bob")
        prefs = get_learning_preferences(uid)
        assert prefs == ""

    def test_update_and_get_preferences(self):
        register_user("charlie", "Charlie", "password123")
        from services.auth_service import get_user_id

        uid = get_user_id("charlie")
        update_learning_preferences(uid, "אני לומד ויזואלי, מעדיף דוגמאות")
        prefs = get_learning_preferences(uid)
        assert prefs == "אני לומד ויזואלי, מעדיף דוגמאות"

    def test_student_context_block_empty(self):
        user_id, _, _ = _seed()
        block = _student_context_block(user_id)
        assert block == ""

    def test_student_context_block_with_preferences(self):
        user_id, _, _ = _seed()
        update_learning_preferences(user_id, "מעדיף הסברים קצרים")
        block = _student_context_block(user_id)
        assert "STUDENT PROFILE" in block
        assert "מעדיף הסברים קצרים" in block

    def test_update_preferences_overwrites(self):
        register_user("dana", "Dana", "password123")
        from services.auth_service import get_user_id

        uid = get_user_id("dana")
        update_learning_preferences(uid, "גרסה 1")
        update_learning_preferences(uid, "גרסה 2")
        assert get_learning_preferences(uid) == "גרסה 2"
