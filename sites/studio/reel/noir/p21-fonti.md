# Puntata 21 (lun 2/11/2026) — «Cos'è il denaro» — fonti (verificate il 30/10/2026)

Vintage dei dati (tutto letto alla fonte il 30/10/2026):
- **Aggregati monetari = BCE, comunicato «Monetary developments in the euro area: September 2026», 27/10/2026** (PDF letto con `pdftotext`; copia sul sito Banque de France perché il link ecb.europa.eu del comunicato non era raggiungibile: https://www.banque-france.fr/system/files/2026-10/ecb-press-release_2026-10-27_Monetary-developments-in-the-euro-area-September-2026.pdf). I **livelli** (stock, milioni di euro) sono letti dal **BCE Data Portal, dataset BSI** (API ufficiale `data-api.ecb.europa.eu`), serie destagionalizzate; **settembre 2026 = dato provvisorio («P»)**, luglio e agosto «A» (definitivi). È il dato più recente: il prossimo comunicato BCE lo può rivedere di qualche decimo, mai l'ordine di grandezza.
- **Funzioni del denaro, euro fiat, moneta bancaria = BCE, spiegazione «What is money?»**, 24/11/2015, **aggiornata il 19/06/2024** (https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_money.en.html, letta per intero il 30/10/2026).
- **Cambio di contante 2002 = BCE, «Initial changeover (2002)»** (https://www.ecb.europa.eu/euro/changeover/2002/html/index.en.html).
- **Area euro a 21 paesi dal 1° gennaio 2026** (Bulgaria): le serie BSI sono «Euro area (changing composition)», cioè oggi su 21 paesi, non sui 12 del 2002. Non si confrontano i livelli di oggi con quelli del 2002.

## A. Cos'è il denaro (le tre funzioni, l'euro non è convertibile)

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Il denaro ha tre funzioni: mezzo di scambio, unità di conto, riserva di valore» | BCE: «Money, whatever its form, has three different functions.» **Medium of exchange**: «Money can be used to make payments because it is legal tender and has a value that people trust.» **Unit of account**: «Money allows goods and services to be priced, and prices to be compared.» **Store of value**: «Money can be stored, and its value preserved over time.» | BCE, «What is money?», sezione «How money is used», agg. 19/06/2024. Link sopra |
| «L'euro non è convertibile in oro» | BCE: l'euro è **«fiat money»**: «Fiat money is declared legal tender and issued by a central bank. It can't be directly converted into, for example, gold.» Prima: «Later on, money consisted of banknotes that could be exchanged against gold or silver. Modern economies, like the euro area, use fiat money, which isn't tied to a commodity at all.» | BCE, «What is money?», sezione «Money has evolved over time» / «The euro as fiat money». Link sopra |
| «Vale perché tutti lo accettano e c'è fiducia» (parafrasi del «perché vale 50») | BCE: «The paper used for banknotes isn't worth much, yet is accepted because it is widely usable and central banks work to keep the value of money stable.» (nota: la BCE dice **«paper»**; sul materiale esatto non c'è verifica qui) | BCE, «What is money?», «The euro as fiat money». Link sopra |
| «È moneta a corso legale» | **Art. 128(1) TFUE**: la BCE ha «the exclusive right to authorise the issue of euro banknotes»; le banconote emesse da BCE e banche centrali nazionali «shall be the only such notes to have the status of legal tender within the Union». La Corte di giustizia (cause C-422/19 e C-423/19, 2021): il corso legale implica accettazione «in principle», non incondizionata; esistono eccezioni se le parti concordano altrimenti | Trattato sul funzionamento dell'UE, art. 128(1) (https://eur-lex.europa.eu/eli/treaty/tfeu_2016/art_128/oj/eng; testo letto via ricerca, non aperto per intero: il fetch diretto non rispondeva). Sentenza: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62019CJ0422 (non aperta: **dato di secondo livello, da non citare con numeri di paragrafo**) |
| «Le banconote e le monete in euro circolano dal 1° gennaio 2002» | BCE: «On 1 January that year euro banknotes and coins were introduced in 12 countries with a total of population of 308 million. It was the world's largest ever monetary changeover». Dopo un periodo di doppia circolazione, «the euro became the sole legal tender in the euro area on 1 March 2002» (cioè **fino al 28/02/2002 si poteva ancora pagare in lire**). Banconote stampate al 1/1/2002: 14,89 miliardi, valore facciale circa 633 miliardi di euro | BCE, «Initial changeover (2002)». Link sopra |

## B. Contante e depositi: l'aggregato M1 (dati BCE)

Definizione BCE: «narrower monetary aggregate M1, comprising currency in circulation and overnight deposits» (comunicato 27/10/2026, p. 1). Spiegazione: «a narrow monetary aggregate (M1) of banknotes, coins, and bank deposits which customers can withdraw quickly» (BCE, «What is money?»).

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Nell'area euro il denaro "a portata di mano" (M1) è oltre undicimilatrecento miliardi di euro» | **M1, settembre 2026 = 11.333.724 milioni € (11.334 miliardi)**, destagionalizzato, **provvisorio**. Agosto 2026: 11.296.114; luglio: 11.291.868 (definitivi). Crescita annua M1: **2,7 %** a settembre (2,9 % ad agosto) | BCE Data Portal, serie `BSI.M.U2.Y.V.M10.X.1.U2.2300.Z01.E`; crescita: `BSI.M.U2.Y.V.M10.X.I.U2.2300.Z01.A`; comunicato BCE 27/10/2026, p. 1 |
| «Il contante in circolazione è circa milleseicento miliardi» | **Currency in circulation, settembre 2026 = 1.618.447 milioni € (1.618 miliardi)**, destagionalizzato, provvisorio (agosto 1.616.844; luglio 1.612.749). Non destagionalizzato: 1.617.578 | BCE Data Portal, serie `BSI.M.U2.Y.V.L10.X.1.U2.2300.Z01.E` (non dest.: `…N.V.L10…`) |
| «I depositi a vista, cioè i soldi sul conto, sono oltre novemilasettecento miliardi» | **Depositi a vista = M1 − contante = 11.333.724 − 1.618.447 = 9.715.277 milioni € (9.715 miliardi)**. **Calcolo nostro per differenza** (la BCE definisce M1 = contante + depositi a vista; la serie diretta dei depositi a vista non era scaricabile con la chiave provata) | Calcolo su due serie BSI BCE, settembre 2026 |
| «Di ogni sette euro di M1, circa sei sono sul conto e uno solo è contante» / «oltre l'85 % è sul conto» | Depositi a vista **85,7 %** di M1; contante **14,3 %** (1.618.447 / 11.333.724 = 0,1428). Rapporto depositi/contante = **6,0**. Stabile: agosto 14,3 %, luglio 14,2 % | Calcolo nostro su serie BSI BCE (sopra). Il rapporto è lo stesso con i dati non destagionalizzati (14,25 %) |
| «Se guardi tutto il denaro (M3), il contante è meno di un euro su dieci» | **M3, settembre 2026 = 17.717.267 milioni €**, provvisorio; contante 1.618.447 / 17.717.267 = **9,1 %**. Crescita annua M3: **3,5 %** | BCE Data Portal, serie `BSI.M.U2.Y.V.M30.X.1.U2.2300.Z01.E`; comunicato BCE 27/10/2026. Calcolo nostro per la quota |
| «La maggior parte del denaro che usiamo è denaro creato dalle banche» | BCE: «Commercial bank money makes up most of the money that people actually use. It is backed and balanced by the assets held by commercial banks. So it is created by banks expanding their balance sheets. For example, if a commercial bank grants you a loan to buy a car, they create money in this way. And when you repay the loan, the money created disappears.» | BCE, «What is money?», sezione «How is money created?». Link sopra |
| «Un conto in banca è, per la BCE, denaro "come" le banconote» | BCE: «it can also exist in a bank account as a computer entry or be stored in a savings account» (sezione «Money in different shapes»). Due tipi: **moneta di banca centrale** (banconote, riserve delle banche presso la banca centrale) e **moneta di banca commerciale** | BCE, «What is money?» |

## C. Il prezzo di stampa della banconota (il gancio della scheda)

| Detto nel reel | Dato esatto | Fonte |
|---|---|---|
| «Una banconota da 50 € costa pochi centesimi da stampare» | **NON VERIFICATO.** Nessuna fonte primaria (BCE, Banca d'Italia, banche centrali nazionali) pubblica un costo unitario per taglio. La BCE spiega solo che la produzione è ripartita tra le banche centrali nazionali e che «the respective bank bears the production cost» della propria quota. Cifre in giro (circa 5–10 centesimi per il 50 €; Tagesspiegel «citando la BCE» 7 cent per il 5 €, 9 per il 10 €, al massimo 16 per il 500 €) vengono da giornali e siti FAQ e **non sono confermate**. Un'interrogazione parlamentare irlandese (2015) riporta che il dato per taglio «non è disponibile». **Il dato numerico non va usato.** | BCE, «Banknote production and stocks» (https://www.ecb.europa.eu/euro/intro/production/html/index.en.html): letta, nessun costo unitario |
| Alternativa verificata per il gancio | «La carta di una banconota vale pochissimo» → citazione BCE: «The paper used for banknotes isn't worth much, yet is accepted because it is widely usable and central banks work to keep the value of money stable.» | BCE, «What is money?». Link sopra |

## Come dirlo a voce (proposte)

- Gancio: «Una banconota da cinquanta euro è un pezzo di carta che vale pochissimo. Eppure compri cinquanta euro di roba. Perché? Perché tutti la accettano e si fidano che domani varrà ancora.» (senza cifra sui centesimi)
- «Il denaro fa tre cose: ci paghi, ci misuri i prezzi, ci conservi valore. Se non fa tutte e tre, non è denaro.»
- «L'euro non è convertibile in oro: non puoi andare alla BCE a chiedere l'oro in cambio.» (la BCE: «can't be directly converted into gold»)
- «Le banconote in euro circolano dal primo gennaio duemiladue.» (volendo: «in dodici paesi»)
- «Nell'area euro il denaro a portata di mano, quello che puoi spendere subito, è oltre undicimila miliardi di euro. Di questi, il contante è circa milleseicento miliardi. Il resto, oltre novemilasettecento miliardi, sono soldi sui conti correnti.»
- «Per ogni euro di contante ce ne sono circa sei sul conto.» oppure «Più di otto euro su dieci sono numeri su un conto.» (85,7 % = oltre otto e mezzo su dieci; «circa sei su sette» regge)
- «Se guardi tutto il denaro, compresi i depositi a risparmio, il contante è meno di un euro su dieci.» (9,1 %)
- «Dati BCE, settembre duemilaventisei.» (provvisori: dire «circa», «oltre»)
- «Il saldo del tuo conto è denaro, ma è un numero nel registro della tua banca, che la banca ha spesso creato concedendo un prestito.» (BCE: la moneta di banca commerciale «è creata dalle banche che espandono il proprio bilancio»)

## Esempi didattici inventati (cifre illustrative, non dati)

- Il 50 € e la fiducia: non serve cifra; è un esempio concettuale. Se si mostra «cosa vale la carta» a schermo, scrivere «cifre illustrative».
- Eventuale schermata «100 euro di M1»: 14 € contante, 86 € depositi a vista (arrotondamento didattico di 14,3 / 85,7, **non** un dato nuovo).

## Cosa NON si può dire

- **«Costa X centesimi stampare una banconota da 50 €»**: dato NON VERIFICATO (sezione C). Dire solo «vale pochissimo come carta» (citazione BCE).
- **«Lo Stato lo impone per pagare le tasse» come fatto**: la BCE scrive solo che il denaro è «legal tender» (corso legale) e che vale per la fiducia/uso diffuso. L'idea che la domanda di euro nasca dalle tasse è una **teoria** (chartalismo / Teoria monetaria moderna), non una frase delle fonti primarie verificate. Se si vuole citarla: «secondo una teoria economica…». Nel reel conviene dire «lo Stato lo dichiara a corso legale» (art. 128 TFUE per le banconote).
- **«L'euro è backed dalla BCE/dallo Stato»** o «garantito»: la BCE dice che la moneta di banca centrale è «backed by a public institution»; non va trasformato in «garantito dall'oro» né in «garantito dallo Stato italiano».
- **«Quasi tutto il denaro non esiste fisicamente»** o **«il 98 % è digitale»**: non è nelle fonti. Il dato verificato è: contante = **14,3 % di M1** e **9,1 % di M3**. Nessuna percentuale più alta.
- **«Il contante è solo l'11 %»** o altre percentuali vecchie dei libri di testo: usare solo le quote di settembre 2026 qui calcolate.
- **Confondere M1 con «tutto il denaro»**: M1 è la parte più liquida (contante + depositi a vista). Il denaro in senso largo è M3 (17.717 miliardi). Va detto «denaro a portata di mano (M1)» e, se si cita M3, «tutto il denaro compresi i risparmi a breve».
- **Dire che il contante in circolazione sia «contante tenuto dagli europei»**: la BCE stima che **tra il 20 % e il 25 % in valore delle banconote in circolazione sia detenuto fuori dall'area euro** (BCE, «Issuance and circulation», https://www.ecb.europa.eu/euro/banknotes/circulation/html/index.en.html). Non è verificato se la serie «currency in circulation» di M1 includa tutta questa quota: non dire «gli abitanti dell'area euro hanno milleseicento miliardi in contanti»; dire «c'è un contante in circolazione per circa milleseicento miliardi».
- **Confronti con il 2002 sui livelli di M1**: composizione cambiata (12 → 21 paesi). Non fare grafici «M1 2002 vs 2026».
- **«Il denaro nasce dalla banca centrale e basta»**: per la BCE la parte maggiore è moneta di banca commerciale, creata coi prestiti.
- **Banconote «di carta»**: la BCE scrive «paper» nella spiegazione; sulla composizione (cotone) non c'è verifica in questo file. Evitare di specificare.
- **I tassi o l'inflazione**: nessun dato qui. Se si dice «il denaro perde potere d'acquisto», serve la fonte della puntata sull'inflazione (vedi fonti già verificate delle puntate 2/p2).

## Dubbi aperti

1. **Costo di stampa della banconota da 50 €**: non verificabile con fonte primaria. Decisione per l'orchestratore: gancio senza cifra (consigliato), oppure scheda aggiornata («vale pochissimo come carta»).
2. **Dato di settembre 2026 provvisorio (stato «P»)** e il comunicato BCE successivo può rivederlo. Con «circa/oltre» il parlato regge a revisioni di qualche decimo. Il comunicato del 27/10 è il più recente fino almeno a fine novembre.
3. **Depositi a vista = differenza**, non serie diretta. Se serve il numero esatto da citare, riprendere la serie dei depositi a vista dal Data Portal (chiave non trovata nella sessione).
4. **Art. 128 TFUE e sentenza C-422/19**: letti via ricerca, non aperti sul sito EUR-Lex (fetch non riuscito). Citare solo la sostanza («corso legale», art. 128), non la sentenza.
5. **Collegamento p2** (scheda: `collega: [2]`): nessuna dipendenza numerica verificata in questo file.
