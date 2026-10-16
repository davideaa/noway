"""H-X29 (docs/IPOTESI-HX29-PERCHE-CRESCONO-I-PIPS.md): perché i pips delle news sono cresciuti."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
import statsmodels.api as sm  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.phase2.memory import load_surprise_table  # noqa: E402

GROUPS = {"TUTTE": None, "NFP": ["NFP"], "CPI": ["CPI"], "RETAIL_PPI": ["RETAIL", "PPI"]}
PER = {"2011-18": (2011, 2018), "2019-22": (2019, 2022), "2023-26": (2023, 2026)}


def load() -> tuple[pd.DataFrame, dict]:
    R = get_settings().research_dir / "phase2" / "hx16"
    df = pd.read_parquet(R / "hx23_dataset.parquet")
    tab = load_surprise_table().dropna(subset=["z"])
    tab["az"] = tab.z.abs()
    S = tab.groupby("release_utc").az.max()
    df["S"] = df.t0.map(S)
    df["pips"] = df.r1 / 100 * df.px * 10
    df = df[(df.r1 > 0) & df.adr21.notna()].copy()
    for c in ("r1", "adr21", "px", "pips", "mem12"):
        df["l_" + c] = np.log(df[c])
    df["l_S"] = np.log1p(df.S)
    df["per"] = pd.cut(df.y, [2010, 2018, 2022, 2026], labels=list(PER))
    cov = {"release": int(len(df)), "con_S": int(df.S.notna().sum()),
           "con_S_per_famiglia": {f: [int(g.S.notna().sum()), int(len(g))] for f, g in df.groupby("fam")}}
    return df, cov


def design(d: pd.DataFrame, fams: list, years: list, cols: list, inter=False) -> pd.DataFrame:
    X = pd.DataFrame(index=d.index)
    if inter:
        for p in PER:
            m = (d.per == p).astype(float)
            for c in cols:
                X[f"{c}:{p}"] = d[c] * m
    else:
        for c in cols:
            X[c] = d[c]
    for f in fams[1:]:
        X["fam_" + f] = (d.fam == f).astype(float)
    for y in years[1:]:
        X[f"y{y}"] = (d.y == y).astype(float)
    return sm.add_constant(X)


def fit(df: pd.DataFrame):
    d = df[df.S.notna()].copy()
    fams, years = sorted(d.fam.unique()), sorted(d.y.unique())
    m = sm.OLS(d.l_r1, design(d, fams, years, ["l_adr21", "l_S"])).fit(cov_type="HC1")
    mi = sm.OLS(d.l_r1, design(d, fams, years, ["l_adr21", "l_S"], inter=True)).fit(cov_type="HC1")

    def wald(c):
        names = [f"{c}:{p}" for p in PER]
        R = np.zeros((2, len(mi.params)))
        idx = [list(mi.params.index).index(n) for n in names]
        R[0, idx[0]], R[0, idx[1]], R[1, idx[1]], R[1, idx[2]] = 1, -1, 1, -1
        return float(mi.wald_test(R, scalar=True).pvalue)
    ci = m.conf_int()
    out = {"n": int(len(d)), "r2": round(float(m.rsquared), 3),
           "beta": [round(float(m.params.l_adr21), 3), round(float(ci.loc["l_adr21", 0]), 3), round(float(ci.loc["l_adr21", 1]), 3)],
           "gamma": [round(float(m.params.l_S), 3), round(float(ci.loc["l_S", 0]), 3), round(float(ci.loc["l_S", 1]), 3)],
           "p_gamma": float(m.pvalues.l_S),
           "per_periodo": {p: {"beta": round(float(mi.params[f"l_adr21:{p}"]), 3), "gamma": round(float(mi.params[f"l_S:{p}"]), 3),
                               "gamma_se": round(float(mi.bse[f"l_S:{p}"]), 3)} for p in PER},
           "p_wald_gamma": wald("l_S"), "p_wald_beta": wald("l_adr21")}
    yfe = {int(y): (0.0 if y == years[0] else float(m.params[f"y{y}"])) for y in years}
    ffe = {f: (0.0 if f == fams[0] else float(m.params["fam_" + f])) for f in fams}
    return out, m, yfe, ffe


def decompose(df: pd.DataFrame, beta: float, gamma: float, yfe: dict, ffe: dict) -> dict:
    d = df[df.S.notna() & (df.y >= 2019)]
    res = {}
    for g, fams in GROUPS.items():
        s = d if fams is None else d[d.fam.isin(fams)]
        mean = s.groupby("y")[["l_pips", "l_px", "l_adr21", "l_S"]].mean()
        mix = s.groupby("y").fam.agg(lambda x: float(np.mean([ffe[f] for f in x])))
        b = mean.loc[2019]
        rows = {}
        for y in mean.index:
            tot = mean.l_pips[y] - b.l_pips
            pr = mean.l_px[y] - b.l_px
            vo = beta * (mean.l_adr21[y] - b.l_adr21)
            su = gamma * (mean.l_S[y] - b.l_S)
            fm = (mix[y] - mix[2019]) if fams is None else 0.0
            rows[int(y)] = {"n": int((s.y == y).sum()), "pips_geo": round(float(np.exp(mean.l_pips[y])), 1),
                            "totale": round(float(np.exp(tot)), 2), "prezzo": round(float(np.exp(pr)), 2),
                            "volatilita": round(float(np.exp(vo)), 2), "sorpresa": round(float(np.exp(su)), 2),
                            "famiglie": round(float(np.exp(fm)), 2), "resto": round(float(np.exp(tot - pr - vo - su - fm)), 2),
                            "S_mediana": round(float(s.S[s.y == y].median()), 2)}
        res[g] = rows
    return res


def walk(df: pd.DataFrame) -> dict:
    d = df[df.S.notna() & df.l_mem12.notna()].copy()
    fams = sorted(d.fam.unique())
    pv, pvs = np.full(len(d), np.nan), np.full(len(d), np.nan)
    for Y in range(2016, 2027):
        tr, te = (d.y < Y).to_numpy(), (d.y == Y).to_numpy()
        if not te.any():
            continue
        for cols, out in ((["l_adr21", "l_mem12"], pv), (["l_adr21", "l_mem12", "l_S"], pvs)):
            Xtr = design(d[tr], fams, [0], cols)
            Xte = design(d[te], fams, [0], cols).reindex(columns=Xtr.columns, fill_value=0.0)
            m = sm.OLS(d.l_r1[tr], Xtr).fit()
            out[te] = m.predict(Xte).to_numpy()
    d["pV"], d["pVS"] = pv, pvs
    res = {}
    for g, fams_ in GROUPS.items():
        s0 = d if fams_ is None else d[d.fam.isin(fams_)]
        res[g] = {}
        for p in ("2019-22", "2023-26"):
            a, b = PER[p]
            s = s0[(s0.y >= a) & (s0.y <= b)]
            res[g][p] = {"n": int(len(s)), "errore_V": round(float(np.median(np.abs(s.l_r1 - s.pV))), 3),
                         "errore_VS": round(float(np.median(np.abs(s.l_r1 - s.pVS))), 3)}
    res["migliora"] = bool(all(res["TUTTE"][p]["errore_V"] - res["TUTTE"][p]["errore_VS"] >= .03 for p in ("2019-22", "2023-26")))
    return res, d


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    df, cov = load()
    est, m, yfe, ffe = fit(df)
    dec = decompose(df, est["beta"][0], est["gamma"][0], yfe, ffe)
    wf, dw = walk(df)
    nfp26 = dw[(dw.fam == "NFP") & (dw.y == 2026)]
    casi = [{"data": str(r.t0.date()), "S": round(float(r.S), 2), "adr21_pips": round(float(r.adr21 / 100 * r.px * 10)),
             "pips_veri": round(float(r.pips)), "pips_stimati_VS": round(float(np.exp(r.pVS) / 100 * r.px * 10)),
             "pips_stimati_V": round(float(np.exp(r.pV) / 100 * r.px * 10))} for r in nfp26.itertuples()]
    out = {"copertura": cov, "modello": est, "effetto_anno": {k: round(v, 3) for k, v in yfe.items()},
           "scomposizione_vs_2019": dec, "prova_passo_per_passo": wf, "nfp_2026": casi}
    (R / "hx29_pips.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    print(json.dumps({k: out[k] for k in ("copertura", "modello")}, indent=1, default=float))
    for g, rows in dec.items():
        print(g, {y: (r["totale"], r["prezzo"], r["volatilita"], r["sorpresa"], r["famiglie"], r["resto"]) for y, r in rows.items()})
    print(json.dumps(wf, default=float))
    for c in casi:
        print(c)
