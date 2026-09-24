# Analisi dei regimi — diagnosi dell'edge

2026-09-20. Report: `report/analisi-regimi.pdf`, da `tools/report_regimi.py`
(motore in `tools/regimi.py`).

Richiesta: capire **perche'** le strategie hanno prodotto questo edge, in
quali condizioni funzionano e in quali soffrono, tutto misurato e non
osservato a occhio. Esplicitamente **senza** ottimizzare niente.

## Il limite, dichiarato per primo

Le fonti di mercato esterne sono **bloccate dalla policy di rete** di
questo ambiente (Yahoo risponde 403 al proxy). L'unica serie di prezzo
disponibile e' ricostruita dai prezzi di ingresso e uscita delle
operazioni dei report MT5. Quindi:

- **Niente dati prima del 2019.** La domanda «le condizioni favorevoli
  esistevano anche negli anni precedenti?» **non e' rispondibile**. Si
  puo' solo confrontare 2019-2023 con 2024-2026.
- **Niente OHLC**: niente ATR classico, niente ADX, niente gap. Al loro
  posto volatilita' realizzata ed efficiency ratio.
- **Copertura**: oro 63% dei giorni feriali, nasdaq 89%. Per questo le
  misure sono prese in una finestra di calendario che precede ogni
  ingresso, non su una griglia giornaliera.

## Metodo

12 caratteristiche a ogni ingresso, **solo con prezzi antecedenti**.
Ridondanza misurata: due famiglie (`volatilita' <-> movimento tipico`
+0,95; `momentum <-> distanza dalla media <-> posizione nel range <->
drawdown dell'asset` da +0,71 a +0,90). **Tenute 7 su 12**, correlazione
massima residua 0,58 (oro) e 0,63 (nasdaq).

Regimi: efficiency ratio a terzili x volatilita' alla mediana.
Significativita': Spearman con **p per permutazione** (niente ipotesi
sulla distribuzione, che con code cosi' conta) e **correzione di Holm**
per test multipli.

## Il risultato principale: l'edge NON dipende dal regime

**Zero variabili significative su 25 provate**, dopo la correzione.
Ne' su orizzonte trimestrale ne' a 3-10 giorni, ne' sull'oro ne' sul
nasdaq. Gli andamenti per quintile sono a zig-zag (+0,38 / +0,19 /
+0,12 / −0,10 / +0,23 sulla volatilita' dell'oro): non e' la forma di
una relazione vera.

**La differenza fra gli anni non e' distinguibile dal caso**: test di
permutazione, oro p 0,37, nasdaq p 0,24. L'expectancy per operazione
del 2025 non e' statisticamente diversa da quella del 2021. I rendimenti
annui enormi vengono dal composto e dalla coda, non da un edge diverso.

## L'unica eccezione: l'oro nei mercati laterali

I grandi vincitori dell'oro **non** sono sparsi a caso (chi2 13,03,
p 0,013): +10,9 punti nei periodi direzionali e calmi, −9,6 in quelli
laterali e volatili. Il nasdaq invece li prende dappertutto (p 0,633).

**E la relazione regge il fuori campione**, con le soglie fissate sul
solo 2019-2023:

| | oro | nasdaq |
|---|---|---|
| correlazione della classifica dei regimi IS/OOS | **+0,613** | **−0,762** |
| regime migliore, expectancy dentro / fuori | +0,377 / +0,369 R | — |

Il −0,762 del nasdaq e' la firma dell'**assenza** di relazione, non di
una relazione contraria.

Robustezza: il vantaggio «efficiency alta + volatilita' bassa» resta
positivo su tutta la fascia dal 45o al 70o percentile (da +0,20 a
+0,31 R), ma **non cresce in modo ordinato**: zigzaga. Oltre il 70o
restano meno di cento operazioni e i valori non si leggono. E' una zona
robusta, non una soglia esatta.

## Stress test sulla miscela dei regimi

| scenario | oro | nasdaq |
|---|---|---|
| direzionali −70% e laterali x2 | **−43%**, DD da 23,5 a 29,7 R | **−10%**, DD fermo |

L'oro ha una dipendenza dal regime, il nasdaq praticamente no.

## Portafoglio: due edge diversi davvero

Nessuna correlazione condizionata supera 0,13 in valore assoluto —
ne' nei mesi direzionali (−0,020), ne' in quelli laterali (+0,127), ne'
nei mesi piu' estremi per il nasdaq (−0,047), ne' nel 25% di mesi
peggiori per l'oro (−0,074). **Non c'e' un fattore comune nascosto.**

## Conclusione operativa

Il punto debole misurato e' uno solo: **l'oro nei mercati laterali a
volatilita' media** (expectancy −0,11 R, PF 0,82, n 112). Se si vuole
diversificare li', serve un edge di **ritorno alla media a orizzonte
breve** che entri quando l'efficiency ratio e' nel terzile basso.

Primo passo: non inventare la strategia, **misurare** se in quelle 112
operazioni c'e' qualcosa da prendere. Se non c'e', si smette subito.
E' lo stesso metodo con cui e' stata scartata `GoldRangeMR`.

## Avvertenza

«Nessuna relazione trovata» non vuol dire «nessuna relazione esiste».
Con mille operazioni e sette anni una dipendenza debole resterebbe
invisibile.
