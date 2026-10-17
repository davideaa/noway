"""H-X26 (docs/IPOTESI-HX26-ANCORAGGIO-CONSENSUS.md): il consensus è ancorato al dato precedente?

T1 segno(actual - forecast) == segno(forecast - actual precedente); T2 direzione dell'oro nella prima M1;
T3 trade di Davide (T0-30 s, stop 100 pips, spread max 40 pips, uscita 60 s e 5 min).

    ../../venv-xnb/bin/python scripts/hx26_ancoraggio.py
"""
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import binom  # noqa: E402

from hx11_site import quotes  # noqa: E402
from hx15_build import CACHE, FF, num  # noqa: E402
from hx18_inversione import fetch_retry  # noqa: E402
from hx19_tp import sim  # noqa: E402
from xnb.config import get_settings  # noqa: E402

OUT = get_settings().research_dir / "phase2" / "hx16"
START, END = pd.Timestamp("2008-01-01", tz="UTC"), pd.Timestamp("2026-10-16 23:59", tz="UTC")
PERIODS = {"descr_2008_10": (2008, 2010), "studio": (2011, 2018), "conferma": (2019, 2026)}
GDP = ["Advance GDP q/q", "Prelim GDP q/q", "Final GDP q/q"]
TITLES = {"FOMC": ["Federal Funds Rate"], "RETAIL": ["Retail Sales m/m"], "PPI": ["PPI m/m"], "PIL": GDP,
          "ISM_M": ["ISM Manufacturing PMI"], "ISM_S": ["ISM Services PMI"], "ADP": ["ADP Non-Farm Employment Change"],
          "FIDUCIA": ["CB Consumer Confidence"], "MICHIGAN": ["Prelim UoM Consumer Sentiment"],
          "CLAIMS": ["Unemployment Claims"], "CPI": ["CPI m/m"], "CORE_CPI": ["Core CPI m/m"],
          "NFP": ["Non-Farm Employment Change"]}
ORIENT = {g: (1 if g == "CLAIMS" else -1) for g in TITLES}
# variante "ultimo valore pubblicato": catena di titoli da cui prendere il precedente
CHAIN = {"PIL": GDP, "MICHIGAN": ["Prelim UoM Consumer Sentiment", "Revised UoM Consumer Sentiment"]}
TOL = 1e-9


def sgn(x):
    return np.where(np.isnan(x), np.nan, np.where(np.abs(x) < TOL, 0.0, np.sign(x)))


def period(y):
    for k, (a, b) in PERIODS.items():
        if a <= y <= b:
            return k
    return None


def load_ff() -> pd.DataFrame:
    df = pd.read_csv(FF)
    u = df[(df.currency == "USD") & df.time.str.contains(":", na=False)].copy()
    d = pd.to_datetime(u.date, format="%a %b %d %Y")
    hm = u.time.str.split(":", expand=True).astype(int)
    u["t0"] = (d + pd.to_timedelta(hm[0], unit="h") + pd.to_timedelta(hm[1], unit="m")).dt.tz_localize("UTC")
    for c, n in (("actual", "a"), ("forecast", "f"), ("previous", "pv")):
        u[n] = u[c].map(num).astype(float)
    return u.drop_duplicates(["event", "t0"], keep="first").sort_values("t0").reset_index(drop=True)


def table(u: pd.DataFrame, chain: bool) -> pd.DataFrame:
    """Una riga per release di ogni titolo: forecast, actual, actual precedente (prima stampa), segni."""
    out = []
    for g, titles in TITLES.items():
        src = CHAIN[g] if chain and g in CHAIN else None
        for title in titles:
            pool = u[u.event.isin(src if src else [title])].sort_values("t0")
            last, prev = np.nan, {}
            for r in pool.itertuples():
                prev[(r.event, r.t0)] = last
                if not np.isnan(r.a):
                    last = r.a
            ev = u[(u.event == title) & (u.t0 >= START) & (u.t0 <= END)].copy()
            ev["prev"] = [prev.get((e, t), np.nan) for e, t in zip(ev.event, ev.t0)]
            ev["gruppo"] = g
            out.append(ev[["gruppo", "event", "t0", "a", "f", "pv", "prev"]])
    t = pd.concat(out).sort_values("t0").reset_index(drop=True)
    t["p"] = sgn((t.f - t.prev).to_numpy())
    t["s"] = sgn((t.a - t.f).to_numpy())
    t["anno"] = t.t0.dt.year
    t["periodo"] = t.anno.map(period)
    return t


