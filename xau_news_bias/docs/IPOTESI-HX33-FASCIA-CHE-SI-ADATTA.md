# H-X33 — Una fascia che si adatta quando cambia la volatilità (pre-registrata)

Scritta il 19/10/2026 **prima** di calcolare.

## Idea di Davide

La stima H-X32 della candela NFP ci prendeva negli anni tranquilli e
sbaglia nel 2025–26. Secondo lui il calcolo non segue il cambio di
volatilità: quando il mercato diventa più agitato, anche l'errore della
stima cambia, e la formula deve accorgersene.

## Cosa ho già visto, da dichiarare

Prima di scrivere ho guardato le NFP. È uno sguardo descrittivo, sui dati
già usati da H-X32. Errore = log(vera ÷ stima EW3):

| Anno | Errore medio | Dispersione | Larghezza fascia | Dentro |
|---|---|---|---|---|
| 2023 | −0,05 | 0,32 | 0,64 | 73% |
| 2024 | −0,05 | 0,37 | 0,42 | 50% |
| 2025 | −0,21 | 0,47 | 0,41 | 18% |
| 2026 | +0,40 | 0,72 | 0,62 | 25% |

- Nel 2025 la fascia era la più stretta proprio quando l'errore è
  cresciuto: aveva "imparato" dagli anni calmi 2023–24.
- Nel 2026 la dispersione dell'errore è circa il doppio del normale.
- Gli errori si ripetono: correlazione 0,29 fra l'errore e la distanza
  della NFP precedente dalla stima.
- La volatilità prima della news non spiega l'errore (correlazioni fra
  −0,08 e +0,08 dal 2016):
  - ADR5 ÷ ADR21;
  - range dell'ultima ora e degli ultimi 15 minuti;
  - GVZ.
- H-X22 aveva già provato a far adattare il **centro** della stima (EWMA,
  taglio al cambio di regime): per la NFP nessun metodo era stabile. Qui
  si prova la **larghezza** della fascia e la **correzione con gli errori
  recenti**, che H-X22 non provava.

Le NFP 2019–26 hanno ispirato l'idea, quindi non possono confermarla.
**La prova vera è sulle altre 12 famiglie di news**: CPI, Retail, PPI,
ISM manifatturiero e servizi, ADP, Claims, PIL, fiducia, Michigan, FOMC,
verbali. Per questa domanda non sono mai state usate. Le NFP si riportano
solo come descrizione.

## Dati

- `hx23_dataset.parquet`: tutte le release dal 2011, r1 = range della
  prima M1 in % del prezzo.
- Ogni famiglia ha la sua serie, in ordine di tempo, e usa solo le
  release precedenti della stessa famiglia.

## Metodi

Notazione:
- e = media esponenziale di r1 sulle release precedenti, emivita 3, almeno
  6 release (la EW3 di H-X32);
- z = log(r1 ÷ e) di ogni release passata.

| Codice | Centro | Fascia 25–75 |
|---|---|---|
| **B0** (H-X32) | e × mediana dei rapporti delle 24 precedenti | e × 25° e 75° percentile dei rapporti delle 24 precedenti |
| **A** fascia che si adatta | come B0 | **simulazione storica filtrata** (vedi sotto) |
| **B** centro che si corregge | e × exp(media esponenziale di z, emivita 3) | 25° e 75° percentile degli scarti z − correzione delle 24 precedenti |
| **C** = A + B | come B | simulazione storica filtrata sugli scarti di B |
| **D** = C sulla volatilità del giorno | come C, ma con e calcolata su r1 ÷ ADR21 e moltiplicata per l'ADR21 di oggi | come C |

Come si calcola la simulazione storica filtrata (Barone-Adesi 1999, lo
stesso schema dei livelli H-X28):
- scarto d = z meno la correzione del centro usata in quel momento;
- σ = radice della media esponenziale di d², emivita 6 release, sulle
  release precedenti;
- scarto standardizzato u = d ÷ σ di quel momento;
- fascia = centro × exp(σ di oggi × 25° e 75° percentile di u sulle 24
  precedenti).

Le emivite (3 e 6) sono fissate qui e non si cambiano.

## Misure

Sulle release dove tutti e cinque i metodi hanno la fascia, nel 2019–22 e
nel 2023–26:
1. **Copertura** della fascia 25–75 (obiettivo 50%).
2. **Interval score** (Gneiting e Raftery 2007), in log, per la fascia
   centrale del 50%:
   `IS = (U − L) + 4·(L − y)·[y < L] + 4·(y − U)·[y > U]`
   - y = log r1, L e U = log degli estremi della fascia;
   - più basso è meglio;
   - premia le fasce strette e punisce chi esce, quindi misura insieme
     precisione e affidabilità.
3. Descrittivo: per ogni coppia famiglia-anno, distanza media della
   copertura dal 50%.

## Decisione (sulle 12 famiglie senza NFP)

Un metodo **funziona** se:
1. la copertura sta fra 40% e 60% sia nel 2019–22 sia nel 2023–26;
2. l'interval score medio è più basso di B0 in tutti e due i periodi;
3. sul 2019–26 insieme la differenza col B0 è significativa:
   - si calcola la differenza media per ogni coppia famiglia-anno;
   - t unilaterale su queste differenze (le release vicine non sono
     indipendenti);
   - p corretta Holm su 4 metodi < 0,05.

Fra quelli che funzionano vince l'interval score più basso nel 2023–26.
Sotto l'1% di differenza vince il più semplice (ordine A, B, C, D).

**Se uno vince:**
- si applica alla NFP;
- i numeri NFP sono descrittivi, perché già visti;
- sostituisce EW3 sul sito come stima della candela NFP, con scritto che
  si conferma dal vivo.

**Se nessuno vince**, resta EW3 e si dice: la parte di errore che resta
non si prevede con la volatilità passata.
