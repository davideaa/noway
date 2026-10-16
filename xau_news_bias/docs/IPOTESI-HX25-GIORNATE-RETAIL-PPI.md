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

## Risultati (dopo il commit `7f7275b`)

File: `research_output/phase2/hx16/hx25_giornate.json`. Codice:
`scripts/hx25_giornate.py`.

**Errori e limiti, dichiarati**:
- Lo script **non** è stato committato prima di girare, a differenza di
  H-X19–H-X24: va nel commit dei risultati. La pre-registrazione invece è
  del commit `7f7275b`, prima di ogni numero.
- Due difetti corretti prima del primo giro: la conversione dei numeri
  ForexFactory e un gruppo vuoto in un periodo.
- Il controllo "dentro il gruppo" della parte 3 **non era
  pre-registrato**: è stato aggiunto dopo aver visto il risultato. I
  numeri principali sono identici fra primo e secondo giro.
- Il file ForexFactory non ha ancora l'actual del 15/10/2026: quella
  release è fuori dalla parte 3.
- RP ha solo 13 release nel 2019–26 (4 nel 2019–22, 9 nel 2023–26).

Release: 295, nessuna saltata, nessuna con movimento nullo.
- 2011–18: 148. 2019–22: 72. 2023–26: 75.
- Nel 2019–26: R 74, P 60, RP 13.

### 1. Quanto muove (mediane, pips e % del prezzo)

Arrivo, chiusura e "dopo la M1" sono nella direzione della M1.

| Gruppo | Periodo | n | Range M1 bid | Arrivo 1 min | Arrivo 5 min | Chiusura M1 | Dopo la M1 (continua) |
|---|---|---|---|---|---|---|---|
| R | 2011–18 | 53 | 22 (0,17%) | 20 (0,13%) | 27 (0,21%) | 11 | +1 (55%) |
| R | 2019–22 | 44 | 32 (0,17%) | 26 (0,15%) | 32 (0,19%) | 14 | −4 (45%) |
| R | 2023–26 | 30 | 60 (0,27%) | 46 (0,20%) | 59 (0,26%) | 28 | −6 (43%) |
| P | 2011–18 | 67 | 14 (0,11%) | 12 (0,09%) | 16 (0,13%) | 6 | 0 (51%) |
| P | 2019–22 | 24 | 24 (0,13%) | 16 (0,10%) | 28 (0,17%) | 9 | −7 (38%) |
| P | 2023–26 | 36 | 69 (0,27%) | 55 (0,22%) | 68 (0,25%) | 31 | −11 (39%) |
| RP | 2011–18 | 28 | 33 (0,24%) | 27 (0,18%) | 35 (0,28%) | 20 | 0 (50%) |
| RP | 2019–22 | 4 | 30 (0,16%) | 29 (0,18%) | 39 (0,22%) | 25 | −1 (50%) |
| RP | 2023–26 | 9 | 60 (0,21%) | 53 (0,19%) | 59 (0,25%) | 41 | −8 (33%) |
| tutti | 2011–18 | 148 | 18 (0,13%) | 15 (0,11%) | 20 (0,16%) | 9 | +1 (52%) |
| tutti | 2019–22 | 72 | 31 (0,17%) | 23 (0,13%) | 32 (0,18%) | 13 | −5 (43%) |
| tutti | 2023–26 | 75 | 63 (0,27%) | 51 (0,20%) | 61 (0,25%) | 31 | −7 (40%) |

Range M1 bid per anno, mediana in pips (numero di release):

