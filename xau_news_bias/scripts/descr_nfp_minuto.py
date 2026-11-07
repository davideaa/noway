"""Descrittivo (docs/DESCRITTIVO-NFP-AL-MINUTO-E-SETTIMANA-PRIMA.md): per ogni NFP dal 2015, escursioni e verso dell'oro
al minuto (Dukascopy bid) e condizioni della settimana prima; gruppi, legame con la volatilità, verso, previsione al
prezzo di oggi e confronto coi numeri di Fusion. Scrive research_output/phase2/hx16/descr_nfp_minuto.json e .csv."""
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import binomtest  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

SYM, NY, PREZZO_OGGI = "XAUUSD", "America/New_York", 3930.0
FIN = {"m1": 1, "m5": 5, "m15": 15, "m60": 60}  # minuti dalle 8:30
ESC = ["m1", "m5", "m15", "m60", "h2", "giorno"]  # h2 = dalle 8:00 alle 9:59, per il confronto con Fusion
R = get_settings().research_dir / "phase2"


def giorno_broker(idx):
    """Giorno del broker: dalle 17:00 di New York del giorno prima alle 17:00 del giorno stesso."""
    return (idx.tz_convert(NY) + pd.Timedelta(hours=7)).date


def giorni(duka, da, a):
    h = duka.h1_range(SYM, da, a)
    g = h.groupby(giorno_broker(h.index))
    d = pd.DataFrame({"o": g.o.first(), "h": g.h.max(), "l": g.l.min(), "c": g.c.last(), "n": g.o.size()})
    d = d[d.n >= 4]
    d["rng"] = (d.h - d.l) / d.c * 100
    return d


def prima(d, giorno):
    """Condizioni della settimana prima, alla chiusura del giorno prima di `giorno`."""
    p = d[d.index < giorno]
    if len(p) < 26:
        return None
    v5, v20 = p.rng.iloc[-5:].mean(), p.rng.iloc[-25:-5].mean()
    chg = (p.c.iloc[-1] / p.c.iloc[-6] - 1) * 100
    return {"vol5": v5, "vol20": v20, "rapporto": v5 / v20, "chg5": chg,
            "vol": "in salita" if v5 / v20 >= 1.25 else "normale",
            "verso": "in calo" if chg < -2 else "in rialzo" if chg > 2 else "piatta"}


def nfp_lista():
    cn = pd.read_parquet(R / "hx15" / "cpi_nfp.parquet")
    t = pd.to_datetime(cn[cn.fam == "NFP"].t0)
    t = t.dt.tz_localize("UTC") if t.dt.tz is None else t.dt.tz_convert("UTC")
    site = json.loads((R / "hx11" / "site.json").read_text())
    extra = [pd.Timestamp(e["d"], tz="UTC") for e in site["ev"] if e["f"] == "NFP"]
    tt = sorted({x for x in list(t) + extra if x >= pd.Timestamp("2015-01-01", tz="UTC")})
    for x in tt:
        assert (x.tz_convert(NY).hour, x.tz_convert(NY).minute) == (8, 30), x
    return tt


def misura(duka, t0):
    ny = t0.tz_convert(NY)
    s0 = pd.Timestamp(ny.date() - timedelta(days=1)).tz_localize(NY) + pd.Timedelta(hours=17)
    s1 = pd.Timestamp(ny.date()).tz_localize(NY) + pd.Timedelta(hours=17)
    m = duka.m1_range(SYM, (t0 - pd.Timedelta(days=1)).date(), t0.date())
    if m.empty or t0 not in m.index:
        return None
    m = m[(m.index >= s0) & (m.index < s1)]
    if len(m[(m.index >= t0) & (m.index < t0 + pd.Timedelta(minutes=60))]) < 40:
        return None
    p0 = m.loc[t0, "o"]
    out = {"p0": p0}
    win = {k: (t0, t0 + pd.Timedelta(minutes=n)) for k, n in FIN.items()}
    win["h2"] = (t0 - pd.Timedelta(minutes=30), t0 + pd.Timedelta(minutes=90))
    win["giorno"] = (s0, s1)
    for k, (a, b) in win.items():
        w = m[(m.index >= a) & (m.index < b)]
        out[k] = w.h.max() - w.l.min()
        out[k + "_pct"] = out[k] / p0 * 100
    for k, n in (("m1", 1), ("m15", 15), ("m60", 60)):
        c = m[m.index < t0 + pd.Timedelta(minutes=n)].c.iloc[-1]
        out["v_" + k] = float(np.sign(c - p0))
        out["d_" + k] = c - p0
    out["v_fine"] = float(np.sign(m.c.iloc[-1] - p0))
    out["d_fine"] = m.c.iloc[-1] - p0
    out["v_giorno"] = float(np.sign(m.c.iloc[-1] - m.o.iloc[0]))  # candela del giorno: chiusura contro apertura
    out["falsa"] = bool(out["v_m1"] != 0 and out["v_m60"] == -out["v_m1"] and abs(out["d_m60"]) >= abs(out["d_m1"]))
    return out


