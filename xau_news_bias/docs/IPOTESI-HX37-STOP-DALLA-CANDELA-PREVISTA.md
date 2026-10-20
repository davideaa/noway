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