| Anno | R | P | RP | Tutti | Tutti, % prezzo |
|---|---|---|---|---|---|
| 2019 | 27 (11) | 12 (6) | 35 (1) | 23 (18) | 0,15% |
| 2020 | 27 (12) | — | — | 27 (12) | 0,16% |
| 2021 | 32 (9) | 30 (6) | 26 (3) | 32 (18) | 0,17% |
| 2022 | 34 (12) | 38 (12) | — | 36 (24) | 0,19% |
| 2023 | 61 (8) | 60 (8) | 59 (4) | 59 (20) | 0,31% |
| 2024 | 68 (10) | 63 (11) | 45 (1) | 65 (22) | 0,29% |
| 2025 | 42 (8) | 57 (8) | 57 (2) | 49 (18) | 0,16% |
| 2026 | 113 (4) | 125 (9) | 163 (2) | 123 (15) | 0,26% |

- **Insieme muovono di più solo nel 2011–18**: 0,24% contro 0,17% (R) e
  0,11% (P). Nel 2023–26 no: 0,21% contro 0,27% e 0,27%, su 9 release.
- **La wick si rimangia circa il 40%**: nel 2023–26 l'arrivo mediano è 51
  pips, la chiusura M1 31.
- Dopo la M1 il prezzo continua solo il 40% delle volte nel 2023–26
  (mediana −7 pips). Torna con H-X18.
- In 5 minuti l'arrivo cresce poco: 61 pips contro 51.
- **15/10/2026** (RP), SHORT:
  - range 243 pips, 2,3 volte la mediana delle 12 release prima;
  - arrivo 217 pips dentro la M1, chiusura M1 solo 80, a T0 + 5 min 148;
  - direzione giusta: E60 +0,74 R, E300 +1,43, TP50 (78 pips) +0,78,
    TP75 (98) +0,98, TP50_5 (116) +1,16, TP75_5 (146) +1,46;
  - il LONG: −1R con tutte le uscite.
  - È un giorno in cui aspettare pagava; in media no (sotto).

### 2. Dove uscire: nessuna uscita batte la chiusura a T0 + 60 s

R medio a trade (ingresso T0 − 30 s, stop 100 pips, spread max 40 pips),
livelli sulle 12 release precedenti:

| Uscita | Giusta 2011–18 | Giusta 2019–22 | Giusta 2023–26 | A caso 2019–22 | A caso 2023–26 | Meglio / peggio di E60, 2019–26 (p) |
|---|---|---|---|---|---|---|
| **E60** | +0,11 | **+0,15** | **+0,32** | −0,04 | −0,07 | — |
| E300 | +0,12 | +0,10 | +0,23 | −0,04 | −0,09 | 61 / 85 (0,06) |
| TP50 | +0,09 | +0,12 | +0,32 | −0,04 | −0,06 | 33 / 33 (1,00) |
| TP75 | +0,10 | +0,14 | +0,33 | −0,04 | −0,06 | 22 / 18 (0,64) |
| TP50_5 | +0,09 | +0,13 | +0,31 | −0,03 | −0,04 | 76 / 70 (0,68) |
| TP75_5 | +0,11 | +0,12 | +0,25 | −0,03 | −0,07 | 64 / 82 (0,16) |

- **Per la regola scritta prima nessuna uscita è migliore di E60**.
  - La più vicina è TP75: −0,01 R nel 2019–22, +0,02 nel 2023–26 (14
    meglio, 5 peggio, p 0,06). Non passa.
  - TP50 nel 2023–26 fa +0,316 contro +0,316: uguale.
  - **Aspettare 5 minuti costa**: −0,04 R nel 2019–22, −0,08 nel 2023–26.
- Con i livelli dello stesso gruppo: nessuna uscita passa.
- Per gruppo, descrittivo: solo TP50_5 nel gruppo RP batte E60 nei due
  periodi, su 4 e 9 release. Non vuol dire niente.
- Trade in utile con la direzione giusta: E60 90–91%, E300 69–71%.
- **A caso**, cioè senza sapere la direzione, tutte le uscite perdono fra
  −0,03 e −0,09 R a trade. Fra il 43% e il 49% dei trade LONG o SHORT
  sono in utile: con lo spread possono perdere tutti e due.
