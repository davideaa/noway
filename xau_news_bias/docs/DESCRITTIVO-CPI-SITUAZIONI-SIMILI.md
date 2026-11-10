# CPI in situazioni simili a oggi: cosa ha fatto l'oro (descrittivo, scritto prima di calcolare)

Scritto il 10/11/2026 alle 10:45 UTC, **prima** di calcolare e prima del CPI delle 13:30 UTC.

## Domanda di Davide

La Fed vuole alzare i tassi a dicembre e il CPI di oggi serve da conferma. In situazioni simili, cosa ha fatto di solito l'oro nel primo minuto? Usare i dati di NFP e inflazione.

## Cosa è e cosa non è

- **È un descrittivo.** Non decide niente e non cambia il sito né il registro dal vivo.
- **Non è una prova.** Sul CPI abbiamo già cercato in 4,66 milioni di ipotesi e l'holdout è già stato aperto: verdetto NO RELIABLE EDGE. Qualunque gruppo "simile a oggi" trovato adesso sugli stessi anni è contaminato.
- I gruppi piccoli (meno di 20 casi) si riportano con il numero di casi, senza conclusioni.

## La situazione di oggi (dalle notizie, prima del dato)

- La Fed ha già alzato a settembre 2026 (3,75 → 4,00) e il mercato dà circa l'84% a un rialzo a dicembre.
- L'ultima NFP (06/11) è stata forte.
- Il CPI precedente (settembre, uscito il 14/10) è stato alto: 0,6% e 0,3% core.
- Per oggi il consenso è in calo: 0,3% (non arrotondato ~0,23) e core 0,2%.

## Definizioni, fissate prima

Dati: `hx26_release.csv` (attese e dati usciti, ForexFactory), `p2_events.parquet` (prima candela M1 dell'oro sui tick), dal 2008.

| Sigla | Condizione |
|---|---|
| C1 | la riunione Fed successiva al CPI ha alzato i tassi |
| C2 | l'ultima NFP prima del CPI è uscita sopra le attese |
| C3 | il CPI precedente è uscito caldo: core sopra le attese, oppure core in linea e totale sopra |
| C4 | il consenso sul CPI totale m/m è più basso del dato precedente |

Esito del CPI: **CALDO** se il core esce sopra le attese (a parità di core vale il totale), **FREDDO** se sotto, **IN LINEA** se entrambi uguali alle attese.

Gruppi: tutti i CPI; C1; C1+C2; C1+C4; C1+C3+C4; C1+C2+C3+C4.

Per ogni gruppo:
- quanti casi;
- quante volte la prima candela M1 dell'oro chiude su;
- la mossa mediana in % del prezzo;
- le stesse cose divise per esito (caldo, in linea, freddo).

Si elencano anche uno per uno i CPI del gruppo C1.

## Risultati

(da scrivere dopo il calcolo)
