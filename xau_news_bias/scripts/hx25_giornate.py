"""H-X25 (docs/IPOTESI-HX25-GIORNATE-RETAIL-PPI.md): giornate Retail + PPI insieme, quanto muovono e dove uscire.

Gruppi R / P / RP dalle righe USD ForexFactory dello stesso minuto (qualunque impatto). Misure per release
(range M1 bid, arrivo 1 e 5 min, chiusura M1, dopo la M1), uscite E60/E300/TP passo per passo con il trade di
Davide (T0-30 s, stop 100 pips, spread max 40 pips), sorpresa standardizzata contro la grandezza della candela.
Scrive research_output/phase2/hx16/hx25_giornate.json.
"""
import json
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
from hx19_tp import STOP, sim  # noqa: E402
from xnb.config import get_settings  # noqa: E402

PIP = 0.10
END = pd.Timestamp("2026-10-15 13:00", tz="UTC")
ITEMS = {"R": "Retail Sales m/m", "P": "PPI m/m", "Rc": "Core Retail Sales m/m", "Pc": "Core PPI m/m"}
PERIODS = {"2011-18": (2011, 2018), "2019-22": (2019, 2022), "2023-26": (2023, 2026), "2019-26": (2019, 2026)}
EXITS = ["E60", "E300", "TP50", "TP75", "TP50_5", "TP75_5"]


def ff_usd() -> pd.DataFrame:
    ff = pd.read_csv(FF)
    ff = ff[ff.currency == "USD"].copy()
    d = pd.to_datetime(ff.date, format="%a %b %d %Y", errors="coerce")
    hm = ff.time.str.extract(r"^(\d+):(\d+)$").astype(float)
    ff["t0"] = (d + pd.to_timedelta(hm[0], unit="h") + pd.to_timedelta(hm[1], unit="m")).dt.tz_localize("UTC")
    return ff[ff.t0.notna()]


def sim_x(t, b, a, j, d, tp, end_ms):
    """Come hx19_tp.sim, più l'esito: 'tp', 'stop' o 'tempo'. Controllato contro sim a ogni chiamata."""
    entry = a[j] if d > 0 else b[j]
    k = np.nonzero((t > t[j]) & (t < end_ms))[0]
    fav = d * ((b[k] if d > 0 else a[k]) - entry)
    hs = np.nonzero(fav <= -STOP)[0]
    ht = np.nonzero(fav >= tp)[0] if tp else np.zeros(0, int)
    s = hs[0] if len(hs) else 10 ** 9
    q = ht[0] if len(ht) else 10 ** 9
    if s < q:
        r, how = -1.0, "stop"
    elif q < 10 ** 9:
        r, how = tp / STOP, "tp"
    else:
        r, how = max(float(fav[-1]) / STOP, -1.0), "tempo"
    assert abs(r - sim(t, b, a, j, d, tp, end_ms)) < 1e-12
    return r, how


def measure(t0, names):
    p = CACHE / f"{t0:%Y%m%d_%H%M}.npz"
    if not p.exists():
        p = fetch_retry(t0)
    z = np.load(p)
    t, bid, ask = z["t"], z["bid"], z["ask"]
    pre = np.nonzero(t < 0)[0]
    if not len(pre) or t[pre[-1]] < -120_000 or ((t >= 0) & (t < 60_000)).sum() < 5 or t.max() < 300_000:
        return None
    j = int(np.searchsorted(t, -30_000, side="right") - 1)
    if j < 0 or t[j] < -120_000:
        return None
    mid = (bid + ask) / 2
    p0 = float(mid[j])
    i1 = int(np.searchsorted(t, 60_000, side="left") - 1)
    i5 = int(np.searchsorted(t, 300_000, side="left") - 1)
    w1 = (t >= 0) & (t < 60_000)
    b_pre = float(bid[pre[-1]])
    rng = max(bid[w1].max(), b_pre) - min(bid[w1].min(), b_pre)
    d = int(np.sign(mid[i1] - mid[j]))
    g = ("R" if ITEMS["R"] in names else "") + ("P" if ITEMS["P"] in names else "")
    row = {"t0": t0, "y": t0.year, "g": g, "px": p0, "rng": float(rng), "rng_pct": float(rng) / p0 * 100, "d": d}
    if d:
        a1 = (t > t[j]) & (t < 60_000)
        a5 = (t > t[j]) & (t < 300_000)
        row.update(arr1=float((d * (mid[a1] - p0)).max()), arr5=float((d * (mid[a5] - p0)).max()),
                   clo=float(d * (mid[i1] - p0)), dopo=float(d * (mid[i5] - mid[i1])))
        row["arr1_pct"], row["arr5_pct"] = row["arr1"] / p0 * 100, row["arr5"] / p0 * 100
        bq, aq = quotes(bid, ask, "S1")
        row["path"] = (t, bq, aq, j)
    return row


