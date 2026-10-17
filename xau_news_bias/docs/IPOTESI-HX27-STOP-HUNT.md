# H-X27 — Stop hunt: il primo scatto dei primi secondi torna indietro? (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare qualunque risultato. Fino a
qui ho solo contato i dati: slot con tick in cache dal 2011 al
15/10/2026 (ultimo slot passato).

| Gruppo | 2011–18 (studio) | 2019–26 (conferma) |
|---|---|---|
| NFP | 95 | 89 |
| CPI | 95 | 91 |
| Retail/PPI | 148 | 147 |
| Altre rosse (FOMC, verbali, PIL, ISM, ADP, fiducia, Michigan, claims) | 945 | 610 |

CPI e NFP da `cpi_nfp.parquet` (manca il CPI del 14/10/2026, non è nel
file); le altre da `calendario_tutti.parquet`. Ogni slot conta una volta.

## L'idea di Davide, detta semplice

Alla news il prezzo fa uno scatto nei primi secondi. Davide pensa che
quello scatto serva a "prendere gli stop" (stop hunt) e che poi il
prezzo vada dall'altra parte. Se è vero, chi entra **contro** lo scatto
dopo 5 o 10 secondi guadagna.

## Cosa si è già visto, da dichiarare

- **Il 2019–26 di tutte queste news è già stato guardato** (fase 2 per
  CPI/NFP, H-X15, H-X16, H-X18, H-X19, H-X25 per le altre). Il fade dei
  primi 5–10 secondi come regola non è mai stato calcolato, ma un "passa"
  vale al massimo **"da registrare dal vivo"**.
- Indizi contrari già noti (`STOP-MAE-MFE-ANALYSIS.md`): per CPI/NFP due
  terzi del movimento a favore arrivano nei primi 5 secondi; il percorso
  "prima uno scatto contrario, poi il movimento" è il 5–13% delle release.
- H-X18: dopo la prima M1 le altre rosse 2024–26 tornano indietro il
  52,4% delle volte (p 0,23, non passa). H-X15 P3 (sfumare la candela
  dopo 1 minuto) non è passata.

## Misure (descrittive, per gruppo e periodo)

- p0 = prezzo medio dell'ultimo tick prima di T0 (non prima di T0 − 120 s).
- mid(x) = prezzo medio dell'ultimo tick a x secondi o prima.
- **Scatto** a k = 3, 5, 10 s: s_k = segno(mid(k) − p0). s_k = 0 (nessun
  tick o nessun movimento): fuori.
- **Dopo**: s_k · (mid(X) − mid(k)), con X = ultimo tick prima di
  T0 + 60 s e prima di T0 + 5 min. Torna indietro se < 0, continua se > 0
  (zeri fuori). Quota con binomiale unilaterale, pips mediani.
- **Sweep**: H15/L15 = massimo/minimo del prezzo medio fra T0 − 15 min e
  T0. Rottura se nei primi 10 s il prezzo medio va sopra H15 o sotto L15
  (se tutte e due, conta la prima). Sweep se il prezzo medio all'ultimo
  tick prima di T0 + 60 s è di nuovo fra L15 e H15. Si riporta quante
  volte succede e cosa fa il prezzo da T0 + 60 s a T0 + 5 min.

## Regole (le uniche che possono passare)

Prezzi Dukascopy reali, spread tagliato a 40 pips (`hx11_site.quotes`,
S1). LONG entra all'ask ed esce al bid, SHORT il contrario. Nessun altro
costo. Stop controllato tick per tick sul lato di uscita, perdita
tagliata a −1R. R = guadagno ÷ distanza dello stop.

| Codice | Ingresso | Direzione | Uscita |
|---|---|---|---|
| F5_S100_E60, F5_S100_E300, F5_SX_E60, F5_SX_E300 | ultimo tick a T0 + 5 s | contro s_5 | T0 + 60 s / T0 + 5 min |
| F10_S100_E60, F10_S100_E300, F10_SX_E60, F10_SX_E300 | ultimo tick a T0 + 10 s | contro s_10 | T0 + 60 s / T0 + 5 min |
| W_S100_E300, W_SX_E300 | ultimo tick prima di T0 + 60 s, solo se c'è lo sweep | contro la rottura | T0 + 5 min |

- **S100**: stop a 100 pips (10 $) dall'ingresso.
- **SX**: stop oltre l'estremo dello scatto: per lo SHORT il massimo
  dell'ask da T0 all'ingresso, per il LONG il minimo del bid; distanza
  minima 10 pips.
- Uscita all'ultimo tick prima dell'ora di uscita, al bid (LONG) o
  all'ask (SHORT).

**Il caso** per ogni regola: stesso ingresso, stop e uscita, media di
LONG e SHORT (per SX ogni lato usa il proprio estremo). Si riporta anche
"segui lo scatto" (direzione opposta al fade): **descrittivo, non può
passare** in questo test.

