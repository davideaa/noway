# Ipotesi H-X2 — il setup manuale di Davide (pre-registrata)

Scritta il 26/09/2026 **prima** di eseguire il test. È una fase
esplorativa nuova: i dati 2013–2026 sono già stati visti nella fase 2, ma
i parametri qui **non** vengono dalla ricerca. Sono quelli che Davide usa
da anni a mano. Non si sceglie nessuna variante dopo aver visto i numeri:
si riportano tutte.

## Il setup (dalle parole di Davide)

- Ingresso **un minuto prima** della news (release alle 14:30, ingresso
  alle 14:29), in full margin.
- **Stop 100 pips** = 10 $ su XAUUSD (1 pip = 0,10 $).
- Se va male si perde −1R: sul conto c'è solo quello che si vuole
  perdere.
- Se va bene la news "spara": ×2, ×3, ×4, ×5 a seconda della volatilità,
  che negli ultimi due anni è molto più alta.
- La direzione Davide la sceglie a occhio (liquidità, price action).
  Questo non si può codificare. Il test quindi **non** dice se Davide
  indovina: dice **quanto spesso bisogna indovinare** perché il setup
  guadagni.

## Definizioni fissate

| | Riga principale | Sensibilità (riportate tutte) |
|---|---|---|
| Eventi | CPI e NFP, 2013-07 → 2026-09 | per famiglia e per era: 2013–19, 2020–22, 2023–24, 2025–26 |
| Ingresso | ultimo tick ≤ T0 − 60 s; LONG all'ask, SHORT al bid | T − 30 s, T − 10 s |
| Stop | 10 $ fissi | 5 $, 15 $, 20 $; 0,60 × U_news |
| Uscita | chiusura della prima M1 dopo la news (ultimo tick < T0 + 60 s) | — (i percorsi tick salvati finiscono a T0 + 65 s) |
| Costi | base (fase 2) | conservative |
| Perdita | **B**: tagliata a −1R (full margin con protezione dal saldo negativo: il broker assorbe il salto oltre lo stop) | **A**: stop eseguito al primo prezzo disponibile, salto incluso (conto normale) |

Per ogni evento: R del lato giusto (quello che chiude meglio) e R del lato
sbagliato. Con una precisione di direzione p:

    EV(p) = p × R_giusto_medio + (1 − p) × R_sbagliato_medio

**Precisione di pareggio** p* = quella per cui EV = 0. Si riportano:
- EV al 50% (moneta), 55%, 60%, 65%, 70%;
- p*;
- la quota di trade giusti che arriva a ≥ 2R, ≥ 3R e ≥ 5R.

## Cosa dirà e cosa no

- Se p* è vicino al 50%, il setup guadagna quasi da solo per
  l'asimmetria, e la direzione conta poco.
- Se p* è alto, il vantaggio deve venire tutto dalla capacità di
  indovinare. Quella si misura solo registrando le scelte di Davide
  **prima** delle news e confrontandole con p*.
- Il test non dice nulla su uscite dopo la prima M1.

## Risultati (eseguito il 26/09/2026, dopo il commit `9febd38` di questo file)

Dati: `research_output/phase2/hx2_setup_davide.json` (tutte le varianti)
e `hx2_main_trades.csv` (riga principale, trade per trade). Codice:
`xnb/phase2/setup_davide.py`.

### Riga principale

Ingresso T−60 s, stop 10 $, uscita a fine M1, costi base, perdita tagliata
a −1R. Parole usate:
- **Serve indovinare**: la precisione di pareggio.
- **Tirando a caso**: l'EV con il 50% di direzioni giuste.

| | News | Serve indovinare | Tirando a caso | Al 60% | Lato giusto ≥ 2R |
|---|---|---|---|---|---|
| Tutte, 2013–2026 | 302 | **56%** | −0,07 R | +0,04 R | 3% |
| 2013–19 | 146 | 60% | −0,07 | 0,00 | 0% |
| 2020–22 | 70 | 61% | −0,10 | −0,01 | 1% |
| 2023–24 | 47 | 58% | −0,11 | +0,02 | 2% |
| **2025–26** | 39 | **46%** | **+0,08** | +0,28 | 21% |
| NFP 2025–26 | 19 | 40% | +0,23 | +0,46 | 21% |
| CPI 2025–26 | 20 | 54% | −0,06 | +0,10 | 20% |

Per anno la differenza sta quasi tutta nel **2026**:

| | Serve indovinare | Tirando a caso |
|---|---|---|
| NFP 2026 (8 news) | 26% | +0,82 R |
| CPI 2026 (9 news) | 46% | +0,08 R |
| 2025 | 64% | negativo |

### Incertezza (bootstrap)

- **2025–26, tirando a caso**: +0,08 R, intervallo 95% da −0,19 a +0,37.
  Senza la sola news migliore (NFP 04/09/2026, +6,7 R) va a 0,00.
- **Serve indovinare 2025–26**: 46%, intervallo da 36% a 63%.
- **2023–26 insieme**: tirando a caso −0,03 R; serve indovinare il 52%.

### Da dove viene l'asimmetria

Con uno stop normale (perdita **A**, eseguita al primo prezzo disponibile)
nel 2025–26 il lato sbagliato perde più di 1R l'**82%** delle volte: il
prezzo salta lo stop. Lì serve indovinare il **62%**, e tirando a caso si
perde −0,32 R a news. La perdita tagliata a −1R esiste solo se il conto è
in full margin e il broker assorbe il salto (protezione dal saldo
negativo).

### Varianti (tutte riportate, nessuna scelta)

**Tutte le news, perdita tagliata:**
- serve indovinare fra il **52% e il 58%** con costi base;
- fra il **60% e il 70%** con costi conservative.

**2025–26:**
- fra il 37% e il 49% con costi base;
- fra il 42% e il 54% con costi conservative.

Lo stop da 5 $ è la variante più favorevole negli ultimi anni. Non va
scelta adesso, dopo averlo visto.

### Conclusione (esplorativa)

- Il setup **non** guadagna da solo sulla storia intera: serve indovinare
  la direzione almeno il 56% delle volte, il 64% con costi più alti.
- Negli ultimi due anni, e soprattutto nel 2026, la soglia scende sotto il
  50%. È quello che Davide ha visto. Però poggia su poche news enormi (tre
  NFP del 2026 da +5 a +6,7 R) e sulla perdita tagliata dal broker.
- Il vantaggio, se c'è, è nella **precisione di Davide sulla direzione**.
  Questa ricerca non la misura: le regole automatiche di price action e
  i dati macro non vanno oltre il caso (fase 2). Si misura in due modi:
  1. lo storico MT5 dei suoi trade sulle news;
  2. le sue scelte LONG/SHORT registrate prima di ogni news, in modo non
     modificabile, e confrontate con la soglia.
- **Rischio**: in full margin ogni errore costa tutto il deposito. Con il
  56% di direzioni giuste, in 50 news c'è il 36% di probabilità di
  vederne almeno 5 perse di fila (8% di vederne almeno 7).

---

# Ipotesi H-X3 — stop che segue la volatilità, e i segnali di XNB nel setup di Davide (pre-registrata)

Scritta il 26/09/2026 **prima** di eseguire il test, dopo l'osservazione di
Davide: «i 100 pips li ho usati negli ultimi due anni perché la volatilità
è salita; prima lo stop doveva essere più piccolo, in proporzione». Ha
ragione: con 100 pips fissi, negli anni calmi un trade giusto non poteva
arrivare a 2–3R. Esplorativa: i dati sono già stati visti.

## Stop dinamico

Stop in $ = 10 $ × V(adesso) / V_rif. Tre misure V:

| Nome | V | Cosa guarderebbe Davide sul grafico |
|---|---|---|
| **S1 (principale)** | ATR(14) giornaliero all'ultima candela D1 chiusa | l'indicatore ATR sul giornaliero |
| S2 | ATR(14) orario all'ultima H1 chiusa | ATR sull'orario |
| S3 | U_news (unità della fase 2) | reazione delle ultime 6 news × ATR M1 |

V_rif = mediana di V sulle news CPI e NFP degli **ultimi due anni**
(2024-10-01 → 2026-09-30). È il periodo in cui Davide usa 100 pips. È una
sola costante di scala, presa dalle sue parole e non ottimizzata. Si
riporta lo stop medio in pips per anno.

Tutto il resto come H-X2:
- ingresso T − 60 s, uscita a fine prima M1;
- costi base (sensibilità: conservative);
- perdita tagliata a −1R (sensibilità: stop eseguito con il salto).

Si riportano, per era e per anno:
- precisione di pareggio;
- EV tirando a caso;
- EV al 55% e al 60%;
- quota del lato giusto ≥ 1R, ≥ 2R e ≥ 3R.

## I segnali di direzione di XNB dentro il setup

