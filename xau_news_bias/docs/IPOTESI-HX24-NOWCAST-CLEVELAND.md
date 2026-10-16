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

## Risultati

(da aggiungere dopo il commit di questa pre-registrazione e dello script)
