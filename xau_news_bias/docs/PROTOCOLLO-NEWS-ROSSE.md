# H-X15 — News rosse oltre CPI e NFP: prima della news e dopo il primo minuto (protocollo pre-registrato)

Scritto il 07/10/2026 **prima** di scaricare o guardare un solo prezzo
dell'oro intorno a queste news. Fino a questo commit si sono guardate solo
le etichette del calendario (titolo, impatto, ora).

## Richiesta di Davide

- Tutte le news **rosse** (impatto alto su ForexFactory), quelle che
  muovono tanti pips sull'oro.
- Cercare se la direzione è prevedibile **prima** della news, oppure
  **dopo il primo minuto**.
- Dopo il primo minuto: entrare con lo stop **oltre la candela della news**.
  Così lo stop si adatta da solo alla volatilità, che cambia negli anni.

## 1. Eventi

- **Fonte**: storico ForexFactory (`data/cache/consensus/forexfactory_calendar.csv`),
  valuta USD, impatto "High". L'ora è in GMT/UTC.
- **Esclusi**:
  - discorsi, testimonianze, voti, aste ed elezioni (ora non precisa);
  - ogni orario in cui esce anche un CPI o una NFP (già bruciati, fase 2).
- **Regola meccanica, solo sulle etichette**: una famiglia entra se ha
  almeno 60 orari nel 2011–2019 e almeno 20 nel 2020–2023.
- Entrano **11 famiglie** (orari 2011–19 / 2020–23):

| Famiglia | Titoli FF | Ora New York |
|---|---|---|
| FOMC | FOMC Statement, Federal Funds Rate | 14:00 (oppure 12:30, usato in alcune riunioni del 2011–12) |
| VERBALI | FOMC Meeting Minutes | 14:00 |
| RETAIL | Retail Sales m/m, Core Retail Sales m/m | 08:30 |
| PPI | PPI m/m, Core PPI m/m | 08:30 |
| PIL | Advance / Prelim / Final GDP q/q | 08:30 |
| ISM_M | ISM Manufacturing PMI | 10:00 |
| ISM_S | ISM Services PMI | 10:00 |
| ADP | ADP Non-Farm Employment Change | 08:15 |
| FIDUCIA | CB Consumer Confidence | 10:00 |
| MICHIGAN | Prelim UoM Consumer Sentiment | 10:00 (oppure 09:55, usato negli anni passati) |
| CLAIMS | Unemployment Claims | 08:30 |

- **Restano fuori** perché hanno smesso di essere rosse o lo sono da poco:
  Durable Goods, Crude Oil, Philly Fed, Building Permits, Trade Balance,
  case, PCE, JOLTS, PMI flash.
- **Orario condiviso** da più famiglie: si assegna a una sola, in
  quest'ordine:
  FOMC > RETAIL > PPI > PIL > ISM_M > ISM_S > ADP > FIDUCIA > MICHIGAN >
  VERBALI > CLAIMS.
- Un orario vale se l'ora FF, convertita a New York, coincide con quella
  della tabella. Altrimenti si scarta e si conta.
- Gruppo **TUTTE**: le 11 famiglie insieme.

## 2. Periodi

| Uso | Periodo |
|---|---|
| Solo per calcolare l'unità U (nessun test) | 2008–2010 |
| Ricerca | 2011-01 → 2019-12 |
| Validazione | 2020-01 → 2023-12 |
| **Test finale, chiuso a chiave** | **2024-01 → 2026-10** |

- Il 2024–26 di queste famiglie **non si scarica** finché non si arriva al
  test finale.
- Si apre una volta sola e si registra in
  `research_output/phase2/hx15/FINAL_OPENED.json`.

## 3. Dati, validità, costi

- Tick bid/ask Dukascopy da T0 − 61 min a T0 + 61 min; candele H1
  Dukascopy.
- **Evento valido** se:
  - l'ultimo tick prima di T0 è al massimo 120 s prima;
  - ci sono almeno 5 tick nel primo minuto;
  - ci sono tick oltre T0 + 60 min.
- **Costi (S1)**: spread Dukascopy con tetto 40 pips, costi base
  (ingresso +0,5 spread, stop +1 spread, uscita +0,5 spread, +0,5 bp).
- **Robustezza**: costi conservative (1 / 2 / 1 spread, 1,5 bp), stesso
  tetto 40 pips.
- **R = perdita vera**: uno stop saltato conta per intero. Il tetto −1R
  del full margin si riporta solo come informazione.
- **U** = mediana del range della prima M1 (prezzo medio) delle 12
  release valide precedenti della stessa famiglia. Servono almeno 6
  release precedenti, altrimenti l'evento è fuori.
- **Sorpresa** = actual − forecast di FF (primo titolo della famiglia nella
  tabella).
  - Orientata "per l'oro": dato USA sopra le attese = negativo per l'oro.
  - Per CLAIMS è il contrario (più sussidi = economia più debole =
    positivo per l'oro).
  - Per FOMC la sorpresa è quella sul tasso; quasi sempre zero, e allora
    nessun segnale.

## 4. Trade A — bias prima della news

- Ingresso T0 − 60 s. Stop 0,6 × U.
- Uscite: E1 (T0 + 60 s), E5 (T0 + 5 min), E15 (T0 + 15 min).
- Regole. Ognuna dà un segno; si provano sia la regola sia il suo
  contrario.

| Codice | Segno |
|---|---|
| A1 | reazione della prima M1 alla release precedente della stessa famiglia |
| A2 | movimento dell'oro nell'ultima ora (T0 − 61 min → T0 − 60 s) |
| A3 | ultima H1 chiusa contro la H1 di 24 ore prima |
| A4 | ultima H1 chiusa contro la H1 di 120 ore prima |
| A5 | sorpresa orientata della release precedente della stessa famiglia |
| A6 | reazione dell'oro (prima M1) all'ultima news rossa di qualunque famiglia, CPI e NFP compresi, nei 7 giorni prima |
| A7 | sorpresa orientata dell'ultimo CPI (CPI sopra le attese = negativo per l'oro) |
| A8 | sorpresa orientata dell'ultima NFP |
| A9 | sempre LONG (il contrario è sempre SHORT) |