La direzione la danno i 18 candidati della fase 2: 15 regole e 3 modelli,
**congelati** con le decisioni già registrate in `p2_validation.json`.
Per ognuno, sul suo periodo fuori campione (CPI 2020–26 o NFP 2020–26), lo
stesso trade con il setup S1:
- trade eseguiti, direzioni giuste, R medio, t unilaterale;
- Holm su tutti i test eseguiti.

Nessun candidato viene scelto o scartato dopo.

## Risultati H-X3 (eseguito dopo il commit `bd5b65d`)

Dati: `research_output/phase2/hx3_dynamic_stop.json` e
`hx3_main_trades.csv`. Codice: `xnb/phase2/setup_dyn.py`.

### Stop in pips che avrebbe usato la regola S1 (ATR giornaliero), mediana per anno

| 2014–16 | 2017–19 | 2020 | 2021–23 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|
| 25–28 | 19–21 | 47 | 37–38 | 51 | 77 | 170 |

### Precisione di pareggio con lo stop dinamico

Costi base, perdita tagliata a −1R, ingresso T − 60 s, uscita a fine M1.

| | 2013–26 | 2013–19 | 2020–22 | 2023–24 | 2025–26 |
|---|---|---|---|---|---|
| S1 ATR giornaliero | **52%** | 52% | 51% | 53% | 53% |
| S2 ATR orario | 48% | 51% | 46% | 46% | 48% |
| S3 U_news | 56% | 59% | 52% | 60% | 49% |
| S1, solo NFP | **47%** | 45% | 51% | 44% | 51% |
| S1, solo CPI | **59%** | 64% | 50% | 65% | 55% |

- Con lo stop che segue la volatilità la soglia è **stabile in tutte le
  ere**. Anche negli anni calmi il lato giusto arriva a ≥ 2R nel 21% dei
  casi, contro lo 0% con 100 pips fissi. È esattamente il punto di Davide.
- **Tirando a caso** (S1): −0,03 R a news, intervallo da −0,10 a +0,04.
  - NFP: +0,07 R, intervallo da −0,04 a +0,18, **non significativo**.
  - CPI: −0,13 R, intervallo da −0,22 a −0,05, **significativamente
    negativo**.
- **Costi conservative**: serve il 62%.
- **Stop normale**, eseguito con il salto: serve il 67%. Anche con lo
  stop dinamico, tutta l'asimmetria viene dalla perdita tagliata dal
  broker.

### I segnali di XNB dentro il setup (S1, fuori campione, 17 test)

| Segnale | Periodo | Trade | Vinti | R medio | R totale | p | Holm |
|---|---|---|---|---|---|---|---|
| **Modello NFP** | NFP 2020–26 | 24 | 58% | **+0,52** | +12,5 | 0,053 | 0,89 |
| Modello condiviso | NFP 2020–26 | 7 | 57% | +0,80 | +5,6 | 0,15 | 1,00 |
| Regola NFP-3 | NFP 2020–26 | 14 | 57% | +0,25 | +3,5 | 0,25 | 1,00 |
| Regola CPI-3 | CPI 2020–26 | 25 | 44% | +0,26 | +6,4 | 0,19 | 1,00 |
| Modello CPI | CPI 2020–26 | 26 | 27% | −0,23 | −6,1 | 0,89 | 1,00 |
| Regole condivise sul CPI | CPI 2020–26 | 11–30 | 21–55% | da −0,48 a −0,09 | | | 1,00 |

Tutte le righe sono in `hx3_dynamic_stop.json`. Nessun test supera la
correzione di Holm.

### Conclusione (esplorativa)

- Nel setup di Davide, con lo stop che segue l'ATR giornaliero:
  - serve indovinare la direzione circa **52 volte su 100** (NFP 47, CPI
    59), a patto di avere la perdita tagliata e costi bassi;
  - con costi più alti serve il 62%;
  - con uno stop normale, il 67%.
- La soglia bassa viene dall'asimmetria. L'asimmetria viene dal full
  margin con protezione dal saldo negativo.
- Il calcolatore XNB non dà una direzione affidabile. Il suo segnale
  migliore, il modello NFP, dentro il setup fa +0,52 R a news su 24 NFP
  mai visti, ma con 17 test è compatibile con il caso (Holm 0,89).
- È il candidato più sensato da **confermare dal vivo**. Da registrare
  prima di ogni NFP:
  1. la direzione del modello NFP;
  2. la direzione scelta da Davide;
  3. il risultato con il setup S1.