def stat(s):
    s = s.dropna()
    if not len(s):
        return None
    oggi = lambda v: round(float(v) / 100 * PREZZO_OGGI, 1)  # noqa: E731
    return {"n": int(len(s)), "media_pct": round(float(s.mean()), 3), "mediana_pct": round(float(s.median()), 3),
            "q90_pct": round(float(s.quantile(0.9)), 3), "max_pct": round(float(s.max()), 3),
            "oggi_media": oggi(s.mean()), "oggi_mediana": oggi(s.median()), "oggi_q90": oggi(s.quantile(0.9)), "oggi_max": oggi(s.max())}


def quota(x, n):
    return {"x": int(x), "n": int(n), "quota": round(x / n, 3) if n else None,
            "p": round(float(binomtest(int(x), int(n), 0.5).pvalue), 4) if n else None}


if __name__ == "__main__":
    duka = DukascopyProvider()
    oggi = date.today()
    D = giorni(duka, date(2014, 10, 1), oggi)
    rows = []
    for t0 in nfp_lista():
        g = giorno_broker(pd.DatetimeIndex([t0]))[0]
        r = misura(duka, t0)
        if r is None:
            print("senza candele:", t0.tz_convert(NY), flush=True)
            rows.append({"data": str(g), "manca": True})
            continue
        rows.append({"data": str(g), "anno": g.year, "manca": False, **r, **(prima(D, g) or {})})
        print(g, round(r["m1"], 1), round(r["giorno"], 1), flush=True)
    df = pd.DataFrame(rows)
    mancano = df[df.manca].data.tolist()
    df = df[~df.manca].copy()
    df.to_csv(R / "hx16" / "descr_nfp_minuto.csv", index=False)

    # gruppi
    G = {"tutte": df.index == df.index, "vol in salita": df.vol == "in salita", "vol normale": df.vol == "normale",
         "settimana in calo": df.verso == "in calo", "settimana in rialzo": df.verso == "in rialzo", "settimana piatta": df.verso == "piatta",
         "in salita e in calo": (df.vol == "in salita") & (df.verso == "in calo"),
         "ultimi 3 anni": df.data >= "2023-11-01", "ultimi 3 anni, vol in salita": (df.data >= "2023-11-01") & (df.vol == "in salita")}
    gruppi = {n: {k: stat(df.loc[m, k + "_pct"]) for k in ESC} for n, m in G.items()}
    periodi = {p: {k: stat(df.loc[df.anno.between(a, b), k + "_pct"]) for k in ("m1", "m60", "giorno")}
               for p, (a, b) in {"2015-19": (2015, 2019), "2020-23": (2020, 2023), "2024-26": (2024, 2026)}.items()}
    lega = {k: round(float(df[["vol5", k + "_pct"]].corr(method="spearman").iloc[0, 1]), 3) for k in ESC}
    lega_rapporto = {k: round(float(df[["rapporto", k + "_pct"]].corr(method="spearman").iloc[0, 1]), 3) for k in ESC}

    # verso
    vs = np.sign(df.chg5)
    forte = df.chg5.abs() > 2
    nz = lambda a, b: (a != 0) & (b != 0)  # noqa: E731
    V = {}
    k = nz(df.v_m1, vs)
    V["1° minuto segue la settimana prima"] = quota((df.v_m1 == vs)[k].sum(), k.sum())
    k2 = k & forte
    V["1° minuto segue la settimana prima, solo settimane oltre ±2%"] = quota((df.v_m1 == vs)[k2].sum(), k2.sum())
    k = nz(df.v_m15, vs)
    V["primi 15 minuti seguono la settimana prima"] = quota((df.v_m15 == vs)[k].sum(), k.sum())
    for a, b in (("m1", "m60"), ("m1", "fine"), ("m15", "m60"), ("m15", "fine")):
        k = nz(df["v_" + a], df["v_" + b])
        V[f"verso {a} uguale a {b}"] = quota((df["v_" + a] == df["v_" + b])[k].sum(), k.sum())
    cal = df.verso == "in calo"
    V["settimana in calo: giorno NFP chiude in rialzo (candela del giorno)"] = quota((df.v_giorno[cal] > 0).sum(), (df.v_giorno[cal] != 0).sum())
    V["settimana in calo: dalle 8:30 a fine giornata in rialzo"] = quota((df.v_fine[cal] > 0).sum(), (df.v_fine[cal] != 0).sum())
    ss = (df.vol == "in salita") & cal
    V["in salita e in calo: giorno NFP chiude in rialzo"] = quota((df.v_giorno[ss] > 0).sum(), (df.v_giorno[ss] != 0).sum())
    V["tutte: giorno NFP chiude in rialzo"] = quota((df.v_giorno > 0).sum(), (df.v_giorno != 0).sum())
    V["tutte: 1° minuto in rialzo"] = quota((df.v_m1 > 0).sum(), (df.v_m1 != 0).sum())
    V["settimana in calo: 1° minuto in rialzo"] = quota((df.v_m1[cal] > 0).sum(), (df.v_m1[cal] != 0).sum())
    segnali = [n for n, q in V.items() if q["n"] >= 30 and q["p"] is not None and q["p"] < 0.005]
    falsa = {"falsa partenza": quota(df.falsa.sum(), (df.v_m1 != 0).sum()),
             "a 60 minuti girato": quota(((df.v_m60 == -df.v_m1) & (df.v_m1 != 0)).sum(), (df.v_m1 != 0).sum())}

    # Fusion: dal 2019, in $ ai prezzi di allora
    f = df[df.anno >= 2019]
    fs = lambda s: {"n": int(s.notna().sum()), "media": round(float(s.mean()), 1), "q90": round(float(s.quantile(0.9)), 1)}  # noqa: E731
    fusion = {"tutte": {k: fs(f[k]) for k in ("m1", "m15", "h2", "giorno")},
              "vol in salita": {k: fs(f.loc[f.vol == "in salita", k]) for k in ("h2", "giorno")},
              "ultime 3": f.tail(3)[["data", "m1"]].round(1).values.tolist()}
    k = nz(f.v_m15, np.sign(f.chg5))
    fusion["15 minuti seguono la settimana prima"] = quota((f.v_m15 == np.sign(f.chg5))[k].sum(), k.sum())
    k = nz(f.v_m15, f.v_m60)
    fusion["15 minuti stesso verso dopo 60"] = quota((f.v_m15 == f.v_m60)[k].sum(), k.sum())
    c19 = f.verso == "in calo"
    fusion["settimana in calo: giorno in rialzo"] = quota((f.v_giorno[c19] > 0).sum(), (f.v_giorno[c19] != 0).sum())

    # condizioni di adesso: ultimi giorni completi
    fatti = D[D.index < oggi]
    ora = prima(D, oggi)
    ult = fatti.tail(6)
    adesso = {"ultimo_giorno": str(fatti.index[-1]), "prezzo": round(float(fatti.c.iloc[-1]), 2), **{k: round(v, 3) if isinstance(v, float) else v for k, v in ora.items()},
              "ultimi_giorni": [[str(i), round(float(r.c), 2), round(float(r.h - r.l), 1), round(float(r.rng), 2)] for i, r in ult.iterrows()]}
    base = "vol in salita" if gruppi["vol in salita"]["m1"]["n"] >= 15 else "tutte"
    prev = {k: {"gruppo": base, "normale": gruppi[base][k]["oggi_mediana"], "1 su 10": gruppi[base][k]["oggi_q90"],
                "in salita e in calo": [gruppi["in salita e in calo"][k]["oggi_mediana"], gruppi["in salita e in calo"][k]["oggi_q90"]],
                "ultimi 3 anni, vol in salita": [gruppi["ultimi 3 anni, vol in salita"][k]["oggi_mediana"], gruppi["ultimi 3 anni, vol in salita"][k]["oggi_q90"]]}
            for k in ("m1", "m15", "m60", "giorno")}
    out = {"n": int(len(df)), "mancano": mancano, "prima": str(df.data.min()), "ultima": str(df.data.max()), "gruppi": gruppi, "periodi": periodi,
           "spearman_vol5": lega, "spearman_rapporto": lega_rapporto, "verso": V, "segnali": segnali, "falsa": falsa,
           "fusion": fusion, "adesso": adesso, "previsione": prev}
    (R / "hx16" / "descr_nfp_minuto.json").write_text(json.dumps(out, indent=1, ensure_ascii=False, default=float), encoding="utf-8")
    print(json.dumps({k: out[k] for k in ("n", "mancano", "spearman_vol5", "segnali", "falsa", "adesso", "previsione")}, indent=1, ensure_ascii=False, default=float))
