# Puntata 43 — «Inflazione generale e core» — fonti (verificate il 16/11/2026)

Vintage e metodo (testi letti il 16/11/2026; stessi documenti di p41 e p42, scaricati una volta):
- **ISTAT, comunicati «Prezzi al consumo» (versione inglese «Consumer prices») dei 24 mesi gennaio 2022 – dicembre 2023**, dati **definitivi**, pagine https://www.istat.it/en/press-release/consumer-prices-<mese>-<anno>/ (letti tutti e 24: frase d'apertura del NIC e frase sull'inflazione di fondo). Le **versioni italiane in PDF di dicembre 2022 e dicembre 2023** (lette per intero): https://www.istat.it/it/files/2023/01/Prezzi-al-consumo_Def_Dic2022.pdf e https://www.istat.it/it/files//2024/01/CS_Prezzi-al-consumo_Def_Dic2023.pdf . Le due versioni coincidono sui valori controllati (NIC e fondo di dicembre 2022 e dicembre 2023, medie annue).
- **ISTAT, «Prezzi al consumo – dati provvisori, ottobre 2026»**, 30/10/2026: https://www.istat.it/wp-content/uploads/2026/10/CS_Prezzi-al-consumo_Prov_Ottobre2026.pdf (**stima preliminare**: il definitivo esce il **17/11/2026**) e **«… dati definitivi, settembre 2026»**, 16/10/2026: https://www.istat.it/wp-content/uploads/2026/10/Prezzi-al-consumo-def-Set2026-1.pdf .
- **ISTAT, nota «Gli indici dei prezzi al consumo… Anno 2026»**, 23/02/2026 (pesi): https://www.istat.it/wp-content/uploads/2026/02/NOTA_INFORMATIVA_PANIERE_2026-1.pdf
- **Eurostat**, dataset `prc_hicp_manr` (variazione annua dell'IPCA), interrogato via API il 16/11/2026, ultimo aggiornamento del dataset 06/02/2026 (serie 1997–2025): https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr ; comunicato flash di ottobre 2026 (04/11/2026): https://ec.europa.eu/eurostat/web/products-euro-indicators/w/2-04112026-ap
- **BCE**, «Underlying inflation measures: an analytical guide for the euro area», Economic Bulletin, n. 5/2023, riquadro: https://www.ecb.europa.eu/press/economic-bulletin/focus/2023/html/ecb.ebbox202305_05~84e89bcb5d.en.html
- Non usate perché secondarie: giornali, Trading Economics e simili (serviti solo per trovare i comunicati).

**Attenzione alla definizione.** Tre «core» diversi, da non mescolare nello stesso reel:
1. **ISTAT «inflazione di fondo»** = indice generale **al netto degli energetici e degli alimentari freschi (non lavorati)**; il cibo lavorato **resta dentro**. È il dato di tutta questa scheda se non diversamente indicato.
2. **ISTAT «al netto dei soli energetici»**: seconda misura, più alta (non usata sotto, salvo dove indicato).
3. **Eurostat/BCE «core»** = IPCA **al netto di energia e alimentari (tutti)** — per Eurostat anche alcol e tabacco. I valori italiani 2022–2023 di Eurostat sono **più bassi** di quelli ISTAT (es. dicembre 2022: 4,8% contro 5,8%).

## A. Che cosa sono generale e di fondo

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, pagina) |
|---|---|---|
| «La generale considera tutto il paniere» | NIC = indice nazionale dei prezzi al consumo per l'intera collettività; «inflazione» = variazione dei prezzi di «un insieme di prodotti (paniere) rappresentativo di tutti i beni e servizi destinati al consumo finale delle famiglie» | ISTAT, comunicato provvisorio ottobre 2026, 30/10/2026, glossario, p. 8 |
| «La core esclude energia e alimentari freschi» | «l'"inflazione di fondo", calcolata al netto degli energetici e degli alimentari freschi» e, nel glossario: «Componente di fondo: viene calcolata escludendo i beni alimentari non lavorati e i beni energetici» | ISTAT, comunicato provvisorio ottobre 2026, p. 1 e p. 8; dati definitivi dicembre 2022, p. 1 («cioè al netto degli energetici e degli alimentari freschi») |
| «Quanto pesano le voci escluse» | Paniere NIC 2026: **Beni energetici 10,5124%** + **Alimentari non lavorati 6,9833%**; **Componente di fondo 82,5043%** (era 83,1466% nel 2025 ricostruito) | ISTAT, nota *Paniere 2026*, 23/02/2026, Prospetto 4, pp. 5–6 |
| «Perché si toglie: sono le voci più volatili, la core mostra la tendenza» | BCE: l'inflazione sottostante deve «capture more persistent and generalised developments across prices, abstracting from volatile or idiosyncratic relative price movements, and thereby provide an informative signal about where headline inflation will settle in the medium term»; «At the ECB, core inflation refers to the Harmonised Index of Consumer Prices (HICP) excluding energy and food. As this excludes the volatile energy and food components that are subject to frequent transitory shocks, it is also considered to be a specific measure of underlying inflation.» La BCE aggiunge che la misura sottostante **non è osservabile** e va stimata (usa più misure) | BCE, *Underlying inflation measures: an analytical guide for the euro area*, Economic Bulletin 5/2023, introduzione |
| «Se la core sale anche lei, l'aumento si sta diffondendo» | **Interpretazione teorica, attribuire alla BCE** (sopra: «persistent and generalised»). Non è un dato ISTAT. Il caso 2022–2023 (sezione B) lo illustra | — |

