# H-X19 — Dove mettere il take profit su NFP e Retail/PPI (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare.

## Richiesta di Davide

- Due livelli di take profit da mettere già all'ingresso, così chiude
  appena li tocca, invece di aspettare la chiusura M1 che a volte si
  rimangia la wick.
- I livelli devono seguire la volatilità di **adesso**: dire su quanti
  anni o release si calcolano, e perché.
- Per NFP e per Retail/PPI, su tutti e due i siti.

## Trade (quello di Davide)

- Ingresso a **T0 − 30 s** al prezzo di quel momento.
- Stop 100 pips. Perdita tagliata a −1R (full margin).
- Spread vero Dukascopy con tetto 40 pips. Il LONG si chiude sul bid, lo
  SHORT sull'ask.
- **Uscite confrontate**:
  - **C**: chiusura M1, quella di oggi;
  - **TP_a**: livello A, poi C se non arriva;
  - **TP_b**: livello B, poi C se non arriva;
  - **TP_a5**: livello A, poi chiusura a T0 + 5 min se non arriva.

## Misure per release

- Direzione "giusta" = segno della chiusura M1 (prezzo medio,
  T0 − 30 s → T0 + 60 s).
- **Arrivo** = massimo movimento nella direzione giusta da T0 − 30 s a fine
  M1, in **% del prezzo d'ingresso**.
- Il livello in pips si calcola sempre in % e poi si converte al prezzo
  del momento. Così il cambio di prezzo dell'oro non sporca la stima.

## Livelli candidati

Calcolati su una finestra di release **precedenti** (mai la release
stessa):
- **A** = 33° percentile dell'arrivo (preso circa 2 volte su 3 quando la
  direzione è giusta);
- **B** = mediana dell'arrivo (preso circa 1 volta su 2).

## Finestra, scelta con la prova "passo per passo"

- Finestre provate: ultime **6**, **12**, **24** release della stessa news,
  oppure **tutte dal 2014**.
- Per ogni release dal 2019, il livello si calcola **solo** con le
  release prima. Poi si guarda se quella release lo ha toccato.
- **Criterio di scelta**: la finestra con la quota di tocchi più vicina a
  quella nominale (67% per A, 50% per B) nel 2023–26, e con l'errore più
  basso. A parità, la più lunga, cioè più stabile.

## Il take profit conviene?

- Contro **C**, per i trade con direzione giusta: R medio di TP_a, TP_b e
  TP_a5 nel 2019–22 e nel 2023–26.
- Per le NFP anche seguendo la bias H-X8: R medio di tutti i trade, giusti
  e sbagliati. Per Retail/PPI, che non hanno una bias: media di LONG e
  SHORT, cioè a caso.
- **Un'uscita "conviene" se**:
  - batte C nei trade giusti in **tutti e due** i periodi;
  - non peggiora la media a caso (o con la bias per le NFP) di oltre
    0,05 R.
- I dati 2019–26 delle NFP sono già stati visti per altre domande: il
  risultato è una **indicazione**, da registrare dal vivo come U5.

## Risultati (dopo i commit `eeab616` e dello script)

File: `research_output/phase2/hx16/hx19_tp.json`. Codice:
`scripts/hx19_tp.py`.

### Finestra

| Finestra | NFP: tocca A / B nel 2023–26 (obiettivo 67% / 50%) | Retail/PPI: tocca A / B |
|---|---|---|
| ultime 6 | 60% / 54% | 67% / 56% |
| ultime 12 | 67% / 56% | 65% / 52% |
| **ultime 24** | **65% / 51%** | **67% / 52%** |
| tutte dal 2014 | 72% / 54% | 83% / 68% |

- Scelta: **ultime 24 release**, la più precisa per tutte e due le news. È
  circa 2 anni per la NFP e circa 1 anno per Retail/PPI.
- Usare tutto dal 2014 sottostima i livelli. È l'effetto che temeva
  Davide.

### Livelli di oggi (prezzo 4.156 $, ultime 24 release)

| | A (2 volte su 3) | B (1 volta su 2) |
|---|---|---|
| NFP | 0,30% = **126 pips** | 0,38% = **157 pips** |
| Retail/PPI | 0,12% = **50 pips** | 0,18% = **75 pips** |

### Il take profit conviene? No

R medio a trade, ingresso T0 − 30 s, stop 100 pips:

| | C chiusura M1 | TP A | TP B | TP A poi 5 min |
|---|---|---|---|---|
| NFP, direzione giusta, 2019–22 | **+0,37** | +0,29 | +0,31 | +0,27 |
| NFP, direzione giusta, 2023–26 | **+1,10** | +0,63 | +0,73 | +0,55 |
| NFP, con la bias H-X8, 2023–26 | **+0,57** | +0,23 | +0,30 | +0,18 |
| Retail/PPI, direzione giusta, 2019–22 | **+0,15** | +0,10 | +0,12 | +0,11 |
| Retail/PPI, direzione giusta, 2023–26 | **+0,32** | +0,28 | +0,31 | +0,27 |

- **Per la regola scritta prima nessun take profit conviene.** Il TP fa
  perdere i colpi grandi, che valgono più delle wick che tornano indietro.
  - 2026: NFP chiusura mediana 365 pips, arrivo 416.
- **Esplorativo, non pre-registrato**: livelli più alti (67°, 80° e 90°
  percentile dell'arrivo).
  - NFP: +0,84, +0,93, +0,93 R, sempre sotto la chiusura (+1,10).
  - Retail/PPI: +0,33, +0,34, +0,32 contro +0,32. Uguale.
- **Per anno**, mediana dell'arrivo dentro il minuto quando la direzione è
  giusta (pips, % del prezzo):
  - NFP: 2019 49 (0,37%), 2021 85, 2023 83, 2024 114 (0,56%), 2025 102
    (0,33%), 2026 416 (0,97%);
  - Retail/PPI: 2019 23, 2022 25, 2023 47, 2024 53, 2025 40, 2026 96
    (0,19%).
