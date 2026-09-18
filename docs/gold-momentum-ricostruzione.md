# "Gold Momentum" (QUANT_LAB) — ricostruzione dalle immagini marketing

Reverse-engineering del sistema a 3 strategie su XAUUSD mostrato nelle card
promozionali (equity IS/OOS, Monte-Carlo, Adaptive Risk).

Tutto ciò che segue è diviso in tre livelli di affidabilità:

| Livello | Significato |
|---|---|
| **[L]** *letto* | Scritto esplicitamente nelle immagini |
| **[D]** *dedotto* | Non scritto, ma imposto dalla matematica dei numeri mostrati o dalla prassi standard |
| **[C]** *da calibrare* | Buco reale: va trovato con una ricerca sui dati |

---

## 1. Cornice generale

| Voce | Valore | Liv. |
|---|---|---|
| Strumento | XAUUSD (oro spot) | L |
| Timeframe | H1 (strategie 1 e 2) + M30 (strategia 3) | L |
| Numero di strategie | 3, dichiarate "uncorrelated", su **un unico conto** | L |
| Rischio base | **0.6% di equity per trade** | L |
| Rischio effettivo | 0.30% – 1.20% (moltiplicatore Adaptive Risk 0.5×–2×) | L |
| Periodo | ~giugno 2019 → settembre 2026 (~7.3 anni) | L/D |
| Capitale iniziale | $10.000, curva in scala logaritmica | L |
| Split IS/OOS | "halfway date" ≈ **fine 2022** (IS 2019–2022, OOS 2023–2026) | L |
| Piattaforma | MT5 (costi e slippage "calibrati su un report live MT5") | L |

### Metriche dichiarate

| Metrica | Totale | In-Sample | Out-of-Sample |
|---|---|---|---|
| Net return | **+798%** | +82% | +394% |
| Profit factor | 1.20 | 1.12 | 1.29 |
| Win rate | 42% | 40% | 44% |
| Expectancy | **+0.10 R** | +0.059 R | +0.141 R |
| t-stat | — | +1.7 | +4.1 |
| Max drawdown | **33%** | — | — |
| Sharpe | 1.26 | — | — |
| Trade | **3.864** | — | — |

Monte-Carlo (4.000 ricampionamenti bootstrap): 100% di path in profitto,
range 5°–95° percentile **+261% … +2096%**, mediana +792%,
DD tipico 21%, DD 95° percentile 32%.

---

## 2. Verifica di coerenza (i numeri tornano?)

Prima di ricostruire le regole conviene controllare che il quadro sia
internamente coerente. Lo è, e questo fissa alcuni parametri.

**a) Expectancy → rendimento.** 3.864 trade × 0.10 R = **386 R** totali.
Con rischio frazionario fisso 0.6% composto:
`10.000 × 1.006^386 ≈ 100.800` → **+908%**.
Il dichiarato è +798% (≈ 367 R), cioè un filo meno: perfettamente compatibile
con il sizing adattivo (che ogni tanto rischia 0.3%) e con l'arrotondamento
di expectancy a 0.10. → **Conferma: rischio composto ~0.6%, R calcolato al
netto dei costi, nessun scaling aggressivo nascosto.**

**b) Win rate ↔ profit factor.** WR 42%, PF 1.20 →
`avg_win / avg_loss = 1.20 × 58/42 = 1.66`.
Da expectancy: `0.42·W − 0.58·1 = 0.10` → **W ≈ 1.62 R**.
I due conti coincidono → **vincita media ≈ 1.6 R, perdita media ≈ 1.0 R**
(quindi lo stop viene colpito quasi pieno: pochi break-even sui perdenti).

**c) Frequenza.** 3.864 trade / 7.3 anni ≈ **530 trade/anno** ≈ 2 al giorno
sommando le tre strategie. È il singolo vincolo più utile in fase di
ricalibrazione: se la tua ricostruzione produce 1.500 o 5.000 trade,
i filtri sono sbagliati.

