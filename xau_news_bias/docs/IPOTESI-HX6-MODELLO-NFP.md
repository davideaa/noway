# H-X6 — il modello di fase 2 con il trade di Davide, NFP e CPI (pre-registrata)

Scritta il 26/09/2026 **prima** di calcolare questi numeri.

## Cosa si valuta

I modelli di fase 2, **congelati**, senza cambiare niente:
- **modello NFP**: LightGBM, prezzo + macro + tassi, finestra 5 anni, τ = 0;
- **modello CPI**: ridge, prezzo + macro, finestra 5 anni, τ = 0,3.

Le decisioni sono quelle già registrate:
- **studio 2014–19**: walk-forward, ogni anno addestrato solo sul passato;
- **test 2020–26**: modello congelato a fine 2019, identico al sigillo del
  test finale.

## Il trade di Davide

| | |
|---|---|
| Ingresso | T0 − 60 s |
| Stop | 60 pips prima del 2024, 100 pips dal 2024 |
| Perdita | tagliata a −1R |
| Costi | base |
| Uscita principale | fine della prima M1 |
| Uscita secondaria | T0 + 5 min |

## Regola di decisione, fissata adesso

- Il CPI entra nel sito come mercato da tradare **solo se** il modello CPI
  ha R medio > 0 nel test 2020–26 con l'uscita principale.
- Altrimenti il sito mostra solo l'NFP e il CPI compare come "non
  tradare".

## Etichetta

Esplorativo: il 2020–26 è già esposto. Il modello NFP resta **da
confermare dal vivo**.
