"""H-X24 (docs/IPOTESI-HX24-NOWCAST-CLEVELAND.md): CPI, nowcast Cleveland Fed contro consensus ForexFactory.

Quattro regole (H0, H1, C0, C1): scarto nowcast - consensus > 0 -> CPI caldo atteso -> SHORT oro.
T1 = segno della sorpresa (stessa serie), T2 = direzione della prima M1 (mv), T3 = trade di Davide in R.
Studio 2013-08 -> 2018-12, conferma 2019-01 -> 2026-09.
"""
import json
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import binomtest, spearmanr  # noqa: E402

from hx11_site import quotes  # noqa: E402
from hx15_build import CACHE, FF, num  # noqa: E402
from hx18_inversione import fetch_retry  # noqa: E402
from hx19_tp import sim  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.consensus import ClevelandFedNowcast  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
START, SPLIT, END = pd.Timestamp("2013-08-01", tz="UTC"), pd.Timestamp("2019-01-01", tz="UTC"), pd.Timestamp("2026-10-01", tz="UTC")
RULES = {"H0": ("h", 0.0), "H1": ("h", 0.1), "C0": ("c", 0.0), "C1": ("c", 0.1)}


def holm(ps):
    ps = np.asarray(ps, float)
    o = np.argsort(ps)
    adj = np.empty_like(ps)
    run = 0.0
    for r, i in enumerate(o):
        run = max(run, min(1.0, (len(ps) - r) * ps[i]))
        adj[i] = run
    return adj.tolist()


def ff_cpi() -> pd.DataFrame:
    df = pd.read_csv(FF, encoding="utf-8-sig")
    u = df[(df.currency == "USD") & df.event.isin(["CPI m/m", "Core CPI m/m"])].copy()
    u["d"] = pd.to_datetime(u["date"], format="%a %b %d %Y").dt.date
    u["k"] = u.event.map({"CPI m/m": "h", "Core CPI m/m": "c"})
    u["fc"] = u.forecast.map(num)
    u["act"] = u.actual.map(num)
    dup = u.duplicated(["d", "k"], keep=False)
    assert not dup.any(), f"righe FF doppie: {u[dup][['d', 'event']].values.tolist()}"
    w = u.pivot(index="d", columns="k", values=["fc", "act"])
    w.columns = [f"{a}_{b}" for a, b in w.columns]
    return w.reset_index()


def events() -> pd.DataFrame:
    cn = pd.read_parquet(ROOT / "research_output/phase2/hx15/cpi_nfp.parquet")
    e = cn[(cn.fam == "CPI") & (cn.t0 >= START) & (cn.t0 < END)].copy().reset_index(drop=True)
    with sqlite3.connect(get_settings().db_path) as c:
        db = pd.read_sql("select t0_utc, reference_period from events where family='CPI'", c)
    db["t0"] = pd.to_datetime(db.t0_utc, utc=True).astype(e.t0.dtype)
    e = e.merge(db[["t0", "reference_period"]], on="t0", how="left")
    fb = (e.t0.dt.tz_localize(None).dt.to_period("M") - 1).astype(str)
    e["ref_fallback"] = e.reference_period.isna()
    e["ref"] = e.reference_period.fillna(fb)
    nc = ClevelandFedNowcast().load(max_age_h=1e9)
    for k, s in (("h", "nc_cpi"), ("c", "nc_core")):
        e[f"nc_{k}"] = [ClevelandFedNowcast.asof(nc, r, s, t.to_pydatetime()) for r, t in zip(e.ref, e.t0)]
    # data del nowcast usato (controllo point-in-time)
    sub = nc[nc.series == "nc_cpi"]
    e["nc_obs_date"] = [str(sub[(sub.target == r) & (sub.available_from_utc <= t.to_pydatetime())].obs_date.max())
                        for r, t in zip(e.ref, e.t0)]
    e["d"] = e.t0.dt.date
    e = e.merge(ff_cpi(), on="d", how="left")
    for k in ("h", "c"):
        e[f"gap_{k}"] = (e[f"nc_{k}"] - e[f"fc_{k}"]).round(3)
        e[f"surp_{k}"] = np.sign((e[f"act_{k}"] - e[f"fc_{k}"]).round(3))
    return e


def load_ticks(t0: pd.Timestamp):
    for p in (CACHE / f"{t0:%Y%m%d_%H%M}_x17.npz", CACHE / f"{t0:%Y%m%d_%H%M}.npz"):
        if p.exists():
            z = np.load(p)
            return z["t"], z["bid"], z["ask"], "cache"
    try:
        p = fetch_retry(t0)
    except Exception as ex:  # noqa: BLE001
        return None, None, None, f"non scaricabile: {ex}"
    z = np.load(p)
    return z["t"], z["bid"], z["ask"], "scaricato"


