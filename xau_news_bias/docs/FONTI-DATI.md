# Fonti dati — ricerca, confronto e scelte

Verificato sul web e con richieste reali il 26/09/2026. Le API cambiano:
il registro vivo è nella pagina **Fonti & sistema** della dashboard
(`xnb/quality/registry.py`), che mostra lo stato di ogni feed.

## 1. Strumenti per Claude contro fonti del software

Sono due cose diverse e il software **non dipende da Claude**.

| | Cosa | Stato |
|---|---|---|
| **Usati da Claude durante lo sviluppo** | ricerca web, lettura documentazione, terminale | usati |
| | connettori MCP finanziari (FMP, Alpha Vantage, Twelve Data, Bigdata.com, Oxford Economics) | **non collegati** al tuo account; nessuno serviva: i dati necessari arrivano da API pubbliche che il software interroga da solo |
| **Usati dal software in produzione** | le API della tabella sotto, chiamate direttamente da Python | tutte gratuite; una sola richiede un'informazione tua (l'email di contatto per BLS) |

Un connettore MCP funziona solo dentro una sessione Claude: non può essere
la base di un sistema che gira 24/7 senza Claude aperto. Per questo ogni
fonte è un **adattatore Python** (`xnb/providers/`) dietro un'interfaccia
(`MarketDataProvider`, `EconomicCalendarProvider`, `MacroProvider`,
`RatesProvider`, `PositioningProvider`, `ConsensusProvider`):
cambiare fornitore significa scrivere un adattatore, non toccare il resto.

## 2. Scelte per categoria

| Dato | Primaria | Fallback | Perché questa |
|---|---|---|---|
| **XAUUSD storico tick/M1/H1** | Dukascopy, API JSON `jetta` | Dukascopy datafeed `.bi5`; MT5 del broker (script incluso) | Unica fonte gratuita con **tick al millisecondo in UTC dal 2003**. Verificato: il salto del CPI di gennaio 2024 parte a +200 ms da T0. Le due API Dukascopy danno dati identici (differenza massima 2·10⁻¹³) |
| **XAUUSD live** | Swissquote public quotes | gold-api.com (controllo incrociato) | Bid/ask in tempo reale senza chiave. Alpha Vantage (25 richieste/giorno gratis) e Twelve Data (8/minuto) non bastano per un aggiornamento al minuto |
| **Date/ore delle release** | BLS: archivio comunicati + iCal ufficiale | ForexFactory (settimana corrente) | Fonte primaria ufficiale, con ora esatta e con le date irregolari (shutdown 2025) |
| **CPI point-in-time** | Tabella A dei comunicati BLS archiviati | ALFRED (con chiave FRED) | È letteralmente il testo pubblicato quel giorno: prima stampa più revisioni note allora. Verificato: i valori cambiano a febbraio (revisione stagionale annuale), come deve essere |
| **Treasury 2Y, 10Y, curva, reali** | U.S. Treasury CSV giornalieri | FRED (DGS2, DGS10, DFII10) | Ufficiale, senza chiave, dal 1990 (reali dal 2003) |
| **Fed funds / fascia obiettivo** | NY Fed API (EFFR) | FRED DFF | Ufficiale, dal 2016 |
| **Aspettative sui tassi** | proxy: 2Y − 3M e variazioni del 3M | — | CME FedWatch storico è a pagamento (vedi §4) |
| **DXY** | ricostruito dalle 6 valute Dukascopy con la formula ICE | — | Il DXY vero su Dukascopy parte solo dal 2017; la formula ufficiale dà lo stesso numero (controllato: 104,1 a fine febbraio 2024) |
| **VIX** | Cboe, storico ufficiale | FRED VIXCLS | Ufficiale, dal 1990 |
| **S&P 500 / Nasdaq intraday** | non usati nel POC | Dukascopy USA500IDXUSD (dal 2012) | Server instabile (503) e storia corta; da valutare solo se servono |
| **COT oro** | CFTC Socrata, disaggregato | — | Ufficiale. Regola: report del martedì noto dal venerdì 15:30 ET; esclusi i periodi di shutdown in cui uscì settimane dopo |
| **Nowcast inflazione** | Cleveland Fed (JSON dei grafici) | — | **Trovato durante la ricerca**: ufficiale, gratuito, storico *come pubblicato in tempo reale* dal 2013 |
| **Consensus storico** | ForexFactory, dataset di terzi su GitHub | nessuno gratuito | Vedi §3 |
| **Consensus live** | ForexFactory JSON settimanale | — | Archiviato a ogni lettura: da oggi si costruisce uno storico point-in-time vero |

