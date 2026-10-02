import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


@pytest.fixture(autouse=True)
def isolated_data(tmp_path, monkeypatch):
    """Ogni test usa una cartella dati e un database propri: mai quelli veri."""
    monkeypatch.setenv("XNB_DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("XNB_DB_PATH", str(tmp_path / "data" / "test.sqlite"))
    monkeypatch.setenv("XNB_NO_SCHEDULER", "1")
    yield
