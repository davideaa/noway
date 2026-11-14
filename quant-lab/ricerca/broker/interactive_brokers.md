# Interactive Brokers (IBKR) — condizioni di esecuzione per cliente retail italiano

Data ricerca: 2026-11-14. Ambito: stat-arb, pairs trading, relative value, spread calendario futures, basis crypto.

## Avvertenza metodologica (leggere prima)

- Le pagine ufficiali di interactivebrokers.com / .ie e ibkb.interactivebrokers.com hanno risposto **HTTP 403** al fetch diretto (3 tentativi su URL diversi: commissions.php, ibkb node/2993, campus twsapi-doc). Nessun aggiramento tentato, come da regole.
- Il contenuto sotto proviene da **riepiloghi del motore di ricerca di pagine ufficiali IBKR** (URL ufficiali indicati). La pagina NON è stata aperta direttamente: per questo lo stato massimo assegnato ai numeri è **SECONDARY_SOURCE**, non VERIFIED_OFFICIAL. VERIFIED_OFFICIAL è usato solo dove il riepilogo riporta testo/struttura documentale ufficiale non numerica e coerente su più pagine ufficiali (indicato esplicitamente).
- Gli stessi riepiloghi segnalano incoerenze tra pagine IBKR (date vecchie, tariffe diverse tra pagine .ie). **Tutti i numeri vanno ricontrollati sulle pagine live prima di decisioni di capitale.**
- Legenda stato: VERIFIED_OFFICIAL / SECONDARY_SOURCE / UNVERIFIED / NOT_FOUND.

## 1. Entità, conti, deposito minimo, fiscalità, PRIIPs

