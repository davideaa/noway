# H-X24 — CPI: il nowcast della Cleveland Fed batte il consensus? (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare qualunque risultato. Fino a
questo punto ho contato solo quanti dati ci sono: 156 CPI dal 2013-07 nel
file `cpi_nfp.parquet`, 136 con i tick già in cache.

## Attenzione: il test NON è nuovo

- **Fase 1, ipotesi H2** (`PROTOCOLLO-CPI.md`, emendamento 1;
  `RISULTATI-CPI.md` §6). Regola `gap_core = nowcast core − consensus FF
  core`, soglia ±0,05. Risultati:
  - oro giusto 31 volte su 62 (50%, p 0,55);
  - segno della sorpresa core giusto il 60% su 45 casi;
  - correlazione con la sorpresa ρ 0,11 (p 0,18).
- **Fase 2.** Le feature `f_gap_core` e `f_gap_headline` (nowcast meno
  consensus) e `f_nowcast_*` erano nella famiglia CONSENSUS
  (`FEATURE-REGISTRY.md`). Sono quindi già passate dentro la ricerca da
  4,66 milioni di regole, e non è sopravvissuto niente
  (`FINAL-EDGE-REPORT.md`).
- Conosco già questi numeri. Il risultato atteso è che il test **fallisca**
  sull'oro. Le parti nuove sono poche:
  - le soglie 0 e 0,1;
  - lo scarto sul CPI headline usato come regola a sé;
  - il trade di Davide in R;
  - la divisione fissa 2013–18 / 2019–26.
- I CPI 2019–2026 sono già stati guardati in fase 1, in fase 2 e in
  H-X17. Anche se passa, il massimo è **"da registrare dal vivo"**.

## Perché ha senso provarlo lo stesso

Il nowcast della Cleveland Fed usa i prezzi giornalieri della benzina e
del petrolio. Il consensus degli economisti spesso non li aggiorna fino
all'ultimo giorno. Se il nowcast è più caldo del consensus, il CPI
dovrebbe uscire più caldo delle attese. Con un CPI caldo salgono tassi e
dollaro, quindi l'oro scende.

## Dati e regola di disponibilità

