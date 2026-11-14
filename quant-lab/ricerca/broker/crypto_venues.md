# Venue crypto per strategie relative-value — cliente retail italiano (stato al 2026-11-14)

Scopo: capire dove un residente italiano può legalmente detenere spot lungo + short perpetual/future datato (cash-and-carry), a che costo, e con quali dati storici.
Metodo: solo fonti pubbliche ufficiali; nessun bypass di CAPTCHA/anti-bot/geoblocco. Le pagine bloccate (403, 451) sono segnate e non riprovate oltre 2-3 volte.
Stati: VERIFIED_OFFICIAL (pagina/file ufficiale letto), SECONDARY_SOURCE (stampa, aggregatori, o estratto di ricerca di pagina ufficiale non aperta), UNVERIFIED, NOT_FOUND.
Nessun numero è inventato: dove manca, c'è scritto NOT_FOUND. Il log delle fonti è in `registri/DATA_ACCESS_LOG_crypto.md`.

## 0. Quadro normativo in breve

| Punto | Contenuto | Fonte | Stato |
|---|---|---|---|
| MiCA copre spot/custodia/exchange di cripto-attività, non i derivati | I derivati ricadono in MiFID II: serve una licenza di impresa di investimento separata dalla licenza CASP | Dedotto dai registri (le entità derivati sono diverse dai CASP, vedi sotto); regola generale non letta in un testo ufficiale | UNVERIFIED |
| Fine periodo transitorio MiCA: 1 luglio 2026 | Chi non è autorizzato in almeno un paese UE deve cessare l'attività; i CASP autorizzati operano in tutta l'UE col passaporto | https://www.consob.it/web/consob/w/termina-il-periodo-transitorio-del-regolamento-mica-sulle-cripto-attivit%C3%A0-in-italia-9-soggetti-abilitati | VERIFIED_OFFICIAL |
| CONSOB: 8 CASP italiani autorizzati (CheckSig, Conio, CryptoSmart, Hercle, Hodlie, Olliv Italia, Riv Digital, Young Platform) + Banca Sella notificante; gli esteri passaportati sono nel registro ESMA; "le tutele previste dal MiCAR si applicano solo ove il prestatore dei servizi sia autorizzato nell'Ue" | Nessuna delle venue in questo documento è tra i CASP italiani: operano col passaporto | stessa pagina CONSOB | VERIFIED_OFFICIAL |
| Registro OAM (VASP) | Registro nazionale pre-MiCA. Pagina OAM non raggiungibile (403 su URL tentato). Non verificato se le venue estere vi risultino ancora | https://www.organismo-am.it/ | NOT_FOUND |
| ESMA, comunicato 24/02/2026 (ESMA35-243228190-8024): i derivati venduti come "perpetual futures", che danno esposizione a cripto e non sono regolati esclusivamente in fisico, rientrano "probabilmente" nelle misure nazionali di product intervention sui CFD (limiti di leva, avvertenza di rischio, close-out del margine, protezione da saldo negativo, divieto di incentivi). Il nome commerciale è irrilevante; funding rate e quotazione su una sede di negoziazione non contano. Servono anche test di appropriatezza e KID PRIIPs | https://www.esma.europa.eu/sites/default/files/2026-02/ESMA35-243228190-8024_-_Public_statement_on_derivatives_in_scope_of_the_CFD_product_intervention_measures.pdf | VERIFIED_OFFICIAL |
| Limite di leva CFD cripto per retail (decisione ESMA 2018/796): 2:1 | Il valore 2:1 non è nel comunicato 2026 letto (che rinvia alla decisione 2018). Non l'ho aperta | — | UNVERIFIED |

Conseguenza pratica: le venue sotto offrono 10x ai clienti retail EEA su prodotti strutturati come future con scadenza a 5 anni (OKX "X-Perps", Coinbase, Kraken). Il comunicato ESMA di febbraio 2026 indica che questa struttura potrebbe comunque ricadere nelle misure sui CFD. Rischio normativo non risolto: la leva effettivamente consentita a un retail italiano potrebbe ridursi. Non ho trovato una posizione CONSOB specifica su questi prodotti.

## 1. Autorizzazione MiCA e apertura conto per un residente italiano

Fonte comune: registro interinale ESMA, file CSV scaricato il 2026-11-14 (407 righe, ultimo aggiornamento record 11/11/2026): https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv — VERIFIED_OFFICIAL. Il campo "paesi con passaporto" include IT per tutte le entità marcate sotto "IT: sì".

