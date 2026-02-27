import pytest

from database.db import get_connection
from services.syllabus_service import (
    SyllabusSchema,
    SubjectSchema,
    SubTopicSchema,
    TopicSchema,
    create_course,
    delete_course_syllabus,
    get_all_courses,
    get_course_syllabus,
    get_full_syllabus,
    save_syllabus_to_db,
    syllabus_to_flat_rows,
    db_syllabus_to_flat_rows,
    update_subject_name,
    update_topic_name,
    update_subtopic_name,
    add_subtopic,
    remove_subtopic,
)


def _make_syllabus() -> SyllabusSchema:
    """Helper: build a sample syllabus for tests."""
    return SyllabusSchema(
        subjects=[
            SubjectSchema(
                name="מתמטיקה",
                topics=[
                    TopicSchema(
                        name="אלגברה",
                        subtopics=[
                            SubTopicSchema(name="משוואות ממעלה ראשונה"),
                            SubTopicSchema(name="משוואות ממעלה שנייה"),
                        ],
                    ),
                    TopicSchema(
                        name="גיאומטריה",
                        subtopics=[
                            SubTopicSchema(name="משולשים"),
                        ],
                    ),
                ],
            ),
            SubjectSchema(
                name="פיזיקה",
                topics=[
                    TopicSchema(
                        name="מכניקה",
                        subtopics=[
                            SubTopicSchema(name="חוקי ניוטון"),
                        ],
                    ),
                ],
            ),
        ]
    )


def _create_test_course(name="קורס בדיקה") -> int:
    return create_course(name)


class TestCourseCRUD:
    def test_create_course(self):
        cid = _create_test_course("מתמטיקה 5 יח")
        assert isinstance(cid, int)
        assert cid > 0

    def test_create_duplicate_course_raises(self):
        _create_test_course("כפול")
        with pytest.raises(ValueError):
            _create_test_course("כפול")

    def test_get_all_courses_empty(self):
        courses = get_all_courses()
        assert courses == []

    def test_get_all_courses(self):
        _create_test_course("א")
        _create_test_course("ב")
        courses = get_all_courses()
        assert len(courses) == 2
        assert courses[0]["name"] == "א"
        assert courses[1]["name"] == "ב"


class TestSaveSyllabus:
    def test_saves_correct_counts(self):
        cid = _create_test_course()
        syllabus = _make_syllabus()
        counts = save_syllabus_to_db(syllabus, cid)
        assert counts["subjects"] == 2
        assert counts["topics"] == 3
        assert counts["subtopics"] == 4

    def test_data_persisted_in_db(self):
        cid = _create_test_course()
        syllabus = _make_syllabus()
        save_syllabus_to_db(syllabus, cid)

        with get_connection() as conn:
            subjects = conn.execute("SELECT name FROM Subjects").fetchall()
            topics = conn.execute("SELECT name FROM Topics").fetchall()
            subtopics = conn.execute("SELECT name FROM SubTopics").fetchall()

        assert {r["name"] for r in subjects} == {"מתמטיקה", "פיזיקה"}
        assert {r["name"] for r in topics} == {"אלגברה", "גיאומטריה", "מכניקה"}
        assert len(subtopics) == 4

    def test_foreign_keys_correct(self):
        cid = _create_test_course()
        syllabus = _make_syllabus()
        save_syllabus_to_db(syllabus, cid)

        with get_connection() as conn:
            row = conn.execute(
                """SELECT s.name FROM Subjects s
                   JOIN Topics t ON t.subject_id = s.id
                   WHERE t.name = 'אלגברה'"""
            ).fetchone()
        assert row["name"] == "מתמטיקה"

    def test_subjects_linked_to_course(self):
        cid = _create_test_course()
        syllabus = _make_syllabus()
        save_syllabus_to_db(syllabus, cid)

        with get_connection() as conn:
            rows = conn.execute(
                "SELECT course_id FROM Subjects WHERE course_id = ?", (cid,)
            ).fetchall()
        assert len(rows) == 2


