# COPY — sito vetrina del portafoglio di strategie su XAUUSD

Versione italiana (fase 1). Inglese proposto in fondo (fase 2).
Ultimo aggiornamento: 29 settembre 2026.

## Come leggere questo file

- Il testo pubblico è quello fuori dalle citazioni. Le righe `> Fonte:` sono note interne per chi controlla: **non vanno pubblicate**.
- Tutti i numeri vengono da `docs/` e da `CLAUDE.md` del progetto (quando serve, il file è indicato). Nessun numero è stato ricalcolato o inventato.
- `[DA COMPLETARE]` = dato che nei file non c'è. Va compilato da Davide oppure il blocco resta fuori dal sito.
- Non compaiono numeri, nome o confronti del prodotto commerciale da cui il lavoro è partito.
- Tutti i risultati sono backtest. Nessun risultato reale (live) risulta nei file.
- Brand e persona: nei file non c'è un nome pubblico del progetto. Nel testo si usa il nome provvisorio **Portfolio Algo Manager**, ricavato dall'email. Va confermato o cambiato. La voce è impersonale ("è stato scartato"), senza "io" e senza "noi", così regge qualunque scelta.

---

## 1. Tono di voce

**Come parla il sito:** tecnico, sobrio, onesto. Come un quaderno di laboratorio ben tenuto, non come una brochure.

- Frasi brevi. Un'idea per frase. I numeri con la loro unità (R, %, operazioni) e con il contesto (backtest, periodo).
- I numeri brutti stanno accanto a quelli buoni, con lo stesso peso visivo.
- Ogni termine tecnico si spiega la prima volta, in una riga (vedi Glossario).
- Si dice cosa è stato misurato e cosa no. "Non lo sappiamo ancora" è una frase ammessa.

**Da usare:** misurato, dichiarato prima, fuori campione, plateau, scartato, backtest, "non è dimostrato", "probabilmente reale, non certamente reale".

**Da evitare:** rendimenti garantiti o attesi, "batte il mercato", "guadagni", "investi", "soluzioni innovative", "a 360 gradi", "intelligenza artificiale", esclamazioni, maiuscole d'enfasi, superlativi, urgenza ("solo oggi", "posti limitati"), confronti con prodotti altrui, qualunque percentuale annua senza la scritta "backtest".

---

## 2. SEO tecnico (pagina unica)

| Elemento | Proposta |
|---|---|
| **title** (58 caratteri) | `Strategie algoritmiche sull'oro (XAUUSD): metodo e rischio` |
| Alternativa con marchio (57) | `Portfolio Algo Manager | Strategie algoritmiche su XAUUSD` |
| **meta description** (147) | `Strategie trend following su XAUUSD con criteri fissati prima del test, fuori campione, scarti e drawdown vero. Sono backtest, non risultati reali.` |
| **h1** (uno solo) | `Strategie algoritmiche sull'oro, misurate e raccontate senza ritocchi` |
| Lingua | `<html lang="it">` |
| URL | pagina unica `/`; ancore leggibili `#metodo`, `#strategie`, `#scartate`, `#rischio`, `#monitoraggio`, `#contatti`, `#avviso`. Fase 2: `/en/` con `hreflang` reciproco |
| Open Graph / social | titolo: come il title. Descrizione: come la meta description. Immagine: `[DA COMPLETARE]` (vedi alt più sotto) |
| Gerarchia | `h1` (hero) > `h2` per ogni sezione > `h3` per strategie, principi, voci scartate |

> Note SEO: il sito non ha un obiettivo commerciale dichiarato, quindi non si spingono parole chiave da "segnali di trading" o "gestione del capitale": sarebbero promesse che la pagina non fa. Le parole chiave naturali sono già nel testo: strategie algoritmiche, trend following, XAUUSD, backtest, drawdown, fuori campione.

### Dati strutturati JSON-LD (proposta minima)

Si usa solo `WebSite` e `WebPage`. **Non** si usa `FinancialService`, `InvestmentFund` o simili: descriverebbero un servizio finanziario che il sito non dichiara di offrire (e potrebbe avere conseguenze regolatorie: da valutare con Davide).

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "[DA COMPLETARE: URL]/#website",
      "url": "[DA COMPLETARE: URL]",
      "name": "Portfolio Algo Manager",
      "inLanguage": "it"
    },
    {
      "@type": "WebPage",
      "@id": "[DA COMPLETARE: URL]/#pagina",
      "url": "[DA COMPLETARE: URL]",
      "name": "Strategie algoritmiche sull'oro (XAUUSD): metodo e rischio",
      "description": "Strategie trend following su XAUUSD con criteri fissati prima del test, fuori campione, scarti e drawdown vero. Sono backtest, non risultati reali.",
      "isPartOf": { "@id": "[DA COMPLETARE: URL]/#website" },
      "inLanguage": "it"
    }
  ]
}
```

### `robots.txt` e `sitemap.xml`

```
User-agent: *
Allow: /
Sitemap: [DA COMPLETARE: URL]/sitemap.xml
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>[DA COMPLETARE: URL]/</loc></url>
  <!-- fase 2: <url><loc>[DA COMPLETARE: URL]/en/</loc></url> -->
</urlset>
```

---

## 3. Testi sezione per sezione

### Navigazione e barra fissa

Voci: `Metodo` · `Strategie` · `Rischio` · `Monitoraggio` · `Contatti`
Pulsante in barra: `Scrivi via email`

**Barra fissa in fondo allo schermo (sempre visibile, con link a #avviso):**
> Backtest su dati storici, non risultati reali. Trading ad alto rischio. Non è consulenza finanziaria. [Leggi l'avviso completo](#avviso)

---

### 3.1 Hero

**Etichetta sopra il titolo:** `XAUUSD · TREND FOLLOWING · BACKTEST 2019–2026`

**h1:** Strategie algoritmiche sull'oro, misurate e raccontate senza ritocchi

**Sottotitolo:**
Un portafoglio di sistemi automatici sull'oro (XAUUSD). Ogni criterio è dichiarato prima del test. Ogni numero scomodo resta sul tavolo. E i risultati sono di backtest: non sono risultati reali.

**Pulsante principale:** `Vedi come si misura`  (ancora `#metodo`)
**Pulsante secondario:** `Scrivi via email`  (mailto, vedi microcopy)

