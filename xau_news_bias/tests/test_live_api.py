from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from xnb.db import append_chained, session
from xnb.live.engine import LiveEngine
from xnb.timeutil import iso

NOW = datetime(2026, 10, 14, 10, 0, tzinfo=timezone.utc)
T0 = datetime(2026, 10, 14, 12, 30, tzinfo=timezone.utc)
EV = {"event_id": "CPI_2026-10-14", "family": "CPI", "name": "Consumer Price Index", "t0_utc": iso(T0)}


def _pred(when, label):
    with session() as con:
        append_chained(con, "predictions", {
            "prediction_utc": iso(when), "event_id": EV["event_id"], "event_t0_utc": EV["t0_utc"],
            "checkpoint": label, "seconds_to_event": int((T0 - when).total_seconds()), "family": "CPI",
            "bias": "NO RELIABLE EDGE", "features_json": "{}", "snapshot_sha256": "x"})


def test_due_cadence_and_checkpoints():
    eng = LiveEngine()
    # nessuna previsione ancora: si parte subito
    assert eng.due(EV, NOW) == "ROLLING"
    _pred(NOW, "ROLLING")
    # 2h30 prima: cadenza 5 minuti
    assert eng.due(EV, NOW + timedelta(minutes=2)) is None
    assert eng.due(EV, NOW + timedelta(minutes=5)) == "ROLLING"
    # checkpoint T-1H esatto (entro 3 minuti) ha la precedenza
    assert eng.due(EV, T0 - timedelta(hours=1) + timedelta(seconds=30)) == "T-1H"
    _pred(T0 - timedelta(hours=1) + timedelta(seconds=30), "T-1H")
    assert eng.due(EV, T0 - timedelta(hours=1) + timedelta(seconds=60)) is None  # ultima ora: ogni minuto
    assert eng.due(EV, T0 - timedelta(hours=1) + timedelta(seconds=90)) == "ROLLING"
    # evento passato: niente previsioni
    assert eng.due(EV, T0 + timedelta(seconds=1)) is None
    # famiglie senza modello: solo i checkpoint
    nfp = dict(EV, event_id="NFP_2026-10-02", family="NFP")
    assert eng.due(nfp, NOW) is None
    assert eng.due(nfp, T0 - timedelta(hours=4) + timedelta(seconds=10)) == "T-4H"


def test_api_endpoints_smoke():
    from xnb.api.app import app

    with session() as con:
        con.execute("INSERT INTO events(event_id,family,name,t0_utc,status,inserted_utc) VALUES(?,?,?,?,?,?)",
                    ("CPI_2099-01-01", "CPI", "Consumer Price Index", "2099-01-01T13:30:00.00Z", "scheduled",
                     iso(NOW)))
    c = TestClient(app)
    o = c.get("/api/overview").json()
    assert o["next_event"]["event_id"] == "CPI_2099-01-01"
    assert o["prediction"] is None
    assert len(c.get("/api/sources").json()) >= 10
    t = c.get("/api/trackrecord").json()
    assert t["chain_ok"] is True
    assert c.get("/").status_code == 200
    assert c.get("/static/app.js").status_code == 200