## B. Italia 2022–2023: generale e di fondo, mese per mese

Variazioni **tendenziali** (sullo stesso mese dell'anno prima), NIC al lordo dei tabacchi, come pubblicate nel comunicato definitivo di ciascun mese. In **grassetto** i picchi.

| Mese | NIC (generale) su base annua, % | Inflazione di fondo ISTAT, % | Differenza (nostro calcolo, punti) | Comunicato definitivo ISTAT |
|---|---|---|---|---|
| gennaio 2022 | 4,8 | 1,5  | +3,3 | https://www.istat.it/en/press-release/consumer-prices-january-2022/ |
| febbraio 2022 | 5,7 | 1,7  | +4,0 | https://www.istat.it/en/press-release/consumer-prices-february-2022/ |
| marzo 2022 | 6,5 | 1,9  | +4,6 | https://www.istat.it/en/press-release/consumer-prices-march-2022/ |
| aprile 2022 | 6,0 | 2,4  | +3,6 | https://www.istat.it/en/press-release/consumer-prices-april-2022/ |
| maggio 2022 | 6,8 | 3,2  | +3,6 | https://www.istat.it/en/press-release/consumer-prices-may-2022/ |
| giugno 2022 | 8,0 | 3,8  | +4,2 | https://www.istat.it/en/press-release/consumer-prices-june-2022/ |
| luglio 2022 | 7,9 | 4,1  | +3,8 | https://www.istat.it/en/press-release/consumer-prices-july-2022/ |
| agosto 2022 | 8,4 | 4,4  | +4,0 | https://www.istat.it/en/press-release/consumer-prices-august-2022/ |
| settembre 2022 | 8,9 | 5,0  | +3,9 | https://www.istat.it/en/press-release/consumer-prices-september-2022/ |
| **ottobre 2022** | **11,8** | 5,3  | +6,5 | https://www.istat.it/en/press-release/consumer-prices-october-2022/ |
| **novembre 2022** | **11,8** | 5,6  | +6,2 | https://www.istat.it/en/press-release/consumer-prices-november-2022/ |
| dicembre 2022 | 11,6 | 5,8  | +5,8 | https://www.istat.it/en/press-release/consumer-prices-december-2022/ |
| gennaio 2023 | 10,0 | 6,0  | +4,0 | https://www.istat.it/en/press-release/consumer-prices-january-2023/ |
| **febbraio 2023** | 9,1 | **6,3**  | +2,8 | https://www.istat.it/en/press-release/consumer-prices-february-2023/ |
| **marzo 2023** | 7,6 | **6,3**  | +1,3 | https://www.istat.it/en/press-release/consumer-prices-march-2023/ |
| aprile 2023 | 8,2 | 6,2  | +2,0 | https://www.istat.it/en/press-release/consumer-prices-april-2023/ |
| maggio 2023 | 7,6 | 6,0  | +1,6 | https://www.istat.it/en/press-release/consumer-prices-may-2023/ |
| giugno 2023 | 6,4 | 5,6  | +0,8 | https://www.istat.it/en/press-release/consumer-prices-june-2023/ |
| luglio 2023 | 5,9 | 5,2  | +0,7 | https://www.istat.it/en/press-release/consumer-prices-july-2023/ |
| agosto 2023 | 5,4 | 4,8  | +0,6 | https://www.istat.it/en/press-release/consumer-prices-august-2023/ |
| settembre 2023 | 5,3 | 4,6  | +0,7 | https://www.istat.it/en/press-release/consumer-prices-september-2023/ |
| ottobre 2023 | 1,7 | 4,2 | -2,5 | https://www.istat.it/en/press-release/consumer-prices-october-2023/ |
| novembre 2023 | 0,7 | 3,6 | -2,9 | https://www.istat.it/en/press-release/consumer-prices-november-2023/ |
| dicembre 2023 | 0,6 | 3,1 | -2,5 | https://www.istat.it/en/press-release/consumer-prices-december-2023/ |


| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, pagina) |
|---|---|---|
| «La generale tocca il picco nell'autunno 2022: undici virgola otto per cento» | NIC **+11,8%** su base annua sia a **ottobre 2022** (da +8,9% di settembre; +3,4% su base mensile) sia a **novembre 2022** («the same as in October»); **dicembre 2022 +11,6%**. Il salto di ottobre è dovuto soprattutto agli Energetici | ISTAT, *Prezzi al consumo – ottobre/novembre 2022*, comunicati definitivi (pagine inglesi sopra); dicembre 2022: PDF italiano, 17/01/2023, p. 1 |
| «La core tocca il picco più tardi: sei virgola tre per cento, a febbraio e marzo 2023» | Fondo **+6,3%** a **febbraio 2023** (da +6,0%) e **+6,3% a marzo 2023** («both stable compared to the previous month»); aprile 2023 +6,2%. In quei due mesi la generale era già scesa a **9,1%** e **7,6%** | ISTAT, comunicati definitivi febbraio e marzo 2023 |
| «Il picco della generale arriva circa quattro mesi prima di quello della core» | Calcolo nostro: generale al massimo a ott.–nov. 2022, fondo al massimo a feb.–mar. 2023 (tre–cinque mesi dopo secondo il mese scelto). Dire «alcuni mesi dopo» | Dalla tabella sopra |
| «Nel novembre 2022 generale e core distano più di sei punti» | **11,8% contro 5,6%**: differenza **6,2 punti** (calcolo nostro). Il fondo era **5,3%** a ottobre 2022 (differenza 6,5) | Comunicati definitivi ottobre e novembre 2022 |
| «A fine 2023 il rapporto si capovolge: la core è sopra la generale» | **Dicembre 2023**: NIC **+0,6%**, fondo **+3,1%** (da +3,6% di novembre); novembre 2023 NIC **+0,7%**, fondo **+3,6%**; ottobre 2023 NIC +1,7%, fondo +4,2%. Gli Energetici regolamentati a −41,6% e i non regolamentati a −21,1% (dicembre 2023) tengono giù la generale | ISTAT, dati definitivi dicembre 2023, 01/2024, p. 1 |
| «Medie annue: nel 2022 generale 8,1%, core 3,8%; nel 2023 generale 5,7%, core 5,1%» | Media annua **2022**: NIC **+8,1%** (massimo dal 1985, quando +9,2%), fondo **+3,8%** (da +0,8% nel 2021), al netto dei soli energetici +4,1%. Media annua **2023**: NIC **+5,7%**, fondo **+5,1%**, al netto dei soli energetici +5,3%. Energetici +50,9% in media nel 2022, +1,2% nel 2023. Il fondo **sale** in media da un anno all'altro mentre la generale **scende** | ISTAT, dati definitivi dicembre 2022, p. 1; dati definitivi dicembre 2023, p. 1 |
| «Per trimestri nel 2023: generale 9,1, 7,5, 5,8, 1,1; core 6,2, 5,9, 4,9, 3,6» | «la dinamica tendenziale dei prezzi al consumo ha evidenziato una progressiva decelerazione, dal **+9,1%** del primo trimestre 2023, al **+7,5%** e al **+5,8%** … nel quarto a **+1,1%**»; la componente di fondo «dal **+6,2%** del primo trimestre al **+3,6%** dell'ultimo trimestre, passando per il **+5,9%** e il **+4,9%**» | ISTAT, dati definitivi dicembre 2023, p. 8 |

