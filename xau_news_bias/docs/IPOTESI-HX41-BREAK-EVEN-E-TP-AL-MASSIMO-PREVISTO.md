# H-X41 — Break even e TP al massimo previsto, invece di tenere 5 minuti (pre-registrata)

Scritta il 20/10/2026 **prima** di calcolare.

## Idea di Davide

- Se la news spara nella nostra direzione, lo stop va subito a **break
  even**: da lì non si perde più.
- Poi non si chiude finché il prezzo non tocca il **target previsto**.
  Appena lo tocca, si chiude.
- Se il target arriva già nei primi 10–20 secondi, si chiude lì.
- Se il primo minuto chiude sotto il target e il secondo minuto ci
  arriva, si chiude nel secondo minuto.
- Il target giusto è il **massimo mediano**, cioè fin dove arriva il
  prezzo nella nostra direzione. Non è il **range mediano**.

## Errore da dichiarare (Davide ha ragione)

- La zona arancione del replay è la **candela prevista** (massimo meno
  minimo del primo minuto), disegnata dall'ingresso nella direzione della
  regola.
- Il range però comprende anche il pezzo contro: la candela va prima da
  una parte e poi dall'altra, oppure parte da un prezzo diverso da quello
  d'ingresso.
- Disegnata così, la zona sembra un target, ma **non è stata stimata come
  target**. Quante volte il prezzo la tocca non è mai stato misurato.
  Questa prova lo misura.

## Cosa si sa già, da dichiarare

- **H-X9**: un take profit fisso a 1R, 2R o 3R non batte la chiusura a
  fine M1. Il break even non è mai stato provato.
- **H-X40**: tenere fino a 5 minuti dà un po' di più sulla NFP nel 2014–19
  e nel 2020–26. Sul CPI non passa per centesimi. U5 si registra dal vivo
  da novembre (H-X13).
- Le NFP 2014–2026 sono già state viste. Il CPI fa da conferma. Un
  risultato positivo vale al massimo **"da registrare dal vivo"**.

## Il massimo previsto (la linea verde)

**Massimo vero di una release:**
- si entra alle 14:29:00 dal **lato giusto**, cioè nella direzione del
  primo minuto;
- si misura il punto più favorevole raggiunto entro la fine del primo
  minuto;
- prezzi S4, sul lato dove si chiude (bid per il LONG), costi d'ingresso
  compresi;
- in % del prezzo d'ingresso.

**Stima prima della release.** Stesso metodo della candela del sito
(EW3, H-X32):
- media esponenziale (halflife 3) della candela r1 delle release
  precedenti della stessa serie;
- moltiplicata per la mediana del rapporto massimo vero ÷ EW3 nelle 24
  release precedenti;
- così il prezzo la tocca, per costruzione, circa metà delle volte;
- storia dal 2011, prima dei trade del 2014;
- in pips: % × prezzo d'ingresso.

La linea verde sta a ingresso + direzione × massimo previsto.

**È calibrata se** il massimo vero la raggiunge fra il 40% e il 60% delle
volte sia nel 2014–19 sia nel 2020–26. È lo stesso criterio delle fasce
di H-X32.

## Il trade

Uguale al sito:
- regola H-X8;
- ingresso 14:29:00;
- stop H-X37;
- prezzi S4;
- tetto −1R;
- 148 NFP 2014–2026.

CPI: 150 release 2014–2026, stop 60 pips, linea verde del CPI calcolata
dalla storia del CPI.

**Regola D (di Davide)**, controllata tick per tick dall'ingresso:
1. **Stop**: se il prezzo di chiusura arriva allo stop, esci.
   - Slittamento come lo stop di oggi.
   - Dopo il break even lo stop è al prezzo d'ingresso.
2. **TP**: se il guadagno arriva alla linea verde, esci su quel tick.
   - Mezzo spread di slittamento più 0,5 bp, come i TP di H-X9.
3. **Break even**: se il guadagno arriva a **0,5R**, lo stop va al prezzo
   d'ingresso. Si controlla dopo stop e TP, sullo stesso tick.
4. **Tempo**: se non è successo niente, esci a **T0 + 5 min**.

Lo spostamento a break even è istantaneo, nel test. A mano ci vuole
almeno un secondo: la prova è ottimista su questo punto, e si dice.

**Griglia, per l'altopiano**, con TP alla linea verde:
- tempo massimo 2, 3, 5, 10 minuti;
- break even a 0,25R, 0,5R, 1R, oppure niente.

Se il migliore sta sul bordo, la griglia si estende e si dice:
- tempo a 10 minuti → si aggiungono 15;
- break even a 1R → si aggiunge 1,5R;
- break even a 0,25R → si aggiunge 0,1R.

**Per capire da dove viene il guadagno**, solo descrittivo:
- D senza break even;
- D senza TP;
- D col TP sulla linea arancione invece che sulla verde.

## Misure

- R a trade, NFP IS 2014–19, OOS 2020–26, ultimi 3 anni, tutto; CPI
  2014–26.
- Confronti: **U1** (sito, chiusura 14:31) e **U5** (H-X40, chiusura
  14:35).
- **Perdere di meno**:
  - quota di trade a −1R pieno;
  - quota chiusi a break even;
  - perdita media;
  - RR.
- **Anno per anno**:
  - quante volte il lato giusto tocca la linea verde e la arancione,
    entro 1 minuto ed entro 5;
  - R a trade di D, U1 e U5.

## Decisione

**La regola D funziona se:**
- ha l'R a trade più alto di U1 sia nell'IS 2014–19 sia nell'OOS
  2020–26;
- i quattro vicini fanno lo stesso: tempo 3 e 10 minuti, break even
  0,25R e 1R;
- sul CPI 2014–26 ha l'R a trade più alto di U1.

**È meglio della roba dei 5 minuti** se in più batte U5 sia nell'IS sia
nell'OOS.

Se funziona, si propone a Davide di registrarla dal vivo. Le regole del
trade sul sito cambiano solo se lui lo chiede.

**La linea verde va sul sito**, perché Davide l'ha chiesta, solo se è
calibrata. In quel caso:
- nel replay, accanto alla zona arancione;
- il massimo previsto della prossima NFP, nella parte in alto.

Se non è calibrata, si dice e non si mette.
