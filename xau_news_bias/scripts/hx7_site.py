"""Dati del sito H-X7/H-X8: candele 5 s bid/ask, bias (regola inversa NFP e calcolatore), trade di Davide con prezzi."""
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

BINS = np.arange(-120, 300, 5)
C = SCENARIOS["base"]


def trade(p, d, stop):
    t, bid, ask = p["t"], p["bid"], p["ask"]
    j = int(np.searchsorted(t, -60_000, side="right") - 1)
    if j < 0:
        return None
    sp0 = ask[j] - bid[j]
    fixed = C.bp * (bid[j] + ask[j]) / 2
    entry = ask[j] + C.entry_spreads * sp0 + fixed if d > 0 else bid[j] - C.entry_spreads * sp0 - fixed
    k = np.nonzero((t > t[j]) & (t < 60_000))[0]
    if len(k) == 0:
        return None
    side = bid[k] if d > 0 else ask[k]
    fav = d * (side - entry)
    hit = np.nonzero(fav <= -stop)[0]
    if len(hit):
        h = hit[0]
        sp = ask[k][h] - bid[k][h]
        ex = side[h] - d * (C.stop_spreads * sp + fixed)
        et, stopped = int(t[k][h]), True
    else:
        h = len(k) - 1
        sp = ask[k][h] - bid[k][h]
        ex = side[h] - d * (C.exit_spreads * sp + fixed)
        et, stopped = int(t[k][h]), False
    r = max(d * (ex - entry) / stop, -1.0)
    return {"en": round(float(entry), 2), "sl": round(float(entry - d * stop), 2), "ex": round(float(ex), 2),
            "et": et, "st": stopped, "r": round(float(r), 3),
            "spmax": round(float((ask[k] - bid[k]).max()), 2), "sp0": round(float(sp0), 2)}


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    ev = pd.read_parquet(R / "p2_events.parquet")
    ev = ev[ev.a_ok.fillna(False).astype(bool) & (ev.year >= 2014)].sort_values("t0_utc")
    ft = pd.read_parquet(R / "p2_features.parquet")
    prev = ft[ft.cutoff == "T-1M"].set_index("event_id")["f_react_same_last_dir"]
    h7 = json.loads((R / "hx7" / "hx7_results.json").read_text())
    pm = h7["pred_ALL"]
    duka = DukascopyProvider()
    rows = []
    for r in ev.itertuples():
        t0 = r.t0_utc
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=6))
        if len(tk) < 20:
            continue
        t0ms = int(t0.value // 1_000_000)
        p = {"t": tk.ts_ms.to_numpy(np.int64) - t0ms, "bid": tk.bid.to_numpy(float), "ask": tk.ask.to_numpy(float)}
        j = int(np.searchsorted(p["t"], -60_000, side="right") - 1)
        ref = (p["bid"][j] + p["ask"][j]) / 2
        cand = []
        ts = p["t"] / 1000
        for b in BINS:
            m = (ts >= b) & (ts < b + 5)
            if not m.any():
                cand.append(None)
                continue
            bb, aa = p["bid"][m], p["ask"][m]
            cand.append([int(round((x - ref) * 100)) for x in (bb[0], bb.max(), bb.min(), bb[-1], aa.max(), aa.min())])
        m1 = (ts >= 0) & (ts < 60)
        bb = p["bid"][m1]
        stop = hx5.stop_usd(t0)
        pv = prev.get(r.event_id, np.nan)
        rule = None if not (pv == pv) or pv == 0 else ("SHORT" if pv > 0 else "LONG")
        q = pm.get(r.event_id)
        model = None if q is None else ("LONG" if q >= 0.5 else "SHORT")
        rows.append({"id": r.event_id, "f": r.family, "d": str(t0)[:16].replace("T", " "), "y": int(r.year),
                     "per": "studio" if r.year <= 2019 else "test", "mv": round(float(r.a_move), 2),
                     "ref": round(float(ref), 2), "stop": stop, "rule": rule, "model": model,
                     "pm": None if q is None else round(float(q), 3),
                     "m1": [round(float(x), 2) for x in (bb[0], bb.max(), bb.min(), bb[-1])] if len(bb) else None,
                     "L": trade(p, 1, stop), "S": trade(p, -1, stop), "c": cand})
    out = {"bins": BINS.tolist(), "ev": rows}
    (R / "hx7" / "hx7_site.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")

    def summary(fam, src, y0=2014, y1=2026):
        g = [x for x in rows if x["f"] == fam and y0 <= x["y"] <= y1 and x[src] and x[x[src][0]] and x["mv"] != 0]
        hit = [(x[src] == "LONG") == (x["mv"] > 0) for x in g]
        rr = [x[x[src][0]]["r"] for x in g]
        b = 10_000.0
        for v in rr:
            b += b / 24 * v
        return {"n": len(g), "indovina": float(np.mean(hit)), "R_medio": float(np.mean(rr)), "vinti": float(np.mean([v > 0 for v in rr])), "soldi": b}
    s = {f"{f}|{src}|{a}-{b}": summary(f, src, a, b) for f in ("NFP", "CPI") for src in ("rule", "model")
         for a, b in ((2014, 2019), (2020, 2026), (2014, 2026))}
    (R / "hx7" / "hx7_setup_summary.json").write_text(json.dumps(s, indent=1), encoding="utf-8")
    print(pd.DataFrame(s).T.round(3).to_string())
