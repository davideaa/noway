# H-X7 — solo la direzione della prima candela, su tutte le news (pre-registrata)

Scritta il 26/09/2026 **prima** di calcolare. Richiesta di Davide:
- una bias su **ogni** NFP e ogni CPI, senza NO TRADE;
- misurare solo quante volte si indovina la direzione della prima
  candela;
- stop e target si guardano dopo, se c'è un vantaggio.

## Cosa si prevede

- **Direzione della prima M1 dopo la release**: su se l'ultimo tick prima
  di T0 + 60 s è sopra l'ultimo tick prima di T0, giù altrimenti. Le
  release con movimento nullo sono escluse.
- Dati disponibili a **T0 − 1 min**: il cutoff T−1M, le 496 feature della
  fase 2.

## Come

- **Gruppi**: CPI+NFP insieme (principale), NFP da solo, CPI da solo.
- **Modelli**:
  - logistica (L2, C = 0,1);
  - LightGBM piccolo;
  - k-NN (PCA 8, k = 15).
- **Insiemi di feature**: i 10 della fase 2.
- **Walk-forward annuale** per ogni anno dal 2014 al 2026: il modello di
  un anno si addestra solo sulle release degli anni prima (dal 2008). È
  quello che farebbe un calcolatore dal vivo.
- **Scelta** della configurazione per gruppo: accuratezza più alta sul
  **2014–19**. Il 2020–26 non si usa per scegliere.
- **Confronti** sempre riportati:
  - "sempre la direzione più frequente nel passato";
  - "segui l'ultima ora";
  - "inverti l'ultima ora";
  - "segui la reazione della release precedente".

## Test

- Accuratezza sul 2020–26 della configurazione scelta, per gruppo.
- Binomiale unilaterale contro il 50% e contro la baseline "direzione più
  frequente".
- Holm su 3 (i tre gruppi).
- Il 2020–26 è già stato esposto: al massimo **PROMISING + LIVE
  CONFIRMATION REQUIRED**.

## Dopo

- Solo come informazione, il risultato in R col trade di Davide (60/100
  pips, ingresso T − 60 s, uscita a fine M1) seguendo la bias su tutte le
  news.
- Sito: per ogni news, candele con wick dai tick bid/ask, ingresso, stop e
  chiusura con i prezzi scritti.

## Risultati (dopo i commit `0e064bd` e del codice)

File: `research_output/phase2/hx7/hx7_results.json`.

### Modelli, bias su ogni news: accuratezza della direzione

Configurazione scelta sullo studio, per gruppo.

| Gruppo | Scelta | Studio 2014–19 | Test 2020–26 | "Direzione più frequente" nel test | p contro 50% | Holm |
|---|---|---|---|---|---|---|
| CPI+NFP | logistica, prezzo+macro+tassi | 54,2% | **47,4%** (156) | 52,6% | 0,76 | 1,00 |
| NFP | logistica, prezzo+VIX/rischio | 60,6% | **48,1%** (77) | 50,6% | 0,68 | 1,00 |
| CPI | LightGBM, prezzo+macro | 50,7% | **49,4%** (79) | 60,8% | 0,59 | 1,00 |

- Media di tutte le 30 configurazioni per gruppo nel test: CPI+NFP 49,1%,
  NFP 53,5%, CPI 49,4%.
- **I modelli non indovinano la direzione su tutte le news.**

### Scoperta dopo aver visto i dati (NON pre-registrata)

Fra i confronti c'era "segui la reazione dell'NFP precedente": sull'NFP
indovina il 38% nello studio e il 40% nel test. Quindi l'**opposto**, "fai
il contrario di come si è mosso l'oro alla NFP precedente", indovina:

| Periodo | Indovina | p (> 50%) |
|---|---|---|
| 2008–13 (mai usato da nessuna regola) | 34/69 = **49,3%** | 0,60 |
| 2014–19 | 44/71 = 62,0% | 0,028 |
| 2020–26 | 46/77 = 59,7% | 0,055 |
| 2014–26 | 90/148 = **60,8%** | ~0,005 |

- Per anno dal 2014 è ≥ 50% in 12 anni su 13; unica eccezione il 2020
  (42%).
- Prima del 2014 non c'è. Il feed di quegli anni reagiva lento e sporco
  (fase 2, rotture strutturali), ma non si può escludere che la regola
  semplicemente non esistesse.
- Sul CPI la stessa regola non funziona: 48,4% su tutto il periodo.

Si registra come **ipotesi nuova H-X8**. Si conferma solo dal vivo, su
tutte le prossime NFP, senza toccare niente.

### Col trade di Davide (solo informazione, come previsto sopra)

File: `research_output/phase2/hx7/hx7_setup_summary.json`. Codice:
`scripts/hx7_site.py`.

Trade: ingresso T0 − 60 s, stop 60 pips prima del 2024 e 100 pips dopo,
uscita a fine M1, costi base (spread tick per tick; il LONG si stoppa sul
bid, lo SHORT sull'ask), perdita tagliata a −1R. Soldi: da 10.000, saldo ÷
24 a news, interesse composto.

| Bias | Periodo | News | Indovina | R medio | Vinti | Da 10.000 |
|---|---|---|---|---|---|---|
| NFP, contrario della precedente | 2014–19 | 71 | 62,0% | +0,03 | 52% | 10.365 |
| NFP, contrario della precedente | 2020–26 | 77 | 59,7% | +0,22 | 55% | 18.028 |
| **NFP, contrario della precedente** | **2014–26** | 148 | **60,8%** | **+0,13** | 53% | **18.685** |
| NFP, calcolatore | 2014–26 | 148 | 51,4% | +0,00 | 48% | 8.649 |
| NFP, sempre LONG | 2014–26 | 148 | 44,6% | −0,15 | | 3.575 |
| NFP, sempre SHORT | 2014–26 | 148 | 55,4% | +0,01 | | 8.900 |
| CPI, contrario del precedente | 2014–26 | 150 | 49,3% | −0,22 | | 2.354 |
| CPI, calcolatore | 2014–26 | 150 | 50,0% | −0,08 | | 5.601 |

- Anche indovinando la direzione, lo stop viene spesso preso prima della
  chiusura: alla release lo spread si apre fino a 100–150 pips e da solo
  può stoppare lo SHORT.
- Nello studio 2014–19 la regola NFP indovina il 62% ma rende solo
  +0,03 R: con stop a 60 pips gli sbagli costano più di quanto rendono le
  vittorie.
- Sito: `docs/replay.html` (candele da 5 s e da 1 minuto con wick, ask,
  ingresso, stop, uscita e R per ogni news).
