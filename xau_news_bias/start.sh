#!/usr/bin/env bash
# Avvio su Mac/Linux: crea l'ambiente la prima volta, poi avvia backend + scheduler + interfaccia.
set -e
cd "$(dirname "$0")"
if [ ! -d .venv ]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi
[ -f .env ] || { cp .env.example .env; echo "Creato .env: inserisci XNB_CONTACT_EMAIL e riavvia."; exit 1; }
if [ ! -f data/models/CPI-V1.joblib ]; then
  echo "Prima installazione: addestro il modello e scarico i dati recenti (qualche minuto)..."
  .venv/bin/python scripts/bootstrap.py
fi
echo "XAU NEWS BIAS: apri http://127.0.0.1:${XNB_PORT:-8765}  (Ctrl+C per fermare)"
exec .venv/bin/python -m xnb.api.app
