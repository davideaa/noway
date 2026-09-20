# V1XAU — verifica del codice, e cosa cambia fra XAUUSD.s e XAUUSD.p

Test su **XAUUSD.s** (PUPrime-Demo, PC Windows), H1, 2019.01.01–2026.09.16,
tick reali 73%, rischio 0,70%, nessuna ottimizzazione.

## Il codice e' pulito

Previsione fatta prima della passata contro risultato vero:

| | Previsto (.p) | Ottenuto (.s) |
|---|---:|---:|
| **Operazioni** | **1.122** | **1.123** |
| Operazioni vincenti | 42,3% | 42,0% |
| Profit factor | 1,33 | 1,36 |

Una operazione di differenza su 1.123. Le due gambe separate:

| | Previsto | Ottenuto |
|---|---|---|
| ROTTURA | 567 trade, WR 37,0%, PF 1,40 | 572 trade, WR 36,5%, PF 1,35 |
| RITRACCIAMENTO | 555 trade, WR 47,7%, PF 1,25 | 551 trade, WR 47,7%, PF 1,22 |

**La ripulitura non ha rotto niente.** I segnali sono gli stessi: le
piccole differenze vengono dal feed diverso, non dal codice.

## Il profitto e' piu' basso, ed e' il simbolo

Profitto ottenuto 20.132 contro i 25.481 previsti. Non e' un errore di
codice: e' il tipo di conto.

| | XAUUSD.p | XAUUSD.s |
|---|---:|---:|
| Commissioni | 7,03 $/lotto | **0** |
| Come si paga | spread stretto + commissione | tutto nello spread |
| **Guadagno medio per operazione** | **+0,1710 R** | **+0,1494 R** |

Lo spread piu' largo di `.s` costa **il 13% del vantaggio**. Su un
sistema che muore a tre volte i costi, il tipo di conto non e' un
dettaglio: **conviene operare su `.p`**.

## I numeri su .s, a lotto fisso

| Periodo | Trade | Punti R | Guadagno medio | PF | Guadagno | Annuo |
|---|---:|---:|---:|---:|---:|---:|
| 2019-2023 costruzione | 715 | 71,4 | +0,0999 | 1,19 | +50% | 10,0% |
| 2024-2026 mai visto | 408 | 96,3 | +0,2361 | 1,50 | +67% | 24,9% |
| tutto | 1.123 | 167,7 | +0,1494 | 1,30 | +117% | 15,2% |

Si ripete la stessa forma vista su `.p`: il fuori campione rende piu'
del periodo di costruzione, per il motivo gia' detto — il 2024-2026 e'
stato eccezionale per l'oro, non perche' il sistema sia piu' bravo li'.

## Monte Carlo su .s

| Rischio | DD 50° | DD 90° | DD 95° | DD 99° | Guadagno mediano |
|---:|---:|---:|---:|---:|---:|
| 0,70% | 18,2% | 26,3% | 29,0% | 35,2% | +195% |
| 1,05% | 26,2% | **37,1%** | 40,7% | 48,5% | +380% |

Il drawdown vero della passata (18,20% sul bilancio) cade esattamente
sulla mediana simulata: nessun percorso fortunato.

**Su `.s` il tetto del 35% al 90° percentile cade a 0,98%**, non a 1,05%
come su `.p`. Lo spread piu' largo si paga anche qui.

## La cosa che questa passata dimostra e che non avevamo

Il sistema e' stato costruito e verificato su `XAUUSD.p`. Girarlo su
`XAUUSD.s` significa **un altro feed di prezzi e una struttura di costi
completamente diversa** — spread al posto delle commissioni. Il
vantaggio regge: profit factor 1,30 contro 1,33, stessa forma anno per
anno, stesso rapporto fra dentro e fuori campione.

Non e' una prova indipendente in senso stretto (stesso broker, stesso
sottostante), ma e' il primo controllo che il risultato non dipenda da
un particolare listino prezzi.
