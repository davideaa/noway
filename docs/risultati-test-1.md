# Test #1 — risultati e diagnosi

Backtest: XAUUSD.s (PU Prime Demo), H1, 2019.06.01 → 2026.09.18, tick reali
(qualità storico 77%), deposito 10.000 USD, leva 1:100, parametri di default.

## Risultato aggregato

| Metrica | Ottenuto | Card | Esito |
|---|---|---|---|
| Profitto netto | **−2.663,91** | +798% | ✗ |
| Profit factor | **0,97** | 1,20 | ✗ |
| Win rate | **33,45%** | 42% | ✗ |
| Trade | **5.746** (787/anno) | 3.864 (530/anno) | ✗ +49% |
| Max DD | **53,77%** | 33% | ✗ |
| Sharpe | −0,26 | 1,26 | ✗ |

## Attribuzione per strategia

P&L ricostruito dai 11.492 deal del report (abbinamento FIFO in/out; il
totale quadra al centesimo con il profitto netto ufficiale).

| Strategia | Trade | WR | PF | P&L | avg win | avg loss |
|---|---:|---:|---:|---:|---:|---:|
| **S3 — Donchian + Vola** | 709 | **52,8%** | **1,49** | **+7.696** | 62,52 | −46,82 |
| **S1 — TSMOM** | 985 | 43,1% | 1,01 | +188 | 50,69 | −38,14 |
| **S2 — EMA cross** | **4.052** | **27,7%** | **0,81** | **−10.548** | 39,65 | −18,76 |

## P&L per anno

| Anno | S1 | S2 | S3 | Totale | Trade (S1/S2/S3) |
|---|---:|---:|---:|---:|---|
| 2019 | +31 | −1.492 | +1.041 | −420 | 91/330/50 |
| 2020 | +975 | −1.698 | +1.360 | +636 | 130/588/87 |
| 2021 | −241 | −1.281 | −104 | −1.626 | 144/600/100 |
| 2022 | −568 | +67 | +464 | −36 | 157/571/88 |
| 2023 | −477 | −1.923 | +1.296 | −1.103 | 150/583/109 |
| 2024 | −34 | −2.008 | +1.383 | −659 | 147/582/98 |
| 2025 | +292 | −1.418 | +1.007 | −120 | 134/534/113 |
| 2026 | +211 | −795 | +1.249 | +665 | 32/264/64 |

## Diagnosi

**1. Il conto È hedging.** Nel report compaiono posizioni simultanee e
indipendenti sullo stesso simbolo (es. 2019.06.03: S3 buy 0,26 e S1 buy 0,14
aperte insieme, chiuse a orari diversi con SL propri). Su conto netting
sarebbero state fuse in un'unica posizione. Il problema non esiste.

**2. S3 funziona, e funziona come la card.** PF 1,49, win rate 52,8%,
positiva in 7 anni su 8, **negativa solo nel 2021** — esattamente la firma
della heatmap originale, dove il 2021 è l'unico anno rosso (−17%). Questa
strategia è ricostruita bene.

**3. S1 è neutra.** PF 1,01 su 985 trade (135/anno): il conteggio è
plausibile, il risultato no. Problema di uscita, non di ingresso: vincita
media 0,84R e perdita media 0,63R contro il profilo 1,6R / 1,0R della card.
Il trailing taglia i vincenti troppo presto.

**4. S2 è la ferita aperta: −10.548 su 4.052 trade, negativa in 7 anni su 8.**
Da sola spiega l'intera perdita e i 1.900 trade di troppo. Due cause:

- **Soglia di pendenza troppo lasca.** 0,05 ATR per barra filtra quasi nulla:
  555 trade/anno per la sola S2.
