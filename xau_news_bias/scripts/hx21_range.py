"""H-X21 (docs/IPOTESI-HX21-RANGE-GIORNO-SETTIMANA.md): prevedere il range dell'oro di domani e della settimana."""
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy.stats import spearmanr  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402


def bars(h1: pd.DataFrame, freq: str) -> pd.DataFrame:
    day = (h1.index + pd.Timedelta(hours=2)).normalize().tz_localize(None)
    key = day if freq == "D" else day - pd.to_timedelta(day.dayofweek, unit="D")  # lunedì della settimana
    g = h1.groupby(key)
    b = pd.DataFrame({"o": g.o.first(), "h": g.h.max(), "l": g.l.min(), "c": g.c.last(), "n": g.size()})
    b = b[b.n >= (12 if freq == "D" else 60)]
    b["r"] = (b.h - b.l) / b.o * 100
    b["su"], b["giu"] = (b.h - b.o) / b.o * 100, (b.o - b.l) / b.o * 100
    return b


def predict(b: pd.DataFrame, lags: dict, har_win: int, k_win: int, start: str):
    r = b.r.to_numpy()
    lr = np.log(r)
    feats = {name: pd.Series(r).shift(1).rolling(n).mean().to_numpy() for name, n in lags.items()}
    out = {}
    idx = np.nonzero(b.index >= start)[0]
    for name, x in feats.items():
        p, lo50, hi50, lo80, hi80 = (np.full(len(r), np.nan) for _ in range(5))
        for i in idx:
            ratio = r[i - k_win:i] / x[i - k_win:i]
            ratio = ratio[np.isfinite(ratio)]
            if len(ratio) < k_win // 2 or not np.isfinite(x[i]):
                continue
            p[i] = np.median(ratio) * x[i]
            lo50[i], hi50[i], lo80[i], hi80[i] = (np.quantile(ratio, q) * x[i] for q in (.25, .75, .1, .9))
        out[name] = (p, lo50, hi50, lo80, hi80)
    X = np.column_stack([np.ones(len(r))] + [np.log(f) for f in feats.values()])
    p, lo50, hi50, lo80, hi80 = (np.full(len(r), np.nan) for _ in range(5))
    beta, res = None, None
    for j, i in enumerate(idx):
        if beta is None or j % 20 == 0:
            w = slice(i - har_win, i)
            ok = np.all(np.isfinite(X[w]), axis=1)
            beta, *_ = np.linalg.lstsq(X[w][ok], lr[w][ok], rcond=None)
            res = lr[w][ok] - X[w][ok] @ beta
        if np.all(np.isfinite(X[i])):
            m = X[i] @ beta
            p[i] = np.exp(m + np.median(res))
            lo50[i], hi50[i], lo80[i], hi80[i] = (np.exp(m + np.quantile(res, q)) for q in (.25, .75, .1, .9))
    out["HAR"] = (p, lo50, hi50, lo80, hi80)
    return out


def score(b, preds):
    r = b.r.to_numpy()
    tab = {}
    for name, (p, lo50, hi50, lo80, hi80) in preds.items():
        tab[name] = {}
        for per, (a, z) in (("2019-22", ("2019-01-01", "2022-12-31")), ("2023-26", ("2023-01-01", "2026-12-31"))):
            m = (b.index >= a) & (b.index <= z) & np.isfinite(p)
            tab[name][per] = {"n": int(m.sum()), "errore_mediano": round(float(np.median(np.abs(np.log(r[m] / p[m])))), 3),
                              "spearman": round(float(spearmanr(p[m], r[m])[0]), 3),
                              "copertura_25_75": round(float(((r[m] >= lo50[m]) & (r[m] <= hi50[m])).mean()), 3),
                              "copertura_10_90": round(float(((r[m] >= lo80[m]) & (r[m] <= hi80[m])).mean()), 3)}
    return tab


def choose(tab):
    names = sorted(tab, key=lambda k: tab[k]["2023-26"]["errore_mediano"] + tab[k]["2019-22"]["errore_mediano"])
    best = names[0]
    simple = [n for n in names if n != "HAR"]
    if best == "HAR" and simple:
        s = simple[0]
        if all(tab[s][p]["errore_mediano"] - tab["HAR"][p]["errore_mediano"] < 0.02 for p in tab[s]):
            best = s
    return best