def surprises(ff: pd.DataFrame, t0s) -> pd.DataFrame:
    """z = |actual - forecast| / media dei |actual - forecast| delle release precedenti dello stesso dato (>= 12)."""
    out = pd.DataFrame(index=pd.Index(t0s, name="t0"))
    for code, ev in ITEMS.items():
        x = ff[ff.event == ev].drop_duplicates("t0").sort_values("t0")
        act = pd.to_numeric(x.actual.map(num), errors="coerce")
        fc = pd.to_numeric(x.forecast.map(num), errors="coerce")
        x = x.assign(s=(act - fc).abs())
        zs, present = {}, {}
        for t0 in t0s:
            cur = x[x.t0 == t0]
            if not len(cur):
                present[t0], zs[t0] = False, 0.0
                continue
            present[t0] = True
            hist = x[(x.t0 < t0) & x.s.notna()].s
            sv = cur.s.iat[0]
            zs[t0] = np.nan if (sv != sv or len(hist) < 12 or hist.mean() == 0) else float(sv / hist.mean())
        out[f"z{code}"] = pd.Series(zs)
        out[f"in{code}"] = pd.Series(present)
    out["S"] = out.zR + out.zP
    out["S4"] = out.zR + out.zP + out.zRc + out.zPc
    return out.reset_index()


def per(df, name):
    a, b = PERIODS[name]
    return df[(df.y >= a) & (df.y <= b)]


def binom2(k, n, p=0.5):
    return float(binomtest(int(k), int(n), p).pvalue) if n else None


def exits(df: pd.DataFrame, lev_cols: dict) -> pd.DataFrame:
    """R per release, uscita e direzione (giusta / caso = media LONG e SHORT), più se il TP è stato toccato."""
    rows = []
    for e in df.itertuples():
        t, b, a, j = e.path
        spec = {"E60": (None, 60_000), "E300": (None, 300_000)}
        for code, col in lev_cols.items():
            lev = getattr(e, col)
            spec[code] = (lev / 100 * e.px, 300_000 if code.endswith("_5") else 60_000)
        r = {"t0": e.t0, "y": e.y, "g": e.g}
        for code, (tp, end) in spec.items():
            rg, how = sim_x(t, b, a, j, e.d, tp, end)
            rl, _ = sim_x(t, b, a, j, 1, tp, end)
            rs, _ = sim_x(t, b, a, j, -1, tp, end)
            r[f"{code}_g"], r[f"{code}_hit"] = rg, how == "tp"
            r[f"{code}_c"], r[f"{code}_L"], r[f"{code}_S"] = (rl + rs) / 2, rl, rs
        rows.append(r)
    return pd.DataFrame(rows)


def exit_table(x: pd.DataFrame) -> dict:
    out = {}
    for name in ("2011-18", "2019-22", "2023-26", "2019-26"):
        g = per(x, name)
        res = {"n": len(g)}
        for code in EXITS:
            rg, rc = g[f"{code}_g"], g[f"{code}_c"]
            lc = pd.concat([g[f"{code}_L"], g[f"{code}_S"]])
            item = {"R_giusta": round(float(rg.mean()), 3), "utile_giusta": round(float((rg > 0).mean()), 3),
                    "R_caso": round(float(rc.mean()), 3), "utile_caso": round(float((lc > 0).mean()), 3),
                    "R_long": round(float(g[f"{code}_L"].mean()), 3), "R_short": round(float(g[f"{code}_S"].mean()), 3)}
            if code != "E60":
                diff = rg - g["E60_g"]
                win, loss = int((diff > 1e-9).sum()), int((diff < -1e-9).sum())
                item.update(meglio=win, peggio=loss, p_segno=binom2(win, win + loss),
                            diff_giusta=round(float(diff.mean()), 3), diff_caso=round(float((rc - g["E60_c"]).mean()), 3))
            if code.startswith("TP"):
                hit = g[f"{code}_hit"]
                nominal = 0.5 if code.startswith("TP50") else 0.25
                item.update(toccato=round(float(hit.mean()), 3), p_toccato=binom2(hit.sum(), len(hit), nominal))
            res[code] = item
        out[name] = res
    verdict = {}
    for code in EXITS[1:]:
        better = all(out[p][code]["R_giusta"] > out[p]["E60"]["R_giusta"] for p in ("2019-22", "2023-26"))
        harm = [p for p in ("2019-22", "2023-26") if out[p][code]["diff_caso"] < -0.05]
        verdict[code] = {"migliore": bool(better), "peggiora_caso_oltre_0.05": harm}
    out["verdetto"] = verdict
    return out


