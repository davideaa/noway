# Quanto si prende nel 1° minuto e un target a 600 pips (regole scritte prima di calcolare)

Scritte il 03/11/2026 **prima** di calcolare.

## Domanda di Davide

- Con 1.000 € e 1 lotto, se azzecca la direzione, quanto può fare nel minuto della news, wick comprese?
- Conviene un target a ~600 pips? Secondo lui più di 600 è molto difficile.

**Già provato.** In H-X41 un target al "massimo mediano", con break even, faceva peggio di nessun target.

## Come si misura

Il caso è quello vero di Davide, come in `SENSIBILITA-STOP-SPREAD.md`, variante B0 + 10:
- ingresso 30 s prima della news;
- spread 30 pips solo da 20 s prima alla news;
- stop del sito + 10 pips;
- uscita alle 14:31 (60 s dopo la news), se non scattano prima stop o target.

**Quanto va a favore.** Nelle NFP giuste, il massimo guadagno toccato fra l'ingresso e le 14:31 (wick comprese, sul lato che chiude), in % del prezzo e riportato a 3.930 $ in pips.
- Si riportano mediana, 1 volta su 4, 1 volta su 10 e massimo.

**Target.**
- Ordine limite: scatta quando il lato che chiude tocca ingresso + target, e chiude esattamente lì.
- In pips **riportati al prezzo**: 600 pips a 3.930 $ sono l'1,53%, quindi nel 2015, con l'oro a 1.200 $, valgono 183 pips.
- Target provati: 300, 400, 500, 600, 700, 800 pips a 3.930 $, e nessuno.

**Misure.** Pips medi a NFP (al prezzo di allora e riportati a 3.930 $) nel 2014–19, 2020–26 e ultimi 3 anni. Quante NFP toccano il target.

## Regola, scritta prima

Il target a 600 conviene se dà più pips medi di nessun target **sia nel 2014–19 sia nel 2020–26**, e lo stesso vale per 500 e 700 (altopiano). Altrimenti si consiglia di non metterlo, o lo si dice come scelta di Davide senza vantaggio provato.

## Risultati (dopo il commit con le regole)

File: `research_output/phase2/hx16/tp_primo_minuto.json` e `.csv`. 148 NFP, 2014–2026. Tutto in pips riportati a 3.930 $.

**Quanto va a favore nelle NFP giuste**, fino alle 14:31, wick comprese:

| | Mediana | 1 volta su 4 | 1 volta su 10 | Massimo |
|---|---|---|---|---|
| Tutto | 146 | 211 | 309 | 672 |
| 2020–26 | 140 | 202 | 303 | 672 |
| Ultimi 3 anni | 163 | 288 | 390 | 672 (04/09/2026) |

Nelle NFP giuste degli ultimi 3 anni, chiudendo alle 14:31 si incassano in mediana circa 140 pips, il migliore 575.

**Target.** Quante NFP lo toccano su 148, e i pips medi a NFP:

| Target | Lo toccano | 2014–19 | 2020–26 | Ultimi 3 anni |
|---|---|---|---|---|
| Nessuno | — | +1,2 | +29,0 | +65,5 |
| 300 | 12 | −1,5 | +24,4 | +51,5 |
| 400 | 4 | −2,7 | +25,6 | +57,7 |
| 500 | 4 | +0,1 | +28,1 | +63,4 |
| 600 | **1** (04/09/2026) | +1,2 | +29,4 | +66,2 |
| 700 | 0 | uguale a nessuno | uguale | uguale |
| 800 | 0 | uguale a nessuno | uguale | uguale |

**Regola: non conviene.**
- 500 fa peggio di nessun target.
- 700 è identico a nessun target.
- 600 cambia una sola NFP su 148: +25 pips il 04/09/2026, poi a 14:31 il prezzo era tornato a 575.
- Un target a 600 è quasi sempre irrilevante. Più basso fa perdere.