def btest(h, n):
    return {"n": int(n), "giuste": int(h), "quota": round(h / n, 4) if n else None,
            "p": float(binom.sf(h - 1, n, 0.5)) if n else None}


def t1_stats(t: pd.DataFrame, rng=None, nperm=0) -> dict:
    """Quota di sorprese indovinate per gruppo e periodo, più nullo di indipendenza."""
    t = t[t.a.notna() & t.f.notna() & t.prev.notna()]
    res = {}
    for per in PERIODS:
        tp = t[t.periodo == per]
        ok = tp[(tp.p != 0) & (tp.s != 0)]
        r = {"tutti": {**btest(int((ok.p == ok.s).sum()), len(ok)),
                       "in_linea": int(((tp.p != 0) & (tp.s == 0)).sum()), "senza_previsione": int((tp.p == 0).sum())}}
        exp = 0.0
        for g in TITLES:
            og = ok[ok.gruppo == g]
            tg = tp[tp.gruppo == g]
            a_, b_ = ((og.p > 0).mean(), (og.s > 0).mean()) if len(og) else (np.nan, np.nan)
            e = len(og) * (a_ * b_ + (1 - a_) * (1 - b_)) if len(og) else 0.0
            exp += e
            r[g] = {**btest(int((og.p == og.s).sum()), len(og)), "in_linea": int(((tg.p != 0) & (tg.s == 0)).sum()),
                    "senza_previsione": int((tg.p == 0).sum()), "quota_attesa_indip": round(e / len(og), 4) if len(og) else None,
                    "quota_prudente": round(float((og.p == og.s).sum()) / max(1, len(og) + int(((tg.p != 0) & (tg.s == 0)).sum())), 4)}
        r["tutti"]["quota_attesa_indip"] = round(exp / len(ok), 4) if len(ok) else None
        r["tutti"]["quota_prudente"] = round(r["tutti"]["giuste"] / max(1, len(ok) + r["tutti"]["in_linea"]), 4)
        if nperm and len(ok):
            obs = r["tutti"]["giuste"]
            strata = [(og.p.to_numpy(), og.s.to_numpy()) for _, og in ok.groupby("gruppo")]
            cnt = 0
            for _ in range(nperm):
                h = sum(int((rng.permutation(pp) == ss).sum()) for pp, ss in strata)
                cnt += h >= obs
            r["tutti"]["p_permutazioni_indip"] = (cnt + 1) / (nperm + 1)
        res[per] = r
    return res


def ticks_for(t0: pd.Timestamp):
    for p in (CACHE / f"{t0:%Y%m%d_%H%M}.npz", CACHE / f"{t0:%Y%m%d_%H%M}_x17.npz"):
        if p.exists():
            z = np.load(p)
            return z["t"], z["bid"], z["ask"]
    return None


def ensure(t0):
    if ticks_for(t0) is None:
        try:
            fetch_retry(t0)
        except Exception as e:  # noqa: BLE001
            return f"{t0}: {e}"
    return None


def measure(t0: pd.Timestamp) -> dict:
    z = ticks_for(t0)
    if z is None:
        return {"tick": "mancanti"}
    t, bid, ask = z
    pre = np.nonzero(t < 0)[0]
    n1 = int(((t >= 0) & (t < 60_000)).sum())
    if not len(pre) or t[pre[-1]] < -120_000 or n1 < 5:
        return {"tick": "non validi"}
    mid = (bid + ask) / 2
    i1 = int(np.searchsorted(t, 60_000, side="left") - 1)
    out = {"tick": "ok", "mv": float(mid[i1] - mid[pre[-1]])}
    j = int(np.searchsorted(t, -30_000, side="right") - 1)
    if j < 0 or t[j] < -120_000:
        return out
    b, a = quotes(bid, ask, "S1")
    out["spread0"] = float(ask[j] - bid[j])
    for name, end in (("60", 60_000), ("300", 300_000)):
        if t.max() < end or not ((t > t[j]) & (t < end)).any():
            continue
        out[f"RL{name}"] = sim(t, b, a, j, 1, None, end)
        out[f"RS{name}"] = sim(t, b, a, j, -1, None, end)
    return out


