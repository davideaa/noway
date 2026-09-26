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

## Risultati (eseguito dopo il commit `460d3b3`; codice `ca56d53`)

File: `research_output/phase2/hx4/`.

### Il trade da solo (CPI+NFP insieme, costi base, perdita tagliata)

| | Serve indovinare | Tirando a caso |
|---|---|---|
| 2013–2026 | 56% | −0,08 R |
| 2013–19 (60 pips) | 58% | −0,09 |
| 2020–23 (60 pips) | 59% | −0,12 |
| 2024–26 (100 pips) | **49%** | +0,01 |
| Solo NFP | 53% | −0,05 |
| Solo CPI | 60% | −0,11 |

- Con costi conservative serve il 64%.
- Variante con ATR e tetto a 120 pips: 51% (NFP 46%, CPI 59%).

### Ricerca (scoperta 2013–19, 1.000 permutazioni per gruppo)

| Gruppo | Ipotesi | Miglior p familywise |
|---|---|---|
| CPI+NFP insieme | 1.415.567 | 0,083 |
| CPI | 1.413.445 | **0,018** |
| NFP | 1.536.833 | 0,275 |

### Test 2020–26 (esposto, Holm su 18 test: tutti 1,00)

- **Regole CPI+NFP insieme**: tutte e 5 positive, da +0,14 a +0,39 R a
  trade (16–18 trade ciascuna), p fra 0,19 e 0,37.
  - Sono quasi la stessa regola: SHORT quando le ultime sorprese sui
    salari sono state deboli.
  - Insieme coprono 47 news distinte.
- **Regole CPI**: tutte negative (da −0,24 a −0,53 R). La migliore della
  scoperta (p 0,018) nel test fa −0,24 R.
- **Regole NFP**: 3 positive e 2 negative.
- **Modelli**:
  - NFP: +0,07 R su 42 trade;
  - CPI: −0,03 R;
  - CPI+NFP insieme: nessun trade (sempre sotto la soglia).

### Soldi (10.000 all'anno, puntata = saldo ÷ news rimaste nell'anno)

| Strategia | A: 10.000 nuovi ogni anno, somma dei risultati | B: composto |
|---|---|---|
| Modello NFP 2014–26 | +38.149 (3 anni azzerati: 2014, 2016, 2020) | azzerato |
| Modello CPI 2014–26 | −10.502 | 854 |
| Sempre LONG | −33.011 | azzerato |
| Tirando a caso | −41.103 | azzerato |
| Regola CPI+NFP n.1, solo 2020–26 | +23.534 (di cui +24.973 nel 2026) | 22.021 |
| Regola CPI+NFP n.2, solo 2020–26 | +18.592 | azzerato |
| Regole CPI+NFP n.3–5, solo 2020–26 | da −15.986 a −5.857 | |

- Con questo metodo all'ultima news dell'anno si punta tutto il saldo
  rimasto. Per questo gli azzeramenti sono frequenti e il risultato
  dipende da poche news.

### Conclusione

- Col trade di Davide nessun test supera la correzione. Classe: al
  massimo **WEAK / EXPLORATORY + LIVE CONFIRMATION REQUIRED**.
- Gli unici segnali coerenti fra studio e test sono sull'NFP e sulle
  regole CPI+NFP che puntano SHORT dopo sorprese deboli sui salari.
- Il candidato da seguire dal vivo resta l'NFP.
