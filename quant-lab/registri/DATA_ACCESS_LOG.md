# Registro degli accessi ai dati

Questo file è l'indice. I dettagli, una riga per ogni fonte consultata, sono in:
- [DATA_ACCESS_LOG_broker_fusion.md](DATA_ACCESS_LOG_broker_fusion.md)
- [DATA_ACCESS_LOG_broker_ibkr.md](DATA_ACCESS_LOG_broker_ibkr.md)
- [DATA_ACCESS_LOG_crypto.md](DATA_ACCESS_LOG_crypto.md)

## Prove dirette dall'ambiente di ricerca (2026-11-14)

| Fonte | URL | Esito | Tentativi | Alternativa | Stato |
|---|---|---|---|---|---|
| Binance API principale | api.binance.com | 451 (blocco geografico) | 1 | data.binance.vision e data-api.binance.vision | ALTERNATIVE_SOURCE_FOUND |
| Binance public data | data.binance.vision | 200, checksum ok su tutti i file | — | — | ACCESSIBLE_VIA_DOWNLOAD |
| FRED | fred.stlouisfed.org/graph/fredgraph.csv | 200 | 1 | — | ACCESSIBLE |
| Yahoo Finance | query1/query2.finance.yahoo.com | 429 | 3 | nessuna gratuita trovata per ora | TEMPORARILY_UNAVAILABLE |
| Stooq | stooq.com | sfida anti-bot in JavaScript | 1 | **non aggirata** per regola | RESTRICTED |
| Nasdaq API | api.nasdaq.com | connessione chiusa | 1 | — | RESTRICTED |
| Dukascopy | datafeed.dukascopy.com | 429 | 1 | da ritentare | TEMPORARILY_UNAVAILABLE |
| OpenAlex, Semantic Scholar | api.openalex.org, api.semanticscholar.org | 429 | 1 + ritentativi dell'agente | arXiv, Crossref | ALTERNATIVE_SOURCE_FOUND |
| arXiv | export.arxiv.org | 200 | — | — | ACCESSIBLE_VIA_API |
| Kraken, OKX, Deribit, Coinbase API pubbliche | — | 200 | 1 | — | ACCESSIBLE_VIA_API |
| Bybit API | api.bybit.com | 403 | 1 | public.bybit.com (dati storici) | ALTERNATIVE_SOURCE_FOUND |
| CME | cmegroup.com | connessione fallita | 1 | IBKR (2 anni) o DataMine a pagamento | PAID_ACCESS_REQUIRED |
| Siti IBKR | interactivebrokers.com / .ie | 403 per l'agente | 3 | riassunti dei motori di ricerca | ALTERNATIVE_SOURCE_FOUND (qualità secondaria) |

Una richiesta che si presentava con lo user-agent di un browser è stata bloccata dalle
regole di sicurezza dell'ambiente. Non è stata ripetuta: non si mascherano gli accessi.
