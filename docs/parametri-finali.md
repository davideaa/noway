# Configurazione trovata — stato al termine dell'ottimizzazione per strategia

Tutti i valori sono ottenuti su XAUUSD, 2019–2026, rischio fisso 0,6%,
Adaptive Risk **spento**. I punti R sono ricavati dall'equity finale
(`R = ln(equity/10000) / ln(1,006)`): è la misura confrontabile fra strategie,
perché non dipende dal numero di trade.

## Risultati per strategia

| | Punti R | Trade | PF | DD% | Sharpe | Stato |
|---|---:|---:|---:|---:|---:|---|
| **S2** — EMA cross (H1) | 130 | 687 | 1,28 | 13,2 | 1,11 | chiusa |
| **S3** — Donchian (M30) | 117 | 560 | 1,42 | 12,3 | 2,65 | chiusa |
| **S1** — TSMOM (H1) | 57–90 | 836 | 1,20 | 15,3 | 0,95 | picco da verificare |
| **Totale** | **304–337** | ~2.100 | | | | |
| *Card dichiarata* | *367* | *3.864* | *1,20* | *33* | *1,26* | |

Punto di partenza: **−2.664 $**, PF 0,97. Adesso 304–337 punti R, che allo
stesso rischio 0,6% della card valgono **+516% … +651%** contro il loro +798%.

## Parametri

### S1 — Time-Series Momentum (H1)

| Parametro | Valore | Origine |
|---|---|---|
| Lookback momentum | 24 barre | card |
| Soglia momentum | 0.5 ATR | card |
| EMA di regime | 100 | card |
| Barre pendenza EMA | 1 | default |
| Canale di rottura | 24 barre | card |
| Periodo ATR | 14 | default |
| Stop loss | 2.5 ATR | card |
| Attivazione trailing | **+1.0 R** | trovato (robusto) |
| **Distanza trailing** | **4.5 ATR** | trovato — **picco, da verificare** |

### S2 — Trend-Following EMA (H1)

| Parametro | Valore | Origine |
|---|---|---|
| EMA veloce | 10 | card |
| **Barre pendenza EMA** | **4** | trovato |
| **Soglia pendenza per barra** | **0.05 ATR** | trovato (plateau 0.03–0.07) |
| Periodo ATR | 14 | default |
| Stop loss | 2.0 ATR | card |
| Esci sul segnale opposto | true | card |
| **Uscita richiede conferma pendenza** | **true** | trovato — la correzione decisiva |
| EMA di regime | 0 (spenta) | non serve |

### S3 — Donchian + volatilità (M30)

| Parametro | Valore | Origine |
|---|---|---|
| Range di contesto | 480 barre | card |
| Canale di rottura | 60 barre | card |
| **Posizione nel range ("bordo")** | **0.91** | trovato (plateau 0.91–0.93) |
| ATR veloce / lento | 14 / 50 | default |
| **Filtro espansione volatilità** | **0.70** (di fatto disattivato) | il filtro non aggiunge nulla |
| Stop loss | 2.0 ATR | card |
| **Take profit** | **0 = nessuno** | **contraddice la card** (che dichiara 2.5R) |
| Attivazione trailing | +1.0 R | trovato |
| **Distanza trailing** | **4.0 ATR** | trovato (plateau 3–6) |

## Le tre cose che hanno cambiato tutto

1. **La distanza di trailing non va messa uguale allo stop.** Era l'errore in
   tutte e tre le strategie. Il valore giusto è **1,5–3 volte** la distanza di
   stop. Da solo questo ha portato S3 da 6 a 98 punti R e S1 da 0 a 90.

2. **Il take profit a 2,5R dichiarato nella card amputa la coda destra.**
   Senza target, tutte e quindici le configurazioni testate di S3 battono le
   corrispondenti con target. Il trade migliore passa da 159 $ a 1.795 $.

3. **Più trade non significa più guadagno.** Misurato tre volte:
   S2 con 1.666 trade rende 76 punti R, con 563 ne rende 132.
   S3 con 976 trade rende 53 punti, con 560 ne rende 117.
   Il numero di trade della card (3.864) non è un obiettivo da inseguire.

## Cosa la card dichiara e i dati non confermano

- **Take profit 2.5R** — peggiora ogni configurazione testata.
- **"Volatilità in espansione"** come condizione di ingresso — ininfluente:
  a bordo 0.91 i punti R vanno da 108 a 117 su tutto il range del filtro.
- **3.864 trade** — irraggiungibili mantenendo l'edge: le configurazioni ad
  alta frequenza hanno tutte profit factor vicino a 1.
- **"Tre strategie decorrelate"** — sono tre sistemi trend-following sullo
  stesso sottostante; la decorrelazione resta da misurare.

## Cosa manca

1. **S1**: verificare se 4.5 ATR è un picco fortunato (i vicini danno 53 e 59
   punti contro 90). Griglia fine 3.5→5.5 passo 0.25.
2. **Uniformare il simbolo**: S1 e S2 sono state ottimizzate su XAUUSD.s con
   tick reali, S3 su XAUUSD.p con tick generati. I parametri di S3 vanno
   riverificati su .s prima di combinare.
3. **Test combinato** con le tre strategie insieme, poi con Adaptive Risk.
4. **Test 2011–2018.** È l'unico numero onesto rimasto: le tre strategie sono
   state ottimizzate tutte sullo stesso periodo 2019–2026, quindi il risultato
   combinato sarà per forza ottimistico. Il fuori periodo dirà quanto.
