# Portafoglio oro + nasdaq — contesto del progetto

Ricerca quantitativa in MQL5. Nata da cinque foto pubblicitarie di un
prodotto commerciale ("Gold Momentum" di QUANT_LAB, +798% in 7,3 anni
con 33% di drawdown): da lì le strategie dichiarate sono state
ricostruite, misurate e in gran parte scartate.

**Chi riprende il lavoro legge `docs/CONTINUA-QUI.md`, che è corto
apposta e contiene solo quello che è vero adesso.** Il resto si apre
solo se serve: `docs/storia.md` per il perché delle decisioni,
`docs/indice.md` per trovare un file.

## Chi c'è dall'altra parte

Davide (`davide.abbattista04@gmail.com`). Scrive in italiano
colloquiale, spesso da vocale, con refusi: va letto per il senso. Ha
chiesto esplicitamente **spiegazioni semplici** — «come se non sapessi
niente di sto mondo» — e **risposte corte**. Non è un principiante nel
ragionamento: più volte ha avuto ragione lui contro di me. Le sue
intuizioni vanno prese sul serio e testate, non liquidate.

Lui esegue i test in MetaTrader 5 (Mac con `XAUUSD.p`, PC Windows con
`XAUUSD.s`, PUPrime-Demo) e manda i report. L'analisi si fa qui.

## Le regole del lavoro, che non si negoziano

1. **I criteri si dichiarano prima del test, e si rispettano anche
   quando sono scomodi.**
2. **Il fuori campione 2024.01–2026.09 è già stato speso**, una volta
   sola. Non c'è più nessun dato vergine: qualunque nuova
   ottimizzazione sugli stessi anni peggiora la statistica invece di
   migliorarla. Sono già state provate 272 configurazioni.
3. **Si cerca un plateau, non un picco.** Se un valore rende e i suoi
   vicini no, è fortuna. Un ottimo sul bordo della griglia significa
   che la griglia era sbagliata: si estende (è successo tre volte, e
   tre volte ha cambiato la conclusione).
4. **Gli errori si dicono.** Sono elencati in `docs/storia.md`, e
   correggerli ha prodotto i risultati migliori. Non ammorbidire i
   numeri brutti.
5. **Niente filtri su ore o giorni della settimana** — escluso da Davide.
6. **Le soglie minime valgono per ogni strategia**, e stanno nella
   sezione 5 di `docs/CONTINUA-QUI.md`. Sono il mio compito: è Davide
   ad avermele affidate.

## Come si misura

- Tutto in **multipli di R**: il risultato diviso il rischio corso in
  quel momento. Indipendente dalla percentuale scelta.
- `t = somma(R) / (deviazione standard × radice(n))`. Sui dati attuali
  la deviazione standard è **1,620 R** sull'oro (l'1,45 dei documenti
  vecchi veniva da una passata più corta).
- **Il t non si confronta con 2.** Con K configurazioni provate il caso
  regala `radice(2 × log(K))`: con 272 la soglia è 3,35. Vale **solo
  dentro campione** — il fuori campione, guardato una volta sola, non si
  sgonfia. Per il nasdaq **K non è noto**, quindi il suo t dentro
  campione non è sgonfiabile.
- **Il drawdown vero non è quello del backtest.** Bootstrap a blocchi
  da 20, che non spezza le serie di perdite consecutive. E tutti i
  drawdown del progetto sono **di bilancio, non di equity**: sono un
  pavimento, non un soffitto.
- L'accoppiamento apertura/chiusura si fa per volume e direzione
  opposta, **LIFO**: le aperture orfane devono essere zero e il totale
  va confrontato con quello del report. **Ma la strategia non va
  indovinata**: il report porta l'etichetta nel commento dell'ordine
  (`S3-DONCH`, `S2-PULLB`, `QL_SessionOpenMom`), quindi l'attribuzione
  per gamba è esatta.

## È vera o è overfittata — risposta, 2026-09-21

**Non è overfittata.** Il fuori campione, speso una volta sola, dà
**t 4,36** (p ≈ 6·10⁻⁶) e non va sgonfiato. Regge cancellando ogni
vincita sopra 3 R (+180 R, 7 anni su 8 in utile). L'analisi dei regimi
non trova nessuna delle 25 variabili significativa.

**Per i piani si usa il numero basso**: +33,9 R all'anno (dentro
campione), non +66,6 (fuori campione, gonfiato dal boom dell'oro).
Circa **29% annuo composto** nello scenario prudente.

**«Che probabilità c'è che continui a rendere?» non è calcolabile da un
backtest.** Chi dà una percentuale se la inventa. Quello che è misurato
è che l'edge **c'era** nei dati; che **resti** dipende da 3 o 4 regimi
di mercato, non da 2.749 operazioni.

Dettaglio e prove: `docs/verdetto-robustezza.md`, strumento
`tools/robustezza.py`.

## Il rischio: **oro 0,65% · nasdaq 0,98%**

È l'unica riga giusta. Se trovi altri numeri nei file vecchi, sono
superati. Il tetto posto da Davide (drawdown 33% al 95° percentile
nello scenario prudente) **è attualmente sforato**: 33,8% col metodo
del PDF, 36,8% con quello più severo. La scelta fra scendere di rischio
e alzare il tetto è sua, e non è stata presa.

Nel codice i default sono ancora oro 0,70% e nasdaq 1,50%, e
`BlockOnAnyAccountPosition` è ancora `true` invece che `false`.
Vedi la sezione 4 di `docs/CONTINUA-QUI.md`.

## Rifare le analisi

```
python3 tools/fusione_conto_unico.py dati/oro_puprime_065.html.gz:0.65 dati/nasdaq_puprime_098.html.gz:0.98
```

Gli altri strumenti sono elencati in `docs/indice.md`.
