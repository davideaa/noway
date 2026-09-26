"""Addestra la versione di produzione dal dataset congelato e dai risultati del protocollo.

    python scripts/train_model.py --version CPI-V1 [--promote]

Senza ``--promote`` la versione resta "candidate": il motore live continua
a usare quella attiva. La promozione richiede che la validazione sia
registrata (verdetto del protocollo): non basta che arrivino dati nuovi.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from xnb.config import get_settings  # noqa: E402
from xnb.research.dataset import dataset_path  # noqa: E402
from xnb.live.predictor import promote, train_version  # noqa: E402
from xnb.logging_setup import setup_logging  # noqa: E402

if __name__ == "__main__":
    setup_logging()
    ap = argparse.ArgumentParser()
    ap.add_argument("--family", default="CPI")
    ap.add_argument("--version", required=True)
    ap.add_argument("--promote", action="store_true")
    a = ap.parse_args()
    s = get_settings()
    res = json.loads((s.research_dir / f"{a.family.lower()}_results.json").read_text(encoding="utf-8"))
    man = json.loads((s.research_dir / f"{a.family.lower()}_dataset_manifest.json").read_text(encoding="utf-8"))
    if res["dataset_sha256"] != man["sha256"]:
        sys.exit("I risultati non corrispondono al dataset congelato attuale: riesegui il protocollo prima.")
    import pandas as pd

    df = pd.read_parquet(dataset_path(man["file"]))
    info = train_version(df, res, a.family, a.version, man["sha256"])
    print(json.dumps(info, indent=1))
    if a.promote:
        promote(a.version)
        print(f"{a.version} promossa ad attiva")
