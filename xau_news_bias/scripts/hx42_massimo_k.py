"""H-X42 (docs/IPOTESI-HX42-MASSIMO-ENTRO-K-MINUTI.md, con emendamento 1): linea verde = massimo con la wick, dal lato
giusto, entro k minuti (1-5, poi 10 e 15 se vince il bordo). Stima = stima della candela di H-X32 (EW3, ADR24, FORM,
RIDGE) × mediana di (massimo ÷ stima della candela) sulle 24 NFP prima."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import first_minute_move  # noqa: E402
from hx32_ampiezza_nfp import stime  # noqa: E402
from hx38_stop_contro import s4  # noqa: E402
from hx41_be_tp import entrata, fav_fino  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

NB = 24
KS = [1, 2, 3, 4, 5]
EXTRA = [10, 15]
METODI = ["EW3", "ADR24", "FORM", "RIDGE"]


def errore(v, st, en):
    v = np.maximum(v, 0.1 / en * 100)  # almeno 1 pip
    return round(float(np.median(np.abs(np.log(v / st)))), 3)


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx11" / "site.json").read_text())
    st37 = {t["id"] for t in json.loads((R / "hx16" / "hx38_stop_contro.json").read_text())["trade"]}
    h41 = {e["id"]: e for e in json.loads((R / "hx16" / "hx41_be_tp.json").read_text())["eventi"] if e["f"] == "NFP"}
    arancio = {t["id"]: t["stima"] for t in json.loads((R / "hx16" / "hx37_stop_candela.json").read_text())["trade"]}
    full = pd.read_parquet(R / "hx16" / "hx23_dataset.parquet")
    n32 = stime(full)[["t0"] + METODI]  # stime della candela di H-X32, NFP per NFP
    ds = full[(full.fam == "NFP") & (full.r1 > 0)][["t0", "y", "r1"]].copy()
    ev = {e["d"][:10]: e for e in site["ev"] if e["f"] == "NFP" and e["rule"] and e["mv"] != 0 and e["y"] >= 2014 and e["id"] in st37}
    duka = DukascopyProvider()
    extra = []
    for e in ev.values():  # NFP dopo la fine del dataset: r1 dai tick, come H-X41 (solo EW3 la può stimare)
        t0 = pd.Timestamp(e["d"], tz="UTC")
        if t0 <= ds.t0.max():
            continue
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=3))
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        mid = (tk.bid.to_numpy(float) + tk.ask.to_numpy(float)) / 2
        pre, w1 = np.nonzero(t < 0)[0], (t >= 0) & (t < 60_000)
        if len(pre) and w1.sum() >= 5:
            m0 = float(mid[pre[-1]])
            extra.append({"t0": t0, "y": t0.year, "r1": (max(mid[w1].max(), m0) - min(mid[w1].min(), m0)) / m0 * 100})
    ds = pd.concat([ds, pd.DataFrame(extra)], ignore_index=True).sort_values("t0").reset_index(drop=True)
    ds = ds.merge(n32.drop(columns="EW3"), on="t0", how="left")
    ds["EW3"] = ds.r1.shift(1).ewm(halflife=3, min_periods=6).mean()  # come H-X32, con le NFP fuori dal dataset
    ALL = KS + EXTRA
    mx = {k: [] for k in ALL}
    en_rule, ids = [], []
    for r in ds.itertuples():
        e = ev.get(str(r.t0.date()))
        t0 = pd.Timestamp(e["d"], tz="UTC") if e else r.t0
        tk = duka.ticks("XAUUSD", t0.to_pydatetime() - pd.Timedelta(minutes=3), t0.to_pydatetime() + pd.Timedelta(minutes=15.5))
        t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
        ok = len(t) >= 10 and t.min() <= -60_000 and t.max() >= 30_000
        if ok:
            bid, ask = tk.bid.to_numpy(float), tk.ask.to_numpy(float)
            b, a = s4(t, bid, ask)
            mv = e["mv"] if e else first_minute_move(t, bid, ask)
            ok = mv != 0
        ids.append(e["id"] if e else None)
        if not ok:
            for k in ALL:
                mx[k].append(np.nan)
            en_rule.append(np.nan)
            continue
        dw = 1 if mv > 0 else -1
        for k in ALL:
            f, _, _, en = fav_fino(t, b, a, dw, k * 60_000)
            mx[k].append(max(float(f.max()), 0.0) / en * 100 if t.max() >= (k - 0.5) * 60_000 else np.nan)
        en_rule.append(entrata(t, b, a, 1 if e and e["rule"] == "LONG" else -1)[1] if e else np.nan)
        print(str(r.t0.date()), round(mx[1][-1], 4), round(mx[5][-1], 4), flush=True)
    ds["id"], ds["en"] = ids, en_rule
    for k in ALL:
        ds[f"m{k}"] = mx[k]
        for m in METODI:
            ds[f"s{k}_{m}"] = ds[m] * (ds[f"m{k}"] / ds[m]).shift(1).rolling(NB, min_periods=NB).median()
    T = ds[ds.id.notna()].copy()
    # controllo: k = 1 con EW3 è la verde di H-X41
    chk = [abs(s.s1_EW3 / 100 * s.en * 10 - h41[s.id]["verde_pips"]) < 0.06 for s in T.itertuples() if s.id in h41 and s.s1_EW3 == s.s1_EW3]
    print("controllo k=1 EW3 = verde H-X41:", sum(chk), "su", len(chk))
    cols = [f"s{k}_{m}" for k in ALL for m in METODI] + [f"m{k}" for k in ALL]
    C = T.dropna(subset=cols)  # NFP dove tutte le coppie hanno la stima
    print("NFP in comune:", len(C), C.t0.min().date(), "→", C.t0.max().date())

    def scheda(k, m, g=C):
        hit = g[f"m{k}"] >= g[f"s{k}_{m}"]
        rec = g.y >= 2023
        pips = g[f"s{k}_{m}"] / 100 * g.en * 10
        return {"calib_2019_22": round(float(hit[g.y.between(2019, 2022)].mean()), 3), "calib_2023_26": round(float(hit[rec].mean()), 3),
                "errore_2023_26": errore(g[f"m{k}"][rec], g[f"s{k}_{m}"][rec], g.en[rec]),
                "stima_mediana_pips_2024_26": float(pips[g.y >= 2024].median()),
                "vero_mediano_pips_2024_26": float((g[f"m{k}"] / 100 * g.en * 10)[g.y >= 2024].median()),
                "sopra_arancio": round(float(np.mean([p > arancio[i] for p, i in zip(pips, g.id) if i in arancio])), 3)}

    def scegli(ks):
        sc = {(k, m): scheda(k, m) for k in ks for m in METODI}
        cal = [c for c in sc if all(.40 <= sc[c][p] <= .60 for p in ("calib_2019_22", "calib_2023_26"))]
        if not cal:
            return sc, cal, None
        best = min(sc[c]["errore_2023_26"] for c in cal)
        return sc, cal, next(c for c in sorted(cal, key=lambda c: (c[0], METODI.index(c[1]))) if sc[c]["errore_2023_26"] - best <= 0.02)
    sc, cal, vince = scegli(KS)
    esteso = False
    if vince and vince[0] == 5:
        esteso = True
        sc, cal, vince = scegli(KS + EXTRA)
    for c, v in sc.items():
        print(c, v, "calibrata" if c in cal else "")
    print("calibrate", cal, "vince", vince, "esteso", esteso)
    # solo descrittivo: EW3 su tutto il 2014-26, periodi di H-X41
    descr = {}
    for k in ALL:
        g = T.dropna(subset=[f"m{k}", f"s{k}_EW3"])
        hit = g[f"m{k}"] >= g[f"s{k}_EW3"]
        descr[k] = {"calib_2014_19": round(float(hit[g.y <= 2019].mean()), 3), "calib_2020_26": round(float(hit[g.y >= 2020].mean()), 3),
                    "sopra_arancio": round(float(np.mean([p > arancio[i] for p, i in zip(g[f"s{k}_EW3"] / 100 * g.en * 10, g.id) if i in arancio])), 3)}
    print("EW3 descrittivo", descr)
    out = {"schede": {f"{k}_{m}": v for (k, m), v in sc.items()}, "calibrate": [f"{k}_{m}" for k, m in cal],
           "vince": f"{vince[0]}_{vince[1]}" if vince else None, "esteso": esteso, "ew3_descrittivo": descr, "n_comune": int(len(C))}
    if vince:
        k, m = vince
        g = T.dropna(subset=[f"m{k}", f"s{k}_{m}"])
        hit = g[f"m{k}"] >= g[f"s{k}_{m}"]
        out |= {"k": k, "metodo": m, "anni": {int(y): round(float(h.mean()), 3) for y, h in hit.groupby(g.y)},
                "per": {s.id: round(float(getattr(s, f"s{k}_{m}") / 100 * s.en * 10), 1) for s in g.itertuples()},
                "tocca": round(float(hit.mean()), 3)}
        nx = json.loads((R / "hx16" / "hx32_ampiezza_nfp.json").read_text()).get("prossima") or {}
        mp = m if m in ("EW3", "ADR24") else min(("EW3", "ADR24"), key=lambda q: sc[(k, q)]["errore_2023_26"])
        if mp == "EW3":
            base = float(ds.r1.ewm(halflife=3, min_periods=6).mean().iloc[-1])
        else:
            base = float((ds.r1 / full[full.fam == "NFP"].set_index("t0").adr21.reindex(ds.t0).to_numpy()).dropna().iloc[-NB:].median() * nx["adr21_pct"])
        rat = (ds[f"m{k}"] / ds[mp]).dropna().iloc[-NB:]
        out["prossima"] = {"metodo": mp, "ultima_nfp": str(ds.t0.iloc[-1].date()), "pct": round(base * float(rat.median()), 5)}
        if nx.get("prezzo"):
            out["prossima"]["pips"] = round(out["prossima"]["pct"] / 100 * nx["prezzo"] * 10)
        print("anni", out["anni"], "tocca", out["tocca"], "prossima", out["prossima"], "candela hx32", nx.get("stima"))
    (R / "hx16" / "hx42_massimo_k.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
