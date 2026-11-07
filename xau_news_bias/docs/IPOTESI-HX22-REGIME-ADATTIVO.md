# H-X22 — Finestra fissa o stima che si adatta al regime? (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare.

## Idea di Davide

Non calcolare "anno per anno" ma accorgersi quando la volatilità cambia
regime e adattarsi.

Metodi dei professionisti:
- media esponenziale (EWMA, RiskMetrics 1996);
- rilevamento dei cambi di regime;
- GARCH/HAR (l'HAR è già in H-X21).

## Cosa si confronta

Tutto passo per passo, solo con dati di prima, in % del prezzo.

**A. Range giornaliero dell'oro** (come H-X21):
- riferimento D21;
- EWMA dei range con emivita 5, 10, 20 e 40 giorni;
- **REG**: media dal giorno dell'ultimo cambio di regime, con un minimo di
  10 giorni. Cambio di regime = la media degli ultimi 10 giorni si
  discosta di oltre il 40% (in log, ±0,34) dalla media dal cambio
  precedente.
- Previsione = k × previsore, con k mediano sui 250 giorni prima (come
  H-X21).

**B. Arrivo della news** (H-X19, NFP e Retail/PPI separati):
- riferimento N24 (NFP) e N12 (Retail/PPI);
- EWMA delle release con emivita 3, 6, 12 e 24 release;
- **REG** come sopra, sulle release: finestra di 4 release, soglia ±0,34,
  minimo 6.

## Misure

- Errore mediano |log(vero ÷ previsto)| nel 2019–22 e nel 2023–26.
- Copertura 10–90% (A) e 25–75% (B) dei rapporti passati.

## Decisione

- Un metodo adattivo **sostituisce** il riferimento solo se ha l'errore
  più basso di almeno 0,02 in **tutti e due** i periodi.
- Altrimenti resta il riferimento: la finestra fissa basta.
- In ogni caso sui siti va il **grafico del regime**: ogni giorno (o
  release) un punto, con la stima scelta e la sua fascia nel tempo.

## Risultati (dopo i commit `f6dc4fc` e dello script)

File: `research_output/phase2/hx16/hx22_regime.json`. Codice:
`scripts/hx22_regime.py`.

Errore mediano (2019–22 / 2023–26):

| Metodo | Range giornaliero | NFP arrivo | Retail/PPI arrivo |
|---|---|---|---|
| Riferimento (D21 / N24 / N12) | 0,294 / 0,266 | 0,377 / 0,454 | 0,596 / 0,385 |
| EWMA emivita breve (5 g / 3 rel.) | 0,277 / 0,276 | 0,404 / 0,385 | 0,538 / 0,302 |
| EWMA 10 g / 6 rel. | 0,284 / 0,271 | 0,396 / 0,462 | 0,541 / 0,380 |
| EWMA 20 g / 12 rel. | 0,282 / 0,266 | 0,405 / 0,389 | 0,520 / 0,394 |
| EWMA lunga (40 g / 24 rel.) | 0,283 / 0,277 | 0,386 / 0,404 | 0,497 / 0,383 |
| **REG** (taglio al cambio di regime) | 0,290 / 0,266 | 0,461 / 0,341 | **0,519 / 0,291** |

- **Range giornaliero**: resta **D21**. Nessun metodo adattivo è meglio di
  0,02 in tutti e due i periodi. La copertura 10–90% di D21 nel 2023–26 è
  79%.
- **NFP**: resta **N24**. REG vince nel 2023–26 ma perde nel 2019–22, quindi
  non è stabile.
- **Retail/PPI**: **REG sostituisce N12**, meglio di 0,08 e 0,09.
  Copertura 25–75% nel 2023–26: 51%. Anche EWMA3 batte N12, ma REG ha
  l'errore totale più basso.
- Sui siti: grafico del regime (ogni giorno o release un punto, con la
  stima scelta e la fascia nel tempo).
