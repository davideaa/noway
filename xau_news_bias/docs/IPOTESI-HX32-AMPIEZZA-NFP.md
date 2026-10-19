# H-X32 — Stimare prima quanto si muoverà la NFP: quale metodo ci prende davvero (pre-registrata)

Scritta il 19/10/2026 **prima** di calcolare.

## Richiesta di Davide

La stima della candela NFP sul sito (fascia "metà delle volte" dalle
ultime 24 NFP) ci ha preso solo 14 volte su 43 dal 2023. Vuole un metodo
che la calcoli bene, provando tanti modi:
- le candele passate;
- come è cambiata negli anni;
- la formula di H-X29 (prezzo, volatilità, reazione).

## Cosa si sa già, da dichiarare

- H-X22: per l'arrivo NFP nessun metodo adattivo batte le ultime 24 in
  tutti e due i periodi.
- H-X23: il modello lineare è meglio della memoria per la NFP solo nel
  2023–26.
- Le NFP 2019–2026 sono già state viste. Il vincitore vale come metodo
  per il sito e si controlla dal vivo, release dopo release.

## Dati

- `hx23_dataset.parquet`: NFP dal 2011 con r1 (range della prima M1 sul
  prezzo medio, in % del prezzo), ADR21 e le variabili di H-X23.
- La NFP del 2/10/2026 non è nel dataset: è dichiarato.

## Metodi (stima centrale prima di ogni NFP, solo dati di prima)

| Codice | Stima centrale |
|---|---|
| N24 | mediana delle ultime 24 NFP (quello del sito) |
| N12 | mediana delle ultime 12 |
| N6 | mediana delle ultime 6 |
| EW3 | media mobile esponenziale, emivita 3 NFP |
| ADR24 | mediana di (r1 ÷ ADR21) sulle ultime 24 NFP × ADR21 di oggi |
| ADR12 | lo stesso sulle ultime 12 |
| FORM | formula H-X29 senza sorpresa: famiglia + log ADR21 + log memoria 12, rifatta ogni anno |
| RIDGE | modello lineare H-X23 (11 variabili), rifatto ogni anno |

## Fascia

Uguale per tutti, come H-X22:
- rapporto vero ÷ stima sulle 24 NFP precedenti;
- stima finale = stima × mediana dei rapporti;
- fascia = stima × 25° e 75° percentile dei rapporti.

## Misure (2019–22 e 2023–26)

- **Copertura**: quota di NFP dentro la fascia (obiettivo 50%).
- **Errore**: mediana di |log(vera ÷ stima)|.
- Descrittivo: copertura per anno, NFP sopra e sotto la fascia.

## Decisione

- **Calibrato** se la copertura sta fra 40% e 60% in tutti e due i
  periodi.
- Fra i calibrati vince quello con l'errore più basso nel 2023–26. Sotto
  0,02 di differenza vince il più semplice (ordine della tabella).
- Il vincitore va sul sito come stima della candela NFP, con il suo
  grafico anno per anno.
- Se nessuno è calibrato, sul sito resta solo l'ordine di grandezza, e si
  dice.
