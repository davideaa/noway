# Stato del progetto — da leggere per primo

Aggiornato 2026-09-21. Qui c'è **solo quello che è vero adesso**. Il
racconto di come ci si è arrivati, le strategie scartate e gli errori
commessi stanno in `docs/storia.md`: non serve leggerlo per lavorare,
serve per non ritentare cose già bocciate.

Ogni numero qui è misurato. Dove è una stima, è scritto.

---

# 1. Cosa gira

Due strategie, due strumenti, **un conto solo**.

| | file | cosa fa |
|---|---|---|
| **oro** | `mt5/V1XAU_TrendFollowing.mq5` | ROTTURA (Donchian M30) + RITRACCIAMENTO (pullback H4) |
| **nasdaq** | `mt5/NAS100_..._v2_57_MULTI.mq5` | momentum sull'apertura di New York, M5 |

I parametri completi, con il motivo di ogni scelta, stanno in
`docs/storia.md` sezione 10 (oro) e `docs/nas100-parametri.md`.

> **Non riabbassare `InpS2StopBufferATR` sotto 0,10.** L'ottimizzazione
> lo vuole a 0,05 e più scende meglio va, fino al bordo della griglia.
> È tenuto alto apposta: uno stop appoggiato sul minimo è dove il
> mercato va a prendere gli stop. Costa il 16% del profitto di backtest.

# 2. Il rischio — **oro 0,65% · nasdaq 0,98%**

È l'unica riga giusta. Se trovi altri numeri in giro per il repo, sono
vecchi.

Vincolo posto da Davide: drawdown al 95° percentile **entro il 33%**
nello scenario prudente (2019–2023, senza il boom).

**Quel tetto non è più rispettato.** Rimisurato il 2026-09-21 sui
backtest veri ai rischi decisi:

| metodo | scenario prudente, DD 95% | |
|---|---:|---|
| `gambe` (gambe rimescolate separate) | 33,8% | appena fuori |
| `unito` (tiene la struttura incrociata) | **36,8%** | fuori |

Per un tetto sul drawdown la riga giusta è `unito`, la più severa. Non è
un peggioramento della strategia: è più storia letta col metodo più
duro. **Scendere di rischio o alzare il tetto è una decisione di Davide,
e non è stata presa.**

# 3. I numeri, due gambe su un conto da 10.000

2.749 operazioni, 2019.01.02 → 2026.09.15 (7,70 anni).

| storia vera | |
|---|---:|
| rendimento | **+1.374%** |
| CAGR | 41,8% |
| drawdown di bilancio | **21,0%** |
| solo oro | +197%, DD 17,0% |
| solo nasdaq | +396%, DD 12,9% |

| Monte Carlo, 10.000 storie | mediana | DD 95% |
|---|---:|---:|
| tutto il periodo | +1.414% | 28,4% |
| scenario prudente | +628% | 33,8% |

**Correlazione mensile oro/nasdaq +0,052** su 93 mesi. Quasi zero: la
diversificazione è vera, ed è il motivo per cui il portafoglio sta a
DD 21,0% invece della somma dei due.

> **Tutti i drawdown del progetto sono di BILANCIO, non di equity.**
> MT5 ne misura anche uno che include il flottante delle posizioni
> aperte, sempre più alto (oro 19,2% contro 17,0%). Quello vissuto sul
> conto è il secondo. **Sono un pavimento, non un soffitto.**

## I costi, e quanto reggono

Lo swap è il costo maggiore, cinque volte le commissioni. È **già
compreso in tutti i numeri**. Swap sui long −85 $/lotto, sugli short
+45. Commissioni su `.p` −7,03, su `.s` zero (tutto nello spread).

**Il sistema muore a 3 volte i costi attuali.**

## Dove soffre

L'oro perde nei mercati **laterali a volatilità media** (−0,11 R, PF
0,82, su 112 operazioni). Il nemico non è la direzione, è l'immobilità.
Unica eccezione trovata su 25 variabili provate: `docs/analisi-regimi.md`.

# 4. Cosa resta da fare, in ordine

1. **`BlockOnAnyAccountPosition` = `false`** sul nasdaq. È ancora `true`.
   Nel tester non si vede perché gira da solo; su un conto condiviso
   l'oro aperto toglie al nasdaq il 65% dei suoi trade. **Tutti i numeri
   della sezione 3 presuppongono `false`.** È il più urgente: gli altri
   cambiano quanto si rischia, questo cambia *quali operazioni esistono*.
2. **Allineare i rischi nel sorgente.** Le passate sono a 0,65% e 0,98%,
   ma i default nei `.mq5` sono ancora oro 0,70% e nasdaq 1,50%: basta
   un «carica default» per tornare indietro senza accorgersene.
3. **Demo su Fusion**, un conto solo, due grafici, e lasciar girare
   tre-sei mesi. È l'unico dato nuovo che esiste. Risponde a: gli spread
   e gli slittamenti veri assomigliano ai simulati? e si riesce a
   guardarlo fermo per mesi senza spegnerlo? *(2022 e 2024 sono stati
   anni a vuoto: 675 operazioni per il 9% del risultato.)*
