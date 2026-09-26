"""Anti-leakage: la fotografia a t non deve dipendere da NULLA che accada dopo t."""

from datetime import date, datetime, timedelta, timezone

import numpy as np
import pandas as pd
import pytest

from xnb.providers.dukascopy import DXY_WEIGHTS
from xnb.research.features import LeakageError, MarketContext, build_context, snapshot

T = datetime(2024, 3, 12, 11, 30, tzinfo=timezone.utc)  # T-1H di un CPI estivo (12:30 UTC)


def _bars(start, periods, freq, seed, level=2000.0):
    rng = np.random.default_rng(seed)
    idx = pd.date_range(start, periods=periods, freq=freq, tz="UTC")
    c = level * np.exp(np.cumsum(rng.normal(0, 0.001, periods)))
    o = np.r_[c[0], c[:-1]]
    h = np.maximum(o, c) * (1 + rng.uniform(0, 0.0005, periods))
    lo = np.minimum(o, c) * (1 - rng.uniform(0, 0.0005, periods))
    return pd.DataFrame({"o": o, "h": h, "l": lo, "c": c, "v": 1.0}, index=idx)


def _daily(start, n, seed, cols):
    rng = np.random.default_rng(seed)
    idx = [start + timedelta(days=i) for i in range(n)]
    df = pd.DataFrame({c: 2 + np.cumsum(rng.normal(0, 0.02, n)) for c in cols}, index=idx)
    df["available_from_utc"] = [datetime(d.year, d.month, d.day, 22, tzinfo=timezone.utc) for d in idx]
    return df


def _world(seed_future: int):
    """Mercato sintetico identico fino a T, diverso dopo T in base a ``seed_future``."""
    h1 = _bars("2022-01-01", 800 * 24, "1h", 1)
    fx = {s: _bars("2022-01-01", 800 * 24, "1h", 10 + i, level=1.0 + i) for i, s in enumerate(DXY_WEIGHTS)}
    m1 = _bars("2024-03-08", 7 * 1440, "1min", 2)
    em1 = _bars("2024-03-08", 7 * 1440, "1min", 3, level=1.08)
    rates = _daily(date(2022, 1, 1), 800, 4, ["y1m", "y3m", "y6m", "y1y", "y2y", "y5y", "y10y", "y30y", "r5y", "r10y"])
    vix = _daily(date(2022, 1, 1), 800, 5, ["vix"])
    cot = _daily(date(2022, 1, 1), 800, 6, ["cot_mm_net_pct_oi", "cot_oi"])
    rng = np.random.default_rng(seed_future)
    ts = pd.Timestamp(T)
    for df in [h1, m1, em1] + list(fx.values()):
        fut = df.index >= ts  # candele aperte da T in poi (quella 11:29-11:30 chiude a T ed è nota)
        df.loc[fut, ["o", "h", "l", "c"]] *= rng.uniform(0.5, 1.5)
    for df in (rates, vix, cot):
        fut = df["available_from_utc"] > T
        num = [c for c in df.columns if c != "available_from_utc"]
        df.loc[fut, num] = rng.normal(50, 10, (fut.sum(), len(num)))
    return build_context(h1, fx, rates, vix, cot), m1, em1


def test_snapshot_invariant_to_future_data():
    prior = [{"event_id": "CPI_2024-02-13", "values": {"cpi_mom_0": 0.3, "core_mom_0": 0.4, "core_yoy": 3.9},
              "direction": "BEARISH", "move_pips": -120.0, "days_before": 28}]
    ctx_a, m1_a, e_a = _world(100)
    ctx_b, m1_b, e_b = _world(200)
    fa = snapshot(ctx_a, T, m1_a, e_a, prior)
    fb = snapshot(ctx_b, T, m1_b, e_b, prior)
    assert len(fa) > 40
    for k in fa:
        a, b = fa[k], fb[k]
        assert (np.isnan(a) and np.isnan(b)) or a == pytest.approx(b), f"{k} dipende dal futuro: {a} vs {b}"


def test_snapshot_changes_if_past_changes():
    """Controprova: il test sopra non passa per caso — cambiare il passato cambia le feature."""
    ctx, m1, em1 = _world(100)
    f1 = snapshot(ctx, T, m1, em1, [])
    m1b = m1.copy()
    m1b.loc[m1b.index < pd.Timestamp(T), ["o", "h", "l", "c"]] *= 1.01
    f2 = snapshot(ctx, T, m1b, em1, [])
    assert f1["meta_px"] != f2["meta_px"]


def test_guard_rejects_unclosed_bar():
    df = _bars("2024-03-12", 200, "1min", 9)
    t = pd.Timestamp("2024-03-12 01:00", tz="UTC")
    ok = MarketContext.m1_until(df, t)
    MarketContext.assert_no_future({"m1": (ok, pd.Timedelta(minutes=1))}, t)
    with pytest.raises(LeakageError):
        MarketContext.assert_no_future({"m1": (df, pd.Timedelta(minutes=1))}, t)