| Venue | Entità CASP (registro ESMA) | Autorità | Data notifica | Passaporto IT | Conto per italiani | Fonte | Stato |
|---|---|---|---|---|---|---|---|
| Binance | Nessuna entità nel registro. Domanda in Grecia (HCMC) di gennaio 2026, ritirata il 24/06/2026 secondo la stampa; servizi EEA sospesi dopo il ritiro | — | — | no | No, secondo la stampa; l'API `fapi.binance.com` risponde 451 (restrizione geografica) dalla mia rete, che non è italiana, quindi non è una prova per l'Italia | Assenza: CSV ESMA. Ritiro e sospensione: Tangem, Bleap, CASP Tracker, Cointelegraph | Assenza dal registro VERIFIED_OFFICIAL; ritiro e sospensione SECONDARY_SOURCE |
| OKX | OKX Europe Limited (Malta) | MFSA | 27/01/2025 | sì | Sì (servizi CASP). Italia non nominata nelle pagine X-Perps, che citano "all 30" paesi EEA | CSV ESMA; https://www.okx.com/en-eu/help/okx-x-perps-eea-regional-availability-eligibility | VERIFIED_OFFICIAL |
| Bybit | Bybit EU GmbH (Austria) | FMA | 28/05/2025 | sì | Sì, conto separato su bybit.eu (spot e margin; niente futures) | CSV ESMA; CASP Tracker https://casptracker.eu/it/exchange/bybit/ | Autorizzazione VERIFIED_OFFICIAL; prodotti SECONDARY_SOURCE |
| Kraken | Payward Europe Solutions Limited (Irlanda; custodia, cambio, esecuzione) e Payward Global Solutions Limited (piattaforma di negoziazione) | Central Bank of Ireland | 25/06/2025 | sì (Payward Europe Solutions) | Sì | CSV ESMA | VERIFIED_OFFICIAL |
| Coinbase | Coinbase Luxembourg S.A. | CSSF | 20/06/2025 | sì | Sì (Italia ha pagina dedicata coinbase.com/en-it) | CSV ESMA | VERIFIED_OFFICIAL |
| Deribit | Nessuna entità nel registro. Acquisita da Coinbase (chiusura ago 2025 secondo la stampa) | — | — | no | Non verificato (pagina restrizioni bloccata, 403). Dall'estratto di ricerca: UE non esclusa in blocco, UK retail non ammessi; non chiaro per retail UE/Italia | https://support.deribit.com/hc/en-us/articles/25944487427741-Restricted-Jurisdictions ; https://siliconcanals.com/coinbase-to-acquire-deribit/ | Assenza dal registro VERIFIED_OFFICIAL; accesso UNVERIFIED |
| Bitpanda | Bitpanda GmbH (Austria, FMA, 09/04/2025); Bitpanda Asset Management GmbH (Germania, BaFin, 24/01/2025); BP23 CA Limited (Malta, MFSA, 27/01/2025) | FMA / BaFin / MFSA | vedi a fianco | sì (GmbH e Asset Mgmt) | Sì | CSV ESMA | VERIFIED_OFFICIAL |
| IBKR | Interactive Brokers Ireland Limited, solo servizio "ricezione e trasmissione di ordini" | Central Bank of Ireland | 22/01/2026 | sì | Sì; crypto per EEA lanciate il 31/03/2026 (stampa) | CSV ESMA; The Block https://www.theblock.co/news/business/2026-03-31-interactive-brokers-launches-crypto-trading-in-eea-including-btc-eth-sol-and-xrp-395885 | Autorizzazione VERIFIED_OFFICIAL; lancio SECONDARY_SOURCE |

## 2. Derivati (perpetual / future datati) per retail UE/italiano

Tutti i derivati sotto sono prodotti MiFID, non MiCA. La leva indicata è quella dichiarata dalla venue; vale l'avvertenza ESMA della sezione 0.

