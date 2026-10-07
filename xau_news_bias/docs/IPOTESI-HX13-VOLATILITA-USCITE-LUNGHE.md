# H-X13 — NFP: volatilità anno per anno e uscite più lunghe della M1 (pre-registrata, esplorativa)

Scritta il 07/10/2026 **prima** di calcolare. Richiesta di Davide:
- negli ultimi anni l'oro alla NFP si muove molto di più (200–600 pips,
  spesso su M5 e non solo su M1);
- vuole sapere quanto era la volatilità prima e durante la news, anno per
  anno, per capire che stop avrebbe messo;
- chiede se si può sfruttare meglio la bias, per esempio tenendo il trade
  oltre la prima M1.

## Parte A — descrizione della volatilità (nessun test)

Per ogni NFP dal 2014 (le 148 del sito più quelle risolte dal vivo), in
pips (1 pip = 0,10 $), mediana per anno:
- ATR 14 H1 e M1 alle 14:29 (gli stessi di H-X12);
- spread alle 14:29 e spread massimo nei primi 10 s della news;
- salto dei primi 3 s: massimo meno minimo del prezzo medio fra T0 e T0+3 s;
- prima M1: movimento (chiusura − apertura) in valore assoluto e range
  (massimo − minimo);
- prime 5 M1 (T0 → T0+5 min): movimento in valore assoluto e range;
- **quanto va contro chi ha ragione**: per il lato giusto (la direzione
  della chiusura M1), il massimo contro dall'ingresso alle 14:29 fino a
  fine M1, sul lato dove scatta lo stop, con spread massimo 40 pips (S1).
  Mediana, 80° e 90° percentile: è lo stop che serviva per non uscire nel
  50/80/90% dei trade giusti.

Questa parte è solo descrittiva. Non sceglie nessuno stop.

## Parte B — uscite più lunghe

Tutto come il trade di oggi (H-X8/H-X11, scenario S1):
- bias H-X8;
- ingresso T0 − 60 s;
- stop 60 pips prima del 2024, 100 dopo, controllato tick per tick per
  tutta la durata;
- costi base, spread massimo 40 pips;
- 148 NFP 2014–26.

Cambia solo l'uscita, tutte riportate, nessuna scelta:

| Codice | Uscita |
|---|---|
| U1 | fine M1, T0 + 60 s (quella di oggi) |
| U2 | T0 + 2 min |
| U3 | T0 + 3 min |
| U5 | T0 + 5 min |
| U10 | T0 + 10 min |
| U15 | T0 + 15 min |

Per ogni uscita e periodo (IS 2014–19, OOS 2020–26, ultimi 3 anni,
tutto):
- quante volte la bias indovina la direzione all'uscita;
- R medio e somma R;
- R medio a caso (media di LONG e SHORT) e vantaggio;
- t di bias − opposta;
- trade in guadagno;
- tutto due volte: col tetto −1R e con la perdita vera.

**Controllo**: U1 deve coincidere al millesimo col trade S1 del sito.

## Regola di decisione, fissata adesso

- I dati sono già stati visti: **nessuna uscita diventa ufficiale**. Il
  criterio live di H-X8 resta su U1.
- Un'uscita conta come "migliore" solo se il **vantaggio sul caso** (non la
  somma R, che cresce anche tirando a caso quando l'oro si muove di più) è
  più alto di U1 **sia in IS sia in OOS**, e lo è anche almeno una uscita
  vicina (altopiano).
- In quel caso la si registra dal vivo **in parallelo** a U1 dalla
  prossima NFP, con lo stesso criterio di H-X8 (dopo 24 NFP almeno 15
  indovinate e somma R positiva).

## Risultati (dopo il commit della pre-registrazione `40cbe16`)

File: `research_output/phase2/hx11/hx13_vol_exits.json`. Codice:
`scripts/hx13_vol_exits.py`. Controllo: U1 coincide al millesimo col trade
S1 del sito su tutte le 148 NFP.

### A — volatilità per anno (pips, mediane; 2026 = 9 NFP fino al 2/10)

