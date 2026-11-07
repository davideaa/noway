"""Analisi preliminari che NON guardano la direzione (fatte prima del protocollo).

1. asimmetria: la M1 della news contro la stessa M1 nei giorni senza news
   e contro la M1 tipica dell'ora prima;
2. anatomia: classi di percorso, tempi di massimo e minimo;
3. unità dello stop: quale misura di volatilità pre-news rende il range
   della news più stabile negli anni e più prevedibile;
4. ampiezza dello stop: quantile dell'escursione avversa nei casi in cui
   la direzione a fine minuto era giusta.

Regola: per NFP si usa solo il periodo fino al 2019 (il 2020-2026 NFP è il
test finale intatto). Per CPI si riportano anche gli anni successivi, già
esposti nella fase 1; le SCELTE di parametro usano solo fino al 2019.
"""

from __future__ import annotations

import json

import numpy as np
import pandas as pd
from scipy import stats as sps

from ..config import get_settings
from .ticktrade import SCENARIOS, path_class, simulate

DISCOVERY_END = pd.Timestamp("2020-01-01", tz="UTC")


def load():
    d = get_settings().research_dir / "phase2"
    ev = pd.read_parquet(d / "p2_events.parquet")
    ft = pd.read_parquet(d / "p2_features.parquet")
    pa = pd.read_parquet(d / "p2_paths.parquet")
    paths = {r.event_id: {"t": np.asarray(r.t, dtype=np.int64), "bid": np.asarray(r.bid), "ask": np.asarray(r.ask)}
             for r in pa.itertuples()}
    return ev, ft, paths


def visible(ev: pd.DataFrame) -> pd.DataFrame:
    """Eventi analizzabili prima del protocollo: tutto CPI, NFP solo fino al 2019."""
    m = (ev.family == "CPI") | (ev.t0_utc < DISCOVERY_END)
    return ev[m & ev.a_ok.fillna(False).astype(bool)]


def units_table(ev: pd.DataFrame, ft: pd.DataFrame) -> pd.DataFrame:
    x = ft[ft.cutoff == "T-1M"].set_index("event_id")
    u = pd.DataFrame(index=ev.event_id)
    u["U_m1"] = x["unit_atr_m1_60"]
    u["U_h1"] = x["unit_atr_h1"]
    u["U_d1"] = x["unit_atr_d1"]
    u["U_px"] = x["unit_px"] * 0.001
    u["U_news"] = x["f_react_same_range_med6"] * x["unit_atr_m1_60"]
    u["U_fixed"] = 1.0
    return u


