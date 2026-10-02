"""Costruzione del dataset congelato: una riga per (evento, checkpoint).

Il file Parquet risultante è immutabile: il suo SHA-256 identifica
l'esperimento. Rigenerarlo con dati diversi produce un hash diverso, e i
risultati vecchi restano legati al loro hash (tabella ``datasets``).
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from ..config import get_settings
from ..db import session
from ..providers.base import EventSpec
from ..providers.dukascopy import DXY_WEIGHTS, DukascopyProvider
from ..providers.consensus import ClevelandFedNowcast
from ..providers.official import CboeProvider, CFTCProvider, TreasuryProvider
from ..timeutil import CHECKPOINTS, NY, iso, utc_now
from .features import build_context, snapshot

log = logging.getLogger("xnb.dataset")


def load_market(duka: DukascopyProvider, start: date, end: date):
    xau = duka.h1_range("XAUUSD", start, end)
    fx = {s: duka.h1_range(s, start, end) for s in DXY_WEIGHTS}
    rates = TreasuryProvider().daily(start, end)
    vix = CboeProvider().daily(start, end)
    cot = CFTCProvider().gold_cot(start, end)
    return build_context(xau, fx, rates, vix, cot)


def m1_window(duka: DukascopyProvider, symbol: str, t0, lookback_s: int) -> pd.DataFrame:
    d0 = (t0 - timedelta(seconds=lookback_s)).date()
    return duka.m1_range(symbol, d0, t0.date())


def expectation_features(e: EventSpec, t, ff: pd.DataFrame | None, nowcast: pd.DataFrame | None,
                         prev_vals: dict) -> dict:
    """Consensus FF e nowcast Cleveland Fed noti a ``t``. Mai l'actual."""
    f: dict[str, float] = {}
    fc = None
    if ff is not None and len(ff):
        m = ff[ff.release_date == e.t0_utc.astimezone(NY).date()]
        if len(m):
            fc = m.iloc[0]
            f["cons_cpi_mom"] = fc.get("ff_fc_cpi_mom", np.nan)
            f["cons_core_mom"] = fc.get("ff_fc_core_mom", np.nan)
            f["cons_cpi_yoy"] = fc.get("ff_fc_cpi_yoy", np.nan)
            # "previous" dal comunicato BLS precedente, così com'era: FF lo
            # sovrascrive con il valore rivisto dopo la release.
            f["cons_core_minus_prev"] = f["cons_core_mom"] - prev_vals.get("core_mom_0", np.nan)
            f["cons_cpi_minus_prev"] = f["cons_cpi_mom"] - prev_vals.get("cpi_mom_0", np.nan)
            f["cons_yoy_minus_prev"] = f["cons_cpi_yoy"] - prev_vals.get("cpi_yoy", np.nan)
    if nowcast is not None and len(nowcast) and e.reference_period:
        nc_core = ClevelandFedNowcast.asof(nowcast, e.reference_period, "nc_core", t)
        nc_cpi = ClevelandFedNowcast.asof(nowcast, e.reference_period, "nc_cpi", t)
        f["nowcast_core_mom"] = nc_core
        f["nowcast_cpi_mom"] = nc_cpi
        if fc is not None:
            f["gap_core"] = nc_core - f.get("cons_core_mom", np.nan)
            f["gap_headline"] = nc_cpi - f.get("cons_cpi_mom", np.nan)
    return f


def timestamp_check(m1: pd.DataFrame, t0) -> dict:
    """Controllo dell'orario: la candela M1 di T0 deve essere anomala rispetto al contesto,
    più di quelle a T0-60 e T0+60 minuti (un errore di ora legale sposterebbe il picco)."""
    if m1 is None or m1.empty:
        return {}
    t0m = pd.Timestamp(t0).floor("1min")
    rng = (m1.h - m1.l)
    base = rng[(rng.index >= t0m - pd.Timedelta(minutes=125)) & (rng.index < t0m - pd.Timedelta(minutes=5))]
    med = float(base.median()) if len(base) >= 30 else np.nan

    def ratio(ts):
        return float(rng.loc[ts] / med) if ts in rng.index and med and med == med and med > 0 else np.nan

    return {"ts_ratio_t0": ratio(t0m), "ts_ratio_m60": ratio(t0m - pd.Timedelta(minutes=60)),
            "ts_ratio_p60": ratio(t0m + pd.Timedelta(minutes=60))}


