# Piano di validazione — dove siamo e cosa manca

Confronto punto per punto fra il processo QuantLab e quello che abbiamo
effettivamente fatto su XAUUSD 2019.06–2026.09 (2.102 trade, +508%, PF 1,27,
DD 35,2%, 302 punti R).

## Stato per punto del framework

| # | Requisito | Stato | Nota |
|---|---|---|---|
| 1 | Ipotesi deterministica | ✅ | Regole in codice; mancano filtro orario (spento) e durata massima (assente) |
| 2 | Metriche di backtest | 🟡 | Mancano: drawdown medio e durata, expectancy/PF/WR rolling, distribuzione durate, breakdown mensile |
| 3 | **Benchmark nullo** | ❌ | **Mai fatto. È la lacuna più grave** |
| 4 | **Separazione IS/OOS** | ❌ | **Mai fatta: i parametri sono stati scelti su tutto il periodo** |
| 5 | Costi realistici | 🟡 | Spread reale + tick reali + 102 ms; manca lo stress test formale |
| 6 | Robustezza dei parametri | ✅ | Plateau verificati per S2 (0,03–0,07) e S3 (0,91–0,93); griglia fine per S1 |
| 7 | **Walk-forward** | ❌ | **Mai fatto; MT5 lo ha nativo** |
| 8 | Monte Carlo / bootstrap | ✅ | IID e a blocchi 5/10/20/40 |
| 9 | Regimi | 🟡 | Solo breakdown annuale; manca la divisione per volatilità e per direzione |
| 10 | Controllo del data mining | 🟡 | Correzione grezza (soglia t 3,85 su 273 passate); manca il Deflated Sharpe |
| 11 | Forward test | ❌ | Non iniziato |
| 12 | Risposta finale | 🟡 | A e D sì, B e C no |

## Le quattro domande, allo stato attuale

**A. Funziona?** Sì, sui dati disponibili. 302 punti R su 2.102 trade,
expectancy +0,1435 R/trade, t-stat 5,70 (2,24 per S1 da sola).

**B. È meglio del caso?** **Non lo sappiamo.** Mai testato.

**C. Sopravvive a dati mai visti?** **No: non esistono dati mai visti.**
Ogni parametro è stato scelto guardando tutto il periodo.

**D. Sopravvive ai costi?** Sì, con ampio margine. Stima analitica: l'edge
lordo è ~0,34 ATR per trade contro un costo di ~0,02–0,035 ATR.

| Costi | Punti R | Rendimento |
|---|---:|---:|
| base | 302 | +508% |
| ×1,25 | 293–297 | +478…+491% |
| ×1,5 | 285–292 | +450…+474% |
| ×2 | 268–283 | +398…+442% |
| ×3 | 235–263 | +307…+384% |
| azzeramento | — | fra ×10 e ×17 |

**E. È robusto?** Sui parametri sì. Il bootstrap a blocchi (che non assume
trade indipendenti) allarga però il quadro rispetto a quello IID:

| Blocco | 5° pct | mediana | 95° pct | DD mediano | DD 95° | DD peggiore |
|---|---:|---:|---:|---:|---:|---:|
| 1 (iid) | +145% | +505% | +1540% | 23% | 35% | 54% |
| 10 | +91% | +504% | +1834% | 29% | 45% | 71% |
| 40 | +95% | +493% | +1907% | 30% | 46% | 67% |

Conservando la dipendenza fra trade vicini il **drawdown atteso passa da 35%
a 45–46% al 95° percentile, con code fino al 70%**. È la stima onesta: il
bootstrap IID sottostima il rischio perché le perdite si presentano in serie.

**F. Data mining?** ~273 passate di ottimizzazione. Soglia t corretta 3,85:
S2 (3,93) e S3 (3,92) la superano, S1 (2,24) no.

**G. Evidenza ancora presente?** Non applicabile: nessun forward test.

## Priorità

### 1. Benchmark nullo — `GoldRandomNull.mq5`

È la lacuna più grave **e quella che ci riguarda più da vicino**: i
miglioramenti più grandi non sono venuti dai segnali di ingresso ma dalle
uscite (trailing largo, niente take profit). Serve sapere se gli ingressi
portano informazione o se il risultato viene dalla macchina di uscita
applicata a uno strumento che ha avuto una tendenza.

L'EA riproduce tutto — tre gambe, stessi stop in ATR, stesso trailing, stesso
sizing, stesso numero di trade, stessa durata media, stessi costi — e
randomizza **solo momento e direzione dell'ingresso**.

Procedura:
1. una passata singola, tarare `EntryProb` di ogni gamba finché i conteggi
   trade si avvicinano a 869 / 687 / 545 (`prob_nuova = prob × target/ottenuto`);
2. ottimizzare `InpSeed` da 1 a 200, criterio **Custom max**;
3. confrontare il saldo reale (60.775) con la distribuzione dei 200 saldi nulli.

| Posizione del risultato reale | Lettura |
|---|---|
| oltre il 99° percentile | evidenza forte che gli ingressi contano |
| fra 95° e 99° | evidenza discreta |
| dentro il corpo della distribuzione | **gli ingressi non portano informazione**: è la gestione delle uscite |

### 2. Walk-forward — nativo in MT5

Nel tester, campo `Avanti`: da `No` a **`1/2`** (o `1/3` per più segmenti).
MT5 ottimizza sulla prima parte e riporta il risultato sulla parte successiva,
mai vista durante l'ottimizzazione.

È l'unico modo di avere un vero out-of-sample senza dati nuovi. Da usare sul
test dei pesi di portafoglio, non per riottimizzare le regole.

Criterio: il rapporto fra risultato forward e risultato in-sample
(efficienza walk-forward) dovrebbe stare **sopra 0,5**. Sotto 0,3 significa
che i parametri non sopravvivono a dati non usati per sceglierli.

### 3. Forward test congelato

Conto demo, parametri congelati, EA in esecuzione reale. Serve a verificare
anche l'esecuzione: slippage vero, riquotazioni, gap del weekend, latenza.

Dopo ~100 trade si confronta l'expectancy osservata con l'intervallo di
confidenza di quella storica (+0,1435 R, deviazione standard 1,26 R):
con 100 trade l'errore standard è 0,126 R, quindi un'expectancy fra
**−0,11 e +0,40 R** resta statisticamente compatibile. Non si invalida il
sistema per una serie negativa corta.

## Cosa non potremo mai dire con questi dati

Lo storico del broker parte dal 2018 con dati usabili. Il 2011–2018, in cui
l'oro è sceso da 1.900 a 1.050 e poi ha oscillato tre anni, non è
verificabile. **La dipendenza dal regime resta la domanda aperta**, e nessuna
quantità di test sul 2019–2026 la può chiudere: sette anni sono un campione
ampio di *trade*, non di *regimi*.

Va scritto nero su bianco quando si valuta il sistema, nostro o loro.
