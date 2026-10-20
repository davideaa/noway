# FINAL EDGE REPORT — fase 2 (CPI e NFP, prima M1 di XAUUSD)

## FINAL VERDICT = NO RELIABLE EDGE

Nessuna regola e nessun modello ha un'aspettativa positiva che regga fuori
campione dopo i costi.

- **CPI**: niente regge nemmeno sul periodo già esposto (2020–26).
- **NFP**: l'unica regola che batteva la ricerca massiva in scoperta (p
  0,011) è crollata nel test finale mai guardato: 11 trade, +0,02 R, 4
  vinti su 11.
- **Il sistema deve dire NO TRADE** su CPI e NFP.

Il protocollo è stato scritto e committato prima di guardare i risultati
(`200a0bf`, emendamento `9d0a778`). Il test finale NFP è stato aperto una
volta sola (`FINAL_NFP_OPENED.json`).

## Cosa è stato fatto

| | |
|---|---|
| Eventi | 448 (224 CPI, 224 NFP, 2008–2026); regime principale dal luglio 2013 |
| Trade ricostruiti | tick per tick: ingresso T−10 s all'ask o al bid, stop 0,60 × U_news eseguito sul percorso reale dei tick (salti inclusi), uscita a fine M1, 4 scenari di costo |
| Feature | 496, point-in-time, 8 cutoff da T−3D a T−1M, 9 famiglie (`FEATURE-REGISTRY.md`) |
| Ipotesi provate | **4.660.597** regole + 1.080 configurazioni di modello (`EXPERIMENT-REGISTRY.md`) |
| Controllo della ricerca | 1.000 permutazioni per gruppo dell'intera ricerca (Reality Check max-t); BH informativo |
| Verifica | CPI 2020–26 (esposto, 12 test, Holm); NFP 2020–26 (mai visto, 5 test, Holm con m = 5) |

## I criteri del prompt, uno per uno

| Criterio | Esito |
|---|---|
| 1. Ha senso economicamente | le regole migliori mescolano sorprese recenti, consensus dei salari e forma delle candele: nessuna storia economica solida |
| 2. Funziona fuori campione | **no** (0 test su 17 con Holm p < 0,10) |
| 3. È stabile | no: i segnali cambiano verso fra 2013–19 e 2020–26 |
| 4. Sopravvive ai costi | no: con costi conservative il miglior test va a 0,00 R |
| 5. Sopravvive allo slittamento | no (come sopra; entrare 20 s prima dimezza il modello NFP) |
| 6. Sopravvive a variazioni dei parametri | no: le regole NFP sono picchi senza altopiano |
| 7. Non dipende da pochi eventi | no: una release (NFP 4/9/2026, +5 R) pesa il 42% del modello NFP |
| 8. Sopravvive alla ricerca massiva | solo NFP-1 in scoperta; smentita dal test finale |
| 9. Aspettativa positiva | non dimostrata |
| 10. Validabile live | il motore registra le previsioni immutabili; serve un'ipotesi nuova da confermare |

## Le 32 domande

**1. Esiste edge pre-release sulla prima M1 CPI?**
No. Ricerca: p familywise 0,77. Validazione 2020–26: 12 test, tutti con
Holm p = 1,00, 11 su 12 con R medio negativo. Anche sapendo la direzione
in anticipo, il CPI rende solo +0,39 R per trade con costi base e −0,20 R
con costi conservative (`CPI-RESULTS.md`).

**2. Esiste edge pre-release sulla prima M1 NFP?**
No. Una regola in scoperta con p familywise 0,011. Nel test finale fa
+0,02 R su 11 trade. Il miglior test finale (modello NFP, +0,50 R) ha Holm
p 0,66 e va a zero con costi conservative (`NFP-RESULTS.md`).

**3. Esistono solo sottoregimi tradabili?**
Non trovati. Le regole a 1–3 condizioni *sono* ricerche di sottoregimi
(4,66 milioni): nessuna regge fuori campione. Per era (2014–19, 2020–22,
2023–26) nessuna direzione fissa è positiva, a parte un +0,05 R del
"sempre LONG" sul CPI 2023–26 (rialzo dell'oro, osservato a posteriori,
non significativo).

