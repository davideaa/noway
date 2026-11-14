# Puntata 28 (mer 11/11/2026) — «Il valore attuale» — fonti (verificate il 05/11/2026)

Vintage e metodo (letto il 05/11/2026):
- **Tasso BTP**: PDF ufficiale del Dipartimento del Tesoro (MEF), «Risultati Asta: BTP 5 ANNI», **asta del 29/10/2026** (ultima asta del BTP a 5 anni prima del 11/11). Scaricato e letto con `pdftotext`. L'asta successiva è il **12/11/2026**, cioè **dopo** l'uscita del reel: il 4,02 % resta l'ultimo dato disponibile il 11/11, ma da quel giorno non lo sarà più.
- **Inflazione**: comunicato Istat «Prezzi al consumo (dati provvisori) – Ottobre 2026», pubblicato il **30/10/2026**; letto sulla pagina Istat. È una **stima preliminare**: il dato definitivo esce il **17/11/2026** (dopo il reel) e può spostarsi di un decimo o due.
- **Tasso depositi**: BCE, Data Portal (API SDMX), serie MIR, interrogata il 05/11/2026. Ultimo mese disponibile: settembre 2026.
- I conti del valore attuale sono stati rifatti da me in Python (vedi sezione B). La formula e l'esempio da 862,61 € vengono dalla scheda n=28 in `lezioni.json` e sono stati ricalcolati: coincidono.
- La ricerca non ha una fonte primaria scritta sulla definizione «valore attuale» (è matematica, non un dato): non cito nessun ente per la formula.

## A. Dati di apertura proposti (il primo vale più dell'altro per il gancio)

La prima frase del reel deve aprirsi con un dato verificato che riguarda chi guarda. Proposta in ordine di preferenza:

### Apertura 1 (consigliata): il prezzo del tempo, oggi, per lo Stato italiano

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Il 29 ottobre lo Stato italiano ha venduto un BTP a cinque anni con un rendimento lordo del quattro virgola zero due per cento l'anno.» (a voce: «poco più del quattro per cento») | **4,02 %** rendimento lordo, prezzo di aggiudicazione **99,83**, cedola **3,95 %**, scadenza **01/02/2032**, ISIN **IT0005733636**, tranche 3ª-4ª, assegnati 1.750 mln € su 2.991 mln richiesti (copertura 1,71). Settlement 02/11/2026. Il precedente (asta 29/09/2026, tranche 1ª-2ª, PDF MEF) era **4,08 %**, quindi -6 punti base; Borse.it scrive «-5 punti base»: discrepanza di un punto base tra secondario e PDF, **non usare il confronto con l'asta precedente** | MEF, Dipartimento del Tesoro, «Risultati Asta: BTP 5 ANNI, Data: 29 ottobre 2026 – 30 ottobre 2026»: https://www.dt.mef.gov.it/export/sites/sitodt/modules/documenti_it/debito_pubblico/risultati_aste/risultati_aste_btp_5_anni/BTP-5-Anni-Risultati-Asta-29-30.10.2026.pdf · precedente: stesso ente, asta 29-30/09/2026 (stesso percorso, file `...29-30.09.2026.pdf`) |
| «Cioè: per prestare soldi allo Stato per cinque anni, il mercato chiede circa il quattro per cento l'anno» (parafrasi) | Il rendimento d'asta è quello a cui il mercato ha comprato, non un tasso fissato dal Tesoro. Ricalcolo mio dal PDF: con prezzo 99,83, cedole 1,320245 % (corta, 123 gg) poi 1,975 % semestrali, rimborso a 100 il 01/02/2032, base 365 gg, rendimento annuo composto = **4,0226 %** → coincide con il 4,02 % ufficiale, quindi è un tasso **annuo effettivo composto**, non nominale semestrale (che sarebbe 3,98 %) | Ricalcolo su dati del PDF MEF 29/10/2026 (script locale, non salvato nel repo) |

Perché riguarda chi guarda: è il tasso al quale lo Stato «sconta» il futuro, lo stesso meccanismo che la puntata spiega. Se si vuole un dato **più vicino al portafoglio dello studente**, vedi Apertura 2.

### Apertura 2: il tasso che prendono i risparmiatori in banca (alternativa, più vicina a chi guarda)

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «In Italia, a settembre, le famiglie con un deposito vincolato avevano in media il due virgola sette per cento l'anno.» | **2,70 %** a settembre 2026 (agosto 2,68 %, luglio 2,67 %, giugno 2,64 %). Serie: tassi di interesse delle banche sui depositi delle famiglie **con durata prestabilita**, **Italia**, tasso annualizzato (AAR/NDER), **stock in essere** (non le nuove offerte), tutte le scadenze originarie, in euro | BCE, Data Portal, serie **MIR.M.IT.B.L22.A.R.A.2250.EUR.O** («Bank interest rates on deposits from households with agreed maturity (on outstanding amounts)»), interrogata il 05/11/2026: https://data-api.ecb.europa.eu/service/data/MIR/M.IT.B.L22.A.R.A.2250.EUR.O |
| NON disponibile: tasso sui conti correnti (depositi a vista) italiani | La serie BCE per l'Italia dei depositi overnight delle famiglie (L21) non ha restituito dati (HTTP 404). Una cifra di **0,20 %** (agosto, Banca d'Italia, famiglie) compare solo su WallStreetItalia, e **0,31 %** (giugno, ABI) solo su un lancio di stampa: **non verificati su fonte primaria** | **NON VERIFICATO**: non usare |

