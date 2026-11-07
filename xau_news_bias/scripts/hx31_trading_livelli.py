"""H-X31 (docs/IPOTESI-HX31-TRADING-SUI-LIVELLI.md): trading sui livelli del giorno, fade e rottura."""
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import t as tdist  # noqa: E402

from hx28_livelli import H2, checkpoints, walk  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

KS = (10, 14)
COST = 0.5  # $ a trade
PERIODS = {"2016-18": (2016, 2018), "2019-22": (2019, 2022), "2023-26": (2023, 2026)}


def run_order(bars, side, entry, tp, sl, upper):
    """upper=True: l'ingresso è sopra il prezzo (si tocca con il massimo), False: sotto (con il minimo)."""
    risk = abs(entry - sl)
    if risk <= 0 or (tp - entry) * side <= 0 or (entry - sl) * side <= 0:
        return None
    filled, ex = False, None
    for h, l, c in bars:
        if not filled:
            if (upper and h >= entry) or (not upper and l <= entry):
                filled = True
                if (side == -1 and h >= sl) or (side == 1 and l <= sl):  # nella candela d'ingresso conta solo lo stop
                    ex = sl
                    break
            continue
        if (side == -1 and h >= sl) or (side == 1 and l <= sl):
            ex = sl
            break
        if (side == -1 and l <= tp) or (side == 1 and h >= tp):
            ex = tp
            break
    if not filled:
        return None
    if ex is None:
        ex = bars[-1][2]
    return (side * (ex - entry) - COST) / risk


def simulate(df: pd.DataFrame, x: pd.DataFrame) -> pd.DataFrame:
    rows = []
    groups = {k: g[["h", "l", "c", "k"]].to_numpy() for k, g in df.groupby("key")}
    for r in x[x.k.isin(KS)].itertuples():
        g = groups.get(r.key)
        if g is None:
            continue
        after = g[g[:, 3] > r.k][:, :3]
        if not len(after):
            continue
        adr = r.O / 100 * r.S
        P = r.P
        orders = {
            "R1": [(-1, r.su90, r.su_tip, r.su90 + .2 * adr, True), (1, r.giu90, r.giu_tip, r.giu90 - .2 * adr, False)],
            "R2": [(-1, r.su_tip, P, r.su90, True), (1, r.giu_tip, P, r.giu90, False)],
            "R3": [(1, r.su_tip, r.su90, P, True), (-1, r.giu_tip, r.giu90, P, False)],
        }
        for code, lst in orders.items():
            for side, e, tp, sl, upper in lst:
                res = run_order(after, side, e, tp, sl, upper)
                if res is not None:
                    rows.append({"regola": code, "k": int(r.k), "y": int(r.y), "lato": "su" if upper else "giu", "R": res})
    return pd.DataFrame(rows)


def summary(t: pd.DataFrame) -> dict:
    out = {}
    for (code, k), g in t.groupby(["regola", "k"]):
        d = {}
        for p, (a, b) in PERIODS.items():
            s = g[(g.y >= a) & (g.y <= b)].R
            d[p] = {"n": int(len(s)), "vinti": round(float((s > 0).mean()), 3) if len(s) else None,
                    "R_medio": round(float(s.mean()), 4) if len(s) else None, "somma_R": round(float(s.sum()), 1)}
        s = g[g.y >= 2019].R
        tt = float(s.mean() / (s.std(ddof=1) / np.sqrt(len(s)))) if len(s) > 2 else 0.0
        d["2019-26"] = {"n": int(len(s)), "R_medio": round(float(s.mean()), 4), "t": round(tt, 2), "p": float(tdist.sf(tt, len(s) - 1))}
        d["per_lato_2019_26"] = {lato: round(float(gg.R.mean()), 4) for lato, gg in g[g.y >= 2019].groupby("lato")}
        out[f"{code}_k{k}"] = d
    ps = sorted(out.items(), key=lambda kv: kv[1]["2019-26"]["p"])
    run = 0
    for i, (key, v) in enumerate(ps):
        run = max(run, min(1.0, v["2019-26"]["p"] * (len(ps) - i)))
        v["p_holm"] = round(run, 4)
        a, b, c = (v[p]["R_medio"] for p in ("2016-18", "2019-22", "2023-26"))
        v["funziona"] = bool(b is not None and c is not None and b > 0 and c > 0 and run < .05 and a is not None and a > 0)
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    h1 = DukascopyProvider().h1_range("XAUUSD", date(2012, 1, 1), date.today())
    df = checkpoints(h1, "D")
    cur = (h1.index[-1] + H2).normalize().tz_localize(None)
    df = df[df.key < cur]
    x = walk(df, "C")
    t = simulate(df, x)
    res = summary(t)
    (R / "hx31_trading_livelli.json").write_text(json.dumps(res, indent=1, default=float), encoding="utf-8")
    for k, v in res.items():
        print(k, {p: (v[p]["n"], v[p]["vinti"], v[p]["R_medio"]) for p in PERIODS}, v["2019-26"], "holm", v["p_holm"], "FUNZIONA" if v["funziona"] else "")
