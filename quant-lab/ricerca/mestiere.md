# Il mestiere dell'arbitraggio statistico

_Aggiornato: 2026-11-14. Dove scrivo "non verificato" non ho trovato una fonte affidabile._


## Come è nata: dagli anni '80 ad oggi

L'idea di base è semplice: prendi due azioni che di solito si muovono insieme. Se un giorno si separano troppo, compri quella che è scesa e vendi quella che è salita, scommettendo che tornino vicine. Questo si chiama pairs trading, ed è la forma più semplice di arbitraggio statistico (stat arb).

Secondo il libro di Richard Bookstaber (citato da Wikipedia, quindi fonte di seconda mano), l'idea fu messa in pratica per primo da Gerry Bamberger, programmatore a Morgan Stanley, e poi sviluppata negli anni '80 dal gruppo quantitativo guidato da Nunzio Tartaglia. Le cifre che circolano (6 milioni di dollari il primo anno, 50 milioni nel 1987) vengono da ricostruzioni di terzi: le riportiamo come non verificate.

Il gruppo di Morgan Stanley, secondo le stesse ricostruzioni, si sciolse intorno al 1989 dopo un paio di anni andati male. Non verificato con una fonte primaria.

David E. Shaw lavorò a Morgan Stanley nel gruppo di Tartaglia (arrivò nel 1986 secondo le fonti trovate) e poi fondò D. E. Shaw & Co. nel 1988. Il sito della società dice che partì con sei dipendenti e 28 milioni di dollari. Fin dall'inizio gestiva strategie 'market neutral', tra cui l'arbitraggio statistico.

Il primo studio accademico serio è di Gatev, Goetzmann e Rouwenhorst (circolato dal 1998, pubblicato nel 2006). Su dati americani 1962-2002 trovò rendimenti in eccesso fino all'11% annuo per un portafoglio di coppie, e profitti che di solito superavano stime prudenti dei costi. Gli stessi autori dicono che una parte può dipendere da effetti di microstruttura del mercato.

Più tardi si è passati a metodi più complessi. Avellaneda e Lee (2010) hanno costruito strategie 'market neutral' con l'analisi delle componenti principali (PCA) e coi fondi ETF di settore. Nell'abstract pubblicato lo Sharpe è 0,9 per il periodo 2003-2007 con PCA; le bozze precedenti riportavano 1,44 per il 1997-2007. Le versioni non coincidono: va citata solo quella pubblicata.

Nell'agosto 2007 ci fu il cosiddetto 'quant quake'. Khandani e Lo mostrano che nella settimana del 6 agosto molti fondi azionari quantitativi ebbero perdite senza precedenti, seguite da un forte recupero il 10 agosto. La loro ipotesi: la causa fu la vendita forzata e rapida di uno o più grandi portafogli quantitativi market neutral (forse per un margin call). Poi stop-loss e riduzioni di leva su altri fondi simili amplificarono le perdite. Lo ricordiamo perché mostra il rischio principale: tanti fondi fanno operazioni simili, quindi se uno esce, tutti perdono.

I profitti dei metodi semplici sono calati. Do e Faff (2010) trovano che il rendimento mensile medio in eccesso delle prime 20 coppie scese da 0,86% (1962-1988) a 0,37% (1989-2002), e poi ancora dopo. Secondo il loro studio, la crescita dei rischi dell'arbitraggio spiega fino al 70% del calo. L'articolo completo è a pagamento: ho letto solo l'abstract.

**Fonti**

