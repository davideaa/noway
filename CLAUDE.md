# Portafoglio oro — contesto del progetto

Ricerca quantitativa su XAUUSD in MQL5. Punto di partenza: cinque foto
pubblicitarie di un prodotto commerciale ("Gold Momentum" di QUANT_LAB,
+798% in 7,3 anni con 33% di drawdown). Da lì sono state ricostruite,
misurate e in gran parte scartate le strategie dichiarate.

**Il risultato attuale è `mt5/V1XAU_TrendFollowing.mq5`.** Chi riprende
il lavoro parta da `docs/CONTINUA-QUI.md`, che ha lo stato completo.

## Chi c'è dall'altra parte

Davide (`davide.abbattista04@gmail.com`). Scrive in italiano colloquiale,
spesso da vocale, con refusi: va letto per il senso. Ha chiesto
esplicitamente spiegazioni semplici — «come se non sapessi niente di sto
mondo». Non è un principiante nel ragionamento: più volte ha avuto
ragione lui contro di me. Le sue intuizioni vanno prese sul serio e
testate, non liquidate.

Lui esegue i test in MetaTrader 5 (Mac con `XAUUSD.p`, PC Windows con
`XAUUSD.s`, entrambi PUPrime-Demo) e manda i report HTML o gli XML di
ottimizzazione. L'analisi si fa qui sui file che manda.

## Le regole del lavoro, che non si negoziano

1. **I criteri si dichiarano prima del test, e si rispettano anche
   quando sono scomodi.** È stato fatto per tutte le decisioni prese.
2. **Il fuori campione 2024.01–2026.09 è già stato speso**, una volta
   sola, e ha passato i criteri dichiarati. Non c'è più nessun dato
   vergine: qualunque nuova ottimizzazione sugli stessi anni peggiora la
   statistica invece di migliorarla. Sono già state provate 272
   configurazioni.
3. **Si cerca un plateau, non un picco.** Se un valore rende e i suoi
   vicini no, è fortuna. Un ottimo sul bordo della griglia significa che
   la griglia era sbagliata: si estende (è successo tre volte, e tre
   volte ha cambiato la conclusione).
4. **Gli errori si dicono.** Ce ne sono stati diversi, sono elencati in
   `docs/CONTINUA-QUI.md`, e correggerli ha prodotto i risultati
   migliori. Non ammorbidire i numeri brutti.
5. **Niente filtri su ore o giorni della settimana** — escluso da Davide.

## Come si misura

- Tutto in **multipli di R**: il risultato diviso il rischio corso in
  quel momento. Indipendente dalla percentuale scelta.
- `t = somma(R) / (deviazione standard × radice(n))`. La deviazione
  standard vera misurata sui trade è **1,45 R**, non l'1,26 usato come
  stima all'inizio: le t calcolate prima di quella misura sono
  ottimistiche del 15% circa.
- **Il drawdown vero non è quello del backtest.** Si usa il bootstrap a
  blocchi da 20 (`tools/montecarlo.py`), che non spezza le serie di
  perdite consecutive.
- MT5 non mette il magic number nel report: `tools/estrai.py` attribuisce
  ogni operazione alla sua strategia accoppiando per volume e direzione
  opposta. Il totale attribuito va sempre confrontato con quello del
  report (finora coincide al centesimo).

## I file

Gli `.mq5` non sono tutti uguali: **due sono vivi, uno è un antenato,
gli altri sono lapidi**. Prima di cestinarne uno, leggere questa tabella.

