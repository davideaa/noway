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
