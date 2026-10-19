# H-X34 — La volatilità nel tempo: si prevede il livello, si vedono arrivare le esplosioni? (pre-registrata)

Scritta il 19/10/2026 **prima** di calcolare.

## Idea di Davide

La singola NFP non si prevede con precisione (H-X32, H-X33). Ma **nel
tempo**, guardando la curva della volatilità e le sue esplosioni, forse
sì. La volatilità è un dato pubblico e cambia lentamente.

## Cosa si sa già, da dichiarare

- H-X21 e H-X22: il range del **giorno** si stima con un errore mediano di
  0,27–0,29 (±31–34%). Il metodo migliore è la media degli ultimi 21
  giorni (D21).
- H-X32: la singola NFP ha un errore di 0,29 (±33%). Nel 2025–26 la
  fascia ci prende 4 volte su 19.
- Le candele 2011–2026 sono già state viste per altre domande, non per
  questa. Qui non si sceglie nessun modello nuovo: si misura quanto sono
  precise, sul mese e sulla media di più release, le stime che già
  esistono.

## Dati

- Range giornaliero r (massimo − minimo, in % dell'apertura) dalle
  candele H1 Dukascopy, giornata dalle 22:00 UTC, dal 2011.
- **Volatilità del mese** V = media di r nei giorni del mese. Si riporta
  anche in pips: media di (massimo − minimo) × 10.
- NFP: r1 e stima EW3 di H-X32, fatta prima di ogni release.
- GVZ: volatilità implicita dell'oro a 30 giorni (Cboe, via FRED).

## Misure

**M1 — Il mese dopo.** Alla fine di ogni mese si stima V del mese dopo:
- P1: V di questo mese;
- P2: media esponenziale di r con emivita 21 giorni.

Errore = mediana di |log(vera ÷ stima)| nel 2011–18, 2019–22 e 2023–26.
Lo stesso per la media dei 3 mesi dopo.

**M2 — La NFP nel tempo.**
- Mediana di 6 NFP consecutive vere contro la mediana delle loro stime
  EW3, ognuna fatta prima della sua release.
- Lo stesso anno per anno.
- Errore come sopra, nel 2019–22 e nel 2023–26.

**M3 — Le esplosioni.** Controllo alla fine di ogni mese:
- **Esplosione**: la media di r nei 21 giorni dopo è almeno 1,5 volte la
  media dei 126 giorni prima.
- **Segnale W1**: la media degli ultimi 21 giorni è almeno 1,2 volte la
  media dei 126 giorni prima di quei 21. Vuol dire che la volatilità sta
  già salendo.
- **Segnale W2**: GVZ dell'ultimo giorno almeno 1,2 volte la sua mediana
  dei 252 giorni prima. Vuol dire che il mercato si aspetta più
  volatilità.

Si misura, nel 2011–18 e nel 2019–26:
- quota di esplosioni con e senza segnale;
- quante esplosioni il segnale aveva annunciato.

## Decisione

- **M1, il livello nel tempo si prevede** se l'errore di P1 o P2 sul mese
  dopo è ≤ 0,15 (±16%) in tutti e tre i periodi.
- **M2** è descrittiva: si dice di quanto scende l'errore passando dalla
  singola NFP alla mediana di 6.
- **M3, un segnale vede arrivare le esplosioni** se:
  - la quota di esplosioni col segnale è almeno il doppio di quella senza,
    in tutti e due i periodi;
  - ci sono almeno 5 esplosioni per periodo.
  - Altrimenti le esplosioni non si vedono arrivare.
- Sul sito va il **grafico della volatilità nel tempo**:
  - curva del mese, in pips e in % del prezzo;
  - esplosioni segnate;
  - candele delle news;
  - la stima mese per mese.
  Le scritte del grafico dicono solo quello che la prova conferma.
