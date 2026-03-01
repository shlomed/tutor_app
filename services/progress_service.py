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
    """Insert or update a user's progress on a subtopic.
    When xp_earned=0, preserves the existing XP (used by 'Finish Practice' to mark completed)."""
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO UserProgress (user_id, subtopic_id, status, xp_earned, assistance_level_used)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(user_id, subtopic_id)
               DO UPDATE SET status = excluded.status,
                             xp_earned = CASE WHEN excluded.xp_earned > 0
                                              THEN excluded.xp_earned ELSE xp_earned END,
                             assistance_level_used = CASE WHEN excluded.assistance_level_used > 0
                                                         THEN excluded.assistance_level_used
                                                         ELSE assistance_level_used END,
                             updated_at = datetime('now')""",
            (user_id, subtopic_id, status, xp_earned, assistance_level_used),
        )


def accumulate_question_xp(user_id: int, subtopic_id: int,
                           xp_delta: int, hints_delta: int) -> dict:
    """Add XP from one question. Creates row as 'in_progress' if new.
    Returns updated totals."""
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO UserProgress (user_id, subtopic_id, status, xp_earned, assistance_level_used)
               VALUES (?, ?, 'in_progress', ?, ?)
               ON CONFLICT(user_id, subtopic_id)
               DO UPDATE SET xp_earned = xp_earned + excluded.xp_earned,
                             assistance_level_used = assistance_level_used + excluded.assistance_level_used,
                             updated_at = datetime('now')""",
            (user_id, subtopic_id, xp_delta, hints_delta),
        )
        row = conn.execute(
            "SELECT xp_earned, assistance_level_used, status FROM UserProgress WHERE user_id = ? AND subtopic_id = ?",
            (user_id, subtopic_id),
        ).fetchone()
    return dict(row)


def get_subtopic_progress(user_id: int, subtopic_id: int) -> dict | None:
    """Return current progress for a single subtopic, or None if no record."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT status, xp_earned, assistance_level_used FROM UserProgress WHERE user_id = ? AND subtopic_id = ?",
            (user_id, subtopic_id),
        ).fetchone()
    return dict(row) if row else None
