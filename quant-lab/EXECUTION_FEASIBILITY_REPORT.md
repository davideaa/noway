# Fattibilità di esecuzione — Fase 0

Data: 2026-11-14. Le schede di dettaglio, con fonte e stato di verifica riga per
riga, sono in `ricerca/broker/`:
[fusion_markets.md](ricerca/broker/fusion_markets.md),
[interactive_brokers.md](ricerca/broker/interactive_brokers.md),
[crypto_venues.md](ricerca/broker/crypto_venues.md).

> **Avvertenza sulla verifica.** I siti di IBKR hanno risposto 403 a ogni accesso
> diretto, così come parti di quello di Coinbase: per questi i dati vengono da
> riassunti dei motori di ricerca sulle pagine ufficiali (stato SECONDARY_SOURCE). Il registro
> ESMA dei soggetti autorizzati MiCA e le pagine di Kraken e Fusion sono stati letti direttamente.

## 1. Quali mercati sono accessibili a un italiano

| Sede | Cosa si può fare | Stato |
|---|---|---|
| **Interactive Brokers (IB Ireland)** | azioni USA/UE vere, short con prestito titoli, futures CME, opzioni, ordini combinati a più gambe (BAG) | accessibile; **ETF USA (SPY, GLD, GDX…) vietati ai retail UE** (PRIIPs, niente KID): servono gli equivalenti UCITS |
| **Fusion Markets** | solo CFD (FX, metalli, indici, ~110 azioni USA, cripto a leva 1:2) | un italiano finisce quasi certamente sull'entità di **Vanuatu o Seychelles**: niente tutele ESMA/MiFID, niente fondo di garanzia dichiarato, protezione dal saldo negativo **non garantita** |
| **Kraken (UE)** | spot + perpetui e futures a scadenza via entità CySEC, leva fino a 10x | autorizzato MiCA (Irlanda) e passaportato in Italia; spot caro (0,40/0,80%) |
| **OKX Europe** | spot + "X-Perps" via entità MiFID maltese | autorizzato MiCA (Malta); commissioni basse (spot 0,08/0,10%, perpetui 0,02/0,05%) — le condizioni sui perpetui sono di fonte secondaria |
| **Coinbase** | futures in 26 paesi SEE dal marzo 2026 | Italia citata solo da fonte secondaria |
| Binance, Deribit, Bybit EU (derivati), Bitpanda (derivati) | — | **non utilizzabili** per un retail italiano per spot+derivati (Binance e Deribit assenti dal registro MiCA) |

Rischio regolatorio aperto: una dichiarazione ESMA del 24/02/2026 indica che i
prodotti "tipo perpetuo" rientrano probabilmente nelle misure nazionali sui CFD
(leva massima 2:1 per le cripto). La leva 10x offerta può essere contestata.

## 2. Quali strategie sono compatibili con quali sedi

| Strategia | Dove | Note |
|---|---|---|
| Coppie di azioni / ETF UCITS | IBKR | eseguibile; costo del prestito titoli variabile per titolo, interessi sulla liquidità da short ridotti sotto 100k USD di patrimonio |
| Coppie su CFD | Fusion / PUPrime | **sconsigliato**: swap su entrambe le gambe; le condizioni VFSC elencano "arbitraggio su prezzi fuori mercato" e "condizioni anomale" come eventi di inadempimento a discrezione del broker |
| Spread tra scadenze di futures | IBKR | eseguibile con ordini combinati; **dati storici delle scadenze solo per 2 anni** dall'API: per un backtest servono dati esterni a pagamento |
| Cash-and-carry cripto (long spot, short perpetuo o futures) | OKX Europe o Kraken | legale secondo le pagine trovate, da confermare nell'app; costo di un giro completo ≈ 0,15–0,30% (OKX) o ≈ 0,9% (Kraken taker) |
| Coppie cripto (due perpetui) | OKX Europe / Kraken | eseguibile |

## 3. Costi che possono distruggere una strategia altrimenti buona

1. **Finanziamento overnight dei CFD su due gambe** (Fusion: valore × tasso / 360,
   tasso non pubblicato; si paga su entrambe le gambe).
2. **Commissioni spot di Kraken** (0,40/0,80%): da sole cancellano un anno di carry
   in un mercato calmo.
3. **Prestito titoli** sulle azioni difficili da prendere in prestito (IBKR, variabile).
4. **Abbonamenti ai dati** (IBKR ~10 USD/mese, rimborsati sopra 30 USD di commissioni;
   CME DataMine a pagamento per lo storico dei futures).

## 4. Cosa manca ancora (serve un'azione dell'utente)

- Conferma scritta da Fusion su quale entità accetta un residente italiano.
- Swap e specifiche vere: si leggono solo dal terminale MT5 (scheda Specifiche) o dall'app OKX/Kraken.
- Conferma in-app che i derivati OKX/Kraken sono aperti a un retail **italiano** (le pagine dicono "SEE").
- Capitale indicativo: decide se i futures da IBKR sono realistici.
