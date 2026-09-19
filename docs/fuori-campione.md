# Fuori campione 2024.01.01 – 2026.09.16 — passa i tre criteri

XAUUSD.p, GoldPortfolio, rischio 0,6%, pesi 1/1/1, nessuna
ottimizzazione, una passata sola. **100% tick reali** (il periodo in
campione ne aveva il 64%). 891 trade, contro gli ~850 attesi.

## I criteri, dichiarati prima di eseguire il test

| Criterio | Soglia | Ottenuto | |
|---|---:|---:|---|
| Expectancy | ≥ +0,050 R | **+0,0618 R** | PASSA |
| Profit factor | ≥ 1,10 | **1,123** | PASSA |
| Drawdown | ≤ 27,4% | **10,85%** | PASSA |

Tutti e tre. Nessuno per il rotto della cuffia tranne l'expectancy, che
sta il 24% sopra la soglia.

## Confronto diretto

| | Trade | R | Expectancy | Vincenti | PF | DD | t | %/anno |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| In campione 2019–2023 | 1.437 | 137,0 | +0,0953 | 42,0% | 1,18 | 18,7% | 2,50 | 25,2% |
| **Fuori campione 2024–2026** | **891** | **55,1** | **+0,0618** | 39,7% | 1,12 | **10,9%** | 1,39 | **13,0%** |
| Tutto il periodo | 2.328 | 192,1 | +0,0825 | 41,1% | 1,16 | | **2,84** | |

L'edge si e' **ridotto di circa un terzo** (da 0,0953 a 0,0618 R per
trade). E' esattamente quello che ci si aspetta: i parametri sono stati
scelti guardando il primo periodo, quindi li' il risultato era gonfiato.
Un calo di un terzo e' nella norma; e' il segno di un edge reale ma
ottimizzato, non di un edge inventato.

## Il fuori campione era dentro le attese?

Simulando 891 trade con l'edge del periodo in campione (bootstrap a
blocchi, 20.000 percorsi):

| Percentile | R attesi |
|---|---:|
| 5° | +15,0 |
| 25° | +55,7 |
| 50° | +84,4 |
| 75° | +113,5 |
| 95° | +155,6 |

**Ottenuto: +55,1 R, cioe' il 24° percentile.** Sotto la mediana, ma
dentro la parte centrale della distribuzione. Non e' un risultato
brillante; non e' nemmeno una sorpresa da spiegare.

## Anno per anno

| Anno | Trade | R | Expectancy | PF |
|---|---:|---:|---:|---:|
| 2024 | 340 | **+2,1** | +0,0062 | **1,01** |
| 2025 | 361 | +27,3 | +0,0756 | 1,15 |
| 2026 (a settembre) | 190 | +25,7 | **+0,1351** | **1,29** |

Il 2024 e' stato piatto: 340 trade per due punti R. E' il secondo anno
cosi' dopo il 2022 (335 trade, 12 punti, PF 1,07). **Due anni su sette
il sistema lavora a vuoto.** Non perde, ma non produce.

Il 2025 e il 2026 sono tornati sui valori del periodo in campione.

## Cosa si puo' dire adesso, e cosa no

**Si puo' dire:** su 2.328 trade in sette anni e tre mesi l'expectancy e'
+0,0825 R, la t complessiva e' **2,84**, e l'edge e' sopravvissuto su
2,7 anni di dati mai visti, con la qualita' dei tick migliore di quella
su cui e' stato costruito. Il drawdown fuori campione (10,9%) e' stato
la meta' di quello in campione.

**Non si puo' dire** che sia dimostrato. La t del solo fuori campione e'
**1,39**: presa da sola non significa niente. Il valore di quel test non
sta nella sua t, sta nel fatto che era **una prova sola dichiarata
prima**, e l'ha superata.

**Resta vero** che l'edge e' sottile e che muore a 3 volte i costi, e che
due anni su sette non producono nulla. Chi ci mette dei soldi deve
sapere che puo' passare un anno intero a pareggiare.

## Stato finale del lavoro

| | |
|---|---|
| Configurazione | S1 FADE + S2 PULLBACK H4 + S3 DONCHIAN, pesi 1/1/1 |
| Rischio consigliato | 0,6% per trade |
| Rischio massimo secondo il tetto Monte Carlo (95° ≤ 35%) | 0,8% |
| Expectancy attesa | +0,06 R per trade, non +0,095 |

L'expectancy da usare per qualunque previsione e' **quella fuori
campione**, non quella in campione. Il fuori campione e' ormai speso:
da qui in avanti l'unico dato nuovo e' il mercato.
