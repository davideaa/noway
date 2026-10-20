# Risultati del Proof of Concept CPI — 26/09/2026

Protocollo: `docs/PROTOCOLLO-CPI.md`, committato prima dei test.
Dataset: `research_output/datasets/CPI_b4bb5cb3d92b.parquet`
(SHA-256 `b4bb5cb3d92b…`). Tutti i numeri sotto sono in
`research_output/cpi_results.json` e nel Research Lab della dashboard.

## Verdetto

# NO RELIABLE EDGE

Un'ora prima del CPI, con i dati disponibili gratuitamente, **non c'è un
modo affidabile di sapere se la prima M1 di XAUUSD chiuderà sopra o sotto
il prezzo pre-release**. Nessuno dei nove modelli e nessuno dei sei
checkpoint batte il caso fuori campione. L'ipotesi economica più
promettente (nowcast Cleveland Fed contro consensus) fallisce anche lei.

**Il movimento, invece, si prevede**: quanto si muoverà l'oro nel primo
minuto dipende dalla volatilità del momento, e la stima regge fuori
campione. La dashboard mostra questo, e non una direzione inventata.

---

## 1. Quanti CPI sono utilizzabili

| | Eventi |
|---|---:|
| Comunicati CPI nell'archivio BLS con tick XAU (2003–2026) | 284 |
| Periodo 2003–2008, solo robustezza: il feed XAU **non reagisce** al CPI (candela di T0 non più ampia delle altre) | 61 |
| Campione primario feb 2008 – set 2026 | 223 |
| esclusi: tick assenti | 2 |
| esclusi: sospetto errore di orario (regola dell'emendamento 2) | 2 |
| esclusi: FLAT (C1 = P0) | 1 |
| **Utilizzabili** | **218** |
| con tutte le feature del set CORE | 215 |
| con nowcast e consensus (dal 2013-07) | 151 |

**Distribuzione:** 128 BULLISH, 90 BEARISH (58,7%). Non è stabile: 70% nel
2008–2012, 49% nel 2013–2019, 61% nel 2020–2026.

**Qualità del target:**
- l'etichetta non dipende dal prezzo scelto: mid contro bid coincide nel
  98,2% dei casi, contro la candela M1 costruita dal primo tick dopo T0
  nel 98,6%;
- la reazione parte a una mediana di **+1,5 s** da T0 (+250 ms nel CPI di
  gennaio 2024): gli orari sono giusti;
- movimento assoluto del primo minuto: mediana **16 pips** (25°–75°:
  6–42), ma cresce molto nel tempo: 6 pips nel 2008–2012, 14 nel
  2013–2019, 49 nel 2020–2026. **46 eventi su 218 si muovono meno di
  5 pips**: in quei casi la direzione è quasi rumore.
- nel 2008–2012 il range del primo minuto vale 0,33 ATR orari, contro 1,1
  e 1,8 dei periodi successivi: il feed Dukascopy di quegli anni reagisce
  poco, e le sue etichette sono probabilmente più rumorose.

## 2. Modelli a T−1H (walk-forward, probabilità calibrate)

Sviluppo = previsioni 2013–2019 (83 eventi); holdout = 2020–2026
(79 eventi, guardati una volta). La p è un test di permutazione
(etichette rimescolate e walk-forward rifatto), corretto per 9 modelli
(Holm).

| Modello | Acc. sviluppo | LogLoss sviluppo | Acc. holdout | Brier holdout | AUC holdout | p (Holm) |
|---|---:|---:|---:|---:|---:|---:|
| M0 frequenza storica | 49,4% | 0,737 | 60,8% | 0,2403 | — | — |
| R1/R2 regola ultima ora | 54,2% | 0,694 | 54,4% | 0,2496 | 0,47 | 1,00 |
| M1 logistica CORE | 50,6% | 0,718 | 62,0% | 0,2393 | 0,56 | 1,00 |
| M1N CORE + nowcast/consensus | 51,8% | 0,720 | 65,8% | 0,2372 | 0,59 | 0,54 |
| **M2 logistica, tutte** (scelto) | **60,2%** | **0,689** | **60,8%** | **0,2394** | **0,59** | **1,00** |
| M3 random forest | 48,2% | 0,716 | 59,5% | 0,2404 | 0,57 | 1,00 |
| M4 LightGBM | 51,8% | 0,729 | 58,2% | 0,2406 | 0,57 | 1,00 |
| M5 k-NN di regime | 54,2% | 0,732 | 55,7% | 0,2466 | 0,48 | 1,00 |

**Perché 60,8% non è un successo:** l'holdout è stato bullish al 60,8%. M2
indovina esattamente quanto un modello che dice sempre "sale". Il test di
permutazione lo vede: p = 0,28 (con etichette a caso lo stesso modello fa
in media 57,6%). Balanced accuracy 55,7%, AUC 0,59.

**I criteri dichiarati:**

| Criterio | Soglia | Ottenuto | |
|---|---|---|---|
| Accuracy holdout | ≥ 55% | 60,8% (IC 95% 50,6–70,9%) | passa, ma è la quota di bullish |
| Permutazione | p < 0,05 | p = 0,283 | **NON PASSA** |
| Brier < baseline M0 | < 0,2403 | 0,2394 | passa di un soffio (−0,0009) |
| Log loss | < 0,693 | 0,672 | passa |

Con 79 eventi l'accuratezza minima distinguibile dal caso (80% di
potenza) è **64%**: l'holdout non può riconoscere un edge piccolo.
Sull'intero fuori campione 2013–2026 (162 eventi) la soglia scende al 60%.

