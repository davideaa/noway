"""H-X33 (docs/IPOTESI-HX33-FASCIA-CHE-SI-ADATTA.md): fascia della candela che si adatta quando cambia la volatilità.

Prova sulle 12 famiglie senza NFP; la NFP è solo descrittiva (già vista in H-X32)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import t as tdist  # noqa: E402

from xnb.config import get_settings  # noqa: E402

METODI = ["B0", "A", "B", "C", "D"]
PER = {"2019-22": (2019, 2022), "2023-26": (2023, 2026)}
NB, HC, HS = 24, 3, 6


def _fhs(logc: pd.Series, d: pd.Series):
    """Simulazione storica filtrata: σ da media esponenziale di d² (emivita HS), quantili degli scarti standardizzati."""
    sig = np.sqrt((d ** 2).shift(1).ewm(halflife=HS, min_periods=NB).mean())
    u = d / sig
    q25 = u.shift(1).rolling(NB, min_periods=NB).quantile(.25)
    q75 = u.shift(1).rolling(NB, min_periods=NB).quantile(.75)
    return logc + sig * q25, logc + sig * q75


def bande(g: pd.DataFrame) -> dict:
    """Per una famiglia in ordine di tempo: log del centro e degli estremi della fascia, per ogni metodo, solo dati di prima."""
    r = g.r1
    e = r.shift(1).ewm(halflife=HC, min_periods=6).mean()
    z = np.log(r / e)
    out = {}
    # B0: rapporti delle 24 precedenti (H-X32)
    zq = lambda q: z.shift(1).rolling(NB, min_periods=NB).quantile(q)  # noqa: E731
    m0 = zq(.5)
    out["B0"] = (np.log(e) + m0, np.log(e) + zq(.25), np.log(e) + zq(.75))
    # A: centro di B0, fascia filtrata sugli scarti dal centro
    cA = np.log(e) + m0
    out["A"] = (cA, *_fhs(cA, z - m0))
    # B: centro corretto con la media esponenziale degli errori recenti
    cb = z.shift(1).ewm(halflife=HC, min_periods=6).mean()
    dB = z - cb
    cB = np.log(e) + cb
    out["B"] = (cB, cB + dB.shift(1).rolling(NB, min_periods=NB).quantile(.25), cB + dB.shift(1).rolling(NB, min_periods=NB).quantile(.75))
    # C: centro di B, fascia filtrata
    out["C"] = (cB, *_fhs(cB, dB))
    # D: come C sulla volatilità del giorno (r1 ÷ ADR21, riportato all'ADR21 di oggi)
    x = r / g.adr21
    eD = x.shift(1).ewm(halflife=HC, min_periods=6).mean() * g.adr21
    zD = np.log(r / eD)
    cbD = zD.shift(1).ewm(halflife=HC, min_periods=6).mean()
    cD = np.log(eD) + cbD
    out["D"] = (cD, *_fhs(cD, zD - cbD))
    return out


def tutte(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for fam, g in df.groupby("fam"):
        g = g.sort_values("t0").reset_index(drop=True)
        b = bande(g)
        o = g[["t0", "fam", "y", "r1", "px"]].copy()
        for m, (c, lo, hi) in b.items():
            o[m + "_c"], o[m + "_L"], o[m + "_U"] = c, lo, hi
        rows.append(o)
    return pd.concat(rows, ignore_index=True)


def score(o: pd.DataFrame, m: str) -> pd.DataFrame:
    y, L, U = np.log(o.r1), o[m + "_L"], o[m + "_U"]
    return pd.DataFrame({"dentro": (y >= L) & (y <= U), "IS": (U - L) + 4 * (L - y).clip(lower=0) + 4 * (y - U).clip(lower=0),
                         "sopra": y > U, "sotto": y < L})


def riassunto(o: pd.DataFrame) -> dict:
    res = {}
    for m in METODI:
        s = score(o, m)
        res[m] = {}
        for p, (a, b) in PER.items():
            sel = o.y.between(a, b)
            res[m][p] = {"n": int(sel.sum()), "copertura": round(float(s.dentro[sel].mean()), 3), "IS": round(float(s.IS[sel].mean()), 4),
                         "sopra": int(s.sopra[sel].sum()), "sotto": int(s.sotto[sel].sum())}
        cell = s.assign(fam=o.fam, y=o.y)[o.y >= 2019].groupby(["fam", "y"]).dentro.mean()
        res[m]["distanza_media_dal_50"] = round(float((cell - .5).abs().mean()), 3)
    return res


def prova(o: pd.DataFrame) -> dict:
    """Differenza di interval score contro B0 per coppia famiglia-anno 2019-26, t unilaterale, Holm."""
    base = score(o, "B0").IS
    sel = o.y >= 2019
    ps = {}
    for m in METODI[1:]:
        d = (score(o, m).IS - base)[sel].groupby([o.fam[sel], o.y[sel]]).mean()
        k = len(d)
        t = float(d.mean() / (d.std(ddof=1) / np.sqrt(k)))
        ps[m] = {"celle": k, "diff_media": round(float(d.mean()), 4), "t": round(t, 2), "p": float(tdist.cdf(t, k - 1))}
    run = 0
    for i, (m, v) in enumerate(sorted(ps.items(), key=lambda kv: kv[1]["p"])):
        run = max(run, min(1.0, v["p"] * (len(ps) - i)))
        v["p_holm"] = round(run, 4)
    return ps


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    df = pd.read_parquet(R / "hx23_dataset.parquet")
    df = df[(df.r1 > 0) & df.adr21.notna()]
    o = tutte(df)
    ok = np.isfinite(o[[m + s for m in METODI for s in ("_L", "_U")]]).all(axis=1)
    o = o[ok].reset_index(drop=True)
    altre, nfp = o[o.fam != "NFP"].reset_index(drop=True), o[o.fam == "NFP"].reset_index(drop=True)
    RA, RN, P = riassunto(altre), riassunto(nfp), prova(altre)
    for m in METODI[1:]:
        RA[m]["funziona"] = bool(all(.40 <= RA[m][p]["copertura"] <= .60 for p in PER)
                                 and all(RA[m][p]["IS"] < RA["B0"][p]["IS"] for p in PER) and P[m]["p_holm"] < .05)
    ok_m = [m for m in METODI[1:] if RA[m]["funziona"]]
    best = min((RA[m]["2023-26"]["IS"] for m in ok_m), default=None)
    vince = next((m for m in ok_m if RA[m]["2023-26"]["IS"] <= best * 1.01), None) if ok_m else None
    nfp_anni = {m: {int(y): {"dentro": int(g.dentro.sum()), "n": int(len(g)), "sopra": int(g.sopra.sum()), "sotto": int(g.sotto.sum())}
                    for y, g in score(nfp, m).assign(y=nfp.y)[nfp.y >= 2019].groupby("y")} for m in METODI}
    out = {"release": {"altre": int(len(altre)), "nfp": int(len(nfp))}, "famiglie": sorted(altre.fam.unique().tolist()),
           "altre": RA, "prova_contro_B0": P, "funzionano": ok_m, "vincitore": vince, "nfp_descrittivo": RN, "nfp_per_anno": nfp_anni}
    (R / "hx33_fascia_adattiva.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    print("release altre", len(altre), "nfp", len(nfp))
    for m in METODI:
        print(m, {p: (RA[m][p]["copertura"], RA[m][p]["IS"], RA[m][p]["n"]) for p in PER}, "dist50", RA[m]["distanza_media_dal_50"],
              P.get(m, ""), "FUNZIONA" if RA[m].get("funziona") else "")
    print("vincitore", vince)
    for m in METODI:
        print("NFP", m, {p: (RN[m][p]["copertura"], RN[m][p]["IS"]) for p in PER}, {y: f"{v['dentro']}/{v['n']}" for y, v in nfp_anni[m].items()})
