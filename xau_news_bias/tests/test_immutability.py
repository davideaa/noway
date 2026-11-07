import sqlite3

import pytest

from xnb.config import get_settings
from xnb.db import append_chained, session, verify_chain


def _row(i, bias="BEARISH"):
    return {"prediction_utc": f"2026-10-14T11:{i:02d}:00.00Z", "event_id": "CPI_2026-10-14",
            "event_t0_utc": "2026-10-14T12:30:00.00Z", "checkpoint": "ROLLING", "seconds_to_event": 3600 - i,
            "model_version": "CPI-V1", "family": "CPI", "bias": bias, "raw_prob_up": 0.41, "calibrated_prob_up": 0.45,
            "confidence": "NONE", "oos_validated": False, "features_json": "{}", "snapshot_sha256": "x"}


def test_predictions_are_append_only():
    with session() as con:
        for i in range(3):
            append_chained(con, "predictions", _row(i))
    with session() as con:
        with pytest.raises(sqlite3.IntegrityError):
            con.execute("UPDATE predictions SET bias='BULLISH' WHERE id=1")
        with pytest.raises(sqlite3.IntegrityError):
            con.execute("DELETE FROM predictions WHERE id=1")
        assert verify_chain(con, "predictions") == (True, None)


def test_tampering_is_detected_even_bypassing_triggers():
    with session() as con:
        for i in range(3):
            append_chained(con, "predictions", _row(i))
    # un "furbo" apre il file, toglie il trigger e cambia una previsione a posteriori
    con = sqlite3.connect(get_settings().db_path)
    con.execute("DROP TRIGGER predictions_no_update")
    con.execute("UPDATE predictions SET bias='BULLISH' WHERE id=2")
    con.commit()
    con.close()
    with session() as con:
        ok, bad = verify_chain(con, "predictions")
    assert not ok and bad == 2
