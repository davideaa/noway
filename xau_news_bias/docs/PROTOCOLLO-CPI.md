# Protocollo del Proof of Concept CPI — dichiarato PRIMA del test

Scritto e committato prima di calcolare qualunque statistica sugli esiti.
L'unico esito osservato durante lo sviluppo è quello del CPI dell'11
gennaio 2024, usato per verificare timestamp e formato dei tick (BEARISH,
−84 pips). Qualunque modifica a questo file dopo il primo test va
dichiarata in fondo, con data e motivo.

---

## 1. Domanda

Esiste, **un'ora prima** della pubblicazione del CPI USA (T−1H), un
insieme di informazioni disponibili in quel momento che anticipa la
direzione della prima candela M1 di XAUUSD dopo la release, con una
frequenza superiore al caso e che **regge su dati mai usati per
addestrare**?

## 2. Eventi

- Fonte delle date: archivio ufficiale BLS dei comunicati CPI
  (`bls.gov/bls/news-release/cpi.htm`), un comunicato = un evento.
- Ora: 08:30 America/New_York, convertita in UTC con le regole storiche
  dell'ora legale (zoneinfo).
- Campione **primario**: comunicati da febbraio 2008 (primi con testo
  HTML, quindi con i valori point-in-time leggibili) a settembre 2026.
- Campione **secondario** (solo analisi di robustezza, feature di prezzo):
  2003–2008.
- Esclusi, con motivo registrato: tick mancanti nella finestra, prezzo
  pre-news più vecchio di 60 s, nessun tick nel primo minuto, esito FLAT.

## 3. Target (definizione tecnica)

- Prezzo = **mid** Dukascopy, `(bid+ask)/2`, timestamp UTC al millisecondo.
- **P0 (Open T0)** = mid dell'**ultimo tick con timestamp < T0**. Non si
  usa l'open della candela M1 delle 08:30, perché è il primo tick *dopo*
  T0 e può già contenere la reazione (nel CPI di gennaio 2024 il primo
  tick dopo T0 arriva a +100 ms e il movimento parte a +200 ms).
- **C1** = mid dell'ultimo tick con timestamp < T0 + 60 s.
- `C1 > P0` → **BULLISH**, `C1 < P0` → **BEARISH**, uguali → FLAT
  (escluso e contato). Le wick non contano.
- Salvati comunque: high/low del minuto (partendo da P0), body, wick
  superiore e inferiore, range, MFE e MAE nel verso della chiusura,
  movimento in pips (**$0,10 = 1 pip**), spread a P0, numero di tick,
  ritardo della prima reazione.
- Controllo dei timestamp: per ogni evento si misura quando il prezzo si
  stacca da P0. Una reazione che parte *prima* di T0, o più di 5 s dopo,
  segnala un errore di orario o di feed e l'evento va in quarantena.
