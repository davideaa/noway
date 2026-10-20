# H-X40 — Tenere la NFP oltre il primo minuto: com'è cambiato negli anni (pre-registrata, solo prova)

Scritta il 20/10/2026 **prima** di calcolare. Il sito non cambia.

## Idea di Davide

Negli anni prima (2016–2020) l'oro costava meno e la candela della NFP
faceva meno pips. Forse allora conveniva tenere il trade di più, per
esempio fino a M5, invece di chiudere dopo un minuto. Davide chiede:
- com'è cambiata questa cosa nel tempo, e quando;
- se ha sempre funzionato;
- se tenere di più aumenta l'RR, e in che caso.

## Cosa si sa già, da dichiarare

- **H-X9**: uscire prima della fine della M1 (5–30 s) rende meno.
- **H-X13** (07/10) ha già provato le uscite a 1, 2, 3, 5, 10 e 15 minuti.
  - Condizioni: prezzi S1, stop fisso 60/100.
  - Risultato: U3, U5 e U10 hanno battuto U1 di poco sia nel 2014–19 sia
    nel 2020–26.
  - Per questo **U5 si registra dal vivo in parallelo a U1** dalla NFP del
    06/11/2026.
  - Non sono stati guardati i singoli anni.
- **H-X39**: tenere fino alle 14:35 solo con sorpresa a favore e grande non
  è stabile.
- Il sito oggi usa lo stop **H-X37** e i prezzi **S4**, diversi da H-X13.
- Le NFP 2014–2026 sono già state viste per molte cose. Il CPI fa da
  conferma. Un risultato positivo vale al massimo **"da registrare dal
  vivo"**.

## Il trade (quello del sito)

- Regola H-X8.
- Ingresso T0 − 60 s.
- Stop H-X37 (30 + 10% della candela prevista), attivo fino all'uscita,
  fermo dove è stato messo.
- Prezzi S4: tick Dukascopy, spread fino a 40 pips, almeno 30 da −20 s a
  +10 s, costi pieni.
- Tetto −1R.
- 148 NFP 2014–2026. Per il CPI: 149 release 2014–2026, stop 60 pips.

## Uscite provate

| Codice | Uscita |
|---|---|
| **U1** (di oggi) | 14:31, T0 + 1 min |
| U2, U3, U5, U10, U15 | T0 + 2, 3, 5, 10, 15 min |
| **W3, W5, W10** "tieni se vinci" | alle 14:31 guardi il trade: se sei in guadagno tieni fino a T0 + 3, 5 o 10 min; se no chiudi alle 14:31 |

- "In guadagno alle 14:31" = il trade non è stato fermato e chiuderlo in
  quel momento, costi compresi, darebbe più di zero.
- Se la migliore uscita fissa è U15, che sta sul bordo, si aggiunge U30 e
  si dice.

## Misure

- **Per anno, 2014–2026**: R a trade di U1, U3, U5, U10, W5, e quante NFP
  vanno meglio o peggio tenendo fino a U5.
- **Per periodo**: IS 2014–19, OOS 2020–26, ultimi 3 anni, tutto.
  - R a trade;
  - quota di trade in guadagno;
  - guadagno medio quando vinci e perdita media quando perdi;
  - **RR = guadagno medio ÷ perdita media**.
- **Idea di Davide, misura diretta**:
  - per ogni NFP, il guadagno di tenere = R di U5 − R di U1;
  - correlazione di Spearman di questo guadagno con la candela prevista
    in pips (quella di H-X32/H-X37, nota prima della news) e con l'anno.
- Guadagno di tenere per terzi di candela prevista: piccola, media,
  grande.

## Decisione

**Un'uscita funziona se:**
- ha l'R a trade più alto di U1 sia nell'IS 2014–19 sia nell'OOS 2020–26;
- almeno un'uscita vicina dello stesso tipo fa lo stesso (altopiano: per
  U5 sono U3 e U10, per W5 sono W3 e W10);
- sul CPI 2014–26 ha l'R a trade più alto di U1.

Se funziona, si propone a Davide di registrarla dal vivo. Il sito non
cambia: Davide ha chiesto solo una prova.

**L'idea di Davide ("prima conveniva tenere, adesso no") è confermata**
se valgono tutte e due le cose:
- il guadagno medio di tenere fino a U5 è positivo nel 2014–19 e zero o
  negativo nel 2020–26;
- la correlazione fra guadagno di tenere e candela prevista è negativa,
  con p < 0,05.

Se vale solo una delle due, si dice "segnale debole". Se nessuna, "non
confermata".

## Risultati (dopo il commit `f887131`)

File: `research_output/phase2/hx16/hx40_tenere.json`.
- 148 NFP e 150 CPI dal 2014.
- Controllo: U1 coincide con la regola B di H-X39 in 297 casi su 297. Il
  CPI del 18/12/2025, senza sorpresa, non c'era in H-X39.
- La migliore uscita fissa è U5, non U15: la griglia non va estesa.

R a trade, prezzi S4, tetto −1R:

