"""Candele bid Dukascopy intorno a ogni NFP dal 2014, per il grafico "Rigioca una NFP" del sito, in stile TradingView:
M1 da 2 ore prima a 2 ore dopo, M5 da 12 ore prima a 6 ore dopo (il sito ne fa M15 e M30), H1 da 15 giorni prima a 3 giorni
dopo (il sito ne fa H4). Solo per disegnare: nessun risultato dipende da questo file.

Formato, per NFP: {"r": prezzo di riferimento, "m1"|"m5"|"h1": [[dt, o, h, l, c, v], ...]}
- dt in minuti dalla news (m1, m5) o in ore dall'inizio dell'ora della news (h1);
- o h l c in centesimi di dollaro rispetto a r;
- v = volume Dukascopy in scala 0-99 dentro la stessa serie (serve solo come altezza relativa delle barre)."""
import json
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

FINESTRE = {"m1": (timedelta(hours=2), timedelta(hours=2)), "m5": (timedelta(hours=12), timedelta(hours=6)),
            "h1": (timedelta(days=15), timedelta(days=3))}


def serie(df, t0, ref, unit):
    vmax = float(df.v.max()) if len(df) and df.v.max() > 0 else 1.0
    return [[int((t - t0).total_seconds() // unit), round((r.o - ref) * 100), round((r.h - ref) * 100), round((r.l - ref) * 100),
             round((r.c - ref) * 100), round(99 * float(r.v) / vmax)] for t, r in df.iterrows()]


def agg5(m1):
    g = m1.resample("5min", label="left", closed="left")
    return pd.DataFrame({"o": g.o.first(), "h": g.h.max(), "l": g.l.min(), "c": g.c.last(), "v": g.v.sum()}).dropna()


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx11"
    ev = [e for e in json.loads((R / "site.json").read_text())["ev"] if e["f"] == "NFP" and e["rule"]]
    dk = DukascopyProvider()
    out = {}
    for e in ev:
        t0 = pd.Timestamp(e["d"], tz="UTC")
        a, b = FINESTRE["m5"]
        m1 = dk.m1_range("XAUUSD", (t0 - a).date(), (t0 + b).date())
        if not len(m1):
            print("niente M1", e["id"])
            continue
        ref = float(m1[m1.index <= t0].c.iat[-1]) if (m1.index <= t0).any() else float(m1.o.iat[0])
        a1, b1 = FINESTRE["m1"]
        w1 = m1[(m1.index >= t0 - a1) & (m1.index < t0 + b1)]
        w5 = agg5(m1[(m1.index >= t0 - a) & (m1.index < t0 + b)])
        ah, bh = FINESTRE["h1"]
        h1 = dk.h1_range("XAUUSD", (t0 - ah).date(), (t0 + bh).date())
        wh = h1[(h1.index >= t0 - ah) & (h1.index < t0 + bh)] if len(h1) else h1
        out[e["id"]] = {"r": round(ref, 2), "m1": serie(w1, t0, ref, 60), "m5": serie(w5, t0, ref, 60), "h1": serie(wh, t0.floor("h"), ref, 3600)}
        print(e["id"], len(w1), len(w5), len(wh), flush=True)
    (R / "nfp_contesto_tf.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
