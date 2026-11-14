# Conviene? Rapporto di fattibilità e convenienza dell'arbitraggio statistico da casa

Data: 2026-11-14. Le fonti dei numeri sono in
[ricerca/dove_si_fa.md](ricerca/dove_si_fa.md),
[ricerca/dati_economici.md](ricerca/dati_economici.md),
[ricerca/mestiere.md](ricerca/mestiere.md) e
[registri/ACADEMIC_RESEARCH_DATABASE.csv](registri/ACADEMIC_RESEARCH_DATABASE.csv).
I calcoli sono in `codice/convenienza.py`.

## La risposta breve

- **Come attività per guadagnare, con un capitale da privato: no.** Prendiamo lo scenario
  realistico migliore, cioè quello che rendono i fondi professionali neutrali al mercato.
  Per mettere in tasca 1.000 € l'anno netti servono **40.000–60.000 € di capitale**.
  Nel primo anno quel guadagno paga circa 3–4 € per ogni ora di lavoro. Con 10.000 € si
  va in pari o in perdita.
- **Come ricerca a costo zero: sì, ma limitata e con una regola di stop.** Si può fare senza
  abbonamenti per un numero ristretto di test ben scelti. Se quei test non passano i
  criteri dichiarati prima, la conclusione corretta è chiudere.
- **Non servono migliaia di euro di dati per capire se c'è qualcosa.** Servono solo per
  farlo in grande, ed è proprio lì che i fondi sono imbattibili.

## 1. Dove lo fanno i fondi, e cosa è accessibile a te

| Mercato | Come lo fanno i fondi | Accessibile a un privato (IBKR) | Perché |
|---|---|---|---|
| **Futures: spread tra scadenze e tra merci** | calendar spread, crack/crush, base indice-futures | **alto** | contratti micro, margini ridotti sugli spread riconosciuti dalla borsa, meccanismo strutturale (carry, stagionalità) |
| Azioni: coppie e stat-arb fattoriale | centinaia di titoli, neutrali al mercato, alta frequenza di ribilanciamento | medio | eseguibile, ma il vantaggio dopo i costi è sottile e il prestito titoli costa |
| FX: carry e incroci | panieri di valute | medio | è un premio per il rischio, non un arbitraggio |
| Opzioni: volatilità | implicita contro realizzata, dispersione | medio | dati costosi, gestione complessa |
| Cripto: base e funding | long spot, short perpetuo | basso | **testato da noi: sotto la liquidità dal 2023** |
| ETF contro paniere | creazione e rimborso | basso | solo gli "authorized participant" possono farlo; molti ETF USA sono vietati ai retail UE |
| Reddito fisso: basis trade sui Treasury | leva enorme via repo | **no** | leva effettiva stimata dalla Fed a **56:1** (dic. 2022); un privato non ha il repo |

**Cosa insegna la storia:** chi ha avuto vantaggi enormi li ha avuti con molta leva, e
la leva ha fatto i disastri:
- LTCM nel 1998, con leva circa 30:1, ha perso il 44% in un mese;
- nell'agosto 2007 i fondi quantitativi hanno avuto il "quant quake";
- nel marzo 2020 si è smontato il basis trade sui Treasury.

## 2. Quanto rendono davvero

| Chi | Periodo | Rendimento | Nota |
|---|---|---:|---|
| HFRI Equity Market Neutral (fondi veri) | 2017–2023 | ≈ 2,9% annuo in media semplice | anni da −1% a +7% |
| HFRI Relative Value | 2018–2023 | da −0,7% a +7,6% annuo | marzo 2020: −9,8% in un mese |
| Pairs trading su azioni USA (Gatev et al.) | 1962–2002 | fino all'11% annuo in eccesso | prima del declino |
| Pairs trading, dopo i costi (Rad-Low-Faff) | 1962–2014 | 38 punti base al mese ≈ 4,6% annuo | opportunità −40% dopo il 2011 |
| Pairs trading (Do-Faff) | 2003–2009 | 0,24% al mese, lordo | quasi zero dopo i costi |
| Carry cripto (BIS) | 2018–2022 | > 10% annuo, picchi 40–60% | **noi misuriamo < liquidità dal 2023** |
| Le nostre coppie cripto | 2023–2026 | **−9,2% annuo** | |
| Il nostro carry cripto | 2023–2026 | **+2,9% annuo** (T-bill 4,5%) | |

In sintesi: **i professionisti, con dati, leva e costi da istituzione, fanno qualche punto
percentuale l'anno sopra la liquidità**. Gli articoli che promettono di più descrivono anni
lontani, prima che il vantaggio venisse consumato.

## 3. Quanto costa a te

