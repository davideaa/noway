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

## Risultati (dopo i commit `082c4e4` e `7505409`)

File: `research_output/phase2/hx16/hx29_pips.json`. Codice:
`scripts/hx29_pips.py`.

**Copertura.** 1.654 release su 2.216 hanno la sorpresa S:
- tutte le NFP, CPI, PPI, claims, ISM, ADP;
- 167 Retail su 168;
- 81 PIL su 153;
- quasi nessuna fiducia o Michigan;
- nessun FOMC o verbale.

Mancano anche la NFP del 2/10/2026 e il CPI del 14/10/2026, non ancora
nel dataset (errore già dichiarato in H-X27).

### La formula (OLS su tutte le news con S, R² 0,48)

log(r1) = famiglia + **0,35** · log(ADR21) + **0,25** · log(1 + S) + anno

1. **β = 0,35** (intervallo 0,24–0,47): la candela della news **non**
   cresce in proporzione alla volatilità del giorno.
   - Se l'ADR raddoppia, la news cresce del 27% circa.
   - β è sceso nel tempo: 0,49 (2011–18), 0,29 (2019–22), 0,18
     (2023–26). Wald p = 0,046: cambiato, di poco.
2. **γ = 0,25**, p < 10⁻¹³: la sorpresa conta.
3. **La sensibilità alla sorpresa è cambiata molto** (Wald p = 3 · 10⁻⁸):

| Periodo | γ (errore standard) | Sorpresa di 2 contro sorpresa nulla |
|---|---|---|
| 2011–18 | 0,40 (0,06) | candela × 1,55 |
| 2019–22 | 0,11 (0,04) | × 1,13 |
| **2023–26** | **0,53** (0,07) | **× 1,79** |

4. **Conoscere la sorpresa NON migliora la stima** passo per passo:

| Errore mediano | V (senza S) | VS (con S) |
|---|---|---|
| Tutte, 2019–22 | **0,370** | 0,415 |
| Tutte, 2023–26 | **0,350** | 0,367 |
| NFP | 0,326 / **0,318** | **0,303** / 0,340 |
| CPI | 0,445 / 0,476 | **0,434 / 0,440** |
| Retail/PPI | **0,353 / 0,301** | 0,372 / 0,315 |

- Per la regola scritta prima **non migliora**.
- Il motivo è il punto 3: γ stimato sugli anni prima sbaglia, perché nel
  2019–22 la sensibilità è crollata e nel 2023–26 è più che quadruplicata.
- Solo per il CPI aiuta un po' in tutti e due i periodi (−0,011 e
  −0,036), sotto la soglia nel 2019–22.

### Scomposizione: da dove vengono i pips in più (2026 contro 2019)

Moltiplicatori della media geometrica del range M1:

| | Pips 2019 → 2026 | Totale | Prezzo dell'oro | Volatilità (ADR) | Sorpresa | Famiglie | Resto |
|---|---|---|---|---|---|---|---|
| Tutte con S | 27 → 115 | × 4,2 | × 3,34 | × 1,39 | × 0,98 | × 0,89 | × 1,05 |
| NFP | 63 → 341 | × 5,4 | × 3,30 | × 1,35 | × 0,96 | — | × 1,26 |
| CPI | 21 → 254 | **× 12,2** | × 3,28 | × 1,38 | × 0,99 | — | **× 2,71** |
| Retail/PPI | 20 → 104 | × 5,3 | × 3,40 | × 1,41 | × 1,01 | — | × 1,09 |

- **La prima causa è il prezzo dell'oro**, triplicato: lo stesso
  movimento in % vale 3,3 volte i pips.
- **La seconda è la volatilità generale**: l'ADR in % è 2,5 volte quello
  del 2019. Con β = 0,35 spiega × 1,4.
- **Le sorprese non sono più grandi**: S mediana circa 0,7–1,4 in tutti
  gli anni. Non è "il dato esce più lontano dalle attese".
- **CPI**: × 2,7 in più, che parte nel 2021. Resto per anno:
  - 1,77 (2021), 2,96 (2022), 3,35 (2023);
  - 3,23 (2024), 1,90 (2025), 2,71 (2026).
  - È il regime dell'inflazione: lo stesso CPI muove molto di più da
    quando l'inflazione è il tema della Fed.
- **NFP 2026**: resto × 1,26 in media, ma la formula sbaglia di molto,
  una per una (pips stimati da VS contro veri):

| NFP | S | ADR21 | Stimati | Veri |
|---|---|---|---|---|
| 09/01 | 0,67 | 854 | 184 | 149 |
| 11/02 | 0,87 | 2.189 | 274 | **648** |
| 06/03 | 2,02 | 1.557 | 272 | 392 |
| 08/05 | 0,67 | 1.018 | 211 | 122 |
| 05/06 | 1,17 | 938 | 209 | 190 |
| 02/07 | 0,77 | 1.131 | 198 | **552** |
| 07/08 | 1,46 | 928 | 238 | **454** |
| 04/09 | 1,44 | 1.072 | 277 | **826** |

  - Pips = range M1 sul prezzo medio, wick compresa.
  - In 4 NFP su 8 la candela è stata da 2 a 3 volte la stima, anche
    con sorprese normali (S 0,8–1,5).
  - Nel 2026 la NFP ha qualcosa in più che prezzo, volatilità e
    sorpresa non spiegano.

**Limiti, dichiarati**:
- β è stimato dentro l'anno, perché l'effetto anno assorbe il trend
  comune. Un β stimato così tende a venire più piccolo del vero.
- Con β = 1, cioè news proporzionale all'ADR, la volatilità
  spiegherebbe × 2,5 e il resto scenderebbe sotto 1.
- La verità sta fra i due. Il prezzo resta comunque la prima causa.
- Le sorprese CPI sono "a scatti" (0,1 punti = z 0,67): S del CPI è
  grossolana.
- Le release con più dati nello stesso minuto usano la sorpresa più
  grande, non una combinazione.

## VERDETTO

- 🟢 **Spiegazione**: i pips sono cresciuti per:
  - il prezzo dell'oro (× 3,3);
  - la volatilità generale (× 1,4–2,5);
  - per il CPI, un mercato molto più sensibile all'inflazione dal 2021
    (× 2,7).
  - Le sorprese non sono più grandi.
- 🟢 **Il mercato reagisce alla grandezza della sorpresa molto più di
  prima**: γ 0,53 nel 2023–26 contro 0,11 nel 2019–22.
- 🔴 **Per stimare i pips, la sorpresa non aiuta** con la prova passo per
  passo, perché la sensibilità cambia nel tempo. Resta il modello di
  H-X23 (memoria + tensione prima della news).
- 🟡 **NFP 2026**: metà delle release è 2–3 volte più grande di quello
  che la formula spiega. Da registrare dal vivo, se Davide lo vuole,
  senza cambiare niente adesso.
