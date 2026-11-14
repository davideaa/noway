# Puntata 39 (gio 26/11/2026) — «Euribor e IRS» — fonti (lette il 14/11/2026)

Vintage e metodo (tutto letto il **14/11/2026**; uscita il 26/11, cioè 12 giorni dopo: i valori di mercato cambiano ogni giorno, vedi «Dubbi aperti»):
- **Euribor, definizione e panel:** pagine ufficiali EMMI (European Money Markets Institute, l'ente che pubblica il tasso), lette per intero: https://www.emmi-benchmarks.eu/benchmarks/euribor/ , .../methodology/ , .../panel-banks/. **I valori giornalieri dell'Euribor su emmi-benchmarks.eu NON sono pubblici** (pagina «Rates»: dati «Live» e «Delayed» a licenza; registrazione obbligatoria). Per i valori si è usato il **Data Portal BCE** (serie Euribor 3 mesi, fornita da Refinitiv, scaricata dall'API ufficiale).
- **Tassi BCE:** pagina «Key ECB interest rates», comunicato stampa del Consiglio direttivo del 29/10/2026 (letto), serie del Data Portal BCE (dataset FM, cambi di data).
- **Come i due tassi entrano nei mutui, e lo spread:** Banca d'Italia, guida «Comprare una casa: il mutuo ipotecario in parole semplici», **«Versione aggiornata a febbraio 2026»** (PDF italiano ufficiale, 36 pagg., scaricato e letto con `pdftotext`; PDF generato il 20/06/2026): https://www.bancaditalia.it/pubblicazioni/guide-bi/guida-mutuo/Le-guide-della-Banca-d-Italia_Comprare-una-casa_Il-mutuo-ipotecario-in-parole-semplici.pdf (pagina: https://www.bancaditalia.it/pubblicazioni/guide-bi/guida-mutuo/index.html). Più le pagine «Economia per tutti» (sotto).
- **IRS/Eurirs:** **nessun dato numerico da fonte primaria accessibile.** L'amministratore dell'ICE Swap Rate (ICE Benchmark Administration) li offre «under licence» e non mostra valori sul sito. I valori che compaiono sono **solo da aggregatori e tabelle di banche** (secondari). Vedi sezione C.
- Nel testo del reel **nessun nome di banca, di sito o di prodotto**: gli aggregatori e le banche citati qui servono solo a noi per tracciare i numeri.

## A. Che cosa sono Euribor e IRS (definizioni e ruolo nei mutui)

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, pagina) |
|---|---|---|
| «L'Euribor è un tasso di riferimento europeo, calcolato per cinque scadenze: una settimana, uno, tre, sei e dodici mesi» | EMMI: «Euribor® is a euro money market benchmark calculated for five maturities: one week, and one, three, six and twelve months.» Pubblicato la prima volta il **30/12/1998** | EMMI, «Euribor® – Euro money market reference rate», https://www.emmi-benchmarks.eu/benchmarks/euribor/ (letta 14/11/2026; senza data di aggiornamento) |
| «Misura a che tasso le banche potrebbero procurarsi denaro all'ingrosso, senza garanzie» (**non** «a cui si prestano»: vedi «Cosa NON si può dire») | EMMI: misura «the rate at which wholesale funds in euro could be obtained by credit institutions in current and former European Union and European Free Trade Association countries in the unsecured money market» | stessa pagina EMMI |
| «Lo calcola l'EMMI su dati di venti banche, ogni giorno» | **20 banche** nel panel (due italiane: non nominarle). Pubblicato «every TARGET2 day, at or shortly after 11:00 CET for each of its tenors». Metodologia «ibrida»: livello 1 = transazioni nel mercato monetario in euro non garantito (importo minimo **10 milioni di €**), livello 2 = ripiego quando le transazioni non bastano; «volume weighted average rate» | EMMI, pagine «Panel Banks» e «Hybrid Methodology», https://www.emmi-benchmarks.eu/benchmarks/euribor/panel-banks/ e .../methodology/ (14/11/2026) |
| «È un tasso così importante che la Commissione europea l'ha dichiarato "critico"» (opzionale) | EMMI: «declared a critical benchmark by the European Commission in 2016 because of its systemic importance for financial stability»; contratti e strumenti che lo usano «exceeds €100 trillion» = **oltre centomila miliardi di euro**. **Stima interna di EMMI** («in-house estimates»): attribuirla, non dirla come dato ufficiale della Commissione | EMMI, pagina Euribor |
| «Per i mutui a tasso variabile il riferimento è di solito l'Euribor; per quelli a tasso fisso di solito l'Eurirs, detto anche Irs» | Banca d'Italia: «Di solito il parametro di riferimento per il tasso fisso è l'Eurirs; per il tasso variabile i parametri di riferimento sono l'Euribor oppure il tasso ufficiale fissato dalla Banca Centrale Europea.» Glossario: «Euribor – Euro Interbank Offered Rate: Tasso interbancario definito a livello europeo, che può essere utilizzato come riferimento per i mutui a tasso variabile.» «Eurirs o Irs – Euro Interest Rate Swap: Tasso interbancario definito a livello europeo che può essere utilizzato come riferimento per i mutui a tasso fisso.» **Dire «di solito», «può essere»**: non è l'unico parametro (esiste anche il tasso BCE) | Banca d'Italia, guida «Il mutuo ipotecario in parole semplici», vers. feb. 2026, sezione «Parametro di riferimento e spread» (p. 7) e «Il mutuo dalla A alla Z» (glossario) |
| «Nel variabile il tasso è la somma di due pezzi: il tasso di riferimento e lo spread, il margine della banca» | Banca d'Italia (Economia per tutti): «Nel mutuo a tasso variabile, il tasso è dato dalla somma di due componenti: il tasso di riferimento riportato nel contratto, come ad esempio l'EURIBOR; una percentuale fissa per tutta la durata del mutuo che è il margine di guadagno della banca (lo "spread")». Guida: «il tasso di interesse è determinato in base a parametri fissati sui mercati monetari e finanziari ai quali l'intermediario aggiunge una maggiorazione, detta spread». Glossario: «Spread: Differenza fra il tasso di riferimento (per esempio l'Euribor o l'Eurirs) e il tasso di interesse concordato con il cliente» | Economia per tutti, «Mutuo ipotecario» (senza data), https://economiapertutti.bancaditalia.it/aree-tematiche/prestiti/mutuo-ipotecario/index.html · guida feb. 2026, p. 7 e glossario |
| «Lo spread resta lo stesso per tutta la durata» (solo per il variabile) | Economia per tutti: «una percentuale fissa per tutta la durata del mutuo». **Vale per questa pagina; la guida parla di rinegoziazione, che può cambiare «il parametro di riferimento, lo spread»** (glossario «Rinegoziazione»). Dire «nel contratto è fissato» | Economia per tutti, «Mutuo ipotecario»; guida, glossario |
| «Il fisso è di solito costruito come IRS più spread» | Banca d'Italia (Economia per tutti): per i mutui a tasso fisso gli IRS/Eurirs «sono tassi utilizzati come benchmark»; le banche «spesso» presentano il tasso fisso come IRS più uno spread; un fisso **nuovo** è diventato più caro perché il suo tasso dipende dai tassi di mercato, in particolare dagli IRS (**sintesi della pagina, non citazione**); **«Per un mutuo a tasso fisso che hai già, non cambia nulla.»** (frasi testuali verificate sulla pagina: «Per un mutuo a tasso fisso che hai già, non cambia nulla», «Sono tassi utilizzati come benchmark nel caso dei mutui a tasso fisso») | Banca d'Italia, Economia per tutti, «Aumento dei tassi della BCE: cosa succede al costo dei mutui?», **04/11/2022**: https://economiapertutti.bancaditalia.it/notizie-e-rubriche/notizie/aumento-dei-tassi-della-bce-cosa-succede-al-costo-dei-mutui/ (pagina del 2022: dire «la Banca d'Italia spiega» senza «oggi») |
| «L'IRS nasce da un contratto di scambio: si scambiano interessi fissi contro interessi variabili sullo stesso importo» | Banca d'Italia, glossario del potere di intervento: IRS = «Contratti derivati per scambiarsi interessi a tasso fisso e a tasso variabile, calcolati sulla base dello stesso capitale nozionale». Consob (educazione finanziaria, «I derivati»): nello swap «plain vanilla» un flusso è a tasso fisso e l'altro a tasso variabile. La pagina Banca d'Italia non ha data. **Nessuna fonte letta dice «tasso swap a lungo termine = scadenza uguale alla durata del mutuo»**: non dirlo | Banca d'Italia, https://www.bancaditalia.it/compiti/stabilita-finanziaria/potere-intervento/potere-glossario/index.html (senza data) · Consob, https://www.consob.it/web/investor-education/derivati (letta solo nel riassunto di ricerca, non aperta) |
| «L'Euribor è influenzato dalla BCE; i tassi di mercato seguono, e spesso anticipano, i tassi della BCE» (**unico nesso causale ammesso**) | Economia per tutti (mutuo ipotecario): «l'EURIBOR è influenzato dalla Banca centrale europea»; (2022): i tassi di mercato, Euribor e IRS, «seguono e spesso anticipano l'andamento dei tassi della BCE»; «I tassi BCE influenzano direttamente le rate dei mutui a tasso variabile» **quando il contratto è legato ai tassi BCE** | Economia per tutti, «Mutuo ipotecario» (senza data) e «Aumento dei tassi della BCE…» (04/11/2022) |
| «Se il tasso di riferimento sale, il variabile costa di più; se scende, paghi meno» | Economia per tutti: «se il tasso di riferimento sale, il tuo mutuo diventa più costoso; se scende, paghi meno»; guida: «Il rischio principale è un aumento dell'importo delle rate… l'effetto di un rialzo dei tassi ha un impatto più rilevante sui mutui con scadenza più lunga» | Economia per tutti, «Mutuo ipotecario»; guida feb. 2026, p. 6 |
| «I parametri si formano sui mercati: la banca non li decide» | Guida: parametri «fissati sui mercati monetari e finanziari ai quali l'intermediario aggiunge una maggiorazione». **Non dire «la banca non può manipolarli»**: nessuna fonte letta lo afferma, e l'Euribor ha una storia di indagini (non cercata) | guida feb. 2026, p. 7 |

## B. Valori verificati

### B1. Euribor a 3 mesi (serie BCE, medie mensili; serie fornita da Refinitiv)

Fonte: **Banca centrale europea, Data Portal (SDW), dataset FM, serie `FM.M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA`**, «Euribor 3-month – Historical close, average of observations through period», frequenza mensile. Scaricata dall'API il **14/11/2026**: `https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA?startPeriod=2019-01&format=csvdata` (94 osservazioni, gennaio 2019 – **ottobre 2026**; l'ultima disponibile è il **mese di ottobre**, novembre non c'è ancora). **È una media del mese, non il fixing EMMI del giorno.**

| Detto nel reel | Dato esatto | Fonte |
|---|---|---|
| «In ottobre 2026 l'Euribor a tre mesi è stato in media circa due virgola sei per cento» | ottobre 2026: **2,6347 %**; settembre 2026: 2,6350 %; agosto 2026: 2,5131 %; luglio 2026: 2,4254 % | BCE Data Portal, serie sopra (14/11/2026) |
| «Alla fine del 2021 era sotto zero: circa meno zero virgola sei per cento» | dicembre 2021: **−0,5820 %** (minimo dal gennaio 2019). Gennaio 2019: −0,308 % | stessa serie |
| «Dal gennaio 2019 a giugno 2022, per quarantadue mesi di fila, la media mensile è stata sotto zero» | **42 mesi su 42** con media mensile negativa (gen 2019 – giu 2022); **luglio 2022: +0,0366 %** (primo mese positivo). Controllo nostro sui 94 punti | stessa serie, calcolo nostro |
| «Ha toccato quasi il quattro per cento» (a fine 2023) | massimo dal 2019: novembre 2023 **3,9716 %** (ottobre 2023: 3,9676 %). Dire «quasi quattro per cento» | stessa serie |
| (per la puntata di domani, non per la 39) percorso 2022: lug 0,04 · ago 0,39 · set 1,01 · ott 1,43 · nov 1,83 · dic 2,06 (medie mensili, %) | | stessa serie |
| Altri punti utili: dicembre 2024 2,82 %; ottobre 2024 3,17 %; ottobre 2025 2,03 %; gennaio 2026 2,03 % | | stessa serie |

**Ultimo fixing giornaliero trovato (SECONDARIO, non primario):** 3 mesi **2,765 %** al **03/11/2026** (2,714 % il 02/11), 1 mese 2,435 %, 6 mesi 3,006 %: da un aggregatore di mutui, **letto solo nel risultato di ricerca; la pagina non si apre dal nostro ambiente** (errore 503). **NON VERIFICATO** su EMMI (i valori sono a licenza): non usare come numero del reel. Serve solo a sapere che a inizio novembre il valore era sopra la media di ottobre (2,63).

### B2. Tassi ufficiali BCE

| Detto nel reel | Dato esatto | Fonte |
|---|---|---|
| «Il tasso della BCE sui depositi è oggi due e mezzo per cento, dal sedici settembre 2026» | **Deposit facility 2,50 %**; operazioni di rifinanziamento principali **2,65 %**; rifinanziamento marginale **2,90 %**, in vigore dal **16/09/2026** (incrementi da 2,25 / 2,40 / 2,65 del 17/06/2026). Confermati «unchanged at 2.50%, 2.65% and 2.90% respectively» nel comunicato del **29/10/2026** | BCE, «Key ECB interest rates», https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html (14/11/2026) · BCE, «Monetary policy decisions», 29/10/2026, https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp261029~9a493adf17.en.html · serie dataset FM `D.U2.EUR.4F.KR.DFR.LEV` (stesse date) |
| Storia utile: depositi **2,00 %** dall'11/06/2025 al 16/06/2026; 2,25 % dal 17/06/2026; 2,50 % dal 16/09/2026 | due rialzi nel 2026, dopo un anno invariato | Data Portal BCE, serie `D.U2.EUR.4F.KR.DFR.LEV` (date di decorrenza), 14/11/2026 |
| «Il prossimo incontro del Consiglio direttivo è il 17 dicembre 2026» | riunione di politica monetaria 16–17/12/2026 (conferenza stampa il 17): **dopo l'uscita della puntata**, quindi i tre tassi sono stabili fino al 26/11 salvo decisioni straordinarie (non previste) | BCE, calendario del Consiglio direttivo, https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html |
| **Attenzione: quale «tasso BCE»?** | La Banca d'Italia dice «tasso ufficiale fissato dalla BCE» senza specificare; nel suo esempio del 2022 lo spread è calcolato sul tasso di rifinanziamento principale. Nel reel dire «il tasso della BCE sui depositi» (2,50) **oppure** «il tasso principale della BCE» (2,65), **mai «il tasso della BCE» da solo** con un numero | Economia per tutti (04/11/2022); BCE |

### B3. IRS / Eurirs a lunga scadenza

**Non c'è un valore da fonte primaria.** ICE Benchmark Administration (amministratore dell'ICE Swap Rate, con impostazioni in euro da 1 a 30 anni) mette i valori «under licence» e la pagina pubblica non li mostra: https://www.ice.com/iba/ice-swap-rate (letta 14/11/2026). La Banca d'Italia e l'EMMI non pubblicano la serie. **Che l'«IRS dei mutui» di una banca sia l'ICE Swap Rate non è confermato da fonte neutra**: l'unico documento aperto è il «Piano di sostituzione» di una banca (aggiornato a dicembre 2025), che descrive «il tasso ICE SWAP dell'Euro» rilevato da IBA e pubblicato su un circuito di dati finanziari; per questo **«IRS» o «Eurirs» nel contratto va letto con il nome esatto che vi compare**.