**d) Heatmap mensile → da dove viene il rendimento.**
Anni: 2019 +9% (parziale, parte ~giugno), 2020 +69%, **2021 −17%**,
2022 +20%, 2023 +31%, 2024 +14%, **2025 +106%**, 2026 +58% (parziale).
Composto 2019–2024: `1.09·1.69·0.83·1.20·1.31·1.14 ≈ 2.74` → +174% in 5,5 anni
(≈ **19%/anno** con 33% di DD). Poi `×2.06 ×1.58 = 8.92` → **+792%**, che
combacia con il +798% dichiarato. → **La heatmap è coerente con la equity, ma
oltre metà del rendimento totale nasce negli ultimi ~20 mesi** (la corsa
parabolica dell'oro 2025–2026).

**e) Istogramma per-trade.** Picco netto a −1 R, secondo picco appena sopra 0
(uscite in trailing/pareggio), massa fra +0.5 e +2.5 R con un addensamento
a ~2.5 R (il target della strategia 3), coda sottile fino a +5 R.
Nessuna perdita oltre −1 R → **nel backtest lo stop è sempre onorato
esattamente** (nessun gap modellato: ottimismo da tenere a mente).

---

## 3. Le tre strategie

### 3.1 — Time-Series Momentum (H1)

> *"24h return clears +0.5 ATR, the 100-EMA is rising, price breaks the
> 24-bar high. Stop 2.5 ATR · trail from 1R (H1)."*

Logica: momentum di serie storica classico (stile Moskowitz–Ooi–Pedersen)
con tre conferme concordi — **spinta**, **regime**, **rottura**.

| Parametro | Valore | Liv. |
|---|---|---|
| Timeframe | H1 | L |
| Lookback momentum | 24 barre = 24h | L |
| Soglia momentum | 0.5 × ATR | L |
| Filtro di regime | EMA(100) in salita (per i long) | L |
| Trigger di ingresso | rottura del massimo a 24 barre | L |
| Stop | 2.5 × ATR | L |
| Trailing | attivato a +1R | L |
| Periodo ATR | 14 (standard) | C |
| Lookback pendenza EMA100 | 1 barra (`EMA100[0] > EMA100[1]`) | C |
| Passo/distanza del trailing | 2.5 ATR dal massimo (chandelier) | C |
| Simmetria short | sì (specchio esatto) | D |
| Take profit | nessuno (esce solo in trailing) | D |

```
// --- Strategia 1: TSMOM (H1) ---
atr   = ATR(14)
mom   = Close[0] - Close[24]
upTrend = EMA100[0] > EMA100[1]

LONG se:
      mom  >  +0.5 * atr
  AND upTrend
  AND Close[0] > Highest(High, 24)[1]      // rottura Donchian a 24 barre

SHORT se (specchio):
      mom  <  -0.5 * atr
  AND EMA100[0] < EMA100[1]
  AND Close[0] < Lowest(Low, 24)[1]

stop_iniziale = entry -/+ 2.5 * atr        // 1R = 2.5 ATR
se profitto >= 1R  ->  attiva trailing (chandelier a 2.5 ATR)
uscita: solo su trailing/stop
```

**Perché 2.5 ATR di stop e non 2.0**: è la strategia che deve *restare dentro*
i trend lunghi, quindi respiro maggiore e nessun target. È lei a produrre la
coda a +4/+5 R nell'istogramma.

---

### 3.2 — Trend-Following MA (H1)

> *"Price crosses the fast EMA10 with the EMA slope confirming. Exits on the
> opposite signal. Stop 2.0 ATR (H1)."*

Logica: sistema *always-in-ish* rapidissimo. È quasi certamente la strategia
che genera **la maggior parte dei 3.864 trade** e che tiene basso il win rate.

