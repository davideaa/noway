# H-X21 — Quanto si muove l'oro domani e la settimana prossima (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare.

## Idea di Davide

La volatilità di ieri e dell'ultima settimana prevede quella di domani e
della settimana dopo. Servono livelli matematici giornalieri e
settimanali, aggiornati sempre:
- range tipico;
- quanto arriva il prezzo dall'apertura, sopra e sotto;
- un livello "raro".

## Dati

- Candele H1 bid Dukascopy XAUUSD dal 2012.
- Giornata di trading chiusa alle 22:00 UTC. Settimana da domenica sera a
  venerdì 22:00 UTC.
- Range = massimo − minimo, in **% dell'apertura**, convertito in pips al
  prezzo del momento.

## Previsori

Solo dati chiusi prima del giorno o della settimana da prevedere.
- **Giorno**:
  - D1 = range di ieri;
  - D5 = media degli ultimi 5 giorni;
  - D21 = media degli ultimi 21 giorni;
  - **HAR** (Corsi 2009) = log(range) ≈ a + b1·log D1 + b2·log D5 +
    b3·log D21, stimato sui 500 giorni precedenti.
- **Settimana**:
  - W1 = range della settimana prima;
  - W4 = media delle ultime 4;
  - W13 = media delle ultime 13;
  - HAR settimanale = W1, W4, W13, stimato sulle 150 settimane precedenti.
- Previsione = k × previsore. Per D e W, k è la mediana di
  (vero ÷ previsore) sui 250 giorni o 50 settimane prima. HAR si usa
  com'è.

## Misure (2019–2026, passo per passo)

- Errore mediano |log(vero ÷ previsto)|.
- Spearman.
- Copertura delle fasce 25–75% e 10–90% dei rapporti passati.
  Obiettivi: 50% e 80%.
- Riportati 2019–22 e 2023–26.

## Decisione

- Vince il previsore con l'errore più basso in **tutti e due** i periodi.
  A meno di 0,02 di differenza, vince il più semplice.
- È "affidabile" se la fascia 10–90% copre fra il 75% e l'85% nel
  2023–26.
- Se è affidabile, va sui siti come livelli di oggi e della settimana:
  - range atteso (mediana, 75%, 90%);
  - dall'apertura: escursione tipica sopra e sotto. È la mediana di
    (massimo − apertura) e (apertura − minimo) in rapporto al range
    previsto, sugli ultimi 250 giorni o 50 settimane.
- **Collegamento con le news**: H-X20 ha già mostrato che il range del
  mese non prevede la candela della news. Qui non si riapre.

## Risultati (dopo i commit `829a6ca` e dello script)

File: `research_output/phase2/hx16/hx21_range.json`. Codice:
`scripts/hx21_range.py`.

**Giorno** (errore mediano 2019–22 / 2023–26; Spearman 2023–26; copertura
10–90% 2023–26):

| | Errore | Spearman | Copertura 10–90 |
|---|---|---|---|
| D1 (ieri) | 0,37 / 0,35 | 0,47 | 80% |
| D5 (5 giorni) | 0,29 / 0,28 | 0,60 | 81% |
| **D21 (21 giorni)** | 0,29 / 0,27 | 0,58 | **79%** |
| HAR | 0,28 / 0,26 | 0,61 | 81% |

**Settimana**:

| | Errore | Spearman | Copertura 10–90 |
|---|---|---|---|
| W1 | 0,38 / 0,34 | 0,48 | 76% |
| **W4 (4 settimane)** | 0,29 / 0,26 | 0,55 | **77%** |
| W13 | 0,29 / 0,30 | 0,43 | 77% |
| HAR | 0,29 / 0,27 | 0,51 | 76% |

- **Scelti**: D21 per il giorno (HAR è meglio di meno di 0,02, quindi
  vince il più semplice) e W4 per la settimana.
- **Affidabili** per la regola scritta prima: copertura 10–90% fra il 75%
  e l'85%.
- **A differenza delle news, qui la volatilità prevede davvero**
  (Spearman 0,55–0,60). L'errore tipico è circa il 27%.
- **Previsione del 16/10/2026** (apertura del giorno 4.155,86 $, della
  settimana 4.193,32 $):

| | Mediana | 3 volte su 4 sotto | 9 volte su 10 sotto |
|---|---|---|---|
| Range del giorno | **682 pips** | 911 | 1.209 |
| Range della settimana | **1.388 pips** | 1.717 | 2.600 |

- **Dall'apertura** (mediana sugli ultimi 250 giorni / 50 settimane):
  - il lato più lungo arriva all'82% del range nel giorno e all'80% nella
    settimana;
  - in media il giorno sale il 55% del range e scende il 45%.
