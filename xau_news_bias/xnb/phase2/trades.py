"""Tabella dei trade della fase 2 (definizione fissata nel protocollo §4).

Per ogni evento: R_LONG e R_SHORT con ingresso T−10 s, stop 0,60 × U_news,
uscita alla chiusura della prima M1, costi dello scenario scelto.

Protezione del test finale: gli esiti NFP dal 2020 in poi escono da questo
modulo SOLO tramite ``final_nfp_outcomes`` con la chiave esplicita.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .anatomy_study import load
from .ticktrade import SCENARIOS, simulate

K_STOP = 0.60
ENTRY = "m10"
REGIME_START = pd.Timestamp("2013-07-01", tz="UTC")
SPLIT = pd.Timestamp("2020-01-01", tz="UTC")
FINAL_KEY = "NFP-2020-2026-UNA-VOLTA"


def u_news(ft: pd.DataFrame) -> pd.Series:
    x = ft[ft.cutoff == "T-1M"].set_index("event_id")
    return (x["f_react_same_range_med6"] * x["unit_atr_m1_60"]).rename("U_news")


def build_trades(scenario: str = "base", k: float = K_STOP, entry: str = ENTRY, ev=None, ft=None,
                 paths=None) -> pd.DataFrame:
    if ev is None:
        ev, ft, paths = load()
    u = u_news(ft)
    rows = []
    cost = SCENARIOS[scenario]
    for r in ev.itertuples():
        p = paths.get(r.event_id)
        U = u.get(r.event_id, np.nan)
        row = {"event_id": r.event_id, "family": r.family, "t0_utc": r.t0_utc, "year": r.year, "U": U}
        if p is None or not (U == U and U > 0):
            row["ok"] = False
            rows.append(row)
            continue
        sl = k * U
        lo = simulate(p, +1, sl, entry, cost)
        sh = simulate(p, -1, sl, entry, cost)
        row.update(ok=bool(lo.get("ok") and sh.get("ok")), sl_usd=sl,
                   R_long=lo.get("r", np.nan), R_short=sh.get("r", np.nan),
                   pnl_long=lo.get("pnl_usd", np.nan), pnl_short=sh.get("pnl_usd", np.nan),
                   stop_long=lo.get("stopped"), stop_short=sh.get("stopped"),
                   mfe_long=lo.get("mfe_usd"), mae_long=lo.get("mae_usd"),
                   mfe_short=sh.get("mfe_usd"), mae_short=sh.get("mae_usd"))
        rows.append(row)
    return pd.DataFrame(rows)


def period(df: pd.DataFrame, which: str) -> pd.DataFrame:
    """Sottoinsiemi del protocollo. 'final_nfp' non è accessibile qui."""
    t = df["t0_utc"]
    if which == "discovery":
        return df[(t >= REGIME_START) & (t < SPLIT)]
    if which == "discovery_wide":
        return df[t < SPLIT]
    if which == "train_pool":  # addestramento dei modelli: tutto prima del 2020 (anche 2008-2013)
        return df[t < SPLIT]
    if which == "cpi_validation":
        return df[(t >= SPLIT) & (df["family"] == "CPI")]
    raise ValueError(f"periodo {which!r} non accessibile da qui")


def final_nfp_outcomes(df: pd.DataFrame, key: str) -> pd.DataFrame:
    if key != FINAL_KEY:
        raise PermissionError("il test finale NFP 2020-2026 si apre solo con la chiave del protocollo")
    return df[(df["t0_utc"] >= SPLIT) & (df["family"] == "NFP")]
