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
