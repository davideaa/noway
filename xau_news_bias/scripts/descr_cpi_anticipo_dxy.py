"""Descrittivo (docs/DESCRITTIVO-CPI-SITUAZIONI-SIMILI.md): nei primi 10 secondi dopo il CPI il DXY si muove prima dell'oro?
Tick Dukascopy di oro e delle sei valute, griglia da 100 ms. Definizione scritta prima del calcolo."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DXY_CONST, DXY_WEIGHTS, DukascopyProvider  # noqa: E402

G = np.arange(-1000, 60_001, 100)


def serie(duka, s, t0):
    tk = duka.ticks(s, (t0 - pd.Timedelta(minutes=3)).to_pydatetime(), (t0 + pd.Timedelta(minutes=3)).to_pydatetime())
    t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
    mid = ((tk.bid + tk.ask) / 2).to_numpy(float)
    j = np.searchsorted(t, G, side="right") - 1
    return mid[j] if j.min() >= 0 else None


def meta(x):
    """ms dopo il dato in cui la serie ha coperto metà della mossa dei primi 10 s; None se non si muove."""
    i0, i10 = 9, 9 + 100  # -100 ms e +10 s
    tot = x[i10] - x[i0]
    if tot == 0:
        return None, 0
    k = np.nonzero((x[i0 + 1: i10 + 1] - x[i0]) / tot >= 0.5)[0]
    return int(G[i0 + 1 + k[0]]), int(np.sign(tot))


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    base = json.loads((R / "descr_cpi_oro_dxy.json").read_text())["dxy"]["righe"]
    duka = DukascopyProvider()
    righe = []
    for r in base:
        t0 = pd.Timestamp(r["data"] + (" 13:30" if r["data"][5:7] in ("11", "12", "01", "02") or r["data"] in ("2025-03-12",) and False else " 12:30"), tz="UTC")
        # l'ora vera la prendo dal sito: estate 12:30 UTC, inverno 13:30 UTC
        ev = json.loads((get_settings().research_dir / "phase2" / "hx11" / "site.json").read_text(encoding="utf-8"))["ev"]
        t0 = next(pd.Timestamp(e["d"], tz="UTC") for e in ev if e["f"] == "CPI" and e["d"].startswith(r["data"]))
        oro = serie(duka, "XAUUSD", t0)
        logv, ok = np.full(len(G), np.log(DXY_CONST)), oro is not None
        for s, w in DXY_WEIGHTS.items():
            v = serie(duka, s, t0)
            if v is None:
                ok = False
                break
            logv += w * np.log(v)
        if not ok:
            continue
        dxy = np.exp(logv)
        (to, so), (td, sd) = meta(oro), meta(dxy)
        m1 = lambda x: int(np.sign(x[-1] - x[9]))  # noqa: E731
        righe.append({"data": r["data"], "oro_meta_ms": to, "dxy_meta_ms": td, "anticipo_dxy_ms": None if to is None or td is None else to - td,
                      "opposti_10s": bool(so == -sd), "opposti_60s": bool(m1(oro) == -m1(dxy))})
        print(righe[-1], flush=True)
    a = np.array([r["anticipo_dxy_ms"] for r in righe if r["anticipo_dxy_ms"] is not None])
    out = {"n": len(righe), "anticipo_mediana_ms": int(np.median(a)), "dxy_prima_di_500ms": int((a >= 500).sum()), "dxy_prima_di_1s": int((a >= 1000).sum()),
           "oro_prima_di_500ms": int((a <= -500).sum()), "opposti_10s": int(sum(r["opposti_10s"] for r in righe)),
           "opposti_60s": int(sum(r["opposti_60s"] for r in righe)), "righe": righe}
    (R / "descr_cpi_anticipo_dxy.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print({k: v for k, v in out.items() if k != "righe"})
