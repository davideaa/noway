"""Fase 2 — verifica fuori campione: validazione CPI (esposta) e conferma finale NFP (una volta).

    python scripts/phase2_validate.py            # esegue entrambe
    python scripts/phase2_validate.py --no-final # solo la validazione CPI
"""
import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from xnb.logging_setup import setup_logging  # noqa: E402
from xnb.phase2.validate import run  # noqa: E402

if __name__ == "__main__":
    setup_logging()
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-final", action="store_true")
    a = ap.parse_args()
    res = run(open_final=not a.no_final)
    log = logging.getLogger("xnb.phase2.validate")
    for it in res["items"]:
        log.info("%-16s %s", it["id"], it["class"])
    log.info("VERDETTO: %s", res["verdict"])