| Venue | Perpetual / datati per retail EEA | Leva max dichiarata | Entità derivati | Italia confermata? | Fonte | Stato |
|---|---|---|---|---|---|---|
| Binance | No (non autorizzata in UE) | — | — | no | vedi sezione 1 | SECONDARY_SOURCE |
| OKX | "X-Perps": future cash-settled con scadenza a 5 anni e funding (struttura pensata per non essere un CFD); lanciati aprile 2026; richiesti KYC + test di appropriatezza; retail e professionali ricevono la stessa offerta | 10x (segnalato) | OKX Europe Market Ltd (Malta, MiFID) | "all 30" paesi EEA, Italia non nominata; la disponibilità può variare per paese | https://www.okx.com/en-eu/help/okx-x-perps-eea-regional-availability-eligibility (letto); resto da estratti di pagine OKX e stampa | Eligibilità VERIFIED_OFFICIAL; leva, scadenza 5 anni, entità SECONDARY_SOURCE |
| Bybit | No. Bybit X GmbH ha chiesto una licenza MiFID in Austria a settembre 2025; nessuna approvazione trovata | — | — | no | https://www.financemagnates.com/cryptocurrency/bybit-pursues-mifid-license-for-eu-derivatives-phases-out-mt5-for-in-house-trafi/ | SECONDARY_SOURCE |
| Kraken | Sì: perpetual lineari multi-collaterale e future a scadenza fissa (FF_XBTUSD, FF_ETHUSD), >290 perpetual cripto segnalati dalla stampa; serve test di idoneità | 10x (Class A, include BTC e ETH); alcuni contratti 20x (Class D) | Payward Europe Digital Solutions (CY) Ltd, ex I.F. Greenfield Wealth, CySEC lic. 342/17 | Pagina "per clienti EEA", Italia non nominata esplicitamente | https://support.kraken.com/articles/perpetual-contract-specifications-for-clients-in-the-eea | VERIFIED_OFFICIAL (Italia: UNVERIFIED) |
| Coinbase | Sì dal 09/03/2026: future perpetual-style con scadenza 5 anni e future mensili/trimestrali cash-settled su Coinbase Advanced, 26 paesi EEA; richiesti controlli di esperienza e KYC. L'elenco dei paesi non è nelle fonti aperte | 10x su BTC/ETH; 4-5x su altri (The Block) | Coinbase Financial Services Europe Ltd, CySEC lic. 374/19 (da pagina Coinbase Italia, solo estratto di ricerca) | Solo MEXC (secondaria) cita l'Italia; pagina Coinbase Italia dice futures per "eligible EEA customers" (estratto) | https://www.theblock.co/post/392797/coinbase-opens-crypto-futures-trading-europe ; pagine coinbase.com 403 | SECONDARY_SOURCE (Italia: UNVERIFIED) |
| Coinbase International Exchange (perpetual) | Disponibile "in regioni selezionate fuori dagli USA", regioni non elencate; non verificato per retail italiani | 10x (docs CDP) | Coinbase Bermuda (da estratto di ricerca) | non verificato | https://docs.cdp.coinbase.com/coinbase-business/advanced-trade-apis/guides/perpetual | Leva VERIFIED_OFFICIAL; disponibilità Italia UNVERIFIED |
| Deribit | Perpetual e future nativi esistono; non verificato se un retail UE/italiano possa operarvi (pagina termini bloccata). Entità storica olandese, ora Deribit FZE (Dubai) | — | — | non verificato | https://support.deribit.com/hc/en-us/articles/25944487427741-Restricted-Jurisdictions | UNVERIFIED |
| Bitpanda | No perpetual né future per retail UE trovati. Leva solo tramite L-Token (CFD) emessi da Bitpanda GmbH tramite Bitpanda Financial Services; DeFiLlama indica margin spot fino a 10x | — | — | — | https://www.bitpanda.com/en/academy/the-smart-guide-to-leveraged-crypto-trading ; https://defillama.com/exchange/bitpanda | SECONDARY_SOURCE |
| IBKR | Per il crypto UE: solo spot via ordini a Zero Hash (stampa). Futures cripto: citati solo per "US Crypto Futures"; non trovato nulla per clienti UE | — | — | — | review investingintheweb.com (estratto) | SECONDARY_SOURCE |

## 3. Commissioni livello base e intervallo di funding

