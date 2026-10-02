# Protocollo della fase 2 — scoperta su CPI e NFP (pre-registrato)

Scritto e committato **prima** di qualunque analisi che metta in relazione
le feature con la direzione o con il risultato dei trade. Le sole analisi
fatte prima di questo file non guardano la direzione (asimmetria,
anatomia, unità dello stop, rotture strutturali) e per NFP usano solo il
periodo fino al 2019. Sono in `research_output/phase2/p2_anatomy_prereg.json`
e `p2_regimes_prereg.json`.

La fase 1 (CPI, prima M1, NO RELIABLE EDGE) resta congelata e non viene
modificata.

## 1. Domanda

Esistono condizioni note **prima** di CPI e NFP in cui un trade sulla prima
M1 di XAUUSD ha **aspettativa positiva dopo costi realistici**, fuori
campione? LONG, SHORT o NO TRADE; NO TRADE è una decisione normale.
L'obiettivo principale è l'**aspettativa in R**, non l'accuratezza.

## 2. Dati congelati

| File | SHA-256 (prime 12) |
|---|---|
| `research_output/phase2/p2_events.parquet` | `0a1e6ca76066` |
| `research_output/phase2/p2_paths.parquet` | `6810d9548c3a` |
| `research_output/phase2/p2_features.parquet` | `6bbc2c066951` |

448 eventi (224 CPI, 224 NFP, 2008–2026), 496 feature point-in-time a 8
cutoff (T−3D, T−24H, T−4H, T−1H, T−30M, T−15M, T−5M, T−1M). Regole di
disponibilità in `docs/POINT-IN-TIME-AUDIT.md`; il test anti-leakage copre
tutte le famiglie nuove.

## 3. Periodi

La rottura strutturale misurata prima del protocollo: fino al 2011–2013 il
feed Dukascopy reagiva lentamente alle news (persistenza della direzione
dei primi 5 s: 8–25% contro 80% dopo; quota del range raggiunta in 15 s:
22% contro 79–87%). Le etichette di quel periodo sono poco affidabili.

| Periodo | CPI | NFP |
|---|---|---|
| Regime principale da | 2013-07-01 | 2013-07-01 |
| **SCOPERTA** | 2013-07 → 2019-12 (≈78) | 2013-07 → 2019-12 (≈78) |
| **VALIDAZIONE** | 2020-01 → 2026-09, etichetta **PREVIOUSLY EXPOSED OOS** (usato come holdout nella fase 1) | — |
| **CONFERMA FINALE** | nessuna storica: solo **LIVE** | 2020-01 → 2026-09 (≈79), **mai guardato**, usato **una volta** |
| Sensibilità | scoperta allargata 2008–2019 | idem |

I modelli possono addestrarsi anche sugli anni 2008–2013 (con pesi di
recenza, scelti come iperparametro), ma sono **valutati** solo sul regime
principale.

## 4. Il trade (fissato qui)

- **Ingresso**: ultimo tick ≤ T0 − 10 s. LONG all'ask, SHORT al bid.
- **Uscita**: chiusura della prima M1 (ultimo tick < T0 + 60 s), al bid (LONG)
  o all'ask (SHORT).
