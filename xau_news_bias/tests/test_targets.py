from datetime import datetime, timezone

import numpy as np
import pandas as pd

from xnb.research.targets import compute_outcome

T0 = datetime(2024, 1, 11, 13, 30, tzinfo=timezone.utc)
T0MS = int(T0.timestamp() * 1000)


def ticks(points, spread=0.4):
    """points: lista di (ms rispetto a T0, mid)."""
    ts = np.array([T0MS + p[0] for p in points], dtype=np.int64)
    mid = np.array([p[1] for p in points], dtype=float)
    return pd.DataFrame({"ts_ms": ts, "bid": mid - spread / 2, "ask": mid + spread / 2})


def test_wick_up_close_down_is_bearish():
    # l'esempio del requisito: parte da 4000, sale a 4005, chiude a 3997
    t = ticks([(-5000, 3999.9), (-100, 4000.0), (200, 4002.0), (900, 4005.0), (5000, 4001.0),
               (30000, 3998.0), (59000, 3997.0), (61000, 3990.0)])
    o = compute_outcome("X", T0, t)
    assert o.direction == "BEARISH"
    assert o.p0 == 4000.0 and o.close == 3997.0
    assert round(o.move_pips) == -30  # $3 = 30 pips
    assert round(o.upper_wick_pips) == 50  # da 4000 a 4005
    assert round(o.range_pips) == 80  # 4005 - 3997
    assert round(o.mfe_pips) == 30 and round(o.mae_pips) == 50


def test_tick_after_window_is_ignored():
    t = ticks([(-100, 2000.0), (1000, 2001.0), (2000, 2001.5), (59999, 2001.2), (60000, 1990.0)])
    o = compute_outcome("X", T0, t)
    assert o.direction == "BULLISH"
    assert o.close == 2001.2


def test_first_tick_after_t0_is_not_p0():
    # P0 è l'ultimo tick PRIMA di T0, non il primo dopo (che può già contenere la notizia)
    t = ticks([(-50, 2000.0), (0, 2010.0), (500, 2009.0), (59000, 2005.0)])
    o = compute_outcome("X", T0, t)
    assert o.p0 == 2000.0
    assert o.direction == "BULLISH"
    assert o.dir_m1_bid == "BEARISH"  # la variante "candela M1" sbaglierebbe questo caso


def test_flat_and_quality_flags():
    t = ticks([(-100, 2000.0), (1000, 2000.5), (2000, 1999.5), (50000, 2000.0)])
    assert compute_outcome("X", T0, t).direction == "FLAT"
    stale = ticks([(-120000, 2000.0), (1000, 2001.0), (2000, 2002.0), (3000, 2003.0)])
    assert compute_outcome("X", T0, stale).quality == "STALE_P0"
    empty = ticks([(-100, 2000.0), (1000, 2001.0)])
    assert compute_outcome("X", T0, empty).quality == "NO_TICKS_IN_WINDOW"


def test_reaction_timing_ignores_pre_release_drift():
    pts = [(-30000 + i * 500, 2000.0 + i * 0.01) for i in range(59)] + [(250, 2004.0), (900, 2004.5), (40000, 2003.0)]
    o = compute_outcome("X", T0, ticks(pts))
    assert o.first_reaction_ms == 250
