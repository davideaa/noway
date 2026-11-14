# Report Fase 0–1 — risultati del primo ciclo

Data: 2026-11-14. Protocollo dichiarato prima: [PROTOCOLLO_01.md](PROTOCOLLO_01.md)
(commit `0a45f53`, precedente a ogni test). Errori e deviazioni: [registri/DEVIAZIONI.md](registri/DEVIAZIONI.md).

## In una frase

**Nessuna delle due strategie testate ha un vantaggio sfruttabile oggi da un privato.**
Le coppie cointegrate sulle cripto perdono. Il cash-and-carry sul funding pagava molto
nel 2020–2021, ma dal 2023 rende meno dei titoli di Stato a 3 mesi.

## Cosa è stato fatto

1. **Fattibilità** ([EXECUTION_FEASIBILITY_REPORT.md](EXECUTION_FEASIBILITY_REPORT.md)): per un
   italiano l'arbitraggio cripto si fa in modo legale solo su OKX Europe o Kraken. Gli ETF USA
   sono vietati (PRIIPs). Fusion Markets ti metterebbe su un'entità extra-UE, senza tutele.
2. **Dati**: Binance public data, gratuito, ogni file verificato con il checksum. Universo
   di 15 monete scelte per volume a **dicembre 2018**, non a oggi: così non si tengono solo
   le sopravvissute. I salti di prezzo sopra il 50% sono stati controllati uno per uno e sono
   tutti eventi reali.
3. **Letteratura**: 37 articoli ([sintesi](ricerca/letteratura/sintesi_letteratura.md)).
4. **Due strategie** testate con i parametri fissati prima, costi realistici, divisione
   costruzione 2019–2022 / verifica 2023–2026.10.
5. **Revisione indipendente** del codice con un altro modello: ha trovato un errore grave
   (corretto) e confermato che non c'è look-ahead.

## Strategia A — coppie cointegrate

| | Costruzione 2019–22 | Verifica 2023–26 |
|---|---:|---:|
| Rendimento annuo | −2,0% | **−9,2%** |
| Sharpe | −0,68 | −0,69 |
| Perdita massima | −11% | **−38%** |
| Operazioni | 7 | 17 |

**Perché fallisce, in parole semplici.** Due monete "cointegrate" dovrebbero muoversi come
legate da un elastico: se si allontanano, prima o poi si riavvicinano. Nei dati l'elastico
si spezza quasi sempre:
- con il controllo per i test multipli (105 coppie provate ogni trimestre), in 23 trimestri
  su 32 non passa **nessuna** coppia;
- quando si entra, lo spread torna alla media **solo nell'8% dei casi**; il resto finisce
  a stop o a fine finestra;
- nel giugno 2023 le cinque coppie scelte erano tutte "short BCH" e BCH è raddoppiato in una
  settimana: −35% in un colpo solo.

In tutte e sei le varianti di robustezza la verifica è negativa. Il Deflated Sharpe vale
0,0004 contro una soglia di 0,95. **REJECTED.**

Coerente con la letteratura: sulle azioni USA il pairs trading è quasi sparito dopo il 2002
(Do e Faff 2010), e le opportunità sono crollate dopo il 2009 (Rad, Low e Faff 2016).

## Strategia B — cash-and-carry sul funding

Compri BTC/ETH e vendi la stessa quantità di perpetuo. Il prezzo non conta più: incassi il
funding che pagano i compratori a leva.

| Versione | Costruzione | Verifica | T-bill nello stesso periodo |
|---|---:|---:|---:|
| Principale (soglia 10%) | +10,8% annuo | **+2,9% annuo** | 4,5% |
| Sempre aperta | +11,3% | +3,8% (al massimo 4,8% senza costi di ribilanciamento) | 4,5% |

Nessuna variante batte la liquidità in modo significativo. **REJECTED.**

**Perché.** Il funding medio annuo di BTC e ETH era 17–37% nel 2020–2021 ed è sceso al 2–5%
nel 2025–2026. È esattamente quello che prevede la letteratura (il premio si consuma quando
arrivano gli arbitraggisti). Dopo i costi resta meno di un conto deposito, con in più:
- il rischio dell'exchange (FTX insegna);
- il rischio di liquidazione della gamba short in un rialzo violento;
- il rischio regolatorio sulla leva dei perpetui in UE.

**Due avvertenze.**
1. Un errore di contabilità nel primo run dava il 68% annuo: era leva nascosta, l'ho trovato
   e corretto io.
2. Un secondo errore sui costi di ribilanciamento l'ha trovato il revisore indipendente.
   Senza questi controlli sarebbe uscito un risultato "eccezionale" e falso.

## Benchmark passivi (verifica 2023–2026.10)

| | Rendimento annuo composto | Volatilità | Sharpe | Perdita massima |
|---|---:|---:|---:|---:|
| BTC compra e tieni | 49,5% | 46% | 1,10 | −53% |
| ETH compra e tieni | 17,9% | 63% | 0,57 | −68% |
| S&P 500 (solo prezzo, senza dividendi) | 19,6% | 15% | 1,30 | −19% |
| T-bill 3 mesi | 4,5% | ~0 | — | 0 |
| Strategia A | −9,2% | 13% | −0,69 | −38% |
| Strategia B | 2,9% | 0,6% | sotto il T-bill | −0,6% |

B ha un rischio molto più basso di tutti i benchmark, ma rende meno della liquidità.
Quindi un rischio più basso non compensa.

## Limiti di questo ciclo

- Prezzi e funding di **Binance**, mentre l'esecuzione sarebbe su OKX o Kraken. Il funding di
  OKX esiste solo dal 2022.
- Solo cripto: azioni/ETF senza dati gratuiti raggiungibili da qui, futures senza storico gratuito.
- Dati giornalieri: le strategie intraday non sono state testate.
- In B il capitale fermo non incassa interessi. Se li incassasse (es. stablecoin a rendimento),
  la soglia 10% guadagnerebbe circa +0,3% annuo sopra il T-bill: comunque non significativo.

## Prossimo passo proposto (da approvare)

Queste due sono le famiglie con più supporto in letteratura e con dati gratuiti. Le
direzioni sensate rimaste costano dati o richiedono un account:
1. **Coppie di ETF UCITS / azioni UE su IBKR**: servono i dati, cioè l'account IBKR con
   abbonamento di circa 10 $/mese, oppure una chiave API gratuita (Alpha Vantage, Tiingo)
   che va creata da te.
2. **Spread tra scadenze dei futures (CME)**: servono dati storici a pagamento.
3. **Dati del tuo MT5** (FX/metalli/indici con i tuoi spread e swap veri): gratis, ma
   l'esportazione la fai tu.

Se nessuna di queste porta un vantaggio dopo i costi, la conclusione corretta sarà che
l'arbitraggio statistico non è accessibile a un privato con questi mezzi.
