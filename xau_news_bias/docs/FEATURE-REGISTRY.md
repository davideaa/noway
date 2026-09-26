# Feature registry (fase 2)

Generato da `xnb/phase2/feature_registry.py` sul dataset congelato (`research_output/phase2/p2_features.parquet`). L'elenco completo, una riga per feature, è in `research_output/phase2/feature_registry.csv`.

**496 feature** a 8 cutoff (T−3D, T−24H, T−4H, T−1H, T−30M, T−15M, T−5M, T−1M), di cui 232 di price action. Copertura = quota di eventi di scoperta (2013-07 → 2019) con il valore presente a T−1M.

## Per famiglia (insiemi dei modelli, protocollo §6)

| Famiglia | Feature | Copertura mediana CPI | Copertura mediana NFP |
|---|---|---|---|
| CAL | 9 | 100% | 100% |
| CONSENSUS | 33 | 99% | 0% |
| DXYFX | 21 | 100% | 100% |
| MACRO | 105 | 100% | 100% |
| POSITIONING | 4 | 100% | 100% |
| PRICE | 269 | 100% | 100% |
| RATES | 27 | 100% | 100% |
| VOLRISK | 27 | 100% | 100% |
| esclusa | 1 | 100% | 100% |

FED è un sottoinsieme trasversale (5 feature: giorni da/al FOMC, 3M, 2Y − 3M, sorpresa Fed funds).

## Per fonte, con la regola di disponibilità

| Prefisso | Fonte | Disponibile da | Contenuto | Feature |
|---|---|---|---|---|
| `f_pa_` | Dukascopy XAUUSD M1 → M5, M15, H1, H4, D1 | chiusura della candela prima del cutoff | price action: direzione, corpo, stoppini, posizione di chiusura, inside/outside/engulfing, massimi e minimi crescenti, sequenze, RSI, ROC, Bollinger, Donchian, EMA20, compressione, livelli tondi, falsi breakout | 232 |
| `f_xau_` | Dukascopy XAUUSD | chiusura della candela | rendimenti, volatilità, trend dell'oro (fase 1) | 37 |
| `f_xm_` | Dukascopy EURUSD, USDJPY, USA500, USATECH M1 | chiusura della candela | rendimenti 15/60/240/1440 min e range dell'ultima ora dei mercati incrociati | 20 |
| `f_rel_` | Dukascopy + Treasury | chiusura della candela / D 18:00 ET | correlazioni e beta oro-dollaro, oro-azionario, oro-tassi; divergenze | 8 |
| `f_dxy_` | Dukascopy (6 valute, formula ICE) | chiusura della candela | DXY ricostruito | 5 |
| `f_usd_` | Dukascopy | chiusura della candela | dollaro nell'ultima ora | 1 |
| `f_rt_vix` | Cboe | D 17:00 ET | VIX in z-score a un anno | 1 |
| `f_rt_` | U.S. Treasury | D 18:00 ET | breakeven 5Y/10Y, 5s30s, z-score e percentili dei tassi | 13 |
| `f_y` | U.S. Treasury | D 18:00 ET | rendimenti 3M/2Y/10Y e variazioni | 9 |
| `f_r10y` | U.S. Treasury (TIPS) | D 18:00 ET | rendimento reale 10Y | 2 |
| `f_slope` | U.S. Treasury | D 18:00 ET | pendenza della curva | 1 |
| `f_vix` | Cboe | D 17:00 ET | livello e variazioni del VIX | 3 |
| `f_cot_` | CFTC | martedì + 3 giorni 15:30 ET | posizionamento managed money | 4 |
| `f_news_` | EPU / GPR | EPU D+2, GPR D+8 | incertezza politica e rischio geopolitico dal testo dei giornali | 12 |
| `f_surp_` | storico ForexFactory (prime stampe verificate con BLS) | release + 60 s | memoria delle sorprese di 18 serie: ultima, media di 3, serie dello stesso segno, giorni; indice hawkish | 66 |
| `f_cons_` | storico ForexFactory (forecast) | prima di T0 (non garantito a T−3D) | consensus della release corrente e distanza dal precedente e dalla media recente | 29 |
| `f_gap_` | Cleveland Fed + ForexFactory | prima di T0 | nowcast meno consensus | 2 |
| `f_nowcast_` | Cleveland Fed | giorno d 23:59 ET | nowcast dell'inflazione | 2 |
| `f_react_` | Dukascopy tick delle release precedenti | T0 precedente + 60 s | memoria delle reazioni dell'oro alle release precedenti (stessa famiglia e altra famiglia) | 14 |
| `f_cal_` | calendario BLS/Fed/ForexFactory | noto in anticipo | giorni dall'ultimo e al prossimo FOMC, altre news ad alto impatto vicine, mese, settimana | 9 |
| `f_nfp_` | comunicati BLS Employment Situation | release + 60 s | livelli e revisioni NFP della release precedente | 4 |
| `f_ur_` | comunicati BLS | release + 60 s | disoccupazione | 3 |
| `f_ahe_` | comunicati BLS | release + 60 s | salari orari | 2 |
| `f_hours_` | comunicati BLS | release + 60 s | ore settimanali | 1 |
| `f_part_` | comunicati BLS | release + 60 s | partecipazione | 1 |
| `f_cpi_` | Tabella A BLS | release + 60 s | CPI della release precedente | 6 |
| `f_core_` | Tabella A BLS | release + 60 s | core CPI della release precedente | 8 |
| `f_rates_` | — | — | età del dato (solo controllo qualità, esclusa dai modelli) | 1 |

## Esclusioni

- `f_xau_px_age_min`, `f_rates_age_days`, `f_cot_age_days`: età del dato, solo controllo qualità.
- Una feature diventa primitiva di regola solo con copertura ≥ 70% nella scoperta del gruppo.
- Le revisioni NFP del 'previous' ForexFactory sono state tolte: FF riporta la prima stampa, non la revisione (verificato: 99,5% dei casi). Le revisioni vengono dai comunicati BLS.
