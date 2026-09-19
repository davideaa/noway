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

---

# Monte Carlo sulla Prova B

20.000 simulazioni per metodo, sui 1.437 trade veri estratti dal report.
Ogni trade e' convertito in multipli di R usando la variazione di saldo
(quindi commissioni e swap sono gia' dentro) normalizzata sul saldo del
momento, perche' con il rischio percentuale un trade vale in euro sempre
di piu' man mano che il conto cresce.

## Prima cosa: la t vera

| Somma dei multipli di R | 137,0 |
|---|---|
| Media per trade | **+0,0953 R** |
| Deviazione standard per trade | **1,45 R** |
| **t** | **2,50** |

Avevo stimato 2,69 usando una deviazione standard di 1,26 R presa da
misure precedenti. Quella vera su questi trade e' 1,45, quindi la t
giusta e' **2,50**, non 2,69. Tutte le t calcolate prima in questo
progetto con 1,26 sono ottimistiche dello stesso fattore (~15%).

## I quattro metodi, a rischio 0,6%

| Metodo | DD mediano | DD 95° | DD 99° | Profitto mediano | Path in perdita |
|---|---:|---:|---:|---:|---:|
| Permutazione | 16,8% | 25,0% | 29,7% | 116% | 0,0% |
| Bootstrap IID | 16,9% | 28,0% | 34,0% | 116% | 0,9% |
| **Blocchi da 20** | **16,9%** | **27,4%** | **33,6%** | **114%** | 0,8% |
| Rimozione 10% | 17,2% | 22,3% | 24,6% | 100% | 0,0% |

*Sequenza reale: +116%, drawdown 18,7%.*

**Tre cose sane in questa tabella.**

1. Il drawdown reale (18,7%) e' **peggiore** della mediana simulata
   (16,9%). Se fosse il contrario vorrebbe dire che siamo capitati su un
   ordine fortunato. Siamo capitati su uno leggermente sfortunato.

2. Togliendo un trade su dieci il profitto scende da 116% a 100%, cioe'
   in proporzione. **Il risultato non dipende da pochi trade enormi**:
   se dipendesse, togliendone il 10% crollerebbe molto di piu'.

3. Meno dell'1% dei percorsi finisce in perdita.

## Quanto rischio regge il tuo tetto

Tetto dichiarato: il Monte Carlo non deve superare il 35%. Si legge sul
95° percentile del bootstrap a blocchi.

| Rischio | DD mediano | **DD 95°** | DD 99° | Profitto mediano | %/anno | 7,3 anni |
|---:|---:|---:|---:|---:|---:|---:|
| 0,6% | 16,8% | 27,4% | 33,6% | 114% | 18,1% | 237% |
| 0,7% | 19,4% | 31,4% | 38,1% | 141% | 21,2% | 306% |
| **0,8%** | 21,9% | **35,1%** | 42,4% | 170% | 24,2% | 387% |
| 0,9% | 24,3% | 38,7% | 46,5% | 202% | 27,3% | 481% |
| 1,0% | 26,7% | **42,1%** | 50,3% | 236% | 30,3% | 590% |
| 1,2% | 31,4% | 48,6% | 57,3% | 314% | 36,3% | 861% |

**L'1% sfonda il tetto**: 42% al 95° percentile, 50% al 99°. Il limite
che hai posto cade a **0,8%**.

## Perche' il Monte Carlo e' piu' severo del riscalamento

Prima avevo scritto che a 0,91% di rischio si arriva a 27% di drawdown e
+537% in 7,3 anni. Quella era aritmetica su un solo percorso: prendeva
il drawdown del backtest e lo riscalava.

Il Monte Carlo guarda **ventimila percorsi** e legge il 95° percentile,
cioe' il caso brutto che capita una volta su venti. Sono due domande
diverse: "quanto ha perso questa volta" e "quanto puo' perdere". La
seconda e' quella che conta quando i soldi sono veri, e da' numeri
piu' bassi di profitto perche' guarda la mediana, non il percorso
fortunato che il backtest ha prodotto.

## Cosa dice il bootstrap a blocchi rispetto agli altri

A 0,6% il blocco da' 27,4% al 95° contro il 25,0% della permutazione.
La differenza e' piccola qui, e il motivo e' lo Z-Score −1,57 del
report: la dipendenza fra trade vicini c'e' ma e' modesta, perche' le
tre gambe si alternano. Nel vecchio portafoglio a tre gambe trend,
dove lo Z-Score era −3,53, la stessa differenza era molto piu' grande.
**La decorrelazione si vede anche qui.**
