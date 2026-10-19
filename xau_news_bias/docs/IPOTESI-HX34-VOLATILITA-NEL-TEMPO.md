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

## Risultati (dopo i commit `a5f80d6` e `0cba269`)

File: `research_output/phase2/hx16/hx34_volatilita_tempo.json`.

**M1 — La volatilità del mese dopo.** Errore mediano (in % circa):

| Periodo | P1 mese | P2 mese | P1 3 mesi | P2 3 mesi |
|---|---|---|---|---|
| 2011–18 | 0,133 (±14%) | 0,132 (±14%) | 0,129 | 0,149 |
| 2019–22 | 0,181 (±20%) | 0,164 (±18%) | 0,158 | 0,115 |
| 2023–26 | 0,168 (±18%) | 0,175 (±19%) | 0,221 | 0,139 |

- **Per la regola scritta prima non basta**: sul mese dopo l'errore supera
  0,15 nel 2019–22 e nel 2023–26.
- Il livello del mese dopo si stima comunque meglio del singolo giorno
  (±31–34%) e della singola NFP (±33%): circa ±14–20%.
- Descrittivo: sulla media dei 3 mesi dopo, P2 sta fra 0,115 e 0,149 in
  tutti e tre i periodi (±12–16%). Non era la misura della decisione.

**M2 — La NFP nel tempo.** Stesse stime EW3, fatte prima di ogni release:

| Periodo | Singola NFP | Mediana di 6 NFP |
|---|---|---|
| 2019–22 | 0,390 | 0,206 |
| 2023–26 | 0,287 | 0,154 |

- Passando dalla singola alla mediana di 6, l'errore si **dimezza**.
- Anno per anno l'errore tipico è 0,115 (2019–22) e 0,141 (2023–26).
- Eccezione 2026: mediana vera 408 pips, stima 229 (errore 0,58). La
  stima, fatta solo con le NFP passate, è rimasta indietro rispetto
  all'esplosione della volatilità di gennaio–marzo 2026. Il range del
  giorno medio è stato 3,1–3,8%, contro 1,2–1,5% del 2025.

**M3 — Le esplosioni.**
- 19 mesi di esplosione in tutto (7 nel 2011–18, 12 nel 2019–26).
- Mesi: 2011-08/09, 2013-04/05, 2014-11/12, 2016-02, 2019-06/07/08,
  2020-03, 2022-03, 2024-04, 2025-04/05, 2025-10, 2026-01/02/03.

| Periodo | Senza segnale | Con W1 (volatilità che sale) | Con W2 (GVZ alto) |
|---|---|---|---|
| 2011–18 | 5% (W1) / 4% (W2) | 25% (3 su 12) | 25% (4 su 16) |
| 2019–26 | 8% (W1) / 7% (W2) | 33% (6 su 18) | 29% (7 su 24) |

- **Per la regola scritta prima tutti e due i segnali passano**: col
  segnale l'esplosione è 4–6 volte più probabile.
- **Descrittivo, controllo fatto dopo**, che cambia il senso. Le
  esplosioni vengono a gruppi di mesi consecutivi. Dei 19 mesi, 11 sono
  l'**inizio** di un'esplosione (4 nel 2011–18, 7 nel 2019–26):
  - W1 ne ha annunciato **1** su 11;
  - W2 (GVZ) **4** su 11: 2014-11, 2020-03, 2022-03, 2025-12;
  - W2 è acceso anche in 23 mesi tranquilli senza esplosione.
- Quindi i segnali dicono soprattutto che **un'esplosione già iniziata
  continua** anche il mese dopo. L'inizio di un'esplosione da un periodo
  calmo quasi non si vede: il GVZ ne prende circa 1 su 3, con molti falsi
  allarmi.

**Verdetto.**
- Nel tempo la volatilità si prevede meglio della singola news:
  - il mese dopo circa ±14–20%;
  - la media di 6 NFP circa ±15–21%.
  - Non abbastanza per la soglia scritta prima (±16% in tutti i periodi
    sul mese).
- Un'esplosione in corso continua: col GVZ alto o la volatilità già
  salita, il mese dopo esplode 1 volta su 3–4 contro 1 su 13–25.
- L'inizio di un'esplosione non si vede arrivare in modo affidabile.
