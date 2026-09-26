# Registro delle fonti dati (fase 2)

Stato al 26/09/2026. Il registro **vivo** è nella dashboard (Data health),
generato da `xnb/quality/registry.py` con lo stato di ogni feed
(HEALTHY / STALE / FAILED / NOT CONFIGURED). Questo file dice cosa è stato
cercato, cosa si usa, cosa è stato scartato e perché. Le scelte della fase 1
restano in `FONTI-DATI.md`.

**Nessun dato è stato acquistato. Nessun dato mancante è stato sostituito
con dati inventati.** Tutte le fonti usate sono gratuite; l'unica che chiede
un'informazione tua è BLS (email di contatto, `XNB_CONTACT_EMAIL`).

## 1. Fonti usate

| Dato | Fonte | Storia | Point-in-time | Regola di disponibilità | Uso |
|---|---|---|---|---|---|
| XAUUSD tick bid/ask | Dukascopy (API `jetta`) | dal 2003 | sì, timestamp UTC al ms | istante del tick | target, trade, MAE/MFE |
| XAUUSD M1 → M5…W1 | Dukascopy | dal 2003 | sì | chiusura della candela | price action a 6 timeframe |
| EURUSD, USDJPY M1; 6 valute H1 (DXY) | Dukascopy | dal 2003 | sì | chiusura della candela | DXY/FX, relazioni oro-dollaro |
| S&P 500, Nasdaq 100 M1 | Dukascopy (`USA500.IDX`, `USATECH.IDX`) | dal 2012 circa | sì | chiusura della candela | risk-on/off, relazioni oro-azionario |
| Date e ore CPI e NFP | archivio comunicati BLS + iCal BLS | dal 2008 | sì (ufficiale) | noto in anticipo | eventi |
| CPI come pubblicato | Tabella A dei comunicati BLS | dal 2008 | sì | release + 60 s | sorprese, livelli |
| NFP come pubblicato, revisioni, salari, ore | Summary table A/B dei comunicati Employment Situation | dal 2010 | sì | release + 60 s | NFP multidimensionale |
| Prime stampe e forecast di 18 serie | storico ForexFactory (dataset di terzi) | 2007–2026 | prime stampe sì (verificate con BLS: 221/221 CPI, 197/198 NFP); forecast parziale | release + 60 s; forecast prima di T0 | memoria delle sorprese, consensus |
| Nowcast inflazione | Cleveland Fed | dal 2013-07 | sì, come pubblicato | giorno d 23:59 ET | CPI, attese |
| Curve Treasury nominali e reali | U.S. Treasury | dal 1990 (reali dal 2003) | sì | D 18:00 ET | tassi, breakeven, pendenze |
| EFFR | NY Fed | dal 2016 | sì | D+1 09:00 ET | Fed |
| VIX | Cboe | dal 1990 | sì | D 17:00 ET | volatilità |
| COT oro | CFTC | dal 2006 | sì | martedì + 3 giorni 15:30 ET | posizionamento |
| EPU giornaliero | policyuncertainty.com | dal 1985 | parziale (può essere ricalcolato) | D+2 | "news" ricostruibili |
| GPR giornaliero | matteoiacoviello.com | dal 1985 | parziale (aggiornato a blocchi) | D+8 | geopolitica ricostruibile |
| Live: prezzo | Swissquote, gold-api (controllo) | — | sì | tempo reale | motore live |
| Live: calendario e consensus | ForexFactory settimanale, archiviato a ogni lettura | da ora in poi | sì se archiviato | lettura | motore live |

## 2. Cercate e non usate

| Fonte | Perché no |
|---|---|
| Fed funds futures storici / CME FedWatch | a pagamento (CME DataMine). Proxy: 3M, 2Y − 3M, loro variazioni |
| Rendimenti intraday storici | nessuna fonte gratuita. Proxy intraday: USD/JPY al minuto |
| Consensus professionale point-in-time (Bloomberg ECO, LSEG Polls, Trading Economics) | a pagamento; vedi `FONTI-DATI.md` §3 |
| Testi Fed (NLP) | non ricostruibili point-in-time in modo affidabile con le ore esatte in questa fase; si usano solo le date FOMC |
| Titoli di giornale / sentiment delle news | nessuno storico gratuito con timestamp affidabili; gli archivi "per data" hanno etichette a posteriori. Esclusi |
| Reazioni dell'oro ad altre release (PPI, PCE, ISM, FOMC) | non scaricate in questa fase; di quelle release si usa solo la sorpresa |
| Future oro COMEX (GC) intraday | nessuno storico tick gratuito |
| Opzioni oro / volatilità implicita (GVZ) | GVZ giornaliero esiste su Cboe ma non è stato aggiunto (priorità bassa, giornaliero) |
| Connettori MCP finanziari | non collegati al tuo account; il software non deve dipendere da Claude |

## 3. Qualità e controlli

- Ogni serie giornaliera porta la colonna `available_from_utc`; le feature
  leggono solo righe già disponibili al cutoff (`POINT-IN-TIME-AUDIT.md`).
- Il test anti-leakage (`tests/test_leakage.py`) verifica che mercati
  identici fino al cutoff e diversi dopo diano feature identiche, per
  tutte le famiglie della fase 2.
- I dati di ricerca sono congelati con hash in
  `research_output/phase2/p2_manifest.json`.
- Buchi noti: `USA500/USATECH` non coprono gli anni prima del 2012; `EFFR`
  prima del 2016; revisioni NFP dai comunicati solo dal 2010; nowcast dal
  2013-07. Le feature mancanti restano NaN e il modello le gestisce
  (imputazione con la mediana del solo training). Una primitiva di regola
  richiede copertura ≥ 70% nella scoperta.

## 4. Termini d'uso

Vedi `FONTI-DATI.md` §5 (Dukascopy in zona grigia per il download
automatico, BLS con email di contatto, ForexFactory per uso personale).
EPU e GPR sono dati accademici liberamente scaricabili con citazione:
Baker, Bloom e Davis (2016); Caldara e Iacoviello (2022).