**Riferimento**: trade di Davide (T0 − 30 s, stop 100 pips, uscita
T0 + 60 s e T0 + 5 min), direzione a caso, diviso fra release in cui lo
scatto a 5 s va a favore o contro; per quelle contro, R se chiudesse a
T0 + 5 s.

## Criterio di passaggio (deciso adesso)

Vinto = trade con R > 0 dopo lo spread.

Una regola **passa** se, su tutte le news insieme:
1. **conferma 2019–26**: quota vinti > 50% con binomiale unilaterale,
   p corretto Holm sulle 10 regole < 0,05, **e** R medio > 0;
2. **studio 2011–18**: quota vinti > 50% **e** R medio > 0 (stesso
   segno).

H-X27 passa se passa almeno una regola. Stessi criteri per NFP, CPI,
Retail/PPI e altre rosse, con Holm sulle 40 prove (10 regole × 4
gruppi): **secondario**, si riporta.

- **Se passa**: al massimo da registrare dal vivo (anni già visti).
- **Se non passa**: lo scatto dei primi secondi non torna indietro
  abbastanza da pagare lo spread.

Sempre riportati, passi o no: quote, p, R medio per regola, gruppo e
periodo; il caso; lo stesso con spread fisso a 40 pips (broker di Davide
alla news, solo sensibilità).

## Limiti noti

- Tick Dukascopy ogni 100–200 ms circa; dal vivo l'ordine a T0 + 5 s
  parte più tardi e con slittamento, che qui non c'è.
- Lo spread del broker di Davide alla news è più largo di quello
  Dukascopy.

## Risultati (dopo il commit `19e16af` della pre-registrazione)

File: `research_output/phase2/hx27/hx27_stophunt.json` (riga per release in
`hx27_eventi.parquet`). Codice: `scripts/hx27_stophunt.py`.

2.220 release, 2.219 valide (scartato il 25/03/2016, Venerdì Santo, senza
tick). Conferma 2019–26: 937 release; studio 2011–18: 1.282.

### Verdetto: **non passa.** Nessuna regola, in nessun gruppo.

Tutte le news insieme, vinti = trade con R > 0 dopo lo spread Dukascopy
reale (tagliato a 40 pips). Holm sulle 10 regole: p corretto 1,00 per
tutte.

| Regola | Conferma 2019–26: vinti | R medio | Caso | Segui lo scatto | Studio 2011–18: vinti | R medio |
|---|---|---|---|---|---|---|
| F5_S100_E60 | 38,1% | −0,075 | −0,067 | −0,058 | 29,0% | −0,064 |
| F5_S100_E300 | 39,8% | −0,088 | −0,072 | −0,056 | 35,7% | −0,077 |
| F5_SX_E60 | 25,5% | −0,351 | −0,288 | −0,225 | 22,5% | −0,453 |
| F5_SX_E300 | 18,8% | −0,381 | −0,326 | −0,271 | 19,2% | −0,488 |
| F10_S100_E60 | 37,3% | −0,058 | −0,066 | −0,075 | 29,9% | −0,058 |
| F10_S100_E300 | 43,2% | −0,048 | −0,065 | −0,083 | 37,6% | −0,075 |
| F10_SX_E60 | 25,6% | −0,351 | −0,283 | −0,214 | 25,9% | −0,395 |
| F10_SX_E300 | 21,9% | −0,371 | −0,323 | −0,275 | 22,8% | −0,439 |
| W_S100_E300 (164 sweep) | 33,5% | −0,084 | −0,048 | −0,013 | 37,3% | −0,026 |
| W_SX_E300 | 31,7% | −0,294 | −0,254 | −0,215 | 34,1% | −0,202 |

- Andare contro lo scatto fa **peggio del caso** in 8 regole su 10; nelle
  altre 2 meglio di 0,01–0,02 R, cioè niente.
- Con lo spread fisso a 40 pips (broker di Davide alla news) tutte le
  regole perdono fra −0,39 e −0,84 R.
- Lo spread Dukascopy mediano all'ingresso a T0 + 5 s è 6 pips (NFP 9).
  Per questo anche a caso si vince solo il 39% circa: un trade vince solo
  se il prezzo si muove più dello spread.

**Per gruppo (conferma 2019–26)**, le due regole principali:

| Gruppo | F5_S100_E60: vinti, R (caso) | F10_S100_E300: vinti, R (caso) |
|---|---|---|
| NFP (89) | 36,0%, −0,093 (−0,048) | 39,3%, −0,027 (−0,051) |
| CPI (91) | 42,9%, −0,085 (−0,050) | 47,3%, −0,034 (−0,075) |
| Retail/PPI (147) | 40,8%, −0,062 (−0,074) | 46,9%, −0,013 (−0,064) |
| Altre rosse (610) | 37,0%, −0,074 (−0,070) | 42,2%, −0,062 (−0,066) |

Nessuna delle 40 prove di gruppo passa (p non corretto migliore 0,66).

