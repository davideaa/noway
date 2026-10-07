"""H-X15 (docs/PROTOCOLLO-NEWS-ROSSE.md): segnali, ricerca 2011-19 con nullo a permutazioni, P1-P4, validazione 2020-23.

Non tocca il 2024-26: legge solo slots_2008_2023.parquet di hx15_build.py.
"""
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import t as tdist  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

A_RULES = [f"A{i}" for i in range(1, 10)]
B_RULES = [f"B{i}" for i in range(1, 7)]
A_CFG = ["E1", "E5", "E15"]
B_STOPS, B_EXITS = ["SB1", "SB2", "SB3"], ["X5", "X15", "X60", "TP1R", "TP2R"]
B_CFG = [f"{s}_{x}" for s in B_STOPS for x in B_EXITS]
N_PERM, SEED, MIN_N = 1000, 15, 30
PRIMARY = {"P1": ("B2", 1, "TUTTE", "SB1_X15"), "P2": ("B1", 1, "TUTTE", "SB1_X15"),
           "P3": ("B1", -1, "TUTTE", "SB1_X15"), "P4": ("A1", -1, "TUTTE", "E1")}


def sgn(x):
    return 0.0 if x is None or x != x else float(np.sign(x))


def signals(df: pd.DataFrame, cn: pd.DataFrame, h1_end: date = date(2023, 12, 31)) -> pd.DataFrame:
    """Un segno per regola e slot, solo con informazioni note al momento dell'ingresso."""
    ok = df[df.ok].sort_values("t0")
    h1 = DukascopyProvider().h1_range("XAUUSD", date(2007, 12, 1), h1_end).c
    reds = pd.concat([ok[["t0", "mv"]], cn[["t0", "mv"]]]).sort_values("t0")
    cpi, nfp = cn[cn.fam == "CPI"], cn[cn.fam == "NFP"]
    prev = {}
    out = []
    for r in ok.itertuples():
        p = prev.get(r.fam)
        prev[r.fam] = r
        s = {"t0": r.t0, "fam": r.fam}
        s["A1"] = sgn(p.mv) if p is not None else 0.0
        s["A2"] = sgn(r.drift1h)
        last = h1[h1.index + pd.Timedelta(hours=1) <= r.t0 - pd.Timedelta(seconds=60)]
        if len(last):
            c, ti = last.iat[-1], last.index[-1]
            for name, hrs in (("A3", 24), ("A4", 120)):
                old = last[last.index <= ti - pd.Timedelta(hours=hrs)]
                s[name] = sgn(c - old.iat[-1]) if len(old) else 0.0
        s["A5"] = sgn(p.sorpresa) if p is not None else 0.0
        rr = reds[(reds.t0 < r.t0) & (reds.t0 >= r.t0 - pd.Timedelta(days=7))]
        s["A6"] = sgn(rr.mv.iat[-1]) if len(rr) else 0.0
        for name, src in (("A7", cpi), ("A8", nfp)):
            q = src[src.t0 < r.t0]
            s[name] = sgn(q.sorpresa.iat[-1]) if len(q) else 0.0
        s["A9"] = 1.0
        c1, su, big = sgn(r.mv), sgn(r.sorpresa), r.rng1 >= r.U if r.U == r.U else False
        s.update({"B1": c1, "B2": su, "B3": c1 if su != 0 and c1 == su else 0.0,
                  "B4": c1 if su != 0 and c1 == -su else 0.0, "B5": c1 if big else 0.0,
                  "B6": c1 if not big else 0.0})
        out.append(s)
    return pd.DataFrame(out).fillna(0.0)


class Book:
    """Esiti LONG/SHORT per slot e configurazione; statistiche per gruppo, regola, verso."""

    def __init__(self, d: pd.DataFrame, sig: pd.DataFrame, cost="b"):
        self.d, self.sig = d.reset_index(drop=True), sig.reset_index(drop=True)
        self.fams = sorted(self.d.fam.unique())
        self.O = {}
        for kind, cfgs in (("A", A_CFG), ("B", B_CFG)):
            self.O[kind] = {side: self.d[[f"{kind}_{c}_{side}_{cost}" for c in cfgs]].to_numpy(float) for side in "LS"}
        self.idx = {f: np.nonzero(self.d.fam.to_numpy() == f)[0] for f in self.fams}

    def stats(self, perm=None):
        """t, n, media per (gruppo, regola, verso, config). perm: permutazione degli esiti dentro le famiglie."""
        res = {}
        for kind, rules, cfgs in (("A", A_RULES, A_CFG), ("B", B_RULES, B_CFG)):
            OL, OS = self.O[kind]["L"], self.O[kind]["S"]
            if perm is not None:
                OL, OS = OL[perm], OS[perm]
            for r in rules:
                S = self.sig[r].to_numpy()
                for v in (1, -1):
                    s = v * S
                    R = np.where((s > 0)[:, None], OL, np.where((s < 0)[:, None], OS, np.nan))
                    tot = {"n": 0, "s1": 0, "s2": 0}
                    for f, ix in self.idx.items():
                        x = R[ix]
                        n = np.isfinite(x[:, 0]).sum()
                        s1, s2 = np.nansum(x, 0), np.nansum(x * x, 0)
                        res[(f, r, v)] = (n, s1, s2)
                        tot["n"] += n
                        tot["s1"] = tot["s1"] + s1
                        tot["s2"] = tot["s2"] + s2
                    res[("TUTTE", r, v)] = (tot["n"], tot["s1"], tot["s2"])
        return res

    @staticmethod
    def tvals(n, s1, s2):
        if n < 2:
            return np.full(np.shape(s1), np.nan), np.full(np.shape(s1), np.nan)
        m = s1 / n
        var = (s2 - n * m * m) / (n - 1)
        return m, m / np.sqrt(np.maximum(var, 1e-12) / n)