| Voce | Dato | Fonte (URL) | Stato |
|---|---|---|---|
| Entità per residenti italiani | Interactive Brokers Ireland Limited (IBIE), regolata Central Bank of Ireland. Le pagine .ie/it sono quelle per clienti SEE. Il nome "IBCE" (Central Europe) NON confermato come entità per l'Italia | https://www.interactivebrokers.ie/en/accounts/individual.php | SECONDARY_SOURCE (entità IBIE); IBCE: UNVERIFIED |
| Tipi di conto | Individuale e cointestato; Margin (min. 21 anni), Cash (min. 18 anni); anche trust, family, small business. Paesi OFAC esclusi, Italia non esclusa | https://www.interactivebrokers.ie/en/accounts/individual.php | SECONDARY_SOURCE |
| Reg-T vs Portfolio Margin per retail UE | Non emerso nei risultati. Pagina margini futures IBIE esiste (parametro pm=0 nell'URL), ma disponibilità PM per retail UE non confermata | https://www.interactivebrokers.ie/en/trading/margin-futures-fops.php | NOT_FOUND (da chiedere a IBKR) |
| Deposito minimo | Pagina "Required Minimums" IBIE: USD 10.000 equivalenti per conto individuale; mantenere almeno USD 2.000 per operare a margine. Un articolo Campus generico dice "nessun minimo" per cash account: fonti in conflitto, prevale la pagina IBIE ma da riconfermare | https://www.interactivebrokers.ie/en/index.php?f=minimumDeposits ; https://www.interactivebrokers.com/campus/trading-lessons/open-an-account-deposit-and-withdraw/ | SECONDARY_SOURCE (conflitto) |
| Regime fiscale | IBKR opera solo in regime **dichiarativo**: nessuna ritenuta/sostituto d'imposta sulle plusvalenze; il cliente compila Modello Redditi PF (RT plusvalenze, RM dividendi/redditi di capitale, RW monitoraggio estero). Ritenuta USA sui dividendi ridotta al 15% con W-8BEN (validità: fino a fine del 3° anno solare successivo alla firma, secondo IBKR). Doppia imposizione 15% USA + 26% Italia sui dividendi: credito d'imposta incerto. Consultare un commercialista | https://interactivebrokers.ie/it/support/tax-nonus-initial.php ; https://ibkb.interactivebrokers.com/nl/node/2091 ; https://blog.moneyviz.it/come-pagare-le-tasse-su-interactive-brokers-guida-completa/ ; https://italyhandbook.com/withholding-tax-on-us-dividends-for-italian-residents/ | SECONDARY_SOURCE (conferma ufficiale italiana del "solo dichiarativo" non trovata nei risultati) |
| PRIIPs/KID: ETF USA (SPY, GLD, GDX, ecc.) | **NON acquistabili da retail UE**: IBKR è obbligata a bloccare un PRIIP senza KID; gli emittenti USA non producono il KID. Nessuna esenzione per retail (risposta helpdesk riportata da utenti) | https://ibkb.interactivebrokers.com/node/2993 (via ricerca) ; https://www.justetf.com/en/news/etf/us-domiciled-etfs.html | SECONDARY_SOURCE (pagina ibkb non aperta; contenuto concorde su più fonti) |
| Alternative | (a) equivalente UCITS (stesso indice, domicilio IE/LU, KID disponibile; attenzione al ConId/borsa corretta); (b) CFD su ETF USA emessi da entità IBKR europee (da pagina IBKR vecchia in spagnolo: da riconfermare; CFD retail ESMA con leva limitata); (c) riclassificazione a cliente professionale (requisiti MiFID, non garantita) | https://ibkb.interactivebrokers.com/es/node/2993 ; https://quantroutine.com/brokers/buy-ucits-etfs-on-interactive-brokers/ | SECONDARY_SOURCE / UNVERIFIED (CFD) |
| Futures/ETF come proxy | Futures CME non sono PRIIP-KID-bloccati nei risultati trovati; conferma esplicita non trovata | — | UNVERIFIED |

## 2. Azioni, short selling, margin

| Voce | Dato | Fonte (URL) | Stato |
|---|---|---|---|
| Azioni USA, commissioni | Tiered: USD 0,0035/azione (fino a 300.000 az./mese), scende fino a 0,0010; minimo USD 0,35/ordine. Fixed: USD 0,005/azione, minimo USD 1,00. Oltre a commissioni: fee di borsa/regolamentari | https://www.interactivebrokers.ie/en/pricing/commissions-stocks.php | SECONDARY_SOURCE |
| Azioni europee, commissioni | Tiered: 0,05% del controvalore al primo scaglione, minimo EUR 1,25 (fixed min EUR 3,00). Un'altra pagina riporta fixed 0,55% acquisto/0,1% vendita per alcuni mercati: dipende da mercato e routing, tabella per mercato non letta | https://www.interactivebrokers.ie/en/pricing/commissions-stocks-europe.php | SECONDARY_SOURCE (incoerenze tra pagine) |
| Short selling: disponibilità | Strumento "Short-Securities Availability" nel Client Portal (quantità, numero di prestatori, borrow rate indicativo, storico; ricerca per simbolo/ISIN/CUSIP). In TWS: colonne Shortable Shares e Fee Rate; finestra SLB Rates con storico fino a 3 anni. Lista indicativa | https://www.interactivebrokers.com/en/trading/short-securities-availability.php ; https://www.interactivebrokers.com/campus/trading-lessons/shorting-stocks-on-ibkrs-trader-workstation-tws/ | SECONDARY_SOURCE |
| Borrow fee | Variabile per titolo (domanda/offerta). Costo giornaliero = borrow fee e interesse sui proventi dello short. Il rebate può essere negativo. Costi iniziano al regolamento (T+2). Pre-borrow: fee USD 20 per esecuzione, non garantito. Valori per titolo: non pubblicati in forma fissa (vedere lo strumento) | https://www.interactivebrokers.com/en/pricing/short-sale-cost.php ; https://www.interactivebrokers.com/campus/traders-insight/securities/short-selling/the-risks-of-shorting-series-part-ii-borrow-fees/ | SECONDARY_SOURCE |
| Interesse sui proventi dello short | Calcoli IBKR assumono NAV >= USD 100.000; sotto tale NAV l'interesse accreditato può essere proporzionalmente inferiore. Tasso esatto EUR/USD: non trovato | https://www.interactivebrokers.com/en/pricing/short-sale-cost.php | SECONDARY_SOURCE (tasso: NOT_FOUND) |
| Interessi su margine (EUR) | Benchmark + spread a scaglioni. IBKR Pro EUR primo scaglione (0–90.000): BM + 1,5% (riportato 3,985% con benchmark 2,485% al 12/11/2026); Lite BM + 2,5% (4,985%); fino a BM + 0,75% oltre 900.000. Una pagina riporta 3,697% per lo stesso scaglione: benchmark diverso per data | https://www.interactivebrokers.ie/en/trading/margin-rates.php ; https://www.interactivebrokers.com/en/trading/margin-rates.php | SECONDARY_SOURCE |
| Interessi su margine (USD) | Primo scaglione Pro: 5,38% APR al 13/11/2026 (spread non letto) | https://www.interactivebrokers.com/en/trading/margin-rates.php | SECONDARY_SOURCE |
| Interesse su cash | EUR >10.000: 2,001% (BM−0,5%) Pro; 1,001% Lite. Pagina datata (~456 giorni), probabile obsoleta | https://www.interactivebrokers.com/en/accounts/fees/pricing-interest-rates.php | SECONDARY_SOURCE (possibile obsolescenza) |

## 3. Futures

| Voce | Dato | Fonte (URL) | Stato |
|---|---|---|---|
| Commissione futures USA | Tiered: USD 0,85/contratto fino a 1.000 contratti/mese, scende a USD 0,25 oltre 20.000. Fixed: USD 0,85 (primo scaglione). Pagina separata per micro: tariffa specifica per MES, MNQ, MGC, MCL, ES, GC, CL **non letta** | https://www.interactivebrokers.ie/en/pricing/commissions-futures.php ; https://www.interactivebrokers.com/download/newMark/PDFs/commissionsFutures.pdf | SECONDARY_SOURCE (per-simbolo: NOT_FOUND) |
| Commissione futures europei | Tiered EUR 0,90 → 0,25; fixed circa EUR 2,00–3,00 per contratti standard; mini/micro EUR 0,20–0,50 tiered | https://interactivebrokers.ie/en/pricing/commissions-futures-europe.php | SECONDARY_SOURCE |
| Exchange fee CME | Extra rispetto alla commissione. Esempio riportato: ES totale USD 2,24/contratto incluse fee. Tabella per MES/MNQ/MGC/MCL/GC/CL: non trovata | https://www.interactivebrokers.ie/en/pricing/other-fees.php | SECONDARY_SOURCE (tabella: NOT_FOUND) |
| Margini di esempio (MES, MNQ, ecc.) | Pagina margini futures IBIE esiste ma valori non estratti | https://www.interactivebrokers.ie/en/trading/margin-futures-fops.php | NOT_FOUND |
| Retail UE può negoziare futures/opzioni CME | IBIE offre pagina "CME Group Futures Trading" (futures, micro, opzioni americane/calendario/europee/giornaliere). Permessi specifici per retail italiano e test di appropriatezza MiFID: non confermati | https://www.interactivebrokers.ie/en/trading/cme-futures-trading.php | SECONDARY_SOURCE (idoneità retail: UNVERIFIED) |

## 4. Crypto per clienti UE

| Voce | Dato | Fonte (URL) | Stato |
|---|---|---|---|
| Spot crypto SEE | Lanciato 31/03/2026 per investitori individuali SEE tramite IBIE; 11 crypto-asset (inclusi BTC, ETH); esecuzione e custodia presso zerohash europe B.V. (CASP MiCA, AFM). IBKR non custodisce. Non protetto dall'ICS | https://www.interactivebrokers.ie/en/general/about/mediaRelations/3-31-2026.php ; https://www.interactivebrokers.ie/en/trading/products-crypto-assets.php | SECONDARY_SOURCE |
| Commissioni crypto | 0,12%–0,18% del controvalore, niente spread/markup/custodia | https://www.interactivebrokers.ie/en/pricing/commissions-crypto-assets.php | SECONDARY_SOURCE |
| Shorting spot / margine crypto | Non trovato | — | NOT_FOUND |
| Futures CME BTC/ETH, micro (MBT/MET) | Non verificati per retail UE nei risultati (possibili via permessi futures CME) | https://www.interactivebrokers.ie/en/trading/cme-futures-trading.php | UNVERIFIED |
| Criteri di idoneità SEE | Non spiegati nei risultati (rimando a FAQ IBIE) | — | NOT_FOUND |

## 5. Dati di mercato e storici

| Voce | Dato | Fonte (URL) | Stato |
|---|---|---|---|
| US Securities Snapshot and Futures Value Bundle (non-pro) | USD 10/mese, azzerato se commissioni del mese >= USD 30; snapshot a parte USD 0,01 cad. Include top-of-book CBOT, CME, COMEX, NYMEX; richiede permessi futures USA; non per Lite. Pagina datata (~780 giorni) | https://www.interactivebrokers.com/en/pricing/market-data-pricing.php | SECONDARY_SOURCE (possibile obsolescenza) |
| CME S&P Indexes (non-pro) | USD 6,50/mese | idem | SECONDARY_SOURCE |
| Prezzi in EUR dal sito .ie | Non letti | https://www.interactivebrokers.ie/en/pricing/market-data-pricing.php | NOT_FOUND |
| Pacing barre <= 30 s | Max 60 richieste/10 min; richieste identiche entro 15 s vietate; >=6 richieste stesso contratto/borsa/tick entro 2 s vietate; BID_ASK conta doppio; max 50 richieste storiche aperte | https://interactivebrokers.github.io/tws-api/historical_limitations.html ; https://www.interactivebrokers.com/docs/tws-api/doc/market-data-historical/historical-data-limitations/pacing-violations-for-small-bars-30-secs-or-less | SECONDARY_SOURCE (testo di documentazione ufficiale) |
| Barre >= 1 min | Limite rigido di 60 rimosso, resta "soft throttling"; eccesso può portare a disconnessione | stessa pagina | SECONDARY_SOURCE |
| Profondità storica | Barre <= 30 s non disponibili oltre 6 mesi indietro. Durata massima per bar size: tabelle in due versioni non coincidenti; profondità massima barre giornaliere/intraday per strumento: non trovata con precisione | https://www.interactivebrokers.com/docs/tws-api/doc/market-data-historical/historical-bars/max-duration-per-bar-size | SECONDARY_SOURCE / NOT_FOUND (profondità esatta) |
| Futures scaduti | Serve includeExpired=True; dati disponibili solo per 2 anni dalla scadenza (secondo i riepiloghi); errore 166 se non disponibile. Opzioni/FOP/warrant scaduti non disponibili. Implicazione: per backtest su spread calendario lunghi serve una fonte dati esterna | https://www.interactivebrokers.com/campus/ibkr-quant-news/historical-options-futures-data-using-tws-api/ ; https://www.interactivebrokers.com/docs/tws-api/doc/error/codes | SECONDARY_SOURCE |
| Richieste entro 15 min dall'ora corrente | Richiedono abbonamento dati valido (errore 2188) | https://www.interactivebrokers.com/docs/tws-api/doc/error/codes | SECONDARY_SOURCE |

## 6. API e ordini combo

| Voce | Dato | Fonte (URL) | Stato |
|---|---|---|---|
| API disponibili | TWS API (socket, Python/Java/C++/C#), IB Gateway, Client Portal Web API (REST/WebSocket). Trading automatico supportato dalla documentazione | https://www.interactivebrokers.com/campus/ibkr-api-page/webapi-doc/ ; https://interactivebrokers.github.io/tws-api/ | SECONDARY_SOURCE |
| Divieto/permesso trading automatico | Nessun divieto emerso; clausole contrattuali specifiche non lette | — | UNVERIFIED |
| Combo / BAG | Contratto secType BAG con ComboLeg (conId, ratio, action, exchange). Esempi ufficiali: coppia azionaria (IBKR vs MCD) e spread calendario VIX CFE. Prezzo sul combo (overall) o per leg; per-leg solo con 2 leg e NonGuaranteed. Oltre 2 leg: prezzo complessivo, no NonGuaranteed. Fino a 6 leg, dipende dalla borsa. Web API: campo conidex, spread conid per USA 28812380, ratio negativo = vendita | https://interactivebrokers.github.io/tws-api/spread_contracts.html ; https://www.interactivebrokers.com/docs/tws-api/doc/orders/place-order/combo-orders ; https://www.interactivebrokers.com/campus/trading-lessons/python-complex-orders/ | SECONDARY_SOURCE (testo documentazione ufficiale, parte datata) |
| Esecuzione simultanea garantita | Il combo "guaranteed" (default) evita l'esecuzione di una sola gamba; NonGuaranteed = leg indipendenti con rischio di fill parziale. Combo su azioni long/short in coppia: supporto effettivo per retail UE (short, KID, borsa) da verificare | https://interactivebrokers.github.io/tws-api/basic_orders.html | SECONDARY_SOURCE |

## Capitale minimo pratico (stima di lavoro, non fonte IBKR)

- Requisito formale: USD 10.000 (IBIE Required Minimums, da riconfermare); margine minimo USD 2.000.
- Short azionari: i riepiloghi segnalano che sotto NAV USD 100.000 l'interesse sui proventi dello short può essere ridotto; per pairs su azioni il carry dello short è quindi meno favorevole con conto piccolo.
- Micro futures (MES/MNQ/MGC/MCL): margini non estratti; non si può fissare un capitale pratico numerico senza leggere la pagina margini live. Da fare come passo successivo.

## Punti aperti da verificare sul sito live o col supporto IBKR

1. Commissione e exchange fee per MES, MNQ, MGC, MCL, ES, GC, CL (PDF commissionsFutures.pdf).
2. Margini iniziali/mantenimento per gli stessi.
3. Disponibilità Portfolio Margin per retail UE.
4. Idoneità retail italiano ai futures/opzioni CME e CME crypto (MBT/MET).
5. Tasso interesse sui proventi dello short EUR/USD.
6. Prezzi data bundle in EUR sul sito .ie e profondità storica esatta per bar size.