| File | Stato |
|---|---|
| `mt5/V1XAU_TrendFollowing.mq5` | **VIVO — è l'EA buono**: ROTTURA (M30) + RITRACCIAMENTO (H4). Dalla 2026-09-20 ha il pannello live (spento nel tester) |
| `mt5/GoldPortfolio.mq5` | **VIVO**: la versione a tre gambe. Tenuta perché è l'unica con la verifica fuori campione non contaminata (il 22% della sezione 5 di CONTINUA-QUI) |
| `mt5/GoldTrendPullback.mq5` | **ANTENATO** del RITRACCIAMENTO. Bocciato da solo (t 1,61), promosso dopo l'estensione della griglia (t 2,61). Non è una candidata morta |
| `mt5/GoldS3.mq5` | antenato della ROTTURA: il solo Donchian estratto per misurarlo isolato |
| `mt5/GoldMomentum3.mq5` | la ricostruzione dalle cinque foto. Superata: tre gambe tutte trend, Z-Score −3,53 |
| `mt5/GoldFadeBreak.mq5` | scartata — la TRAPPOLA, +50 R dentro e −44,9 R fuori |
| `mt5/GoldRangeMR.mq5` | scartata — 174 configurazioni con ≥100 trade, zero in utile |
| `mt5/GoldRandomNull.mq5` | benchmark a ingressi casuali, **mai eseguito** |
| `mt5/NAS100_SessionOpenMomentum_v2_57.mq5` | **VIVO** — seconda strategia, Nasdaq M5 momentum sull'apertura di New York. Costruita da Davide con un'altra AI |
| `mt5/NAS100_SessionOpenMomentum_v2_57_MULTI.mq5` | **VIVO** — la stessa strategia che puo' condividere il conto con l'EA dell'oro (`BlockOnAnyAccountPosition=false`). Stesso pannello live dell'oro |
| `mt5/NAS100_v2_57_valori.set` | i parametri testati, ottimizzazione spenta. **Il file di sicurezza** |
| `mt5/NAS100_v2_57_plateau.set` | gli stessi, con le griglie del test del plateau gia' compilate |
| `tools/estrai.py` | dal report HTML alle operazioni attribuite per strategia |
| `tools/montecarlo.py` | bootstrap a quattro metodi |
| `tools/report_due_broker.py` | confronto a due broker: stessa strategia, due listini |
| `tools/dati_validazione.py` | dal report MT5 alle operazioni e alle statistiche **a rischio fisso** |
| `tools/montecarlo_validazione.py` | Monte Carlo a cinque metodi (permutazione, IID, blocchi, stazionario, per regime) |
| `tools/report_validazione.py` | il dossier di validazione a 22 pagine |
| `tools/report_portafoglio.py` | oro + nasdaq su un conto solo, con e senza composto |
| `tools/montecarlo_portafoglio.py` | Monte Carlo su piu' strategie insieme, in frazione di conto |
| `tools/report_uno_o_due.py` | un conto o due? e con quale rischio. **Il report che corregge il 4572%** |
| `tools/report_rischio_portafoglio.py` | quanto rischiare: due scenari (col boom e senza), tetto sul drawdown |
| `tools/report_scelta_finale.py` | la scelta a tetto 33%: oro 0,65% e nasdaq 0,98% |
| `tools/report_curva_reale.py` | **la curva storica vera** ai rischi scelti, col composto. Non e' una simulazione |
| `tools/regimi.py` | misura il mercato PRIMA della strategia: 12 caratteristiche a ogni ingresso, niente sguardo in avanti |
| `tools/report_regimi.py` | **l'analisi dei regimi a 8 pagine**: perche' ha funzionato, quando funziona, quando soffre |
| `tools/report_sintesi.py` | la versione breve a 8 pagine, con rischio fisso **e** composto affiancati |
| `tools/report_finale.py` | genera il dossier PDF (`--rischio`, `--due`) |
| `dati/` | **i report MT5 veri, compressi** — `leggi()` apre anche i `.gz`. Non serve ricaricarli |
| `docs/` | una scheda per ogni decisione, con i numeri che l'hanno motivata |

Ogni `.mq5` dichiara la propria ipotesi nel commento di testa, scritta
prima del test. Non è decorazione: è il motivo per cui il fuori campione
conta qualcosa.

## Rigenerare i report

I dati stanno nel repo, quindi ogni analisi si rifa' senza caricare niente:

```
python3 tools/report_curva_reale.py   dati/oro_puprime_1pct.html.gz dati/nasdaq_puprime.html.gz
python3 tools/report_regimi.py        dati/oro_puprime_1pct.html.gz dati/nasdaq_puprime.html.gz
python3 tools/report_scelta_finale.py dati/oro_puprime_1pct.html.gz dati/nasdaq_puprime.html.gz
python3 tools/report_finale.py        dati/oro_puprime_1pct.html.gz --rischio 1.05 --due
```

**Il rischio deciso e' oro 0,65% e nasdaq 0,98%** (tetto: drawdown 33% al
95o percentile sullo scenario 2019-2023). Nel codice l'oro e' ancora a
0,70% e il nasdaq a 1,50%: vanno cambiati. Vedi `docs/rischio-portafoglio.md`.
