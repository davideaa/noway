"""H-X23 (docs/IPOTESI-HX23-MODELLO-VOLATILITA-NEWS.md): modello dei pips della news e direzione dalla posizione nel range."""
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import binom, spearmanr  # noqa: E402

from hx15_build import CACHE  # noqa: E402
from hx18_inversione import fetch_retry  # noqa: E402
from hx21_range import bars  # noqa: E402
from xnb import http  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
GVZ = ROOT / "data" / "cache" / "cboe" / "GVZCLS.csv"
VIX = ROOT / "data" / "cache" / "cboe" / "VIX_History.csv"
FEATS = ["l_mem3", "l_mem12", "l_gvz", "gvz_rel", "l_adr5", "l_adr21", "used_day", "used_week", "l_r1h", "l_r15", "l_vix"]


def load_iv():
    if not GVZ.exists():
        GVZ.write_text(http.get("https://fred.stlouisfed.org/graph/fredgraph.csv?id=GVZCLS", "fred", timeout=60).text)
    g = pd.read_csv(GVZ)
    g = pd.Series(pd.to_numeric(g.GVZCLS, errors="coerce").values, index=pd.to_datetime(g.observation_date)).dropna()
    v = pd.read_csv(VIX)
    v = pd.Series(v.CLOSE.values, index=pd.to_datetime(v.DATE, format="%m/%d/%Y")).dropna()
    return g, v


def one(t0, fam, p, h1, dD, dW, gvz, vix):
    z = np.load(p)
    t, bid, ask = z["t"], z["bid"], z["ask"]
    pre = np.nonzero(t < 0)[0]
    if not len(pre) or t[pre[-1]] < -120_000 or ((t >= 0) & (t < 60_000)).sum() < 5 or t.max() < 60_000 or t.min() > -3_000_000:
        return None
    mid = (bid + ask) / 2
    m0 = float(mid[pre[-1]])
    w1 = (t >= 0) & (t < 60_000)
    r1 = (max(mid[w1].max(), m0) - min(mid[w1].min(), m0)) / m0 * 100
    i1 = int(np.searchsorted(t, 60_000, side="left") - 1)
    mv = float(mid[i1] - m0)
    cut = t0 - pd.Timedelta(seconds=60)
    tday = (t0 + pd.Timedelta(hours=2)).normalize().tz_localize(None)
    day_start = (tday - pd.Timedelta(hours=2)).tz_localize("UTC")
    wk = tday - pd.Timedelta(days=tday.dayofweek)
    wk_start = (wk - pd.Timedelta(hours=2)).tz_localize("UTC")
    pre_ticks = (t >= t.min()) & (t < -60_000)
    tb = bid[pre_ticks]
    win_start = t0 + pd.Timedelta(milliseconds=int(t.min()))

    def so_far(start):
        hb = h1[(h1.index >= start) & (h1.index + pd.Timedelta(hours=1) <= win_start)]
        hi = max([hb.h.max()] if len(hb) else [] + [tb.max()]) if len(hb) else tb.max()
        lo = min(hb.l.min(), tb.min()) if len(hb) else tb.min()
        hi = max(hb.h.max(), tb.max()) if len(hb) else tb.max()
        op = float(hb.o.iat[0]) if len(hb) else float(tb[0])
        return op, hi, lo
    dop, dhi, dlo = so_far(day_start)
    wop, whi, wlo = so_far(wk_start)
    prevD, prevW = dD[dD.index < tday], dW[dW.index < wk]
    if len(prevD) < 21 or len(prevW) < 4:
        return None
    adr5, adr21, awr4 = prevD.r.iloc[-5:].mean(), prevD.r.iloc[-21:].mean(), prevW.r.iloc[-4:].mean()
    px = float(tb[-1])
    et_day = t0.tz_convert("America/New_York").normalize().tz_localize(None)
    g = gvz[gvz.index < et_day]
    v = vix[vix.index < et_day]
    w1h, w15 = (t >= -3_660_000) & (t < -60_000), (t >= -960_000) & (t < -60_000)
    return {"t0": t0, "fam": fam, "y": t0.year, "r1": r1, "dir": int(np.sign(mv)),
            "adr5": adr5, "adr21": adr21, "awr4": awr4,
            "used_day": (dhi - dlo) / dop * 100 / adr21, "used_week": (whi - wlo) / wop * 100 / awr4,
            "ext_day": (px - dop) / dop * 100 / adr21, "ext_week": (px - wop) / wop * 100 / awr4,
            "r1h": float(np.ptp(mid[w1h])) / m0 * 100 if w1h.any() else np.nan,
            "r15": float(np.ptp(mid[w15])) / m0 * 100 if w15.any() else np.nan,
            "gvz": float(g.iat[-1]) if len(g) else np.nan, "gvz_rel": float(g.iat[-1] / g.iloc[-252:].median()) if len(g) > 252 else np.nan,
            "vix": float(v.iat[-1]) if len(v) else np.nan, "px": m0}


