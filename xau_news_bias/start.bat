@echo off
REM Avvio su Windows: crea l'ambiente la prima volta, poi avvia backend + scheduler + interfaccia.
cd /d "%~dp0"
if not exist .venv (
  py -3 -m venv .venv
  .venv\Scripts\pip install -q -r requirements.txt
)
if not exist .env (
  copy .env.example .env
  echo Creato .env: inserisci XNB_CONTACT_EMAIL e riavvia.
  exit /b 1
)
if not exist data\models\CPI-V1.joblib (
  echo Prima installazione: addestro il modello e scarico i dati recenti, qualche minuto...
  .venv\Scripts\python scripts\bootstrap.py
)
echo XAU NEWS BIAS: apri http://127.0.0.1:8765  (Ctrl+C per fermare)
.venv\Scripts\python -m xnb.api.app
