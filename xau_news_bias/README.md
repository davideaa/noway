# XAU NEWS BIAS

Motore quantitativo che, **prima** di una release macro USA ad alto
impatto, stima la direzione della prima candela M1 di XAUUSD — e che dice
**NO RELIABLE EDGE** quando i dati non giustificano una previsione.

> **Risultato della ricerca CPI (settembre 2026): NO RELIABLE EDGE.**
> Su 79 CPI mai usati per scegliere il modello (2020–2026) nessun modello
> batte il caso in modo affidabile. Dettagli e perché in
> [`docs/RISULTATI-CPI.md`](docs/RISULTATI-CPI.md). La dashboard mostra
> questo verdetto come esito principale; la stima del **movimento** atteso
> invece funziona ed è mostrata.

## Come si avvia

Serve Python 3.11 o più recente.

**Mac / Linux**

```bash
cd xau_news_bias
./start.sh
```

**Windows**: doppio clic su `start.bat` (o da terminale `start.bat`).

La prima volta lo script:
1. crea l'ambiente Python (`.venv`) e installa le librerie;
2. crea il file `.env` e si ferma: aprilo e scrivi la tua email in
   `XNB_CONTACT_EMAIL` (BLS la pretende per rispondere), poi rilancia;
3. addestra il modello dal dataset congelato del repository e scarica i dati
   di mercato recenti (qualche minuto);
4. avvia tutto. Apri **http://127.0.0.1:8765** nel browser.

Da lì in poi il sistema lavora da solo finché il computer è acceso: legge il
calendario, scarica prezzi, tassi, consensus e nowcast, ricalcola il bias
con la cadenza richiesta (30 → 15 → 5 → 1 minuto avvicinandosi alla
release), salva ogni previsione, e dopo la release registra l'esito.

**Per fermarlo:** `Ctrl+C` nel terminale (o chiudi la finestra).
Riavviandolo riprende da dove era: tutto è nel database locale.

**Per aggiornarlo:** `git pull`, poi riavvia. Se cambia `requirements.txt`:
`.venv/bin/pip install -r requirements.txt` (Windows:
`.venv\Scripts\pip install -r requirements.txt`).

## Le schermate

| Scheda | Cosa mostra |
|---|---|
| **Dashboard** | prossima release, XAU NEWS BIAS, confidence, OOS validated, casi comparabili, evoluzione T−3D → NOW, movimento atteso, ultimo aggiornamento e prossimo ricalcolo, DATA STATUS |
| **Why?** | regime macro, tassi/Fed, tecnica XAU, cross-market, aspettative (nowcast vs consensus), casi storici comparabili, performance fuori campione della fascia di confidenza, tutte le feature della fotografia con il suo hash |
| **Research Lab** | eventi totali/usabili/esclusi e motivo, distribuzione bullish/bearish, confronto modelli, calibrazione, fasce ≥60/65/70/75%, anni, regimi, screening feature, ipotesi H2, tetto teorico, movimento, errori |
| **Track record** | ogni release prevista dal vivo: previsione T−1H, ultima pre-release, esito reale; integrità della catena di hash |
| **Fonti & sistema** | registro fonti (HEALTHY / STALE / FAILED / NOT CONFIGURED), job e loro esito, versioni dei modelli |

### Come leggere i numeri

- **BEARISH — 74%**: la probabilità *calibrata* che la prima M1 chiuda sotto
  il prezzo pre-release. Viene mostrata **solo** se il modello ha superato
  il protocollo fuori campione. Altrimenti compare **NO RELIABLE EDGE** e,
  sotto, l'"inclinazione del modello (non validata)": è un numero che non
  va usato per decidere.
- **Affidabilità storica della fascia**: quante volte, su dati mai visti,
  previsioni con confidenza simile hanno avuto ragione, con intervallo di
  confidenza al 95%. È questo il numero onesto, non il 74%.
- **Confidence HIGH/MEDIUM/LOW/NONE**: dipende dal limite inferiore di quel
  intervallo, e scende a LOW se c'è un DATA QUALITY WARNING.
