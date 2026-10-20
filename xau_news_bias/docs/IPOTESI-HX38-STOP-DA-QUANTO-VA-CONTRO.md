# H-X38 — Stop NFP da quanto il prezzo va contro quando hai ragione (pre-registrata)

Scritta il 20/10/2026 **prima** di calcolare.

## Idea di Davide

Lo "stop" è il punto in cui il conto si azzera. Davide va in full margin e
lo decide col lotto. Esempio: 500 € e 0,50 lotti vuol dire 100 pips contro
e il conto è bruciato.

Prima di ogni NFP va stimato quanto spazio serve. Si guarda quanto il
prezzo è andato **contro** nelle NFP precedenti, entrando alle 14:29,
**quando la direzione era giusta**: è lo spazio per non saltare quando
hai ragione.

In più, 10–20 secondi prima della news lo spread del broker si apre di
15–30 pips, fino a 40 nel 2026, e si richiude subito. Se sei già vicino al
limite, quell'apertura può buttarti fuori.

Solo dati di prima: per la NFP di novembre contano le NFP fino a ottobre.

## Cosa si sa già, da dichiarare

- H-X12: stop fissi e da ATR. H-X37: stop = 30 + 10% della candela
  prevista, che passa col tetto −1R.
- Le NFP 2014–2026 sono già state usate per gli stop. Un risultato vale
  al massimo **"da registrare dal vivo"**.

## Prezzi: spread come quello del broker di Davide (scenario S4)

- Si parte da S1: tick Dukascopy, spread fino a 40 pips, costi pieni.
- **In più, da 20 secondi prima a 10 secondi dopo la news, lo spread vale
  almeno 30 pips.** Il prezzo medio resta quello vero, cambiano solo bid e
  ask.
- Ingresso T0 − 60 s e uscita T0 + 60 s fuori da quella finestra: lo
  spread allargato conta per lo stop.
- Tutti gli stop si confrontano con questi prezzi, anche fisso 60, 60/100
  e H-X37.

## La misura di base

Per ogni NFP:
- **lato giusto** = direzione del primo minuto (segno di `mv`);
- **quanto va contro** = massima escursione contro il lato giusto, dai
  tick, dall'ingresso alle 14:29 fino alle 14:31, senza stop, con i
  prezzi S4;
- si misura in % del prezzo.

## Stop provati

- **Stop Q** = percentile Q di "quanto va contro" sulle **24 NFP
  precedenti**, riportato in pips al prezzo di quel giorno.
- Q = 50, 60, 70, 80, 90%. Q = 80% vuol dire: nelle 24 NFP prima, quando
  avevi ragione, 8 volte su 10 saresti sopravvissuto.
- Se il migliore è al bordo (50 o 90), la griglia si estende (40 o 95) e
  si dice.
- **Confronti**: fisso 60, 60/100 di Davide, H-X37 (30 + 10% della
  candela prevista).

## Misure (IS 2014–19, OOS 2020–26, ultimi 3 anni, tutto)

- R a trade con la perdita tagliata a −1R (full margin).
- **Salvato**: quota di NFP con la direzione giusta in cui lo stop non
  viene preso.
- Stop in pips NFP per NFP, per la linea nel tempo.

## Decisione

Uno stop Q **funziona** se:
- ha l'R a trade più alto di tutti e tre i confronti, sia nell'IS sia
  nell'OOS;
- i due Q vicini battono anche loro tutti e tre i confronti in tutti e due
  i periodi: altopiano.

**Se funziona,** sostituisce H-X37 sul sito, da confermare dal vivo:
- stop della prossima NFP;
- replay NFP per NFP;
- linea dello stop nel tempo, con le volte che ti ha salvato.

**Se no,** resta H-X37, se con i prezzi S4 batte ancora fisso 60 e 60/100
nell'IS e nell'OOS. Altrimenti resta il fisso 60. In tutti e due i casi la
linea nel tempo va sul sito con lo stop che resta.

## Risultati (dopo il commit `a11798e`)

File: `research_output/phase2/hx16/hx38_stop_contro.json`.
- 148 NFP 2014–2026 provate. Come storia sono servite anche le NFP del
  2012–13.
- Il migliore (Q80) non sta sul bordo. Q40 e Q95 sono calcolati comunque
  e riportati.

R a trade con tetto −1R, prezzi S4. "Salvato" = NFP con la direzione
giusta in cui lo stop non viene preso.

| Stop | IS 2014–19 | OOS 2020–26 | Ultimi 3 anni | Tutto | Salvato IS / OOS |
|---|---|---|---|---|---|
| Fisso 60 | −0,03 | +0,26 | +0,64 | +0,12 | 86% / 83% |
| 60/100 di Davide | −0,03 | +0,22 | +0,54 | +0,10 | 86% / 89% |
| **H-X37 (30 + 10% candela)** | **+0,06** | +0,37 | +0,74 | +0,22 | 77% / 75% |
| Q40 | −0,29 | +0,21 | +0,65 | −0,03 | 44% / 51% |
| Q50 | −0,32 | +0,19 | +0,57 | −0,05 | 44% / 55% |
| Q60 | −0,25 | +0,19 | +0,47 | −0,02 | 54% / 64% |
| Q70 | −0,06 | +0,37 | +0,65 | +0,17 | 65% / 79% |
| Q80 | −0,02 | **+0,45** | **+0,87** | **+0,23** | 72% / 92% |
| Q90 | −0,10 | +0,17 | +0,33 | +0,04 | 79% / 92% |
| Q95 | −0,06 | +0,12 | +0,27 | +0,03 | 84% / 94% |

Stop Q80 mediano: 27 pips nel 2014, 32 nel 2019, 55 nel 2024, 88 nel
2026.

**Verdetto: nessuno stop Q funziona.**
- Q80 è il migliore nell'OOS e negli ultimi 3 anni.
- Nell'IS (−0,02) fa peggio di H-X37 (+0,06), e i vicini Q70 e Q90 non
  battono i confronti.

**H-X37 regge anche con lo spread del broker (S4).** Batte fisso 60 e
60/100 sia nell'IS sia nell'OOS. Resta lo stop del sito.

**Da dire.**
- Lo spread che si apre prima della news costa molto a tutti.
  - Fisso 60, ultimi 3 anni: da +1,04R (S1) a +0,64R (S4).
  - H-X37: da +1,18R a +0,74R.
- Con H-X37, quando la direzione era giusta, lo stop ti ha salvato:
  - 68 volte su 90 dal 2014;
  - 35 su 47 dal 2020.
