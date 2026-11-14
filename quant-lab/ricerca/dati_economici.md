# Dati storici economici per stat arb (ricerca del 2026-11-14)

Prezzi letti dalle pagine ufficiali dove possibile. 'parziale' o 'no' = non verificato del tutto: la causa e scritta nella tabella (403, 404, pagine senza prezzi). Nessun account creato, nessun blocco aggirato.

## Risposta breve
- **Gratis**: fattori/industrie French, Tiingo free (500 simboli/mese), crediti Databento 125 $ per futures daily.
- **< 20 €/mese**: EODHD ~19,99 $/mese (azioni/ETF EU+USA); delistati da verificare.
- **100-300 € una tantum**: FirstRate Data (azioni con 7.000+ delistati, futures 130 contratti dal 2008).
- **> 1000 €**: Norgate, CSI, Portara, Databento Standard.
- **Attenzione**: IBKR conserva i futures scaduti solo 2 anni; Yahoo/Stooq non servono come base.

## Test eseguiti da qui
- French: indice HTTP 200, zip fattori HTTP 200 (dati fino a 2026-09), zip 48 industrie HTTP 200.
- Tiingo /api/test: HTTP 200. Yahoo: 429. Stooq: instabile.

## Fornitori

### Kenneth French Data Library (verificato: si)
- Copre: Fattori (Mkt, SMB, HML, momentum...) e portafogli per industria (10/12/17/30/48/49) USA e globali, giornalieri e mensili
- Storico: Dal 1926 (USA), costruito su CRSP; aggiornato a 2026-09
- Delistati: si (portafogli costruiti su CRSP, quindi senza survivorship bias, ma sono aggregati, non titoli singoli)
- Gratis: Tutto gratis, zip CSV scaricabili senza account
- Costo minimo: 0 €
- Limiti: Solo portafogli aggregati, non singoli titoli; uso accademico/ricerca
- Adatto a: Benchmark di fattori e industrie; validare risultati di stat arb contro fattori noti
- Account: no
- Fonte: https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html
- Test: HTTP 200 pagina indice (245 KB); HTTP 200 su F-F_Research_Data_Factors_CSV.zip (13 KB, contenuto valido, dati fino a 202609) e 48_Industry_Portfolios_CSV.zip (482 KB)

### Tiingo (verificato: parziale)
- Copre: Azioni/ETF USA e cinesi, fondi, crypto, FX; fondamentali; IEX intraday
- Storico: Oltre 30 anni di prezzi giornalieri (free); fondamentali 5 anni free, 15+ anni a pagamento
- Delistati: ? (la pagina prezzi non lo dichiara; in pratica esistono molti ticker delistati ma va verificato con la documentazione API)
- Gratis: Starter 0 $: 50 richieste/ora, 1.000/giorno, 500 simboli unici/mese, 1 GB/mese; prezzi giornalieri con adjClose
- Costo minimo: 0 $ (free); Power 30 $/mese o 300 $/anno per uso personale
- Limiti: Per 500 simboli/mese serve spalmare i download su piu mesi; uso personale interno (redistribuzione vietata); solo USA/Cina, niente futures
- Adatto a: Azioni USA daily adjusted a costo quasi nullo; 30 $/mese supera il budget di 20 €
- Account: si (chiave API gratuita)
- Fonte: https://www.tiingo.com/about/pricing
- Test: API raggiungibile: https://api.tiingo.com/api/test risponde HTTP 200 (senza chiave non scarica dati)

### Alpha Vantage (verificato: parziale)
- Copre: Azioni, ETF, FX, crypto, indicatori, fondamentali, anche alcune commodity (non futures singoli)
- Storico: Fino a 20+ anni daily
- Delistati: ?
- Gratis: Chiave gratuita: 25 richieste al giorno
- Costo minimo: 49,99 $/mese (75 richieste/min)
- Limiti: 25 richieste/giorno bloccano di fatto la ricerca su universi ampi; il piano da 49,99 $ supera il budget; niente futures scaduti
- Adatto a: Solo prove su pochi titoli
- Account: si
- Fonte: https://www.alphavantage.co/premium/
- Test: pagina premium HTTP 200