- **Release**: i CPI di `research_output/phase2/hx15/cpi_nfp.parquet`
  dal 2013-08 (il nowcast c'è dal mese 2013-07). Il mese di riferimento
  viene dalla tabella `events` del database (comunicati BLS). Se manca, è
  il mese prima della release. Lo shutdown 2025 è incluso così com'è:
  settembre uscito il 24/10, novembre il 18/12.
- **Nowcast**: `ClevelandFedNowcast().load()`, serie `nc_cpi` (headline
  m/m) e `nc_core` (core m/m) per il mese di riferimento. Si prende
  l'ultimo valore con `available_from_utc ≤ T0`. Il valore del giorno d
  vale dalle 23:59 ET di d, quindi in pratica conta quello del giorno
  prima della release.
- **Consensus**: il `forecast` ForexFactory di "CPI m/m" e "Core CPI m/m"
  alla data della release (`data/cache/consensus/forexfactory_calendar.csv`).
  La colonna `previous` non si usa.
- **Scarto**: `gap = nowcast − consensus`, arrotondato a 3 decimali, in
  punti percentuali.

## Le 4 regole, fissate adesso

| Regola | Scarto | Segnale |
|---|---|---|
| H0 | headline | gap > 0 → SHORT oro; gap < 0 → LONG; gap = 0 → niente |
| H1 | headline | solo se \|gap\| ≥ 0,1 |
| C0 | core | gap > 0 → SHORT oro; gap < 0 → LONG; gap = 0 → niente |
| C1 | core | solo se \|gap\| ≥ 0,1 |

## Cosa si misura

1. **T1, il meccanismo**: il segno dello scarto indovina il segno della
   sorpresa della stessa serie (actual − forecast FF)?
   - H0/H1 si confrontano con il CPI m/m, C0/C1 con il core.
   - Le release esattamente in linea si tolgono dal conteggio e si
     riportano a parte.
2. **T2, l'oro**: la direzione della prima M1 (`mv` di `cpi_nfp.parquet`)
   è quella della regola? Con gap > 0 l'oro deve scendere. Se `mv` = 0,
   la release si toglie.
3. **T3, il trade di Davide**, in R:
   - ingresso a T0 − 30 s, all'ask se LONG e al bid se SHORT;
   - stop 100 pips ($10), perdita massima −1 R;
   - spread Dukascopy limitato a 40 pips (`quotes(...,'S1')`);
   - uscita a T0 + 60 s, e anche a T0 + 5 min;
   - simulazione con `hx19_tp.sim`;
   - confronto con la **direzione a caso**, cioè la media di LONG e SHORT
     sulle stesse release. Si riporta anche lo scarto regola − caso.
   - Le release senza tick validi si tolgono e si contano.
4. Per ogni quota: binomiale unilaterale contro il 50%. Per l'R: media,
   deviazione standard e t.

## Periodi e criterio

- **Studio**: 2013-08 → 2018-12. **Conferma**: 2019-01 → 2026-09.
- **PASSA** (verdetto principale, sull'oro T2) se almeno una delle 4
  regole rispetta tutte e due le condizioni:
  - nella conferma: quota giusta > 50% con binomiale unilaterale
    p < 0,05 dopo Holm sulle 4 regole;
  - nello studio, la stessa regola: quota > 50% (stesso verso).
- Il meccanismo T1 ha un verdetto suo, con lo stesso criterio (Holm sulle
  4 regole). Se l'oro passa e il meccanismo no, il risultato è
  **sospetto**: funzionerebbe per il motivo sbagliato.
- Se passa ma l'R a T0 + 60 s nella conferma è ≤ 0, lo si scrive
  esplicitamente: **"passa ma con lo spread non rende"**.
- Si riportano anche i numeri per anno e gli ultimi 3 anni, solo come
  descrizione.
- Niente filtri su ore o giorni. Niente soglie diverse da 0 e 0,1 dopo
  aver visto i dati.

## Risultati (dopo i commit della pre-registrazione `02eaf5d` e dello script `045cdbc`)

File: `research_output/phase2/hx16/hx24_nowcast.json` e
`hx24_nowcast_release.csv`, con una riga per release. Codice:
`scripts/hx24_nowcast.py`.

### Verdetto: NON PASSA

Nessuna delle 4 regole indovina l'oro nella conferma 2019–26. Il
meccanismo non regge nemmeno lui: nella conferma il nowcast non indovina
più la sorpresa.

### L'oro (T2), cioè quello che conta per il trade

| Regola | Studio 2013–18 | Conferma 2019–26 | p Holm | R a 60 s regola / caso | R a 5 min regola / caso |
|---|---|---|---|---|---|
| H0 | 35/63 = 55,6% | 49/90 = **54,4%** | 0,92 | +0,05 / −0,02 | +0,08 / −0,02 |
| H1 | 5/6 | 10/24 = 41,7% | 1,00 | −0,02 / +0,05 | +0,04 / +0,01 |
| C0 | 33/63 = 52,4% | 47/90 = **52,2%** | 1,00 | +0,03 / −0,02 | +0,06 / −0,02 |
| C1 | 0 segnali | 7/16 = 43,8% | 1,00 | −0,12 / −0,00 | +0,06 / −0,03 |

- "Caso" vuol dire direzione a caso: la media di LONG e SHORT sulle stesse
  release.
- Regola meno caso, nella conferma a 60 s: H0 +0,07 R (t 0,90), C0
  +0,05 R (t 0,58). È rumore.
- Lo spread mediano a T0 − 30 s è di 3,5 pips, quindi il caso costa solo
  0,02 R.

### Il meccanismo (T1): il nowcast indovina il segno della sorpresa?

| Regola | Studio 2013–18 | Conferma 2019–26 | p Holm | Correlazione scarto/sorpresa: studio → conferma |
|---|---|---|---|---|
| H0 | 25/34 = **73,5%** | 30/57 = 52,6% | 1,00 | ρ +0,47 (p 0,0001) → **−0,10** (p 0,37) |
| H1 | 4/4 | 5/16 = 31,3% | 1,00 | |
| C0 | 28/37 = **75,7%** | 36/62 = 58,1% | 0,51 | ρ +0,31 (p 0,014) → **−0,02** (p 0,85) |
| C1 | 0 segnali | 5/12 = 41,7% | 1,00 | |

- Nel 2013–18 il nowcast funzionava davvero sulla sorpresa: 3 volte su 4.
  Eppure l'oro andava nel verso giusto solo il 52–56% delle volte.
- Ci sono due ragioni:
  - circa il 45% dei CPI esce **esattamente in linea** con il consensus,
    e lì il nowcast non ha niente da indovinare. Contando quelle release
    come sbagliate, la quota scende al 40–44%;
  - anche conoscendo la sorpresa, l'oro la segue solo il ~73% delle volte
    (il tetto teorico di `RISULTATI-CPI.md` §7).
- Nel 2019–26 il vantaggio sulla sorpresa sparisce. L'anno peggiore è il
  2021: 1 giusta su 8 per H0, 3 su 9 per C0. Il nowcast segue soprattutto
  benzina e petrolio, e quel CPI lo hanno mosso auto usate, affitti e
  colli di bottiglia.
- Le regole a soglia 0,1 sono le peggiori. Quando il nowcast si stacca
  molto dal consensus (2020–23), sbaglia più spesso.

### Per anno (descrittivo): il segnale cambia verso

C0 sull'oro: 2019 6/12, 2020 4/11, 2021 4/12, 2022 5/12, 2023 4/12, poi
2024 8/12, 2025 9/10, 2026 7/9.

- Negli **ultimi 3 anni** (2024–26), C0 fa 24 giuste su 31 (77%), con
  R +0,35 a 60 s, e la sorpresa giusta 17 su 21.
- Ma nel **2019–23** la stessa regola fa 23 su 59 (**39%**): sbagliava più
  del caso. Questo spezzamento non era pre-registrato. Lo riporto solo per
  mostrare che il 77% recente segue un 39%, e non è un trend stabile.
- È lo stesso schema già visto in fase 2: i segnali cambiano verso fra un
  periodo e l'altro.
- Il 77% recente non è un risultato. Al massimo è una cosa da guardare dal
  vivo, e andrebbe pre-registrata come ipotesi nuova prima delle prossime
  release.

### Controlli fatti

- **Release**: 155 dal 2013-08, 64 nello studio e 91 nella conferma.
  - Sono tolte 2 release: 15/08/2013, senza nowcast perché la serie non
    era ancora partita, e 18/12/2025 (CPI di novembre dopo lo shutdown),
    senza forecast su ForexFactory.
  - Tick validi per tutte le 155. Una sola (12/05/2026) era da scaricare.
- **Nowcast**: quello usato è sempre di un giorno lavorativo prima della
  release (mediana 1 giorno). Nessuno è del giorno stesso o successivo.
- **Sorpresa headline**: quella calcolata qui coincide con la colonna
  `sorpresa` di `cpi_nfp.parquet` in 136 casi su 136.

### Errori e limiti dichiarati

1. **Il test non era nuovo** (vedi sopra). Conoscevo già il risultato di
   fase 1 sull'oro (50%). Il fallimento era atteso, ed è arrivato.
2. **C1 non poteva passare.** Nel 2013–18 lo scarto core non arriva mai a
   0,1. H1 ha solo 6 segnali nello studio. Non avevo guardato la
   distribuzione dello scarto prima di fissare la soglia: le soglie 0,1
   erano mal tarate per lo studio. Non cambia il verdetto, perché nella
   conferma H1 e C1 sono sotto il 50%.
3. **ForexFactory**: il forecast è quello mostrato al momento della
   release. Non è garantito che fosse il consensus di qualche giorno
   prima.
4. **Cleveland Fed**: che i valori siano davvero quelli pubblicati in
   tempo reale lo dice la fonte. Qui non si può verificare.
5. Il 2019–26 del CPI era già stato guardato (fase 1, fase 2, H-X17).
   Quindi anche un passaggio sarebbe valso solo come "da registrare dal
   vivo". Qui non c'è nemmeno quello.
