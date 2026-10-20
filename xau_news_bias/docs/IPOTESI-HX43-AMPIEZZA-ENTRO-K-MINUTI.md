# H-X43 — La linea verde: ampiezza dell'esplosione entro k minuti, superata 1 volta su 4 (pre-registrata)

Scritta il 20/10/2026 **prima** di calcolare.

## Cosa chiede Davide

> «Era la massima ampiezza, anche con la wick, nell'esplosione di
> volatilità.»

> «Anche se succede poco, è comunque un caso che può succedere.»

- La verde non è quanto va il prezzo da una parte sola (H-X41, H-X42).
- È l'**ampiezza** dei primi minuti dopo la news: massimo meno minimo,
  wick comprese, su 2, 3, 4 o 5 minuti.
- Ed è un livello **raro ma possibile**: l'ampiezza vera lo supera circa
  **1 volta su 4**.
- L'arancione è la stessa misura sul primo minuto solo, con la mediana e
  la zona fra 1 su 4 e 3 su 4. Quindi la verde sta sopra la zona.
- **Solo dati di prima**, per ogni NFP, come già tutte le linee:
  - la candela delle NFP precedenti;
  - i rapporti delle 24 NFP prima;
  - l'ADR21 dei giorni prima.
- Poi si controlla quanto la previsione è affidabile contro il vero.

## Misura

- Per ogni NFP, **ampiezza entro k minuti**: massimo meno minimo del prezzo
  medio fra T0 e T0 + k minuti.
- Come r1 del dataset: si include il prezzo subito prima della news, ed è
  in % del prezzo.
- Con k = 1 è r1, l'arancione.

## Stima prima della news

- Metodi di H-X42: EW3, ADR24, FORM e RIDGE, cioè le stime della candela
  di H-X32.
- **Verde** = stima della candela × **75° percentile** del rapporto
  ampiezza ÷ stima della candela sulle 24 NFP precedenti.
- Si riporta anche la mediana (50°), solo come informazione.

Controllo: con k = 1, EW3 e la mediana si ritrova la linea arancione del
sito.

## Quale finestra e quale metodo

Si provano k = 2, 3, 4 e 5.

**Calibrata** se l'ampiezza vera supera la verde fra il 15% e il 35% delle
volte, sia nel 2019–22 sia nel 2023–26. Si usano le NFP dove tutte le
coppie hanno la stima.

**Vince**, fra le calibrate, la perdita a quantile 0,75 più bassa nel
2023–26:
- media di max(0,75 × e, −0,25 × e);
- e = log(ampiezza vera) − log(verde).

**A parità** (entro 0,01) vince la finestra più corta, poi il metodo
nell'ordine.

Se vince k = 5 si aggiungono 10 e 15 minuti e si dice.

## Cosa si riporta

- Calibrazione e perdita di ogni coppia.
- Quante volte la verde sta sopra il bordo alto della zona arancione.
- Anno per anno, quante volte l'ampiezza vera supera la verde.
- La verde della prossima NFP.

## Decisione

- La coppia vincente diventa la linea verde del sito, al posto di quella
  di H-X42:
  - nel replay, NFP per NFP, disegnata come l'arancione;
  - in alto, per la prossima NFP;
  - etichetta "ampiezza k min, 1 su 4".
- Se nessuna coppia è calibrata, si dice e resta quella di H-X42.
- È un riferimento per Davide, non un take profit.

## Risultati (dopo il commit `6b3733d`)

File: `research_output/phase2/hx16/hx43_ampiezza_k.json`.
- Controlli:
  - con k = 1, EW3 e la mediana si ritrova l'arancione in 148 NFP su 148;
  - l'ampiezza a 1 minuto dai tick coincide con r1 del dataset;
  - NFP in comune per la gara: 101, 2018–2026.

Perdita a quantile 0,75 nel 2023–26 (più bassa = meglio). Fra parentesi
quante volte l'ampiezza vera supera la verde, 2019–22 / 2023–26; ✗ = non
calibrata.

| Finestra | EW3 | ADR24 | FORM | RIDGE |
|---|---|---|---|---|
| **2 min** | 0,154 (34% / 26%) | 0,167 ✗ (38% / 17%) | 0,152 (28% / 31%) | **0,139 (34% / 29%)** |
| 3 min | 0,149 (34% / 31%) | 0,166 ✗ | 0,151 (30% / 31%) | 0,142 ✗ (36% / 26%) |
| 4 min | 0,145 (34% / 31%) | 0,159 ✗ | 0,145 (30% / 33%) | 0,141 ✗ (36% / 26%) |
| 5 min | 0,153 (34% / 29%) | 0,165 (34% / 21%) | 0,152 (30% / 33%) | 0,148 (34% / 26%) |

**Vince "2 minuti, RIDGE"**, cioè la stima della candela con tutte le
variabili di H-X32. Non sta sul bordo: la griglia non si estende.
- Sul totale, l'ampiezza vera dei primi 2 minuti supera la verde **31
  volte su 100** (NFP 2018–2026).
- La verde sta sopra il bordo alto della zona arancione nel **70%** delle
  NFP. Con EW3 ci sta nel 98%.

**Anno per anno**, quante volte l'ampiezza vera dei primi 2 minuti supera
la verde:

| 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|
| 25% | 67% | 8% | 27% | 33% | 18% | 17% | 27% | 63% |

Nel 2026 le esplosioni hanno superato la verde 5 volte su 8: è l'anno in
cui la volatilità è esplosa più del solito.

**RIDGE non si calcola prima della news coi dati di oggi**, come scritto
in H-X42. Quindi:
- **replay**: RIDGE dove c'è (101 NFP dal 2018); dove manca (2014–17 e
  NFP fuori dal dataset come il 02/10/2026) EW3 a 2 minuti, che è
  calibrata (47 NFP);
- **prossima NFP**: EW3 a 2 minuti, ~**580 pips**; l'arancione è 360, zona
  270–540.

**Decisione.**
- La linea verde del sito diventa l'ampiezza dei primi 2 minuti superata 1
  volta su 4:
  - nel replay, NFP per NFP;
  - in alto, per la prossima NFP.
- È un riferimento, non un take profit.
