"""H-X5 (docs/IPOTESI-HX5-ULTIMI5ANNI.md): ultimi 5 anni, studio 2021-10 → 2024-09, test 2024-10 → 2026-09.

Trade di Davide (T−60 s, stop 60/100 pips, perdita tagliata a −1R) con 5 uscite, fino a 15 minuti
dopo la news, da tick Dukascopy dell'ora della release (in cache).
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats as sps

from ..providers.dukascopy import DukascopyProvider
from . import registry as REG
from .discovery import build_space, search
from .run_rules import _stats, select_candidates
from .ticktrade import SCENARIOS
from .validate import holm

STUDY = (pd.Timestamp("2021-10-01", tz="UTC"), pd.Timestamp("2024-10-01", tz="UTC"))
TEST = (pd.Timestamp("2024-10-01", tz="UTC"), pd.Timestamp("2026-10-01", tz="UTC"))
EXITS = {"E1_M1": ("time", 60_000, None), "E2_5min": ("time", 300_000, None), "E3_15min": ("time", 900_000, None),
         "E4_TP2R": ("tp", 900_000, 2.0), "E5_TP3R": ("tp", 900_000, 3.0)}
CUTS = ["T-1H", "T-1M"]
MIN_SUPPORT = 12
SEED = 20260928


def stop_usd(t0) -> float:
    return 6.0 if t0 < pd.Timestamp("2024-01-01", tz="UTC") else 10.0


def paths(ev: pd.DataFrame) -> dict:
    duka = DukascopyProvider()
    out = {}
    for r in ev.itertuples():
        t0 = r.t0_utc.to_pydatetime()
        tk = duka.ticks("XAUUSD", t0 - pd.Timedelta(minutes=2), t0 + pd.Timedelta(minutes=16))
        if len(tk) < 20:
            continue
        t0ms = int(r.t0_utc.value // 1_000_000)
        out[r.event_id] = {"t": tk.ts_ms.to_numpy(np.int64) - t0ms, "bid": tk.bid.to_numpy(float), "ask": tk.ask.to_numpy(float)}
    return out


def simulate_exit(p: dict, d: int, stop: float, exit_code: str, cost) -> float | None:
    kind, t_end, tp = EXITS[exit_code]
    t, bid, ask = p["t"], p["bid"], p["ask"]
    j = int(np.searchsorted(t, -60_000, side="right") - 1)
    if j < 0 or -60_000 - t[j] > 60_000:
        return None
    sp0 = ask[j] - bid[j]
    fixed = cost.bp * (bid[j] + ask[j]) / 2
    entry = ask[j] + cost.entry_spreads * sp0 + fixed if d > 0 else bid[j] - cost.entry_spreads * sp0 - fixed
    k = np.nonzero((t > t[j]) & (t < t_end))[0]
    if len(k) == 0 or t[k[-1]] < 0:
        return None
    side = bid[k] if d > 0 else ask[k]
    fav = d * (side - entry)
    hit = np.nonzero(fav <= -stop)[0]
    first_stop = hit[0] if len(hit) else None
    first_tp = None
    if tp is not None:
        th = np.nonzero(fav >= tp * stop)[0]
        first_tp = th[0] if len(th) else None
    if first_stop is not None and (first_tp is None or first_stop <= first_tp):
        h = first_stop
        sp = ask[k][h] - bid[k][h]
        pnl = d * (side[h] - d * (cost.stop_spreads * sp + fixed) - entry)
        return max(pnl / stop, -1.0)
    if first_tp is not None:
        h = first_tp
        sp = ask[k][h] - bid[k][h]
        return (tp * stop - (cost.exit_spreads * sp + fixed)) / stop  # limite al prezzo obiettivo, meno slittamento
    last = k[-1]
    sp = ask[last] - bid[last]
    pnl = d * (side[-1] - d * (cost.exit_spreads * sp + fixed) - entry)
    return max(pnl / stop, -1.0)


def trades(ev: pd.DataFrame, P: dict, exit_code: str, scenario: str = "base") -> pd.DataFrame:
    rows = []
    for r in ev.itertuples():
        p = P.get(r.event_id)
        s = stop_usd(r.t0_utc)
        lo = simulate_exit(p, +1, s, exit_code, SCENARIOS[scenario]) if p else None
        sh = simulate_exit(p, -1, s, exit_code, SCENARIOS[scenario]) if p else None
        rows.append({"event_id": r.event_id, "family": r.family, "t0_utc": r.t0_utc, "year": r.year,
                     "ok": lo is not None and sh is not None, "R_long": lo, "R_short": sh, "stop_usd": s})
    return pd.DataFrame(rows)


def describe(t: pd.DataFrame) -> dict:
    t = t[t.ok == True]  # noqa: E712
    r, w = np.maximum(t.R_long, t.R_short), np.minimum(t.R_long, t.R_short)
    mr, mw = r.mean(), w.mean()
    return {"n": int(len(t)), "serve_indovinare": float(-mw / (mr - mw)) if mr > mw else None,
            "a_caso": float((mr + mw) / 2), "giusto_medio": float(mr), "sbagliato_medio": float(mw),
            "giusto_ge1R": float((r >= 1).mean()), "giusto_ge2R": float((r >= 2).mean()), "giusto_ge3R": float((r >= 3).mean()),
            "sempre_long": float(t.R_long.mean()), "sempre_short": float(t.R_short.mean())}


def prepare(tb: pd.DataFrame, ft: pd.DataFrame) -> dict:
    e = tb[(tb.ok == True) & (tb.t0_utc >= STUDY[0]) & (tb.t0_utc < STUDY[1])].sort_values("t0_utc").reset_index(drop=True)  # noqa: E712
    strata = (e.family + "_" + e.year.astype(str)).to_numpy()
    per_cut = {}
    for cut in CUTS:
        X = ft[ft.cutoff == cut].set_index("event_id").loc[e.event_id].reset_index()
        sp = build_space(X, MIN_SUPPORT)
        per_cut[cut] = (sp, e.R_long.to_numpy(float), e.R_short.to_numpy(float), strata, MIN_SUPPORT,
                        np.nonzero(sp.is_pa)[0])
    return {"events": e, "per_cut": per_cut}


def observed(prep: dict, tc: pd.DataFrame, exit_code: str) -> dict:
    cons = tc.set_index("event_id")
    e = prep["events"]
    rows, n_hyp, best = [], 0, {}
    for cut, (sp, rL, rS, strata, ms, pa_rows) in prep["per_cut"].items():
        for dname, r in (("LONG", rL), ("SHORT", rS)):
            s = search(sp, r, ms, keep_top=True)
            n_hyp += s["n_hyp"]
            best[f"{cut}|{dname}"] = s["max"]
            rc_all = cons.loc[e.event_id, "R_long" if dname == "LONG" else "R_short"].to_numpy(float)
            for idx, t in s["top"]:
                m = sp.M[list(idx)].prod(0).astype(bool)
                rows.append({"cutoff": cut, "direction": dname, "idx": list(idx), "conditions": [sp.labels[i] for i in idx],
                             "k": len(idx), "t_search": t, "mask": np.packbits(m).tobytes().hex(),
                             **_stats(r[m], rc_all[m], e.year.to_numpy()[m])})
    REG.log_experiment_once("hx5_rules", exit_code, "rule_search", n_hyp, {"exit": exit_code, "window": "2021-10..2024-09"},
                            "p2", SEED, best)
    top = pd.DataFrame(rows).drop_duplicates(subset=["cutoff", "direction", "mask"]).sort_values("t_search", ascending=False)
    return {"top": top, "n_hyp": n_hyp, "best": best}


def fwer(obs: dict, campaign: str) -> dict:
    perm = REG.perm_load(campaign)
    null = perm[perm.key == "max_all"].value.to_numpy()
    top = obs["top"].copy()
    top["p_fwer"] = [(1 + np.sum(null >= t)) / (1 + len(null)) for t in top.t_search]
    return {"top": top, "null_max": {q: float(np.quantile(null, q)) for q in (0.5, 0.9, 0.95, 0.99)}, "n_perm": int(len(null))}


def test_rule(cand: dict, sp_by_cut: dict, ft: pd.DataFrame, tb: pd.DataFrame) -> dict:
    tst = tb[(tb.ok == True) & (tb.t0_utc >= TEST[0]) & (tb.t0_utc < TEST[1])]  # noqa: E712
    sp = sp_by_cut[cand["cutoff"]]
    X = ft[ft.cutoff == cand["cutoff"]].set_index("event_id").loc[tst.event_id].reset_index()
    m = sp.apply(X, cand["idx"])
    sel = tst[m]
    r = (sel.R_long if cand["direction"] == "LONG" else sel.R_short).to_numpy(float)
    n = len(r)
    tt = float(r.mean() / (r.std(ddof=1) / np.sqrt(n))) if n > 2 and r.std() > 0 else 0.0
    return {"n_test_events": int(len(tst)), "n_trades": int(n), "win_rate": float((r > 0).mean()) if n else None,
            "mean_R": float(r.mean()) if n else None, "total_R": float(r.sum()), "t": tt,
            "p_one_sided": float(sps.t.sf(tt, n - 1)) if n >= 5 else 1.0,
            "trades": [{"event_id": e, "R": float(x)} for e, x in zip(sel.event_id, r)]}


def money(rs: list[float]) -> float:
    b = 10_000.0
    for r in rs:
        b += b / 24 * r
    return b


def apply_holm(tests: list[dict]) -> None:
    adj = holm([x["p_one_sided"] for x in tests])
    for x, a in zip(tests, adj):
        x["holm_p"] = a


__all__ = ["EXITS", "STUDY", "TEST", "paths", "trades", "describe", "prepare", "observed", "fwer", "test_rule",
           "money", "apply_holm", "select_candidates"]
