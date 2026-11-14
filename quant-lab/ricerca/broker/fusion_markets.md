# Fusion Markets: condizioni di esecuzione per pairs trading / relative value (cliente retail residente in Italia)

Data della ricerca: 2026-11-14. Solo fonti pubbliche ufficiali (fusionmarkets.com e relativi PDF) più, dove indicato, fonti secondarie.

Stati di verifica: **VERIFIED_OFFICIAL** (letto su documento/pagina ufficiale), **SECONDARY_SOURCE** (terzi o riassunto di ricerca), **UNVERIFIED**, **NOT_FOUND**.

Nota di metodo: molte tabelle del sito (Contract Specifications, Margins & Leverage, Session Times, tabella spread) sono caricate dinamicamente e il fetch ne ha restituito solo le intestazioni. Quei valori sono quindi "non pubblicato" nelle pagine statiche e vanno presi dal terminale MT5 (vedi sezione 8). Registro delle fonti: `quant-lab/registri/DATA_ACCESS_LOG_broker_fusion.md`.

---

## 0. Sintesi (cosa è verificato e cosa no)

| Punto | Esito | Stato |
|---|---|---|
| Entità che onboarda un residente in Italia | **Non pubblicata.** Il sito dichiara solo: ASIC = "Australian clients only"; VFSC (Vanuatu) e FSA Seychelles senza ambito per paese. Italia non è nell'elenco dei paesi esclusi (Spagna sì). Quasi certamente una delle due entità offshore, ma va confermato per iscritto. | UNVERIFIED (inferenza) |
| Tutela ESMA (leva 30:1, NBP obbligatoria, ICS) | **Nessuna evidenza che si applichi.** Né VFSC né FSA sono autorità UE. Nessun cenno a ESMA/UE/Italia nei documenti. | NOT_FOUND |
| Negative balance protection | **Discrezionale, non garantita** (policy 23/07/2026). | VERIFIED_OFFICIAL |
| Fondo di compensazione investitori | Non menzionato. | NOT_FOUND |
| Commissione Zero | 2,25 USD per lato per lotto standard (4,50 round turn) su FX e metalli. | VERIFIED_OFFICIAL |
| Swap | Formula pubblicata; **tassi non pubblicati** (solo in piattaforma). | VERIFIED_OFFICIAL (formula) / NOT_FOUND (tassi) |
| Restrizioni su arbitraggio/latenza | Clausole generiche discrezionali ("arbitraging off-market pricing", "scalping", "abnormal trading conditions" come Default Event). | VERIFIED_OFFICIAL |

---

## 1. Entità giuridica per un residente italiano

| Entità | Regolatore / numero | Ambito dichiarato | Fonte | Stato |
|---|---|---|---|---|
| FMGP Trading Group Pty Ltd (ABN 74 146 086 017) | ASIC, AFSL 385620 | "Australian Clients Only" | https://fusionmarkets.com/About-us/Regulations ; https://fusionmarkets.com/ | VERIFIED_OFFICIAL |
| Gleneagle Securities Pty Limited t/a Fusion Markets (n. societario 40256) | VFSC Vanuatu, "authorised securities dealer" | Nessun ambito per paese dichiarato | https://fusionmarkets.com/About-us/Regulations ; PDS https://fusionmarkets.com/static_images/V2_FM_PDS_VFSC_89bcbfeb60.pdf | VERIFIED_OFFICIAL |
| Fusion Markets International Ltd (Seychelles n. 8429725-1) | FSA Seychelles, licenza securities dealer SD096 | Nessun ambito per paese dichiarato | https://fusionmarkets.com/About-us/Regulations ; Client Services Agreement 30/04/2025 https://fusionmarkets.com/static_images/Client_Services_Agreement_FSA_30_Apr_2025_pdf_810d65e55d.pdf | VERIFIED_OFFICIAL |
| Fusion Markets Pty Ltd (Victoria) | Proprietaria del sito, non è una delle tre entità regolate | n/a | https://fusionmarkets.com/ (footer) | VERIFIED_OFFICIAL |
| Paesi non accettati: Afghanistan, Alberta, Congo, Iran, Iraq, Giappone, Manitoba, Myanmar, Nuova Zelanda, Corea del Nord, Ontario, Palestina, Russia, **Spagna**, Somalia, Sudan, Siria, Ucraina, Yemen, USA e territori. **Italia non è in elenco.** | n/a | n/a | https://fusionmarkets.com/ ; https://fusionmarkets.com/FAQ | VERIFIED_OFFICIAL |
| Mappa paese -> entità per l'Italia | Nessuna pagina ufficiale trovata | n/a | (ricerche su fusionmarkets.com e FAQ senza esito) | NOT_FOUND |
| Recensioni terze: una dice che gli italiani possono aprire sotto le licenze internazionali, un'altra che non è conforme ESMA; "NBP non disponibile sotto VFSC/FSA" | Contraddittorie e non autorevoli | n/a | https://comparebroker.io/brokers/is-fusion-markets-legal-in-italy (403 al fetch, solo riepilogo ricerca) | SECONDARY_SOURCE |

