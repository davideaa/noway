"""H-X34 (docs/IPOTESI-HX34-VOLATILITA-NEL-TEMPO.md): la volatilità nel tempo, il mese dopo, la NFP aggregata, le esplosioni."""
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx21_range import bars  # noqa: E402
from hx32_ampiezza_nfp import fascia, stime  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
PER3 = {"2011-18": (2011, 2018), "2019-22": (2019, 2022), "2023-26": (2023, 2026)}
PER2 = {"2011-18": (2011, 2018), "2019-26": (2019, 2026)}


def err(v, s):
    v, s = np.asarray(v, float), np.asarray(s, float)
    ok = np.isfinite(v) & np.isfinite(s) & (v > 0) & (s > 0)
    return round(float(np.median(np.abs(np.log(v[ok] / s[ok])))), 3) if ok.any() else None


def mese(b: pd.DataFrame) -> pd.DataFrame:
    m = b.index.to_period("M")
    g = b.assign(pips=(b.h - b.l) * 10).groupby(m)
    M = pd.DataFrame({"V": g.r.mean(), "Vp": g.pips.mean(), "px": g.c.last(), "giorni": g.size()})
    ew = b.r.ewm(halflife=21).mean()
    M["P2"] = ew.groupby(m).last()           # media esponenziale alla fine del mese
    return M


def m1(b: pd.DataFrame, M: pd.DataFrame) -> dict:
    M = M[M.giorni >= 15]
    nxt, p1, p2 = M.V.shift(-1), M.V, M.P2
    per = M.index.year + (M.index.month == 12)    # anno del mese stimato
    # 3 mesi dopo: media dei giorni dei 3 mesi successivi
    r3 = pd.Series([b.r[(b.index.to_period("M") > p) & (b.index.to_period("M") <= p + 3)].mean() if p + 3 <= M.index[-1] else np.nan
                    for p in M.index], index=M.index)
    out = {}
    for k, (a, z) in PER3.items():
        s = (per >= a) & (per <= z)
        out[k] = {"mesi": int(s.sum()), "P1_mese": err(nxt[s], p1[s]), "P2_mese": err(nxt[s], p2[s]),
                  "P1_3mesi": err(r3[s], p1[s]), "P2_3mesi": err(r3[s], p2[s])}
    return out


def m2() -> dict:
    d = pd.read_parquet(get_settings().research_dir / "phase2" / "hx16" / "hx23_dataset.parquet")
    n = stime(d)
    f = fascia(n, "EW3")
    n["est"] = f.stima
    n = n[n.est.notna()].reset_index(drop=True)
    mv, me = n.r1.rolling(6).median(), n.est.rolling(6).median()
    out = {}
    for k, (a, z) in {"2019-22": (2019, 2022), "2023-26": (2023, 2026)}.items():
        s = n.y.between(a, z)
        out[k] = {"nfp": int(s.sum()), "singola": err(n.r1[s], n.est[s]), "mediana_di_6": err(mv[s], me[s])}
    yy = n[n.y >= 2016].groupby("y").agg(vera=("r1", "median"), stima=("est", "median"), px=("px", "median"))
    out["per_anno"] = {int(y): {"vera_pips": round(r.vera * r.px / 10), "stima_pips": round(r.stima * r.px / 10),
                                "errore": round(float(abs(np.log(r.vera / r.stima))), 3)} for y, r in yy.iterrows()}
    out["anno_errore_mediano"] = {k: round(float(np.median([v["errore"] for y, v in out["per_anno"].items() if a <= y <= z])), 3)
                                  for k, (a, z) in {"2019-22": (2019, 2022), "2023-26": (2023, 2026)}.items()}
    return out, n