## C. Controllo incrociato con Eurostat (IPCA, definizione diversa)

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella) |
|---|---|---|
| (a voce, se serve il confronto europeo) «Area euro: la generale tocca il picco a ottobre 2022, al dieci virgola sei per cento» | Area euro IPCA, variazione annua: **10,6%** a ottobre 2022 (massimo del periodo 2022–2023); 10,1% novembre; 9,2% dicembre 2022 | Eurostat, `prc_hicp_manr`, geo EA, coicop CP00 |
| «… e la core europea più tardi, a marzo 2023» | Area euro, IPCA **al netto di energia, alimentari, alcol e tabacco** (coicop `TOT_X_NRG_FOOD`): **5,7%** a **marzo 2023** (massimo 2022–2023); 5,0% ottobre 2022 | Eurostat, `prc_hicp_manr`, geo EA, coicop TOT_X_NRG_FOOD |
| «Italia, IPCA» | IPCA Italia: **12,6%** a ottobre e novembre 2022 (12,3% dicembre 2022); core Eurostat Italia: **5,5%** a **febbraio 2023** (4,6% ottobre 2022, 4,8% dicembre 2022, 3,0% dicembre 2023) | Eurostat, `prc_hicp_manr`, geo IT |

Il riscontro conferma lo **schema** (generale in cima nell'autunno 2022, core in cima nei primi mesi 2023) ma i **numeri** del core sono diversi da quelli ISTAT perché la definizione è diversa (sezione «Attenzione»): non citarli insieme a quelli ISTAT.

## D. Oggi (2026): il caso opposto

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, pagina) |
|---|---|---|
| «Nel 2026 la generale sale più della core» | **Ottobre 2026 (stima preliminare)**: NIC **+5,4%**, fondo **+2,0%** (da +1,6%), al netto dei soli energetici +2,5%; beni energetici **+31,4%**; «tornando al livello registrato ad agosto 2023». **Settembre 2026 (definitivo)**: NIC **+4,2%**, fondo **+1,6%** (da +1,5%) | ISTAT, comunicato provvisorio ottobre 2026, 30/10/2026, p. 1; dati definitivi settembre 2026, 16/10/2026, p. 1 |
| «Inflazione acquisita 2026» | Trascinamento per il 2026: **+3,4%** per l'indice generale e **+1,9%** per il fondo (stima ottobre; +3,1% e +1,9% a settembre) | Stessi comunicati, p. 1 |
| «Area euro, ottobre 2026» | Flash: generale **4,0%** (stima), core (senza energia, alimentari, alcol e tabacco) **2,5%**, energia **20,8%** | Eurostat, flash 04/11/2026, tabella «Euro area annual inflation and its components» |

