# H-X9 — NFP: uscire sulla spinta invece che a fine candela (pre-registrata, esplorativa)

Scritta il 26/09/2026 **prima** di calcolare. Richiesta di Davide: la
spinta della NFP arriva nei primi ~10 secondi, poi la candela torna
indietro con la wick. Lui chiuderebbe vicino al punto più alto, non a fine
M1.

## Cosa resta fisso

- Bias: regola H-X8 (contrario della reazione della NFP precedente).
- NFP 2014–2026, le stesse 148 del sito.
- Ingresso T0 − 60 s. Stop 60 pips prima del 2024, 100 dopo. Perdita
  tagliata a −1R. Costi base.
- La direzione "indovinata" resta quella della chiusura M1.

## Uscite, tutte riportate, nessuna scelta

| Codice | Uscita |
|---|---|
| X0 | fine della prima M1 (quella di oggi) |
| X1–X5 | a tempo: T0 + 5, 10, 15, 20, 30 s |
| X6–X8 | take profit 1R, 2R, 3R; se non arriva, fine M1 |
| X9 | **tetto teorico**: il punto migliore della wick prima dello stop |

- Take profit e uscite a tempo: sul lato opposto (bid per il LONG, ask per
  lo SHORT), mezzo spread di slittamento più 0,5 bp. Lo stop si controlla
  prima, tick per tick.
- **X9 non si può fare dal vivo**: nessuno sa in tempo reale qual è il
  punto più alto. Serve solo come limite massimo.

## Confronti, per capire da dove viene il guadagno

Per ogni uscita, oltre alla bias H-X8:
- la bias **opposta**;
- **a caso**, cioè la media di LONG e SHORT.

Se un'uscita rende anche con la bias opposta o a caso, il guadagno viene
dall'uscita e non dalla bias.

## Periodi

IS 2014–19, OOS 2020–26, ultimi 3 anni (2023-10 → 2026-09). Per ognuno:
somma R, R medio, trade in guadagno.

## Regola di decisione, fissata adesso

- I dati sono già stati visti: nessuna uscita diventa ufficiale su questi
  numeri. Il criterio live di H-X8 resta su X0.
- Se Davide vuole un'altra uscita, la si registra **dal vivo in
  parallelo** a X0 dalla prossima NFP, con lo stesso criterio (dopo 24
  NFP: almeno 15 indovinate e somma R positiva).

## Risultati (dopo il commit della pre-registrazione)

File: `research_output/phase2/hx8/hx9_exits.json`. Codice:
`scripts/hx9_exits.py`. Controllo: X0 coincide al millesimo con il trade del
sito.

Somma R, ultimi 3 anni (34 NFP) e tutto 2014–26 (148):

| Uscita | Bias H-X8, 3 anni | Bias H-X8, tutto | Bias opposta, tutto | A caso, tutto |
|---|---|---|---|---|
| **X0 fine M1** | **+17,7** | **+18,9** | −39,6 | −10,3 |
| X1 5 s | −1,6 | −9,5 | −37,7 | −23,6 |
| X2 10 s | +8,0 | +5,8 | −38,3 | −16,2 |
| X3 15 s | +13,7 | +10,6 | −36,4 | −12,9 |
| X4 20 s | +13,3 | +10,3 | −36,3 | −13,0 |
| X5 30 s | +12,2 | +10,5 | −36,5 | −13,0 |
| X6 TP 1R | +10,3 | +11,2 | −42,4 | −15,6 |
| X7 TP 2R | +10,2 | +13,2 | −41,1 | −13,9 |
| X8 TP 3R | +12,5 | +13,6 | −40,6 | −13,5 |
| X9 tetto teorico | +38,7 | +104,9 | **+61,9** | **+83,4** |

- **Nessuna uscita reale batte la fine della M1.** Uscire nei primi 5–10
  secondi rende meno: in quel momento lo spread è di 100 pips o più, e
  uscire costa mezzo spread.
- **Il tetto teorico non è una misura onesta**: con l'uscita sul punto
  migliore della wick guadagna anche la bias **opposta** (+61,9 R) e anche
  tirare a caso (+83,4 R). Misura solo quanto si muove l'oro, non se la
  bias è giusta.
- Per la regola scritta prima: il criterio live resta su X0.
