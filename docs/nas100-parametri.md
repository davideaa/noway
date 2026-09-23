# NAS100 Session-Open Momentum v2.57 — i parametri, al sicuro

Questa scheda esiste per un motivo solo: **non perdere la configurazione
che ha prodotto i backtest.** MT5 sovrascrive il set di input quando si
ottimizza, e una volta persa non si ricostruisce.

| File | A cosa serve |
|---|---|
| `mt5/NAS100_SessionOpenMomentum_v2_57.mq5` | il sorgente |
| `mt5/NAS100_v2_57_valori.set` | **il file di sicurezza**: solo i valori scelti, ottimizzazione spenta |
| `mt5/NAS100_v2_57_plateau.set` | stessi valori, con inizio/passo/interrompi gia' compilati |

Si caricano da *Strategy Tester → scheda Input → Load*.

Formato di ogni riga:
`nome = valore || inizio || passo || interrompi || ottimizza`

**Verificato:** tutti e 41 i parametri del sorgente coincidono con quelli
scritti nei report MT5. Nel tester non e' stato cambiato niente, quindi i
default del codice SONO la configurazione testata.

## I risultati che questa configurazione ha prodotto

| | PUPrime `NAS100.s` | Fusion `NAS100` |
|---|---:|---:|
| Periodo | 2019.01.02 → 2026.09.15 | 2020.11.16 → 2026.09.15 |
| Qualita' storico | 99% | 70% |
| Operazioni | 1.626 | 1.158 |
| Rendimento composto | +978,7% | +457,4% |
| Profit factor | 1,343 | 1,325 |
| Drawdown relativo | 19,67% | 20,63% |

> **Attenzione al drawdown.** Il riepilogo MT5 in testa dice 7,42% su
> PUPrime: quello e' il calo piu' grande *in denaro*, espresso in
> percentuale del conto nel momento in cui e' successo — e siccome il
> conto era gia' cresciuto, sembra piccolo. Il numero vero e' il
> **Drawdown Relativo: 19,67%**.

Fusion non ha dati sul Nasdaq prima di novembre 2020 e ha buchi nel 2021:
**il confronto fra i due broker si fa dal 2022 in poi**, dove entrambi
hanno dati veri. Li' fanno 981 e 982 operazioni, +358,8% e +349,4%.

## La strategia in quattro righe

Un colpo solo al giorno, sulla **prima candela M5 dopo l'apertura di New
York**. Se chiude sopra la EMA12 va long, se chiude sotto va short. Due
filtri sulla candela: corpo/escursione ≥ 0,075 e distanza dalla EMA12
≥ 0,05 ATR. Stop a **8 ATR**, nessun target: dopo +0,5R resta dentro
finche' una chiusura M5 non incrocia la **EMA120** (dieci ore di media).

Pochi trade enormi non sono un difetto: sono il meccanismo. La coda e'
stabile — i 5 trade migliori fanno fra il 15% e il 24% del guadagno in
ogni anno, su entrambi i broker.

## Le griglie del test del plateau, dichiarate prima

Gia' compilate in `NAS100_v2_57_plateau.set`. **Si accende una casella
per volta**: con piu' caselle accese MT5 prova tutte le combinazioni fra
loro, che sono milioni.

| Parametro | Valore | Inizio | Passo | Interrompi | Passate |
|---|---:|---:|---:|---:|---:|
| `FixedMinBodyToRange` | 0,075 | 0,0 | 0,025 | 0,30 | 13 |
| `FixedMinEMADistanceATR` | 0,05 | 0,0 | 0,025 | 0,30 | 13 |
| `ATRStopMultiplier` | 8,0 | 3,0 | 1,0 | 14,0 | 12 |
| `SlowEMAPeriod` | 120 | 40 | 20 | 240 | 11 |
| `FastEMAPeriod` | 12 | 6 | 3 | 30 | 9 |
| `TrailActivationR` | 0,50 | 0,0 | 0,25 | 2,0 | 9 |
| `ATRPeriod` | 16 | 8 | 4 | 32 | 7 |

