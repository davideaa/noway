"""Ricostruzione tick-by-tick del trade sulla prima M1 dopo la release.

Per ogni evento si conserva il percorso bid/ask da T0−65 s a T0+65 s
(``paths``), da cui ``simulate`` calcola il risultato di qualunque trade:

    ingresso   LONG all'ask / SHORT al bid dell'ultimo tick ≤ T0 − e secondi
    stop       LONG: primo tick con bid ≤ ingresso − S, eseguito a quel bid
               (se il prezzo salta lo stop, il salto è incluso) meno lo
               slittamento dello scenario; SHORT simmetrico sull'ask
    uscita     chiusura della prima M1: ultimo tick < T0 + 60 s, al bid (LONG)
               o all'ask (SHORT), meno lo slittamento dello scenario

Scenari di costo (dichiarati nel protocollo, in multipli dello spread del
momento più una quota proporzionale al prezzo, perché lo spread del broker
reale non è noto):

    optimistic    nessun costo oltre bid/ask Dukascopy
    base          ingresso +0,5 spread, stop +1 spread, uscita +0,5 spread, +0,5 bp
    conservative  +1 / +2 / +1 spread, +1,5 bp
    stress        +2 / +4 / +2 spread, +3 bp
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from ..timeutil import to_ms

WINDOW_BEFORE_MS = 65_000
WINDOW_AFTER_MS = 65_000
M1_MS = 60_000
ENTRIES = {"m60": 60_000, "m30": 30_000, "m10": 10_000, "m5": 5_000, "last": 0}


@dataclass(frozen=True)
class CostScenario:
    name: str
    entry_spreads: float
    stop_spreads: float
    exit_spreads: float
    bp: float  # frazione del prezzo, per ogni lato


SCENARIOS = {
    "optimistic": CostScenario("optimistic", 0.0, 0.0, 0.0, 0.0),
    "base": CostScenario("base", 0.5, 1.0, 0.5, 0.5e-4),
    "conservative": CostScenario("conservative", 1.0, 2.0, 1.0, 1.5e-4),
    "stress": CostScenario("stress", 2.0, 4.0, 2.0, 3.0e-4),
}


def extract_path(ticks: pd.DataFrame, t0) -> dict | None:
    """Percorso bid/ask in [T0−65 s, T0+65 s], tempi in ms relativi a T0."""
    if ticks is None or ticks.empty:
        return None
    t0ms = to_ms(t0)
    rel = ticks["ts_ms"].to_numpy() - t0ms
    m = (rel >= -WINDOW_BEFORE_MS) & (rel < WINDOW_AFTER_MS)
    if m.sum() < 5:
        return None
    return {"t": rel[m].astype(np.int64), "bid": ticks["bid"].to_numpy()[m].astype(float),
            "ask": ticks["ask"].to_numpy()[m].astype(float)}


def _last_idx_before(t: np.ndarray, cutoff_ms: int) -> int:
    """Indice dell'ultimo tick con t ≤ cutoff (per l'ingresso) — -1 se nessuno."""
    return int(np.searchsorted(t, cutoff_ms, side="right") - 1)


def anatomy(path: dict) -> dict:
    """Descrizione della prima M1 indipendente dalla direzione del trade."""
    t, bid, ask = path["t"], path["bid"], path["ask"]
    mid = (bid + ask) / 2
    i0 = int(np.searchsorted(t, 0, side="left") - 1)  # ultimo tick < T0
    win = np.nonzero((t >= 0) & (t < M1_MS))[0]
    out: dict = {"n_ticks_m1": int(len(win))}
    if i0 < 0 or len(win) < 3:
        out["ok"] = False
        return out
    p0 = mid[i0]
    seg = mid[win]
    hi_i, lo_i = int(np.argmax(seg)), int(np.argmin(seg))
    hi, lo = max(p0, seg[hi_i]), min(p0, seg[lo_i])
    close = seg[-1]
    out.update(ok=True, p0=p0, close=close, high=hi, low=lo, move=close - p0, range=hi - lo,
               up_exc=hi - p0, down_exc=p0 - lo,
               t_high_ms=int(t[win[hi_i]]), t_low_ms=int(t[win[lo_i]]),
               spread_p0=ask[i0] - bid[i0],
               spread_max_m1=float(np.max(ask[win] - bid[win])),
               spread_med_m1=float(np.median(ask[win] - bid[win])))
    for s in (5, 10, 15, 30, 45):
        k = np.nonzero((t >= 0) & (t < s * 1000))[0]
        seg_s = mid[k] if len(k) else np.array([p0])
        out[f"up_exc_{s}s"] = float(max(0.0, seg_s.max() - p0))
        out[f"down_exc_{s}s"] = float(max(0.0, p0 - seg_s.min()))
        out[f"move_{s}s"] = float(seg_s[-1] - p0)
    for e, ms in ENTRIES.items():
        j = _last_idx_before(t, -ms - (1 if ms == 0 else 0))
        out[f"entry_ok_{e}"] = bool(j >= 0 and (-ms - t[j]) <= 60_000)
        out[f"spread_{e}"] = float(ask[j] - bid[j]) if j >= 0 else np.nan
    return out


def simulate(path: dict, direction: int, stop_usd: float | None, entry: str = "m10",
             cost: CostScenario = SCENARIOS["base"]) -> dict:
    """Risultato di un trade LONG (+1) o SHORT (−1) sulla prima M1.

    ``stop_usd`` None = nessuno stop (uscita solo alla chiusura della M1)."""
    t, bid, ask = path["t"], path["bid"], path["ask"]
    ms = ENTRIES[entry]
    j = _last_idx_before(t, -ms - (1 if ms == 0 else 0))
    if j < 0:
        return {"ok": False}
    px_ref = (bid[j] + ask[j]) / 2
    sp_e = ask[j] - bid[j]
    fixed = cost.bp * px_ref
    if direction > 0:
        entry_px = ask[j] + cost.entry_spreads * sp_e + fixed
    else:
        entry_px = bid[j] - cost.entry_spreads * sp_e - fixed
    k = np.nonzero((t > t[j]) & (t < M1_MS))[0]
    if len(k) == 0 or not np.any(t[k] >= 0):
        return {"ok": False}
    exit_side = bid[k] if direction > 0 else ask[k]
    fav = direction * (exit_side - entry_px)
    out = {"ok": True, "entry_px": entry_px, "mfe_usd": float(max(0.0, fav.max())),
           "mae_usd": float(max(0.0, -fav.min()))}
    stopped = False
    if stop_usd is not None and stop_usd > 0:
        hit = np.nonzero(fav <= -stop_usd)[0]
        if len(hit):
            h = hit[0]
            sp = ask[k][h] - bid[k][h]
            fill = exit_side[h] - direction * (cost.stop_spreads * sp + fixed)
            pnl = direction * (fill - entry_px)
            stopped = True
            out.update(stop_ms=int(t[k][h]), gap_usd=float(-fav[h] - stop_usd))
    if not stopped:
        last = k[-1]
        sp = ask[last] - bid[last]
        exit_px = (bid[last] if direction > 0 else ask[last]) - direction * (cost.exit_spreads * sp + fixed)
        pnl = direction * (exit_px - entry_px)
    out.update(pnl_usd=float(pnl), stopped=stopped,
               r=float(pnl / stop_usd) if stop_usd else np.nan)
    return out


def path_class(an: dict, unit: float) -> str:
    """Classe del percorso della M1 (indipendente dal trade):
    E quasi nessuna reazione · D whipsaw · B spike contrario poi movimento · A movimento pulito."""
    if not an.get("ok"):
        return "NA"
    rng, mv = an["range"], an["move"]
    if rng < unit:
        return "E"
    adverse = an["down_exc"] if mv > 0 else an["up_exc"]
    favorable = an["up_exc"] if mv > 0 else an["down_exc"]
    if adverse >= 0.5 * rng and favorable >= 0.5 * rng and abs(mv) < 0.25 * rng:
        return "D"
    t_adv = an["t_low_ms"] if mv > 0 else an["t_high_ms"]
    t_fav = an["t_high_ms"] if mv > 0 else an["t_low_ms"]
    if adverse >= 0.25 * rng and t_adv < t_fav:
        return "B"
    return "A"
