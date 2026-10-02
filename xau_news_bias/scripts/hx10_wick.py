"""H-X10 (docs/IPOTESI-HX10-WICK-SENZA-SPREAD.md): wick massima e chiusura sul bid, senza spread, CPI e NFP."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.phase2 import hx5  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402


def side(p, d, stop):
    """R wick e R chiusura sul bid per la direzione d (+1 LONG, -1 SHORT)."""
    t, bid = p["t"], p["bid"]
    j = int(np.searchsorted(t, -60_000, side="right") - 1)
    k = np.nonzero((t > t[j]) & (t < 60_000))[0]
    fav = d * (bid[k] - bid[j])
    tk = t[k]
    hit = np.nonzero(fav <= -stop)[0]
    s_i = int(hit[0]) if len(hit) else len(fav)
    news = np.nonzero((tk >= 0) & (np.arange(len(fav)) < s_i))[0]
    if s_i < len(fav) and (len(news) == 0 or tk[s_i] < 0):
        wick = -1.0  # stop preso prima della news
    elif len(news):
        wick = float(fav[news].max() / stop)
        if s_i < len(fav):
            wick = max(wick, -1.0)
    else:
        wick = float(fav[-1] / stop)
    close = -1.0 if s_i < len(fav) else float(fav[-1] / stop)
    return round(max(wick, -1.0), 3), round(max(close, -1.0), 3)


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx7" / "hx7_site.json").read_text())
    duka = DukascopyProvider()
    rows = []
    for e in site["ev"]:
        if e["mv"] == 0:
            continue
        t0 = pd.Timestamp(e["d"], tz="UTC")
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=2))
        t0ms = int(t0.value // 1_000_000)
        p = {"t": tk.ts_ms.to_numpy(np.int64) - t0ms, "bid": tk.bid.to_numpy(float)}
        stop = hx5.stop_usd(t0)
        L, S = side(p, 1, stop), side(p, -1, stop)
        rows.append({"id": e["id"], "f": e["f"], "d": e["d"], "y": e["y"], "up": e["mv"] > 0,
                     "rule": e["rule"], "model": e["model"], "L": L, "S": S})
    per = {"IS 2014-19": lambda r: r["y"] <= 2019, "OOS 2020-26": lambda r: r["y"] >= 2020,
           "ultimi 3 anni": lambda r: r["d"] >= "2023-10-01", "tutto": lambda r: True}
    tab = []
    for fam in ("NFP", "CPI"):
        for pn, f in per.items():
            g = [r for r in rows if r["f"] == fam and f(r)]
            for src in ("rule", "model", "LONG"):
                pick = (lambda r: "L") if src == "LONG" else (lambda r, s=src: r[s][0])
                opp = lambda r, pk=pick: "S" if pk(r) == "L" else "L"  # noqa: E731
                n = len(g)
                hit = sum((pick(r) == "L") == r["up"] for r in g)
                out = {"famiglia": fam, "periodo": pn, "bias": src, "n": n, "indovina": round(hit / n, 3)}
                for m, i in (("wick", 0), ("chiusura", 1)):
                    b = np.array([r[pick(r)][i] for r in g])
                    o = np.array([r[opp(r)][i] for r in g])
                    diff = b - o
                    out[f"{m}_somma_bias"] = round(b.sum(), 1)
                    out[f"{m}_somma_caso"] = round(((b + o) / 2).sum(), 1)
                    out[f"{m}_vantaggio"] = round((b - (b + o) / 2).sum(), 1)
                    out[f"{m}_t"] = round(float(diff.mean() / (diff.std(ddof=1) / np.sqrt(n))), 2)
                    out[f"{m}_vinti"] = int((b > 0).sum())
                tab.append(out)
    res = {"tabella": tab, "eventi": rows}
    (R / "hx8" / "hx10_wick.json").write_text(json.dumps(res, indent=1), encoding="utf-8")
    df = pd.DataFrame(tab)
    pd.set_option("display.width", 250)
    for fam in ("NFP", "CPI"):
        print("\n=====", fam)
        print(df[df.famiglia == fam].drop(columns="famiglia").to_string(index=False))
