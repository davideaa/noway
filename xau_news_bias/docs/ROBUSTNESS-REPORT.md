# Robustezza (fase 2)

Il compito, come chiedeva il prompt, era **provare a rompere** qualunque
risultato promettente. Non è servito molto: niente ha passato il test
principale. Questo file riporta comunque tutte le prove, perché dicono
**quanto** manca e **perché**.

Numeri: `p2_validation.json`, `validation_tests.csv`, `p2_summary.json`
(`scenario_tests`), `nfp_rule_neighbors.csv`.

## 1. Costi e slittamento

R medio degli **stessi trade** fuori campione, per scenario di costo, e p di
Holm (m = 5 nel finale NFP, m = 12 nella validazione CPI):

| Test | Periodo | Optimistic (nessun costo) | Base | Conservative | Stress |
|---|---|---|---|---|---|
| Modello NFP | NFP finale | +0,73 (Holm 0,24; p 0,047) | +0,50 (0,66) | 0,00 (1,00) | −0,57 |
| Modello condiviso | NFP finale | +0,77 (0,83) | +0,63 (1,00) | +0,40 (1,00) | +0,06 |
| NFP-1 | NFP finale | +0,24 | +0,02 | −0,30 | −0,60 |
| NFP-2 | NFP finale | +0,22 | −0,03 | −0,31 | −1,24 |
| NFP-3 | NFP finale | +0,36 | +0,15 | −0,13 | −0,60 |
| Modello CPI | CPI 2020–26 | −0,06 | −0,41 | −1,04 | −1,80 |
| Modello condiviso | CPI 2020–26 | +0,40 | +0,11 | −0,13 | −0,82 |
| CPI-1…5 | CPI 2020–26 | da −0,94 a +0,19 | da −1,17 a −0,07 | da −1,59 a −0,59 | da −2,57 a −1,20 |
| Condivise 1…5 | CPI 2020–26 | da −0,70 a +0,06 | da −1,09 a −0,22 | da −1,57 a −0,55 | da −2,29 a −1,46 |

- **Anche con costi zero nessun test passa la correzione di Holm.** L'unico
  p nominale sotto 0,05 (modello NFP senza costi, 0,047) diventa 0,24.
- Passare da costi base a conservative toglie da **0,2 a 0,65 R** per
  trade. Il trade sulla prima M1 è molto sensibile allo slittamento: uno
  spread in più all'ingresso e all'uscita basta ad azzerare qualunque
  risultato visto fin qui.
- I costi reali dipendono dal broker. Dukascopy ha spread stretti. I
  broker retail nel minuto della news allargano molto di più: lo scenario
  realistico per un conto retail è fra conservative e stress.

## 2. Larghezza dello stop (k × U_news, stesse decisioni)

| Test | 0,42 | 0,51 | 0,60 | 0,69 | 0,78 |
|---|---|---|---|---|---|
| Modello NFP | +0,56 | +0,35 | +0,50 | +0,42 | +0,34 |
| Modello condiviso (NFP) | +0,92 | +0,73 | +0,63 | +0,52 | +0,40 |
| NFP-1 | +0,07 | 0,00 | +0,02 | −0,01 | −0,01 |
| NFP-3 | +0,28 | +0,17 | +0,15 | +0,12 | +0,10 |
| Modello CPI | −1,07 | −0,60 | −0,41 | −0,27 | −0,23 |

I modelli NFP restano positivi su tutta la griglia ±30%: è l'unico
criterio della classe ROBUST che soddisfano. Non basta, perché il test
principale (Holm p < 0,05) non è passato.

## 3. Momento dell'ingresso

| Test | T−30 s | T−10 s | T−5 s |
|---|---|---|---|
| Modello NFP | +0,24 | +0,50 | +0,50 |
| NFP-3 | +0,20 | +0,15 | +0,14 |
| Modello CPI | −0,35 | −0,41 | −0,65 |

Il modello NFP perde metà del risultato entrando 20 secondi prima: segno
di fragilità, non di un effetto stabile.

## 4. Dipendenza da pochi eventi e da anni particolari

| Test | Quota dell'R totale dell'anno migliore | Senza il 2020 | Senza il 2022 | Senza 2020 e 2022 |
|---|---|---|---|---|
| Modello NFP | **81%** (2026) | +0,54 | +0,75 | +0,83 |
| Modello condiviso (NFP) | oltre il 100% (2026) | +0,63 | +1,54 | +1,54 |
| NFP-1 | oltre il 100% (2026) | +0,16 | +0,11 | +0,30 |
| NFP-3 | 291% (2026) | +0,41 | +0,37 | +0,87 |