def trades(t0: pd.Timestamp) -> dict:
    t, bid, ask, src = load_ticks(t0)
    out = {"tick_src": src}
    if t is None or not len(t) or t.max() < 300_000 or (t <= -30_000).sum() == 0:
        out["tick_ok"] = False
        return out
    j = int(np.searchsorted(t, -30_000, side="right") - 1)
    if t[j] < -120_000 or ((t > t[j]) & (t < 60_000)).sum() == 0:
        out["tick_ok"] = False
        return out
    b, a = quotes(bid, ask, "S1")
    out["tick_ok"] = True
    out["spread0_pips"] = float(ask[j] - bid[j]) / 0.1
    for lab, end in (("60", 60_000), ("300", 300_000)):
        out[f"RL{lab}"] = sim(t, b, a, j, +1, None, end)
        out[f"RS{lab}"] = sim(t, b, a, j, -1, None, end)
    return out


def binom(k, n):
    return float(binomtest(int(k), int(n), 0.5, alternative="greater").pvalue) if n else 1.0


def rstats(x):
    x = np.asarray(x, float)
    x = x[~np.isnan(x)]
    if len(x) < 2:
        return {"n": int(len(x)), "media": float(x.mean()) if len(x) else None}
    sd = float(x.std(ddof=1))
    return {"n": int(len(x)), "media": float(x.mean()), "sd": sd, "somma": float(x.sum()),
            "t": float(x.sum() / (sd * np.sqrt(len(x)))) if sd > 0 else None}


def evaluate(e: pd.DataFrame, rule: str) -> dict:
    k, thr = RULES[rule]
    g = e[f"gap_{k}"]
    sig = g.notna() & (g != 0) & (g.abs() >= thr - 1e-9)
    s = e[sig].copy()
    s["dir"] = -np.sign(s[f"gap_{k}"]).astype(int)   # gap > 0 -> CPI caldo -> oro giù -> SHORT
    # T1 meccanismo
    t1 = s[s[f"surp_{k}"].notna() & (s[f"surp_{k}"] != 0)]
    h1 = int((np.sign(t1[f"gap_{k}"]) == t1[f"surp_{k}"]).sum())
    # T2 oro
    t2 = s[s.mv.notna() & (s.mv != 0)]
    h2 = int((np.sign(t2.mv) == t2["dir"]).sum())
    out = {"segnali": int(len(s)), "long": int((s["dir"] > 0).sum()), "short": int((s["dir"] < 0).sum()),
           "T1": {"n": int(len(t1)), "in_linea_tolte": int((s[f"surp_{k}"] == 0).sum()),
                  "senza_actual": int(s[f"surp_{k}"].isna().sum()), "giuste": h1,
                  "quota": h1 / len(t1) if len(t1) else None, "p": binom(h1, len(t1)),
                  "quota_con_in_linea_sbagliate": h1 / int(s[f"surp_{k}"].notna().sum()) if s[f"surp_{k}"].notna().any() else None},
           "T2": {"n": int(len(t2)), "giuste": h2, "quota": h2 / len(t2) if len(t2) else None, "p": binom(h2, len(t2)),
                  "mv_medio_pips_nella_direzione": float((t2["dir"] * t2.mv).mean() / 0.1) if len(t2) else None}}
    t3 = s[s.tick_ok == True]  # noqa: E712
    out["T3"] = {"senza_tick": int(len(s) - len(t3))}
    for lab in ("60", "300"):
        rr = np.where(t3["dir"] > 0, t3[f"RL{lab}"], t3[f"RS{lab}"])
        rnd = (t3[f"RL{lab}"] + t3[f"RS{lab}"]) / 2
        out["T3"][f"T0+{lab}s"] = {"regola": rstats(rr), "caso": rstats(rnd), "regola_meno_caso": rstats(rr - rnd),
                                   "vinti": int((rr > 0).sum())}
    return out


def by_year(e: pd.DataFrame, rule: str) -> dict:
    k, thr = RULES[rule]
    out = {}
    for y, ey in e.groupby(e.t0.dt.year):
        r = evaluate(ey, rule)
        out[int(y)] = {"segnali": r["segnali"], "T1": f"{r['T1']['giuste']}/{r['T1']['n']}", "T2": f"{r['T2']['giuste']}/{r['T2']['n']}",
                       "R60": r["T3"]["T0+60s"]["regola"].get("media"), "caso60": r["T3"]["T0+60s"]["caso"].get("media")}
    return out


