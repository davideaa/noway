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

## Risultati (dopo il commit `0af6ec1`)

File: `research_output/phase2/hx16/hx41_be_tp.json`.
- 148 NFP e 150 CPI.
- Controlli:
  - senza TP e senza break even, a 1 minuto, la regola coincide con U1;
  - il massimo vero coincide con quello di `trade()`;
  - U1 e U5 sono gli stessi di H-X40.

**Correzione dichiarata.** La prima esecuzione aveva 147 NFP: mancava
quella del 02/10/2026, che non è nel dataset delle candele. Aggiunta con
la candela r1 calcolata dai tick, come fa H-X32 per le NFP recenti. Con
lei o senza, la conclusione non cambia. I numeri qui sotto sono con 148.

### La linea verde (massimo previsto) è calibrata

Il lato giusto la raggiunge entro il primo minuto:

| | Linea verde | Zona arancione (linea centrale) |
|---|---|---|
| NFP 2014–19 | **45,7%** | — |
| NFP 2020–26 | **47,4%** | — |
| NFP tutto, entro 1 minuto | 46,6% | **33,1%** |
| NFP tutto, entro 5 minuti | 57,4% | 43,2% |
| CPI 2014–19 / 2020–26 | 52,1% / 51,9% | — |

- Il massimo vero è in mediana il **71%** della linea arancione.
- **La zona arancione disegnata dall'ingresso è raggiunta solo una volta
  su tre**: come target era troppo lontana. Davide aveva ragione.
- Per la regola scritta, la linea verde va sul sito.
- Prossima NFP: massimo previsto **0,616% del prezzo**, circa 255 pips a
  4.142 $. La candela prevista è di circa 360 pips.

### La regola D non funziona

R a trade, prezzi S4, tetto −1R. Righe "D": TP alla linea verde.

| | U1 (14:31) | U5 (14:35) | **D**: BE 0,5R + TP verde + 5 min | D senza BE | Solo BE, senza TP | BE + TP arancione |
|---|---|---|---|---|---|---|
| NFP IS 2014–19 | +0,060 | +0,092 | **−0,029** | −0,019 | +0,025 | +0,027 |
| NFP OOS 2020–26 | +0,370 | +0,458 | **−0,048** | +0,132 | +0,251 | +0,162 |
| NFP ultimi 3 anni | +0,748 | +0,937 | **+0,182** | +0,340 | +0,769 | +0,370 |
| CPI 2014–26 | −0,257 | −0,270 | **−0,290** | −0,307 | −0,254 | — |

Griglia completa con TP verde, valori IS / OOS:

| Tempo massimo | BE 0,25R | BE 0,5R | BE 1R | Senza BE |
|---|---|---|---|---|
| 2 min | −0,064 / −0,047 | −0,066 / −0,032 | −0,013 / +0,092 | −0,025 / +0,100 |
| 3 min | −0,047 / −0,048 | −0,051 / −0,038 | −0,013 / +0,083 | −0,025 / +0,110 |
| 5 min | −0,016 / −0,056 | −0,029 / −0,048 | −0,007 / +0,094 | −0,019 / +0,132 |
| 10 min | −0,024 / −0,070 | −0,043 / −0,064 | −0,038 / +0,067 | −0,049 / +0,111 |

- **Nessuna casella batte U1** (+0,060 / +0,370), nemmeno da lontano.
- Il migliore è "5 min, senza BE": non sta sul bordo, la griglia non si
  estende.
- Per la regola scritta, D **non funziona** e non batte U5.

**Perdere di meno, NFP 2014–26:**

| | U1 | D |
|---|---|---|
| Trade a −1R pieno | 49,3% | 48,0% |
| Perdita media | 0,95 | 0,85 |
| Trade in guadagno | 45,9% | **35,1%** |

D perde un po' meno quando perde, ma vince molto meno spesso e molto meno.

**Da dove viene la perdita.** Descrittivo, `scripts/hx41_be_quando.py`,
dopo i risultati.

- **Il TP alla linea verde taglia i trade grossi.** Il guadagno della
  regola viene da poche NFP che vanno molto oltre la mediana, come il
  2026. Chiudere alla mediana le perde.
- **Il break even fa uscire dai trade buoni.**
  - Scatta in 80 NFP su 148, in 70 casi entro 10 secondi dalla news.
  - Dopo la spinta il prezzo torna indietro (la wick) e lo spread è
    ancora largo, e in 36 NFP riporta il prezzo all'ingresso:
    - 13 entro 10 secondi;
    - 9 fra 10 e 60 secondi;
    - 14 dopo il primo minuto.
  - Chiuse alle 14:31, quelle 36 avrebbero fatto in media **+0,33R**, e 23
    su 36 in guadagno.

**Anno per anno.** Quante volte il lato giusto tocca la linea, entro 1
minuto; R a trade.

| Anno | Verde (pips, mediana) | Tocca verde | Tocca arancione | U1 | D |
|---|---|---|---|---|---|
| 2014 | 84 | 27% | 18% | +0,17 | +0,40 |
| 2015 | 73 | 36% | 27% | +0,18 | +0,24 |
| 2016 | 73 | 58% | 42% | +0,03 | −0,39 |
| 2017 | 48 | 25% | 17% | +0,11 | −0,00 |
| 2018 | 34 | 58% | 33% | +0,10 | +0,08 |
| 2019 | 31 | 67% | 50% | −0,21 | −0,44 |
| 2020 | 43 | 33% | 8% | −0,53 | −0,61 |
| 2021 | 48 | 73% | 55% | +0,39 | −0,17 |
| 2022 | 49 | 50% | 42% | +0,08 | −0,24 |
| 2023 | 81 | 36% | 27% | +0,54 | +0,17 |
| 2024 | 131 | 42% | 25% | +0,68 | +0,30 |
| 2025 | 108 | 36% | 27% | +0,09 | −0,14 |
| 2026 | 186 | 67% | 67% | +1,67 | +0,48 |

**Decisione.**
- Il trade resta com'è: chiusura alle 14:31, niente TP, niente break even.
- La linea verde va sul sito come informazione, cioè dove arriva il
  prezzo metà delle volte, **con scritto che usarla come TP fa peggio**.