- Varianti di robustezza (solo per misurare quanto è stabile l'etichetta):
  bid invece di mid; candela M1 BID `close > open`.

## 4. Punti di previsione

T−3D, T−24H, T−4H, **T−1H (primario)**, T−30M, T−5M. Ogni fotografia
usa solo dati con `available_from_utc ≤ istante della fotografia`
(regole di disponibilità nel registro fonti, sempre prudenti).

## 5. Protocollo anti-leakage

1. Nessun dato con timestamp ≥ T0 entra nelle feature; un test
   automatico lo verifica facendo fallire la costruzione se accade.
2. Valori macro: solo la Tabella A dei comunicati **precedenti**, così
   come pubblicata quel giorno (prima stampa + revisioni note allora).
   Mai la serie odierna, che contiene revisioni successive.
3. Serie giornaliere (Treasury, VIX, EFFR, COT) allineate con
   `available_from_utc`, non con la data di riferimento.
4. Standardizzazioni, imputazioni e calibrazione stimate **solo** sulla
   finestra di training di ciascun passo walk-forward.
5. Nessuna selezione di feature guardando gli esiti fuori campione. I set
   di feature sono fissati qui sotto.
6. Dataset congelato: la tabella eventi + feature viene salvata con hash
   SHA-256; ogni risultato riporta l'hash del dataset che l'ha prodotto.

## 6. Validazione

- **Walk-forward a finestra espandente**, ri-addestramento ogni 1° gennaio:
  si addestra su tutti gli eventi precedenti, si prevedono quelli
  dell'anno. Primo anno previsto: 2013.
- **Sviluppo** = previsioni walk-forward 2013–2019. Qui, e solo qui, si
  sceglie il modello.
- **Holdout finale** = 2020-01 → 2026-09, guardato **una volta** con il
  modello scelto (sempre in walk-forward). Tutti gli altri modelli sono
  riportati sull'holdout per trasparenza, ma il verdetto è sul modello
  scelto in sviluppo.
- Metriche: accuracy, balanced accuracy, Brier score, log loss, AUC,
  curva di calibrazione, IC 95% bootstrap (10.000 ricampionamenti),
  test di permutazione (etichette rimescolate, walk-forward rifatto),
  stabilità per anno e per regime, fasce di confidenza.

## 7. Modelli candidati (iperparametri fissi, niente tuning)

| | Modello | Feature |
|---|---|---|
| M0 | Frequenza storica di BULLISH nel training (baseline) | nessuna |
| M1 | Regressione logistica L2, C = 0,1 | set CORE |
| M2 | Regressione logistica L2, C = 0,05 | set FULL |
| M3 | Random Forest, 500 alberi, profondità 3, foglia ≥ 10 | set FULL |
| M4 | LightGBM, 100 alberi, lr 0,03, 4 foglie, foglia ≥ 15 | set FULL |
| M5 | k-NN (k = 25, pesato per distanza) — il motore di similarità | set REGIME |
| R1 | Regola fissa: continuazione del movimento dell'ultima ora | — |
| R2 | Regola fissa: inversione del movimento dell'ultima ora | — |

Calibrazione: Platt, stimata con validazione temporale interna al solo
training.

**Set CORE** (scelto a priori per ragioni economiche): rendimento XAU
1h, 24h e 20 giorni (in ATR); posizione nel range a 20 giorni; rendimento
DXY 24h; variazione del rendimento a 2 anni in 5 giorni; accelerazione
del core CPI (ultimo MoM − media 6 mesi, dall'ultimo comunicato);
direzione della reazione al CPI precedente.

**Set REGIME**: inflazione (YoY, core YoY, accelerazione), tassi (2Y,
pendenza 2s10s, reale 10Y, 2Y − 3M), dollaro (trend 20 giorni), volatilità
XAU (ATR giornaliero relativo), trend XAU (distanza da EMA 50 giorni).

**Set FULL**: tutte le feature costruite (elenco generato nel dataset).

## 8. Criteri di successo, dichiarati ora

Il CPI a **T−1H** mostra un edge **PROMETTENTE** solo se, sull'holdout
2020–2026, il modello scelto in sviluppo soddisfa **tutti**:

1. accuracy ≥ **55%** sugli eventi non FLAT;
2. test di permutazione, p < **0,05** (unilaterale);
3. Brier score **inferiore** a quello della baseline M0;
4. log loss < **0,693** (il valore di una moneta).

Per mostrare percentuali **≥ 70%** come validate serve inoltre che la
fascia di previsioni fuori campione con confidenza calibrata ≥ 0,70 abbia
**almeno 15 casi**, un tasso di successo ≥ **65%** e limite inferiore
Wilson al 95% **> 50%**.

Se i criteri non passano, il verdetto è **NO RELIABLE EDGE** e la
dashboard lo mostra come risultato principale. Gli altri checkpoint e
modelli sono esplorativi e vanno letti con la correzione di Holm per
confronti multipli.

## 9. Cosa NON si fa

- Non si aggiungono feature o modelli dopo aver visto l'holdout per
  "salvare" il risultato. Se si prova qualcosa di nuovo, è una nuova
  ipotesi e va testata su dati futuri (track record live).
- Non si abbassano le soglie.
- Non si usano Actual, sorpresa o prezzi dopo T0 in nessuna feature.

---

## Modifiche successive

### Emendamento 1 — 26/09/2026, PRIMA di qualunque test

Motivo: la ricerca delle fonti ha trovato due dati che il protocollo
originale non prevedeva perché non sapevo esistessero gratis:

- **Nowcast CPI della Cleveland Fed** (ufficiale, pubblicato ogni giorno
  lavorativo dal 2013-07, storico dei valori *come pubblicati allora*).
- **Forecast ForexFactory** storico 2007–2026 (dataset raccolto da terzi
  su GitHub, non ufficiale; il valore è quello mostrato al momento della
  release, quindi noto prima di T0 ma non necessariamente già a T−3D).

Nessuna statistica sugli esiti era stata ancora calcolata quando questo
emendamento è stato scritto e committato.

**Ipotesi H2 (economica, con segno dichiarato).** Se il nowcast è più
caldo del consensus, aumenta la probabilità di una sorpresa calda, e una
sorpresa calda spinge i rendimenti e il dollaro su e l'oro giù.
Quindi: `gap_core = nowcast core CPI m/m − forecast FF core CPI m/m`;
**gap positivo → BEARISH**.

- Regola a zero parametri R3: `gap_core ≥ +0,05` → BEARISH,
  `gap_core ≤ −0,05` → BULLISH, altrimenti nessun segnale.
- Nowcast usato: l'ultimo con data < giorno della release (regola
  prudente: il valore del giorno d si considera noto dalle 23:59 ET di d).
- Criteri H2, sugli eventi con segnale: almeno 40 segnali, tasso di
  successo ≥ 55%, test binomiale unilaterale p < 0,05, e tasso ≥ 55%
  anche sulla sola parte 2020–2026.
- Controllo del meccanismo (diagnostico, mai una feature): la
  correlazione fra `gap_core` e la sorpresa realizzata (actual − forecast)
  deve essere positiva. E un tetto teorico: che accuratezza avrebbe chi
  conoscesse in anticipo il segno della sorpresa? Serve a capire quanto
  del risultato è limitato dal target stesso.

**Modello aggiunto M1N**: regressione logistica L2, C = 0,1, set CORE +
`gap_core` + `gap_headline` + `consensus_core − previous_core`.
Il set FULL include anche queste feature (NaN prima del 2013, imputati
con la mediana del training).

Il verdetto primario (§8) resta sul modello scelto in sviluppo fra
M0–M5, M1N, R1, R2; H2/R3 ha un verdetto suo, riportato separatamente.

**Criterio di scelta in sviluppo** (il §6 non lo diceva): vince il
modello con la **log loss più bassa** delle probabilità calibrate sulle
previsioni walk-forward 2013–2019; a parità entro 0,002 vince il più
semplice (ordine: M0, R1, R2, M1, M1N, M5, M2, M3, M4). Le regole R1/R2
ricevono come probabilità il loro tasso di successo nel training, così
sono confrontabili con i modelli.

### Emendamento 2 — 26/09/2026, PRIMA di qualunque test statistico

Motivo: collaudando il calcolo del target su due eventi (gennaio 2024 e
giugno 2020, nessuna statistica aggregata) la regola del §3 "reazione
prima di T0 o dopo 5 s → quarantena" si è rivelata sbagliata in due modi:

1. scattava per la normale deriva del prezzo nei 30 s prima di T0
   (gennaio 2024 marcato "reazione a −30 s", mentre il salto vero parte a
   +200 ms);
2. applicata alla lettera escluderebbe le release in linea con le attese,
   dove l'oro si muove poco e una "reazione" netta non c'è: sarebbe un
   bias di selezione a favore degli eventi con movimento grande.

Nuova regola: il ritardo della prima reazione resta registrato come
**diagnostica** (soglia: 0,02% del prezzo o 5 volte la variazione tipica
tick-to-tick, cercata da T0−2 s). L'esclusione per errore di orario
avviene solo con una prova specifica: la candela M1 di T0 **non** è
anomala (range < 1,5 volte la mediana delle due ore precedenti) **mentre**
quella di T0−60 min o T0+60 min lo è (> 4 volte). È la firma di un errore
di ora legale. Stato: `TIMESTAMP_SUSPECT`.
