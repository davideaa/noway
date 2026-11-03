# Sensibilità dello stop allo spread e all'ora d'ingresso (scritta prima di calcolare)

Scritta il 03/11/2026 **prima** di calcolare.

## Domanda di Davide

Lo stop del sito tiene già conto di tre cose?
- Entra 30 secondi prima della news.
- Nello scatto il suo broker apre lo spread di 30–40 pips per 1–2 secondi.
- Rischia tutto il deposito: 1.000 € con 1 lotto, cioè circa 100 pips.

Lo stop è quello del sito: 1,2 × (30 pips + 10% della candela prevista), circa 79 pips.

## Cosa c'è già nel calcolo dello stop

Lo dice il codice: `s4()` in `scripts/hx38_stop_contro.py`, `trade()` in `scripts/hx11_site.py`.

**Prezzi.**
- Tick veri Dukascopy, con il loro spread.
- Da 20 s prima a 10 s dopo la news lo spread è portato ad **almeno 30 pips (3 $)**, aperto in modo uguale sui due lati. Bid e ask si allontanano ciascuno di 15 pips dal prezzo di mezzo.

**Ingresso.**
- All'ask (LONG) o al bid (SHORT) di 60 s prima.
- Il descrittivo dell'ora d'ingresso ha mostrato che 30 s prima dà gli stessi esiti.

**Stop.** Scatta quando il lato che chiude la posizione tocca il livello: il bid per un LONG, l'ask per uno SHORT. Uno spread che si apre consuma quindi parte dello stop.

## Varianti da provare

Lo stop è sempre quello del sito (B37 × 1,2, NFP per NFP, come in H-X44).

| Variante | Spread | Ingresso |
|---|---|---|
| A (oggi) | 30 pips, simmetrico, da −20 a +10 s | −60 s |
| B | come A | −30 s |
| C | 40 pips, simmetrico, da −20 a +10 s | −30 s |
| D | 40 pips, simmetrico, da −20 a **+30 s** | −30 s |
| E (caso peggiore) | 40 pips **tutti dal lato dello stop**, da −20 a +10 s | −30 s |

In E il lato che chiude si stacca di 40 pips dall'altro, che resta fermo.

**Misure.**
- R a trade per tutto, 2014–19, 2020–26 e ultimi 3 anni.
- Quota di NFP giuste salvate, cioè dove lo stop non scatta.
- Quante NFP cambiano esito rispetto ad A.

## Regola, scritta prima

- **Se C peggiora A di più di 0,05 R a trade sul 2020–26, o di più di 5 punti sulle NFP giuste salvate**, si propone di aggiungere allo stop i pips mancanti (+10).
- Altrimenti lo stop da ~79 resta com'è.
- E è solo il limite peggiore: si riporta, non decide.

## Cosa non si può sapere da qui

Lo spread vero del broker di Davide nel secondo della news. Dukascopy mostra il suo, non quello di PU Prime o Fusion.

Si può misurare con lo script `mt5/XNB_TickExport.mq5`:
- esporta dal suo MT5 i tick bid/ask attorno alle NFP;
- serve la lista delle NFP in `MQL5/Files/xnb_events.csv`.
