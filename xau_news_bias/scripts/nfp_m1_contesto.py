"""Candele M1 bid Dukascopy intorno a ogni NFP recente (45 minuti prima, 45 dopo), per il grafico "NFP rigiocate" del sito.
Solo per disegnare: nessun risultato dipende da questo file."""
import json
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402

N, PRIMA, DOPO = 24, 45, 45

if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx11"
    ev = [e for e in json.loads((R / "site.json").read_text())["ev"] if e["f"] == "NFP" and e["rule"]][-N:]
    dk = DukascopyProvider()
    out = {}
    for e in ev:
        t0 = pd.Timestamp(e["d"], tz="UTC")
        days = sorted({(t0 - timedelta(minutes=PRIMA)).date(), (t0 + timedelta(minutes=DOPO)).date()})
        m1 = pd.concat([dk.m1("XAUUSD", d) for d in days])
        w = m1[(m1.index >= t0 - timedelta(minutes=PRIMA)) & (m1.index < t0 + timedelta(minutes=DOPO))]
        # minuti dalla news, o h l c, volume Dukascopy (serve solo come altezza relativa delle barre)
        out[e["id"]] = [[int((t - t0).total_seconds() // 60), round(r.o, 2), round(r.h, 2), round(r.l, 2), round(r.c, 2), round(float(r.v), 3)] for t, r in w.iterrows()]
        print(e["id"], len(out[e["id"]]))
    (R / "nfp_m1_contesto.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
