# Puntata 52 — «La deflazione» — fonti (verificate il 20/11/2026)

Vintage e metodo (testi e serie letti il 20/11/2026; CSV FRED e JSON Eurostat scaricati e riletti; PDF letti con `pdftotext`; fonti solo primarie: BCE, Bundesbank, Eurostat, Statistics Bureau of Japan, FRED):
- **BCE**, glossario, voce «deflation»: https://www.ecb.europa.eu/services/glossary/html/glossd.en.html
- **BCE**, opuscolo *Price stability: why is it important for you?* (2011): https://www.ecb.europa.eu/pub/pdf/other/price_stability_web_2011en.pdf (p. 24 e p. 61)
- **Deutsche Bundesbank**, *Geld und Geldpolitik*, cap. 5.1 «Preisstabilität, Inflation, Deflation»: https://publikationen.bundesbank.de/publikationen-de/schule-bildung/geld-und-geldpolitik-921580?article=5-der-wert-stabilen-geldes-922608
- **BCE**, introductory statement alla conferenza stampa del 22/01/2015: https://www.ecb.europa.eu/press/press_conference/monetary-policy-statement/2015/html/is150122.en.html ; intervista di M. Draghi a *Handelsblatt*, 02/01/2015: https://www.ecb.europa.eu/press/inter/date/2015/html/sp150102_1.en.html
- **FRED (St. Louis Fed)**, serie `CPALTT01JPA659N` «Consumer Price Index: Total for Japan», crescita sullo stesso anno precedente, percentuale, annuale; fonte dei dati OCSE; ultimo aggiornamento della serie 15/05/2024; scaricabile: https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPALTT01JPA659N (pagina https://fred.stlouisfed.org/series/CPALTT01JPA659N). Controllo incrociato con la serie indice `JPNCPIALLAINMEI` (2015=100): https://fred.stlouisfed.org/series/JPNCPIALLAINMEI
- **Statistics Bureau of Japan**, *Japan's Consumer Prices in 2011* (PDF): https://www.stat.go.jp/english/data/cpi/report/2011np/pdf/2011np-e.pdf ; *Japan's Consumer Prices in 2015*: https://www.stat.go.jp/english/data/cpi/report/2015np/pdf/2015np-e.pdf (testo, p. 1)
- **Eurostat**, `prc_hicp_manr` «HICP – monthly data (annual rate of change)», area euro, indice generale (CP00), dati aggiornati 06/02/2026 (dataset ora sostituito da `prc_hicp_minr`): https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_manr ; `prc_hicp_aind` (media annua): https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_aind
- Non usati: giornali, Wikipedia.

**Limite dei dati giapponesi**: la serie FRED/OCSE è arrotondata a un decimale e **si ferma al 2020** nel file letto (aggiornata nel 2024); i valori 2009, 2010 e 2011 sono confermati dal Bureau statistico giapponese (testo 2011), il 2015 dal rapporto 2015. Per gli anni 1995-2008 e 2012-2014 si usa solo FRED/OCSE (controllo con indice FRED 2015=100, scarto massimo 0,01-0,02 punti).

## A. Definizione (BCE)

| Detto nel reel | Testo esatto | Fonte |
|---|---|---|
| «La deflazione è un calo generale dei prezzi» | «A decline in the general price level, e.g. in the consumer price index. See also inflation» | BCE, glossario, voce «deflation» |
| «Calo persistente, non di un mese» | «Deflation is often defined as the opposite of inflation, namely as a situation in which the overall price level falls over an extended period.» | BCE, *Price stability: why is it important for you?*, p. 24 |
| (stessa idea, Bundesbank) | «Den entgegengesetzten Prozess, also einen Rückgang des Preisniveaus, nennt man Deflation.» Vale solo se il calo dura un periodo più lungo, non per un breve momento | Bundesbank, *Geld und Geldpolitik*, cap. 5.1 |
| «Perché la BCE la teme come l'inflazione alta» (obiettivo simmetrico) | «By referring to “an increase in the HICP of below 2%”, the definition makes it clear that both inflation above 2% and deflation (i.e. declines in the price level) are inconsistent with price stability.» | BCE, stesso opuscolo, p. 61 |
| «Se i prezzi scendono si rimanda la spesa» (meccanismo) | Draghi, 2/01/2015: se l'inflazione bassa dura a lungo, «people might expect prices to fall even further and postpone their spending»; sul rischio deflazione: «The risk cannot be ruled out completely, but it is limited. We are not there yet.» Il testo non è una definizione formale | BCE, intervista a *Handelsblatt*, 2/01/2015 |

Nota: il glossario BCE dà solo la definizione di una riga; «persistente» sta nell'opuscolo 2011 («over an extended period»), non nel glossario. Il peso dei debiti (la scheda lo cita) è descritto dalla BCE: «However, in times of deflation, borrowers or debtors are often unable to pay back their debt and may even go bankrupt.» (opuscolo 2011, p. 33; prima: «people who hold nominal claims may stand to gain as the real value of their claims (e.g. wages, deposits) increases»). È un testo qualitativo, non un dato.

## B. Giappone, indice dei prezzi al consumo (serie annuale, variazione % sull'anno precedente)

Valori da FRED `CPALTT01JPA659N` (OCSE, un decimale). Anni con variazione **negativa** tra 1990 e 2020:

| Anno | Variazione annua | Anno | Variazione annua |
|---|---|---|---|
| 1995 | −0,1% | 2005 | −0,3% |
| 1999 | −0,3% | 2009 | **−1,4%** |
| 2000 | −0,7% | 2010 | −0,7% |
| 2001 | −0,7% | 2011 | −0,3% |
| 2002 | −0,9% | 2016 | −0,1% |
| 2003 | −0,3% | 2020 | −0,025% in FRED (un decimale: 0,0%; **non** contarlo) |

- **Valore minimo (1990-2020): −1,4% nel 2009** (FRED; il Bureau statistico giapponese: «In 2009, the index fell 1.4%, which was the largest decline from 1971»; testo del rapporto sul 2011, panoramica). Poi 2002 (−0,9%) e 2000, 2001 e 2010 (−0,7%).
- Anni a variazione **zero** (non negativa a un decimale): 2004 (0,0%; indice −0,01%), 2007 (0,0%; +0,04%), 2012 (0,0%; −0,04%). Se si dice «anni con prezzi in calo», **non contarli come calo**; la serie con un decimale li mostra uguali a zero.
- 1999-2003 sono 5 anni consecutivi negativi; 2004 è zero; 2005 è −0,3%. **Non** dire «dal 1995 prezzi in calo ogni anno»: 1996 (+0,1%), 1997 (+1,8%), 1998 (+0,6%), 2006 (+0,3%), 2008 (+1,4%) sono positivi.
- **Calo cumulato**: l'indice FRED (2015=100) passa da 100,085 (1998) a 96,225 (2012), cioè −3,9% in 14 anni (calcolo nostro su serie OCSE); nonostante gli anni negativi, il livello dei prezzi **non è crollato**: la deflazione giapponese è stata lieve ma lunga. «Prezzi in calo per lunghi periodi» è corretto; «prezzi crollati» no.
- Conferme del Bureau statistico giapponese: 2008 «the index rose 1.4%»; 2009 −1,4%; 2010 −0,7%; 2011 −0,3% (indice 99,7, 2010=100); 2015 +0,8% (indice 103,6, 2010=100) (rapporti annuali 2011 e 2015).
- Dopo il 2014 (+2,7%, in gran parte per l'aumento dell'imposta sui consumi dell'aprile 2014: **non verificato** in questo file) i valori tornano vicini a zero: 2015 +0,8%, 2016 −0,1%.

| Detto nel reel | Dato esatto | Fonte |
|---|---|---|
| «Nel 2009 i prezzi giapponesi sono scesi dell'1,4%: il calo annuo più forte dal 1971» | −1,4% (2009); «the largest decline from 1971» | Statistics Bureau of Japan, *Japan's Consumer Prices in 2011*, panoramica; FRED `CPALTT01JPA659N` |
| «Tra il 1999 e il 2003 cinque anni di fila con prezzi in calo» | 1999 −0,3, 2000 −0,7, 2001 −0,7, 2002 −0,9, 2003 −0,3 (%) | FRED `CPALTT01JPA659N` (OCSE) |
| «Dal 1995 al 2016 undici anni su ventidue con prezzi in calo» | Anni negativi 1995-2016: 1995, 1999, 2000, 2001, 2002, 2003, 2005, 2009, 2010, 2011, 2016 = 11 su 22 (esclusi 2004, 2007, 2012 a zero) | Calcolo nostro su FRED |

## C. Area euro 2014–2016, HICP (Eurostat)

Variazione annua dell'HICP, area euro, indice generale, **mensile** (`prc_hicp_manr`, un decimale; composizione dell'area che cambia nel tempo, EA18 nel 2014, EA19 dal 2015):

| Periodo | Valore |
|---|---|
| Nov 2014 | +0,3% |
| **Dic 2014** | **−0,2%** (primo valore negativo dal 2009 secondo la BCE) |
| **Gen 2015** | **−0,6%** (minimo del periodo) |
| **Feb 2015** | −0,3% |
| **Mar 2015** | −0,1% |
| Apr 2015 | +0,2% |
| Mag 2015 | +0,6% |
| Giu 2015 – Gen 2016 | tutti positivi (+0,5, +0,5, +0,4, +0,2, +0,4, +0,1, +0,3, +0,3) |
| **Feb 2016** | −0,1% |
| Mar 2016 | 0,0% |
| **Apr 2016** | −0,3% |
| **Mag 2016** | −0,1% |
| Giu 2016 | 0,0% |
| Lug 2016 | +0,2% |
| Dic 2016 | +1,1% |
| Feb 2017 | +2,0% |

Media annua (Eurostat `prc_hicp_aind`, `RCH_A_AVG`): **2014 +0,4%, 2015 +0,2%, 2016 +0,2%**, 2017 +1,5%.

| Detto nel reel | Dato esatto | Fonte |
|---|---|---|
| «Tra dicembre 2014 e marzo 2015 l'inflazione area euro è stata negativa (4 mesi)» | −0,2%, −0,6%, −0,3%, −0,1% (dic 2014-mar 2015) | Eurostat `prc_hicp_manr` |
| «La BCE: dicembre 2014 −0,2%» | «According to Eurostat, euro area annual HICP inflation was -0.2% in December 2014, after 0.3% in November.» E: «annual HICP inflation is expected to remain very low or negative in the months ahead» | BCE, introductory statement, 22/01/2015 |
| «Nel 2016: tornata negativa per 3 mesi non consecutivi» | Feb (−0,1%), apr (−0,3%), mag (−0,1%) 2016; marzo e giugno 0,0% | Eurostat `prc_hicp_manr` |
| «Nessun anno intero con prezzi in calo» | Medie annue 2014-2016: +0,4%, +0,2%, +0,2% | Eurostat `prc_hicp_aind` |

**Non è deflazione nel senso della definizione BCE** («falls over an extended period»): sono pochi mesi, dovuti in gran parte al petrolio. Nel comunicato del 22/01/2015 la BCE usa «very low or negative» e il termine «deflation» non compare nel testo letto. La causa energetica del calo (petrolio) è una lettura corrente ma **non verificata** in questa ricerca. Confronto con il Giappone: area euro 4 mesi negativi nel 2015 e 3 nel 2016 (non consecutivi); Giappone anni interi negativi.

## D. Esempi didattici inventati («cifre illustrative, non dati»)
- La scheda non contiene numeri inventati. Il visual (cartellini di vetro che scendono, carrelli fermi) è una stilizzazione: «cifre illustrative, non dati».

## Cosa NON si può dire
- «Il Giappone ha avuto deflazione ogni anno dagli anni '90»: falso (vedi 1996-1998, 2006, 2008).
- «Il Giappone ha avuto un calo dei prezzi del X% in totale» senza citare il calcolo: il −3,9% (1998-2012) è un calcolo nostro su indice OCSE, non un dato ufficiale.
- «L'area euro è stata in deflazione nel 2015»: la media annua 2015 è +0,2% e il segno negativo riguarda 4 mesi; la BCE (2/01/2015): «We are not there yet».
- Numeri sul peso dei debiti in deflazione: nessun dato verificato (solo il testo qualitativo BCE).

## Dubbi aperti
1. Serie giapponese FRED fermata al 2020 e di fonte OCSE (non direttamente Bureau statistico); il Bureau conferma solo 2008-2011 e 2015 (rapporti annuali letti). Per gli anni 1995-2003 e 2005 nessuna conferma diretta del Bureau.
2. Anni 2004, 2007, 2012: zero a un decimale; la direzione dipende dall'arrotondamento.
3. Conteggio anni negativi 1995-2016 = 11 su 22 (calcolo nostro).
4. Eurostat ha sostituito `prc_hicp_manr` con `prc_hicp_minr` (COICOP 2018): i valori 2014-2016 non sono cambiati nel file letto.
5. Causa petrolifera del calo dei prezzi 2014-15: non verificata.
