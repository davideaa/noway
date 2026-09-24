# È vera o è overfittata — la verifica del 2026-09-21

Report interattivo: `report/e-vera-o-overfittata.html`.
Strumento: `tools/robustezza.py`.

Sei domande, ognuna con la sua prova e con dichiarato **quanto quella
prova è solida**. Dove la prova non c'è, è scritto che non c'è.

## La risposta secca

**Non è overfittata.** Tre prove indipendenti puntano nella stessa
direzione, e un sistema sovra-ottimizzato fallisce la prima, non le
passa tutte e tre:

1. Il **fuori campione**, speso una volta sola, dà **t 4,36** — e quella
   t **non va sgonfiata**, perché lì non è stata provata nessuna
   configurazione. Probabilità che sia caso: circa 6 su un milione.
2. Sopravvive **cancellando ogni vincita sopra 3 R**: restano +180 R e
   sette anni su otto in utile.
3. L'**analisi dei regimi** non trova nessuna delle 25 variabili
   significativa: l'edge non è appeso a una particolare condizione.

**Il numero da usare per i piani è quello basso**: +33,9 R all'anno
(dentro campione), non +66,6 (fuori campione). Il fuori campione rende
il doppio perché il 2024-2026 è stato eccezionale per l'oro.
Composto, scenario prudente: **~29% all'anno**, con drawdown 34-37% al
95° percentile.

## I numeri corretti, ricalcolati dai dati veri

Tre cifre che circolavano nei documenti erano sbagliate o vecchie.

| | scritto prima | vero |
|---|---:|---:|
| t dell'oro | 2,61 | **3,26** |
| deviazione standard sull'oro | 1,45 R | **1,620 R** |
| margine sui costi | 3× | **5,8×** |

Le prime due venivano da una passata più corta (1.036 operazioni da
settembre 2019); adesso il test è quello lungo, 1.123 operazioni da
gennaio. La terza era del vecchio portafoglio a tre gambe.

| | n | somma R | t | p |
|---|---:|---:|---:|---:|
| Oro | 1.123 | +177,1 | 3,26 | — |
| Nasdaq | 1.626 | +172,9 | 3,91 | — |
| **Insieme** | 2.749 | +350,0 | **5,00** | 3·10⁻⁷ |
| dentro campione 2019-23 | 1.765 | +169,4 | 3,00 | 0,0014 |
| **fuori campione 2024-26** | 984 | +180,6 | **4,36** | 6·10⁻⁶ |

**La soglia che il t deve battere non è 2.** Con K configurazioni
provate, il caso da solo regala `radice(2 × log(K))`: con 272
configurazioni la soglia sale a 3,35. Vale **solo dentro campione**.

> **Il buco dichiarato: per il nasdaq non si sa quante configurazioni
> siano state provate**, perché la gamba è stata costruita altrove. Per
> quella gamba il t dentro campione **non è sgonfiabile** e va trattato
> come non verificato. Il suo fuori campione (t 3,08) resta valido.

## I costi

Commissioni **zero** su entrambe le gambe: è un conto dove tutto sta
nello spread. Il costo visibile è quindi **solo lo swap**.

| | R lordi | R di costo | R netti | costo per operazione |
|---|---:|---:|---:|---:|
| Oro | +218,8 | 41,8 | +177,1 | 0,0372 R (19% del vantaggio) |
| Nasdaq | +204,7 | 31,8 | +172,9 | 0,0196 R (16%) |
| Insieme | +423,6 | **73,6** | +350,0 | |

In soldi: −3.451 $ sull'oro, −5.796 $ sul nasdaq. **Il sistema muore a
5,8 volte i costi attuali**, o con 16 $ in più di costo per operazione.

Lo swap è quasi tutto **sui long**: sull'oro −4.884 $ sui long e
**+1.433 $ sugli short**, dove il broker lo paga.

> **Attenzione, e cambia la lettura:** lo spread è già dentro i prezzi
> di apertura e chiusura, e dal report **non è separabile**. Il costo
> vero è più alto di 73,6 R, e di quanto non è misurabile da questi
> dati. **Il margine di 5,8× è quindi ottimista.**

Confronto fra broker, sui file già in casa (indicativo: i periodi non
coincidono):

| | costo, in % del vantaggio lordo |
|---|---:|
| Oro su PUPrime | 19,1% |
| Oro su Fusion | 13,7% |
| Nasdaq su PUPrime | 15,5% |
| Nasdaq su Fusion | **5,7%** |

Abbassare i costi è **l'unico margine di miglioramento a rischio zero
di overfitting**, perché non guarda i rendimenti passati.

## La concentrazione: un numero che avevo dato in modo fuorviante

Avevo scritto che **metà del profitto viene da 11 operazioni su 1.123**.
È aritmeticamente vero e **non vuol dire quello che sembra**. Davide ha
obiettato: se tutti gli anni chiudono in utile, com'è possibile? Aveva
ragione.

