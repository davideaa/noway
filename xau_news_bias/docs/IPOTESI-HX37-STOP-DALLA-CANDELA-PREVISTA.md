# H-X37 — Stop NFP che segue la candela prevista (pre-registrata)

Scritta il 20/10/2026 **prima** di calcolare.

## Idea di Davide

Lo stop fisso di 60 pips non ha senso in tutti gli anni.
- Quando la volatilità era bassa (2019–2020) bastavano 30–40 pips.
- Nel 2026 servivano 70–100 pips e oltre.

Lo stop va calcolato dalla volatilità **prevista** della news, più circa
30 pips di slittamento.

In più, per lui lo stop è il punto in cui il conto si azzera: deposita
solo quello che rischia. La perdita è quindi sempre al massimo −1R.

## Cosa si sa già, da dichiarare

- H-X12 ha provato lo stop = k × ATR 14 di prima della news.
  - Con perdita tagliata a −1R, ATR H1 × 1 e ATR M1 × 4 battevano il
    riferimento 60/100, con l'altopiano.
  - Nessuno stop è diventato ufficiale, per la regola scritta allora.
- Le NFP 2014–2026 sono già state usate per gli stop. Un risultato
  positivo qui vale al massimo **"da registrare dal vivo"**.

## Dati e trade

Come H-X12, con la stessa funzione `trade` e gli stessi prezzi:
- NFP 2014–2026, regola H-X8, ingresso T0 − 60 s, uscita a fine M1;
- costi S1 (spread fino a 40 pips, costi pieni);
- NFP del 2/10/2026 compresa.

**Candela prevista** = stima EW3 di H-X32, fatta prima di ogni NFP, in
pips al prezzo di quel giorno.

## Stop provati

- **Formula**: stop = 30 pips + k × candela prevista, con k = 0,05, 0,10,
  0,15, 0,20, 0,25, 0,30. Se il migliore sta sul bordo, la griglia si
  estende di due passi e si dice.
- **Confronti**:
  - fisso 60 pips;
  - riferimento di Davide 60/100 (60 fino al 2023, 100 dal 2024).

## Misure

R a trade con la perdita tagliata a −1R (il caso di Davide):
- IS 2014–19, OOS 2020–26, ultimi 3 anni e tutto;
- quota di stop presi;
- stop mediano in pips per anno.

Per informazione anche la perdita vera, cioè senza il tetto −1R.

## Decisione

Una formula è **meglio** se:
- ha l'R a trade più alto sia del fisso 60 sia del 60/100, sia nell'IS sia
  nell'OOS;
- i due k vicini fanno lo stesso: altopiano, non picco.

**Se passa:**
- sul sito va lo stop calcolato per la prossima NFP, scritto **"da
  confermare dal vivo"**;
- il replay mostra lo stop della formula NFP per NFP.

**Se non passa,** resta 60, e si dice perché.

## Risultati (dopo il commit `89d8e05`)

File: `research_output/phase2/hx16/hx37_stop_candela.json`.
- 149 NFP, compresa quella del 2/10/2026.
- Il migliore (k = 0,10) non sta sul bordo: la griglia non è stata
  estesa.

R a trade con perdita tagliata a −1R (fra parentesi la perdita vera):

| Stop | IS 2014–19 | OOS 2020–26 | Ultimi 3 anni | Tutto | Stop presi |
|---|---|---|---|---|---|
| Fisso 60 | +0,03 (−0,11) | +0,46 (+0,27) | +1,04 (+0,75) | +0,25 | 33% |
| 60/100 di Davide | +0,03 (−0,11) | +0,26 (+0,13) | +0,59 (+0,45) | +0,15 | 30% |
| 30 + 0,05 × candela | +0,15 (−0,24) | +0,52 (+0,08) | +0,91 (+0,22) | +0,34 | 49% |
| **30 + 0,10 × candela** | **+0,10** (−0,19) | **+0,61** (+0,26) | **+1,18** (+0,66) | **+0,37** | 45% |
| 30 + 0,15 × candela | +0,09 (−0,14) | +0,47 (+0,21) | +0,95 (+0,58) | +0,29 | 42% |
| 30 + 0,20 × candela | +0,05 (−0,15) | +0,38 (+0,17) | +0,81 (+0,50) | +0,23 | 40% |
| 30 + 0,25 × candela | +0,06 (−0,12) | +0,30 (+0,09) | +0,66 (+0,40) | +0,19 | 38% |
| 30 + 0,30 × candela | +0,04 (−0,11) | +0,26 (+0,10) | +0,60 (+0,40) | +0,16 | 36% |

Stop mediano della formula k = 0,10, anno per anno:

| Anno | 2014 | 2015–16 | 2017 | 2018 | 2019 | 2020–22 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|---|---|
| Stop (pips) | 41 | 39 | 36 | 35 | 34 | 37–38 | 40 | 47 | 45 | 56 |

**Verdetto per la regola scritta prima: k = 0,10 passa.** Batte sia il
fisso 60 sia il 60/100 nell'IS e nell'OOS. Lo fanno anche i vicini
(0,05 e 0,15): è un altopiano.

**Da dire senza ammorbidire.**
- **Vale solo col tetto −1R**, cioè quando lo stop è il punto in cui il
  conto si azzera (full margin, deposito = rischio). Con la perdita vera
  la formula fa peggio del fisso 60 in quasi tutti i periodi. Alle NFP il
  prezzo salta gli stop piccoli, come aveva già visto H-X12.
- **In full margin lo stop minimo lo decide la leva**: circa
  10 × prezzo ÷ leva, in pips. A 4.150 $ è circa 83 pips con 1:500 e 42
  con 1:1000. Uno stop della formula più piccolo di questo non si può
  fare col deposito uguale al rischio.
- Lo stop viene preso più spesso: 45% delle NFP contro 33% col 60 fisso.
- Le NFP 2014–26 erano già state usate per gli stop (H-X12). La formula
  vale **da confermare dal vivo**, NFP dopo NFP.
