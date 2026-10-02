"""RESEARCH MODE — Proof of Concept CPI, dall'acquisizione dati al verdetto.

    python scripts/research_cpi.py build     # eventi, valori PIT, esiti, fotografie -> dataset congelato
    python scripts/research_cpi.py run       # protocollo sul dataset congelato più recente
    python scripts/research_cpi.py all       # entrambi

Il dataset congelato vive in data/datasets/ (hash nel manifest in
research_output/); i risultati in research_output/cpi_results.json.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.research.dataset import dataset_path  # noqa: E402
from xnb.logging_setup import setup_logging  # noqa: E402
from xnb.providers.bls import BLSProvider  # noqa: E402
from xnb.providers.consensus import ClevelandFedNowcast, ForexFactoryHistory  # noqa: E402
from xnb.providers.dukascopy import DukascopyProvider  # noqa: E402
from xnb.research.dataset import build_dataset  # noqa: E402
from xnb.research.pipeline import build_events, compute_outcomes, fetch_release_values  # noqa: E402

log = logging.getLogger("xnb.research_cpi")


def cmd_build() -> Path:
    events = [e for e in build_events("CPI") if e.t0_utc.year >= 2003]
    log.info("eventi CPI dall'archivio BLS: %d (%s → %s)", len(events), events[0].event_id, events[-1].event_id)
    vals = fetch_release_values(events, BLSProvider())
    log.info("comunicati con Tabella A letta: %d", sum(1 for v in vals.values() if v))
    duka = DukascopyProvider()
    outc = compute_outcomes(events, duka)
    log.info("esiti calcolati: %d (qualità: %s)", len(outc), outc["quality"].value_counts().to_dict())
    ff = ForexFactoryHistory().cpi_table()
    nc = ClevelandFedNowcast().load()
    df, h, path = build_dataset(events, outc, vals, "CPI", ff=ff, nowcast=nc)
    return path


def latest_dataset() -> tuple[pd.DataFrame, str]:
    s = get_settings()
    man = json.loads((s.research_dir / "cpi_dataset_manifest.json").read_text())
    df = pd.read_parquet(dataset_path(man["file"]))
    return df, man["sha256"]


def cmd_run(n_perm: int) -> None:
    from xnb.research.run_cpi import run

    df, h = latest_dataset()
    t0 = time.time()
    res, _ = run(df, h, n_perm=n_perm)
    out = get_settings().research_dir / "cpi_results.json"
    out.write_text(json.dumps(res, indent=1, ensure_ascii=False), encoding="utf-8")
    log.info("risultati in %s (%.0f s). Verdetto primario: %s", out, time.time() - t0, res["verdict"]["primary"])


if __name__ == "__main__":
    setup_logging()
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["build", "run", "all"])
    ap.add_argument("--perm", type=int, default=1000)
    a = ap.parse_args()
    if a.cmd in ("build", "all"):
        cmd_build()
    if a.cmd in ("run", "all"):
        cmd_run(a.perm)
