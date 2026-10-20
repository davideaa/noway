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
