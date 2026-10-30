# Puntata 25 (ven 6/11/2026) — «Silicon Valley Bank 2023» — fonti (verificate il 30/10/2026)

Caso storico chiuso: nessuna revisione Istat/Eurostat da attendere. Le cifre dei documenti ufficiali sono datate 2023 e non cambiano. Le uniche cose "vive" sono le stime FDIC del costo per il Fondo di garanzia (NON usate qui).

Vintage e fonti (tutto letto per intero o nella sezione citata, 30/10/2026, con `pdftotext` o testo della pagina):
- **Fed** = Board of Governors of the Federal Reserve System, «Review of the Federal Reserve's Supervision and Regulation of Silicon Valley Bank» (lettera di Michael S. Barr, **28/04/2023**). Citata con le pagine del **PDF** (non quelle stampate): https://www.federalreserve.gov/publications/files/svb-review-20230428.pdf
- **DFPI** = California Department of Financial Protection and Innovation: comunicato «California Financial Regulator Takes Possession of Silicon Valley Bank», **10/03/2023**, e **Order Taking Possession** del 10/03/2023 (Findings of Fact, sez. 2 «Liquidity and Insolvency»). https://dfpi.ca.gov/wp-content/uploads/sites/337/2023/03/SVB-Possession-PR-03-10-23.pdf · https://dfpi.ca.gov/wp-content/uploads/sites/337/2023/03/DFPI-Orders-Silicon-Valley-Bank-03102023.pdf
- **FDIC** = comunicato PR-16-2023 «FDIC Creates a Deposit Insurance National Bank of Santa Clara to Protect Insured Depositors of Silicon Valley Bank», 10/03/2023 (aggiornato 12/03/2023): https://www.fdic.gov/news/press-releases/2023/pr23016.html ; scheda «Failed Bank»: https://www.fdic.gov/resources/resolutions/bank-failures/failed-bank-list/silicon-valley.html
- **Fed/Tesoro/FDIC**, «Joint Statement by Treasury, Federal Reserve, and FDIC», 12/03/2023: https://www.federalreserve.gov/newsevents/pressreleases/monetary20230312b.htm
- **CRS** (Congressional Research Service, Library of Congress), Insight IN12125, «Silicon Valley Bank and Signature Bank Failures», 21/03/2023 (per il posto in classifica; non è la Fed): https://crsreports.congress.gov/product/pdf/IN/IN12125
- **SVB Financial Group, Form 10-K 2022**, depositato alla SEC il 24/02/2023 (bilancio consolidato al 31/12/2022): https://www.sec.gov/Archives/edgar/data/719739/000071973923000021/sivb-20221231.htm

**Attenzione, tre perimetri diversi, non mescolare:** (1) **SVB** = la banca (Silicon Valley Bank, ~209 mld di attivi, 175,4 mld di depositi: DFPI/FDIC); (2) **SVBFG** = il gruppo/holding (~212 mld di attivi, 173,1 mld di depositi: Fed e 10-K); (3) la **Fed** usa i dati del gruppo (FR Y-9C) per le quote, e dice «SVB» nel testo per la banca. Nel reel dire sempre «la banca».

**Attenzione al 42 vs 40:** la scheda dice «circa 42 miliardi… Fonte: rapporto Fed aprile 2023». Il rapporto Fed scrive **«over $40 billion»**, NON 42. Il **42** è dell'**ordine di sequestro della DFPI** ("withdrawals of $42 billion in deposits from the Bank on March 9, 2023"). Quindi o si dice «oltre quaranta miliardi» (fonte Fed) o «circa quarantadue miliardi» (fonte DFPI): la fonte in caption e il campo `esempio` di `lezioni.json` vanno corretti di conseguenza.

