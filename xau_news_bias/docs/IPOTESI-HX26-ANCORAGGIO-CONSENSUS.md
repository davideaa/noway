# H-X26 — Ancoraggio: la sorpresa si può prevedere dal consensus contro il dato precedente? (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare qualunque risultato. Fino a
qui ho solo contato i dati: righe ForexFactory per titolo, slot rossi con
i tick in cache (2257 su 2268 dal 2008; gli 11 mancanti sono release
future, dopo il 16/10/2026), CPI/NFP con tick (370 su 442 in
`cpi_nfp.parquet`; mancano il 2008–2010 e il CPI del 14/10/2026).

## L'idea, detta semplice

Gli economisti che fanno la previsione (il "forecast") tendono a restare
attaccati al dato del mese prima. Se il mese scorso le vendite sono state
+0,2% e quest'anno pensano +0,6%, scrivono +0,4%: si fermano a metà
strada. Allora quando il forecast sale rispetto al dato precedente, il
dato vero tende a uscire **ancora più su** del forecast.

Regola: `segno(actual − forecast)` = `segno(forecast − actual precedente)`.

Fonte: Campbell & Sharpe, *Anchoring Bias in Consensus Forecasts and Its
Effect on Market Prices*, JFQA 44(2), 2009 (FEDS 2007-12). Sui sondaggi
MMS 1990–2006 trovano l'ancoraggio **e** che i rendimenti dei Treasury
reagiscono solo alla parte imprevedibile della sorpresa: il mercato lo
sconta già. Quindi l'attesa è che il meccanismo (T1) possa reggere e
l'oro (T2) no.

## Attenzione: per CPI e NFP il test NON è nuovo

- In fase 2 la famiglia CONSENSUS (`FEATURE-REGISTRY.md`) conteneva già
  "forecast meno dato precedente": `f_cons_cpi_minus_last`,
  `f_cons_core_cpi_minus_last`, `f_cons_cpi_yoy_minus_last`,
  `f_cons_cpi_minus_prev`, `f_cons_core_minus_prev`,
  `f_cons_yoy_minus_prev`, `f_cons_nfp_minus_last`, `f_cons_ur_minus_last`,
  `f_cons_ahe_minus_last` (costruite in `xnb/phase2/memory.py`, con la
  prima stampa precedente, non la colonna `previous`). Sono passate dentro
  le 4,66 milioni di regole e i modelli: non è sopravvissuto niente.
- Per le altre famiglie rosse (Retail, PPI, PIL, ISM, ADP, Fiducia,
  Michigan, Claims, FOMC) la regola non è mai stata provata, ma i loro
  anni 2019–2026 (e per Retail/PPI tutto il 2011–2026) sono già stati
  guardati in H-X15, H-X16, H-X18, H-X19.
- Quindi anche se passa, il massimo è **"da registrare dal vivo"**.

## Dati

- **Storico**: `data/cache/consensus/forexfactory_calendar.csv`, righe USD,
  qualunque impatto, con `actual` e `forecast` numerici
  (`hx15_build.num()`), release dal 2008-01-01 al 16/10/2026. Doppioni
  (stesso titolo, stesso minuto) tolti, si tiene il primo.
- **Dato precedente** = l'`actual` della riga precedente **dello stesso
  titolo** con actual numerico. La colonna `previous` (rivista, uscita
  insieme al dato) **non si usa**. Si riporta solo, come controllo, quante
  volte coincide con l'actual precedente.
- **Titoli (uno per famiglia)**:

| Gruppo | Titolo FF | Oro: dato sopra il forecast è |
|---|---|---|
| FOMC | Federal Funds Rate | male (−1) |
| RETAIL | Retail Sales m/m | male |
| PPI | PPI m/m | male |
| PIL | Advance GDP q/q, Prelim GDP q/q, Final GDP q/q (ognuno con il suo precedente) | male |
| ISM_M | ISM Manufacturing PMI | male |
| ISM_S | ISM Services PMI | male |
| ADP | ADP Non-Farm Employment Change | male |
| FIDUCIA | CB Consumer Confidence | male |
| MICHIGAN | Prelim UoM Consumer Sentiment | male |
| CLAIMS | Unemployment Claims | **bene (+1)** |
| CPI | CPI m/m | male |
| CORE_CPI | Core CPI m/m | male |
| NFP | Non-Farm Employment Change | male |

  VERBALI non ha numeri: escluso. Orientamento come `hx15_build.py`.
- **Confronto numerico**: uno scarto con |x| < 1e-9 vale 0.

## Cosa si misura

1. **T1, il meccanismo**: previsione `p = segno(forecast − precedente)`,
   sorpresa `s = segno(actual − forecast)`.
   - Si contano solo le release con p ≠ 0 e s ≠ 0. Le release in linea
     (s = 0) e quelle senza previsione (p = 0) si riportano a parte.
   - Quota giusta per gruppo e su tutto insieme (ogni release di ogni
     titolo conta una volta; CPI e Core CPI contano entrambi).
2. **T2, l'oro**: uno slot per orario.
   - Slot rossi di `calendario_tutti.parquet` (titolo della famiglia dello
     slot, alla stessa ora, qualunque impatto) più gli slot CPI (titolo
     **CPI m/m**) e NFP presi dal FF.
   - Direzione attesa dell'oro = `p × orientamento`. Si conta solo se ≠ 0.
   - Direzione vera = segno della mid a T0+60 s meno l'ultima mid prima
     di T0 (definizione di `hx15_build.slot_row`). Validità: ultimo tick
     prima di T0 entro 2 minuti e almeno 5 tick nel primo minuto. Se il
     movimento è 0, lo slot si toglie.
   - Tick: la cache `data/p2_cache/hx15` (`hx19_tp.ticks`); quelli
     mancanti si scaricano con `hx18_inversione.fetch_retry`.
3. **T3, il trade di Davide**, in R, sugli slot di T2:
   - ingresso a T0 − 30 s, all'ask se LONG e al bid se SHORT (ultimo tick
     ≤ −30 s, non più vecchio di 2 minuti);
   - stop 100 pips ($10), perdita massima −1 R;
   - spread Dukascopy limitato a 40 pips (`quotes(...,'S1')`);
   - uscita a T0 + 60 s e anche a T0 + 5 min (`hx19_tp.sim`);
   - confronto con la **direzione a caso** = media di LONG e SHORT sulle
     stesse release; si riporta lo scarto regola − caso con la sua t.
4. Quote: binomiale **unilaterale** contro il 50%. R: media, deviazione
   standard, t.

## Periodi e criterio