Lettura prudente (non è un dato ISTAT): nel 2026 il fondo resta intorno al 2% e la spinta viene dall'energia, quindi il quadro **non** è quello del 2022, quando il fondo saliva fino a oltre il 6%. Ma il fondo **accelera** (da +1,5% ad agosto a +1,6% a settembre a +2,0% a ottobre): dire «accelera un po'», non «si sta diffondendo».

## E. Esempi didattici inventati («cifre illustrative, non dati»)
Nessun esempio inventato: la scheda usa i dati reali 2022–2023. Le «due linee di vetro» del visual sono una stilizzazione: se disegnate con i valori della tabella B, citare la fonte; se disegnate a mano, scrivere «cifre illustrative, non dati».

## Cosa NON si può dire
- «La core esclude energia e cibo» senza distinguere: per l'**ISTAT** si tolgono solo gli **alimentari freschi (non lavorati)**; per Eurostat/BCE **tutto** il cibo.
- Citare insieme il core ISTAT (5,8% a dicembre 2022) e quello Eurostat (4,8%) come se fossero lo stesso numero.
- «La core prevede l'inflazione futura»: la BCE la descrive come una misura **sottostante**, che segnala dove si assesterà la generale nel medio termine, ma **non osservabile** e da stimare con più misure. Non è una previsione certa.
- «Ottobre 2026 core 2,0%» senza «stima preliminare».
- Lo scarto «quattro mesi»: dire «alcuni mesi dopo».

## Dubbi aperti
1. **Ottobre 2026 è provvisorio**; definitivo ISTAT il **17/11/2026**, Eurostat completo il 18/11/2026. Il dato di settembre (NIC 4,2%, fondo 1,6%) è definitivo.
2. I valori 2022–2023 sono letti sui comunicati **dell'epoca** (base 2015=100, ECOICOP v1). Da gennaio 2026 l'ISTAT ha **ricostruito** le serie 1996–2025 in base 2025=100 con la nuova classificazione (nota *Paniere 2026*, p. 1): per l'indice generale i tassi non risultano cambiati (NIC 11,8% e medie 8,1% e 5,7% confermati nei comunicati letti), ma **il fondo non è stato riconfrontato sulla serie ricostruita** (banca dati esploradati non interrogata). Se il reel mostra un grafico preciso al decimo, ricontrollare su esploradati.istat.it; a voce «circa sei per cento» è sicuro.
3. Revisioni: le stime provvisorie del fondo cambiano di un decimo nel definitivo (es. novembre 2022: provvisorio +5,7%, definitivo +5,6%); la tabella usa solo i **definitivi**.
4. Gli ultimi due valori di Eurostat (EA/IT 2022–2023) vengono dal dataset aggiornato al 06/02/2026: non rivisti dopo.
