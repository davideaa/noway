"""RESEARCH MODE — dalla fonte al dataset congelato.

    events  ->  valori macro point-in-time  ->  esiti dai tick
            ->  dati di mercato (H1 storici, M1 attorno agli eventi)
            ->  fotografie pre-news (features.py)  ->  dataset congelato

Uso da riga di comando: ``python -m scripts.research build --family CPI``.
"""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta

import pandas as pd

from ..db import session
from ..providers.base import EventSpec
from ..providers.bls import BLSProvider
from ..providers.dukascopy import DXY_WEIGHTS, DukascopyProvider
from ..timeutil import CHECKPOINTS, NY, iso, utc_now
from .targets import compute_outcome

log = logging.getLogger("xnb.pipeline")

FX = list(DXY_WEIGHTS)
M1_SYMBOLS = ["XAUUSD", "EURUSD"]
H1_START = date(2002, 1, 1)


def store_events(events: list[EventSpec]) -> None:
    now = iso(utc_now())
    with session() as con:
        for e in events:
            con.execute(
                "INSERT INTO events(event_id,family,name,t0_utc,t0_local,tz,reference_period,source,source_url,status,inserted_utc)"
                " VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(event_id) DO UPDATE SET"
                " t0_utc=excluded.t0_utc, reference_period=COALESCE(excluded.reference_period, events.reference_period),"
                " status=CASE WHEN events.status='released' THEN 'released' ELSE excluded.status END,"
                " source=CASE WHEN events.status='released' THEN events.source ELSE excluded.source END,"
                " source_url=CASE WHEN events.status='released' THEN events.source_url ELSE excluded.source_url END",
                (e.event_id, e.family, e.name, iso(e.t0_utc), e.t0_utc.astimezone(NY).isoformat(), "America/New_York",
                 e.reference_period, e.source, e.source_url, e.status, now),
            )


def fetch_release_values(events: list[EventSpec], bls: BLSProvider) -> dict[str, dict[str, float]]:
    """Valori pubblicati a ciascuna release (noti da T0 in poi)."""
    out: dict[str, dict[str, float]] = {}
    with session() as con:
        for e in events:
            rows = con.execute("SELECT series, value FROM release_values WHERE event_id=? AND kind='as_published'",
                               (e.event_id,)).fetchall()
            if rows:
                out[e.event_id] = {r["series"]: r["value"] for r in rows}
                continue
            try:
                vals = bls.release_values(e)
            except Exception as exc:  # noqa: BLE001
                log.warning("valori %s non letti: %s", e.event_id, exc)
                vals = {}
            out[e.event_id] = vals
            for k, v in vals.items():
                con.execute(
                    "INSERT OR REPLACE INTO release_values(event_id,series,period,kind,value,known_at_utc,source)"
                    " VALUES(?,?,?,?,?,?,?)",
                    (e.event_id, k, e.reference_period or "", "as_published", v, iso(e.t0_utc), "bls_table_a"),
                )
    return out


def prefetch_market(events: list[EventSpec], duka: DukascopyProvider, workers: int = 4) -> None:
    """Scarica in parallelo tutto quello che serve: è la parte lenta, poi è tutto in cache."""
    jobs: list[tuple] = []
    end = max(e.t0_utc for e in events).date()
    y, m = H1_START.year, H1_START.month
    while (y, m) <= (end.year, end.month):
        for s in ["XAUUSD"] + FX:
            jobs.append(("h1", s, y, m))
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    lookback = max(CHECKPOINTS.values()) + 86400 + 3600
    for e in events:
        d0 = (e.t0_utc - timedelta(seconds=lookback)).date()
        d = d0
        while d <= e.t0_utc.date():
            for s in M1_SYMBOLS:
                jobs.append(("m1", s, d))
            d += timedelta(days=1)
        jobs.append(("tick", "XAUUSD", e.t0_utc))
    jobs = list(dict.fromkeys(jobs))
    log.info("prefetch: %d file da scaricare/verificare", len(jobs))

    def run(job):
        kind = job[0]
        if kind == "h1":
            duka.h1(job[1], job[2], job[3])
        elif kind == "m1":
            duka.m1(job[1], job[2])
        else:
            t0 = job[2]
            duka.ticks(job[1], t0 - timedelta(minutes=5), t0 + timedelta(minutes=5))
        return job

    done = 0
    failed = []
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(run, j) for j in jobs]
        for f in as_completed(futs):
            done += 1
            try:
                f.result()
            except Exception as exc:  # noqa: BLE001
                failed.append(str(exc)[:200])
            if done % 500 == 0:
                log.info("prefetch %d/%d (errori %d)", done, len(jobs), len(failed))
    if failed:
        log.warning("prefetch: %d file falliti, es. %s", len(failed), failed[:3])


def compute_outcomes(events: list[EventSpec], duka: DukascopyProvider) -> pd.DataFrame:
    rows = []
    now = iso(utc_now())
    with session() as con:
        for e in events:
            if e.t0_utc > utc_now() - timedelta(hours=3):
                continue  # il feed pubblica i tick con ritardo
            ticks = duka.ticks("XAUUSD", e.t0_utc - timedelta(minutes=5), e.t0_utc + timedelta(minutes=5))
            o = compute_outcome(e.event_id, e.t0_utc, ticks)
            row = o.db_row()
            row["computed_utc"] = now
            cols = list(row)
            con.execute(
                f"INSERT OR REPLACE INTO event_outcomes({','.join(cols)}) VALUES({','.join('?' * len(cols))})",
                [row[c] for c in cols],
            )
            r = o.db_row()
            r.update(dir_bid=o.dir_bid, dir_m1_bid=o.dir_m1_bid, t0_utc=e.t0_utc)
            rows.append(r)
    return pd.DataFrame(rows)


def build_events(family: str) -> list[EventSpec]:
    bls = BLSProvider()
    events = bls.historical_events(family)
    store_events(events)
    return events
