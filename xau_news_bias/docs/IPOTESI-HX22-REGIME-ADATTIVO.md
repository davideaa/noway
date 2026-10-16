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
