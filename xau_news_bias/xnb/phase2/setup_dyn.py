"""Ipotesi H-X3 (docs/IPOTESI-SETUP-DAVIDE.md): stop che segue la volatilità e segnali XNB nel setup di Davide."""

from __future__ import annotations

import json

import numpy as np
import pandas as pd
from scipy import stats as sps

from ..config import get_settings
from .anatomy_study import load
from .ticktrade import SCENARIOS, simulate
from .trades import REGIME_START
from .validate import holm

REF_FROM, REF_TO = pd.Timestamp("2024-10-01", tz="UTC"), pd.Timestamp("2026-09-30", tz="UTC")
MEASURES = {"S1_ATR_D1": "unit_atr_d1", "S2_ATR_H1": "unit_atr_h1", "S3_U_news": None}


def _era(y: int) -> str:
    return "2013-19" if y <= 2019 else "2020-22" if y <= 2022 else "2023-24" if y <= 2024 else "2025-26"


def stops_table(ev: pd.DataFrame, ft: pd.DataFrame) -> pd.DataFrame:
    x = ft[ft.cutoff == "T-1M"].set_index("event_id")
    s = pd.DataFrame(index=ev.event_id)
    s["t0_utc"] = ev.set_index("event_id").t0_utc
    for name, col in MEASURES.items():
        v = (x[col] if col else x["f_react_same_range_med6"] * x["unit_atr_m1_60"]).reindex(s.index)
        s[name + "_V"] = v
        ref = v[(s.t0_utc >= REF_FROM) & (s.t0_utc <= REF_TO)].median()
        s[name] = 10.0 * v / ref
    return s


def build(cost_names=("base", "conservative")) -> pd.DataFrame:
    ev, ft, paths = load()
    ev = ev[(ev.t0_utc >= REGIME_START) & ev.a_ok.fillna(False).astype(bool)]
    st = stops_table(ev, ft)
    rows = []
    for r in ev.itertuples():
        p = paths.get(r.event_id)
        if p is None:
            continue
        for m in MEASURES:
            stop = st.at[r.event_id, m]
            if not (stop == stop and stop > 0):
                continue
            for c in cost_names:
                lo = simulate(p, +1, stop, "m60", SCENARIOS[c])
                sh = simulate(p, -1, stop, "m60", SCENARIOS[c])
                if lo.get("ok") and sh.get("ok"):
                    rows.append({"event_id": r.event_id, "family": r.family, "year": r.year, "era": _era(r.year),
                                 "measure": m, "cost": c, "stop_usd": stop, "rl": lo["r"], "rs": sh["r"]})
    return pd.DataFrame(rows)


def summarize(g: pd.DataFrame, cap: bool = True) -> dict:
    rl, rs = g.rl.to_numpy(), g.rs.to_numpy()
    if cap:
        rl, rs = np.maximum(rl, -1), np.maximum(rs, -1)
    right, wrong = np.maximum(rl, rs), np.minimum(rl, rs)
    mr, mw = right.mean(), wrong.mean()
    return {"n": int(len(g)), "stop_pips_median": float(g.stop_usd.median() * 10),
            "p_breakeven": float(-mw / (mr - mw)) if mr > mw else None,
            "EV_50": float((mr + mw) / 2), "EV_55": float(.55 * mr + .45 * mw), "EV_60": float(.6 * mr + .4 * mw),
            "R_right": float(mr), "R_wrong": float(mw), "right_ge1R": float((right >= 1).mean()),
            "right_ge2R": float((right >= 2).mean()), "right_ge3R": float((right >= 3).mean())}


def xnb_signals(t: pd.DataFrame) -> list[dict]:
    val = json.loads((get_settings().research_dir / "phase2" / "p2_validation.json").read_text())
    main = t[(t.measure == "S1_ATR_D1") & (t.cost == "base")].set_index("event_id")
    rows = []
    for it in val["items"]:
        for stage in ("cpi_validation", "final"):
            tr = (it.get(stage) or {}).get("eval", {}).get("trades")
            if not tr:
                continue
            d = pd.DataFrame(tr)
            d = d[d.event_id.isin(main.index)]
            m = main.loc[d.event_id]
            r = np.where(d.action.to_numpy() == "LONG", m.rl.to_numpy(), m.rs.to_numpy())
            r = np.maximum(r, -1)
            n = len(r)
            tt = float(r.mean() / (r.std(ddof=1) / np.sqrt(n))) if n > 2 and r.std() > 0 else 0.0
            rows.append({"id": it["id"], "period": "CPI 2020-26" if stage == "cpi_validation" else "NFP 2020-26",
                         "n": int(n), "win_rate": float((r > 0).mean()), "mean_R": float(r.mean()),
                         "total_R": float(r.sum()), "t": tt,
                         "p_one_sided": float(sps.t.sf(tt, n - 1)) if n >= 5 else 1.0})
    adj = holm([x["p_one_sided"] for x in rows])
    for x, a in zip(rows, adj):
        x["holm_p"] = a
    return rows


def run() -> dict:
    t = build()
    res = []
    for (m, c), g in t.groupby(["measure", "cost"]):
        for cap in (True, False):
            for fam in ("ALL", "CPI", "NFP"):
                gf = g if fam == "ALL" else g[g.family == fam]
                for era in ("ALL", "2013-19", "2020-22", "2023-24", "2025-26"):
                    ge = gf if era == "ALL" else gf[gf.era == era]
                    if len(ge) >= 5:
                        res.append({"measure": m, "cost": c, "loss": "B_cap" if cap else "A_gap", "family": fam,
                                    "era": era, **summarize(ge, cap)})
    main = t[(t.measure == "S1_ATR_D1") & (t.cost == "base")]
    by_year = [{"year": int(y), **summarize(g)} for y, g in main.groupby("year")]
    out = {"hypothesis": "H-X3", "rows": res, "main_by_year": by_year, "xnb_signals": xnb_signals(t)}
    d = get_settings().research_dir / "phase2"
    (d / "hx3_dynamic_stop.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    main.to_csv(d / "hx3_main_trades.csv", index=False)
    return out
