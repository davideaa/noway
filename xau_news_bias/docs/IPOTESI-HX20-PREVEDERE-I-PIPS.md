# H-X20 — Quale volatilità prevede quanti pips farà la news (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare.

## Idea di Davide

La volatilità della settimana prima prevede bene quella della settimana
dopo. In letteratura la volatilità è persistente (modelli GARCH e HAR,
Corsi 2009). Si vuole sapere se, e su quale orizzonte (settimana, mese,
trimestre, semestre, anno), la volatilità dell'oro prima della news
prevede quanto si muove la news.

## Cosa si prevede

Per NFP e per Retail/PPI, ogni release dal 2014 al 2026:
- **R1**: ampiezza della candela delle 14:30 sul bid, dal minimo al
  massimo con la wick, in **% del prezzo**;
- **ARR**: quanto arriva nella direzione giusta entro fine M1, entrando a
  T0 − 30 s (H-X19), in % del prezzo.

## Previsori, tutti noti prima della news

| Codice | Previsore |
|---|---|
| V5 | media del range giornaliero (massimo − minimo) ÷ chiusura, ultimi 5 giorni di trading |
| V21 | lo stesso, ultimi 21 giorni (un mese) |
| V63 | ultimi 63 giorni (un trimestre) |
| V126 | ultimi 126 giorni (un semestre) |
| V252 | ultimi 252 giorni (un anno) |
| ATR | ATR 14 H1 a T0 ÷ prezzo |
| N3, N12, N24 | mediana del bersaglio sulle ultime 3, 12 e 24 release della stessa news |

- Giorni di trading costruiti dalle candele H1 Dukascopy, con giornata che
  si chiude alle 22:00 UTC. Contano solo i giorni completi prima del giorno
  della news.

## Come si misura (passo per passo, mai con la release stessa)

- Per i V e l'ATR: previsione = k × previsore. k è la mediana di
  (bersaglio ÷ previsore) sulle 24 release precedenti.
- Per gli N: previsione = la mediana stessa.
- Su ogni release dal **2019** al **2026**:
  - **errore** = |log(vero ÷ previsto)|; si riporta la mediana;
  - **Spearman** fra previsione e vero;
  - **copertura**: quota di release dentro la fascia 25–75% dei rapporti
    (vero ÷ previsto) delle 24 release precedenti. Obiettivo 50%.
- Risultati separati per 2019–22 e 2023–26.

## Decisione

- Il previsore migliore è quello con **l'errore mediano più basso nel
  2023–26 e anche nel 2019–22**. Se i primi due sono a meno di 0,03 l'uno
  dall'altro, vince il più semplice.
- Quel previsore diventa la stima "quanto aspettarsi" su tutti e due i
  siti, con la sua fascia e l'errore dichiarato.
- Se nessun V batte N24, la stima resta quella di H-X19 (ultime 24
  release).

## Risultati (dopo i commit `8b4a245` e dello script)

File: `research_output/phase2/hx16/hx20_prevedere.json`. Codice:
`scripts/hx20_prevedere.py`.

Errore mediano |log(vero ÷ previsto)|: 0,20 = sbaglia di circa il 20%,
0,40 = circa il 50%. I migliori 4:

| | 2019–22 | 2023–26 | Spearman 2023–26 |
|---|---|---|---|
| **NFP, candela M1**: N3 | 0,33 | **0,23** | 0,19 |
| N24 | **0,25** | 0,34 | −0,40 |
| V252 | 0,34 | 0,35 | 0,00 |
| V126 | 0,35 | 0,36 | 0,07 |
| **NFP, arrivo**: V21 | 0,47 | 0,41 | 0,17 |
| N24 | 0,35 | 0,42 | −0,30 |
| **Retail/PPI, candela M1**: N12 | 0,33 | **0,19** | 0,43 |
| N3 | 0,33 | 0,19 | 0,46 |
| V126 | 0,39 | 0,24 | 0,03 |
| **Retail/PPI, arrivo**: N12 | 0,51 | **0,32** | 0,22 |
| N3 | 0,54 | 0,34 | 0,27 |

- **La volatilità generale dell'oro NON prevede la candela della news.**
  Nessun orizzonte funziona (settimana, mese, trimestre, semestre, anno,
  ATR H1): lo Spearman fra la volatilità di prima e la candela è circa
  zero in quasi tutti i casi.
- Il rapporto (arrivo ÷ volatilità del mese) cambia molto da un anno
  all'altro:
  - NFP: 0,20 (2020), 0,48 (2024), 0,29 (2026);
  - Retail/PPI: 0,08 (2020), 0,21 (2023), **0,05 (2026)**.
  - Nel 2026 l'oro si muove il doppio tutti i giorni (range giornaliero
    medio 2,2–2,5% contro 1,2–1,5%), ma le news, **in proporzione**, meno.
- **Funziona meglio la memoria della news stessa**: le ultime release
  della stessa news.
  - **Retail/PPI**: N12 o N3, errore di circa il 20% nel 2023–26.
  - **NFP**: nessun previsore vince in tutti e due i periodi. N3 vince nel
    2023–26, N24 nel 2019–22; l'errore resta del 25–40%.
- **Decisione**: per Retail/PPI la stima "quanto aspettarsi" usa le ultime
  12 release (N12). Per la NFP restano le ultime 24 (H-X19), con
  l'avvertenza che la NFP è la meno prevedibile.
- Volatilità di oggi (range giornaliero medio): settimana 1,77%, mese
  1,88%, trimestre 2,17%, semestre 2,28%, anno 2,54%. Sta **scendendo**
  dal picco del 2026.
