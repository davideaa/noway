# Stop, MAE e MFE sulla prima M1 (fase 2)

Analisi descrittive (protocollo §9): non producono verdetti. La scelta
dello stop (unità `U_news`, k = 0,60) è stata fatta **prima** del
protocollo sui dati fino al 2019 (`p2_anatomy_prereg.json`). Qui la si
ricontrolla su tutti gli anni 2013-07 → 2026-09, dopo l'apertura del test
finale (`p2_stops.json`).

Parole usate:
- **MAE**: quanto il prezzo va contro prima della chiusura del minuto.
- **MFE**: quanto va a favore.
- **U_news**: mediana del range della prima M1 delle ultime 6 release della
  stessa famiglia, in ATR M1 dell'ora prima, per l'ATR M1 di oggi. È
  "quanto si muove di solito questa news, adattato alla volatilità di
  oggi".
- **Oracolo**: un trader immaginario che sa già in che direzione chiuderà
  la M1. Serve a misurare il **tetto**: nessun sistema reale fa meglio.

## 1. Il tetto: quanto rende sapere già la direzione

R medio per trade (in unità dello stop 0,60 U_news, ingresso T−10 s, uscita
a fine M1) al variare della larghezza dello stop k:

| | k = 0,30 | 0,42 | 0,50 | **0,60** | 0,78 | 1,0 | 1,5 | 2,0 | senza stop |
|---|---|---|---|---|---|---|---|---|---|
| CPI, costi base | −0,13 | 0,12 | 0,25 | **0,39** | 0,46 | 0,74 | 0,84 | 0,91 | 0,91 |
| CPI, costi conservative | −0,75 | −0,53 | −0,44 | **−0,20** | −0,01 | 0,12 | 0,45 | 0,57 | 0,57 |
| NFP, costi base | 0,42 | 0,67 | 0,72 | **0,77** | 0,80 | 0,91 | 0,97 | 0,98 | 1,01 |
| NFP, costi conservative | −0,08 | 0,23 | 0,35 | **0,50** | 0,59 | 0,62 | 0,76 | 0,78 | 0,82 |

**Il dato più importante di tutta la fase 2.** Anche **sapendo la
direzione**, il trade sulla prima M1 del CPI rende poco: +0,39 R con costi
base e **−0,20 R con costi conservative**. Per l'NFP il tetto è più alto
(+0,77 R). Un sistema reale indovina solo una parte delle direzioni: con
il 60% di direzioni giuste il CPI sarebbe già intorno a zero.

Per era (costi base, k = 0,60):

| | 2013–19 | 2020–22 | 2023–26 |
|---|---|---|---|
| CPI | 0,17 | 0,61 | 0,61 |
| NFP | 0,69 | 0,77 | 0,93 |

Il tetto sale nel tempo perché la M1 della news è diventata più grande
rispetto ai costi (`REGIME-ANALYSIS.md`).

## 2. Quante direzioni giuste vengono stoppate

Quota dei trade **con la direzione giusta** chiusi dallo stop prima della
fine del minuto (costi base):

| k | 0,30 | 0,42 | 0,50 | **0,60** | 0,78 | 1,0 | 1,5 | 2,0 |
|---|---|---|---|---|---|---|---|---|
| CPI | 54% | 36% | 25% | **19%** | 13% | 6% | 2% | 0% |
| NFP | 32% | 19% | 17% | **13%** | 8% | 5% | 1% | 1% |

Con lo stop scelto, circa **1 direzione giusta su 5 (CPI) e 1 su 8 (NFP)**
viene stoppata. Allargare lo stop salva le direzioni giuste ma fa perdere
di più quelle sbagliate. Senza vantaggio sulla direzione, nessuna
larghezza trasforma l'aspettativa in positiva: con direzione a caso l'R
medio è sempre circa −(costo).

## 3. Quale unità di stop

Per ogni unità candidata: il 75° percentile di MAE/unità nei trade giusti,
anno per anno. Più è stabile, più lo stop "significa la stessa cosa" in
anni diversi.

