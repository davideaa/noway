# Architettura

```
Browser (web/)                      dashboard · Why? · Research Lab · Track record · Fonti
   │  HTTP JSON
Backend FastAPI (xnb/api/)          un solo processo locale, porta 8765
   │
Scheduler LIVE (xnb/live/)          quotes 15 s · calendario 30 min · dati 3 h · previsione 1 min · esiti 10 min · salute 5 min
   │
Prediction engine                   modello attivo (registro versioni) + calibrazione + fasce OOS + similarità
   │
Feature engine (xnb/research/features.py)   STESSO codice in ricerca e dal vivo
   │
Database SQLite (data/xnb.sqlite)   eventi, valori PIT, esiti, consensus archiviato, modelli, previsioni append-only
   │
Adattatori (xnb/providers/)         Dukascopy · Swissquote · gold-api · BLS · Treasury · NY Fed · Cboe · CFTC · Cleveland Fed · ForexFactory · FRED
   │
Internet
```

## Due modalità

| | RESEARCH MODE | LIVE MODE |
|---|---|---|
| Avvio | `python scripts/research_cpi.py all` | `python -m xnb.api.app` |
| Dati | storici congelati, dataset con SHA-256 in `research_output/datasets/` | feed aggiornati, cache locale |
| Carico | pesante: walk-forward, 1.000 permutazioni, multiprocess (joblib) | leggero: una fotografia al minuto |
| Output | `research_output/cpi_results.json` (Research Lab) | righe immutabili in `predictions` |

Un aggiornamento dei dati storici **non** modifica un backtest precedente:
ogni risultato porta l'hash del dataset da cui viene, e una ricostruzione
diversa produce un hash diverso (lo script `bootstrap.py --rebuild` lo
segnala invece di sovrascrivere).

## Database (tabelle principali)

| Tabella | Contenuto | Scrittura |
|---|---|---|
| `events` | release storiche e future, T0 UTC, periodo di riferimento, fonte | upsert |
| `release_values` | valori macro con `known_at_utc` (prima stampa BLS) | insert |
| `event_outcomes` | P0, OHLC del primo minuto, direzione, pips, MFE/MAE, qualità | per evento |
| `calendar_snapshots` | consensus/previous/actual come visti dal vivo, solo quando cambiano | append |
| `datasets` | hash e percorso dei dataset congelati | append |
| `models` | versioni (CPI-V1, V2…), algoritmo, dataset, hash artefatto, validazione, stato candidate/active/retired | per versione |
| `predictions` | ogni previsione: ora, evento, checkpoint, modello, bias, prob grezza e calibrata, IC, confidence, casi comparabili, movimento atteso, data status, **fotografia completa delle feature** e suo hash | **append-only** + catena di hash |
| `live_outcomes` | esito reale di ogni release prevista, con i riferimenti a previsione T−1H e ultima pre-release | **append-only** + catena di hash |
| `source_status`, `fetch_log` | stato di ogni fonte, ogni richiesta con esito e latenza | per richiesta |
| `job_runs` | ogni esecuzione dei job con esito | per job |
| `live_quotes` | prezzi raccolti dal vivo | append |

Immutabilità: trigger SQLite bloccano UPDATE e DELETE su `predictions` e
`live_outcomes`; in più ogni riga contiene `sha256(hash precedente + riga)`.
Chi modificasse il file aggirando i trigger romperebbe la catena, e la
dashboard lo mostra (**Track record → Integrità**). Testato in
`tests/test_immutability.py`.

## Metodologia point-in-time

Ogni dato ha un istante `available_from_utc` calcolato con regole prudenti
(documentate nel registro fonti). La fotografia all'istante t usa solo:

- candele **chiuse** prima di t (apertura + durata ≤ t), controllato da
  `assert_no_future` che fa fallire il calcolo in caso contrario;
- serie giornaliere con `available_from_utc ≤ t`;
- comunicati macro usciti prima di t, con i valori **di quel comunicato**;
- esiti dei CPI precedenti solo da T0+60 s in poi.

`tests/test_leakage.py` costruisce due mercati identici fino a t e diversi
dopo: le 70+ feature devono coincidere al decimale. E una controprova
verifica che cambiando il passato le feature cambino.

## Protocollo anti-leakage e walk-forward

Vedi `docs/PROTOCOLLO-CPI.md` (pre-registrato, con gli emendamenti datati
fatti prima dei test). In breve: finestra espandente, riaddestramento ogni
1° gennaio, standardizzazione e calibrazione stimate solo sul training,
modello scelto sul 2013–2019, verdetto sul 2020–2026 guardato una volta.

## Previsione dinamica

`xnb/live/engine.py`: a ogni minuto lo scheduler controlla gli eventi dei
prossimi 7 giorni. Si ricalcola quando scade la cadenza (30/15/5/1 min
secondo la distanza), a ogni checkpoint esatto (T−3D … T−5M), e subito se
cambiano consensus o nowcast. A distanza τ si usa il sottomodello
addestrato sul checkpoint più vicino.

## Versioni del modello

`scripts/train_model.py --version CPI-V2` crea una versione **candidate**.
Entra in servizio solo con `--promote`, che richiede una validazione
registrata. L'arrivo di un nuovo evento aggiunge dati allo storico ma non
cambia il modello attivo.

## Migrare su VPS / cloud

Il codice è lo stesso; cambia solo dove gira.

1. VPS Linux (anche 1 CPU / 1 GB bastano per il LIVE MODE).
2. `git clone`, copia il tuo `.env`, poi **o** `docker compose up -d`
   **o** l'unità systemd in `deploy/xnb.service`.
3. Copia la cartella `data/` dal PC per portarti dietro il track record
   (è un solo file SQLite più la cache): `rsync -a data/ server:/opt/xau_news_bias/data/`.
4. Non esporre la porta su Internet senza protezione: tieni
   `XNB_HOST=127.0.0.1` e accedi con un tunnel SSH
   (`ssh -L 8765:127.0.0.1:8765 server`) oppure metti davanti un reverse
   proxy con password e HTTPS.
