# Verifica indipendente: oro 0,65% + nasdaq 0,98% su un conto solo

Data: 2026-09-21. Strumento: `tools/fusione_conto_unico.py`.
Dati: `dati/oro_puprime_065.html.gz`, `dati/nasdaq_puprime_098.html.gz`.

## Cosa si stava verificando

`report/la-scelta.pdf` prometteva certi rendimenti e certi drawdown ai
rischi scelti (oro 0,65%, nasdaq 0,98%). Davide ha rifatto i due
backtest **a quei rischi** e ha chiesto: quei numeri sono veri o no.

Il controllo e' stato scritto **da zero**, senza riusare
`montecarlo_portafoglio.py` che aveva prodotto il PDF. Ripetere lo
stesso codice non avrebbe verificato niente.

## Primo passo: i conti tornano?

La ricostruzione parte dalle operazioni del report e deve ritrovare
quello che MT5 dichiara da solo. Lo ritrova:

| | MT5 | ricostruito |
|---|---:|---:|
| oro, saldo finale | 29.722,14 | 29.722,14 |
| oro, drawdown di bilancio | 17,04% | 17,0% |
| nasdaq, saldo finale | 49.578,93 | 49.578,93 |
| nasdaq, drawdown di bilancio | 12,94% | 12,9% |

Nessuna apertura orfana su nessuno dei due. I parametri dei due report
sono quelli documentati: **e' cambiato solo il rischio.**

## La storia vera, le due gambe su un conto da 10.000

2.749 operazioni, 2019.01.02 → 2026.09.15 (7,70 anni).

| | |
|---|---:|
| rendimento | **+1.374%** |
| CAGR | 41,8% |
| drawdown di bilancio | **21,0%** |
| solo oro | +197%, DD 17,0% |
| solo nasdaq | +396%, DD 12,9% |

## Monte Carlo, 10.000 storie: il PDF contro i fatti

| | il PDF | esce adesso | |
|---|---:|---:|---|
| TUTTO, mediana | +1.222% | **+1.414%** | meglio |
| TUTTO, DD 95% | 28,1% | **28,4%** | uguale |
| MAGRO, mediana | +576% | **+628%** | meglio |
| MAGRO, DD 95% | 32,9% | **33,8%** | peggio |

**Il PDF era onesto.** Le differenze sono piccole e vanno nella
direzione che ci si aspetta: il test dell'oro nuovo parte da **gennaio
2019 invece che da settembre**, quindi ci sono 87 operazioni in piu' e
otto mesi in piu' di storia. Sono piu' dati, non dati diversi.

Stabilita' su cinque semi, 10.000 storie ciascuno: il DD 95% si muove
di ±0,3 punti. Non sono numeri rumorosi.

## Il tetto del 33% non e' piu' rispettato

Il vincolo posto da Davide era: drawdown al 95o percentile **entro il
33%** nello scenario prudente. Adesso:

| metodo | MAGRO, DD 95% | |
|---|---:|---|
| `gambe` (gambe rimescolate separate) | 33,8% | appena fuori |
| `unito` (flusso fuso, tiene la struttura incrociata) | **36,8%** | fuori |

Il PDF leggeva `gambe`, che e' **il piu' ottimista dei due**: rompendo
l'accoppiamento fra le gambe non regala nessuna sincronia fortunata, ma
non modella nemmeno quella sfortunata. Per un tetto sul drawdown la
riga giusta e' `unito`.

Non e' un peggioramento della strategia: e' la stessa strategia
misurata su piu' storia e letta col metodo piu' severo. **La scelta se
scendere di rischio o alzare il tetto e' di Davide, e non e' stata
fatta qui.**

## Due avvertenze che cambiano la lettura

**1. Questi drawdown sono sul bilancio, non sull'equity.** Contano solo
le operazioni chiuse. MT5 misura anche il flottante delle posizioni
aperte, e quello e' sempre piu' alto: sull'oro 19,2% contro 17,0%,
sul nasdaq 14,2% contro 12,9%. Il drawdown vissuto davvero sul conto
e' il secondo. **I numeri qui sopra sono un pavimento.**

**2. Il report del nasdaq e' girato con `BlockOnAnyAccountPosition =
true`.** Nel tester non si vede, perche' gira da solo. Su un conto
condiviso quel valore fa si' che una posizione aperta dell'oro
impedisca al nasdaq di entrare — ed e' il 65% dei suoi trade. **Tutta
questa ricostruzione presuppone `false`.** Con `true` il portafoglio
che girera' non e' quello misurato qui.

## Il risultato inatteso, ed e' il migliore

**Correlazione mensile oro / nasdaq: +0,052**, su 93 mesi.
Praticamente zero.

E' il numero che mancava per poter chiamare questo un portafoglio e non
due strategie tenute insieme. Due gambe scorrelate danno lo stesso
rendimento con meno drawdown di due gambe che soffrono negli stessi
mesi, ed e' il motivo per cui il portafoglio ha DD 21,0% mentre la
somma ingenua dei due singoli (17,0% + 12,9%) ne suggerirebbe molto di
piu'.

## Ricaduta sulla sezione 7

La verifica delle correzioni al codice di settembre chiedeva che
uscissero **1.123 operazioni** sull'oro. Ne escono **1.123**. Il
criterio dichiarato era: «se cambia anche solo il numero di operazioni,
le modifiche non sono neutre». Non e' cambiato.

Il profit factor **non e' confrontabile**: la verifica era dichiarata a
rischio 0,70% e questa passata e' girata a 0,65%, e col composto il PF
dipende dal rischio. Il report dice 1,38 contro l'1,36 atteso a 0,70%.
**Il controllo sul conteggio e' passato, quello sul PF resta da fare.**

## Rifare l'analisi

```
python3 tools/fusione_conto_unico.py \
    dati/oro_puprime_065.html.gz:0.65 \
    dati/nasdaq_puprime_098.html.gz:0.98
```
