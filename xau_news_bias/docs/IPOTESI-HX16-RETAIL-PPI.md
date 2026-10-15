# H-X16 — Retail Sales e PPI: quanto muove la prima M1 e se il contesto tecnico ne dice la direzione (pre-registrata)

Scritta il 15/10/2026 **prima** di calcolare le grandezze e i test qui
sotto.

## Cosa si è già visto, da dichiarare

- H-X15 su RETAIL e PPI 2011–2023: nessuna regola di direzione dopo i
  costi.
- Per costruire il sito descrittivo (emendamento 3 di
  `PROTOCOLLO-NEWS-ROSSE.md`) si sono già visti:
  - range della prima M1 per anno e sua mediana;
  - ATR 14 H1 prima della news e il rapporto range/ATR per anno.
- Della direzione della prima M1 su queste release si conosce solo quanto
  emerso in H-X15. Le regole qui sotto non sono state provate.

## Richiesta di Davide

- Un sito solo per queste news, separato dall'NFP.
- Una stima affidabile di quanti pips può fare la candela della news, in
  base alla volatilità di adesso.
- Cercare pattern di direzione della candela da 1 minuto (chiusura) nel
  contesto tecnico:
  - range o trend;
  - zone di supply/demand;
  - ipercomprato o ipervenduto su M1 e M5.
- Serve come conferma della sua analisi tecnica, non come segnale da
  solo.

## Eventi

- Tutte le release RETAIL e PPI di H-X15 dal 2011 al 2026, comprese
  quelle insieme (Retail + PPI nello stesso minuto).
- Bersaglio: direzione della prima M1 sul prezzo medio, cioè l'ultimo
  prezzo prima di T0 + 60 s contro l'ultimo prima di T0. Movimento nullo:
  fuori.
- **Ricerca** 2011–2019. **Conferma** 2020–2026, dichiarata come non
  vergine: il 2020–23 è passato da H-X15, il 2024–26 dall'emendamento 3,
  ma solo per l'ampiezza.

## Parte A — quanto muove (stima)

- Modello: log(range bid prima M1) = a + b · log(ATR 14 H1 a T0) + c ·
  (Retail e PPI insieme).
- Stimato sul 2011–2019, controllato sul 2020–2026:
  - errore mediano;
  - quota di release dentro l'intervallo 10–90% previsto.
- Stessa cosa per:
  - il range dei primi 5 minuti;
  - quanto va contro in ciascuna direzione dal prezzo delle 14:29 entro
    fine M1 (massimo sopra e massimo sotto).
- È affidabile se nel 2020–26 l'80% delle release (±5) cade
  nell'intervallo 10–90%.

## Parte B — direzione della prima M1 dal contesto tecnico

Tutto calcolato sulle candele bid Dukascopy chiuse prima di T0 − 60 s.
Ogni regola dà LONG, SHORT o nessun segnale. Si provano sia la regola sia
il contrario.

| Codice | Segnale |
|---|---|
| C1 | RSI 14 M1 > 70 → SHORT, < 30 → LONG |
| C2 | RSI 14 M5 > 70 → SHORT, < 30 → LONG |
| C3 | RSI 14 M15 > 70 → SHORT, < 30 → LONG |
| C4 | posizione nel range delle ultime 24 ore: ultimo 20% in alto (vicino al massimo, "supply") → SHORT; 20% in basso ("demand") → LONG |
| C5 | come C4 sul range delle ultime 4 ore |
| C6 | trend H1: chiusura sopra la media 20 H1 → LONG, sotto → SHORT |
| C7 | trend M5: chiusura sopra la media 20 M5 → LONG, sotto → SHORT |
| C8 | regime: se l'efficienza delle ultime 24 H1 (movimento netto ÷ somma dei movimenti) è > 0,3, segui il trend di 24 ore; altrimenti (range) fai il contrario dell'ultima ora |
| C9 | prezzo sopra o sotto l'apertura del giorno (00:00 UTC) |

- Gruppi: RETAIL e PPI insieme, poi RETAIL da solo e PPI da solo.
- Statistica: quota di direzioni giuste e binomiale. Si richiedono almeno
  25 segnali.
- **Nullo a permutazioni**: si mescolano le direzioni delle release
  1.000 volte; massimo su tutte le regole, versi e gruppi; p familywise.
- **Candidato**:
  - p familywise < 0,10 nella ricerca 2011–19;
  - quota giusta > 50% sia nel 2011–15 sia nel 2016–19.
- **Conferma** 2020–26: quota > 50% e binomiale unilaterale < 0,05 con
  Holm sui candidati.
- Anche se passa: il 2020–26 non è vergine. Si chiama al massimo
  **"da registrare dal vivo"**, come la regola NFP.

## Cosa va sul sito

- La stima della parte A con l'ATR del momento, con le sue righe di
  controllo.
- Il risultato della parte B, qualunque sia, anche se è tutto zero.
- Tutte le release con candele da 10 s e tutti i dati usciti.
