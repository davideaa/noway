# Puntata 46 — «Troppa domanda» (inflazione da domanda) — fonti (verificate il 18/11/2026)

Vintage e metodo (testi letti il 18/11/2026; PDF e pagine scaricati e letti con `pdftotext`/conversione HTML; fonti solo primarie: BCE, Fed, BLS, Banca d'Italia):
- **BCE**, blog «Demand or supply-driven? How firms view inflation right now», N. Battistini e G. Trebbi, 29/07/2026: https://www.ecb.europa.eu/press/blog/date/2026/html/ecb.blog20260729~7cbefa619b.en.html
- **BCE**, spiegazione «Why is inflation currently so high?», 16/11/2021: https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/high_inflation.en.html
- **BCE**, *Economic Bulletin* Issue 7/2022, riquadro «The role of demand and supply in underlying inflation – decomposing HICPX inflation into components» (Gonçalves, Koester): https://www.ecb.europa.eu/press/economic-bulletin/focus/2022/html/ecb.ebbox202207_07~8b71edbfcf.en.html
- **Fed (Federal Reserve Bank of San Francisco)**, A. H. Shapiro, *Decomposing Supply and Demand Driven Inflation*, Working Paper 2022-18, rev. 05/02/2024: https://www.frbsf.org/wp-content/uploads/wp2022-18.pdf
- **Fed (Board of Governors)**, J. Powell, discorso di Jackson Hole, 26/08/2022: https://www.federalreserve.gov/newsevents/speech/powell20220826a.htm
- **BLS** (Bureau of Labor Statistics, USA), comunicato «Consumer Price Index – June 2022», 13/07/2022: https://www.bls.gov/news.release/archives/cpi_07132022.htm (e luglio 2022: https://www.bls.gov/news.release/archives/cpi_08102022.htm)
- **Banca d'Italia**, *Relazione annuale sul 2023 in sintesi*, 31/05/2024: https://www.bancaditalia.it/pubblicazioni/relazione-annuale/2023/sintesi/rel_2023_sintesi.pdf
- Non usati: giornali, VoxEU/CEPR, Brookings (non primari). Il sito BLS blocca il download automatico (`curl`): le frasi BLS sono state lette tramite la pagina web, non da PDF.

**Il caso della scheda è USA (BLS/Fed).** La scheda dice «USA 2021–2022: sussidi e riaperture… CPI 9,1% a giugno 2022, dato BLS». Il dato BLS è corretto; il nesso «sussidi e riaperture → domanda» è sostenuto dalla Fed (sezione C). Per un caso **area euro/Italia** vedere la sezione D.

## A. Definizione di inflazione da domanda (BCE)

| Detto nel reel | Dato / testo esatto | Fonte |
|---|---|---|
| «Inflazione da domanda (demand-pull): chiede una risposta decisa della banca centrale» | «Demand-driven inflation (sometimes called demand-pull inflation) calls for a firm policy response. Meanwhile, supply-driven inflation (also known as cost-push inflation) warrants a more careful assessment.» (questa è la distinzione domanda/offerta per le banche centrali) | BCE, blog 29/07/2026, paragrafo introduttivo |
| «Se le imprese non riescono a stare dietro alla domanda, i prezzi salgono» | «When companies can’t keep up with the pace at which people want to buy things, prices go up.» Contesto: riapertura, «They are buying more, spending some of the money they couldn’t spend during the lockdowns.» (risparmi accumulati durante i lockdown). «When an economy is growing, businesses find it easier to raise prices without losing customers.» | BCE, «Why is inflation currently so high?», 16/11/2021, sezioni «Demand» e «Supply» |
| «Come si riconosce domanda e offerta» (opzionale) | Metodo: «a supply shock affects activity and inflation in opposite directions while a demand shock affects them in the same direction» (prezzi e attività nella stessa direzione = domanda) | BCE, *Economic Bulletin* 7/2022, riquadro HICPX; stessa regola nel blog BCE 2026 |

Attenzione al lessico: «inflazione da domanda» = *demand-pull*; quella da costi = *cost-push* (puntata 47). La BCE non usa «AD-AS» nei testi citati: lo spostamento della curva AD a destra è la rappresentazione didattica, non una citazione BCE.

## B. Il dato USA: CPI giugno 2022 (BLS)

| Detto nel reel | Dato esatto | Fonte |
|---|---|---|
| «A giugno 2022 i prezzi al consumo americani erano saliti del 9,1% in dodici mesi» | CPI-U, tutte le voci, **+9,1% sui 12 mesi** (giugno 2021–giugno 2022, dato non destagionalizzato): «Over the last 12 months, the all items index increased 9.1 percent before seasonal adjustment.» Sul mese: **+1,3%** destagionalizzato (maggio +1,0%) | BLS, CPI giugno 2022, 13/07/2022, primo paragrafo |
| «È stato il massimo da novembre 1981» | Tabella 7 del comunicato, riga «All items», colonna «Largest (L) or smallest (S) unadjusted change since»: «L – Nov. 1981» (a quella data +9,6%). Quindi l'ultima volta che la variazione era stata così alta o più alta è novembre 1981. **Non è una frase di testo del comunicato**: dirlo «il più alto da novembre 1981» | BLS, CPI giugno 2022, Tabella 7 (letta tramite pagina web) |
| «Giugno 2022 è il picco» | Luglio 2022: **+8,5%** («a smaller figure than the 9.1-percent increase for the period ending June»). Quindi giugno 2022 è il massimo del ciclo, finora verificato solo per giugno e luglio (le serie CPI-U non destagionalizzate non vengono riviste) | BLS, CPI luglio 2022, 10/08/2022, primo paragrafo e sezione 12 mesi |
| (colore, se serve) Energia e cibo giugno 2022 | Energia **+41,6%**, alimentari **+10,4%** su 12 mesi. Sul mese giugno: energia +7,5%, benzina +11,2%. «The increase was broad-based, with the indexes for gasoline, shelter, and food being the largest contributors» | BLS, CPI giugno 2022, primo e secondo paragrafo |

**Cautela forte:** il CPI al 9,1% **non è inflazione «solo da domanda»**: quasi la metà del rialzo mensile di giugno viene dall'energia («contributed nearly half of the all items increase»). Vedere sezione C: la Fed stessa lo descrive come domanda forte **e** offerta vincolata.

## C. Domanda e offerta negli USA nel 2021–22 (Fed)

| Detto nel reel | Testo esatto | Fonte |
|---|---|---|
| «Dopo la riapertura la domanda negli USA è salita» | «After a precipitous decline in 2020, demand-driven inflation began to surge in the Spring of 2021, coinciding with the re-opening of the economy and the implementation of the American Rescue Plan. Supply-driven inflation surged in early 2022 likely due to the economic disruptions associated with the Russian invasion of Ukraine.» (**American Rescue Plan** = il pacchetto di sostegni del 2021) | Fed SF, Shapiro, WP 2022-18, rev. 02/2024, sezione introduttiva (letto nel PDF) |
| «Il presidente della Fed: domanda forte, offerta vincolata» | «the current high inflation in the United States is the product of strong demand and constrained supply, and … the Fed's tools work principally on aggregate demand.» E: «The labor market is particularly strong, but it is clearly out of balance, with demand for workers substantially exceeding the supply of available workers.» | Fed, Powell, Jackson Hole, 26/08/2022 |
| «La Fed rialza i tassi per frenare la domanda» | «We are taking forceful and rapid steps to moderate demand so that it comes into better alignment with supply» | stesso discorso (Powell, 26/08/2022) |

Il paper di Shapiro è un lavoro di staff («the views … should not be interpreted as reflecting the views of the Federal Reserve Bank of San Francisco or the Board»): attribuire a «un economista della Fed di San Francisco», non «la Fed dice». Il discorso di Powell invece è posizione ufficiale. **Non verificata** la quota numerica domanda/offerta del CPI/PCE 2022 (il paper dà serie, non una frase con la percentuale).

## D. Area euro (alternativa al caso USA)

| Detto nel reel | Testo esatto | Fonte |
|---|---|---|
| «Anche in Europa la ripresa della domanda ha contribuito» (BdI) | «Nell’area dell’euro, all’uscita dalla crisi sanitaria, il rapido recupero della domanda si è aggiunto alle strozzature nell’offerta, alimentando le pressioni sulle quotazioni dell’energia, delle materie prime…» (poi: «eccezionale rincaro del gas… accentuatosi dopo l'invasione») | Banca d'Italia, *Relazione annuale sul 2023 in sintesi*, 31/05/2024, p. 14 |
| «Nell'area euro l'inflazione di fondo è stata prima da offerta, poi anche da domanda» | HICPX (IPCA al netto di energia e alimentari): «the increase in euro area HICPX inflation starting in the third quarter of 2021 was initially mainly supply-driven, but the importance of demand factors has gradually increased over time. Over recent months, supply and demand factors have played broadly similar roles in HICPX inflation»; beni industriali non energetici più da offerta, servizi più da domanda. Dati fino a luglio–agosto 2022 | BCE, *Economic Bulletin* 7/2022, riquadro HICPX, Grafico B e testo |
| «Nel 2022 in area euro la domanda era vivace» (BCE sul 2022) | «The higher level in 2022 reflected stronger broad-based inflationary pressures, as demand was buoyant – driven by the post-pandemic reopening, especially in services – while supply was constrained – with global bottlenecks still biting, most notably in manufacturing.» E: «Demand-pull pressures dominated in 2022, whereas cost-push inflationary forces have played a comparatively larger role in the current episode.» (riferito alle aspettative di prezzo delle imprese, con decomposizione strutturale: è un confronto 2022–2026, non una quota dell'inflazione) | BCE, blog 29/07/2026, sezione sui confronti con il 2022 (Grafico 3 e testo) |
| (attualità 2026) | «Now as then, the inflation surge appears to be largely driven by an energy supply shock.» HICP area euro «from 1.9% to 2.8% year on year» tra febbraio e giugno 2026 (episodio attuale, prevalentemente costi: «comparatively clearer cost-push (rather than demand-pull) inflation») | BCE, blog 29/07/2026 |

## E. Esempi didattici inventati («cifre illustrative, non dati»)
La scheda non ha esempi numerici inventati. Se il visual disegna la curva AD che si sposta, la quantità (prezzi/livello di equilibrio) è «cifre illustrative, non dati». Non scrivere numeri sull'asse come se fossero USA reali.

## Cosa NON si può dire
- «Il 9,1% era tutto inflazione da domanda»: la Fed dice domanda forte **e** offerta vincolata; il BLS mostra l'energia a +41,6%.
- «Il 9,1% è il massimo storico»: è il massimo da novembre 1981 (allora 9,6%).
- «Sussidi e riaperture hanno causato il 9,1%»: la Fed (Shapiro) li lega alla **fase** domanda-driven 2021; nessuna quota verificata.
- «La BCE dice che l'inflazione 2022 era tutta da domanda»: il blog BCE 2026 dice che nel 2022 «demand-pull pressures dominated» (rispetto al 2026) con offerta comunque vincolata; il riquadro BCE 7/2022 dice che per l'inflazione di fondo si è passati da offerta a un mix pari tra offerta e domanda. Nessuna quota percentuale.
- «Inflazione da domanda = tassi più alti sempre»: è la frase BCE «calls for a firm policy response»; non è una regola assoluta.

## Dubbi aperti
1. **BLS «L – Nov. 1981»** letto dalla pagina web (non scaricabile con `curl`): da ricontrollare a mano nella Tabella 7 prima di scrivere «il più alto da novembre 1981».
2. Il picco USA a giugno 2022 è confermato solo contro luglio; nessuna verifica dell'intera serie mensile.
3. Quota domanda/offerta nell'inflazione USA 2022: non verificata (non dare percentuali).
4. Nessuna fonte primaria sul ruolo dei **«risparmi accumulati»** in cifre (la BCE ne parla solo qualitativamente, 2021).
5. L'esempio «credito facile» della scheda non ha una fonte in questo file.
