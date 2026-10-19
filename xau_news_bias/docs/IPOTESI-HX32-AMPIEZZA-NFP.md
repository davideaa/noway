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

## Risultati (dopo il commit `2644bc9`)

File: `research_output/phase2/hx16/hx32_ampiezza_nfp.json`. Stesse NFP per
tutti i metodi: 47 nel 2019–22, 42 nel 2023–26.

| Metodo | Dentro la fascia 2019–22 | Dentro 2023–26 | Errore 2023–26 | Calibrato |
|---|---|---|---|---|
| N24 | 40% (19 su 47) | 45% (19 su 42) | 0,329 | sì |
| N12 | 38% | 40% | 0,368 | no |
| N6 | 40% | 45% | 0,305 | sì |
| **EW3** | **43% (20 su 47)** | **43% (18 su 42)** | **0,287** | **sì** |
| ADR24 | 43% | 45% | 0,272 | sì |
| ADR12 | 36% | 48% | 0,250 | no |
| FORM | 38% | 43% | 0,296 | no |
| RIDGE | 40% | 43% | 0,289 | sì |

**Decisione, per la regola scritta prima.**
- Calibrati: N24, N6, EW3, ADR24, RIDGE.
- ADR24 ha l'errore più basso (0,272). EW3 (0,287) è a meno di 0,02 e
  viene prima nella tabella.
- **Vince EW3**: la media esponenziale delle ultime NFP, emivita 3.
- Errore tipico 0,287, cioè circa ±33% sulla candela.

**Da dire senza ammorbidire.**
- Tutti i metodi stanno appena sopra il 40%, nessuno arriva al 50%. La
  fascia è un po' stretta: la candela esce sopra e sotto.
- ADR12 ha l'errore più basso di tutti (0,250), ma nel 2019–22 la fascia ci
  prende solo il 36%. Non è calibrato.
- La machine learning (RIDGE) non batte la media esponenziale semplice.
- **Gli ultimi due anni vanno male.** EW3 per anno, dentro su totale:

  | Anno | Dentro | Sopra | Sotto |
  |---|---|---|---|
  | 2019 | 3 su 12 | 8 | 1 |
  | 2020 | 4 su 12 | 2 | 6 |
  | 2021 | 8 su 11 | 2 | 1 |
  | 2022 | 5 su 12 | 4 | 3 |
  | 2023 | 8 su 11 | 1 | 2 |
  | 2024 | 6 su 12 | 2 | 4 |
  | 2025 | 2 su 11 | 3 | 6 |
  | 2026 | 2 su 8 | 5 | 1 |

  Il 43% del 2023–26 regge grazie al 2023–24: nel 2025–26 la fascia ci
  prende 4 volte su 19. Nel 2026 la NFP è uscita sopra 5 volte su 8.
- **Errore mio sul sito.** La fascia "metà delle volte" del sito (14 su 43
  dal 2023) non era quella di questa prova. La stima centrale era la stessa
  (mediana delle ultime 24). Ma la fascia era fatta direttamente col 25° e
  75° percentile delle 24 NFP, non coi rapporti vero ÷ stima. Con i
  rapporti, la stessa mediana delle 24 arriva al 45%.

**Per la prossima NFP** (6/11/2026).
- La NFP del 2/10/2026 (406 pips, misurata dai tick come le altre) entra
  nella media esponenziale.
- Non entra nei rapporti della fascia, perché non è nel dataset.
- Al prezzo di 4.154 $: stima **361 pips**, fascia metà delle volte
  **268–544 pips**.
- Sul sito i pips si ricalcolano col prezzo dell'ultimo aggiornamento.

Si controlla dal vivo, release dopo release.