**4. Quale percentuale di release genera TRADE?**
- Con il verdetto attuale: **0%**, NO TRADE.
- I modelli testati operavano sul 31–33% delle release (NFP 24 su 77, CPI
  26 su 79).
- Le regole, fra il 10% e il 53%.

**5. Quale accuracy OOS?**
- Trade vinti: 54% modello NFP, 27% modello CPI, 12–57% le regole.
- Direzione su **tutte** le release 2020–26: 45,6% modello CPI (un
  "sempre su" faceva 59,5%), 53,2% modello NFP (un "sempre giù" faceva
  55,8%).
- Nessun modello batte la risposta banale.

**6. Quale expectancy OOS?**
- Modello NFP +0,50 R (p 0,13, Holm 0,66).
- Modello condiviso +0,63 R sull'NFP (7 trade) e +0,11 R sul CPI.
- Modello CPI −0,41 R.
- Regole da −1,17 a +0,15 R.
- Nessuna diversa da zero dopo la correzione.

**7. Quale PF?**
- Modello NFP 1,88; condiviso sull'NFP 2,28 (7 trade).
- Modello CPI 0,52.
- Regole da 0,08 a 1,33.

**8. Quale Avg Win / Avg Loss?**
Modello NFP +1,96 R / −1,24 R. Modello CPI +1,61 / −1,15. Regola NFP-1
+1,91 / −1,06. Il rapporto vincita/perdita è buono per costruzione (stop
stretto, uscita a fine minuto): manca la frequenza delle vittorie.

**9. Quale Max DD?**
- Modello NFP: 5,9 R in 24 trade.
- Modello CPI: 14,8 R in 26 trade.
- Peggiore: la regola condivisa 1 sul CPI, 34,9 R in 29 trade.
- In R, indipendenti dalla percentuale di rischio. Il drawdown vero di un
  sistema live va stimato con il bootstrap a blocchi.

**10. Quanto dipende dallo slippage?**
Moltissimo. Da costi base a conservative si perdono da 0,2 a 0,65 R per
trade: il modello NFP passa da +0,50 a 0,00. Anche con costi **zero**
nessun test passa Holm; il migliore ha p nominale 0,047 e Holm 0,24
(`ROBUSTNESS-REPORT.md`).

**11. Quale stop normalizzato/adattivo funziona meglio?**
- **U_news**: mediana del range della prima M1 delle ultime 6 release della
  stessa famiglia, in ATR M1, per l'ATR M1 dell'ora prima.
- Scelto prima del protocollo e confermato dopo: è l'unità più stabile fra
  gli anni (dispersione 0,28 contro 0,32–0,50) e la più legata all'ampiezza
  (Spearman 0,71).
- Lo stop fisso in dollari è fra i peggiori.
- k = 0,60 lascia passare l'81% (CPI) e l'87% (NFP) delle direzioni giuste.
- Nessuno stop rende positivo un trade senza vantaggio sulla direzione
  (`STOP-MAE-MFE-ANALYSIS.md`).

**12. Quanto spesso una previsione direzionalmente corretta viene stoppata?**
Con k = 0,60: **19% CPI, 13% NFP**. Con k = 0,30: 54% e 32%; con k = 1,0:
6% e 5%. Le release di classe B (scatto contrario, poi movimento) sono il
12–29% e fanno perdere anche chi conosce la direzione (−0,9 R).

**13. Quanto è prevedibile l'ampiezza?**
Abbastanza, con una regola semplice. U_news ha Spearman 0,71 con il range
(CPI+NFP insieme, fino al 2019); dentro la singola famiglia 0,16 CPI e
0,39 NFP. Un modello con tutte le feature **non** fa meglio di U_news da
sola. Fase 1: Spearman 0,57.

**14. L'ampiezza migliora la selezione dei trade?**
Riduce i costi, non dà la direzione. Esplorativo, dichiarato dopo il
finale e fuori dal verdetto: nelle release con molto "spazio" (U_news /
spread) il costo scende da 1,50 a 0,37 R (CPI 2013–19). Sempre-LONG e
sempre-SHORT restano però negativi quasi ovunque. Servirebbe solo sopra
un vantaggio di direzione che non c'è.