| Budget | Cosa si può fare | Cosa no |
|---|---|---|
| **0 €** | portafogli di settore e fattori USA dal 1926 (Kenneth French, provato da qui); Tiingo gratuito con una tua chiave (500 titoli al mese, 30+ anni); 125 $ di crediti gratuiti Databento per i futures CME/Eurex; dati cripto | universo completo di azioni con i delistati, storico lungo dei futures scaduti, intraday |
| < 20 €/mese | EODHD (fine giornata) | delistati affidabili |
| ~100–300 € una tantum | FirstRate: futures dal 2008, oltre 7.000 titoli delistati | — |
| > 1.000 € | Norgate, CSI, Portara: quello che usano i professionisti piccoli | — |

Esecuzione: IBKR ha commissioni basse; i dati in tempo reale costano circa 10 $ al mese e
vengono rimborsati sopra i 30 $ di commissioni (fonte secondaria, da verificare).

## 4. Il conto economico

Ipotesi dichiarate:
- rendimento **sopra la liquidità**, dopo i costi di trading;
- tasse al 26%;
- costi fissi 360 € l'anno (dati più un server);
- **300 ore** per costruire una strategia e **6 ore al mese** per seguirla.

Guadagno netto annuo:

| Scenario (sopra la liquidità) | 10.000 € | 25.000 € | 50.000 € | 100.000 € |
|---|---:|---:|---:|---:|
| Perde (−3%), come i nostri test | −660 € | −1.110 € | −1.860 € | −3.360 € |
| Il vantaggio non c'è più (0%) | −360 € | −360 € | −360 € | −360 € |
| Come un fondo neutrale (+3%) | −138 € | +195 € | +750 € | +1.860 € |
| Come la letteratura migliore (+4,5%) | −27 € | +472 € | +1.305 € | +2.970 € |
| Eccezionale (+10%) | +380 € | +1.490 € | +3.340 € | +7.040 € |

Con dati gratuiti ed esecuzione manuale ogni riga migliora di 360 €. Non cambia la
conclusione.

**Capitale necessario per 1.000 € netti l'anno:** circa 61.000 € (come un fondo), 41.000 €
(letteratura migliore), 18.000 € (eccezionale).

Il confronto vero è con le alternative senza lavoro:
- un conto deposito o i titoli di Stato rendono la liquidità senza fare niente;
- un ETF azionario globale ha storicamente reso di più, con più rischio.

L'arbitraggio statistico ha senso solo se aggiunge rendimento **sopra** la liquidità e
**poco correlato** con la borsa. Il suo valore sta nella diversificazione, non nel
rendimento assoluto.

## 5. Quanto è affidabile il laboratorio

**Cosa è affidabile:**
- **13 test automatici su 13 passano.** Su una coppia costruita apposta con un vantaggio, il
  motore lo trova e guadagna. Su monete indipendenti non inventa niente. Cambiare i prezzi
  futuri non cambia i risultati passati, quindi non usa dati che non avrebbe avuto.
- **Revisione indipendente** del codice con un modello diverso: ha trovato un errore grave,
  che è stato corretto.
- Criteri scritti prima dei test, tutto in git, un comando rigenera ogni numero.

**Cosa non lo è ancora:**
- Le condizioni di IBKR vengono da fonti secondarie: il sito blocca l'accesso automatico.
- Sono state testate solo le cripto, con prezzi Binance e non della sede dove si
  eseguirebbe.
- Diversi punti del prompt sono fatti a metà o non fatti, per esempio il test di Johansen,
  l'hedge ratio dinamico, il Monte Carlo completo e la parte su panieri, futures e
  opzioni. L'elenco completo, voce per voce, è nell'app, sezione "Conviene?".

## 6. Raccomandazione

1. **Non trattarlo come un'attività per guadagnare** finché un test non passa i criteri
   dichiarati prima. Con meno di 40–60 mila euro di capitale, anche il successo rende poco.
2. **Se vuoi continuare, a costo zero, due soli test**, scelti per accessibilità e meccanismo:
   - **spread tra scadenze dei futures** (micro CME), con i crediti gratuiti di Databento:
     è la classe più accessibile per te e ha un motivo economico (carry, stagionalità), non
     solo statistico;
   - **coppie di settori e azioni USA**, con i dati gratuiti di Kenneth French e Tiingo:
     replica onesta della letteratura sugli ultimi anni.
3. **Regola di stop dichiarata ora:** se entrambi falliscono i criteri del protocollo,
   il laboratorio chiude con la conclusione che l'arbitraggio statistico non è accessibile
   in modo conveniente a un privato con questi mezzi. Anche questo è un risultato.
4. **Cosa serve da te per partire:** una chiave Tiingo gratuita e un account Databento
   gratuito. Le chiavi si inseriscono nelle impostazioni dell'ambiente, non in chat.
