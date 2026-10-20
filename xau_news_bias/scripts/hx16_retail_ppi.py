"""Sito descrittivo Retail Sales e PPI (emendamento 3 di docs/PROTOCOLLO-NEWS-ROSSE.md): quanto si muove l'oro.

Per ogni release RETAIL/PPI dal 2011: tutti i dati USD usciti allo stesso minuto (FF), candele bid da 10 s,
range della prima M1 (bid come MT5 e prezzo medio), range 5 min, spread massimo, ATR 14 H1 prima della news.
Scrive research_output/phase2/hx16/retail_ppi.json. Nessuna regola, nessun trade.
"""
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx15_build import CACHE, FF, num  # noqa: E402
from hx15_final import fetch_final  # noqa: E402
from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

PIP = 0.10
BINS = np.arange(-60, 300, 10)  # candele da 10 s, da T0-60 s a T0+5 min


def atr14_h1(h1: pd.DataFrame, t0) -> float:
    b = h1[h1.index + pd.Timedelta(hours=1) <= t0].iloc[-15:]
    h, lo, c = b.h.to_numpy(), b.l.to_numpy(), b.c.to_numpy()
    tr = np.maximum(h[1:] - lo[1:], np.maximum(abs(h[1:] - c[:-1]), abs(lo[1:] - c[:-1])))
    return float(tr.mean()) if len(tr) == 14 else np.nan


TFS = {"M1": 1, "M5": 5, "M15": 15, "M30": 30}


