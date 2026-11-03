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

## Risultati (dopo il commit con le regole)

File: `research_output/phase2/hx16/sens_stop_spread.json` e `.csv` (una riga per NFP). 148 NFP, 2014–2026.

**Controllo.** A rifà H-X44 in 143 NFP su 148. Le 5 diverse vengono dallo stop arrotondato a 0,1 pips nel file di H-X44.

**Pips a NFP con lo stop del sito** (con 1 lotto, 1 pip = 10 $). La colonna "salvate" sono le NFP giuste in cui lo stop non scatta, 2020–26.

| Variante | 2020–26 | Ultimi 3 anni | Salvate | NFP che cambiano esito rispetto ad A |
|---|---|---|---|---|
| A — calcolo del sito (−60 s, 30 pips) | +29 | +62 | 85% | — |
| B — −30 s, 30 pips | +16 | +35 | 81% | 6 |
| C — −30 s, 40 pips | +15 | +35 | 77% | 9 |
| D — −30 s, 40 pips fino a +30 s | +14 | +35 | 74% | 11 |
| E — 40 pips tutti dal lato dello stop | +1 | +29 | 49% | 43 |

**In R, 2020–26** (t contro A):
- A +0,452;
- B +0,261 (t −1,4);
- C +0,224 (t −1,65);
- E −0,086 (t −3,5).

**Regola scritta prima: scatta.** C peggiora A di 0,23 R a trade e di 8,5 punti sulle NFP giuste salvate.
- Si propone a Davide lo **stop + 10 pips**: circa 89 invece di 79 per la NFP del 06/11.

**Il peggioramento viene soprattutto dall'ingresso a −30 s, non dai 10 pips di spread in più.** Le 6 NFP che cambiano fra −60 e −30 s, con il loro R:

| NFP | Era | Diventa |
|---|---|---|
| 06/06/2014 | −0,71 | −1 |
| 05/04/2024 | +1,73 | −1 |
| 04/04/2025 | −0,27 | −1 |
| 09/01/2026 | −1 | −0,24 |
| 08/05/2026 | +0,06 | −1 |
| 04/09/2026 | +9,24 | −1 (lo stop era 72 pips) |

- Fra le due ore la differenza **non è provata** (t −1,4): la decidono due NFP.
- **Errore dichiarato.** Nel descrittivo dell'ora d'ingresso avevo scritto che 14:29:30 equivale a 14:29:00. Valeva per lo stop della regola B di H-X39. Con lo stop di oggi e i prezzi S4 cambiano 6 NFP su 148.

**Proposta, aggiunta dopo per misurarla** (non decide):

| Variante | 2020–26 | Ultimi 3 anni | Salvate |
|---|---|---|---|
| B + 10 pips | +26 | +60 | 89% |
| C + 10 pips | +24 | +56 | 87% |

- C + 10 contro C: +9,3 pips a NFP, t 0,97, non provato.
- Salva il 04/09/2026: +7,9 R invece di −1.

**Il dato che manca** è come si apre davvero lo spread del broker. E dice che, se si apre tutto dal lato dello stop, lo stop da 79 salva solo metà delle NFP giuste. Si misura con `mt5/XNB_TickExport.mq5` e `mt5/xnb_events.csv` (43 NFP dal 2023).

## Il caso vero di Davide e la scelta (03/11/2026)

**Cosa ha detto Davide:**
- lo spread si apre solo **prima** della news, da circa 20 s a 1 s prima, ed è di solito **30 pips**;
- dopo la partenza non conta;
- leva 1:500 e stop out al 20%. Con 1.000 € e 1 lotto lo stop out arriva intorno ai 100 pips, dopo lo stop.

**Variante B0**, aggiunta dopo: spread 30 pips da −20 s a 0, ingresso −30 s.

| Variante | Pips a NFP 2020–26 | Ultimi 3 anni | Salvate 2020–26 |
|---|---|---|---|
| B0, stop del sito | +16 | +35 | 81% |
| **B0 + 10 pips** | **+27** | **+60** | **92%** |
| A, come calcolava il sito prima | +29 | +62 | 85% |

**Decisione di Davide ("Vai"): stop + 10 pips.**

**Sul sito** (`build_site.py`, `stop_formula`):
- stop = 1,2 × (30 + 10% della candela prevista) + 10 pips;
- risultati NFP per NFP con la variante B0 + 10;
- ingresso indicato alle 14:29:30.

**Registro dal vivo** (`hx8_live.py`):
- il risultato aggiunge `trade_formula.davide`, calcolato dallo stesso record stop scritto prima della news;
- il record stop della NFP del 06/11 era già scritto il 20/10 e non si tocca;
- la variante è definita in codice il 03/11, prima della NFP.

**Limite.** I pallini "quanto è andato contro" nel grafico dello stop restano misurati dall'ingresso a −60 s, come in H-X38.
