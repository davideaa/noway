"""Backend HTTP locale: API JSON + interfaccia web statica + scheduler LIVE.

Avvio: ``python -m xnb.api.app`` (vedi README). Tutti i numeri che la
dashboard mostra arrivano da qui, e qui arrivano dal database.
"""

from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from ..config import PROJECT_DIR, get_settings
from ..db import session, verify_chain
from ..quality.registry import registry_status
from ..timeutil import CHECKPOINTS, iso, parse_iso, utc_now, xau_market_open
from . import explain

log = logging.getLogger("xnb.api")
WEB = PROJECT_DIR / "web"
SERVICE = {"svc": None}


def _research(family: str) -> dict | None:
    p = get_settings().research_dir / f"{family.lower()}_results.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.environ.get("XNB_NO_SCHEDULER") != "1":
        from ..live.scheduler import LiveService

        svc = LiveService()
        svc.start()
        SERVICE["svc"] = svc
    yield
    if SERVICE["svc"]:
        SERVICE["svc"].stop()


app = FastAPI(title="XAU NEWS BIAS", lifespan=lifespan)


def _pred_row(r) -> dict:
    d = dict(r)
    for k in ("comparable_json", "data_issues_json", "features_json"):
        if d.get(k):
            try:
                d[k[:-5]] = json.loads(d[k])
            except json.JSONDecodeError:
                d[k[:-5]] = None
        d.pop(k, None)
    return d


def _latest_pred(con, event_id: str, full: bool = True) -> dict | None:
    r = con.execute("SELECT * FROM predictions WHERE event_id=? ORDER BY id DESC LIMIT 1", (event_id,)).fetchone()
    if not r:
        return None
    d = _pred_row(r)
    if not full:
        d.pop("features", None)
    return d


def _next_recalc(ev: dict, pred: dict | None, now):
    """Quando lo scheduler ricalcolerà questo evento (cadenza o checkpoint, il primo dei due)."""
    from ..live.engine import MODELLED, cadence_seconds

    t0 = parse_iso(ev["t0_utc"])
    tau = (t0 - now).total_seconds()
    if tau <= 0:
        return None
    cps = [t0 - timedelta(seconds=s) for s in CHECKPOINTS.values() if t0 - timedelta(seconds=s) > now]
    nxt_cp = min(cps) if cps else None
    if tau > 7 * 86400:
        return iso(t0 - timedelta(days=7))
    if ev["family"] not in MODELLED:
        return iso(nxt_cp) if nxt_cp else None
    last = parse_iso(pred["prediction_utc"]) if pred else now
    rolling = max(now, last + timedelta(seconds=cadence_seconds(tau)))
    return iso(min(rolling, nxt_cp) if nxt_cp else rolling)


@app.get("/api/overview")
def overview():
    now = utc_now()
    with session() as con:
        evs = [dict(r) for r in con.execute(
            "SELECT * FROM events WHERE t0_utc>=? ORDER BY t0_utc LIMIT 30", (iso(now),))]
        # in primo piano la prossima release di una famiglia con modello (oggi: CPI)
        from ..live.engine import MODELLED

        modelled = [e for e in evs if e["family"] in MODELLED]
        nxt = modelled[0] if modelled else (evs[0] if evs else None)
        pred = timeline = None
        if nxt:
            pred = _latest_pred(con, nxt["event_id"])
            timeline = []
            for cp in CHECKPOINTS:
                r = con.execute("SELECT id,prediction_utc,bias,calibrated_prob_up,confidence FROM predictions"
                                " WHERE event_id=? AND checkpoint=? ORDER BY id LIMIT 1", (nxt["event_id"], cp)).fetchone()
                timeline.append({"checkpoint": cp, **(dict(r) if r else {})})
        last_quote = con.execute("SELECT * FROM live_quotes ORDER BY ts_utc DESC LIMIT 1").fetchone()
        last_job = con.execute("SELECT * FROM job_runs WHERE job='predict' ORDER BY id DESC LIMIT 1").fetchone()
        upcoming = []
        for e in evs[:15]:
            lp = _latest_pred(con, e["event_id"], full=False)
            upcoming.append({**e, "latest": lp})
    svc = SERVICE["svc"]
    sources = registry_status()
    bad = [s for s in sources if s["state"] in ("FAILED", "STALE") and s.get("critical_for_live")]
    research = _research(nxt["family"]) if nxt else None
    return {
        "now_utc": iso(now), "market_open": xau_market_open(now),
        "earlier_unmodelled": [e for e in evs if nxt and e["t0_utc"] < nxt["t0_utc"]],
        "next_event": nxt, "prediction": pred, "timeline": timeline, "upcoming": upcoming,
        "headline": explain.headline(pred, research) if pred else None,
        "last_quote": dict(last_quote) if last_quote else None,
        "last_recalc": dict(last_job) if last_job else None,
        "next_recalc_utc": iso(svc.next_step()) if svc and svc.next_step() else None,
        "sources_warning": [{"id": s["id"], "state": s["state"], "detail": s["detail"]} for s in bad],
        "research_verdict": (research or {}).get("verdict"),
        "auto_from_utc": iso(parse_iso(nxt["t0_utc"]) - timedelta(days=7)) if nxt else None,
        "next_event_recalc_utc": _next_recalc(nxt, pred, now) if nxt else None,
    }


