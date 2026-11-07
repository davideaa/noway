"""Target: direzione della prima M1 dopo la release, dai tick.

Definizioni (vedi docs/PROTOCOLLO-CPI.md §3 ed emendamento 2):
    P0 = mid dell'ultimo tick con ts < T0
    C1 = mid dell'ultimo tick con ts < T0 + 60 s
    BULLISH se C1 > P0, BEARISH se C1 < P0, FLAT se uguali.
Le wick non entrano nella direzione. 1 pip = $0,10.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime

import numpy as np
import pandas as pd

from ..timeutil import iso, to_ms

PIP = 0.10
WINDOW_MS = 60_000
MAX_P0_AGE_MS = 60_000
FLAT_EPS = 0.005  # mezzo tick di XAU: sotto questa soglia è FLAT


@dataclass
class Outcome:
    event_id: str
    feed: str
    p0: float | None = None
    p0_tick_utc: str | None = None
    open_m1: float | None = None
    high: float | None = None
    low: float | None = None
    close: float | None = None
    c1_tick_utc: str | None = None
    direction: str | None = None
    move_pips: float | None = None
    body_pips: float | None = None
    upper_wick_pips: float | None = None
    lower_wick_pips: float | None = None
    range_pips: float | None = None
    mfe_pips: float | None = None
    mae_pips: float | None = None
    n_ticks: int = 0
    first_reaction_ms: int | None = None
    spread_p0: float | None = None
    quality: str = "OK"
    # varianti di robustezza (non salvate in event_outcomes, usate nei report)
    dir_bid: str | None = None
    dir_m1_bid: str | None = None

    def db_row(self) -> dict:
        d = asdict(self)
        d.pop("dir_bid")
        d.pop("dir_m1_bid")
        return d


def _dir(a: float, b: float) -> str:
    if b - a > FLAT_EPS:
        return "BULLISH"
    if a - b > FLAT_EPS:
        return "BEARISH"
    return "FLAT"


def compute_outcome(event_id: str, t0: datetime, ticks: pd.DataFrame, feed: str = "dukascopy") -> Outcome:
    """``ticks``: colonne ts_ms, bid, ask; deve coprire almeno [T0-120s, T0+60s)."""
    out = Outcome(event_id=event_id, feed=feed)
    if ticks is None or ticks.empty:
        out.quality = "NO_TICKS"
        return out
    t0ms = to_ms(t0)
    ts = ticks["ts_ms"].to_numpy()
    bid = ticks["bid"].to_numpy()
    ask = ticks["ask"].to_numpy()
    mid = (bid + ask) / 2

    pre = np.nonzero(ts < t0ms)[0]
    if len(pre) == 0:
        out.quality = "NO_PRE_TICK"
        return out
    i0 = pre[-1]
    if t0ms - ts[i0] > MAX_P0_AGE_MS:
        out.quality = "STALE_P0"
    win = np.nonzero((ts >= t0ms) & (ts < t0ms + WINDOW_MS))[0]
    out.n_ticks = int(len(win))
    if len(win) < 3:
        out.quality = "NO_TICKS_IN_WINDOW"
        return out

    p0 = float(mid[i0])
    c1 = float(mid[win[-1]])
    path = np.concatenate([[p0], mid[win]])
    hi, lo = float(path.max()), float(path.min())
    out.p0, out.close = p0, c1
    out.open_m1 = float(mid[win[0]])
    out.high, out.low = hi, lo
    out.p0_tick_utc = iso(pd.Timestamp(int(ts[i0]), unit="ms", tz="UTC").to_pydatetime())
    out.c1_tick_utc = iso(pd.Timestamp(int(ts[win[-1]]), unit="ms", tz="UTC").to_pydatetime())
    out.spread_p0 = float(ask[i0] - bid[i0])
    out.direction = _dir(p0, c1)
    out.move_pips = (c1 - p0) / PIP
    out.body_pips = abs(c1 - p0) / PIP
    out.upper_wick_pips = (hi - max(p0, c1)) / PIP
    out.lower_wick_pips = (min(p0, c1) - lo) / PIP
    out.range_pips = (hi - lo) / PIP
    if out.direction == "BEARISH":
        out.mfe_pips, out.mae_pips = (p0 - lo) / PIP, (hi - p0) / PIP
    else:
        out.mfe_pips, out.mae_pips = (hi - p0) / PIP, (p0 - lo) / PIP

    # Ritardo della prima reazione (diagnostica, non esclusione): primo tick da
    # T0-2s in poi che si stacca da P0 più di max(0,02% del prezzo, 5 volte la
    # variazione tick-to-tick tipica del minuto prima). La deriva normale dei
    # secondi precedenti non basta a superarla.
    before = np.nonzero((ts >= t0ms - 60_000) & (ts < t0ms))[0]
    typical = float(np.median(np.abs(np.diff(mid[before])))) if len(before) > 5 else 0.05
    thr = max(0.0002 * p0, 5 * typical)
    far = np.nonzero((ts >= t0ms - 2_000) & (ts < t0ms + WINDOW_MS) & (np.abs(mid - p0) > thr))[0]
    if len(far):
        out.first_reaction_ms = int(ts[far[0]] - t0ms)

    # varianti di robustezza dell'etichetta
    out.dir_bid = _dir(float(bid[i0]), float(bid[win[-1]]))
    out.dir_m1_bid = _dir(float(bid[win[0]]), float(bid[win[-1]]))
    return out
