# Registro live delle bias (H-X8 / H-X11)

`hx8_live.jsonl` è **append-only** con catena di hash: mai modificare né
cancellare una riga. `pytest` controlla la catena (`tests/test_live_hx8.py`).

- Ogni bias si scrive **prima** della release: record `prediction`.
- Dopo la release si aggiunge il risultato: record `result`, con movimento
  della prima M1 e trade nei tre scenari di spread (S0 nessuno, S1 max 40
  pips, S2 Dukascopy).
- `calendar.json`: prossime release dal calendario ufficiale BLS.

## Aggiornamento dopo ogni NFP o CPI (almeno 2 ore dopo la release)

```bash
cd xau_news_bias
python3.11 -m venv ../venv-xnb && ../venv-xnb/bin/pip install -r requirements.txt   # solo se il venv non c'è
../venv-xnb/bin/python scripts/hx8_live.py update     # risultato + bias della prossima
../venv-xnb/bin/python scripts/hx11_site.py           # dati del sito (scarica i tick che mancano)
../venv-xnb/bin/python scripts/build_site.py          # docs/replay.html
../venv-xnb/bin/python -m pytest -q
```

Poi si ripubblica `docs/replay.html` sullo stesso artifact
(https://claude.ai/artifact/KiFQgHyA9Aqqs5G9x7LEpV) e si fa commit e push.

Se i tick Dukascopy non sono ancora disponibili, `update` lo dice e non
scrive niente: si riprova più tardi. Quando `calendar.json` finisce, va
riempito con le date nuove dal calendario BLS (`xnb/providers/bls.py`).

## Come si giudica

Solo le NFP (criterio di H-X8): dopo 24 NFP almeno 15 indovinate e somma R
positiva; stop anticipato se dopo 12 ne ha indovinate 4 o meno.
