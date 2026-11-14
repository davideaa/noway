# Puntata 27 (mar 10/11/2026) — «Interesse semplice e composto» — fonti (verificate il 5/11/2026)

Lezione di matematica finanziaria: **nessun dato di mercato è necessario**. Il cuore del reel sono calcoli esatti (sezione B), dichiarati come esempi. I soli dati veri sono i due candidati per l'apertura «che riguarda chi guarda» (sezione A).

Vintage e metodo (letto il 5/11/2026 con `pdftotext`):
- **Banca d'Italia, QEF n. 588**, D'Alessio, De Bonis, Neri, Rampazzi, «L'alfabetizzazione finanziaria degli italiani: i risultati dell'indagine della Banca d'Italia del 2020», dicembre 2020 (letto per intero nelle parti citate): https://www.bancaditalia.it/pubblicazioni/qef/2020-0588/QEF_588_20.pdf
- **Banca d'Italia, «Indagini sull'alfabetizzazione finanziaria e le competenze di finanza digitale in Italia: adulti»**, statistiche, 20/07/2023 (indagine IACOFI 2023): https://www.bancaditalia.it/pubblicazioni/indagini-alfabetizzazione/2023-indagini-alfabetizzazione/statistiche_AFA_20072023.pdf
- **ABI, Rapporto mensile, ottobre 2026** (dati a settembre 2026; le note ABI dicono che i dati vengono dalle banche, che producono le informazioni): https://www.abi.it/wp-content/uploads/2026/10/Comunicato-stampa-ottobre-2026.pdf . L'ABI è un'associazione di categoria, **non** la Banca d'Italia: per il numero sui conti correnti vedi i dubbi.
- Calcoli: Python con `Decimal`, arrotondamento al centesimo (metà in su), riverificati il 5/11/2026.

## A. Candidati per la frase di apertura (dato che riguarda chi guarda)

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| **Apertura 1 (consigliata, ma solo con la formula prudente).** «Nel 2020 la Banca d'Italia ha chiesto agli italiani: 100 euro al 2% per cinque anni, quanto avrai? Solo circa uno su quattro ha risposto bene.» A voce: «meno di uno su quattro». | Indice FK4 «Comprensione di interesse semplice e composto»: **0,23** nel 2017 e **0,23** nel 2020 (scala 0–1, tavola intitolata «valori percentuali, punteggi»). Quindi **23 %** degli adulti 18–79 anni (campione di circa 2.000, interviste gennaio–febbraio 2020). **Attenzione alla definizione**: FK4 = 1 solo se la persona ha **prima** risposto giusto alla domanda sull'interesse semplice (100 € al 2% per un anno = 102 €) **e poi** ha risposto «più di 110 euro» alla domanda su cinque anni. Non è «il 23 % sa cos'è l'interesse composto» in senso lato: è «il 23 % ha risposto giusto a entrambe le domande». Risposta giusta: 100 × 1,02^5 = **110,41 €** (vedi B7). Nel 2020 la domanda sull'interesse semplice (FK3) era giusta per il 60 % | Banca d'Italia, QEF 588, dic. 2020, **Appendice B, Tavola B1** (pdf p. 34); definizione e testo delle domande in Appendice A (FK3, FK4). Link sopra |
| «Gli italiani sotto i 35 anni…» (**NON usare**) | Dal documento 2023 risulta solo che il punteggio **complessivo** di alfabetizzazione finanziaria dei 18–34enni è **10,0 su 20** (media 10,7). Non c'è la percentuale sul composto per età | Banca d'Italia, statistiche IACOFI, 20/07/2023, sez. 1 |
| **Apertura 2 (alternativa).** «Oggi sul conto corrente ti pagano in media lo 0,36 per cento l'anno. Su mille euro sono circa tre euro e sessanta.» | **0,36 %** = tasso medio sui conti correnti in euro (famiglie e società non finanziarie, consistenze), **settembre 2026**, in aumento da 0,33 % di agosto. Tasso medio sul totale dei depositi: **0,73 %**. Nuovi depositi a durata prestabilita (vincolati, CD): **2,47 %**. 1.000 € × 0,36 % = **3,60 €** (interesse **lordo**, prima di ritenuta e bollo) | ABI, Rapporto mensile ottobre 2026, punti 7, 9, 10 e Tabella 4 (dati armonizzati SEBC). Link sopra |
| Apertura 3 (calcolo, nessun dato esterno). «Mille euro al cinque per cento per trent'anni: con l'interesse semplice diventano duemilacinquecento, con il composto più di quattromilatrecento.» | Esempio dichiarato, vedi B | Calcolo, sezione B |