def slots(tab: pd.DataFrame, cpi_title: str) -> pd.DataFrame:
    """Slot rossi (famiglia dello slot) + slot CPI/NFP, con la previsione del titolo dello slot."""
    cal = pd.read_parquet(get_settings().research_dir / "phase2" / "hx15" / "calendario_tutti.parquet")
    cal = cal[(cal.fam != "VERBALI") & (cal.t0 >= START) & (cal.t0 <= END)]
    rows = []
    for r in cal.itertuples():
        m = tab[(tab.gruppo == r.fam) & (tab.t0 == r.t0)]
        rows.append({"t0": r.t0, "gruppo": r.fam, "event": m.event.iat[0] if len(m) else None,
                     "p": float(m.p.iat[0]) if len(m) else np.nan, "s": float(m.s.iat[0]) if len(m) else np.nan})
    for g, title in (("CPI", cpi_title), ("NFP", "Non-Farm Employment Change")):
        m = tab[(tab.event == title) & tab.a.notna()]
        for r in m.itertuples():
            rows.append({"t0": r.t0, "gruppo": g, "event": title, "p": r.p, "s": r.s})
    s = pd.DataFrame(rows).sort_values("t0").reset_index(drop=True)
    s["orient"] = s.gruppo.map(ORIENT)
    s["dir_prev"] = s.p * s.orient
    s["dir_vera_sorpresa"] = s.s * s.orient
    s["anno"] = s.t0.dt.year
    s["periodo"] = s.anno.map(period)
    return s


def t2t3(s: pd.DataFrame) -> dict:
    res = {}
    for per in PERIODS:
        sp = s[s.periodo == per]
        r = {}
        for g in ["tutti"] + sorted(s.gruppo.unique()):
            sg = sp if g == "tutti" else sp[sp.gruppo == g]
            v = sg[(sg.tick == "ok") & sg.mv.notna() & (sg.mv != 0)]
            w = v[v.dir_prev.fillna(0) != 0]
            gold = btest(int((np.sign(w.mv) == w.dir_prev).sum()), len(w))
            ce = v[v.dir_vera_sorpresa.fillna(0) != 0]
            x = {"slot": int(len(sg)), "senza_titolo": int(sg.event.isna().sum()),
                 "senza_previsione": int((sg.dir_prev.fillna(0) == 0).sum()),
                 "tick_mancanti_o_non_validi": int((sg.tick != "ok").sum()), "oro": gold,
                 "tetto_sorpresa_vera": btest(int((np.sign(ce.mv) == ce.dir_vera_sorpresa).sum()), len(ce))}
            for e in ("60", "300"):
                if f"RL{e}" not in w:
                    continue
                q = w[w[f"RL{e}"].notna()]
                rule = np.where(q.dir_prev > 0, q[f"RL{e}"], q[f"RS{e}"])
                rnd = (q[f"RL{e}"] + q[f"RS{e}"]).to_numpy() / 2
                dif = rule - rnd
                n = len(q)
                x[f"R{e}"] = {"n": n, "regola": round(float(rule.mean()), 4) if n else None,
                              "caso": round(float(rnd.mean()), 4) if n else None,
                              "t_regola": round(float(rule.mean() / rule.std(ddof=1) * np.sqrt(n)), 2) if n > 2 else None,
                              "scarto": round(float(dif.mean()), 4) if n else None,
                              "t_scarto": round(float(dif.mean() / dif.std(ddof=1) * np.sqrt(n)), 2) if n > 2 and dif.std() > 0 else None,
                              "sd_regola": round(float(rule.std(ddof=1)), 3) if n > 2 else None}
            r[g] = x
        res[per] = r
    return res


