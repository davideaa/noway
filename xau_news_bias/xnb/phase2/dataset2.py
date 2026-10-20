"""Dataset della fase 2: eventi CPI+NFP, anatomia tick, percorsi, fotografie a 8 cutoff.

Tre file congelati con SHA-256 in research_output/phase2/:
    p2_events.parquet    un evento per riga: anatomia della prima M1, unità di
                         volatilità, giorni di controllo senza news, qualità
    p2_paths.parquet     percorso bid/ask da T0−65 s a T0+65 s (per le simulazioni)
    p2_features.parquet  evento × cutoff × feature point-in-time
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from concurrent.futures import ProcessPoolExecutor
from datetime import date, timedelta

import numpy as np
import pandas as pd

from ..config import get_settings
from ..providers.consensus import ClevelandFedNowcast, ForexFactoryHistory
from ..providers.dukascopy import DukascopyProvider
from ..providers.official import NewsIndexProvider
from ..research.dataset import expectation_features, load_market, timestamp_check
from ..research.features import dxy_features, macro_features, rates_features, xau_features
from ..timeutil import NY, iso, utc_now
from . import features2 as F2
from .events import family_events
from .memory import consensus_features, load_surprise_table, reaction_features, surprise_features
from .nfp_bls import load_nfp_releases, nfp_level_features
from .ticktrade import anatomy, extract_path, path_class

log = logging.getLogger("xnb.phase2.dataset")

CUTOFFS = {"T-3D": 3 * 86400, "T-24H": 86400, "T-4H": 4 * 3600, "T-1H": 3600, "T-30M": 1800,
           "T-15M": 900, "T-5M": 300, "T-1M": 60}
M1_SYMBOLS = ["XAUUSD", "EURUSD", "USDJPY", "USA500IDXUSD", "USATECHIDXUSD"]
FAMILY_TITLES = {"CPI": {"CPI m/m", "Core CPI m/m", "CPI y/y", "Core CPI y/y"},
                 "NFP": {"Non-Farm Employment Change", "Unemployment Rate", "Average Hourly Earnings m/m"}}

_G: dict = {}  # stato condiviso con i processi figli (fork)


def _out_dir():
    d = get_settings().research_dir / "phase2"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _m1_window(duka, sym, t0):
    d0 = (t0 - timedelta(days=4)).date()
    if sym.endswith("IDXUSD") and t0.date() < date(2012, 6, 1):
        return None
    return duka.m1_range(sym, d0, t0.date())


def _control_days(xm1: pd.DataFrame, t0, ff_high_days: set) -> dict:
    """La stessa M1 (stessa ora UTC di T0) nei 3 giorni feriali precedenti senza release ad alto impatto."""
    rows = []
    for k in range(1, 6):
        d = (t0 - timedelta(days=k))
        if d.weekday() >= 5 or d.astimezone(NY).date() in ff_high_days:
            continue
        ts = pd.Timestamp(d).floor("1min")
        if ts in xm1.index:
            b = xm1.loc[ts]
            pre = xm1[(xm1.index >= ts - pd.Timedelta(minutes=60)) & (xm1.index < ts)]
            unit = float((pre.h - pre.l).mean()) if len(pre) > 30 else np.nan
            rows.append((float(b.h - b.l), abs(float(b.c - b.o)), unit))
        if len(rows) == 3:
            break
    if not rows:
        return {}
    a = np.array(rows)
    return {"ctrl_n": len(rows), "ctrl_range_usd": float(np.median(a[:, 0])),
            "ctrl_body_usd": float(np.median(a[:, 1])), "ctrl_unit_m1": float(np.nanmedian(a[:, 2]))}


def _one_event(i: int) -> tuple[dict, dict | None, list[dict]]:
    g = _G
    e = g["events"][i]
    duka = g["duka"]
    t0 = e.t0_utc
    ticks = duka.ticks("XAUUSD", t0 - timedelta(minutes=5), t0 + timedelta(minutes=5))
    path = extract_path(ticks, t0)
    m1s = {s: _m1_window(duka, s, t0) for s in M1_SYMBOLS}
    xm1 = m1s["XAUUSD"]
    ev = {"event_id": e.event_id, "family": e.family, "t0_utc": t0, "year": t0.year,
          "reference_period": e.reference_period, "source": e.source}
    if path is not None:
        an = anatomy(path)
        ev.update({f"a_{k}": v for k, v in an.items()})
    else:
        ev["a_ok"] = False
    ev.update({f"ts_{k}": v for k, v in timestamp_check(xm1, t0).items()})
    ev.update(_control_days(xm1, t0, g["ff_high_days"]))
    rows = []
    for cp, secs in CUTOFFS.items():
        t = pd.Timestamp(t0 - timedelta(seconds=secs)).floor("s").as_unit("ns")
        f: dict = {}
        ctx = g["ctx"]
        f.update(xau_features(ctx, xm1, t))
        f.update(dxy_features(ctx, m1s["EURUSD"], t))
        f.update(rates_features(ctx, t))
        prior = [p for p in g["cpi_prior"] if p["t0"] + timedelta(seconds=60) <= t]
        prior = [dict(p, days_before=(t - p["t0"]).total_seconds() / 86400) for p in reversed(prior)]
        mf = macro_features(prior)
        for k in ("prev_reaction", "prev_reactions_mean6", "prev_abs_move_median6_pips", "days_since_prev_release"):
            mf.pop(k, None)
        f.update(mf)
        f.update(F2.pa_features(ctx, xm1, t))
        f.update(F2.cross_features(m1s, t))
        f.update(F2.relationship_features(ctx, g["spx_h1"], t))
        f.update(F2.rates_ext_features(ctx, t))
        f.update(F2.news_index_features(g["epu"], g["gpr"], t))
        f.update(F2.calendar_features(pd.Timestamp(t0), t, g["fomc"], g["ff_high"][e.family], e.family))
        f.update(surprise_features(g["surp"], t))
        f.update(consensus_features(g["surp"], e.family, pd.Timestamp(t0)))
        f.update(reaction_features(g["react"], g["surp"], e.family, t))
        f.update(nfp_level_features(g["nfp_rel"], t0.astimezone(NY).date() if secs < 86400 else (t.tz_convert(NY).date())))
        if e.family == "CPI":
            f.update(expectation_features(e, t, g["ff_cpi"], g["nowcast"], prior[0]["values"] if prior else {}))
        row = {"event_id": e.event_id, "family": e.family, "cutoff": cp, "t0_utc": t0, "snapshot_utc": t}
        row.update({(k if k.startswith(("meta_", "unit_")) else f"f_{k}"): v for k, v in f.items()})
        rows.append(row)
    pth = None
    if path is not None:
        pth = {"event_id": e.event_id, "t": path["t"].tolist(), "bid": path["bid"].tolist(), "ask": path["ask"].tolist()}
    return ev, pth, rows


def _reaction_table(events, duka) -> pd.DataFrame:
    """Reazioni passate (mid) per la memoria: mossa, range, unità ATR M1 pre-news."""
    rows = []
    for e in events:
        ticks = duka.ticks("XAUUSD", e.t0_utc - timedelta(minutes=5), e.t0_utc + timedelta(minutes=5))
        p = extract_path(ticks, e.t0_utc)
        if p is None:
            continue
        an = anatomy(p)
        if not an.get("ok"):
            continue
        xm1 = duka.m1_range("XAUUSD", (e.t0_utc - timedelta(days=1)).date(), e.t0_utc.date())
        pre = xm1[(xm1.index >= pd.Timestamp(e.t0_utc) - pd.Timedelta(minutes=61)) &
                  (xm1.index < pd.Timestamp(e.t0_utc) - pd.Timedelta(minutes=1))]
        unit = float((pre.h - pre.l).mean()) if len(pre) > 30 else np.nan
        rows.append({"event_id": e.event_id, "family": e.family, "t0_utc": pd.Timestamp(e.t0_utc),
                     "move": an["move"], "range": an["range"], "unit": unit})
    return pd.DataFrame(rows)


def build(workers: int = 4) -> dict:
    duka = DukascopyProvider()
    events = sorted(family_events("CPI") + family_events("NFP"), key=lambda e: e.t0_utc)
    last = max(e.t0_utc for e in events).date()
    ctx = load_market(duka, date(2002, 1, 1), last)
    spx_h1 = duka.h1_range("USA500IDXUSD", date(2012, 6, 1), last)
    epu, gpr = NewsIndexProvider().daily(date(2006, 1, 1), last)
    surp = load_surprise_table()
    ffh = ForexFactoryHistory().load()
    hi = ffh[(ffh.currency == "USD") & (ffh.impact == "High")].copy()
    hi["d"] = pd.to_datetime(hi["date"], format="%a %b %d %Y").dt.date

    def rel_utc(r):
        tm = str(r["time"])
        if ":" not in tm:
            return pd.NaT
        hh, mm = (int(x) for x in tm.split(":"))
        return pd.Timestamp(f"{r['d']} {hh:02d}:{mm:02d}", tz="UTC")

    hi["release_utc"] = hi.apply(rel_utc, axis=1)
    ff_high = {fam: hi[~hi.event.isin(titles)] for fam, titles in FAMILY_TITLES.items()}
    ff_high_days = set(hi[hi["time"].astype(str).isin(["13:30", "12:30"])]["d"])
    fomc = sorted(set(pd.to_datetime(ffh[(ffh.currency == "USD") & (ffh.event.isin(["FOMC Statement", "Federal Funds Rate"]))]["date"],
                                     format="%a %b %d %Y").dt.date))
    # CPI precedenti con i valori della Tabella A (fase 1)
    from ..db import session

    with session() as con:
        rv = pd.read_sql("SELECT event_id, series, value FROM release_values WHERE kind='as_published'", con)
    vals = {k: dict(zip(g.series, g.value)) for k, g in rv.groupby("event_id")}
    cpi_prior = [{"event_id": e.event_id, "t0": e.t0_utc, "values": vals.get(e.event_id, {}), "direction": None,
                  "move_pips": None} for e in events if e.family == "CPI"]
    log.info("memoria delle reazioni...")
    react = _reaction_table(events, duka)
    _G.update(events=events, duka=duka, ctx=ctx, spx_h1=spx_h1, epu=epu, gpr=gpr, surp=surp, ff_high=ff_high,
              ff_high_days=ff_high_days, fomc=fomc, cpi_prior=cpi_prior, react=react,
              nfp_rel=load_nfp_releases(), ff_cpi=ForexFactoryHistory().cpi_table(),
              nowcast=ClevelandFedNowcast().load())
    log.info("fotografie: %d eventi x %d cutoff con %d processi", len(events), len(CUTOFFS), workers)
    import multiprocessing as mp

    evs, paths, rows = [], [], []
    with ProcessPoolExecutor(max_workers=workers, mp_context=mp.get_context("fork")) as ex:
        for k, (ev, pth, rr) in enumerate(ex.map(_one_event, range(len(events)), chunksize=4), 1):
            evs.append(ev)
            if pth:
                paths.append(pth)
            rows.extend(rr)
            if k % 50 == 0:
                log.info("  %d/%d eventi", k, len(events))
    out = _out_dir()
    files = {}
    for name, df in (("p2_events", pd.DataFrame(evs)), ("p2_paths", pd.DataFrame(paths)), ("p2_features", pd.DataFrame(rows))):
        p = out / f"{name}.parquet"
        df.to_parquet(p, index=False)
        files[name] = {"file": p.name, "sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "rows": len(df)}
    man = {"created_utc": iso(utc_now()), "files": files, "cutoffs": list(CUTOFFS),
           "n_features": int(sum(1 for c in rows[0] if c.startswith("f_"))) if rows else 0}
    (out / "p2_manifest.json").write_text(json.dumps(man, indent=1), encoding="utf-8")
    log.info("dataset fase 2 congelato: %s", {k: v["sha256"][:12] for k, v in files.items()})
    return man
