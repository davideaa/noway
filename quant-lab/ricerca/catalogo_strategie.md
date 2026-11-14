# Catalogo di strategie sistematiche (letteratura accademica)

Aggiornato 2026-11-14. Obiettivo: trovare strategie adatte a un trader retail italiano (IBKR Irlanda o cripto spot, 10k-100k EUR, ETF UCITS, azioni, micro futures CME, cripto spot). Fonte dati: `catalogo_strategie.json`.

**Avvertenza di metodo.** Ho letto abstract e metadati (Crossref, AQR, NBER); dove un numero viene da un riassunto di ricerca lo scrivo. Nessun testo completo letto; SSRN/Elsevier bloccati e non aggirati. Punteggi = giudizi miei, 1-5, 5 meglio.

## Classifica per punteggio totale (max 30)

| Pos | ID | Strategia | Rob | Eco | Acc | Dati | Turn | Decad | Tot |
|---|---|---|---|---|---|---|---|---|---|
| 1 | S19 | Tactical asset allocation con media mobile a 10 mesi | 4 | 4 | 5 | 4 | 5 | 3 | **25** |
| 2 | S02 | Trend following secolare 1880-oggi | 5 | 4 | 4 | 3 | 4 | 4 | **24** |
| 3 | S01 | Time-series momentum su futures (trend following diversificato) | 5 | 4 | 4 | 3 | 4 | 3 | **23** |
| 4 | S20 | Dual momentum (assoluto + relativo) | 3 | 3 | 5 | 4 | 5 | 3 | **23** |
| 5 | S21 | Rotazione per forza relativa tra classi di attivo | 3 | 3 | 5 | 4 | 5 | 3 | **23** |
| 6 | S07 | Value e momentum ovunque | 5 | 4 | 3 | 4 | 3 | 3 | **22** |
| 7 | S11 | Betting against beta / low volatility | 4 | 4 | 4 | 4 | 4 | 2 | **22** |
| 8 | S12 | Quality minus junk | 4 | 3 | 4 | 4 | 4 | 3 | **22** |
| 9 | S22 | Risk parity (portafoglio equal-risk) | 4 | 4 | 4 | 3 | 4 | 3 | **22** |
| 10 | S16 | Halloween / Sell in May | 3 | 2 | 5 | 4 | 5 | 3 | **22** |
| 11 | S04 | Momentum di industria / settori | 4 | 3 | 4 | 4 | 3 | 3 | **21** |
| 12 | S08 | Carry trade su valute | 4 | 4 | 3 | 3 | 4 | 3 | **21** |
| 13 | S15 | Turn-of-the-month | 3 | 2 | 5 | 4 | 5 | 2 | **21** |
| 14 | S06 | Carry cross-asset | 4 | 4 | 3 | 2 | 4 | 3 | **20** |
| 15 | S18 | Portafogli gestiti per volatilita | 3 | 3 | 4 | 4 | 4 | 2 | **20** |
| 16 | S23 | Momentum nelle serie storiche di criptovalute | 3 | 3 | 4 | 5 | 3 | 2 | **20** |
| 17 | S25 | Trend following crypto con ensemble Donchian | 2 | 3 | 4 | 5 | 4 | 2 | **20** |
| 18 | S29 | Basis/carry delle cripto (spot vs perpetual/futures) | 3 | 4 | 2 | 5 | 3 | 2 | **19** |
| 19 | S10 | Term structure delle materie prime (roll yield / backwardation) | 4 | 4 | 2 | 2 | 3 | 3 | **18** |
| 20 | S09 | Momentum su valute | 3 | 3 | 3 | 3 | 3 | 3 | **18** |
| 21 | S17 | Pre-FOMC announcement drift | 3 | 2 | 4 | 2 | 5 | 2 | **18** |
| 22 | S24 | Fattori cross-sezionali crypto (mercato, size, momentum) | 3 | 3 | 3 | 5 | 2 | 2 | **18** |
| 23 | S03 | Momentum cross-sezionale su azioni | 5 | 3 | 2 | 3 | 2 | 2 | **17** |
| 24 | S05 | Momentum con gestione dei crash (momentum dinamico) | 3 | 3 | 2 | 3 | 2 | 3 | **16** |
| 25 | S27 | Momentum intraday su indice (prima mezz'ora -> ultima) | 3 | 3 | 3 | 2 | 2 | 2 | **15** |
| 26 | S28 | Post-earnings announcement drift (PEAD) | 4 | 3 | 2 | 2 | 2 | 1 | **14** |
| 27 | S13 | Inversione di breve periodo (short-term reversal) | 4 | 3 | 1 | 2 | 1 | 1 | **12** |
| 28 | S14 | Stagionalita dei rendimenti per titolo (stesso mese) | 3 | 2 | 2 | 2 | 1 | 2 | **12** |
| 29 | S26 | Rendimenti overnight vs intraday | 3 | 2 | 1 | 2 | 1 | 2 | **11** |

## Evidenza trasversale sul decadimento

 - McLean-Pontiff 2016: -26% fuori campione, -58% dopo la pubblicazione (lab L33).

 - Hou-Xue-Zhang 2020: 65% di 452 anomalie non passano |t|>1,96 (lab L34).

 - Jacobs-Muller 2020: fuori dagli USA il calo post-pubblicazione e per lo piu non significativo (riassunto di ricerca).

 - Novy-Marx-Velikov 2016: al netto dei costi sopravvivono soprattutto le anomalie con turnover mensile sotto il 50% (abstract NBER visto).

## Schede

### S01 - Time-series momentum su futures (trend following diversificato)

- **Famiglia:** trend following / TSMOM
- **Paper:** Moskowitz, Ooi, Pedersen 2012 (JFE) - https://doi.org/10.1016/j.jfineco.2011.11.003
- **Idea:** Si compra cio che e salito negli ultimi 12 mesi e si vende cio che e sceso, ogni strumento valutato solo sul proprio passato; posizioni pesate per volatilita.
- **Strumenti:** 58 futures/forward: indici azionari, valute, materie prime, titoli di stato
- **Ribilanciamento:** mensile (segnale 12 mesi, holding 1 mese)
- **Periodo dati:** oltre 25 anni di dati, 58 contratti (pagina AQR)
- **Risultato nel paper:** Rendimento dell'eccesso a 12 mesi predice il successivo; positivo in ogni contratto esaminato; persiste circa 1 anno poi si inverte parzialmente (pagina AQR). Sharpe non visto.
- **Dopo la pubblicazione:** Contrastante: Huang, Li, Wang, Zhou 2020 (JFE) trovano poca evidenza asset-per-asset e prestazione simile a una strategia basata sulla media storica (riassunto di ricerca): https://econpapers.repec.org/RePEc:eee:jfinec:v:135:y:2020:i:3:p:774-794 . Replica/estensione lunga: S02.
- **Perche dovrebbe persistere:** Premio per il rischio di trend + sotto-reazione/herding degli investitori e flussi di hedger; autocovarianza positiva dei rendimenti.
- **Dati gratuiti:** parziale: parziale: futures continui non gratuiti in modo affidabile (Yahoo 429, Stooq bloccato nel registro lab); proxy ETF via Tiingo free (chiave utente) o Databento crediti; FRED solo tassi
- **Eseguibile retail IT:** parziale: micro futures CME su indici (MES, MNQ), oro (MGC), petrolio (MCL), FX micro, via IBKR; ETF UCITS su indici/obbligazioni/oro; molte materie prime solo via ETC UCITS. Elenco contratti da verificare sulle specifiche CME.
- **Costi/turnover:** medio (rotazione mensile, ma 20-60 mercati: commissioni e roll futures)
- **Capitale minimo:** ? (con micro futures serve margine su piu contratti; stimare con le specifiche CME)
- **Rischio di coda:** Lunghe fasi laterali/inversioni brusche (es. rimbalzi dopo crisi); posizioni a leva implicita nei futures.
- **Fonti extra:** https://www.aqr.com/Insights/Research/Journal-Article/Time-Series-Momentum; https://econpapers.repec.org/RePEc:eee:jfinec:v:135:y:2020:i:3:p:774-794; https://doi.org/10.2139/ssrn.2140091 (Baltas-Kosowski: stimatori di volatilita e turnover)
- **Punteggi:** robustezza_evidenza 5, motivo_economico 4, accessibilita_retail 4, dati_gratuiti 3, basso_turnover 4, resistenza_alla_decadenza 3 (totale 23)
- **Giustificazione:** Evidenza: molti mercati e sub-campioni (pagina AQR) ma contestata statisticamente da Huang et al. Retail: micro futures aiutano ma diversificazione costosa. Dati: nessuna fonte gratuita pulita per i futures. Turnover: mensile. Decadimento: alcune critiche, nessuna prova di scomparsa trovata.

### S02 - Trend following secolare 1880-oggi

- **Famiglia:** trend following / TSMOM
- **Paper:** Hurst, Ooi, Pedersen 2017 (JPM) - https://doi.org/10.3905/jpm.2017.44.1.015
- **Idea:** Stessa regola di trend simulata su un secolo e oltre per vedere se i buoni risultati recenti sono un caso: la risposta e che il segnale ha funzionato in molti regimi economici.
- **Strumenti:** futures su indici, obbligazioni, valute, materie prime (dati ricostruiti dal 1880)
- **Ribilanciamento:** mensile
- **Periodo dati:** dal 1880 (pagina AQR); profittevole in modo coerente nei 110 anni successivi, e dal 1985 in 4 classi (pagina AQR)
- **Risultato nel paper:** Nessun numero di Sharpe visto sulla pagina AQR; solo la tesi di robustezza su 110 anni.
- **Dopo la pubblicazione:** Nessuna replica indipendente trovata nei risultati; l'estensione e fatta dagli stessi autori (AQR). Vedere critica di Huang et al. in S01.
- **Perche dovrebbe persistere:** Come S01: premio per il rischio + comportamento; il test secolare riduce il sospetto di fortuna.
- **Dati gratuiti:** parziale: stessi dati di S01; serie storiche lunghe non gratuite
- **Eseguibile retail IT:** parziale: come S01 (micro futures, ETF UCITS)
- **Costi/turnover:** medio
- **Capitale minimo:** ?
- **Rischio di coda:** Anni di performance negativa (es. inversioni di mercato); lunga storia non garantisce il futuro.
- **Fonti extra:** https://www.aqr.com/Insights/Research/Journal-Article/A-Century-of-Evidence-on-Trend-Following-Investing
- **Punteggi:** robustezza_evidenza 5, motivo_economico 4, accessibilita_retail 4, dati_gratuiti 3, basso_turnover 4, resistenza_alla_decadenza 4 (totale 24)
- **Giustificazione:** Storia di oltre un secolo = massima robustezza temporale. Autori di un gestore di fondi trend (conflitto di interessi possibile). Stessi limiti di accesso dati di S01.

### S03 - Momentum cross-sezionale su azioni

- **Famiglia:** momentum azionario
- **Paper:** Jegadeesh, Titman 1993 (JF) - https://doi.org/10.1111/j.1540-6261.1993.tb04702.x
- **Idea:** Si comprano le azioni migliori degli ultimi 3-12 mesi e si vendono le peggiori; si tiene per 3-12 mesi.
- **Strumenti:** azioni USA (ricerca originale)
- **Ribilanciamento:** mensile
- **Periodo dati:** non nell'abstract visto
- **Risultato nel paper:** Rendimenti positivi significativi su holding 3-12 mesi; parte dei rendimenti si dissipa nei due anni successivi (abstract Crossref).
- **Dopo la pubblicazione:** McLean-Pontiff 2016: rendimenti anomalie -26% fuori campione e -58% post-pubblicazione (da registro lab L33, https://doi.org/10.1111/jofi.12365 ). Jacobs-Muller 2020: fuori dagli USA il calo post-pubblicazione e perlopiu non significativo (riassunto di ricerca).
- **Perche dovrebbe persistere:** Sotto-reazione alle notizie, herding; premio per rischio di crash.
- **Dati gratuiti:** parziale: Kenneth French Data Library (verificato raggiungibile 2026-11-14) (portafogli, non titoli singoli); dati titoli singoli non gratuiti
- **Eseguibile retail IT:** parziale: gamba long con ETF UCITS momentum factor o azioni; la gamba short impraticabile per retail senza costi di prestito
- **Costi/turnover:** alto (rotazione mensile, small cap)
- **Capitale minimo:** ?
- **Rischio di coda:** Momentum crashes dopo crisi e rimbalzi (2009).
- **Fonti extra:** https://doi.org/10.3386/w20439
- **Punteggi:** robustezza_evidenza 5, motivo_economico 3, accessibilita_retail 2, dati_gratuiti 3, basso_turnover 2, resistenza_alla_decadenza 2 (totale 17)
- **Giustificazione:** Evidenza fortissima ma decadimento USA documentato e short leg non realistica; turnover alto.

### S04 - Momentum di industria / settori

- **Famiglia:** momentum azionario
- **Paper:** Moskowitz, Grinblatt 1999 (JF) - https://doi.org/10.1111/0022-1082.00146
- **Idea:** Si comprano i settori che hanno battuto gli altri negli ultimi mesi e si vendono (o si evitano) i perdenti; gran parte del momentum dei titoli viene dal settore.
- **Strumenti:** portafogli settoriali azionari USA
- **Ribilanciamento:** mensile
- **Periodo dati:** non nell'abstract visto
- **Risultato nel paper:** Momentum di industria molto profittevole anche controllando per dimensione, value, momento dei titoli (abstract Crossref); nessun numero visto.
- **Dopo la pubblicazione:** non trovata
- **Perche dovrebbe persistere:** Diffusione lenta dell'informazione tra settori; flussi sui settori.
- **Dati gratuiti:** si: Kenneth French Data Library (verificato raggiungibile 2026-11-14) (portafogli per 10/30/49 industrie, mensili/giornalieri dal 1926)
- **Eseguibile retail IT:** si: ETF UCITS settoriali (es. settori STOXX Europe 600 / MSCI World) via IBKR; i ticker vanno verificati
- **Costi/turnover:** medio (mensile, pochi ETF)
- **Capitale minimo:** ? (basta qualche migliaio di euro per ETF)
- **Rischio di coda:** Momentum crash; concentrazione su pochi settori.
- **Fonti extra:** https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html
- **Punteggi:** robustezza_evidenza 4, motivo_economico 3, accessibilita_retail 4, dati_gratuiti 4, basso_turnover 3, resistenza_alla_decadenza 3 (totale 21)
- **Giustificazione:** Un paper storico, effetto confermato in letteratura ma qui non ho visto repliche post-2000. Facile da replicare con dati French.

### S05 - Momentum con gestione dei crash (momentum dinamico)

- **Famiglia:** momentum azionario
- **Paper:** Daniel, Moskowitz 2016 (JFE; NBER w20439) - https://doi.org/10.3386/w20439
- **Idea:** Si riduce o annulla l'esposizione al momentum quando il mercato e sceso molto e la volatilita e alta (stati di panico).
- **Strumenti:** azioni USA, anche internazionali e altre classi
- **Ribilanciamento:** mensile
- **Periodo dati:** periodi multipli (testo: robusto su piu periodi, mercati internazionali, altre classi)
- **Risultato nel paper:** La strategia dinamica implementabile circa raddoppia alpha e Sharpe del momentum statico (abstract NBER visto, nessun numero assoluto).
- **Dopo la pubblicazione:** non trovata (nessuna replica specifica vista)
- **Perche dovrebbe persistere:** I crash del momentum sono prevedibili in parte: premio sulle opzioni implicite dei perdenti.
- **Dati gratuiti:** parziale: Kenneth French Data Library (verificato raggiungibile 2026-11-14) (fattore momentum e mercato)
- **Eseguibile retail IT:** parziale: solo la logica di riduzione del rischio applicabile a ETF momentum UCITS
- **Costi/turnover:** medio
- **Capitale minimo:** ?
- **Rischio di coda:** Il crash che motiva la strategia (2009) e in campione.
- **Fonti extra:** https://www.nber.org/papers/w20439
- **Punteggi:** robustezza_evidenza 3, motivo_economico 3, accessibilita_retail 2, dati_gratuiti 3, basso_turnover 2, resistenza_alla_decadenza 3 (totale 16)
- **Giustificazione:** Un solo studio, gamba short irrealistica per retail; utile come regola di risk management.

### S06 - Carry cross-asset

- **Famiglia:** carry
- **Paper:** Koijen, Moskowitz, Pedersen, Vrugt 2018 (JFE) - https://doi.org/10.1016/j.jfineco.2017.11.002
- **Idea:** Si compra cio che rende di piu a prezzi invariati (alto rendimento, backwardation) e si vende il resto: il carry predice i rendimenti in azioni, obbligazioni, valute, materie prime, opzioni.
- **Strumenti:** futures/forward multiclasse
- **Ribilanciamento:** mensile
- **Periodo dati:** non nell'abstract visto (dati multipli)
- **Risultato nel paper:** non nell'abstract visto (registro lab L21)
- **Dopo la pubblicazione:** non trovata
- **Perche dovrebbe persistere:** Premio per rischio: peggiora in recessioni, crisi di liquidita e volatilita (registro lab).
- **Dati gratuiti:** parziale: parziale: futures continui non gratuiti in modo affidabile (Yahoo 429, Stooq bloccato nel registro lab); proxy ETF via Tiingo free (chiave utente) o Databento crediti; FRED solo tassi
- **Eseguibile retail IT:** parziale: micro futures e FX; carry azionario via dividend futures non retail
- **Costi/turnover:** medio
- **Capitale minimo:** ?
- **Rischio di coda:** Carry crash in recessioni/crisi di liquidita.
- **Fonti extra:** https://www.aqr.com/Insights/Datasets
- **Punteggi:** robustezza_evidenza 4, motivo_economico 4, accessibilita_retail 3, dati_gratuiti 2, basso_turnover 4, resistenza_alla_decadenza 3 (totale 20)
- **Giustificazione:** Evidenza ampia, replicabilita retail limitata dai dati di carry (curve futures).

### S07 - Value e momentum ovunque

- **Famiglia:** value + momentum multi-asset
- **Paper:** Asness, Moskowitz, Pedersen 2013 (JF) - https://doi.org/10.1111/jofi.12021
- **Idea:** Value e momentum funzionano in 8 mercati/classi e sono negativamente correlati: combinarli riduce il rischio.
- **Strumenti:** azioni individuali di 4 paesi/regioni, indici, valute, obbligazioni, materie prime
- **Ribilanciamento:** mensile
- **Periodo dati:** periodi lunghi (non in abstract visto)
- **Risultato nel paper:** premi consistenti di value e momentum in ogni classe, correlazione negativa tra i due (registro lab L24)
- **Dopo la pubblicazione:** Dati AQR aggiornati disponibili; non ho una replica separata. Replicazione fattori: Chen-Zimmermann 2022 (https://doi.org/10.1561/104.00000112 ).
- **Perche dovrebbe persistere:** Premio per rischio (value) + comportamento (momentum); correlazione negativa -> diversificazione.
- **Dati gratuiti:** si: AQR Data Sets, file xlsx scaricabili (verificato raggiungibile 2026-11-14) ('Value and Momentum Everywhere: Factors, Monthly')
- **Eseguibile retail IT:** parziale: via ETF UCITS value e momentum factor (esistono prodotti UCITS; ticker non verificati) o micro futures per la parte indici
- **Costi/turnover:** medio
- **Capitale minimo:** ?
- **Rischio di coda:** Momentum crash e lunghi periodi bui del value (2010-2020 per il value, non verificato qui).
- **Fonti extra:** https://www.aqr.com/Insights/Datasets/Value-and-Momentum-Everywhere-Factors-Monthly
- **Punteggi:** robustezza_evidenza 5, motivo_economico 4, accessibilita_retail 3, dati_gratuiti 4, basso_turnover 3, resistenza_alla_decadenza 3 (totale 22)
- **Giustificazione:** Evidenza multi-asset molto ampia e dati gratuiti AQR scaricabili; implementazione retail solo parziale.

### S08 - Carry trade su valute

- **Famiglia:** carry FX
- **Paper:** Lustig, Roussanov, Verdelhan 2011 (RFS); Menkhoff et al. 2012 (JF) - https://doi.org/10.1111/j.1540-6261.2012.01728.x
- **Idea:** Si prende a prestito nelle valute con tassi bassi e si investe in quelle con tassi alti; i tassi differenziali eccedono la perdita di cambio in media.
- **Strumenti:** coppie FX G10 / forward
- **Ribilanciamento:** mensile
- **Periodo dati:** 1983-2007 (L36, registro lab)
- **Risultato nel paper:** spread >5 punti percentuali l'anno tra portafogli estremi, 1983-2007 al netto dei bid-ask (L36 abstract); alto rendimento correlato negativamente a volatilita FX globale (Menkhoff, abstract Crossref).
- **Dopo la pubblicazione:** non trovata (Burnside et al. 2011 attribuiscono i rendimenti a rischio di peso (peso problem): https://doi.org/10.1093/rfs/hhq138 )
- **Perche dovrebbe persistere:** Premio per rischio di volatilita globale e crash.
- **Dati gratuiti:** parziale: BCE tassi di riferimento, FRED tassi, ECB FX (registro lab); tassi a breve da FRED
- **Eseguibile retail IT:** parziale: IBKR FX spot / micro futures FX CME; costi di swap e leva
- **Costi/turnover:** medio
- **Capitale minimo:** ?
- **Rischio di coda:** Carry crash (agosto 2007/2008) con unwinding.
- **Fonti extra:** https://doi.org/10.2139/ssrn.1100184
- **Punteggi:** robustezza_evidenza 4, motivo_economico 4, accessibilita_retail 3, dati_gratuiti 3, basso_turnover 4, resistenza_alla_decadenza 3 (totale 21)
- **Giustificazione:** Evidenza lunga, premio ben compreso; crash risk pesa.

### S09 - Momentum su valute

- **Famiglia:** momentum FX
- **Paper:** Menkhoff, Sarno, Schmeling, Schrimpf 2012 (JFE) - https://doi.org/10.2139/ssrn.1971680
- **Idea:** Si comprano le valute che hanno guadagnato di piu negli ultimi 1-12 mesi e si vendono le peggiori.
- **Strumenti:** valute spot/forward
- **Ribilanciamento:** mensile
- **Periodo dati:** non visto
- **Risultato nel paper:** spread fino al 10% annuo tra vincitori e perdenti, parzialmente spiegato dai costi (registro lab L37)
- **Dopo la pubblicazione:** Neely, Weller, Ulrich 2009 (adaptive markets): regole tecniche su FX in declino (https://doi.org/10.1017/s0022109009090103 , registro lab L35)
- **Perche dovrebbe persistere:** Comportamento + lenta diffusione di informazione; costi elevati.
- **Dati gratuiti:** parziale: ECB FX 1999+ (fixing, non negoziabile)
- **Eseguibile retail IT:** parziale: IBKR FX; costi di spread significativi
- **Costi/turnover:** medio-alto
- **Capitale minimo:** ?
- **Rischio di coda:** Inversioni brusche.
- **Fonti extra:** https://doi.org/10.2139/ssrn.1971680
- **Punteggi:** robustezza_evidenza 3, motivo_economico 3, accessibilita_retail 3, dati_gratuiti 3, basso_turnover 3, resistenza_alla_decadenza 3 (totale 18)
- **Giustificazione:** Evidenza buona ma fortemente legata ai costi.

### S10 - Term structure delle materie prime (roll yield / backwardation)

- **Famiglia:** carry materie prime
- **Paper:** Gorton, Hayashi, Rouwenhorst 2012 (RoF); Gorton-Rouwenhorst 2006 (FAJ) - https://doi.org/10.1093/rfs/rfs019
- **Idea:** Le materie prime con curva in backwardation (inventari bassi) rendono di piu di quelle in contango; si compra l'alto roll yield.
- **Strumenti:** futures su energia, metalli, agricoli
- **Ribilanciamento:** mensile
- **Periodo dati:** non nell'abstract visto
- **Risultato nel paper:** premi variano con gli inventari; basis e rendimenti passati informativi (registro lab L22)
- **Dopo la pubblicazione:** Szymanowska et al. 2014 (https://doi.org/10.1111/jofi.12096 ) scompongono premi di rischio nelle materie prime; replica specifica post-pubblicazione non trovata.
- **Perche dovrebbe persistere:** Premio di copertura per hedger e rischio di inventario.
- **Dati gratuiti:** parziale: parziale: futures continui non gratuiti in modo affidabile (Yahoo 429, Stooq bloccato nel registro lab); proxy ETF via Tiingo free (chiave utente) o Databento crediti; FRED solo tassi
- **Eseguibile retail IT:** parziale: pochi micro futures su materie prime (es. MGC oro, MCL petrolio); resto via ETC UCITS (costi e roll nascosti)
- **Costi/turnover:** medio
- **Capitale minimo:** ?
- **Rischio di coda:** Roll e contango estremo (es. petrolio 2020).
- **Fonti extra:** https://doi.org/10.2469/faj.v62.n2.4083
- **Punteggi:** robustezza_evidenza 4, motivo_economico 4, accessibilita_retail 2, dati_gratuiti 2, basso_turnover 3, resistenza_alla_decadenza 3 (totale 18)
- **Giustificazione:** Evidenza solida, ma strumenti retail limitati e dati non gratuiti.

### S11 - Betting against beta / low volatility

- **Famiglia:** low-vol / BAB
- **Paper:** Frazzini, Pedersen 2014 (JFE; NBER w16601) - https://doi.org/10.1016/j.jfineco.2013.10.005
- **Idea:** Le azioni ad alto beta rendono meno di quanto previsto dal CAPM perche investitori con vincoli di leva le preferiscono; si compra basso beta con leva.
- **Strumenti:** azioni (20 paesi), obbligazioni, futures
- **Ribilanciamento:** mensile
- **Periodo dati:** 20 mercati azionari, Treasury, corporate, futures (abstract NBER)
- **Risultato nel paper:** BAB produce rendimenti aggiustati per il rischio significativi in ogni classe; numeri non visti
- **Dopo la pubblicazione:** Novy-Marx, Velikov 2022 (JFE): al netto dei costi il rendimento BAB scende di oltre il 55% e resta ~48 bps/mese (riassunto di ricerca); i rendimenti derivano in parte da tilt su profittabilita e investimento: https://doi.org/10.1016/j.jfineco.2021.05.023
- **Perche dovrebbe persistere:** Vincoli di leva degli investitori -> domanda eccessiva per titoli ad alto beta.
- **Dati gratuiti:** si: AQR Data Sets, file xlsx scaricabili (verificato raggiungibile 2026-11-14) (BAB daily/monthly) + Kenneth French Data Library (verificato raggiungibile 2026-11-14)
- **Eseguibile retail IT:** parziale: ETF UCITS min-volatility (parziale: non e BAB leveraged); micro futures per replicare beta-neutro e troppo complesso
- **Costi/turnover:** medio
- **Capitale minimo:** ?
- **Rischio di coda:** Crash in stretta di liquidita e rotazioni verso high-beta (2020 - non verificato).
- **Fonti extra:** https://www.nber.org/papers/w16601; https://www.aqr.com/Insights/Datasets/Betting-Against-Beta-Equity-Factors-Monthly
- **Punteggi:** robustezza_evidenza 4, motivo_economico 4, accessibilita_retail 4, dati_gratuiti 4, basso_turnover 4, resistenza_alla_decadenza 2 (totale 22)
- **Giustificazione:** Dati AQR gratuiti. Decadimento e costi ridimensionano il BAB originale, mentre l'ETF min-vol semplice resta accessibile.

### S12 - Quality minus junk

- **Famiglia:** qualita
- **Paper:** Asness, Frazzini, Pedersen 2019 (Review of Accounting Studies) - https://doi.org/10.1007/s11142-018-9470-2
- **Idea:** Le societa redditizie, in crescita, sicure e con buoni payout rendono piu delle altre, e il mercato le sottopaga.
- **Strumenti:** azioni (USA e globale)
- **Ribilanciamento:** mensile
- **Periodo dati:** non in abstract visto
- **Risultato nel paper:** non nell'abstract visto
- **Dopo la pubblicazione:** Replica/riserva: Hou-Xue-Zhang 2020 (https://doi.org/10.1093/rfs/hhy131 ) mostrano che molte anomalie fallano con soglie piu severe; Chen-Zimmermann replicano su dati aperti.
- **Perche dovrebbe persistere:** Premio per rischio/comportamento: investitori pagano troppo per titoli 'lotteria'.
- **Dati gratuiti:** si: AQR Data Sets, file xlsx scaricabili (verificato raggiungibile 2026-11-14) (QMJ daily/monthly)
- **Eseguibile retail IT:** si: ETF UCITS quality factor (es. famiglie iShares/Xtrackers; ticker da verificare)
- **Costi/turnover:** basso-medio
- **Capitale minimo:** ? (qualche migliaio di euro per ETF)
- **Rischio di coda:** Underperformance nei rimbalzi junk (non verificato qui).
- **Fonti extra:** https://www.aqr.com/Insights/Datasets/Quality-Minus-Junk-Factors-Monthly
- **Punteggi:** robustezza_evidenza 4, motivo_economico 3, accessibilita_retail 4, dati_gratuiti 4, basso_turnover 4, resistenza_alla_decadenza 3 (totale 22)
- **Giustificazione:** Dati AQR gratuiti, strumenti UCITS esistenti; evidenza buona ma non senza contestazioni su definizione di qualita.

### S13 - Inversione di breve periodo (short-term reversal)

- **Famiglia:** reversal
- **Paper:** Jegadeesh 1990 (JF) - https://doi.org/10.1111/j.1540-6261.1990.tb05110.x
- **Idea:** I titoli saliti troppo nell'ultimo mese tendono a ritracciare e viceversa; si compra il perdente del mese.
- **Strumenti:** azioni USA
- **Ribilanciamento:** settimanale/mensile
- **Periodo dati:** 1934-1987 (abstract)
- **Risultato nel paper:** differenza tra decili estremi 2,49% al mese (abstract Crossref)
- **Dopo la pubblicazione:** Nagel 2012: i profitti riflettono compenso per la liquidita (evaporating liquidity): https://doi.org/10.1093/rfs/hhs066 ; Do-Faff 2012 (lab L03): reversal in gran parte non redditizio dopo il 2002.
- **Perche dovrebbe persistere:** Compenso per fornire liquidita; deve scomparire coi costi di trading.
- **Dati gratuiti:** parziale: dati titoli non gratuiti
- **Eseguibile retail IT:** no: turnover altissimo, short
- **Costi/turnover:** alto
- **Capitale minimo:** ?
- **Rischio di coda:** Grandi perdite in crisi di liquidita.
- **Fonti extra:** https://doi.org/10.1093/rfs/hhs066
- **Punteggi:** robustezza_evidenza 4, motivo_economico 3, accessibilita_retail 1, dati_gratuiti 2, basso_turnover 1, resistenza_alla_decadenza 1 (totale 12)
- **Giustificazione:** Evidenza storica forte, ma costi e decadimento la rendono inadatta al retail.

### S14 - Stagionalita dei rendimenti per titolo (stesso mese)

- **Famiglia:** stagionalita
- **Paper:** Heston, Sadka 2008 (JFE) - https://doi.org/10.1016/j.jfineco.2007.02.003
- **Idea:** I titoli con rendimento alto in un dato mese tendono a rendere ancora nello stesso mese negli anni successivi (ritardi 12, 24, ... mesi).
- **Strumenti:** azioni NYSE/AMEX
- **Ribilanciamento:** mensile
- **Periodo dati:** 1963-2002 (riassunto di ricerca)
- **Risultato nel paper:** pattern significativo fino a circa 20 anni di lag; numeri non visti
- **Dopo la pubblicazione:** Heston-Sadka 2010 estendono a Canada, Giappone, 12 paesi europei (JFQA 2010, riassunto di ricerca: https://ideas.repec.org/a/cup/jfinqa/v45y2010i05p1133-1160_00.html)
- **Perche dovrebbe persistere:** Ragioni non chiare (flussi stagionali, comportamento).
- **Dati gratuiti:** no: serve CRSP
- **Eseguibile retail IT:** no: portafogli con centinaia di titoli e turnover alto
- **Costi/turnover:** alto
- **Capitale minimo:** ?
- **Rischio di coda:** Strategia long/short con rischio idiosincratico.
- **Fonti extra:** https://www.econbiz.de/Record/seasonality-in-the-cross-section-of-stock-returns-the-international-evidence/10008764192
- **Punteggi:** robustezza_evidenza 3, motivo_economico 2, accessibilita_retail 2, dati_gratuiti 2, basso_turnover 1, resistenza_alla_decadenza 2 (totale 12)
- **Giustificazione:** Interessante ma poco implementabile e con spiegazione economica debole.

### S15 - Turn-of-the-month

- **Famiglia:** stagionalita calendario
- **Paper:** McConnell, Xu 2008 (FAJ) - https://doi.org/10.2469/faj.v64.n2.11
- **Idea:** Si e investiti nell'indice azionario solo dall'ultimo giorno di borsa del mese ai primi tre del successivo; il resto del mese si sta in liquidita.
- **Strumenti:** indici azionari (US e altri)
- **Ribilanciamento:** mensile (solo 4 giorni)
- **Periodo dati:** CRSP 1926-2005
- **Risultato nel paper:** rendimento medio giornaliero 0,15% (value-weighted) / 0,22% (equal-weighted) nei 4 giorni (riassunto di ricerca); l'effetto presente in 30 di 34 altri paesi (riassunto secondario)
- **Dopo la pubblicazione:** non trovata
- **Perche dovrebbe persistere:** Probabili flussi di fine mese (stipendi, pensioni), ma gli autori lo definiscono un enigma.
- **Dati gratuiti:** si: Kenneth French Data Library (verificato raggiungibile 2026-11-14) (fattore Mkt-RF giornaliero dal 1926); FRED SP500 10 anni
- **Eseguibile retail IT:** si: ETF UCITS su indici o MES (micro e-mini S&P 500)
- **Costi/turnover:** basso (circa 12 giri di entrata/uscita l'anno)
- **Capitale minimo:** ? (anche poche migliaia di euro con ETF)
- **Rischio di coda:** Si resta fuori mercato i giorni restanti: rischio di perdere i rally; effetto debole e piccolo rispetto ai costi.
- **Fonti extra:** https://quantpedia.com/strategies/turn-of-the-month-in-equity-indexes
- **Punteggi:** robustezza_evidenza 3, motivo_economico 2, accessibilita_retail 5, dati_gratuiti 4, basso_turnover 5, resistenza_alla_decadenza 2 (totale 21)
- **Giustificazione:** Molti paesi, ma motivo economico debole e potenziale decadimento non testato qui; accesso e dati ottimi.

### S16 - Halloween / Sell in May

- **Famiglia:** stagionalita calendario
- **Paper:** Bouman, Jacobsen 2002 (AER) - https://doi.org/10.1257/000282802762024683
- **Idea:** I rendimenti azionari da novembre ad aprile sono piu alti di quelli da maggio a ottobre; si sta investiti solo nel semestre forte.
- **Strumenti:** indici azionari (37 paesi)
- **Ribilanciamento:** semestrale
- **Periodo dati:** 1970-agosto 1998, 37 paesi (riassunto secondario)
- **Risultato nel paper:** effetto in 36 dei 37 paesi, significativo in 20 (riassunti di ricerca)
- **Dopo la pubblicazione:** Jacobsen-Zhang (SSRN, https://doi.org/10.2139/ssrn.2154873 ): effetto presente nel periodo fuori campione 1998-2011 in tutti i 37 paesi (riassunto di ricerca).
- **Perche dovrebbe persistere:** Ipotesi di stagionalita delle vacanze/liquidita; spiegazione non definitiva.
- **Dati gratuiti:** si: Kenneth French Data Library (verificato raggiungibile 2026-11-14) (mercato mensile dal 1926) ; FRED
- **Eseguibile retail IT:** si: ETF UCITS / MES, 2 operazioni l'anno
- **Costi/turnover:** basso
- **Capitale minimo:** ? (poche migliaia di euro)
- **Rischio di coda:** Mesi estivi in cui si e fuori: costo opportunita; effetto non stabile in ogni anno.
- **Fonti extra:** https://www.tias.edu/docs/default-source/Kennisartikelen/ssrn-id76248.pdf?sfvrsn=2
- **Punteggi:** robustezza_evidenza 3, motivo_economico 2, accessibilita_retail 5, dati_gratuiti 4, basso_turnover 5, resistenza_alla_decadenza 3 (totale 22)
- **Giustificazione:** Ha un test fuori campione (Jacobsen-Zhang) ma spiegazione debole. Facilissima da implementare e testare con dati French.

### S17 - Pre-FOMC announcement drift

- **Famiglia:** evento macro
- **Paper:** Lucca, Moench 2015 (JF) - https://doi.org/10.1111/jofi.12196
- **Idea:** I rendimenti azionari nelle 24 ore prima delle riunioni FOMC programmate sono anomali; si e investiti solo in quelle finestre.
- **Strumenti:** indice S&P 500 / futures
- **Ribilanciamento:** 8 volte l'anno
- **Periodo dati:** campione di 17 anni (riassunto di ricerca); nessun effetto pre-1980
- **Risultato nel paper:** oltre l'80% del premio azionario nell'arco di 17 anni; media 49 bp sull'indice (altra fonte) o 20 bp in una versione del paper; cifre diverse per versione (riassunti di ricerca)
- **Dopo la pubblicazione:** non trovata (Hu-Pan-Wang-Zhu citato in un riassunto di ricerca, ma non aperto)
- **Perche dovrebbe persistere:** Riduzione dell'incertezza macro: premio per rischio; mercato anticipa il taglio dei tassi.
- **Dati gratuiti:** parziale: calendario FOMC pubblico; prezzi intraday non gratuiti (Databento/Tiingo)
- **Eseguibile retail IT:** si: MES (micro S&P 500) via IBKR; trading intraday
- **Costi/turnover:** basso (8 trade/anno)
- **Capitale minimo:** ? (poche migliaia di euro margine MES)
- **Rischio di coda:** Pochi trade: grande varianza campionaria; effetto potrebbe essere stato arbitraggiato.
- **Fonti extra:** https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr512.pdf
- **Punteggi:** robustezza_evidenza 3, motivo_economico 2, accessibilita_retail 4, dati_gratuiti 2, basso_turnover 5, resistenza_alla_decadenza 2 (totale 18)
- **Giustificazione:** Evidenza specifica e statisticamente fragile (pochi eventi); dati intraday non gratuiti.

### S18 - Portafogli gestiti per volatilita

- **Famiglia:** risk management
- **Paper:** Moreira, Muir 2017 (JF) - https://doi.org/10.1111/jofi.12513
- **Idea:** Si riduce l'esposizione quando la volatilita recente e alta e la si aumenta quando e bassa; il rendimento atteso non scende in proporzione, quindi sale lo Sharpe.
- **Strumenti:** mercato azionario e fattori (value, momentum, ecc.), carry FX
- **Ribilanciamento:** mensile
- **Periodo dati:** non nell'abstract visto
- **Risultato nel paper:** alpha elevato e Sharpe piu alto per mercato e altri fattori (abstract Crossref); nessun numero
- **Dopo la pubblicazione:** Cederburg, O'Doherty, Wang, Yan 2020 (JFE): su 103 strategie, versioni fuori campione hanno di solito Sharpe/utilita inferiori ai portafogli non gestiti (riassunto di ricerca; JFE 138:95-117): https://doi.org/10.1016/j.jfineco.2020.04.015
- **Perche dovrebbe persistere:** Cambi di volatilita non compensati da cambi di rendimento atteso.
- **Dati gratuiti:** si: Kenneth French Data Library (verificato raggiungibile 2026-11-14) (fattori giornalieri per volatilita realizzata)
- **Eseguibile retail IT:** si: ETF UCITS + liquidita (ribilanciamento mensile)
- **Costi/turnover:** basso-medio
- **Capitale minimo:** ? (poche migliaia di euro)
- **Rischio di coda:** In recessioni rimbalzi rapidi dopo alta volatilita possono essere persi.
- **Fonti extra:** https://www.nber.org/papers/w22208
- **Punteggi:** robustezza_evidenza 3, motivo_economico 3, accessibilita_retail 4, dati_gratuiti 4, basso_turnover 4, resistenza_alla_decadenza 2 (totale 20)
- **Giustificazione:** Evidenza ampia ma l'implementabilita in tempo reale e contestata (Cederburg); la regola e comunque comoda e a basso costo.

### S19 - Tactical asset allocation con media mobile a 10 mesi

- **Famiglia:** TAA / trend multi-asset
- **Paper:** Faber 2007 (Journal of Wealth Management) - https://doi.org/10.3905/jwm.2007.674809
- **Idea:** Per ogni classe di attivo (azioni USA, estere, obbligazioni, immobiliare, materie prime) si e investiti solo se il prezzo a fine mese e sopra la media mobile a 10 mesi; altrimenti liquidita.
- **Strumenti:** 5 indici/classi di attivo (equities, esteri, bond, REIT, commodities)
- **Ribilanciamento:** mensile
- **Periodo dati:** 1900 su azioni USA; dal 1973 per le altre classi (riassunto di ricerca)
- **Risultato nel paper:** aggiornamento 2018 (JPM): fuori campione 11 anni dopo, risultati simili con 6, 8, 12 mesi; Sharpe da 0,45 a 0,80 citato in un articolo di Swedroe, versione non confermata (riassunto di ricerca)
- **Dopo la pubblicazione:** Aggiornamento dell'autore 'Revisited 10 Years Later' (JPM 2018, riassunto di ricerca: https://www.etf.com/sections/index-investor-corner/swedroe-why-financial-trends-persist ); analisi 2006-2025 di Concretum: rendimenti inferiori all'in-sample come atteso (https://concretumgroup.substack.com/p/global-tactical-asset-allocation).
- **Perche dovrebbe persistere:** Trend = sotto-reazione e flussi; evita i grandi ribassi.
- **Dati gratuiti:** parziale: serie ETF/indici gratuite via Tiingo free (chiave utente); FRED solo SP500 ultimi 10 anni; indici lunghi non gratuiti
- **Eseguibile retail IT:** si: ETF UCITS su azioni mondo, obbligazioni, REIT, oro/materie prime via IBKR Ireland
- **Costi/turnover:** basso (12 controlli l'anno, poche rotazioni)
- **Capitale minimo:** ? (poche migliaia di euro; con 10k-100k fattibile con 5 ETF)
- **Rischio di coda:** Whipsaw in mercati laterali; ritardo nelle uscite (es. 2020); scelta del segnale a 10 mesi non ottimizzata per ogni periodo.
- **Fonti extra:** https://doi.org/10.2139/ssrn.1941995 (revisione di terzi); https://quantpedia.com/strategies/asset-class-trend-following
- **Punteggi:** robustezza_evidenza 4, motivo_economico 4, accessibilita_retail 5, dati_gratuiti 4, basso_turnover 5, resistenza_alla_decadenza 3 (totale 25)
- **Giustificazione:** Semplicissima, ETF UCITS, mensile; evidenza lunga con update fuori campione dell'autore. Dati lunghi non gratuiti.

### S20 - Dual momentum (assoluto + relativo)

- **Famiglia:** TAA / momentum multi-asset
- **Paper:** Antonacci 2012 (SSRN) - https://doi.org/10.2139/ssrn.2042750
- **Idea:** Si sceglie l'asset class migliore per momentum relativo (es. azioni USA vs estere) e si va in obbligazioni/liquidita se il momentum assoluto e negativo.
- **Strumenti:** indici azionari + obbligazioni
- **Ribilanciamento:** mensile
- **Periodo dati:** non visto
- **Risultato nel paper:** abstract: il momentum assoluto riduce volatilita e drawdown, la combinazione assoluto+relativo da i migliori risultati (abstract Crossref)
- **Dopo la pubblicazione:** non trovata (nessuna replica indipendente vista)
- **Perche dovrebbe persistere:** Come S19 + S03: sotto-reazione e premio per rischio.
- **Dati gratuiti:** parziale: come S19
- **Eseguibile retail IT:** si: ETF UCITS equity/bond via IBKR Ireland
- **Costi/turnover:** basso
- **Capitale minimo:** ? (poche migliaia di euro)
- **Rischio di coda:** Whipsaw; pochi segnali -> bassa potenza statistica.
- **Fonti extra:** https://doi.org/10.2139/ssrn.2042750
- **Punteggi:** robustezza_evidenza 3, motivo_economico 3, accessibilita_retail 5, dati_gratuiti 4, basso_turnover 5, resistenza_alla_decadenza 3 (totale 23)
- **Giustificazione:** Idea sensata ma autore singolo, evidenza meno sottoposta a peer review.

### S21 - Rotazione per forza relativa tra classi di attivo

- **Famiglia:** TAA / momentum multi-asset
- **Paper:** Faber 2010 (SSRN) - https://doi.org/10.2139/ssrn.1585517
- **Idea:** Si compra ogni mese la meta o un terzo migliore delle classi di attivo per rendimento recente e si evita il resto.
- **Strumenti:** classi di attivo (azioni, bond, REIT, materie prime)
- **Ribilanciamento:** mensile
- **Periodo dati:** non visto
- **Risultato nel paper:** non visto (solo titolo e DOI)
- **Dopo la pubblicazione:** non trovata
- **Perche dovrebbe persistere:** Momentum e trend.
- **Dati gratuiti:** parziale: come S19
- **Eseguibile retail IT:** si: ETF UCITS
- **Costi/turnover:** basso
- **Capitale minimo:** ? (poche migliaia di euro)
- **Rischio di coda:** Whipsaw; correlazione alta tra classi in crisi.
- **Fonti extra:** https://doi.org/10.2139/ssrn.1585517
- **Punteggi:** robustezza_evidenza 3, motivo_economico 3, accessibilita_retail 5, dati_gratuiti 4, basso_turnover 5, resistenza_alla_decadenza 3 (totale 23)
- **Giustificazione:** Paper pratico, non peer-reviewed; abstract non visto in dettaglio: punteggio prudente.

### S22 - Risk parity (portafoglio equal-risk)

- **Famiglia:** allocazione
- **Paper:** Asness, Frazzini, Pedersen 2012 (FAJ) - https://doi.org/10.2469/faj.v68.n1.1
- **Idea:** Si pesano le classi di attivo in modo che ognuna contribuisca lo stesso rischio (molto piu obbligazioni che azioni) e si lega con leva per arrivare al rendimento desiderato.
- **Strumenti:** azioni, obbligazioni, materie prime (leva)
- **Ribilanciamento:** mensile/trimestrale
- **Periodo dati:** evidenza dal 1926 (pagina AQR)
- **Risultato nel paper:** i portafogli risk parity hanno battuto i tradizionali (60/40) dal 1926; oltre 80 anni di evidenza USA (pagina AQR)
- **Dopo la pubblicazione:** non trovata (periodo 2022 con bond/azioni correlati rappresenta stress, non verificato)
- **Perche dovrebbe persistere:** Vincoli di leva degli investitori -> sovrapprezzo per attivi rischiosi.
- **Dati gratuiti:** parziale: FRED tassi; serie ETF via Tiingo
- **Eseguibile retail IT:** parziale: ETF UCITS bond/azioni con leva limitata o futures micro; leva su IBKR a costi di finanziamento
- **Costi/turnover:** basso
- **Capitale minimo:** ? (da 10k con 3-4 ETF)
- **Rischio di coda:** Correlazione bond-azioni positiva (inflazione) + leva.
- **Fonti extra:** https://www.aqr.com/Insights/Research/Journal-Article/Leverage-Aversion-and-Risk-Parity
- **Punteggi:** robustezza_evidenza 4, motivo_economico 4, accessibilita_retail 4, dati_gratuiti 3, basso_turnover 4, resistenza_alla_decadenza 3 (totale 22)
- **Giustificazione:** Evidenza lunga (autore AQR); rischio di tasso e leva; dati lunghi non completamente gratuiti.

### S23 - Momentum nelle serie storiche di criptovalute

- **Famiglia:** crypto momentum
- **Paper:** Liu, Tsyvinski 2021 (RFS; NBER w24877) - https://doi.org/10.1093/rfs/hhaa113
- **Idea:** I rendimenti passati di bitcoin e altre cripto predicono quelli futuri a frequenze giornaliere/settimanali; l'attenzione degli investitori prevede i rendimenti.
- **Strumenti:** BTC, ETH, XRP (originale)
- **Ribilanciamento:** giornaliera/settimanale
- **Periodo dati:** fino al 2018 (NBER w24877)
- **Risultato nel paper:** forte effetto di momentum TS e attenzione che prevede i rendimenti (abstract NBER); nessun numero visto
- **Dopo la pubblicazione:** Nessun test post-pubblicazione trovato con campione 2023-2026; l'effetto sembra concentrato nelle cripto a grande capitalizzazione e nei campioni piu vecchi (riassunto cxoadvisory: https://www.cxoadvisory.com/currency-trading/crypto-asset-risks-and-returns/).
- **Perche dovrebbe persistere:** Mercato immaturo, partecipazione retail e attenzione; premio per rischio di rete incerto.
- **Dati gratuiti:** si: Binance public data data.binance.vision (verificato raggiungibile; gia in DATA_SOURCE_REGISTRY)
- **Eseguibile retail IT:** si: cripto spot su Kraken/OKX Europe; short/perp no (MiCA/accesso)
- **Costi/turnover:** medio-alto (giornaliero/settimanale, ma pochi asset)
- **Capitale minimo:** ? (poche migliaia di euro; spot)
- **Rischio di coda:** Crash cripto -70/80% (2018, 2022); concentrazione.
- **Fonti extra:** https://www.nber.org/papers/w24877
- **Punteggi:** robustezza_evidenza 3, motivo_economico 3, accessibilita_retail 4, dati_gratuiti 5, basso_turnover 3, resistenza_alla_decadenza 2 (totale 20)
- **Giustificazione:** Evidenza centrata su pochi anni, solo in-sample; dati Binance ottimi, ma decadimento probabile.

### S24 - Fattori cross-sezionali crypto (mercato, size, momentum)

- **Famiglia:** crypto fattori
- **Paper:** Liu, Tsyvinski, Wu 2022 (JF) - https://doi.org/10.1111/jofi.13119
- **Idea:** Tre fattori (mercato, dimensione, momentum) spiegano i rendimenti attesi cross-sezionali delle cripto; dieci caratteristiche formano strategie long-short significative.
- **Strumenti:** top cripto per capitalizzazione
- **Ribilanciamento:** settimanale/mensile
- **Periodo dati:** 2014-2018 circa (non visto)
- **Risultato nel paper:** 3 fattori catturano rendimenti cross-sezionali (abstract); numeri non visti
- **Dopo la pubblicazione:** Studio piu ampio su oltre 4.000 cripto: momentum nei grandi, reversal nei piccoli (riassunto cxoadvisory); nessun test post-2022 trovato.
- **Perche dovrebbe persistere:** Dimensione e momentum come premi di liquidita/attenzione; mercato immaturo.
- **Dati gratuiti:** si: Binance public data data.binance.vision (verificato raggiungibile; gia in DATA_SOURCE_REGISTRY)
- **Eseguibile retail IT:** parziale: solo long su cripto spot; il lato short/perp non accessibile ai retail IT
- **Costi/turnover:** alto
- **Capitale minimo:** ? (poche migliaia di euro)
- **Rischio di coda:** Crash di mercato cripto; liquidita dei piccoli token.
- **Fonti extra:** https://www.cxoadvisory.com/size-effect/cryptocurrency-factor-model
- **Punteggi:** robustezza_evidenza 3, motivo_economico 3, accessibilita_retail 3, dati_gratuiti 5, basso_turnover 2, resistenza_alla_decadenza 2 (totale 18)
- **Giustificazione:** Campione breve e mercato che cambia; short leg irrealistica; dati gratis ottimi.

### S25 - Trend following crypto con ensemble Donchian

- **Famiglia:** crypto trend following
- **Paper:** Zarattini, Pagani, Barbon 2025 (SFI Research Paper 25-80; SSRN 5209907) - https://doi.org/10.2139/ssrn.5209907
- **Idea:** Un insieme di modelli di breakout (Donchian con diverse lunghezze) su 20 cripto liquide, con volatilita-target e ribilanciamento mensile; si e long solo se il trend e positivo.
- **Strumenti:** top 20 cripto liquide, spot
- **Ribilanciamento:** mensile
- **Periodo dati:** gennaio 2015-marzo 2025 (riassunto secondario)
- **Risultato nel paper:** Sharpe superiore a 1,5 e alpha 10,8% annuo contro BTC al netto dei costi (riassunto di ricerca; versioni citate 1,57/1,58); costi testati 0,10-0,50%
- **Dopo la pubblicazione:** Nessuna replica indipendente trovata; sono autori anche di Concretum (pratica).
- **Perche dovrebbe persistere:** Trend e momentum in mercato dominato da retail.
- **Dati gratuiti:** si: Binance public data data.binance.vision (verificato raggiungibile; gia in DATA_SOURCE_REGISTRY) ; Kraken OHLC pubblico
- **Eseguibile retail IT:** si: spot su Kraken/OKX Europe
- **Costi/turnover:** medio (mensile ma 20 asset)
- **Capitale minimo:** ? (poche migliaia di euro)
- **Rischio di coda:** Drawdown cripto; il Sharpe in-sample ottimizzato su un ciclo irripetibile.
- **Fonti extra:** https://abarbon.com/papers/catching-crypto-trends; https://ideas.repec.org/p/chf/rpseri/rp2580.html
- **Punteggi:** robustezza_evidenza 2, motivo_economico 3, accessibilita_retail 4, dati_gratuiti 5, basso_turnover 4, resistenza_alla_decadenza 2 (totale 20)
- **Giustificazione:** Sharpe alto ma campione breve, parametri scelti dagli autori, nessuna replica.

### S26 - Rendimenti overnight vs intraday

- **Famiglia:** pattern intraday
- **Paper:** Lou, Polk, Skouras 2019 (JFE) - https://doi.org/10.1016/j.jfineco.2019.03.011
- **Idea:** Per molte anomalie (reversal e vari momentum) i profitti si realizzano solo di notte (o solo di giorno), con segni opposti: la 'lotta' tra clientele.
- **Strumenti:** azioni USA
- **Ribilanciamento:** giornaliera
- **Periodo dati:** 2015 WP; abstract: 14 strategie
- **Risultato nel paper:** il WP 2015 citava alpha overnight 3 fattori 0,95% e intraday 0,11% non significativo (riassunto di ricerca)
- **Dopo la pubblicazione:** non trovata
- **Perche dovrebbe persistere:** Clientele diverse e liquidita notturna.
- **Dati gratuiti:** parziale: dati titoli non gratuiti
- **Eseguibile retail IT:** no: turnover giornaliero e due ordini al giorno
- **Costi/turnover:** alto
- **Capitale minimo:** ?
- **Rischio di coda:** Costi e gap notturni.
- **Fonti extra:** https://eprints.lse.ac.uk/87481
- **Punteggi:** robustezza_evidenza 3, motivo_economico 2, accessibilita_retail 1, dati_gratuiti 2, basso_turnover 1, resistenza_alla_decadenza 2 (totale 11)
- **Giustificazione:** Utile come spiegazione, non come strategia retail.

### S27 - Momentum intraday su indice (prima mezz'ora -> ultima)

- **Famiglia:** pattern intraday
- **Paper:** Gao, Han, Li, Zhou 2018 (JFE) - https://doi.org/10.1016/j.jfineco.2018.05.009
- **Idea:** Il rendimento della prima mezz'ora (rispetto alla chiusura precedente) predice quello dell'ultima mezz'ora dell'indice; si compra/vende a fine giornata nella direzione.
- **Strumenti:** ETF S&P 500 / MES
- **Ribilanciamento:** giornaliera (ultima ora)
- **Periodo dati:** 1993-2013 (WUSTL profile abstract)
- **Risultato nel paper:** R2 predittivo 1,6% nel working paper; piu forte nei giorni con prima mezz'ora positiva (riassunti di ricerca)
- **Dopo la pubblicazione:** Studio cross-country: predittivita presente anche su mercati internazionali (riassunto di ricerca).
- **Perche dovrebbe persistere:** Rebalancing istituzionale e trader informati in ritardo.
- **Dati gratuiti:** no: intraday non gratuito (Databento crediti / Tiingo chiave utente)
- **Eseguibile retail IT:** parziale: MES via IBKR; ordini giornalieri
- **Costi/turnover:** medio-alto
- **Capitale minimo:** ? (poche migliaia di euro)
- **Rischio di coda:** Edge piccolo: i costi possono azzerarlo.
- **Fonti extra:** https://profiles.wustl.edu/en/publications/market-intraday-momentum/
- **Punteggi:** robustezza_evidenza 3, motivo_economico 3, accessibilita_retail 3, dati_gratuiti 2, basso_turnover 2, resistenza_alla_decadenza 2 (totale 15)
- **Giustificazione:** Ottimo risultato ma R2 basso, dati intraday a pagamento, decadimento non testato.

### S28 - Post-earnings announcement drift (PEAD)

- **Famiglia:** anomalia contabile
- **Paper:** Bernard, Thomas 1989 (JAR) - https://doi.org/10.2307/2491062
- **Idea:** Dopo sorprese positive sugli utili, le azioni continuano a salire nei mesi successivi (e viceversa).
- **Strumenti:** azioni USA
- **Ribilanciamento:** trimestrale
- **Periodo dati:** non visto
- **Risultato nel paper:** non visto
- **Dopo la pubblicazione:** Martineau 2022 (Critical Finance Review): il drift e sostanzialmente scomparso nei mercati moderni; riassunto: non presente nei non-microcap dal 2001 circa e nullo per large cap dal 2006 (fonte secondaria): https://doi.org/10.1561/104.00000122
- **Perche dovrebbe persistere:** Sotto-reazione agli utili; sparita con efficienza e HFT.
- **Dati gratuiti:** no: serve I/B/E/S e CRSP
- **Eseguibile retail IT:** no/parziale: azioni UE con ordini; gamba short non agibile
- **Costi/turnover:** alto
- **Capitale minimo:** ?
- **Rischio di coda:** Concentrazione in microcap illiquide.
- **Fonti extra:** https://econpapers.repec.org/RePEc:now:jnlcfr:104.00000122
- **Punteggi:** robustezza_evidenza 4, motivo_economico 3, accessibilita_retail 2, dati_gratuiti 2, basso_turnover 2, resistenza_alla_decadenza 1 (totale 14)
- **Giustificazione:** Caso scuola di anomalia pubblicata e morta: utile come monito.

### S29 - Basis/carry delle cripto (spot vs perpetual/futures)

- **Famiglia:** crypto carry
- **Paper:** Schmeling, Schrimpf, Todorov 2026 (Management Science); He, Manela, Ross, von Wachter 2022 - https://doi.org/10.1287/mnsc.2024.05069
- **Idea:** Si compra spot e si vende il perpetual: si incassa il funding positivo quando i trader a leva pagano per essere long.
- **Strumenti:** BTC/ETH spot + perp/futures
- **Ribilanciamento:** giornaliera/ settimanale
- **Periodo dati:** aprile 2019-luglio 2024 (lab L10)
- **Risultato nel paper:** carry oltre il 40% annuo (abstract MS), ma circa 7% annuo medio da un riassunto BIS (registro lab L10)
- **Dopo la pubblicazione:** Christin et al. 2022: Sharpe in-sample 7-10 ma compressione plausibile (lab L12); non trovate repliche post-2024.
- **Perche dovrebbe persistere:** Domanda di leva dei retail + limiti dell'arbitraggio (margine, controparte).
- **Dati gratuiti:** si: Binance public data data.binance.vision (verificato raggiungibile; gia in DATA_SOURCE_REGISTRY) (spot + funding)
- **Eseguibile retail IT:** no/parziale: i perpetual non sono agibili per i retail IT su venue UE; da verificare con OKX Europe/Kraken
- **Costi/turnover:** medio
- **Capitale minimo:** ?
- **Rischio di coda:** Liquidazioni, rischio exchange/controparte (FTX 2022), funding negativo.
- **Fonti extra:** https://arxiv.org/abs/2212.06888; https://www.andrew.cmu.edu/user/azj/files/CarryTrade.v1.0.pdf
- **Punteggi:** robustezza_evidenza 3, motivo_economico 4, accessibilita_retail 2, dati_gratuiti 5, basso_turnover 3, resistenza_alla_decadenza 2 (totale 19)
- **Giustificazione:** Dati gratuiti ottimi, ma accesso retail IT dubbio e rischio di controparte.
