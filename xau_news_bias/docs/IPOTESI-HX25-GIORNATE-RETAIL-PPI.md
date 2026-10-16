# H-X25 — Giornate Retail + PPI insieme: quanto muovono e dove uscire (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare qualunque numero qui sotto.

## Richiesta di Davide

- Giornate come il 15/10/2026: alle 08:30 ET escono insieme Retail Sales
  m/m, Core/Control, PPI m/m, Core PPI, Jobless Claims, Empire State.
- Quanto muove di solito la prima M1 (pips, wick compresa), anno per
  anno, e se cambia quando escono insieme.
- Se conviene chiudere alla fine della M1, aspettare 5 minuti, oppure
  mettere un livello che chiude appena lo tocca.
- Se la grandezza della sorpresa dice quanto sarà grande la candela.

## Cosa si è già visto, da dichiarare

- **Il 2019–26 di Retail/PPI non è vergine**:
  - H-X15 (direzione 2020–23), H-X16 (ampiezza 2020–26);
  - H-X18: dopo la M1 il prezzo continua nella stessa direzione solo il
    37% delle volte nel 2023–26;
  - H-X19: take profit al 33° percentile e alla mediana dell'arrivo
    (ultime 24 release) peggio della chiusura M1 nel 2019–22 e 2023–26;
  - H-X20 e H-X23: la memoria delle ultime 12 release prevede i pips.
- La grandezza della sorpresa Retail/PPI contro la candela non è mai
  stata misurata.
- Quindi un "passa" vale al massimo **"da registrare dal vivo"**.

## Eventi e gruppi

- Le release RETAIL e PPI di `calendario_tutti.parquet`, dal 2011 al
  15/10/2026, con i tick Dukascopy in cache (295 slot).
- Gruppo dato da **tutte** le righe USD ForexFactory dello stesso minuto,
  di qualunque impatto:
  - **R**: c'è "Retail Sales m/m", non c'è "PPI m/m";
  - **P**: c'è "PPI m/m", non c'è "Retail Sales m/m";
  - **RP**: ci sono tutti e due.
- Limite già noto: un PPI segnato Medium da ForexFactory, in un giorno
  senza Retail, non è nel campione (tutto il 2020).
- Il gruppo RP è piccolo (circa 13 release nel 2019–26): le mediane per
  anno di RP stanno su 1–4 release.

## Misure per release

- j = ultimo tick a T0 − 30 s o prima (non prima di T0 − 120 s).
- p0 = prezzo medio in j.
- **d** = segno di (prezzo medio all'ultimo tick prima di T0 + 60 s − p0).
  d = 0: fuori dalle parti con la direzione.
- **Range M1** = massimo − minimo del bid fra T0 e T0 + 60 s, compreso
  l'ultimo bid prima di T0 (wick inclusa, come il grafico MT5).
- **Arrivo 1 min** = massimo di d · (prezzo medio − p0) fra j e T0 + 60 s.
- **Arrivo 5 min** = lo stesso fino a T0 + 5 min.
- **Chiusura M1** = d · (prezzo medio a T0 + 60 s − p0).
- **Dopo la M1** = d · (prezzo medio a T0 + 5 min − prezzo medio a
  T0 + 60 s), con la quota di volte in cui è > 0.
- Tutto in pips (1 pip = 0,10 $) e in % del prezzo.

**Descrittivo**: mediane per gruppo e per anno 2019–2026, più il blocco
2011–18.

## Uscite (trade di Davide)

- Ingresso a T0 − 30 s: ask per il LONG, bid per lo SHORT.
- Spread Dukascopy con tetto 40 pips (`quotes(..., 'S1')`).
- Stop 100 pips, perdita tagliata a −1R. Il LONG chiude sul bid, lo
  SHORT sull'ask.

| Codice | Uscita |
|---|---|
| **E60** | chiusura a T0 + 60 s (riferimento) |
| E300 | chiusura a T0 + 5 min |
| TP50 | take profit alla mediana dell'arrivo 1 min delle 12 release precedenti, se no E60 |
| TP75 | take profit al 75° percentile dell'arrivo 1 min, se no E60 |
| TP50_5 | take profit alla mediana dell'arrivo 5 min delle 12 precedenti, se no E300 |
| TP75_5 | take profit al 75° percentile dell'arrivo 5 min, se no E300 |

- Livelli **passo per passo**:
  - in % del prezzo, sulle 12 release Retail/PPI precedenti (tutti i
    gruppi insieme, mai la release stessa);
  - convertiti in $ al prezzo d'ingresso;
  - misurati dal prezzo d'ingresso sul lato di chiusura, come in H-X19.
- Secondario: livelli sulle 12 precedenti **dello stesso gruppo** (per RP
  coprono circa 6 anni).
- Due versioni della direzione:
  - **giusta** = d, per isolare la domanda "dove uscire";
  - **a caso** = media di LONG e SHORT.
- Periodi:
  - studio 2011–18, dalla 13ª release in poi;
  - conferma 2019–22 e 2023–26.

**Regola**: un'uscita è **migliore di E60** se il suo R medio con la
direzione giusta è più alto di quello di E60 **sia nel 2019–22 sia nel
2023–26**.

Si riportano anche:
- quota di release in cui l'uscita fa meglio di E60, con binomiale
  bilaterale (pareggi esclusi);
- quota di trade in utile;
- R medio a caso. Se un'uscita "migliore" peggiora l'R a caso di oltre
  0,05 in un periodo, si dice;
- quota di volte in cui il livello viene toccato, contro il 50% (mediana)
  e il 25% (75° percentile), con binomiale bilaterale.
- Sei confronti per due periodi: un "migliore" isolato può essere caso.

## La sorpresa dice quanto sarà grande la candela?

- Per Retail Sales m/m e PPI m/m: s = actual − forecast di ForexFactory.
  La colonna `previous` non si usa.
- Scala = media dei |s| di **tutte le release precedenti** dello stesso
  dato (ForexFactory dal 2007, almeno 12).
- z = |s| ÷ scala.
- **S = z_Retail + z_PPI**. Un dato che non esce in quel minuto vale 0.
  Un dato uscito senza actual o forecast: release fuori. Il 15/10/2026 non
  ha ancora l'actual nel file: fuori da questa parte.
- **Grandezza relativa** = range M1 (% del prezzo) ÷ mediana del range %
  delle 12 release precedenti (tutti i gruppi).
- Spearman fra S e grandezza relativa, p unilaterale (ρ > 0), nel 2011–18
  e nel 2019–26.
- **Passa** se ρ > 0 con p < 0,05 in tutti e due i periodi.
- Descrittivo, non decide:
  - lo stesso nei gruppi R e P da soli;
  - con i quattro dati (anche Core Retail e Core PPI);
  - Spearman con il range in pips;
  - range in pips nel 2019–26 quando S è nel terzo alto delle S
    precedenti, contro il terzo basso.
