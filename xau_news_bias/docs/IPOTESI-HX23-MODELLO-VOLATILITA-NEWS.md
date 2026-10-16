# H-X23 — Un modello che prevede i pips della news, e la direzione dalla posizione nel range (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare.

## Richiesta di Davide

- Un modello vero che preveda quanto si muove l'oro alla news, che si
  adatti al regime.
- Usare tutti i dati insieme.
- Provare se la **posizione rispetto ad ADR/AWR** dice anche la direzione.
  Esempio: il prezzo ha già fatto gran parte del range del giorno verso
  l'alto, è in zona di supply, quindi alla news spara giù.

## Dati

- Tutte le news rosse con tick validi, dal 2011 al 2026:
  - le 11 famiglie di H-X15 (FOMC, verbali, Retail, PPI, PIL, ISM_M,
    ISM_S, ADP, fiducia, Michigan, claims);
  - **NFP e CPI**.
- Tick da T0 − 62 min a T0 + 61 min (cache H-X15). Candele H1 Dukascopy
  chiuse prima. **GVZ**: indice di volatilità implicita dell'oro, CBOE,
  serie FRED GVZCLS, chiusura del giorno prima della news.
- I dati di NFP, CPI, Retail/PPI e delle altre famiglie 2024–26 sono già
  stati visti in test precedenti. Per questo si usa la prova **passo per
  passo**: ogni anno si stima solo con gli anni prima. Nessun periodo è
  "vergine"; il controllo è che ogni previsione usi solo il passato.

## Parte A — quanti pips (modello)

**Bersaglio**: ampiezza della prima M1 sul prezzo medio, in % del prezzo,
in log.

**Variabili**, tutte note a T0 − 60 s:
- famiglia della news;
- **memoria**: mediana delle ultime 3 e delle ultime 12 release della
  stessa famiglia;
- **GVZ** del giorno prima, e GVZ ÷ sua mediana degli ultimi 252 giorni;
- **ADR**: media del range giornaliero degli ultimi 5 e 21 giorni (% del
  prezzo);
- **range già fatto oggi** fino a T0 − 60 s ÷ ADR21;
- **range già fatto in settimana** ÷ AWR4;
- range dell'ultima ora e degli ultimi 15 minuti prima della news;
- VIX del giorno prima.

**Modelli**:
- M0 = solo memoria (mediana delle ultime 12 della stessa news, come ora);
- M1 = regressione lineare (ridge) su tutte le variabili;
- M2 = LightGBM piccolo (profondità 3, 200 alberi, tasso 0,05).

**Prova passo per passo**: per ogni anno Y dal 2016 al 2026, i modelli si
stimano su tutte le release prima del 1° gennaio di Y.

**Misure**: errore mediano |log(vero ÷ previsto)| e Spearman, per NFP, CPI,
Retail/PPI e tutte insieme, nel 2019–22 e nel 2023–26.

**Decisione**: M1 o M2 sostituisce M0 se ha l'errore più basso di almeno
0,03 su **tutte** le news insieme, in tutti e due i periodi, e non è
peggio di M0 di oltre 0,03 su NFP e su Retail/PPI.

## Parte B — direzione dalla posizione nel range (ipotesi di Davide)

**Estensione del giorno** a T0 − 60 s: (prezzo − apertura del giorno) ÷
ADR21.

**Regole**:

| Codice | Regola |
|---|---|
| E50 | estensione ≥ +0,5 → SHORT; ≤ −0,5 → LONG |
| E80 | come E50, con soglia 0,8 |
| W50 | come E50, sulla settimana: (prezzo − apertura della settimana) ÷ AWR4 |
| W80 | come W50, con soglia 0,8 |

**Bersaglio**: direzione della prima M1 (prezzo medio).

**Test**:
- tutte le news insieme, 2011–2026;
- quota giuste, binomiale unilaterale per il verso "sfuma l'estensione";
- Holm su 4. Passa se p Holm < 0,05 e la quota è > 50% sia nel 2011–18
  sia nel 2019–26.

