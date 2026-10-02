# CPI e NFP insieme: modelli condivisi, famiglie di feature, adattività

Numeri: `research_output/phase2/p2_summary.json` (`by_k_conditions`,
`adaptivity`, `family_value`), `p2_models_discovery.json`,
`p2_validation.json`.

## 1. Esiste un pattern comune a CPI e NFP?

**No.**

- **Regole del gruppo condiviso** (CPI+NFP insieme, supporto minimo 30):
  1.478.986 ipotesi, miglior t 2,70 contro una mediana per caso di 2,72,
  **p familywise 0,53**. I 5 candidati, applicati al CPI 2020–26, sono
  tutti negativi (da −0,22 a −1,09 R); due perdono più di 1 R a trade.
- **Modello condiviso** (LightGBM, prezzo + macro, pesi con emivita 3
  anni, τ = 0,2): t 0,44 in scoperta. Fuori campione +0,11 R sul CPI (9
  trade, p 0,45) e +0,63 R sull'NFP (7 trade, p 0,25). Troppo pochi trade e
  nessuna significatività.

## 2. CPI e NFP richiedono modelli diversi?

Nessuno dei due ha un modello che funzioni, quindi la domanda resta senza
oggetto per la direzione. Sulla **struttura** del trade però sono
chiaramente diversi, e un sistema futuro deve trattarli separatamente:

| | CPI | NFP |
|---|---|---|
| Costo medio per trade 2014–19 | 0,86 R | 0,41 R |
| Tetto (oracolo, costi base) 2013–26 | +0,39 R | +0,77 R |
| Tetto con costi conservative | −0,20 R | +0,50 R |
| Trade giusti stoppati (k = 0,60) | 19% | 13% |
| Miglior t per caso nella ricerca (mediana) | 3,02 | 5,54 |
| Configurazione scelta | ridge, prezzo + macro, 5 anni | LightGBM, prezzo + macro + tassi, 5 anni |

L'NFP è il più "tradabile" dei due se un giorno esistesse un vantaggio
sulla direzione.

## 3. Quali famiglie di feature aggiungono qualcosa

Walk-forward di scoperta 2014–19. Per ogni insieme di feature: t migliore
e mediano su modelli, adattività e soglie (solo configurazioni con ≥ 20
trade).

| Insieme | CPI: t max (mediano) | NFP: t max (mediano) | Condiviso: t max (mediano) |
|---|---|---|---|
| Solo prezzo | −1,66 (−1,66) | −1,01 (−1,72) | −0,92 (−1,24) |
| + macro | **−0,31** (−0,72) | −0,26 (−0,94) | **0,44** (−2,06) |
| + tassi | −1,26 (−1,38) | −1,23 (−1,92) | −0,83 (−1,61) |
| + dollaro/FX | — | −0,78 (−1,66) | −0,16 (−1,52) |
| + VIX/rischio | — | −0,17 (−0,67) | −0,43 (−1,05) |
| + consensus | −0,77 (−1,29) | −0,91 (−1,60) | −1,08 (−1,56) |
| + Fed | −1,41 (−1,41) | −1,07 (−1,87) | −0,34 (−1,72) |
| + posizionamento COT | — | −1,37 (−1,76) | −0,67 (−1,07) |
| + macro + tassi | −1,06 (−1,56) | **0,15** (−0,99) | 0,20 (−2,23) |
| tutte | −0,60 (−1,55) | −0,10 (−0,43) | −0,53 (−2,02) |

"—" = nessuna configurazione con almeno 20 trade.

- **Macro** (sorprese, livelli, reazioni passate) è la famiglia che
  compare nei tre modelli scelti. Porta il t da circa −1,5 a circa 0: da
  "perde" a "non perde". Non a positivo.
- **Price action, consensus, tassi, dollaro, Fed, VIX, COT**: nessuna porta
  una configurazione sopra zero da sola.
- Nelle **regole**, le condizioni che compaiono di più fra le migliori
  sono sorprese macro recenti (vendite al dettaglio, salari, ISM, JOLTS),
  consensus dei salari e forma delle candele. Nessuna regge fuori campione.

## 4. Le combinazioni battono le condizioni singole?

Miglior t osservato nella scoperta per numero di condizioni:

| | Singole | Coppie | Terne |
|---|---|---|---|
| CPI LONG (T−1M) | 0,29 | 2,11 | 2,80 |
| CPI SHORT (T−1H) | −0,16 | 1,32 | 2,53 |
| NFP SHORT (T−1H) | 2,16 | 3,53 | **7,36** |
| NFP LONG (T−1M) | 2,07 | 3,39 | 4,76 |
| Condiviso SHORT (T−1H) | 0,00 | 1,31 | 2,70 |

**Le combinazioni fanno sempre numeri più grandi, ma lo fanno anche sui
dati rimescolati.** Con 1.500 condizioni ci sono oltre un milione di
coppie e terne, e alcune cadono per caso su 15 release fortunate. Il
nullo a permutazioni è costruito con le stesse terne: tiene conto di
questo, e solo NFP-1 lo batte. Poi fallisce fuori campione. Nessuna
**singola** condizione ha un t notevole (il massimo è 2,16 su NFP, dove il
caso arriva a 5,5). In questi dati le interazioni non contengono
informazione vera in più.

## 5. Il modello adattivo batte quello statico?

t mediano e massimo delle configurazioni per adattività (scoperta):

| | Espandente (statico) | Finestra mobile 5 anni | Pesi con emivita 3 anni |
|---|---|---|---|
| CPI | −1,72 / −0,70 | −1,31 / **−0,31** | −1,39 / −0,44 |
| NFP | −1,71 / −0,14 | −1,05 / **0,15** | −1,10 / −0,17 |
| Condiviso | −1,59 / −0,45 | −1,69 / −0,53 | −1,10 / **0,44** |

Le versioni adattive perdono **meno** di quella statica (t mediano più alto
in 5 casi su 6). È coerente con i cambi di regime di `REGIME-ANALYSIS.md`:
il passato lontano fa danni. Ma "perdere meno" non è un vantaggio: nessuna
adattività produce un'aspettativa positiva stabile.

## 6. Generalizzazione fra eventi

Per protocollo le regole di un gruppo sono state applicate solo alla
propria famiglia (le condivise a entrambe). Una regola trovata sul CPI e
provata sull'NFP (o il contrario) non è stata testata. Dato che nessuna
regola regge nemmeno sulla propria famiglia, non c'era niente da
generalizzare.