- **Casi comparabili**: CPI storici con regime simile (inflazione, tassi,
  dollaro, volatilità, trend dell'oro). Se sono meno di 10 lo dice.
- **Movimento contestuale**: range, body, MFE/MAE tipici della prima M1 nei
  casi comparabili, riscalati sulla volatilità di oggi. 1 pip = $0,10.
  Non influenza BULLISH/BEARISH.
- **DATA STATUS**: HEALTHY, oppure DATA QUALITY WARNING (qualcosa è vecchio
  o manca: confidence forzata a LOW), oppure DATA INSUFFICIENT (prezzo XAU
  assente o vecchio: previsione sospesa, mostra NO DATA).

## Dove sono i dati

| Percorso | Cosa | Nel repository? |
|---|---|---|
| `data/xnb.sqlite` | database: eventi, valori, esiti, previsioni, track record | no (tuo) |
| `data/cache/` | file scaricati dalle fonti, mai riscaricati se chiusi | no |
| `data/models/` | artefatti dei modelli (con hash registrato) | no |
| `data/logs/xnb.log` | log leggibili, a rotazione | no |
| `research_output/datasets/` | dataset congelati della ricerca, con SHA-256 | **sì** |
| `research_output/cpi_results.json` | tutti i risultati del protocollo CPI | **sì** |

Backup: basta copiare la cartella `data/`.

## API key e credenziali

Nessuna chiave è scritta nel codice: tutto sta in `.env` (escluso da git).

| Variabile | Serve? | Come si ottiene |
|---|---|---|
| `XNB_CONTACT_EMAIL` | **sì** | la tua email; BLS la richiede nello User-Agent |
| `FRED_API_KEY` | no, per estensioni (PCE, GDP, payrolls con vintage) | gratuita su fredaccount.stlouisfed.org → API Keys |

Tutte le altre fonti sono gratuite e senza chiave. Elenco completo, scelte e
alternative a pagamento in [`docs/FONTI-DATI.md`](docs/FONTI-DATI.md).

## Ricerca e validazione

```bash
.venv/bin/python scripts/research_cpi.py build   # dati → eventi → esiti → fotografie → dataset congelato
.venv/bin/python scripts/research_cpi.py run     # protocollo pre-registrato → research_output/cpi_results.json
.venv/bin/python scripts/train_model.py --version CPI-V2          # nuova versione "candidate"
.venv/bin/python scripts/train_model.py --version CPI-V2 --promote  # la mette in servizio
.venv/bin/python -m pytest                        # test (target, ora legale, leakage, immutabilità, qualità)
```

Il metodo è in [`docs/PROTOCOLLO-CPI.md`](docs/PROTOCOLLO-CPI.md): criteri
dichiarati e committati **prima** di calcolare qualunque risultato, con gli
emendamenti datati. L'architettura, il database e la metodologia
point-in-time in [`docs/ARCHITETTURA.md`](docs/ARCHITETTURA.md).

Il modello live **non** si riaddestra da solo quando arriva un dato nuovo:
ogni nuovo CPI entra nello storico e nel track record; una nuova versione
va addestrata, validata e promossa esplicitamente.

## Portarlo su un server (24/7 anche a PC spento)

Vedi [`docs/ARCHITETTURA.md`](docs/ARCHITETTURA.md#migrare-su-vps--cloud):
stesso codice, `docker compose up -d` oppure l'unità systemd in `deploy/`,
e si copia la cartella `data/` per portarsi dietro il track record.

## Confronto con il feed del tuo broker

La ricerca usa i tick Dukascopy. Per sapere se la prima M1 ha la stessa
direzione sul tuo XAUUSD.p / XAUUSD.s:

1. `.venv/bin/python scripts/export_events.py`
2. copia `research_output/cpi_events_utc.csv` in `MQL5/Files/xnb_events.csv`
3. in MT5 esegui lo script `mt5/XNB_TickExport.mq5` sul grafico dell'oro
4. `.venv/bin/python scripts/compare_broker_feed.py MQL5/Files/xnb_ticks_XAUUSD.p.csv`