### EODHD (EOD Historical Data) (verificato: parziale)
- Copre: Azioni e ETF mondiali (incl. Europa/Borse UE), FX, indici, fondamentali; piano intraday
- Storico: Free: 1 anno; piani a pagamento 30+ anni
- Delistati: ? (pagina prezzi non lo cita; l'offerta lo menziona in altre pagine ma non verificato qui)
- Gratis: Free: 20 chiamate/giorno, 20/min, 1 anno di storico, +500 chiamate bonus
- Costo minimo: 19,99 $/mese (16,58 annuale) EOD All-World; 29,99 $/mese EOD+Intraday
- Limiti: Piano 'Historian' a 19,99 $ e al limite del budget; futures non dichiarati (solo commodity spot); licenza personale non dettagliata nella pagina
- Adatto a: Candidato migliore per azioni/ETF europei (UCITS) a costo basso; da verificare copertura prima di pagare
- Account: si
- Fonte: https://eodhd.com/pricing
- Test: pagina prezzi HTTP 200

### Financial Modeling Prep (FMP) (verificato: no)
- Copre: Azioni, ETF, fondamentali, FX, crypto
- Storico: Free: limitato; Starter 5 anni (fonte secondaria)
- Delistati: ? (esiste endpoint delisted-companies a pagamento, non verificato)
- Gratis: Free: 250 richieste/giorno, solo USA, EOD (da fonti secondarie)
- Costo minimo: ~22 $/mese annuale (Starter, fonte secondaria)
- Limiti: Pagina ufficiale non leggibile da qui (HTTP 403); cifre da ricerca web, non ufficiali; Starter 5 anni di storico insufficiente
- Adatto a: Solo prove; fondamentali
- Account: si
- Fonte: https://site.financialmodelingprep.com/pricing-plans
- Test: WebFetch della pagina prezzi: HTTP 403 (non aggirato)

### Massive (ex Polygon.io) (verificato: parziale)
- Copre: Azioni, opzioni, FX, crypto, indici USA; sezione futures separata
- Storico: Basic free: 2 anni; Stocks Advanced: oltre 20 anni
- Delistati: ?
- Gratis: Stocks Basic 0 $: 5 chiamate/min, 2 anni, dati a fine giornata
- Costo minimo: 29 $/mese Financials & Ratios (solo fondamentali); Stocks Advanced 199 $/mese
- Limiti: Polygon.io e diventato Massive (redirect 301 su massive.com, rebrand 30 ott 2025 da fonte secondaria). Piani intermedi non letti dalla pagina; futures con piani separati non verificati
- Adatto a: Free utile solo per prove; Advanced troppo caro
- Account: si
- Fonte: https://massive.com/pricing
- Test: polygon.io/pricing risponde 301 verso massive.com/pricing; pagina letta

### Databento (verificato: parziale)
- Copre: Futures CME/CBOT/NYMEX/COMEX (Globex), ICE, Eurex, azioni USA; da OHLCV-1d a tick/MBO; contratti scaduti inclusi
- Storico: Standard: OHLCV-1d 16+ anni
- Delistati: si (per i futures: contratti scaduti disponibili come simboli individuali)
- Gratis: Crediti gratuiti 125 $ per nuovi utenti, validi 6 mesi (uno per team)
- Costo minimo: Pay-as-you-go (pagamento a consumo, nessun abbonamento); Standard 199 $/mese solo se serve live
- Limiti: La pagina non elenca il prezzo per GB: verificare con il calcolatore sul sito. I dati daily dei futures costano pochi dollari: 125 $ di crediti bastano probabilmente per scaricare tutto il daily; il tick/MBO e costoso
- Adatto a: Miglior fonte pulita per futures spread (CME e Eurex) senza abbonamento fisso
- Account: si
- Fonte: https://databento.com/pricing
- Test: pagina prezzi HTTP 200

### Norgate Data (verificato: parziale)
- Copre: Azioni USA/Australia/Canada ecc. e futures (continui e contratti singoli), forex
- Storico: US stocks: Silver 10 anni, Gold 20, Platinum dal 1990, Diamond dal 1950; futures contratti singoli oltre 30 anni
- Delistati: si (azioni delistate solo da Platinum/Diamond; per i futures non dichiarato)
- Gratis: Nulla (c'e una prova gratuita di 2 anni di dati nel sito: non verificata qui)
- Costo minimo: Prezzo non visibile senza calcolatore; abbonamento 6 o 12 mesi (12 mesi -10%); ordine di grandezza da verificare
- Limiti: Prezzi in USD dopo configurazione; accesso tramite NDU (Windows), pacchetto Python, AmiBroker ecc.; serve Windows per aggiornare i dati
- Adatto a: Standard de facto per azioni senza survivorship bias e futures: vale la spesa se si va sul serio
- Account: si
- Fonte: https://norgatedata.com/prices.php
- Test: pagina letta, prezzi non mostrati (calcolatore)

### FirstRate Data (verificato: parziale)
- Copre: Azioni USA (16.335 ticker dal 2000, oltre 7.000 delistati), ETF, futures (130 contratti piu attivi, da 2008), indici, FX, crypto; da 1 minuto a daily, split e dividendi aggiustati
- Storico: Azioni dal 2000; futures dal 2008; tick 10 anni
- Delistati: si (oltre 7.000 ticker delistati)
- Gratis: Campioni gratuiti scaricabili (non verificato)
- Costo minimo: Acquisto una tantum a pacchetto; aggiornamenti 59,95 $/mese (79 $ con fondamentali) dopo il primo mese gratis; prezzo dei pacchetti non letto
- Limiti: Prezzo del pacchetto futures non trovato sulla pagina; futures: serie continua e contratti singoli, non tutte le borse (niente Eurex)
- Adatto a: Ottimo rapporto qualita/prezzo per azioni con delistati e intraday: acquisto una tantum, poi niente abbonamento
- Account: si
- Fonte: https://firstratedata.com/
- Test: sito HTTP 200; prezzi dei pacchetti non letti

### CSI Data (verificato: no)
- Copre: Futures (contratti scaduti, continui), azioni, fondi, FX
- Storico: Decenni
- Delistati: si
- Gratis: Nulla
- Costo minimo: ?
- Limiti: Pagina prezzi non raggiungibile (HTTP 404 sull'URL tentato); prezzo non verificato
- Adatto a: Futures serie lunghe (comune tra trader sistematici)
- Account: si
- Fonte: https://www.csidata.com/
- Test: pagina tentata: HTTP 404

### Portara (CQG Data Factory) (verificato: no)
- Copre: Futures globali, CME, Eurex, contratti scaduti
- Storico: ?
- Delistati: si
- Gratis: ?
- Costo minimo: ?
- Limiti: Dominio www.portaradata.com non raggiungibile dall'ambiente (host fuori dalla lista consentita); nessuna verifica
- Adatto a: Futures Eurex dati storici di qualita istituzionale (di solito costosi)
- Account: si
- Fonte: https://www.portaradata.com/
- Test: ENOTFOUND: rete dell'ambiente

### Nasdaq Data Link (ex Quandl) (verificato: no)
- Copre: Dataset vari; CHRIS (futures continui, circa 600 contratti da CME/ICE ecc.); Sharadar (a pagamento)
- Storico: ?
- Delistati: ?
- Gratis: CHRIS era gratuito con chiave API: stato attuale NON confermato (fonte secondaria non datata; un'altra fonte dice che Quandl ha perso fornitori di futures)
- Costo minimo: Sharadar: prezzo non verificato
- Limiti: Pagina di ricerca non leggibile da qui; i dati continui CHRIS sono stati accorpati con roll semplici e non adatti a calendar spread
- Adatto a: Da non fare affidamento: verificare l'esistenza di CHRIS con chiave gratuita prima
- Account: si
- Fonte: https://data.nasdaq.com/
- Test: pagina caricata solo con il titolo

### Interactive Brokers (API TWS/Gateway) (verificato: parziale)
- Copre: Azioni, ETF, futures (CME, Eurex ecc.), FX; barre storiche via API
- Storico: Futures scaduti: solo fino a 2 anni dopo la scadenza (documentazione IB)
- Delistati: no (limite dichiarato sui contratti scaduti; per le azioni delistate non verificato)
- Gratis: Conto reale gia aperto: la API e inclusa; abbonamenti dati necessari per i dati storici di ogni strumento
- Costo minimo: Abbonamenti dati IB (cifre non lette qui)
- Limiti: Serve abbonamento ai dati per lo strumento (anche per lo storico); il conto paper richiede abbonamenti sul conto reale; attivazione fino a 24 ore; pacing limits sulle richieste storiche; la copertura dei futures scaduti e troppo corta per calendar spread storici
- Adatto a: Solo per aggiornamenti recenti e trading, non per ricerca storica profonda
- Account: si
- Fonte: https://www.interactivebrokers.com/campus/ibkr-api-page/market-data-subscriptions/
- Test: fonte secondaria (ricerca web su documenti IB); pagina ufficiale non letta direttamente

### Dukascopy (verificato: parziale)
- Copre: FX, metalli, CFD su indici/commodity/azioni, tick storici
- Storico: Tick e barre da circa 2003 (FX)
- Delistati: n/a
- Gratis: Download gratuito dei dati storici tramite strumento web e feed bi5
- Costo minimo: 0 €
- Limiti: Non ci sono azioni quotate italiane ne futures CME/Eurex; solo CFD e FX
- Adatto a: Intraday FX/oro (non per stat arb su azioni/futures)
- Account: no
- Fonte: https://www.dukascopy.com/swiss/english/marketwatch/historical/
- Test: pagina storico HTTP 200; endpoint datafeed bi5 HTTP 301 (non seguito)

### Stooq (verificato: no)
- Copre: Azioni, indici, FX, commodity, crypto; download in blocco
- Storico: Decenni daily
- Delistati: ?
- Gratis: Download gratuito in blocco (sezione db/h)
- Costo minimo: 0 €
- Limiti: Condizioni d'uso non lette; prima richiesta HTTP 200 con 796 byte (sembra pagina di blocco/verifica), la seconda ha dato connection reset: nessun tentativo di aggirare
- Adatto a: Controllo incrociato dei prezzi daily (non adjusted per dividendi)
- Account: no
- Fonte: https://stooq.com/db/h/
- Test: esito instabile: 200 poi reset

### Yahoo Finance / yfinance (verificato: parziale)
- Copre: Azioni, ETF, indici, futures continui, FX
- Storico: Decenni daily
- Delistati: no (i ticker delistati spariscono)
- Gratis: Gratis, API non ufficiale
- Costo minimo: 0 €
- Limiti: Uso personale, non commerciale (README di yfinance); termini Yahoo non letti direttamente; API non ufficiale puo cambiare o bloccare in qualsiasi momento; niente contratti scaduti
- Adatto a: Primo screening; mai base unica
- Account: no
- Fonte: https://policies.yahoo.com/
- Test: richiesta diretta all'endpoint chart: HTTP 429 (limite di velocita)

### Barchart (verificato: no)
- Copre: Futures (OnDemand getHistory, contratti scaduti nel piano a pagamento), azioni
- Storico: ?
- Delistati: ?
- Gratis: Sito indica opzioni free e a pagamento: pagina senza testo
- Costo minimo: ?
- Limiti: Pagina non leggibile; nessun prezzo verificato
- Adatto a: ?
- Account: si
- Fonte: https://www.barchart.com/ondemand/free-market-data-api
- Test: pagina senza corpo

### CRSP via WRDS (verificato: no)
- Copre: Azioni USA con delistati, rendimenti con delisting
- Storico: Dal 1925/1926
- Delistati: si
- Gratis: Solo con licenza accademica universitaria
- Costo minimo: Solo accademico; non acquistabile da privati
- Limiti: Non accessibile a un privato italiano senza affiliazione
- Adatto a: Riferimento accademico (French usa CRSP)
- Account: si
- Fonte: https://wrds-www.wharton.upenn.edu/
- Test: non verificato

## Percorsi per budget

### 0 €
- Si puo: Fattori e industrie French (dal 1926, senza survivorship bias); Tiingo free (500 simboli/mese, daily adjusted, 30+ anni) per una selezione di azioni USA; Massive Basic (2 anni, 5 chiamate/min); Databento crediti 125 $ (una tantum, 6 mesi) per scaricare futures daily CME/Eurex; Dukascopy per FX/oro intraday; Yahoo/Stooq solo per controlli incrociati
- Non si puo: Universo ampio di azioni con delistati; ETF UCITS europei in quantita; storico futures scaduti lungo (IBKR solo 2 anni); intraday azioni; qualita garantita

### < 20 €/mese
- Si puo: EODHD Historian ~19,99 $/mese per azioni/ETF europei e USA daily adjusted (da provare un mese poi disdire); FirstRate: acquisto una tantum in questa fascia non verificato; Tiingo Power 30 $ appena sopra il limite (un mese basta per scaricare tutto il necessario)
- Non si puo: Futures scaduti di qualita; delistati garantiti (EODHD non verificato); Eurex

### ~100-300 € una tantum
- Si puo: FirstRate Data: pacchetti azioni (con oltre 7.000 delistati dal 2000) e futures (130 contratti dal 2008) una tantum, prezzi da verificare sul sito; Databento pay-as-you-go oltre i crediti per i daily dei futures
- Non si puo: Eurex storico completo; tick/MBO CME (costosi); aggiornamenti continui senza abbonamento (59,95 $/mese)

### > 1000 €
- Si puo: Norgate Platinum/Diamond (azioni senza survivorship bias + futures), CSI Data, Portara, Databento Standard 199 $/mese; Massive Stocks Advanced 199 $/mese
- Non si puo: CRSP (solo accademico); non necessario per un primo studio di stat arb
