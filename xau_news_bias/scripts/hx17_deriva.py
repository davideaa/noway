"""H-X17 (docs/IPOTESI-HX17-DERIVA-SORPRESA-NFP-CPI.md): da T0+1 min, segui la sorpresa su NFP e CPI."""
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import binom  # noqa: E402

from hx15_build import CACHE  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

EXITS = {"X5": 300, "X15": 900}


def mids(t0):
    p = CACHE / f"{t0:%Y%m%d_%H%M}_x17.npz"
    if not p.exists():
        for k in range(6):
            try:
                tk = DukascopyProvider().ticks("XAUUSD", (t0 - pd.Timedelta(minutes=2)).to_pydatetime(),
                                               (t0 + pd.Timedelta(minutes=16)).to_pydatetime())
                break
            except Exception:  # noqa: BLE001
                import time
                time.sleep(5 * 2 ** k)
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        np.savez_compressed(p, t=t, bid=tk.bid.to_numpy(float), ask=tk.ask.to_numpy(float))
    z = np.load(p)
    t, mid = z["t"], (z["bid"] + z["ask"]) / 2
    if not len(t) or t.max() < 900_000:
        return None
    return {s: float(mid[int(np.searchsorted(t, s * 1000, side="right") - 1)]) for s in (60, 300, 900)}


def summary(g):
    out = {"n": len(g)}
    for x in EXITS:
        v = g[x].to_numpy()
        k = int((v > 0).sum())
        out[x] = {"giuste": k, "quota": round(k / len(v), 3) if len(v) else None,
                  "p": float(binom.sf(k - 1, len(v), 0.5)) if len(v) else None,
                  "pips_medi": round(float(v.mean()), 1) if len(v) else None,
                  "pips_mediana": round(float(np.median(v)), 1) if len(v) else None,
                  **{f"netto_{s}": round(float(v.mean() - s), 1) for s in (10, 20, 40)}}
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    c = pd.read_parquet(R / "hx15" / "cpi_nfp.parquet")
    c = c[(c.t0 >= pd.Timestamp("2011-01-01", tz="UTC")) & c.sorpresa.notna() & (c.sorpresa != 0)].reset_index(drop=True)
    with ThreadPoolExecutor(6) as ex:
        m = list(ex.map(mids, c.t0))
    keep = [i for i, x in enumerate(m) if x]
    c = c.iloc[keep].reset_index(drop=True)
    mm = pd.DataFrame([m[i] for i in keep])
    for x, s in EXITS.items():
        c[x] = c.sorpresa * (mm[s] - mm[60]) / 0.1
    c["y"] = c.t0.dt.year
    res = {}
    for name, g in (("studio 2011-18", c[c.y <= 2018]), ("conferma 2019-26", c[c.y >= 2019]),
                    ("ultimi 3 anni", c[c.t0 >= pd.Timestamp("2023-10-01", tz="UTC")])):
        res[name] = {"TUTTE": summary(g), "NFP": summary(g[g.fam == "NFP"]), "CPI": summary(g[g.fam == "CPI"])}
    conf = res["conferma 2019-26"]["TUTTE"]
    ps = sorted((conf[x]["p"], x) for x in EXITS)
    holm = {x: min(1.0, p * (len(ps) - i)) for i, (p, x) in enumerate(ps)}
    passa = {x: bool(conf[x]["quota"] > 0.5 and holm[x] < 0.05 and conf[x]["pips_medi"] > 20
                     and res["studio 2011-18"]["TUTTE"][x]["quota"] > 0.5) for x in EXITS}
    per_anno = {int(y): {x: [int((g[x] > 0).sum()), len(g), round(float(g[x].mean()), 1)] for x in EXITS} for y, g in c.groupby("y")}
    out = {"risultati": res, "holm_conferma": holm, "passa": passa, "per_anno": per_anno}
    (R / "hx16" / "hx17_deriva.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps({k: v for k, v in out.items() if k != "per_anno"}, indent=1))
    print("per anno [giuste, n, pips medi]:", per_anno)