Nota sull'ordine delle frasi: l'Apertura 1 «riguarda chi guarda» (adulti italiani e universitari che studiano matematica finanziaria) ma è del **2020**: dire sempre «nel 2020». L'indagine del 2023 esiste (20/07/2023) ma il documento letto **non riporta** la quota sul composto: non dire «oggi» né «nel 2023».

## B. Esempi didattici inventati («cifre illustrative, non dati»)

Tutti i conti: capitale C = 1.000 €, nessun prelievo, nessuna tassa, nessuna spesa, capitalizzazione annuale. Semplice = C × (1 + r × n). Composto = C × (1 + r)^n. Verificati al centesimo.

| N. | Esempio nel reel | Risultato | Natura |
|---|---|---|---|
| B1 | 1.000 € al 5 % per **10 anni**, semplice | **1.500,00 €** (interessi 500,00 €) | **Cifre illustrative, non dati.** Combacia con la scheda |
| B2 | 1.000 € al 5 % per **10 anni**, composto | **1.628,89 €** (1,05^10 = 1,628894627…; interessi 628,89 €) | Illustrativo. Combacia con la scheda |
| B3 | Differenza a 10 anni | **128,89 €** | Illustrativo |
| B4 | 1.000 € al 5 % per **30 anni**, semplice | **2.500,00 €** (interessi 1.500,00 €) | Illustrativo |
| B5 | 1.000 € al 5 % per **30 anni**, composto | **4.321,94 €** (1,05^30 = 4,321942375…; interessi 3.321,94 €) | Illustrativo |
| B6 | Differenza a 30 anni | **1.821,94 €**, cioè 14,1 volte quella a 10 anni (128,89 €) per 3 volte il tempo. A voce: «oltre milleottocento euro» | Illustrativo. Questo è il «la differenza cresce con il tempo» del gancio |
| B7 | Domanda della Banca d'Italia: 100 € al 2 % per 5 anni | composto **110,41 €** (110,408080…); semplice **110,00 €**. Nell'indagine «110 euro» era la risposta sbagliata (semplice), «più di 110» la giusta | Il calcolo è nostro; la formulazione della domanda è QEF 588 App. A |
| B8 | Serie composta a 5 % (per un'eventuale curva): anno 1 → 1.050,00; 2 → 1.102,50; 3 → 1.157,63; 5 → 1.276,28; 10 → 1.628,89; 20 → 2.653,30; 30 → 4.321,94 | | Illustrativo. Semplice cresce di 50,00 € l'anno, fisso |
| B9 | Regola del 72 al 5 % | 72 / 5 = **14,4 anni** (stima). Tempo esatto: ln 2 / ln 1,05 = **14,21 anni**. Dopo 14 anni: **1.979,93 €** (non ancora 2.000); dopo 15: **2.078,93 €**. La scheda dice «circa 14 anni»: corretto | Illustrativo. La regola è un'approssimazione, non una legge |
| B10 | Regola del 72 su altri tassi (se serve un secondo esempio) | 3 %: stima 24,0 anni, esatto 23,45. 7 %: stima 10,3, esatto 10,24. 2 %: stima 36,0, esatto 35,00 | Illustrativo |
| B11 | Altri risultati composti, solo se servono | 3 %: 10 anni 1.343,92 €; 30 anni 2.427,26 €. 7 %: 10 anni 1.967,15 €; 30 anni 7.612,26 € | Illustrativo |

Frasi di sicurezza da tenere: «ipotizza», «cifre di esempio», «senza tasse e spese».

## C. Cosa NON si può dire

- NON «Einstein disse che l'interesse composto è l'ottava meraviglia del mondo / la forza più potente dell'universo». **Non esiste prova che l'abbia detto.** Quote Investigator e Snopes non trovano alcun riscontro; la frase compare in forme diverse (pubblicità del 1916, «Rothschild» nel 1965, Einstein dagli anni '80). Fonti **secondarie** viste solo come risultati di ricerca (non aperte): https://quoteinvestigator.com/2011/10/31/compound-interest/ · https://www.snopes.com/quotes/einstein/interest.asp . Anche «si dice che…» è meglio evitarlo: dà dignità a una citazione falsa.
- NON altre citazioni di Rothschild, Franklin, Buffett ecc. sull'interesse composto: **nessuna verificata**.
- NON «il 23 % degli italiani non sa cosa sia l'interesse composto»: FK4 richiede entrambe le risposte giuste (semplice a 1 anno e «più di 110» a 5). Dire: «solo circa uno su quattro ha risposto giusto alla domanda sul composto» e «nel 2020».
- NON «gli italiani sono peggio di tutti in Europa / del G20»: non verificato su fonte primaria letta.
- NON «oggi i giovani italiani sanno meno / più…»: il documento 2023 ha solo il punteggio complessivo (18–34 anni 10,0 su 20).
- NON «il conto corrente rende lo 0,36 %» senza «in media», «lordo» e «a settembre 2026»; NON dare quel numero come «tasso di Banca d'Italia».
- NON «con il composto raddoppi in 14 anni esatti»: 14,21; a 14 anni sono 1.979,93 €. Dire «circa quattordici anni».
- NON «la regola del 72 vale sempre»: approssimazione, meno precisa a tassi alti e a bassi tassi (vedi B9–B10). Nessuna fonte primaria letta per la regola: presentarla come **regola pratica**, il calcolo esatto è nostro.
- NON «questi sono rendimenti reali / li ottieni davvero»: gli esempi non considerano inflazione, ritenuta (26 % su molti interessi), bollo, spese, rischio. NON promettere «il 5 % l'anno per trent'anni»: è un'ipotesi, non un tasso garantito né una previsione.
- NON presentare il composto come sempre «buono»: vale anche per i debiti (è il tema del «ti serve»). Se si cita un debito, usare solo un esempio inventato dichiarato, nessun TAEG reale non verificato.
- NON dire «semplice = tasso più basso»: a parità di tasso nominale annuo e a 1 anno i due risultati coincidono (1.050,00 €). La differenza nasce dal **secondo anno**.

## D. Dubbi aperti

1. **FK4 ha una definizione composta** (vedi A): la cifra 23 % è corretta come indice del QEF, ma la formula a voce deve restare prudente. Alternativa più sicura se non si vuole spiegare: «nel 2020, nell'indagine della Banca d'Italia, solo circa uno su quattro ha risposto giusto a una domanda sul composto».
2. **Tavola B1 letta come percentuale**: l'intestazione dice «valori percentuali, punteggi» con scala 0–1; 0,23 è interpretato come 23 %. Non ho cercato un testo che lo scriva come «23 %». Ricontrollare nel corpo del QEF prima della pubblicazione se si vuole la frase letterale.
3. **Dato 2023 non trovato**: la nota statistica del 20/07/2023 dà solo il punteggio medio conoscenze (3,7 su 7; era 3,9 nel 2020). Il risultato per domanda del 2023 potrebbe stare in un'altra pubblicazione non letta. Se esce, l'apertura 1 passa da 2020 a 2023.
4. **ABI vs Banca d'Italia**: l'ABI cita le statistiche armonizzate SEBC (cioè Banca d'Italia/BCE), ma il testo letto è ABI. La fonte primaria (Banca d'Italia, tavole sui tassi bancari) **non è stata letta**. Una ricerca web riportava «0,20 % ad agosto 2026 per le famiglie» (articoli di stampa, non verificato): **numero diverso da ABI 0,33 % di agosto**, perché il perimetro è diverso (solo famiglie, o altra serie). Se si usa l'apertura 2, o si verifica la serie Banca d'Italia o si dice «secondo l'ABI». Consigliato preferire l'apertura 1.
5. **Revisioni**: gli indicatori ABI di settembre 2026 potrebbero essere rivisti nel rapporto di novembre; il dato dell'ottobre 2026 è l'ultimo letto il 5/11/2026. Con «circa» e «a settembre» il rischio è basso.
6. **EUR-Lex e testi di legge non pertinenti**: nessun obbligo normativo da citare nel reel (nessun TAEG, nessuna tassazione dichiarata). Se si aggiungesse la ritenuta del 26 %, va verificata su fonte (Agenzia delle Entrate) prima.
7. **Einstein**: la smentita è su fonti secondarie viste solo nei risultati di ricerca; non aperte per intero. Per il reel basta non citarlo.