def build():
    R = get_settings().research_dir / "phase2"
    cal = pd.read_parquet(R / "hx15" / "calendario_tutti.parquet")
    cn = pd.read_parquet(R / "hx15" / "cpi_nfp.parquet")
    now = pd.Timestamp.now(tz="UTC") - pd.Timedelta(hours=1)
    ev = pd.concat([cal[["t0", "fam"]], cn[["t0", "fam"]]])
    ev = ev[(ev.t0 >= pd.Timestamp("2011-01-01", tz="UTC")) & (ev.t0 < now)].drop_duplicates("t0").sort_values("t0").reset_index(drop=True)
    with ThreadPoolExecutor(4) as ex:
        paths = list(ex.map(fetch_retry, ev.t0))
    h1 = DukascopyProvider().h1_range("XAUUSD", date(2010, 11, 1), date.today())
    dD, dW = bars(h1, "D"), bars(h1, "W")
    gvz, vix = load_iv()
    rows = [one(r.t0, r.fam, p, h1, dD, dW, gvz, vix) for r, p in zip(ev.itertuples(), paths)]
    df = pd.DataFrame([r for r in rows if r]).sort_values("t0").reset_index(drop=True)
    for k in (3, 12):
        df[f"mem{k}"] = df.groupby("fam").r1.transform(lambda s, k=k: s.shift(1).rolling(k, min_periods=k).median())
    for c in ("mem3", "mem12", "gvz", "adr5", "adr21", "r1h", "r15", "vix"):
        df["l_" + c] = np.log(df[c].clip(lower=1e-4))
    return df


def fit_predict(df):
    from lightgbm import LGBMRegressor
    from sklearn.linear_model import Ridge
    fams = sorted(df.fam.unique())
    X = pd.concat([df[FEATS], pd.get_dummies(df.fam).reindex(columns=fams, fill_value=0).astype(float)], axis=1)
    y = np.log(df.r1.clip(lower=1e-4)).to_numpy()
    ok = X.notna().all(axis=1).to_numpy()
    p0, p1, p2 = np.exp(df.l_mem12).to_numpy(), np.full(len(df), np.nan), np.full(len(df), np.nan)
    imp = {}
    for Y in range(2016, 2027):
        tr, te = ok & (df.y < Y).to_numpy(), ok & (df.y == Y).to_numpy()
        if te.sum() == 0:
            continue
        mu, sd = X[tr].mean(), X[tr].std().replace(0, 1)
        lin = Ridge(alpha=1.0).fit(((X[tr] - mu) / sd).values, y[tr])
        p1[te] = np.exp(lin.predict(((X[te] - mu) / sd).values))
        gb = LGBMRegressor(max_depth=3, n_estimators=200, learning_rate=0.05, verbose=-1, random_state=23).fit(X[tr].values, y[tr])
        p2[te] = np.exp(gb.predict(X[te].values))
        if Y == 2026:
            imp = {"ridge": dict(zip(X.columns, np.round(lin.coef_, 3))), "lgbm": dict(zip(X.columns, gb.feature_importances_.tolist()))}
    return {"M0": p0, "M1": p1, "M2": p2}, imp


