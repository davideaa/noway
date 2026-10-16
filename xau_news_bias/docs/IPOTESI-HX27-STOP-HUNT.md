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
