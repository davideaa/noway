# H-X46 — Stop da quanto è andato contro nelle ultime 3–12 NFP, +20% (pre-registrata)

Scritta il 20/10/2026 **prima** di calcolare.

## Idea di Davide

- Lo stop migliore è **dinamico**: cambia NFP per NFP e anno per anno.
- Si calcola solo con le NFP prima, e **non troppe**: le ultime 3, 4, 5,
  6.
- Il mese dopo si aggiunge la NFP appena passata, e si va avanti così.

## Cosa c'è già, da dichiarare

**Gli stop provati finora sono già dinamici e usano solo il passato.**
- **B37** = 30 pips + 10% della candela prevista.
  - La candela prevista è la media esponenziale (halflife 3) delle candele
    delle NFP precedenti.
  - Il peso di ogni NFP si dimezza ogni 3 NFP indietro, quindi contano
    soprattutto le ultime 3–6.
- **Q70, Q80, Q90** (H-X38) usano le ultime 24 NFP, cioè 2 anni: si
  muovono lenti.
- **Non è ancora stato provato**: lo stop preso direttamente da quanto il
  prezzo è andato contro nelle **poche** NFP precedenti.

Risultati di riferimento (H-X44, prezzi S4, tetto −1R):

| Stop | 2014–19 | 2020–26 |
|---|---|---|
| B37 × 1,0 | +0,059 | +0,368 |
| B37 × 1,2 (scelta di Davide) | −0,006 | +0,452 |

H-X45: fra i due la differenza in R è dentro il caso (t 0,18), e scegliere
ogni volta lo stop migliore degli ultimi 2 anni fa peggio.

## Stop provati

Per ogni NFP, **c = quanto è andato contro il lato giusto** dall'ingresso
alle 14:29 fino alle 14:31, prezzi S4, in % del prezzo. È la stessa misura
di H-X38.

Sulle **ultime k NFP precedenti**, k = 3, 4, 5, 6, 8, 12:
- **MEDk** = media di c × 1,2;
- **MAXk** = massimo di c × 1,2.

Si riporta in pips al prezzo del giorno. Il margine × 1,2 è quello chiesto
da Davide. Con k = 3 il massimo è ancora "le ultime tre".

## Misure

- R a trade (IS 2014–19, OOS 2020–26, ultimi 3 anni, tutto).
- Quota di NFP giuste salvate, RR, calo massimo.
- Stop mediano per anno.
- t appaiata contro B37 × 1,2 e contro B37 × 1,0.
- Stop della prossima NFP.

## Decisione

**Una versione funziona se:**
- ha l'R a trade più alto di B37 × 1,2 sia nell'IS sia nell'OOS;
- lo stesso vale per le due k vicine con la stessa statistica: altopiano.

**Se funziona**, si propone a Davide come stop del sito al posto di B37 ×
1,2, da confermare dal vivo. Va detta la t: sotto 2 il vantaggio può
essere caso.

**Se no**, resta la scelta fra B37 × 1,0 e B37 × 1,2 di H-X44 e H-X45.