## A. Dimensione

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Una banca da oltre duecento miliardi di dollari di attivi» | **~209 mld $** di attivi totali della banca (SVB) al **31/12/2022**; depositi **~175,4 mld $**. La holding SVBFG: **~212 mld $** di attivi. Dato di fine 2022, non alla chiusura | DFPI, comunicato 10/03/2023, riga 2 («total assets of approximately $209 billion and total deposits of approximately $175.4 billion as of Dec. 31, 2022»); FDIC PR-16-2023 («approximately $209.0 billion in total assets and about $175.4 billion in total deposits»); Fed, rapporto, PDF p. 25 (sez. «Overview»: SVBFG ~212 mld; SVB ~209 mld; fondata nel 1983, sede a Santa Clara) |
| «La sedicesima banca degli Stati Uniti» | SVB era la **16ª banca USA per dimensione** al momento della chiusura. **Fonte: CRS, non Fed/FDIC**: «At the time of closure, SVB was the 16th largest U.S. bank». Nessun documento Fed/FDIC/DFPI letto riporta il ranking | CRS, Insight IN12125, 21/03/2023, p. 1. Dire «la sedicesima banca americana per dimensione, secondo il Congressional Research Service» o semplicemente «tra le prime venti» se si vuole restare prudenti |
| «Con diciassette filiali, in California e Massachusetts» (opzionale) | **17 filiali** in California e Massachusetts | FDIC PR-16-2023 («had 17 branches in California and Massachusetts»); CRS p. 1 |
| «Il 2022 era stato l'anno dei depositi in calo» (opzionale) | Depositi SVBFG: **173,1 mld $** (31/12/2022) contro **189,2 mld $** (31/12/2021), −16,1 mld. Il 10-K attribuisce il calo a «slowdown in public and private fundraising and exits as well as increased client cash burn» | SVBFG, Form 10-K 2022, tabella depositi e commento (sez. Deposits) |

## B. Chi aveva i soldi lì: depositi non assicurati

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Quasi tutti i depositi erano sopra la soglia garantita» | Fed: **«As of year-end 2022, approximately 94 percent of SVBFG's total deposits were uninsured»**. Per confronto, grandi banche "LBO" (>100 mld $, esclusa LISCC): **41 %**. Il 10-K: depositi non assicurati in uffici USA **151,5 mld $** (166,0 mld $ nel 2021) + **13,9 mld $** di depositi esteri non coperti da alcun regime. 151,5 / 173,1 = **87,5 %** (calcolo nostro, solo USA); (151,5 + 13,9) / 173,1 = **95,6 %** (calcolo nostro, con esteri). La CRS dà **151,6 mld $** dal call report della banca. **A voce «circa nove depositi su dieci»** regge a tutti i calcoli | Fed, rapporto, PDF p. 35 (testo, nota 38) e p. 37 (Tabella 1, «Uninsured deposits as a percentage of total deposits»: SVBFG 94, LBO 41); SVBFG, 10-K 2022, sez. «Uninsured Deposits in U.S. Offices»; CRS p. 1 |
| «La soglia garantita è di duecentocinquantamila dollari» | Limite FDIC: **250.000 $** per depositante, per banca, per categoria di conto («typically $250,000», CRS; «Customers with accounts in excess of $250,000 should contact the FDIC», FDIC PR-16-2023). Il rapporto Fed lo cita anche come soglia dei controlli di vigilanza (FRBSF: depositi oltre 250.000 $; sez. sulle «surveillance screens») | FDIC PR-16-2023; CRS p. 1; Fed, rapporto, sez. su Supervisory screens |
| «Clienti: startup e fondi di venture capital» | Fed: la corsa è stata alimentata da «SVB's concentrated network of venture capital investors and technology firms that withdrew their deposits in a coordinated manner with unprecedented speed»; «fueled by social media» (p. 37). Non dire che "tutti" i clienti erano startup | Fed, rapporto, PDF p. 18 e p. 38 |

