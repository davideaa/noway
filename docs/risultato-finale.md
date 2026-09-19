# Risultato finale — 2019.01.01 → 2026.09.16, rischio 0,8%

GoldPortfolio, pesi 1/1/1, nessuna ottimizzazione, una passata sola.
73% tick reali, livello di margine 651% (nessun problema di leva).

| | |
|---|---:|
| Profitto netto | **30.853,62** (+309%) |
| Saldo finale | 40.853,62 |
| Drawdown | **25,02%** |
| Trade | 2.478 |
| Profit factor | 1,147 |
| Fattore di recupero | **5,83** |
| Sharpe | 1,25 |
| **Correlazione lineare** | **0,95** |
| Z-Score | −1,58 |
| Rendimento annuo | **20,0%** |
| Punti R | 176,6 |
| Expectancy | +0,0713 R per trade |
| t | 2,70 |

La correlazione lineare 0,95 e' il valore piu' alto raggiunto in tutto
il progetto: la curva dei profitti e' quasi una retta. Il primo
portafoglio, quello a tre gambe trend, faceva 0,70.

## Verifica della previsione

Prima della passata avevo scritto: saldo 40.209, drawdown 24,4%.

| | Previsto | Ottenuto | Scarto |
|---|---:|---:|---:|
| Saldo finale | 40.209 | **40.854** | 1,6% |
| Drawdown | 24,4% | **25,02%** | +0,6 punti |

E la passata comprende anche gennaio–maggio 2019, 150 trade che nel
modello non c'erano. Il modello di simulazione e' quindi corretto:
arrotondamento dei lotti e margine non introducono distorsioni
apprezzabili, e le proiezioni Monte Carlo fatte finora reggono.

## Anno per anno

| Anno | Trade | R | Expectancy | PF | Campione |
|---|---:|---:|---:|---:|---|
| 2019 | 293 | 12,2 | +0,0415 | 1,07 | **mai visto** |
| 2020 | 297 | **45,4** | +0,1529 | 1,30 | costruzione |
| 2021 | 330 | 21,2 | +0,0642 | 1,12 | costruzione |
| 2022 | 335 | **12,1** | +0,0361 | **1,07** | costruzione |
| 2023 | 314 | **45,5** | +0,1450 | 1,27 | costruzione |
| 2024 | 340 | **3,4** | +0,0100 | **1,02** | fuori campione |
| 2025 | 360 | 30,5 | +0,0847 | 1,15 | fuori campione |
| 2026 (a set.) | 209 | 26,7 | +0,1279 | 1,24 | fuori campione |

**Otto anni su otto in utile.** Nessuno in perdita, nemmeno il 2019
che non era mai stato guardato (i primi cinque mesi del 2019 sono
entrati in questa passata per la prima volta e hanno reso +0,04 R per
trade: poco, ma positivo).

**Due anni su otto praticamente fermi**: 2022 e 2024, PF 1,07 e 1,02.
Insieme fanno 15,5 punti R su 176,6, cioe' il 9% del risultato su un
quarto del tempo e 675 trade. E' la caratteristica piu' importante da
conoscere prima di metterci dei soldi.

## Monte Carlo sui 2.478 trade, 0,8%

| Percentile | Profitto | Annuo | Drawdown |
|---|---:|---:|---:|
| 5° | +68% | 7,0% | 18,3% |
| 25° | +180% | 14,3% | 22,7% |
| **50°** | **+306%** | **19,9%** | **26,7%** |
| 75° | +486% | 25,8% | 31,9% |
| 95° | +907% | 34,9% | **41,2%** |
| 99° | | | **49,3%** |

Percorsi in perdita: 0,4%.

**Il 95° percentile e' 41,2%, sopra il tetto del 35% dichiarato.** Sul
campione piu' lungo lo 0,8% non rispetta piu' il limite: il rischio
compatibile scende verso **0,65–0,7%**.

## Il confronto con la card

| | Card QUANT_LAB | Questo lavoro |
|---|---:|---:|
| Periodo | 7,3 anni | 7,7 anni |
| Rendimento dichiarato | +798% | +309% |
| Drawdown | 33% | 25% |
| Profit factor | 1,20 | 1,15 |
| Trade | 3.864 | 2.478 |

Il loro numero e' piu' alto. Ma il +798% e' misurato sul periodo in cui
hanno scelto i parametri: e' il loro equivalente del nostro 25% annuo
del 2019-2023, non del 13% del fuori campione. **Noi il numero fuori
campione ce l'abbiamo, loro no.**

## Il numero da usare per il futuro

Non il +309% di questa passata, che contiene cinque anni di costruzione.
**Il numero onesto e' l'expectancy fuori campione: +0,0618 R per trade.**

A 0,6-0,7% di rischio significa **11-13% l'anno**, con drawdown mediano
sotto il 20% e un 95° percentile intorno al 30%.

## Cosa resta da fare

Nessun altro backtest. I dati sono finiti: ogni ulteriore prova sugli
stessi anni peggiora la statistica invece di migliorarla.

Il passo successivo e' **demo in tempo reale**, che risponde alle due
domande che nessun backtest puo' toccare:

1. gli spread e gli slittamenti veri assomigliano a quelli modellati?
   (l'edge muore a 3 volte i costi, quindi non e' una domanda oziosa)
2. si riesce a guardarlo fermo per un anno senza spegnerlo?
