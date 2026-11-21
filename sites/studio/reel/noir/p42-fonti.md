# Puntata 42 — «Il paniere ISTAT» — fonti (verificate il 16/11/2026)

Vintage e metodo (testi letti il 16/11/2026 con `pdftotext`; stessi documenti di p41 e p43, scaricati una volta):
- **ISTAT, «Gli indici dei prezzi al consumo. Aggiornamenti del paniere, della struttura di ponderazione e dell'indagine. Anno 2026»**, nota/comunicato annuale del **23/02/2026** (PDF di 27 pagg., letto per intero): https://www.istat.it/wp-content/uploads/2026/02/NOTA_INFORMATIVA_PANIERE_2026-1.pdf . È **la** fonte della puntata (composizione, pesi, indici NIC/FOI/IPCA). Prossima edizione: febbraio 2027, quindi **per tutto il 2026 questi pesi restano validi**.
- **ISTAT, «Prezzi al consumo – dati provvisori, ottobre 2026»**, 30/10/2026: https://www.istat.it/wp-content/uploads/2026/10/CS_Prezzi-al-consumo_Prov_Ottobre2026.pdf (stima preliminare; il definitivo esce il **17/11/2026**).
- **ISTAT, «Prezzi al consumo – dati definitivi, settembre 2026»**, 16/10/2026: https://www.istat.it/wp-content/uploads/2026/10/Prezzi-al-consumo-def-Set2026-1.pdf (ultimo dato definitivo).
- **ISTAT, «Indice dei prezzi per le rivalutazioni monetarie»** (pagina web, periodo di riferimento settembre 2026, pubblicata il 16/10/2026): https://www.istat.it/notizia/indice-dei-prezzi-per-le-rivalutazioni-monetarie/
- Non usate: giornali e siti di divulgazione (serviti solo per trovare i documenti).