| Venue | Spot maker/taker | Derivati maker/taker | Funding | Fonte | Stato |
|---|---|---|---|---|---|
| Binance (non disponibile in UE) | 0,100% / 0,100% (0,075% con BNB) | NOT_FOUND (tabella futures non resa) | NOT_FOUND (API 451) | https://www.binance.com/en/fee/schedule | Spot VERIFIED_OFFICIAL |
| OKX Europe | 0,08% / 0,10% con conto X-Perps; 0,20% / 0,35% senza (Lv1, EUR 0-100k asset, 0-1M volume 30 giorni) | X-Perps: 2 bp maker / 5 bp taker per conti standard | Ogni 8 ore (non è una commissione OKX) | https://www.okx.com/en-eu/help/what-are-the-new-trading-fees-for-eea-users ; estratti di https://www.okx.com/en-eu/x-perps | Spot VERIFIED_OFFICIAL; derivati e funding SECONDARY_SOURCE |
| Bybit EU | 0,1% / 0,1% non-VIP su coppie cripto; coppie fiat (es. USDC/EUR) tariffa a volume, taker 0,2% sotto 100.000 USD (30 gg) | Nessun derivato per UE; i numeri globali di bybit.com (perp inversi 0,020/0,055) non sono tariffe UE | n/a | https://www.bybit.eu/en-EU/help-center/article/Bybit-Spot-Fees-Explained (403, solo estratto di ricerca) | SECONDARY_SOURCE |
| Kraken (Pro, Tier 1: $0+) | 0,40% / 0,80% (Tier 2 da $2,5k: 0,30/0,60; Tier 3 da $10k: 0,22/0,38) | Futures e perpetual cripto/FX: 0,02% / 0,05% (Tier 2 da $5M di volume futures: 0,0175/0,045) | Orario ("every 1 hour"); regolato anche a variazione di posizione netta | https://www.kraken.com/pro/fees ; https://support.kraken.com/articles/perpetual-contract-specifications-for-clients-in-the-eea | VERIFIED_OFFICIAL. Nota: la tabella è stata scaricata dalla mia rete (non italiana) e potrebbe riflettere la versione globale; la pagina "features/fee-schedule" riporta per l'app 0,25% in apertura e in chiusura |
| Coinbase Advanced (EU) | NOT_FOUND. Estratto di blog Coinbase: "EU e UK: 0,25% maker / 0,50% taker" dal 16 settembre, non confermato che sia spot Advanced | Per le perpetual: promo 0,00% maker / 0,03% taker (docs CDP, vale per Advanced/International, non confermato per futures EU MiFID) | Orario con regolamento giornaliero (stampa) | https://docs.cdp.coinbase.com/coinbase-business/advanced-trade-apis/guides/perpetual ; The Block | Promo VERIFIED_OFFICIAL; il resto UNVERIFIED |
| Deribit | NOT_FOUND | NOT_FOUND | L'API espone `interest_8h` e `interest_1h` per BTC-PERPETUAL: funding continuo, riportato su base 8h e 1h | https://www.deribit.com/api/v2/public/get_funding_rate_history | Funding: VERIFIED_OFFICIAL (osservato sull'API); fee NOT_FOUND |
| Bitpanda | 0,25% / 0,25% (Fusion, DeFiLlama 2026-09); cifre più vecchie di 0,10/0,15 su recensioni | n/a | n/a | https://defillama.com/exchange/bitpanda | SECONDARY_SOURCE |
| IBKR crypto (UE) | Commissione 0,12%-0,18% più commissione di conversione Zero Hash 0,30% (min 1 USD) | n/a | n/a | The Block / recensioni | SECONDARY_SOURCE |

## 4. Margin lending e short sul spot

| Venue | Esito | Fonte | Stato |
|---|---|---|---|
| Binance | Non applicabile per un italiano (non autorizzata) | — | SECONDARY_SOURCE |
| OKX Europe | Sì: "Spot Margin" EEA, long e short con leva fino a 10x su mercati selezionati (BTC, ETH, USDC all'avvio; 11 token dopo l'espansione). Prestatore: OKX Europe Limited; serve test di idoneità. OKX avverte che prestito/borrowing è fuori dall'ambito MiCA | https://www.okx.com/en-eu/help/eea-spot-margin-faq | SECONDARY_SOURCE (estratto di ricerca) |
| Bybit EU | Margin con leva fino a 10x segnalato da aggregatore | https://casptracker.eu/it/exchange/bybit/ | SECONDARY_SOURCE (da verificare) |
| Kraken | Termini EEA: margin offerto solo "in certain countries in the EEA", elenco non letto; Italia non confermata. Short non citato | https://www.kraken.com/legal/eea-terms | UNVERIFIED |
| Coinbase | Nessun dato su margin spot UE trovato | — | NOT_FOUND |
| Deribit | Non verificato | — | UNVERIFIED |
| Bitpanda | Margin spot fino a 10x (DeFiLlama); L-Token come CFD | https://defillama.com/exchange/bitpanda | SECONDARY_SOURCE |
| IBKR | Nessuna fonte su short di cripto per UE | — | NOT_FOUND |

## 5. Dati storici pubblici

Date di inizio: dichiarate dalla venue dove indicato; altrimenti "osservato" = misurato da me il 2026-11-14 con richieste pubbliche, senza autenticazione.

