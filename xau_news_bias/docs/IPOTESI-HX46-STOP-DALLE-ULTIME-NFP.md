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

## Risultati (dopo il commit `a5fa756`)

File: `research_output/phase2/hx16/hx46_stop_ultime.json`. 148 NFP, dal
07/02/2014 al 02/10/2026.

R a trade, prezzi S4, tetto −1R. Salvato = NFP giuste in cui lo stop non
scatta, 2014–19 / 2020–26. La t è contro B37 × 1,2.

| Stop | 2014–19 | 2020–26 | Ultimi 3 anni | Tutto | Salvato | t | Prossima NFP |
|---|---|---|---|---|---|---|---|
| MED3 | +0,088 | +0,410 | +0,798 | +0,258 | 79% / 79% | 0,53 | 88 |
| MED4 | +0,075 | +0,431 | +0,840 | +0,263 | 77% / 81% | 0,65 | 77 |
| **MED5** | +0,077 | +0,461 | +0,855 | +0,279 | 77% / 83% | 1,15 | 75 |
| MED6 | +0,046 | +0,511 | +0,969 | +0,291 | 77% / 85% | 1,49 | 73 |
| MED8 | −0,027 | +0,491 | +0,948 | +0,246 | 72% / 85% | 0,30 | 65 |
| MED12 | +0,007 | +0,490 | +0,946 | +0,262 | 74% / 87% | 0,77 | 60 |
| MAX3 | +0,041 | +0,237 | +0,476 | +0,144 | 84% / 89% | −1,56 | 181 |
| MAX5 | +0,021 | +0,208 | +0,386 | +0,119 | 86% / 94% | −1,87 | 181 |
| MAX12 | −0,019 | +0,158 | +0,307 | +0,074 | 93% / 98% | −2,08 | 181 |
| B37 × 1,0 (oggi) | +0,059 | +0,368 | +0,744 | +0,222 | 77% / 75% | −0,18 | 66 |
| B37 × 1,2 | −0,006 | +0,452 | +0,951 | +0,236 | 79% / 85% | — | 79 |

**Per la regola scritta prima: nessuna versione funziona.**
- MED5 e MED6 battono B37 × 1,2 in tutti e due i periodi, ma i loro vicini
  no: MED4 è sotto nel 2020–26, MED8 è sotto nel 2014–19.
- Il vantaggio non è provato: t fra 0,3 e 1,5 contro B37 × 1,2, e fra 0,55
  e 0,93 contro lo stop di oggi.

**Da dire.**
- Contro lo stop di oggi (B37 × 1,0), MED3, MED4 e MED5 fanno meglio sia
  nel 2014–19 sia nel 2020–26, uno accanto all'altro. Non era il confronto
  scritto prima, quindi è solo descrittivo.
- **MAXk**, cioè il peggio delle ultime NFP più il 20%, dà stop molto
  larghi: 100–190 pips nel 2024, 181 per la prossima NFP. Salva il 90–98%
  delle NFP giuste, ma rende la metà.

**Come si muove lo stop**, mediana per anno, in pips:

| | 2014 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B37 × 1,0 | 41 | 39 | 39 | 36 | 35 | 34 | 37 | 38 | 37 | 40 | 47 | 45 | 56 |
| B37 × 1,2 | 49 | 47 | 47 | 44 | 42 | 41 | 44 | 45 | 45 | 48 | 57 | 54 | 67 |
| MED5 | 36 | 52 | 32 | 46 | 33 | 37 | 56 | 39 | 31 | 36 | 60 | 61 | 54 |
| MAX3 | 59 | 80 | 39 | 56 | 60 | 70 | 120 | 38 | 37 | 48 | 103 | 84 | 80 |

**Decisione.** Resta la scelta fra B37 × 1,0 e B37 × 1,2. MED5 è
equivalente, fa salti più grandi da una NFP all'altra e non ha passato la
regola.