## C. I titoli e le perdite

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Più della metà degli attivi era in titoli» | Titoli come quota degli attivi totali a fine 2022: **SVBFG 55 %**, grandi banche (LBO) **25 %**. Prestiti: 35 % contro 58 % | Fed, rapporto, PDF p. 37, Tabella 1 (fonte dati: FR Y-9C, 31/12/2022) |
| «Gran parte dei titoli era "da tenere fino alla scadenza"» | Titoli *held-to-maturity* (HTM) = **78 %** dei titoli di SVBFG (LBO: 42 %). Bilancio 10-K: HTM al costo ammortizzato **91.321 mln $**, *fair value* **76.169 mln $**; AFS (disponibili per la vendita) al *fair value* 26.069 mln $ (costo 28.602); totale titoli d'investimento **120.054 mln $** | Fed, PDF p. 37, Tabella 1; SVBFG, 10-K 2022, stato patrimoniale consolidato al 31/12/2022 |
| «Perdite non realizzate di oltre quindici miliardi sui titoli tenuti a scadenza» | HTM: 91.321 − 76.169 = **15.152 mln $ ≈ 15,2 mld $** (calcolo nostro su due voci del bilancio; il 10-K riporta le due cifre, non la differenza in questa riga). Con i titoli AFS (28.602 − 26.069 = 2.533): totale circa **17,7 mld $** (calcolo nostro; il grafico Fed, Figura 9, non dà numeri). **«Non realizzate»**: Fed nota 40: «they do not change the assets' value on the balance sheet itself» | SVBFG, 10-K 2022, stato patrimoniale (note ai conti «fair value of $76,169»); Fed, PDF p. 36–37, Figura 9 e nota 40 |
| «Erano titoli di Stato e mutui cartolarizzati» (non solo Treasury) | DFPI: la vendita dell'8 marzo era di «U.S. treasuries and mortgage-backed securities» | DFPI, Order Taking Possession, Findings of Fact 2 |
| «L'8 marzo la banca vende ventuno miliardi di titoli e annuncia una perdita di un miliardo e ottocento milioni» | Vendite di titoli AFS per **21 mld $** con **perdita dopo le imposte di 1,8 mld $**; piano di aumentare i debiti a termine di **15–30 mld $**; aumento di capitale di **2,25 mld $**. Data: **8/03/2023** (8-K SVBFG accettato alla SEC l'8/03/2023 alle 17:16 ora della costa est: «will result in an after-tax loss of approximately $1.8 billion in the first quarter») | Fed, rapporto, PDF p. 18 (sez. «Failure of SVB») e p. 38; DFPI, Order, Findings of Fact 2; SVBFG, Form 8-K, 8/03/2023, Item 7.01 |
| «Perché le perdite? I tassi sono saliti» | Fed: nel 2022 «as interest rates began to rise, SVBFG saw a rapid increase in unrealized losses on both its HTM and available-for-sale (AFS) portfolios»; SVBFG aveva investito i depositi «in longer-term securities and did not effectively manage the interest-rate risk, including actively removing hedges as rates were rising» | Fed, rapporto, PDF p. 36 e p. 38 |