| Parametro | Valore | Liv. |
|---|---|---|
| Timeframe | H1 | L |
| Media | EMA(10) | L |
| Trigger | prezzo che incrocia la EMA10 | L |
| Conferma | pendenza della EMA concorde | L |
| Uscita | segnale opposto (incrocio inverso) | L |
| Stop | 2.0 × ATR | L |
| Misura della pendenza | `EMA10[0] − EMA10[n]`, n = 1…3, soglia > 0 oppure > k·ATR | C |
| Seconda EMA (lenta) di filtro | probabile ma **non dichiarata** | C |
| Take profit / trailing | nessuno | D |
| Stop-and-reverse | no: chiude e rientra sul segnale opposto | D |

```
// --- Strategia 2: EMA cross (H1) ---
atr = ATR(14)
slope = EMA10[0] - EMA10[1]

LONG se  Close[1] <= EMA10[1] AND Close[0] > EMA10[0] AND slope > 0
SHORT se Close[1] >= EMA10[1] AND Close[0] < EMA10[0] AND slope < 0

stop = entry -/+ 2.0 * atr                  // 1R = 2.0 ATR
uscita: segnale opposto, oppure stop
```

⚠️ Un EMA10 nudo su H1 oro incrocia **decine di volte al mese**: senza il
filtro di pendenza (e probabilmente senza una soglia minima sulla pendenza,
in ATR) questa strategia da sola sfonderebbe i 1.500 trade/anno. La
calibrazione della soglia di pendenza è il parametro nascosto più importante
dell'intero sistema.

---

### 3.3 — Donchian Breakout + Volatilità (M30)

> *"At the edge of the 480-bar range, breaks the 60-bar high/low with
> volatility expanding. Stop 2.0 ATR · target 2.5R · trail (M30)."*

Logica: breakout solo quando **il prezzo è già al bordo del range di lungo
periodo** *e* **la volatilità si sta espandendo** — cioè si evita il breakout
in mezzo alla congestione.

Traduzione delle finestre: su XAUUSD M30 ci sono ~46 barre al giorno, ~230 a
settimana → **480 barre ≈ 2 settimane** di range di contesto, **60 barre ≈ 30
ore** (poco più di una giornata) per il trigger.

| Parametro | Valore | Liv. |
|---|---|---|
| Timeframe | M30 | L |
| Range di contesto | 480 barre (~2 settimane) | L |
| Canale di trigger | massimo/minimo a 60 barre | L |
| Condizione "al bordo" | prezzo nel top/bottom del range 480 | L |
| Espansione di volatilità | ATR corrente > ATR di riferimento | L |
| Stop | 2.0 × ATR | L |
| Target | 2.5 R = 5.0 ATR | L |
| Trailing | sì, non specificato quando/quanto | L |
| Soglia "bordo" | ~top/bottom 20% del range (`pos > 0.8` / `< 0.2`) | C |
| Definizione espansione | `ATR(14) > ATR(50)` oppure `ATR(14)/ATR(100) > 1.1–1.3` | C |
| Attivazione trailing | probabile a +1R come la strategia 1 | C |

```
// --- Strategia 3: Donchian + espansione di vola (M30) ---
atr      = ATR(14)
hi480    = Highest(High, 480)[1];  lo480 = Lowest(Low, 480)[1]
pos      = (Close[0] - lo480) / (hi480 - lo480)     // 0..1
expand   = ATR(14) > ATR(50)                        // volatilità in espansione

LONG se  pos > 0.80 AND Close[0] > Highest(High, 60)[1] AND expand
SHORT se pos < 0.20 AND Close[0] < Lowest(Low, 60)[1]  AND expand

stop   = entry -/+ 2.0 * atr                        // 1R = 2.0 ATR
target = entry +/- 5.0 * atr                        // 2.5 R
trail  attivo dopo +1R
```

---

## 4. Adaptive Risk (il sizing)

> *"Trades bigger when the market moves more and smaller when it is calm.
> Never above 2× or below 0.5× your chosen risk."*

| Parametro | Valore | Liv. |
|---|---|---|
| Rischio base | 0.6% | L |
| Moltiplicatore | funzione della volatilità corrente vs "livello normale" | L |
| Clamp | **[0.5× , 2.0×]** → 0.30% – 1.20% | L |
| Misura di volatilità | ATR corrente | D |
| "Livello normale" | media/mediana dell'ATR su finestra lunga (200–500 barre) | C |
| Forma della funzione | lineare sul rapporto, oppure a gradini | C |