4. **Test del plateau sul nasdaq.** I `.set` sono pronti in
   `mt5/plateau/`, mai lanciati. È la gamba meno verificata, ed è stata
   costruita altrove.
5. **La stessa logica dell'oro su un altro strumento** senza toccare i
   parametri. Vale più di tutto il resto: se funziona anche lì il
   meccanismo è generale e non cucito addosso a XAUUSD. **Dichiarare
   prima su quali strumenti deve funzionare e su quali no**, e perché —
   il trend esiste sulle commodity e sugli indici, molto meno sui cambi.
   Senza quella previsione scritta prima, un fallimento non insegna
   niente.
6. **Misurare** se in quelle 112 operazioni laterali c'è qualcosa, prima
   di costruirci sopra una strategia di ritorno alla media.
7. **Prima del live**, confrontare swap e spread veri con i numeri della
   sezione 3. Se sono peggiori, lo si sa prima e non dopo.

# 5. Le soglie, uguali per ogni strategia futura

Nessuna strategia passa senza. Servono a non trovare un edge troppo
fine, o che i costi si mangiano.

| Cosa | Soglia | Perché |
|---|---|---|
| Numero operazioni | ≥ 100, meglio 200 | sotto, l'incertezza si mangia tutto |
| Guadagno medio | ≥ +0,05 R netto costi | sotto, lo slittamento vero lo azzera |
| Tiene i costi | ×3 ancora in utile | i broker cambiano |
| Plateau | ±20% su ogni parametro | se no è un picco, cioè fortuna |
| Parametri ottimizzati | ≤ n/50 | 200 trade = massimo 4 manopole |
| Concentrazione | top 5% dei trade < 50% del profitto | se no sono biglietti della lotteria |

**Il `t` non si confronta con 2**, ma con quanto ne produrrebbe il caso
viste quante configurazioni hai provato: `radice(2 × log(K))`. Con
K=25 il rumore regala già 2,5; con K=272 regala 3,35.

Il **t 2,61** dell'oro è stato trovato dopo 272 configurazioni: preso da
solo **non dimostra niente**. Quello che tiene in piedi l'oro è il fuori
campione speso una volta sola, non il `t`.

# 6. Limiti dichiarati, da non dimenticare

- Le due strategie **non sono mai girate insieme dentro MetaTrader**: il
  tester prende un simbolo alla volta. I numeri di portafoglio sono la
  fusione esatta di due backtest separati — giusti su rendimenti e
  drawdown, **muti su esecuzioni in contesa**.
- **Niente dati di mercato prima del 2019** e nessun accesso a fonti
  esterne. «Le condizioni favorevoli esistevano anche prima?» resta
  **senza risposta**.
- Il campione vero non è 2.749 operazioni: **metà degli utili viene da
  78 operazioni sull'oro e 136 sul nasdaq**. E per «funzionerà in un
  regime mai visto» il campione è **3 o 4 regimi**, non migliaia di trade.
- **Il fuori campione 2024–2026 è già stato speso**, una volta sola.
  Non c'è più nessun dato vergine.
- Resta aperto il punto della TRAPPOLA, tolta dopo aver guardato il
  fuori campione: `docs/storia.md` sezione 5. Si decide col demo.

# 7. I dati e come rifare le analisi

`dati/` ha i report MT5 veri, compressi. `leggi()` apre anche i `.gz`.

| file | operazioni | periodo | rischio |
|---|---|---|---|
| `oro_puprime_065.html.gz` | **1.123** | 2019.01 → 2026.09 | 0,65% |
| `nasdaq_puprime_098.html.gz` | 1.626 | 2019.01 → 2026.09 | 0,98% |
| `oro_puprime_1pct.html.gz` | 1.036 | 2019.09 → 2026.09 | 1,00% |
| `nasdaq_puprime.html.gz` | 1.626 | 2019.01 → 2026.09 | 1,50% |
| `oro_fusion_1pct.html.gz` | 992 | 2019.09 → 2026.09 | 1,00% |
| `nasdaq_fusion.html.gz` | 1.158 | 2020.11 → 2026.09 | 1,50% |

I primi due sono quelli ai rischi decisi, ed è su loro che si lavora.
Gli altri restano perché sono quelli su cui sono state prese le
decisioni, e i due `fusion` sono l'unico confronto fra broker.

```
python3 tools/fusione_conto_unico.py dati/oro_puprime_065.html.gz:0.65 dati/nasdaq_puprime_098.html.gz:0.98
python3 tools/report_regimi.py       dati/oro_puprime_1pct.html.gz dati/nasdaq_puprime.html.gz
python3 tools/report_curva_reale.py  dati/oro_puprime_1pct.html.gz dati/nasdaq_puprime.html.gz
```

L'elenco completo degli strumenti e delle schede sta in
`docs/indice.md`.
