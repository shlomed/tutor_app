import os
import tempfile

import pytest

import database.db as db_module


@pytest.fixture(autouse=True)
def tmp_database(tmp_path):
    """Redirect all DB operations to a temp file so tests are isolated."""
    test_db = str(tmp_path / "test_tutor.db")
    db_module.DB_PATH = test_db
    db_module.init_db()
    yield test_db
