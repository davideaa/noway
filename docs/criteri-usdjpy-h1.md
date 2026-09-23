# USDJPY H1 (Algory) — i criteri, scritti prima di vedere i dati

Scritto il 2026-09-23, **prima** di ricevere i report. Non si cambia dopo.
Vale `docs/metodo.md`; qui ci sono solo i numeri di questa strategia.

## Cosa si sa già

Viene da un generatore (Algory): ha scelto questa combinazione fra
moltissime provate. Il numero di prove (K) **non è noto**, quindi il t
dentro campione **non è sgonfiabile** e conta solo come descrizione. La
prova vera è il fuori campione.

**Da chiedere ad Algory:** su quali anni ha generato la strategia. Se ha
usato anche il 2024–2026, il fuori campione non è pulito e va detto.

## 1. Dentro campione (il report che manda Davide, fino al 2023)

| | soglia |
|---|---|
| operazioni | ≥ 100, meglio 200 |
| distribuzione nel tempo | ogni anno pieno ≥ 20 operazioni |
| guadagno medio | ≥ +0,05 R netto |
| tetto a 3 R su ogni vincita | resta in utile |
| filtri su ore o giorni | **nessuno** (regola 5). Se c'è, si segnala e si prova senza |

Se non passa, ci si ferma qui e il fuori campione non si guarda.

## 2. Fuori campione, un colpo solo: 2024.01.01 – 2026.09

| | soglia |
|---|---|
| segno | in utile |
| t | ≥ 1,65 (una coda, 5%: il fuori campione non si sgonfia) |
| guadagno medio | ≥ +0,05 R, e non sotto il 5° percentile di quello che il dentro campione prevedeva per lo stesso numero di operazioni |

## 3. Nel portafoglio (oro 0,65% + nasdaq 0,98%)

| | soglia |
|---|---|
| correlazione mensile in R con oro e con nasdaq | ≤ 0,30 |
| drawdown del conto unico, Monte Carlo a blocchi da 20 | **≤ 35% al 95° percentile**, più basso è meglio |
| rischio della nuova gamba | il più alto che rispetta il tetto; per il rendimento si usa il **numero basso** (dentro campione) |