def run() -> dict:
    ev, ft, paths = load()
    v = visible(ev).copy()
    res: dict = {"note": "NFP solo fino al 2019; CPI tutti gli anni (già esposti in fase 1)"}
    v["era"] = pd.cut(v.year, [2007, 2012, 2019, 2022, 2026], labels=["2008-12", "2013-19", "2020-22", "2023-26"])
    # 1. asimmetria
    v["ratio_ctrl"] = v.a_range / v.ctrl_range_usd
    v["ratio_unit"] = v.a_range / v.ctrl_unit_m1
    asym = []
    for (fam, era), g in v.groupby(["family", "era"], observed=True):
        asym.append({"family": fam, "era": str(era), "n": int(len(g)),
                     "news_range_med_usd": float(g.a_range.median()),
                     "control_range_med_usd": float(g.ctrl_range_usd.median()),
                     "ratio_vs_control_med": float(g.ratio_ctrl.median()),
                     "ratio_vs_control_p25": float(g.ratio_ctrl.quantile(.25)),
                     "ratio_vs_control_p75": float(g.ratio_ctrl.quantile(.75)),
                     "abs_move_med_usd": float(g.a_move.abs().median()),
                     "spread_p0_med": float(g.a_spread_p0.median()),
                     "spread_max_m1_med": float(g.a_spread_max_m1.median())})
    res["asymmetry"] = asym
    # 2. anatomia: classi di percorso (unità: M1 media dell'ora prima)
    u = units_table(ev, ft)
    v = v.join(u, on="event_id")
    v["cls"] = [path_class({k[2:]: r[k] for k in r.index if k.startswith("a_")}, r.U_m1 * 1.0)
                for _, r in v.iterrows()]
    cls = v.groupby(["family", "era", "cls"], observed=True).size().unstack(fill_value=0)
    res["path_classes"] = {f"{fam}|{era}": row.to_dict() for (fam, era), row in cls.iterrows()}
    tt = v.assign(t_ext=np.where(v.a_move > 0, v.a_t_high_ms, v.a_t_low_ms) / 1000)
    res["time_to_extreme_s"] = {fam: {"median": float(g.t_ext.median()), "p25": float(g.t_ext.quantile(.25)),
                                      "p75": float(g.t_ext.quantile(.75))} for fam, g in tt.groupby("family")}
    # 3. unità dello stop (solo scoperta: fino al 2019)
    d = v[v.t0_utc < DISCOVERY_END]
    ures = {}
    for col in ("U_m1", "U_h1", "U_d1", "U_px", "U_news", "U_fixed"):
        z = d[["a_range", col, "year", "family"]].dropna()
        z = z[z[col] > 0]
        lr = np.log(z.a_range / z[col])
        yearly = lr.groupby(z.year).median()
        rho = sps.spearmanr(z[col], z.a_range).statistic if z[col].nunique() > 1 else np.nan
        ures[col] = {"n": int(len(z)), "between_year_sd_log": float(yearly.std()),
                     "spearman_unit_vs_range": float(rho) if rho == rho else None,
                     "median_ratio": float(np.exp(lr.median()))}
    res["unit_study"] = ures
    cand = {k: x for k, x in ures.items() if k != "U_fixed"}
    rank_sd = pd.Series({k: x["between_year_sd_log"] for k, x in cand.items()}).rank()
    rank_rho = pd.Series({k: -(x["spearman_unit_vs_range"] or 0) for k, x in cand.items()}).rank()
    best = (rank_sd + rank_rho).sort_values().index[0]
    res["unit_choice"] = {"unit": best, "rule": "rango minimo di (dispersione fra anni) + (−Spearman), dati fino al 2019"}
    # 4. ampiezza dello stop: MAE nella direzione giusta (ingresso T−10s, costi base, senza stop)
    rows = []
    for _, r in d.iterrows():
        p = paths.get(r.event_id)
        if p is None or not (r[best] > 0):
            continue
        for dirn in (1, -1):
            s = simulate(p, dirn, None, "m10", SCENARIOS["base"])
            if s.get("ok"):
                rows.append({"event_id": r.event_id, "family": r.family, "dir": dirn, "pnl": s["pnl_usd"],
                             "mae": s["mae_usd"], "mfe": s["mfe_usd"], "U": r[best]})
    t = pd.DataFrame(rows)
    right = t[t.pnl > 0]
    q = (right.mae / right.U).quantile([0.5, 0.6, 0.7, 0.75, 0.8, 0.9])
    res["mae_correct_over_unit_quantiles"] = {str(k): float(x) for k, x in q.items()}
    k = float(q.loc[0.75])
    res["stop_choice"] = {"unit": best, "k": round(k, 2),
                          "rule": "75° percentile di MAE/U quando la direzione a fine minuto era giusta (fino al 2019)"}
    # quanto cambia la sopravvivenza dei trade giusti con k ±30%
    grid = []
    for mult in (0.5, 0.7, 0.85, 1.0, 1.15, 1.3, 1.6, 2.0, 3.0):
        kk = k * mult
        surv = float((right.mae / right.U < kk).mean())
        wrong = t[t.pnl <= 0]
        stopped_wrong = float((wrong.mae / wrong.U >= kk).mean())
        grid.append({"k": kk, "mult": mult, "correct_not_stopped": surv, "wrong_stopped": stopped_wrong})
    res["stop_grid"] = grid
    res["always_trade_both_sides"] = {"n": int(len(t)), "mean_pnl_usd": float(t.pnl.mean()),
                                      "mean_cost_note": "LONG e SHORT sullo stesso evento: la media è circa −(costi)"}
    return res


def save(res: dict):
    p = get_settings().research_dir / "phase2" / "p2_anatomy_prereg.json"
    p.write_text(json.dumps(res, indent=1, default=float), encoding="utf-8")
    return p
