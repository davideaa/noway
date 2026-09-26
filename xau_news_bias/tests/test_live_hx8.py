"""Registro live H-X8: la catena committata è integra e ogni manomissione si vede."""
import copy
import importlib.util
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("hx8_live", ROOT / "scripts" / "hx8_live.py")
live = importlib.util.module_from_spec(spec)
spec.loader.exec_module(live)


def test_registro_committato_integro():
    recs = live.read_log()
    assert recs, "il registro live non deve essere vuoto"
    live.verify(recs)


def test_manomissione_rilevata():
    recs = live.read_log()
    bad = copy.deepcopy(recs)
    bad[0]["bias"] = "SHORT" if bad[0]["bias"] == "LONG" else "LONG"
    with pytest.raises(AssertionError):
        live.verify(bad)


def test_bias_scritta_dopo_la_release_rifiutata():
    rec = {"seq": 0, "type": "prediction", "event_id": "NFP_X", "family": "NFP", "t0_utc": "2026-10-02T12:30:00Z",
           "created_utc": "2026-10-02T12:31:00Z", "bias": "LONG", "prev_hash": live.GENESIS}
    rec["hash"] = live.digest(rec)
    with pytest.raises(AssertionError):
        live.verify([rec])
