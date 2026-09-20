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

---

# 7. Correzioni al codice, settembre 2026

Quattro difetti trovati rileggendo il codice contro questo documento.
Nessuno di loro cambia una strategia: tre riguardano cose che il backtest
non puo' vedere, uno riguarda la contabilita' del diario.

**Il vincolo dichiarato prima di toccare il codice: nessuna di queste
modifiche deve spostare i risultati gia' misurati.** Sotto, per ognuna,
il motivo per cui non li sposta. Se la verifica li sposta lo stesso, il
motivo era sbagliato e la modifica va rivista, non tenuta.

### 1. 1R si recupera dallo storico, non si stima con l'ATR

`g_risk` — la tabella che ricorda quanto valeva 1R per ogni posizione —
sta in memoria, e `OnInit` la azzera. Dopo un riavvio del terminale con
una posizione ancora aperta il trailing non trovava piu' il valore e
ripiegava su una stima: `ATR × 2,0` per la ROTTURA, `ATR × 1,0` per il
RITRACCIAMENTO.

Per la ROTTURA la stima e' quasi esatta, perche' il suo stop **e'** due
ATR. Per il RITRACCIAMENTO no: li' 1R e' la profondita' del
ritracciamento, che non e' un multiplo fisso dell'ATR. Con un 1R
sbagliato il trailing si attiva prima o dopo del dovuto, e la gamba si
comporta diversamente da come e' stata misurata — **senza dare nessun
errore.**

Ora `RiskFromHistory` legge lo stop originale dall'ordine che ha aperto
la posizione (`HistorySelectByPosition` → `ORDER_SL`), dove il trailing
non arriva, e ricava 1R come `|prezzo di apertura − stop iniziale|`.
Valore esatto, non stima.

Perche' non tocca i backtest: nel tester l'EA non si riavvia mai a meta',
quindi il ticket e' sempre in tabella e ne' il ripiego vecchio ne' il
recupero nuovo vengono mai raggiunti.

Perche' valeva la pena farlo adesso: la domanda del demo e' *«lo
scivolamento vero assomiglia a quello simulato?»*. Se intanto cambia
anche il comportamento del codice, si guardano due differenze
sovrapposte e non si sa quale sia quale. In tre-sei mesi MetaTrader si
riavvia di sicuro.

### 2. Il diario contava i costi a meta'

`PrintStrategySummary` sommava commissione e swap **solo della
chiusura**. MT5 mette quelli dell'apertura su un'operazione separata, e
`tools/estrai.py` li ha sempre contati (`costo_in`). I due non
coincidevano, e il diario era il piu' generoso dei due.

Non tocca nessuna cifra pubblicata, che viene da `estrai.py`. Tocca
quello che si legge nel journal — cioe' proprio dove si guardera'
durante il demo. E' lo stesso genere dell'errore n.2: contabilita', non
profitto.

Perche' non tocca i backtest: e' una stampa. Il profit factor e il numero
di operazioni del report li calcola MT5, non questa funzione.

### 3. `estrai.py` dichiara di essere LIFO

`aperte.pop(cand[-1])` prende l'apertura piu' recente fra quelle
compatibili. L'errore n.4 ha dimostrato che quella scelta sposta il P&L
attribuito del 38%, ma la docstring non la nominava. Ora c'e' scritto,
col rimando all'errore n.4. Solo commento: il codice e' identico.

### 4. Le cose piccole

- aggiunto `InpS3AllowLong` (c'era solo `InpS3AllowShort`, quindi la
  ROTTURA non si poteva mettere solo-short — vedi errore n.7). Default
  `true`: acceso si comporta come prima.
- tolto `CloseAllForMagic(InpMagicBase + 1)` da `WeekendGuard`: residuo
  della versione a tre gambe, in questo EA quel magic non esiste.
- `l2` ora e' validato come gia' lo era `h2`. Vengono dalla stessa barra,
  quindi sono validi o non validi insieme: il controllo non puo'
  scartare una barra che prima passava.
- `PositionModify` controlla l'esito e, se il broker rifiuta, aspetta 60
  secondi invece di riprovare a ogni tick. Nel tester non ci sono
  rifiuti da frenare: `EnforceStopsLevel` rispetta gia' la distanza
  minima e lo stop non viene mai riproposto identico.

## La verifica — dichiarata prima, NON ancora eseguita

Serve MetaTrader: non e' stata fatta. **Finche' non passa, queste
modifiche sono da considerare non verificate.**

```
V1XAU_TrendFollowing su XAUUSD.s (PUPrime-Demo)
2019.01.01 – 2026.09.16, tick reali, rischio 0,70%, parametri di default
```

| Deve uscire | |
|---|---:|
| Operazioni | **1.123** |
| Profit factor dal report MT5 | **1,36** |

Se coincidono, le modifiche sono neutre come dichiarato. **Se cambia
anche solo il numero di operazioni, non lo sono: si torna indietro e si
cerca quale delle quattro ha mosso qualcosa** (la 1 e la 4 sono le uniche
che toccano codice eseguito durante una passata).

> **Attenzione a quale profit factor si guarda.** Il report di MT5 dice
> **1,36**, col composto. L'**1,30** della sezione 2 e della tabella «I
> numeri su .s» in `docs/v1xau-verifica.md` e' lo stesso test ricalcolato
> **a lotto fisso** da `report_finale.py`. Sono due misure della stessa
> passata, non due risultati diversi: per una verifica fatta leggendo il
> report del tester il riferimento e' 1,36.

