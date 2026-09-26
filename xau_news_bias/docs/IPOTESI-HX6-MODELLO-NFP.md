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

## Risultati (dopo il commit `c406955`)

File: `research_output/phase2/hx6/hx6_site.json`. Codice:
`scripts/hx6_site.py`.

| | Trade | Vinti | R medio (fine M1) | R medio (5 min) | Da 10.000 (M1 / 5 min, saldo ÷ 24) |
|---|---|---|---|---|---|
| NFP studio 2014–19 | 22 | 59% | +0,16 | +0,23 | 11.485 / 12.222 |
| **NFP test 2020–26** | 24 | 62% | **+0,57** | **+0,66** | **16.517 / 17.658** |
| NFP tutto | 46 | 61% | +0,37 | +0,46 | 18.970 / 21.582 |
| CPI studio 2014–19 | 22 | 55% | −0,01 | +0,04 | 9.825 / 10.347 |
| CPI test 2020–26 | 26 | 31% | **−0,28** | −0,34 | 7.281 / 6.832 |

**Decisione, per la regola scritta prima:**
- il CPI ha R medio negativo nel test, quindi **non si trada**;
- il sito mostra solo l'NFP.

**Onestamente:**
- il modello NFP è stato scelto fra molti, e con 46 trade in 13 anni
  l'incertezza è grande;
- nel test fa bene, nello studio fa poco (+0,16 R);
- resta **da confermare dal vivo**.
