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
