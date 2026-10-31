# Puntata 22 (mar 3/11/2026) — «Chi crea i soldi: le banche» — fonti (verificate il 30/10/2026)

Vintage dei dati (tutto letto alla fonte il 30/10/2026):
- **Meccanismo = Bank of England, Quarterly Bulletin 2014 Q1, «Money creation in the modern economy»** (McLeay, Radia, Thomas; PDF del 12/03/2014, 14 pagine: pp. 14-27 del Bulletin). Letto per intero con `pdftotext`. È l'articolo citato dalla scheda. Dati del 2014 sul **Regno Unito**: servono per il meccanismo, **non** come numeri di oggi né dell'area euro.
- **Conferma del meccanismo per l'area euro = BCE, «What is money?» (sezione Explainers / Tell me more)**, pagina letta il 30/10/2026 (data di pubblicazione della pagina non indicata). Citazione testuale in A.
- **Dati attuali = BCE, «Monetary developments in the euro area: September 2026», comunicato del 27/10/2026** (ultimo disponibile; il prossimo, ottobre 2026, esce dopo la puntata: calendario BCE non letto, **non verificato** la data) + serie `BSI` del **BCE Data Portal** (API SDMX, dati di settembre 2026, interrogati il 30/10/2026). **Area euro a 21 paesi dal 1/1/2026 (Bulgaria)**: i livelli (stock) 2026 non sono confrontabili con quelli del 2025 (i tassi di crescita ufficiali sì, sono corretti per la composizione). Non confrontare mai gli stock a un anno di distanza.
- **Regole/limiti = BCE, riserve minime** (pagina «Minimum reserves» e «How to calculate the minimum reserve requirements», lette il 30/10/2026); **BCE Vigilanza bancaria, comunicato del 15/09/2026** (statistiche di vigilanza sul II trim. 2026).
- Prossime uscite che possono toccare i dati: BCE moneta ottobre (fine novembre, data non verificata); Banca d'Italia «Banche e moneta» 10/11/2026 (data letta solo in un risultato di ricerca secondario, **non verificata**). Nessuna uscita prevista tra oggi e il 3/11 che io sappia: i dati sotto reggono il giorno della pubblicazione.

