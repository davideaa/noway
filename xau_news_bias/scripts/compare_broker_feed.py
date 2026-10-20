"""Confronto fra il feed del broker (export MT5) e Dukascopy sullo stesso target.

    python scripts/export_events.py            # crea research_output/cpi_events_utc.csv per MT5
    python scripts/compare_broker_feed.py xnb_ticks_XAUUSD.p.csv

Stampa per quanti eventi la direzione della prima M1 coincide e quanto
differiscono P0 e il movimento in pips. Se l'accordo è basso, un modello
validato su Dukascopy non va usato per il broker senza nuova verifica.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.research.dataset import dataset_path  # noqa: E402
from xnb.research.targets import compute_outcome  # noqa: E402

if __name__ == "__main__":
    ticks = pd.read_csv(sys.argv[1])
    s = get_settings()
    man = json.loads((s.research_dir / "cpi_dataset_manifest.json").read_text())
    ds = pd.read_parquet(dataset_path(man["file"]))
    ref = ds[ds.checkpoint == "T-1H"].set_index("event_id")
    rows = []
    for eid, g in ticks.groupby("event_id"):
        if eid not in ref.index:
            continue
        t0 = ref.loc[eid, "t0_utc"].to_pydatetime()
        o = compute_outcome(eid, t0, pd.DataFrame({"ts_ms": g.tick_utc_ms, "bid": g.bid, "ask": g.ask}), feed="broker")
        rows.append({"event_id": eid, "broker": o.direction, "dukascopy": ref.loc[eid, "y_direction"],
                     "broker_pips": o.move_pips, "duka_pips": ref.loc[eid, "y_move_pips"], "quality": o.quality})
    r = pd.DataFrame(rows)
    ok = r[(r.quality == "OK") & r.broker.isin(["BULLISH", "BEARISH"]) & r.dukascopy.isin(["BULLISH", "BEARISH"])]
    print(f"eventi confrontabili: {len(ok)} (su {len(r)})")
    print(f"stessa direzione: {(ok.broker == ok.dukascopy).mean():.1%}")
    print(f"differenza mediana del movimento: {(ok.broker_pips - ok.duka_pips).abs().median():.1f} pips")
    print(ok[ok.broker != ok.dukascopy].to_string())
