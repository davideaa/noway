"""Scrive research_output/cpi_events_utc.csv (event_id, ora UTC) per lo script MT5 di export tick."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.research.dataset import dataset_path  # noqa: E402

s = get_settings()
man = json.loads((s.research_dir / "cpi_dataset_manifest.json").read_text())
ds = pd.read_parquet(dataset_path(man["file"]))
ev = ds[(ds.checkpoint == "T-1H") & (ds.t0_utc >= pd.Timestamp("2008-02-01", tz="UTC"))]
out = pd.DataFrame({"event_id": ev.event_id, "t0_utc": ev.t0_utc.dt.strftime("%Y.%m.%d %H:%M")})
path = s.research_dir / "cpi_events_utc.csv"
out.to_csv(path, index=False)
print(f"{len(out)} eventi in {path}")