**Conseguenze (inferite dai documenti, non dichiarate da Fusion per l'Italia):**

| Tema | Implicazione | Fonte | Stato |
|---|---|---|---|
| Leva | Se onboardato su VFSC/FSA: default 1:100, fino a 1:500 su richiesta e "suitability". Niente tetto ESMA 30:1 per FX majors. Il tetto 30:1 è citato solo per i retail ASIC. | PDS VFSC §3 "Leverage Rates"; blog Fusion (via riepilogo ricerca) | VERIFIED_OFFICIAL (PDS 2022) / SECONDARY_SOURCE (30:1 ASIC) |
| NBP | Policy v1.0 del 23/07/2026 per VFSC e SEY: "NOT GUARANTEED, NOT AUTOMATIC", a sola discrezione, per cliente/conto, con possibile blocco prelievi fino a 10 giorni lavorativi. Schedule 1 (paesi esclusi dalla NBP): Mongolia, Turchia, Indonesia, Hong Kong, Taiwan, Vietnam, Cina. Italia non esclusa, ma l'eleggibilità resta discrezionale. Le T&C VFSC (dicembre 2026) prevedono Credit Limit e responsabilità oltre il limite (clausola 10.1(b)). | https://fusionmarkets.com/static_images/FM_NBP_Policy_SEY_VFSC_23_7_26_677577c94c.pdf | VERIFIED_OFFICIAL |
| Compensazione investitori | Nessun cenno a un fondo (né ICS italiano/CONSOB, né equivalente). Con entità extra-UE l'ICS europeo non si applica. | https://fusionmarkets.com/About-us/Regulations | NOT_FOUND |
| Segregazione | "Segregated Client Trust Accounts" (sito); il PDS VFSC prevede però che in derivati i fondi del trust possano essere usati per margini/regolamenti anche di altri clienti (clausola 7.1 Financial Product Terms). | https://fusionmarkets.com/About-us/Regulations ; https://fusionmarkets.com/static_images/Financial_Product_Terms_VFSC_e970634294.pdf | VERIFIED_OFFICIAL |
| Tutela giuridica | Cliente retail UE su entità offshore: nessuna tutela MiFID/CONSOB; reclami e foro secondo i termini dell'entità contraente. Da verificare nel contratto che si firma. | documenti sopra | UNVERIFIED |

**Azione richiesta:** scrivere a help@fusionmarkets.com chiedendo per iscritto (a) l'entità contraente per un residente in Italia, (b) il tetto di leva per FX/metalli/indici, (c) lo stato NBP, (d) il testo del contratto applicato. Verificare poi la licenza sui registri VFSC e FSA Seychelles (non consultati in questa ricerca).

---

## 2. Tipi di conto e commissioni

| Conto | Spread | Commissione | Note | Fonte | Stato |
|---|---|---|---|---|---|
| Zero | da 0,0 pip (raw) | 2,25 USD per lato per lotto standard = 4,50 USD round turn; mini lotto 0,45 | Costo totale dichiarato ~0,5 pip | https://fusionmarkets.com/Trading/Zero-Trading-Account ; https://fusionmarkets.com/Trading/Forex | VERIFIED_OFFICIAL |
| Classic | da 0,9 pip | 0 (inclusa nello spread) | Costo totale dichiarato ~0,9 pip | https://fusionmarkets.com/Trading/Products-and-accounts ; https://fusionmarkets.com/Trading/Classic-Trading-Account (solo da risultato ricerca) | VERIFIED_OFFICIAL / SECONDARY_SOURCE (pagina Classic non letta direttamente) |
| cTrader | raw | 2,25 USD per 100.000 USD di nozionale per lato; solo conto Zero | Commissione proporzionale al nozionale, non al lotto | https://fusionmarkets.com/Platforms/cTrader | VERIFIED_OFFICIAL |
| Swap Free | n/d | Nessun swap; "admin fee" solo se posizione aperta oltre 7 giorni, importo per strumento non pubblicato | Un pairs trading a lungo termine pagherebbe comunque l'admin fee | https://fusionmarkets.com/Trading/Swap-Free-Accounts | VERIFIED_OFFICIAL |
| Altre commissioni | Energy: nessuna; Crypto CFD: nessuna (solo spread); US Share CFD: 0 USD "limited-time waiver" | | https://fusionmarkets.com/Trading/Products-and-accounts ; https://fusionmarkets.com/Trading/US-share-CFDs | VERIFIED_OFFICIAL |
| Commissione indici e metalli oltre FX | Metalli: 2,25 per lato (pagina Precious Metals). Indici: non pubblicata | https://fusionmarkets.com/Trading/Precious-Metals | VERIFIED_OFFICIAL (metalli) / NOT_FOUND (indici) |
| Conversione valuta | Fino a 1,00% del valore nominale convertito (PDS 2022, entità VFSC, valuta conto AUD) | PDS VFSC §5.5 | VERIFIED_OFFICIAL (documento datato) |
| Deposito minimo | "No minimum account size" | https://fusionmarkets.com/Trading/Zero-Trading-Account | VERIFIED_OFFICIAL |
| Incoerenza | Una pagina Zero parla di "$4.5 per lot": coerente solo se round turn | riepilogo ricerca | SECONDARY_SOURCE |

---

## 3. Elenco strumenti

| Classe | Conteggio / esempi pubblicati | Fonte | Stato |
|---|---|---|---|
| Totale | "250+ products" | https://fusionmarkets.com/Trading/Products-and-accounts | VERIFIED_OFFICIAL |
| FX | "90+ currency pairs" | idem | VERIFIED_OFFICIAL |
| Metalli | Oro, argento, zinco, rame, platino "and more" (simboli non elencati nella pagina) | idem ; https://fusionmarkets.com/Trading/Precious-Metals | VERIFIED_OFFICIAL (famiglie) / NOT_FOUND (XAUUSD/XAGUSD come simboli) |
| Indici | Elenco non pubblicato nelle pagine statiche (US500, US100, GER40 **non confermati**). La pagina /Trading/Indices dà 404 | tentativo https://fusionmarkets.com/Trading/Indices | NOT_FOUND |
| Energia e soft commodities | Crude Oil, Brent, Natural Gas e altre | https://fusionmarkets.com/Trading/Energy-and-soft-commodities | VERIFIED_OFFICIAL (esempi) |
| Crypto CFD | Bitcoin, Ethereum, Dogecoin, Litecoin, Stellar, EOS "and more"; elenco completo non pubblicato | https://fusionmarkets.com/Trading/Crypto-CFD ; Products-and-accounts | VERIFIED_OFFICIAL (esempi) |
| Share CFD | Solo USA: "100+" / circa 110 società; borsa (NYSE/Nasdaq) non specificata. Nessuna azione europea citata | https://fusionmarkets.com/Trading/US-share-CFDs | VERIFIED_OFFICIAL |
| ETF CFD | Non menzionati | US-share-CFDs, Products-and-accounts | NOT_FOUND |

---

## 4. Specifiche per strumenti rappresentativi

Legenda: **n.p.** = non pubblicato nelle pagine statiche; ottenibile da MT5 (Market Watch > clic destro sul simbolo > Specification; Margin e Swap long/short in tabella; Session Times).

| Strumento | Contratto (1 lotto) | Volume minimo | Spread tipico | Leva | Swap / financing | Orari |
|---|---|---|---|---|---|---|
| EURUSD | 100.000 unità base (PDS VFSC, VERIFIED_OFFICIAL) | 0,01 lotto (VERIFIED_OFFICIAL) | "da 0,0" su Zero; media n.p. | default 1:100, fino a 1:500 su VFSC/SEY (PDS 2022); valore attuale n.p. | formula F=S×L×P; tasso n.p. | 24/5 (pagina Forex); sessioni n.p. |
| AUDUSD, NZDUSD, USDCAD | 100.000 unità base | 0,01 | n.p. | come sopra | come sopra | 24/5 |
| XAUUSD | 100 once (PDS VFSC) | 0,01 | n.p. | fino a 500:1 (pagina Precious Metals) | come FX (S×L×P) per i metalli spot | n.p. |
| XAGUSD | 5.000 once (PDS VFSC; "mini silver" 500 once) | 0,01 | n.p. | n.p. | come FX | n.p. |
| US500, US100 | n.p. (contratto/valore punto da MT5) | 0,1 (pagina Zero: "0,1 per indici e altri") | n.p. | PDS: 1:100 esempio AUS200; US500/US100 n.p. | CV×(FR/100)/360, lungo paga, corto riceve se FR positivo; **triplo il venerdì->sabato** (riepilogo ricerca) | n.p. |
| BTCUSD, ETHUSD | 1 lotto = 1 contratto crypto (PDS VFSC) | 0,01 (PDS) | BTC "da 0,04%", ETH "da 0,09%" (pagina Crypto) | **1:2 retail, 1:10 pro** (pagina Crypto) | CV×(FR/100)/360, addebito alle 0:00 server time | n.p.; trading nel weekend **non dichiarato** |
| Share CFD USA | 1 azione | n.p. | n.p. | fino a 20:1 (incoerenza 5% vs 20% nelle FAQ della pagina) | financing giornaliero lungo/corto, tassi in MT5; dividendi: long riceve 70%, short addebitato in pieno | n.p.; possibile close-only prima degli utili |

Fonti: PDS VFSC https://fusionmarkets.com/static_images/V2_FM_PDS_VFSC_89bcbfeb60.pdf (datato 28/02/2022, quindi i numeri di contratto vanno riconfermati in MT5); https://fusionmarkets.com/Trading/Precious-Metals ; https://fusionmarkets.com/Trading/Crypto-CFD ; https://fusionmarkets.com/Trading/US-share-CFDs ; https://fusionmarkets.com/Trading/Zero-Trading-Account. Stato: VERIFIED_OFFICIAL per le celle con fonte; **n.p. = NOT_FOUND**. Gli spread medi esistono in una tabella dinamica ("Average Spreads 12-16 ottobre 2026", conto Zero, aggiornata ogni ora, dati di traderproofer.com) https://fusionmarkets.com/Trading/Forex-cfd-spreads : il fetch ha restituito solo placeholder 0,0, quindi **nessun numero è stato registrato**.

---

## 5. Costi di finanziamento (swap) per tenere due gambe overnight

| Voce | Contenuto | Fonte | Stato |
|---|---|---|---|
| FX e metalli spot | F = S × L × P (S = swap giornaliero in punti, L = lotti, P = valore del pip nella valuta del conto). Esempio ufficiale: short 2 lotti EURUSD, S = -0,14 -> -2,80 USD/giorno; long 1 lotto USDJPY, S = -0,03 -> -0,39 USD/giorno | PDS VFSC §5 | VERIFIED_OFFICIAL (esempi illustrativi del 2022) |
| Origine del tasso | "Interest rate differential" tra le due valute, "determinato da Fusion Markets"; riferimento interbancario. **Nessun benchmark né markup pubblicati** per FX | https://fusionmarkets.com/static_images/Financial_Product_Terms_VFSC_e970634294.pdf cl. 6.12 | VERIFIED_OFFICIAL (assenza di markup dichiarato) |
| Indici, azioni CFD, crypto | F = CV × (FR/100) / 360. Long paga se FR negativo; short riceve se FR positivo. Esempio PDS: FR -5,61% -> -1,56 USD/giorno su 10.000 USD | PDS VFSC §5.4 | VERIFIED_OFFICIAL |
| Short su azioni | FR = tasso interbancario bid meno mark-down fino a 25% | riepilogo di ricerca su documenti Fusion (PDS ASIC) | SECONDARY_SOURCE |
| Tripla il mercoledì (FX) | Sì, mercoledì->giovedì; indici venerdì->sabato | riepilogo di ricerca su pagine Fusion | SECONDARY_SOURCE |
| Interesse su saldo positivo | **Non pagato** ("does not pay any Finance Credit Adjustment on positive balances") | PDS VFSC §5.4 | VERIFIED_OFFICIAL |
| Tassi swap attuali long/short per simbolo | **Non pubblicati**; da leggere in MT5 (Specification) o nel Hub; storico non disponibile | https://fusionmarkets.com/Trading/US-share-CFDs ("rates shown in MetaTrader 5") | NOT_FOUND |

**Pairs trading con due gambe aperte overnight:** si pagano due volte gli swap (ogni gamba ha il suo) e, per le coppie FX, i due differenziali non si compensano tra gambe su strumenti diversi. Su indici/azioni/crypto la gamba corta riceve solo se FR è positivo, e per le azioni il tasso corto è già ridotto del mark-down. Va misurato tracciando gli swap giornalieri dal terminale per le coppie candidate, non stimato.

---

## 6. Piattaforme, API, restrizioni su EA / arbitraggio / latenza

| Tema | Esito | Fonte | Stato |
|---|---|---|---|
| Piattaforme | MT4, MT5 (desktop/mobile/web), cTrader (desktop/web/mobile, copy trading), TradingView, Fusion+ Copy Trading, Multi Account Manager, DupliTrade | https://fusionmarkets.com/Trading/Products-and-accounts | VERIFIED_OFFICIAL |
| EA | "Full EA functionality with MQL5" su MT5; cTrader: cBot in C# e installazione di EA/bot | https://fusionmarkets.com/Platforms/Metatrader-5 ; https://fusionmarkets.com/Platforms/cTrader | VERIFIED_OFFICIAL |
| VPS | Gratuito se >20 lotti FX/metalli in 30 giorni (NYC per MT4/cTrader/TradingView, MT5 VPS MetaQuotes) | https://fusionmarkets.com/Platforms/Virtual-private-server (riepilogo ricerca) | SECONDARY_SOURCE |
| API di trading / dati, FIX | Nessuna menzione trovata. Per MT5 resta l'API Python MetaTrader5 lato terminale (non specifica del broker) | https://fusionmarkets.com/Platforms/cTrader (silenzio su API/FIX) | NOT_FOUND |
| Modalità conto MT5 (hedging/netting) | Non dichiarata | https://fusionmarkets.com/Platforms/Metatrader-5 | NOT_FOUND |
| Default Event (T&C VFSC, dicembre 2026) | Elenca, a "sole discretion" di Fusion e anche se commessi con "algorithmic tools": commission churning, sniping, **scalping**, **"arbitraging off-market pricing"**, uso di leva eccessiva, aprire ordini opposti per abusare del fill garantito, "taking advantage of what Fusion Markets considers to be abnormal trading conditions"; Market Manipulation (ordini eccessivi/grandi in poco tempo ecc.). Conseguenze: chiusura/annullamento di contratti (cl. 31) | https://fusionmarkets.com/static_images/VFSC_Terms_and_Conditions_December_2026_51068d37fe.pdf (definizione "Default Event") | VERIFIED_OFFICIAL |
| Client Services Agreement SEY (30/04/2025) | Fusion può sospendere/chiudere il conto se plug-in/funzioni "affect the reliability or orderly operation" dei sistemi; nessun cenno specifico ad arbitraggio | https://fusionmarkets.com/static_images/Client_Services_Agreement_FSA_30_Apr_2025_pdf_810d65e55d.pdf cl. 12.6 | VERIFIED_OFFICIAL |
| Limite leva venerdì sera | Venerdì 21:00-24:00 (GMT+3) e prima di notizie importanti, leva massima ridotta su strumenti non FX | stesso CSA SEY cl. 9.3 | VERIFIED_OFFICIAL |
| Posizioni forzate | Chiusura possibile quando il margine scende sotto 100% (discrezionale) e automatica a 50% (SEY). PDS VFSC: stop-out al 20% di Margin Level su MetaTrader | CSA SEY cl. 9.1 ; PDS VFSC | VERIFIED_OFFICIAL |
| Forum: un trader afferma blocco per presunto arbitraggio | Testimonianza non verificata | https://www.forexpeacearmy.com/community/threads/fusionmarkets-com.62392/post-448081 (da riepilogo) | SECONDARY_SOURCE |

Il pairs trading statistico non è arbitraggio sui prezzi, ma la definizione di "abnormal conditions" e "off-market pricing" è nelle mani di Fusion: un'esecuzione vicino a spike di spread o dati può essere letta male. Chiedere conferma scritta che la strategia sia ammessa.

---

## 7. Dati storici

| Tema | Esito | Fonte | Stato |
|---|---|---|---|
| Dati storici scaricabili | Non pubblicato alcun archivio. Si usa MT5 (History Center / `copy_rates`) con la profondità che il server Fusion fornisce; profondità n.p. | https://fusionmarkets.com/Platforms/Metatrader-5 (non cita dati storici) | NOT_FOUND |
| Storico spread | Strumento web "Historical Forex and CFD Spreads", conto Zero, aggiornato ogni ora, dati di terzi (traderproofer.com), indicativo | https://fusionmarkets.com/Trading/Forex-cfd-spreads | VERIFIED_OFFICIAL |
| Storico swap, tick data, API storica | Non trovati | n/a | NOT_FOUND |

Come ottenerli: scaricare da MT5 su conto demo (profondità barre M1, tick via `CopyTicksRange`); per il backtest a costi reali registrare spread e swap giornalieri dal conto live/demo, perché lo storico MT5 non contiene gli swap storici.

---

## 8. Come ottenere i numeri "non pubblicato"

1. Aprire un conto demo (il tipo Zero) e per ciascun simbolo (EURUSD, AUDUSD, NZDUSD, USDCAD, XAUUSD, XAGUSD, US500, US100, BTCUSD, ETHUSD e una share USA) leggere in MT5 la Specification: contract size, min/step volume, swap long/short, modalità swap, margine, sessioni di trading.
2. Registrare per almeno 2-4 settimane lo spread (tick) e gli swap, per ottenere medie e dispersione reali nelle ore di nostro interesse.
3. Chiedere al supporto per iscritto: entità per residenti italiani, tetto di leva, politica NBP, politica su EA/stat-arb/latenza, profondità storico, eventuale accesso API/FIX, modalità conto MT5 (hedging).
4. Verificare le licenze sui registri VFSC e FSA Seychelles (non consultati).

## 9. Limiti di questa ricerca

- Le pagine /Trading/Trading-conditions, /Trading/Forex-cfd-spreads e /FAQ restituiscono contenuto dinamico o troncato: tabelle di specifiche, leva per classe e tabella spread non sono state lette.
- Il PDS VFSC è del 28/02/2022: usato per formule e dimensioni dei contratti, ma i valori attuali vanno riconfermati.
- Il PDF "Terms and Conditions" VFSC reca la data "December 2026" (successiva alla data odierna): citato così com'è, da riverificare.
- Non è stato consultato alcun registro di regolatori, e non è stato letto il PDS ASIC.