## A. Come si misura: la dimensione del paniere (anno 2026)

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, pagina) |
|---|---|---|
| «Il paniere ha oltre cinquecento prodotti» | **531 «aggregati di prodotto»** per NIC e FOI (**537** per l'IPCA), il livello più basso al quale si calcolano indici nazionali; sopra: **392 segmenti di consumo**, **234 sottoclassi**, **122 classi**, **47 gruppi**, **13 divisioni di spesa** (classificazione europea ECOICOP v2). Un «aggregato» è una famiglia di prodotti (es. «uniformi scolastiche»), non un singolo articolo | ISTAT, nota *Paniere 2026*, 23/02/2026, p. 1 e Prospetto 1, p. 2 |
| «Ogni mese l'ISTAT raccoglie più di ventinove milioni di prezzi» | «sono **oltre 29 milioni** le quotazioni di prezzo utilizzate ogni mese»: 27 milioni da scanner data della grande distribuzione; quasi 402mila rilevate dagli Uffici comunali di statistica; circa 187mila raccolte dall'Istat; circa 203mila dalla banca dati carburanti del MIMIT; 807 per i tabacchi (ADM). Per gli affitti ~1,5 milioni di osservazioni | Stessa nota, p. 1 |
| «In ottanta comuni» | **80 comuni** (84,0% della popolazione residente) calcolano gli indici; altri **10 comuni** (ulteriore 5,1%) rilevano solo tariffe comunali e alcuni servizi locali. **Oltre 46mila** punti vendita/imprese/istituzioni. Scanner data da oltre 4.250 punti vendita di 19 grandi gruppi | Stessa nota, p. 1 |
| (a voce) «Come si raccolgono i prezzi» | In termini di peso del paniere NIC: **49,9%** con tecniche tradizionali (rilevazione sul territorio), **36,8%** raccolti direttamente dall'Istat (web scraping, grandi fornitori, fonti amministrative), **13,3%** scanner data | Stessa nota, p. 1 |

## B. «Ogni prodotto ha un peso in base a quanto spendiamo»: i pesi 2026

Valori percentuali del paniere, indice **NIC**, anno 2026 (Prospetto 2 della nota, p. 3, per divisione di spesa):

| Divisione | NIC | FOI | IPCA |
|---|---|---|---|
| Prodotti alimentari e bevande analcoliche | 17,2256 | 15,6500 | 17,9043 |
| Trasporti | 15,4540 | 17,5806 | 16,0350 |
| Servizi di ristoranti e servizi di alloggio | 12,1827 | 11,5396 | 12,6720 |
| Abitazione, acqua, elettricità, gas e altri combustibili | 12,0000 | 12,7237 | 12,4803 |
| Sanità | 8,1502 | 7,2952 | 3,9870 |
| Assistenza alla persona, protezione sociale e beni e servizi vari | 6,8933 | 6,5191 | 7,2005 |
| Arredamenti, apparecchi per uso domestico e manutenzione dell'abitazione | 6,7696 | 6,5151 | 7,0640 |
| Abbigliamento e calzature | 6,0192 | 6,1708 | 6,7505 |
| Ricreazione, sport e cultura | 5,8992 | 6,0249 | 6,1241 |
| Bevande alcoliche e tabacco | 2,9104 | 3,1901 | 3,0265 |
| Informazione e comunicazione | 2,8613 | 3,1942 | 2,9758 |
| Servizi finanziari e assicurativi | 2,6667 | 2,4246 | 2,7733 |
| Servizi di istruzione | 0,9678 | 1,1721 | 1,0067 |

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, pagina) |
|---|---|---|
| «Quattro voci pesano più di un decimo ciascuna: cibo, trasporti, ristoranti e alberghi, casa e bollette» | «le divisioni di spesa che nel 2026 mostrano un peso relativo superiore al 10% sono nell'ordine: Prodotti alimentari e bevande analcoliche, Trasporti, Servizi di ristoranti e servizi di alloggio e Abitazione, acqua, elettricità, gas e altri combustibili» (NIC e IPCA). In cifre NIC: **17,2%, 15,5%, 12,2%, 12,0%** | Nota *Paniere 2026*, p. 3 |
| «L'istruzione pesa meno di uno su cento» | Servizi di istruzione: **0,9678%** (NIC). **Informazione e comunicazione 2,86%** (era 3,21% nel 2025 ricostruito, −10,84%) | Nota, Prospetto 2 (p. 3) e Prospetto 3 (p. 4) |
| «L'energia pesa circa un decimo, il cibo fresco meno del sette per cento» | **Beni energetici 10,5124%** (regolamentati 0,6982; non regolamentati 9,8142); **Alimentari non lavorati 6,9833%**; Alimentari lavorati 11,1222%; Tabacchi 2,0305. Totale **beni 55,7656%**, **servizi 44,2344%** | Nota, Prospetto 4, pp. 5–6 |
| «La casa pesa più delle caramelle» | «La casa» **non è** il prezzo d'acquisto: nel paniere sono escluse le spese per acquistare l'abitazione («ritenute spese destinate ad acquisire un bene d'investimento e non di consumo»); entrano **gli affitti reali**, la cui rilevazione (dati Agenzia delle entrate) «pesa per il **2,9%**» del paniere, e interessano il **17,8%** delle famiglie (EU-SILC 2024). La divisione «Abitazione, acqua, elettricità, gas e altri combustibili» pesa **12,0%** | Nota, p. 3 (nota 2) e p. 9 (fonti amministrative) |
| (a voce) «I pesi dipendono da quanto spendono le famiglie» | I coefficienti si aggiornano «per tener conto dell'evoluzione dei consumi finali delle famiglie (secondo le stime della Contabilità nazionale) e dell'informazione derivante dall'indagine sulle Spese delle famiglie»; per il 2026 dati **2025** (Contabilità nazionale) e **2024** (Spese delle famiglie) | Nota, p. 3 |

## C. «Il paniere si aggiorna ogni anno»

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, pagina) |
|---|---|---|
| «Ogni dicembre cambiano prodotti e pesi» | «Gli indici dei prezzi al consumo sono calcolati utilizzando l'indice a catena del tipo Laspeyres, in cui sia il campione di beni e servizi sia il sistema dei pesi vengono **aggiornati con cadenza annuale**. In particolare, **a dicembre di ogni anno**, nel corso delle attività di ribasamento, si rinnova il disegno campionario dell'indagine e la struttura di ponderazione» | Nota *Paniere 2026*, p. 14 («Introduzione e quadro normativo»); identico nel comunicato ISTAT del 30/10/2026, p. 10 |
| «Nel 2026 entrano prodotti nuovi» | Nuovi aggregati 2026: **uniformi scolastiche** (grembiuli, uniformi), **accessori per l'abbigliamento** (filati per maglia e uncinetto), **apparecchiature di sicurezza** (kit di videosorveglianza), **carbone di legna** (carbonella per barbecue), **altri tessili per la casa** (tappetini per il bagno), **trasporto di emergenza di pazienti** (ambulanza privata), **articoli per campeggio** (tende, zaini), **software, esclusi i giochi** (software e antivirus). Dal 2026 l'IPCA include anche **giochi, lotterie e scommesse**, che già contavano nel NIC e nel FOI | Nota, p. 2 |
| «Si usano scanner data dei supermercati» | I beni «grocery» (alimentari confezionati, cura della casa e della persona) sono rilevati con scanner data: **13,3%** del peso del paniere | Nota, p. 1 |
| «Cambia anche come si classificano e quando si parte» | Nuova classificazione **ECOICOP v2** (13 divisioni, erano 12) e nuovo anno base: dal 2026 gli indici sono in **base 2025=100**; serie 1996–2025 ricostruite | Nota, p. 1 |
| «Il peso di cosa sale e di cosa scende nel 2026» | Salgono: **ristoranti e alloggio** (+0,2640 punti), **arredamenti** (+0,2280), **abbigliamento** (+0,1266). Scendono: **informazione e comunicazione** (−0,3478), **ricreazione** (−0,2087), **trasporti** (−0,1624). Tra i servizi, i **trasporti** scendono da 7,50% a 7,14%; i servizi di comunicazione salgono da 1,27% a 1,40% | Nota, Prospetto 3 (p. 4) e Prospetto 4 (p. 6); testo a p. 4 e p. 5 |
| «Escono prodotti che non si comprano più» | **NON VERIFICATO come lista**: la nota 2026 elenca le **novità**, non i prodotti usciti. Si può dire solo che i pesi cambiano (es. «Apparecchiature per l'informazione e la comunicazione» in calo) e che la selezione di referenze scanner è «dinamica» e segue «i prodotti che entrano ed escono dal mercato». **Non** nominare un prodotto uscito | Nota, p. 4 (peso in calo) e p. 11 (selezione dinamica) |

## D. I tre indici: NIC, FOI, IPCA e a cosa servono

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, pagina) |
|---|---|---|
| «NIC: l'indice per tutta la collettività» | «l'indice nazionale dei prezzi al consumo per l'intera collettività (NIC) è utilizzato come misura dell'inflazione per l'intero sistema economico; in altre parole, si considera la collettività nazionale come un'unica grande famiglia di consumatori» | Nota *Paniere 2026*, p. 15 («Campo di osservazione degli indici») |
| «FOI: famiglie di operai e impiegati; serve ad aggiornare affitti e assegni» | «l'indice … (FOI) si riferisce ai consumi dell'insieme delle famiglie che fanno capo a un lavoratore dipendente; è l'indice usato per adeguare periodicamente valori monetari, quali i canoni di affitto o gli assegni dovuti al coniuge separato». Più precisamente: si usa il **FOI al netto dei tabacchi**, pubblicato in Gazzetta Ufficiale ai sensi dell'**art. 81 della legge 27/07/1978, n. 392** | Nota, p. 15; ISTAT, *Indice dei prezzi per le rivalutazioni monetarie* (pagina web, rif. settembre 2026) |
| «IPCA: l'indice europeo, per confrontare i Paesi» | «assicura una misura dell'inflazione comparabile tra i diversi paesi europei … viene quindi assunto come indicatore per verificare la convergenza delle economie dei paesi membri dell'Unione europea»; l'ISTAT lo invia mensilmente a Eurostat, che calcola l'indice europeo | Nota, p. 15 |
| «Perché NIC e IPCA non coincidono» | Il NIC usa il **prezzo pieno di vendita**; l'IPCA il **prezzo effettivamente pagato** (tiene conto di **saldi, sconti e promozioni**; per i medicinali conta la quota a carico delle famiglie). Il NIC include la spesa sanitaria a carico della Pubblica Amministrazione, l'IPCA no: **Sanità 8,2% nel NIC contro 4,0% nell'IPCA** | Nota, p. 16 e pp. 3–4 |
| «Il caso concreto: settembre 2026» | NIC **+4,2%** annuo (+0,7% mensile); IPCA **+4,2%** annuo ma **+2,1%** mensile «per effetto della fine dei saldi estivi di cui il NIC non tiene conto»; FOI al netto dei tabacchi **+4,0%** annuo (+0,6% mensile). Indice FOI generale (base 2025=100) **104,3** | ISTAT, *Prezzi al consumo – dati definitivi settembre 2026*, 16/10/2026, p. 1; pagina *Rivalutazioni monetarie* |
| «E ottobre 2026 (stima)» | NIC **+5,4%**, IPCA **+5,6%** su base annua (da +4,2% entrambi). **Provvisorio** | ISTAT, comunicato provvisorio ottobre 2026, 30/10/2026, p. 1 |
| «NIC e FOI hanno lo stesso paniere ma pesi diversi» | «NIC e FOI si basano sullo stesso paniere … Il peso attribuito a ogni bene o servizio è diverso nei due indici». Esempio nei dati: Trasporti **17,58% (FOI)** contro **15,45% (NIC)**; Alimentari **15,65%** contro **17,23%** | Nota, p. 15 e Prospetto 2, p. 3 |
| «Contratti, **pensioni** e stipendi si adeguano all'indice…» | Verificati **solo** gli affitti e l'assegno al coniuge separato (FOI senza tabacchi). Per **pensioni** e contratti di lavoro **NON VERIFICATO** (nessuna fonte ISTAT/Eurostat/BCE letta; la regola è nella legge e nelle circolari INPS, fuori dal perimetro delle fonti consentite). Non dirlo come dato | — |

