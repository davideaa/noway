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
| `mt5/V1XAU_TrendFollowing.mq5` | **VIVO — è l'EA buono**: ROTTURA (M30) + RITRACCIAMENTO (H4) |
| `mt5/GoldPortfolio.mq5` | **VIVO**: la versione a tre gambe. Tenuta perché è l'unica con la verifica fuori campione non contaminata (il 22% della sezione 5 di CONTINUA-QUI) |
| `mt5/GoldTrendPullback.mq5` | **ANTENATO** del RITRACCIAMENTO. Bocciato da solo (t 1,61), promosso dopo l'estensione della griglia (t 2,61). Non è una candidata morta |
| `mt5/GoldS3.mq5` | antenato della ROTTURA: il solo Donchian estratto per misurarlo isolato |
| `mt5/GoldMomentum3.mq5` | la ricostruzione dalle cinque foto. Superata: tre gambe tutte trend, Z-Score −3,53 |
| `mt5/GoldFadeBreak.mq5` | scartata — la TRAPPOLA, +50 R dentro e −44,9 R fuori |
| `mt5/GoldRangeMR.mq5` | scartata — 174 configurazioni con ≥100 trade, zero in utile |
| `mt5/GoldRandomNull.mq5` | benchmark a ingressi casuali, **mai eseguito** |
| `tools/estrai.py` | dal report HTML alle operazioni attribuite per strategia |
| `tools/montecarlo.py` | bootstrap a quattro metodi |
| `tools/report_finale.py` | genera il dossier PDF (`--rischio`, `--due`) |
| `docs/` | una scheda per ogni decisione, con i numeri che l'hanno motivata |

Ogni `.mq5` dichiara la propria ipotesi nel commento di testa, scritta
prima del test. Non è decorazione: è il motivo per cui il fuori campione
conta qualcosa.

Rigenerare un report:
`python3 tools/report_finale.py <report.html> --rischio 1.05 --due`

---

# Secondo progetto: XAU NEWS BIAS (`xau_news_bias/`)

Web app locale + motore quantitativo che prova a prevedere, **prima** di
una release USA ad alto impatto, la direzione della prima M1 di XAUUSD.
Python (FastAPI, SQLite, scikit-learn/LightGBM), nessuna dipendenza da
Claude in produzione. Chi riprende parta da `xau_news_bias/README.md` e
`xau_news_bias/docs/RISULTATI-CPI.md`.

- **Verdetto CPI (set. 2026): NO RELIABLE EDGE.** Protocollo
  pre-registrato in `docs/PROTOCOLLO-CPI.md` (emendamenti datati, tutti
  prima dei test). L'holdout 2020–2026 è già stato guardato: non si
  riusa per scegliere modelli nuovi.
- **Fase 2 (CPI + NFP, trade sulla prima M1, aspettativa dopo i costi):
  NO RELIABLE EDGE.** Parti da `docs/FINAL-EDGE-REPORT.md`. Protocollo
  `docs/CPI-NFP-DISCOVERY-PROTOCOL.md` + emendamento 1, entrambi prima dei
  risultati. 4,66 milioni di ipotesi con nullo a permutazioni; l'unica
  regola significativa in scoperta (NFP, p 0,011) è crollata nella
  conferma finale. **Il test finale NFP 2020–26 è stato aperto una volta
  (`research_output/phase2/FINAL_NFP_OPENED.json`): non esiste più nessun
  periodo storico vergine né per CPI né per NFP.** Ogni ipotesi nuova va
  pre-registrata e confermata solo live. Unica cosa che funziona:
  l'ampiezza (unità `U_news`), non la direzione. Anche con direzione nota
  il CPI rende −0,20 R con costi conservative.
- Tetto teorico: anche conoscendo il segno della sorpresa si indovina la
  prima M1 solo il ~73% delle volte. Il movimento (range) invece si
  prevede (Spearman 0,57).
- Stesse regole del progetto MQL5: criteri prima dei test, errori
  dichiarati, niente numeri ammorbiditi. `pytest` deve restare verde
  (contiene il test anti-leakage e quello di immutabilità del track record).
- Le previsioni live sono append-only con catena di hash: mai modificarle.
