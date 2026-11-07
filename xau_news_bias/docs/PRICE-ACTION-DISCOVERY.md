# Price action prima di CPI e NFP: scoperta e tentativo di falsificazione

L'ipotesi viene da te: guardando i grafici, la price action prima di CPI e
NFP sembra far indovinare la direzione più spesso di quanto si sbagli. Qui
è stata **formalizzata e messa alla prova per smentirla**, come chiedeva il
prompt. Numeri da `research_output/phase2/p2_rules_discovery.json`,
`p2_models_discovery.json`, `p2_summary.json` (`pa_simple_baselines`),
`p2_validation.json`.

## Risposta breve

**Non confermata.** Nessuna forma di price action, da sola o con il
contesto, dà un vantaggio che regga fuori campione e dopo i costi:

| Forma dell'ipotesi | Risultato |
|---|---|
| Pattern di sola price action (1–3 condizioni, 6 timeframe) | il migliore non batte il caso: p familywise 0,47 CPI, 0,45 NFP, 0,18 CPI+NFP |
| Price action + contesto macro, tassi, dollaro, azionario | una sola regola NFP significativa in scoperta (p 0,011). Nel test finale 2020–26: 11 trade, **+0,02 R**, 4 vinti su 11 |
| Modello di sola price action | t nel walk-forward −2,85 CPI, −0,40 NFP |
| Regole semplici "segui/inverti l'ultima candela" | nessuna stabile. Anche quando indovina il 66% delle direzioni, perde soldi dopo i costi |

## 1. La libreria di pattern

Costruita **senza** scegliere a mano 5 pattern: 232 feature `pa_` più 37
feature `xau_` di contesto dell'oro, su 6 timeframe (M1, M5, M15, H1, H4,
D1), tutte calcolate solo su candele chiuse prima del cutoff.

- **Candela singola** (ultime 3 di ogni timeframe): direzione, corpo, range
  in ATR, stoppino superiore e inferiore, posizione della chiusura.
- **Due o tre candele**: inside, outside, engulfing rialzista e ribassista,
  massimi e minimi crescenti o decrescenti, sequenza delle ultime 3
  direzioni.
- **Sequenze più lunghe**, riassunte: candele rialziste delle ultime 5,
  compressione a 5 barre, ROC a 10, Bollinger (posizione e ampiezza),
  Donchian (posizione e rottura), distanza e pendenza della EMA20, RSI14.
- **Struttura**: sweep del massimo e del minimo di ieri e della sessione
  asiatica, distanze da massimi e minimi di ieri, della settimana, di
  Londra e di Asia, posizione nel range del giorno e dei 20 giorni,
  breakout a 20 giorni, falsa e vera rottura del range dell'ultima ora
  contro le 4 ore prima, distanza dai livelli tondi.

**Limite dichiarato**: le sequenze di 4 e 5 candele non sono enumerate una
per una, solo riassunte (conteggio, compressione, ROC). Le combinazioni
fino a 3 condizioni su timeframe diversi coprono la maggior parte dei
pattern "a occhio" (per esempio: sweep del minimo asiatico + candela H1
rialzista + dollaro debole).

## 2. H-PA1: la sola price action

Ricerca con le stesse regole di quella completa (singole, coppie, terne,
LONG e SHORT, T−1H e T−1M), ristretta alle feature `pa_`, **con il suo
nullo a permutazioni**:

| Gruppo | Miglior t osservato | Mediana del massimo per caso | 95° percentile per caso | p familywise |
|---|---|---|---|---|
| CPI | 2,53 | 2,50 | 3,25 | **0,47** |
| NFP | 4,76 | 4,68 | 5,88 | **0,45** |
| CPI+NFP | 2,55 | 2,28 | 2,88 | **0,18** |

Tradotto: il pattern migliore che si trova cercando fra centinaia di
migliaia è **grande quanto quello che si trova su dati rimescolati**. Il
migliore del gruppo condiviso (p 0,18) perde con costi conservative
(−0,08 R) e non è stato selezionato come candidato.

## 3. H-PA2: price action più contesto

Le regole migliori della ricerca completa contengono quasi sempre una
condizione di price action insieme a una di contesto. È la forma
dell'ipotesi del prompt ("London sweep + H1 rialzista + DXY debole + …").

- **CPI**: miglior p familywise 0,77. Cinque candidati. Nella validazione
  CPI 2020–26 tutti hanno R medio negativo (da −0,07 a −1,17 R).