@app.get("/api/event/{event_id}")
def event_detail(event_id: str):
    with session() as con:
        ev = con.execute("SELECT * FROM events WHERE event_id=?", (event_id,)).fetchone()
        if not ev:
            raise HTTPException(404, "evento sconosciuto")
        preds = [dict(r) for r in con.execute(
            "SELECT id,prediction_utc,checkpoint,seconds_to_event,bias,raw_prob_up,calibrated_prob_up,confidence,"
            "data_status,model_version FROM predictions WHERE event_id=? ORDER BY id", (event_id,))]
        latest = _latest_pred(con, event_id)
        outcome = con.execute("SELECT * FROM live_outcomes WHERE event_id=?", (event_id,)).fetchone()
    research = _research(dict(ev)["family"])
    why = None
    if latest and latest.get("features"):
        f = latest["features"].get("features", {})
        why = {"headline": explain.headline(latest, research), "regimes": explain.regimes(f),
               "extra": latest["features"].get("extra", {}), "comparable": latest.get("comparable"),
               "class_performance": (research or {}).get("holdout", {}).get("buckets")}
    return {"event": dict(ev), "predictions": preds, "latest": latest, "why": why,
            "outcome": dict(outcome) if outcome else None}


@app.get("/api/research/{family}")
def research(family: str):
    r = _research(family)
    if r is None:
        raise HTTPException(404, f"nessuna ricerca per {family}")
    return JSONResponse(r)


@app.get("/api/sources")
def sources():
    return registry_status()


@app.get("/api/trackrecord")
def trackrecord():
    with session() as con:
        rows = [dict(r) for r in con.execute(
            "SELECT o.*, p.bias AS t1h_bias, p.calibrated_prob_up AS t1h_prob, p.model_version, "
            "f.bias AS final_bias, f.calibrated_prob_up AS final_prob FROM live_outcomes o "
            "LEFT JOIN predictions p ON p.id=o.t1h_prediction_id LEFT JOIN predictions f ON f.id=o.final_prediction_id "
            "ORDER BY o.id DESC")]
        ok1, bad1 = verify_chain(con, "predictions")
        ok2, bad2 = verify_chain(con, "live_outcomes")
        n_pred = con.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
    scored = [r for r in rows if r["t1h_bias"] in ("BULLISH", "BEARISH") and r["direction"] in ("BULLISH", "BEARISH")]
    hits = sum(1 for r in scored if r["t1h_bias"] == r["direction"])
    return {"outcomes": rows, "n_predictions": n_pred, "chain_ok": ok1 and ok2, "chain_broken_at": bad1 or bad2,
            "scored_t1h": len(scored), "hits_t1h": hits}


@app.get("/api/models")
def models():
    with session() as con:
        return [dict(r) for r in con.execute("SELECT * FROM models ORDER BY created_utc DESC")]


@app.get("/api/health")
def health():
    with session() as con:
        jobs = [dict(r) for r in con.execute(
            "SELECT j.* FROM job_runs j JOIN (SELECT job, MAX(id) mid FROM job_runs GROUP BY job) x ON x.mid=j.id")]
    from ..live.scheduler import STATE

    return {"jobs": jobs, "state": STATE, "scheduler": SERVICE["svc"] is not None}


@app.post("/api/recalculate")
def recalculate():
    svc = SERVICE["svc"]
    if not svc:
        raise HTTPException(503, "scheduler non attivo")
    from ..live.engine import MODELLED

    now = utc_now()
    out = []
    for ev in svc.engine.upcoming(horizon_days=35):
        t0 = parse_iso(ev["t0_utc"])
        if t0 > now and (ev["family"] in MODELLED or (t0 - now).days < 7):
            out.append(svc.engine.predict(ev, now, "MANUAL")["id"])
    return {"recalculated": out}


@app.get("/favicon.ico")
def favicon():
    return FileResponse(WEB / "favicon.svg", media_type="image/svg+xml")


@app.get("/")
def index():
    return FileResponse(WEB / "index.html")


app.mount("/static", StaticFiles(directory=str(WEB)), name="static")


def main():
    import uvicorn

    from ..logging_setup import setup_logging

    setup_logging()
    s = get_settings()
    log.info("XAU NEWS BIAS su http://%s:%d", s.host, s.port)
    uvicorn.run(app, host=s.host, port=s.port, log_level="warning")


if __name__ == "__main__":
    main()
