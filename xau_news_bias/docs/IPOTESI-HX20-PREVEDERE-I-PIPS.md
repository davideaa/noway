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
