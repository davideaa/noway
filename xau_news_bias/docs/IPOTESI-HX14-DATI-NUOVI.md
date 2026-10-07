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
