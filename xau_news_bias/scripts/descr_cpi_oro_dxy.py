"""Descrittivo (nessuna regola, nessuna decisione): quanto si muovono oro e indice del dollaro nel primo minuto dopo il CPI.
Chiesto da Davide il 10/11/2026 prima del CPI di ottobre. Oro: prima candela M1 con le wick in % del prezzo (come hx23),
stima EW3 con fascia 25-75 fatta come per la NFP in hx32 ma MAI provata sul CPI: qui si conta solo quante volte ci stava dentro.
Dollaro: DXY ricostruito dai tick delle sei valute (formula ICE), CPI dal 2025.

Uso: python scripts/descr_cpi_oro_dxy.py"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx18_inversione import fetch_retry  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DXY_CONST, DXY_WEIGHTS, DukascopyProvider  # noqa: E402

NB = 24
DA_DXY = pd.Timestamp("2025-01-01", tz="UTC")


def oro(t0):
    z = np.load(fetch_retry(t0))
    t, mid = z["t"], (z["bid"] + z["ask"]) / 2
    pre, w = np.nonzero(t < 0)[0], (t >= 0) & (t < 60_000)
    if not len(pre) or w.sum() < 5:
        return None
    m0 = float(mid[pre[-1]])
    return {"px": m0, "r1": (max(mid[w].max(), m0) - min(mid[w].min(), m0)) / m0 * 100, "mv_pct": (float(mid[w][-1]) - m0) / m0 * 100}


def dxy(duka, t0):
    """DXY sintetico su griglia da 1 s, da 60 s prima a 60 s dopo; None se manca una valuta."""
    griglia = np.arange(-60_000, 60_001, 1000)
    logv = np.full(len(griglia), np.log(DXY_CONST))
    eur = None
    for s, w in DXY_WEIGHTS.items():
        tk = None
        for _ in range(6):
            try:
                tk = duka.ticks(s, (t0 - pd.Timedelta(minutes=3)).to_pydatetime(), (t0 + pd.Timedelta(minutes=3)).to_pydatetime())
                break
            except Exception:  # noqa: BLE001  (503 del datafeed)
                import time
                time.sleep(20)
        if tk is None or len(tk) < 10:
            return None
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        mid = ((tk.bid + tk.ask) / 2).to_numpy(float)
        j = np.searchsorted(t, griglia, side="right") - 1
        if j.min() < 0:
            return None
        v = mid[j]
        logv += w * np.log(v)
        if s == "EURUSD":
            eur = v
    x = np.exp(logv)
    i0 = 59  # ultimo valore prima della news (griglia a -1 s)
    pre, fin = x[i0], x[i0 + 1: i0 + 61]
    return {"dxy": float(pre), "dxy_r1": float((max(fin.max(), pre) - min(fin.min(), pre)) / pre * 100),
            "dxy_mv": float((fin[-1] - pre) / pre * 100), "eur_mv_pips": float((eur[i0 + 60] - eur[i0]) * 1e4)}


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    d = pd.read_parquet(R / "hx16" / "hx23_dataset.parquet")
    c = d[(d.fam == "CPI") & (d.r1 > 0)].sort_values("t0")[["t0", "r1", "dir", "px"]].reset_index(drop=True)
    ev = json.loads((R / "hx11" / "site.json").read_text(encoding="utf-8"))["ev"]
    nuovi = [pd.Timestamp(e["d"], tz="UTC") for e in ev if e["f"] == "CPI" and pd.Timestamp(e["d"], tz="UTC") > c.t0.iat[-1]]
    for t0 in nuovi:
        o = oro(t0)
        if o:
            c.loc[len(c)] = [t0, o["r1"], int(np.sign(o["mv_pct"])), o["px"]]
    # stima EW3 con fascia 25-75, come hx32 per la NFP; l'ultima riga aggiunta è la release di oggi (solo stima)
    c.loc[len(c)] = [pd.NaT, np.nan, 0, np.nan]
    c["t0"] = pd.to_datetime(c.t0, utc=True)
    prev = c.r1.shift(1)
    c["ew3"] = prev.ewm(halflife=3, min_periods=6).mean()
    rat = (c.r1 / c.ew3).where(c.ew3.notna())
    for nome, q in (("med", .5), ("q25", .25), ("q75", .75), ("q90", .9)):
        c[nome] = rat.shift(1).rolling(NB, min_periods=NB).quantile(q)
    c["stima"], c["lo"], c["hi"], c["hi90"] = c.ew3 * c.med, c.ew3 * c.q25, c.ew3 * c.q75, c.ew3 * c.q90
    ok = c.r1.notna() & c.stima.notna()
    cop = {}
    for nome, (a, b) in {"2019-22": (2019, 2022), "2023-26": (2023, 2026)}.items():
        s = ok & c.t0.dt.year.between(a, b)
        cop[nome] = {"n": int(s.sum()), "dentro_25_75": round(float(((c.r1 >= c.lo) & (c.r1 <= c.hi))[s].mean()), 3),
                     "sopra_q90": round(float((c.r1 > c.hi90)[s].mean()), 3)}
    oggi = c.iloc[-1]
    out = {"n_cpi": int(ok.sum()), "copertura_fascia": cop,
           "oggi_pct": {k: round(float(oggi[k]), 4) for k in ("stima", "lo", "hi", "hi90")},
           "ultime": [{"data": str(r.t0.date()), "r1_pct": round(r.r1, 3), "pips": round(r.r1 * r.px / 10), "dir": int(r.dir),
                       "stima_pips": None if pd.isna(r.stima) else round(r.stima * r.px / 10)} for r in c[c.r1.notna()].tail(12).itertuples()]}
    print(json.dumps(out, indent=1, ensure_ascii=False), flush=True)
    duka = DukascopyProvider()
    righe = []
    for r in c[c.r1.notna() & (c.t0 >= DA_DXY)].itertuples():
        x = dxy(duka, r.t0)
        if x is None:
            print("niente DXY", r.t0, flush=True)
            continue
        righe.append({"data": str(r.t0.date()), "oro_r1_pct": round(r.r1, 3), "oro_dir": int(r.dir), **{k: round(v, 4) for k, v in x.items()}})
        print(righe[-1], flush=True)
    g = pd.DataFrame(righe)
    if len(g):
        out["dxy"] = {"n": len(g), "r1_pct_mediana": round(float(g.dxy_r1.median()), 4), "r1_pct_q75": round(float(g.dxy_r1.quantile(.75)), 4),
                      "r1_pct_max": round(float(g.dxy_r1.max()), 4), "verso_opposto_all_oro": int((np.sign(g.dxy_mv) == -g.oro_dir).sum()),
                      "rapporto_oro_su_dxy_mediana": round(float((g.oro_r1_pct / g.dxy_r1).median()), 2), "righe": righe}
    (R / "hx16" / "descr_cpi_oro_dxy.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(out.get("dxy", {}), indent=1, ensure_ascii=False)[:1500])
