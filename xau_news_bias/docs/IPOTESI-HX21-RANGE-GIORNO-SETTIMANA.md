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
