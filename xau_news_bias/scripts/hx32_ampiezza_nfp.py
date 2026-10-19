"""H-X32 (docs/IPOTESI-HX32-AMPIEZZA-NFP.md): quale metodo stima bene, prima della release, la candela della NFP.

Scelte di dettaglio, fissate qui prima di eseguire:
- EW3 è la media esponenziale di r1 (non del logaritmo) sulle NFP precedenti, almeno 6;
- FORM e RIDGE si allenano su tutte le famiglie con le loro dummy (come H-X29 e H-X23), ogni anno solo con gli anni
  prima, dal 2016; FORM non chiede la sorpresa, quindi non scarta le release senza sorpresa;
- copertura ed errore si misurano sulle NFP dove tutti gli otto metodi hanno la fascia, così il confronto è alla pari.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
import statsmodels.api as sm  # noqa: E402
from sklearn.linear_model import Ridge  # noqa: E402

from hx23_modello import FEATS  # noqa: E402
from xnb.config import get_settings  # noqa: E402

METODI = ["N24", "N12", "N6", "EW3", "ADR24", "ADR12", "FORM", "RIDGE"]
PER = {"2019-22": (2019, 2022), "2023-26": (2023, 2026)}
NB = 24


def yearly(df: pd.DataFrame, X: pd.DataFrame, model) -> np.ndarray:
    """Previsione di log r1 anno per anno, allenando solo sugli anni prima."""
    y = np.log(df.r1).to_numpy()
    ok = X.notna().all(axis=1).to_numpy()
    out = np.full(len(df), np.nan)
    for Y in range(2016, 2027):
        tr, te = ok & (df.y < Y).to_numpy(), ok & (df.y == Y).to_numpy()
        if te.any():
            out[te] = model(X[tr], y[tr], X[te])
    return np.exp(out)


def ols(Xtr, ytr, Xte):
    return sm.OLS(ytr, sm.add_constant(Xtr, has_constant="add")).fit().predict(sm.add_constant(Xte, has_constant="add")).to_numpy()


def ridge(Xtr, ytr, Xte):
    mu, sd = Xtr.mean(), Xtr.std().replace(0, 1)
    return Ridge(alpha=1.0).fit(((Xtr - mu) / sd).values, ytr).predict(((Xte - mu) / sd).values)


def stime(df: pd.DataFrame) -> pd.DataFrame:
    df = df[df.r1 > 0].sort_values("t0").reset_index(drop=True)
    fams = sorted(df.fam.unique())
    dummy = pd.get_dummies(df.fam).reindex(columns=fams, fill_value=0).astype(float)
    form = yearly(df, pd.concat([df[["l_adr21", "l_mem12"]], dummy[fams[1:]]], axis=1), ols)
    rid = yearly(df, pd.concat([df[FEATS], dummy], axis=1), ridge)
    n = df[df.fam == "NFP"].copy()
    n["FORM"], n["RIDGE"] = form[n.index], rid[n.index]
    prev, q = n.r1.shift(1), (n.r1 / n.adr21).shift(1)
    for k in (24, 12, 6):
        n[f"N{k}"] = prev.rolling(k, min_periods=k).median()
    n["EW3"] = prev.ewm(halflife=3, min_periods=6).mean()
    for k in (24, 12):
        n[f"ADR{k}"] = q.rolling(k, min_periods=k).median() * n.adr21
    return n.reset_index(drop=True)


def fascia(n: pd.DataFrame, m: str) -> pd.DataFrame:
    """Stima finale e fascia 25-75 dai rapporti vero ÷ stima delle 24 NFP precedenti con la stima."""
    e = n[m]
    rat = (n.r1 / e).where(e.notna())
    out = pd.DataFrame(index=n.index)
    for nome, qq in (("med", .5), ("q25", .25), ("q75", .75)):
        out[nome] = rat.shift(1).rolling(NB, min_periods=NB).quantile(qq)
    out["stima"], out["lo"], out["hi"] = e * out.med, e * out.q25, e * out.q75
    return out


def misura(n: pd.DataFrame, f: pd.DataFrame, sel: pd.Series) -> dict:
    s = sel & f.stima.notna()
    v, st, lo, hi = n.r1[s], f.stima[s], f.lo[s], f.hi[s]
    return {"n": int(s.sum()), "dentro": int(((v >= lo) & (v <= hi)).sum()), "sopra": int((v > hi).sum()), "sotto": int((v < lo).sum()),
            "copertura": round(float(((v >= lo) & (v <= hi)).mean()), 3), "errore": round(float(np.median(np.abs(np.log(v / st)))), 3)}


def prossima(n: pd.DataFrame, m: str, adr21: float | None) -> dict | None:
    """Stima per la prossima NFP, coi dati di oggi; solo per i metodi che non chiedono le variabili del giorno."""
    r, q = n.r1, n.r1 / n.adr21
    base = {"N24": r.iloc[-24:].median(), "N12": r.iloc[-12:].median(), "N6": r.iloc[-6:].median(),
            "EW3": r.ewm(halflife=3).mean().iat[-1]}
    if adr21:
        base |= {"ADR24": q.iloc[-24:].median() * adr21, "ADR12": q.iloc[-12:].median() * adr21}
    if m not in base:
        return None
    rat = (n.r1 / n[m]).dropna().iloc[-NB:]
    e = float(base[m])
    return {"stima_pct": e * rat.median(), "lo_pct": e * rat.quantile(.25), "hi_pct": e * rat.quantile(.75)}


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    n = stime(pd.read_parquet(R / "hx23_dataset.parquet"))
    F = {m: fascia(n, m) for m in METODI}
    comune = pd.concat([F[m].stima.notna() for m in METODI], axis=1).all(axis=1)
    res = {}
    for m in METODI:
        res[m] = {p: misura(n, F[m], comune & n.y.between(a, b)) for p, (a, b) in PER.items()}
        res[m]["per_anno"] = {int(y): misura(n, F[m], comune & (n.y == y)) for y in range(2019, 2027)}
        res[m]["calibrato"] = bool(all(.40 <= res[m][p]["copertura"] <= .60 for p in PER))
    cal = [m for m in METODI if res[m]["calibrato"]]
    best = min((res[m]["2023-26"]["errore"] for m in cal), default=None)
    vince = next((m for m in cal if res[m]["2023-26"]["errore"] - best < .02), None) if cal else None
    lv = json.loads((R / "hx28_livelli.json").read_text(encoding="utf-8"))["giorno"]["oggi"]
    adr_oggi, px_oggi = lv.get("S_pct"), lv.get("prezzo")
    casi = []
    if vince:
        f = F[vince]
        for i in n.index[comune & (n.y >= 2019)]:
            pp = n.px[i] / 100 * 10
            casi.append({"data": str(n.t0[i].date()), "y": int(n.y[i]), "vero": round(float(n.r1[i] * pp)),
                         "stima": round(float(f.stima[i] * pp)), "lo": round(float(f.lo[i] * pp)), "hi": round(float(f.hi[i] * pp))})
    nx = prossima(n, vince, adr_oggi) if vince else None
    if nx and px_oggi:
        pp = px_oggi / 100 * 10
        nx = {"prezzo": px_oggi, "adr21_pct": adr_oggi, "stima": round(nx["stima_pct"] * pp), "lo": round(nx["lo_pct"] * pp), "hi": round(nx["hi_pct"] * pp)}
    out = {"nfp": int(len(n)), "ultima": str(n.t0.iat[-1].date()), "metodi": res, "calibrati": cal, "vincitore": vince,
           "casi_vincitore": casi, "prossima": nx}
    (R / "hx32_ampiezza_nfp.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    for m in METODI:
        print(m, {p: (res[m][p]["copertura"], res[m][p]["errore"], res[m][p]["n"]) for p in PER}, "calibrato" if res[m]["calibrato"] else "")
    print("calibrati", cal, "vincitore", vince, "prossima", nx)
