"""Fase 2 — ricerca massiva delle regole sulla scoperta (riprendibile dopo un crash).

    python scripts/phase2_rules.py [--mode AUTO|BALANCED|MAXIMUM|CUSTOM] [--workers N] [--perm 1000]
"""

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
from xnb.phase2.anatomy_study import load  # noqa: E402
from xnb.phase2.discovery import run_permutations  # noqa: E402
from xnb.phase2.run_rules import CAMPAIGN, SEED, fwer, observed, prepare, save, select_candidates  # noqa: E402
from xnb.phase2.trades import build_trades  # noqa: E402

if __name__ == "__main__":
    setup_logging()
    log = logging.getLogger("xnb.phase2.rules")
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", default="MAXIMUM", choices=list(REG.MODES))
    ap.add_argument("--workers", type=int)
    ap.add_argument("--perm", type=int, default=1000)
    a = ap.parse_args()
    workers = REG.workers_for(a.mode, a.workers)
    cache = get_settings().data_dir / "p2_cache"
    cache.mkdir(exist_ok=True)
    ev, ft, paths = load()
    trp = cache / "trades.pkl"
    if trp.exists():
        tr = pickle.loads(trp.read_bytes())
    else:
        tr = {s: build_trades(s, ev=ev, ft=ft, paths=paths) for s in ("optimistic", "base", "conservative", "stress")}
        trp.write_bytes(pickle.dumps(tr))
    REG.campaign_update(CAMPAIGN, stage="preparazione", workers=workers, mode=a.mode)
    prep = prepare(tr["base"], ft)
    groups = {g: o["per_cut"] for g, o in prep.items()}
    log.info("ricerca osservata...")
    obs = observed(prep, tr["conservative"])
    log.info("ipotesi valutate: %s", {g: o["n_hyp"] for g, o in obs.items()})
    run_permutations(groups, a.perm, CAMPAIGN, SEED, workers, a.mode)
    REG.campaign_update(CAMPAIGN, stage="riduzione candidati")
    res = fwer(obs, a.perm)
    cands = {g: select_candidates(r["top"]) for g, r in res.items()}
    save(res, cands)
    REG.campaign_update(CAMPAIGN, stage="completata")
    log.info("fatto")
