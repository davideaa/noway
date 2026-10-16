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
