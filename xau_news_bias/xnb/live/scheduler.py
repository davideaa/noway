"""Scheduler del LIVE MODE: tutti i job periodici, con esito registrato in ``job_runs``.

| Job              | Ogni          | Cosa fa                                                      |
|------------------|---------------|--------------------------------------------------------------|
| quotes           | 15 s (aperto) | prezzo XAU Swissquote + controllo incrociato gold-api        |
| calendar         | 30 min        | BLS iCal + ForexFactory, archivia il consensus               |
| daily_data       | 3 h           | Treasury, VIX, COT, nowcast (cache locale, solo se cambiati) |
| predict          | 1 min         | per ogni evento entro 7 giorni: ricalcola se è il momento    |
| resolve          | 10 min        | esito dopo la release, aggiorna il track record              |
| health           | 5 min         | stato fonti, log di FAILED/STALE, integrità catena hash      |

Un job che fallisce non ferma gli altri e finisce nei log e in ``job_runs``.
"""

from __future__ import annotations

import logging
import threading
from datetime import date, timedelta

from apscheduler.schedulers.background import BackgroundScheduler

from ..db import session, verify_chain
from ..providers.consensus import ClevelandFedNowcast
from ..providers.official import CboeProvider, CFTCProvider, NYFedProvider, TreasuryProvider
from ..quality.registry import registry_status
from ..timeutil import iso, utc_now, xau_market_open
from .engine import LiveEngine

log = logging.getLogger("xnb.live.scheduler")

STATE = {"last_step": None, "next_step": None, "started": None, "chain_ok": None, "chain_broken_at": None}


def _run(job: str, fn):
    started = iso(utc_now())
    with session() as con:
        rid = con.execute("INSERT INTO job_runs(job,started_utc) VALUES(?,?)", (job, started)).lastrowid
    ok, msg = 1, "ok"
    try:
        res = fn()
        if isinstance(res, list):
            msg = f"ok ({len(res)} elementi)"
    except Exception as exc:  # noqa: BLE001
        ok, msg = 0, f"{type(exc).__name__}: {exc}"[:500]
        log.exception("job %s fallito", job)
    with session() as con:
        con.execute("UPDATE job_runs SET finished_utc=?, ok=?, message=? WHERE id=?", (iso(utc_now()), ok, msg, rid))
        # non far crescere all'infinito la tabella dei job
        con.execute("DELETE FROM job_runs WHERE started_utc < ?", (iso(utc_now() - timedelta(days=30)),))


class LiveService:
    def __init__(self):
        self.engine = LiveEngine()
        self.sched = BackgroundScheduler(timezone="UTC", job_defaults={"coalesce": True, "max_instances": 1,
                                                                       "misfire_grace_time": 60})
        self._lock = threading.Lock()

    def _quotes(self):
        if xau_market_open(utc_now()) or utc_now().second < 15 and utc_now().minute % 10 == 0:
            self.engine.collect_quote()

    def _daily(self):
        today = date.today()
        start = date(today.year - 1, 1, 1)
        TreasuryProvider().daily(start, today)
        NYFedProvider().daily(start, today)
        CboeProvider().daily(start, today)
        CFTCProvider().gold_cot(start, today)
        ClevelandFedNowcast().load(max_age_h=3)

    def _predict(self):
        with self._lock:
            out = self.engine.step()
        STATE["last_step"] = iso(utc_now())
        return out

    def _health(self):
        for s in registry_status():
            if s["state"] in ("FAILED", "STALE"):
                log.warning("fonte %s: %s — %s", s["id"], s["state"], s["detail"])
        with session() as con:
            ok1, bad1 = verify_chain(con, "predictions")
            ok2, bad2 = verify_chain(con, "live_outcomes")
        STATE["chain_ok"] = ok1 and ok2
        STATE["chain_broken_at"] = bad1 or bad2
        if not STATE["chain_ok"]:
            log.error("TRACK RECORD ALTERATO: catena hash rotta alla riga %s", STATE["chain_broken_at"])

    def start(self) -> None:
        STATE["started"] = iso(utc_now())
        s = self.sched
        s.add_job(lambda: _run("quotes", self._quotes), "interval", seconds=15, id="quotes")
        s.add_job(lambda: _run("calendar", self.engine.refresh_calendar), "interval", minutes=30, id="calendar",
                  next_run_time=utc_now() + timedelta(seconds=2))
        s.add_job(lambda: _run("daily_data", self._daily), "interval", hours=3, id="daily_data",
                  next_run_time=utc_now() + timedelta(seconds=20))
        s.add_job(lambda: _run("predict", self._predict), "cron", second=5, id="predict")
        s.add_job(lambda: _run("resolve", self.engine.resolve), "interval", minutes=10, id="resolve",
                  next_run_time=utc_now() + timedelta(seconds=60))
        s.add_job(lambda: _run("health", self._health), "interval", minutes=5, id="health",
                  next_run_time=utc_now() + timedelta(seconds=10))
        s.start()
        log.info("LIVE MODE avviato: job %s", [j.id for j in s.get_jobs()])

    def next_step(self):
        j = self.sched.get_job("predict")
        return j.next_run_time if j else None

    def stop(self) -> None:
        self.sched.shutdown(wait=False)
