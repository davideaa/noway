"""H-X19 (docs/IPOTESI-HX19-LIVELLI-TP.md): livelli di take profit per NFP e Retail/PPI, ingresso T0-30 s, stop 100 pips."""
import json
import sys
import time
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx11_site import quotes  # noqa: E402
from hx15_build import CACHE  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

STOP = 10.0  # 100 pips
WINDOWS = {"6": 6, "12": 12, "24": 24, "tutte": None}


def ticks(t0: pd.Timestamp):
    """Tick da T0-2 a T0+16 min (cache _x17 di H-X17), oppure la finestra larga di H-X15/H-X16."""
    for p in (CACHE / f"{t0:%Y%m%d_%H%M}_x17.npz", CACHE / f"{t0:%Y%m%d_%H%M}.npz"):
        if p.exists():
            z = np.load(p)
            return z["t"], z["bid"], z["ask"]
    for k in range(7):
        try:
            tk = DukascopyProvider().ticks("XAUUSD", (t0 - pd.Timedelta(minutes=2)).to_pydatetime(),
                                           (t0 + pd.Timedelta(minutes=16)).to_pydatetime())
            break
        except Exception:  # noqa: BLE001
            time.sleep(5 * 2 ** k)
    t = tk.ts_ms.to_numpy(np.int64) - int(t0.value // 1_000_000)
    np.savez_compressed(CACHE / f"{t0:%Y%m%d_%H%M}_x17.npz", t=t, bid=tk.bid.to_numpy(float), ask=tk.ask.to_numpy(float))
    return t, tk.bid.to_numpy(float), tk.ask.to_numpy(float)


def sim(t, b, a, j, d, tp, end_ms):
    entry = a[j] if d > 0 else b[j]
    k = np.nonzero((t > t[j]) & (t < end_ms))[0]
    side = b[k] if d > 0 else a[k]
    fav = d * (side - entry)
    hs = np.nonzero(fav <= -STOP)[0]
    ht = np.nonzero(fav >= tp)[0] if tp else np.zeros(0, int)
    s = hs[0] if len(hs) else 10 ** 9
    q = ht[0] if len(ht) else 10 ** 9
    if s < q:
        return -1.0
    if q < 10 ** 9:
        return tp / STOP
    return max(float(fav[-1]) / STOP, -1.0)


def build(events: list[dict]) -> pd.DataFrame:
    rows = []
    for e in events:
        t, bid, ask = ticks(e["t0"])
        if not len(t) or t.max() < 300_000 or (t < -30_000).sum() == 0:
            continue
        j = int(np.searchsorted(t, -30_000, side="right") - 1)
        if t[j] < -120_000:
            continue
        b, a = quotes(bid, ask, "S1")
        mid = (bid + ask) / 2
        i1 = int(np.searchsorted(t, 60_000, side="left") - 1)
        d = int(np.sign(mid[i1] - mid[j]))
        if d == 0:
            continue
        w = (t > t[j]) & (t < 60_000)
        arr = float((d * (mid[w] - mid[j])).max()) / mid[j] * 100
        clo = float(d * (mid[i1] - mid[j])) / mid[j] * 100
        rows.append({**{k: v for k, v in e.items() if k != "t0"}, "t0": e["t0"], "y": e["t0"].year, "px": float(mid[j]),
                     "d": d, "arr": arr, "clo": clo, "_p": (t, b, a, j)})
    return pd.DataFrame(rows).sort_values("t0").reset_index(drop=True)


def levels(df: pd.DataFrame, n):
    """Per ogni release: livelli A (33° perc.) e B (mediana) dell'arrivo % sulle release PRIMA, finestra n."""
    A, B = [], []
    for i in range(len(df)):
        prev = df.arr.iloc[max(0, i - n):i] if n else df.arr.iloc[:i][df.y.iloc[:i] >= 2014]
        ok = len(prev) >= (n or 12)
        A.append(np.quantile(prev, 1 / 3) if ok else np.nan)
        B.append(np.median(prev) if ok else np.nan)
    return np.array(A), np.array(B)


def evaluate(df: pd.DataFrame, fam: str, bias_col=None):
    out = {"finestre": {}}
    best, best_err = None, 9
    for name, n in WINDOWS.items():
        A, B = levels(df, n)
        m = (df.y >= 2023).to_numpy() & np.isfinite(A)
        hitA, hitB = float((df.arr[m] >= A[m]).mean()), float((df.arr[m] >= B[m]).mean())
        err = abs(hitA - 2 / 3) + abs(hitB - .5)
        out["finestre"][name] = {"tocca_A_2023_26": round(hitA, 3), "tocca_B_2023_26": round(hitB, 3), "errore": round(err, 3),
                                 "n": int(m.sum())}
        if err < best_err - 1e-9 or (abs(err - best_err) < 0.02 and (n or 999) > (WINDOWS[best] or 999 if best else 0)):
            best, best_err = name, min(err, best_err)
    out["scelta"] = best
    A, B = levels(df, WINDOWS[best])
    df = df.assign(A=A, B=B)
    res = {}
    for per, msk in (("2019-22", (df.y >= 2019) & (df.y <= 2022)), ("2023-26", df.y >= 2023)):
        g = df[msk & df.A.notna()]
        r = {k: [] for k in ("C_giusta", "TPa_giusta", "TPb_giusta", "TPa5_giusta", "C_caso", "TPa_caso", "TPb_caso", "TPa5_caso",
                             "C_bias", "TPa_bias", "TPb_bias", "TPa5_bias")}
        for e in g.itertuples():
            t, b, a, j = e._p
            ta, tb = e.A / 100 * e.px, e.B / 100 * e.px
            sides = {"giusta": [e.d], "caso": [1, -1]}
            if bias_col and getattr(e, bias_col) in ("LONG", "SHORT"):
                sides["bias"] = [1 if getattr(e, bias_col) == "LONG" else -1]
            for lab, ds in sides.items():
                for code, tp, end in (("C", None, 60_000), ("TPa", ta, 60_000), ("TPb", tb, 60_000), ("TPa5", ta, 300_000)):
                    r[f"{code}_{lab}"].append(np.mean([sim(t, b, a, j, d, tp, end) for d in ds]))
        res[per] = {"n": len(g), **{k: round(float(np.mean(v)), 3) for k, v in r.items() if v},
                    "tocca_A": round(float((g.arr >= g.A).mean()), 3), "tocca_B": round(float((g.arr >= g.B).mean()), 3)}
    out["uscite"] = res
    ok = {}
    for code in ("TPa", "TPb", "TPa5"):
        beats = all(res[p][f"{code}_giusta"] > res[p]["C_giusta"] for p in res)
        ref = "bias" if bias_col else "caso"
        noharm = all(res[p][f"{code}_{ref}"] >= res[p][f"C_{ref}"] - 0.05 for p in res if f"C_{ref}" in res[p])
        ok[code] = bool(beats and noharm)
    out["conviene"] = ok
    out["per_anno"] = {int(y): {"n": len(g), "arrivo_pct": round(float(g.arr.median()), 3), "chiusura_pct": round(float(g.clo.median()), 3),
                                "arrivo_pips": round(float((g.arr / 100 * g.px).median() * 10)), "chiusura_pips": round(float((g.clo / 100 * g.px).median() * 10)),
                                "prezzo": round(float(g.px.median()))}
                       for y, g in df[df.y >= 2019].groupby("y")}
    n = WINDOWS[best]
    last = df.tail(n) if n else df[df.y >= 2014]
    out["oggi_pct"] = {"A": float(np.quantile(last.arr, 1 / 3)), "B": float(np.median(last.arr)), "finestra_da": str(last.t0.iloc[0])[:10],
                       "finestra_a": str(last.t0.iloc[-1])[:10], "n": len(last)}
    out["ultime"] = [{"d": str(e.t0)[:10], "arr_pips": round(e.arr / 100 * e.px * 10), "clo_pips": round(e.clo / 100 * e.px * 10),
                      "A_pips": None if e.A != e.A else round(e.A / 100 * e.px * 10), "B_pips": None if e.B != e.B else round(e.B / 100 * e.px * 10)}
                     for e in df.tail(12).itertuples()]
    print(fam, json.dumps({k: v for k, v in out.items() if k not in ("ultime",)}, indent=1))
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    site = json.loads((R / "hx11" / "site.json").read_text())
    nfp = [{"t0": pd.Timestamp(e["d"], tz="UTC"), "rule": e["rule"]} for e in site["ev"] if e["f"] == "NFP" and e["rule"]]
    rp = json.loads((R / "hx16" / "retail_ppi.json").read_text())["ev"]
    rpe = [{"t0": pd.Timestamp(e["d"], tz="UTC"), "tipo": e["tipo"]} for e in rp]
    h1 = DukascopyProvider().h1_range("XAUUSD", date(2026, 9, 1), date.today())
    px_now = float(h1.c.iat[-1])
    out = {"prezzo_oggi": round(px_now, 2), "prezzo_ora": str(h1.index[-1])[:16],
           "NFP": evaluate(build(nfp), "NFP", bias_col="rule"), "RETAIL_PPI": evaluate(build(rpe), "RETAIL/PPI")}
    for k in ("NFP", "RETAIL_PPI"):
        o = out[k]["oggi_pct"]
        o["A_pips"], o["B_pips"] = round(o["A"] / 100 * px_now * 10), round(o["B"] / 100 * px_now * 10)
    (R / "hx16" / "hx19_tp.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    print("oggi:", px_now, {k: out[k]["oggi_pct"] for k in ("NFP", "RETAIL_PPI")})
