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
