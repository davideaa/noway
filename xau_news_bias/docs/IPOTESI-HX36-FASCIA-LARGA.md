# H-X36 — Una seconda fascia, "8 volte su 10", per la candela (pre-registrata)

Scritta il 19/10/2026 **prima** di calcolare.

## Richiesta di Davide

Far capire quante volte la stima ci prende. La fascia "metà delle volte"
(25–75) per costruzione lascia fuori metà delle candele, un quarto sopra
e un quarto sotto. Non sono anomalie. Serve una seconda fascia, più larga,
per dire dove cade quasi sempre.

## Metodo

È lo stesso di H-X32 (EW3), già scelto, senza niente di nuovo da
stimare:
- rapporti vero ÷ stima sulle 24 release precedenti;
- fascia stretta = stima × 25° e 75° percentile dei rapporti;
- **fascia larga = stima × 10° e 90° percentile** dei rapporti.

Si calcola per la NFP (come H-X32) e per le 12 famiglie senza NFP (B0 di
H-X33), ognuna con la sua serie.

## Misure (2019–22 e 2023–26)

- Copertura della fascia larga: obiettivo 80%.
- Quante sopra e quante sotto.

## Decisione

La fascia larga è **calibrata** se la copertura sta fra 70% e 90% in
tutti e due i periodi:
- sulla NFP;
- sulle 12 famiglie senza NFP.

Se è calibrata, va sul sito accanto a quella stretta. Ogni release è
colorata in tre modi: dentro la stretta, dentro solo la larga, fuori.
Se non è calibrata, sul sito resta solo la stretta, con quante sopra e
quante sotto.

## Risultati (dopo il commit `8c5f5ac`)

File: `research_output/phase2/hx16/hx36_fascia_larga.json`.

| | Fascia larga 2019–22 | 2023–26 | (stretta, per confronto) |
|---|---|---|---|
| NFP | **60%** (11 sopra, 8 sotto, su 47) | 71% (7 sopra, 5 sotto, su 42) | 43% / 43% |
| 12 famiglie senza NFP | 71% (68 sopra, 34 sotto, su 349) | 72% (61 sopra, 79 sotto, su 499) | 43% / 44% |

**Verdetto: non calibrata.** Sulla NFP del 2019–22 la fascia 10–90 ci
prende il 60%, sotto il 70% minimo.

- Tutte e due le fasce prendono meno di quanto dovrebbero: la stretta 43%
  invece di 50%, la larga 60–72% invece di 80%.
- Le 24 release precedenti fanno sembrare la candela più regolare di
  quello che è. Le candele estreme arrivano più spesso.
- Sul sito resta solo la fascia stretta, con quante dentro, sopra e
  sotto.