def table(book: Book, res) -> pd.DataFrame:
    rows = []
    for (g, r, v), (n, s1, s2) in res.items():
        m, t = Book.tvals(n, s1, s2)
        for i, c in enumerate(A_CFG if r.startswith("A") else B_CFG):
            rows.append({"gruppo": g, "regola": r, "verso": v, "config": c, "n": int(n),
                         "R_medio": float(m[i]) if n else np.nan, "t": float(t[i]) if n >= 2 else np.nan})
    return pd.DataFrame(rows)


def perm_within(fam: np.ndarray, rng) -> np.ndarray:
    p = np.arange(len(fam))
    for f in np.unique(fam):
        ix = np.nonzero(fam == f)[0]
        p[ix] = rng.permutation(ix)
    return p


def neighbours(r, c):
    if r.startswith("A"):
        i = A_CFG.index(c)
        return [A_CFG[j] for j in (i - 1, i + 1) if 0 <= j < len(A_CFG)]
    s, x = c.split("_", 1)
    xs = {"X5": ["X15"], "X15": ["X5", "X60"], "X60": ["X15"], "TP1R": ["TP2R"], "TP2R": ["TP1R"]}[x]
    ss = {"SB1": ["SB2"], "SB2": ["SB1", "SB3"], "SB3": ["SB2"]}[s]
    return [f"{s}_{y}" for y in xs] + [f"{y}_{x}" for y in ss]


def one_test(book_d, sig_d, g, r, v, c, cost="b"):
    """R dei trade di una combinazione su un insieme di slot."""
    kind = r[0]
    s = v * sig_d[r].to_numpy()
    sel = (s != 0) & ((book_d.fam.to_numpy() == g) | (g == "TUTTE"))
    R = np.where(s > 0, book_d[f"{kind}_{c}_L_{cost}"], book_d[f"{kind}_{c}_S_{cost}"])[sel]
    return R


def pval(R):
    n = len(R)
    if n < 2:
        return np.nan, np.nan
    t = R.mean() / (R.std(ddof=1) / np.sqrt(n))
    return float(t), float(tdist.sf(t, n - 1))


