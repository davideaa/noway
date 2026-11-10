"""Descrittivo (docs/DESCRITTIVO-CPI-SITUAZIONI-SIMILI.md): dopo il CPI, la prima candela M1 e la M5 dicono dove va l'oro
nel resto dell'ora e della giornata? La mossa si misura dalla chiusura della candela in poi. Definizione scritta prima."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import binomtest  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

SYM, NY, PX = "XAUUSD", "America/New_York", 4075.0

if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    ev = json.loads((R / "hx11" / "site.json").read_text(encoding="utf-8"))["ev"]
    lista = [pd.Timestamp(e["d"], tz="UTC") for e in ev if e["f"] == "CPI" and e["d"] >= "2015"]
    duka = DukascopyProvider()
    righe = []
    for t0 in lista:
        m = None
        for _ in range(5):
            try:
                m = duka.m1_range(SYM, t0.date(), t0.date())
                break
            except Exception:  # noqa: BLE001
                import time
                time.sleep(15)
        if m is None or m.empty or t0 not in m.index or len(m[(m.index >= t0) & (m.index < t0 + pd.Timedelta(minutes=60))]) < 40:
            print("salto", t0.date(), flush=True)
            continue
        fine = pd.Timestamp(t0.tz_convert(NY).date()).tz_localize(NY) + pd.Timedelta(hours=17)
        p0, c1 = m.loc[t0, "o"], m.loc[t0, "c"]

        def px(minuti):
            return float(m[m.index < t0 + pd.Timedelta(minutes=minuti)].c.iloc[-1])
        c5, cg = px(5), float(m[m.index < fine].c.iloc[-1])
        k = PX * 10 / p0  # da dollari di allora a pips al prezzo di oggi
        r = {"data": str(t0.date()), "y": t0.year, "m1": (c1 - p0) * k, "m5": (c5 - p0) * k}
        d1, d5 = np.sign(c1 - p0), np.sign(c5 - p0)
        for nome, x in (("5", c5), ("15", px(15)), ("60", px(60)), ("g", cg)):
            r["dopo_m1_" + nome] = d1 * (x - c1) * k
        for nome, x in (("15", px(15)), ("60", px(60)), ("g", cg)):
            r["dopo_m5_" + nome] = d5 * (x - c5) * k
        righe.append(r)
        print(r["data"], round(r["m1"]), round(r["m5"]), round(r["dopo_m1_g"]), flush=True)
    d = pd.DataFrame(righe)
    d.to_csv(R / "hx16" / "descr_cpi_m1_m5_giornata.csv", index=False)
    out = {"n": len(d), "prezzo_di_riferimento": PX, "gruppi": {}}
    for nome, s in (("2015-26", d.y >= 2015), ("2020-26", d.y >= 2020), ("2023-26", d.y >= 2023),
                    ("2020-26 M1 grande", (d.y >= 2020) & (d.m1.abs() >= d[d.y >= 2020].m1.abs().median()))):
        x, g = d[s & (d.m1 != 0)], {}
        for col in [c for c in d.columns if c.startswith("dopo_")]:
            v = x[col][x[col] != 0] if not col.startswith("dopo_m5") else x[col][(x[col] != 0) & (x.m5 != 0)]
            g[col] = {"n": int(len(v)), "continua": int((v > 0).sum()), "quota": round(float((v > 0).mean()), 3),
                      "p": round(float(binomtest(int((v > 0).sum()), len(v), 0.5).pvalue), 3),
                      "mediana_pips": round(float(v.median())), "media_pips": round(float(v.mean()))}
        out["gruppi"][nome] = g
    (R / "hx16" / "descr_cpi_m1_m5_giornata.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    for nome, g in out["gruppi"].items():
        print(nome)
        for col, v in g.items():
            print("  ", col, v)