## 3. Le fasce di confidenza (la soglia del 70%)

| Confidenza del modello | Holdout 2020–2026 | Tutto il fuori campione 2013–2026 |
|---|---|---|
| ≥ 60% | 6 segnali, 5 giusti (IC 44–97%) | 29 segnali, 55% (IC 38–72%) |
| ≥ 65% | nessuno | 10 segnali, 50% (IC 24–76%) |
| ≥ 70% | nessuno | 7 segnali, 71% (IC 36–92%) |
| ≥ 75% | nessuno | 2 segnali, 2 giusti |

Il modello quasi mai esce dalla fascia 50–60%, e quando lo fa i casi
sono troppo pochi per concludere qualcosa. **Nessuna previsione al 70%
può essere mostrata come validata.** Calibrazione: fino a 0,6 le
probabilità previste sono vicine a quelle osservate; sopra, i pochi casi
contraddicono il modello (previsto 74%, osservato 43% su 7 eventi).

## 4. Checkpoint e stabilità

Accuratezza fuori campione 2013–2026 del modello scelto (base: 54,9%
bullish): T−3D 54%, T−24H 58%, T−4H 57%, **T−1H 60%**, T−30M 59%,
T−5M 56%. Nessun checkpoint si stacca. La previsione è stabile — stessa
direzione di T−1H nell'85–89% dei casi — ma stabile non vuol dire giusta.

## 5. Sottogruppi (esplorativo, 8 regimi, correzione di Holm)

| Regime | Eventi | Accuratezza | Classe prevalente | p (Holm) |
|---|---:|---:|---:|---:|
| volatilità in espansione | 42 | 69% (IC 54–81%) | 52% | 0,17 |
| oro in trend ribassista 20 gg | 75 | 67% | 59% | 0,63 |
| tassi 2Y in discesa | 69 | 65% | 57% | 0,63 |
| inflazione core > 3% | 48 | 63% | 60% | 1,00 |

Il migliore (volatilità in espansione, 69%) non sopravvive alla correzione
per i confronti multipli. È un'ipotesi da tenere d'occhio nel track record
live, **non** un risultato.

## 6. Ipotesi H2 — nowcast contro consensus: NON SUPERATA

62 segnali (|scarto| ≥ 0,05) su 153 CPI con nowcast: **31 giusti, 50%**
(IC 38–62%), p = 0,55; holdout 51% su 43. Il meccanismo è debole già al
primo passo: lo scarto nowcast−consensus indovina il segno della sorpresa
il 60% delle volte (45 casi), e la correlazione con la sorpresa è
ρ = 0,11 (p = 0,18).

## 7. Il tetto teorico — la ragione di fondo

Diagnostica con un'informazione che *prima* della release nessuno ha: il
segno della sorpresa (actual − consensus FF).

| Chi conoscesse in anticipo la sorpresa | Eventi | Direzione giusta |
|---|---:|---:|
| sul core CPI | 137 | 76% (IC 68–82%) |
| combinata (core, altrimenti headline) | 182 | **73%** (IC 66–78%) |
| quando l'oro si muove ≥ 20 pips | 84 | 87% |
| quando si muove < 20 pips | 98 | 60% |
| release esattamente in linea | 35 | 54% bullish |

**Anche sapendo in anticipo se il CPI sarà caldo o freddo, si arriva al
73%.** Per ottenere un 70% *prima* della release bisognerebbe indovinare il
segno della sorpresa quasi sempre, cioè battere il consensus degli
economisti in modo sistematico. Nessuna delle informazioni pubbliche
testate ci si avvicina (il nowcast Cleveland Fed arriva al 60%).
La soglia del 70% richiesta è, per questo target, **praticamente il
massimo teorico**.

