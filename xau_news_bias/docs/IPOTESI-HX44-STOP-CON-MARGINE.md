# H-X44 — Stop con margine di sicurezza: +10/20/30/50% (pre-registrata)

Scritta il 20/10/2026 **prima** di calcolare.

## Idea di Davide

- Nel 2026 lo stop giusto era almeno **80–100 pips**. Quello del sito
  (H-X37, 30 pips + 10% della candela prevista) era in mediana 56.
- Lo stop non deve stare proprio al limite di quanto il prezzo va contro:
  serve **almeno il 20% in più** di margine.
- Poi vanno ricalcolati i risultati e l'RR.

## Cosa si sa già, da dichiarare

**Davide ha ragione sul 2026.** Con H-X37 e i prezzi S4, nel 2026 lo stop
ha salvato solo **3 NFP su 6** in cui la direzione era giusta (H-X38).

**H-X37 (prezzi S1):** allargando lo stop l'R a trade scende.

| k | IS 2014–19 | OOS 2020–26 |
|---|---|---|
| 0,05 | +0,15 | +0,52 |
| **0,10** (scelto) | **+0,10** | **+0,61** |
| 0,15 | +0,09 | +0,47 |
| 0,20 | +0,05 | +0,38 |
| 0,30 | +0,04 | +0,26 |

**H-X38 (prezzi S4):**
- H-X37 fa +0,06 nell'IS e +0,37 nell'OOS.
- Q80 fa −0,02 e +0,45.
- Nel 2026 lo stop Q80 era in mediana 88 pips.

**Perché lo stop più largo rende meno in R.**
- Col full margin il deposito è il rischio, e il lotto si sceglie dallo
  stop.
- Uno stop più largo vuol dire un lotto più piccolo.
- Quando hai ragione guadagni meno per ogni euro depositato, anche se
  lo stop scatta meno spesso.
- Il margine compra sicurezza e la paga in R.

Le NFP 2014–2026 sono già state viste: un risultato vale al massimo **"da
registrare dal vivo"**.

## Prova

Stesso trade di H-X38:
- regola H-X8;
- ingresso 14:29:00;
- uscita 14:31;
- prezzi S4;
- tetto −1R;
- 148 NFP 2014–2026.

**Stop = base × margine.**

Basi:
- **B37**: la formula del sito (H-X37);
- **Q70, Q80, Q90**: percentili di quanto il prezzo va contro quando la
  direzione è giusta, sulle 24 NFP precedenti (H-X38). Solo dati di prima.

Margini: × 1,0 (nessuno), 1,1, 1,2, 1,3, 1,5.

## Misure

- R a trade: IS 2014–19, OOS 2020–26, ultimi 3 anni, tutto.
- **Salvato**: quota di NFP con la direzione giusta in cui lo stop non
  scatta.
- RR = vincita media ÷ perdita media.
- Stop mediano per anno, in pips, e in particolare nel 2026.
- Peggior serie di perdite: il calo massimo della somma delle R.

## Decisione

- **Proposta di Davide**: B37 × 1,2. **Seconda**: Q80 × 1,2, cioè quanto
  va contro più il 20%.
- **Accettabile** vuol dire che, rispetto allo stop di oggi (B37 × 1,0):
  - l'R a trade non scende di più di **0,05** sia nell'IS sia nell'OOS;
  - lo stop salva più NFP giuste in tutti e due i periodi;
  - anche i margini vicini (× 1,1 e × 1,3 della stessa base) rispettano
    le due condizioni: altopiano.
- Se la proposta di Davide è accettabile diventa lo stop del sito, da
  confermare dal vivo. Se no si passa alla seconda.
- Se nessuna delle due lo è, lo stop resta B37. Si riporta quanto costa
  in R ciascuna versione più sicura, e la scelta la fa Davide: è il suo
  rischio.

## Risultati (dopo il commit `8a8babf`)

File: `research_output/phase2/hx16/hx44_stop_margine.json`.
- 148 NFP 2014–2026.
- Controllo: con margine × 1,0, B37 e Q80 coincidono con H-X38 trade per
  trade.

R a trade (prezzi S4, tetto −1R). "Salvato" = NFP con la direzione giusta
in cui lo stop non scatta, 2014–19 / 2020–26. Calo massimo in R, tutto
2014–26.

| Stop | 2014–19 | 2020–26 | Ultimi 3 anni | Tutto | Salvato | RR tutto | Calo massimo | Stop 2026 (mediana) | Salvate nel 2026 |
|---|---|---|---|---|---|---|---|---|---|
| **B37 × 1,0 (oggi)** | +0,059 | +0,368 | +0,744 | +0,222 | 77% / 75% | 1,69 | 12,4 | 56 | 3 su 6 |
| B37 × 1,1 | +0,011 | +0,458 | +0,994 | +0,246 | 77% / 79% | 1,67 | 13,4 | 62 | 5 su 6 |
| **B37 × 1,2 (Davide)** | **−0,006** | **+0,452** | **+0,951** | **+0,236** | 79% / 85% | 1,56 | 12,1 | 67 | 5 su 6 |
| B37 × 1,3 | −0,040 | +0,412 | +0,899 | +0,198 | 79% / 89% | 1,45 | 13,0 | 73 | 6 su 6 |
| B37 × 1,5 | −0,043 | +0,311 | +0,730 | +0,143 | 84% / 89% | 1,27 | 10,7 | 84 | 6 su 6 |
| Q70 × 1,2 | −0,044 | +0,439 | +0,884 | +0,211 | 70% / 85% | 1,63 | 11,7 | 81 | 6 su 6 |
| Q80 × 1,0 | −0,023 | +0,453 | +0,866 | +0,228 | 72% / 92% | 1,58 | 9,9 | 88 | 6 su 6 |
| **Q80 × 1,2** | **0,000** | **+0,325** | +0,665 | +0,171 | 79% / 92% | 1,37 | 9,7 | 106 | 6 su 6 |
| Q80 × 1,5 | −0,040 | +0,213 | +0,483 | +0,093 | 84% / 92% | 1,18 | 9,9 | 133 | 6 su 6 |
| Q90 × 1,0 | −0,097 | +0,165 | +0,325 | +0,041 | 79% / 92% | 1,10 | 12,5 | 169 | 6 su 6 |

**Per la regola scritta prima: nessuna delle due proposte è accettabile.**
- **B37 × 1,2**: nel 2014–19 scende di 0,065 R, oltre il limite di 0,05.
  Dal 2020 è meglio dello stop di oggi in tutto:
  - R a trade +0,452 contro +0,368;
  - salva l'85% delle NFP giuste contro il 75%;
  - calo massimo nel 2020–26 7,5 R contro 9,1.
- **Q80 × 1,2**: nel 2014–19 scende di 0,059 R. Dal 2020 costa 0,043 R a
  trade, ma salva il 92% delle NFP giuste.

Lo stop resta B37 finché Davide non sceglie: è il suo rischio.

**Da dire.**
- Uno stop più largo salva più trade giusti, ma col deposito fisso fa
  usare un lotto più piccolo. Oltre circa × 1,2 l'R a trade cala in tutti
  i periodi.
- Nel 2014–19, con la volatilità bassa, il margine non serviva quasi mai
  e costava. Dal 2020 un margine del 10–20% sulla formula rende di più.
- Stop della prossima NFP, al prezzo di oggi:
  - B37: 66 pips;
  - B37 × 1,2: 79 pips;
  - Q80: ~70 pips;
  - Q80 × 1,2: ~84 pips;
  - B37 × 1,5: 99 pips.