def tf_candles(duka, t0, b0) -> dict:
    """Candele bid Dukascopy (come MT5): 15 prima della news, quella della news, 9 dopo, per M1/M5/M15/M30. Pips dal bid prima della news."""
    import time as _t
    for k in range(6):
        try:
            m1 = duka.m1_range("XAUUSD", (t0 - pd.Timedelta(days=4)).date(), t0.date())
            break
        except Exception:  # noqa: BLE001
            _t.sleep(5 * 2 ** k)
    if m1.empty or m1.index.max() < t0 + pd.Timedelta(minutes=10):  # giorno non ancora pubblicato: M1 dai tick bid
        tk = duka.ticks("XAUUSD", (t0 - pd.Timedelta(hours=8)).to_pydatetime(), (t0 + pd.Timedelta(hours=5)).to_pydatetime())
        sb = pd.Series(tk.bid.to_numpy(float), index=pd.to_datetime(tk.ts_ms, unit="ms", utc=True))
        g = sb.resample("1min", label="left", closed="left")
        m1 = pd.DataFrame({"o": g.first(), "h": g.max(), "l": g.min(), "c": g.last()}).dropna()
    out = {}
    for name, mins in TFS.items():
        g = m1.resample(f"{mins}min", label="left", closed="left")
        b = pd.DataFrame({"o": g.o.first(), "h": g.h.max(), "l": g.l.min(), "c": g.c.last()}).dropna()
        b = b[(b.index >= t0 - pd.Timedelta(minutes=15 * mins)) & (b.index < t0 + pd.Timedelta(minutes=10 * mins))]
        before = b[b.index < t0].iloc[-15:]
        after = b[b.index >= t0].iloc[:10]
        rows = pd.concat([before, after])
        out[name] = {"n0": len(before), "c": [[round((v - b0) / PIP, 1) for v in (r.o, r.h, r.l, r.c)] for r in rows.itertuples()],
                     "t": [int((ix - t0).total_seconds() // 60) for ix in rows.index]}
    return out


def releases(ff: pd.DataFrame, t0) -> list[dict]:
    g = ff[(ff.currency == "USD") & (ff.t0 == t0)]
    return [{"nome": r.event, "imp": r.impact if isinstance(r.impact, str) else "", "act": r.actual if isinstance(r.actual, str) else "",
             "fc": r.forecast if isinstance(r.forecast, str) else ""} for r in g.itertuples()]


def event(p: Path, t0, h1) -> dict | None:
    z = np.load(p)
    t, bid, ask = z["t"], z["bid"], z["ask"]
    pre = np.nonzero(t < 0)[0]
    if not len(pre) or t[pre[-1]] < -120_000 or ((t >= 0) & (t < 60_000)).sum() < 5 or t.max() < 300_000:
        return None
    mid = (bid + ask) / 2
    b0, m0 = float(bid[pre[-1]]), float(mid[pre[-1]])
    w1, w5 = (t >= 0) & (t < 60_000), (t >= 0) & (t < 300_000)

    def at(x, ms):
        return float(x[int(np.searchsorted(t, ms, side="left") - 1)])
    cand = []
    for x in BINS:
        m = (t >= x * 1000) & (t < (x + 10) * 1000)
        cand.append(None if not m.any() else [round((v - b0) / PIP, 1) for v in (bid[m][0], bid[m].max(), bid[m].min(), bid[m][-1])])
    m1c = []  # candele M1 bid dalle 14:25 alle 14:45 (ora italiana), pips dal bid prima della news
    for k in range(-5, 15):
        m = (t >= k * 60_000) & (t < (k + 1) * 60_000)
        m1c.append(None if not m.any() else [round((v - b0) / PIP, 1) for v in (bid[m][0], bid[m].max(), bid[m].min(), bid[m][-1])])
    a60 = at(mid, 60_000)
    return {"cand": cand, "m1c": m1c,
            "dopo5": round((at(mid, 300_000) - a60) / PIP, 1), "dopo15": round((at(mid, 900_000) - a60) / PIP, 1),
            "m5_bid": round((max(bid[w5].max(), b0) - min(bid[w5].min(), b0)) / PIP, 1),
            "m1_bid": round((max(bid[w1].max(), b0) - min(bid[w1].min(), b0)) / PIP, 1),
            "m1_mid": round((max(mid[w1].max(), m0) - min(mid[w1].min(), m0)) / PIP, 1),
            "m1_mov": round((at(mid, 60_000) - m0) / PIP, 1),
            "m5_mid": round((max(mid[w5].max(), m0) - min(mid[w5].min(), m0)) / PIP, 1),
            "mov15": round((at(mid, 900_000) - m0) / PIP, 1), "mov60": round((at(mid, 3_600_000) - m0) / PIP, 1) if t.max() > 3_600_000 else None,
            "sp0": round(float(ask[pre[-1]] - bid[pre[-1]]) / PIP, 1),
            "spmax": round(float((ask - bid)[(t >= 0) & (t < 10_000)].max(initial=0)) / PIP, 1),
            "atr": round(atr14_h1(h1, t0) / PIP, 1), "prezzo": round(m0, 2), "b0": round(b0, 2)}


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    cal = pd.read_parquet(R / "hx15" / "calendario_tutti.parquet")
    now = pd.Timestamp.now(tz="UTC")
    sel = cal[cal.fam.isin(["RETAIL", "PPI"]) & (cal.t0 >= pd.Timestamp("2011-01-01", tz="UTC"))
              & (cal.t0 + pd.Timedelta(hours=1, minutes=5) < now)].reset_index(drop=True)
    ff = pd.read_csv(FF)
    d = pd.to_datetime(ff.date, format="%a %b %d %Y", errors="coerce")
    hm = ff.time.str.extract(r"^(\d+):(\d+)$").astype(float)
    ff["t0"] = (d + pd.to_timedelta(hm[0], unit="h") + pd.to_timedelta(hm[1], unit="m")).dt.tz_localize("UTC")
    duka = DukascopyProvider()
    h1 = duka.h1_range("XAUUSD", date(2010, 12, 1), now.date())
    CACHE.mkdir(parents=True, exist_ok=True)
    rows = []
    for r in sel.itertuples():
        e = event(fetch_final(r.t0), r.t0, h1)
        if e is None:
            print("saltato", r.t0)
            continue
        e["tf"] = tf_candles(duka, r.t0, e["b0"])
        rel = releases(ff, r.t0)
        main = next((x for x in rel if x["nome"] == "Retail Sales m/m"), None) or next((x for x in rel if x["nome"] == "PPI m/m"), None)
        a, f = (num(main["act"]), num(main["fc"])) if main else (None, None)
        sur = None if a is None or f is None or a == f else ("sopra" if a > f else "sotto")
        rows.append({"d": str(r.t0)[:16], "y": r.t0.year, "tipo": "RETAIL+PPI" if "PPI" in r.titoli and "Retail" in r.titoli
                     else ("RETAIL" if r.fam == "RETAIL" else "PPI"), "dati": rel, "sorpresa": sur, **e})
        print(rows[-1]["d"], rows[-1]["tipo"], rows[-1]["m1_bid"], flush=True)
    last = h1.iloc[-15:]
    atr_now = atr14_h1(h1, h1.index[-1] + pd.Timedelta(hours=1))
    out = {"bins": BINS.tolist(), "ev": rows, "atr_oggi": round(atr_now / PIP, 1), "atr_oggi_ora": str(h1.index[-1] + pd.Timedelta(hours=1))[:16],
           "creato": str(now)[:16]}
    (R / "hx16").mkdir(exist_ok=True)
    (R / "hx16" / "retail_ppi.json").write_text(json.dumps(out, separators=(",", ":"), default=float), encoding="utf-8")
    df = pd.DataFrame(rows)
    df["ratio"] = df.m1_bid / df.atr
    print(df.groupby("y")[["m1_bid", "m1_mid", "m5_mid", "atr", "ratio"]].median().round(2).to_string())
    print(df.groupby("tipo")[["m1_bid", "ratio"]].median().round(2).to_string(), "ATR oggi", out["atr_oggi"])