- I livelli sono **calibrati**, quindi il problema non è il livello:
  - TP50 toccato il 47% (p 0,72) e il 43% (p 0,25) contro il 50%;
  - TP75 il 29% (p 0,42) e il 25% (p 1,00) contro il 25%.
  - Il take profit salva le wick che tornano indietro, ma taglia i colpi
    grandi: le due cose si pareggiano.
- Livelli di oggi (ultime 12 release fino al 15/10, prezzo 4.152 $):

| | Mediana (1 volta su 2) | 75° percentile (1 volta su 4) |
|---|---|---|
| Arrivo entro la M1 | 0,20% = 83 pips | 0,29% = 121 pips |
| Arrivo entro 5 min | 0,28% = 116 pips | 0,35% = 146 pips |

### 3. La sorpresa dice quanto sarà grande la candela? Poco

Spearman fra S e grandezza della candela (p unilaterale):

| | 2011–18 | 2019–26 | 2019–22 | 2023–26 |
|---|---|---|---|---|
| **S, Retail + PPI** (pre-registrata) | **0,22 (0,005)** | **0,22 (0,004)** | 0,19 (0,06) | 0,20 (0,04) |
| S con i quattro dati | 0,15 (0,04) | 0,25 (0,001) | 0,17 (0,07) | 0,27 (0,01) |
| S contro il range in pips | 0,20 (0,009) | 0,04 (0,31) | 0,24 (0,02) | 0,15 (0,10) |
| Solo R | 0,20 (0,08) | 0,26 (0,01) | | |
| Solo P | 0,09 (0,25) | 0,31 (0,008) | | |
| Solo RP | −0,09 (25 release) | −0,15 (12) | | |
| Dentro il gruppo (**non pre-registrato**) | 0,09 (0,14) | 0,25 (0,002) | 0,21 (0,04) | 0,23 (0,03) |

- **Per la regola scritta prima passa**: ρ 0,22 nei due periodi, p sotto
  0,05.
- **Ma nel 2011–18 è quasi tutto "quale news esce"**. È un difetto del
  disegno, trovato dopo:
  - il PPI da solo aveva sorprese piccole (S mediana 0,58) e candele
    piccole (0,69 volte la mediana);
  - le giornate RP avevano S quasi doppia e candele grandi (1,54).
  - Dentro ogni gruppo, nel 2011–18 ρ è 0,09: non significativo.
  - Nel 2019–26 regge anche dentro il gruppo (0,25), e in R e in P da
    soli.
- **In pratica conta poco**. Nel 2019–26, grandezza della candela
  rispetto alle 12 release prima:
  - sorpresa nel terzo basso: 0,85;
  - terzo medio: 1,09;
  - terzo alto: 1,08.
  - Una sorpresa piccola dà una candela circa il 15–20% più piccola del
    solito. Una sorpresa grande non la fa esplodere.
- In pips conta molto di più l'anno: ρ con i pips 0,04 nel 2019–26.
- La sorpresa si conosce solo a T0. Non può dimensionare un ingresso a
  T0 − 30 s, e non dice la direzione.

## VERDETTO

- **Quanto muove**:
  - nel 2026 la prima M1 Retail/PPI fa circa 120 pips di range di
    mediana (0,26% del prezzo);
  - le giornate Retail + PPI insieme muovono di più solo nel 2011–18. Nel
    2023–26 non più delle altre (9 release).
- **Dove uscire**:
  - nessuna uscita batte la chiusura a T0 + 60 s nei due periodi, anche
    sapendo la direzione;
  - aspettare 5 minuti costa 0,04–0,08 R;
  - i take profit pareggiano, non migliorano.
- **Sorpresa e ampiezza**: la regola passa, ma l'effetto è piccolo. Nel
  2011–18 dipende dal tipo di giornata. Il 2019–26 non è vergine: al
  massimo **da registrare dal vivo**.
- **Senza la direzione nessuna uscita salva il trade**: da −0,03 a −0,09
  R a trade.
