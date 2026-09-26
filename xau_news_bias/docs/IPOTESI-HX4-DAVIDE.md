# H-X4 — ricerca completa rifatta con il trade di Davide (pre-registrata)

Scritta il 26/09/2026 **prima** di qualunque calcolo con questa
definizione di trade. Richiesta di Davide:
- CPI e NFP insieme;
- stop 60 pips prima del 2024 e 100 pips dopo;
- rifare da capo la ricerca delle combinazioni e dei modelli;
- simulare il suo metodo per i soldi.

**Nessun dato è più vergine.** Il 2020–26 è già stato guardato per CPI e
NFP (fase 1, fase 2, H-X2, H-X3), anche se mai con questo trade. Qualunque
risultato qui vale al massimo **PROMISING BUT UNPROVEN + LIVE
CONFIRMATION REQUIRED**.

## Il trade

| | Riga principale | Variante (riportata sempre) |
|---|---|---|
| Ingresso | ultimo tick ≤ T0 − 60 s; LONG all'ask, SHORT al bid | — |
| Stop | **60 pips (6 $) prima del 2024-01-01, 100 pips (10 $) dal 2024** | stop che segue l'ATR giornaliero (formula H-X3) con un **massimo di 120 pips** |
| Uscita | chiusura della prima M1 (ultimo tick < T0 + 60 s) | — |
| Perdita | tagliata a −1R (full margin con protezione dal saldo negativo) | — |
| Costi | base; per il filtro dei candidati anche conservative | — |

## Ricerca (stesso motore della fase 2, stesse regole)

- Scoperta 2013-07 → 2019-12. Test 2020-01 → 2026-09, etichetta
  **PREVIOUSLY EXPOSED OOS**.
- Gruppo **principale: CPI + NFP insieme**. Riportati anche CPI e NFP da
  soli.
- **Regole**:
  - 1–3 condizioni, T−1H e T−1M, LONG e SHORT;
  - supporto minimo 30 per il gruppo insieme, 15 per i singoli;
  - 1.000 permutazioni stratificate per anno, con nullo max-t;
  - fino a 5 candidati per gruppo, stessa regola di selezione della fase 2.
- **Modelli**: stessa griglia della fase 2 (3 modelli × 10 insiemi × 3
  adattività × 4 soglie), walk-forward 2014–19. Scelta = t più alto con
  almeno 20 trade.
- **Test**: candidati e modelli congelati sul 2020–26, t unilaterale sull'R
  medio, **Holm su tutti i test eseguiti**.

## Soldi (il metodo di Davide)

- Ogni anno si mettono da parte **10.000** per le news.
- Prima di ogni news: puntata = saldo dell'anno ÷ news CPI+NFP rimaste
  nell'anno, quella compresa. Si perde tutta la puntata (−1R) o si vince
  puntata × R.
- **A**: ogni anno riparte da 10.000 e si riporta il risultato dell'anno.
- **B**: il saldo di fine anno passa all'anno dopo (composto su tutti gli
  anni).
- Si applica a:
  - il miglior modello e le migliori regole (walk-forward nella scoperta,
    congelati nel test);
  - "sempre LONG" e "tirando a caso" come confronto.

Nota: con questo metodo, all'ultima news dell'anno si punta tutto il saldo
rimasto. Si riporta com'è.

## Uscita

- `research_output/phase2/hx4/`;
- risultati in fondo a questo file;
- pagina replay aggiornata.