Togliere il 2020 (COVID) o il 2022 (rialzo dei tassi) **migliora** i
risultati NFP: non dipendono da quegli anni. Dipendono dal 2026.

"Oltre il 100%" vuol dire che senza quell'anno il totale è negativo. Una
sola release (NFP del 4 settembre 2026, oro −70 $ nel primo minuto, +5,0 R
per chi era SHORT) compare in tutti e tre i test. Il criterio ROBUST
("nessun anno oltre il 50% dell'R totale") fallisce per tutti.

## 5. Incertezza: intervalli bootstrap dell'R medio (95%)

| Test | Intervallo |
|---|---|
| Modello NFP | da −0,31 a +1,35 |
| Modello condiviso (NFP) | da −0,81 a +2,35 |
| NFP-1 | da −0,95 a +1,25 |
| NFP-3 | da −0,58 a +1,08 |
| Modello CPI | da −0,95 a +0,20 |
| CPI-4 | da −1,54 a −0,58 |
| Condivisa 1 (CPI) | da −1,62 a −0,51 |

Con 7–26 trade l'incertezza è enorme. Tutti gli intervalli dei test "meno
peggio" contengono lo zero; alcune regole CPI hanno un intervallo tutto
sotto zero.

## 6. Vicini dei parametri (le regole NFP)

`nfp_rule_neighbors.csv`: ogni regola NFP rifatta con 1, 2 o 3 delle sue
condizioni.

| Regola | Singole (t in scoperta) | Coppie | Terna | Terna nel finale |
|---|---|---|---|---|
| NFP-1 | −1,44 / −0,47 / +0,12 | −0,26 / +1,80 / +2,55 | **+7,36** | +0,04 |
| NFP-2 | −0,93 / −0,35 / −0,53 | +0,71 / +1,00 / +2,40 | **+6,58** | −0,06 |
| NFP-3 | −0,35 / +0,12 / −1,28 | +2,07 / +0,46 / +1,48 | **+6,50** | +0,34 |

Nessuna altura: tutto il valore sta nell'intersezione esatta di 15
release. È la firma del sovradattamento, e si vedeva già in scoperta.
**Lezione per le prossime fasi**: aggiungere alla selezione dei candidati
un requisito di altopiano (le coppie devono già essere buone). Va
pre-registrato **prima** di una nuova ricerca, non applicato adesso a
posteriori.

## 7. Controllo della ricerca massiva

| Gruppo | Ipotesi | Miglior t | Mediana del massimo per caso | p familywise |
|---|---|---|---|---|
| CPI | 1.622.027 | 2,80 | 3,02 | 0,77 |
| NFP | 1.558.481 | 7,36 | 5,54 | **0,011** |
| Condiviso | 1.478.986 | 2,70 | 2,72 | 0,53 |

- La q di Benjamini-Hochberg (informativa) è 1,00 per tutte le ipotesi.
  Con 1,5 milioni di test, anche t = 7 non basta con una correzione che
  assume test indipendenti.
- Il Reality Check a permutazioni tiene conto della dipendenza fra le
  ipotesi (le condizioni sono correlate) ed è la correzione giusta qui.
  L'NFP-1 l'aveva superata, e il test finale l'ha smentita. Se non
  esistesse nessun vantaggio, la probabilità che almeno uno dei tre gruppi
  mostri un p così piccolo (0,011) sarebbe circa il 3%: raro, non
  impossibile. Per questo il protocollo non si fidava della scoperta e
  aveva tenuto da parte il test finale.

## 8. Classificazione finale dei test

| Test | Holm finale < 0,05 | Conservative > 0 | Stop ±30% > 0 | Nessun anno > 50% | ≥ 20 trade | Classe |
|---|---|---|---|---|---|---|
| Modello NFP | no (0,66) | no (0,00) | sì | no (81%) | sì (24) | NO EVIDENCE |
| Modello condiviso | no (1,00) | sì (+0,40) | sì | no | no (7) | NO EVIDENCE |
| NFP-1 | no (1,00) | no | no | no | no (11) | WEAK (smentita) |
| NFP-2 | no (1,00) | no | no | — | no (8) | WEAK (smentita) |
| NFP-3 | no (1,00) | no | sì | no | no (14) | WEAK (smentita) |

**Nessun candidato è ROBUST OOS EDGE. Verdetto: NO RELIABLE EDGE.**
