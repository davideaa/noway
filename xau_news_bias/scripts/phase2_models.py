"""Fase 2 — modelli: walk-forward di scoperta, scelta per gruppo, ablazioni, checkpoint."""
import argparse
import logging
import pickle
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.logging_setup import setup_logging  # noqa: E402
from xnb.phase2 import registry as REG  # noqa: E402
from xnb.phase2.run_models import checkpoints_and_direction, run, save  # noqa: E402

if __name__ == "__main__":
    setup_logging()
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", default="MAXIMUM", choices=list(REG.MODES))
    ap.add_argument("--workers", type=int)
    a = ap.parse_args()
    w = REG.workers_for(a.mode, a.workers)
    tr = pickle.loads((get_settings().data_dir / "p2_cache" / "trades.pkl").read_bytes())
    ft = pd.read_parquet(get_settings().research_dir / "phase2" / "p2_features.parquet")
    REG.campaign_update("p2_models_v1", stage="avvio", workers=w, mode=a.mode)
    res = run(tr["base"], ft, w)
    REG.campaign_update("p2_models_v1", stage="checkpoint e ampiezza")
    extra = checkpoints_and_direction(tr["base"], ft, res)
    save(res, extra)
    REG.campaign_update("p2_models_v1", stage="completata")
    logging.getLogger("xnb").info("modelli: fatto")