def per_year(t: pd.DataFrame, s: pd.DataFrame) -> dict:
    t = t[t.a.notna() & t.f.notna() & t.prev.notna() & (t.p != 0) & (t.s != 0)]
    v = s[(s.tick == "ok") & s.mv.notna() & (s.mv != 0) & (s.dir_prev.fillna(0) != 0)]
    out = {}
    for y in range(2008, 2027):
        ty, vy = t[t.anno == y], v[v.anno == y]
        rule = np.where(vy.dir_prev > 0, vy.RL60, vy.RS60) if len(vy) else np.zeros(0)
        out[str(y)] = {"sorpresa": f"{int((ty.p == ty.s).sum())}/{len(ty)}",
                       "oro": f"{int((np.sign(vy.mv) == vy.dir_prev).sum())}/{len(vy)}",
                       "R60_regola": round(float(np.nanmean(rule)), 3) if len(vy) else None}
    return out


def verdict(t1: dict, t2: dict) -> dict:
    c1 = t1["conferma"]["tutti"]
    c2 = t2["conferma"]["tutti"]["oro"]
    s1, s2 = t1["studio"]["tutti"], t2["studio"]["tutti"]["oro"]
    k = {"1_conferma_sorpresa": bool(c1["quota"] > 0.55 and c1["p"] < 0.01),
         "2_conferma_oro": bool(c2["quota"] > 0.52 and c2["p"] < 0.05),
         "3_studio_stesso_verso": bool(s1["quota"] > 0.5 and s2["quota"] > 0.5)}
    passa = all(k.values())
    nota = None
    if passa and (t2["conferma"]["tutti"]["R60"]["scarto"] or 0) <= 0:
        nota = "passa ma con lo spread non rende"
    if k["1_conferma_sorpresa"] and not k["2_conferma_oro"]:
        nota = "il meccanismo c'è, il mercato lo sconta"
    return {"criteri": k, "passa": passa, "nota": nota}


if __name__ == "__main__":
    rng = np.random.default_rng(26)
    u = load_ff()
    tab = table(u, chain=False)
    tab_c = table(u, chain=True)
    # controllo: la colonna previous (non usata) coincide con l'actual precedente?
    q = tab[tab.pv.notna() & tab.prev.notna()]
    prev_check = {g: round(float((np.abs(x.pv - x.prev) < TOL).mean()), 3) for g, x in q.groupby("gruppo")}
    t1 = t1_stats(tab, rng, 10_000)
    t1_chain = t1_stats(tab_c)
    s_main = slots(tab, "CPI m/m")
    s_core = slots(tab, "Core CPI m/m")
    s_chain = slots(tab_c, "CPI m/m")
    need = sorted(set(s_main.t0) | set(s_core.t0))
    with ThreadPoolExecutor(4) as ex:
        errs = [e for e in ex.map(ensure, need) if e]
    M = pd.DataFrame([{"t0": k, **measure(k)} for k in need])
    s_main, s_core, s_chain = (s.merge(M, on="t0", how="left") for s in (s_main, s_core, s_chain))
    t23 = t2t3(s_main)
    res = {"pre_registrazione": "docs/IPOTESI-HX26-ANCORAGGIO-CONSENSUS.md",
           "verdetto": verdict(t1, t23),
           "T1_sorpresa": t1, "T2_T3_oro_trade": t23,
           "varianti": {"T1_ultimo_pubblicato": t1_chain, "T2_T3_ultimo_pubblicato": t2t3(s_chain),
                        "T2_T3_cpi_core": {p: {g: v for g, v in d.items() if g in ("tutti", "CPI")}
                                           for p, d in t2t3(s_core).items()}},
           "per_anno": per_year(tab, s_main),
           "controllo_previous_ff_uguale_actual_precedente": prev_check,
           "spread_mediano_T0_30s_pips": round(float(s_main.spread0.median() * 10), 2),
           "errori_download": errs}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "hx26_ancoraggio.json").write_text(json.dumps(res, indent=1, default=str))
    tab.to_csv(OUT / "hx26_release.csv", index=False)
    s_main.to_csv(OUT / "hx26_slot.csv", index=False)
    print(json.dumps(res["verdetto"], indent=1))
    for per in ("studio", "conferma"):
        print(per, "T1", res["T1_sorpresa"][per]["tutti"])
        print(per, "T2", res["T2_T3_oro_trade"][per]["tutti"])
