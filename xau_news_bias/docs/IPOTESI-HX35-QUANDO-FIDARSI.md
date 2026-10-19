# H-X35 — La stima della candela è più affidabile quando la volatilità è calma? (pre-registrata)

Scritta il 19/10/2026 **prima** di calcolare.

## Domanda di Davide

"Adesso funziona o non funziona, e perché?" Il sito deve dire prima della
news se la stima della candela è da fidarsi.

## Cosa si sa già

- H-X32: la fascia EW3 della NFP ci prende il 43%, e nel 2025–26 molto
  meno.
- H-X34: le esplosioni di volatilità continuano. I segnali W1
  (volatilità già salita) e W2 (GVZ alto) le annunciano quando sono già
  in corso.
- Idea: quando un segnale è acceso la stima sbaglia di più, quando è
  spento è affidabile. Nasce guardando la NFP 2026, quindi la prova vera è
  sulle 12 famiglie senza NFP (come H-X33). La NFP è solo descrittiva.

## Dati e segnale

- Fascia B0 di H-X33 (= EW3 di H-X32), famiglia per famiglia, solo dati
  di prima.
- Segnale il giorno della release, solo con dati fino al giorno prima:
  - **W1**: media del range degli ultimi 21 giorni ≥ 1,2 × media dei 126
    giorni prima di quei 21;
  - **W2**: GVZ dell'ultima chiusura ≥ 1,2 × sua mediana dei 252 giorni
    prima.
- **Acceso** se W1 o W2. Lo stesso segnale di H-X34, calcolato ogni
  giorno invece che a fine mese.

## Misure (2019–22 e 2023–26, segnale acceso contro spento)

- Errore = mediana di |log(vera ÷ centro della fascia)|.
- Copertura della fascia 25–75.
- Numero di release.

## Decisione (sulle 12 famiglie senza NFP)

Il segnale **dice quando fidarsi** se, in tutti e due i periodi:
- l'errore col segnale acceso supera di almeno 0,05 quello col segnale
  spento;
- col segnale spento la copertura sta fra 40% e 60%.

Se passa, il sito mostra prima di ogni news "segnale spento: stima
affidabile" oppure "segnale acceso: la candela può uscire molto più
grande", coi numeri di affidabilità dei due casi. Se non passa, il sito
non lo dice.