- **CPI+NFP insieme**: miglior p 0,53. Cinque candidati, tutti negativi sul
  CPI 2020–26 (da −0,22 a −1,09 R).
- **NFP**: una regola batte il caso in scoperta (p 0,011):
  `2Y ieri ≤ 0` **e** `compressione H4 ≤ 0,33` **e** `consensus salari > dato precedente` → SHORT.
  Scoperta: 15 trade, 14 vinti, +0,95 R.
  **Conferma finale 2020–26: 11 trade, 4 vinti, +0,02 R**, Holm p 1,00.
  Le altre due regole NFP del test finale: −0,03 R e +0,15 R.

È il caso da manuale del prompt: «WR 75%, PF 3, N = 20: non fermarti».
Questa aveva il 93% in scoperta, ed è crollata sui dati mai visti.

## 4. H-PA3: un modello costruito sulla price action

Walk-forward 2014–19, stesso modello e adattività del migliore del gruppo,
solo feature di prezzo:

| Gruppo | Trade | R medio | t |
|---|---|---|---|
| CPI | 11 | −0,98 | −2,85 |
| NFP | 18 | −0,13 | −0,40 |
| CPI+NFP | 4 | +0,25 | 0,24 |

Aggiungere famiglie non la salva: il miglior t di tutta la griglia è 0,44.

## 5. H-PA4: la versione più semplice, "indovinare la direzione"

Questa è la forma più vicina alla tua osservazione manuale: la prima M1
va nella direzione dell'ultima candela (o dell'ultimo movimento)? 16
segnali × 2 famiglie × 2 periodi = 64 confronti, regime 2013-07 → 2026.

Casi più forti (percentuale di direzioni indovinate seguendo il segnale):

| Segnale | Famiglia | 2013–19 | 2020–26 |
|---|---|---|---|
| ultima candela H4 | CPI | **66%** (p 0,006) | 46% |
| ultima candela H1 | CPI | 62% (p 0,04) | 49% |
| ritorno degli ultimi 15 min | CPI | 48% | **33%** (p 0,004), cioè l'inverso indovina il 67% |
| ritorno degli ultimi 5 min | CPI | 51% | **34%** (p 0,007) |
| ROC H1 | NFP | 55% | 62% (p 0,04) |

- Con 64 confronti la soglia corretta (Bonferroni) è p < 0,0008: **nessuno
  la supera**.
- **Nessun segnale tiene lo stesso verso nei due periodi**: quello che
  funzionava nel 2013–19 smette, e quello che funziona nel 2020–26 non
  c'era prima. È il comportamento del caso, non di una regolarità.
- **Anche indovinare non basta.** Invertire i 15 minuti sul CPI 2020–26
  indovina il 67% delle direzioni ma rende −0,16 R per trade. Il minuto
  della news ha spread larghi, salti e ritracciamenti: una direzione giusta
  alla chiusura della M1 non paga abbastanza da coprire le volte in cui
  sbaglia e lo stop.

## 6. Perché a mano può sembrare che funzioni

Non è un giudizio sulla tua esperienza, è quello che i dati mostrano:

1. **Il tasso di base è vicino al 50%.** Guardando molti pattern, qualcuno
   indovina 7–8 volte di fila per puro caso, e quelle serie si ricordano.
   Il test a permutazioni misura proprio quanto è grande la "serie
   fortunata" migliore che il caso produce.
2. **Il verso cambia fra periodi** (§5). Un trader che osserva da qualche
   anno vede un regime; la ricerca ne vede tre.
3. **La direzione giusta non basta** (§5 e `STOP-MAE-MFE-ANALYSIS.md`).
   Anche conoscendo in anticipo la direzione, il CPI rende solo +0,39 R per
   trade con costi base, e **−0,20 R con costi conservative**.
4. **Un trader manuale spesso entra dopo il primo scatto.** Quella è
   un'altra domanda: usa informazione arrivata dopo la release, che questa
   ricerca per costruzione esclude (ingresso a T−10 s). Non è stata
   testata e potrebbe dare risultati diversi. Se vuoi, è una fase nuova da
   pre-registrare.

## 7. Cosa resta aperto

- Orizzonti diversi dalla prima M1 (5, 15, 60 minuti dopo) e ingressi dopo
  la release: non testati, vanno pre-registrati come ipotesi nuove.
- Il feed del tuo broker: i test sono su Dukascopy; con uno spread più
  stretto i costi scendono. Ma anche con costi **zero** (scenario
  optimistic) nessun candidato è significativo fuori campione (vedi
  `ROBUSTNESS-REPORT.md`).
