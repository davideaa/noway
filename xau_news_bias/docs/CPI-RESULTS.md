# CPI — risultati della fase 2

**Verdetto: NO RELIABLE EDGE.** Il verdetto della fase 1
(`RISULTATI-CPI.md`) resta valido. La fase 2 ha cercato con molti più dati
e una ricerca molto più grande, e ha fatto il test più giusto (valore atteso
del trade dopo i costi, non solo la direzione): non ha trovato niente che
regga fuori campione.

Numeri: `research_output/phase2/p2_rules_discovery.json`,
`p2_models_discovery.json`, `p2_validation.json`, `validation_tests.csv`.

## 1. Cosa si misura

Per ogni CPI dal luglio 2013:

- **Ingresso**: ultimo tick a T−10 s, LONG all'ask o SHORT al bid.
- **Stop**: 0,60 × U_news.
- **Uscita**: chiusura della prima M1.
- **Costi base**: mezzo spread in più all'ingresso e all'uscita, uno spread
  in più sullo stop, +0,5 bp per lato.

Il risultato è in **R**, cioè in multipli dello stop: +1 R = guadagno pari
al rischio.

| Periodo | Eventi | Uso |
|---|---|---|
| 2013-07 → 2019-12 | 77 (71 nel walk-forward 2014–19) | scoperta |
| 2020-01 → 2026-09 | 79 | validazione, **PREVIOUSLY EXPOSED OOS** (già usato nella fase 1) |

## 2. Punto di partenza: le regole semplici perdono tutte

Walk-forward 2014–19, 71 eventi, costi base:

| Regola | R medio | t |
|---|---|---|
| sempre LONG | −0,76 | −3,6 |
| sempre SHORT | −0,96 | −5,0 |
| direzione della release precedente | −0,95 | −4,6 |
| segui l'oro dell'ultima ora | −1,09 | −5,8 |
| inverti l'oro dell'ultima ora | −0,62 | −3,0 |
| regola dollaro | −1,13 | −5,8 |
| regola tassi | −0,99 | −5,0 |
| casuale | −1,06 | −6,3 |

Il costo medio nel 2014–19 è **0,86 R per trade**: per andare in pari
serve indovinare la direzione molto spesso.

## 3. Ricerca massiva di regole

- **1.622.027 ipotesi** (1.564–1.568 condizioni elementari; singole,
  coppie, terne; LONG e SHORT; T−1H e T−1M).
- Nullo: la stessa ricerca ripetuta 1.000 volte con esiti rimescolati
  dentro ogni anno. Il miglior t "per caso" ha mediana 3,02 e 95°
  percentile 3,77.
- **Miglior t osservato: 2,80, p familywise 0,77.** Sui dati veri la
  ricerca trova meno di quanto trova in media sui dati rimescolati.
- Solo price action: miglior t 2,53 contro mediana per caso 2,50, p 0,47.

### I 5 candidati (scelti con la regola del protocollo) e la validazione 2020–26

| | Condizioni | Scoperta: n, win, R | 2020–26: trade, win, R medio | Holm |
|---|---|---|---|---|
| CPI-1 | LONG T−1H: M15 non inside, sorpresa vendite core ≤ −0,27, corr. reazioni > −0,77 | 15, 87%, +1,01 | 19, 42%, **−0,08** | 1,00 |
| CPI-2 | LONG T−1M: niente sweep minimo asiatico, 2s10s ≤ 1,02, sorpresa vendite core ≤ −0,27 | 15, 87%, +1,00 | 19, 42%, **−0,32** | 1,00 |
| CPI-3 | LONG T−1H: 3ª candela H1 ampia, H4 non outside, sorpresa salari media > −0,22 | 16, 75%, +0,92 | 25, 44%, **−0,07** | 1,00 |
| CPI-4 | LONG T−1M: ATR D1 ≤ 1,21%, M1 non outside, Nasdaq 24h ≤ +0,18% | 15, 80%, +0,81 | 8, 12%, **−1,17** | 1,00 |
| CPI-5 | LONG T−1H: H4 non outside, M5 non inside, ≤ 11 giorni dalla sorpresa ISM | 15, 73%, +0,76 | 42, 45%, **−0,12** | 1,00 |

