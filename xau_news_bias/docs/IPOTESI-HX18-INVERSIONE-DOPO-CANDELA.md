# H-X18 — Dopo la candela della news l'oro torna indietro? Test sul 2024–26 chiuso a chiave (pre-registrata)

Scritta il 15/10/2026 **prima** di aprire i dati qui sotto.

## Da dove nasce (visto sui dati, quindi non è una prova)

Retail Sales e PPI per periodo, mediane (sito, emendamento 3):

| | 2011–18 | 2019–22 | 2023–26 |
|---|---|---|---|
| Release | 148 | 72 | 75 |
| Candela news ÷ media delle 15 candele M1 prima | 3,3× | 3,3× | 5,1× |
| Corpo ÷ ampiezza della candela | 0,60 | 0,54 | 0,46 |
| Dopo la chiusura (T0+1 → T0+5 min) continua nella stessa direzione | 51% | 43% | **37%** |
| Movimento T0+1 → T0+5 min nella direzione della candela ÷ ampiezza | +0,02 | −0,14 | −0,14 |

Ipotesi: dal 2023 la candela della news va oltre il dovuto, poi in parte
torna indietro nei 4 minuti dopo. Studi su tassi e CPI descrivono
un'eccesso di reazione simile (Kroner, Fed 2025).

## Test pulito

- Le **altre 9 famiglie rosse** di H-X15: FOMC, verbali, PIL, ISM_M,
  ISM_S, ADP, fiducia, Michigan, claims. Il loro **2024-01 → 2026-10 non è
  mai stato aperto** (protocollo H-X15, test finale chiuso).
  - Si apre adesso, una volta sola, per questo test.
  - Il test finale di H-X15 per queste famiglie non avrebbe più dati
    vergini; non c'era comunque nessun finalista.
- Release valide come in H-X15; movimento della prima M1 diverso da zero.
- **Esito**: inversione = il prezzo medio a T0 + 5 min è dalla parte
  opposta, rispetto a quello di T0 + 1 min, alla direzione della prima
  M1.
- **Passa** se la quota di inversioni è > 50% con binomiale unilaterale
  p < 0,05.
- **Sempre riportati**:
  - quota per famiglia;
  - movimento mediano e medio in pips e come frazione della candela;
  - risultato netto con spread 10 e 20 pips;
  - lo stesso per le stesse famiglie nel 2011–18 e 2019–23 (già visti,
    solo confronto).
- **Se passa**: regime di inversione confermato su news diverse da quelle
  in cui è stato visto. Si registra dal vivo su Retail/PPI e sulle altre
  rosse dalla prossima release.
  - Vale da trade solo se il movimento medio supera lo spread.
- **Se non passa**: con ogni probabilità è il caso, su Retail/PPI 2023–26.

## Risultati (dopo i commit `07114c5` e dello script)

File: `research_output/phase2/hx16/hx18_inversione.json`. Codice:
`scripts/hx18_inversione.py`.

Il datafeed rispondeva 503: aggiunti tentativi ripetuti, rifatto.

| Altre 9 famiglie rosse | Release | Torna indietro | p | Pips medi per chi va contro la candela (T0+1 → T0+5 min) |
|---|---|---|---|---|
| **2024–26 (test pulito)** | 267 | **52,4%** | 0,23 | +3,1 (netto con spread 10: −6,9) |
| 2011–18 (già visto) | 940 | 44,6% | | −1,3 |
| 2019–23 (già visto) | 343 | 49,3% | | −0,2 |

- **Non passa.** Nel test pulito il ritorno dopo la candela non è
  diverso dal caso, e vale 2–3 pips.
- C'è una tendenza nel tempo: dalla continuazione (2011–18, 55%) a un
  pareggio o una lieve inversione (2024–26, 52%). È troppo debole per
  essere tradata.
- Per famiglia nel 2024–26 (pochi casi): ISM servizi 64% (+13 pips), PIL
  62%, ISM manifatturiero 59% (+18), Michigan 29%, FOMC 45%. Tutto
  rumore con 12–32 release ciascuna.
- Il 37% di continuazione su Retail/PPI 2023–26 era quindi con ogni
  probabilità il caso, o una cosa solo di quelle due news.