**Fascia di numeri sotto il titolo** (ogni cifra con la sua etichetta; tutte da backtest su XAUUSD.p, periodo 2019.01–2026.09):

| Cifra | Etichetta |
|---|---|
| 2 | strategie trend following: ROTTURA (M30) e RITRACCIAMENTO (H4) |
| 1.122 | operazioni simulate in 7,7 anni |
| 42,3% | operazioni chiuse in utile: si perde più spesso di quanto si vinca |
| 3× | costi attuali: oltre questa soglia il sistema non regge |
| [DA COMPLETARE] | mesi di risultati in tempo reale |

> Fonte: `docs/CONTINUA-QUI.md` sez. 2 (7,7 anni, 1.122 operazioni, 42,3% vincenti su `.p`; "il sistema muore a 3 volte i costi attuali"). Il dato sui risultati live non esiste nei file: se non ce ne sono, scrivere "Nessuno. Demo in corso/da iniziare" solo dopo conferma di Davide.

**Riga di avviso sotto i pulsanti (piccola ma leggibile):**
I risultati sono simulazioni su dati storici. I risultati passati non garantiscono quelli futuri.

---

### 3.2 Il metodo

**h2:** Si decide prima, si misura dopo

**Introduzione:**
Un backtest è facile da far uscire bene: basta provare abbastanza configurazioni e tenere la migliore. Per questo il lavoro segue tre regole. Non sono decorazione: sono il motivo per cui i numeri di questa pagina si possono discutere.

**h3:** 1. I criteri si scrivono prima del test

Prima di ogni prova si annota cosa deve succedere perché sia considerata riuscita: guadagno medio minimo, profit factor minimo, perdita massima ammessa. Poi si guarda il risultato. Se è scomodo, si rispetta lo stesso.

*Un esempio scomodo.* Per la strategia di ritracciamento erano stati fissati tre criteri: almeno 150 operazioni, profit factor almeno 1,20, t-statistica almeno 3,4. Su 192 configurazioni provate, **nessuna** li ha centrati tutti e tre. La migliore arrivava a una t di 1,61. La strategia è stata bocciata.

Poi è stata riaperta, e va detto come: la griglia di parametri aveva l'ottimo sul bordo, quindi non aveva provato la zona giusta. Prima dell'estensione è stata scritta una regola di arresto ("se la t resta sotto 2,5, la strategia è chiusa"). Dopo l'estensione la t è salita a 2,61. Resta sotto la soglia iniziale di 3,4: la strategia è dentro il portafoglio come candidata credibile, non come caso chiuso.