def levels(df: pd.DataFrame, by_group: bool) -> pd.DataFrame:
    df = df.copy()
    for col in ("L50_1", "L75_1", "L50_5", "L75_5"):
        df[col] = np.nan
    for i in range(len(df)):
        prev = df.iloc[:i]
        if by_group:
            prev = prev[prev.g == df.g.iat[i]]
        prev = prev.tail(12)
        if len(prev) < 12:
            continue
        df.loc[df.index[i], "L50_1"] = prev.arr1_pct.median()
        df.loc[df.index[i], "L75_1"] = prev.arr1_pct.quantile(0.75)
        df.loc[df.index[i], "L50_5"] = prev.arr5_pct.median()
        df.loc[df.index[i], "L75_5"] = prev.arr5_pct.quantile(0.75)
    return df


def describe(df: pd.DataFrame) -> dict:
    def stats(g):
        if not len(g):
            return {"n": 0}
        gd = g[g.d != 0]
        return {"n": len(g), "range_pips": round(float(g.rng.median() / PIP), 1), "range_pct": round(float(g.rng_pct.median()), 3),
                "arr1_pips": round(float(gd.arr1.median() / PIP), 1), "arr1_pct": round(float(gd.arr1_pct.median()), 3),
                "arr5_pips": round(float(gd.arr5.median() / PIP), 1), "arr5_pct": round(float(gd.arr5_pct.median()), 3),
                "chiusura_pips": round(float(gd.clo.median() / PIP), 1), "chiusura_pct": round(float((gd.clo / gd.px * 100).median()), 3),
                "dopo_pips": round(float(gd.dopo.median() / PIP), 1), "continua": round(float((gd.dopo > 0).mean()), 3),
                "prezzo": round(float(g.px.median()))}
    out = {}
    for grp in ("R", "P", "RP", "tutti"):
        sub = df if grp == "tutti" else df[df.g == grp]
        out[grp] = {"2011-18": stats(per(sub, "2011-18")), "2019-22": stats(per(sub, "2019-22")),
                    "2023-26": stats(per(sub, "2023-26")),
                    "anni": {int(y): stats(g) for y, g in sub[sub.y >= 2019].groupby("y")}}
    return out


def spear(x, y):
    m = np.isfinite(x) & np.isfinite(y)
    if m.sum() < 10:
        return {"n": int(m.sum())}
    r = spearmanr(x[m], y[m], alternative="greater")
    return {"n": int(m.sum()), "rho": round(float(r.statistic), 3), "p_unilaterale": round(float(r.pvalue), 4)}