def m3(b: pd.DataFrame) -> tuple[dict, pd.DataFrame]:
    r = b.r.reset_index(drop=True)
    days = b.index
    g = pd.read_csv(ROOT / "data" / "cache" / "cboe" / "GVZCLS.csv")
    gvz = pd.Series(pd.to_numeric(g.GVZCLS, errors="coerce").values, index=pd.to_datetime(g.observation_date)).dropna()
    ends = pd.Series(range(len(days)), index=days).groupby(days.to_period("M")).last()
    rows = []
    for p, i in ends.items():
        if i < 146 or i + 21 >= len(r):
            continue
        past21, prev126, base126, next21 = r[i - 20:i + 1].mean(), r[i - 146:i - 20].mean(), r[i - 125:i + 1].mean(), r[i + 1:i + 22].mean()
        gv = gvz[gvz.index <= days[i]]
        w2 = bool(len(gv) > 252 and gv.iat[-1] >= 1.2 * gv.iloc[-253:-1].median())
        rows.append({"mese": str(p), "y": p.year, "E": bool(next21 >= 1.5 * base126), "W1": bool(past21 >= 1.2 * prev126), "W2": w2,
                     "rapporto_dopo": round(float(next21 / base126), 2)})
    c = pd.DataFrame(rows)
    out = {}
    for k, (a, z) in PER2.items():
        s = c[c.y.between(a, z)]
        out[k] = {"controlli": int(len(s)), "esplosioni": int(s.E.sum()), "base": round(float(s.E.mean()), 3)}
        for w in ("W1", "W2"):
            on, off = s[s[w]], s[~s[w]]
            out[k][w] = {"segnali": int(len(on)), "esplosioni_col_segnale": round(float(on.E.mean()), 3) if len(on) else None,
                         "esplosioni_senza": round(float(off.E.mean()), 3) if len(off) else None,
                         "annunciate": int((s.E & s[w]).sum())}
    for w in ("W1", "W2"):
        out[w + "_funziona"] = bool(all(out[k]["esplosioni"] >= 5 and out[k][w]["esplosioni_col_segnale"] is not None
                                        and out[k][w]["esplosioni_senza"] is not None
                                        and out[k][w]["esplosioni_col_segnale"] >= 2 * out[k][w]["esplosioni_senza"] for k in PER2))
    return out, c


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    h1 = DukascopyProvider().h1_range("XAUUSD", date(2010, 11, 1), date(2026, 10, 16))
    b = bars(h1, "D")
    b = b[b.index < b.index[-1]]                      # l'ultimo giorno può essere incompleto
    M = mese(b)
    o1 = m1(b, M)
    o2, n = m2()
    o3, c = m3(b)
    M1ok = bool(any(all(o1[k][p] is not None and o1[k][p] <= .15 for k in PER3) for p in ("P1_mese", "P2_mese")))
    d = pd.read_parquet(R / "hx23_dataset.parquet")
    news = d[d.fam.isin(["NFP", "RETAIL", "PPI"]) & (d.r1 > 0) & (d.y >= 2011)]
    E = set(pd.Period(x) + 1 for x in c.mese[c.E])
    serie = [{"m": str(p), "V": round(float(r.V), 3), "Vp": round(float(r.Vp)), "px": round(float(r.px), 1), "P1": round(float(M.V.shift(1).get(p, np.nan)), 3)
              if p > M.index[0] else None, "giorni": int(r.giorni), "esplosione": p in E} for p, r in M.iterrows()]
    est = dict(zip(n.t0.dt.strftime("%Y-%m-%d"), n.est))
    punti = [{"d": t.strftime("%Y-%m-%d"), "f": "NFP" if f == "NFP" else "RP", "pct": round(float(v), 4), "pips": round(float(v * px / 10)),
              **({"stima": round(float(est[t.strftime("%Y-%m-%d")] * px / 10))} if f == "NFP" and t.strftime("%Y-%m-%d") in est else {})}
             for t, f, v, px in zip(news.t0, news.fam, news.r1, news.px)]
    out = {"M1_mese_dopo": o1, "M1_prevedibile": M1ok, "M2_nfp_nel_tempo": o2, "M3_esplosioni": o3,
           "esplosioni": c[c.E].mese.tolist(), "serie_mese": serie, "news": punti}
    (R / "hx34_volatilita_tempo.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    print(json.dumps({k: out[k] for k in ("M1_mese_dopo", "M1_prevedibile", "M3_esplosioni")}, indent=1))
    print(json.dumps({k: v for k, v in o2.items()}, indent=1))
    print("esplosioni", out["esplosioni"])
