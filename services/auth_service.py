import sqlite3
from typing import Any, Dict, Optional

import bcrypt

from database.db import get_connection


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def hash_password(plain_password: str) -> str:
    """Hash password using bcrypt directly."""
    return bcrypt.hashpw(
        plain_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def get_user_by_username(username: str) -> Optional[dict]:
    """Return full user dict (id, username, name, hashed_password, learning_preferences) or None."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, username, name, hashed_password, learning_preferences FROM Users WHERE username = ?",
            (username,),
        ).fetchone()
    return dict(row) if row else None


def get_learning_preferences(user_id: int) -> str:
    """Return the learning_preferences text for a user, or empty string."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT learning_preferences FROM Users WHERE id = ?",
            (user_id,),
        ).fetchone()
    return row["learning_preferences"] if row else ""


def update_learning_preferences(user_id: int, preferences: str) -> None:
    """Update the learning preferences for a user."""
    with get_connection() as conn:
        conn.execute(
            "UPDATE Users SET learning_preferences = ? WHERE id = ?",
            (preferences, user_id),
        )


def register_user(username: str, name: str, plain_password: str) -> None:
    """Hash the password and insert a new user into the Users table.
    Raises ValueError if the username already exists."""
    hashed_password = hash_password(plain_password)
    try:
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO Users (username, name, hashed_password) VALUES (?, ?, ?)",
                (username, name, hashed_password),
            )
    except sqlite3.IntegrityError:
        raise ValueError("שם המשתמש כבר קיים במערכת")


def fetch_auth_credentials() -> Dict[str, Any]:
    """Read all users and return the dict structure expected by
    streamlit-authenticator 0.3.x Authenticate constructor."""
    with get_connection() as conn:
        rows = conn.execute("SELECT username, name, hashed_password FROM Users").fetchall()

    usernames = {}
    for row in rows:
        usernames[row["username"]] = {
            "name": row["name"],
            "password": row["hashed_password"],
            "email": "",
            "failed_login_attempts": 0,
            "logged_in": False,
        }

    return {"usernames": usernames}


def get_user_id(username: str) -> Optional[int]:
    """Look up the integer primary key for a given username."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM Users WHERE username = ?", (username,)
        ).fetchone()
    return row["id"] if row else None