- [Khandani & Lo, What Happened to the Quants in August 2007 (pagina MIT)](https://web.mit.edu/~alo/www/Papers/august07.html)
- [Gatev, Goetzmann, Rouwenhorst, Pairs Trading (NBER / RePEc)](https://econpapers.repec.org/RePEc:oup:rfinst:v:19:y:2006:i:3:p:797-827)
- [Avellaneda & Lee, Statistical arbitrage in the US equities market](https://econpapers.repec.org/RePEc:taf:quantf:v:10:y:2010:i:7:p:761-782)
- [Do & Faff, Does Simple Pairs Trading Still Work? (CFA Institute)](https://rpc.cfainstitute.org/en/research/financial-analysts-journal/2010/does-simple-pairs-trading-still-work)
- [Pairs trade (Wikipedia, solo per orientamento)](https://en.wikipedia.org/wiki/Pairs_trade)
- [D. E. Shaw, Who we are](https://deshaw.com/who-we-are)
- [Public Integrity, profilo di D. E. Shaw (storia dei primi anni)](https://publicintegrity.org/politics/cyber-profits-add-up-to-secretive-success-story/)
- [Krauss, Statistical arbitrage pairs trading strategies: Review and outlook (2017)](https://econpapers.repec.org/RePEc:bla:jecsur:v:31:y:2017:i:2:p:513-545)

## Chi lo fa oggi

Fondi hedge quantitativi: D. E. Shaw esiste ancora ed è citato come esempio, ma le cifre sul suo patrimonio gestito nelle fonti trovate sono in conflitto, quindi non le riporto.

Fondi 'multi-strategy' o 'pod shop' (Millennium, Citadel, Point72, Balyasny): sono grandi piattaforme con tanti piccoli team (pod) indipendenti, ognuno con un gestore. Le ricostruzioni di stampa e blog parlano per Millennium di oltre 300 team e circa 80 miliardi di dollari, ma sono fonti secondarie con date miste: approssimative. Non sono documentati qui team solo di stat arb, anche se queste piattaforme ne ospitano.

Banche: dopo la regola Volcker (sezione 619 del Dodd-Frank), le banche con depositi non possono più fare trading proprietario a breve termine. Nel 2010 Goldman Sachs decise di scorporare la sua unità Principal Strategies in un fondo indipendente, e vari trader lasciarono le banche per fondare fondi propri. Fonti del 2010-2012; non so lo stato attuale.

Società di trading proprietario e market maker (per esempio Citadel Securities, Jump Trading): usano denaro proprio e assumono ricercatori quantitativi. Le offerte di lavoro citano matematica, statistica, fisica, informatica.

Market maker crypto: non ho trovato una fonte affidabile che documenti il loro arbitraggio statistico. L'unica base solida trovata è lo studio di Makarov e Schoar sull'arbitraggio tra borse crypto. Il resto è non verificato.

**Fonti**

- [Goldman spin-out dopo la Volcker (CNBC, 2010)](https://www.cnbc.com/id/38593917)
- [Pod shop: Quant Enthusiasts (Substack, fonte secondaria)](https://youngandcalculated.substack.com/p/risk-management-inside-a-pod-how)
- [Pod shop: eFinancialCareers](https://www.efinancialcareers.com/news/2023/10/citadel-millennium-hedge-funds)
- [Citadel Securities: PhD e assunzioni (eFinancialCareers)](https://www.efinancialcareers.com/news/phd-citadel-securities)
- [Makarov & Schoar, Trading and Arbitrage in Cryptocurrency Markets (JFE 2020)](https://econpapers.repec.org/RePEc:eee:jfinec:v:135:y:2020:i:2:p:293-319)

## Come lo fanno: dati, infrastruttura, rischio

Dati: la ricerca accademica usa prezzi giornalieri (Gatev e coautori). I professionisti che fanno strategie veloci usano dati tick e order book; non ho trovato una fonte con prezzi precisi, quindi non do cifre sui costi dei dati.

Infrastruttura: i data center hanno sostituito il pavimento di Borsa. Per strategie sensibili alla velocità si usa il co-location, cioè i server vicino al motore dell'exchange. Una fonte orientata a trader retail stima da 9.000 a 60.000 dollari al mese più 30.000-200.000 di hardware: due stime in conflitto, di scarsa affidabilità, da prendere solo come ordine di grandezza. Servono solo per le strategie ad alta frequenza, non per il pairs trading lento.

Vendere allo scoperto: serve prendere in prestito le azioni. Un esempio dal sito di Interactive Brokers: il costo di prestito è un tasso annuo, più alto sui titoli 'hard to borrow' e può salire fino al 100% in uno short squeeze; sui soldi incassati dalla vendita si può ricevere un interesse che compensa in parte.

Rischio: il rischio chiave è che i due prezzi non tornino insieme e la distanza continui a crescere. Wikipedia lo dice chiaramente: il pairs trading non è privo di rischi. Il 'quant quake' del 2007 mostra anche il rischio di affollamento. Gli istituzionali cercano di neutralizzare i fattori (mercato, settore) con modelli di rischio. Questo è il metodo di Avellaneda e Lee con PCA.

Capacità e dimensioni dei team: non ho trovato fonti verificabili su capacità massima delle strategie né sulla dimensione dei team. Dato non verificato. Un dato: Citadel Securities ha 1.700 dipendenti, di cui circa 260 con PhD (fonte eFinancialCareers, data dell'articolo non verificata).

Prime broker e leva: non ho trovato una fonte primaria che spieghi condizioni e costi dei prime broker. Non verificato.

**Fonti**

- [Interactive Brokers, Short Sale Cost (pagina ufficiale, non leggibile direttamente)](https://www.interactivebrokers.com/en/pricing/short-sale-cost.php)
- [Interactive Brokers Campus, rischi dello short: borrow fees](https://www.interactivebrokers.com/campus/traders-insight/securities/short-selling/the-risks-of-shorting-series-part-ii-borrow-fees/)
- [NexusFi, co-location (fonte retail, stime incerte)](https://nexusfi.com/a/exchanges/exchange-colocation-direct-market-access)
- [Pairs trade (Wikipedia, solo per orientamento)](https://en.wikipedia.org/wiki/Pairs_trade)
- [Citadel Securities: PhD (eFinancialCareers)](https://www.efinancialcareers.com/news/phd-citadel-securities)

## Studi e carriera

Citadel Securities non richiede il dottorato per i ruoli di ingresso, ma assume spesso PhD come ricercatori quantitativi, in matematica, statistica, fisica, informatica. Chiede probabilità e statistica solide e programmazione (Python, R, C++). Jump Trading, in un annuncio di Londra, chiede Master o PhD in statistica, fisica, matematica o simili.

Programmi di laurea magistrale ben noti. Imperial College London, MSc Mathematics and Finance: un anno, serve in genere un 2:1 in matematica, statistica o fisica; moduli di C++ e Python, trading quantitativo, microstruttura di mercato. Tra gli sbocchi elencati: Quantitative Researcher presso fondi come Squarepoint e Marshall Wace.

ETH Zurigo e Università di Zurigo, MSc in Quantitative Finance: programma congiunto; serve una laurea triennale in scienze, matematica, ingegneria o economia, con selezione speciale e ingresso solo a settembre.

Politecnico di Milano: laurea magistrale in Mathematical Engineering, con percorso in Quantitative Finance, 2 anni in inglese. Il numero di percorsi attivi varia tra le pagine: da verificare sul sito. Esiste anche un Master in Finanza Quantitativa di 12 mesi presso la business school, interamente in italiano.

Bocconi: ho trovato solo riferimenti di terzi (Risk.net 2017) a un master in Quantitative Finance and Risk Management. Non l'ho verificato sul sito ufficiale, quindi controlla di persona.

Quanto tempo per diventare produttivi: non ho trovato un dato documentato. Una guida di carriera dice che per un PhD servono 2-4 mesi di preparazione ai colloqui: è una cosa diversa, e di fonte non autorevole.

**Fonti**

- [Citadel Securities e PhD (eFinancialCareers)](https://www.efinancialcareers.com/news/phd-citadel-securities)
- [Imperial, MSc Mathematics and Finance](https://www.imperial.ac.uk/study/pg/mathematics/mathematics-finance/)
- [ETH Zurigo, Master Quantitative Finance](https://ethz.ch/en/studies/master/degree-programmes/natural-sciences-and-mathematics/quantitative-finance.html)
- [UZH, ammissione MSc Quantitative Finance](https://msfinance.uzh.ch/en/admission/eligibilityandprerequisites.html)
- [Politecnico di Milano, Mathematical Engineering](https://www.polimi.it/en/education/laurea-magistrale-programmes/programme-detail/mathematical-engineering)
- [Polimi GSoM, Master in Finanza Quantitativa](https://www.gsom.polimi.it/en/course/master-finanza-quantitativa)
- [Risk.net, Quant Guide 2017: Bocconi (non verificato sul sito ufficiale)](https://www.risk.net/node/5292016)

## Può competere un privato?

Onestamente, sulle strategie veloci e su larga scala no: mancano velocità, capitale, dati e prestito titoli. Sulle strategie lente il campo è meno impossibile, ma anche lì i profitti storici sono calati (Do e Faff).

Costi per un privato europeo: i CFD hanno limiti di leva imposti dall'ESMA dal 2018: 30:1 sulle principali coppie di valute, 20:1 su valute minori, oro e indici principali, fino a 2:1 su sottostanti molto volatili. Chiusura obbligatoria al 50% del margine per conto. La leva alta aumenta l'impatto dei costi, dice l'ESMA.

Vendere allo scoperto azioni vere costa un tasso di prestito che varia titolo per titolo e può impennarsi. I broker retail non garantiscono sempre la disponibilità dei titoli. Con CFD si evita il prestito, ma si pagano i costi di finanziamento del CFD: non ho trovato una fonte con numeri, quindi non li riporto.

Nicchie documentate: lo studio di Makarov e Schoar mostra che nel 2017-2018 le differenze di prezzo tra le borse crypto erano grandi e restavano aperte per settimane. Ma le differenze più grandi erano tra Paesi diversi, dove contavano i controlli sui capitali (difficili da sfruttare per un privato). Non ho trovato fonti che dicano che i privati le abbiano sfruttate. Quelle finestre inoltre sono oggi probabilmente più strette: non verificato.

Sui trader privati in generale: lo studio brasiliano 'Day Trading for a Living?' (Chague, De-Losso, Giovannetti) trovò che il 97% di chi faceva day trading di futures per più di 300 giorni perdeva soldi dopo i costi. Il dato è per un campione specifico, non per tutti. Barber e Odean (2000) trovarono su conti USA che i più attivi rendevano circa 6,5 punti all'anno meno del mercato. Le cifre vengono da sintesi di terzi: ho letto solo quelle.

**Fonti**

- [ESMA, limiti ai CFD (Reed Smith, 2018)](https://www.reedsmith.com/en/perspectives/2018/05/esmas-mounting-concerns-over-cfds)
- [ESMA, misure sui CFD per retail (CONSOB)](https://www.consob.it/documents/1912911/1970971/esma35_43_1000.pdf/6dc9bc30-c528-09dc-9430-398c8df4c3af)
- [IBKR Campus, borrow fees](https://www.interactivebrokers.com/campus/traders-insight/securities/short-selling/the-risks-of-shorting-series-part-ii-borrow-fees/)
- [Makarov & Schoar, arbitraggio crypto (JFE 2020)](https://econpapers.repec.org/RePEc:eee:jfinec:v:135:y:2020:i:2:p:293-319)
- [Day Trading for a Living? (scheda RePEc)](https://ideas.repec.org/p/spa/wpaper/2019wpecon47.html)
- [Do & Faff, Does Simple Pairs Trading Still Work?](https://rpc.cfainstitute.org/en/research/financial-analysts-journal/2010/does-simple-pairs-trading-still-work)

## Reel e social: cosa dicono e cosa c'è dietro

Affermazioni tipiche dei reel (non le ho misurate una per una, sono pattern generali): 'è senza rischio perché sei sempre coperto', 'basta un corso e uno script Python', 'lo fanno i grandi fondi, puoi farlo anche tu'. Sono affermazioni comuni ma non verificate.

La realtà documentata: il pairs trading non è privo di rischi (le coppie possono divergere per sempre); il metodo semplice ha reso meno col tempo; l'agosto 2007 ha mostrato perdite enormi anche per chi era 'neutrale'. I professionisti hanno team di dottori di ricerca, dati e infrastruttura che un privato non ha.

Sul fronte delle regole: l'ESMA nel 2021 e nel 2024 ha avvertito che chi pubblica raccomandazioni d'investimento sui social deve distinguere fatti e opinioni, dichiarare i propri conflitti di interesse e rispettare il regolamento sugli abusi di mercato. Chi vende corsi o segnali ha un interesse economico nel farti credere che sia facile.

Consiglio pratico, che è una mia lettura e non una regola: se un influencer ti mostra solo i guadagni, chiediti dove sono le perdite, i costi e un conto verificato.

**Fonti**

- [ESMA, dichiarazione sulle raccomandazioni sui social (2021)](https://www.esma.europa.eu/press-news/esma-news/esma-addresses-investment-recommendations-made-social-media-platforms)
- [ESMA, avvertimento 2024 su raccomandazioni sui social (PDF)](https://www.esma.europa.eu/sites/default/files/2024-02/ESMA74-1103241886-912_Warnings_on_Social_Media_and_Investment_Recommendations.pdf)
- [Euronews, finfluencer e procedimenti (2024)](https://www.euronews.com/next/2024/02/06/finfluencers-face-prosecution-for-misleading-investment-advice-says-eu-watchdog)
- [Khandani & Lo (MIT)](https://web.mit.edu/~alo/www/Papers/august07.html)
- [Day Trading for a Living? (scheda RePEc)](https://ideas.repec.org/p/spa/wpaper/2019wpecon47.html)

## Confronto: istituzione e privato

| Voce | Istituzione | Privato | Fonte |
|---|---|---|---|
| Costo per operazione | Costi di esecuzione molto bassi e negoziati; i market maker guadagnano sullo spread. Cifre precise non verificate. | Commissioni e spread del broker; sui CFD lo spread è il costo principale. Cifre dipendono dal broker, non verificate. |  |
| Prestito titoli (short) | Accordi con prime broker; condizioni e costi non documentati nelle fonti trovate. | Tasso annuo per titolo, più alto se 'hard to borrow'; può salire fino al 100% in uno squeeze (esempio IBKR). | https://www.interactivebrokers.com/campus/traders-insight/securities/short-selling/the-risks-of-shorting-series-part-ii-borrow-fees/ |
| Finanziamento e leva | Leva e finanziamento tramite prime broker (non verificato nel dettaglio). | Sui CFD UE leva massima 30:1 sulle principali valute, 20:1 su oro e indici principali, fino a 2:1 su asset molto volatili; chiusura al 50% del margine. | https://www.consob.it/documents/1912911/1970971/esma35_43_1000.pdf/6dc9bc30-c528-09dc-9430-398c8df4c3af |
| Dati | Dati tick e order book per strategie veloci; costi non verificati. | Prezzi giornalieri gratuiti o a basso costo bastano per le strategie lente (come nello studio accademico); prezzi dei dati tick non verificati. | https://econpapers.repec.org/RePEc:oup:rfinst:v:19:y:2006:i:3:p:797-827 |
| Velocità (latenza) | Co-location nei data center delle borse; una stima da fonte retail: 9.000-60.000 dollari al mese più hardware (incerta). | Connessione internet di casa o VPS; non può competere sulle strategie veloci. | https://nexusfi.com/a/exchanges/exchange-colocation-direct-market-access |
| Capitale | Da centinaia di milioni a miliardi (D. E. Shaw partì con 28 milioni nel 1988); fondi grandi gestiscono decine di miliardi. | Spesso migliaia o poche decine di migliaia di euro: non verificato come statistica. | https://deshaw.com/who-we-are |
| Team e competenze | Ricercatori con PhD o master quantitativi; Citadel Securities: circa 260 PhD su 1.700 dipendenti. | Di solito una persona sola. | https://www.efinancialcareers.com/news/phd-citadel-securities |
| Neutralità al rischio di fattori | Modelli di rischio a fattori; PCA nella ricerca di Avellaneda e Lee. | Di solito coppie semplici e stop manuali; la neutralità è approssimativa. | https://econpapers.repec.org/RePEc:taf:quantf:v:10:y:2010:i:7:p:761-782 |
| Rendimento dei metodi semplici | Strategie più sofisticate delle semplici coppie storiche. | Il metodo semplice è calato da 0,86% a 0,37% al mese (prime 20 coppie, 1962-88 contro 1989-2002). | https://rpc.cfainstitute.org/en/research/financial-analysts-journal/2010/does-simple-pairs-trading-still-work |
| Rischio di crisi | Nel 2007 grandi perdite per i fondi quantitativi (settimana del 6 agosto) a causa delle vendite forzate. | Stesse perdite, senza la possibilità di aspettare con più capitale; evidenza diretta non trovata. | https://web.mit.edu/~alo/www/Papers/august07.html |
| Risultati dei trader privati | Non applicabile. | Studio brasiliano: 97% dei day trader di futures con più di 300 giorni perdeva dopo i costi (campione specifico). | https://ideas.repec.org/p/spa/wpaper/2019wpecon47.html |
