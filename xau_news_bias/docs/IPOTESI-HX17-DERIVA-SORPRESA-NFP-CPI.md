# H-X17 — NFP e CPI: dopo il primo minuto l'oro segue la sorpresa? (pre-registrata)

Scritta il 15/10/2026 **prima** di calcolare.

## Perché

- In H-X15 (news rosse minori, emendamento 2, esplorativo): da T0 + 1 min
  a T0 + 5 min l'oro va nella direzione della sorpresa il 57% delle volte
  (p familywise 0,004). In media però sono solo +2,5 pips, troppo poco
  per lo spread.
- Alle NFP e al CPI l'oro si muove 2–5 volte di più.
- La fase 2 ha cercato regole solo **prima** della release, per la
  prima M1. La finestra **dopo** il primo minuto, letta con la sorpresa,
  non è mai stata provata.
- La cosa ha anche un motivo da istituzionali: il primo minuto è dei
  computer veloci, poi arrivano gli ordini più lenti nella direzione del
  dato.

## Regola, fissata adesso

- Eventi: NFP e CPI 2011–2026, valide in fase 2. Serve la sorpresa da
  ForexFactory: NFP = Non-Farm Employment Change, CPI = CPI m/m.
  - Sorpresa orientata per l'oro: dato sopra le attese = SHORT, sotto =
    LONG.
  - Dato uguale alle attese = nessun segnale.
- Ingresso a T0 + 60 s nella direzione della sorpresa. Uscite: T0 + 5 min
  e T0 + 15 min.
- Si misura sul prezzo medio Dukascopy:
  - quota di volte giuste;
  - movimento medio in pips nella direzione della sorpresa.
- **Costo**: lo spread si paga una volta, all'ingresso. Si riporta il
  risultato netto con spread 10, 20 e 40 pips (40 = quello di Davide alla
  news).

## Periodi e criterio

- Studio 2011–2018, conferma **2019–2026**.
- **Passa** se, nella conferma, per NFP+CPI insieme e almeno a una delle
  due uscite:
  - quota giusta > 50% con binomiale unilaterale p < 0,05 (Holm su 2
    uscite);
  - movimento medio > 20 pips, così resta positivo con uno spread di
    20 pips.
- Lo studio deve andare nella stessa direzione (quota > 50%).
- Anche se passa: i dati NFP/CPI 2019–26 sono già stati visti per altre
  domande. Quindi al massimo **"da registrare dal vivo"**.
- Riportati comunque NFP e CPI separati e per anno.

## Risultati (dopo i commit della pre-registrazione `5c4fe60` e dello script)

File: `research_output/phase2/hx16/hx17_deriva.json`. Codice:
`scripts/hx17_deriva.py`.

| Periodo | Release | Giuste a 5 min | Pips medi a 5 min | Giuste a 15 min | Pips medi a 15 min |
|---|---|---|---|---|---|
| Studio 2011–18 | 123 | 57,7% | +10,6 | 52,0% | +11,8 |
| **Conferma 2019–26** | 141 | **49,6%** | **+0,1** | 53,2% | +2,9 |
| Ultimi 3 anni | 54 | 53,7% | +7,1 | 53,7% | +8,1 |

- **Non passa.** Holm sulla conferma: 0,57 (5 min) e 0,50 (15 min).
  Movimento medio lontano dai 20 pips richiesti.
- Per anno non c'è una crescita con la volatilità. Pips medi a 15 min:
  2021 −28, 2022 +20, 2023 +27, 2024 −13, 2025 +27, 2026 0.
- Sulle NFP e sul CPI la deriva delle news minori (H-X15) **non c'è**, o
  è troppo piccola e instabile per lo spread.