| | U1 (oggi) | U2 | U3 | **U5** | U10 | U15 | W3 | **W5** | W10 |
|---|---|---|---|---|---|---|---|---|---|
| NFP IS 2014–19 (70) | +0,060 | +0,073 | +0,079 | **+0,092** | +0,082 | +0,063 | +0,077 | +0,080 | +0,077 |
| NFP OOS 2020–26 (78) | +0,370 | +0,291 | +0,382 | +0,458 | +0,432 | +0,430 | +0,389 | **+0,466** | +0,443 |
| NFP ultimi 3 anni (35) | +0,748 | +0,567 | +0,763 | +0,937 | +0,884 | +0,748 | +0,781 | **+0,955** | +0,902 |
| NFP tutto (148) | +0,223 | +0,188 | +0,239 | **+0,285** | +0,266 | +0,257 | +0,241 | +0,283 | +0,270 |
| CPI 2014–26 (150) | −0,257 | −0,269 | −0,254 | −0,270 | −0,248 | −0,241 | −0,266 | −0,281 | −0,270 |

**Per la regola scritta prima:**
- **passano U3, U10 e U15**;
- **non passano U2, U5, W3, W5 e W10**.

U5 e le W battono U1 sulla NFP in tutti e due i periodi, ma perdono sul
CPI: U5 per 0,013 R, W5 per 0,024 R. U3 passa sul CPI per 0,003 R.

**Da dire.**
- Sul CPI l'ora di uscita non cambia quasi niente: tutte le uscite stanno
  fra −0,24 e −0,28.
- Chi passa e chi no lo decidono differenze di centesimi di R sul CPI, che
  sono rumore. La conferma CPI qui non distingue niente.
- Sulla NFP, tenere da 3 a 15 minuti dà un po' di più in tutti e due i
  periodi, come aveva visto H-X13 con altro stop e altri prezzi.

**Tenere aumenta l'RR, ma si vince meno spesso.** NFP 2014–26:

| Uscita | Trade in guadagno | Vinto medio | Perso medio | RR | R a trade |
|---|---|---|---|---|---|
| U1 | 45,9% | +1,60 | −0,95 | 1,69 | +0,223 |
| U3 | 42,6% | +1,82 | −0,93 | 1,95 | +0,239 |
| U5 | 42,6% | +1,95 | −0,95 | 2,05 | +0,285 |
| U10 | 38,5% | +2,18 | −0,93 | 2,34 | +0,266 |
| U15 | 35,8% | +2,35 | −0,91 | 2,58 | +0,257 |

**Anno per anno**, R a trade:

| Anno | Candela prevista (pips, mediana) | U1 | U5 | W5 | U5 meglio / peggio di U1 (NFP) |
|---|---|---|---|---|---|
| 2014 | 108 | +0,17 | +0,25 | +0,16 | 3 / 3 |
| 2015 | 90 | +0,18 | +0,36 | +0,36 | 4 / 1 |
| 2016 | 95 | +0,03 | +0,04 | +0,04 | 3 / 2 |
| 2017 | 63 | +0,11 | −0,11 | −0,08 | 3 / 5 |
| 2018 | 47 | +0,10 | +0,26 | +0,24 | 6 / 3 |
| 2019 | 38 | −0,21 | −0,22 | −0,22 | 2 / 2 |
| 2020 | 71 | −0,53 | −0,63 | −0,64 | 2 / 2 |
| 2021 | 77 | +0,39 | +0,37 | +0,37 | 4 / 2 |
| 2022 | 72 | +0,08 | −0,05 | −0,05 | 3 / 4 |
| 2023 | 98 | +0,54 | +0,93 | +0,93 | 5 / 2 |
| 2024 | 173 | +0,68 | +0,50 | +0,50 | 1 / 4 |
| 2025 | 148 | +0,09 | +0,39 | +0,45 | 4 / 2 |
| 2026 | 262 | +1,67 | +2,14 | +2,14 | 3 / 0 |

- U5 fa meglio di U1 in 6 anni, peggio in 4 (2017, 2020, 2022, 2024),
  uguale in 3.
- Non c'è un anno in cui la cosa cambia: va a zig-zag.

**Idea di Davide: non confermata.** Va, se mai, al contrario:
- guadagno di tenere fino a U5: **+0,03 R nel 2014–19, +0,09 R nel
  2020–26**;
- correlazione con la candela prevista **+0,05 (p 0,55)**, con l'anno
  **+0,03 (p 0,74)**: nessun legame;
- per terzi di candela prevista:
  - piccola (30–72 pips): +0,02;
  - media (73–102): −0,00;
  - grande (105–365): **+0,17**.

**Lettura**, non dimostrata da questa prova.
- Tenere oltre il primo minuto non era meglio quando la candela era
  piccola.
- Quando la direzione è giusta, l'oro tende a continuare un po' dopo la
  M1, e lo fa di più nelle NFP grosse.
- Il vantaggio è piccolo e cambia di segno da un anno all'altro.

**Decisione.**
- Il sito resta come è, uscita alle 14:31.
- U5 è già registrata dal vivo in parallelo da H-X13, dalla NFP del
  06/11/2026, con stop 60/100 e prezzi S1.
- Per la regola scritta, si propone a Davide di registrare dal vivo anche
  una delle uscite che passano. U10 è quella in mezzo.
