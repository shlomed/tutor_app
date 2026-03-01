from __future__ import annotations

from typing import List

from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field

from services.ai_core import get_llm
from database.db import get_connection


# --- Pydantic models for structured output ---

class SubTopicSchema(BaseModel):
    name: str = Field(description="Name of the sub-topic")


class TopicSchema(BaseModel):
    name: str = Field(description="Name of the topic")
    subtopics: List[SubTopicSchema] = Field(description="List of sub-topics under this topic")


class SubjectSchema(BaseModel):
    name: str = Field(description="Name of the subject")
    topics: List[TopicSchema] = Field(description="List of topics under this subject")


class SyllabusSchema(BaseModel):
    subjects: List[SubjectSchema] = Field(description="List of subjects in the syllabus")


# --- Course CRUD ---

def create_course(name: str, description: str = "") -> int:
    """Insert a new course and return its ID.
    Raises ValueError if the name already exists."""
    with get_connection() as conn:
        try:
            conn.execute(
                "INSERT INTO Courses (name, description) VALUES (?, ?)",
                (name, description),
            )
            row = conn.execute("SELECT last_insert_rowid()").fetchone()
            return row[0]
        except Exception:
            raise ValueError("שם הקורס כבר קיים במערכת")


def get_all_courses() -> list[dict]:
    """Return all courses as a list of dicts."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, name, description, created_at FROM Courses ORDER BY id"
        ).fetchall()
    return [dict(row) for row in rows]


def get_course_syllabus(course_id: int) -> list[dict]:
    """Read the syllabus tree for a specific course."""
    with get_connection() as conn:
        subjects = conn.execute(
            "SELECT id, name FROM Subjects WHERE course_id = ? ORDER BY id",
            (course_id,),
        ).fetchall()
        tree = []
        for subj in subjects:
            topics = conn.execute(
                "SELECT id, name FROM Topics WHERE subject_id = ? ORDER BY id",
                (subj["id"],),
            ).fetchall()
            topic_list = []
            for top in topics:
                subtopics = conn.execute(
                    "SELECT id, name FROM SubTopics WHERE topic_id = ? ORDER BY id",
                    (top["id"],),
                ).fetchall()
                topic_list.append({
                    "id": top["id"],
                    "name": top["name"],
                    "subtopics": [{"id": st["id"], "name": st["name"]} for st in subtopics],
                })
            tree.append({
                "id": subj["id"],
                "name": subj["name"],
                "topics": topic_list,
            })
    return tree


def delete_course_syllabus(course_id: int) -> None:
    """Cascade-delete all syllabus data under a course:
    ChatSessions → UserProgress → SubTopics → Topics → Subjects."""
    with get_connection() as conn:
        # Collect all subtopic IDs under this course
        subtopic_ids = conn.execute(
            """SELECT st.id FROM SubTopics st
               JOIN Topics t ON st.topic_id = t.id
               JOIN Subjects s ON t.subject_id = s.id
               WHERE s.course_id = ?""",
            (course_id,),
        ).fetchall()
        sub_ids = [row["id"] for row in subtopic_ids]

        if sub_ids:
            placeholders = ",".join("?" * len(sub_ids))
            conn.execute(
                f"DELETE FROM ChatSessions WHERE subtopic_id IN ({placeholders})",
                sub_ids,
            )
            conn.execute(
                f"DELETE FROM UserProgress WHERE subtopic_id IN ({placeholders})",
                sub_ids,
            )

        # Delete SubTopics → Topics → Subjects
        conn.execute(
            """DELETE FROM SubTopics WHERE topic_id IN (
                   SELECT t.id FROM Topics t
                   JOIN Subjects s ON t.subject_id = s.id
                   WHERE s.course_id = ?)""",
            (course_id,),
        )
        conn.execute(
            """DELETE FROM Topics WHERE subject_id IN (
                   SELECT id FROM Subjects WHERE course_id = ?)""",
            (course_id,),
        )
        conn.execute("DELETE FROM Subjects WHERE course_id = ?", (course_id,))


def delete_course(course_id: int) -> None:
    """Delete a course and all its associated data."""
    delete_course_syllabus(course_id)
    with get_connection() as conn:
        conn.execute("DELETE FROM Courses WHERE id = ?", (course_id,))


# --- Inline editing ---

def update_course_name(course_id: int, new_name: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE Courses SET name = ? WHERE id = ?", (new_name, course_id)
        )


def update_course_description(course_id: int, description: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE Courses SET description = ? WHERE id = ?", (description, course_id)
        )


def update_subject_name(subject_id: int, new_name: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE Subjects SET name = ? WHERE id = ?", (new_name, subject_id)
        )


def update_topic_name(topic_id: int, new_name: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE Topics SET name = ? WHERE id = ?", (new_name, topic_id)
        )


def update_subtopic_name(subtopic_id: int, new_name: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE SubTopics SET name = ? WHERE id = ?", (new_name, subtopic_id)
        )


def add_subtopic(topic_id: int, name: str) -> int:
    """Add a new subtopic to a topic. Returns the new subtopic ID."""
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO SubTopics (topic_id, name) VALUES (?, ?)",
            (topic_id, name),
        )
        return conn.execute("SELECT last_insert_rowid()").fetchone()[0]


def remove_subtopic(subtopic_id: int) -> None:
    """Remove a subtopic and its associated progress/chat data."""
    with get_connection() as conn:
        conn.execute("DELETE FROM ChatSessions WHERE subtopic_id = ?", (subtopic_id,))
        conn.execute("DELETE FROM UserProgress WHERE subtopic_id = ?", (subtopic_id,))
        conn.execute("DELETE FROM SubTopics WHERE id = ?", (subtopic_id,))


# --- Flat table helper ---

def syllabus_to_flat_rows(syllabus: SyllabusSchema) -> list[dict]:
    """Convert a nested SyllabusSchema into flat rows for table display.
    Returns list of {מקצוע, נושא, תת-נושא} dicts."""
    rows = []
    for subject in syllabus.subjects:
        for topic in subject.topics:
            for subtopic in topic.subtopics:
                rows.append({
                    "מקצוע": subject.name,
                    "נושא": topic.name,
                    "תת-נושא": subtopic.name,
                })
    return rows


def db_syllabus_to_flat_rows(course_id: int) -> list[dict]:
    """Load a course's syllabus from DB and return as flat rows with IDs."""
    tree = get_course_syllabus(course_id)
    rows = []
    for subject in tree:
        for topic in subject["topics"]:
            for subtopic in topic["subtopics"]:
                rows.append({
                    "subject_id": subject["id"],
                    "מקצוע": subject["name"],
                    "topic_id": topic["id"],
                    "נושא": topic["name"],
                    "subtopic_id": subtopic["id"],
                    "תת-נושא": subtopic["name"],
                })
    return rows


