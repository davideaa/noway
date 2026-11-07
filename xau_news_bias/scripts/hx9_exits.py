"""H-X9 (docs/IPOTESI-HX9-USCITE-NFP.md): uscite sulla spinta NFP con la bias H-X8, opposta e a caso."""
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

C = SCENARIOS["base"]
EXITS = {"X0_fineM1": ("time", 60), "X1_5s": ("time", 5), "X2_10s": ("time", 10), "X3_15s": ("time", 15),
         "X4_20s": ("time", 20), "X5_30s": ("time", 30), "X6_TP1R": ("tp", 1.0), "X7_TP2R": ("tp", 2.0),
         "X8_TP3R": ("tp", 3.0), "X9_tetto": ("best", None)}


def run(p, d, stop):
    """R di ogni uscita per un trade nella direzione d (+1 LONG, -1 SHORT)."""
    t, bid, ask = p["t"], p["bid"], p["ask"]
    j = int(np.searchsorted(t, -60_000, side="right") - 1)
    sp0 = ask[j] - bid[j]
    fixed = C.bp * (bid[j] + ask[j]) / 2
    entry = ask[j] + C.entry_spreads * sp0 + fixed if d > 0 else bid[j] - C.entry_spreads * sp0 - fixed
    k = np.nonzero((t > t[j]) & (t < 60_000))[0]
    tk, side, sp = t[k], (bid[k] if d > 0 else ask[k]), ask[k] - bid[k]
    fav = d * (side - entry)
    hit = np.nonzero(fav <= -stop)[0]
    s_i = int(hit[0]) if len(hit) else None
    stop_r = max(d * (side[s_i] - d * (C.stop_spreads * sp[s_i] + fixed) - entry) / stop, -1.0) if s_i is not None else None
    out_px = fav - (C.exit_spreads * sp + fixed)  # guadagno netto se esco su quel tick (in $)
    res = {}
    for code, (kind, v) in EXITS.items():
        if kind == "time":
            e_i = int(np.searchsorted(tk, v * 1000 if v < 60 else 60_000, side="left") - 1)
            e_i = max(e_i, 0)
            if s_i is not None and s_i <= e_i:
                res[code] = stop_r
            else:
                res[code] = out_px[e_i] / stop
        elif kind == "tp":
            tp = np.nonzero(fav >= v * stop)[0]
            tp_i = int(tp[0]) if len(tp) else None
            if s_i is not None and (tp_i is None or s_i <= tp_i):
                res[code] = stop_r
            elif tp_i is not None:
                res[code] = out_px[tp_i] / stop
            else:
                res[code] = out_px[-1] / stop
        else:
            lim = s_i if s_i is not None else len(fav)
            best = out_px[:lim].max() / stop if lim > 0 else -np.inf
            res[code] = max(best, stop_r) if s_i is not None else best
    return {c: round(float(max(r, -1.0)), 3) for c, r in res.items()}


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx8" / "nfp_site.json").read_text())
    duka = DukascopyProvider()
    rows = []
    for e in site["ev"]:
        t0 = pd.Timestamp(e["d"], tz="UTC")
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=2))
        t0ms = int(t0.value // 1_000_000)
        p = {"t": tk.ts_ms.to_numpy(np.int64) - t0ms, "bid": tk.bid.to_numpy(float), "ask": tk.ask.to_numpy(float)}
        d = 1 if e["bias"] == "LONG" else -1
        stop = hx5.stop_usd(t0)
        rows.append({"id": e["id"], "d": e["d"], "y": e["y"], "bias": run(p, d, stop), "opposta": run(p, -d, stop)})
    # controllo: X0 con la bias deve essere identico al trade del sito
    diff = max(abs(r["bias"]["X0_fineM1"] - e["tr"]["r"]) for r, e in zip(rows, site["ev"]))
    per = {"IS 2014-19": lambda r: r["y"] <= 2019, "OOS 2020-26": lambda r: r["y"] >= 2020,
           "ultimi 3 anni": lambda r: r["d"] >= "2023-10-01", "tutto": lambda r: True}
    tab = []
    for pn, f in per.items():
        g = [r for r in rows if f(r)]
        for code in EXITS:
            b = np.array([r["bias"][code] for r in g])
            o = np.array([r["opposta"][code] for r in g])
            tab.append({"periodo": pn, "uscita": code, "n": len(g), "somma_bias": round(b.sum(), 1),
                        "medio_bias": round(b.mean(), 3), "vinti_bias": int((b > 0).sum()),
                        "somma_opposta": round(o.sum(), 1), "somma_a_caso": round(((b + o) / 2).sum(), 1)})
    out = {"controllo_X0_vs_sito": diff, "tabella": tab, "trade": rows}
    (R / "hx8" / "hx9_exits.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print("controllo X0 vs sito, differenza massima:", diff)
    df = pd.DataFrame(tab)
    for pn in per:
        print("\n==", pn)
        print(df[df.periodo == pn].drop(columns="periodo").to_string(index=False))
