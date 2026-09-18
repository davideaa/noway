# `GoldS3.mq5` — piano di test della sola S3

EA autonomo con la sola strategia 3. La logica è **identica** a quella dentro
`GoldMomentum3.mq5` (stessi calcoli di segnale, sizing, stop, target,
trailing), così i risultati sono confrontabili con il test combinato.

Differenze: Adaptive Risk **disattivato di default**, magic 993000 (non va in
conflitto se per caso giri entrambi gli EA), riepilogo stampato nel Diario a
fine test.

Riferimento dal test combinato (S3 dentro il portafoglio, con l'equity
prosciugata da S2): **709 trade, WR 52,8%, PF 1,49, +0,491 R/trade**.

---

## Test A — la misura che conta (fallo per primo)

**Una sola passata, nessuna ottimizzazione, tutti i parametri di default.**

| Impostazione | Valore |
|---|---|
| Simbolo | XAUUSD del tuo broker |
| Timeframe grafico | M30 |
| Periodo | 2019.06.01 → 2026.09.18 |
| Modellamento | Ogni tick basato su tick reali |
| Deposito | 10.000 USD, leva 1:100 |
| Ottimizzazione | **Disabilitato** |

Serve a rispondere a una domanda sola: **quanto rende S3 da sola, capitalizzata
normalmente, senza S2 che le mangia l'equity?**

La stima ricavata dal test combinato è **+703% (~33%/anno)**, contro il +798%
della card. Se il test conferma l'ordine di grandezza, significa che una
singola strategia riproduce quasi per intero il risultato pubblicizzato delle
tre — e che la "diversificazione" è soprattutto confezionamento.

Attenzione: è una stima estrapolata dall'expectancy. Il numero vero può
uscire diverso, soprattutto perché qui il capitale cresce invece di
decrescere, quindi i lotti aumentano e la capitalizzazione lavora a favore.

**Cosa segnare:** profitto netto, profit factor, trade, win rate, max DD, e le
tre righe del riepilogo nel **Diario**.

---

## Test B — è edge o è fortuna?

Questo è il test più importante dei tre, più del rendimento.

Una strategia che funziona solo con un valore preciso di un parametro non ha
un edge: ha trovato un caso fortunato nei dati. Una che funziona su tutta una
fascia di valori sta catturando qualcosa di reale.

Ottimizzazione, **Algoritmo Completo Lento**:

| Input | Inizio | Passo | Fine | Valori |
|---|---|---|---|---|
| `[C] Posizione nel range per dirsi "al bordo"` | 0.70 | 0.05 | 0.95 | 6 |
| `[C] ATRfast/ATRslow minimo (espansione)` | 0.90 | 0.05 | 1.30 | 9 |

54 passate.

**Come si legge (non guardare il primo posto):** ordina per il valore della
soglia, non per il profitto, e guarda se il profit factor resta sopra 1
attraverso valori contigui.

- ✅ **Edge**: 0.75 / 0.80 / 0.85 / 0.90 danno tutti PF fra 1,3 e 1,6 →
  la regola cattura qualcosa di vero, e il valore esatto non è critico.
- ❌ **Fortuna**: 0.80 dà PF 1,49 ma 0.75 dà 0,95 e 0.85 dà 1,02 →
  è rumore, e il +703% del Test A non significa niente.

Stessa lettura per il rapporto di espansione.

---

## Test C — il test decisivo: 2011–2018

Stessi parametri del Test A, **periodo 2011.01.01 → 2018.12.31**.

Il backtest della card comincia a giugno 2019 e si ferma lì. Il 2013–2018 è
stato il periodo peggiore degli ultimi decenni per il trend following
sull'oro: mercato laterale e ribassista, esattamente il contesto che uccide i
breakout.

- Se S3 regge (anche solo PF > 1,1), **l'edge è strutturale** e il sistema ha
  senso al di là del regime 2019–2026.
- Se collassa, sai che il +798% della card è esposizione a un regime, non una
  strategia. E lo sai con un test che loro non hanno pubblicato.

Serve che il tuo broker abbia lo storico fino al 2011: controlla in
**Visualizza → Simboli → XAUUSD → Barre/Tick**. Se non arriva così indietro,
usa il periodo più lungo disponibile prima del 2019 (anche solo 2015–2018 è
informativo).

---

## Test D — quanto conta il target 2.5R (opzionale)

La card dichiara target 2.5R e trailing insieme, che è una combinazione
insolita: il target chiude prima che il trailing possa lavorare. Vale la pena
capire quale dei due sta facendo il lavoro.

| Input | Inizio | Passo | Fine |
|---|---|---|---|
| `[L] Take profit in R` | 1.5 | 0.5 | 4.0 |
| `[C] Attiva trailing a +xR` | 0 | 0.5 | 2.0 |

`Attiva trailing a +xR = 0` disattiva del tutto il trailing: utile per vedere
se il target da solo fa meglio.

Nota: `Take profit in R` è marcato **[L]**, dichiarato dalle card. Se il
risultato migliora molto con un valore diverso da 2.5, non è un miglioramento
della ricostruzione — è un allontanamento da essa. Tienilo come informazione,
non come nuovo default.

---

## Ordine e criterio

1. **Test A** — la misura (1 passata, ~6 minuti)
2. **Test B** — robustezza (54 passate, ~1 ora)
3. **Test C** — fuori periodo (1 passata)
4. **Test D** — solo se A, B e C sono passati

Se il Test B fallisce, **fermati**: non ha senso ottimizzare altro. Se il Test
C fallisce, sai già cosa vale il prodotto originale.

L'Adaptive Risk va acceso solo alla fine, e solo se i primi tre passano.
