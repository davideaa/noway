# Stato del progetto — da leggere per primo

Ultimo aggiornamento: settembre 2026. Tutto quello che c'è qui è stato
misurato; dove è una stima, è scritto.

---

# 1. Dove siamo arrivati

**`mt5/V1XAU_TrendFollowing.mq5`** — due strategie, entrambe trend
following ma su momenti e orizzonti diversi.

### ROTTURA (Donchian, M30, magic base+3)
Il prezzo chiude oltre il massimo o il minimo delle ultime 60 barre M30,
è già al bordo del suo intervallo a 480 barre, e la volatilità è in
espansione. Entra nella direzione dello sfondamento. **Nessun take
profit**: trailing a 4,0 ATR attivato a +1R.

| Parametro | Valore | Come è stato scelto |
|---|---|---|
| Range di contesto | 480 barre | dalla card |
| Canale di rottura | 60 barre | dalla card |
| Posizione nel range | **0,91** | trovato, plateau 0,91–0,93 |
| ATR veloce / lento | 14 / 50 | default |
| Filtro espansione | 0,70 (di fatto spento) | misurato ininfluente |
| Stop | 2,0 ATR | dalla card |
| **Take profit** | **0 = nessuno** | **contraddice la card**, che dichiara 2,5R |
| Trailing | +1R, 4,0 ATR | trovato, plateau 3–6 |

### RITRACCIAMENTO (pullback, H4, magic base+2)
Trend stabilito (prezzo sopra EMA30 e EMA inclinata), il prezzo ritraccia
di almeno 1 ATR dal massimo delle ultime 20 barre, poi riparte chiudendo
sopra il massimo della barra precedente. Stop sotto il minimo del
ritracciamento. Nessun take profit, trailing 1,5 ATR.

| Parametro | Valore | Come è stato scelto |
|---|---|---|
| EMA di trend | **30** | trovato, collina 30–40 |
| Barre pendenza | 3 | default |
| Barre swing | 20 | fisso |
| Ritracciamento minimo | 1,0 ATR | misurato ininfluente |
| **Buffer stop** | **0,10 ATR** | vedi avvertenza sotto |
| Trailing | +1R, **1,5 ATR** | trovato, collina interna |
| Attesa dopo ingresso | 3 barre | fisso |

> **Avvertenza sul buffer di stop.** L'ottimizzazione lo vuole a 0,05,
> e più si abbassa meglio va — fino al bordo della griglia. È stato messo
> a 0,10 apposta: 0,05 ATR sull'oro valgono poco più dello spread, e uno
> stop appoggiato esattamente sul minimo è dove il mercato va a prendere
> gli stop. Costa circa il 16% del profitto di backtest. **Non
> riabbassarlo.**

## Rischio

Default **0,70%**. Il Monte Carlo a blocchi dice:

| Rischio | 90% degli scenari sotto | 99° percentile |
|---:|---:|---:|
| 0,70% | 26% | 35% |
| **1,05%** (su `.p`) | **35%** | 49% |
| 0,98% (su `.s`) | 35% | — |

Davide ha posto come tetto **35% al 90° percentile**. Non superarlo
senza che lo chieda lui.

---

# 2. I numeri

XAUUSD, 2019.01–2026.09, 7,7 anni, tick reali, ritardo 103 ms.

| | XAUUSD.p | XAUUSD.s |
|---|---:|---:|
| Operazioni | 1.122 | 1.123 |
| Punti R | 191,9 | 167,7 |
| Guadagno medio per operazione | +0,1710 R | +0,1494 R |
| Profit factor | 1,33 | 1,30 |
| Operazioni vincenti | 42,3% | 42,0% |

Dentro e fuori campione, **a lotto fisso** (senza composto, perché con
il composto il secondo periodo parte da un conto più grande e il
confronto non dice niente):

| | Trade | Punti R | Guadagno medio | PF | Annuo |
|---|---:|---:|---:|---:|---:|
| 2019–2023 costruzione | 709 | 86,4 | +0,1219 | 1,23 | 18,1% |
| **2024–2026 mai visto** | **413** | **105,5** | **+0,2554** | **1,53** | **40,9%** |

**Va meglio fuori che dentro, e non è una buona notizia**: il 2024–2026
è stato un periodo eccezionale per l'oro. Il numero da usare per il
futuro è **il più basso dei due**, non il più alto.

## I criteri del fuori campione, dichiarati prima

| Criterio | Soglia | Ottenuto | |
|---|---:|---:|---|
| Guadagno medio | ≥ +0,050 R | +0,2554 R | PASSA |
| Profit factor | ≥ 1,10 | 1,526 | PASSA |
| Perdita massima (a 0,60%) | ≤ 27,4% | 8,26% | PASSA |

## Quando funziona e quando no

| Cosa fa l'oro nel mese | Mesi | R al mese |
|---|---:|---:|
| Forte discesa (< −3%) | 8 | **+2,15** |
| Discesa lenta (−3…−0,5%) | 23 | **+1,57** |
| **Fermo (±0,5%)** | 14 | **−1,54** |
| Salita lenta (0,5…3%) | 17 | +0,88 |
| Forte salita (> 3%) | 30 | **+4,88** |

**Il nemico non è la direzione, è l'immobilità.** Correlazione con la
variazione dell'oro +0,28; con il *valore assoluto* della variazione
+0,36. Guadagna anche al ribasso, sono gli short a produrlo.

## I costi

Lo swap è il costo maggiore, cinque volte le commissioni. È **già
compreso in tutti i numeri** (si calcolano dalla colonna Bilancio).

