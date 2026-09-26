"""Ipotesi H-X2: il setup manuale di Davide (docs/IPOTESI-SETUP-DAVIDE.md, pre-registrata).

Ingresso T−60 s, stop 10 $ fissi, uscita a fine prima M1. Perdita tagliata a −1R (full margin con
protezione dal saldo negativo) oppure stop eseguito con il salto (conto normale). Risultato:
precisione di direzione necessaria per andare in pari.
"""

from __future__ import annotations

import json

import numpy as np
import pandas as pd

from ..config import get_settings
from .anatomy_study import load
from .ticktrade import SCENARIOS, simulate
from .trades import REGIME_START, u_news

ENTRIES = ["m60", "m30", "m10"]
STOPS = [5.0, 10.0, 15.0, 20.0, "0.6U"]
COSTS = ["base", "conservative"]
ACC = [0.50, 0.55, 0.60, 0.65, 0.70]


def _era(y: int) -> str:
    return "2013-19" if y <= 2019 else "2020-22" if y <= 2022 else "2023-24" if y <= 2024 else "2025-26"


def build() -> pd.DataFrame:
    ev, ft, paths = load()
    U = u_news(ft)
    ev = ev[(ev.t0_utc >= REGIME_START) & ev.a_ok.fillna(False).astype(bool)]
    rows = []
    for r in ev.itertuples():
        p = paths.get(r.event_id)
        u = U.get(r.event_id, np.nan)
        if p is None:
            continue
        for e in ENTRIES:
            for s in STOPS:
                stop = 0.6 * u if s == "0.6U" else s
                if not (stop == stop and stop > 0):
                    continue
                for c in COSTS:
                    lo = simulate(p, +1, stop, e, SCENARIOS[c])
                    sh = simulate(p, -1, stop, e, SCENARIOS[c])
                    if not (lo.get("ok") and sh.get("ok")):
                        continue
                    rows.append({"event_id": r.event_id, "family": r.family, "year": r.year, "era": _era(r.year),
                                 "entry": e, "stop": str(s), "cost": c, "stop_usd": stop,
                                 "rl": lo["r"], "rs": sh["r"]})
    return pd.DataFrame(rows)


def summarize(g: pd.DataFrame, cap: bool) -> dict:
    rl, rs = g.rl.to_numpy(), g.rs.to_numpy()
    if cap:
        rl, rs = np.maximum(rl, -1.0), np.maximum(rs, -1.0)
    right, wrong = np.maximum(rl, rs), np.minimum(rl, rs)
    mr, mw = right.mean(), wrong.mean()
    out = {"n": int(len(g)), "R_right": float(mr), "R_wrong": float(mw),
           "p_breakeven": float(-mw / (mr - mw)) if mr > mw else None,
           "always_long": float(rl.mean()), "always_short": float(rs.mean()),
           "right_ge2R": float((right >= 2).mean()), "right_ge3R": float((right >= 3).mean()),
           "right_ge5R": float((right >= 5).mean()), "wrong_below_1R": float((wrong < -1).mean())}
    for a in ACC:
        out[f"EV_{int(a * 100)}"] = float(a * mr + (1 - a) * mw)
    return out


def run() -> dict:
    t = build()
    res = []
    for (e, s, c), g in t.groupby(["entry", "stop", "cost"]):
        for cap in (True, False):
            for fam in ("CPI", "NFP", "ALL"):
                gf = g if fam == "ALL" else g[g.family == fam]
                for era in ("ALL", "2013-19", "2020-22", "2023-24", "2025-26"):
                    ge = gf if era == "ALL" else gf[gf.era == era]
                    if len(ge) < 5:
                        continue
                    res.append({"entry": e, "stop": s, "cost": c, "loss": "B_cap_-1R" if cap else "A_gap",
                                "family": fam, "era": era, **summarize(ge, cap)})
    main = t[(t.entry == "m60") & (t.stop == "10.0") & (t.cost == "base")]
    by_year = []
    for (fam, y), g in main.groupby(["family", "year"]):
        by_year.append({"family": fam, "year": int(y), **summarize(g, True)})
    out = {"hypothesis": "H-X2 setup Davide, docs/IPOTESI-SETUP-DAVIDE.md", "rows": res, "main_by_year": by_year}
    d = get_settings().research_dir / "phase2"
    (d / "hx2_setup_davide.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    main.to_csv(d / "hx2_main_trades.csv", index=False)
    return out
