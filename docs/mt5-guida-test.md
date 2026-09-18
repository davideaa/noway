# Guida al test dell'EA `GoldMomentum3.mq5`

Cosa c'è nel file e cosa **non** c'è, come impostare lo Strategy Tester, e
in che ordine cercare i parametri mancanti.

---

## 1. Stato della ricostruzione: cosa è dichiarato e cosa no

Ogni `input` dell'EA è marcato nel codice:

| Marca | Significato | Esempi |
|---|---|---|
| **[L]** | Letto nelle card: **non toccare** in ottimizzazione | EMA 10 e 100, 24/60/480 barre, stop 2.5 e 2.0 ATR, target 2.5R, rischio 0.6%, clamp 0.5×–2× |
| **[D]** | Dedotto (simmetria long/short, assenza di TP su S1/S2) | `InpS1AllowShort`, `InpS2AllowShort` |
| **[C]** | **Non dichiarato**: va trovato sui dati | periodo ATR, soglia pendenza EMA, meccanica del trailing, soglia "bordo del range", definizione di espansione, finestra del livello normale |

**Il filtro orario non compare da nessuna parte nel materiale.** Non l'ho
inventato: è esposto come input ma **disattivato di default**
(`InpUseSessionFilter = false`). Se lo accendi stai aggiungendo un grado di
libertà che loro non dichiarano.

Analogamente non sono dichiarati: budget di rischio condiviso fra le tre
strategie, piramidazione, filtro news, gestione del rollover.
Nell'EA il default è **0.6% per strategia, max 1 posizione per strategia**.

---

## 2. Setup dello Strategy Tester

| Impostazione | Valore | Perché |
|---|---|---|
| Symbol | XAUUSD del **tuo** broker | spread e tick value cambiano il risultato più dei parametri |
| Timeframe del grafico | H1 | ogni strategia usa comunque il suo TF |
| Modello | **Every tick based on real ticks** | trailing e stop intrabar sono decisivi qui |
| Spread | **Reale**, mai "current" fisso | su oro lo spread esplode su NFP/CPI/FOMC |
| Tipo di conto | **Hedging** | obbligatorio: le 3 strategie devono coesistere |
| Deposito | 10.000 | per confrontarsi con la card |
| Leva | ≥ 1:100 | con ATR alto il sizing può richiedere margine |
| Periodo | 2019.06.01 → oggi | stesso periodo della card |

Commissione: se il tuo broker la applica separatamente, impostala nel tester —
altrimenti stai sottostimando i costi su ~530 trade/anno.

---

## 3. Ordine di lavoro (non ottimizzare tutto insieme)

### Passo 1 — Una strategia alla volta, sizing fisso
Metti `InpUseAdaptiveRisk = false` e disattiva due strategie su tre.
L'Adaptive Risk va aggiunto **per ultimo**: mescolarlo alla ricerca dei
parametri di ingresso rende impossibile capire cosa sta funzionando.

### Passo 2 — Fissa i [L], cerca i [C] su griglia grossolana

| Input | Range | Passo | Note |
|---|---|---|---|
| `InpS2SlopeMinATR` | 0.00 → 0.20 | 0.02 | **il più importante**: governa da solo il numero di trade |
| `InpS1AtrPeriod` / `InpS2AtrPeriod` | 10 → 24 | 2 | scala tutti gli stop, quindi tutti gli R |
| `InpS1TrailATR` | 1.5 → 3.5 | 0.5 | determina la coda destra (l'1.6R medio) |
| `InpS3EdgeThreshold` | 0.70 → 0.95 | 0.05 | quanto "al bordo" deve essere il prezzo |
| `InpS3VolExpandRatio` | 0.9 → 1.3 | 0.05 | quanto deve espandersi la volatilità |
| `InpS1EmaSlopeBars` / `InpS2SlopeBars` | 1 → 5 | 1 | orizzonte della pendenza |

Scegli **plateau, non picchi**: se il risultato crolla spostando un parametro
di un passo, quel valore è rumore. Ordina i risultati per profit factor e
guarda la *forma* della superficie, non la riga in cima.

### Passo 3 — Verifica i target, in quest'ordine
Se questi non tornano, il rendimento non conta:

1. **~530 trade/anno complessivi** (±15%) — il vincolo più stringente
2. **Win rate 42%**, vincita media **1.6R**, perdita media **1.0R**
3. **Profit factor 1.20**, expectancy **+0.10R**
4. **Forma dell'anno**: 2020 e 2025 forti, **2021 negativo (−17%)**.
   Se il tuo 2021 è positivo, i tuoi filtri sono diversi dai loro.
5. Solo alla fine: equity, drawdown, Sharpe

### Passo 4 — Accendi l'Adaptive Risk
`InpUseAdaptiveRisk = true`. Confronta le due curve: l'adattivo dovrebbe
amplificare 2020/2025 e peggiorare 2021. Se peggiora tutto, la finestra del
"livello normale" (`InpRiskBaselinePeriod`) è sbagliata.

---

## 4. I test che contano davvero

Il backtest 2019–2026 è il test che **loro** hanno scelto. Questi sono quelli
che dicono qualcosa di nuovo:

**a) 2011–2018 (il test decisivo).**
Il backtest della card inizia a giugno 2019. Il 2013–2018 è stato il periodo
peggiore degli ultimi decenni per il trend following sull'oro. Se il sistema
regge lì, l'edge è strutturale; se collassa, il +798% è un'esposizione al
regime 2019–2026 e non una strategia.

**b) Costi doppi.**
Raddoppia spread e commissione. Expectancy +0.10R su ~530 trade/anno è
sottile: se l'edge sparisce raddoppiando i costi, non sopravvive al tuo
broker reale. Fai particolare attenzione al 2019–2021, dove l'ATR dell'oro in
dollari era piccolo e i costi pesano di più in proporzione.

**c) Correlazione fra le tre.**
Esporta le tre equity separate e calcola la correlazione dei rendimenti
mensili. La tesi "3 strategie decorrelate" è verificabile in cinque minuti —
e il −17% del 2021 suggerisce già la risposta.

**d) Gap del weekend.**
Nella distribuzione per-trade della card **nessuna perdita supera −1R**: gli
stop sono sempre eseguiti al prezzo esatto. Conta quante volte, nel tuo test,
una perdita supera −1R. È la misura di quanto il report originale sia
ottimista.

---

## 5. Limiti noti dell'EA

- Il trailing è un **chandelier sul prezzo corrente** (distanza fissa in ATR).
  La card dice solo "trail from 1R": la meccanica esatta resta ignota, ed è il
  parametro che più influenza la vincita media.
- Il "livello normale" dell'Adaptive Risk è implementato come media dell'ATR
  su `InpRiskBaselinePeriod` barre. Potrebbe essere una mediana, un ATR
  giornaliero, o una finestra diversa.
- Non è implementato alcun budget di rischio condiviso fra strategie: con
  Adaptive Risk al massimo, tre posizioni aperte insieme valgono ~3.6% di
  equity a rischio.
- Su conto **netting** l'EA avvisa ma continua: i risultati non sono
  confrontabili con la card.