```
vol_ratio = ATR(14) / MediaMobile(ATR(14), 200)     // "livello normale"
mult      = clamp(vol_ratio, 0.5, 2.0)
risk_pct  = 0.006 * mult
lotti     = (Equity * risk_pct) / (distanza_stop_in_punti * valore_punto)
```

### ⚠️ Nota tecnica importante (e controintuitiva)

Questo sizing va **nella direzione opposta** al classico *volatility
targeting*. Poiché lo stop è già espresso in ATR, la dimensione in lotti è
già `∝ 1/ATR`; moltiplicare il rischio per un fattore `∝ ATR` **annulla la
normalizzazione** e riporta l'esposizione nozionale verso il lotto fisso.

In pratica: quando l'oro passa da ATR $4 (2019) ad ATR $35 (2025), un sizing
puramente ATR-normalizzato avrebbe ridotto i lotti di ~9×; l'Adaptive Risk ne
restituisce fino a 2×. È esattamente la scelta che ha prodotto il +106% del
2025 e il +58% del 2026 — ed è anche la ragione per cui il DD massimo è 33%
e non ~20%. **È una scommessa esplicita: "volatilità in espansione = momentum
che paga".** Funziona in trend forti, punisce nei whipsaw ad alta volatilità
(vedi il −17% del 2021).

---

## 5. Portafoglio: come si combinano

Ciò che le immagini **dicono**: le tre strategie girano insieme su un unico
conto, sono presentate come decorrelate, e la equity mostrata è quella
aggregata.

Ciò che le immagini **non dicono** ed è indispensabile per replicare:

- **Rischio totale**: 0.6% *per strategia* (fino a ~1.8%–3.6% simultaneo
  con l'adattivo) oppure 0.6% di budget diviso fra le tre? La verifica (b)
  del §2 suggerisce che l'R del report è **per-trade**, quindi la prima.
- **Posizioni concorrenti**: massimo una per strategia? Piramidazione?
- **Netting o hedging**: la strategia 1 può essere long mentre la 2 è short
  (segnali su orizzonti diversi)? In MT5 netting le due si compenserebbero,
  cambiando completamente i risultati.
- **Filtri di sessione / news / rollover**: nessuna menzione. Su oro il
  comportamento in sessione asiatica è molto diverso da quello di New York.
- **Costi assunti**: "slippage calibrato su un report MT5 live" — ma spread
  e commissione effettivi non sono dichiarati.

---

## 6. Parametri riassunti (tabella di ricostruzione)

| # | Strategia | TF | Ingresso | Filtri | Stop | Uscita |
|---|---|---|---|---|---|---|
| 1 | Time-Series Momentum | H1 | rottura max/min 24 barre | ret(24h) > 0.5 ATR; EMA100 in pendenza | 2.5 ATR | trailing da +1R |
| 2 | Trend-Following MA | H1 | incrocio prezzo/EMA10 | pendenza EMA concorde | 2.0 ATR | segnale opposto |
| 3 | Donchian + Vola | M30 | rottura max/min 60 barre | prezzo al bordo del range 480; ATR in espansione | 2.0 ATR | TP 2.5R + trailing |

Rischio: 0.6% base × clamp(vol_ratio, 0.5, 2.0).

---

## 7. Cosa manca davvero (i buchi da chiudere)

Ordinati per impatto sul risultato finale:

1. **Soglia di pendenza della EMA10** (strategia 2) — controlla da sola
   probabilmente il 60% dei trade e quindi i costi totali.
2. **Periodo dell'ATR** (14? 20? diverso per TF?) — scala *tutti* gli stop
   e quindi tutti gli R.
3. **Meccanica esatta del trailing** (distanza, passo, se a chiusura barra o
   intrabar) — determina la coda destra dell'istogramma, cioè il +1.6R medio.
4. **Regole di portafoglio** (hedging, posizioni massime, budget di rischio).
5. **Soglia "bordo del range"** e definizione di espansione di volatilità.
6. **Finestra del "livello normale"** nell'Adaptive Risk.
7. **Costi**: spread + commissione + slippage assunti per trade.

---

## 8. Come validare una ricostruzione

Target da centrare, in ordine: se questi non tornano, i parametri sono
sbagliati — non serve guardare il rendimento.

1. **Numero di trade**: ~530/anno complessivi (±15%). È il vincolo più
   stringente e il più facile da verificare.
2. **Win rate 42%** e **vincita media 1.6 R / perdita media 1.0 R**.
3. **Profit factor 1.20**, expectancy **+0.10 R**.
4. **Forma dell'anno**: 2021 negativo (−17%), 2020 e 2025 fortemente
   positivi. Se il tuo 2021 è positivo, hai filtri diversi dai loro.
5. Solo alla fine: equity, DD, Sharpe.

Procedura consigliata:
- ricostruisci **una strategia alla volta**, standalone, con rischio fisso
  0.6% e Adaptive Risk disattivato;
- fissa i parametri dichiarati (**[L]**) e cerca solo i **[C]** su una griglia
  grossolana, verificando la stabilità dei plateau (non il picco);
- aggiungi l'Adaptive Risk solo alla fine, come ultimo strato;
- confronta le curve incrociate per verificare la decorrelazione dichiarata.

---

## 9. Lettura critica del materiale (cosa non prova ciò che sembra provare)

Utile sia per valutare il prodotto sia per non riprodurre gli stessi errori.

- **Il Monte-Carlo non è una prova di robustezza.** Un bootstrap iid che
  rimescola 3.864 trade con expectancy positiva restituisce "100% di
  probabilità di profitto" *per costruzione*. Dice solo che il campione è
  numeroso, non che l'edge sia stabile nel tempo. Distrugge inoltre il
  *clustering* delle perdite: infatti il DD reale (33%) cade al **95°
  percentile** delle simulazioni (32%) — segnale che le perdite nel backtest
  arrivano in fila, esattamente ciò che il bootstrap cancella.
- **L'OOS migliore dell'IS è sospetto, non rassicurante.** IS: PF 1.12,
  t = 1.7 (non significativo). OOS: PF 1.29, t = 4.1. Il motivo più semplice
  non è che il sistema sia "buono": è che l'OOS 2023–2026 coincide con il
  trend più forte dell'oro degli ultimi 40 anni. Qualunque trend-follower
  avrebbe brillato lì.
- **La concentrazione del rendimento.** Il 2019–2024 vale ~19%/anno con 33%
  di DD; il resto del +798% arriva da 2025–2026. Il numero da usare per le
  aspettative è il primo, non il titolo.
- **Nessuna perdita oltre −1R** implica stop sempre eseguiti al prezzo:
  sull'oro, con gap del weekend e news (NFP, CPI, FOMC), è ottimistico.
- **Sensibilità ai costi.** Con ~530 trade/anno ed expectancy +0.10 R
  (≈ +0.2 ATR per trade), 1 dollaro di costo aggiuntivo per trade su un ATR
  2019 di ~$4 erode un quarto dell'edge. La curva è probabilmente molto
  sensibile allo spread assunto, soprattutto nel periodo 2019–2021, dove
  l'ATR in dollari è piccolo. È il primo test da rifare con costi doppi.
- **"3 strategie decorrelate"**: sono tutte e tre *long-volatility /
  trend-following sullo stesso sottostante*. La correlazione dei rendimenti
  mensili è quasi certamente alta; la decorrelazione, se c'è, è a livello di
  singolo trade, non di regime. Il −17% del 2021 (anno laterale per l'oro) lo
  conferma: hanno perso tutte insieme.

---

*Documento ricostruito esclusivamente dalle immagini promozionali fornite.
Nessun accesso al codice sorgente originale: i valori marcati **[D]** e **[C]**
sono inferenze, non dati del produttore.*