class TestGetFullSyllabus:
    def test_empty_when_no_data(self):
        tree = get_full_syllabus()
        assert tree == []

    def test_returns_nested_structure(self):
        cid = _create_test_course()
        syllabus = _make_syllabus()
        save_syllabus_to_db(syllabus, cid)

        tree = get_full_syllabus()
        assert len(tree) == 2
        math_subject = tree[0]
        assert math_subject["name"] == "מתמטיקה"
        assert len(math_subject["topics"]) == 2
        algebra = math_subject["topics"][0]
        assert algebra["name"] == "אלגברה"
        assert len(algebra["subtopics"]) == 2

    def test_filter_by_course_id(self):
        cid1 = _create_test_course("קורס א")
        cid2 = _create_test_course("קורס ב")
        save_syllabus_to_db(_make_syllabus(), cid1)
        save_syllabus_to_db(
            SyllabusSchema(subjects=[
                SubjectSchema(name="ביולוגיה", topics=[
                    TopicSchema(name="תא", subtopics=[SubTopicSchema(name="מיטוזה")])
                ])
            ]),
            cid2,
        )

        tree1 = get_full_syllabus(course_id=cid1)
        tree2 = get_full_syllabus(course_id=cid2)
        assert len(tree1) == 2
        assert len(tree2) == 1
        assert tree2[0]["name"] == "ביולוגיה"


class TestGetCourseSyllabus:
    def test_returns_only_course_subjects(self):
        cid = _create_test_course()
        save_syllabus_to_db(_make_syllabus(), cid)
        tree = get_course_syllabus(cid)
        assert len(tree) == 2
        assert tree[0]["name"] == "מתמטיקה"


class TestDeleteCourseSyllabus:
    def test_cascade_deletes_all_data(self):
        cid = _create_test_course()
        save_syllabus_to_db(_make_syllabus(), cid)

        # Verify data exists
        with get_connection() as conn:
            assert conn.execute("SELECT COUNT(*) FROM Subjects").fetchone()[0] == 2
            assert conn.execute("SELECT COUNT(*) FROM Topics").fetchone()[0] == 3
            assert conn.execute("SELECT COUNT(*) FROM SubTopics").fetchone()[0] == 4

        delete_course_syllabus(cid)

        with get_connection() as conn:
            assert conn.execute("SELECT COUNT(*) FROM Subjects").fetchone()[0] == 0
            assert conn.execute("SELECT COUNT(*) FROM Topics").fetchone()[0] == 0
            assert conn.execute("SELECT COUNT(*) FROM SubTopics").fetchone()[0] == 0

    def test_cascade_deletes_progress_and_chat(self):
        cid = _create_test_course()
        save_syllabus_to_db(_make_syllabus(), cid)

        # Get a subtopic ID and create a user
        with get_connection() as conn:
            subtopic_id = conn.execute("SELECT id FROM SubTopics LIMIT 1").fetchone()["id"]
            conn.execute(
                "INSERT INTO Users (username, name, hashed_password) VALUES (?, ?, ?)",
                ("tester", "Test", "hash"),
            )
            user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            conn.execute(
                "INSERT INTO UserProgress (user_id, subtopic_id, status) VALUES (?, ?, ?)",
                (user_id, subtopic_id, "in_progress"),
            )
            conn.execute(
                "INSERT INTO ChatSessions (user_id, subtopic_id, role, content) VALUES (?, ?, ?, ?)",
                (user_id, subtopic_id, "user", "שאלה"),
            )

        delete_course_syllabus(cid)

        with get_connection() as conn:
            assert conn.execute("SELECT COUNT(*) FROM UserProgress").fetchone()[0] == 0
            assert conn.execute("SELECT COUNT(*) FROM ChatSessions").fetchone()[0] == 0


