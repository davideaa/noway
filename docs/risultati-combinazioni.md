# Test di combinazione — il fade entra, S1 esce

Periodo **2019.06.01 → 2023.12.31** (4,58 anni), XAUUSD.p, rischio fisso
0,6%, Adaptive Risk spento, 64% tick reali, 27.100 barre. Unica differenza
fra le tre passate: i pesi delle strategie.

## Risultati

| | Profitto | DD equity | Trade | PF | Sharpe | Fatt. recupero | R | R/DD | t |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Test 1** S1+S2+S3 | 17.904 | 34,66% | 1.291 | 1,20 | 1,09 | 2,02 | 171 | 4,95 | 3,79 |
| **Test 2** +S4 | 28.599 | 35,49% | 2.074 | 1,16 | 1,45 | 2,33 | 226 | 6,36 | 3,93 |
| **Test 3** S2+S3+S4 | 19.750 | **27,48%** | 1.535 | 1,18 | **1,64** | **2,79** | 182 | **6,63** | 3,69 |

`R = ln(equity_finale/10000) / ln(1,006)`; `t = R / (1,26·√n)`.

## Cosa dicono

1. **Il fade aggiunge qualcosa di vero.** Test 2 contro Test 1: stesso
   drawdown (35,5 vs 34,7) ma +60% di profitto. Non è leva: è rendimento in
   più a parità di rischio sopportato.

2. **S1 toglie invece di aggiungere.** Test 3 contro Test 2: togliendo S1 il
   profitto scende del 31% ma il drawdown scende del 23% e lo Sharpe sale da
   1,45 a 1,64. Per unità di drawdown Test 3 è il migliore dei tre.

3. **La curva di Test 3 è la più regolare.** Correlazione lineare 0,85
   (contro 0,70 di Test 1), errore standard della regressione 2.268 (il più
   basso dei tre), Z-Score +0,26 → le operazioni sono di fatto indipendenti.
   Test 1 ha Z −3,53 (99,7%): forte dipendenza seriale, cioè le tre gambe
   trend si accendono e si spengono insieme. È esattamente il difetto che
   volevamo togliere.

## Riscalato allo stesso drawdown della card (33%)

Moltiplicatore del rischio scelto perché `1−(1−DD)^k = 0,33`.

| | Rischio | Rendimento annuo | Proiezione 7,3 anni |
|---|---:|---:|---:|
| Test 1 | 0,56% | 23,5% | +366% |
| Test 2 | 0,55% | 30,9% | +614% |
| **Test 3** | **0,75%** | **34,5%** | **+770%** |
| *Card* | *0,6%* | *34,2%* | *+798%* |

**Attenzione a come si legge questa tabella.** La proiezione a 7,3 anni è
aritmetica, non misurata: assume che i 2,7 anni non testati si comportino
come i 4,58 testati. E i parametri sono stati scelti guardando questo stesso
periodo, quindi il risultato è per costruzione ottimistico.

## Il limite da non dimenticare

Il bootstrap a blocchi (già fatto) diceva che il drawdown onesto è circa
**1,3 volte** quello del backtest. Per Test 3: 27,5% → **~36% reale**.
Portare il rischio a 0,75% lo porterebbe verso il 44%. Per questo il rischio
resta a **0,6%** finché il fuori campione non dice la sua.

## Rischio di coda del fade

La perdita singola peggiore passa da −250 (Test 1) a −932 (Test 2) e −760
(Test 3). Il sizing è corretto (il lotto è calcolato sulla distanza di stop
effettiva, dopo l'aggiustamento allo stops level), quindi sono scivolamenti
su movimenti violenti contro una posizione controtendenza con stop stretto.
È una caratteristica strutturale del fade, non un errore: va accettata e
ricordata.

## Decisione

**Configurazione di riferimento: Test 3.** S1 esce, S4 entra.
Pesi: S1 = 0, S2 = 1, S3 = 1, S4 = 1.

## Da fare

1. Verificare se S1 va a zero o a peso parziale (una passata con S1 = 0,5).
2. Costruire la terza famiglia: mean reversion dentro il range in fase di
   compressione. Oggi abbiamo trend (S2, S3) e fade (S4); manca chi guadagna
   quando il prezzo oscilla senza andare da nessuna parte.
3. Solo dopo: fuori campione 2024.01.01 → 2026.09.18, una volta sola.

---

# Test 4 — S1 a peso dimezzato

| Peso S1 | Profitto | DD | Trade | R | **R/DD** | Sharpe | Corr. lineare |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1,0 | 28.599 | 35,49% | 2.074 | 226 | 6,36 | 1,45 | 0,80 |
| 0,5 | 23.666 | 30,93% | 2.074 | 203 | 6,56 | 1,51 | 0,83 |
| **0,0** | 19.750 | **27,48%** | 1.535 | 182 | **6,63** | **1,64** | **0,85** |

Monotona su tutti e quattro gli indicatori: meno S1 c'e', meglio va. Non e'
un punto isolato, e' una direzione. **S1 esce.**

# Il problema che resta: S2 e S3 sono la stessa scommessa

Tolta S1, restano tre gambe ma solo due famiglie:

| | Cosa serve perche' si accenda | Famiglia |
|---|---|---|
| S2 | EMA10 inclinata: il prezzo sta andando da qualche parte | trend |
| S3 | chiusura oltre il canale a 60 barre, volatilita' in espansione | trend |
| S4 | chiusura oltre lo stesso canale, poi rientro | anti-trend |

S2 e S3 chiedono la stessa cosa al mercato con parole diverse. Quando il
gold parte, si accendono insieme; quando si ferma, si logorano insieme. E'
questo che moltiplica il drawdown invece di dividerlo.

S3 e' la migliore delle due: sul periodo completo faceva PF 1,50 con 545
trade contro PF 1,23 con 687 trade di S2. **S2 e' la candidata a uscire.**

# La terza famiglia: `GoldRangeMR.mq5`

Guadagna quando il mercato **non rompe niente**. Decorrelata per
costruzione, non per speranza:

| | S3 / S4 | Range MR |
|---|---|---|
| Volatilita' | in espansione | **in compressione** (condizione opposta) |
| Rottura del canale | obbligatoria | **vietata** nelle ultime N barre |
| Direzione | via dal centro | **verso** il centro |
| Target | nessuno, si cavalca | **fisso**, il centro del canale |
| Durata | giorni | **ore** |

Le prime due righe si escludono a vicenda: `ATRveloce/ATRlento` non puo'
essere sopra e sotto la soglia nello stesso istante, e una rottura non puo'
esserci e non esserci. Le due strategie non possono aprire sullo stesso
evento.