def score(df, preds):
    groups = {"TUTTE": None, "NFP": ["NFP"], "CPI": ["CPI"], "RETAIL_PPI": ["RETAIL", "PPI"]}
    out = {}
    for m, p in preds.items():
        out[m] = {}
        for g, fams in groups.items():
            for per, (a, b) in (("2019-22", (2019, 2022)), ("2023-26", (2023, 2026))):
                sel = (df.y >= a) & (df.y <= b) & np.isfinite(p) & np.isfinite(preds["M1"]) & (df.r1 > 0)
                if fams:
                    sel &= df.fam.isin(fams)
                v, q = df.r1[sel].to_numpy(), p[sel.to_numpy()]
                out[m][f"{g}|{per}"] = {"n": int(sel.sum()), "errore": round(float(np.median(np.abs(np.log(v / q)))), 3),
                                        "spearman": round(float(spearmanr(q, v)[0]), 3)}
    return out


def direction(df):
    tests = {}
    for name, col, th in (("E50", "ext_day", .5), ("E80", "ext_day", .8), ("W50", "ext_week", .5), ("W80", "ext_week", .8)):
        s = np.where(df[col] >= th, -1, np.where(df[col] <= -th, 1, 0))
        m = (s != 0) & (df.dir != 0)
        hit = (s[m] == df.dir[m])
        k, n = int(hit.sum()), int(m.sum())
        halves = {lab: round(float((s[mm] == df.dir[mm]).mean()), 3) for lab, mm in
                  (("2011-18", m & (df.y <= 2018)), ("2019-26", m & (df.y >= 2019)))}
        fam = {f: [int((s[m & (df.fam == f)] == df.dir[m & (df.fam == f)]).sum()), int((m & (df.fam == f)).sum())] for f in sorted(df.fam.unique())}
        tests[name] = {"n": n, "giuste_sfumando": k, "quota": round(k / n, 3), "p": float(binom.sf(k - 1, n, .5)), "meta": halves, "per_famiglia": fam}
    ps = sorted(tests.items(), key=lambda kv: kv[1]["p"])
    run = 0
    for i, (k, v) in enumerate(ps):
        run = max(run, min(1.0, v["p"] * (len(ps) - i)))
        v["p_holm"] = round(run, 4)
        v["passa"] = bool(run < 0.05 and all(q > .5 for q in v["meta"].values()))
    return tests


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    df = build()
    df.drop(columns=[]).to_parquet(R / "hx23_dataset.parquet")
    preds, imp = fit_predict(df)
    sc = score(df, preds)
    dirr = direction(df)
    out = {"n": len(df), "per_famiglia": df.fam.value_counts().to_dict(), "punteggi": sc, "importanza_2026": imp, "direzione": dirr}
    (R / "hx23_modello.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    print("release", len(df), df.fam.value_counts().to_dict())
    for g in ("TUTTE", "NFP", "CPI", "RETAIL_PPI"):
        print(g, {m: (sc[m][f"{g}|2019-22"]["errore"], sc[m][f"{g}|2023-26"]["errore"], sc[m][f"{g}|2023-26"]["spearman"]) for m in sc})
    print("importanza lgbm", sorted(imp.get("lgbm", {}).items(), key=lambda x: -x[1])[:10])
    print("ridge", {k: v for k, v in imp.get("ridge", {}).items() if k in FEATS})
    for k, v in dirr.items():
        print(k, {x: v[x] for x in ("n", "quota", "p", "p_holm", "meta", "passa")})
