# Indice: cosa c'è e a cosa serve

Si apre quando serve un file preciso. Per lavorare basta
`docs/CONTINUA-QUI.md`.

## Gli `.mq5` — due sono vivi, gli altri sono lapidi

**Prima di cestinarne uno, leggere questa tabella.**

| File | Stato |
|---|---|
| `V1XAU_TrendFollowing.mq5` | **VIVO — l'EA dell'oro**: ROTTURA (M30) + RITRACCIAMENTO (H4). Dal 2026-09-20 ha il pannello live, spento nel tester |
| `NAS100_..._v2_57_MULTI.mq5` | **VIVO — l'EA del nasdaq**, quello che può condividere il conto (`BlockOnAnyAccountPosition`). Stesso pannello |
| `NAS100_..._v2_57.mq5` | la stessa strategia senza convivenza. Costruita da Davide con un'altra AI |
| `NAS100_v2_57_valori.set` | i parametri testati, ottimizzazione spenta. **Il file di sicurezza** |
| `NAS100_v2_57_plateau.set`, `plateau/` | le griglie del test del plateau, **mai lanciate** |
| `V2XAU_TrendFollowing_VRC.mq5` | **PARCHEGGIATA** — capitale di rischio virtuale, per il problema di margine. Mai compilata né usata. `docs/storia.md` sez. 8 |
| `GoldPortfolio.mq5` | **VIVO**: la versione a tre gambe. Tenuta perché è l'unica con la verifica fuori campione non contaminata (il 22% di `storia.md` sez. 5) |
| `GoldTrendPullback.mq5` | **ANTENATO** del RITRACCIAMENTO. Bocciato da solo (t 1,61), promosso dopo l'estensione della griglia (t 2,61). Non è una candidata morta |
| `GoldS3.mq5` | antenato della ROTTURA: il solo Donchian estratto per misurarlo isolato |
| `GoldMomentum3.mq5` | la ricostruzione dalle cinque foto. Superata: tre gambe tutte trend, Z-Score −3,53 |
| `GoldFadeBreak.mq5` | scartata — la TRAPPOLA, +50 R dentro e −44,9 R fuori |
| `GoldRangeMR.mq5` | scartata — 174 configurazioni con ≥100 trade, zero in utile |
| `GoldRandomNull.mq5` | benchmark a ingressi casuali, **mai eseguito** |

## Gli strumenti

### Il livello dati — si parte sempre da qui
| | |
|---|---|
| `dati_validazione.py` | dal report MT5 alle operazioni e alle statistiche **a rischio fisso**. `leggi()` apre anche i `.gz` |
| `estrai.py` | dal report HTML alle operazioni attribuite per strategia |
| `regimi.py` | misura il mercato **prima** della strategia: 12 caratteristiche a ogni ingresso, niente sguardo in avanti |

### Monte Carlo
| | |
|---|---|
| `montecarlo.py` | bootstrap a quattro metodi, una strategia |
| `montecarlo_validazione.py` | cinque metodi (permutazione, IID, blocchi, stazionario, per regime) |
| `montecarlo_portafoglio.py` | più strategie insieme, in frazione di conto |
| `robustezza.py` | le prove contro l'overfitting: t dentro/fuori campione, soglia del rumore, tetto sulle vincite, costi, falsi breakout |
| `fusione_conto_unico.py` | **due gambe su un conto solo**: storia vera, correlazione, Monte Carlo. Scritto come controllo indipendente del precedente, non come suo sostituto |

### I report PDF
| | |
|---|---|
| `report_finale.py` | il dossier (`--rischio`, `--due`) |
| `report_validazione.py` | il dossier di validazione a 22 pagine |
| `report_sintesi.py` | la versione breve a 8 pagine, rischio fisso **e** composto affiancati |
| `report_regimi.py` | l'analisi dei regimi a 8 pagine: perché ha funzionato, quando soffre |
| `report_curva_reale.py` | **la curva storica vera** ai rischi scelti, col composto. Non è una simulazione |
| `report_portafoglio.py` | oro + nasdaq su un conto solo, con e senza composto |
| `report_uno_o_due.py` | un conto o due, e con quale rischio. **Il report che corregge il 4572%** |
| `report_rischio_portafoglio.py` | quanto rischiare: due scenari, tetto sul drawdown |
| `report_scelta_finale.py` | la scelta a tetto 33%: oro 0,65% e nasdaq 0,98% |
| `report_due_broker.py` | stessa strategia, due listini |
| `report_montecarlo.py` | il PDF del Monte Carlo |

## Le schede

| | |
|---|---|
| `CONTINUA-QUI.md` | **lo stato corrente.** Si parte da qui |
| `storia.md` | l'archivio: scartate, errori, V2XAU, i parametri con il motivo di ogni scelta |
| `indice.md` | questo file |
| `verdetto-robustezza.md` | **è vera o è overfittata**: le sei prove, i numeri corretti, i falsi breakout |
| `verifica-conto-unico.md` | la verifica del 2026-09-21: il PDF era onesto, il tetto è sforato |
| `analisi-regimi.md` | zero variabili significative su 25. L'edge non dipende dal regime |
| `rischio-portafoglio.md` | come si è arrivati ai rischi scelti, due scenari |
| `portafoglio-un-conto-o-due.md` | un conto o due |
| `nas100-parametri.md` | i parametri del nasdaq |
| `v1xau-verifica.md` | verifica di V1XAU, `.s` contro `.p` |
| `fuori-campione.md` | i criteri del fuori campione, dichiarati prima |
| `parametri-finali.md` | i parametri dell'oro e come sono stati scelti |
| `piano-validazione.md` | il piano di validazione |
| `mt5-guida-test.md` | come si lanciano i test in MetaTrader |
| `portafoglio-tre-gambe.md` | la versione a tre gambe |
| `gold-momentum-ricostruzione.md` | la ricostruzione dalle cinque foto pubblicitarie |
| `s3-piano-test.md`, `risultati-test-1.md`, `risultati-combinazioni.md` | i test sul Donchian |
| `pullback-h4-verdetto.md` | il verdetto sul pullback |
| `range-mr-verdetto.md` | il verdetto sul ritorno alla media |
| `risultato-finale.md` | il risultato a settembre |

Ogni `.mq5` dichiara la propria ipotesi nel commento di testa, scritta
**prima** del test. Non è decorazione: è il motivo per cui il fuori
campione conta qualcosa.
