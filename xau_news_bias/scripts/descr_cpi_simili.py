"""Descrittivo (docs/DESCRITTIVO-CPI-SITUAZIONI-SIMILI.md): cosa ha fatto la prima candela M1 dell'oro sui CPI usciti in
situazioni simili a quella del 10/11/2026 (Fed in rialzo, NFP forte prima, CPI precedente caldo, consenso in calo).
Definizioni scritte e salvate prima del calcolo. Non decide niente."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402

if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    rel = pd.read_csv(R / "hx16" / "hx26_release.csv", parse_dates=["t0"])
    ev = pd.read_parquet(R / "p2_events.parquet")
    g = ev[(ev.family == "CPI") & ev.a_ok][["t0_utc", "a_p0", "a_move", "a_range"]].rename(columns={"t0_utc": "t0"})
    h = rel[rel.gruppo == "CPI"][["t0", "a", "f", "prev"]].rename(columns={"a": "a_h", "f": "f_h", "prev": "prev_h"})
    c = rel[rel.gruppo == "CORE_CPI"][["t0", "a", "f"]].rename(columns={"a": "a_c", "f": "f_c"})
    d = g.merge(h, on="t0").merge(c, on="t0").dropna(subset=["a_h", "f_h", "a_c", "f_c"]).sort_values("t0").reset_index(drop=True)
    sc, sh = np.sign((d.a_c - d.f_c).round(3)), np.sign((d.a_h - d.f_h).round(3))
    d["esito"] = np.where(sc != 0, sc, sh)  # +1 caldo, -1 freddo, 0 in linea
    d["mv_pct"] = d.a_move / d.a_p0 * 100
    d["su"] = d.a_move > 0
    fomc = rel[rel.gruppo == "FOMC"].dropna(subset=["a", "prev"]).sort_values("t0")
    nfp = rel[rel.gruppo == "NFP"].dropna(subset=["a", "f"]).sort_values("t0")
    d["C1"] = [bool(len(x := fomc[fomc.t0 > t]) and x.a.iat[0] > x.prev.iat[0]) for t in d.t0]
    d["C2"] = [bool(len(x := nfp[nfp.t0 < t]) and x.a.iat[-1] > x.f.iat[-1]) for t in d.t0]
    d["C3"] = (d.esito.shift(1) > 0).fillna(False)
    d["C4"] = d.f_h < d.prev_h
    gruppi = {"tutti": pd.Series(True, index=d.index), "C1": d.C1, "C1+C2": d.C1 & d.C2, "C1+C4": d.C1 & d.C4,
              "C1+C3+C4": d.C1 & d.C3 & d.C4, "C1+C2+C3+C4": d.C1 & d.C2 & d.C3 & d.C4}

    def riga(x):
        return {"n": int(len(x)), "su": int(x.su.sum()), "quota_su": None if not len(x) else round(float(x.su.mean()), 3),
                "mossa_mediana_pct": None if not len(x) else round(float(x.mv_pct.median()), 3),
                "ampiezza_mediana_pct": None if not len(x) else round(float((x.a_range / x.a_p0 * 100).median()), 3)}

    out = {"n": int(len(d)), "da": str(d.t0.iat[0].date()), "a": str(d.t0.iat[-1].date()), "gruppi": {}}
    for nome, s in gruppi.items():
        x = d[s]
        out["gruppi"][nome] = {"tutti": riga(x), "caldo": riga(x[x.esito > 0]), "in_linea": riga(x[x.esito == 0]), "freddo": riga(x[x.esito < 0])}
    out["casi_C1"] = [{"data": str(r.t0.date()), "core": [r.f_c, r.a_c], "totale": [r.f_h, r.a_h], "esito": int(r.esito), "oro_pct": round(r.mv_pct, 3),
                       "oro_usd": round(r.a_move, 2), "C2": bool(r.C2), "C3": bool(r.C3), "C4": bool(r.C4)} for r in d[d.C1].itertuples()]
    (R / "hx16" / "descr_cpi_simili.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    for nome, v in out["gruppi"].items():
        print(nome, {k: (x["n"], x["su"], x["mossa_mediana_pct"]) for k, x in v.items()})
    for r in out["casi_C1"]:
        print(r)
