# Registro degli esperimenti (fase 2) — riepilogo

Fonte: tabelle `experiments`, `campaign` e `perm_results` del database
(`xnb/phase2/registry.py`). La copia machine-readable è
`research_output/phase2/experiment_registry.json`. La dashboard (Compute
Center, Discovery Lab) legge le stesse tabelle.

## Conteggio di tutto quello che è stato provato

| Fase | Gruppo | Cosa | Ipotesi |
|---|---|---|---|
| Ricerca di regole | CPI | singole + coppie + terne (beam 300) × LONG/SHORT × T−1H/T−1M | 1.622.027 |
| Ricerca di regole | NFP | idem | 1.558.481 |
| Ricerca di regole | CPI+NFP | idem, supporto minimo 30 | 1.478.986 |
| Modelli | tutti | 3 gruppi × 3 modelli × 10 insiemi di feature × 3 adattività × 4 soglie | 1.080 |
| Validazione CPI 2020–26 (esposta) | CPI | 5 regole CPI + 5 condivise + 2 modelli | 12 |
| Conferma finale NFP 2020–26 | NFP | 3 regole + 2 modelli | 5 |
| Esplorativo H-X1 (dopo il finale) | tutti | spazio U_news/spread per terzili | 6 |
| **Totale** | | | **4.660.597** |

In più:

- **Permutazioni**: 1.000 per gruppo. Ognuna ripete la ricerca intera
  (2 cutoff × 2 direzioni, più il sottoinsieme di sola price action): in
  tutto circa 4,7 miliardi di valutazioni di ipotesi sotto il nullo.
  18.000 valori salvati in `perm_results` (1.000 permutazioni × 3 gruppi ×
  6 chiavi).
- **Descrittivi, senza verdetto**: 64 regole semplici di price action
  (`pa_simple_baselines`), 9 baseline per gruppo, checkpoint del modello
  scelto a 8 cutoff, vicini delle regole NFP (`nfp_rule_neighbors.csv`),
  oracolo e stop (`p2_stops.json`).
- **Fase 1** (CPI, già chiusa): conteggi in `RISULTATI-CPI.md`.

## Campagne (Compute Center)

| Campagna | Stato | Lavori | Worker | Modalità | Durata |
|---|---|---|---|---|---|
| `p2_rules_v1` | completata | 1.000/1.000 permutazioni, 0 errori | 4 | MAXIMUM | 12 min (1,64 permutazioni/s) |
| `p2_models_v1` | completata | 270/270 walk-forward (× 4 soglie), 0 errori | 4 | MAXIMUM | 35 s |

Le campagne sono riprendibili. Ogni permutazione è scritta in una
transazione (tutta o niente); al riavvio si saltano quelle già salvate.
Il risultato non dipende dal numero di worker: il seme di ogni
permutazione è `20260926 + 100003 × p + seme del gruppo`, e ogni processo
usa un solo thread BLAS.

## Riproducibilità

| Cosa | Valore |
|---|---|
| Dati congelati (SHA-256, prime 12) | eventi `0a1e6ca76066`, percorsi tick `6810d9548c3a`, feature `6bbc2c066951` |
| Seme della ricerca | `SEED = 20260926`; semi di gruppo CPI 11, NFP 23, condiviso 37 |
| Seme dei modelli | LightGBM e PCA `random_state = 7`; baseline casuale 99; bootstrap 5 |
| Codice | protocollo `200a0bf`; motore di scoperta `09595f8`; emendamento 1 `9d0a778`; risultati `2dae02f` |
| Sigillo del test finale | `FINAL_NFP_OPENED.json`: aperto 2026-09-26 12:00:17 UTC, commit `9d0a778`, hash dei file dei candidati `9cd49684bce4` (regole) e `60beb63518b9` (modelli) |

## Imprecisioni del registro (dette, non corrette a posteriori)

1. Le righe della ricerca di regole portano il commit `200a0bf`: la
   campagna è partita prima che il codice del motore fosse committato
   (`09595f8`, committato mentre le permutazioni giravano e prima di
   guardarne i risultati). Il codice eseguito è quello di `09595f8`. La
   correzione successiva del beam (`search` con meno di 300 coppie valide)
   non cambia niente sui dati reali: ci sono oltre un milione di coppie.
2. Nelle righe della ricerca e dei modelli il campo `dataset_sha` contiene
   il segnaposto `p2` invece dell'hash delle feature. L'hash giusto
   (`6bbc2c066951`) è nel manifest e nel sigillo del test finale.
3. `p2_manifest.json` riporta `n_features: 361`: conta le feature del
   primo evento, non l'unione. Le feature sono **496**, come nel protocollo
   e in `FEATURE-REGISTRY.md`.
