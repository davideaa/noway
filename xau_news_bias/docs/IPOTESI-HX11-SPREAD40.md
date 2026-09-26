# H-X11 — dove c'è edge: NFP, CPI o entrambi, con lo spread del broker (pre-registrata, esplorativa)

Scritta il 26/09/2026 **prima** di calcolare. Richiesta di Davide:
- col suo broker lo spread alla news arriva a circa 40 pips e si richiude
  subito, quindi con stop 60–100 pips non dovrebbe prenderlo;
- dire se c'è edge su NFP, su CPI o su entrambi, di quanto in win rate e
  in R atteso, con tutti i trade;
- la bias delle prossime news online, sempre aggiornata.

## Il trade (invariato)

Ingresso T0 − 60 s. Stop 60 pips prima del 2024, 100 dopo. Uscita a fine
M1. Perdita tagliata a −1R.

## Tre scenari di spread, tutti riportati

Prezzi del broker simulati attorno al mid Dukascopy:
bid = mid − s/2, ask = mid + s/2.

| Scenario | s | Costi |
|---|---|---|
| S0 senza spread | 0 | nessuno |
| **S1 spread max 40 pips** (quello che dice Davide) | min(spread Dukascopy, 40 pips) | base: ingresso +½ s, stop +1 s, uscita +½ s, +0,5 bp |
| S2 spread vero Dukascopy (fino a 150 pips) | spread Dukascopy | base |

Il LONG si stoppa sul bid, lo SHORT sull'ask. **S1 è lo scenario
principale**, perché è il broker di Davide. S1 è una sua dichiarazione,
non un dato misurato: dal vivo si registrano tutti e tre.

## Bias, gruppi, periodi

- Bias: regola "contrario della release precedente" (stessa famiglia) e
  calcolatore (H-X7). Confronti: a caso (media LONG/SHORT) e sempre LONG.
- Gruppi: NFP, CPI, entrambi (CPI + NFP con la stessa regola).
- Periodi: IS 2014–19, OOS 2020–26, ultimi 3 anni, tutto.

## Misure

- Win rate: direzione della M1 indovinata, e trade chiusi in guadagno.
- R atteso a trade.
- **Vantaggio** = R atteso della bias − R atteso a caso; t della
  differenza appaiata bias − opposta.
- Soldi: da 10.000, saldo ÷ 24.

## Verdetto, fissato adesso

- "Edge da confermare dal vivo" dove il vantaggio in S1 è positivo **sia**
  nell'IS **sia** nell'OOS. Altrimenti "nessun edge".
- I dati sono già stati visti: nessun gruppo può essere più di "da
  confermare dal vivo".

## Live

- Da ora la bias di ogni NFP e di ogni CPI si scrive **prima** della
  release in `live/hx8_live.jsonl`: append-only, catena di hash. Dopo la
  release si aggiunge il risultato nei tre scenari.
- Il criterio di H-X8 non cambia: NFP, 24 release, almeno 15 indovinate e
  somma R positiva.