Poi la griglia a due dimensioni sui due filtri insieme (13 × 13 = 169
passate), perche' due filtri tarati in coppia possono formare una cresta
che le prove singole non vedono.

I due filtri sono i primi indiziati: il commento nel sorgente dice
«Fixed best Mode 3 filter from the v2.30 diagnostic», e 0,075 non e' un
numero che si sceglie a caso.

## I criteri, dichiarati prima di vedere i risultati

Per ogni parametro, cinque controlli. **Ne basta uno fallito perche' sia
un picco e non un plateau.**

1. Il valore scelto **non deve essere il migliore** della fascia.
2. I due vicini immediati devono rendere **almeno il 70%** di quello scelto.
3. Almeno il **70% della fascia** deve essere in utile.
4. **Nessun burrone**: nessun passo singolo che dimezzi il risultato.
5. L'ottimo **non deve stare sul bordo**: se ci sta, la griglia era
   sbagliata e va estesa. Nel progetto oro e' successo tre volte, e tutte
   e tre volte ha cambiato la conclusione.

Sesto controllo, sul numero di operazioni: dentro il plateau le
configurazioni devono restare entro il **±30%** delle operazioni di
quella scelta. Una configurazione che fa 300 trade invece di 980 non e'
la stessa strategia con un parametro diverso: e' un'altra strategia, e
confrontarne il profitto non significa niente.

## Due avvertenze operative

**`BrokerTimeMode = BROKER_PUPRIME`** anche nella passata su Fusion. E'
un'ipotesi sull'orario del server di Fusion. Il fatto che i due broker
diano 981 e 982 operazioni e' la prova che l'ipotesi regge — se l'orario
fosse sbagliato, la candela dell'apertura di New York sarebbe un'altra e
i risultati divergerebbero. Da riverificare prima del live: un broker
puo' cambiare l'orario del server.

**`UseAdaptiveRisk = true`**, con moltiplicatore da 0,5 a 2,0 su un
`RiskPercent` di 1,5. Il rischio vero per operazione sta quindi fra
0,75% e 3,00%, e dal report non si puo' sapere quale sia stato su ogni
trade: questo impedisce di misurare in multipli di R, che e' il metro
del resto del progetto. La perdita peggiore misurata e' −2,95%, che
conferma il moltiplicatore che arriva a 2.

## I file pronti per l'ottimizzazione

In `mt5/plateau/`. Hanno le caselle **gia' spuntate**: si caricano da
*Strategy Tester → Input → Load*, si controlla che il numero di passate
in basso coincida, e si preme Start. Nessun clic sulle caselle.

**Piano A — preciso, 6 passate, 217 combinazioni in tutto**

| File | Caselle accese | Passate attese |
|---|---|---:|
| `A1_FastEMAPeriod.set` | 1 | **9** |
| `A2_SlowEMAPeriod.set` | 1 | **11** |
| `A3_ATRPeriod.set` | 1 | **7** |
| `A4_ATRStopMultiplier.set` | 1 | **12** |
| `A5_TrailActivationR.set` | 1 | **9** |
| `A6_filtri_2D.set` | 2 | **169** |

**Piano B — comodo, 2 passate, 412 combinazioni in tutto**

| File | Caselle accese | Passate attese |
|---|---|---:|
| `A6_filtri_2D.set` | 2 | **169** |
| `B2_altri_cinque.set` | 5 | **243** |

Il piano B accende cinque caselle insieme, quindi MT5 le moltiplica: e'
voluto, ma proprio per questo ogni parametro ha solo **3 valori**
(scelto, uno sotto, uno sopra) invece dell'intera fascia. Verifica i
vicini immediati e le interazioni fra parametri, ma NON vede i bordi
della fascia: il criterio 5 (l'ottimo non deve stare sul bordo) con il
piano B non si puo' controllare.

Se un parametro del piano B risulta sospetto, si rilancia solo quello
col file A corrispondente.

**Dopo ogni passata: tasto destro sui risultati → Esporta in XML.** MT5
sovrascrive la scheda Ottimizzazione al lancio successivo.