Valori **SECONDARI** (non usarli come dati del reel; li riporto per l'ordine di grandezza e perché la scheda li chiede):

| Valore | Data | Fonte (secondaria) | Stato |
|---|---|---|---|
| IRS 20 anni **3,40 %** (25 anni 3,32 %; 30 anni 3,24 %; 10 anni 3,36 %; 15 anni 3,41 %) | **10/11/2026** | aggregatore di mutui, pagina «Aggiornamento tassi Eurirs Euribor 10 novembre 2026»: **letta solo nel risultato di ricerca, non aperta** (503) | **NON VERIFICATO** |
| IRS 20 anni 3,40 % → 3,44 % il 2/11 (3,38 % il 9/11) | 02–10/11/2026 | stesso aggregatore, stesse condizioni | **NON VERIFICATO** |
| IRS 20 anni **3,14 %**, 25 anni 3,12 %, 30 anni 3,08 %, 15 anni 3,08 %, 10 anni 2,92 % | **01/07/2026** (rilevati dal quotidiano economico il primo giorno del mese, «IRS di periodo lettera») | tabella «Rilevazione degli indici di riferimento» di una banca locale (PDF 7.2026), aperta e letta | secondario, ma documento reale |
| Stesso documento: IRS 20 anni 3,26 % al 1/1/2026; 3,19 % al 1/6/2026 (3,21 % per 25 anni) | | stessa tabella | secondario |

**Come usarli:** se la puntata vuole un ordine di grandezza per l'IRS, la sola formula coerente con tutte le letture è **«oltre il tre per cento»** (luglio 3,14 %; novembre 3,40 %), **detta senza data né scadenza precisa** e solo dopo aver riaperto un riferimento aggiornato (vedi «Dubbi aperti» n. 2). In alternativa la puntata **non dà il numero dell'IRS** e confronta soltanto le due «basi» senza cifra (consigliato).

## C. Cosa NON si può dire

- **NON previsioni**: niente «i tassi scenderanno / saliranno», «a dicembre la BCE alzerà», «l'Euribor tornerà a…». Nemmeno condizionali («se la BCE…»). La Banca d'Italia stessa scrive «nessuno può prevedere l'andamento dei tassi ufficiali stabiliti dalla BCE» (Economia per tutti, «Mutuo ipotecario»): si può citare.
- **NON consigli**: niente «conviene il fisso / il variabile», «controlla lo spread», «negozia», «cambia mutuo», nemmeno rivolti allo spettatore. Forme ammesse: «la Banca d'Italia spiega che…», «il tasso del contratto si legge così». Il «ti serve» della scheda («leggere le clausole del contratto») si dice come **descrizione** («nel contratto trovi scritti il tasso di riferimento e lo spread»), non come ordine.
- **NON «l'Euribor è il tasso a cui le banche si prestano denaro»** come fatto: EMMI dice «could be obtained» (potrebbe essere ottenuto), calcolato da contributi di 20 banche con transazioni all'ingrosso senza garanzie; Economia per tutti scrive che deriva dai tassi ai quali banche europee prestano e si prestano euro senza garanzia «per brevi periodi». Dire «il tasso a cui le grandi banche europee possono procurarsi denaro per pochi mesi, senza garanzie».
- **NON «l'Euribor lo decide la BCE»**: l'Euribor lo calcola EMMI, lo pubblica ogni giorno ~11:00 CET, ed è «influenzato» dalla BCE (formula della Banca d'Italia). Niente «segue sempre la BCE».
- **NON «il fisso usa sempre l'IRS e il variabile sempre l'Euribor»**: la fonte dice «di solito» / «può essere»; esistono variabili legati al tasso BCE (sempre la guida).
- **NON «il tasso del fisso cambia con l'IRS» per un mutuo già firmato**: la fonte dice l'opposto («non cambia nulla»); l'IRS conta per **i nuovi** fissi (e al momento della firma).
- **NON dare lo spread come numero tipico** («le banche applicano l'uno e mezzo»): nessun dato verificato (non cercato) su spread medi. Il «1,5 %» è l'esempio di Economia per tutti (2022), da dire «ad esempio».
- **NON «l'IRS è il tasso dei contratti swap a lungo termine» senza precisare**: la fonte dice che l'IRS è un contratto di scambio fisso/variabile; che le scadenze siano «lunghe» o uguali alla durata del mutuo non è scritto nelle fonti Banca d'Italia/Consob lette. Per la scena: «l'IRS nasce da un contratto in cui due parti si scambiano interessi fissi contro variabili».
- **NON dire «il fixing di oggi»**, «ieri l'Euribor era…», date precise del giorno: invecchiano e non sono verificabili su EMMI (dati a licenza).
- **NON dire «l'Euribor non è mai stato manipolato / è affidabile / è sicuro»**: nessun giudizio. **NON attribuire a EMMI o alla Commissione** la cifra «oltre centomila miliardi» senza «secondo una stima dell'EMMI».
- **NON nominare**: banche (nemmeno le due italiane del panel), siti di confronto, il nome di indici proprietari («ICE Swap Rate» è un marchio: nessun nome nel reel; nel testo «tasso Irs»).
- **NON confondere con la puntata 40** (rate 2022–23): lì il caso reale. Qui niente «nel 2022 le rate sono salite di centinaia di euro» (dato non verificato qui) né il percorso 2022 come anticipazione causale.
- **Teoria da attribuire**: «tasso = riferimento + spread» è la **formula della Banca d'Italia** (guida e Economia per tutti); non è «una legge». La scheda dice «il tasso del tuo mutuo è il riferimento più uno spread»: scriverlo «secondo la Banca d'Italia».

## D. Dubbi aperti (e date di ricontrollo)

1. **Valori che cambiano ogni giorno.** L'Euribor 3 mesi dell'ultimo fixing (secondario, 2,765 % il 3/11) e l'IRS cambiano ogni giorno. **Come dirli senza che invecchino:** usare la **media di ottobre 2026** (serie BCE, 2,63 %: dato chiuso, non cambierà) con la dicitura «in ottobre in media» e il **confronto storico** (−0,58 % a dicembre 2021, quasi 4 % a novembre 2023). Il valore del giorno non si dice. Una frase pronta: «A ottobre, in media, l'Euribor a tre mesi era circa due virgola sei per cento».
2. **IRS: nessun numero primario.** Ricontrollare **mer 25/11 sera e gio 26/11 mattina (entro le 11:30, prima del post delle 12:00)**: (a) se EMMI/ICE aprono una pagina con valori; (b) se la pagina dell'aggregatore del 10/11 (o successiva) si riesce ad aprire e riporta IRS 20 anni ancora sopra il 3 %; (c) cercare una tabella pubblica della Banca d'Italia (non trovata). Se non si trova nulla, **la puntata non dà numeri sull'IRS**.
3. **Mese di novembre della serie BCE:** appare di solito a fine/inizio mese; se il **25/11** o il **26/11** compare una media provvisoria di novembre, usare comunque **ottobre** (mese intero).
4. **Tassi BCE:** invariati fino al **17/12/2026** (riunione 16–17/12). Ricontrollare il **26/11** che «Key ECB interest rates» riporti ancora 2,50/2,65/2,90 (decisione straordinaria improbabile, non previsione).
5. **Guida Banca d'Italia sul mutuo:** versione di febbraio 2026; ricontrollare il **25/11** se esiste una nuova versione (https://www.bancaditalia.it/pubblicazioni/guide-bi/guida-mutuo/index.html); le definizioni di Euribor/Eurirs/spread non è probabile che cambino.
6. **Pagine «Economia per tutti» senza data** (mutuo ipotecario) e quella del **04/11/2022** (BCE e mutui): non usare «oggi»; coerenza con il resto della settimana (puntata 38 «Fisso o variabile» usa la stessa guida).
7. **Panel EMMI di 20 banche:** pagina senza data; ricontrollare il **25/11** che il numero sia invariato, altrimenti dire «una ventina di banche».
8. **Consob «I derivati»:** non aperta (solo riassunto di ricerca): se la puntata la cita, aprirla prima (https://www.consob.it/web/investor-education/derivati).
9. **Serie BCE «fornita da Refinitiv»:** è la serie BCE dell'Euribor 3 mesi (medie mensili), non la serie EMMI. La differenza con le medie calcolate su EMMI è **trascurabile ma non verificata**; per questo si dice «circa».
10. **«Euribor» è un marchio registrato di EMMI** (la pagina scrive «Euribor®»): nel reel si usa come nome del tasso (come fa la Banca d'Italia), senza «®» e senza logo. Se si vuole prudenza assoluta: «il tasso interbancario europeo, detto Euribor».
11. **Euribor 12 mesi, 6 mesi, 1 mese:** non cercati (solo 3 mesi, come da scheda).
12. **Esempio con le cifre dello spread:** la scheda («esempio») rimanda alla serie 3 mesi dal 2019 («Data Portal BCE»): fatto (B1). Se la grafica mostra una linea dal 2019, il dato è mensile, non giornaliero: dirlo («media mensile»).

## E. Come dirli a voce: pronuncia delle sigle (la voce sintetica sbaglia le sigle a fine frase)

Regole dal registro di `PROCEDURA-PUNTATE.md` (11/11: «Taeg» → «tag», «Tan» → «contano», «Crif» in chiusura mai pulito; «Pil» a fine frase fallisce; sigle mai in fine frase né attaccate a una parola che comincia con la stessa consonante). **Le grafie qui sotto sono proposte: non provate sulla voce**, da testare con `rigenera2.py` prima di scegliere (e se `controlla_copione.py` blocca le sigle in maiuscolo, usare le forme scritte come si pronunciano).

| Sigla / termine | Suggerimento nel copione | Note |
|---|---|---|
| Euribor | «l'Euribor» **a metà frase**; mai in fondo; alternativa «il tasso interbancario europeo, detto Euribor» (con «detto» prima) | Possibile problema «l'Eu-»: provare «l'Èuribor» solo se la prima forma fallisce. Pronuncia italiana: eu-rì-bor |
| IRS / Eurirs | «il tasso Irs» (scritto come si pronuncia, minuscolo dopo la I); per sicurezza anche «l'Irs, cioè il tasso dei contratti di scambio». **Evitare «Eurirs»**; mai «IRS» maiuscolo; mai a fine frase | Se la voce legge «ìrs» va bene; se legge «iers»/«ir» → provare «i erre esse» (compitato) o chiamarlo **«il tasso swap»** (parola inglese comune, già in italiano) |
| BCE | **«la Banca centrale europea»** sempre, esteso; mai «Bce» | già normale nelle puntate precedenti |
| EMMI | **«l'Istituto europeo dei mercati monetari»** (traduzione nostra, EMMI è «European Money Markets Institute»; lo scrivo come descrizione, non come nome ufficiale) oppure «l'ente che lo calcola». Mai «Emmi» | **Non** «l'istituto che lo pubblica a Bruxelles» (sede non verificata) |
| spread | «lo spread» a metà frase; mai a fine; se dà problemi «lo sprèd». Sinonimo detto una volta: «il margine della banca» (come la Banca d'Italia) | evitare «spread sul» (due «s») |
| TARGET2, CET, nostro «ICE» | non dirli | non servono |
| Percentuali | **in lettere, arrotondate**: «circa due virgola sei per cento», «due e mezzo per cento», «meno zero virgola sei», «quasi quattro per cento», «quarantadue mesi», «oltre centomila miliardi di euro» | «zero virgola sei» evita «60» / «0,6»; non dire «due sessantacinque». Attenzione al segno meno: «sotto zero, circa meno zero virgola sei per cento» (la parola «meno» detta bene) |
| Date | «il sedici settembre» · «il diciassette dicembre» · «a ottobre» | «dal gennaio duemiladiciannove» (anno in lettere) |

Frasi di prova (mettere in `controlla_copione.py` e in voce):
- «L'Euribor è un tasso calcolato ogni giorno da un istituto europeo, sulle operazioni di venti banche.» (sigla a inizio frase: provare anche «Il tasso Euribor…»)
- «Nei mutui a tasso variabile, di solito, il riferimento è l'Euribor; in quelli a tasso fisso, di solito, il tasso Irs.»
- «Il tasso del mutuo è il riferimento più lo spread: il margine della banca.» (attenzione a «più lo spread» = «lo s…» ripetuto: se sbaglia, «più il margine della banca, detto spread»)

## F. Esempi didattici inventati («cifre illustrative, non dati»)

| Esempio nel reel | Natura |
|---|---|
| «Se il tasso di riferimento è due e mezzo e lo spread uno e mezzo, il tasso del mutuo è quattro» | **Cifre illustrative, non dati.** Aritmetica: 2,5 + 1,5 = 4,0. Il «1,5 %» di spread è l'esempio di Economia per tutti (2022), **non** uno spread di mercato. Il «2,5» coincide col tasso BCE sui depositi (2,50 %) ma **non** è l'Euribor (2,63 % in media a ottobre): usare «due e mezzo» come esempio e dirlo («ad esempio») |
| «Con Euribor a circa due virgola sei e uno spread di uno e mezzo, il tasso sarebbe circa quattro virgola uno» | **Cifre illustrative:** unisce un dato vero (2,63 %, ECB, media di ottobre) a un esempio (spread 1,5 %). 2,63 + 1,5 = 4,13 → «circa quattro virgola uno». Non dire «il tuo mutuo è…» |
| Immagine «le due torri»: stessa base «spread» sopra due basi diverse | Illustrativa. Le altezze non rappresentano quote di mercato né dati |

## G. Prova della settimana 8: confronto concreto per la scena d'apertura

Regola (registro 14/11 in `PROCEDURA-PUNTATE.md`): nei primi ~4 s dopo il numero della puntata, **un'immagine di oggetti o sagome in due gruppi da confrontare, già in movimento dal primo fotogramma**; **nessun numerone gigante o contatore**; la cifra, se c'è, entra piccola come etichetta dopo l'immagine. Il regista scrive in testa a `p39.html` la riga che dice se la scena d'apertura rispetta la regola. Nessun numero «di mercato» è nelle proposte: tutte usano forme e solo parole («giorno», «anni», «spread»), così non invecchiano e non servono fonti. Gancio della scheda: «I mutui italiani dipendono da due tassi che quasi nessuno conosce.» (affermazione da attenuare: «che quasi nessuno conosce» **non è un dato**; la scheda la usa come gancio retorico. Se si vuole tenerla, va detta come domanda: «Quanti conoscono i due tassi da cui dipende il tuo mutuo?» — nessun dato su quante persone li conoscano è stato cercato.)

**Proposta 1 — «Due basi sotto lo stesso blocco» (consigliata)**
- Due gruppi: a sinistra una **torretta di tanti piccoli blocchi di vetro** che si riassestano continuamente (alti e bassi ogni mezzo secondo): è l'Euribor, il riferimento «che si muove». A destra **un solo basamento largo e lento**, che oscilla appena: l'IRS. Sopra **ciascuna torre, lo stesso blocco ambra identico**, immobile e della stessa altezza: lo spread.
- Mossa dal frame 0: i blocchi a sinistra già saltano, il blocco ambra sopra va su e giù seguendo la base; a destra quasi fermo. Etichette piccole sotto, che entrano sulla parola: «Euribor», «Irs», «spread».
- Perché regge: due gruppi da confrontare (base che si muove / base ferma), concreta, nessuna cifra; coerente con «tasso = riferimento + spread» (Banca d'Italia). **Non dice nulla sulle scadenze degli swap** (non verificate).

**Proposta 2 — «Tanti calendari corti contro un nastro lungo»**
- Due gruppi: a sinistra **quattro-cinque piccole tessere-calendario** che si accendono una dopo l'altra e si resettano (scadenze corte: una delle cinque scadenze dell'Euribor); a destra **un solo nastro lungo** che scorre lento da un bordo all'altro (l'orizzonte lungo).
- Nel frame 0 le tessere si accendono già; la cifra, se c'è, piccola dopo: «3 mesi» sopra le tessere (è una delle cinque scadenze EMMI: una settimana, 1, 3, 6, 12 mesi).
- Nota: la **durata del nastro** si indica come «anni» senza cifra. Non dire che «l'IRS ha la durata del mutuo» (non verificato) né che «il variabile cambia ogni tre mesi» (le scadenze di adeguamento sono di contratto: la guida dice «a scadenze prestabilite»).

**Proposta 3 — «Due fila di case: una con il filo, una con l'ancora»**
- Due gruppi: a sinistra **sei sagome-casa di vetro** ciascuna legata con un filo sottile a un **unico cursore che sale e scende** (l'Euribor): le case si inclinano insieme; a destra **sei sagome-casa** ciascuna con **un'ancora**, ferme, mentre sopra di loro passa una linea ondulata che le ignora (il tasso di mercato che cambia: «Per un mutuo fisso che hai già, non cambia nulla», Banca d'Italia).
- Dal frame 0 le sei case a sinistra oscillano con il cursore; a destra solo la linea passa. Etichette piccole: «variabile», «fisso già firmato». Nessuna cifra.
- Rischio: richiama la puntata 38 (due binari); **ricordare che la 38 usa «due binari di vetro»** per fisso/variabile (scheda): evitare una scena troppo simile. La 39 vuole mostrare «due riferimenti», non «due mutui»: la **Proposta 1 è la più distinta dalla 38**.

Per tutte: nessuna linea del tempo con numeri in apertura, nessun contatore, nessun nome di banca; il testo grande entra **dopo i primi 4 s**; «Euribor» e «Irs» come parole sulle scene successive.

## Elenco rapido: i dati più forti per la puntata

1. **Quarantadue mesi sotto zero**: Euribor 3 mesi, media mensile negativa da gennaio 2019 a giugno 2022 (primo mese positivo: luglio 2022, +0,04 %). BCE Data Portal, serie `FM.M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA`, letta 14/11/2026.
2. **Da −0,58 % a quasi 4 %**: dicembre 2021 −0,5820 %; novembre 2023 3,9716 % (stessa serie). Ottobre 2026: **2,63 %** in media.
3. **EMMI**: calcola l'Euribor su dati di **20 banche**, pubblicato ogni giorno lavorativo TARGET2 intorno alle 11:00 CET, 5 scadenze (1 settimana, 1, 3, 6, 12 mesi); strumenti che lo usano **oltre 100 mila miliardi di euro** (stima interna EMMI).
4. **Banca d'Italia**: «Di solito il parametro di riferimento per il tasso fisso è l'Eurirs; per il tasso variabile… l'Euribor oppure il tasso ufficiale fissato dalla BCE»; tasso = parametro + **spread**, «il margine di guadagno della banca» (guida feb. 2026; Economia per tutti).
5. **Mutuo fisso già firmato**: «non cambia nulla» quando i tassi di mercato salgono (Economia per tutti, 04/11/2022).
6. **BCE**: depositi **2,50 %** dal 16/09/2026; invariati il 29/10/2026; prossima riunione 16–17/12/2026.
7. **IRS**: nessun valore primario; ordine di grandezza secondario **oltre il 3 %** (3,14 % il 1/7/2026, 3,40 % il 10/11/2026 per 20 anni, **NON VERIFICATO**).
