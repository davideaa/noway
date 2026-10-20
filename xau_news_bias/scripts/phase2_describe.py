"""Fase 2 — analisi descrittive su tutti gli anni, DOPO l'apertura del test finale NFP.

Stop/MAE/MFE/oracolo/classi di percorso (`p2_stops.json`), rotture strutturali
con NFP 2020+ (`p2_regimes_all.json`), R per era (`p2_eras.json`).
"""
import json
import pickle
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.logging_setup import setup_logging  # noqa: E402
from xnb.phase2 import regimes, stops  # noqa: E402
from xnb.phase2.anatomy_study import load  # noqa: E402
from xnb.phase2.validate import SEAL  # noqa: E402

if __name__ == "__main__":
    setup_logging()
    out = get_settings().research_dir / "phase2"
    if not (out / SEAL).exists():
        raise SystemExit("il test finale NFP non è ancora stato aperto: queste analisi usano anche NFP 2020-2026")
    stops.save(stops.run())
    ev, ft, _ = load()
    ok = ev[ev.a_ok.fillna(False).astype(bool)]
    reg = regimes.run(ok)
    reg["feature_shift_CPI_top20"] = regimes.feature_shift(ft, ["CPI"])[:20]
    reg["feature_shift_NFP_top20"] = regimes.feature_shift(ft, ["NFP"])[:20]
    (out / "p2_regimes_all.json").write_text(json.dumps(reg, indent=1, default=float), encoding="utf-8")
    tr = pickle.loads((get_settings().data_dir / "p2_cache" / "trades.pkl").read_bytes())
    rows = []
    for sc, t in tr.items():
        t = t[t.ok == True].copy()  # noqa: E712
        t["era"] = pd.cut(t.year, [2007, 2013, 2019, 2022, 2026], labels=["2008-13", "2014-19", "2020-22", "2023-26"])
        t["best_side"] = np.maximum(t.R_long, t.R_short)
        for (f, e), g in t.groupby(["family", "era"], observed=True):
            rows.append({"scenario": sc, "family": f, "era": str(e), "n": int(len(g)),
                         "mean_R_long": float(g.R_long.mean()), "mean_R_short": float(g.R_short.mean()),
                         "cost_R": float(-(g.R_long + g.R_short).mean() / 2),
                         "oracle_R": float(g.best_side.mean()),
                         "stop_rate_long": float(g.stop_long.mean()), "stop_rate_short": float(g.stop_short.mean())})
    (out / "p2_eras.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")
    print("fatto")
