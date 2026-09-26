# H-X7 — solo la direzione della prima candela, su tutte le news (pre-registrata)

Scritta il 26/09/2026 **prima** di calcolare. Richiesta di Davide:
- una bias su **ogni** NFP e ogni CPI, senza NO TRADE;
- misurare solo quante volte si indovina la direzione della prima
  candela;
- stop e target si guardano dopo, se c'è un vantaggio.

## Cosa si prevede

- **Direzione della prima M1 dopo la release**: su se l'ultimo tick prima
  di T0 + 60 s è sopra l'ultimo tick prima di T0, giù altrimenti. Le
  release con movimento nullo sono escluse.
- Dati disponibili a **T0 − 1 min**: il cutoff T−1M, le 496 feature della
  fase 2.

## Come

- **Gruppi**: CPI+NFP insieme (principale), NFP da solo, CPI da solo.
- **Modelli**:
  - logistica (L2, C = 0,1);
  - LightGBM piccolo;
  - k-NN (PCA 8, k = 15).
- **Insiemi di feature**: i 10 della fase 2.
- **Walk-forward annuale** per ogni anno dal 2014 al 2026: il modello di
  un anno si addestra solo sulle release degli anni prima (dal 2008). È
  quello che farebbe un calcolatore dal vivo.
- **Scelta** della configurazione per gruppo: accuratezza più alta sul
  **2014–19**. Il 2020–26 non si usa per scegliere.
- **Confronti** sempre riportati:
  - "sempre la direzione più frequente nel passato";
  - "segui l'ultima ora";
  - "inverti l'ultima ora";
  - "segui la reazione della release precedente".

## Test

- Accuratezza sul 2020–26 della configurazione scelta, per gruppo.
- Binomiale unilaterale contro il 50% e contro la baseline "direzione più
  frequente".
- Holm su 3 (i tre gruppi).
- Il 2020–26 è già stato esposto: al massimo **PROMISING + LIVE
  CONFIRMATION REQUIRED**.

## Dopo

- Solo come informazione, il risultato in R col trade di Davide (60/100
  pips, ingresso T − 60 s, uscita a fine M1) seguendo la bias su tutte le
  news.
- Sito: per ogni news, candele con wick dai tick bid/ask, ingresso, stop e
  chiusura con i prezzi scritti.
