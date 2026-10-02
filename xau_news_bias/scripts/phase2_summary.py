"""Fase 2 — riepiloghi machine-readable per report e dashboard (dopo la verifica)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from xnb.logging_setup import setup_logging  # noqa: E402
from xnb.phase2.summary import run  # noqa: E402

if __name__ == "__main__":
    setup_logging()
    run()
    print("fatto")
