"""Prima installazione su un computer nuovo.

    python scripts/bootstrap.py            # usa il dataset congelato del repository (pochi minuti)
    python scripts/bootstrap.py --rebuild  # lo ricostruisce dalle fonti e confronta l'hash (20-40 min)

1. verifica l'hash del dataset congelato contro il manifest;
2. addestra CPI-V1 dal dataset e dai risultati del protocollo e la mette in servizio;
3. scarica in cache i dati di mercato recenti che servono al motore live.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from xnb.config import get_settings  # noqa: E402
from xnb.logging_setup import setup_logging  # noqa: E402
from xnb.research.dataset import dataset_path  # noqa: E402

if __name__ == "__main__":
    setup_logging()
    ap = argparse.ArgumentParser()
    ap.add_argument("--rebuild", action="store_true")
    a = ap.parse_args()
    s = get_settings()
    if not s.contact_email:
        sys.exit("Manca XNB_CONTACT_EMAIL nel file .env (copia .env.example in .env e compilalo).")
    manifest = s.research_dir / "cpi_dataset_manifest.json"
    man = json.loads(manifest.read_text())
    path = dataset_path(man["file"])
    h = hashlib.sha256(path.read_bytes()).hexdigest()
    if h != man["sha256"]:
        sys.exit(f"Il file {path.name} non corrisponde al manifest ({h[:12]} ≠ {man['sha256'][:12]}): alterato?")
    print(f"Dataset congelato verificato: {path.name}")

    if a.rebuild:
        import runpy

        backup = manifest.read_text()
        ns = runpy.run_path(str(ROOT / "scripts" / "research_cpi.py"), run_name="not_main")
        ns["cmd_build"]()
        new = json.loads(manifest.read_text())["sha256"]
        manifest.write_text(backup)  # i risultati restano legati al dataset con cui sono stati prodotti
        print("Ricostruzione identica al byte." if new == man["sha256"] else
              f"Ricostruzione DIVERSA ({new[:12]}): le fonti hanno cambiato dati storici o sono arrivati eventi nuovi.\n"
              "Il servizio usa comunque il dataset congelato; per aggiornarlo riesegui il protocollo.")

    import pandas as pd

    from xnb.live.market import LiveMarket
    from xnb.live.predictor import promote, train_version
    from xnb.timeutil import utc_now

    res = json.loads((s.research_dir / "cpi_results.json").read_text())
    df = pd.read_parquet(path)
    train_version(df, res, "CPI", "CPI-V1", man["sha256"])
    promote("CPI-V1")
    print("Modello CPI-V1 addestrato e in servizio. Scarico i dati di mercato recenti...")
    LiveMarket().context(utc_now())
    print("Pronto. Avvia con: python -m xnb.api.app")
