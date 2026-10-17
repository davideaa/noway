# NFP — risultati della fase 2

**Verdetto: NO RELIABLE EDGE.**

L'NFP aveva la cosa più preziosa della ricerca: un periodo **mai guardato**
(2020-01 → 2026-09, 77 release). È stato aperto **una sola volta**, il
26/09/2026 alle 12:00 UTC (`research_output/phase2/FINAL_NFP_OPENED.json`,
con gli hash dei candidati). I 5 test erano fissati in anticipo. Nessuno
ha retto.

Numeri: `p2_rules_discovery.json`, `p2_models_discovery.json`,
`p2_validation.json`, `validation_tests.csv`, `nfp_rule_neighbors.csv`.

## 1. Periodi

| Periodo | Release | Uso |
|---|---|---|
| 2013-07 → 2019-12 | 77 (71 nel walk-forward 2014–19) | scoperta |
| 2020-01 → 2026-09 | 77 | **conferma finale, una volta** |

Revisioni, salari, ore e partecipazione vengono dai comunicati BLS di quel
giorno. Il consensus viene dallo storico ForexFactory. Le analisi fatte
prima del protocollo non hanno mai toccato l'NFP dopo il 2019.

## 2. Le regole semplici (scoperta, 71 release, costi base)

| Regola | R medio | t |
|---|---|---|
| sempre LONG | −0,41 | −2,4 |
| sempre SHORT | −0,41 | −2,4 |
| direzione della release precedente | −0,62 | −3,8 |
| segui l'oro dell'ultima ora | −0,38 | −2,2 |
| inverti l'oro dell'ultima ora | −0,44 | −2,6 |
| regola dollaro | −0,24 | −1,3 |
| regola tassi | −0,68 | −3,5 |
| casuale | −0,33 | −1,9 |

Costo medio 0,41 R per trade: la metà del CPI. L'NFP si muove di più
rispetto allo spread.

## 3. Ricerca massiva di regole

- **1.558.481 ipotesi.** Il miglior t "per caso" (1.000 permutazioni) ha
  mediana **5,54**, 95° percentile 6,70, 99° 7,34.

  Il nullo NFP è molto più alto di quello CPI (3,02) perché molte release
  NFP hanno R simili: un sottogruppo di 15 release quasi tutte vincenti ha
  varianza piccola e t enorme. La permutazione riproduce esattamente questo
  effetto, ed è per questo che serve.
- **Miglior t osservato: 7,36, p familywise 0,011.** È l'unica ipotesi di
  tutta la fase 2 che batte la ricerca massiva in scoperta.
- Solo price action: miglior t 4,76 contro mediana per caso 4,68, p 0,45.

### I candidati

Tutti SHORT, tutti con 15–17 release e 87–93% di vittorie in scoperta. Le
prime tre sono andate al test finale.

| | Condizioni | Scoperta | p familywise |
|---|---|---|---|
| NFP-1 | T−1H: 2Y di ieri ≤ 0, compressione H4 ≤ 0,33, consensus salari > dato precedente | 15, 93%, +0,95 R, t 7,36 | **0,011** |
| NFP-2 | T−1M: dollaro 5 giorni ≤ +0,12%, 2ª candela M1 piccola, sorpresa ISM servizi media ≤ 0 | 15, 87%, +0,96 R, t 6,58 | 0,073 |
| NFP-3 | T−1M: 2ª candela M1 piccola, consensus salari > precedente, ≤ 24 giorni dalla sorpresa JOLTS | 15, 93%, +1,09 R, t 6,50 | 0,086 |
| NFP-4 | T−1H: dollaro 5 giorni ≤ +0,11%, S&P 24h ≤ +0,14%, ≤ 24 giorni dalla sorpresa JOLTS | 15, 87%, +0,88 R | 0,31 |
| NFP-5 | T−1M: 1ª candela M5 piccola, stoppino M15, ≤ 28 giorni dalla sorpresa salari | 17, 88%, +0,88 R | 0,47 |

