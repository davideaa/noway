# H-X45 — Scegliere lo stop con una regola, usando solo il passato (pre-registrata)

Scritta il 20/10/2026 **prima** di calcolare.

## Domanda di Davide

> «C'è una formula matematica per capire qual è il miglior stop da usare?
> A livello discrezionale ci arrivo. Farmi vedere quali sarebbero stati i
> risultati decidendo prima, senza vedere i risultati dopo, sarebbe una
> conferma in più.»

## Il problema

In H-X44 ho guardato tutti gli anni insieme e poi ho detto "B37 × 1,2 è il
compromesso migliore". Ma è una scelta fatta **dopo** aver visto i
risultati.

La prova onesta è un'altra:
- a ogni NFP una **regola fissa**, scritta oggi, sceglie lo stop guardando
  solo le NFP già passate;
- poi si guarda come sarebbe andata seguendola.

Se la regola guadagna come la scelta fatta col senno di poi, la scelta
regge.

## Gli stop fra cui scegliere

Sono i 20 stop di H-X44:
- basi B37, Q70, Q80, Q90;
- margini × 1,0, 1,1, 1,2, 1,3, 1,5.

Ogni stop è già calcolato NFP per NFP solo con dati di prima. I risultati
trade per trade sono in `research_output/phase2/hx16/hx44_stop_margine.json`.

## Le regole

Prima di ogni NFP si guardano le **W NFP precedenti**.

| Regola | Come sceglie |
|---|---|
| **M24** (principale) | lo stop con l'R a trade più alto nelle 24 NFP precedenti (2 anni) |
| M12, M36 | uguale, con 12 e 36 NFP (vicini, per l'altopiano) |
| **S24** (sicura) | fra gli stop che nelle 24 NFP precedenti hanno salvato almeno l'80% delle NFP giuste, quello con l'R a trade più alto; se nessuno, quello che ha salvato di più |

A parità vince lo stop più stretto, nell'ordine B37, Q70, Q80, Q90 e
margine crescente.

## Misure

- Le regole partono quando hanno almeno W NFP alle spalle.
- Il confronto si fa sulle **stesse NFP** per tutti.
- R a trade della regola, contro:
  - lo stop di oggi (B37 × 1,0);
  - B37 × 1,2;
  - lo stop migliore scelto col senno di poi sullo stesso periodo.
- Periodi:
  - dal 2016, la prima NFP con 24 alle spalle;
  - IS 2016–19;
  - OOS 2020–26;
  - ultimi 3 anni.
- Quante volte la regola sceglie ogni stop.
- Lo stop che la regola sceglierebbe **per la prossima NFP**.

**Formula del confronto fra due stop A e B** (t appaiata):
- d = R(A) − R(B), trade per trade;
- t = media(d) ÷ (deviazione standard(d) ÷ √n).
- Con |t| sotto 2 la differenza può essere caso.
- Si calcola per B37 × 1,2 contro B37 × 1,0 e per la regola M24 contro
  B37 × 1,0.

## Decisione

**La regola M24 conferma la scelta** se:
- ha l'R a trade più alto dello stop di oggi sia nell'IS 2016–19 sia
  nell'OOS 2020–26;
- anche M12 e M36 lo hanno: altopiano.

**Se conferma**, sul sito va lo stop scelto da M24 per la prossima NFP, e
a ogni NFP lo sceglie di nuovo la regola, da confermare dal vivo.

**Se no**, si dice. La scelta resta a Davide, con i numeri di H-X44.

## Risultati (dopo il commit `2426b98`)

File: `research_output/phase2/hx16/hx45_scelta_stop.json`.

R a trade sulle stesse NFP. "Senno di poi" = lo stop migliore scelto
guardando quel periodo.

| | 2016–19 | 2020–26 | Ultimi 3 anni | Tutto dal 2016 |
|---|---|---|---|---|
| **M24** (sceglie il migliore degli ultimi 2 anni) | −0,023 | +0,268 | +0,502 | +0,160 |
| M12 | −0,066 | +0,350 | +0,581 | +0,191 |
| M36 | +0,008 | +0,270 | +0,496 | +0,190 |
| S24 (la più sicura che salva l'80%) | −0,051 | **+0,465** | +0,902 | **+0,274** |
| Stop di oggi B37 × 1,0 | **+0,031** | +0,368 | +0,744 | +0,243 |
| B37 × 1,2 (Davide) | −0,030 | +0,452 | **+0,951** | +0,273 |
| Senno di poi | +0,031 (B37 × 1,0) | +0,458 (B37 × 1,1) | +0,994 (B37 × 1,1) | +0,296 (Q70 × 1,1) |

Nella colonna 2016–19, M12 e M36 sono confrontate sulle NFP che hanno a
disposizione: lo stop di oggi lì fa +0,007 e +0,042.

**Verdetto: la regola M24 non conferma.**
- Scegliere ogni volta lo stop andato meglio negli ultimi 2 anni fa
  **peggio** che tenere fisso lo stop di oggi, in tutti i periodi.
- Lo stesso vale con 12 e 36 NFP.
- Lo stop migliore del passato recente non è quello migliore per la NFP
  dopo: inseguirlo è adattarsi al rumore.
- S24 fa meglio dal 2020 ma peggio nel 2016–19.

**t appaiata.**

| Confronto | n | Differenza media | t |
|---|---|---|---|
| B37 × 1,2 − B37 × 1,0, tutto | 148 | +0,014 R | **0,18** |
| B37 × 1,2 − B37 × 1,0, 2020–26 | 78 | +0,084 R | **0,58** |
| M24 − B37 × 1,0 | 124 | −0,083 R | −1,41 |

- **La differenza in R fra lo stop di oggi e quello col 20% in più è
  dentro il caso**: t 0,18 su tutto, 0,58 dal 2020, mentre servirebbe
  almeno 2.
- Quello che cambia davvero è la sicurezza: dal 2020 salva l'85% delle NFP
  giuste contro il 75%.
- Per la prossima NFP tutte le regole sceglierebbero B37 × 1,1 (~73
  pips).

**Lettura.**
- Nessuna formula, applicata solo col passato, trova uno stop che
  guadagna di più in modo provato.
- Fra lo stop di oggi e quello col 20% in più la matematica non vede una
  differenza di guadagno, ma vede una differenza di rischio.
- La scelta si fa quindi sulla sicurezza, ed è di Davide.
