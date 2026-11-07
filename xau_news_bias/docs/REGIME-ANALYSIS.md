# Regimi e rotture strutturali (fase 2)

Dati: `research_output/phase2/p2_regimes_prereg.json` (fatto **prima** del
protocollo, NFP solo fino al 2019), `p2_regimes_all.json` e `p2_eras.json`
(rifatti **dopo** l'apertura del test finale, con tutti gli anni).
Metodo: segmentazione binaria con test a permutazioni (α = 0,01, segmenti
≥ 12 eventi), CUSUM, Kolmogorov-Smirnov ed energy distance fra ere, PSI
delle feature fra prima e dopo il 2020.

## In breve

1. **Il feed cambia nel 2011–2014.** Prima la reazione alla news su
   Dukascopy era lenta e sporca. Per questo il protocollo ha fatto partire
   il regime principale a luglio 2013, **prima** di guardare qualunque
   risultato.
2. **La M1 della news è diventata molto più grande**, e i costi pesano
   sempre meno: 0,86 R per trade sul CPI nel 2014–19, 0,44 R nel 2023–26.
3. **Il contesto macro dopo il 2020 è fuori dal campo visto nella
   scoperta.** Inflazione, salari, partecipazione e pendenza della curva
   hanno valori mai visti nel 2013–19. Una regola che dice «salari sopra
   0,2%» impara soglie che dopo il 2020 significano un'altra cosa.
4. **Nessun sottoregime tradabile trovato.** Nessuna regola e nessun
   modello regge fuori campione in nessuna era (vedi `FINAL-EDGE-REPORT.md`).

## 1. Il feed: quanto velocemente reagisce

| Serie | CPI | NFP |
|---|---|---|
| La direzione dei primi 5 s è quella di fine minuto (quota) | 0,08 fino a marzo 2011 → **0,80** dopo | 0,25 fino al 2013 → **0,82** dal gennaio 2014 |
| Quota del range raggiunta nei primi 15 s | 0,22 (fino al 2010) → 0,49 → **0,79** dal settembre 2013 | 0,22 → **0,84** dal dicembre 2013 |

Prima di queste date il prezzo "arriva" alla news in ritardo: non è il
mercato che reagisce piano, è il feed che era diverso. Le etichette di quel
periodo non sono confrontabili con quelle di oggi.

## 2. Quanto è grande la M1 della news

Rapporto fra il range della M1 della news e quello della stessa M1 nei
giorni senza news (mediane per segmento):

| CPI | ×2,0 fino al 2015 | ×6,8 2016–2018 | ×3,4 fine 2018–metà 2022 | **×9,0** da luglio 2022 |
|---|---|---|---|---|
| **NFP** | ×2,5 fino a marzo 2013 | **×13,1** 2013–2017 | ×6,7 da novembre 2017 | |

Range mediano della prima M1 CPI: 2,57 $ nel 2013–19, 13,26 $ nel 2023–26.

Differenze fra ere (KS sul log del rapporto): CPI 2013–19 contro 2020–22
**non** diverse (p 0,66); 2020–22 contro 2023–26 diverse (p 0,002). NFP:
tutte le ere diverse fra loro (p < 0,001).

## 3. Lo spread

| | CPI | NFP |
|---|---|---|
| Spread all'ultimo tick prima della news (bp, mediana per segmento) | 4,6 → 3,8 → 2,7 (2017–22) → 4,4 → **9,4** (mag 2024–apr 2025) → 4,2 | 5,3 → 8,1 → 4,1 → 6,8 (da marzo 2024) |
| Spread massimo dentro la M1 (bp) | 6,8 fino a settembre 2022 → **17,0** dopo | 4,7 → … → **19,6** da maggio 2024 |

Lo spread dentro il minuto della news è raddoppiato dal 2022, però il
movimento è cresciuto di più. Per questo il costo in R scende.

## 4. Costi e tetto per era (costi base, stop 0,60 U_news)

"Costo" = quanto si perde in media aprendo LONG e SHORT insieme sullo
stesso evento. "Oracolo" = R medio di chi conosce in anticipo il lato
migliore (vedi `STOP-MAE-MFE-ANALYSIS.md`).

| Famiglia | Era | Eventi | Sempre LONG | Sempre SHORT | Costo | Oracolo |
|---|---|---|---|---|---|---|
| CPI | 2008–13 | 71 | −2,25 | −2,50 | 2,38 | −2,02 |
| CPI | 2014–19 | 71 | −0,76 | −0,96 | 0,86 | 0,23 |
| CPI | 2020–22 | 35 | −0,57 | −0,35 | 0,46 | 0,63 |
| CPI | 2023–26 | 44 | +0,05 | −0,93 | 0,44 | 0,64 |
| NFP | 2008–13 | 71 | −1,07 | −1,21 | 1,14 | −0,37 |
| NFP | 2014–19 | 71 | −0,41 | −0,41 | 0,41 | 0,69 |
| NFP | 2020–22 | 35 | −0,29 | −0,31 | 0,30 | 0,81 |
| NFP | 2023–26 | 42 | −0,34 | −0,06 | 0,20 | 1,06 |

Il "sempre LONG" sul CPI 2023–26 a +0,05 R è il mercato rialzista
dell'oro. È osservato a posteriori su un periodo già esposto, non è
significativo e non è un segnale.

## 5. Il contesto cambia: deriva delle feature (PSI, prima e dopo il 2020)

Un PSI sopra 0,25 è già un cambiamento forte. Le feature più spostate
sono livelli macro e di curva:

| Feature | PSI CPI | PSI NFP |
|---|---|---|
| giorni dall'ultima sorpresa core PCE | 8,2 | 8,2 |
| salari, variazione annua (ultimo) | 6,5 | 6,6 |
| nowcast core CPI | 5,8 | — |
| partecipazione | 5,7 | 5,6 |
| core CPI annuo | 4,5 | 4,5 |
| disoccupazione, variazione 12 mesi | 4,3 | 4,2 |
| pendenza 2s10s | — | 4,5 |
| 2Y − 3M | — | 3,5 |

(Il primo della lista è un artefatto di calendario: dal 2020 la PCE esce
in giorni diversi rispetto al CPI.)

Conseguenza pratica: le regole che usano soglie su livelli macro imparano
dal 2013–19 un mondo con inflazione bassa e tassi a zero. Dopo il 2020
quelle soglie cadono in un'altra parte della distribuzione. È una delle
ragioni per cui le regole candidate non reggono fuori campione. I segnali
costruiti come **sorprese** o **variazioni** normalizzate derivano molto
meno.

## 6. Cosa se ne ricava per un sistema adattivo

- Il regime del **feed** e quello dei **costi** si misurano bene e
  cambiano lentamente: il sistema li monitora (Data health) e l'unità di
  stop `U_news` si adatta da sola (è la mediana delle ultime 6 reazioni).
- Il regime **direzionale** (quale lato vince) non si è lasciato prevedere
  né con finestre mobili né con pesi di recenza: nella griglia dei modelli
  le tre adattività hanno tutte t mediano negativo (vedi
  `CROSS-EVENT-RESULTS.md`).