| | $/lotto |
|---|---:|
| Swap sui long | **−85** |
| Swap sugli short | **+45** |
| Commissioni su `.p` | −7,03 |
| Commissioni su `.s` | 0 (tutto nello spread) |

Il sistema muore a **3 volte i costi attuali**. Conto raw con
commissione batte conto spread-only: misurato, 13% di vantaggio in più.

---

# 3. Cosa è stato provato e scartato — non ritentarlo

| Strategia | Perché è uscita |
|---|---|
| **Time-Series Momentum** (dalla card) | peso 1,0 → 0,5 → 0: profitto/rischio 6,36 → 6,56 → 6,63. Monotono, esce |
| **EMA cross** (dalla card) | stessa scommessa del Donchian, più debole: PF 1,23 contro 1,50. **Ma vedi errore n.3 sotto** |
| **Range mean reversion** | 174 configurazioni con ≥100 trade, **zero in utile**. Ipotesi invertita: la compressione precede la rottura, non il ritorno al centro |
| **Fade del breakout fallito** (TRAPPOLA) | +50 R in costruzione, **−44,9 R fuori campione**. Vende le rotture al rialzo fallite su un oro che triplica |
| **Adaptive Risk** | misurato peggiore, tenere spento |
| **Filtri su ore/giorni** | escluso da Davide |
| **XAGUSD come cross-check** | rifiutato da Davide |

Mai eseguiti, i file ci sono: `GoldRandomNull.mq5` (benchmark casuale) e
il walk-forward con `Avanti` di MT5.

---

# 4. Errori commessi, e come sono stati scoperti

Vale la pena leggerli: quasi ogni correzione ha migliorato il risultato.

1. **Trailing uguale allo stop** su tutte e tre le strategie originali.
   Amputava i vincitori. Prova: solo il 12% dei trade di S3 arrivava al
   target, miglior trade 159 $. Allargato, S3 passa da 6 a 98 punti R.
2. **Magic number non impostato prima di chiudere.** Le chiusure
   ereditavano il magic dell'ultima apertura, quindi il riepilogo per
   strategia era falso (S2 risultava a PF 0,01). Una riga di codice. Il
   profitto totale non cambiò: era solo contabilità.
3. **Scartata la EMA cross sul profit factor.** Il PF misura la qualità
   del singolo trade, non quanto una gamba porta al portafoglio. Quella
   gamba valeva circa 90 punti R. La decisione è forse ancora giusta
   (a drawdown uguale il portafoglio senza di lei è migliore) ma il
   motivo dato era sbagliato.
4. **Stima di S3 a +703%** da un'attribuzione FIFO instabile. Il test
   standalone diede +18%. Verificato: passando a LIFO il P&L attribuito
   si spostava del 38%.
5. **Deviazione standard 1,26 R usata come stima.** Quella vera è 1,45.
   Tutte le t calcolate prima di quella misura vanno abbassate del 15%.
6. **"Regge fino a 10-17 volte i costi"** — era del vecchio portafoglio.
   Questo muore a 3.
7. **"Gli short sull'oro non funzionano"** — detto troppo forte. Per
   *occasione* gli short funzionano quando l'oro scende; erano pochi
   perché c'erano pochi mesi di discesa.
8. **Griglie troppo corte, tre volte.** Ogni volta l'ottimo stava fuori,
   ed estendere ha cambiato la conclusione. Su V1XAU l'estensione ha
   raddoppiato il profitto e portato la t da 1,61 a 2,61.

---

# 5. Il punto aperto, dichiarato

La TRAPPOLA è stata tolta **dopo** aver guardato il fuori campione, e
questo di solito invalida il test.

**A favore della decisione:** quella gamba non era nella strategia
originale — è stata aggiunta in fase di ricerca. Ed è un'ipotesi
sbagliata a priori, non un parametro ottimizzato: costruire un sistema
che guadagna sui falsi segnali, cioè quando il prezzo non va da nessuna
parte, era la scelta sbagliata per un mercato che sale da anni.
L'argomento si poteva fare guardando un grafico mensile dell'oro, senza
nessun backtest. **È stato Davide a farlo notare.**

**Contro:** resta che è stato capito dopo.

Perciò esistono **due numeri**, ed è giusto tenerli separati:

| | Annuo (a 1,05%) | |
|---|---:|---|
| Tre gambe, fuori campione | **22%** | pulito, nessuna scelta fatta guardandolo |
| Due gambe, fuori campione | 47% | contaminato dalla scelta a posteriori |

Il valore vero sta in mezzo, più vicino al primo. **Si decide con dati
nuovi, non rianalizzando questi.**

---

# 6. Cosa fare adesso

1. **Niente più backtest sugli stessi anni.** Non aggiungono
   informazione, tolgono credibilità.
2. **Demo in tempo reale, tre-sei mesi.** Risponde alle due domande che
   nessun backtest tocca: gli spread e gli slittamenti veri assomigliano
   a quelli simulati? e si riesce a guardarlo fermo per mesi senza
   spegnerlo? *(Il 2022 e il 2024 sono stati anni a vuoto: 675
   operazioni per il 9% del risultato.)*
3. **La TRAPPOLA si decide lì.** Il demo è dato nuovo.
4. **Prima di aprire un conto live**, confrontare swap e spread veri con
   i numeri della sezione 3. Se sono peggiori, il sistema non farà quello
   che ha fatto nel backtest — e lo si sa prima, non dopo.

## Se serve rigenerare i report

```
python3 tools/report_finale.py <report-mt5.html> --rischio 1.05 --due
python3 tools/montecarlo.py   <report-mt5.html>
```
