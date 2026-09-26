# Audit point-in-time e anti-leakage (fase 2)

Verificato il 26/09/2026 sul codice e sui dati, prima della ricerca.

## Cosa è stato controllato

| Punto | Esito | Come |
|---|---|---|
| Orari e ora legale | OK | `tests/test_time_and_calendar.py`: 08:30 ET → 13:30 UTC d'inverno, 12:30 d'estate, settimana di sfasamento di marzo. Controllo sui dati: la M1 di T0 è in mediana 11 volte più ampia della media dell'ora prima (`ts_ratio_t0`) |
| Tick Dukascopy | OK | due endpoint identici al tick; reazione mediana a +1,5 s da T0 |
| Target | OK | P0 = ultimo tick prima di T0; etichetta stabile al 98% fra mid e bid |
| Candele | OK | una candela entra solo se chiusa prima del cutoff (`assert_no_future`) |
| Serie giornaliere | OK | ogni riga ha `available_from_utc` (tabella sotto) |
| Valori macro | OK | prime stampe: Tabella A BLS (CPI) e Summary table BLS (NFP, dal 2010); storico FF verificato identico alle prime stampe BLS (221/221 CPI, 197/198 NFP) |
| Revisioni NFP | OK | lette dai comunicati BLS di allora (il "previous" di FF è la prima stampa nel 99,5% dei casi, quindi non le contiene) |
| Consensus | PARZIALE | forecast FF mostrato alla release: noto prima di T0, non garantito già a T−3D |
| Anti-leakage automatico | OK | `tests/test_leakage.py`: due mercati identici fino al cutoff e diversi dopo danno le stesse feature, sia per le 76 della fase 1 sia per le oltre 100 nuove (price action, mercati incrociati, relazioni, tassi) |
| Immutabilità previsioni | OK | trigger SQLite + catena di hash, `tests/test_immutability.py` |

## Regole di disponibilità

| Dato | Disponibile da |
|---|---|
| Candele XAU, FX, S&P 500, Nasdaq | chiusura della candela |
| Tick (solo per il target e l'esecuzione) | istante del tick |
| Curve Treasury (nominali e reali, quindi breakeven) | giorno D 18:00 ET |
| EFFR NY Fed | D+1 lavorativo 09:00 ET |
| VIX chiusura | D 17:00 ET |
| COT CFTC | martedì + 3 giorni 15:30 ET; esclusi gli shutdown |
| Nowcast Cleveland Fed | giorno d 23:59 ET |
| EPU (incertezza politica) | D+2 00:00 ET |
| GPR (rischio geopolitico) | D+8 00:00 ET (aggiornato con ritardo e a volte ricalcolato) |
| Prime stampe di tutte le release (sorprese) | ora della release + 60 s |
| Consensus della release corrente | prima di T0 (vedi limite sopra) |
| Esiti XAU delle release precedenti | T0 + 60 s |
| Date FOMC | pubblicate un anno prima |
| Calendario delle release ad alto impatto | noto in anticipo |

## Limiti dichiarati

- **Fed funds futures / FedWatch storici**: a pagamento (CME DataMine).
  Proxy usate: 3M, 2Y − 3M, variazione a 6 mesi del 3M.
- **Rendimenti intraday**: non esiste storico gratuito. Proxy intraday:
  USD/JPY al minuto (molto sensibile ai tassi USA).
- **Testi Fed (NLP)**: non inclusi in questa fase. Le date FOMC sì.
- **Contesto geopolitico**: solo indici giornalieri costruiti dal testo dei
  giornali (EPU, GPR), con ritardi prudenti. Nessuna etichetta a posteriori.
- **Reazioni dell'oro ad altre release (PPI, PCE, FOMC, ISM)**: non
  scaricate; di quelle release si usa solo la sorpresa.
- **Feed prima del 2013**: reazione lenta e incompleta (vedi
  REGIME-ANALYSIS.md); per questo il regime principale parte da luglio 2013.