def surprise_part(df: pd.DataFrame, sp: pd.DataFrame) -> dict:
    df = df.merge(sp, on="t0", how="left")
    rel = np.full(len(df), np.nan)
    for i in range(12, len(df)):
        rel[i] = df.rng_pct.iat[i] / df.rng_pct.iloc[i - 12:i].median()
    df["rel"] = rel
    # terzo alto / basso di S rispetto alle S precedenti (almeno 24)
    terz = []
    for i in range(len(df)):
        prev = df.S.iloc[:i].dropna()
        s = df.S.iat[i]
        if len(prev) < 24 or s != s:
            terz.append(None)
        else:
            terz.append("alto" if s > prev.quantile(2 / 3) else ("basso" if s < prev.quantile(1 / 3) else "medio"))
    df["terzo"] = terz
    out = {"principale": {}, "gruppi": {}, "S4": {}, "pips": {}, "terzi": {}}
    for name in ("2011-18", "2019-26", "2019-22", "2023-26"):
        g = per(df, name)
        out["principale"][name] = spear(g.S.to_numpy(float), g.rel.to_numpy(float))
        out["S4"][name] = spear(g.S4.to_numpy(float), g.rel.to_numpy(float))
        out["pips"][name] = spear(g.S.to_numpy(float), g.rng.to_numpy(float))
        out["gruppi"][name] = {grp: spear(g[g.g == grp].S.to_numpy(float), g[g.g == grp].rel.to_numpy(float)) for grp in ("R", "P", "RP")}
        out["terzi"][name] = {k: {"n": int(len(h)), "range_pips": round(float(h.rng.median() / PIP), 1),
                                  "rel": round(float(h.rel.median()), 2)}
                              for k, h in g.groupby("terzo")}
    # NON pre-registrato, aggiunto dopo aver visto il risultato: ranghi di S e rel dentro ciascun gruppo, poi
    # insieme, per togliere l'effetto "quale news esce" (RP ha S circa doppia e candele diverse)
    out["controllo_entro_gruppo_non_preregistrato"] = {}
    for name in ("2011-18", "2019-26", "2019-22", "2023-26"):
        g = per(df, name)
        g = g[g.S.notna() & g.rel.notna()]
        rs, rr = g.groupby("g").S.rank(pct=True), g.groupby("g").rel.rank(pct=True)
        out["controllo_entro_gruppo_non_preregistrato"][name] = {
            **spear(rs.to_numpy(float), rr.to_numpy(float)),
            "mediane": {k: {"S": round(float(h.S.median()), 2), "rel": round(float(h.rel.median()), 2)} for k, h in g.groupby("g")}}
    pr = out["principale"]
    out["passa"] = bool(all(pr[p].get("rho", 0) > 0 and pr[p].get("p_unilaterale", 1) < 0.05 for p in ("2011-18", "2019-26")))
    out["esclusi_senza_sorpresa"] = int(df.S.isna().sum())
    out["ultime"] = [{"d": str(e.t0)[:16], "g": e.g, "S": None if e.S != e.S else round(e.S, 2),
                      "range_pips": round(e.rng / PIP), "rel": None if e.rel != e.rel else round(e.rel, 2)}
                     for e in df.tail(15).itertuples()]
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    cal = pd.read_parquet(R / "hx15" / "calendario_tutti.parquet")
    sel = cal[cal.fam.isin(["RETAIL", "PPI"]) & (cal.t0 >= pd.Timestamp("2011-01-01", tz="UTC")) & (cal.t0 <= END)]
    ff = ff_usd()
    rows, skipped = [], []
    for t0 in sel.t0:
        names = set(ff[ff.t0 == t0].event)
        r = measure(t0, names)
        if r is None:
            skipped.append(str(t0))
            continue
        rows.append(r)
    df = pd.DataFrame(rows).sort_values("t0").reset_index(drop=True)
    print("release", len(df), "saltate", skipped, df.groupby([df.y >= 2019, "g"]).size().to_dict(), "d=0:", int((df.d == 0).sum()))
    dd = df[df.d != 0].reset_index(drop=True)
    cols = {"TP50": "L50_1", "TP75": "L75_1", "TP50_5": "L50_5", "TP75_5": "L75_5"}
    main = levels(dd, by_group=False)
    xm = exits(main[main.L50_1.notna()], cols)
    side = levels(dd, by_group=True)
    xs = exits(side[side.L50_1.notna()], cols)
    out = {"n": len(df), "saltate": skipped, "d_zero": int((df.d == 0).sum()),
           "gruppi_n": {f"{k[0]}|{k[1]}": int(v) for k, v in df.groupby(["y", "g"]).size().items()},
           "descrittivo": describe(df),
           "uscite": exit_table(xm), "uscite_per_gruppo": {g: exit_table(xm[xm.g == g]) for g in ("R", "P", "RP")},
           "uscite_livelli_stesso_gruppo": exit_table(xs)}
    sp = surprises(ff, list(df.t0))
    out["sorpresa"] = surprise_part(df, sp)
    last = main.tail(12)
    px = float(df.px.iat[-1])
    out["livelli_oggi"] = {"ultima": str(df.t0.iat[-1])[:16], "prezzo": round(px, 2),
                           **{k: {"pct": round(float(f(last)), 3), "pips": round(float(f(last)) / 100 * px / PIP)}
                              for k, f in {"L50_1": lambda x: x.arr1_pct.median(), "L75_1": lambda x: x.arr1_pct.quantile(.75),
                                           "L50_5": lambda x: x.arr5_pct.median(), "L75_5": lambda x: x.arr5_pct.quantile(.75)}.items()}}
    (R / "hx16" / "hx25_giornate.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    print(json.dumps(out["uscite"], indent=1))
    print(json.dumps(out["sorpresa"]["principale"], indent=1), out["sorpresa"]["passa"])