## 5. Trade B — dopo il primo minuto

- Ingresso T0 + 60 s, al prezzo di quel momento.
- **Stop**, tre versioni:
  - **SB1, oltre la candela della news**: il minimo della prima M1 per il
    LONG (sul bid), il massimo per lo SHORT (sull'ask). Distanza minima
    0,1 × U.
  - SB2: metà del range della candela della news.
  - SB3: 0,6 × U.
- **Uscite**: X5, X15 e X60 (T0 + 5 / 15 / 60 min); TP1R e TP2R
  (target 1R o 2R, altrimenti uscita a 60 min).
- Regole. Anche qui si provano sia la regola sia il suo contrario.

| Codice | Segno |
|---|---|
| B1 | direzione della candela della news (contrario = sfumare il colpo) |
| B2 | direzione della sorpresa orientata di questa release |
| B3 | candela, solo quando va nella stessa direzione della sorpresa |
| B4 | candela, solo quando va contro la sorpresa |
| B5 | candela, solo quando il suo range è ≥ U (colpo grande) |
| B6 | candela, solo quando il suo range è < U |

## 6. Percorso 1 — quattro ipotesi principali, scritte adesso

Hanno un motivo economico e non vengono dalla ricerca:

| Ipotesi | Regola | Gruppo | Stop | Uscita |
|---|---|---|---|---|
| P1 | B2: dopo un minuto segui la sorpresa | TUTTE | SB1 | X15 |
| P2 | B1: dopo un minuto segui la candela | TUTTE | SB1 | X15 |
| P3 | B1 contrario: sfuma la candela | TUTTE | SB1 | X15 |
| P4 | A1 contrario: inverti la release precedente (come H-X8) | TUTTE | 0,6U | E1 |

- Test su **2011–2023** insieme: t unilaterale sull'R medio > 0, Holm con
  m = 4, soglia 0,05.
- Chi passa va al test finale.

## 7. Percorso 2 — ricerca ampia

- **Tutte le combinazioni**:
  - trade A: 9 regole × 2 versi × 3 uscite × 12 gruppi;
  - trade B: 6 regole × 2 versi × 3 stop × 5 uscite × 12 gruppi.
- Per gruppo servono almeno 30 trade nella ricerca.
- **Nullo a permutazioni**: dentro ogni famiglia si mescolano gli esiti
  rispetto ai segnali, 1.000 volte. Si prende la t massima su tutte le
  combinazioni. p familywise = quota di permutazioni con t massima ≥
  quella osservata.
- **Candidato**, solo con tutte queste condizioni:
  - p familywise < 0,10 nella ricerca 2011–19;
  - **altopiano**: almeno una combinazione vicina (uscita o stop
    adiacente, stessa regola, gruppo e verso) ha t ≥ 1;
  - R medio > 0 sia nel 2011–15 sia nel 2016–19;
  - al massimo 10 candidati, per t.
- **Validazione 2020–23**: R medio > 0 e t unilaterale con Holm sui
  candidati < 0,05.
- **Se non c'è nessun candidato, la validazione e il test finale non si
  aprono**: restano vergini per idee future.

## 8. Test finale 2024–2026 (una volta sola)

- Tutti i finalisti dei due percorsi.
- Passa chi ha:
  - R medio > 0 con costi base;
  - p unilaterale < 0,05 con Holm sui finalisti;
  - R medio > 0 anche con costi conservative.
- Passa → **EDGE CONFERMATO SU DATI MAI VISTI**: registro live con catena
  di hash e sito.
- Non passa nessuno → **NO RELIABLE EDGE**.

## 9. Sempre riportato, solo descrittivo

- Ampiezza per famiglia (pips): range della prima M1 e dei primi 5 minuti,
  movimento a 15 e 60 minuti, spread massimo. Per anno, fino al 2023.
- Il 2024–26 si aggiunge dopo il test finale.
- Tutte le combinazioni con n, R medio, t e p familywise, anche le
  peggiori.

## Emendamento 1 (07/10/2026, prima di guardare i prezzi)

- **Orari del FOMC.** Fino al 2012 il comunicato usciva verso le 14:15 New
  York, non alle 14:00, e FF registra il minuto vero (14:09–14:23). Nelle
  riunioni con conferenza del 2011–12 usciva verso le 12:30 (12:27–12:32).
  - Prima: si accettavano solo 14:00 e 12:30. Così si perdevano 50
    riunioni, tutte del 2008–2012.
  - Ora: per il FOMC vale un orario fra 14:00 e 14:25, oppure fra 12:25 e
    12:35.
  - Restano fuori le mosse d'emergenza (07:00, 08:20, 10:00, 17:00).
  - Per le altre famiglie la regola resta esatta: si perde 1–3 release
    ciascuna, uscite qualche minuto in ritardo.
- **Finestra dei tick**: da T0 − 62 min invece di T0 − 61 min. Serve per
  avere un prezzo a T0 − 61 min (regola A2).
- **Dichiarazione.** Per provare il codice è stato scaricato un solo
  evento, ISM manifatturiero del 02/01/2015. I suoi trade sono stati
  stampati e poi cancellati prima del calcolo vero.
