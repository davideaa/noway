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
