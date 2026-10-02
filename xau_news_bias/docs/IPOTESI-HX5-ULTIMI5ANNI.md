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

## Risultati (eseguito dopo i commit della pre-registrazione e del codice)

File: `research_output/phase2/hx5/hx5_results.json`.

- 116 news: 71 di studio, 45 di test.
- Ricerca: circa 1,8 milioni di ipotesi per uscita, 1.000 permutazioni
  ciascuna.

### Senza regole

Precisione di pareggio, "tirando a caso" e "sempre LONG" in R a news.

| Uscita | Studio: serve | Studio: a caso | Test: serve | Test: a caso | Test: sempre LONG |
|---|---|---|---|---|---|
| E1 fine 1° minuto | 54% | −0,07 | 48% | +0,03 | +0,28 |
| E2 5 minuti | 55% | −0,09 | 47% | +0,06 | +0,40 |
| E3 15 minuti | 52% | −0,04 | 48% | +0,03 | +0,39 |
| E4 take profit 2R | 55% | −0,08 | 62% | −0,18 | +0,09 |
| E5 take profit 3R | 54% | −0,07 | 54% | −0,07 | +0,28 |

- Nello studio "sempre LONG" fa da −0,12 a −0,08 R: il guadagno del test
  viene dal rialzo dell'oro 2024–26, non dalla news.
- **Soldi nel test** (saldo ÷ 24, da 10.000):
  - sempre LONG: da 11.319 (E4) a 18.728 (E2);
  - tirando a caso: da 6.995 a 10.913;
  - sempre SHORT: da 4.035 a 6.143.

### Regole

- Nello studio **tutte le 15 candidate hanno vinto 12 trade su 12**, ma
  nessuna batte il caso: p familywise fra 0,15 e 0,97.
- Nel test **13 su 15 perdono**, da −0,24 a −1,00 R:
  - una è in pari (E4-R2, +0,01 R);
  - una è positiva (E3-R3, LONG, +0,76 R su 8 trade, p 0,23).
  - Holm: tutte 1,00.
- Soldi nel test: da 6.941 a 12.323.

### Conclusione

- Con 71 news di studio ogni ricerca trova combinazioni perfette per caso.
  I due anni dopo lo confermano: 13 regole su 15 perdono.
- Negli ultimi due anni l'unica cosa che ha reso è stata stare LONG, cioè
  seguire il rialzo dell'oro. Un'uscita a 5–15 minuti ha reso più
  dell'uscita al primo minuto; i take profit a 2R e 3R hanno reso meno.
- Classe: **NO EVIDENCE** per le regole. La precisione di pareggio del
  2024–26 (47–48%) conferma che il setup di Davide chiede poco, ma resta da
  trovare chi indovina la direzione.