## 3. Il problema del consensus storico

È il dato più difficile, e lo dico chiaramente:

- **Non esiste una fonte gratuita, ufficiale e garantita point-in-time** del
  consensus (forecast) delle release USA dal 2008.
- L'unica gratuita che copre il periodo è **ForexFactory**, raccolto da terzi
  (`github.com/janickfarrell/newfac`, 2007–2026, 235 CPI con forecast).
  Il forecast è quello mostrato da FF al momento della release: noto **prima**
  di T0, ma non è garantito che fosse identico già a T−3D. Il campo
  "previous" invece è il valore rivisto dopo la release, quindi **non viene
  usato** (il "previous" si prende dal comunicato BLS precedente).
- Fonti professionali (verificate, prezzi 2026):

| Provider | Consensus storico point-in-time | Costo indicativo | Note |
|---|---|---|---|
| Trading Economics | sì, con endpoint point-in-time documentato | ~150–300 $/mese | profondità storica non verificata |
| Financial Modeling Prep | campo `estimate` | Premium ~59 $/mese | profondità e point-in-time non documentati |
| EODHD | campo `estimate` | 60–100 $/mese | solo dal 2019–2020 |
| Finnhub | storico solo Enterprise | contratto | — |
| LSEG (Reuters Polls), Bloomberg (ECO) | sì, con timestamp dei sondaggi | contratti enterprise | lo standard professionale |
| Investing.com, Myfxbook | solo web | — | scraping vietato dai termini |

**Differenza pratica per il progetto:** il consensus serve soprattutto a una
cosa, stimare *prima* se la sorpresa sarà calda o fredda (ipotesi H2,
nowcast − consensus). I risultati del POC dicono se questo canale funziona
già con il consensus FF; un consensus professionale lo renderebbe più
pulito ma non cambierebbe il tetto teorico del target (vedi RISULTATI-CPI).
**Non è stato acquistato nulla.**

## 4. Altri dati a pagamento, se un giorno servissero

| Dato | Perché | Chi lo ha | Costo |
|---|---|---|---|
| Probabilità FedWatch storiche / Fed funds futures intraday | aspettative sui tassi più precise della proxy 2Y−3M | CME DataMine | a consumo, centinaia di $ |
| Tick XAU di un feed istituzionale | confronto con Dukascopy | LSEG, ICE | enterprise |

## 5. Termini d'uso — da sapere

- **Dukascopy**: i termini del sito consentono l'uso personale non
  commerciale ma vietano bot/scraping senza permesso e la costruzione di
  database. Il download automatico dal datafeed è quindi in **zona grigia**:
  è quello che fanno librerie diffuse (dukascopy-node), ma formalmente non è
  autorizzato. Il software scarica una volta sola e poi usa la cache locale.
  Alternativa pulita: i tick del tuo broker da MT5
  (`mt5/XNB_TickExport.mq5`), che servono comunque a verificare che il
  target sia lo stesso sul feed su cui opereresti.
- **BLS**: chiede un contatto nello User-Agent; il software lo prende da
  `XNB_CONTACT_EMAIL`.
- **ForexFactory**: il JSON settimanale è pubblico e pensato per essere
  letto; lo storico GitHub è di terzi e va tenuto per uso personale.
