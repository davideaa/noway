# H-X5 — solo gli ultimi 5 anni, 3 di studio e 2 di test (pre-registrata)

Scritta il 26/09/2026 **prima** di calcolare qualunque cosa con questa
divisione e con queste uscite. Richiesta di Davide: lavorare sugli ultimi
5 anni, perché prima l'oro valeva un terzo e 60 pips erano un movimento
grande. I conteggi aggregati di quegli anni sono già stati visti (H-X2,
H-X3, H-X4). Risultato massimo possibile: **PROMISING + LIVE
CONFIRMATION REQUIRED**.

## Periodi

| | Da | A | News (CPI+NFP) |
|---|---|---|---|
| Studio | 2021-10-01 | 2024-09-30 | ~72 |
| Test | 2024-10-01 | 2026-09-30 | ~48 |

## Il trade

- **Ingresso**: ultimo tick ≤ T0 − 60 s; LONG all'ask, SHORT al bid.
- **Stop**: 60 pips prima del 2024-01-01, 100 pips dopo. Perdita tagliata
  a −1R (full margin).
- **Costi**: base.
- **Uscite**, tutte calcolate e riportate, da tick salvati per tutta l'ora
  della news:

| Codice | Uscita |
|---|---|
| **E1 (principale)** | chiusura della prima M1 |
| E2 | T0 + 5 min |
| E3 | T0 + 15 min |
| E4 | take profit 2R o stop; se nessuno dei due, chiusura a T0 + 15 min |
| E5 | take profit 3R o stop; se nessuno dei due, chiusura a T0 + 15 min |

Il take profit e le uscite a tempo si eseguono sul lato opposto (bid per
il LONG, ask per lo SHORT) più mezzo spread di slittamento.

## Ricerca (per ogni uscita, solo sullo studio)

- CPI e NFP insieme.
- Congiunzioni di 1–3 condizioni, LONG e SHORT, T−1H e T−1M, supporto
  minimo 12.
- 1.000 permutazioni stratificate per famiglia e anno, nullo max-t.
- Fino a **3 candidati per uscita**, con la regola di selezione della
  fase 2: R medio positivo anche con costi conservative, positivo nella
  maggior parte degli anni, sovrapposizione < 0,7.

## Test (2024-10 → 2026-09)

- Ogni candidato congelato. t unilaterale sull'R medio.
- **Holm su tutti i candidati di tutte le uscite** (al massimo 15).
- Per ogni uscita si riportano anche, senza regole:
  - precisione di pareggio;
  - EV tirando a caso;
  - quota del lato giusto ≥ 1R, 2R e 3R.

## Soldi

Puntata = saldo ÷ 24, interesse composto, da 10.000, sullo studio e sul
test separatamente.
