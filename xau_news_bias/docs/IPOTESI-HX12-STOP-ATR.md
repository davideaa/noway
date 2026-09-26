# H-X12 — NFP: stop adattato all'ATR invece di 60/100 pips (pre-registrata, esplorativa, solo interna)

Scritta il 26/09/2026 **prima** di calcolare. Richiesta di Davide: forse lo
stop di 60/100 pips è troppo grande o troppo piccolo. Vuole provare a
misurarlo con l'ATR 14, ma non sa su che timeframe. Prova solo interna: il
sito non cambia.

## Fisso

- NFP 2014–2026, regola H-X8 (contrario della precedente), 148 trade.
- Ingresso T0 − 60 s, uscita a fine M1, perdita tagliata a −1R.
- Costi S1 (spread max 40 pips, costi pieni), come il verdetto di H-X11.
  Accanto, R a trade in S3 (spread solo sullo stop).

## Stop provati, tutti riportati

- **Fissi tutti gli anni**: 40, 60, 80, 100, 150 pips. Più il
  riferimento attuale, 60 fino al 2023 e 100 dal 2024.
- **ATR 14** (media semplice del true range, come l'ATR di MT5), calcolato
  solo su candele chiuse prima dell'ingresso, su 5 timeframe:

| Timeframe | Moltiplicatori k (stop = k × ATR) |
|---|---|
| M1 | 4, 6, 8, 10, 12, 15 |
| M5 | 2, 3, 4, 5, 6, 8 |
| M15 | 1, 1,5, 2, 2,5, 3, 4 |
| H1 | 0,5, 0,75, 1, 1,25, 1,5, 2 |
| D1 (giorni chiusi alle 22:00 UTC) | 0,1, 0,15, 0,2, 0,25, 0,3, 0,4 |

Per ognuno: stop mediano in pips (2014–19 e 2024–26), quota di stop presi,
R a trade in IS 2014–19, OOS 2020–26, ultimi 3 anni e tutto, vantaggio sul
caso.

## Come si giudica, fissato adesso

- Sono 36 configurazioni sugli stessi dati: la migliore sarà gonfiata dal
  caso.
- Uno stop ATR è "meglio" del riferimento solo se ha l'R a trade più alto
  **sia** nell'IS **sia** nell'OOS **e** anche i due moltiplicatori vicini
  sullo stesso timeframe battono il riferimento in entrambi i periodi
  (altopiano, non picco).
- Se il migliore è sul bordo della griglia, la griglia si estende e si
  riporta.
- Nessuno stop nuovo diventa ufficiale su questi dati. Al massimo si
  registra dal vivo in parallelo, con lo stop scritto prima della news.
- Solo per informazione: quale timeframe dà un ATR 14 di circa 2,47 alla
  NFP del 04/02/2022, il valore che Davide vede sul suo grafico.