| Unità | Dispersione fra anni (sd del log), 2013–26 | Pre-protocollo, fino al 2019: dispersione del range, Spearman con il range |
|---|---|---|
| **U_news** | **0,28** | **0,16**, **0,71** |
| prezzo × 0,1% | 0,32 | 0,55, 0,21 |
| ATR D1 | 0,42 | 0,81, −0,15 |
| ATR H1 | 0,48 | 0,79, −0,23 |
| ATR M1 dell'ora prima | 0,50 | 0,74, −0,04 |
| dollari fissi | — | 0,59, — |

`U_news` resta la migliore anche sugli anni che non aveva visto. Lo stop
in dollari fissi (come i 7,43 $ ottimizzati in passato) è fra i peggiori:
la stessa cifra vale molto nel 2014 e poco nel 2025.

## 4. Quando si muove il prezzo

MFE e MAE mediane (direzione giusta), in unità U_news:

| Secondi dopo T0 | 5 | 10 | 15 | 30 | 45 |
|---|---|---|---|---|---|
| CPI MFE | 0,54 | 0,64 | 0,68 | 0,75 | 0,80 |
| NFP MFE | 0,55 | 0,66 | 0,71 | 0,83 | 0,87 |
| CPI MAE (75° percentile) | 0,10 | 0,12 | 0,14 | 0,14 | 0,16 |
| NFP MAE (75° percentile) | 0,07 | 0,07 | 0,08 | 0,10 | 0,10 |

**Due terzi del movimento a favore arrivano nei primi 5 secondi.** Per
questo un ingresso dopo la release non è la stessa cosa: chi entra a +5 s
ha già perso la parte più grande. L'estremo del minuto cade in mediana a
33 s (CPI) e 39 s (NFP).

## 5. Classi di percorso

- **A**: movimento pulito.
- **B**: prima uno scatto contrario, poi il movimento.
- **D**: frusta, su e giù.
- **E**: nessuna reazione.

Unità: M1 media dell'ora prima (definizione pre-protocollo).

| | 2013–19 | 2020–22 | 2023–26 |
|---|---|---|---|
| CPI: A / B | 67 / 10 | 25 / 10 | 34 / 10 |
| NFP: A / B | 64 / 13 | 30 / 5 | 37 / 5 |

Classi D ed E non compaiono dal 2013: ogni release muove il prezzo più di
una M1 normale.

R dell'oracolo per classe (costi base, k = 0,60):

| | A (pulito) | B (scatto contrario) |
|---|---|---|
| CPI | +0,71 R | **−0,93 R** (57% stoppati) |
| NFP | +1,06 R | **−0,84 R** (57% stoppati) |

Le release di classe B (13–29% del CPI) fanno perdere anche chi conosce
la direzione. Non si riconoscono prima: sono una tassa fissa sul trade.

## 6. Ampiezza: si prevede, ma non aiuta la direzione

- `U_news` da sola ordina bene l'ampiezza: Spearman 0,71 fino al 2019 su
  CPI+NFP insieme (0,62 nel 2014–19). Dentro la sola famiglia è più basso:
  0,16 CPI, 0,39 NFP.
- Un modello ridge con tutte le feature **non** fa meglio di `U_news` da
  sola: 0,24 contro 0,16 sul CPI, 0,23 contro 0,39 sull'NFP, 0,46 contro
  0,62 insieme. Il modello semplice vince.
- **Esplorativo** (ipotesi H-X1, dichiarata dopo la conferma finale, non
  entra nel verdetto): selezionare le release con molto "spazio" (U_news
  diviso lo spread, noto prima) **taglia i costi**. Sul CPI 2013–19 il
  costo scende da 1,50 R (terzile basso) a 0,37 R (terzile alto); lo
  stesso sull'NFP 2020–26, da 0,27 a 0,05 R. La direzione però resta a caso:
  sempre-LONG e sempre-SHORT restano negativi quasi ovunque. Serve solo se
  un giorno esistesse un vantaggio sulla direzione.

## 7. Quanto del movimento si mangia lo spread

Spread a T−10 s diviso il movimento della M1 (mediana per anno):
CPI 0,21 (2014–16), 0,09–0,22 (2017–18), 0,45 (2019), 0,38 (2020),
0,06–0,15 (2021–25), 0,04 (2026). NFP fra 0,04 e 0,17, con 0,27 nel 2020 e
0,20 nel 2025. Nel CPI recente lo spread pesa circa cinque volte meno che
nel 2014–16.
