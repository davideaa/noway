"""H-X22 (docs/IPOTESI-HX22-REGIME-ADATTIVO.md): finestra fissa contro EWMA e taglio al cambio di regime."""
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

import hx19_tp as H  # noqa: E402
from hx21_range import bars  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402


def base_fixed(y, n, how="mean"):
    s = pd.Series(y).shift(1)
    return (s.rolling(n).mean() if how == "mean" else s.rolling(n).median()).to_numpy()


def base_ewma(y, h):
    return pd.Series(y).ewm(halflife=h, min_periods=max(3, h)).mean().shift(1).to_numpy()


def base_reg(y, w, thr=0.34, mn=10):
    out, s = np.full(len(y), np.nan), 0
    ly = np.log(np.maximum(y, 1e-9))
    for i in range(len(y)):
        if i - s >= mn and i >= w:
            recent, since = ly[i - w:i].mean(), ly[s:i].mean()
            if abs(recent - since) > thr:
                s = i - w
        if i - s >= min(mn, w) and i > 0:
            out[i] = y[s:i].mean()
    return out


def evaluate(y, years, base, k_win, cov=(.1, .9)):
    p, lo, hi = np.full(len(y), np.nan), np.full(len(y), np.nan), np.full(len(y), np.nan)
    for i in range(len(y)):
        r = y[max(0, i - k_win):i] / base[max(0, i - k_win):i]
        r = r[np.isfinite(r)]
        if len(r) >= min(12, k_win // 2) and np.isfinite(base[i]):
            p[i] = np.median(r) * base[i]
            lo[i], hi[i] = np.quantile(r, cov[0]) * base[i], np.quantile(r, cov[1]) * base[i]
    res = {}
    for per, (a, b) in (("2019-22", (2019, 2022)), ("2023-26", (2023, 2026))):
        m = (years >= a) & (years <= b) & np.isfinite(p) & (y > 0)
        res[per] = {"n": int(m.sum()), "errore": round(float(np.median(np.abs(np.log(y[m] / p[m])))), 3),
                    "copertura": round(float(((y[m] >= lo[m]) & (y[m] <= hi[m])).mean()), 3)}
    return res, p, lo, hi


def contest(y, years, cands, ref, k_win, cov):
    tab, series = {}, {}
    for name, base in cands.items():
        tab[name], *series[name] = evaluate(y, years, base, k_win, cov)
    winner = ref
    for name in tab:
        if name != ref and all(tab[ref][p]["errore"] - tab[name][p]["errore"] >= 0.02 for p in ("2019-22", "2023-26")):
            if winner == ref or sum(tab[name][p]["errore"] for p in tab[name]) < sum(tab[winner][p]["errore"] for p in tab[winner]):
                winner = name
    return tab, winner, series


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    out = {}
    # A: range giornaliero
    h1 = DukascopyProvider().h1_range("XAUUSD", date(2012, 1, 1), date.today())
    b = bars(h1, "D")
    now = pd.Timestamp.now(tz="UTC")
    b = b[b.index < (now + pd.Timedelta(hours=2)).normalize().tz_localize(None)]
    y, yrs = b.r.to_numpy(), b.index.year.to_numpy()
    cands = {"D21": base_fixed(y, 21), **{f"EWMA{h}": base_ewma(y, h) for h in (5, 10, 20, 40)}, "REG": base_reg(y, 10, mn=10)}
    tab, win, ser = contest(y, yrs, cands, "D21", 250, (.1, .9))
    p, lo, hi = ser[win]
    keep = b.index >= "2023-01-01"
    out["giorno"] = {"tabella": tab, "scelto": win,
                     "serie": [[str(d.date()), round(float(v), 3), round(float(q), 3), round(float(l), 3), round(float(h_), 3), round(float(o), 2)]
                               for d, v, q, l, h_, o in zip(b.index[keep], y[keep], p[keep], lo[keep], hi[keep], b.o[keep])]}
    print("GIORNO", win, json.dumps(tab))
    # B: arrivo della news
    site = json.loads((R / "hx11" / "site.json").read_text())
    nfp = [{"t0": pd.Timestamp(e["d"], tz="UTC")} for e in site["ev"] if e["f"] == "NFP" and e["rule"]]
    rp = [{"t0": pd.Timestamp(e["d"], tz="UTC")} for e in json.loads((R / "hx16" / "retail_ppi.json").read_text())["ev"]]
    for name, ev, ref_n in (("NFP", nfp, 24), ("RETAIL_PPI", rp, 12)):
        df = H.build(ev)
        y, yrs = df.arr.to_numpy(), df.y.to_numpy()
        ref = f"N{ref_n}"
        cands = {ref: base_fixed(y, ref_n, "median"), **{f"EWMA{h}": base_ewma(y, h) for h in (3, 6, 12, 24)}, "REG": base_reg(y, 4, mn=6)}
        tab, win, ser = contest(y, yrs, cands, ref, 24, (.25, .75))
        p, lo, hi = ser[win]
        keep = yrs >= 2019
        out[name] = {"tabella": tab, "scelto": win,
                     "serie": [[str(t)[:10], round(float(v), 3), round(float(q), 3), round(float(l), 3), round(float(h_), 3), round(float(x), 2)]
                               for t, v, q, l, h_, x in zip(df.t0[keep], y[keep], p[keep], lo[keep], hi[keep], df.px[keep])]}
        print(name, win, json.dumps(tab))
    (R / "hx16" / "hx22_regime.json").write_text(json.dumps(out, default=float), encoding="utf-8")