def build_dataset(events: list[EventSpec], outcomes: pd.DataFrame, release_vals: dict[str, dict],
                  family: str, ff: pd.DataFrame | None = None,
                  nowcast: pd.DataFrame | None = None) -> tuple[pd.DataFrame, str, Path]:
    duka = DukascopyProvider()
    start = date(2002, 1, 1)
    end = max(e.t0_utc for e in events).date()
    ctx = load_market(duka, start, end)
    outc = outcomes.set_index("event_id")
    lookback = max(CHECKPOINTS.values()) + 86400 + 3600

    ev_sorted = sorted(events, key=lambda e: e.t0_utc)
    rows = []
    for i, e in enumerate(ev_sorted):
        xm1 = m1_window(duka, "XAUUSD", e.t0_utc, lookback)
        em1 = m1_window(duka, "EURUSD", e.t0_utc, lookback)
        tsq = timestamp_check(xm1, e.t0_utc)
        suspect = (tsq.get("ts_ratio_t0", np.nan) < 1.5
                   and max(tsq.get("ts_ratio_m60", 0) or 0, tsq.get("ts_ratio_p60", 0) or 0) > 4)
        for cp, secs in CHECKPOINTS.items():
            t = e.t0_utc - timedelta(seconds=secs)
            prior = []
            for p in reversed(ev_sorted[:i]):
                if p.t0_utc + timedelta(seconds=60) > t:
                    continue  # il suo esito non era ancora noto
                o = outc.loc[p.event_id] if p.event_id in outc.index else None
                prior.append({
                    "event_id": p.event_id,
                    "values": release_vals.get(p.event_id, {}),
                    "direction": None if o is None else o["direction"],
                    "move_pips": None if o is None else o["move_pips"],
                    "days_before": (t - p.t0_utc).total_seconds() / 86400,
                })
            f = snapshot(ctx, t, xm1, em1, prior)
            f.update(expectation_features(e, t, ff, nowcast, prior[0]["values"] if prior else {}))
            row = {"event_id": e.event_id, "family": family, "checkpoint": cp, "t0_utc": e.t0_utc,
                   "snapshot_utc": t, "year": e.t0_utc.year}
            if e.event_id in outc.index:
                o = outc.loc[e.event_id]
                for c in ("direction", "move_pips", "range_pips", "body_pips", "mfe_pips", "mae_pips",
                          "upper_wick_pips", "lower_wick_pips", "quality", "first_reaction_ms",
                          "dir_bid", "dir_m1_bid", "n_ticks", "spread_p0"):
                    row["y_" + c] = o.get(c)
                row.update({"y_" + k: v for k, v in tsq.items()})
                if suspect and row["y_quality"] == "OK":
                    row["y_quality"] = "TIMESTAMP_SUSPECT"
            # diagnostica post-release (MAI feature): sorpresa realizzata secondo FF
            if ff is not None and len(ff):
                m = ff[ff.release_date == e.t0_utc.astimezone(NY).date()]
                if len(m):
                    row["diag_surprise_core"] = m.iloc[0].get("ff_act_core_mom", np.nan) - m.iloc[0].get("ff_fc_core_mom", np.nan)
                    row["diag_surprise_cpi"] = m.iloc[0].get("ff_act_cpi_mom", np.nan) - m.iloc[0].get("ff_fc_cpi_mom", np.nan)
            row.update({(k if k.startswith("meta_") else f"f_{k}"): v for k, v in f.items()})
            rows.append(row)
        if (i + 1) % 25 == 0:
            log.info("fotografie: %d/%d eventi", i + 1, len(ev_sorted))
    df = pd.DataFrame(rows)
    return freeze(df, family)


def dataset_path(filename: str) -> Path:
    s = get_settings()
    for d in (s.research_dir / "datasets", s.data_dir / "datasets"):
        if (d / filename).exists():
            return d / filename
    raise FileNotFoundError(filename)


def freeze(df: pd.DataFrame, family: str) -> tuple[pd.DataFrame, str, Path]:
    s = get_settings()
    out_dir = s.research_dir / "datasets"  # committato: ogni risultato resta riproducibile
    out_dir.mkdir(parents=True, exist_ok=True)
    tmp = out_dir / f"{family}_tmp.parquet"
    df.to_parquet(tmp, index=False)
    h = hashlib.sha256(tmp.read_bytes()).hexdigest()
    path = out_dir / f"{family}_{h[:12]}.parquet"
    tmp.replace(path)
    with session() as con:
        con.execute(
            "INSERT OR IGNORE INTO datasets(dataset_hash,family,created_utc,path,n_rows,description) VALUES(?,?,?,?,?,?)",
            (h, family, iso(utc_now()), str(path), len(df), f"{family}: eventi x checkpoint, feature pre-news"),
        )
    manifest = s.research_dir / f"{family.lower()}_dataset_manifest.json"
    feats = sorted(c for c in df.columns if c.startswith("f_"))
    manifest.write_text(json.dumps({
        "family": family, "sha256": h, "file": path.name, "rows": len(df),
        "events": int(df.event_id.nunique()), "features": feats,
        "created_utc": iso(utc_now()),
    }, indent=2), encoding="utf-8")
    log.info("dataset congelato %s (%d righe, sha256 %s)", path.name, len(df), h[:12])
    return df, h, path
