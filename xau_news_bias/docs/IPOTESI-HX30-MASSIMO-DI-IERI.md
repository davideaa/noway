# H-X30 — Toccherà il massimo (o il minimo) di ieri entro sera? (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare.

## Richiesta di Davide

- "Massimo" deve voler dire una cosa chiara: il **massimo della candela
  del giorno prima**.
- Se a una certa ora il prezzo non l'ha ancora toccato, quante volte lo
  tocca entro fine giornata? Più passano le ore, meno spesso.
- Così sa se la probabilità è dalla sua parte, nei giorni normali e nei
  giorni di news (NFP, CPI, PPI e Retail).

## Dati

- Candele H1 bid Dukascopy XAUUSD dal 2012, come H-X21 e H-X28.
- Giornata dalle 22:00 UTC; esclusi i giorni con meno di 12 candele.
- **PDH** e **PDL** = massimo e minimo del giorno di trading prima.
- ADR21 come in H-X28.

## Misure

Controlli alla chiusura di ogni candela H1 del giorno, k = 0…23.

Lato **massimo di ieri**, solo i controlli in cui il massimo di oggi
finora è ancora sotto PDH:
- **distanza** d = (PDH − prezzo) ÷ (ADR21 × apertura ÷ 100), in ADR;
- **toccato** = 1 se il massimo finale del giorno ≥ PDH.

Lato **minimo di ieri**: lo stesso, al contrario.

Fasce:
- ora: 12 da 2 ore, come H-X28;
- distanza: 0–0,1 / 0,1–0,25 / 0,25–0,5 / 0,5–0,75 / 0,75–1 / oltre 1
  ADR.

**Probabilità** = quota di casi passati toccati, nella stessa fascia di
ora e di distanza. Con meno di 30 casi si usa la stessa fascia di
distanza a tutte le ore.

## Prova passo per passo

- Per ogni anno Y dal 2016 al 2026, la tabella si calcola solo con i
  giorni prima del 1° gennaio di Y, dal 2012.
- Il giorno in corso non entra.

## Decisione

**Affidabile** se, sia nel 2019–22 sia nel 2023–26, per il massimo e per
il minimo di ieri:
- la probabilità media prevista sbaglia la quota vera di meno di 3 punti;
- in ogni fascia di probabilità prevista (0–10%, 10–20%, …, 90–100%) con
  almeno 200 casi sbaglia di meno di 5 punti.

Se è affidabile va sui siti, con un grafico: la probabilità di toccarlo
alle varie ore, per la distanza di adesso. Se non lo è, si dice e non va
sul sito.

## Descrittivo

- Quota di giorni in cui il prezzo tocca il massimo di ieri, il minimo,
  tutti e due, nessuno: 2019–22 e 2023–26.
- **Giorni di news** (NFP, CPI, Retail/PPI): al controllo dell'ultima
  candela H1 chiusa prima della news, probabilità prevista contro quota
  vera. Dice se la news fa toccare il livello più spesso del previsto.
  Non è un test, perché i giorni di news sono pochi e già visti.

## Risultati (dopo i commit `082c4e4` e `cdc3cf8`)

File: `research_output/phase2/hx16/hx30_ieri.json`. Codice:
`scripts/hx30_ieri.py`.
- Primo giro fermato da un 503 di Dukascopy sui tick di oggi.
- Aggiunti dei nuovi tentativi in `fresh` (solo stato di adesso), poi
  rigirato. La prova non cambia.

### Minimo di ieri: 🟢 calibrato

| | Prevista | Vera | Fasce (≥200 casi), scarto massimo |
|---|---|---|---|
| 2019–22 (17.255 controlli) | 24,6% | 23,8% | 4,0 punti (30–40%: 34,1 contro 30,1) |
| 2023–26 (16.223) | 22,8% | 22,3% | 3,3 punti (40–50%: 46,2 contro 42,9) |

### Massimo di ieri: 🔴 non calibrato

| | Prevista | Vera | Fasce (≥200 casi), scarto massimo |
|---|---|---|---|
| 2019–22 (15.530) | 23,7% | **27,0%** | **13,7 punti** (50–60%: 57,6 contro 71,3) |
| 2023–26 (14.308) | 25,0% | 26,0% | **7,4 punti** (60–70%: 64,7 contro 72,1) |

- Nelle fasce centrali il massimo di ieri viene toccato **più spesso** del
  previsto, di 6–14 punti nel 2019–22 e di 7 nel 2023–26.
- È lo stesso motivo per cui la settimana non passa in H-X28. Dal 2019
  l'oro sale, e le tabelle dal 2012 comprendono gli anni in discesa.
- **Per la regola scritta prima (massimo E minimo) H-X30 non passa.** Non
  va sul sito.

### Descrittivo

Giorni 2023–26 (2019–22 quasi uguale):
- toccato il massimo di ieri: 52,8%;
- toccato il minimo di ieri: 43,7%;
- tutti e due: 10,8%;
- nessuno dei due: 14,4%.

**Giorni di news**, al controllo dell'ultima H1 chiusa prima della news,
2023–26 (n circa 30–50):

| | Massimo di ieri, previsto → vero | Minimo di ieri, previsto → vero |
|---|---|---|
| NFP | 28% → **47%** | 23% → **50%** |
| CPI | 28% → 37% | 24% → 31% |
| Retail/PPI | 22% → 22% | 17% → 25% |

- Nei giorni di NFP il livello di ieri non ancora toccato viene toccato
  circa **il doppio** delle volte rispetto a un giorno normale nella
  stessa situazione.
- È descrittivo, con pochi casi già visti. Al massimo è un'idea da
  registrare dal vivo.

## VERDETTO

- 🔴 **Non passa**: la probabilità sul massimo di ieri sottostima di 7–14
  punti nelle fasce centrali. Nessuna probabilità sul massimo o minimo di
  ieri va sul sito.
- 🟢 Il lato minimo da solo è calibrato. Non basta, perché la regola
  chiedeva tutti e due.
- Per correggere il trend servirebbe un metodo nuovo, per esempio tabelle
  sugli ultimi 3 anni. Andrebbe pre-registrato e provato **dal vivo**,
  perché il 2019–26 è già visto.
