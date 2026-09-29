# COPY — sito vetrina del portafoglio di tre strategie (oro, Nasdaq, USDJPY)

Versione italiana (fase 1). Inglese proposto in fondo (fase 2).
Ultimo aggiornamento: 29 settembre 2026 (versione 2: fonte unica per i numeri, tre strategie, sezione portafoglio).

## Come leggere questo file

- Il testo pubblico è quello fuori dalle citazioni. Le righe `> Fonte:` sono note interne per chi controlla: **non vanno pubblicate**.
- **Tutti i numeri del sito vengono da una sola fonte:** `sites/portfolio/data/strategie.json`, cioè la misura più recente del portafoglio fatta con il simulatore di Davide (file `portafoglio-vetrina-offline.html`, 29 settembre 2026): 4.206 operazioni con strategia, R e mese, dal 2019-01 al 2026-09. Nessun numero è stato ricalcolato o inventato; le uniche elaborazioni fatte qui sono conteggi sui dati mensili già presenti nel file (mesi negativi, mesi in cui perdono tutte e tre) e sono segnalate nelle note.
- **Il racconto del metodo** (criteri dichiarati prima, fuori campione speso una volta, plateau non picco, cosa è stato scartato e perché, bootstrap a blocchi) viene da `docs/` e da `CLAUDE.md` del progetto. Davide ha confermato che quella ricerca riguarda una **versione precedente del sistema oro**: il racconto resta valido, le sue cifre no. Ogni cifra dell'oro presa da `docs/` nella versione 1 di questo file è stata sostituita con quella del simulatore oppure tolta; le note `> Fonte:` dicono cosa è uscito.
- Nel sito compare **una sola nota** su questo punto, nella sezione "Il metodo": *«I numeri di questa pagina vengono dalla misura più recente del portafoglio (settembre 2026). La ricerca documentata nel repo è una versione precedente del sistema oro.»*
- Le regole di ingresso e uscita dell'oro (ROTTURA M30 + RITRACCIAMENTO H4) sono quelle del repo: Davide deve confermare che siano identiche alla versione misurata nel simulatore. Le regole di Nasdaq e USDJPY **non sono nei file**: non sono state inventate, restano `[DA COMPLETARE: regole]`.
- `[DA COMPLETARE]` = dato che nei file non c'è. Va compilato da Davide oppure il blocco resta fuori dal sito.
- Non compaiono numeri, nome o confronti del prodotto commerciale da cui il lavoro è partito.
- Tutti i risultati sono backtest. Nessun risultato reale (live) risulta nei file. Il simulatore non contiene prezzi né volumi: non è detto nei file se i suoi R includano spread, commissioni e swap (lista finale, punto 6).
- Il 2026 è un anno parziale (fino a settembre): ogni volta che compare, lo si dice.
- Brand e persona: nei file non c'è un nome pubblico del progetto. Nel testo si usa il nome provvisorio **Portfolio Algo Manager**, ricavato dall'email. Va confermato o cambiato. La voce è impersonale ("è stato scartato"), senza "io" e senza "noi", così regge qualunque scelta.

---

## 1. Tono di voce

**Come parla il sito:** tecnico, sobrio, onesto. Come un quaderno di laboratorio ben tenuto, non come una brochure.

- Frasi brevi. Un'idea per frase. I numeri con la loro unità (R, %, operazioni) e con il contesto (backtest, periodo).
- I numeri brutti stanno accanto a quelli buoni, con lo stesso peso visivo. Se una strategia ha un fuori campione debole, lo si scrive nella sua scheda, non in una nota a piè di pagina.
- Ogni termine tecnico si spiega la prima volta, in una riga (vedi Glossario).
- Si dice cosa è stato misurato e cosa no. "Non lo sappiamo ancora" è una frase ammessa.
- Le tre strategie si presentano con lo stesso formato e le stesse voci: nessuna ha una scheda più bella delle altre.

**Da usare:** misurato, dichiarato prima, fuori campione, plateau, scartato, backtest, "non è dimostrato", "probabilmente reale, non certamente reale", "anno parziale".

**Da evitare:** rendimenti garantiti o attesi, "batte il mercato", "guadagni", "investi", "diversificazione perfetta", "protezione", "soluzioni innovative", "a 360 gradi", "intelligenza artificiale", esclamazioni, maiuscole d'enfasi, superlativi, urgenza ("solo oggi", "posti limitati"), confronti con prodotti altrui, qualunque percentuale annua senza la scritta "backtest".

---

## 2. SEO tecnico (pagina unica)

Il sito ora parla di tre strategie, non solo di oro. Sotto ci sono le due versioni: la vecchia (solo oro) e la nuova (tre strategie). **Si consiglia la nuova.**

| Elemento | Versione precedente (solo oro) | Versione proposta (tre strategie) |
|---|---|---|
| **title** | `Strategie algoritmiche sull'oro (XAUUSD): metodo e rischio` (58) | `Strategie algoritmiche su oro, Nasdaq e USDJPY: il metodo` (57) |
| Alternativa con marchio | `Portfolio Algo Manager \| Strategie algoritmiche su XAUUSD` (57) | `Portfolio Algo Manager \| Tre strategie algoritmiche misurate` (60) |
| **meta description** | `Strategie trend following su XAUUSD con criteri fissati prima del test, fuori campione, scarti e drawdown vero. Sono backtest, non risultati reali.` (147) | `Tre strategie su oro, Nasdaq e USDJPY: criteri fissati prima del test, fuori campione, correlazioni e drawdown. Sono backtest, non risultati reali.` (147) |
| **h1** (uno solo) | `Strategie algoritmiche sull'oro, misurate e raccontate senza ritocchi` | `Tre strategie algoritmiche, misurate e raccontate senza ritocchi` |
| Lingua | `<html lang="it">` | uguale |
| URL | pagina unica `/`; ancore `#metodo`, `#strategie`, `#scartate`, `#rischio`, `#monitoraggio`, `#contatti`, `#avviso` | pagina unica `/`; ancore `#metodo`, `#strategie`, `#portafoglio`, `#scartate`, `#rischio`, `#monitoraggio`, `#contatti`, `#avviso`. Fase 2: `/en/` con `hreflang` reciproco |
| Open Graph / social | titolo e descrizione come sopra | titolo e descrizione come sopra. Immagine: `[DA COMPLETARE]` (vedi alt più sotto) |
| Gerarchia | — | `h1` (hero) > `h2` per ogni sezione > `h3` per strategie, principi, voci scartate |

> Note SEO: il sito non ha un obiettivo commerciale dichiarato, quindi non si spingono parole chiave da "segnali di trading" o "gestione del capitale": sarebbero promesse che la pagina non fa. Le parole chiave naturali sono già nel testo: strategie algoritmiche, trend following, XAUUSD, Nasdaq, USDJPY, backtest, drawdown, fuori campione, correlazione. "Nasdaq" nel title è generico di proposito: nei file non c'è il simbolo esatto (NAS100, USTEC, NQ…), vedi lista finale punto 7.

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
      "name": "Strategie algoritmiche su oro, Nasdaq e USDJPY: il metodo",
      "description": "Tre strategie su oro, Nasdaq e USDJPY: criteri fissati prima del test, fuori campione, correlazioni e drawdown. Sono backtest, non risultati reali.",
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

Voci: `Metodo` · `Strategie` · `Portafoglio` · `Rischio` · `Monitoraggio` · `Contatti`
Pulsante in barra: `Scrivi via email`