**Come leggere i dati nel modo giusto:** la «moneta» di cui parla il reel è la **moneta in senso ampio (M3 per l'area euro)**: contante in circolazione + depositi + alcuni strumenti a breve. Non è la «base monetaria».

## A. Il meccanismo: prestito = nuovo deposito

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Quando una banca ti concede un prestito, accredita un nuovo deposito sul tuo conto: nasce denaro» | BoE: «Whenever a bank makes a loan, it simultaneously creates a matching deposit in the borrower's bank account, thereby creating new money.» Esempio BoE: per un mutuo la banca «does not typically do so by giving them thousands of pounds worth of banknotes. Instead, it credits their bank account with a bank deposit of the size of the mortgage. At that moment, new money is created.» | Bank of England, *Quarterly Bulletin* 2014 Q1, «Money creation in the modern economy», p. 14 (Overview) e p. 16 (Figura 1). https://www.bankofengland.co.uk/quarterly-bulletin/2014/q1/money-creation-in-the-modern-economy · PDF: https://www.bankofengland.co.uk/-/media/boe/files/quarterly-bulletin/2014/money-creation-in-the-modern-economy.pdf |
| (conferma per l'Europa) «Lo dice anche la BCE» | BCE: «Commercial bank money makes up most of the money that people actually use. It is backed and balanced by the assets held by commercial banks. So it is created by banks expanding their balance sheets. For example, if a commercial bank grants you a loan to buy a car, they create money in this way. And when you repay the loan, the money created disappears.» | BCE, «What is money?» (Explainers, Tell me more): https://www.ecb.europa.eu/ecb/educational/explainers/tell-me-more/html/what_is_money.en.html (letta il 30/10/2026) |
| «Quando il prestito viene rimborsato, quel denaro sparisce» | BoE: «Just as taking out a new loan creates money, the repayment of bank loans destroys money.» (esempio: saldo della carta di credito pagato per intero) | BoE, QB 2014 Q1, p. 16 («Other ways of creating and destroying deposits»). Stessa frase BCE sopra. Anche BoE, «How is money created?» (aggiornata al 1/10/2019): il denaro creato è «deleted»; «You haven't got richer or poorer»; «banks create money, not wealth» https://www.bankofengland.co.uk/explainers/how-is-money-created |
| «Non è vero che la banca presta i soldi dei risparmiatori» (smonta l'idea sbagliata) | BoE: «banks do not act simply as intermediaries, lending out deposits that savers place with them, and nor do they 'multiply up' central bank money to create new loans and deposits.» «Rather than banks receiving deposits when households save and then lending them out, bank lending creates deposits.» Sul moltiplicatore: «it is not an accurate description of how money is created in reality.» BoE precisa che è «the reverse of the sequence typically described in textbooks» | BoE, QB 2014 Q1, p. 14 (Overview) e p. 15. **Citare «secondo la Bank of England»**, non «secondo gli economisti» |
| «La maggior parte dei soldi sono depositi, non contante» (UK, 2014) | BoE: i depositi bancari sono «the vast majority — 97% of the amount currently in circulation» della moneta in senso ampio (UK, inizio 2014). Altro vintage BoE (pagina 2019): banconote e monete 3% | BoE, QB 2014 Q1, p. 15; BoE «How is money created?» (1/10/2019). **Dati UK di anni fa: non usarli come «oggi», vedi B** |

## B. Dati di oggi, area euro (BCE, settembre 2026)

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Nell'area euro il contante è meno di un euro su dieci della moneta» | Contante in circolazione **1.618.447 mln €** (€1,62 mila miliardi) su M3 **17.717.267 mln €** (€17,7 mila miliardi) a settembre 2026 = **9,1 %** (calcolo nostro, dati destagionalizzati). M1 (contante + depositi a vista) 11.333.724 mln = 64,0 % di M3. Il resto di M3 (circa 91 %) sono depositi e strumenti a breve (compresi pronti contro termine, quote di fondi monetari, titoli fino a 2 anni): **non dire «depositi» per tutto il 91 %** | BCE Data Portal, serie `BSI.M.U2.Y.V.L10.X.1.U2.2300.Z01.E` (contante in circolazione), `BSI.M.U2.Y.V.M30.X.1.U2.2300.Z01.E` (M3), `BSI.M.U2.Y.V.M10.X.1.U2.2300.Z01.E` (M1), set 2026. API: https://data-api.ecb.europa.eu/service/data/BSI/M.U2.Y.V.L10.X.1.U2.2300.Z01.E . Rapporto: calcolo nostro |
| «La quantità di moneta cresce: +3,5 % in un anno» | Crescita annua di **M3 = 3,5 %** a settembre 2026 (invariata su agosto; media 3 mesi 3,5 %). M1 +2,7 % (da 2,9 %) | BCE, «Monetary developments in the euro area: September 2026», 27/10/2026: https://www.ecb.europa.eu/press/stats/md/html/ecb.md2609~dd1bf1b2e4.en.html |
| «I prestiti a famiglie e imprese crescono» | Prestiti rettificati alle **famiglie +3,1 %**, alle **società non finanziarie +4,2 %** su base annua (set 2026; entrambi invariati su agosto). Contributo alla crescita di M3: **crediti al settore privato 3,4 punti percentuali** (su 3,5 %) | Stesso comunicato BCE, 27/10/2026 («Counterparts of the broad monetary aggregate M3») |
| «Le banche dell'area euro hanno in bilancio oltre dodicimila miliardi di prestiti a famiglie e imprese» (facoltativo) | Prestiti delle IFM (stock, set 2026): famiglie **7.030 mld €**, società non finanziarie **5.472 mld €**; somma **12.502 mld** (calcolo nostro). Italia (banche residenti, prestiti a controparti dell'area euro): famiglie **699,9 mld**, società non finanziarie **638,2 mld** | BCE Data Portal, `BSI.M.U2.N.A.A20.A.1.U2.2250.Z01.E` e `...2240...`; `BSI.M.IT.N.A.A20.A.1.U2.2250.Z01.E` e `...2240...`, set 2026. Non rettificati per cartolarizzazioni. «2250» include le istituzioni senza scopo di lucro al servizio delle famiglie. Per l'Italia non ho verificato con Banca d'Italia (non letta) |

## C. I limiti: «non creano senza limiti»

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Le banche non creano senza limiti» | BoE: «Although commercial banks create money through lending, they cannot do so freely without limit. Banks are limited in how much they can lend if they are to remain profitable in a competitive banking system. Prudential regulation also acts as a constraint […]. And the households and companies who receive the money created by new lending may take actions that affect the stock of money — they could quickly 'destroy' money by using it to repay their existing debt.» Limite ultimo: la politica monetaria (tassi) | BoE, QB 2014 Q1, p. 14 (Overview) e pp. 17-18 («Limits to broad money creation») |
| «Servono clienti affidabili e che la banca ci guadagni» | BoE: la banca deve prestare «profitably», gestire il rischio di perdite sui prestiti; per prestare di più «will typically have to lower its loan rates relative to its competitors» e può «'lose' the deposits it has created to those competing banks»; il costo di attrarre fondi deve essere inferiore agli interessi sul prestito | BoE, QB 2014 Q1, pp. 18-19 («Market forces facing individual banks», «Managing the risks associated with making loans») |
| «Servono capitale e regole» | BoE (spiegazione per il pubblico): «Regulation limits how much money banks can create. For example, they have to hold a certain amount of financial resources, called capital, in case people default on their loans. These limits have become stricter since the financial crisis.» | BoE, «How is money created?», aggiornata il 1/10/2019 |
| «Le banche europee oggi hanno molto capitale» | Rapporto di capitale **CET1 aggregato 16,00 %** (banche significative vigilate dalla BCE) nel II trim. 2026, da 15,99 % del trim. precedente e 16,09 % un anno prima. Tasso di crediti deteriorati 2,17 %. Intervallo per paese: 13,52 % (Spagna) – 20,78 % (Lituania) | BCE Vigilanza bancaria, «ECB publishes supervisory banking statistics on significant institutions for the second quarter of 2026», 15/09/2026: https://www.bankingsupervision.europa.eu/press/pr/date/2026/html/ssm.pr260915~7917ca1416.en.html (CET1 e NPL letti; intervallo per paese da ricerca, **non riletto sul PDF**). Dato Italia: non estratto |
| (se serve) «Il minimo di legge, il 4,5 % / 8 % del capitale sulle attività ponderate per il rischio» | Regolamento (UE) 575/2013 (CRR), art. 92: CET1 4,5 %, Tier 1 6 %, capitale totale 8 % delle attività ponderate per il rischio, **più** i cuscinetti e i requisiti di secondo pilastro. **NON VERIFICATO su fonte primaria**: EUR-Lex non raggiungibile da qui (risponde 202 senza contenuto); letto solo in sintesi secondarie. **Non usare le percentuali** finché non si legge il testo del CRR |  Reg. (UE) 575/2013, art. 92 (da leggere su EUR-Lex) |
| «L'obbligo di riserva è solo l'1 %» (se si anticipa la puntata 23) | Coefficiente di riserva obbligatoria BCE: **1 %** dal 18/01/2012 (era 2 % dal 1999) sui depositi a vista, a termine fino a 2 anni, titoli fino a 2 anni; **0 %** sui depositi oltre 2 anni, pronti contro termine, titoli oltre 2 anni. Nel periodo di mantenimento 29/07-15/09/2026: riserve obbligatorie medie **174.661 mln €**, riserve in eccesso **163.331 mln €**, saldi sui conti correnti 337.992 mln €; remunerazione **0 %**. BoE (2014): in UK non c'è riserva obbligatoria | BCE, «Minimum reserves» e «How to calculate the minimum reserve requirements»: https://www.ecb.europa.eu/mopo/implement/mr/html/calc.en.html ; https://www.ecb.europa.eu/mopo/implement/mr/html/index.en.html (letta il 30/10/2026); BoE QB 2014 Q1, p. 16 nota 2 |

## Come dirlo a voce (proposte)
- Gancio (prudente): «Quando una banca ti concede un prestito, la moneta nuova nasce nel momento in cui scrive la cifra sul tuo conto. Lo dice la Banca d'Inghilterra, e lo dice anche la Banca Centrale Europea.» (BoE 2014; BCE «What is money?»)
- Meccanismo: «La banca scrive il prestito tra le attività e, nello stesso momento, il deposito sul tuo conto tra le passività: i due numeri nascono insieme.» (descrizione di bilancio; BoE Figura 1: prestiti e depositi nascono «insieme»)
- Rimborso: «Quando restituisci il prestito, quella moneta sparisce.» (BoE e BCE)
- Idea sbagliata: «La Banca d'Inghilterra scrive che le banche non si limitano a prestare i depositi dei risparmiatori: è il prestito che crea il deposito.» (BoE 2014, p. 14)
- Contesto con un numero (area euro): «Nell'area euro il contante è meno di un euro su dieci della moneta in circolazione; il resto è denaro nei conti e strumenti a breve termine.» (BCE, set 2026; 9,1 %, calcolo nostro)
- Ritmo di oggi: «Secondo la BCE, a settembre 2026 la quantità di moneta nell'area euro cresceva del tre e mezzo per cento in un anno, e i prestiti alle famiglie del tre per cento circa.» (BCE 27/10/2026: 3,5 % e 3,1 %)
- Limiti: «Ma le banche non possono creare senza limiti: devono guadagnarci, devono scegliere clienti che restituiscono, e devono rispettare regole sul capitale.» (BoE 2014, pp. 17-19)
- Capitale: «A metà del 2026 le grandi banche vigilate dalla BCE avevano un rapporto di capitale del sedici per cento.» (BCE Vigilanza 15/09/2026, CET1 16,00 %; «rapporto di capitale» = CET1 sulle attività ponderate per il rischio, da spiegare o omettere)
- Chiusura: «Quindi no, i soldi non nascono dal nulla: nascono insieme a un debito.» (consiglio editoriale, base: BoE «banks create money, not wealth»)

## Esempi didattici inventati
- **Bilancio di vetro** (visual della scheda): «ESEMPIO · CIFRE INVENTATE» — prestito di 10.000 € all'attivo, deposito di 10.000 € sul conto del cliente al passivo; dopo il rimborso entrambe le voci tornano a zero. È uno schema, non un dato. Semplificazione: nessun interesse, nessuna commissione, un'unica banca, il cliente non spende la somma (altrimenti, se paga un cliente di un'altra banca, la banca perde il deposito e deve regolare in riserve: BoE, p. 18).
- Nessuna cifra su singole banche italiane (UniCredit, Intesa, ecc.) è stata raccolta: non inventarne né attribuirne.

## Cosa NON si può dire
**Correzioni alla scheda in lezioni.json**
- **NON «dal nulla» / «dal niente» / «magia» / «stampano soldi»**: né BoE né BCE usano «from nothing» (BoE: i soldi sono creati dal prestito, la banca ha in cambio un credito verso il cliente: «banks create money, not wealth»; BCE: «backed and balanced by the assets held by commercial banks»). La scheda dice «li crea dal nulla. Davvero.»: come gancio è clickbait, scorretto sul piano contabile. Riformulare («Quando una banca ti presta soldi, la moneta nuova nasce nel momento in cui scrive il prestito»).
- **NON «tutte le banche creano denaro illimitato / ogni prestito è gratis per la banca»**: BoE: limiti di redditività, rischio, regolamentazione e politica monetaria; il deposito creato può essere trasferito ad altre banche.
- **NON «la banca centrale non conta»**: BoE: «The amount of money created in the economy ultimately depends on the monetary policy of the central bank» (tassi). Non confondere con «la banca centrale stampa».
- **NON «La Bank of England ha scoperto/ammesso che…»**: BoE spiega di una «misconception»; il verbo corretto è «ha spiegato nel 2014» (come nella scheda). Non è un'ammissione né una novità.
- **NON usare il 97 % come dato attuale né dell'area euro**: è UK, inizio 2014. Il confronto aggiornato è 9,1 % di contante in M3 area euro (calcolo nostro, set 2026). I due non vanno affiancati come se fossero lo stesso indicatore: perimetri diversi.
- **NON mescolare 97 % (2014) e 79 %/18 %/3 % (spiegazione BoE 2019, include le riserve)**: definizioni diverse.

**Superlativi e quantificatori (lezioni di p7, p9, p10, p12, p19)**
- «Le banche creano **la maggior parte** del denaro»: BoE «most of the money», BCE «most of the money that people actually use». NON «tutto il denaro»: il contante è creato dalle banche centrali.
- «Sempre/oggi/tutte le banche»: no. BoE: «in the modern economy» e descrive il sistema aggregato.
- NON «i soldi che ti presta la banca sono i soldi di altri clienti».

**Nessi causali non dimostrati**
- NON «la creazione di moneta causa inflazione» (non è nelle fonti lette; BoE dice solo che la politica monetaria tiene la crescita della moneta coerente con inflazione bassa e stabile).
- NON «il prestito crea ricchezza»: BoE «money, not wealth».
- NON «le banche creano le crisi»: non affermato dalle fonti lette.

**Tempi, vintage e provvisori**
- Dati BCE di **settembre 2026**; il comunicato di ottobre esce dopo il 3/11. Revisioni mensili dei dati BCE sono possibili: a voce usare «circa», «tre e mezzo per cento».
- **Area euro a 21 paesi dal 1/1/2026 (Bulgaria)**: non confrontare gli stock 2026 con gli stock 2025. Esempio: M3 grezzo set 2026 / set 2025 = +4,3 % contro 3,5 % ufficiale (prima ipotesi: effetto composizione, **non verificato**). Usare **solo** i tassi ufficiali del comunicato.
- NON dire «sedici virgola zero per cento» come soglia di sicurezza: è un aggregato medio e dice poco sulle singole banche; l'intervallo per paese 13,52-20,78 % non riletto sul PDF.
- NON dare le percentuali CRR (4,5 % / 8 %) finché non verificate (vedi C).

## Dubbi aperti
1. **CRR art. 92** (4,5/6/8 %): fonte primaria non leggibile da qui. Se serve nel reel, rileggere il testo su EUR-Lex.
2. **Tasso di riserva 1 %** e puntata 23 («La riserva frazionaria»): la scheda 23 dice «riserva obbligatoria 1% di alcuni depositi dal 2012, scesa dal 2 %»: verificato (ECB calc.en.html, 18/01/2012). Ma BoE 2014 dice che le riserve **non** sono il vincolo ai prestiti: la puntata 23 non deve contraddire la 22 (non dire «la banca presta i tuoi soldi tenendone l'1 %»).
3. **Italia**: stock prestiti ricavati dalla serie BCE `BSI.M.IT...` (controparte area euro). Non confrontati con Banca d'Italia «Banche e moneta» (non letta). Meglio non usarli nel reel.
4. **«What is money?» BCE**: data di pubblicazione non mostrata nella pagina; citata come «pagina letta il 30/10/2026».
5. **Intervallo CET1 per paese** (Spagna 13,52 % – Lituania 20,78 %): venuto da ricerca web, solo CET1 aggregato 16,00 % e NPL 2,17 % riletti sul comunicato BCE.
6. **Collegamento con la puntata 21** («Cos'è il denaro»; M1: contante + depositi a vista): coerente con la scheda; il dato M1/M3 qui (64,0 %) va allineato a quello usato in p21 se presente (p21-fonti.md non esiste ancora).
7. **Date da ricontrollare il 2/11**: nessuna uscita BCE sulla moneta attesa; verificare che la BCE non rettifichi il comunicato del 27/10.

## Correzioni preventive (lezioni applicate)
- Superlativi (p7, p10, p12, p19): nessun «record», «mai così», «il più»; «la maggior parte» solo come parola di BoE/BCE.
- Gancio troppo netto (p9): «dal nulla» sostituito; la risposta onesta è «nasce con il prestito, e sparisce con il rimborso».
- Proiezioni: nessuna; tutti i numeri sono dati osservati.
- Vintage (p5, p12, p19): 97 % (UK 2014) distinto da 9,1 % (area euro, set 2026); composizione area euro cambiata nel 2026.
