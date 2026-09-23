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

## 3. Nel conto forex (deciso da Davide il 2026-09-23)

Oro e nasdaq restano sul loro conto. Il forex va su un **conto separato**,
solo strategie forex (e più avanti un conto crypto). Quindi:

| | soglia |
|---|---|
| drawdown del conto forex, Monte Carlo a blocchi da 20 | **≤ 35% al 95° percentile**, più basso è meglio |
| correlazione fra le strategie forex dello stesso conto | ≤ 0,30 |
| rischio | il più alto che rispetta il tetto; per il rendimento si usa il **numero basso** |

---

## Esito del punto 1 (2026-09-23, report 2019–2022)

Il report copre il 2019–2022, ma **la prima operazione è il 2021-01-22**,
la stessa data scritta nel nome della strategia
(`USDJPY_H1_54_081869_R102_DD9_TR701_20210122`). Nel 2019 e nel 2020 zero
operazioni.

| | valore | soglia | |
|---|---|---|---|
| operazioni | 262 (138 nel 2021, 124 nel 2022) | ≥ 100 | sì |
| ogni anno pieno ≥ 20 | 2019 e 2020: **0** | ≥ 20 | **no** |
| guadagno medio | +0,120 R (t 2,11) | ≥ +0,05 | sì |
| tetto a 3 R | nessuna vincita supera 1,1 R | in utile | sì |
| filtri su ore o giorni | **solo dalle 15 alle 18**, chiusura il venerdì alle 16 | nessuno | **no** |

**Non passa.** Da notare: long +34,6 R, short −3,2 R. Tutto il guadagno
viene dai long in un biennio in cui USDJPY è salito da 103 a 150.

**Il 2024–2026 probabilmente non è fuori campione.** Nel nome, TR701
sembrano le operazioni del test interno di Algory: a questo ritmo (~131
all'anno) 701 operazioni coprono dal 2021-01 a metà 2026. È una
deduzione, non un fatto, ma se è giusta Algory ha costruito la strategia
anche sul 2024–2026.

**L'unico fuori campione pulito è prima del 2021-01-22.** Test proposto,
coi criteri scritti adesso, prima di vederlo:

- periodo 2019.01.01 – 2021.01.21, stessi parametri, **solo**
  `Use_Spread_Gate=false` (se le zero operazioni vengono dal filtro
  sullo spread dello storico);
- se anche così zero operazioni, la strategia è bloccata sulla data e il
  fuori campione non si può fare: scartata;
- se opera: deve essere in utile, con t ≥ 1,65 e guadagno medio
  ≥ +0,05 R.