**Barra fissa in fondo allo schermo (sempre visibile, mono piccola, con link a #avviso):**
> V2 · BACKTEST SU DATI STORICI · TRADING AD ALTO RISCHIO · NON È CONSULENZA FINANZIARIA — [Avviso completo](#avviso)

> Fonte: brief di Davide (29/09/2026), testo esatto. La versione breve riformulata (`RISK_SHORT`: "Backtest validati fuori campione · non garantiscono rendimenti futuri · non è consulenza finanziaria") resta nel footer di /dettagli; la frase completa in 3.9 resta nell'avviso e nel Riepilogo. Mai "machine learning", mai "alta probabilità".

**Prologo e finale del film (brief di Davide, testi esatti):**
- S1 (h1 della home): `Tre strategie algoritmiche validate attraverso modelli quantitativi.` — sottotitolo mono: `USDJPY · NASDAQ · XAUUSD`
- S2: `Analisi quantitativa, IA e conoscenza dei mercati trasformano ipotesi di trading in sistemi statistici verificabili.`
- S3: `OSSERVIAMO → VERIFICHIAMO → COSTRUIAMO` e sotto `Dal comportamento del mercato all'ipotesi. Dall'ipotesi ai dati. Dai dati a un sistema replicabile.`
- Finale: `I risultati vengono dopo il metodo.` + un solo bottone `ESPLORA IL PORTFOLIO →` (verso /dettagli)
- Frasi ricorrenti degli atti 2-5: `Si decide prima, si misura dopo.` e `Misurato fuori campione. Non promesso.` (la seconda sostituisce "Backtest, non risultati reali.")
> Fonte: brief di Davide; la frase B riformulata su richiesta (una sola costante `FILM_PHRASE_B` in `src/lib/site.ts`, se Davide manda la sua versione si cambia lì).

---

### 3.1 Hero

**Etichetta sopra il titolo:** `ORO · NASDAQ · USDJPY · BACKTEST 2019–2026`

**h1:** Tre strategie algoritmiche, misurate e raccontate senza ritocchi

**Sottotitolo:**
Un portafoglio di tre sistemi automatici su oro (XAUUSD), Nasdaq e USDJPY. Ogni criterio è dichiarato prima del test. Ogni numero scomodo resta sul tavolo. E i risultati sono di backtest: non sono risultati reali.

**Pulsante principale:** `Vedi come si misura`  (ancora `#metodo`)
**Pulsante secondario:** `Scrivi via email`  (mailto, vedi microcopy)

**Fascia di numeri sotto il titolo** (ogni cifra con la sua etichetta; tutte da backtest, periodo 2019.01–2026.09):

| Cifra | Etichetta |
|---|---|
| 3 | strategie, su tre mercati che si muovono per motivi diversi |
| 4.206 | operazioni simulate in 7,7 anni (backtest) |
| 93 | mesi misurati, mese per mese, senza togliere quelli in perdita |
| 6 | mesi su 93 in cui hanno perso tutte e tre insieme (backtest) |
| [DA COMPLETARE] | mesi di risultati in tempo reale |

> Fonte: `data/strategie.json` (4.206 operazioni; 93 mesi; correlazione_mensile.mesi = 93). Il "6 mesi su 93" è un conteggio fatto qui sui `per_mese_R` delle tre strategie (mesi con R < 0 per tutte e tre: 2019-03, 2019-04, 2022-08, 2023-04, 2023-06, 2025-06). Il dato sui risultati live non esiste nei file: se non ce ne sono, scrivere "Nessuno. Demo in corso/da iniziare" solo dopo conferma di Davide. Tolti dalla fascia rispetto alla versione 1: "1.122 operazioni", "42,3% vincenti", "3× i costi" (cifre della versione precedente dell'oro, da `docs/`).

**Riga di avviso sotto i pulsanti (piccola ma leggibile):**
I risultati sono simulazioni su dati storici. I risultati passati non garantiscono quelli futuri.

---

### 3.2 Il metodo

**h2:** Si decide prima, si misura dopo

**Introduzione:**
Un backtest è facile da far uscire bene: basta provare abbastanza configurazioni e tenere la migliore. Per questo il lavoro segue tre regole. Non sono decorazione: sono il motivo per cui i numeri di questa pagina si possono discutere.

**Nota sulla fonte dei numeri (una sola, in evidenza discreta, sotto l'introduzione):**
I numeri di questa pagina vengono dalla misura più recente del portafoglio (settembre 2026). La ricerca documentata nel repo è una versione precedente del sistema oro.

**h3:** 1. I criteri si scrivono prima del test

Prima di ogni prova si annota cosa deve succedere perché sia considerata riuscita: guadagno medio minimo, profit factor minimo, perdita massima ammessa. Poi si guarda il risultato. Se è scomodo, si rispetta lo stesso.

*Un esempio scomodo.* Per la strategia di ritracciamento sull'oro erano stati fissati tre criteri: almeno 150 operazioni, profit factor almeno 1,20, t-statistica almeno 3,4. Su 192 configurazioni provate, **nessuna** li ha centrati tutti e tre. La strategia è stata bocciata.

Poi è stata riaperta, e va detto come: la griglia di parametri aveva l'ottimo sul bordo, quindi non aveva provato la zona giusta. Prima dell'estensione è stata scritta una regola di arresto ("se la t resta sotto 2,5, la strategia è chiusa"). Dopo l'estensione la regola di arresto è stata superata, ma la soglia iniziale di 3,4 no. La strategia è entrata nel portafoglio come candidata credibile, non come caso chiuso.

> Fonte: `docs/pullback-h4-verdetto.md` (192 configurazioni, criteri ≥150 trade / PF ≥1,20 / t ≥3,4, zero centrate, regola di arresto 2,5); `docs/CONTINUA-QUI.md` sez. 4 punto 8. Tolte dal testo pubblico le t 1,61 e 2,61: sono misure della versione precedente. La t del sistema oro intero, misurata nel simulatore, è 3,40 su 1.123 operazioni (`data/strategie.json`): non è la t della sola strategia di ritracciamento, quindi non si usa qui per non confondere.

**h3:** 2. Il fuori campione si usa una volta sola

Una parte dei dati (per oro e Nasdaq dal 2024.01; per USDJPY dal 2023.01) è rimasta chiusa durante la costruzione. È stata aperta **una volta sola**, con i criteri già scritti, senza ottimizzare niente.

**Oro, dentro e fuori campione (backtest):**

| | Periodo di costruzione (2019–2023) | Fuori campione (2024.01–2026.09) |
|---|---:|---:|
| Operazioni | 715 | 408 |
| Guadagno medio per operazione | +0,1134 R | +0,2534 R |
| t-statistica | 1,86 | 3,21 |
| Operazioni in utile | 40,6% | 45,1% |

Il criterio dichiarato prima sul guadagno medio (almeno +0,050 R per operazione) è passato. Ma ci sono quattro cose da leggere insieme a questa tabella.

1. **Va meglio fuori che dentro, e non è una buona notizia.** Il guadagno medio fuori campione è più del doppio di quello del periodo di costruzione. Il 2024–2026 è stato un periodo eccezionale per l'oro: il numero da usare per il futuro è il più basso dei due, non il più alto.
2. **Quel fuori campione è già stato speso.** Non c'è più nessun dato mai visto. Provare altre configurazioni sugli stessi anni peggiora la statistica invece di migliorarla. Nella ricerca sull'oro sono state provate in totale 272 configurazioni.
3. **Una scelta è stata fatta dopo aver guardato.** Una terza strategia sull'oro (vedi "Cosa è stato scartato") è stata tolta dopo aver visto il fuori campione. Di solito questo contamina il test. Il fuori campione dell'oro va quindi letto come una conferma parziale, non come una prova pulita. Si decide con dati nuovi, non rianalizzando questi.
4. **Il fuori campione, da solo, non dimostra niente.** Il valore di quel test sta nell'essere stato una prova sola, dichiarata prima.

Lo stesso confronto per Nasdaq e USDJPY è nelle loro schede. Una delle due, USDJPY, fuori campione va **peggio** che dentro: è il caso più importante da tenere d'occhio.

> Fonte: `data/strategie.json` → oro.dentro_campione / oro.fuori_campione (715 / 408, +0,1134 / +0,2534, t 1,86 / 3,21, 40,6% / 45,1%, fuori campione da 2024-01; usdjpy.fuori_campione.da = 2023-01). Soglia +0,050 R: `docs/fuori-campione.md` (criterio dichiarato prima). Le altre due soglie dichiarate allora (profit factor ≥1,10 e perdita massima ≤27,4% a rischio 0,60%) non hanno una misura corrispondente nel simulatore, che non riporta profit factor né drawdown in percentuale: per questo non compaiono. "272 configurazioni": `CLAUDE.md` regola 2 (fatto di processo, non misura). **Tolti** rispetto alla versione 1: la tabella con +0,2554 R / PF 1,526 / 8,26%; la tabella 22% / 47% annui; il riquadro "Lo stesso test, a tre gambe" (891 operazioni, +0,0618 R, 24° percentile, t 1,39). Sono tutte misure della versione precedente.

**h3:** 3. Si cerca un plateau, non un picco

Se un valore rende e i suoi vicini no, è fortuna. Per ogni parametro si guarda la collina intorno al valore scelto, non il punto più alto.

- **ROTTURA (oro):** posizione nel range 0,91 con plateau 0,91–0,93; trailing con plateau fra 3 e 6 ATR.
- **RITRACCIAMENTO (oro):** media mobile a 30 periodi, collina fra 30 e 40.
- **Il caso opposto:** nella prima prova del ritracciamento, cambiando il periodo della media mobile il profitto saliva, crollava sotto zero, risaliva e saliva ancora. Un buco in mezzo a due picchi è la firma del rumore, non di una struttura.
- **Se l'ottimo sta sul bordo, la griglia era sbagliata.** È successo tre volte. Tutte e tre le volte, estenderla ha cambiato la conclusione.
- **Meglio del secondo miglior valore, non del migliore.** Nel ritracciamento l'ottimizzazione voleva il margine di sicurezza dello stop a 0,05 ATR. È stato fissato a 0,10, apposta: 0,05 ATR sull'oro valgono poco più dello spread, e uno stop appoggiato esattamente sul minimo è dove il mercato va a prendere gli stop. Costa una parte del profitto di backtest. Non si riabbassa.
- **Nasdaq e USDJPY:** `[DA COMPLETARE: se anche per queste due strategie i parametri sono stati scelti su un plateau, e con quale griglia. Nei file non c'è.]`

> Fonte: `docs/CONTINUA-QUI.md` sez. 1 (parametri, plateau, collina 30–40, buffer 0,10) e sez. 4 punto 8; `CLAUDE.md` regola 3. I parametri dell'oro sono quelli del repo: da confermare identici alla versione del simulatore (lista finale, punto 5). **Tolti**: la tabella 567 / −68 / 176 / 643 e "costa circa il 16% del profitto" (cifre della versione precedente).

**h3:** Gli errori, dichiarati

Sono stati commessi errori e sono scritti. Correggerli ha prodotto i risultati migliori.

- Il trailing (l'uscita che insegue il prezzo) era uguale allo stop e tagliava i vincitori. Allargato, il risultato di una delle strategie originali è cambiato di un ordine di grandezza.
- Le chiusure ereditavano l'etichetta sbagliata: il riepilogo per strategia era falso, anche se il profitto totale no.
- La deviazione standard dei risultati usata come stima all'inizio era più bassa di quella misurata sulle operazioni. Le t calcolate con la stima erano ottimistiche. Nella misura più recente la deviazione standard è 1,62 R sull'oro, 1,10 R sul Nasdaq, 1,04 R su USDJPY, ed è quella usata per tutte le t di questa pagina.
- Una strategia (EMA cross) era stata scartata per un motivo sbagliato. Vedi sotto.

> Fonte: `docs/CONTINUA-QUI.md` sez. 4 (errori 1, 2, 3, 5); deviazioni standard: `data/strategie.json` → *.tutto.dev_std (1,62 / 1,098 / 1,039). **Tolti**: "da 6 a 98 punti R", "1,26 R → 1,45 R" (versione precedente).

**Chiusura della sezione (link):** `Guarda cosa è stato scartato` (ancora `#scartate`)

---

### 3.3 Le strategie

**h2:** Tre strategie, tre mercati

**Introduzione:**
Tre sistemi automatici, uno per mercato: oro (XAUUSD), Nasdaq e USDJPY. Sono presentati con le stesse voci e lo stesso periodo (backtest, 2019.01–2026.09, 93 mesi). Per ognuno c'è il numero buono e quello scomodo. Il 2026 è un anno parziale: arriva a settembre.

**Tabella riassuntiva (backtest, 2019.01–2026.09):**

| | Oro (XAUUSD) | Nasdaq | USDJPY |
|---|---:|---:|---:|
| Operazioni | 1.123 | 1.626 | 1.457 |
| Guadagno medio per operazione | +0,1643 R | +0,1106 R | +0,0900 R |
| Somma dei risultati | +184,5 R | +179,8 R | +131,2 R |
| t-statistica | 3,40 | 4,06 | 3,31 |
| Operazioni in utile | 42,2% | 54,5% | 46,8% |
| Perdite consecutive massime | 14 | 7 | 8 |
| Drawdown massimo del backtest | 27,5 R | 13,7 R | 14,0 R |
| Anno migliore | 2025 (+55,2 R) | 2025 (+48,9 R) | 2022 (+40,9 R) |
| Anno peggiore | 2021 (−2,9 R) | 2019 (−1,3 R) | 2026, parziale (+1,4 R) |
| Mesi in perdita su 93 | 40 | 30 | 34 |

> Fonte: `data/strategie.json` → *.tutto, *.per_anno_R, *.anno_migliore, *.anno_peggiore, *.max_drawdown_R_backtest, *.perdite_consecutive_max. "Mesi in perdita" è un conteggio fatto qui sui `per_mese_R` (mesi con R < 0: 40 / 30 / 34). Il drawdown "del backtest" è quello di un solo percorso, in R: non è il drawdown vero (vedi "Il rischio").

**h3:** ORO (XAUUSD) · due sistemi trend following, ROTTURA su M30 e RITRACCIAMENTO su H4

Entrambi entrano quando il prezzo si muove in una direzione e ci restano finché il movimento regge. Non hanno un obiettivo di guadagno fisso (nessun take profit): un'uscita a obiettivo fisso è stata provata e peggiorava ogni configurazione. Quando il prezzo va bene, un'uscita che lo insegue (il trailing) lo lascia correre.

- **ROTTURA (M30).** Il prezzo chiude oltre il massimo (o sotto il minimo) delle ultime 60 barre da 30 minuti ed è già al bordo del proprio intervallo delle ultime 480 barre. Entra nella direzione dello sfondamento. Stop iniziale 2,0 ATR (l'ATR è l'ampiezza media dei movimenti recenti). Trailing a 4,0 ATR, attivato quando l'operazione è a +1R.
- **RITRACCIAMENTO (H4).** Il trend è stabilito (prezzo sopra la media mobile a 30 periodi, con la media inclinata). Il prezzo ritraccia di almeno 1 ATR dal massimo delle ultime 20 barre, poi riparte chiudendo sopra il massimo della barra precedente. Stop sotto il minimo del ritracciamento, più un margine di 0,10 ATR. Trailing a 1,5 ATR, attivato a +1R. Attesa di 3 barre dopo un ingresso.

**I numeri (backtest):** 1.123 operazioni, +0,1643 R per operazione, +184,5 R in totale, t 3,40. Chiude in utile il 42,2% delle operazioni: si perde più spesso di quanto si vinca, e il conto torna perché le vincenti, lasciate correre, pesano più delle perdenti.

**Dentro e fuori campione:** nel periodo di costruzione (2019–2023) +0,1134 R per operazione su 715 operazioni, t 1,86; fuori campione (dal 2024) +0,2534 R su 408, t 3,21. Va meglio fuori che dentro: vedi "Il metodo" per perché non è una buona notizia.

**I numeri scomodi:** il 2021 è chiuso in perdita (−2,9 R) e il 2024 quasi a zero (+3,9 R). La serie di perdite consecutive più lunga è di **14 operazioni**. Il drawdown del backtest è 27,5 R, il più alto delle tre. Il mese peggiore è settembre 2019 (−11,5 R). Chi lo guarda deve essere pronto a vederlo pareggiare per un anno intero.

**Per anno (backtest, in R):** 2019 +5,9 · 2020 +30,7 · 2021 −2,9 · 2022 +8,6 · 2023 +38,8 · 2024 +3,9 · 2025 +55,2 · 2026 (a settembre) +44,3.

> Fonte: regole da `docs/CONTINUA-QUI.md` sez. 1 (da confermare identiche alla versione del simulatore: lista finale, punto 5). Numeri: `data/strategie.json` → oro.tutto, oro.dentro_campione, oro.fuori_campione, oro.per_anno_R, oro.perdite_consecutive_max (14), oro.max_drawdown_R_backtest (27,5); mese peggiore da oro.per_mese_R (2019-09: −11,55). **Tolti** rispetto alla versione 1: la tabella per gamba e per conto (`.p` / `.s`: 567 / 37,0% / 1,40 ecc.), i profit factor 1,33 / 1,30, i totali 191,9 R / 167,7 R, il paragrafo su commissioni e spread, la tabella "R al mese secondo il movimento dell'oro" e "2022 e 2024 a vuoto, 675 operazioni per il 9%": sono tutte misure della versione precedente, e il simulatore non ha prezzi per rifarle. La ripartizione ROTTURA / RITRACCIAMENTO nel simulatore non c'è: `[DA COMPLETARE]` se Davide la vuole in pagina.

**h3:** NASDAQ · `[DA COMPLETARE: orizzonte temporale e tipo di strategia]`

**Regole di ingresso e uscita:** le regole sono descritte nel simulatore di Davide. `[DA COMPLETARE: regole — nei file di questo progetto non ci sono e non vanno inventate.]`

**I numeri (backtest, 2019.01–2026.09):** 1.626 operazioni, +0,1106 R per operazione, +179,8 R in totale, t 4,06. Chiude in utile il 54,5% delle operazioni: è la sola delle tre che vince più spesso di quanto perde, ma le sue operazioni sono anche le più piccole in R.

**Dentro e fuori campione:** nel periodo di costruzione (2019–2023) +0,0918 R per operazione su 1.050 operazioni, t 2,69, 53,6% in utile. Fuori campione (dal 2024) +0,1448 R su 576 operazioni, t 3,21, 56,1% in utile. Anche qui va meglio fuori che dentro, e vale lo stesso avvertimento dato per l'oro: il numero da usare per il futuro è il più basso dei due.

**I numeri scomodi:** il primo anno, il 2019, è chiuso in perdita (−1,3 R). La serie di perdite consecutive più lunga è di 7 operazioni. Il drawdown del backtest è 13,7 R. Il mese peggiore è febbraio 2024 (−5,5 R), dentro il fuori campione.

**Per anno (backtest, in R):** 2019 −1,3 · 2020 +29,9 · 2021 +35,8 · 2022 +10,2 · 2023 +21,7 · 2024 +17,1 · 2025 +48,9 · 2026 (a settembre) +17,4. Anno migliore 2025, anno peggiore 2019.

> Fonte: `data/strategie.json` → nasdaq.tutto (1626, +0,1106, 179,78, t 4,06, 54,5%), nasdaq.dentro_campione (1050, +0,0918, t 2,69, 53,6%), nasdaq.fuori_campione (da 2024-01: 576, +0,1448, t 3,21, 56,1%), nasdaq.per_anno_R, nasdaq.perdite_consecutive_max (7), nasdaq.max_drawdown_R_backtest (13,7); mese peggiore da nasdaq.per_mese_R (2024-02: −5,48). Strumento esatto, orizzonte e regole: non nei file.

**h3:** USDJPY · `[DA COMPLETARE: orizzonte temporale e tipo di strategia]`

**Regole di ingresso e uscita:** le regole sono descritte nel simulatore di Davide. `[DA COMPLETARE: regole — nei file di questo progetto non ci sono e non vanno inventate.]`

**I numeri (backtest, 2019.01–2026.09):** 1.457 operazioni, +0,0900 R per operazione, +131,2 R in totale, t 3,31. Chiude in utile il 46,8% delle operazioni.

**Dentro e fuori campione, e qui il numero scomodo è questo:** nel periodo di costruzione (2019–2022) +0,1238 R per operazione su 725 operazioni, t 3,20. Fuori campione (dal 2023, quindi quasi quattro anni) **+0,0566 R** su 732 operazioni, **t 1,48**, 45,1% in utile. Fuori campione il guadagno medio è **meno della metà** di quello dentro, e una t di 1,48 non basta a distinguere il risultato dal caso. È la strategia del portafoglio con la conferma più debole. Non è bocciata: è ancora in utile su 732 operazioni. Ma è quella da guardare per prima in tempo reale.

**Gli altri numeri scomodi:** il 2026, fino a settembre, è a **+1,4 R**: nove mesi a zero. L'anno intero peggiore è il 2023 (+6,1 R). La serie di perdite consecutive più lunga è di 8 operazioni. Il drawdown del backtest è 14,0 R. Il mese peggiore è gennaio 2025 (−8,3 R).

**Per anno (backtest, in R):** 2019 +12,8 · 2020 +6,9 · 2021 +29,1 · 2022 +40,9 · 2023 +6,1 · 2024 +24,5 · 2025 +9,5 · 2026 (a settembre) +1,4. Anno migliore 2022. Si noti che il 2022, l'anno migliore, è l'ultimo del periodo di costruzione: dopo, la strategia non ha più reso allo stesso modo.

> Fonte: `data/strategie.json` → usdjpy.tutto (1457, +0,09, 131,17, t 3,31, 46,8%), usdjpy.dentro_campione (725, +0,1238, t 3,20, 48,6%), usdjpy.fuori_campione (da 2023-01: 732, +0,0566, t 1,48, 45,1%), usdjpy.per_anno_R, usdjpy.anno_peggiore = "2026" (parziale: nel testo si dà anche il peggior anno intero, 2023), usdjpy.perdite_consecutive_max (8), usdjpy.max_drawdown_R_backtest (14,0); mese peggiore da usdjpy.per_mese_R (2025-01: −8,31). Perché il fuori campione di USDJPY parte dal 2023 e non dal 2024 come le altre due non è scritto nei file: lista finale, punto 8.

---

### 3.4 Portafoglio a tre strategie

**h2 (id `portafoglio`):** Tre strategie che non perdono negli stessi mesi

**Introduzione:**
Mettere insieme tre strategie serve a una cosa sola: che i mesi cattivi dell'una non coincidano con quelli delle altre. Non è garantito. Si misura con la correlazione dei risultati mensili: un numero fra −1 e +1. Vicino a +1, le due strategie guadagnano e perdono negli stessi mesi. Vicino a 0, ognuna va per conto suo. Sotto zero, quando una perde l'altra tende a guadagnare.

**Tabella (backtest, correlazione dei risultati mensili su 93 mesi, 2019.01–2026.09):**

| Coppia | Correlazione mensile | In parole |
|---|---:|---|
| Oro – Nasdaq | +0,05 | praticamente indipendenti |
| Oro – USDJPY | −0,06 | praticamente indipendenti |
| Nasdaq – USDJPY | −0,15 | leggermente opposte, ma il margine di errore copre anche lo zero |

**Come leggerla, con la cautela dovuta:**

- Tutte e tre le correlazioni sono vicine a zero. È quello che si vuole da un portafoglio: nessuna coppia tende a perdere insieme.
- **93 mesi sono pochi per una correlazione.** Con 93 osservazioni il margine di errore è largo, all'incirca ±0,2 intorno al valore misurato. Vuol dire che nessuno dei tre numeri si distingue davvero dallo zero, e che nemmeno il −0,15 fra Nasdaq e USDJPY è una compensazione dimostrata. La lettura onesta è: "non sembrano muoversi insieme", non "si proteggono a vicenda".
- **Le correlazioni cambiano nei momenti peggiori.** Una correlazione media su sette anni non dice cosa succede in un mese di panico, quando molti mercati si muovono insieme. Il conteggio qui sotto serve a questo.
- **Sei mesi su 93 hanno perso tutte e tre insieme** (marzo e aprile 2019, agosto 2022, aprile e giugno 2023, giugno 2025). In 24 mesi su 93 hanno guadagnato tutte e tre. Nei restanti 63 mesi almeno una compensava, in parte, le altre.
- Il portafoglio non è "più sicuro" delle sue parti: è meno esposto al caso in cui una sola strategia smette di funzionare. USDJPY, con il suo fuori campione debole, è l'esempio concreto di perché serve.

**Cosa non c'è in questa sezione, di proposito:** una curva unica del portafoglio con percentuali annue. Sommare le tre strategie richiede di scegliere quanto rischio dare a ciascuna, e quella scelta non è nei file. `[DA COMPLETARE: pesi delle tre strategie e rischio per operazione, se Davide vuole mostrare una curva unica. Anche allora: in R, con la scritta "backtest", e accanto il drawdown.]`

> Fonte: `data/strategie.json` → correlazione_mensile (oro-nasdaq 0,05; oro-usdjpy −0,06; nasdaq-usdjpy −0,15; mesi 93). Il margine "±0,2" è un'approssimazione standard (errore tipico di una correlazione ≈ 1/√n = 1/√93 ≈ 0,10; il doppio per una banda al 95%): è un ordine di grandezza per il lettore, non un intervallo calcolato sui dati. I conteggi "6 mesi tutte in perdita" e "24 mesi tutte in utile" sono fatti qui sui `per_mese_R`. Non è specificato nei file come il simulatore calcoli la correlazione (Pearson sui R mensili, si presume): lista finale, punto 9.

---

### 3.5 Cosa è stato scartato

**h2 (id `scartate`):** Le idee che non hanno funzionato

**Introduzione:**
Per ogni idea entrata nel portafoglio ce n'è una uscita. Il motivo è misurato, e mostrarlo è parte del metodo: chi conosce solo i successi non può giudicare la selezione. Le schede qui sotto riguardano la ricerca sull'oro; per Nasdaq e USDJPY `[DA COMPLETARE: cosa è stato provato e scartato, se c'è]`.

**Scheda 1 · Range mean reversion** (comprare il bordo basso di un canale che si stringe)
Bocciata. Su 174 configurazioni con almeno 100 operazioni, **zero** in utile. Più operava, più perdeva, con un ordine perfetto. L'ipotesi era invertita: la compressione della volatilità non precede il ritorno al centro, precede la rottura. Non c'è un parametro da aggiustare: la regola era sbagliata.

**Scheda 2 · Fade del breakout fallito** (la "TRAPPOLA": vendere le rotture al rialzo che falliscono)
In utile nel periodo di costruzione, **in perdita netta fuori campione**. Vende le rotture fallite su un oro che triplica. È stata tolta *dopo* aver visto il fuori campione: è il punto aperto del lavoro, ed è il motivo per cui il fuori campione dell'oro si legge come conferma parziale (vedi "Il metodo"). Si decide con dati nuovi, in tempo reale.

**Scheda 3 · Time-series momentum**
Il peso è stato ridotto in tre passi, da 1,0 a 0,5 a 0. Il rapporto profitto/rischio del portafoglio è salito a ogni passo. Se togliendola il portafoglio migliora, esce.

**Scheda 4 · EMA cross**
Scartata, ma con un motivo sbagliato all'inizio: il profit factor misura la qualità della singola operazione, non quanto una strategia porta al portafoglio. La decisione forse è ancora giusta (a drawdown uguale il portafoglio senza di lei è migliore), ma il motivo dichiarato non lo era.

**Scheda 5 · Rischio adattivo**
Misurato peggiore. Tenuto spento.

**Scheda 6 · Take profit fisso**
Peggiorava tutte le configurazioni testate di una delle strategie sull'oro: un obiettivo fisso taglia proprio le operazioni che fanno il risultato.

**Scelta di progetto (non un risultato):** nessun filtro su ore o giorni della settimana.

> Fonte: `docs/range-mr-verdetto.md` (174 su 174; ipotesi invertita); `docs/CONTINUA-QUI.md` sez. 3 e sez. 5 (TRAPPOLA; TSMOM; Adaptive Risk; filtri esclusi da Davide) e sez. 4 punto 3 (EMA cross); `docs/parametri-finali.md` (take profit). Il "174 configurazioni, zero in utile" è tenuto: è il motivo dello scarto, non una misura del sistema attuale. **Tolti** rispetto alla versione 1: "+50 R / −44,9 R" della TRAPPOLA, "6,36 → 6,56 → 6,63", "circa 90 punti R" dell'EMA cross, "da 159 $ a 1.795 $" del take profit: cifre della versione precedente dell'oro. Se Davide preferisce tenere le cifre della TRAPPOLA come racconto storico, vanno etichettate "versione precedente" (lista finale, punto 10).

**Chiusura della sezione:**
Quello che non si è ancora fatto: il confronto con ingressi casuali (per sapere se gli ingressi portano informazione o se il merito è tutto dell'uscita) esiste come programma ma non è mai stato eseguito. Il risultato è aperto.

> Fonte: `docs/CONTINUA-QUI.md` sez. 3; `CLAUDE.md` ("mai eseguito"); `docs/piano-validazione.md`.

---

### 3.6 Il rischio

**h2:** Il rischio vero, non quello del backtest

**Introduzione:**
Il drawdown è la perdita massima dal picco più alto del conto. Un backtest ne mostra uno solo: quello di un solo ordine possibile delle operazioni. In un altro ordine il drawdown sarebbe diverso, e le perdite arrivano in serie.

**Il drawdown del backtest, in R (una sola sequenza, quella storica):**

| Strategia | Drawdown massimo del backtest | Perdite consecutive massime |
|---|---:|---:|
| Oro (XAUUSD) | 27,5 R | 14 |
| Nasdaq | 13,7 R | 7 |
| USDJPY | 14,0 R | 8 |

Lettura: "27,5 R" vuol dire che, rischiando 1% del conto per operazione, nel punto peggiore della simulazione l'oro era sotto di circa il 27% dal suo massimo, senza contare l'interesse composto. Con 0,5% per operazione, circa il 14%. Il rischio per operazione è una scelta di chi opera, non una proprietà del sistema.

**Perché non basta.** Quattordici perdite di fila sull'oro sono già successe nel backtest; in un altro ordine delle stesse operazioni potrebbero essere di più. Per questo il drawdown vero si stima con un bootstrap a blocchi da 20: le operazioni vengono rimescolate a blocchi di 20 consecutive, così le serie di perdite restano intere. Si ripete migliaia di volte e si guarda la distribuzione, non il caso fortunato.

`[DA COMPLETARE: risultato del bootstrap a blocchi sulla misura più recente delle tre strategie (90° e 99° percentile del drawdown, per un rischio per operazione dichiarato). Lo strumento esiste (tools/montecarlo.py); sulla versione del simulatore non è ancora stato eseguito, o il risultato non è nei file.]`

> Fonte: `data/strategie.json` → *.max_drawdown_R_backtest, *.perdite_consecutive_max. La conversione "27,5 R ≈ 27% a rischio 1%" è aritmetica dichiarata (R × rischio per operazione, senza composto): serve al lettore per capire l'unità, non è una misura. **Tolti** rispetto alla versione 1: la tabella bootstrap (0,70% → 26% / 35%; 1,05% → 35% / 49%) e il riscontro "18,20% sulla mediana 18,2%": misure della versione precedente. Il tetto "35% al 90° percentile" era un criterio personale di Davide: se il bootstrap viene rifatto, resta fuori dal testo pubblico.

**h3:** Cosa può andare storto

- **Costi.** Spread, commissioni e swap (il costo di tenere aperta la posizione) mangiano una parte del vantaggio, e sull'oro lo swap è il costo maggiore. `[DA COMPLETARE: se i R del simulatore includono già i costi, e a quale multiplo dei costi attuali il portafoglio smette di funzionare. Nei file della misura più recente non c'è.]`
- **Anni e mesi fermi.** L'oro ha 40 mesi in perdita su 93, un anno chiuso in perdita (2021) e uno quasi a zero (2024). USDJPY è a +1,4 R nei nove mesi del 2026. Sono nello storico: capiteranno di nuovo.
- **Una strategia con conferma debole.** USDJPY fuori campione ha t 1,48 e un guadagno medio meno della metà di quello dentro. Se il calo è strutturale e non temporaneo, il portafoglio ha due gambe, non tre.
- **Un solo regime.** Sette anni sono un campione ampio di operazioni, non di regimi di mercato. Come sarebbe andata negli anni prima del 2019 non è verificabile con questi dati.
- **Correlazioni non garantite.** Le tre strategie non hanno perso insieme che in 6 mesi su 93. Non è una promessa: nei mesi di panico i mercati tendono a muoversi insieme più del solito.
- **Esecuzione reale.** Spread e slittamenti veri possono essere peggiori di quelli simulati. Nessun backtest lo può dire.
- **Statistica.** Il portafoglio è probabilmente reale, non certamente reale. Le t sono fra 3,3 e 4,1 sull'intero periodo, ma i parametri sono stati scelti guardando una parte di quei dati, e il fuori campione è già stato speso.

> Fonte: `data/strategie.json` (mesi negativi contati sui `per_mese_R`; per_anno_R; usdjpy.fuori_campione; *.tutto.t = 3,40 / 4,06 / 3,31); `docs/CONTINUA-QUI.md` sez. 2 (lo swap è il costo maggiore sull'oro: tenuto come affermazione qualitativa) e sez. 6 (esecuzione); `docs/piano-validazione.md` ("campione ampio di trade, non di regimi"); `docs/portafoglio-tre-gambe.md` ("probabilmente reale, non certamente reale"). **Tolti**: "−85 $ / +45 $ a lotto", "cinque volte le commissioni", "muore a 3 volte i costi", "14 mesi con oro fermo", "272 configurazioni" in questa sezione (resta nel metodo come fatto di processo).

---

### 3.7 Come si monitora

**h2 (id `monitoraggio`):** Prima di fidarsi, si guarda in tempo reale

**Introduzione:**
Nessun backtest può rispondere a due domande. Gli spread e gli slittamenti veri assomigliano a quelli simulati? E si riesce a guardare il sistema fermo per mesi, senza spegnerlo? Per questo il passo successivo non è un altro test sugli stessi anni: è un conto demo in tempo reale, con parametri congelati, per tre-sei mesi, con tutte e tre le strategie insieme.

**h3:** Cosa si controlla

1. **I costi veri contro quelli del modello.** Prima di aprire un conto reale, swap e spread reali si confrontano con quelli della simulazione. Se sono peggiori, il sistema non farà quello che ha fatto nel backtest, e lo si sa prima.
2. **Il risultato contro la banda simulata.** Il risultato reale di ogni strategia si mette dentro la distribuzione del bootstrap: in quale percentile cade? Serve che il bootstrap sulla misura più recente sia stato fatto (vedi "Il rischio").
3. **USDJPY per prima.** È la strategia con il fuori campione più debole (t 1,48) e con il 2026 a zero. Il criterio per tenerla o toglierla va scritto **prima** di guardare il demo, non dopo. `[DA COMPLETARE: il criterio, scritto da Davide.]`
4. **Le correlazioni.** Mese per mese si aggiorna il conteggio: quante volte le tre strategie perdono insieme. Con pochi mesi il numero dice poco; si accumula.
5. **La strategia scartata sull'oro.** La TRAPPOLA si decide sul demo: è dato nuovo.
6. **Il numero di operazioni.** Con poche operazioni, un risultato anche lontano dallo storico resta statisticamente compatibile con esso. Una serie negativa corta non invalida il sistema: sull'oro il backtest contiene già 14 perdite di fila.

**h3:** Cosa si pubblica

`[DA COMPLETARE: cosa mostrerà la pagina e con che cadenza (es. report mensile del demo, per strategia; contatore di operazioni; confronto con la banda simulata). Stato del demo: non iniziato / in corso dal [data].]`

Regola per la pagina: quando compaiono i primi risultati reali, sono mostrati accanto a quelli simulati, con lo stesso formato, per ognuna delle tre strategie, e senza togliere i mesi brutti.

> Fonte: `docs/CONTINUA-QUI.md` sez. 6 (demo 3-6 mesi, due domande, confronto swap/spread, la TRAPPOLA si decide lì); `docs/piano-validazione.md` (non si invalida per una serie negativa corta); `data/strategie.json` (USDJPY t 1,48; 14 perdite consecutive sull'oro). **Tolto**: "24° percentile" (versione precedente). Il punto 3 e il punto 4 sono proposte di copy coerenti con il metodo, non fatti dei file. La cadenza di pubblicazione non è nei file.

---

### 3.8 Contatti

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

### 3.9 Avviso sul rischio

**h2 (id `avviso`):** Avviso sul rischio

**Testo (completo, in pagina, sempre leggibile; nessun testo grigio su grigio):**

- **Il trading comporta un alto rischio di perdita.** Si può perdere una parte o tutto il capitale. Non operare con denaro che non puoi permetterti di perdere.
- **Risultati di backtest validati fuori campione con metodo quantitativo: criteri fissati prima del test, dati mai visti, bootstrap a blocchi.** Non garantiscono rendimenti futuri: indicano la mediana di cosa aspettarsi, e il suo intervallo, se il vantaggio esiste e non si è rotto. Non possono riprodurre tutto quello che succede su un conto reale: slittamenti, differenze di esecuzione, costi diversi da quelli simulati, comportamento di chi opera.
  > Fonte: richiesta di Davide, riformulata (v3, 29/09/2026). La stessa frase, per intero, chiude il film (atto 6, pannello dei dati) accanto ai bottoni.
- **I risultati passati non garantiscono quelli futuri.** I parametri sono stati scelti guardando i dati passati: il risultato in quel periodo è gonfiato per costruzione, e il fuori campione è già stato usato.
- **Le strategie possono andare in perdita per un anno intero, e più.** Lo storico stesso contiene, per l'oro, un anno in perdita e uno quasi a zero su otto; per USDJPY, nove mesi del 2026 a zero.
- **Tre strategie insieme non eliminano il rischio.** Nello storico hanno perso tutte e tre nello stesso mese sei volte su 93. Può succedere di nuovo, e più spesso.
- **Questa pagina non è consulenza finanziaria, né una raccomandazione di investimento, né un'offerta o sollecitazione a operare o a investire.** Nessuna informazione qui tiene conto della tua situazione personale. Per decisioni che riguardano il tuo denaro, rivolgiti a un professionista abilitato.
- `[DA COMPLETARE: eventuali diciture obbligatorie nel Paese del titolare del sito. Vanno verificate da Davide con un professionista; questo testo non è un parere legale.]`

**Titolare del sito:** `[DA COMPLETARE: nome o ragione sociale, Paese]`

> Nota: rispetto alla versione 1 è stata tolta la frase "includono spread, commissioni e swap": non è verificato che i R del simulatore li includano (lista finale, punto 6). Se Davide conferma, si rimette.

---

### Footer

Riga 1: `Backtest validati fuori campione · non garantiscono rendimenti futuri · non è consulenza finanziaria.`
> Fonte: richiesta di Davide, riformulata (v3): stessa versione breve della barra fissa (`RISK_SHORT`).
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
| Regole di una strategia non pubblicate | `Le regole di questa strategia sono descritte nel simulatore e non sono ancora riportate in questa pagina.` |
| Sezione live senza risultati | `Nessun risultato in tempo reale da mostrare. Il demo non è ancora iniziato.` (solo se confermato) `[DA COMPLETARE]` |
| Link a "avviso" nella barra fissa | `Leggi l'avviso completo` |
| Etichetta su ogni grafico o tabella di risultati | `Backtest · validato fuori campione` (v3, richiesta di Davide riformulata; prima: `Backtest · non è un risultato reale`) |
| Etichetta sull'anno 2026 in ogni tabella | `2026: anno parziale, fino a settembre` |
| Tooltip su "fuori campione" | `Dati tenuti chiusi durante la costruzione e usati una sola volta per la verifica.` |
| Tooltip su "correlazione mensile" | `Quanto i risultati mensili di due strategie si muovono insieme: +1 sempre insieme, 0 indipendenti, −1 opposti. Su 93 mesi il margine di errore è circa ±0,2.` |
| Selettore strategia (tab) | `Oro` · `Nasdaq` · `USDJPY` · `Tutte e tre` |
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
| Diagramma ROTTURA (oro) | `Grafico a candele su 30 minuti: il prezzo chiude sopra il massimo delle ultime 60 barre e l'operazione parte al rialzo, con stop a 2 ATR e trailing a 4 ATR.` |
| Diagramma RITRACCIAMENTO (oro) | `Grafico a candele su 4 ore: il prezzo sale, ritraccia di almeno un ATR, poi riparte sopra il massimo della barra precedente; lo stop sta sotto il minimo del ritracciamento.` |
| Curve dei risultati in R delle tre strategie (una per strategia, o tre linee) | `Grafico a linee, backtest 2019–2026: risultato cumulato in R di oro (+184,5 R su 1.123 operazioni), Nasdaq (+179,8 R su 1.626) e USDJPY (+131,2 R su 1.457). Le curve non salgono in linea retta: l'oro ha il calo più profondo, 27,5 R.` |
| Grafico dentro e fuori campione (tre strategie) | `Grafico a barre, backtest: guadagno medio per operazione dentro e fuori campione. Oro +0,1134 e +0,2534 R; Nasdaq +0,0918 e +0,1448 R; USDJPY +0,1238 e +0,0566 R, l'unica che fuori campione peggiora.` |
| Grafico per anno (tre strategie) | `Grafico a barre, backtest: risultato in R per anno dal 2019 al 2026 (parziale) delle tre strategie. Anni negativi: oro 2021 (−2,9 R), Nasdaq 2019 (−1,3 R). USDJPY 2026 a +1,4 R.` |
| Tabella o mappa delle correlazioni mensili | `Correlazione dei risultati mensili su 93 mesi, backtest: oro–Nasdaq +0,05, oro–USDJPY −0,06, Nasdaq–USDJPY −0,15. Tutte vicine a zero, con margine di errore circa ±0,2.` |
| Grafico dei mesi in perdita insieme | `Griglia dei 93 mesi, backtest: in 6 mesi hanno perso tutte e tre le strategie, in 24 hanno guadagnato tutte e tre.` |
| Grafico del drawdown simulato (se il bootstrap viene rifatto) | `[DA COMPLETARE con i percentili del nuovo bootstrap]` |
| Icone delle strategie scartate | `alt=""` se accanto c'è il titolo; altrimenti il nome della strategia |
| Immagine per i social (Open Graph) | `Portfolio Algo Manager: tre strategie algoritmiche su oro, Nasdaq e USDJPY, backtest e rischio dichiarati.` |

Se in pagina compare una curva dei profitti: sempre con la scritta "Backtest" nel grafico stesso (non solo nella didascalia), asse dei tempi visibile, e accanto il drawdown. Il file `data/strategie.json` contiene per ogni strategia la curva cumulata in R operazione per operazione (`curva_R`) e i risultati per mese (`per_mese_R`): sono i dati da usare, senza lisciature.

---

## 6. Glossario (per il pannello "Parole tecniche")

- **XAUUSD:** il prezzo dell'oro in dollari.
- **Nasdaq, USDJPY:** l'indice azionario americano dei titoli tecnologici e il cambio dollaro/yen. `[DA COMPLETARE: simbolo esatto degli strumenti usati]`
- **Trend following:** seguire il movimento del prezzo invece di scommettere sul suo ritorno.
- **Backtest:** simulazione di una strategia sui dati del passato. Non è un risultato reale.
- **R:** l'unità di misura dei risultati. 1 R è il rischio corso in quell'operazione: se in un'operazione si rischiano 100 €, +2 R vuol dire +200 €. Rende i risultati confrontabili qualunque sia il rischio scelto, e fra mercati diversi.
- **ATR:** l'ampiezza media dei movimenti recenti del prezzo. Serve a misurare stop e distanze in modo che si adattino alla volatilità.
- **Trailing:** un'uscita che segue il prezzo e si avvicina quando l'operazione va bene.
- **Guadagno medio per operazione:** il risultato medio in R.
- **Drawdown:** la perdita massima dal picco più alto del conto. "Del backtest" vuol dire misurato su un solo ordine delle operazioni, quello storico.
- **Perdite consecutive:** quante operazioni di fila hanno chiuso in perdita, nel caso peggiore dello storico.
- **Bootstrap a blocchi:** simulazione che rimescola le operazioni a blocchi di 20 consecutive, mantenendo le serie di perdite.
- **Fuori campione:** dati tenuti chiusi durante la costruzione e usati una sola volta per verificare.
- **Plateau:** una zona di valori vicini che rende bene tutta, al contrario di un picco isolato.
- **Swap:** il costo (o il ricavo) di tenere una posizione aperta da un giorno all'altro.
- **t-statistica:** misura di quanto un risultato si distingue dal caso. Più è alta, meno è probabile che sia fortuna. Sotto 2, di solito, non basta.
- **Correlazione mensile:** quanto i risultati mensili di due strategie si muovono insieme, da −1 (opposti) a +1 (insieme). Vicino a 0, indipendenti.

---

## 7. Inglese: proposta per la fase 2

Non è una traduzione letterale: frasi più corte, meno articoli descrittivi, stesso contenuto e stesse cautele. Gli obblighi legali cambiano con il pubblico: la versione inglese va riletta da Davide con un professionista prima della pubblicazione.

**title (54):** `Strategies on gold, Nasdaq and USDJPY: method and risk`
**meta description (157):** `Three strategies on gold, Nasdaq and USDJPY: criteria set before testing, out-of-sample results, monthly correlations, drawdown. Backtests, not live results.`
**h1:** Three algorithmic strategies, measured and reported as they are
**Subtitle:** A portfolio of three automated systems on gold (XAUUSD), Nasdaq and USDJPY. Every criterion is set before the test. Every uncomfortable number stays on the table. All results are backtests, not live results.
**Buttons:** `See how it is measured` · `Send an email`

**Fixed bar:** Backtests on historical data, not live results. Trading is high risk. Not financial advice. Read the full notice.

**Method (h2):** Decide first, measure after
Note: the numbers on this page come from the latest measurement of the portfolio (September 2026). The research documented in the repository is an earlier version of the gold system.
- *Criteria are written before the test.* For each test we note what has to happen for it to count as a pass. Then we look at the result, and we keep to it even when it hurts. Example: the gold pullback strategy had to reach at least 150 trades, profit factor 1.20 and a t-statistic of 3.4. Out of 192 configurations, none met all three. It was rejected, then reopened only after a stopping rule was written down, and it still did not reach the original threshold.
- *The out-of-sample period is used once.* Gold and Nasdaq: from January 2024. USDJPY: from January 2023. Gold out of sample: 408 trades, +0.2534 R per trade, t 3.21, against +0.1134 R and t 1.86 in the build period. Better out than in is not good news: 2024 to 2026 was an exceptional stretch for gold, and one gold strategy was removed after seeing it.
- *A plateau, not a peak.* If one value works and its neighbours do not, it is luck. If the best value sits at the edge of the grid, the grid was wrong. This happened three times, and each time widening it changed the conclusion.

**Strategies (h2):** Three strategies, three markets (backtest, January 2019 to September 2026; 2026 is a partial year)
- *Gold (XAUUSD), two trend-following systems.* BREAKOUT on M30: price closes beyond the high or low of the last 60 half-hour bars, at the edge of its 480-bar range; stop 2.0 ATR, no take profit, trailing at 4.0 ATR from +1R. PULLBACK on H4: an established trend (price above the 30-period moving average, average sloping), a pullback of at least 1 ATR from the 20-bar high, then a close above the previous bar's high; stop below the pullback low plus 0.10 ATR, trailing at 1.5 ATR. Together: 1,123 trades, +0.1643 R per trade, +184.5 R, t 3.40, 42.2% winners. Uncomfortable: 2021 closed negative (−2.9 R), 2024 near zero (+3.9 R), 14 consecutive losses, backtest drawdown 27.5 R.
- *Nasdaq.* Rules are described in the simulator `[TO BE COMPLETED: rules]`. 1,626 trades, +0.1106 R per trade, +179.8 R, t 4.06, 54.5% winners. Out of sample (from 2024): +0.1448 R, t 3.21. Uncomfortable: 2019 closed negative (−1.3 R); 7 consecutive losses; backtest drawdown 13.7 R.
- *USDJPY.* Rules are described in the simulator `[TO BE COMPLETED: rules]`. 1,457 trades, +0.0900 R per trade, +131.2 R, t 3.31, 46.8% winners. Uncomfortable, and said plainly: out of sample (from 2023) it earns +0.0566 R per trade with t 1.48, less than half of the build period; 2026 to September stands at +1.4 R. It is the weakest confirmation in the portfolio and the first thing to watch live.

**Portfolio (h2):** Three strategies that do not lose in the same months
Monthly correlations over 93 months: gold–Nasdaq +0.05, gold–USDJPY −0.06, Nasdaq–USDJPY −0.15. All close to zero, which is what a portfolio needs. With 93 months the margin of error is about ±0.2, so none of these is distinguishable from zero, and the −0.15 is not a proven hedge. All three lost in the same month 6 times out of 93.

**Discarded (h2):** Ideas that did not work
Range mean reversion: 174 configurations with at least 100 trades, none profitable. Fading failed breakouts: profitable in the build period, a net loss out of sample, removed after looking. Time-series momentum: removing it improved the portfolio. EMA cross: dropped for the wrong reason first, and that mistake is on record.

**Risk (h2):** The real drawdown, not the backtest one
A backtest shows one path: gold 27.5 R, Nasdaq 13.7 R, USDJPY 14.0 R at worst, and 14, 7 and 8 losses in a row. A block bootstrap (blocks of 20 consecutive trades, so losing streaks stay intact) shows many paths. `[TO BE COMPLETED: bootstrap on the latest measurement.]` Costs, flat years, a single market regime, correlations that break in bad months, and real-world execution are all open risks.

**Monitoring (h2):** Before trusting it, watch it live
A real-time demo account with frozen parameters, all three strategies together, for three to six months. USDJPY is watched first, with a keep-or-drop rule written before looking. `[TO BE COMPLETED: what is published and how often]`

**Contact (h2):** Get in touch, even to report a mistake
`[Email button: Send an email]` · PORTFOLIOALGOMANAGER21@gmail.com. Replies are about the method only. This is not financial advice.

**Risk notice (h2):**
Trading carries a high risk of loss. Results shown are backtests on historical data, not live results. Past performance does not guarantee future results. Three strategies together do not remove risk: all three lost in the same month six times out of 93. This page is not financial advice, an investment recommendation, or an offer to trade or invest. `[TO BE COMPLETED: any statement required where the site owner is based; to be checked with a professional, not legal advice.]`

---

## 8. Cosa manca e va confermato da Davide

**Da decidere prima di pubblicare (bloccanti):**

1. **Cosa offre il sito.** Solo vetrina di ricerca, oppure gestione, segnali, copy trading, consulenza, vendita di un EA? Il testo attuale non promette nessun servizio. La risposta cambia il testo e gli obblighi legali.
2. **Obblighi legali del suo Paese** per una vetrina pubblica su un portafoglio di trading (diciture, autorizzazioni, comunicazioni promozionali, privacy, cookie). Va verificato con un professionista abilitato: qui non è stato dato nessun parere. Il testo dell'avviso è un punto di partenza sobrio, non una formula legale.
3. **Titolare del sito e nome pubblico.** Nome del progetto (ora provvisorio: Portfolio Algo Manager), nome o ragione sociale, Paese, e se Davide compare con il proprio nome.
4. **Formato dell'indirizzo email:** per il sito si usa solo PORTFOLIOALGOMANAGER21@gmail.com. Confermare come mostrarlo (maiuscole così come scritto, o in minuscolo, più leggibile: le email non distinguono le maiuscole).
5. **Regole dell'oro: sono le stesse?** Le regole di ingresso e uscita dell'oro scritte in pagina (ROTTURA M30 + RITRACCIAMENTO H4, con i parametri 60/480 barre, 2,0 ATR, trailing 4,0 ATR; EMA 30, ritracciamento 1 ATR, buffer 0,10 ATR, trailing 1,5 ATR) vengono dal repo (`docs/CONTINUA-QUI.md`). I numeri vengono dal simulatore. Davide deve confermare che la versione misurata nel simulatore abbia **esattamente** queste regole e questi parametri. Se differiscono anche in un parametro, la scheda dell'oro va corretta prima di pubblicare. Indizio: il simulatore conta 1.123 operazioni sull'oro, lo stesso numero del conto `.s` nel repo, ma la somma in R (184,5) non coincide né con `.p` (191,9) né con `.s` (167,7).

**Dati che nei file non ci sono:**

6. **I costi.** I R del simulatore includono spread, commissioni e swap? Nei file non è scritto. Finché non è confermato, il sito non dice "costi inclusi" (l'avviso sul rischio è stato modificato per questo) e non dà la soglia "a quanti costi il sistema smette di funzionare".
7. **Nasdaq e USDJPY: strumento esatto, orizzonte temporale, tipo di strategia e regole di ingresso/uscita.** Nei file c'è solo il nome del mercato. Le regole "sono descritte nel simulatore": vanno riportate da Davide, o si pubblica la frase di microcopy "non ancora riportate in questa pagina". Nel title si usa "Nasdaq" generico; se lo strumento è un CFD (es. NAS100/USTEC), va detto anche nel glossario.
8. **Perché il fuori campione di USDJPY parte dal 2023** e non dal 2024 come oro e Nasdaq. È una scelta legittima (più fuori campione), ma va spiegata in una riga, altrimenti sembra un'anomalia.
9. **Come è calcolata la correlazione mensile** nel simulatore (Pearson sui R mensili?) e se i tre mesi contati "tutte in perdita" coincidono con quello che vede Davide.
10. **Cifre delle strategie scartate.** Le schede tengono i motivi ma non le cifre della TRAPPOLA (+50 R / −44,9 R), del TSMOM e dell'EMA cross, perché sono della versione precedente. Se Davide vuole rimetterle come racconto storico, vanno etichettate "versione precedente del sistema oro".
11. **Bootstrap a blocchi sulla misura più recente.** Le tre strategie hanno solo il drawdown del backtest in R. Senza il bootstrap, la sezione "Il rischio" resta con un `[DA COMPLETARE]` al centro. Si può fare con `tools/montecarlo.py` partendo dai R del simulatore, se Davide li esporta operazione per operazione.
12. **Plateau per Nasdaq e USDJPY:** i parametri sono stati scelti su una collina o su un picco? Con quale griglia? Senza risposta, il punto 3 del metodo vale dichiaratamente solo per l'oro.
13. **Pesi del portafoglio.** Se Davide vuole una curva unica delle tre strategie, servono i pesi (rischio per operazione per ciascuna). Consiglio: solo in R, con "backtest" nel grafico, e accanto il drawdown.
14. **Risultati live/demo:** nessuno nei file. Stato del demo (iniziato? da quando?), cosa si pubblica, con che cadenza, e il criterio scritto prima per tenere o togliere USDJPY.
15. **Ripartizione ROTTURA / RITRACCIAMENTO** nel simulatore, se Davide la vuole mostrare: il file attuale ha l'oro come blocco unico.
16. **Tempi di risposta alle email** e URL finale del sito (per canonical, sitemap, JSON-LD).

**Scelte di copy da confermare:**

17. **Percentuali annue:** il sito non ne mostra nessuna, di proposito (leggibili come promesse anche se etichettate "backtest"). Si usano R per operazione, somma in R, t, anni migliori e peggiori in R. Confermare.
18. **La conversione "27,5 R ≈ 27% a rischio 1%"** nella sezione rischio è un aiuto alla lettura, non una misura. Se Davide la trova fuorviante, si toglie.
19. **Chiamare per nome il prodotto commerciale d'origine:** il testo non lo fa, di proposito (rischio legale e nessuna utilità per il lettore). Se Davide vuole comunque raccontare l'origine del lavoro, usare una frase generica, senza nome e senza cifre.
20. **Inglese:** confermare se la fase 2 è voluta. Il pubblico estero cambia gli obblighi.

**Non verificato in questo lavoro:**
- Brand Voice e plugin SEO: non attivi in questa sessione, quindi nessun controllo automatico di coerenza o SEO. Lunghezze di title e meta description misurate con uno script (conteggio caratteri). Nessuna verifica del sito reale, che non è ancora costruito.
- I numeri del simulatore non sono stati ricalcolati dalle operazioni: `data/strategie.json` contiene statistiche già pronte e sono state riportate così. Gli unici conteggi fatti qui sono sui risultati mensili (mesi negativi per strategia; mesi in cui perdono o guadagnano tutte e tre).