**15. Quali feature family aggiungono edge?**
Nessuna. Macro (sorprese, livelli, reazioni passate) è la meno peggio: è
in tutti e tre i modelli scelti e porta il t da circa −1,5 a circa 0, non
sopra (`CROSS-EVENT-RESULTS.md` §3).

**16. Price action aggiunge edge?**
No. Da sola: p familywise 0,47 CPI, 0,45 NFP, 0,18 condiviso. Modello di
sola price action: t −2,85 CPI, −0,40 NFP. Regole semplici: nessuna stabile
(`PRICE-ACTION-DISCOVERY.md`).

**17. Consensus aggiunge edge?**
No. Prezzo + consensus: miglior t −0,77 CPI, −0,91 NFP, −1,08 condiviso.
Le due regole NFP con "consensus salari > precedente" sono fallite nel
finale. Limite: il consensus storico gratuito (ForexFactory) è noto prima
della release ma non garantito già a T−3D.

**18. Rates aggiungono edge?**
No. Prezzo + tassi: −1,26, −1,23, −0,83. Regola tassi di base: −0,99 R CPI,
−0,68 R NFP.

**19. DXY aggiunge edge?**
No. Prezzo + dollaro/FX: −0,78 NFP, −0,16 condiviso (il CPI non arriva a 20
trade). Regola dollaro: −1,13 R CPI, −0,24 R NFP.

**20. Fed context aggiunge edge?**
No. Prezzo + Fed: −1,41, −1,07, −0,34. Limite: le probabilità FedWatch
storiche sono a pagamento; si usano proxy (3M, 2Y − 3M, giorni dal FOMC).

**21. Macro context aggiunge edge?**
È l'unica famiglia che migliora qualcosa nella scoperta (vedi 15), ma
fuori campione i modelli con macro sono negativi (CPI) o non significativi
(NFP). No.

**22. VIX/risk regime aggiunge edge?**
No. Prezzo + VIX/rischio: −0,17 NFP, −0,43 condiviso. Anche gli indici di
incertezza e geopolitica (EPU, GPR) non compaiono in nessun risultato che
regga.

**23. Le interazioni funzionano meglio delle feature isolate?**
Fanno numeri più grandi in scoperta (NFP: 2,2 singole, 3,5 coppie, 7,4
terne), ma altrettanto grandi sui dati rimescolati. Le regole NFP sono
picchi: condizioni singole a zero, solo la terna esatta funziona su 15
release. Poi falliscono. Nessuna informazione vera in più.

**24. L'edge è stabile nel tempo?**
Non c'è edge. Quello che cambia molto è la struttura: la M1 della news è
diventata da 2 a 9 volte più grande di una M1 normale, e i costi in R sono
scesi della metà. I segnali di direzione cambiano verso fra periodi (CPI:
candela H4 giusta al 66% nel 2013–19, al 46% dopo).

**25. Esistono structural breaks?**
Sì (`REGIME-ANALYSIS.md`):
- **feed** Dukascopy lento fino al 2011–2014;
- **ampiezza** della news: CPI 2016, 2018, 2022; NFP 2013, 2017;
- **spread** dentro il minuto raddoppiato dal 2022–24;
- **contesto macro** dopo il 2020 fuori dal campo della scoperta: PSI fino
  a 8 su inflazione, salari, partecipazione, curva.

**26. Il modello adattivo batte quello statico?**
Perde meno: t mediano più alto in 5 casi su 6. Non produce però
un'aspettativa positiva. Il modello NFP scelto usa una finestra mobile di
5 anni.

**27. CPI e NFP richiedono modelli differenti?**
Sulla struttura del trade sì:

| | CPI | NFP |
|---|---|---|
| Costi (2014–19) | 0,86 R | 0,41 R |
| Tetto con direzione nota | +0,39 R | +0,77 R |
| Direzioni giuste stoppate | 19% | 13% |

Sulla direzione la domanda non si pone: non funziona né separato né
insieme.

