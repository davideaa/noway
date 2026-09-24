# La stessa strategia su tre broker

Test del 2026-09-22. Idea di Davide: rigirare **lo stesso codice con gli
stessi parametri** su broker diversi, per vedere se il risultato dipende
dal listino di uno solo. È il passo 13 di `docs/metodo.md`.

È un test che **non può overfittare**: non si sceglie niente, si
verifica. Si può rifare quante volte si vuole.

## Cosa è stato confrontato

`NAS100_SessionOpenMomentum`, M5, 2023.01.01 → 2026.09, rischio 1,5%
con `UseAdaptiveRisk=true`. **Parametri identici, 51 su 51**, verificati
dai report.

| file | broker | simbolo |
|---|---|---|
| `dati/nasdaq_2023_puprime.html.gz` | PUPrime-Demo | NAS100.s |
| `dati/nasdaq_2023_ftmo.html.gz` | FTMO-Demo | US100.cash |
| `dati/nasdaq_2023_fusion.html.gz` | FusionMarkets-Demo | NAS100 |

Con il rischio adattivo acceso la R nominale è un'approssimazione, ma
identica sui tre: il confronto regge.

## I cinque criteri, dichiarati prima di guardare

| | soglia |
|---|---|
| segno | entrambi in utile |
| numero operazioni | entro ±15% |
| sovrapposizione (stessa direzione, apertura entro 2 ore) | ≥ 70% |
| differenza di rendimento per operazione | \|t\| < 2 |
| correlazione sulle operazioni appaiate | ≥ 0,70 |

L'identità trade per trade **non** è il criterio: due feed diversi non
la danno mai, e pretenderla boccerebbe qualunque strategia.

## Risultato: passano tutti e due

| | operazioni | somma R | costi | vs PUPrime: n. oper. | sovrapp. | correlaz. | t |
|---|---:|---:|---:|---:|---:|---:|---:|
| PUPrime | 770 | +98,2 | 12,1 R | — | — | — | — |
| FTMO | 779 | +63,1 | 14,8 R | +1,2% | 97,4% | 0,968 | 0,87 |
| **Fusion** | 777 | **+89,3** | **6,0 R** | +0,9% | 97,9% | **0,992** | **0,23** |

**Gli ingressi coincidono al secondo** su tutte le operazioni appaiate:
scarto mediano di apertura, 0 secondi. I segnali leggono il mercato,
non le stranezze di un feed.

## Da dove viene la differenza fra broker

Le commissioni sono zero su tutti e tre. Su FTMO il divario di 35,1 R
rispetto a PUPrime è per il **7,6% swap** e per il **92,4% prezzi**.

E i prezzi peggiori non sono sparsi: l'84% delle operazioni appaiate è
quasi identico (entro 0,05 R). Le **20 più divergenti spiegano da sole
tutto il divario**, e la divergenza nasce **sempre in uscita**: stesso
ingresso, ma il trailing chiude prima (89,8 ore contro 2,3; 38 contro
3,4). Su una strategia che vive della coda, perdere tre o quattro
vincitori grossi costa più di tutto il resto.

## Un errore di spiegazione, corretto

Avevo attribuito il calo di FTMO a un **feed più sporco**. Misurando il
rumore vero dei feed — tolto lo scivolamento annuale dei dividendi, che
è contabilità — **Fusion è più rumoroso di FTMO** (13,4 punti contro
11,4) e **rende di più**. La spiegazione non reggeva.

Quella giusta: con pochi trade che fanno il risultato, la differenza fra
broker su ~770 operazioni è **in gran parte fortuna** — dipende da quali
trade il rumore va a colpire. Il test statistico lo diceva già (t 0,87,
non significativo). Il feed **non** è un criterio di scelta.

## Cosa se ne ricava

- **Fusion per il live**, per un motivo solido: **lo swap costa la
  metà** (6,3% del vantaggio lordo contro 11,0% su PUPrime e 19,0% su
  FTMO). Quello non è fortuna, è il listino.
- **Stima per condizioni peggiori:** fino a −30% sul lordo, perché
  qualche vincitore grosso non arriva in fondo.
- **Su un prop, a quel rischio, il conto sarebbe saltato**: drawdown
  17,7-21,8% contro un limite tipico del 10%. Non interessa, perché
  Davide non intende usare prop — ma vale come promemoria che il
  drawdown del backtest è una pescata fortunata.