# --- AI parsing ---

def parse_syllabus_to_json(raw_text: str) -> SyllabusSchema:
    """Use Claude with structured output to parse raw syllabus text
    into a guaranteed SyllabusSchema hierarchy."""
    llm = get_llm()
    structured_llm = llm.with_structured_output(SyllabusSchema)

    prompt = f"""You are a curriculum parser. Given the following raw syllabus text,
extract the hierarchical structure of subjects, topics, and sub-topics.

Rules:
- Each subject contains one or more topics.
- Each topic contains one or more sub-topics.
- Preserve the original language of the syllabus (Hebrew or English).
- Do not invent topics that are not in the text.

Raw syllabus text:
---
{raw_text}
---"""

    result = structured_llm.invoke([HumanMessage(content=prompt)])
    return result


# --- Save / Load ---

def save_syllabus_to_db(syllabus: SyllabusSchema, course_id: int) -> dict:
    """Persist the parsed syllabus tree into Subjects/Topics/SubTopics tables
    under the given course. Returns a summary dict with counts."""
    subject_count = 0
    topic_count = 0
    subtopic_count = 0

    with get_connection() as conn:
        for subject in syllabus.subjects:
            conn.execute(
                "INSERT OR IGNORE INTO Subjects (course_id, name) VALUES (?, ?)",
                (course_id, subject.name),
            )
            subject_id = conn.execute(
                "SELECT id FROM Subjects WHERE course_id = ? AND name = ?",
                (course_id, subject.name),
            ).fetchone()["id"]
            subject_count += 1

            for topic in subject.topics:
                conn.execute(
                    "INSERT INTO Topics (subject_id, name) VALUES (?, ?)",
                    (subject_id, topic.name),
                )
                topic_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                topic_count += 1

                for subtopic in topic.subtopics:
                    conn.execute(
                        "INSERT INTO SubTopics (topic_id, name) VALUES (?, ?)",
                        (topic_id, subtopic.name),
                    )
                    subtopic_count += 1

    return {
        "subjects": subject_count,
        "topics": topic_count,
        "subtopics": subtopic_count,
    }


def get_full_syllabus(course_id: int | None = None) -> list[dict]:
    """Read the syllabus tree from DB. Optionally filter by course_id."""
    with get_connection() as conn:
        if course_id is not None:
            subjects = conn.execute(
                "SELECT id, name FROM Subjects WHERE course_id = ? ORDER BY id",
                (course_id,),
            ).fetchall()
        else:
            subjects = conn.execute(
                "SELECT id, name FROM Subjects ORDER BY id"
            ).fetchall()
        tree = []
        for subj in subjects:
            topics = conn.execute(
                "SELECT id, name FROM Topics WHERE subject_id = ? ORDER BY id",
                (subj["id"],),
            ).fetchall()
            topic_list = []
            for top in topics:
                subtopics = conn.execute(
                    "SELECT id, name FROM SubTopics WHERE topic_id = ? ORDER BY id",
                    (top["id"],),
                ).fetchall()
                topic_list.append({
                    "id": top["id"],
                    "name": top["name"],
                    "subtopics": [{"id": st["id"], "name": st["name"]} for st in subtopics],
                })
            tree.append({
                "id": subj["id"],
                "name": subj["name"],
                "topics": topic_list,
            })
    return tree