---

# 8. V2XAU — capitale di rischio virtuale (PARCHEGGIATA)

> **Non in uso.** Scritta per il problema di margine del broker nuovo,
> messa da parte da Davide prima di essere compilata o testata. Il file
> c'e' e non e' mai stato usato. **L'EA in uso resta
> `V1XAU_TrendFollowing.mq5`**, che questa versione non ha mai toccato.
> Da riprendere solo se il margine tornera' a essere un problema.


`mt5/V2XAU_TrendFollowing_VRC.mq5`. Nasce da un problema del broker
nuovo, non della strategia: **rischio e margine non sono la stessa
cosa.**

Su XAUUSD Vantage chiede circa **19.060 di margine per un lotto**. Con
due gambe aperte insieme si arriva a ~0,70 lotti, cioe' **~13.300 di
margine**, su un conto da 10.000 che non ce li ha — anche se il rischio
vero, quello fino allo stop, e' solo ~100.

## L'idea

Si versa capitale in piu' **per il margine**, e gli si impedisce di
alzare il rischio. Due grandezze separate:

| | a cosa serve |
|---|---|
| **Equity vera** (es. 20.000) | margine, margine libero, sicurezza del conto |
| **Capitale virtuale** (es. 10.000) | **unica** base per calcolare i lotti |

```
capitale virtuale = InpInitialRiskCapital
                  + P&L netto REALIZZATO dei magic base+2 e base+3
```

Il composto continua a funzionare, e in drawdown la size scende da sola:

| Realizzato | Equity vera | Capitale virtuale | Rischia all'1% |
|---:|---:|---:|---:|
| 0 | 20.000 | 10.000 | 100 |
| +2.000 | 22.000 | 12.000 | **120** (non 220) |
| −2.000 | 18.000 | 8.000 | **80** |

**Realizzato, non equity**, per tre motivi: l'equity contiene il
deposito messo per il margine; contiene il P&L fluttuante, quindi un
trade in corso gonfierebbe la size del successivo; e il realizzato si
ricostruisce identico dopo un riavvio, il fluttuante no.

## Cosa e' cambiato nel codice — e cosa no

**Sette righe di V1 sono state toccate**, tutte dentro il calcolo del
capitale. Segnali, stop, trailing, indicatori, timeframe, magic,
cooldown, permessi long/short: **identici, riga per riga** (verificabile
col diff fra i due file).

| Funzione | Cosa cambia |
|---|---|
| `LotsFromRisk` | la base non e' `ACCOUNT_EQUITY` ma `RiskMoney()` |
| `CurrentOpenRiskPercent` | denominatore: capitale virtuale invece di equity, perche' "rischio" deve voler dire la stessa cosa ovunque |
| `OpenTrade` | dopo il calcolo dei lotti, controllo del margine e diario |
| `OnInit` | ricostruisce il capitale dallo storico |
| `OnTick` | si accorge se una posizione si e' chiusa |

Funzioni nuove: `RealizedPnLForEA`, `StrategyRiskCapital`, `RiskMoney`,
`RequiredMargin`, `MarginBudget`, `LotsMarginAllows`, `LogSizing`,
`OnTradeTransaction`.

Il margine si calcola con **`OrderCalcMargin()`**, cioe' col metodo vero
del broker, mai con `notional / leva`: su XAUUSD il requisito puo'
essere a scaglioni. Se non basta, l'ordine **viene rifiutato e scritto
nel diario**, non falsato in silenzio — a meno di mettere
`InpReduceLotsIfMargin = true`, che riduce il lotto e lo dichiara.

## La conseguenza sul drawdown, che va capita

Le percentuali del Monte Carlo (35% al 90° percentile a 1,05%) sono
sempre riferite al **capitale virtuale**, non al conto. Con capitale
virtuale 10.000 su un conto da 20.000, un 35% vale 3.500, cioe' il
**17,5% del conto vero**. Il rischio in R non cambia: cambia solo
quanto pesa sul deposito, perche' meta' del deposito e' li' per il
margine e non per rischiare.

## Tre cose non risolte, dichiarate

1. **Non compilato.** Nessun MetaEditor nell'ambiente di lavoro. Va
   compilato prima di qualunque test.
2. **V2 non riprodurra' i backtest di V1**, nemmeno con deposito 10.000
   e capitale virtuale 10.000. V1 dimensionava sull'equity, che si
   muove col P&L fluttuante delle posizioni aperte; V2 sul realizzato,
   che non si muove. La differenza e' piccola ma reale, e si vede solo
   quando una gamba apre mentre l'altra e' gia' a mercato.
3. **`InpMagicBase` e' rimasto 997000**, come chiesto. Se V1 e V2
   girano sullo stesso conto si contano i trade a vicenda e il capitale
   virtuale risulta sbagliato: **non tenerli accesi insieme**, oppure
   cambiare il magic di uno dei due.

`InpMinFreeMarginAfterPct` e' a 30% come primo valore ragionevole, non
misurato. E' l'unico parametro di questa versione che vale la pena
tarare, e si tara guardando quante volte compare "ORDINE RIFIUTATO"
nel diario.