**28. Esiste un pattern condiviso CPI/NFP?**
No. Ricerca condivisa: p familywise 0,53. I candidati condivisi sono tutti
negativi sul CPI 2020–26. Il modello condiviso non è significativo su
nessuno dei due.

**29. Quanto peggiora con cost/slippage stress?**
Nello scenario stress (2/4/2 spread, 3 bp) tutti i test sono negativi, da
−0,57 a −2,57 R. Unica eccezione il modello condiviso sull'NFP, +0,06 R su
7 trade.

**30. Sopravvive alla correzione per massive multiple testing?**
- In scoperta, solo NFP-1 (Reality Check a permutazioni, p 0,011).
  Nessuna ipotesi supera BH (q = 1,00 per tutte, informativo).
- Fuori campione, dopo Holm, niente.

**31. È realmente sfruttabile o solamente statisticamente interessante?**
Né l'uno né l'altro. L'unico risultato statisticamente interessante della
scoperta non ha retto sui dati nuovi.

**32. Quali parti della mia ipotesi manuale sono confermate e quali no?**

*Confermato:*
- In certi periodi la price action prima della release ha davvero
  anticipato la direzione più spesso del 50%. Per esempio l'ultima candela
  H4 ha preso il 66% delle direzioni dei CPI 2013–19 (p 0,006). Quello che
  hai visto non è immaginario.
- Il movimento della news è grande e rapidissimo: due terzi dell'escursione
  arrivano nei primi 5 secondi. La direzione conta davvero.

*Non confermato:*
- Nessun segnale di price action tiene lo stesso verso da un periodo al
  successivo: quello del 66% è sceso al 46%. Quello che funziona nel
  2020–26 (invertire gli ultimi 15 minuti del CPI) nel 2013–19 non c'era.
- Cercando in modo sistematico, la migliore price action non batte il
  caso (p 0,47 CPI, 0,45 NFP).
- Con il contesto (macro, dollaro, tassi) c'è un solo candidato, ed è
  crollato fuori campione.
- **Indovinare la direzione non basta**: il 67% di direzioni giuste
  (inversione dei 15 minuti sul CPI 2020–26) rende −0,16 R per trade dopo i
  costi. Nel minuto della news servono molto più del 60% di direzioni
  giuste per guadagnare, soprattutto sul CPI.

*Non testato:* entrare **dopo** lo scatto iniziale, o su orizzonti più
lunghi della prima M1. È un'altra domanda (usa informazione arrivata dopo
la release) e va pre-registrata come fase nuova.

## Leva

Il prompt chiedeva di studiare la leva solo dopo che un edge fosse
sopravvissuto. **Nessuno è sopravvissuto: lo studio della leva non è stato
fatto.** Con aspettativa zero o negativa, qualunque leva accelera solo le
perdite.

## Cosa fa adesso il software

- La dashboard mostra **NO RELIABLE EDGE / NO TRADE** per CPI e NFP, con i
  numeri di questa fase (Discovery Lab, Candidate edges, Validation, Trade
  simulator, Compute Center).
- Il motore live continua a salvare, prima di ogni release, previsioni
  immutabili con catena di hash. Sono la sola base per confermare in
  futuro un'ipotesi nuova, perché ormai **non esiste più un periodo storico
  non guardato** né per il CPI né per l'NFP.

## Se si vuole continuare: ipotesi nuove, da pre-registrare

Queste sono idee, **non** risultati:

1. **Tradare l'ampiezza invece della direzione.** L'ampiezza è prevedibile
   (U_news), la direzione no. Per esempio: un ordine OCO a cavallo del
   prezzo a T0 ± x·U_news. Si può misurare sui tick già congelati,
   includendo lo slittamento enorme degli ordini stop nel secondo della
   news.
2. **Ingresso dopo lo scatto** (5, 10, 15 s) e uscita più lontana (M5,
   M15): si perde la parte più grande del movimento, ma si conosce già la
   direzione iniziale.
3. **Il feed del tuo broker**: esportare i tick con `mt5/XNB_TickExport.mq5`
   e rifare il trade con gli spread reali di PUPrime nel minuto della news.

Ognuna va scritta come protocollo **prima** di guardare, e confermata solo
live.
