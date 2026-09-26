"""Fase 2: costruisce e congela il dataset CPI+NFP (eventi, percorsi tick, fotografie)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from xnb.logging_setup import setup_logging  # noqa: E402
from xnb.phase2.dataset2 import build  # noqa: E402

if __name__ == "__main__":
    setup_logging()
    build(workers=int(sys.argv[1]) if len(sys.argv) > 1 else 4)
