from __future__ import annotations

from database.db import get_connection


def get_user_dashboard(user_id: int, course_id: int | None = None) -> dict:
    """Return progress overview for a user.
    When course_id is given, only count subtopics under that course.
    Returns dict with total_subtopics, completed_subtopics, and details list."""
    with get_connection() as conn:
        if course_id is not None:
            total = conn.execute(
                """SELECT COUNT(*) as cnt FROM SubTopics st
                   JOIN Topics t ON st.topic_id = t.id
                   JOIN Subjects s ON t.subject_id = s.id
                   WHERE s.course_id = ?""",
                (course_id,),
            ).fetchone()["cnt"]

            details = conn.execute(
                """SELECT up.subtopic_id, up.status, up.xp_earned, up.assistance_level_used
                   FROM UserProgress up
                   JOIN SubTopics st ON up.subtopic_id = st.id
                   JOIN Topics t ON st.topic_id = t.id
                   JOIN Subjects s ON t.subject_id = s.id
                   WHERE up.user_id = ? AND s.course_id = ?""",
                (user_id, course_id),
            ).fetchall()
        else:
            total = conn.execute(
                "SELECT COUNT(*) as cnt FROM SubTopics"
            ).fetchone()["cnt"]

            details = conn.execute(
                """SELECT up.subtopic_id, up.status, up.xp_earned, up.assistance_level_used
                   FROM UserProgress up
                   WHERE up.user_id = ?""",
                (user_id,),
            ).fetchall()

    detail_list = [dict(row) for row in details]
    completed = sum(1 for d in detail_list if d["status"] == "completed")

    return {
        "total_subtopics": total,
        "completed_subtopics": completed,
        "details": detail_list,
    }


def update_progress(user_id: int, subtopic_id: int, status: str,
                    xp_earned: int = 0, assistance_level_used: int = 0) -> None:
    """Insert or update a user's progress on a subtopic."""
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO UserProgress (user_id, subtopic_id, status, xp_earned, assistance_level_used)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(user_id, subtopic_id)
               DO UPDATE SET status = excluded.status,
                             xp_earned = excluded.xp_earned,
                             assistance_level_used = excluded.assistance_level_used,
                             updated_at = datetime('now')""",
            (user_id, subtopic_id, status, xp_earned, assistance_level_used),
        )
