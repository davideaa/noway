# H-X10 — CPI e NFP: la wick massima, senza spread (pre-registrata, esplorativa)

Scritta il 26/09/2026 **prima** di calcolare. Richiesta di Davide:
- non contare lo spread;
- contare la direzione e fin dove arriva la wick a favore;
- rifare tutto su CPI e NFP e vedere se il vantaggio c'è.

## Misura

Tutto sul **prezzo bid**, quello che si vede sul grafico MT5. Niente
spread, niente slittamento.
- Ingresso: bid dell'ultimo tick ≤ T0 − 60 s.
- Stop: 60 pips prima del 2024, 100 dopo, toccato dal bid.
- **R wick**: il punto più favorevole raggiunto dal bid nel minuto della
  news (da T0 a T0 + 60 s), prima dello stop, diviso lo stop. Se lo stop
  arriva prima, −1R.
- **R chiusura**: la chiusura bid a T0 + 60 s, stessa regola di stop, per
  confronto.
- **Direzione**: come sempre, chiusura della M1 (movimento del sito).

## Bias confrontate

Su tutte le NFP e tutti i CPI 2014–2026 del sito:
- regola "contrario della release precedente";
- calcolatore (H-X7, walk-forward);
- sempre LONG;
- **opposta** della regola e **a caso** (media di LONG e SHORT).

## Cosa decide se c'è vantaggio

- Con la wick massima quasi ogni trade finisce sopra zero. Quindi il
  numero da solo non dice niente.
- **Il vantaggio è la differenza fra la bias e il caso**, evento per
  evento, sulla stessa misura:
  - somma R della bias − somma R a caso;
  - t della differenza appaiata bias − opposta.
- Si riportano IS 2014–19, OOS 2020–26 e ultimi 3 anni.
- C'è vantaggio solo se la differenza è positiva **sia** nell'IS **sia**
  nell'OOS. I dati sono già stati visti: al massimo **da confermare dal
  vivo**.
- Il criterio live di H-X8 non cambia.

## Risultati (dopo il commit della pre-registrazione)

File: `research_output/phase2/hx8/hx10_wick.json`. Codice:
`scripts/hx10_wick.py`.

Somma R, 2014–26. "Vantaggio" = bias − a caso, evento per evento; t della
differenza bias − opposta.

| | News | R wick bias | R wick a caso | **Vantaggio wick** (t) | R chiusura bias | R chiusura a caso | **Vantaggio chiusura** (t) |
|---|---|---|---|---|---|---|---|
| NFP, contrario della precedente | 148 | +121,9 | +102,5 | **+19,4** (1,92) | +38,3 | +10,4 | **+27,9** (2,27) |
| NFP, calcolatore | 148 | +110,0 | +102,5 | +7,5 (0,74) | +19,8 | +10,4 | +9,4 (0,76) |
| NFP, sempre LONG | 148 | +86,2 | +102,5 | −16,3 | −3,0 | +10,4 | −13,4 |
| CPI, contrario del precedente | 150 | +55,5 | +74,6 | **−19,1** (−2,40) | −13,4 | +6,4 | −19,9 (−2,07) |
| CPI, calcolatore | 150 | +81,4 | +74,6 | +6,8 (0,84) | +12,6 | +6,4 | +6,2 (0,64) |
| CPI, sempre LONG | 150 | +81,7 | +74,6 | +7,1 (0,88) | +18,5 | +6,4 | +12,1 (1,25) |

Vantaggio wick per periodo, regola NFP: IS +3,1 (t 0,56), OOS +16,2
(t 1,93), ultimi 3 anni +11,9 (t 1,69).

- **Con la wick massima vince anche il caso**: +102,5 R sulle NFP e +74,6 R
  sui CPI tirando a caso. Il numero da solo non dice niente.
- **Il vantaggio della regola NFP resta lo stesso** con qualunque misura:
  circa +20–28 R su 148 NFP. È positivo sia nell'IS sia nell'OOS, quindi
  passa il criterio scritto prima, ma nell'IS è piccolo (t 0,56) e la
  regola è stata trovata dopo aver visto i dati: **da confermare dal
  vivo**.
- Senza spread, chiudendo a fine M1, la regola NFP fa +38,3 R invece di
  +18,9 R: lo spread costa circa 0,13 R a trade.
- **CPI: nessun vantaggio.** La regola è negativa. Il calcolatore è sopra
  il caso di poco (t 0,84).
- Osservazione non pre-registrata: sul CPI l'opposto della regola ("segui
  il CPI precedente") sarebbe positivo nell'OOS (+18,6) ma zero nell'IS
  (+0,4). È lo stesso schema delle trappole già viste: non si insegue.
