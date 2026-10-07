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
