# Forex 1 — il ritracciamento nel trend (USDJPY H1)

Scritto il 2026-09-23, **prima** di qualunque test. Non si cambia dopo.
EA: `mt5/FxTrendPullback.mq5`. Metodo: `docs/metodo.md`, in ordine.

## 1. L'idea, con un perché

Le coppie col yen si muovono a ondate: differenziale dei tassi, carry che
entra ed esce, interventi della banca centrale. Dentro un'ondata il prezzo
riparte dopo una correzione più spesso di quanto la continui. Perde chi
vende la correzione credendo all'inversione, e chi compra il massimo e
viene stoppato dal ritracciamento.

Da dove viene la forma dell'ingresso: 10 operazioni USDJPY H1 viste in una
foto (agosto-settembre 2026). Non dimostrano niente, danno solo la forma.
La struttura del codice è quella di `GoldTrendPullback`, già provata
sull'oro (è diventata il RITRACCIAMENTO di V1XAU).

## 2. I criteri, scritti prima

**Dati (aggiornato da Davide il 2026-09-23): dentro campione
2019.01.01 – 2022.12.31. Fuori campione 2023.01.01 – 2026.09, congelato:
si guarda una volta sola, per ultimo, quando la strategia è finita, col
rischio scelto e il Monte Carlo già fatto** (deciso da
Davide).

### Dentro campione

| | soglia |
|---|---|
| operazioni | ≥ 200, e ogni anno ≥ 20 |
| guadagno medio | ≥ +0,05 R netto |
| t | ≥ 3 con la prima configurazione; dopo ogni ottimizzazione, ≥ radice(2 × ln K) e comunque ≥ 3 |
| **long e short** | **in utile tutti e due, separatamente**. Se vive da una parte sola è il trend di USDJPY, non la regola |
| tetto a 3 R su ogni vincita | resta in utile |
| costi × 3 | resta in utile |
| plateau | ±20% su ogni parametro ottimizzato, i vicini devono rendere anche loro |
| filtri su ore o giorni | nessuno |

### Altre coppie, stessi parametri (passo 14), dichiarato prima

- **EURJPY e GBPJPY: devono essere in utile** tutte e due. Stesso
  meccanismo (il yen), se non funziona lì la regola è cucita su USDJPY.
- **EURUSD: nessuna previsione di utile.** Senza il yen l'ipotesi non vale;
  se rende è un'informazione, se no non boccia.

### Fuori campione (2023–2026), un colpo solo

| | soglia |
|---|---|
| segno | in utile |
| t | ≥ 1,65 |
| guadagno medio | ≥ +0,05 R |
| long e short | nessuno dei due sotto −10 R |

### Obiettivo di Davide: almeno 365 operazioni all'anno (2026-09-23)

Sul **conto forex intero**, non su una coppia. Si raggiunge mettendo le
stesse regole su **più coppie** (quelle che passano il passo 14), **non**
allentando le regole su USDJPY o scendendo di timeframe: più operazioni
fatte con un ingresso peggiore sono solo più costi. Il vantaggio è
statistico: a 365 operazioni all'anno l'edge si conferma dal vivo in
mesi invece che in anni.

### Conto forex

Drawdown del conto, Monte Carlo a blocchi da 20: **≤ 35% al 95°
percentile**. Il rischio lo decide questo tetto; il rendimento si calcola
col numero basso.

## 3. Le uscite si ottimizzano dopo

Prima si prova l'ingresso coi valori a priori (EMA 100, pendenza 3 barre,
massimo su 20 barre, ritracciamento 1 ATR, stop 0,3 ATR oltre il minimo,
target 2 ATR, uscita dopo 24 barre, trailing spento). Poi si ottimizzano
**solo** target e uscita a tempo, su una griglia dichiarata prima, e ogni
configurazione provata entra nel conteggio K.

## Registro delle configurazioni provate (K)

| # | data | cosa | esito |
|---|---|---|---|
| 1 | 2026-09-23 | valori a priori, USDJPY H1 2019–2022 (il report finisce al 2023-01-01) | **bocciata**: 1.433 operazioni (~358 all'anno), −0,113 R a operazione, **t −4,40**. Long −50 R, short −112 R: perdono tutte e due. Uscite: 503 target, 700 stop, 230 a tempo. Lo spread costa ~0,05 R (stop mediano 23 pip): anche prima dei costi l'ingresso perde. Il difetto è l'ingresso, non l'uscita |

**Conclusione del #1:** su USDJPY H1 «riparte dopo la correzione» non
regge: la correzione continua più spesso di quanto si pensasse. Il
ritracciamento che funziona sull'oro H4 non si trasporta qui.
