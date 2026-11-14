# Dove si fa stat arb e relative value: mappa con fonti

Aggiornato 2026-11-14. Ogni numero ha un URL che ho visto davvero; dove non l'ho trovato lo dico. Le valutazioni sull'accessibilità sono mie.

## Classifica per un privato italiano (IBKR Ireland)

1. Futures: spread di calendario e inter-commodity (micro-contratti, margini di spread) - accessibilità: **alto**
2. Azioni: coppie/stat arb semplici su titoli liquidi - accessibilità: **medio**
3. Cambi: carry (non arbitraggio) - accessibilità: **medio**
4. Opzioni/volatilità: solo con rischio definito - accessibilità: **medio**
5. Crypto basis e cross-exchange - accessibilità: **basso**
6. ETF vs paniere - accessibilità: **basso**
7. Reddito fisso RV / basis Treasury - accessibilità: **no**

Nota IBKR Ireland: molti ETF USA non sono acquistabili da clienti retail UE senza KID (PRIIPs). IBKR indica ETF europei equivalenti o CFD come alternative ([fonte](https://ibkb.interactivebrokers.com/de/node/3324)).

## Classi di attivo

### Azioni: coppie, stat arb fattoriale (PCA), market-neutral
- **Come:** Si comprano e si vendono allo scoperto titoli simili (coppie dello stesso settore) oppure interi panieri neutrali rispetto a fattori/ETF di settore (residui di una PCA), scommettendo che lo scarto torni a zero. Gatev et al. abbinano i titoli per distanza minima tra prezzi normalizzati e aprono quando lo scarto supera 2 deviazioni standard.
- **Da dove viene l'edge:** Ritorno a media di breve termine di titoli sostituti stretti; piccoli errori di prezzo temporanei. Gli autori dicono che non è spiegato dai fattori di rischio convenzionali.
- **Orizzonte:** Da giorni a poche settimane (coppie); intraday-giorni per la stat arb fattoriale.
- **Leva:** Self-financing long/short; leva lorda tipica di fondi: non verificata. Per il privato il vincolo è il margine di Reg T / portfolio margin, non la leva.
- **Dati:** Prezzi giornalieri o intraday di migliaia di titoli, dati settoriali/fattoriali, costi di prestito titoli.
- **Chi lo fa:** Hedge fund quantitativi e desk proprietari; coppie semplici anche da privati.
- **Accessibile al privato:** medio. Tecnicamente fattibile con IBKR (azioni europee/USA, short con prestito titoli), ma i profitti documentati sono scesi molto dopo il 2002 e dopo i costi restano piccoli; costi di borrow e commissioni mangiano l'edge su basket larghi. Valutazione mia, basata sui numeri accademici sotto.
- **Fonti:** [Gatev, Goetzmann, Rouwenhorst (RFS 2006), abstract](https://econpapers.repec.org/RePEc:oup:rfinst:v:19:y:2006:i:3:p:797-827); [Avellaneda e Lee, Statistical arbitrage in the U.S. equities market (2010)](https://econpapers.repec.org/RePEc:taf:quantf:v:10:y:2010:i:7:p:761-782)

### ETF contro paniere sottostante (creazione/rimborso, authorized participant)
- **Come:** Gli authorized participant creano o rimborsano quote ETF in cambio del paniere, e questo tiene il prezzo vicino al NAV. Quando prezzo e NAV divergono si compra il lato economico e si vende l'altro.
- **Da dove viene l'edge:** Petajisto trova che i prezzi ETF possono scostarsi dal NAV entro una banda di circa 200 punti base; circa 100 punti base dopo aver corretto per prezzi sottostanti non aggiornati, con scostamenti maggiori per ETF internazionali o illiquidi. Il guadagno dipende dal lato creazione/rimborso, riservato agli AP.
- **Orizzonte:** Da intraday a pochi giorni.
- **Leva:** Bassa-moderata; conta il capitale per tenere il paniere e il suo finanziamento.
- **Dati:** NAV intraday indicativo (iNAV), prezzi dei componenti in tempo reale, composizione del paniere.
- **Chi lo fa:** Market maker e authorized participant (banche, grandi desk).
- **Accessibile al privato:** basso. Il privato non può creare/rimborsare quote: può solo tradare lo scarto ETF-vs-simili, in competizione con chi lo fa a latenza minima. L'abstract di Petajisto parla di extra-rendimenti prima dei costi; l'esito netto non l'ho potuto verificare. Inoltre da IBKR Ireland molti ETF USA non sono tradabili da retail senza KID (PRIIPs).
- **Fonti:** [Petajisto, Inefficiencies in the pricing of ETFs (FAJ 2017)](https://econpapers.repec.org/RePEc:taf:ufajxx:v:73:y:2017:i:1:p:24-54); [IBKR: PRIIPs overview](https://ibkb.interactivebrokers.com/de/node/3324)

### Futures: spread di calendario, spread inter-commodity, basis indice-contante
- **Come:** Calendar spread: lungo una scadenza, corto un'altra dello stesso sottostante (carry/curva). Inter-commodity: es. crack (petrolio/raffinati) e crush (soia/farina/olio). Basis indice: future contro paniere azionario (cash-and-carry).
- **Da dove viene l'edge:** Premio di carry e di forma della curva, stagionalità, vincoli di stoccaggio/domanda di copertura. Koijen et al. mostrano che il carry predice i rendimenti in molte classi (azioni, obbligazioni, materie prime, valute, credito, opzioni) e che non è spiegato interamente da rischi noti; ha drawdown nelle recessioni e crisi di liquidità.
- **Orizzonte:** Da giorni a mesi (calendar), fino alla scadenza (basis).
- **Leva:** Implicita nei margini del future; gli spread hanno margine ridotto. IBKR: chi tiene posizioni opposte su scadenze diverse ottiene spesso un margine di spread inferiore alla somma delle singole gambe; il beneficio si riduce vicino alla scadenza.
- **Dati:** Curve complete dei futures, costi di stoccaggio/dividendi/tassi, calendario di roll.
- **Chi lo fa:** CTA, fondi macro/commodity, desk di trading, arbitraggisti dell'indice.
- **Accessibile al privato:** alto. I margini di spread sono riconosciuti dalle borse (SPAN/CME) e IBKR li applica; esistono micro-contratti per ridurre la dimensione; si va corti senza prestito titoli. Limiti: i crediti inter-commodity dipendono dalle regole della borsa (percentuali non verificate per IBKR Ireland), liquidità delle scadenze lontane, rischio roll. Classifica: la più accessibile.
- **Fonti:** [IBKR: margini sugli spread di futures (tag futures)](https://ibkb.interactivebrokers.com/tag/futures); [CME Group: Scanning Based Spreads](https://www.cmegroup.com/solutions/risk-management/margin-services/spread-calc.html); [Koijen, Moskowitz, Pedersen, Vrugt, Carry (JFE 2018)](https://econpapers.repec.org/RePEc:eee:jfinec:v:127:y:2018:i:2:p:197-225)

### Reddito fisso RV: on-the-run/off-the-run, basis cash-future sui Treasury, swap spread
- **Come:** Basis trade: si compra un Treasury consegnabile, finanziato in repo, e si vende il future corrispondente; il profitto è F - P(1+r)T. Altre varianti: on-the-run contro off-the-run, swap spread.
- **Da dove viene l'edge:** La basis è di norma minuscola e converge alla scadenza; l'OFR la descrive come un obbligo sintetico (T-bill) più un premio al rischio per margine, rollover e liquidità, positivo in media ma variabile e negativo in stress.
- **Orizzonte:** Settimane-mesi, fino alla consegna del future.
- **Leva:** Estrema e necessaria perché lo scarto è piccolo. Dato Fed (Form PF, dicembre 2022): leva effettiva sul repo Treasury 56 a 1 ($553 mld di repo su $9,88 mld di capitale); il 73,8% dei prestiti repo a haircut zero o negativo. Con un haircut minimo ipotetico del 200 bp scenderebbe a circa 25 a 1. Non ho trovato una fonte primaria per la cifra '50-100x'.
- **Dati:** Curve Treasury, prezzi CTD/conversion factor, tassi repo, margini dei future.
- **Chi lo fa:** Hedge fund relative value con prime brokerage e repo bilaterale/cleared; dealer.
- **Accessibile al privato:** no. Senza repo a haircut quasi nullo il rendimento della basis non copre il costo del capitale; il privato non ha accesso al repo né al prime brokerage. Resta solo l'esposizione indiretta tramite fondi/ETF. Classifica: inaccessibile.
- **Fonti:** [OFR Brief 20-01, Basis trades and Treasury market illiquidity (2020)](https://www.financialresearch.gov/briefs/files/OFRBr_2020_01_Basis-Trades.pdf); [Fed FEDS Note, Hedge fund Treasury exposures, repo and margining (2023)](https://www.federalreserve.gov/econres/notes/feds-notes/hedge-fund-treasury-exposures-repo-and-margining-20230908.html); [Fed FEDS Note, Quantifying Treasury cash-futures basis trades (2024)](https://www.federalreserve.gov/econres/notes/feds-notes/quantifying-treasury-cash-futures-basis-trades-20240308.html)

### Cambi: triangolare, cross-rate, panieri carry
- **Come:** Arbitraggio triangolare/cross-rate: incongruenze tra tre coppie di cambi. Carry basket: lungo valute ad alto tasso, corto a basso tasso.
- **Da dove viene l'edge:** Triangolare: errori di quotazione di millisecondi, oggi quasi nulli. Carry: premio per il rischio di crash (Koijen et al. includono le valute tra le classi con carry predittivo).
- **Orizzonte:** Triangolare: millisecondi. Carry: mesi.
- **Leva:** Alta sui cambi (margine) ma la triangolare richiede latenza bassissima. Cifre specifiche: non verificate.
- **Dati:** Quotazioni tick multi-venue (triangolare); tassi a breve e forward (carry).
- **Chi lo fa:** Market maker bancari e HFT (triangolare); fondi macro e CTA (carry).
- **Accessibile al privato:** medio. Triangolare: no (latenza, spread del broker, nessuna fonte consultata sul punto). Carry: sì, ma è un premio di rischio con code pesanti, non un arbitraggio. Valutazione mia. Il carry cross-asset è documentato in Koijen et al.
- **Fonti:** [Koijen, Moskowitz, Pedersen, Vrugt, Carry (JFE 2018)](https://econpapers.repec.org/RePEc:eee:jfinec:v:127:y:2018:i:2:p:197-225)

### Opzioni e volatilità: implicita contro realizzata, dispersione
- **Come:** Vendere volatilità implicita quando supera la realizzata; dispersione: corto opzioni sull'indice, lungo opzioni sui componenti.
- **Da dove viene l'edge:** Premio al rischio di varianza e premio di correlazione. Nessuna fonte consultata in questa ricerca: descrizione di conoscenza generale, NON verificata.
- **Orizzonte:** Settimane-mesi (a scadenza dell'opzione).
- **Leva:** Non verificata; il margine sulle opzioni corte è alto e variabile.
- **Dati:** Superfici di volatilità, dati intraday per la volatilità realizzata, correlazioni.
- **Chi lo fa:** Hedge fund di volatilità/relative value, market maker. HFR include un indice dedicato (HFRI RV: Volatility).
- **Accessibile al privato:** medio. Strumenti disponibili su Eurex/CBOE tramite IBKR, ma la dispersione richiede decine di gambe e costi elevati; la vendita di vol nuda ha rischio di coda illimitato. Valutazione mia, non sostenuta da una fonte accademica letta qui.
- **Fonti:** [HFR Flash Dec 2024 (cita l'indice HFRI RV: Volatility)](https://hfr-wp-s3.s3.amazonaws.com/wp-content/uploads/2025/01/08164759/2024.12_HFRI-Flash-1.pdf)

### Crypto: basis, funding, cross-exchange
- **Come:** Cash-and-carry: lungo spot, corto future/perpetuo, incassando la differenza o il funding. Cross-exchange: stessa moneta, prezzi diversi tra piattaforme.
- **Da dove viene l'edge:** BIS WP 1087: il carry sui future di Bitcoin ed Ether supera in media il 10% annuo e arriva fino a punte del 40-60%; secondo gli autori nasce da domanda di leva da investitori piccoli e dalla scarsità di capitale arbitraggista per attriti regolamentari e di margine. Carry alto precede crash.
- **Orizzonte:** Settimane-mesi (basis); minuti (cross-exchange).
- **Leva:** Moderata sul perpetuo; il rischio è la liquidazione per margine sulla gamba corta.
- **Dati:** Prezzi spot/future per venue, funding rate, saldi sulle piattaforme.
- **Chi lo fa:** Hedge fund crypto, market maker, desk proprietari.
- **Accessibile al privato:** basso. Per un residente UE tramite IBKR Ireland l'accesso a future/perpetui crypto per retail è limitato (non verificato qui) e l'operatività richiede conti su più exchange con rischio controparte. L'edge è reale ma comprimibile e con rischio piattaforma.
- **Fonti:** [BIS Working Paper 1087, Crypto carry](https://www.bis.org/publ/work1087.pdf)

## Rendimenti documentati

| Cosa | Periodo | Valore | Verificato | Note | Fonte |
|---|---|---|---|---|---|
| HFRI EH: Equity Market Neutral, ritorno annuo | 2023 | +5,97% | si | Tabella mensile HFR (valore annuale, dato 2024-08-15, soggetto a revisione). | [link](https://mondovisione.com/_assets/files/HFR-Media-Reference-Guide-2024.08.15.pdf) |
| HFRI EH: Equity Market Neutral, ritorno annuo | 2022 | +1,21% | si | Stessa fonte. | [link](https://mondovisione.com/_assets/files/HFR-Media-Reference-Guide-2024.08.15.pdf) |
| HFRI EH: Equity Market Neutral, ritorno annuo | 2021 | +7,05% | si | Stessa fonte. | [link](https://mondovisione.com/_assets/files/HFR-Media-Reference-Guide-2024.08.15.pdf) |
| HFRI EH: Equity Market Neutral, ritorno annuo | 2020 | -0,11% (primo trimestre -3,45%) | si | Stessa fonte. | [link](https://mondovisione.com/_assets/files/HFR-Media-Reference-Guide-2024.08.15.pdf) |
| HFRI EH: Equity Market Neutral, ritorno annuo | 2019 / 2018 / 2017 | +2,33% / -0,98% / +4,88% | si | Stessa fonte. Media aritmetica semplice 2017-2023 (7 anni): circa 2,9% annuo, calcolo mio sui valori annuali elencati: 4,88-0,98+2,33-0,11+7,05+1,21+5,97 = 20,35, diviso 7 = 2,9%. | [link](https://mondovisione.com/_assets/files/HFR-Media-Reference-Guide-2024.08.15.pdf) |
| HFRI Relative Value (Total), ritorno annuo | 2023 / 2022 / 2021 | +6,95% / -0,68% / +7,59% | si | Stessa fonte. | [link](https://mondovisione.com/_assets/files/HFR-Media-Reference-Guide-2024.08.15.pdf) |
| HFRI Relative Value (Total), ritorno annuo | 2020 (marzo 2020 -9,77%, primo trimestre -10,30%) | +3,38% | si | Mostra il crollo e il recupero nello stesso anno. Stessa fonte. | [link](https://mondovisione.com/_assets/files/HFR-Media-Reference-Guide-2024.08.15.pdf) |
| HFRI Relative Value (Total), ritorno annuo | 2019 / 2018 | +7,42% / -0,43% | si | Stessa fonte. | [link](https://mondovisione.com/_assets/files/HFR-Media-Reference-Guide-2024.08.15.pdf) |
| HFRI 2024 (stima HFR a 8 gen 2025) | 2024 | Relative Value Total: 14 mesi consecutivi di guadagno a dicembre; RV Yield Alternatives +11,3%; Equity Market Neutral +0,5% a dicembre (anno intero non riportato) | parziale | Il valore annuo 2024 di EMN e RV Total non compare nel testo che ho potuto leggere. | [link](https://hfr-wp-s3.s3.amazonaws.com/wp-content/uploads/2025/01/08164759/2024.12_HFRI-Flash-1.pdf) |
| HFRI indici Equity Market Neutral / RV / FI Arbitrage: rendimento annualizzato dal 1990 e ultimo decennio | 1990-oggi | NON OTTENUTO | parziale | I dati annualizzati per sotto-strategia sono dietro il login/accettazione termini di HFR. Non ho trovato un valore verificabile e non lo invento. Eurekahedge, Credit Suisse/Wilshire e Barclay non consultati. | [link](https://www.hfr.com/indices/) |
| Coppie su azioni USA (Gatev, Goetzmann, Rouwenhorst) | 1962-2002 | Rendimenti in eccesso annualizzati fino all'11% per portafogli self-financing; profitti 'tipicamente superiori' a stime prudenti dei costi | si | La versione NBER su 1962-1997 diceva fino al 12%. Cifra 'fino a', dei portafogli migliori. | [link](https://econpapers.repec.org/RePEc:oup:rfinst:v:19:y:2006:i:3:p:797-827) |
| Coppie (Do e Faff, FAJ 2010) | 1962-2009 | Circa 1% al mese nella letteratura precedente; 0,24% al mese nel 2003-2009 | parziale | Profitti in calo; il fattore hedge fund spiega solo in parte il calo. Fonte: riassunto del sito Bond University/CFA, non il testo integrale. | [link](https://research.bond.edu.au/en/publications/does-simple-pairs-trading-still-work/) |
| Coppie con costi (Do e Faff, 2012 J. Financial Research) | fino al 2009 | Circa 30 punti base al mese corretti per rischio dopo commissioni, impatto e short fee, solo per coppie ben abbinate in gruppi industriali ristretti; pairs trading in gran parte non profittevole dopo il 2002 | parziale | Fonte secondaria (riassunto di ricerca), testo non letto. | [link](https://research.bond.edu.au/en/publications/does-simple-pairs-trading-still-work/) |
| Coppie: distanza, cointegrazione, copula (Rad, Low, Faff, Quantitative Finance 2016) | 1962-2014 | Eccesso medio mensile lordo 91, 85, 43 bp; netto dei costi 38, 33, 5 bp (distanza, cointegrazione, copula) | si | Opportunità di trading in calo del 40% e 35% tra 2007-2011 e 2012-2014 per distanza e cointegrazione. Fonte: abstract via EconPapers/ricerca. | [link](https://econpapers.repec.org/RePEc:taf:quantf:v:16:y:2016:i:10:p:1541-1558) |
| Stat arb PCA/ETF (Avellaneda e Lee 2010) | 1997-2007 | Sharpe annuo medio 1,44 (PCA) dopo i costi; circa 0,9 nel 2003-2007; ETF circa 1,1 | parziale | Numeri discordanti tra versioni (working paper vs. pubblicata): da leggere con cautela. | [link](https://econpapers.repec.org/RePEc:taf:quantf:v:10:y:2010:i:7:p:761-782) |
| Carry crypto (BIS WP 1087) | Bitcoin/Ether, vari anni fino al 2025 | Carry medio sopra il 10% annuo; punte fino al 40-60% | parziale | Fonte primaria BIS. Il tetto cambia tra pagina riassuntiva (40%) e testo (60%). | [link](https://www.bis.org/publ/work1087.pdf) |
| Leva effettiva sul repo Treasury degli hedge fund (Fed) | dicembre 2022 | 56 a 1 ($553 mld di repo su $9,88 mld di capitale); 25 a 1 con haircut minimo ipotetico 200 bp | si | Dati Form PF. Il 73,8% del repo a haircut zero o negativo. La cifra '50-100x' non è stata trovata come tale: il 56x è il numero verificato più vicino. | [link](https://www.federalreserve.gov/econres/notes/feds-notes/hedge-fund-treasury-exposures-repo-and-margining-20230908.html) |
| Dimensione della basis trade (Fed 2024) | gen 2024 | Proxy TRACE $317 mld; picco stimato $352 mld a novembre 2023; short sui future dei fondi a leva $991 mld (CFTC) | si | I $991 mld sono sovrastima della basis. | [link](https://www.federalreserve.gov/econres/notes/feds-notes/quantifying-treasury-cash-futures-basis-trades-20240308.html) |
| LTCM | 1994-1997 | Rendimenti 20% (1994), 43% (1995), 41% (1996), 17% (1997); leva circa 30 a 1 a fine 1997 | si | Poi perse il 44% nel solo agosto 1998. | [link](https://www.federalreservehistory.org/essays/ltcm-near-failure) |

## Eventi di rischio

- **1998** - LTCM: fondo di relative value con circa 30 dollari di debito per 1 di capitale a fine 1997; perse il 44% in agosto 1998. Il 23 settembre 1998 quattordici banche e broker investirono circa $3,6 mld sotto regia della New York Fed per il 90% della proprietà. *Lezione:* Un edge piccolo amplificato dalla leva sopravvive finché i prezzi convergono; la convergenza può arrivare dopo il fallimento. La liquidità sparisce quando serve. ([fonte](https://www.federalreservehistory.org/essays/ltcm-near-failure))
- **2007** - Quant quake di agosto: perdite dei fondi long/short azionari quantitativi nella settimana del 6 agosto. Khandani e Lo attribuiscono la causa a deleveraging di portafoglio a luglio e inizio agosto e al ritiro temporaneo del capitale di market making dall'8 agosto; due 'unwind' l'1 e il 6 agosto (conclusioni definite speculative dagli autori). *Lezione:* Le stat arb affollate sono correlate tra loro: il rischio non è il titolo, è che gli altri liquidino le stesse posizioni. ([fonte](https://econpapers.repec.org/RePEc:nbr:nberwo:14465))
- **2020** - Marzo 2020: stress sul mercato Treasury; i fondi svolsero rapidamente le basis trade dopo grosse perdite, margini sui future a livelli record. Secondo la Fed, gli hedge fund vendettero circa $173 mld di Treasury. Nei dati HFR, RV Total fece -9,77% a marzo 2020 e chiuse l'anno +3,38%. *Lezione:* Il rendimento della basis è un compenso per rischio di margine e rollover. L'OFR sostiene che lo stress sulla basis non sembra aver amplificato l'illiquidità; è un punto discusso. ([fonte](https://www.financialresearch.gov/briefs/files/OFRBr_2020_01_Basis-Trades.pdf))

## Capacità e dimensione

Prove documentate, in parte solo indirette. (1) Gli edge di stat arb su azioni si sono erosi con la concorrenza: Do e Faff mostrano che i profitti delle coppie sono scesi da circa l'1% mensile a 0,24% mensile nel 2003-2009; Rad, Low e Faff trovano che le opportunità sono calate del 40% e 35% tra 2007-2011 e 2012-2014 e che il netto dei costi è tra 5 e 38 punti base mensili; Avellaneda e Lee vedono lo Sharpe PCA scendere da 1,44 (media 1997-2007) a circa 0,9 nel 2003-2007. (2) Sulla scala: Pastor, Stambaugh e Taylor trovano nei fondi comuni USA che la capacità di battere i benchmark scende con le dimensioni del fondo perché i grandi ordini muovono i prezzi, con stime a livello di fondo più deboli quando si correggono i bias econometrici (risultato su fondi comuni, non hedge fund; sul dettaglio non ho letto il testo integrale). Un riassunto non verificato nel risultato di ricerca cita che i piccoli hedge fund superano i grandi del 2,75% annuo: autore non identificato, da non usare come prova. (3) A favore del piccolo: nel carry crypto gli autori BIS indicano la carenza di capitale arbitraggista per attriti di margine e regolamentari, ma questo non è un vantaggio per il privato, che affronta gli stessi attriti. (4) Contro il piccolo: le evidenze lette su costi, borrow e latenza sono indirette. Do e Faff correggono per commissioni, impatto e short fee e il profitto crolla; Petajisto descrive scostamenti ETF di 100-200 punti base catturabili da chi ha il canale creazione/rimborso; il privato non ha repo (leva Fed 56 a 1 sul repo) né prime brokerage. Non ho trovato evidenza diretta e quantificata su borrow fee per il dettaglio né sulla latenza: quella parte resta non verificata. Conclusione operativa mia: la capacità libera esiste solo in nicchie piccole e illiquide, ma sono le stesse dove costi, spread e borrow sono peggiori.

## Cosa manca

- Rendimenti annualizzati lunghi (dal 1990, ultimo decennio) degli indici HFRI Equity Market Neutral, Relative Value, Fixed Income Arbitrage: dietro login HFR, non ottenuti. Nessun dato Eurekahedge/Barclay/Wilshire.
- Cifra '50-100x' di leva sulla basis trade: non trovata come tale; verificato 56 a 1 (Fed, dic 2022).
- Percentuali esatte dei crediti di margine inter-commodity per clienti IBKR Ireland e disponibilità dei micro-futures per retail UE: da confermare con IBKR.
- Fonti per cambi triangolari, dispersione e arbitraggio indice-contante: non consultate.