| Anno | ATR H1 | ATR M1 | Spread 14:29 | Spread max primi 10 s | Salto primi 3 s | Mossa M1 | Range M1 | Mossa 5 min | Range 5 min | Contro a chi ha ragione (mediana / 80% / 90%) |
|---|---|---|---|---|---|---|---|---|---|---|
| 2014 | 21 | 7 | 3 | 26 | 70 | 68 | 100 | 60 | 120 | 23 / 33 / 44 |
| 2015 | 19 | 7 | 4 | 24 | 51 | 44 | 93 | 62 | 98 | 16 / 57 / 63 |
| 2016 | 25 | 7 | 4 | 20 | 55 | 44 | 91 | 58 | 102 | 18 / 37 / 59 |
| 2017 | 18 | 5 | 3 | 11 | 28 | 27 | 58 | 25 | 72 | 17 / 34 / 48 |
| 2018 | 18 | 5 | 3 | 8 | 31 | 26 | 44 | 35 | 52 | 9 / 13 / 38 |
| 2019 | 18 | 4 | 4 | 15 | 40 | 40 | 60 | 46 | 74 | 12 / 45 / 52 |
| 2020 | 48 | 11 | 5 | 19 | 21 | 24 | 55 | 24 | 87 | 18 / 37 / 103 |
| 2021 | 31 | 10 | 4 | 15 | 44 | 59 | 84 | 74 | 97 | 14 / 32 / 34 |
| 2022 | 35 | 8 | 4 | 11 | 44 | 44 | 71 | 26 | 86 | 13 / 18 / 30 |
| 2023 | 32 | 8 | 4 | 30 | 58 | 54 | 90 | 59 | 91 | 18 / 54 / 82 |
| 2024 | 40 | 9 | 5 | 46 | 86 | 113 | 163 | 106 | 187 | 28 / 46 / 95 |
| 2025 | 86 | 15 | 6 | 54 | 64 | 76 | 122 | 69 | 148 | 27 / 64 / 110 |
| 2026 | 155 | 28 | 7 | 126 | 144 | 359 | 406 | 361 | 432 | 56 / 60 / 79 |

- "Contro a chi ha ragione": dal prezzo d'ingresso alle 14:29, quanto va
  contro il lato giusto prima della fine della M1, sul lato dello stop con
  spread massimo 40 pips. 2014–19: 16 / 41 / 52 pips. 2024–26: 33 / 61 /
  109 pips.
- Lo stop di 100 pips di oggi lascia vivere circa il 90% dei trade giusti
  del 2024–26. Prima del 2020 bastavano 40–60 pips per lo stesso risultato.
- L'ATR H1 non segue bene il bisogno di stop: nel 2026 è 155 pips ma il
  90% dei trade giusti va contro di 79 pips al massimo.

### B — uscite (S1, R a trade)

Col tetto −1R:

| Uscita | Vantaggio IS | Vantaggio OOS | Vantaggio tutto | t tutto | Indovina tutto | R medio tutto | Somma tutto | Somma ultimi 3 anni |
|---|---|---|---|---|---|---|---|---|
| **U1 fine M1** | 0,135 | 0,255 | 0,198 | 2,54 | 60,8% | +0,13 | +18,9 | +17,7 |
| U2 | 0,122 | 0,270 | 0,199 | 2,60 | 60,8% | +0,11 | +16,7 | +14,4 |
| U3 | 0,162 | 0,297 | 0,232 | 2,85 | 62,2% | +0,16 | +23,9 | +19,8 |
| **U5** | 0,180 | 0,288 | 0,236 | 2,83 | 59,5% | +0,18 | +26,2 | +21,3 |
| U10 | 0,150 | 0,299 | 0,228 | 2,61 | 58,1% | +0,16 | +24,2 | +19,1 |
| U15 | 0,133 | 0,273 | 0,206 | 2,27 | 56,8% | +0,16 | +23,2 | +17,0 |

Con la perdita vera (stop saltato contato per intero):

| Uscita | Vantaggio IS | Vantaggio OOS | R medio tutto | Somma tutto | Somma ultimi 3 anni |
|---|---|---|---|---|---|
| U1 | 0,150 | 0,300 | −0,00 | −0,4 | +12,5 |
| U3 | 0,179 | 0,342 | +0,03 | +3,7 | +14,0 |
| U5 | 0,202 | 0,331 | +0,04 | +5,6 | +15,4 |
| U10 | 0,172 | 0,345 | +0,02 | +3,4 | +13,1 |

- **Per la regola scritta prima**: U3, U5 e U10 hanno il vantaggio più alto
  di U1 sia in IS sia in OOS, con tutti e due i modi di contare la
  perdita. È un altopiano. U2 e U15 no.
- Il miglioramento è piccolo: vantaggio da +0,20 a +0,24 R a trade. La
  direzione non si indovina di più (59–62%): l'oro, quando la bias è giusta,
  continua ad andare oltre il primo minuto.
- **Decisione**: si registra dal vivo **U5** (centro dell'altopiano) in
  parallelo a U1 dalla NFP del 06/11/2026 (`trade_u5` nel registro). Il
  criterio ufficiale di H-X8 resta su U1.
- Solo informazione: alla NFP del 02/10/2026 (bias scritta prima, uscita
  non ancora registrata dal vivo) U5 avrebbe fatto +3,93 R contro +3,12 R
  di U1.
- **Con la perdita vera tutto il 2014–26 a fine M1 fa zero.** L'utile
  storico esiste solo se la perdita è davvero tagliata a −1R (full margin,
  stop dove il conto si azzera) oppure guardando dal 2020 in poi.
