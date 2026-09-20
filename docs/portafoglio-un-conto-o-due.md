# Oro + Nasdaq: un conto o due, e con quale rischio

Decisione presa il 2026-09-20. Report: `report/un-conto-o-due.pdf`,
generato da `tools/report_uno_o_due.py`.

## La domanda

Nel report precedente (`portafoglio-oro-nasdaq.pdf`) le due strategie
"insieme a peso pieno" davano +4572% composto contro il +644% di "meta'
peso". Davide ha fatto notare che non tornava: se tenerle separate rende
meno, metterle insieme dovrebbe rendere di piu', ma non sette volte.

**Aveva ragione, e l'errore era mio.**

## L'errore

"Insieme a peso pieno" non e' "insieme": e' **rischiare il doppio**. Due
strategie su un conto solo, ognuna che dimensiona sul totale, mettono a
rischio 0,70% + 1,50% = 220 EUR su 10.000. Due conti da 5.000 ne
rischiano 35 + 75 = 110. Esattamente il doppio. Quel confronto misurava
la leva, non la diversificazione.

## A parita' di soldi rischiati

| | rendimento | drawdown |
|---|---|---|
| due conti da 5.000, rischio fisso | +209,3% | 17,57% |
| un conto da 10.000 a meta' peso, rischio fisso | **+209,3%** | **17,57%** |
| due conti da 5.000, composto | +636,7% | 17,23% |
| un conto da 10.000 a meta' peso, composto | +643,6% | 16,78% |

A rischio fisso sono **identiche al decimale**, ed e' un'identita'
matematica, non una coincidenza: la somma e' associativa. Il codice lo
verifica con un `assert` che fa fallire la generazione del report se le
due non coincidono.

Col composto il conto unico vince di 6,9 punti in sette anni, perche'
l'insieme oscilla meno e paga meno attrito da oscillazione. Due punti
l'anno: **non e' un motivo per scegliere.**

## Dove sta davvero il guadagno della diversificazione

Non nel rendimento: nel drawdown. Correlazione mensile **+0,075** su 85
mesi. Se le due sofferenze si sommassero, meta' per uno, il drawdown
sarebbe 22,7%; e' 16,8%.

Il rendimento si incassa **dopo**, alzando il rischio fino a tornare
alla sofferenza di prima. Ma il confronto "a parita' di drawdown" da'
due risposte opposte a seconda di come si misura il drawdown:

| soglia 25% | solo oro | solo nasdaq | INSIEME |
|---|---|---|---|
| sul DD **del backtest**, composto | +329% | +1.940% | +2.027% |
| sul DD **vero** (bootstrap 95%), composto — mediana | +144% | +418% | **+891%** |
| sul DD vero, scenario sfortunato (5%) | +42% | +168% | **+354%** |

Con il drawdown del backtest l'insieme pareggia col nasdaq da solo, e
spostando la soglia di qualche punto il vincitore cambia: risultato
fragile. Il motivo e' che **il drawdown del backtest e' un solo tiro di
dadi**, e il nasdaq in quei sette anni ne ha pescato uno fortunato.

Col drawdown misurato sul bootstrap l'insieme stacca nettamente, e
soprattutto raddoppia lo scenario sfortunato. E' li' che si incassa la
diversificazione: non nella media, nella tenuta del peggio.

## Il 4572% non e' sbagliato, e' inutile

Bootstrap a blocchi, 8.000 storie, peso pieno:

| | 5% | mediana | 95% | forbice |
|---|---|---|---|---|
| rischio fisso | +277% | +419% | +561% | 2,0x |
| composto | +1.059% | +4.592% | +19.025% | **18x** |

Il backtest (+4.573%) e' praticamente sulla mediana. Il problema non e'
la mediana: e' che il suo intorno copre un ordine di grandezza.
**Si pianifica sul rischio fisso. Il composto e' quello che succede,
non quello che si promette.**

## Una cosa che avevo detto e che il Monte Carlo ha smentito

Avevo scritto che col composto l'ordine delle operazioni sposta anche il
punto d'arrivo. **E' falso.** La permutazione da' sempre lo stesso
risultato finale, a rischio fisso come col composto: sommare o
moltiplicare gli stessi numeri in ordine diverso da' lo stesso risultato.
L'ordine sposta solo il drawdown. Il punto d'arrivo cambia solo quando il
ricampionamento cambia anche la **composizione** (IID, blocchi,
stazionario, che ripescano con rimpiazzo). Corretto in
`tools/montecarlo_portafoglio.py`.

## Decisione

- **Un conto solo**, per adesso, in demo su Fusion. Serve proprio a
  vedere se le due si pestano i piedi, e su due conti quell'informazione
  non si ottiene. Dividere in due ha senso dopo, quando il rischio da
  coprire non e' piu' la strategia ma il broker.
- **Rischio: quello che c'e' gia' nel codice** (oro 0,70%, nasdaq 1,50%
  base). Drawdown vero atteso al 95o percentile, a rischio fisso:
  **29,6%**. A meta' peso sarebbe 16,8%, a 1,43x sarebbe 39,6%.
- Il rischio **non e' stato modificato in nessuno dei due EA**: il
  "peso" e' solo un moltiplicatore dentro la simulazione in Python.

## Cosa questo NON dimostra

- Le due non sono mai girate insieme dentro MetaTrader: il tester prende
  un simbolo alla volta. Questa e' la fusione esatta di due backtest
  separati — giusta sui rendimenti e sul drawdown, **muta su esecuzioni
  in contesa e ordini rifiutati**. Solo la demo in avanti risponde.
- Il nasdaq e' la gamba meno verificata: il test del plateau
  (`docs/nas100-parametri.md`) non e' ancora stato fatto.
- Tutti i numeri vengono da PU Prime.
