"""Sito solo NFP (H-X8, descrittivo): regola "contrario della NFP precedente", ogni trade con prezzi, spread e movimento.

Per ogni NFP dal 2014:
- prezzi veri (tick Dukascopy) a T0 - 60 s, T0 e T0 + 60 s;
- trade di Davide con lo spread vero (quello che conta, stesso calcolo di H-X7);
- lo stesso trade se lo spread restasse quello delle 14:29 (solo per confronto, ottimistico);
- massimo a favore e contro fino all'uscita, e massimo a favore in tutto il primo minuto;
- candele da 5 s bid/ask da T0 - 120 s a T0 + 120 s.
"""
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

BINS = np.arange(-120, 120, 5)
C = SCENARIOS["base"]


def trade(p, d, stop, fixed_spread=False):
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
    b, a = bid[k], ask[k]
    if fixed_spread:
        mid = (b + a) / 2
        b, a = mid - sp0 / 2, mid + sp0 / 2
    side = b if d > 0 else a
    sp = a - b
    fav = d * (side - entry)
    hit = np.nonzero(fav <= -stop)[0]
    h, stopped = (int(hit[0]), True) if len(hit) else (len(k) - 1, False)
    ex = side[h] - d * ((C.stop_spreads if stopped else C.exit_spreads) * sp[h] + fixed)
    r = max(d * (ex - entry) / stop, -1.0)
    return {"en": round(float(entry), 2), "sl": round(float(entry - d * stop), 2), "ex": round(float(ex), 2),
            "et": int(t[k][h]), "st": stopped, "r": round(float(r), 3),
            "mfe": round(float(fav[: h + 1].max()), 2), "mae": round(float(fav[: h + 1].min()), 2),
            "mfe_min": round(float(fav.max()), 2),
            "spmax": round(float((ask[k] - bid[k]).max()), 2), "sp0": round(float(sp0), 2)}


def px(p, ms):
    j = int(np.searchsorted(p["t"], ms, side="right") - 1)
    return [round(float(p["bid"][j]), 2), round(float(p["ask"][j]), 2)]


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    ev = pd.read_parquet(R / "p2_events.parquet")
    ev = ev[ev.a_ok.fillna(False).astype(bool) & (ev.family == "NFP") & (ev.year >= 2014)].sort_values("t0_utc")
    ft = pd.read_parquet(R / "p2_features.parquet")
    prev = ft[ft.cutoff == "T-1M"].set_index("event_id")["f_react_same_last_dir"]
    duka = DukascopyProvider()
    rows = []
    for r in ev.itertuples():
        t0 = r.t0_utc
        pv = prev.get(r.event_id, np.nan)
        if not (pv == pv) or pv == 0:
            continue
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=3))
        if len(tk) < 20:
            continue
        t0ms = int(t0.value // 1_000_000)
        p = {"t": tk.ts_ms.to_numpy(np.int64) - t0ms, "bid": tk.bid.to_numpy(float), "ask": tk.ask.to_numpy(float)}
        p29, p30, p31 = px(p, -60_000), px(p, -1), px(p, 59_999)
        ref = (p29[0] + p29[1]) / 2
        ts = p["t"] / 1000
        cand = []
        for b in BINS:
            m = (ts >= b) & (ts < b + 5)
            if not m.any():
                cand.append(None)
                continue
            bb, aa = p["bid"][m], p["ask"][m]
            cand.append([int(round((x - ref) * 100)) for x in (bb[0], bb.max(), bb.min(), bb[-1], aa.max(), aa.min())])
        d = -1 if pv > 0 else 1
        stop = hx5.stop_usd(t0)
        rows.append({"id": r.event_id, "d": str(t0)[:16], "y": int(r.year), "mv": round(float(r.a_move), 2),
                     "bias": "LONG" if d > 0 else "SHORT", "stop": stop, "ref": round(ref, 2),
                     "p29": p29, "p30": p30, "p31": p31,
                     "tr": trade(p, d, stop), "fx": trade(p, d, stop, fixed_spread=True), "c": cand})
    out = {"bins": BINS.tolist(), "ev": rows}
    dd = R / "hx8"
    dd.mkdir(exist_ok=True)
    (dd / "nfp_site.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")

    def summ(g):
        g = [x for x in g if x["mv"] != 0 and x["tr"]]
        out = {"n": len(g), "indovinate": sum((x["bias"] == "LONG") == (x["mv"] > 0) for x in g)}
        for k in ("tr", "fx"):
            rr = [x[k]["r"] for x in g]
            b = 10_000.0
            for v in rr:
                b += b / 24 * v
            out[k] = {"somma_R": round(sum(rr), 2), "R_medio": round(float(np.mean(rr)), 3),
                      "vinti": sum(v > 0 for v in rr), "stop": sum(x[k]["st"] for x in g), "soldi": round(b)}
        return out
    s = {"IS 2014-19": summ([x for x in rows if x["y"] <= 2019]),
         "OOS 2020-26": summ([x for x in rows if x["y"] >= 2020]),
         "ultimi 3 anni (2023-10 -> 2026-09)": summ([x for x in rows if x["d"] >= "2023-10-01"]),
         "tutto 2014-26": summ(rows)}
    (dd / "nfp_summary.json").write_text(json.dumps(s, indent=1), encoding="utf-8")
    print(json.dumps(s, indent=1))