## D. La corsa: 9 marzo 2023, previsto il 10, chiusura

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Il 9 marzo i clienti chiedono indietro oltre quaranta miliardi di dollari in un solo giorno» | Fed: **«On March 9, SVB lost over $40 billion in deposits»** e «total deposit outflow of over $40 billion». DFPI: **«withdrawals of $42 billion in deposits from the Bank on March 9, 2023»**. Un solo dato, due formulazioni: la scheda usa 42 (DFPI) ma lo attribuisce alla Fed (da correggere in `lezioni.json`) | Fed, rapporto, PDF p. 7 (Executive summary) e p. 18, p. 38; DFPI, Order Taking Possession, Findings of Fact 2 |
| «Il 10 marzo se ne aspettavano più di cento miliardi» | Fed: **«SVBFG management expected to lose over $100 billion more on March 10»**; «SVB communicated to supervisors that the firm expected an additional over $100 billion in outflows during the day on March 10». Sono **uscite attese**, non avvenute | Fed, rapporto, PDF p. 7, p. 18 e p. 38 |
| «Una corsa mai vista, per scala e per velocità» | Fed: «This deposit outflow was remarkable in terms of scale and scope»; confronto: Wachovia 2008 **~10 mld $ in 8 giorni**; Washington Mutual 2008 **19 mld $ in 16 giorni**. Fed: «roughly 85 percent of the bank's deposit base» (la frase si riferisce all'uscita complessiva, effettiva + attesa; l'ambiguità nel testo: usarla come "circa l'85 %", non come "85 % uscito") | Fed, rapporto, PDF p. 18 (sez. «Failure of SVB», nota 6) |
| «A fine giornata la banca era in rosso di cassa» | DFPI: «As of the close of business on March 9, the bank had a negative cash balance of approximately $958 million»; «the Bank did not meet its cash letter with the Federal Reserve». Fed: «SVB did not have enough cash or collateral to meet the extraordinary and rapid outflows» | DFPI, Order, Findings of Fact 2 (+ dichiarazione DFPI «Despite the bank being in sound financial condition prior to March 9…»: è la tesi dell'ordine, non della Fed); Fed, PDF p. 38 |
| «Il 10 marzo, al mattino, la banca viene chiusa» | Il **10/03/2023**, venerdì, la DFPI ha preso possesso della banca (Fin. Code §592, **«inadequate liquidity and insolvency»**) e ha nominato la **FDIC curatore** (receiver). Fed: la DFPI ha chiuso SVB «on the morning of March 10». DFPI/FDIC non riportano l'ora esatta | DFPI, comunicato 10/03/2023; FDIC PR-16-2023; Fed, rapporto, PDF p. 38 |
| «In meno di due giorni dall'annuncio» (rispetto al gancio «48 ore») | Annuncio 8/03/2023 (8-K accettato alle 17:16 ET) → chiusura mattina del 10/03: **circa 40 ore** (calcolo nostro; ora precisa di chiusura non trovata). La **corsa vera è di un giorno solo (9 marzo)**. «In 48 ore» è un'approssimazione per eccesso; meglio «in meno di due giorni» | Calcolo nostro su: SVBFG 8-K 8/03/2023; Fed p. 38 («morning of March 10») |

## E. Dopo la chiusura (cosa è successo ai depositanti)

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Il 10 marzo la FDIC trasferisce i depositi assicurati a una banca-ponte e li rende accessibili entro lunedì 13» | FDIC: ha creato la **Deposit Insurance National Bank of Santa Clara (DINB)**; «All insured depositors will have full access to their insured deposits no later than Monday morning, March 13, 2023». Ai non assicurati, in quel momento, era promesso solo un «advance dividend» e un certificato di credito sul residuo | FDIC PR-16-2023 (versione del 10/03; aggiornata 12/03) |
| «Due giorni dopo, il 12 marzo, lo Stato garantisce tutti i depositi» | Dichiarazione congiunta Tesoro, Fed, FDIC (12/03/2023): approvata un'eccezione per rischio sistemico che permette alla FDIC di risolvere SVB «in a manner that fully protects all depositors». «Depositors will have access to all of their money starting Monday, March 13». «No losses associated with the resolution of Silicon Valley Bank will be borne by the taxpayer»; eventuali perdite del Fondo saranno recuperate con **un'imposta speciale sulle banche**. «Shareholders and certain unsecured debtholders will not be protected» | Joint Statement, 12/03/2023 (link sopra). CRS: FDIC ha usato la *systemic risk exception* (12 U.S.C. §1823(c)(4)(G)) |
| «Poi la banca è stata ceduta» (se serve) | **26/03/2023**: acquisto da parte di **First–Citizens Bank & Trust Company** (Raleigh, NC) di depositi e prestiti di Silicon Valley Bridge Bank, N.A. (purchase and assumption agreement) | FDIC, scheda Failed Bank «Silicon Valley Bank», sez. acquirente |
| «La holding è fallita» (se serve) | Fed: «SVB failed on March 10, 2023, which in turn led to the later bankruptcy of SVBFG» (data del Chapter 11 non letta in fonte primaria: non indicarla) | Fed, rapporto, PDF p. 18 |
| «Una delle più grandi chiusure bancarie della storia» (solo così) | CRS: «reportedly the second largest bank failure ever if measured in nominal dollars» («reportedly»: la CRS non lo afferma in prima persona). FDIC PR: «first FDIC-insured institution to fail this year»; l'ultima era Almena State Bank (Kansas), 23/10/2020 | CRS p. 1; FDIC PR-16-2023 |

## Come dirlo a voce (proposte)

- «Una banca da oltre duecento miliardi di dollari di attivi, la sedicesima degli Stati Uniti, secondo il Congressional Research Service.»
- «Circa nove depositi su dieci stavano sopra la soglia garantita di duecentocinquantamila dollari. La Fed scrive: circa il novantaquattro per cento.»
- «Più della metà degli attivi era in titoli, e quasi otto su dieci erano di quelli da tenere fino a scadenza.»
- «Quando i tassi sono saliti, quei titoli valevano meno: oltre quindici miliardi di perdite sulla carta solo sul portafoglio da tenere a scadenza» (calcolo nostro su bilancio: dire «perdite sulla carta», cioè non realizzate).
- «L'8 marzo la banca vende ventuno miliardi di titoli e annuncia una perdita di un miliardo e ottocento milioni, dopo le tasse, e un aumento di capitale.»
- «Il 9 marzo i depositanti chiedono indietro oltre quaranta miliardi di dollari in un giorno» (Fed) o «circa quarantadue» (DFPI): scegliere una e citare la fonte giusta in caption.
- «Per il 10 marzo se ne aspettavano più di cento miliardi. Quella mattina la banca viene chiusa.»
- «Il 12 marzo Tesoro, Fed e FDIC annunciano che tutti i depositanti saranno protetti.»

## Esempi didattici inventati (nessuno proposto in questa puntata)

Nessun esempio numerico inventato è necessario: il caso è reale e tutti i numeri sono di fonte. Se l'orchestratore ne volesse uno per spiegare la riserva frazionaria, va marcato in sovrimpressione «cifre illustrative, non dati» (es. «una banca con cento di depositi e dieci di liquidi»: non è nei documenti, è didattica).

## Cosa NON si può dire (segnalato esplicitamente)

- NON «42 miliardi, fonte Fed»: la Fed scrive «over $40 billion»; **42** è della DFPI. Attribuire correttamente.
- NON «la banca è saltata in 48 ore» come fatto: l'annuncio è dell'8 marzo sera (ora della costa est), la corsa del 9, la chiusura la mattina del 10 (circa 40 ore). Meglio «in meno di due giorni»; la corsa vera è un giorno.
- NON «sono usciti 42 miliardi e il 10 marzo ne sono usciti altri 100»: i **100 miliardi del 10 marzo erano un'uscita ATTESA**, la banca è stata chiusa prima che avvenisse. Dire sempre «se ne aspettavano».
- NON «SVB ha perso 15 miliardi» o «ha perso 17,7 miliardi»: le perdite sui titoli erano **non realizzate**, salvo la sola vendita dell'8 marzo (**1,8 mld $ dopo le tasse** su 21 mld di titoli AFS). Le cifre 15,2 e 17,7 sono **nostri calcoli** sulle due voci del bilancio 10-K (costo ammortizzato − *fair value*), non numeri scritti dalla Fed o dalla SVB.
- NON «titoli di Stato a lungo termine» come descrizione secca: il portafoglio comprendeva anche titoli garantiti da mutui (DFPI: «U.S. treasuries and mortgage-backed securities»). La scheda dice «titoli di Stato a lungo termine»: va bene «soprattutto titoli di Stato e mutui cartolarizzati, a lunga scadenza»; la composizione esatta del portafoglio non è stata letta nel 10-K (**NON VERIFICATO** il dettaglio per scadenza/durata).
- NON «SVB era la sedicesima banca» come dato Fed/FDIC: fonte è la **CRS** (Congressional Research Service, 21/03/2023). Non verificato su una classifica ufficiale (Fed «Large Commercial Banks» a fine 2022: non consultata).
- NON «è il più grande fallimento bancario della storia americana»: la CRS scrive «reportedly the second largest» (dopo Washington Mutual 2008, in dollari nominali; il confronto con WaMu **NON verificato** in fonte primaria). Meglio non dirlo.
- NON «il 94 % dei depositi era non assicurato» senza dire «secondo la Fed, a fine 2022, per il gruppo SVBFG»: il calcolo sul 10-K (solo uffici USA) dà 87,5 %; con i depositi esteri 95,6 %. «Circa nove su dieci» è la formula sicura.
- NON «tutti i clienti erano startup»: la Fed dice rete concentrata di venture capital e aziende tech; non dà una quota. Non dare percentuali di clientela.
- NON dare la colpa a una causa sola: la Fed scrive che la corsa «appear[s] to have been sparked by a number of interrelated factors»: incertezza sul settore tech, possibile azione delle agenzie di rating, prelievi correlati dei clienti, social media. Il rapporto dà anche **colpe del management e della supervisione** (board non informato, rischi di tasso non gestiti, hedge rimossi, stress test di liquidità falliti). Non scrivere «è colpa dei social», né «la Fed non ha fatto nulla» né «la banca non aveva colpe».
- NON «i contribuenti hanno pagato»: la dichiarazione del 12/03 dice **nessuna perdita a carico dei contribuenti**; i costi del Fondo di garanzia sono coperti da un'imposta speciale sulle banche («as required by law»). L'importo finale della perdita FDIC **non è stato letto** (cambiato più volte): non usare.
- NON «i depositi erano garantiti fino a 250.000 dollari quindi i clienti sono stati salvati dal sistema normale»: i depositanti **non assicurati sono stati protetti da un'eccezione per rischio sistemico** (decisione del 12/03), non dalla garanzia ordinaria. La garanzia ordinaria ha un limite che qui è stato superato.
- NON «la banca era in salute prima del 9 marzo» in prima persona: è la frase dell'**ordine DFPI** («Despite the bank being in sound financial condition prior to March 9»), contraddetta in parte dalla Fed (stress test di liquidità falliti, debolezze di gestione).
- NON datare la bancarotta della holding (Chapter 11, 17/03/2023): non letta in fonte primaria.

## Dubbi aperti

1. **42 vs 40 miliardi.** Scheda: «circa 42, fonte rapporto Fed». Fed: «over $40». DFPI: 42. Decidere la formulazione; la caption (le fonti non vanno nel video, regola del 16/10) e la scheda in `lezioni.json` (campo `esempio`, che cita «rapporto Fed aprile 2023») reggono solo con «oltre 40», oppure vanno riscritte con «ordine della DFPI».
2. **«48 ore».** Il gancio della scheda: «è saltata in 48 ore». Dall'8-K (8/03, 17:16 ET) alla chiusura (mattina 10/03, ora non verificata) sono ~40 ore. «In meno di due giorni» è difendibile; «in 48 ore» no, come numero esatto.
3. **Quota non assicurata:** 94 % (Fed, gruppo, FR Y-9C) contro 87,5–95,6 % (calcoli nostri dal 10-K). Differenza di perimetro non chiarita dalla Fed (la nota 38 dà solo la fonte). Formula a voce prudente.
4. **Rango «16ª»:** solo CRS. Se non serve, tagliarlo o attribuirlo.
5. **«Titoli di Stato»:** composizione/durata del portafoglio HTM non letta riga per riga nel 10-K (note ai conti), solo DFPI e Fed in generale.
6. **85 % della base di depositi** (Fed): frase ambigua tra uscita effettiva e attesa. Non usare come dato isolato.
7. **Ora della chiusura** il 10/03 non indicata in DFPI/FDIC/Fed (solo «morning»); il tempo di chiusura nell'ordine DFPI è la data (10/03/2023), non l'ora.
8. **Pagine Fed** citate come pagine del PDF (7, 18, 25, 35, 36, 37, 38): le pagine stampate nel rapporto hanno un offset diverso. Citare nel reel solo titolo e data («rapporto della Federal Reserve, 28 aprile 2023»).

## Correzioni preventive (lezioni applicate)

- Attribuzione del numero (p7, p10): un dato "per la Fed" è solo quello che la Fed scrive; 42 è DFPI.
- Perdite non realizzate non sono perdite (p12): marcate come tali, 15,2 e 17,7 mld sono nostri calcoli.
- Attese vs fatti: i 100 miliardi del 10 marzo sono previsione della banca, riportata dalla Fed.
- Superlativi (p19): «16ª banca», «seconda per dimensione» solo con "secondo la CRS / reportedly".
- Perimetri (p5, p19): banca contro holding, bilancio consolidato contro call report; dichiarati sopra.