### Senza costi: lo scatto torna indietro? No, è una moneta

Quota di release in cui il prezzo medio, dopo lo scatto, va dalla parte
opposta:

| | Scatto a 5 s → T0 + 60 s | Scatto a 10 s → T0 + 5 min | Scatto mediano a 5 s |
|---|---|---|---|
| Tutte 2019–26 | 48,8% (p 0,78) | 51,5% (p 0,19) | 15 pips |
| Tutte 2011–18 | 42,4% (cioè **continua** il 58%) | 44,8% | 4 pips |
| NFP 2019–26 | 44,9% | 43,8% | 50 pips |
| CPI 2019–26 | 50,5% | 53,8% (p 0,27) | 35 pips |
| Retail/PPI 2019–26 | 48,3% | 55,1% (p 0,12) | 14 pips |
| Altre 2019–26 | 49,2% | 51,4% | 11 pips |

- Per anno (scatto 5 s → 60 s, tutte): 2011 32%, 2012 35%, 2013 38%,
  2014 40%, 2015–16 45%, 2017 49%, 2018 56%, 2019 49%, 2020 59%,
  2021 42%, 2022 49%, 2023 47%, 2024 58%, 2025 41%, 2026 41%. Prima lo
  scatto continuava, dal 2018 è testa o croce.
- **Sweep** (2019–26): nei primi 10 s il prezzo rompe il massimo o il
  minimo dei 15 minuti prima nel 64% delle release (NFP 92%, CPI 85%).
  Torna dentro a fine minuto solo il 27% delle rotture (164 casi). Dopo,
  fino a T0 + 5 min, va contro la rottura solo il 41% (p 0,99, mediana
  −4 pips): quando c'è, lo sweep più spesso **riparte nella direzione
  della rottura**.

### Riferimento: il trade di Davide (T0 − 30 s, stop 100 pips, a caso)

| 2019–26 | R a T0 + 5 s | R a T0 + 60 s | R a T0 + 5 min |
|---|---|---|---|
| Tutte, scatto a 5 s **contro** | −0,30 | −0,29 | −0,30 |
| Tutte, scatto a 5 s a favore | +0,17 | +0,20 | +0,20 |
| NFP, scatto contro | −0,57 | −0,54 | −0,49 |
| NFP, scatto a favore | +0,43 | +0,57 | +0,52 |

Se dopo 5 secondi lo scatto è contro la posizione, tenere fino a fine
minuto o a 5 minuti in media non recupera (solo il 16,5% chiude in
utile a T0 + 60 s). A caso il trade rende −0,046 R (60 s) e −0,052 R
(5 min).

### Esplorativo, non pre-registrato come regola (non promuove niente)

- NFP: lo scatto dei primi **3 secondi** continua fino a T0 + 60 s il 63%
  delle volte nel 2019–26 (p 0,010) e il 59% nel 2011–18 (p 0,065). È il
  contrario dello stop hunt. Ma è una cella su 48 descrittive (con
  Bonferroni p ≈ 0,46) e **non si può tradare**: entrando a T0 + 5 s nella
  direzione dello scatto la NFP rende −0,002 R (2019–26) e −0,081 R
  (2011–18). È lo stesso fatto già noto: il grosso arriva nei primi 5 s.

### Errori e limiti dichiarati

- Dopo aver visto i risultati delle regole ho aggiunto allo script due
  campi **solo descrittivi** (spread all'ingresso e p della
  continuazione). Le regole e il verdetto non cambiano: rifatto, numeri
  identici.
- Il "vinti" con R > 0 dopo lo spread è severo (a caso fa il 39%), ma
  anche senza costi la direzione è al 49–52%: il risultato non dipende
  da questa scelta.
- La continuazione forte del 2011–13 potrebbe essere in parte dovuta ai
  tick Dukascopy più radi di quegli anni.
- Rispetto al calendario ForexFactory (impatto alto), in
  `cpi_nfp.parquet` mancano 8 release: 6 cadute il Venerdì Santo (CPI
  14/04/2017 e 10/04/2020; NFP 03/04/2015, 02/04/2021, 07/04/2023,
  03/04/2026), più la NFP del 02/10/2026 e il CPI del 14/10/2026, uscite
  dopo che il file è stato fatto. **Errore nella pre-registrazione**:
  scrivevo che mancava solo il CPI del 14/10; manca anche la NFP del
  02/10. Due release in più non cambiano un verdetto con p corretti a
  1,00.
- Dukascopy non è il broker di Davide; ingresso a T0 + 5 s senza
  slittamento: dal vivo andrebbe peggio, non meglio.

**In parole semplici**: alla news il primo scatto non è una trappola che
poi torna indietro. Dal 2019 dopo lo scatto il prezzo va su o giù a caso
(49–52%), e prima del 2018 tendeva anzi a continuare. Andare contro lo
scatto perde lo spread e anche un po' di più.