Attenzione: il 2,70 % è una media sugli stock di depositi vincolati, non «quello che ti dà la banca se apri un conto oggi».

### Apertura 3 (solo se si vuole il tema prezzi): inflazione

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «A ottobre i prezzi al consumo sono saliti del cinque virgola quattro per cento in un anno» (a voce: «oltre il cinque per cento») | **+5,4 %** NIC su base annua (da +4,2 % di settembre), **+0,9 %** su base mensile. «Secondo le stime preliminari…» **Dato provvisorio** (definitivo il 17/11/2026). Inflazione acquisita 2026: +3,4 %; componente di fondo +1,9 % (la stampa riporta 2,0 %: leggere il comunicato, il valore giusto è +1,9 %). Spinta soprattutto dall'energia (regolamentata +59,5 %, non regolamentata +29,4 %), «ancora influenzato dal quadro geopolitico internazionale» | Istat, «Prezzi al consumo (dati provvisori) – Ottobre 2026», 30/10/2026: https://www.istat.it/comunicato-stampa/prezzi-al-consumo-dati-provvisori-ottobre-2026/ |

Sconsigliata come apertura **di questa** puntata: il tema (tasso nominale e reale) è la puntata 29 («Tassi nominali e reali») e confonderebbe i due concetti. Se la si usa, solo «circa» e «oltre il cinque».

## B. Il conto del valore attuale (formula e numeri verificati)

Formula (scheda n=28): VA = F / (1 + r)^n. Qui F = 1.000 €, n = 5 anni.

| Detto nel reel | Dato esatto | Fonte |
|---|---|---|
| «Mille euro tra cinque anni, con tasso del tre per cento, valgono oggi circa 862 euro e 61 centesimi.» | 1,03^5 = **1,159274**; 1.000 / 1,159274 = **862,609** → **862,61 €**. Verifica inversa: 862,61 × 1,03^5 = 1.000,00 €. Sconto: **137,39 €** (circa il 13,7 %) | Calcolo mio (Python), coincide con la scheda `lezioni.json` n=28. **Esempio didattico: tasso del 3 % scelto per semplicità, non è un dato** |
| «Con il tasso del BTP, il quattro virgola zero due per cento, gli stessi mille euro valgono oggi circa 821 euro.» | 1,0402^5 = **1,217823**; 1.000 / 1,217823 = **821,137** → **821,14 €** (a voce: «circa 821 euro»). Sconto: **178,86 €**. Rispetto al 3 %: **-41,47 €** (862,61 → 821,14) | Calcolo mio. Tasso: MEF, asta BTP 5 anni 29/10/2026 (sez. A). **È un esempio con tasso reale preso a prestito, non il prezzo di un titolo** (vedi limiti sotto) |
| «Più alto è il tasso, meno vale oggi» | A parità di 5 anni: 0 % → 1.000,00 €; 3 % → 862,61 €; 4,02 % → 821,14 €; 6 % → 747,26 € | Calcolo mio |
| «Più lontano è il pagamento, meno vale oggi» | A parità di 3 %: 1 anno → 970,87 €; 5 anni → 862,61 €; 10 anni → 744,09 € | Calcolo mio |

Riga da usare per il collegamento con la puntata 27 (interesse composto): 862,61 € messi oggi al 3 % composto per cinque anni diventano 1.000 €. Il valore attuale è l'operazione inversa.

Limiti dell'esempio col tasso del BTP (dichiarare nel reel solo ciò che serve, tenere il resto per i commenti):
- Il BTP IT0005733636 dura **5,25 anni** (dal 02/11/2026 al 01/02/2032), non 5 esatti, e paga cedole: **non è un pagamento unico a cinque anni**. Usare 4,02 % come tasso di sconto per 1.000 € a cinque anni esatti è una **semplificazione**; con 5,25 anni verrebbe 813,09 €. Non dire «un BTP da mille euro tra cinque anni vale 821 euro».
- Il 4,02 % è **lordo**: la tassazione dei BTP non è stata verificata in questa ricerca. Non parlare di rendimento netto.
- Il tasso di sconto «giusto» dipende dal rischio: non dire «il tasso giusto è il 4,02 %». Dire «un tasso di riferimento».

## C. Esempi didattici inventati («cifre illustrative, non dati»)

