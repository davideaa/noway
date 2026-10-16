# H-X28 — Livelli del giorno e della settimana in prezzo, affidabili e stretti (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare.

## Richiesta di Davide

- "682 pips, 911, 1.209" non si capisce. Servono **prezzi**, rispetto al
  prezzo di adesso, e una pagina interattiva.
- La fascia deve essere **affidabile e non troppo larga**. Una fascia
  enorme ci prende sempre e non serve a niente.

## Cosa c'è oggi sul sito (H-X21)

- Range del giorno previsto con ADR21 e della settimana con AWR4: mediana,
  75% e 90%.
- Livelli fissi dall'apertura (± 82% del range). Non usano quello che il
  giorno ha già fatto: alle 15:00 sono larghi come alle 00:00.

## L'idea

Quello che si sa nel momento in cui si guarda:
- ora del giorno (o della settimana);
- massimo H e minimo L già fatti;
- prezzo P;
- ADR21 (AWR4 per la settimana).

Si prevede dove finiranno il **massimo e il minimo del giorno**, come
prezzi. Man mano che il giorno va avanti la fascia si stringe da sola.

È il metodo che usano i risk manager, la **simulazione storica filtrata**
(Barone-Adesi, Giannopoulos e Vosper, 1999): le estensioni passate,
divise per la volatilità di quel momento, rimoltiplicate per la volatilità
di oggi. Così i livelli seguono il regime.

## Dati

- Candele H1 bid Dukascopy XAUUSD dal 2012, le stesse di H-X21.
- Giorno chiuso alle 22:00 UTC; settimana da domenica sera a venerdì
  22:00 UTC (funzione `bars` di H-X21).
- Esclusi i giorni con meno di 12 candele e le settimane con meno di 60.

## Misure

Controlli alla chiusura di ogni candela H1: ora k = 0…23 per il giorno,
k = 0…119 per la settimana.

Per ogni controllo:
- S = ADR21 (media dei range degli ultimi 21 giorni chiusi, in % della
  loro apertura); AWR4 per la settimana;
- O = apertura;
- **estensione su**: u = (massimo finale − H) ÷ O × 100 ÷ S;
- **estensione giù**: v = (L − minimo finale) ÷ O × 100 ÷ S.

u e v sono ≥ 0; valgono 0 quando il massimo o il minimo è già fatto.

Livelli e numeri per il lato su (per il giù è lo stesso, con v e L):
- **Su_90** = H + quantile 90% di u × S × O ÷ 100: 9 volte su 10 il
  massimo del giorno resta sotto;
- **p_su** = quota di casi passati con u > 0: probabilità di fare ancora
  un nuovo massimo;
- **Su_tipico** = H + mediana di u fra i casi con u > 0, × S × O ÷ 100:
  se fa un nuovo massimo, 1 volta su 2 si ferma prima di questo prezzo.

(Il livello "1 volta su 2" semplice non si usa. Nella seconda metà del
giorno il massimo è spesso già fatto, quindi il quantile 50% di u è 0 e il
livello coinciderebbe con H.)

## Metodi

| Codice | Quantili di u e v calcolati per |
|---|---|
| **A** | ora (12 fasce da 2 ore; 10 fasce da 12 ore per la settimana) |
| **B** | ora × quanto range è già fatto: (H − L) ÷ O × 100 ÷ S < 0,5 / 0,5–1 / > 1 |
| **C** | B × dove sta il prezzo nel range già fatto: (P − L) ÷ (H − L) nel terzo basso / centrale / alto. Su e giù hanno quantili separati |

Riferimento, solo riportato: l'ADR classico di TradingView,
- su = L + ADR;
- giù = H − ADR.

Si dice che quantile è davvero, cioè quante volte il massimo resta sotto.

## Prova passo per passo

- Per ogni anno Y dal 2016 al 2026, le tabelle dei quantili si calcolano
  **solo con i giorni prima del 1° gennaio di Y**, dal 2012.
- S invece è sempre quello del momento.
- Una fascia con meno di 30 casi nel passato usa la fascia di A della
  stessa ora.

## Misure di qualità (2019–22 e 2023–26, tutti i controlli insieme)

- **Copertura**:
  - quota di controlli con massimo finale ≤ Su_90 (obiettivo 90%), e lo
    stesso per il minimo;
  - **p_su** e **p_giù**: media prevista contro quota vera di nuovi
    massimi e minimi;
  - **Su_tipico** e **Giù_tipico**: fra i controlli che fanno un nuovo
    estremo, quota che si ferma prima del livello (obiettivo 50%);
  - quota con tutta la giornata dentro [Giù_90, Su_90] (solo riportata).
- **Larghezza**: mediana di (Su_90 − Giù_90) in % del prezzo, convertita
  in pips al prezzo di oggi. Anche per ora del giorno, compresa la fascia
  12–14 UTC (prima delle news delle 14:30 italiane).

## Decisione

- **Affidabile** se in tutti e due i periodi, per il giorno e per la
  settimana:
  - le coperture 90% (su e giù) stanno fra 87% e 93%;
  - p_su e p_giù sbagliano la quota vera di meno di 5 punti;
  - i livelli tipici stanno fra 45% e 55%.
- Giorno e settimana si giudicano **separatamente**: possono vincere metodi
  diversi.
- Fra i metodi affidabili vince quello con la **fascia [Giù_90, Su_90] più
  stretta nel 2023–26**. Se la differenza è sotto il 3%, vince il più
  semplice (A, poi B, poi C).
- Se nessuno è affidabile, sul sito non va niente di nuovo e si dice.
- Se vince un metodo, va su tutti e due i siti come **pagina
  interattiva**:
  - ora, massimo, minimo e prezzo di adesso, già compilati con l'ultimo
    dato e modificabili, così si possono mettere quelli del proprio MT5;
  - i livelli in dollari su una scala di prezzo.
- I livelli **non sono un segnale di direzione**. H-X23 ha già mostrato
  che la posizione nel range non dice dove va la news.
