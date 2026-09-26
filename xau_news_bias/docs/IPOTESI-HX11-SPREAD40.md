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

## Risultati (dopo il commit della pre-registrazione)

File: `research_output/phase2/hx11/summary.json` e `site.json`. Codice:
`scripts/hx11_site.py`. Controllo: lo scenario S2 rifà al millesimo i trade
del sito NFP precedente.

Scenario S1 (spread max 40 pips), 2014–2026:

| Gruppo, bias | News | Direzione | Trade in guadagno | R atteso a trade | A caso | Vantaggio (IS / OOS) | Verdetto |
|---|---|---|---|---|---|---|---|
| **NFP, contrario della precedente** | 148 | **61%** | 53% | **+0,13** | −0,07 | **+0,20** (+0,14 / +0,26) | **edge, da confermare dal vivo** |
| CPI, contrario del precedente | 150 | 49% | 34% | −0,21 | −0,10 | −0,11 (+0,01 / −0,22) | nessun edge |
| Entrambi, contrario della precedente | 298 | 55% | 44% | −0,04 | −0,09 | +0,04 (+0,07 / +0,02) | meglio del caso, ma perde |
| NFP, calcolatore | 148 | 51% | 48% | +0,00 | −0,07 | +0,07 (+0,10 / +0,04) | meglio del caso, ma non guadagna |
| CPI, calcolatore | 150 | 50% | 39% | −0,08 | −0,10 | +0,03 (+0,03 / +0,02) | meglio del caso, ma perde |
| Entrambi, calcolatore | 298 | 51% | 43% | −0,04 | −0,09 | +0,05 (+0,07 / +0,03) | meglio del caso, ma perde |

- **Il criterio scritto prima**, letto alla lettera (vantaggio positivo
  nell'IS e nell'OOS), lo passano tutti tranne la regola CPI. Ma solo la
  regola NFP ha anche l'R atteso positivo: le altre battono il caso di
  0,03–0,07 R a trade e perdono comunque soldi. Il sito lo scrive così.
- NFP, ultimi 3 anni: 21/34 indovinate (62%), +0,52 R a trade, somma
  +17,7 R, 10.000 → 19.191.
- **Sulle NFP S1 e S2 danno lo stesso risultato**: gli stop li prende il
  prezzo, non lo spread. Sui CPI la differenza è di 0,01 R a trade.
- Senza spread (S0) la regola NFP fa +0,26 R a trade, ma anche il caso
  diventa positivo (+0,07): il vantaggio resta +0,19.

## Live

- Registro: `live/hx8_live.jsonl`, creato il 26/09/2026. Prime bias:
  NFP 02/10/2026 LONG, CPI 14/10/2026 LONG (CPI solo informativo).
- Aggiornamento dopo ogni release: `live/README.md`.

## Emendamento 1 — scritto il 26/09/2026 prima di calcolare S3

Davide chiarisce: i 40 pips contano solo perché lo spread si apre pochi
secondi prima della news e può toccare lo stop. Non vanno pagati alla
chiusura.

Nota: S1 non addebitava 40 pips alla chiusura. All'uscita pagava mezzo
spread del momento, che a fine minuto è in mediana 4 pips (90° percentile
9–10 pips).

Si aggiunge **S3, spread solo sullo stop**:
- stop controllato su bid e ask con spread max 40 pips, come in S1;
- ingresso e uscita al prezzo medio, senza spread né costi;
- stop preso = −1R.

Il verdetto resta su S1, come scritto prima. S3 si riporta accanto, perché
è il modo in cui Davide descrive il suo broker.