Il netto è la differenza fra due numeri grandi e quasi uguali —
+1.473,3 R di vincite contro −1.123,3 R di perdite — quindi è solo il
**24% delle vincite**. «Metà del netto» è il 12% delle vincite lorde:
poche operazioni bastano a coprirlo **perché il confronto è
sbilanciato**, non perché le altre non guadagnino.

Il test vero è togliere le migliori di ogni anno:

| | anni in utile |
|---|---|
| tutte | 8/8 |
| senza la migliore di ogni anno | 7/8 |
| senza le 3 migliori di ogni anno | 7/8 |
| senza le 5 migliori di ogni anno | 4/8 |

E il test più severo, che **azzoppa ogni vincita** sopra una soglia
invece di togliere operazioni scelte a mano:

| tetto per vincita | totale | anni in utile |
|---|---:|---:|
| nessuno | +350,0 R | 8/8 |
| 5 R | +293,8 R | 7/8 |
| **3 R** | **+180,1 R** | **7/8** |
| 2 R | +45,0 R | 4/8 |
| 1,5 R | **−81,8 R** | 2/8 |

Le 11 migliori dell'oro cadono in **sette anni diversi**, non in uno.

**Non sono 11 operazioni: è una coda di circa 200** (il 7%, quelle da
2 R in su). È la forma normale di un inseguitore di tendenza.

> **Dove si rompe davvero: sotto i 2 R di tetto.** Serve poter
> incassare vincite grandi. È il motivo per cui non c'è take profit e il
> trailing è largo: **chi tocca quei due parametri per «incassare prima»
> rompe il sistema.**

## L'osservazione di Davide sui falsi breakout — confermata

Guardando i trade nel tester, Davide ha notato che ci sono molti falsi
breakout che erodono, e poi pochi che recuperano tutto. **È vero, ed è
misurabile.**

Scoperta collaterale: **il report MT5 porta l'etichetta della
strategia** nel commento dell'ordine (`S3-DONCH`, `S2-PULLB`). Quindi
l'attribuzione per gamba è **esatta, non inferita** — l'accoppiamento
apertura/chiusura resta da fare, ma l'etichetta viene gratis.

### ROTTURA (il breakout), 572 operazioni, +120,5 R

| durata | n | % vinte | R medio | R totale |
|---|---:|---:|---:|---:|
| meno di 4 ore | 178 | **2,2%** | −0,897 | **−159,6** |
| 4-12 ore | 101 | 9,9% | −0,722 | −72,9 |
| 12-24 ore | 137 | 54,0% | +0,411 | +56,3 |
| 1-3 giorni | 113 | 73,5% | +1,669 | +188,6 |
| oltre 3 giorni | 43 | **88,4%** | +2,515 | +108,2 |

**Le 279 operazioni che muoiono entro 12 ore costano −232,6 R. Le altre
293 rendono +353,1 R.** Quasi metà dei breakout sono falsi e vengono
puniti quasi subito; l'altra metà paga tutto.

### RITRACCIAMENTO, 551 operazioni, +56,5 R

Stesso schema, più attenuato: le 109 rapide costano −73,9 R, le altre
442 rendono +130,5 R.

### Perché NON è un parametro da ottimizzare

**La durata si conosce solo a cose fatte.** Le operazioni che muoiono
entro 4 ore hanno il 2,2% di successo perché **hanno già colpito lo
stop**: non sono ancora aperte a 4 ore, quindi nessuno stop temporale
le può tagliare. Il numero descrive il meccanismo, **non offre niente da
ottimizzare** — e chi provasse a filtrarci sopra starebbe usando
informazione che al momento dell'ingresso non esiste.

## Cosa resta non dimostrato

- **La persistenza.** «Che probabilità c'è che continui a rendere?»
  **non è calcolabile da un backtest**, e chi dà una percentuale se la
  inventa. Quello che è misurato è la probabilità che l'edge **ci fosse**
  nei dati. Che **resti** dipende dal fatto che il mercato continui a
  fare movimenti lunghi. Per quella domanda il campione non è 2.749
  operazioni: sono **3 o 4 regimi di mercato**.
- **Il tetto di drawdown** posto da Davide (33% al 95°) è sforato:
  33,8% col metodo del PDF, 36,8% col più severo.
- **Il test del plateau sul nasdaq** non è mai stato lanciato.
- **La stessa logica su un altro strumento** non è mai stata provata. È
  il test che separa «meccanismo vero» da «cucito addosso a questi due
  mercati», e costa mezz'ora.

## Rifare l'analisi

```
python3 tools/robustezza.py dati/oro_puprime_065.html.gz:0.65 dati/nasdaq_puprime_098.html.gz:0.98
```
