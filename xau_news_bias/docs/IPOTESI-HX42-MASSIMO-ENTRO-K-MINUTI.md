# H-X42 — La linea verde: il massimo con la wick entro 1–5 minuti (pre-registrata)

Scritta il 20/10/2026 **prima** di calcolare.

## Cosa chiede Davide

- La linea verde di H-X41 è il massimo **entro il primo minuto**. Sta
  sotto la zona arancione, che è il range intero del primo minuto
  (massimo meno minimo, con tutte e due le wick).
- Davide intende un'altra cosa: il punto più lontano a cui arriva il
  prezzo nella nostra direzione, **wick compresa**. Si prende dalle NFP
  recenti, nel regime di volatilità di quel momento.
- Non va guardato solo il primo minuto ma i primi **2, 3, 4, 5**. A volte
  la M1 tocca il livello e poi ritraccia. Altre volte, con meno
  volatilità, lo stesso livello si tocca solo entro M5.
- Si sceglie la finestra più affidabile.
- È un'indicazione per Davide, non un take profit: H-X41 ha già mostrato
  che chiudere lì fa peggio.

## Perché la verde di H-X41 sta sotto l'arancione (da dire)

Il range del primo minuto comprende anche la wick contro di noi. Il
massimo in una sola direzione, dentro lo stesso minuto, non può superarlo,
salvo quando la candela parte già lontana dall'ingresso. Va sopra solo
con una finestra più lunga.

## Misura

Per ogni NFP, il **massimo entro k minuti**:
- dal lato giusto, cioè nella direzione del primo minuto, come in H-X41;
- con ingresso alle 14:29:00;
- è il punto più favorevole dal momento dell'ingresso fino a T0 + k
  minuti;
- prezzi S4, sul lato di chiusura, costi d'ingresso compresi;
- in % del prezzo.

Con k = 1 è esattamente la verde di H-X41 (controllo).

**Stima prima della news**, come H-X41:
- EW3 della candela r1 delle NFP precedenti;
- per la mediana del rapporto massimo ÷ EW3 sulle 24 NFP precedenti;
- storia dal 2011.

## Quale finestra

Si provano k = 1, 2, 3, 4, 5 minuti. Si sceglie così, come in H-X32:
1. **calibrata** se il massimo vero raggiunge la stima fra il 40% e il 60%
   delle volte, sia nel 2014–19 sia nel 2020–26;
2. fra le calibrate vince quella con l'**errore più piccolo nel
   2023–26**:
   - errore = mediana di |log(massimo vero ÷ stima)|;
   - massimo vero almeno 1 pip, per non dividere per zero;
3. se due finestre stanno entro 0,02 di errore, vince la più corta.

Se vince k = 5, che sta sul bordo, si aggiungono 10 e 15 minuti, si rifà
la scelta e si dice.

## Cosa si riporta

- Per ogni k:
  - calibrazione;
  - errore;
  - massimo mediano in pips nel 2024–26;
  - quante volte la stima sta sopra la linea centrale arancione.
- Per la finestra vincente, anno per anno: quante volte il lato giusto la
  raggiunge.

## Decisione

- La finestra vincente diventa la linea verde del sito al posto di quella
  di H-X41:
  - nel replay, NFP per NFP;
  - in alto, per la prossima NFP;
  - etichetta "max mediano entro k min".
- Resta scritto che come take profit fa peggio.
- L'arancione resta il range previsto del primo minuto.
- Se nessuna finestra è calibrata, resta la verde di H-X41 (k = 1) e si
  dice.

## Emendamento 1 (20/10/2026, prima di eseguire)

Davide chiede di usare **tutto il metodo** già studiato, non solo la
volatilità delle ultime NFP:
- il prezzo dell'oro;
- la volatilità del giorno;
- la sorpresa del dato;
- la reazione del mercato.

**Cosa si può usare prima della news.**
- **Il prezzo dell'oro c'è già**: tutto si stima in % e si moltiplica
  per il prezzo di quel giorno.
- **La sorpresa non si conosce prima della news**, quindi non può entrare
  in una stima fatta prima. H-X39 ha visto anche che la sua grandezza non
  cambia la candela: 84 contro 85,5 pips.
- **La volatilità del giorno e le altre variabili sono già state provate
  per la candela** in H-X32:
  - ADR24 = volatilità del giorno;
  - FORM = la formula di H-X29;
  - RIDGE = tutte le variabili.
  - Lì ha vinto EW3. ADR24 aveva l'errore più basso, ma entro 0,02 da
    EW3, quindi pari.

**Si rifà la stessa gara per il massimo.**
- Metodi, in quest'ordine: **EW3, ADR24, FORM, RIDGE**. Sono le stime
  della candela di H-X32, NFP per NFP.
- Ogni stima diventa un massimo così: stima della candela × mediana del
  rapporto massimo ÷ stima della candela sulle 24 NFP precedenti.
- Si confrontano tutte le coppie metodo × finestra (k = 1–5 minuti).

**I periodi cambiano**, perché FORM e RIDGE esistono solo dal 2016 e i 24
rapporti si riempiono dal 2018.
- Calibrazione nel **2019–22 e 2023–26**, come H-X32.
- Si usano solo le NFP dove tutte le coppie hanno la stima.
- Errore nel 2023–26.
- A parità, entro 0,02, vince la finestra più corta, poi il metodo che
  viene prima nell'ordine.
- La calibrazione nel 2014–19 e 2020–26 di EW3 si riporta solo come
  descrizione.

**Prossima NFP.**
- FORM e RIDGE non si possono calcolare prima della news coi dati di
  oggi.
- Se vince uno dei due, il replay mostra le sue stime, mentre in alto va
  il migliore fra EW3 e ADR24, e si dice.
- ADR24 usa la volatilità di oggi (ADR21 dei livelli del sito).