## E. Esempi didattici inventati («cifre illustrative, non dati»)

| Esempio | Nota |
|---|---|
| Carrello con cinque prodotti di dimensione diversa (casa, cibo, benzina, caramelle, …) | **Cifre illustrative.** Le dimensioni possono ispirarsi ai pesi reali della sezione B, ma nessun peso di singolo prodotto (caramelle, caffè) è stato verificato: l'ISTAT pubblica pesi per divisione e tipologia, i pesi dei 531 aggregati sono disponibili solo su richiesta (nota p. 2, Prospetto 1, nota (a)) |
| «Se il caffè pesa l'1%…» | **Illustrativo.** Peso reale del caffè **non letto** |

## Cosa NON si può dire
- «L'ISTAT controlla cinquecentotrentuno prodotti»: sono **531 aggregati** (famiglie di prodotti); dire «oltre cinquecento categorie di prodotti».
- «La casa pesa il dodici per cento»: il 12,0% è **Abitazione, acqua, elettricità, gas e combustibili**; l'acquisto della casa non è nel paniere, gli affitti pesano 2,9%.
- Nominare un prodotto uscito dal paniere nel 2026 (non risulta dalla nota).
- Pesi di prodotti singoli (caramelle, caffè): non verificati.
- Pensioni adeguate «all'indice ISTAT»: non verificato (vedi D).
- «Cinque virgola quattro» senza «stima»: il definitivo di ottobre esce il 17/11/2026.

## Dubbi aperti
1. **Ottobre 2026 provvisorio** (NIC +5,4%, IPCA +5,6%): definitivo il 17/11/2026. Il dato definitivo di settembre (4,2%) è sicuro.
2. I pesi riportati sono quelli del **2026**; la nota è del 23/02/2026 e i pesi non cambiano fino alla prossima nota (febbraio 2027).
3. Le percentuali «per divisione» sono in forma ECOICOP v2 (13 divisioni): confrontarle con gli anni precedenti solo con i valori **ricostruiti 2025** del Prospetto 3, non con i pesi pubblicati nel 2025.
4. Pensioni/contratti: da verificare su una fonte INPS/legge, fuori dalle fonti ammesse per questo lavoro.
