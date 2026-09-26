"""H-X12 (docs/IPOTESI-HX12-STOP-ATR.md): stop NFP fisso o k x ATR14 su M1/M5/M15/H1/D1. Solo interno."""
import json
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import MODE, load_ticks, quotes, trade  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.phase2 import hx5  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

GRID = {"M1": [4, 6, 8, 10, 12, 15], "M5": [2, 3, 4, 5, 6, 8], "M15": [1, 1.5, 2, 2.5, 3, 4],
        "H1": [0.5, 0.75, 1, 1.25, 1.5, 2], "D1": [0.1, 0.15, 0.2, 0.25, 0.3, 0.4]}
FIXED = [4.0, 6.0, 8.0, 10.0, 15.0]
# estensione della griglia dove il migliore stava sul bordo (regola scritta in H-X12)
EXT = {"M1": [2, 3], "M5": [1, 1.5], "D1": [0.05, 0.075]}
FIXED_EXT = [2.0, 3.0]


def atr14(bars: pd.DataFrame) -> float:
    """ATR 14 come MT5: media semplice degli ultimi 14 true range."""
    h, lo, c = bars.h.to_numpy(), bars.l.to_numpy(), bars.c.to_numpy()
    tr = np.maximum(h[1:] - lo[1:], np.maximum(abs(h[1:] - c[:-1]), abs(lo[1:] - c[:-1])))
    return float(tr[-14:].mean()) if len(tr) >= 14 else np.nan


def resample(m1: pd.DataFrame, rule: str, offset=None) -> pd.DataFrame:
    g = m1.resample(rule, label="left", closed="left", offset=offset)
    return pd.DataFrame({"o": g.o.first(), "h": g.h.max(), "l": g.l.min(), "c": g.c.last()}).dropna()


def atrs(duka, t0: pd.Timestamp) -> dict:
    entry = t0 - pd.Timedelta(seconds=60)
    m1 = duka.m1_range("XAUUSD", (t0 - timedelta(days=3)).date(), t0.date())
    m1 = m1[m1.index + pd.Timedelta(minutes=1) <= entry]
    out = {"M1": atr14(m1.iloc[-40:])}
    for tf, rule in (("M5", "5min"), ("M15", "15min"), ("H1", "1h")):
        b = resample(m1, rule)
        step = pd.Timedelta(rule)
        b = b[b.index + step <= entry]  # solo candele chiuse prima dell'ingresso
        out[tf] = atr14(b.iloc[-40:])
    h1 = duka.h1_range("XAUUSD", (t0 - timedelta(days=40)).date(), t0.date())
    h1 = h1[h1.index + pd.Timedelta(hours=1) <= entry]
    d1 = resample(h1, "24h", offset=pd.Timedelta(hours=22))  # giornata di trading chiusa alle 22:00 UTC
    d1 = d1[d1.index + pd.Timedelta(days=1) <= entry]
    out["D1"] = atr14(d1.iloc[-30:])
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx11" / "site.json").read_text())
    ev = [e for e in site["ev"] if e["f"] == "NFP" and e["rule"] and e["mv"] != 0 and not e["live"]]
    duka = DukascopyProvider()
    rows = []
    for e in ev:
        t0 = pd.Timestamp(e["d"], tz="UTC")
        a = atrs(duka, t0)
        t, bid, ask = load_ticks(duka, t0)
        d = 1 if e["rule"] == "LONG" else -1
        confs = {"rif_60_100": hx5.stop_usd(t0)}
        confs.update({f"fisso_{int(x * 10)}": x for x in FIXED + FIXED_EXT})
        for tf in GRID:
            for k in GRID[tf] + EXT.get(tf, []):
                confs[f"{tf}_x{k}"] = k * a[tf] if a[tf] == a[tf] else np.nan
        res = {}
        for name, stop in confs.items():
            if not stop == stop or stop <= 0:
                continue
            r = {}
            for s in ("S1", "S3"):
                b, q = quotes(bid, ask, s)
                tr, op = trade(t, b, q, d, stop, MODE[s]), trade(t, b, q, -d, stop, MODE[s])
                r[s], r[s + "_opp"] = tr["r"], op["r"]
                # perdita vera se lo stop viene saltato (senza il tetto -1R del full margin)
                r[s + "_raw"] = round(d * (tr["ex"] - tr["en"]) / stop, 3)
                r[s + "_opp_raw"] = round(-d * (op["ex"] - op["en"]) / stop, 3)
            r["st"] = trade(t, *quotes(bid, ask, "S1"), d, stop, MODE["S1"])["st"]
            res[name] = {"stop": stop, **r}
        rows.append({"id": e["id"], "d": e["d"], "y": e["y"], "atr": a, "res": res})
        print(e["id"], {k: round(v, 2) for k, v in a.items()}, flush=True)
    (R / "hx11" / "hx12_atr_stop.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")