class TestFlatTableHelpers:
    def test_syllabus_to_flat_rows(self):
        syllabus = _make_syllabus()
        rows = syllabus_to_flat_rows(syllabus)
        assert len(rows) == 4
        assert rows[0] == {"מקצוע": "מתמטיקה", "נושא": "אלגברה", "תת-נושא": "משוואות ממעלה ראשונה"}
        assert rows[3] == {"מקצוע": "פיזיקה", "נושא": "מכניקה", "תת-נושא": "חוקי ניוטון"}

    def test_db_syllabus_to_flat_rows(self):
        cid = _create_test_course()
        save_syllabus_to_db(_make_syllabus(), cid)
        rows = db_syllabus_to_flat_rows(cid)
        assert len(rows) == 4
        assert "subject_id" in rows[0]
        assert "topic_id" in rows[0]
        assert "subtopic_id" in rows[0]
        assert rows[0]["מקצוע"] == "מתמטיקה"


class TestInlineEditing:
    def test_update_subject_name(self):
        cid = _create_test_course()
        save_syllabus_to_db(_make_syllabus(), cid)

        with get_connection() as conn:
            sid = conn.execute("SELECT id FROM Subjects WHERE name='מתמטיקה'").fetchone()["id"]

        update_subject_name(sid, "מתמטיקה מורחבת")

        with get_connection() as conn:
            row = conn.execute("SELECT name FROM Subjects WHERE id=?", (sid,)).fetchone()
        assert row["name"] == "מתמטיקה מורחבת"

    def test_update_topic_name(self):
        cid = _create_test_course()
        save_syllabus_to_db(_make_syllabus(), cid)

        with get_connection() as conn:
            tid = conn.execute("SELECT id FROM Topics WHERE name='אלגברה'").fetchone()["id"]

        update_topic_name(tid, "אלגברה ליניארית")

        with get_connection() as conn:
            row = conn.execute("SELECT name FROM Topics WHERE id=?", (tid,)).fetchone()
        assert row["name"] == "אלגברה ליניארית"

    def test_update_subtopic_name(self):
        cid = _create_test_course()
        save_syllabus_to_db(_make_syllabus(), cid)

        with get_connection() as conn:
            stid = conn.execute(
                "SELECT id FROM SubTopics WHERE name='משולשים'"
            ).fetchone()["id"]

        update_subtopic_name(stid, "משולשים וזוויות")

        with get_connection() as conn:
            row = conn.execute("SELECT name FROM SubTopics WHERE id=?", (stid,)).fetchone()
        assert row["name"] == "משולשים וזוויות"

    def test_add_subtopic(self):
        cid = _create_test_course()
        save_syllabus_to_db(_make_syllabus(), cid)

        with get_connection() as conn:
            tid = conn.execute("SELECT id FROM Topics WHERE name='אלגברה'").fetchone()["id"]

        new_id = add_subtopic(tid, "אי-שוויונות")
        assert isinstance(new_id, int)

        with get_connection() as conn:
            row = conn.execute("SELECT name FROM SubTopics WHERE id=?", (new_id,)).fetchone()
        assert row["name"] == "אי-שוויונות"

    def test_remove_subtopic(self):
        cid = _create_test_course()
        save_syllabus_to_db(_make_syllabus(), cid)

        with get_connection() as conn:
            stid = conn.execute(
                "SELECT id FROM SubTopics WHERE name='משולשים'"
            ).fetchone()["id"]

        remove_subtopic(stid)

        with get_connection() as conn:
            row = conn.execute("SELECT id FROM SubTopics WHERE id=?", (stid,)).fetchone()
        assert row is None


@pytest.mark.llm
def test_parse_syllabus_live():
    """Live test: send sample text to Claude and get structured output."""
    from dotenv import load_dotenv
    load_dotenv()
    from services.syllabus_service import parse_syllabus_to_json

    raw = """
    מתמטיקה:
    - אלגברה: משוואות ממעלה ראשונה, משוואות ממעלה שנייה
    - גיאומטריה: משולשים, מעגלים
    """
    result = parse_syllabus_to_json(raw)
    assert isinstance(result, SyllabusSchema)
    assert len(result.subjects) >= 1
    print(f"\nParsed: {result.model_dump_json(indent=2)}")