def main():
    e = events()
    tr = pd.DataFrame([trades(t) for t in e.t0])
    e = pd.concat([e, tr], axis=1)
    per = {"studio": e[e.t0 < SPLIT], "conferma": e[e.t0 >= SPLIT],
           "ultimi3_2024_26": e[e.t0 >= pd.Timestamp("2024-01-01", tz="UTC")]}
    res = {p: {r: evaluate(d, r) for r in RULES} for p, d in per.items()}
    # Holm sulle 4 regole, nella conferma, separato per T1 e T2
    for tgt in ("T1", "T2"):
        adj = holm([res["conferma"][r][tgt]["p"] for r in RULES])
        for r, a in zip(RULES, adj):
            res["conferma"][r][tgt]["p_holm"] = a
    verdict = {}
    for tgt in ("T1", "T2"):
        ok = [r for r in RULES
              if (res["conferma"][r][tgt]["quota"] or 0) > 0.5 and res["conferma"][r][tgt]["p_holm"] < 0.05
              and (res["studio"][r][tgt]["quota"] or 0) > 0.5]
        verdict[tgt] = ok
    # diagnostica del meccanismo: correlazione scarto - sorpresa (actual - forecast)
    diag = {}
    for p, d in per.items():
        for k in ("h", "c"):
            m = d[d[f"gap_{k}"].notna() & d[f"act_{k}"].notna()]
            rho, pv = spearmanr(m[f"gap_{k}"], m[f"act_{k}"] - m[f"fc_{k}"])
            diag[f"{p}_{k}"] = {"n": int(len(m)), "rho": float(rho), "p": float(pv)}
    # controlli dati
    chk = {
        "release": int(len(e)), "studio": int(len(per["studio"])), "conferma": int(len(per["conferma"])),
        "senza_nowcast_h": int(e.nc_h.isna().sum()), "senza_nowcast_c": int(e.nc_c.isna().sum()),
        "senza_forecast_h": int(e.fc_h.isna().sum()), "senza_forecast_c": int(e.fc_c.isna().sum()),
        "mese_rif_di_ripiego": e[e.ref_fallback].t0.astype(str).tolist(),
        "tick_validi": int((e.tick_ok == True).sum()),  # noqa: E712
        "tick_scaricati": int((e.tick_src == "scaricato").sum()),
        "tick_mancanti": e[e.tick_ok != True].t0.astype(str).tolist(),  # noqa: E712
        "gap_h_zero": int((e.gap_h == 0).sum()), "gap_c_zero": int((e.gap_c == 0).sum()),
        # il nowcast usato deve essere di un giorno PRIMA della release
        "nowcast_dello_stesso_giorno_o_dopo": int((pd.to_datetime(e.nc_obs_date, errors="coerce").dt.date >= e.d).sum()),
        "giorni_tra_nowcast_e_release_mediana": float((pd.to_datetime(e.d) - pd.to_datetime(e.nc_obs_date, errors="coerce")).dt.days.median()),
        # la sorpresa headline calcolata qui deve coincidere con 'sorpresa' (orientata per l'oro) di cpi_nfp.parquet
        "sorpresa_coerente_con_cpi_nfp": int(((-e.sorpresa) == e.surp_h)[e.sorpresa.notna() & e.surp_h.notna()].sum()),
        "sorpresa_confrontabili": int((e.sorpresa.notna() & e.surp_h.notna()).sum()),
        "gap_quantili_h": e.gap_h.quantile([0.1, 0.25, 0.5, 0.75, 0.9]).round(3).tolist(),
        "gap_quantili_c": e.gap_c.quantile([0.1, 0.25, 0.5, 0.75, 0.9]).round(3).tolist(),
    }
    out = {"controlli": chk, "risultati": res, "passa_T1_meccanismo": verdict["T1"], "passa_T2_oro": verdict["T2"],
           "PASSA": bool(verdict["T2"]), "diagnostica_rho": diag,
           "per_anno": {r: by_year(e, r) for r in RULES}}
    R = get_settings().research_dir / "phase2" / "hx16"
    (R / "hx24_nowcast.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    cols = ["t0", "ref", "nc_obs_date", "nc_h", "fc_h", "act_h", "gap_h", "surp_h", "nc_c", "fc_c", "act_c", "gap_c", "surp_c",
            "mv", "tick_ok", "spread0_pips", "RL60", "RS60", "RL300", "RS300"]
    e[cols].assign(t0=e.t0.astype(str)).to_csv(R / "hx24_nowcast_release.csv", index=False)
    print(json.dumps({"controlli": chk, "PASSA": out["PASSA"], "passa_T1": verdict["T1"], "passa_T2": verdict["T2"]}, indent=1, default=float))


if __name__ == "__main__":
    main()
