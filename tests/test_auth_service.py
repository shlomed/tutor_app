import pytest

from services.auth_service import fetch_auth_credentials, get_user_id, register_user


class TestRegisterUser:
    def test_registers_new_user(self):
        register_user("alice", "Alice Cohen", "securepass1")

        creds = fetch_auth_credentials()
        assert "alice" in creds["usernames"]
        assert creds["usernames"]["alice"]["name"] == "Alice Cohen"

    def test_password_is_hashed(self):
        register_user("bob", "Bob Levi", "mypassword1")

        creds = fetch_auth_credentials()
        stored_pw = creds["usernames"]["bob"]["password"]
        assert stored_pw != "mypassword1"
        assert stored_pw.startswith("$2")  # bcrypt hash prefix

    def test_duplicate_username_raises_value_error(self):
        register_user("charlie", "Charlie", "password123")

        with pytest.raises(ValueError, match="שם המשתמש כבר קיים"):
            register_user("charlie", "Charlie 2", "password456")


class TestFetchAuthCredentials:
    def test_returns_correct_structure(self):
        register_user("dana", "Dana", "password123")

        creds = fetch_auth_credentials()
        assert "usernames" in creds
        user_data = creds["usernames"]["dana"]
        assert "name" in user_data
        assert "password" in user_data
        assert "email" in user_data
        assert "failed_login_attempts" in user_data
        assert "logged_in" in user_data

    def test_empty_when_no_users(self):
        creds = fetch_auth_credentials()
        assert creds == {"usernames": {}}

    def test_multiple_users(self):
        register_user("user1", "User One", "password1!")
        register_user("user2", "User Two", "password2!")

        creds = fetch_auth_credentials()
        assert len(creds["usernames"]) == 2
        assert "user1" in creds["usernames"]
        assert "user2" in creds["usernames"]


class TestGetUserId:
    def test_returns_id_for_existing_user(self):
        register_user("eve", "Eve", "password123")

        uid = get_user_id("eve")
        assert uid is not None
        assert isinstance(uid, int)

    def test_returns_none_for_missing_user(self):
        uid = get_user_id("nonexistent")
        assert uid is None

    def test_ids_are_unique(self):
        register_user("user_a", "User A", "password1!")
        register_user("user_b", "User B", "password2!")

        id_a = get_user_id("user_a")
        id_b = get_user_id("user_b")
        assert id_a != id_b
