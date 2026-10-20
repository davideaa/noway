"""H-X20 (docs/IPOTESI-HX20-PREVEDERE-I-PIPS.md): quale volatilità prevede i pips della news, passo per passo."""
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import spearmanr  # noqa: E402

import hx19_tp as H  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

VS = {"V5": 5, "V21": 21, "V63": 63, "V126": 126, "V252": 252}
NS = {"N3": 3, "N12": 12, "N24": 24}


def daily_ranges(h1: pd.DataFrame) -> pd.Series:
    day = (h1.index + pd.Timedelta(hours=2)).date  # giornata di trading chiusa alle 22:00 UTC
    g = h1.groupby(day)
    return ((g.h.max() - g.l.min()) / g.c.last() * 100).rename("rng")


def features(df, dr, h1):
    days = pd.Series(dr.values, index=pd.to_datetime(dr.index))
    rows = []
    for e in df.itertuples():
        tday = (e.t0 + pd.Timedelta(hours=2)).normalize().tz_localize(None)
        prev = days[days.index < tday]
        f = {k: float(prev.iloc[-n:].mean()) if len(prev) >= n else np.nan for k, n in VS.items()}
        hh = h1[h1.index + pd.Timedelta(hours=1) <= e.t0].iloc[-15:]
        tr = np.maximum(hh.h.values[1:] - hh.l.values[1:], np.maximum(abs(hh.h.values[1:] - hh.c.values[:-1]), abs(hh.l.values[1:] - hh.c.values[:-1])))
        f["ATR"] = float(tr.mean()) / e.px * 100 if len(tr) == 14 else np.nan
        t, b, a, j = e.path
        w = (t >= 0) & (t < 60_000)
        b0 = b[int(np.searchsorted(t, 0, side="left") - 1)]
        f["R1"] = float(max(b[w].max(), b0) - min(b[w].min(), b0)) / e.px * 100 if w.any() else np.nan
        rows.append(f)
    return pd.concat([df.drop(columns=["path"]).reset_index(drop=True), pd.DataFrame(rows)], axis=1)


def walk(df, target):
    out = {}
    y = df[target].to_numpy()
    preds = {}
    for k in VS | {"ATR": 0}:
        x = df[k].to_numpy()
        p, lo, hi = np.full(len(df), np.nan), np.full(len(df), np.nan), np.full(len(df), np.nan)
        for i in range(len(df)):
            r = (y[max(0, i - 24):i] / x[max(0, i - 24):i])
            r = r[np.isfinite(r)]
            if len(r) >= 12 and np.isfinite(x[i]):
                p[i] = np.median(r) * x[i]
                lo[i], hi[i] = np.quantile(r, .25) * x[i], np.quantile(r, .75) * x[i]
        preds[k] = (p, lo, hi)
    for k, n in NS.items():
        p, lo, hi = np.full(len(df), np.nan), np.full(len(df), np.nan), np.full(len(df), np.nan)
        for i in range(len(df)):
            prev = y[max(0, i - n):i]
            prev = prev[np.isfinite(prev)]
            if len(prev) >= n:
                p[i] = np.median(prev)
                r = y[max(0, i - 24):i] / np.array([np.median(y[max(0, j - n):j]) if j >= n else np.nan for j in range(max(0, i - 24), i)])
                r = r[np.isfinite(r)]
                if len(r) >= 12:
                    lo[i], hi[i] = np.quantile(r, .25) * p[i], np.quantile(r, .75) * p[i]
        preds[k] = (p, lo, hi)
    for k, (p, lo, hi) in preds.items():
        res = {}
        for per, m in (("2019-22", (df.y >= 2019) & (df.y <= 2022)), ("2023-26", df.y >= 2023)):
            mm = m.to_numpy() & np.isfinite(p) & np.isfinite(y) & (y > 0)
            err = np.abs(np.log(y[mm] / p[mm]))
            cov = ((y[mm] >= lo[mm]) & (y[mm] <= hi[mm]))[np.isfinite(lo[mm])]
            res[per] = {"n": int(mm.sum()), "errore_mediano": round(float(np.median(err)), 3),
                        "spearman": round(float(spearmanr(p[mm], y[mm])[0]), 3), "copertura_25_75": round(float(cov.mean()), 3)}
        out[k] = res
    return out, preds


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx11" / "site.json").read_text())
    nfp = [{"t0": pd.Timestamp(e["d"], tz="UTC")} for e in site["ev"] if e["f"] == "NFP" and e["rule"]]
    rp = [{"t0": pd.Timestamp(e["d"], tz="UTC")} for e in json.loads((R / "hx16" / "retail_ppi.json").read_text())["ev"]]
    h1 = DukascopyProvider().h1_range("XAUUSD", date(2012, 1, 1), date.today())
    dr = daily_ranges(h1)
    result = {}
    for name, ev in (("NFP", nfp), ("RETAIL_PPI", rp)):
        df = features(H.build(ev), dr, h1)
        df = df[df.y >= 2013].reset_index(drop=True)
        result[name] = {}
        for target in ("R1", "arr"):
            stats, preds = walk(df, target)
            ranks = {k: (v["2023-26"]["errore_mediano"], v["2019-22"]["errore_mediano"]) for k, v in stats.items()}
            result[name][target] = {"previsori": stats}
            print(name, target)
            for k, v in sorted(stats.items(), key=lambda kv: kv[1]["2023-26"]["errore_mediano"]):
                print(f"  {k:5s} 2019-22 err {v['2019-22']['errore_mediano']:.3f} rho {v['2019-22']['spearman']:.2f} cop {v['2019-22']['copertura_25_75']:.2f} | "
                      f"2023-26 err {v['2023-26']['errore_mediano']:.3f} rho {v['2023-26']['spearman']:.2f} cop {v['2023-26']['copertura_25_75']:.2f}")
        # rapporto bersaglio / volatilità per anno: cosa cambia
        df["k_V21"] = df.arr / df.V21
        result[name]["per_anno"] = {int(y): {"V21": round(float(g.V21.median()), 3), "R1": round(float(g.R1.median()), 3),
                                             "arr": round(float(g.arr.median()), 3), "arr_su_V21": round(float(g.k_V21.median()), 3)}
                                    for y, g in df.groupby("y")}
        result[name]["_df"] = df
    # oggi: volatilità attuale
    days = pd.Series(dr.values, index=pd.to_datetime(dr.index))
    today = {k: float(days.iloc[-n - 1:-1].mean()) for k, n in VS.items()}  # giorni completi
    result["vol_oggi"] = today
    for name in ("NFP", "RETAIL_PPI"):
        df = result[name].pop("_df")
        for target in ("R1", "arr"):
            r = (df[target] / df["V21"]).dropna().iloc[-24:]
            result[name][target]["stima_V21_oggi_pct"] = [float(np.quantile(r, q) * today["V21"]) for q in (.25, .5, .75)]
    (R / "hx16" / "hx20_prevedere.json").write_text(json.dumps(result, indent=1, default=float), encoding="utf-8")
    print("vol oggi", today)
    for name in ("NFP", "RETAIL_PPI"):
        print(name, "per anno", result[name]["per_anno"])
