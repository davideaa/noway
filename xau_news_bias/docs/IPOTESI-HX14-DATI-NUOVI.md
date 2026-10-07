# H-X14 — la regola H-X8 su dati mai usati: oro 2003–2007 ed EURUSD (pre-registrata)

Scritta il 07/10/2026 **prima** di scaricare o guardare questi dati.

## Perché

Davide: «più dati hai, meno è probabile che sia fortuna». Vero, ma solo
per dati che non sono serviti a trovare la regola. Il 2014–26 è servito
(H-X7). Il 2008–13 dell'oro è già stato guardato: 34/69, cioè 49%.

Restano due fonti mai usate da nessuna regola di direzione:
- **XAUUSD 2003–2007**: tick Dukascopy dal 2003, ma gli eventi della fase 2
  partono dal 2008, quindi questi anni non sono mai stati guardati.
- **EURUSD a tutte le NFP**: mai usato per la direzione. Alla NFP l'euro
  si muove per il dollaro come l'oro. Se l'inversione è un effetto del
  dollaro, deve esserci anche lì.

## Regola, identica a H-X8, applicata a ogni strumento da solo

- Date NFP dall'archivio ufficiale BLS (`empsit.htm`), T0 = 08:30 New York.
- Movimento della prima M1 = ultimo prezzo medio prima di T0 + 60 s meno
  l'ultimo prima di T0.
- **Evento valido**: l'ultimo tick prima di T0 è al massimo 120 s prima di
  T0, e ci sono almeno 5 tick fra T0 e T0 + 60 s. Gli eventi non validi si
  contano e si saltano.
- Bias = opposto del segno del movimento della NFP valida precedente dello
  **stesso strumento**. Movimento precedente nullo → nessuna bias.
- Si misura solo la **direzione** (indovinata sì/no), niente R: gli spread
  di quegli anni non si confrontano con quelli di oggi.

## Test

| Test | Strumento | Periodo | NFP attese |
|---|---|---|---|
| T1 | XAUUSD | dal primo tick Dukascopy 2003 al 2007-12 | circa 55 |
| T2 | EURUSD | 2003-05 → 2013-12 | circa 125 |

- Binomiale unilaterale contro il 50%. Holm su 2 test.
- **Potenza, calcolata prima**: se la regola valesse davvero il 60%,
  passerebbe T1 solo 1 volta su 4 circa (servono ~36/55), T2 6 volte su
  10 (servono ~74/125). **Un T1 bocciato quindi non dimostra che la regola
  non esiste**; un T1 o T2 promosso invece conta.
- Già noto, da dichiarare: l'oro 2008–13 ha fatto 49%. La parte 2008–13
  di T2 è probabilmente influenzata dallo stesso periodo.

## Solo descrittivo (non test, i periodi sono già stati visti per l'oro)

- T2 diviso in 2003–07 e 2008–13.
- EURUSD 2014–26 con la sua regola.
- Quante volte oro ed EURUSD si muovono in direzione opposta (dollaro) alla
  stessa NFP, 2003–26.
- Numero di tick nel primo minuto, per anno, per giudicare la qualità del
  feed.

## Decisione, fissata adesso

- **T1 o T2 promosso con Holm** → la regola regge anche su dati che non
  l'hanno generata. È il sostegno più forte possibile senza aspettare il
  vivo.
- **T1 e T2 entrambi ≤ 50%** → su dati nuovi non c'è: il 2014–26 è
  probabilmente un periodo fortunato o un regime che può finire.
- **In mezzo** → non si può dire.
- In ogni caso il giudizio ufficiale resta quello dal vivo di H-X8 (24
  NFP).

## Risultati (dopo il commit della pre-registrazione `ba98445`)

File: `research_output/phase2/hx11/hx14_dati_nuovi.json`. Codice:
`scripts/hx14_dati_nuovi.py`. Controllo: ricalcolata così, la regola
sull'oro 2014–26 fa 91/147 (61,9%), contro 90/148 del sito. La differenza
viene dai criteri di validità, appena diversi.

### Test

| Test | Strumento e periodo | Indovinate | Quota | p | p Holm |
|---|---|---|---|---|---|
| T1 | XAUUSD 2003–2007 | 24/53 | **45,3%** | 0,79 | 1,00 |
| T2 | EURUSD 2003–2013 | 63/126 | **50,0%** | 0,54 | 1,00 |

**Per la regola scritta prima: T1 e T2 sono entrambi ≤ 50%. Su dati nuovi
la regola non c'è.** Il 2014–26 è un periodo fortunato oppure un regime
che può finire.

### Descrittivo

| Strumento | 2003–07 | 2008–13 | 2014–26 |
|---|---|---|---|
| XAUUSD | 45% (53) | 50% (70) | 62% (147) |
| EURUSD | 39% (54) | 58% (72) | 62% (151) |

- Oro ed EURUSD si muovono nella stessa direzione alla NFP il 67%
  (2003–07), il 72% (2008–13) e il **91%** (2014–26) delle volte. Il 62%
  dell'EURUSD nel 2014–26 è quindi lo **stesso movimento del dollaro**
  dell'oro, non una conferma indipendente.
- L'inversione cresce col tempo: assente o al contrario nel 2003–07, debole
  nel 2008–13 (solo EURUSD), chiara dal 2014. È compatibile con un regime
  nato negli ultimi anni.
- Qualità del feed, tick nel primo minuto (mediana): oro 23–41 nel
  2003–06, 8–11 nel 2007–09, oltre 300 dal 2014; EURUSD 16–24 nel 2003–06,
  oltre 400 dal 2014. Un feed sottile rende la direzione più rumorosa e
  spinge verso il 50%. È un limite vero, **ma non cambia la decisione
  scritta prima**: nel 2008–13 l'EURUSD ha un feed buono (83–279 tick) e
  fa 58%, non significativo (p 0,10).
- Eventi non validi: oro 9 (5 nel 2003), EURUSD 5 (tutti nel 2003).

### Cosa cambia

- Il giudizio ufficiale resta dal vivo (H-X8, 24 NFP, stop anticipato se
  ≤ 4/12).
- Il sito resta com'è. La regola va presentata come **regime degli ultimi
  anni**, non come legge del mercato: su 2003–2013 non funzionava.