- **Studio**: 2011-01 → 2018-12. **Conferma**: 2019-01 → 2026-10
  (fino all'ultima release con actual). Il 2008–2010 si riporta solo come
  descrizione.
- **PASSA** se tutte e tre:
  1. conferma, T1 su tutto insieme: quota > 55% con p < 0,01;
  2. conferma, T2 su tutto insieme: quota > 52% con p < 0,05;
  3. studio: T1 e T2 su tutto insieme entrambi > 50% (stesso verso).
- Se passa ma il trade a 60 s nella conferma non batte il caso (scarto
  ≤ 0) lo si scrive: **"passa ma con lo spread non rende"**.
- Se T1 passa e T2 no, il verdetto è NON PASSA, con la nota "il
  meccanismo c'è, il mercato lo sconta" (come Campbell & Sharpe).

## Solo descrizione, non decide niente

- Quote per gruppo e per anno; trade per gruppo.
- **Nullo di indipendenza** per T1: se in un gruppo la sorpresa è spesso
  dello stesso segno (per esempio Claims sotto le attese per anni) e anche
  il forecast sale spesso, la quota supera il 50% anche senza ancoraggio.
  Si riporta la quota attesa con i due segni indipendenti e un p a
  permutazioni (10 000, p mescolato dentro gruppo × periodo).
- Variante "ultimo valore pubblicato": per il PIL il precedente è l'ultimo
  GDP q/q uscito (Advance → Prelim → Final), per il Michigan l'ultimo fra
  Prelim e Revised UoM Consumer Sentiment.
- Variante CPI con il titolo Core CPI m/m per l'oro.
- Quota prudente di T1, con le release in linea contate come sbagliate.
- Tetto: quota dell'oro usando la sorpresa **vera** invece di quella
  prevista, per sapere quanto vale indovinare la sorpresa.
- Niente filtri su ore o giorni. Niente soglie sullo scarto
  forecast − precedente dopo aver visto i dati.

## Risultati (dopo i commit della pre-registrazione `8ddbb61` e dello script `4ac5552`)

File: `research_output/phase2/hx16/hx26_ancoraggio.json`,
`hx26_release.csv` (una riga per release, T1) e `hx26_slot.csv` (una
riga per slot, T2/T3). Codice: `scripts/hx26_ancoraggio.py`, girato una
volta, senza modifiche dopo il commit. Tick: 73 file mancanti scaricati
(CPI/NFP 2008–2010 e il CPI del 14/10/2026), nessun errore di download.

### Verdetto: NON PASSA

| Criterio | Risultato | |
|---|---|---|
| 1. Conferma, sorpresa indovinata > 55% con p < 0,01 | 612/1215 = **50,4%**, p 0,41 | **no** |
| 2. Conferma, oro indovinato > 52% con p < 0,05 | 424/797 = **53,2%**, p 0,038 | sì |
| 3. Studio, stesso verso | sorpresa 51,7%, oro 53,1% | sì |

Il meccanismo, cioè l'ancoraggio degli economisti, sui dati
ForexFactory 2011–2026 **non c'è** se si guardano tutte le famiglie
insieme. L'oro va nel verso della regola il 53% delle volte in tutti e
due i periodi, ma **non per il motivo dichiarato**: la sorpresa non
viene indovinata. In più quasi tutto il 53% viene dalle Retail Sales
(vedi sotto). Il trade di Davide, con tutte le famiglie, perde in tutti
e due i periodi.

### T1 — la sorpresa si indovina? (quota giusta, binomiale unilaterale)

| Gruppo | Studio 2011–18 | Conferma 2019–26 |
|---|---|---|
| **Tutti** | 652/1261 = 51,7% (p 0,12) | 612/1215 = **50,4%** (p 0,41) |
| RETAIL | 46/78 = 59,0% (p 0,07) | 57/85 = **67,1%** (p 0,001) |
| FIDUCIA | 60/94 = **63,8%** (p 0,005) | 48/92 = 52,2% |
| ISM_S | 54/91 = 59,3% (p 0,05) | 51/90 = 56,7% (p 0,12) |
| MICHIGAN | 46/95 = 48,4% | 52/89 = 58,4% (p 0,07) |
| PIL | 46/80 = 57,5% | 38/70 = 54,3% |
| ISM_M | 53/92 = 57,6% | 40/88 = 45,5% |
| PPI | 37/69 = 53,6% | 34/63 = 54,0% |
| ADP | 49/95 = 51,6% | 47/89 = 52,8% |
| NFP | 53/94 = 56,4% | 42/92 = 45,7% |
| CPI | 25/46 = 54,3% | 24/49 = 49,0% |
| CORE_CPI | 9/29 = **31,0%** | 17/43 = **39,5%** |
| CLAIMS | 174/398 = **43,7%** | 160/363 = **44,1%** |
| FOMC | 0 casi (sempre in linea o nessuna previsione) | 2/2 |

- Claims e Core CPI vanno **al contrario** in tutti e due i periodi.
  Quando il forecast sale rispetto al dato precedente, il dato vero tende
  a uscire sotto il forecast. Le Claims sono il 30% dei casi e tirano giù
  la quota di tutti. Senza Claims, guardando a posteriori, sarebbe 55,4%
  nello studio e 53,1% nella conferma: comunque sotto il 55% richiesto.
- Il nullo di indipendenza dà una quota attesa del 49,3% (studio) e del
  49,1% (conferma). Il p a permutazioni è 0,044 nello studio e 0,21 nella
  conferma.
- Molte release escono in linea, e lì non c'è niente da indovinare: CPI
  35 + 30, Core CPI 19 + 17, FOMC 9 + 19. Contando quelle come sbagliate,
  la quota prudente è 47,5% nello studio e 45,9% nella conferma.
- Campbell & Sharpe trovano l'ancoraggio su quasi tutte le serie MMS
  1990–2006. Qui regge solo nelle Retail Sales (tutti e due i periodi) e,
  a tratti, in Fiducia, ISM Services e Michigan.

### T2 e T3 — l'oro e il trade di Davide

| Gruppo | Oro studio | Oro conferma | R a 60 s regola / caso, studio | R a 60 s regola / caso, conferma |
|---|---|---|---|---|
| **Tutti** | 591/1112 = **53,1%** (p 0,019) | 424/797 = **53,2%** (p 0,038) | −0,020 / −0,033 | −0,024 / −0,049 |
| RETAIL | 50/76 = **65,8%** (p 0,004) | 56/83 = **67,5%** (p 0,001) | **+0,039** / −0,033 | **+0,022** / −0,053 |
| PPI | 26/53 = 49,1% | 30/49 = 61,2% (p 0,08) | −0,032 / −0,030 | −0,001 / −0,065 |
| FIDUCIA | 51/91 = 56,0% | 28/46 = 60,9% (p 0,09) | −0,028 / −0,032 | −0,007 / −0,039 |
| ISM_S | 53/91 = 58,2% | 41/77 = 53,2% | +0,004 / −0,032 | −0,025 / −0,071 |
| PIL | 49/79 = 62,0% (p 0,02) | 33/68 = 48,5% | +0,014 / −0,031 | −0,072 / −0,042 |
| NFP | 50/93 = 53,8% | 47/90 = 52,2% | −0,025 / −0,039 | +0,191 / +0,024 |
| CPI | 40/80 = 50,0% | 41/78 = 52,6% | −0,034 / −0,034 | +0,007 / −0,028 |
| ISM_M | 55/93 = 59,1% (p 0,05) | 35/82 = 42,7% | −0,007 / −0,031 | −0,129 / −0,059 |
| ADP | 44/92 = 47,8% | 39/70 = 55,7% | −0,028 / −0,033 | −0,069 / −0,049 |
| MICHIGAN | 35/75 = 46,7% | 21/37 = 56,8% | −0,046 / −0,032 | −0,059 / −0,065 |
| CLAIMS | 133/280 = 47,5% | 45/96 = 46,9% | −0,037 / −0,033 | −0,095 / −0,073 |
| FOMC | 5/9 | 8/21 = 38,1% | −0,029 / −0,066 | −0,244 / −0,155 |

- Su tutti gli slot, regola meno caso a 60 s: +0,013 R (t 1,78) nello
  studio e +0,024 R (t 1,33) nella conferma. A 5 minuti: +0,014 R
  (t 1,40) e +0,025 R (t 1,23). La regola resta **negativa in assoluto**
  in tutti e due i periodi: −0,020 R e −0,024 R a 60 s, −0,016 R e
  −0,029 R a 5 minuti.
- Lo spread mediano a T0 − 30 s è di 3,8 pips.
- Controllo non pre-registrato: con i due segni indipendenti la quota
  attesa dell'oro sarebbe 49,3% e 49,2%; a permutazioni p 0,006 e 0,010.
  Il 53% quindi non viene da una preferenza LONG o SHORT. **Senza le
  Retail** però scende a 52,2% (541/1036) e a 51,5% (368/714).
- Il tetto: conoscendo la sorpresa **vera**, l'oro la segue il 76,6%
  (studio) e il 78,6% (conferma) delle volte.

### Varianti (solo descrizione)

- **Ultimo valore pubblicato** (PIL a catena, Michigan con il Revised):
  - sorpresa: 51,5% nello studio e 50,6% nella conferma;
  - oro: 52,6% e 53,1%.
  - Il Michigan con il Revised come precedente sale al 63,6% sulla
    sorpresa nella conferma (56/88), ma l'oro resta al 57% (20/35).
- **CPI con il Core** al posto dell'headline:
  - CPI da solo: oro 47,9% nello studio e 49,2% nella conferma;
  - tutti insieme: 53,2% e 53,0%.
- **Per anno**, l'oro con la regola sta fra 41% (2013) e 59% (2014); solo
  4 anni su 16 sono sotto il 50% (2013, 2021, 2023, 2026).

### La cosa che salta fuori: le Retail Sales (esplorativa, NON pre-registrata)

Fra 12 famiglie, l'unica coerente in tutto è **Retail Sales m/m**. Regola:
se il forecast è sopra l'ultimo dato pubblicato, SHORT oro; se è sotto,
LONG.

- Sorpresa: 59% nello studio, 67% nella conferma.
- Oro: 65,8% e 67,5%. Moltiplicando i p per 12 famiglie (Bonferroni)
  restano 0,047 e 0,012.
- Gli anni sopra il 50% sono 13 su 16; il 2018 è sotto (3/10), il 2019 e
  il 2026 sono pari.
- Il trade di Davide a 60 s rende poco: +0,039 R (t 1,57, 58% vinti) e
  +0,022 R (t 0,61, 60% vinti). Sono circa 11 trade l'anno. A 5 minuti:
  +0,029 R e 0,000 R.
- Perché l'R è così basso: la prima M1 Retail muove molto meno dello stop
  da 100 pips, e qualche stop pieno si mangia le vincite piccole (nella
  conferma la mediana è +0,074 R, la media +0,022 R).
- Non è un verdetto. È stata scelta **dopo** aver visto 12 famiglie, e
  le Retail 2011–2026 sono già passate da H-X15/H-X16/H-X19 (con altre
  regole). Se interessa, va **pre-registrata adesso e contata solo dal
  vivo**, dalla release del 17/11/2026.

### Errori e cose da dichiarare

1. **La colonna `previous` di ForexFactory è la cifra rivista**, come
   diceva il compito. Coincide con l'actual precedente sempre per CPI,
   Core CPI, ISM e FOMC, l'84% delle volte per il PPI, il 21% per le
   Claims, il 16% per le Retail, il 5% per il PIL, il 3–4% per ADP,
   Fiducia e Michigan, e solo l'**1,8% per gli NFP**. La riga 60 di
   `FEATURE-REGISTRY.md` e il commento in `xnb/phase2/memory.py`
   (`consensus_features`) dicono che il `previous` FF degli NFP è la prima
   stampa nel 99,5% dei casi: con questo file **non è vero**, oppure la
   frase si riferiva all'`actual`. Sui risultati passati non cambia
   niente: le feature `f_cons_*_minus_last` usavano l'actual precedente,
   non la colonna `previous`. La frase però va corretta.
2. Per CPI e NFP la regola era già nella fase 2 (vedi sopra). Il
   risultato qui è coerente: CPI 50–53%, NFP 52–54%, niente.
3. Le Claims e il Core CPI vanno al contrario dell'ipotesi in tutti e due
   i periodi. Con un test bilaterale sarebbe un effetto. Non era previsto
   e non lo uso.
4. Lo script è stato messo nel commit prima di provarlo. È girato al primo
   colpo e non è stato toccato dopo.