## 8. Il movimento (non la direzione) è prevedibile

Stima walk-forward "range tipico in ATR × ATR orario attuale" contro il
range realizzato: **Spearman ρ = 0,57 su 162 eventi** (p ≈ 10⁻¹⁵). È un
ordinamento buono (sa distinguere i CPI da 20 pips da quelli da 200), ma
la stima puntuale è larga: l'errore tipico è un fattore ~2,3, e solo un
quarto dei casi cade entro ±50% della mediana. Per questo la dashboard
mostra **mediana e intervallo 25°–75°**, non un numero solo.

## 9. Perché non c'è edge (risposte al §33 della richiesta)

1. **Mancano dati importanti?** In parte: il consensus gratuito è quello
   ForexFactory, non un consensus professionale. Ma il tetto del §7 vale
   qualunque sia la fonte del consensus: anche un consensus perfetto non
   dice il segno della sorpresa, che è per costruzione ciò che il consenso
   non sa.
2. **Il target M1 è troppo rumoroso?** Sì, in parte: un evento su cinque
   si muove meno di 5 pips, e sotto i 20 pips perfino la sorpresa spiega
   solo il 60% delle direzioni.
3. **Regimi prevedibili e altri no?** Nessun regime supera la correzione
   per confronti multipli (§5).
4. **T−1H meglio o peggio di altri checkpoint?** Tutti uguali (§4).
5. **Solo in sottogruppi?** Non in modo dimostrabile con 218 eventi.

## 10. Errori miei, trovati e corretti

1. **Controllo "reazione anticipata" sbagliato**: marcava come anomala la
   normale deriva dei 30 s prima di T0 e avrebbe escluso le release in linea
   (bias di selezione). Corretto con l'emendamento 2, prima dei test.
2. **Test esplorativo sbagliato**: nel primo run la tabella di tutti i
   modelli usava un binomiale contro il 50%. Con un holdout bullish al 61%
   quel test premia chi dice sempre "sale": faceva sembrare M1N
   significativo (p Holm 0,029). Sostituito con la permutazione:
   p Holm 0,54. Il verdetto primario non ne era toccato (usava già la
   permutazione).
3. Due bug di software trovati dai test prima di produrre risultati: la
   catena di hash non si ricalcolava con le colonne NULL; le serie con
   timestamp al secondo non accettavano l'ora corrente con i microsecondi.

**Limite noto della regola sull'orario**: il controllo T0±60 minuti può
confondersi con l'apertura di Wall Street alle 9:30 ET (= T0+60 min).
Riguarda solo i 2 eventi esclusi.

**Controllo post-hoc (non pre-registrato)**: addestrando solo dal 2013,
per evitare gli anni con feed poco reattivo, l'accuratezza sull'holdout
resta 59–61% ma con AUC 0,43–0,49 e balanced accuracy 50%: i modelli
seguono la tendenza rialzista del periodo, non distinguono gli eventi.

## 11. Cosa fa ora il software

- Per il CPI la dashboard mostra **NO RELIABLE EDGE** come esito
  principale, con l'inclinazione del modello (grezza e calibrata) solo
  come informazione "non validata"; Confidence NONE; OOS validated NO.
- Mostra i casi comparabili e il **movimento contestuale atteso**, che è
  la parte con valore dimostrato.
- Registra comunque ogni previsione in modo immutabile: il track record
  live dirà, CPI dopo CPI, se qualcosa cambia (per esempio l'ipotesi
  "volatilità in espansione" del §5, che resta da confermare su dati
  futuri).

## 12. Decisioni che spettano a te

1. **Proseguire con NFP?** Il protocollo diceva di farlo solo se il CPI
   mostrava un edge. Non lo mostra. Il limite del §7 è strutturale e con
   ogni probabilità vale anche per NFP, PPI, PCE. Si può fare lo stesso
   test su NFP (il codice è pronto per famiglie nuove), sapendo in
   partenza che è improbabile trovare il 70%.
2. **Cambiare domanda invece che famiglia.** Due domande che i dati
   sembrano sostenere meglio: (a) *quanto* si muoverà l'oro (già
   prevedibile, ρ 0,57); (b) un modello **post-release** separato, che
   legge l'actual e decide nei secondi successivi (il tetto del §7 dice
   che conoscendo la sorpresa si arriva a 73–87%). Sarebbe un altro
   progetto, e va tenuto separato da questo come chiedevi.
3. **Consensus professionale** (Trading Economics ~150 $/mese): renderebbe
   più pulita l'ipotesi H2, ma non sposta il tetto. Non lo consiglio per
   questo target.
