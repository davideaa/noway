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