Tutti e cinque passano da un 73–87% di vittorie a un 12–45%. Con costi
conservative vanno da −0,59 a −1,59 R.

## 4. Modelli

360 configurazioni per gruppo (3 modelli × 10 insiemi di feature × 3
adattività × 4 soglie τ). Per il CPI solo 38 fanno almeno 20 trade nel
walk-forward, e **nessuna** ha R medio positivo (t mediano −1,39, massimo
−0,31).

- **Scelto** (t più alto): ridge, prezzo + macro, finestra mobile 5 anni,
  τ = 0,3. Scoperta: 24 trade, −0,09 R, t −0,31.
- **Validazione 2020–26** (congelato): 26 trade (33% delle release), 27%
  vinti, **−0,41 R**, PF 0,52, drawdown massimo 14,8 R, Holm p 1,00.
- **Modello condiviso CPI+NFP applicato al CPI**: 9 trade, +0,11 R, p 0,45,
  Holm 1,00. Con costi conservative: −0,13 R.

Accuratezza di direzione del modello CPI su tutte le 79 release 2020–26:
**45,6%**. In quel periodo l'oro è salito nel 59,5% delle release: un
"sempre su" avrebbe fatto meglio. La logistica L1 della scoperta non ha
selezionato nessuna feature (accuratezza = frequenza di base, 50,7%).

## 5. Informazione che cresce avvicinandosi alla release?

Il modello scelto, rifatto a ogni cutoff (walk-forward 2014–19):

| T−3D | T−24H | T−4H | T−1H | T−30M | T−15M | T−5M | T−1M |
|---|---|---|---|---|---|---|---|
| −0,51 | −0,75 | −0,21 | −0,47 | −0,41 | −0,52 | −0,24 | −0,09 |

Tutti negativi. Non c'è un momento prima della release in cui
l'informazione basti.

## 6. Perché il CPI è così difficile (analisi descrittive)

- **Il tetto è basso.** Anche sapendo la direzione in anticipo, il trade
  CPI rende +0,39 R con costi base e **−0,20 R con costi conservative**
  (`STOP-MAE-MFE-ANALYSIS.md`). Nel 2013–19 solo +0,17 R.
- **Uno su cinque dei trade giusti viene stoppato** (19% con k = 0,60).
- **Il 13–29% delle release CPI fa prima uno scatto contrario** (classe B):
  lì perde anche chi conosce la direzione (−0,93 R in media).
- **Il contesto macro dopo il 2020 è fuori scala** rispetto alla scoperta
  (`REGIME-ANALYSIS.md`).

## 7. Classificazione (protocollo §8)

| | Classe | Perché |
|---|---|---|
| Regole CPI-1…5 | WEAK / EXPLORATORY + LIVE CONFIRMATION REQUIRED | t > 2 in scoperta (automatico per le migliori di una ricerca da 1,6 milioni). Tutte **negative** nella validazione |
| Regole condivise sul CPI | idem | tutte negative sul CPI 2020–26 (da −0,22 a −1,09 R) |
| Modello CPI | NO EVIDENCE | t negativo in scoperta, negativo in validazione |
| Modello condiviso | NO EVIDENCE | t 0,44 in scoperta, p 0,45 in validazione |

"WEAK / EXPLORATORY" è l'etichetta letterale del protocollo per chi aveva
t > 2 in scoperta e non ha conferma. In pratica, per le regole CPI, la
validazione le ha **smentite**.

**Il CPI non ha un historical holdout vergine**: il 2020–26 è stato usato
nella fase 1. Qualunque idea futura sul CPI si può confermare solo sulle
release che verranno (motore live, previsioni immutabili).