def next_levels(b, lags, har_win, k_win, best):
    """Previsione per il periodo DOPO l'ultimo chiuso: si aggiunge una riga vuota e si usa lo stesso codice."""
    nxt = pd.concat([b, pd.DataFrame({"r": [np.nan]}, index=[b.index[-1] + pd.Timedelta(days=1)])])
    nxt.loc[nxt.index[-1], "r"] = np.nan
    r = nxt.r.to_numpy()
    feats = {name: pd.Series(r).shift(1).rolling(n).mean().to_numpy()[-1] for name, n in lags.items()}
    hist = b.iloc[-k_win:]
    if best == "HAR":
        X = np.column_stack([np.ones(len(b))] + [np.log(pd.Series(b.r.values).shift(1).rolling(n).mean().to_numpy()) for n in lags.values()])
        w = slice(len(b) - har_win, len(b))
        ok = np.all(np.isfinite(X[w]), axis=1)
        beta, *_ = np.linalg.lstsq(X[w][ok], np.log(b.r.to_numpy()[w][ok]), rcond=None)
        res = np.log(b.r.to_numpy()[w][ok]) - X[w][ok] @ beta
        m = np.r_[1, [np.log(v) for v in feats.values()]] @ beta
        q = {k: float(np.exp(m + np.quantile(res, v))) for k, v in (("p50", .5), ("p75", .75), ("p90", .9))}
    else:
        x = pd.Series(b.r.values).shift(1).rolling(lags[best]).mean().to_numpy()
        ratio = (b.r.to_numpy() / x)[-k_win:]
        ratio = ratio[np.isfinite(ratio)]
        q = {k: float(np.quantile(ratio, v) * feats[best]) for k, v in (("p50", .5), ("p75", .75), ("p90", .9))}
    ext = {"su_mediana": float((hist.su / hist.r).median()), "giu_mediana": float((hist.giu / hist.r).median()),
           "max_lato_mediana": float((np.maximum(hist.su, hist.giu) / hist.r).median())}
    return q, ext, feats


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx16"
    h1 = DukascopyProvider().h1_range("XAUUSD", date(2012, 1, 1), date.today())
    now = pd.Timestamp.now(tz="UTC")
    out = {"prezzo": round(float(h1.c.iat[-1]), 2), "ora": str(h1.index[-1])[:16]}
    for freq, lags, har_win, k_win in (("D", {"D1": 1, "D5": 5, "D21": 21}, 500, 250), ("W", {"W1": 1, "W4": 4, "W13": 13}, 150, 50)):
        b = bars(h1, freq)
        # escludi il periodo in corso (non ancora chiuso)
        cur_key = (now + pd.Timedelta(hours=2)).normalize().tz_localize(None)
        if freq == "W":
            cur_key = cur_key - pd.Timedelta(days=cur_key.dayofweek)
        b_closed = b[b.index < cur_key]
        preds = predict(b_closed, lags, har_win, k_win, "2019-01-01")
        tab = score(b_closed, preds)
        best = choose(tab)
        q, ext, feats = next_levels(b_closed, lags, har_win, k_win, best)
        cur = b[b.index == cur_key]
        px = float(cur.o.iat[0]) if len(cur) else out["prezzo"]
        out[freq] = {"previsori": tab, "scelto": best, "affidabile": bool(0.75 <= tab[best]["2023-26"]["copertura_10_90"] <= 0.85),
                     "previsione_pct": q, "escursione_dall_apertura": ext, "apertura": round(px, 2), "periodo": str(cur_key.date()),
                     "previsione_pips": {k: round(v / 100 * px * 10) for k, v in q.items()},
                     "per_anno_pips": {int(y): round(float((g.r / 100 * g.o * 10).median())) for y, g in b_closed[b_closed.index >= "2019-01-01"].groupby(b_closed.index[b_closed.index >= "2019-01-01"].year)},
                     "per_anno_pct": {int(y): round(float(g.r.median()), 3) for y, g in b_closed[b_closed.index >= "2019-01-01"].groupby(b_closed.index[b_closed.index >= "2019-01-01"].year)}}
        print(freq, "scelto", best, json.dumps(tab, indent=0))
        print(" previsione", out[freq]["previsione_pips"], "escursione", ext, "apertura", px)
    (R / "hx21_range.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
