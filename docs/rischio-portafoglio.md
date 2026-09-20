# Quanto rischiare su oro + nasdaq insieme

Decisione del 2026-09-20. Report: `report/quanto-rischiare.pdf`,
generato da `tools/report_rischio_portafoglio.py`.

## Il vincolo, posto da Davide

Conto da 10.000, le due strategie insieme, **drawdown sotto il 35%**
nella grande maggioranza dei casi. Letto sul Monte Carlo, non sul
backtest. Il rischio va scalato **in proporzione su tutte le gambe**,
non su una sola.

## Due scelte di metodo

**1. Due scenari, e si decide sul peggiore.**
Il 2024-2026 e' stato un boom e va isolato:

| | oro | nasdaq | operazioni |
|---|---|---|---|
| tutto 2019.09-2026.09 (7,03 anni) | +16,1 bp/op | +17,0 bp/op | 2.520 |
| calmo 2019.09-2023.12 (4,32 anni) | **+9,9 bp/op** | **+14,5 bp/op** | 1.535 |

Nel periodo calmo l'oro rende il **61%** di quanto rende sulla media
totale. Pianificare sulla media col boom dentro vuol dire scommettere
che il boom si ripeta.

**2. Stesso orizzonte per tutti e due.**
Un drawdown misurato su 4,32 anni e' per forza piu' piccolo di uno
misurato su 7,03: ha meno occasioni di incolonnare le perdite. Il
periodo calmo viene quindi ricampionato fino a coprire sette anni
(x1,628). Senza questa correzione lo scenario prudente sembrerebbe
falsamente tranquillo. Implementato in `_allunga()` dentro
`tools/montecarlo_portafoglio.py`.

## L'errore che ha fatto scattare tutto

I due backtest sono girati a **oro 1,00%** e **nasdaq 1,50%**. Nel
codice c'era oro 0,70% e nasdaq 1,50%: l'oro gia' a x0,70 del suo test,
il nasdaq a x1,00. **Non erano proporzionali**, e in una tabella
precedente avevo etichettato i pesi come se lo fossero.

## Il risultato

Bootstrap a blocchi da 20, 12.000 storie per riga, ogni gamba
ricampionata a parte e poi rifusa, orizzonte sempre 7 anni.

| oro / nasdaq | CALMO: mediana | DD 90% | DD 95% | TUTTO: mediana | DD 95% |
|---|---|---|---|---|---|
| 0,60% / 0,90% | +491% | 27,8% | 30,9% | +995% | 26,2% |
| **0,70% / 1,05%** | **+676%** | **31,7%** | **35,3%** | **+1.494%** | **29,9%** |
| 0,78% / 1,18% | +872% | 34,9% | 38,8% | +2.079% | 33,0% |
| 0,80% / 1,20% | +912% | 35,5% | 39,4% | +2.206% | 33,5% |
| 1,00% / 1,50% | +1.590% | 42,6% | 47,0% | +4.620% | 40,3% |

**Scelto x0,70: oro 0,70%, nasdaq 1,05%.** Sull'oro non cambia niente,
cambia solo il nasdaq (da 1,50 a 1,05).

Davide aveva proposto x0,80 guardando la colonna di tutto il periodo
(DD 95% 33,5%, dentro il tetto). Nello scenario calmo lo stesso rischio
da' **39,4%** al 95o percentile e 45,9% al 99o: fuori dal tetto che
aveva posto lui. Il massimo difendibile leggendo il tetto al 90o
percentile e' x0,78 — anche cosi' x0,80 resta appena fuori.

## Due cose imparate

**Il "rapporto ottimale" non esiste in questo intervallo.** CAGR mediano
diviso DD 95% sale monotonicamente col rischio (0,845 a x0,30 fino a
1,120 a x1,20) e continua a salire ben oltre qualunque drawdown
sopportabile. Nessuna formula dice quanto rischiare: lo decide solo il
drawdown che si e' disposti ad attraversare.

**I numeri sono stabili.** Cinque semi, 12.000 storie ciascuno:
il DD 95% si muove di ±0,11 punti percentuali. Non sono numeri rumorosi.

## La lettura sobria

A rischio fisso (lotto costante, niente reinvestimento) la stessa
impostazione da' una mediana molto piu' bassa e un drawdown molto piu'
contenuto. E' la lettura da usare per fare i piani; il composto e'
quello che succede, non quello che si promette.

## Cosa non e' dimostrato

- Il bootstrap rimescola le **stesse** operazioni: misura la variabilita'
  del percorso dato che il vantaggio esista, non se esista.
- Le due strategie non sono mai girate insieme dentro MetaTrader (il
  tester prende un simbolo alla volta): esecuzioni in contesa e ordini
  rifiutati non sono simulati.
- Il fuori campione dell'oro e' gia' speso; il plateau del nasdaq non e'
  ancora stato fatto.
- L'arrotondamento del lotto non e' simulato: su 10.000 allo 0,70% il
  rischio vero puo' scostarsi di qualche punto percentuale.

---

## Aggiornamento: tetto stretto al 33%

Davide ha poi stretto il vincolo da 35% a **33%** al 95o percentile,
sempre sullo scenario magro. Risposta: **oro 0,65% e nasdaq 0,98%**
(x0,65), che da' 32,9% nel periodo magro e 28,1% su tutto.

Sperava che con quel drawdown venisse un rendimento intorno al
1300-1400%. Le due cose non stanno insieme:

| | oro / nasdaq | mediana magra | DD 95% magro |
|---|---|---|---|
| tenere il drawdown al 33% | 0,65% / 0,98% | +576% | 32,9% |
| avere il +1.350% comunque | 0,93% / 1,40% | +1.350% | 44,0% |

Il +1.222% che ricordava e' la mediana dello scenario **col boom
dentro**, non quella prudente. Report: `report/la-scelta.pdf`.

## La curva storica vera a quei rischi

`report/curva-reale.pdf`, da `tools/report_curva_reale.py`. Non e' una
simulazione: e' la sequenza delle 2.520 operazioni riscalate.

| | |
|---|---|
| da 10.000 a | **132.328** in 7,03 anni |
| rendimento | **+1.223,3%** (44,4% l'anno) |
| drawdown massimo | **21,33%** |
| tempo sotto il massimo | 90% |
| mesi in utile | 68% su 85 |
| operazioni in utile | 49,5% su 2.520 |

**Il percorso e' stato fortunato.** Il Monte Carlo dice 28,1% di
drawdown al 95o percentile; questa storia ne ha pescato uno del 21,3%.
Il rendimento invece e' tipico: +1.223% contro la mediana simulata di
+1.222% sul periodo intero. Il drawdown da mettere a bilancio resta il
28,1%, non il 21,3%.

**Col composto i due rendimenti si moltiplicano, non si sommano.**
Oro da solo +179% (fattore 2,7882), nasdaq da solo +375% (4,7459),
insieme 2,7882 x 4,7459 = 13,2328 cioe' +1.223,3%. La generazione del
report fallisce con un assert se quel prodotto non torna.

Drawdown: oro da solo 17,79%, nasdaq 12,80%; sommati farebbero 30,59%,
l'insieme e' 21,33%. Correlazione mensile +0,067 su 85 mesi.
