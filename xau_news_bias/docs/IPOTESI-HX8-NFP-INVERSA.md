# H-X8 — NFP: fai il contrario della reazione dell'NFP precedente (pre-registrata per il LIVE)

Scritta il 26/09/2026. Nata **dopo** aver visto i dati (H-X7). Quindi la
storia non la può confermare: la conferma viene solo dalle NFP future.

## Regola, congelata

Prima di ogni NFP, bias = **direzione opposta** a quella della prima M1
dell'NFP precedente:
- l'NFP precedente è salito (ultimo tick prima di T0+60 s sopra l'ultimo
  prima di T0) → **SHORT**;
- è sceso → **LONG**;
- movimento nullo → nessuna bias.

Si dà la bias su **tutte** le NFP, senza filtri.

## Come si giudica dal vivo

- Si registra ogni NFP da ottobre 2026: bias, direzione vera, risultato
  col trade di Davide (T − 60 s, stop 100 pips, perdita tagliata a −1R,
  uscita a fine M1).
- **Dopo 24 NFP** (due anni), la regola è confermata se:
  - indovina almeno **15 su 24** (62,5%; p ≈ 0,15 da sola, ma è un test
    solo e con ipotesi fissata prima);
  - **e** l'R medio col trade di Davide è positivo.
- **Stop anticipato**: se dopo 12 NFP ne ha indovinate 4 o meno, si
  ferma.

## Aggiunta del 26/09/2026, scritta prima di calcolare: il sito solo NFP

Descrittivo, non cambia niente del giudizio dal vivo.
- Per ogni NFP dal 2014: prezzi veri alle 14:29, 14:30 e 14:31 (ora
  italiana), trade con lo spread vero, massimo a favore e contro fino
  all'uscita.
- **Solo per confronto**: lo stesso trade se lo spread restasse quello
  delle 14:29 per tutto il minuto. È **ottimistico** (alla news lo spread si
  allarga sempre) e **non** sostituisce il risultato con lo spread vero, che
  resta l'unico che conta per il criterio sopra.
- "Ultimi 3 anni" = NFP dal 2023-10-01 al 2026-09-30.

### Risultati del sito (dopo l'aggiunta sopra)

File: `research_output/phase2/hx8/nfp_summary.json`. Codice:
`scripts/hx8_nfp_site.py`. Sito: `docs/replay.html` (la versione con CPI
e NFP resta in `docs/replay_cpi_nfp.html`).

| Periodo | NFP | Indovinate | Somma R | In guadagno | Stop presi | Da 10.000 | Somma R, spread fermo |
|---|---|---|---|---|---|---|---|
| IS 2014–19 | 71 | 44 (62%) | +2,1 | 37 | 21 | 10.365 | +2,4 |
| OOS 2020–26 | 77 | 46 (60%) | +16,8 | 42 | 23 | 18.028 | +17,3 |
| Ultimi 3 anni (2023-10 → 2026-09) | 34 | 21 (62%) | **+17,7** | 19 | 9 | 19.191 | +18,1 |
| Tutto 2014–26 | 148 | 90 (61%) | +18,9 | 79 | 44 | 18.685 | +19,7 |

- Ultimi 3 anni: 34 NFP e non 36. A ottobre 2025 la NFP non è uscita
  (shutdown). Il 3 aprile 2026 era Venerdì Santo: mercato dell'oro chiuso,
  nessun tick.
- Lo spread della news quasi non cambia il risultato delle NFP: gli stop
  presi sono gli stessi con lo spread vero e con lo spread fermo.
- Quasi tutto l'utile viene dagli ultimi 3 anni, quando l'oro si muove di
  più: nell'IS la regola indovina il 62% ma fa solo +2,1 R in 71 trade.
