import os
import sqlite3
from contextlib import contextmanager
from typing import Generator

DB_PATH = os.path.join(os.path.dirname(__file__), "tutor.db")


def _migrate_subjects_add_course_id(conn: sqlite3.Connection) -> None:
    """Migrate Subjects table to include course_id column.
    Runs only if the column doesn't exist yet."""
    cursor = conn.execute("PRAGMA table_info(Subjects)")
    columns = [row[1] for row in cursor.fetchall()]
    if "course_id" in columns:
        return

    # Create a default course for orphan subjects
    conn.execute(
        "INSERT OR IGNORE INTO Courses (name) VALUES (?)",
        ("כללי",),
    )
    default_course_id = conn.execute(
        "SELECT id FROM Courses WHERE name = ?", ("כללי",)
    ).fetchone()[0]

    # Recreate Subjects with new schema, preserving IDs
    conn.executescript(f"""
        CREATE TABLE Subjects_new (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id  INTEGER NOT NULL REFERENCES Courses(id),
            name       TEXT    NOT NULL,
            UNIQUE(course_id, name)
        );
        INSERT INTO Subjects_new (id, course_id, name)
            SELECT id, {default_course_id}, name FROM Subjects;
        DROP TABLE Subjects;
        ALTER TABLE Subjects_new RENAME TO Subjects;
    """)


def _migrate_courses_add_description(conn: sqlite3.Connection) -> None:
    """Add description column to Courses table if not present."""
    cols = [r[1] for r in conn.execute("PRAGMA table_info(Courses)").fetchall()]
    if "description" not in cols:
        conn.execute(
            "ALTER TABLE Courses ADD COLUMN description TEXT NOT NULL DEFAULT ''"
        )


def _migrate_users_add_preferences(conn: sqlite3.Connection) -> None:
    """Add learning_preferences column to Users table if not present."""
    cols = [r[1] for r in conn.execute("PRAGMA table_info(Users)").fetchall()]
    if "learning_preferences" not in cols:
        conn.execute(
            "ALTER TABLE Users ADD COLUMN learning_preferences TEXT NOT NULL DEFAULT ''"
        )


def init_db() -> None:
    """Create all tables if they do not already exist. Safe to call on every app rerun."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS Users (
                id                   INTEGER PRIMARY KEY AUTOINCREMENT,
                username             TEXT    NOT NULL UNIQUE,
                name                 TEXT    NOT NULL,
                hashed_password      TEXT    NOT NULL,
                learning_preferences TEXT    NOT NULL DEFAULT '',
                created_at           TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS Courses (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL UNIQUE,
                description TEXT    NOT NULL DEFAULT '',
                created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS Subjects (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id  INTEGER NOT NULL REFERENCES Courses(id),
                name       TEXT    NOT NULL,
                UNIQUE(course_id, name)
            );

            CREATE TABLE IF NOT EXISTS Topics (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                subject_id INTEGER NOT NULL REFERENCES Subjects(id),
                name       TEXT    NOT NULL
            );

            CREATE TABLE IF NOT EXISTS SubTopics (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                topic_id INTEGER NOT NULL REFERENCES Topics(id),
                name     TEXT    NOT NULL
            );

            CREATE TABLE IF NOT EXISTS UserProgress (
                id                   INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id              INTEGER NOT NULL REFERENCES Users(id),
                subtopic_id          INTEGER NOT NULL REFERENCES SubTopics(id),
                status               TEXT    NOT NULL DEFAULT 'not_started',
                xp_earned            INTEGER NOT NULL DEFAULT 0,
                assistance_level_used INTEGER NOT NULL DEFAULT 0,
                updated_at           TEXT    NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id, subtopic_id)
            );

            CREATE TABLE IF NOT EXISTS ChatSessions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL REFERENCES Users(id),
                subtopic_id INTEGER NOT NULL REFERENCES SubTopics(id),
                role        TEXT    NOT NULL,
                content     TEXT    NOT NULL,
                created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS LessonContent (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                subtopic_id INTEGER NOT NULL UNIQUE REFERENCES SubTopics(id),
                content     TEXT    NOT NULL,
                created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        """)
        conn.commit()

        # Migrate existing databases that don't have course_id on Subjects
        _migrate_subjects_add_course_id(conn)
        conn.commit()

        _migrate_courses_add_description(conn)
        conn.commit()

        _migrate_users_add_preferences(conn)
        conn.commit()
    finally:
        conn.close()


@contextmanager
def get_connection() -> Generator[sqlite3.Connection, None, None]:
    """Yield a connection with row_factory=sqlite3.Row.
    Commits on clean exit; rolls back on exception."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
