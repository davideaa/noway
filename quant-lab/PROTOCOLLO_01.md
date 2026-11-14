# Protocollo 01 — dichiarato PRIMA di vedere i risultati

Data: 2026-11-14. Questo file viene registrato in git prima che qualunque
backtest sia eseguito. Le regole sotto non si cambiano dopo aver visto i numeri;
ogni deviazione va scritta in `registri/DEVIAZIONI.md` con il motivo.

## Perché le cripto per prime

Non è una preferenza: è dove ci sono **dati gratuiti di qualità** (Binance public
data, con checksum) e **una sede legale per un italiano** (OKX Europe / Kraken,
vedi `ricerca/broker/crypto_venues.md`). Azioni ed ETF: i dati gratuiti oggi
non sono raggiungibili da qui (Yahoo 429, Stooq anti-bot, Nasdaq bloccato), e gli
ETF USA sono vietati ai retail UE (PRIIPs). Futures: i dati storici delle
scadenze CME sono a pagamento.

## Dati

- Binance spot giornaliero 2018-01 → 2026-10; perpetui USD-M e funding 2020-01 → 2026-10.
- **Universo scelto ex ante**: le 15 coppie USDT non-stablecoin con più volume
  a dicembre 2018 (BTC ETH XRP BCH EOS TRX BNB ADA XLM LTC NEO ETC ONT VET ICX).
  Così non si sceglie con il senno di poi chi è sopravvissuto. EOS e ICX sono
  stati poi delistati: restano dentro finché hanno dati.
- Limite dichiarato: i prezzi sono di Binance, l'esecuzione sarebbe su OKX
  Europe o Kraken. Funding e base differiscono tra exchange.

## Divisione temporale

- **Costruzione**: fino al 2022-12-31. **Verifica (OOS)**: 2023-01-01 → 2026-10-31.
- L'OOS si guarda una volta, con la configurazione principale fissata qui.

## Strategia A — Pairs trading con cointegrazione, walk-forward

Parametri fissati a priori (valori standard della letteratura, nessuna ottimizzazione):
- Ogni 90 giorni: finestra di formazione dei 365 giorni precedenti, su log-prezzi.
- Test Engle-Granger su tutte le coppie dell'universo con dati completi nella
  finestra; correzione Benjamini-Hochberg al 5% sul numero di coppie testate.
- Tra quelle che passano, half-life dello spread tra 2 e 60 giorni; si prendono
  le **5** con p-value più basso (meno se ne passano meno; zero se nessuna).
- Spread = log(Y) − β·log(X), β dall'OLS di formazione; z-score con media e
  deviazione standard della formazione.
- Ingresso |z| ≥ 2,0; uscita a z che attraversa 0; stop a |z| ≥ 4,0; uscita
  forzata a fine finestra di trading (90 giorni).
- Segnale sulla chiusura del giorno t, esecuzione alla chiusura del giorno t+1.
- Strumenti di esecuzione: perpetui su entrambe le gambe (serve il short).
- Costi: 0,05% commissione + 0,03% slittamento per lato e per gamba; funding
  vero di Binance su entrambe le gambe (il long paga se positivo, lo short incassa).
- Capitale: ogni coppia aperta usa 1/5 del capitale, gross = |gamba Y| + |gamba X|.

## Strategia B — Cash-and-carry sul funding (long spot, short perpetuo)

- BTC ed ETH, metà capitale ciascuno, neutrale sul prezzo.
- Versione principale: posizione aperta quando la media del funding delle
  ultime 7 giornate (21 pagamenti), annualizzata, supera il **10%**; chiusa
  quando scende sotto lo **0%**. Valutazione giornaliera, esecuzione il giorno dopo.
- Costi: 0,10% per lato sullo spot, 0,05% per lato sul perpetuo, 0,03% slittamento
  per lato e per gamba. P&L della base (spot vs perpetuo) contato per intero.
- Il capitale è contato tutto (spot pagato per intero + margine del perpetuo):
  rendimento = P&L / capitale totale, nessuna leva.
- Benchmark: T-bill a 3 mesi (FRED DTB3).

## Criteri di successo sull'OOS (tutti richiesti)

1. Rendimento netto medio > 0 con p < 0,05 al bootstrap a blocchi (blocchi di 20 giorni).
2. Sharpe netto annualizzato ≥ 0,5 (per B: Sharpe sull'eccesso rispetto al T-bill).
3. Utile in almeno 3 dei 4 anni OOS (2023, 2024, 2025, 2026 parziale).
4. Deflated Sharpe Ratio ≥ 0,95 contando tutte le configurazioni provate.

## Robustezza (riportata, non usata per scegliere)

- A: ingresso 1,5 / 2,0 / 2,5 × formazione 180 / 365 giorni (6 configurazioni).
- B: soglia d'ingresso 0% / 5% / 10% / 20% e "sempre aperto" (5 configurazioni).
- Costi × 2 e × 3.
- Tutte contano nel numero di prove per il DSR.

## Cosa invaliderebbe l'ipotesi

- A: se lo spread nella finestra di trading non torna verso la media più spesso
  che per caso (tasso di ritorno a 0 prima dello stop ≤ 50%), la cointegrazione
  di formazione non ha potere predittivo.
- B: se il rendimento netto non batte il T-bill, il premio del funding è assorbito
  dai costi o dalla base.
