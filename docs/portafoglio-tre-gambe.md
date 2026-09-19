# Il pullback entra. Criterio dichiarato, criterio rispettato.

XAUUSD.p, 2019.06.01–2023.12.31, tick reali, ritardo 103 ms, rischio
0,6% per trade, nessuna ottimizzazione: due passate singole che
differiscono solo per il peso di S2.

| | Profitto | DD equity | Trade | PF | Fatt. recupero | R | **R/DD** | t | Corr. lineare |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **A** FADE + DONCH | 7.088 | 16,07% | 1.115 | 1,13 | 2,54 | 89,6 | 5,58 | 2,13 | 0,86 |
| **B** + PULLBACK | **11.558** | 18,75% | 1.437 | **1,17** | **3,43** | **128,4** | **6,85** | **2,69** | **0,91** |

Criterio dichiarato prima del test: il rapporto profitto/drawdown deve
superare 6,63. **B fa 6,85.** Passa.

Il pullback porta **+38,8 punti R** e costa **2,68 punti di drawdown**.
Profitto +63%, drawdown +17%. Migliorano anche profit factor, fattore di
recupero, linearita' della curva e affidabilita'.

## A drawdown uguale, che e' l'unico confronto onesto

Rischio riscalato perche' il drawdown di backtest arrivi al bersaglio.

### Tetto scelto: Monte Carlo ≤ 35%, cioe' backtest ≤ 27%

(il bootstrap a blocchi dava un drawdown reale ~1,3 volte quello del backtest)

| | Rischio | Rendimento annuo | 7,3 anni |
|---|---:|---:|---:|
| Test 3 (mix vecchio) | 0,59% | 26,2% | +448% |
| A — due gambe | 1,08% | 23,3% | +362% |
| **B — tre gambe** | **0,91%** | **28,9%** | **+537%** |

### Al 33% della card

| | Rischio | Rendimento annuo | 7,3 anni |
|---|---:|---:|---:|
| Test 3 | 0,75% | 34,5% | +770% |
| A | 1,37% | 30,5% | +599% |
| **B** | **1,16%** | **38,0%** | **+952%** |
| *Card* | *0,6%* | *34,2%* | *+798%* |

## Una correzione da mettere a verbale

Avevo scartato la vecchia S2 (EMA cross) perche' aveva profit factor
1,23 contro l'1,50 del Donchian e perche' era "la stessa scommessa".
Il confronto fra Test 3 e Prova A dice che quella gamba valeva circa
**90 punti R**, cioe' quanto le altre due messe insieme.

Il profit factor misura la qualita' del singolo trade, non quanto una
gamba porta al portafoglio. Le due cose non coincidono e le avevo
confuse. Il pullback recupera solo 39 di quei 90 punti: in valore
assoluto il portafoglio di oggi e' piu' povero di quello di allora.

Resta vero che a drawdown uguale B batte Test 3 (537% contro 448%),
perche' porta meno rischio per punto R. Ma la frase giusta non e'
"l'EMA cross era inutile": e' "l'EMA cross portava molto e costava
altrettanto".

## Il punto debole: t = 2,69

Sotto il 3,4 che serve. Con 272 configurazioni provate in totale la
soglia teorica sarebbe 3,35 — ma quella formula presuppone prove
indipendenti, e una griglia di parametri vicini non lo e' affatto, quindi
la soglia vera e' piu' bassa e non sappiamo di quanto.

Traduzione onesta: **il portafoglio e' probabilmente reale, non
certamente reale.** Non e' un numero che autorizza ad alzare il rischio
prima di aver visto il fuori campione.

## Stato

**Configurazione di riferimento: Prova B.**
S1 FADE (peso 1) + S2 PULLBACK H4 (peso 1) + S3 DONCHIAN (peso 1),
rischio 0,6%.

## Da fare, in ordine

1. Monte Carlo / bootstrap a blocchi su B: il drawdown vero, non quello
   fortunato di questo campione.
2. Solo dopo, e una volta sola: **2024.01.01 → 2026.09.18**.
3. Il rischio si decide dopo il punto 2, mai prima.
