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

## Risultati (dopo il commit della pre-registrazione)

File: `research_output/phase2/hx11/hx12_atr_stop.json`. Codice:
`scripts/hx12_atr_stop.py`.

**Errore trovato durante il calcolo.** Al primo passaggio le candele D1
erano a mezzanotte UTC e non alle 22:00: `resample("1D", offset=...)`
ignora l'offset. Corretto con `"24h"` prima di leggere i risultati.

La griglia è stata estesa dove il migliore stava sul bordo:
- M1 × 2 e × 3;
- M5 × 1 e × 1,5;
- D1 × 0,05 e × 0,075;
- fissi 20 e 30 pips.

**Controllo aggiunto e dichiarato (non pre-registrato).** Con stop piccoli,
il tetto −1R del full margin non è garantito. Vale solo se lo stop coincide
col punto in cui il conto si azzera, cioè circa prezzo ÷ leva. Quindi si
riporta anche la **perdita vera**: lo stop saltato conta per intero.

Riepilogo, spread S1, R a trade:

| Stop | Pips 2014–19 / 2024–26 | IS (−1R) | OOS (−1R) | Ultimi 3 anni (−1R) | Tutto (−1R) | Tutto, perdita vera | Peggior trade vero |
|---|---|---|---|---|---|---|---|
| Riferimento 60/100 | 60 / 100 | +0,03 | +0,22 | +0,52 | +0,13 | −0,00 | −2,2R |
| Fisso 40 | 40 / 40 | +0,10 | +0,38 | +0,72 | +0,25 | −0,10 | −4,3R |
| Fisso 60 | 60 / 60 | +0,03 | +0,39 | +0,92 | +0,22 | +0,06 | −2,9R |
| Fisso 80 | 80 / 80 | −0,00 | +0,26 | +0,66 | +0,13 | +0,05 | −2,7R |
| Fisso 100 | 100 / 100 | −0,02 | +0,19 | +0,49 | +0,09 | +0,04 | −2,2R |
| ATR H1 × 0,75 | 15 / 57 | +0,04 | +0,63 | +0,90 | +0,35 | −0,35 | −10,0R |
| **ATR H1 × 1** | 20 / 77 | +0,11 | +0,39 | +0,60 | +0,26 | −0,32 | −7,5R |
| ATR H1 × 1,25 | 26 / 96 | +0,25 | +0,29 | +0,43 | +0,27 | −0,17 | −6,0R |
| **ATR M1 × 4** | 22 / 58 | +0,17 | +0,50 | +0,89 | +0,34 | −0,15 | −7,9R |
| ATR D1 × 0,15 | 21 / 62 | +0,14 | +0,34 | +0,53 | +0,24 | −0,27 | −6,1R |

- **Col criterio scritto prima** (tetto −1R): hanno un altopiano **ATR H1
  × 1** e **ATR M1 × 4**. Battono il riferimento in IS e OOS, e così i
  loro vicini.
- **Con la perdita vera** nessuno stop ATR batte il riferimento. Lo fanno
  solo i fissi 80 e 100 pips. Alle NFP il prezzo salta lo stop: con uno
  stop di 20 pips il salto vale da 5 a 10 R.
- Quindi lo stop piccolo conviene solo se la perdita resta davvero −1R,
  cioè se lo stop coincide con l'azzeramento del conto in full margin. Lì
  lo stop non si sceglie: lo decide la leva (prezzo ÷ leva).
- **ATR di Davide**: alla NFP del 04/02/2022 l'ATR 14 era M1 0,83, M5 1,10,
  M15 1,73, **H1 2,33**, D1 19,2. Il suo 2,47 corrisponde all'H1.
- Per la regola scritta prima nessuno stop nuovo diventa ufficiale. Il
  criterio live resta su 60/100 (100 pips oggi).
