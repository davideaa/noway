"""H-X6: modelli di fase 2 congelati con il trade di Davide + dati per il sito (grafico di ogni news)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.phase2 import hx5  # noqa: E402
from xnb.phase2.ticktrade import SCENARIOS  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

GRID = np.arange(-120, 301, 2)  # secondi, un punto ogni 2 s


def series(p):
    t = p["t"] / 1000.0
    mid = (p["bid"] + p["ask"]) / 2
    idx = np.searchsorted(t, GRID, side="right") - 1
    ok = idx >= 0
    out = np.full(len(GRID), np.nan)
    out[ok] = mid[idx[ok]]
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    rep = json.loads((R / "replay.json").read_text())
    ev = pd.read_parquet(R / "p2_events.parquet").set_index("event_id")
    duka = DukascopyProvider()
    rows = []
    for x in rep:
        e = x["id"]
        t0 = ev.at[e, "t0_utc"]
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=16))
        if len(tk) < 20:
            continue
        t0ms = int(t0.value // 1_000_000)
        p = {"t": tk.ts_ms.to_numpy(np.int64) - t0ms, "bid": tk.bid.to_numpy(float), "ask": tk.ask.to_numpy(float)}
        stop = hx5.stop_usd(t0)
        res = {}
        for ex in ("E1_M1", "E2_5min"):
            res[ex] = {d: hx5.simulate_exit(p, s, stop, ex, SCENARIOS["base"]) for d, s in (("L", 1), ("S", -1))}
        j = int(np.searchsorted(p["t"], -60_000, side="right") - 1)
        ref = (p["bid"][j] + p["ask"][j]) / 2 if j >= 0 else np.nan
        s = series(p) - ref
        a = x["a"]
        pick = lambda ex: None if a == "NO TRADE" else res[ex]["L" if a == "LONG" else "S"]  # noqa: E731
        rows.append({"id": e, "f": x["f"], "d": x["d"], "p": x["p"], "a": a, "lean": x["lean"], "stop": stop,
                     "r1": pick("E1_M1"), "r5": pick("E2_5min"),
                     "l1": res["E1_M1"]["L"], "s1": res["E1_M1"]["S"], "l5": res["E2_5min"]["L"], "s5": res["E2_5min"]["S"],
                     "px": round(float(ref), 2), "y": [None if v != v else round(float(v), 2) for v in s]})
    out = {"grid_s": GRID.tolist(), "events": rows}

    def money(rs):
        b = 10_000.0
        for r in rs:
            b += b / 24 * r
        return b

    summ = {}
    for f in ("NFP", "CPI"):
        for per in ("studio", "test", "tutto"):
            g = [r for r in rows if r["f"] == f and (per == "tutto" or r["p"] == per)]
            t = [r for r in g if r["a"] != "NO TRADE" and r["r1"] is not None]
            for ex, k in (("M1", "r1"), ("5min", "r5")):
                rr = np.array([r[k] for r in t if r[k] is not None], float)
                dirok = np.mean([(r["a"] == "LONG") == (r["y"][GRID.tolist().index(60)] or 0) > 0 for r in t]) if t else None
                summ[f"{f}|{per}|{ex}"] = {"news": len(g), "trade": int(len(rr)), "vinti": float((rr > 0).mean()) if len(rr) else None,
                                           "R_medio": float(rr.mean()) if len(rr) else None, "R_tot": float(rr.sum()),
                                           "soldi_da_10000": money(sorted_r) if (sorted_r := [r[k] for r in sorted(t, key=lambda z: z["d"]) if r[k] is not None]) else 10000.0}
    out["summary"] = summ
    d = R / "hx6"
    d.mkdir(exist_ok=True)
    (d / "hx6_site.json").write_text(json.dumps(out), encoding="utf-8")
    print(pd.DataFrame(summ).T.round(2).to_string())