> Fonte: `docs/pullback-h4-verdetto.md` (192 configurazioni, criteri ≥150 trade / PF ≥1,20 / t ≥3,4, zero centrate, miglior t 1,61, regola di arresto 2,5); `docs/CONTINUA-QUI.md` sez. 4 punto 8 (t da 1,61 a 2,61); `CLAUDE.md` (GoldTrendPullback bocciato da solo t 1,61, promosso dopo l'estensione t 2,61). Attenzione: le t calcolate prima della misura della deviazione standard vera (1,45 R invece di 1,26 R) sono ottimistiche di circa il 15% (`CLAUDE.md`). Non è chiaro dai file se il 2,61 sia già stato rifatto con 1,45: da confermare (punto 8 della lista finale).

**h3:** 2. Il fuori campione si usa una volta sola

Una parte dei dati (2024.01–2026.09) è rimasta chiusa durante tutta la costruzione. È stata aperta **una volta sola**, con i criteri già scritti, senza ottimizzare niente.

| Criterio (dichiarato prima) | Soglia | Ottenuto | Esito |
|---|---:|---:|---|
| Guadagno medio per operazione | ≥ +0,050 R | +0,2554 R | passa |
| Profit factor | ≥ 1,10 | 1,526 | passa |
| Perdita massima (a rischio 0,60%) | ≤ 27,4% | 8,26% | passa |

Tre criteri su tre. Ma ci sono quattro cose da leggere insieme a questa tabella.

1. **Va meglio fuori che dentro, e non è una buona notizia.** Nel periodo di costruzione (2019–2023) il guadagno medio è +0,1219 R con profit factor 1,23. Fuori campione è +0,2554 R con profit factor 1,53. Il 2024–2026 è stato un periodo eccezionale per l'oro: il numero da usare per il futuro è il più basso dei due, non il più alto.
2. **Quel fuori campione è già stato speso.** Non c'è più nessun dato mai visto. Provare altre configurazioni sugli stessi anni peggiora la statistica invece di migliorarla. In totale sono state provate 272 configurazioni.
3. **Una scelta è stata fatta dopo aver guardato.** Una terza strategia (vedi "Cosa è stato scartato") è stata tolta dopo aver visto il fuori campione. Di solito questo invalida il test. Per questo esistono due numeri, tenuti separati:

| Simulazione a rischio 1,05%, fuori campione | Annuo (backtest) | Come leggerlo |
|---|---:|---|
| Portafoglio a tre gambe | 22% | pulito: nessuna scelta fatta guardandolo |
| Portafoglio a due gambe (quello attuale) | 47% | contaminato dalla scelta a posteriori |

   Il valore vero sta in mezzo, più vicino al primo. Si decide con dati nuovi, non rianalizzando questi. Sono percentuali di simulazione, non un obiettivo.
4. **Il fuori campione, da solo, non dimostra niente.** Il valore di quel test sta nell'essere stato una prova sola, dichiarata prima.

> Fonte: `docs/CONTINUA-QUI.md` sez. 2 (criteri, soglie, ottenuto, 709 / 413 operazioni, +0,1219 / +0,2554, PF 1,23 / 1,53; "il numero da usare per il futuro è il più basso dei due") e sez. 5 (22% / 47%, "il valore vero sta in mezzo, più vicino al primo"); `CLAUDE.md` (regola 2, 272 configurazioni). Le soglie 0,050 / 1,10 / 27,4% sono le stesse dichiarate prima del test a tre gambe (`docs/fuori-campione.md`); la versione a due gambe è stata scelta dopo. Il punto 4 riprende `docs/fuori-campione.md` ("la t del solo fuori campione è 1,39"), riferito al test a tre gambe.

**Riquadro "Lo stesso test, a tre gambe" (dettaglio apribile):**
Sulla versione a tre gambe, unica con la verifica fuori campione non contaminata: 891 operazioni, guadagno medio +0,0618 R (soglia +0,050), profit factor 1,123 (soglia 1,10), perdita massima 10,85% (soglia 27,4%). Passa tutti e tre i criteri, ma di poco sul guadagno medio. Il risultato è arrivato al 24° percentile di quanto simulato: sotto la mediana, dentro la parte centrale. La t del solo fuori campione è 1,39. Il guadagno medio in campione era +0,0953 R: l'edge si è ridotto di circa un terzo, come ci si aspetta da parametri scelti guardando il primo periodo.

> Fonte: `docs/fuori-campione.md` (tabelle "I criteri", "Confronto diretto", "Il fuori campione era dentro le attese?").

**h3:** 3. Si cerca un plateau, non un picco

Se un valore rende e i suoi vicini no, è fortuna. Per ogni parametro si guarda la collina intorno al valore scelto, non il punto più alto.

- **ROTTURA:** posizione nel range 0,91 con plateau 0,91–0,93; trailing con plateau fra 3 e 6 ATR.
- **RITRACCIAMENTO:** media mobile a 30 periodi, collina fra 30 e 40.
- **Il caso opposto:** nella prima prova del ritracciamento il profitto mediano rispetto alla media mobile faceva così: 567 (periodo 30), −68 (60), 176 (90), 643 (120). Un buco in mezzo a due picchi è la firma del rumore, non di una struttura.
- **Se l'ottimo sta sul bordo, la griglia era sbagliata.** È successo tre volte. Tutte e tre le volte, estenderla ha cambiato la conclusione.
- **Meglio del secondo miglior valore, non del migliore.** Nel ritracciamento l'ottimizzazione voleva il margine di sicurezza dello stop a 0,05 ATR. È stato fissato a 0,10, apposta: 0,05 ATR sull'oro valgono poco più dello spread, e uno stop appoggiato esattamente sul minimo è dove il mercato va a prendere gli stop. Costa circa il 16% del profitto di backtest. Non si riabbassa.

> Fonte: `docs/CONTINUA-QUI.md` sez. 1 (parametri, plateau, collina 30–40, avvertenza sul buffer 0,10 / costo 16%) e sez. 4 punto 8; `docs/pullback-h4-verdetto.md` (tabella EMA 30/60/90/120: 567 / −68 / 176 / 643); `CLAUDE.md` regola 3 ("è successo tre volte, e tre volte ha cambiato la conclusione").

**h3:** Gli errori, dichiarati

Sono stati commessi errori e sono scritti. Correggerli ha prodotto i risultati migliori.

- Il trailing (l'uscita che insegue il prezzo) era uguale allo stop e tagliava i vincitori. Allargato, una delle strategie originali è passata da 6 a 98 punti R.
- Le chiusure ereditavano l'etichetta sbagliata: il riepilogo per strategia era falso, anche se il profitto totale no.
- La deviazione standard usata come stima (1,26 R) era più bassa di quella misurata (1,45 R). Le t calcolate prima vanno abbassate del 15% circa.
- Una strategia (EMA cross) era stata scartata per un motivo sbagliato. Vedi sotto.

> Fonte: `docs/CONTINUA-QUI.md` sez. 4 (errori 1, 2, 3, 5). L'elenco completo con altri quattro errori è lì.

**Chiusura della sezione (link):** `Guarda cosa è stato scartato` (ancora `#scartate`)

---

### 3.3 Le strategie

**h2:** Due strategie, due orizzonti

**Introduzione:**
Sono entrambe trend following: entrano quando il prezzo si muove in una direzione e ci restano finché il movimento regge. Non hanno un obiettivo di guadagno fisso (nessun take profit): un'uscita a obiettivo fisso è stata provata e peggiorava ogni configurazione. Quando il prezzo va bene, un'uscita che lo insegue (il trailing) lo lascia correre.

Non si vince spesso: circa 42 operazioni su 100 chiudono in utile. Il conto torna perché le vincenti, lasciate correre, pesano più delle perdenti.

**h3:** ROTTURA · grafico M30

Il prezzo chiude oltre il massimo (o sotto il minimo) delle ultime 60 barre da 30 minuti ed è già al bordo del proprio intervallo delle ultime 480 barre. Entra nella direzione dello sfondamento.

- Stop iniziale: 2,0 ATR (l'ATR è l'ampiezza media dei movimenti recenti).
- Nessun take profit.
- Trailing a 4,0 ATR, attivato quando l'operazione è a +1R.

**h3:** RITRACCIAMENTO · grafico H4

Il trend è stabilito (prezzo sopra la media mobile a 30 periodi, con la media inclinata). Il prezzo ritraccia di almeno 1 ATR dal massimo delle ultime 20 barre, poi riparte chiudendo sopra il massimo della barra precedente.

- Stop sotto il minimo del ritracciamento, più un margine di 0,10 ATR.
- Nessun take profit.
- Trailing a 1,5 ATR, attivato a +1R. Attesa di 3 barre dopo un ingresso.

**Tabella dei numeri (backtest, 2019.01–2026.09, tick reali, ritardo 103 ms):**

| | Operazioni | Vincenti | Profit factor |
|---|---:|---:|---:|
| ROTTURA, conto `.p` | 567 | 37,0% | 1,40 |
| ROTTURA, conto `.s` | 572 | 36,5% | 1,35 |
| RITRACCIAMENTO, conto `.p` | 555 | 47,7% | 1,25 |
| RITRACCIAMENTO, conto `.s` | 551 | 47,7% | 1,22 |
| **Insieme, conto `.p`** | **1.122** | **42,3%** | **1,33** |
| **Insieme, conto `.s`** | **1.123** | **42,0%** | **1,30** |

Guadagno medio per operazione: +0,1710 R su `.p`, +0,1494 R su `.s`. Totale: 191,9 R su `.p`, 167,7 R su `.s`.

**Come leggere `.p` e `.s`:** sono due tipi di conto dello stesso broker (demo), con lo stesso oro ma costi diversi. Su `.p` le commissioni sono 7,03 $ a lotto; su `.s` sono zero, perché tutto è nello spread. Lo spread più largo di `.s` costa il 13% del vantaggio. Non è una prova indipendente (stesso broker, stesso sottostante), ma mostra che il risultato non dipende da un solo listino.

> Fonte: `docs/CONTINUA-QUI.md` sez. 1 (regole, parametri) e sez. 2 (totali .p / .s, R per operazione, commissioni, swap); `docs/v1xau-verifica.md` (gambe separate: 567/37,0%/1,40; 572/36,5%/1,35; 555/47,7%/1,25; 551/47,7%/1,22; "13% del vantaggio"). Nota: la tabella per gamba su `.p` è etichettata "Previsto (.p)" in `v1xau-verifica.md` (il previsto veniva dal run su `.p`): da confermare che siano numeri di run, non di stima. Nota: `v1xau-verifica.md` cita anche PF 1,36 su `.s` in un test con composto; nel sito si usa 1,30 (lotto fisso, `CONTINUA-QUI.md`).

**Cosa dice il mercato: quando funziona e quando no** (h3)

Il nemico non è la direzione: è l'immobilità. Nei mesi in cui l'oro sta fermo (±0,5%), le strategie perdono. Guadagnano anche quando l'oro scende: a produrre sono soprattutto le operazioni al ribasso.

| Cosa fa l'oro nel mese | Mesi | R al mese |
|---|---:|---:|
| Forte discesa (oltre −3%) | 8 | +2,15 |
| Discesa lenta (da −3% a −0,5%) | 23 | +1,57 |
| **Fermo (±0,5%)** | **14** | **−1,54** |
| Salita lenta (da 0,5% a 3%) | 17 | +0,88 |
| Forte salita (oltre 3%) | 30 | +4,88 |

Due anni su sette, 2022 e 2024, il sistema ha lavorato a vuoto: 675 operazioni per il 9% del risultato. Chi lo guarda deve essere pronto a vederlo pareggiare per un anno intero.

> Fonte: `docs/CONTINUA-QUI.md` sez. 2 ("Quando funziona e quando no") e sez. 6 (2022 e 2024, 675 operazioni per il 9%). Nota: i dati 2022/2024 di `docs/risultato-finale.md` riguardano il portafoglio a tre gambe; CONTINUA-QUI li cita in generale. Da confermare che valgano anche per le due gambe (punto 11 della lista finale).

**h3 (sotto-sezione):** Su quali strumenti

Il lavoro documentato in questa pagina riguarda **solo l'oro (XAUUSD)**.

Altri strumenti: `[DA COMPLETARE: nome dello strumento (es. Nasdaq, USDJPY), stato (in ricerca / in test / non attivo) e dati misurati]`. Finché non ci sono numeri misurati e verificati, per questi strumenti non compare nessun risultato.

> Nota per Davide: Nasdaq e USDJPY non compaiono in nessun file del progetto (cercati in `docs/` e `CLAUDE.md`). Nessun testo su di loro è stato scritto.

---

### 3.4 Cosa è stato scartato

**h2 (id `scartate`):** Le idee che non hanno funzionato

**Introduzione:**
Per ogni idea entrata nel portafoglio ce n'è una uscita. Il motivo è misurato, e mostrarlo è parte del metodo: chi conosce solo i successi non può giudicare la selezione.

**Scheda 1 · Range mean reversion** (comprare il bordo basso di un canale che si stringe)
Bocciata. Su 174 configurazioni con almeno 100 operazioni, **zero** in utile. Più operava, più perdeva, con un ordine perfetto. L'ipotesi era invertita: la compressione della volatilità non precede il ritorno al centro, precede la rottura. Non c'è un parametro da aggiustare: la regola era sbagliata.

**Scheda 2 · Fade del breakout fallito** (la "TRAPPOLA": vendere le rotture al rialzo che falliscono)
+50 R nel periodo di costruzione, **−44,9 R fuori campione**. Vende le rotture fallite su un oro che triplica. È stata tolta *dopo* aver visto il fuori campione: è il punto aperto del lavoro, e per questo i risultati hanno due numeri (vedi "Il metodo"). Si decide con dati nuovi, in tempo reale.

**Scheda 3 · Time-series momentum**
Il peso è stato ridotto in tre passi, da 1,0 a 0,5 a 0. Il rapporto profitto/rischio è salito ogni volta: 6,36, 6,56, 6,63. Se togliendola il portafoglio migliora, esce.

**Scheda 4 · EMA cross**
Scartata, ma con un motivo sbagliato all'inizio: il profit factor misura la qualità della singola operazione, non quanto una strategia porta al portafoglio. Quella gamba valeva circa 90 punti R. La decisione forse è ancora giusta (a drawdown uguale il portafoglio senza di lei è migliore), ma il motivo dichiarato non lo era.

**Scheda 5 · Rischio adattivo**
Misurato peggiore. Tenuto spento.

**Scheda 6 · Take profit fisso a 2,5R**
Peggiorava tutte le configurazioni testate di una delle strategie. Il migliore trade è passato da 159 $ a 1.795 $ togliendolo.

**Scelta di progetto (non un risultato):** nessun filtro su ore o giorni della settimana.

> Fonte: `docs/range-mr-verdetto.md` (174 su 174; 432 configurazioni totali; ipotesi invertita); `docs/CONTINUA-QUI.md` sez. 3 e sez. 5 (TRAPPOLA +50 R / −44,9 R; TSMOM 6,36→6,56→6,63; Adaptive Risk; filtri esclusi da Davide) e sez. 4 punto 3 (EMA cross ~90 punti R); `docs/parametri-finali.md` (take profit: "tutte e quindici le configurazioni testate di S3 battono le corrispondenti con target"; miglior trade da 159 a 1.795 $). Nota: "159 → 1.795 $" è riferito alla strategia Donchian con i parametri di allora: se si vuole tenere la scheda 6, va ricontrollato che il valore sia ancora attuale (punto 13 della lista finale).

**Chiusura della sezione:**
Quello che non si è ancora fatto: il confronto con ingressi casuali (per sapere se gli ingressi portano informazione o se il merito è tutto dell'uscita) esiste come programma ma non è mai stato eseguito. Il risultato è aperto.

> Fonte: `docs/CONTINUA-QUI.md` sez. 3 ("Mai eseguiti... `GoldRandomNull.mq5`"); `CLAUDE.md` ("mai eseguito"); `docs/piano-validazione.md` (motivazione del test).

---

### 3.5 Il rischio

**h2:** Il rischio vero, non quello del backtest

**Introduzione:**
Il drawdown è la perdita massima dal picco più alto del conto. Un backtest ne mostra uno solo: quello di un solo ordine possibile delle operazioni. In un altro ordine il drawdown sarebbe diverso, e le perdite arrivano in serie.

Per questo il drawdown si stima con un bootstrap a blocchi da 20: le operazioni vengono rimescolate a blocchi di 20 consecutive, così le serie di perdite restano intere. Si ripete migliaia di volte e si guarda la distribuzione, non il caso fortunato.

**Tabella (simulazione bootstrap a blocchi, XAUUSD.p):**

| Rischio per operazione | Drawdown: 90% degli scenari sotto | 99° percentile |
|---:|---:|---:|
| 0,70% (impostazione di partenza dell'EA) | 26% | 35% |
| 1,05% | 35% | 49% |

Lettura: più rischio per operazione, più drawdown. Da 0,70% a 1,05% il 90° percentile passa dal 26% al 35%. Il rischio per operazione è una scelta di chi opera, non una proprietà del sistema.

Un riscontro: su `.s` a 0,70%, il drawdown vero del backtest (18,20%) è caduto esattamente sulla mediana simulata (18,2%). Nessun percorso fortunato.

> Fonte: `docs/CONTINUA-QUI.md` sez. 1 (tabella "Rischio": 0,70% → 26% / 35%; 1,05% su `.p` → 35% / 49%); `docs/v1xau-verifica.md` (18,20% del backtest, mediana 18,2%; su `.s` il tetto del 35% al 90° cade a 0,98%); `CLAUDE.md` (bootstrap a blocchi da 20, `tools/montecarlo.py`). Il tetto "35% al 90° percentile" è un criterio personale di Davide: non si presenta come raccomandazione ai visitatori.

**h3:** Cosa può andare storto

- **Costi.** Lo swap (il costo di tenere aperta la posizione) è il costo maggiore, cinque volte le commissioni: −85 $ a lotto sulle operazioni long, +45 $ sulle short. È già compreso nei numeri. Il sistema smette di funzionare a 3 volte i costi attuali.
- **Anni e mesi fermi.** Vedi sopra: 14 mesi con oro fermo in perdita, e anni interi a pareggiare.
- **Un solo regime.** Sette anni sono un campione ampio di operazioni, non di regimi di mercato. Come sarebbe andata nell'oro degli anni 2011–2018 non è verificabile.
- **Esecuzione reale.** Spread e slittamenti veri possono essere peggiori di quelli simulati. Nessun backtest lo può dire.
- **Statistica.** Il portafoglio è probabilmente reale, non certamente reale. La t è sotto la soglia inizialmente richiesta, e sono state provate 272 configurazioni.

> Fonte: `docs/CONTINUA-QUI.md` sez. 2 (swap −85 / +45, "cinque volte le commissioni", "muore a 3 volte"), sez. 6 (esecuzione), `CLAUDE.md` regola 2 (272); `docs/piano-validazione.md` ("sette anni sono un campione ampio di trade, non di regimi"; 2011–2018 non verificabile: documento più vecchio, ma l'affermazione non è smentita altrove); `docs/portafoglio-tre-gambe.md` ("probabilmente reale, non certamente reale", riferito al portafoglio a tre gambe con t 2,69).

---

### 3.6 Come si monitora

**h2 (id `monitoraggio`):** Prima di fidarsi, si guarda in tempo reale

**Introduzione:**
Nessun backtest può rispondere a due domande. Gli spread e gli slittamenti veri assomigliano a quelli simulati? E si riesce a guardare il sistema fermo per mesi, senza spegnerlo? Per questo il passo successivo non è un altro test sugli stessi anni: è un conto demo in tempo reale, con parametri congelati, per tre-sei mesi.

**h3:** Cosa si controlla

1. **I costi veri contro quelli del modello.** Prima di aprire un conto reale, swap e spread reali si confrontano con quelli della simulazione. Se sono peggiori, il sistema non farà quello che ha fatto nel backtest, e lo si sa prima.
2. **Il risultato contro la banda simulata.** Il risultato reale si mette dentro la distribuzione del bootstrap: in quale percentile cade? Così è stato fatto anche sul fuori campione (24° percentile).
3. **La strategia scartata.** La TRAPPOLA si decide sul demo: è dato nuovo.
4. **Il numero di operazioni.** Con poche operazioni, un risultato anche lontano dallo storico resta statisticamente compatibile con esso. Una serie negativa corta non invalida il sistema.

**h3:** Cosa si pubblica

`[DA COMPLETARE: cosa mostrerà la pagina e con che cadenza (es. report mensile del demo, contatore di operazioni, curva reale, confronto con la banda simulata). Stato del demo: non iniziato / in corso dal [data].]`

Regola per la pagina: quando compaiono i primi risultati reali, sono mostrati accanto a quelli simulati, con lo stesso formato, e senza togliere i mesi brutti.

> Fonte: `docs/CONTINUA-QUI.md` sez. 6 (demo 3-6 mesi, due domande, confronto swap/spread, la TRAPPOLA si decide lì); `docs/fuori-campione.md` (24° percentile); `docs/piano-validazione.md` (~100 operazioni, non si invalida per una serie negativa corta; le cifre lì usano la deviazione standard 1,26 R, quindi non sono riportate). La cadenza di pubblicazione non è nei file. La regola per la pagina è una proposta di copy, non un fatto.

---

### 3.7 Contatti

**h2 (id `contatti`):** Scrivi, anche per dire che c'è un errore

**Testo:**
Per domande sul metodo, sui numeri o su come sono stati calcolati, scrivi via email. Se trovi un errore nei conti, scrivi lo stesso: correggere gli errori è il modo in cui questo lavoro è migliorato.

Le risposte hanno carattere informativo sul metodo. Non è consulenza finanziaria, e non si danno indicazioni su cosa comprare o vendere.

**Indirizzo (visibile in chiaro):** PORTFOLIOALGOMANAGER21@gmail.com

**Pulsante:** `Scrivi via email`
**Pulsante secondario:** `Copia l'indirizzo`
**Tempi di risposta:** `[DA COMPLETARE: es. "risposta entro X giorni lavorativi" solo se Davide può mantenerlo]`

> Nota: nei file non è detto se Davide offra un servizio (gestione, segnali, copy trading, consulenza). Il testo sopra non dichiara nessun servizio, di proposito. Se ne offre uno, il testo cambia e cambiano gli obblighi legali: va controllato prima (lista finale, punto 1).

---

### 3.8 Avviso sul rischio

**h2 (id `avviso`):** Avviso sul rischio

**Testo (completo, in pagina, sempre leggibile; nessun testo grigio su grigio):**

- **Il trading comporta un alto rischio di perdita.** Si può perdere una parte o tutto il capitale. Non operare con denaro che non puoi permetterti di perdere.
- **I risultati di questa pagina sono simulazioni (backtest) su dati storici. Non sono risultati reali.** Includono spread, commissioni e swap, ma non possono riprodurre tutto quello che succede su un conto reale: slittamenti, differenze di esecuzione, comportamento di chi opera.
- **I risultati passati non garantiscono quelli futuri.** I parametri sono stati scelti guardando i dati passati: il risultato in quel periodo è gonfiato per costruzione, e il fuori campione è già stato usato.
- **Le strategie possono andare in perdita per un anno intero, e più.** Lo storico stesso contiene due anni praticamente fermi su sette.
- **Questa pagina non è consulenza finanziaria, né una raccomandazione di investimento, né un'offerta o sollecitazione a operare o a investire.** Nessuna informazione qui tiene conto della tua situazione personale. Per decisioni che riguardano il tuo denaro, rivolgiti a un professionista abilitato.
- `[DA COMPLETARE: eventuali diciture obbligatorie nel Paese del titolare del sito. Vanno verificate da Davide con un professionista; questo testo non è un parere legale.]`

**Titolare del sito:** `[DA COMPLETARE: nome o ragione sociale, Paese]`

---

### Footer

Riga 1: `Backtest, non risultati reali. Trading ad alto rischio. Non è consulenza finanziaria.`
Riga 2: `© [DA COMPLETARE: anno e titolare] · PORTFOLIOALGOMANAGER21@gmail.com · Avviso sul rischio`
Riga 3 (se servono): `[DA COMPLETARE: informativa sulla privacy, se il sito usa analisi o cookie; con il solo pulsante email non c'è modulo di raccolta dati]`

---

## 4. Microcopy

Il contatto è un semplice `mailto:`, senza modulo. Non c'è un invio da gestire, quindi gli errori possibili sono pochi. Sono trattati comunque.

### Pulsante email

| Elemento | Testo |
|---|---|
| Etichetta | `Scrivi via email` |
| `aria-label` | `Scrivi via email a PORTFOLIOALGOMANAGER21@gmail.com` |
| Sotto il pulsante | `Si apre il tuo programma di posta. Nessun dato viene raccolto da questa pagina.` |
| Se non si apre il programma di posta | `Non si è aperto il programma di posta? Copia l'indirizzo e scrivi da dove preferisci.` |

**Link:**
```
mailto:PORTFOLIOALGOMANAGER21@gmail.com?subject=Domanda%20sul%20metodo&body=Ciao%2C%0A%0Avorrei%20chiedere%3A%0A%0A
```
Oggetto precompilato: `Domanda sul metodo`. Corpo: "Ciao, vorrei chiedere:" (l'utente lo modifica). Se si preferisce un contatto senza testo precompilato, usare il solo `mailto:` con l'indirizzo.

### Copia indirizzo

| Stato | Testo |
|---|---|
| Pulsante | `Copia l'indirizzo` |
| Dopo la copia (annuncio per screen reader: `aria-live="polite"`) | `Indirizzo copiato` |
| Se la copia non riesce | `Non è stato possibile copiare. Seleziona l'indirizzo e copialo a mano.` |

### Altri stati

| Situazione | Testo |
|---|---|
| Dato non ancora disponibile (tabella o cifra) | `Non ancora disponibile` (mai un trattino o uno zero al posto del dato) |
| Sezione live senza risultati | `Nessun risultato in tempo reale da mostrare. Il demo non è ancora iniziato.` (solo se confermato) `[DA COMPLETARE]` |
| Link a "avviso" nella barra fissa | `Leggi l'avviso completo` |
| Etichetta su ogni grafico o tabella di risultati | `Backtest · non è un risultato reale` |
| Tooltip su "fuori campione" | `Dati tenuti chiusi durante la costruzione e usati una sola volta per la verifica.` |
| Ritorno in cima | `Torna su` |

### Tabelle scorrevoli su schermo stretto

Sopra ogni tabella larga: `Scorri di lato per vedere tutte le colonne.`

---

## 5. Testi alternativi (proposte)

Non esistono ancora immagini in `assets/`: le proposte vanno adattate a ciò che verrà creato. Regola: ogni grafico con numeri ha un alt che dice cosa mostra **e** la scritta "backtest". Se un'immagine è puramente decorativa, `alt=""`.

| Immagine | Alt proposto |
|---|---|
| Sfondo dell'hero (griglia, linee tecniche) | `alt=""` (decorativa) |
| Schema del metodo (tre passaggi: criteri, fuori campione, plateau) | `Schema in tre passaggi: si scrivono i criteri, si apre il fuori campione una volta sola, si sceglie il valore al centro di un plateau.` |
| Diagramma ROTTURA | `Grafico a candele su 30 minuti: il prezzo chiude sopra il massimo delle ultime 60 barre e l'operazione parte al rialzo, con stop a 2 ATR e trailing a 4 ATR.` |
| Diagramma RITRACCIAMENTO | `Grafico a candele su 4 ore: il prezzo sale, ritraccia di almeno un ATR, poi riparte sopra il massimo della barra precedente; lo stop sta sotto il minimo del ritracciamento.` |
| Grafico dentro e fuori campione | `Grafico a barre, backtest: guadagno medio per operazione nel periodo di costruzione 2019–2023 (+0,1219 R) e nel fuori campione 2024–2026 (+0,2554 R).` |
| Grafico del drawdown simulato | `Distribuzione del drawdown massimo da simulazione a blocchi da 20: a rischio 0,70% il 90% degli scenari sta sotto il 26%; a 1,05% sotto il 35%.` |
| Grafico mesi per movimento dell'oro | `Grafico a barre, backtest: risultato in R al mese secondo il movimento dell'oro; unico segno negativo nei mesi fermi (−1,54 R su 14 mesi).` |
| Icone delle strategie scartate | `alt=""` se accanto c'è il titolo; altrimenti il nome della strategia |
| Immagine per i social (Open Graph) | `Portfolio Algo Manager: strategie algoritmiche su XAUUSD, backtest e rischio dichiarati.` |

Se in futuro compare una curva dei profitti: sempre con la scritta "Backtest" nel grafico stesso (non solo nella didascalia), asse dei tempi visibile, e accanto il drawdown.

---

## 6. Glossario (per il pannello "Parole tecniche")

- **XAUUSD:** il prezzo dell'oro in dollari.
- **Trend following:** seguire il movimento del prezzo invece di scommettere sul suo ritorno.
- **Backtest:** simulazione di una strategia sui dati del passato. Non è un risultato reale.
- **R:** l'unità di misura dei risultati. 1 R è il rischio corso in quell'operazione: se in un'operazione si rischiano 100 €, +2 R vuol dire +200 €. Rende i risultati confrontabili qualunque sia il rischio scelto.
- **ATR:** l'ampiezza media dei movimenti recenti del prezzo. Serve a misurare stop e distanze in modo che si adattino alla volatilità.
- **Trailing:** un'uscita che segue il prezzo e si avvicina quando l'operazione va bene.
- **Profit factor:** guadagni totali diviso perdite totali. Sopra 1 si è in utile.
- **Guadagno medio per operazione:** il risultato medio in R.
- **Drawdown:** la perdita massima dal picco più alto del conto.
- **Bootstrap a blocchi:** simulazione che rimescola le operazioni a blocchi di 20 consecutive, mantenendo le serie di perdite.
- **Fuori campione:** dati tenuti chiusi durante la costruzione e usati una sola volta per verificare.
- **Plateau:** una zona di valori vicini che rende bene tutta, al contrario di un picco isolato.
- **Swap:** il costo (o il ricavo) di tenere una posizione aperta da un giorno all'altro.
- **t-statistica:** misura di quanto un risultato si distingue dal caso. Più è alta, meno è probabile che sia fortuna.

---

## 7. Inglese: proposta per la fase 2

Non è una traduzione letterale: frasi più corte, meno articoli descrittivi, stesso contenuto e stesse cautele. Gli obblighi legali cambiano con il pubblico: la versione inglese va riletta da Davide con un professionista prima della pubblicazione.

**title (60):** `Trend-following strategies on gold (XAUUSD): method and risk`
**meta description (~150):** `Trend-following strategies on XAUUSD: criteria set before testing, out-of-sample results, discarded ideas, real drawdown. Backtests, not live results.`
**h1:** Algorithmic strategies on gold, measured and reported as they are
**Subtitle:** A portfolio of automated systems on gold (XAUUSD). Every criterion is set before the test. Every uncomfortable number stays on the table. All results are backtests, not live results.
**Buttons:** `See how it is measured` · `Send an email`

**Fixed bar:** Backtests on historical data, not live results. Trading is high risk. Not financial advice. Read the full notice.

**Method (h2):** Decide first, measure after
- *Criteria are written before the test.* For each test we note what has to happen for it to count as a pass. Then we look at the result, and we keep to it even when it hurts. Example: the pullback strategy was set to need at least 150 trades, profit factor 1.20 and t-statistic 3.4. Out of 192 configurations, none met all three. The best t was 1.61.
- *The out-of-sample period is used once.* 2024.01 to 2026.09 stayed closed during the whole build. It was opened once, with the criteria already written. All three were met. But it does better than the build period, and that is not good news: 2024 to 2026 was an exceptional stretch for gold. It is also already spent, and one strategy was removed after seeing it. That is why two numbers are shown, not one.
- *A plateau, not a peak.* If one value works and its neighbours do not, it is luck. If the best value sits at the edge of the grid, the grid was wrong. This happened three times, and each time widening it changed the conclusion.

**Strategies (h2):** Two strategies, two time horizons
- *BREAKOUT (M30):* price closes beyond the high or low of the last 60 half-hour bars, at the edge of its 480-bar range. Stop 2.0 ATR, no take profit, trailing stop at 4.0 ATR once the trade is at +1R.
- *PULLBACK (H4):* an established uptrend (price above the 30-period EMA, EMA sloping), a pullback of at least 1 ATR from the 20-bar high, then a close above the previous bar's high. Stop below the pullback low plus 0.10 ATR, no take profit, trailing at 1.5 ATR.
- Backtest, 2019.01 to 2026.09, `.p` account: 1,122 trades, 42.3% winners, profit factor 1.33. More than half of the trades lose. The maths works because the winners are allowed to run.
- The system stops working at 3 times the current costs.

**Discarded (h2):** Ideas that did not work
Range mean reversion: 174 configurations with at least 100 trades, none profitable. Fading failed breakouts: +50 R in the build period, −44.9 R out of sample. Time-series momentum: removing it improved the portfolio. EMA cross: dropped for the wrong reason first, and that mistake is on record.

**Risk (h2):** The real drawdown, not the backtest one
A backtest shows one path. A block bootstrap (blocks of 20 consecutive trades, so losing streaks stay intact) shows many. At 0.70% risk per trade, 90% of scenarios stay under a 26% drawdown; at 1.05%, under 35%. Costs, flat months (14 months of a still gold market lost 1.54 R per month on average), a single market regime and real-world execution are all open risks.

**Monitoring (h2):** Before trusting it, watch it live
A real-time demo account with frozen parameters, for three to six months. Two questions no backtest can answer: are real spreads and slippage like the simulated ones, and can you watch it sit idle for months without switching it off? `[TO BE COMPLETED: what is published and how often]`

**Contact (h2):** Get in touch, even to report a mistake
`[Email button: Send an email]` · PORTFOLIOALGOMANAGER21@gmail.com. Replies are about the method only. This is not financial advice.

**Risk notice (h2):**
Trading carries a high risk of loss. Results shown are backtests on historical data, not live results. Past performance does not guarantee future results. This page is not financial advice, an investment recommendation, or an offer to trade or invest. `[TO BE COMPLETED: any statement required where the site owner is based; to be checked with a professional, not legal advice.]`

---

## 8. Cosa manca e va confermato da Davide

**Da decidere prima di pubblicare (bloccanti):**

1. **Cosa offre il sito.** Solo vetrina di ricerca, oppure gestione, segnali, copy trading, consulenza, vendita di un EA? Il testo attuale non promette nessun servizio. La risposta cambia il testo e gli obblighi legali.
2. **Obblighi legali del suo Paese** per una vetrina pubblica su un portafoglio di trading (diciture, autorizzazioni, comunicazioni promozionali, privacy, cookie). Va verificato con un professionista abilitato: qui non è stato dato nessun parere. Il testo dell'avviso è un punto di partenza sobrio, non una formula legale.
3. **Titolare del sito e nome pubblico.** Nome del progetto (ora provvisorio: Portfolio Algo Manager), nome o ragione sociale, Paese, e se Davide compare con il proprio nome.
4. **Formato dell'indirizzo email:** per il sito si usa solo PORTFOLIOALGOMANAGER21@gmail.com. Confermare come mostrarlo (maiuscole così come scritto, o in minuscolo, più leggibile: le email non distinguono le maiuscole).

**Dati che nei file non ci sono:**

5. **Risultati live/demo:** nessuno nei file. Stato del demo (iniziato? da quando?) e cosa si pubblica, con che cadenza.
6. **Nasdaq, USDJPY e altri strumenti:** non compaiono in nessun file. Se esistono, servono stato e dati misurati. Altrimenti si toglie il sotto-blocco "Su quali strumenti".
7. **Tempi di risposta alle email** e URL finale del sito (per canonical, sitemap, JSON-LD).

**Numeri da ricontrollare (piccole incoerenze fra i documenti):**

8. **La t di 2,61** del ritracciamento: è stata calcolata con la deviazione standard iniziale (1,26 R)? Se sì, è ottimistica di circa il 15% e il testo va aggiornato.
9. **Numeri per gamba su `.p`** (567/37,0%/1,40 e 555/47,7%/1,25): in `docs/v1xau-verifica.md` sono etichettati "previsto". Confermare che sono risultati del run su `.p`.
10. **Profit factor su `.s`:** 1,30 (lotto fisso, `CONTINUA-QUI.md`) contro 1,36 (`v1xau-verifica.md`, con composto). Nel sito si usa 1,30. Confermare.
11. **Anni 2022 e 2024 "a vuoto"** (675 operazioni, 9%): il dato preciso è nel documento del portafoglio a tre gambe. Confermare che valga anche per le due gambe, oppure toglierlo/riformularlo.
12. **Fuori campione a tre gambe:** `CONTINUA-QUI.md` dà 22% annuo a rischio 1,05%; `fuori-campione.md` dà 13,0% a rischio 0,6%. Sono lo stesso test con rischi diversi. Il sito usa 22% e 47%, ma va deciso se mostrare percentuali annue (leggibili come promesse anche se etichettate "backtest") oppure solo R per operazione e profit factor. Consiglio: solo R e profit factor.
13. **Scheda "Take profit fisso a 2,5R":** il dato 159 $ → 1.795 $ viene da una versione precedente della strategia. Confermare o togliere la scheda.
14. **Versione al ribasso del RITRACCIAMENTO:** le regole dei file descrivono solo il caso rialzista ("prezzo sopra la EMA"). Confermare che ci sia il caso speculare, o riformulare.
15. **Chiamare per nome il prodotto commerciale d'origine:** il testo non lo fa, di proposito (rischio legale e nessuna utilità per il lettore). Se Davide vuole comunque raccontare l'origine del lavoro, usare una frase generica, senza nome e senza cifre.
16. **Inglese:** confermare se la fase 2 è voluta. Il pubblico estero cambia gli obblighi.

**Non verificato in questo lavoro:**
- Brand Voice e plugin SEO: non attivi in questa sessione, quindi nessun controllo automatico di coerenza o SEO. Lunghezze di title e meta description misurate a mano. Nessuna verifica del sito reale, che non è ancora costruito.