## 4. Modelli (scoperta)

360 configurazioni. 135 con almeno 20 trade: **1% con R medio positivo**
(t mediano −1,32).

**Scelto**: LightGBM, prezzo + macro + tassi, finestra mobile 5 anni, τ = 0.
Scoperta: 23 trade, **+0,05 R, t 0,15**. Di fatto zero.

## 5. Conferma finale 2020–26 (una volta, Holm con m = 5)

| Test | Trade | Vinti | R medio | Avg win / loss | PF | DD max | p | Holm |
|---|---|---|---|---|---|---|---|---|
| NFP-1 | 11 (14%) | 36% | **+0,02** | +1,91 / −1,06 | 1,03 | 4,8 R | 0,49 | 1,00 |
| NFP-2 | 8 (10%) | 50% | **−0,03** | +1,07 / −1,12 | 0,95 | 4,5 R | 0,52 | 1,00 |
| NFP-3 | 14 (18%) | 36% | **+0,15** | +1,71 / −0,72 | 1,33 | 4,1 R | 0,37 | 1,00 |
| Modello NFP | 24 (31%) | 54% | **+0,50** | +1,96 / −1,24 | 1,88 | 5,9 R | 0,13 | **0,66** |
| Modello condiviso | 7 (9%) | 57% | **+0,63** | +1,95 / −1,14 | 2,28 | 3,4 R | 0,25 | 1,00 |

**La regola NFP-1** (93% di vittorie in scoperta, p 0,011) ha vinto 4
volte su 11. Senza l'ultima release (4 settembre 2026, +5,0 R) il suo R
medio sarebbe −0,48.

**Perché era fragile, già in scoperta** (`nfp_rule_neighbors.csv`): le
sue tre condizioni da sole valgono circa zero (t −1,44, −0,47, +0,12); a
coppie da −0,26 a +2,55; solo tutte e tre insieme, su 15 release, fanno
7,36. È un picco senza altopiano, lo stesso schema che il progetto MT5
ha imparato a riconoscere. NFP-2 e NFP-3 hanno la stessa forma: condizioni
singole con t fra −1,3 e +0,1, terne a +6,6 e +6,5.

**Il modello NFP** è il risultato più alto del test, ma non passa:
- Holm p 0,66, e senza correzione p 0,13;
- intervallo bootstrap dell'R medio da −0,31 a +1,35;
- con costi conservative: **0,00 R**;
- l'81% dell'R totale viene dal 2026, e un solo trade (4 settembre 2026,
  +5,0 R) ne vale il 42%. Senza quel trade, +0,30 R;
- in scoperta non valeva niente (t 0,15): è stato scelto come "il meno
  peggio" di 360 configurazioni.

Accuratezza di direzione su tutte le 77 release: 53,2% con il modello NFP e
55,8% con il condiviso. Un "sempre giù" avrebbe fatto il 55,8% (l'oro è
salito nel 44,2% delle release NFP 2020–26).

## 6. Classificazione (protocollo §8)

| | Classe |
|---|---|
| NFP-1, NFP-2, NFP-3 | WEAK / EXPLORATORY per la lettera del protocollo (t > 2 in scoperta, senza conferma). **Smentite dal test finale** |
| NFP-4, NFP-5 | WEAK / EXPLORATORY (mai testate fuori campione) |
| Modello NFP, modello condiviso | NO EVIDENCE |

Nessun test ha Holm p < 0,10: niente raggiunge nemmeno PROMISING BUT
UNPROVEN.

## 7. Cosa resta

Il periodo 2020–26 NFP ora è **esposto** come quello CPI. Qualunque idea
nuova (per esempio: pesare le release per "spazio" U_news/spread, oppure
orizzonti diversi dalla prima M1) va pre-registrata e confermata **solo
live**, sulle release future.
