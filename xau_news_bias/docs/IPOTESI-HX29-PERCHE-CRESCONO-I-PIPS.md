# H-X29 — Perché i pips delle news sono cresciuti (pre-registrata)

Scritta il 16/10/2026 **prima** di calcolare.

## Richiesta di Davide

- Non le mediane anno per anno come se fossero casi a sé. Capire **cosa**
  ha fatto crescere i pips:
  - la grandezza della sorpresa (dato contro attese);
  - la volatilità generale;
  - altro, anche più cose insieme.
- Una formula e un grafico, su tutte le news, e cosa dicono gli studi.

## Cosa si sa già, da dichiarare

- H-X23: la grandezza della news si prevede con la memoria della stessa
  news e la tensione subito prima. GVZ e VIX aggiungono poco.
- H-X25: per Retail/PPI la sorpresa ordina poco la candela (ρ 0,22).
- Tutti i dati 2011–2026 sono già stati visti per altre domande. Qui si
  **spiega**, non si sceglie un trade.

## Dati

- `hx23_dataset.parquet`: 2.216 release rosse 2011–2026, 13 famiglie.
- Bersaglio **r1** = range della prima M1 sul prezzo medio in % del
  prezzo, compreso l'ultimo tick prima di T0.
- ADR21 in % del prezzo; prezzo medio a T0.
- **Pips = r1 × prezzo × 10 ÷ 100.**
- **Sorpresa S**: per ogni release, il massimo |z| fra tutte le serie
  della tabella sorprese (`load_surprise_table`) uscite nello **stesso
  minuto** di T0.
  - z = (actual − forecast) ÷ MAD delle sorprese passate della stessa
    serie (solo il passato).
  - Ci sono le serie di NFP (+ disoccupazione, salari), CPI (+ core,
    a/a), PPI (+ core), Retail (+ core), claims, ISM M e S, ADP.
  - FOMC, verbali, PIL, fiducia e Michigan non hanno S. Entrano solo
    nella parte senza sorpresa.
- Si riporta quante release trovano la loro S (minuto esatto).

## La formula

log(pips) = log(prezzo) + log(r1) + costante.

Per r1, regressione lineare (OLS, errori robusti) sulle release con S:

  log(r1) = famiglia + β · log(ADR21) + γ · log(1 + S) + anno

- β dice quanto la news segue la volatilità del giorno: β = 1 vuol dire
  proporzionale.
- γ dice quanto conta la sorpresa: si usa log(1 + S), concavo, come in
  Hautsch, Hess e Müller.
- L'effetto **anno** è il resto: quello che non spiegano prezzo,
  volatilità e sorpresa (sensibilità del mercato, liquidità, attenzione).

## Scomposizione (il grafico)

Per ogni anno 2019–2026, rispetto al 2019, sulla media dei logaritmi
(cioè la media geometrica). Per tutte le news con S, poi per NFP, CPI e
Retail/PPI separati.

Δ log(pips) =
- Δ log(prezzo)
- \+ β · Δ log(ADR21)
- \+ γ · Δ log(1 + S)
- \+ Δ famiglie (quali news ci sono quell'anno; solo per "tutte")
- \+ Δ resto

Per i gruppi separati il resto è quello che manca dopo i primi tre
pezzi, con β e γ del modello su tutte. Tutto si riporta come
**moltiplicatore**: per esempio "pips × 5 = prezzo × 3 · volatilità ×
1,5 · sorpresa × 1,0 · resto × 1,1".

## Domande, con la risposta decisa prima

1. **β vicino a 1?** Si riporta β con intervallo al 95%.
2. **La sorpresa conta?** γ > 0 con p < 0,01.
3. **La sensibilità alla sorpresa è cambiata nel tempo?**
   - Modello con γ diverso nel 2011–18, 2019–22 e 2023–26;
   - test di Wald: "cambiata" se p < 0,05;
   - stessa cosa per β.
4. **Conoscere la sorpresa migliora la stima dei pips?** Prova passo per
   passo, ogni anno Y stimato solo con gli anni prima:
   - V = famiglia + log ADR21 + log mem12;
   - VS = V + log(1 + S);
   - "migliora" se l'errore mediano |log(vero ÷ stimato)| scende di
     almeno 0,03 sia nel 2019–22 sia nel 2023–26.
   - VS si può usare solo dopo l'uscita del dato. Serve a sapere, nei
     secondi dopo l'uscita, se la candela sarà grande.
5. **Descrittivo**: le NFP del 2026 una per una, con S, ADR21, pips
   stimati da VS e pips veri.

## Nessun trade

Niente di questo dice la direzione. Se qualcosa servisse a un trade,
andrebbe pre-registrato e provato dal vivo.