Descrittivo: per famiglia e il verso opposto (segui l'estensione).

Se passa: è un'indicazione da registrare dal vivo, non un trade. I dati
sono già stati visti per altre domande.

## Risultati (dopo i commit `afab956` e dello script)

File: `research_output/phase2/hx16/hx23_modello.json` e
`hx23_dataset.parquet`. Codice: `scripts/hx23_modello.py`.

2.216 release valide 2011–2026: 13 famiglie, di cui NFP 183, CPI 186,
Retail 168, PPI 127.

### A — quanti pips

Errore mediano |log(vero ÷ previsto)| 2019–22 / 2023–26 (Spearman
2023–26):

| | M0 memoria (12 release) | M1 lineare | M2 LightGBM |
|---|---|---|---|
| Tutte | 0,409 / 0,373 (0,67) | 0,409 / **0,328** (0,70) | 0,413 / 0,325 (0,69) |
| NFP | 0,357 / 0,373 (−0,02) | 0,354 / **0,331** (0,28) | 0,368 / 0,306 (0,04) |
| CPI | 0,452 / 0,467 (0,01) | **0,326 / 0,413** (0,36) | 0,428 / 0,370 (0,28) |
| Retail/PPI | 0,391 / 0,327 (0,20) | **0,351 / 0,282** (0,32) | 0,378 / 0,289 (0,35) |

- **Per la regola scritta prima il modello NON sostituisce la memoria**:
  su tutte le news insieme nel 2019–22 non migliora (0,409 contro 0,409).
- Per le news che contano a Davide il modello lineare è meglio in tutti e
  due i periodi:
  - CPI: errore da 0,45 a 0,33 e da 0,47 a 0,41;
  - Retail/PPI: da 0,39 a 0,35 e da 0,33 a 0,28;
  - NFP: solo nel 2023–26.
- Questo **non era il criterio** (che guardava "tutte"). Il modello
  lineare si registra quindi dal vivo in parallelo alla memoria, non lo
  sostituisce.
- **Cosa conta**, in ordine (pesi del lineare e importanza in LightGBM):
  1. memoria delle ultime 3 release (+0,25);
  2. memoria delle ultime 12 (+0,17);
  3. range degli ultimi 15 minuti e dell'ultima ora prima della news
     (+0,06, +0,05);
  4. ADR (+0,03–0,05).
  - Il GVZ quasi niente (+0,04 relativo, −0,04 livello). Il VIX va al
    contrario (−0,05). Il range già fatto oggi pesa pochissimo (−0,03).
  - Coerente con gli studi: il volume della news è memoria della news
    più la tensione subito prima. La volatilità generale e quella
    implicita aggiungono poco.

### B — direzione dalla posizione nel range (ipotesi di Davide)

| Regola (sfuma l'estensione) | Release con segnale | Giuste | p Holm | 2011–18 / 2019–26 |
|---|---|---|---|---|
| E50 giorno ±0,5 ADR | 501 | 47,5% | 1,00 | 46,6% / 48,6% |
| E80 giorno ±0,8 ADR | 188 | 44,7% | 1,00 | 47,1% / 41,7% |
| W50 settimana ±0,5 AWR | 647 | 50,9% | 1,00 | 50,9% / 50,7% |
| W80 settimana ±0,8 AWR | 262 | 52,7% | 0,84 | 53,2% / 51,9% |

- **Non passa.** Quando il prezzo ha già fatto molto range nel giorno, la
  news non spara di più dall'altra parte.
- Descrittivo, verso opposto, non testato: con estensione ≥ 0,8 ADR la news
  **continua** nella stessa direzione il 55,3% delle volte (104 su 188, p
  unilaterale circa 0,08; 52,9% nel 2011–18 e 58,3% nel 2019–26).
  - È coerente con gli studi, che trovano continuazione e non inversione
    (Kurov et al. 2019, intraday momentum).
  - Non è significativo, e il verso è stato scelto guardando i dati: al
    massimo un'idea da registrare dal vivo.