- **Uscita asimmetrica (il difetto vero).** Il codice apriva solo su incrocio
  *qualificato* (con pendenza) ma chiudeva su qualsiasi incrocio, anche
  debolissimo. Risultato: perdita media −18,76 su un rischio di ~60$, cioè
  **0,31R**. Le posizioni non raggiungevano mai lo stop, venivano espulse da
  rumore. È churn puro: 4.052 trade per pagare spread.

## Correzioni applicate all'EA

- `InpS2ExitNeedsSlope` (default **true**) — l'uscita richiede la stessa
  conferma di pendenza dell'ingresso. È la correzione strutturale principale.
- Pendenza **normalizzata per barra** (`slope / SlopeBars`): ora la soglia è
  indipendente da `InpS2SlopeBars` e la griglia di ottimizzazione ha senso.
- `InpS2RegimeEmaPeriod` (default **0 = off**) — filtro di regime opzionale,
  da testare solo se il punto sopra non basta. Non è dichiarato nelle card:
  accenderlo significa aggiungere un grado di libertà che loro non ammettono.
- `PrintStrategySummary()` in `OnDeinit` — a fine test il Diario stampa
  trade / WR / PF / P&L / avg win / avg loss **per strategia**, attribuiti via
  `DEAL_MAGIC` (esatto, non ricostruito). Non serve più esportare il report.

## Prossimo test (in quest'ordine)

**Passo 1 — isolare S2.** `InpS1Enabled=false`, `InpS3Enabled=false`,
`InpUseAdaptiveRisk=false`. Ottimizza:

| Input | Da | A | Passo |
|---|---|---|---|
| `InpS2SlopeMinATR` | 0.05 | 0.40 | 0.05 |
| `InpS2SlopeBars` | 1 | 5 | 1 |
| `InpS2ExitNeedsSlope` | false | true | — |

80 passate, pochi minuti. **Target: ~2.170 trade** (≈297/anno — è il numero
che serve perché il totale torni a 3.864 con S1 e S3 agli attuali conteggi),
**PF > 1,05**, **win rate ~36%**. Scegli un plateau, non il picco.

**Passo 2 — se nessuna combinazione porta S2 sopra PF 1,00**, allora la
descrizione della card è incompleta: prova `InpS2RegimeEmaPeriod` in
{50, 100, 200}. Se serve un filtro non dichiarato per rendere S2 profittevole,
è un'informazione di per sé.

**Passo 3 — S1 da sola.** `InpS1TrailATR` 1.0→3.5 passo 0.5,
`InpS1AtrPeriod` 10→20 passo 2. Il conteggio trade è già giusto: il problema
è la vincita media, quindi lavora sul trailing.

**Passo 4 — S3 da sola.** Verifica solo la *stabilità*:
`InpS3EdgeThreshold` 0.70→0.95, `InpS3VolExpandRatio` 0.90→1.30. Funziona
già: se il risultato regge su tutto il piano, è edge; se sta in piedi solo su
un valore, è rumore. **Non ottimizzarla oltre.**

**Passo 5** — ricombina le tre, poi riaccendi l'Adaptive Risk per ultimo.

## Cosa dicono già questi numeri sul prodotto originale

Delle tre "strategie decorrelate" della card, nella ricostruzione **una sola
produce edge** (S3, PF 1,49 — e replica anche la firma annuale giusta). S1 è
a zero e S2 è negativa in modo sistematico e strutturale, su 8 anni.

Sono possibili due letture, e il Passo 2 le distingue:

1. la mia ricostruzione di S1 e S2 sbaglia un parametro non dichiarato — e
   allora l'ottimizzazione lo troverà;
2. S1 e S2 nel prodotto originale non aggiungono edge, e servono a far
   sembrare "diversificato" ciò che è un solo breakout system.

Nota: S3 è anche l'unica delle tre che la card descrive con parametri
sufficienti a replicarla senza ambiguità (480/60 barre, bordo del range,
espansione di volatilità, stop 2 ATR, target 2.5R). S2 è quella descritta in
modo più vago — una riga e mezza — ed è quella che non funziona.