- **Stop**: `SL = 0,60 × U_news`, dove `U_news` = mediana del range della
  prima M1 delle ultime 6 release della stessa famiglia (in unità di ATR M1
  dell'ora prima) × ATR M1 dell'ora prima di questa release. Scelta prima
  del protocollo, senza direzione, sui dati fino al 2019: `U_news` è l'unità
  più stabile negli anni (dispersione 0,16 contro 0,55–0,82 delle altre) e
  la più legata al range (Spearman 0,71); 0,60 è il 75° percentile
  dell'escursione avversa nei casi in cui la direzione a fine minuto era
  giusta.
- **Esecuzione dello stop**: primo tick oltre lo stop, eseguito a quel
  prezzo (i salti oltre lo stop sono inclusi) più lo slittamento dello scenario.
- **Costi**: scenario **base** (ingresso +0,5 spread, stop +1 spread, uscita
  +0,5 spread, +0,5 bp per lato). Robustezza: optimistic, conservative
  (+1/+2/+1 spread, 1,5 bp), stress (+2/+4/+2 spread, 3 bp).
- **Risultato**: R = PnL / SL. Per ogni evento si calcolano R_LONG e R_SHORT.

## 5. Ricerca massiva di regole (ipotesi H-R)

- **Primitive**: per ogni feature con copertura ≥ 70% nella scoperta, 4
  condizioni con soglie = quantili calcolati **solo sulla scoperta**
  (≤ q25, ≤ q50, > q50, ≥ q75). Feature binarie: = 0, = 1. Feature
  categoriche con ≤ 8 livelli: ogni livello.
- **Ipotesi**: congiunzioni di 1, 2 o 3 primitive su feature diverse ×
  direzione (LONG, SHORT) × cutoff (T−1H e T−1M) × gruppo (CPI, NFP,
  CONDIVISO = CPI+NFP insieme). Singole e coppie: tutte. Terne: estensione
  delle 300 coppie migliori (beam). Supporto minimo nella scoperta: 15
  eventi per CPI e NFP, 30 per il gruppo condiviso.
- **Punteggio**: t-statistica dell'R medio (costi base).
- **Controllo della ricerca massiva**: la procedura intera (singole,
  coppie, beam delle terne, entrambe le direzioni, entrambi i cutoff) viene
  ripetuta 1.000 volte con gli esiti permutati **dentro ogni anno** (le
  coppie R_LONG, R_SHORT di un evento restano insieme). Il p-value
  familywise di un'ipotesi = quota di permutazioni in cui il massimo
  punteggio di tutta la ricerca è ≥ al suo (Reality Check di White nella
  forma max-t). In aggiunta, FDR di Benjamini-Hochberg sulle p nominali,
  solo informativo.
- **Sottoinsieme price action**: la stessa procedura ristretta alle sole
  feature `pa_` (con il suo max-null) risponde alla domanda sull'ipotesi
  manuale.

**Selezione dei candidati** (prima di guardare validazione o conferma):
per ogni gruppo si prendono fino a **5** ipotesi, in ordine di punteggio,
che soddisfano tutte: R medio > 0 anche con costi conservative; R medio > 0
in almeno il 60% degli anni con ≥ 2 eventi; sovrapposizione (Jaccard) < 0,7
con i candidati già scelti. Punteggio di selezione = t − 0,5 × (numero di
condizioni − 1).

## 6. Modelli (ipotesi H-M)

- **Obiettivo**: stimare E[R_LONG] ed E[R_SHORT]; azione = la direzione con
  valore atteso maggiore se supera la soglia τ, altrimenti NO TRADE.
- **Configurazioni** (tutte registrate): modello {ridge, LightGBM piccolo,
  k-NN di regime} × insieme di feature {PRICE ONLY, +MACRO, +RATES,
  +DXY/FX, +VOL/RISK, +CONSENSUS, +FED, +POSITIONING, +MACRO+RATES, ALL} ×
  adattività {espandente, finestra mobile 5 anni, pesi con emivita 3 anni} ×
  τ {0; 0,1; 0,2; 0,3} × gruppo {CPI, NFP, CONDIVISO}. Cutoff T−1M.
- **Walk-forward nella scoperta**: riaddestramento ogni 1° gennaio,
  training su tutti gli eventi precedenti (anche 2008–2013, con i pesi della
  configurazione), previsioni 2014–2019.
- **Scelta**: per ogni gruppo la configurazione con la **t-statistica
  dell'R medio dei trade** più alta nel walk-forward di scoperta, con
  almeno 20 trade.
- **Baseline** sempre riportate: sempre LONG, sempre SHORT, frequenza
  storica, direzione della reazione precedente, momentum e inversione XAU
  dell'ultima ora, regola DXY, regola tassi, casuale.
- **Ablazione**: le 10 famiglie di feature confrontate a parità di modello
  e adattività (la migliore nel walk-forward di scoperta).
- **Checkpoint**: la configurazione scelta rieseguita a ogni cutoff, per
  vedere se l'informazione cresce avvicinandosi alla release (descrittivo).

## 7. Verifica fuori campione

- **CPI 2020–2026 (esposto)**: candidati regola (≤ 5) e modello CPI e
  condiviso scelti. Test unilaterale su R medio > 0, Holm sul numero di test
  CPI. Il periodo è già stato visto: un successo qui vale al massimo
  PROMISING BUT UNPROVEN / LIVE CONFIRMATION REQUIRED.
- **NFP 2020–2026 (conferma finale, una volta)**: al massimo **5 test**
  in tutto — le 3 migliori regole fra NFP e CONDIVISO per punteggio di
  selezione, il modello NFP e il modello CONDIVISO scelti. Holm su 5.
- Nessuna soglia, stop, feature o modello viene cambiato dopo aver visto
  questi dati. Un'idea nuova dopo quel momento è una fase esplorativa
  nuova e va dichiarata come tale.

## 8. Classificazione (deterministica)

| Classe | Condizioni |
|---|---|
| **ROBUST OOS EDGE** | test finale NFP Holm p < 0,05 **e** R medio > 0 con costi conservative **e** R medio > 0 per stop 0,42–0,78 U (±30%) **e** nessun anno pesa più del 50% dell'R totale **e** ≥ 20 trade nel finale |
| **PROMISING BUT UNPROVEN** | finale NFP Holm p < 0,10, oppure validazione CPI Holm p < 0,05 |
| **WEAK / EXPLORATORY** | scoperta con t > 2 o p familywise < 0,20, senza conferma |
| **NO EVIDENCE** | tutto il resto |
| **LIVE CONFIRMATION REQUIRED** | si aggiunge a qualunque classe sopra NO EVIDENCE che riguardi il CPI |

Verdetto finale **NO RELIABLE EDGE** se nessun candidato raggiunge ROBUST
OOS EDGE.

## 9. Analisi descrittive (non producono verdetti)

Asimmetria della news contro M1 normali; MAE/MFE a 5–60 s; classi di
percorso; quanti trade giusti vengono stoppati al variare di k e
dell'unità; prevedibilità dell'ampiezza e suo uso per selezionare i trade;
rotture strutturali; stabilità per anno e regime; dipendenza da COVID e 2022.

## 10. Registro

Ogni ipotesi valutata viene contata nel registro degli esperimenti
(`experiments` nel database e `research_output/phase2/experiment_registry.json`):
numero di primitive, coppie, terne, configurazioni di modello, soglie,
permutazioni, con seed, hash dei dati e commit del codice.

## Emendamento 1 — 2026-09-26, prima di guardare qualunque risultato della scoperta

Scritto mentre le permutazioni girano e prima che la griglia dei modelli
parta: nessun numero della ricerca è stato ancora letto. Fissa i dettagli
di esecuzione di §7–§8 che il testo sopra lasciava aperti.

1. **Modelli congelati.** Per la validazione CPI e per la conferma NFP il
   modello scelto viene addestrato **una volta** su tutti gli eventi del
   gruppo prima del 2020-01-01 (con la stessa adattività: `rolling5y` =
   2015–2019, `decay3y` = pesi calcolati per l'anno 2020) e applicato
   senza riaddestramento a tutto il 2020–2026. Così nessun esito dei
   periodi di verifica entra mai in un addestramento, e gli esiti NFP del
   test finale non vengono toccati prima della sua apertura.
2. **Regole.** Le soglie sono quelle calcolate sulla scoperta (congelate
   nello spazio delle primitive, ricostruito in modo deterministico). Una
   regola del gruppo CONDIVISO si applica, nella validazione CPI, agli
   eventi CPI; nel test finale, agli eventi NFP.
3. **Famiglia di Holm per il CPI**: tutti i test eseguiti sugli eventi CPI
   2020–2026 — i candidati CPI (≤ 5), i candidati CONDIVISI (≤ 5) applicati
   al CPI, il modello CPI e il modello CONDIVISO. Includere anche le regole
   condivise rende la correzione più severa, non più facile.
4. **Test finale NFP**: le 3 regole con punteggio di selezione più alto fra
   i candidati NFP e CONDIVISI, il modello NFP, il modello CONDIVISO.
   **Holm sempre con m = 5**: se i test disponibili sono meno di 5, quelli
   mancanti contano come p = 1.
5. **Il test**: t unilaterale sull'R medio dei trade eseguiti (costi base),
   H0: R medio ≤ 0, gradi di libertà n − 1. Con meno di 5 trade il test
   vale p = 1.
6. **Robustezza richiesta dalla classe ROBUST** (§8): costi conservative
   sugli stessi trade; stop k ∈ {0,42; 0,51; 0,60; 0,69; 0,78} × U_news
   con le **stesse decisioni** (per i modelli, le azioni restano quelle
   prese con k = 0,60); quota dell'R totale del singolo anno migliore.
7. **Ordine**: prima la validazione CPI, poi l'apertura del test finale
   NFP, in un'unica esecuzione di `scripts/phase2_validate.py`; nessuna
   scelta dipende dall'esito della prima.