| Venue | Dati e dove | Inizio storico | Fonte | Stato |
|---|---|---|---|---|
| Binance | data.binance.vision (bucket S3 pubblico): klines spot (da 2017-08 per BTCUSDT 1h), USD-M klines 1h BTCUSDT da 2020-01, fundingRate USD-M BTCUSDT da 2020-01, premiumIndexKlines da 2020-01, fundingRate COIN-M BTCUSD_PERP da 2022-07; ultimo mese presente: 2026-10. Il README GitHub non documenta date di inizio. Dall'Italia l'accesso al sito Binance non è prova di liceità del servizio | https://github.com/binance/binance-public-data ; listing https://s3-ap-northeast-1.amazonaws.com/data.binance.vision | Struttura VERIFIED_OFFICIAL; date osservate |
| OKX | Pagina ufficiale dati storici: tick trade da set 2021; candele da lug 2023; funding da mar 2022; order book L2 da mar 2023; borrowing rate da dic 2021. L'API pubblica del funding risponde (HTTP 200) | https://www.okx.com/en-eu/historical-data | VERIFIED_OFFICIAL (dichiarato) |
| Bybit | public.bybit.com: trade BTCUSDT da 2020-03-25 (osservato); API v5 bloccata dalla mia rete (403 geoblocco, non aggirato) | https://public.bybit.com/trading/BTCUSDT/ | VERIFIED_OFFICIAL |
| Kraken | Download completo OHLCVT (1,5,15,60,240,720,1440 minuti) per ogni coppia dal primo trade fino al 30/09/2026, a pezzi da ~2 GB, aggiornamenti trimestrali. L'API REST OHLC dà solo le ~720 candele più recenti (osservato). Kraken Futures: strumenti via `futures.kraken.com/derivatives/api/v3/instruments`; PF_XBTUSD aperto il 2022-03-22 | https://support.kraken.com/articles/360047124832-downloadable-historical-ohlcvt-open-high-low-close-volume-trades-data | VERIFIED_OFFICIAL |
| Deribit | API pubblica: candele BTC-PERPETUAL da 2018-08-14 (osservato); funding BTC-PERPETUAL: primo dato osservato attorno al 2019-04-30; massimo 744 record per richiesta (paginare per finestra) | https://www.deribit.com/api/v2/public/get_tradingview_chart_data | VERIFIED_OFFICIAL (date osservate) |
| Coinbase | Non verificato | — | NOT_FOUND |
| Bitpanda | Non verificato | — | NOT_FOUND |
| IBKR | Non verificato | — | NOT_FOUND |

## 6. Cash-and-carry: chi lo consente a un retail italiano

Servono insieme spot lungo (MiCA) e short su perpetual o future datato (MiFID).

| Venue | Spot | Short derivato | Valutazione | Costo base di apertura (spot + derivato, solo commissioni dichiarate) |
|---|---|---|---|---|
| Kraken | Payward Europe Solutions (CBI) | Perpetual o future a scadenza fissa (CySEC) | Candidata principale. Italia non confermata esplicitamente; da verificare in app | Taker: 0,80% + 0,05% = 0,85%; maker: 0,40% + 0,02% = 0,42% (Tier 1, tabella da verificare per regione) |
| OKX Europe | OKX Europe Limited (Malta) | X-Perps (Malta, MiFID) | Candidata. Italia non nominata; test di appropriatezza richiesto | Con conto X-Perps: taker 0,10% + 0,05% = 0,15%; maker 0,08% + 0,02% = 0,10% |
| Coinbase | Coinbase Luxembourg | Future Advanced (CySEC), 26 paesi | Possibile ma Italia solo da fonti secondarie/estratti; fee non verificate | NOT_FOUND |
| Bybit EU | sì | no derivati | Non fattibile | — |
| Bitpanda, IBKR | sì | no derivati UE trovati | Non fattibile con perpetual/future | — |
| Binance, Deribit | non autorizzate MiCA | — | Non idonee per un residente italiano secondo il registro ESMA | — |

Nota: i costi sopra sono commissioni di ingresso; funding, spread e chiusura vanno sommati. Il funding su Kraken è orario, su OKX ogni 8 ore.

## 7. Lacune aperte

1. Italia non confermata per nome da nessuna pagina ufficiale per OKX X-Perps, Kraken derivati e Coinbase futures: verificare aprendo un conto o con il supporto.
2. Pagine bloccate (403 / challenge anti-bot) e non aggirate: Coinbase (help, derivati, International fees), Deribit support, Bybit EU fee, IBKR, OAM, Binance futures fee.
3. Posizione CONSOB sulla leva dei perpetual strutturati: non trovata. La misura 2:1 per CFD cripto non è stata letta in fonte ufficiale.
4. Le tabelle commissioni Kraken potrebbero dipendere dalla regione di chi le scarica.