| Esempio nel reel | Natura |
|---|---|
| 1.000 € tra 5 anni al 3 % → 862,61 € oggi | **Cifre illustrative, non dati.** Conto verificato (sez. B). Dal 3 % non va tratta nessuna conclusione economica |
| 1.000 € tra 5 anni al 4,02 % → 821,14 € oggi | **Cifre illustrative, non dati.** Il solo dato vero è il 4,02 % d'asta; la somma da 1.000 € e l'orizzonte di 5 anni esatti sono scelti per il conto |
| Moneta di vetro che viaggia indietro su una linea del tempo e si rimpicciolisce (visual della scheda) | **Illustrativo**: le dimensioni non sono in scala. Se compare l'etichetta «862,61», deve restare «esempio al 3 %» |
| Confronto «mille euro tra un anno / cinque / dieci» (970,87 / 862,61 / 744,09 al 3 %) | **Cifre illustrative, non dati** |

## Cosa NON si può dire

- NON «oggi mille euro valgono 862 euro» senza «tra cinque anni, al tre per cento»: il valore attuale dipende dal tasso scelto. Dire «**con un tasso del 3 %**».
- NON «mille euro tra cinque anni oggi valgono 821 euro» come se fosse il prezzo di mercato di qualcosa: è un conto con un tasso di riferimento.
- NON «il BTP a cinque anni rende il 4,02 %» senza «lordo» e senza «all'asta del 29 ottobre»: il rendimento cambia ogni giorno sul mercato e il 12/11 c'è una nuova asta.
- NON «lo Stato paga il 4,02 % di interesse» né «cedola al 4,02 %»: la **cedola è 3,95 %**, il **rendimento lordo 4,02 %** (il prezzo è 99,83, sotto 100).
- NON «tasso senza rischio» né «il tasso giusto»: per l'Italia il BTP porta rischio e il tasso di sconto è una scelta; il reel può dire «un tasso di riferimento».
- NON «con il tuo conto corrente guadagni il 2,7 %»: il 2,70 % è la media dei **depositi vincolati** delle famiglie (stock), non dei conti correnti, e non è l'offerta di una banca precisa.
- NON citare tassi sui conti correnti (0,20 %, 0,31 %): non verificati su fonte primaria.
- NON «l'inflazione è al 5,4 %» senza «in un anno» e «stima provvisoria»; NON usare 5,4 % come tasso di sconto del reel (concetto della puntata 29).
- NON dare consigli o previsioni: «conviene comprare BTP», «i tassi scenderanno», «il tasso salirà ancora». Il reel è educativo e porta la riga «Contenuto educativo · Non è consulenza finanziaria».
- NON «per tutti gli esami si usa il 3 %»: il 3 % è l'esempio della scheda.
- NON «è il cuore di tutta la finanza» o simili superlativi non attribuibili: la scheda dice «il cuore della matematica finanziaria», frase **nostra** (scheda), non di un ente; se usata va senza fonte e senza «tutta».
- NON usare l'inflazione ottobre come se fosse definitiva (17/11) né il confronto con agosto 2023 («livello registrato ad agosto 2023», dal comunicato Istat riportato dalla stampa: letto solo su un secondario).

## Dubbi aperti

1. **Quale apertura?** La 1 (BTP 4,02 %) è la più solida e la più legata al tema, ma "riguarda chi guarda" solo in modo indiretto; la 2 (2,70 % depositi vincolati) è più vicina al risparmiatore ma è una media di stock e non risponde a «e il mio conto?». Un dato sui conti correnti italiani da fonte primaria (Banca d'Italia, tavola dei tassi bancari) non è stato trovato in tempo: se serve, si può cercare il 6–10/11.
2. **Revisioni e date**: il 4,02 % è l'ultimo dato fino al 12/11 (nuova asta); l'inflazione +5,4 % è provvisoria fino al 17/11. Entrambe le date cadono **dopo** l'uscita dell'11/11: nessun rischio di cambiamento prima, ma da ricontrollare il 10/11 che il Tesoro non abbia aggiunto aste straordinarie.
3. **Tasso 4,02 % come "composto annuo"**: confermato con il mio ricalcolo dal PDF (4,0226 %), non con una definizione scritta dal MEF nel PDF (che riporta solo «Base Annua Rendimenti 365 gg.»). Per scrupolo, nel reel dire solo «rendimento lordo annuo».
4. **Pagina indice MEF non letta**: l'URL della pagina indice (`.../risultati_aste_btp_5_anni/index.html`) è comparso nei risultati di ricerca ma non è stato aperto; il PDF è stato letto direttamente. La pagina `risultati_aste_mlt_29_09_2026.html` citata da rivaluta.it non è stata letta (usato solo il PDF).
5. **Serie BCE**: la serie italiana dei depositi a vista non è disponibile in API (404); i valori giugno–settembre 2026 della serie L22 sono letti dall'API il 05/11/2026, ma non datati dalla BCE oltre il mese di riferimento. Se si usa il 2,70 %, dire «a settembre».
6. **Persiste il dubbio sulla componente di fondo Istat** (la stampa dice 2,0 %, il comunicato letto +1,9 %): non usarla.
7. **Fonti secondarie scartate**: Borse.it/Radiocor sull'asta 29/10 (confermano 4,02 %), rivaluta.it (confermano 4,08 % del 29/09). Usare solo il PDF MEF.
