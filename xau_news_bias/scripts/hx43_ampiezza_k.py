"""H-X43 (docs/IPOTESI-HX43-AMPIEZZA-ENTRO-K-MINUTI.md): linea verde = ampiezza (massimo - minimo, wick comprese) dei primi
k minuti dopo la NFP, al 75° percentile: l'ampiezza vera la supera circa 1 volta su 4. Stima = stima della candela di
H-X32 (EW3, ADR24, FORM, RIDGE) × 75° percentile di (ampiezza ÷ stima della candela) sulle 24 NFP prima."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx21_range import bars  # noqa: E402
from hx32_ampiezza_nfp import stime  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

NB = 24
KS = [2, 3, 4, 5]
EXTRA = [10, 15]
METODI = ["EW3", "ADR24", "FORM", "RIDGE"]
TAU = 0.75


def perdita(v, q):
    e = np.log(v) - np.log(q)
    return round(float(np.mean(np.maximum(TAU * e, (TAU - 1) * e))), 4)


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx11" / "site.json").read_text())
    st37 = {t["id"] for t in json.loads((R / "hx16" / "hx38_stop_contro.json").read_text())["trade"]}
    a32 = json.loads((R / "hx16" / "hx32_ampiezza_nfp.json").read_text())
    arancio = {c["data"]: c for c in a32["casi_tutti"]} | {c["data"]: c for c in a32["recenti_fuori_dataset"] if "stima" in c}
    full = pd.read_parquet(R / "hx16" / "hx23_dataset.parquet")
    n32 = stime(full)[["t0"] + METODI]
    ds = full[(full.fam == "NFP") & (full.r1 > 0)][["t0", "y", "r1", "adr21", "px"]].copy()
    ev = {e["d"][:10]: e for e in site["ev"] if e["f"] == "NFP" and e["rule"] and e["mv"] != 0 and e["y"] >= 2014 and e["id"] in st37}
    duka = DukascopyProvider()
    extra = []
    for e in ev.values():  # NFP dopo la fine del dataset: r1 e ADR21 come in H-X42
        t0 = pd.Timestamp(e["d"], tz="UTC")
        if t0 <= ds.t0.max():
            continue
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=3))
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        mid = (tk.bid.to_numpy(float) + tk.ask.to_numpy(float)) / 2
        pre, w1 = np.nonzero(t < 0)[0], (t >= 0) & (t < 60_000)
        if len(pre) and w1.sum() >= 5:
            m0 = float(mid[pre[-1]])
            dD = bars(duka.h1_range("XAUUSD", (t0 - pd.Timedelta(days=45)).date(), t0.date()), "D")
            tday = (t0 + pd.Timedelta(hours=2)).normalize().tz_localize(None)
            extra.append({"t0": t0, "y": t0.year, "r1": (max(mid[w1].max(), m0) - min(mid[w1].min(), m0)) / m0 * 100,
                          "adr21": float(dD[dD.index < tday].r.iloc[-21:].mean()), "px": m0})
    ds = pd.concat([ds, pd.DataFrame(extra)], ignore_index=True).sort_values("t0").reset_index(drop=True)
    ds = ds.merge(n32.drop(columns=["EW3", "ADR24"]), on="t0", how="left")
    ds["EW3"] = ds.r1.shift(1).ewm(halflife=3, min_periods=6).mean()
    ds["ADR24"] = (ds.r1 / ds.adr21).shift(1).rolling(NB, min_periods=NB).median() * ds.adr21
    ALL = KS + EXTRA
    amp = {k: [] for k in [1] + ALL}
    for r in ds.itertuples():
        e = ev.get(str(r.t0.date()))
        t0 = pd.Timestamp(e["d"], tz="UTC") if e else r.t0
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=15.5))
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        mid = (tk.bid.to_numpy(float) + tk.ask.to_numpy(float)) / 2
        pre = np.nonzero(t < 0)[0]
        for k in [1] + ALL:
            w = (t >= 0) & (t < k * 60_000)
            if len(t) < 10 or not len(pre) or w.sum() < 5 or t.max() < (k - 0.5) * 60_000:
                amp[k].append(np.nan)
                continue
            m0 = float(mid[pre[-1]])
            amp[k].append((max(mid[w].max(), m0) - min(mid[w].min(), m0)) / m0 * 100)
        print(str(r.t0.date()), round(amp[1][-1], 4) if amp[1][-1] == amp[1][-1] else None, round(amp[5][-1], 4) if amp[5][-1] == amp[5][-1] else None, flush=True)
    ds["a1"] = ds.r1  # k = 1 è la candela del dataset (l'arancione)
    print("misura: ampiezza a 1 minuto dai tick contro r1 del dataset, differenza mediana",
          round(float(np.nanmedian(np.abs(np.array(amp[1]) - ds.r1.to_numpy()))), 5), "%")
    for k in ALL:
        ds[f"a{k}"] = amp[k]
    for k in [1] + ALL:
        for m in METODI:
            rat = (ds[f"a{k}"] / ds[m]).shift(1).rolling(NB, min_periods=NB)
            ds[f"q{k}_{m}"], ds[f"h{k}_{m}"] = ds[m] * rat.quantile(TAU), ds[m] * rat.median()
    ds["d"] = ds.t0.dt.strftime("%Y-%m-%d")
    ds["id"] = ds.d.map(lambda d: ev[d]["id"] if d in ev else None)
    T = ds[ds.id.notna()].copy()
    # controllo: k = 1, EW3, mediana = la linea arancione del sito (H-X32)
    chk = [abs(s.h1_EW3 * s.px / 10 - arancio[s.d]["stima"]) <= 0.51 for s in T.itertuples() if s.d in arancio and s.h1_EW3 == s.h1_EW3]
    print("controllo k=1 EW3 mediana = arancione H-X32:", sum(chk), "su", len(chk))
    cols = [f"q{k}_{m}" for k in ALL for m in METODI] + [f"a{k}" for k in ALL]
    C = T.dropna(subset=cols)
    print("NFP in comune:", len(C), C.t0.min().date(), "→", C.t0.max().date())

    def scheda(k, m, g=C):
        sup = g[f"a{k}"] > g[f"q{k}_{m}"]
        rec = g.y >= 2023
        pips = g[f"q{k}_{m}"] * g.px / 10
        hi = [arancio[d]["hi"] for d in g.d if d in arancio]
        return {"supera_2019_22": round(float(sup[g.y.between(2019, 2022)].mean()), 3), "supera_2023_26": round(float(sup[rec].mean()), 3),
                "perdita_2023_26": perdita(g[f"a{k}"][rec], g[f"q{k}_{m}"][rec]),
                "verde_mediana_pips_2024_26": float(pips[g.y >= 2024].median()),
                "ampiezza_vera_mediana_pips_2024_26": float((g[f"a{k}"] * g.px / 10)[g.y >= 2024].median()),
                "sopra_bordo_alto_arancio": round(float(np.mean([p > h for p, h in zip([p for p, d in zip(pips, g.d) if d in arancio], hi)])), 3)}

    def scegli(ks):
        sc = {(k, m): scheda(k, m) for k in ks for m in METODI}
        cal = [c for c in sc if all(.15 <= sc[c][p] <= .35 for p in ("supera_2019_22", "supera_2023_26"))]
        if not cal:
            return sc, cal, None
        best = min(sc[c]["perdita_2023_26"] for c in cal)
        return sc, cal, next(c for c in sorted(cal, key=lambda c: (c[0], METODI.index(c[1]))) if sc[c]["perdita_2023_26"] - best <= 0.01)
    sc, cal, vince = scegli(KS)
    esteso = False
    if vince and vince[0] == 5:
        esteso = True
        sc, cal, vince = scegli(KS + EXTRA)
    for c, v in sc.items():
        print(c, v, "calibrata" if c in cal else "")
    print("calibrate", cal, "vince", vince, "esteso", esteso)
    out = {"schede": {f"{k}_{m}": v for (k, m), v in sc.items()}, "calibrate": [f"{k}_{m}" for k, m in cal],
           "vince": f"{vince[0]}_{vince[1]}" if vince else None, "esteso": esteso, "n_comune": int(len(C))}
    if vince:
        k, m = vince
        g = T.dropna(subset=[f"a{k}", f"q{k}_{m}"])
        sup = g[f"a{k}"] > g[f"q{k}_{m}"]
        out |= {"k": k, "metodo": m, "anni": {int(y): round(float(s.mean()), 3) for y, s in sup.groupby(g.y)}, "supera": round(float(sup.mean()), 3),
                "per": {s.id: round(float(getattr(s, f"q{k}_{m}") * s.px / 10), 1) for s in g.itertuples()},
                "mediana_per": {s.id: round(float(getattr(s, f"h{k}_{m}") * s.px / 10), 1) for s in g.itertuples()}}
        nx = a32.get("prossima") or {}
        mp = m if m in ("EW3", "ADR24") else min(("EW3", "ADR24"), key=lambda q: sc[(k, q)]["perdita_2023_26"])
        base = float(ds.r1.ewm(halflife=3, min_periods=6).mean().iloc[-1]) if mp == "EW3" else \
            float((ds.r1 / ds.adr21).dropna().iloc[-NB:].median() * nx["adr21_pct"])
        rq = float((ds[f"a{k}"] / ds[mp]).dropna().iloc[-NB:].quantile(TAU))
        out["prossima"] = {"metodo": mp, "ultima_nfp": str(ds.t0.iloc[-1].date()), "pct": round(base * rq, 5)}
        if mp == "ADR24":  # il sito lo ricalcola ogni ora: pct = coef × ADR21 di oggi
            out["prossima"] |= {"coef": round(base / nx["adr21_pct"] * rq, 5), "adr21_pct": nx["adr21_pct"]}
        if nx.get("prezzo"):
            out["prossima"]["pips"] = round(out["prossima"]["pct"] / 100 * nx["prezzo"] * 10)
        print("anni", out["anni"], "supera", out["supera"], "prossima", out["prossima"], "arancione hx32", nx.get("stima"), nx.get("hi"))
    (R / "hx16" / "hx43_ampiezza_k.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