def holm(ps: dict) -> dict:
    items = sorted(ps.items(), key=lambda x: x[1])
    out, run = {}, 0.0
    for i, (k, p) in enumerate(items):
        run = max(run, min(1.0, p * (len(items) - i)))
        out[k] = run
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx15"
    df = pd.read_parquet(R / "slots_2008_2023.parquet")
    assert df.t0.max() < pd.Timestamp("2024-01-01", tz="UTC")
    cn = pd.read_parquet(R / "cpi_nfp.parquet")
    cn = cn[cn.t0 < pd.Timestamp("2024-01-01", tz="UTC")]
    sig = signals(df, cn)
    d = df[df.ok & df.U.notna()].merge(sig, on=["t0", "fam"])
    d = d.sort_values("t0").reset_index(drop=True)
    y = d.t0.dt.year
    D, V = d[(y >= 2011) & (y <= 2019)].reset_index(drop=True), d[(y >= 2020) & (y <= 2023)].reset_index(drop=True)
    sigcols = A_RULES + B_RULES
    # ----- percorso 2: ricerca con nullo a permutazioni
    book = Book(D, D[sigcols])
    obs = table(book, book.stats())
    valid = obs.n >= MIN_N
    rng = np.random.default_rng(SEED)
    fam = D.fam.to_numpy()
    maxt = []
    for i in range(N_PERM):
        tp = table(book, book.stats(perm_within(fam, rng)))
        maxt.append(np.nanmax(tp.t[valid.to_numpy()]))
        if i % 100 == 0:
            print("permutazione", i, flush=True)
    maxt = np.array(maxt)
    obs["p_fw"] = [float((maxt >= t).mean()) if v_ and t == t else np.nan for t, v_ in zip(obs.t, valid)]
    obs = obs.sort_values("t", ascending=False).reset_index(drop=True)
    look = obs.set_index(["gruppo", "regola", "verso", "config"])
    cands = []
    for row in obs[obs.n >= MIN_N].itertuples():
        if not (row.p_fw < 0.10):
            continue
        nb = [look.t.get((row.gruppo, row.regola, row.verso, c), np.nan) for c in neighbours(row.regola, row.config)]
        h1 = one_test(D[D.t0.dt.year <= 2015], D[D.t0.dt.year <= 2015], row.gruppo, row.regola, row.verso, row.config)
        h2 = one_test(D[D.t0.dt.year >= 2016], D[D.t0.dt.year >= 2016], row.gruppo, row.regola, row.verso, row.config)
        ok = bool(np.nanmax(nb + [-np.inf]) >= 1 and len(h1) and len(h2) and h1.mean() > 0 and h2.mean() > 0)
        cands.append({"gruppo": row.gruppo, "regola": row.regola, "verso": row.verso, "config": row.config, "n": row.n,
                      "R_medio": row.R_medio, "t": row.t, "p_fw": row.p_fw, "vicini_t": nb,
                      "R_2011_15": float(h1.mean()) if len(h1) else None, "R_2016_19": float(h2.mean()) if len(h2) else None,
                      "candidato": ok})
    finalists = [c for c in cands if c["candidato"]][:10]
    # ----- validazione 2020-23 (solo se ci sono candidati)
    val = {}
    if finalists:
        ps = {}
        for c in finalists:
            Rv = one_test(V, V, c["gruppo"], c["regola"], c["verso"], c["config"])
            t, p = pval(Rv)
            key = f'{c["gruppo"]}|{c["regola"]}|{c["verso"]}|{c["config"]}'
            val[key] = {"n": len(Rv), "R_medio": float(Rv.mean()) if len(Rv) else None, "t": t, "p": p}
            ps[key] = p if p == p else 1.0
        for k, ph in holm(ps).items():
            val[k]["p_holm"] = ph
            val[k]["passa"] = bool(val[k]["R_medio"] and val[k]["R_medio"] > 0 and ph < 0.05)
    # ----- percorso 1: P1-P4 su 2011-2023
    DV = pd.concat([D, V], ignore_index=True)
    prim, ps = {}, {}
    for k, (r, v, g, c) in PRIMARY.items():
        Rp = one_test(DV, DV, g, r, v, c)
        Rc = one_test(DV, DV, g, r, v, c, cost="c")
        t, p = pval(Rp)
        prim[k] = {"regola": r, "verso": v, "gruppo": g, "config": c, "n": len(Rp), "R_medio": float(Rp.mean()),
                   "t": t, "p": p, "R_medio_conservative": float(Rc.mean()), "vinti": float((Rp > 0).mean()),
                   "R_2011_19": float(one_test(D, D, g, r, v, c).mean()), "R_2020_23": float(one_test(V, V, g, r, v, c).mean())}
        ps[k] = p
    for k, ph in holm(ps).items():
        prim[k]["p_holm"] = ph
        prim[k]["passa"] = bool(prim[k]["R_medio"] > 0 and ph < 0.05)
    # ----- descrittivo: ampiezza in pips per famiglia e anno
    amp = df[df.ok].assign(anno=df.t0.dt.year, m1=df.rng1 / 0.1, m5=df.rng5 / 0.1, a15=df.mv15.abs() / 0.1,
                           a60=df.mv60.abs() / 0.1, sp=df.spmax10 / 0.1)
    amp = amp.groupby(["fam", "anno"])[["m1", "m5", "a15", "a60", "sp"]].median().round(0)
    obs.to_csv(R / "ricerca_tutte_le_combinazioni.csv", index=False)
    out = {"slot_ricerca": len(D), "slot_validazione": len(V), "per_famiglia_ricerca": D.fam.value_counts().to_dict(),
           "combinazioni": int(valid.sum()), "maxt_nullo_quantili": {q: float(np.quantile(maxt, q)) for q in (0.5, 0.9, 0.95, 0.99)},
           "migliori_20": obs.head(20).to_dict("records"), "candidati": cands, "finalisti": finalists,
           "validazione": val, "principali": prim}
    (R / "analisi.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    amp.reset_index().to_csv(R / "ampiezza_per_anno.csv", index=False)
    pd.set_option("display.width", 250)
    print("slot ricerca", len(D), "validazione", len(V), "combinazioni", int(valid.sum()))
    print("t massima per caso (quantili 50/90/95/99%):", out["maxt_nullo_quantili"])
    print(obs.head(20).to_string())
    print("\ncandidati:", json.dumps(cands, indent=1, default=float))
    print("\nvalidazione:", json.dumps(val, indent=1, default=float))
    print("\nprincipali:", json.dumps(prim, indent=1, default=float))
