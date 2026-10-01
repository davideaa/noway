# DESIGN — Cosmo Hotel Palace

Documento vincolante per chi scrive codice, UX, motion e 3D. Se una regola qui sotto
sembra sbagliata, si segnala all'art director: non si aggira.

Come è stato fatto: ho guardato le sei foto di riferimento in `/tmp/cosmo-ref/` (solo
riferimento, nessuna copiata nel repo) e letto BRIEF e STUDIO. I valori esadecimali sono
**stimati a occhio dalle foto e poi tarati sui contrasti**: non sono colori ufficiali del
cliente (il brief lo dice: logo e colori ufficiali ancora da chiedere). Gli indici di
contrasto sono calcolati con la formula WCAG 2.x, non a occhio.
Strumenti: Figma non è utilizzabile (serve l'autorizzazione del connettore, la sessione non è
interattiva) e la skill `frontend-design` non è tra quelle disponibili: non li ho usati.

---

## 0. Due direzioni valutate

**A — «Casa accesa» (scelta).** Carta sabbia, verde pianta come inchiostro strutturale, un solo
accento color miele che è la luce delle abat-jour. Titoli in un serif morbido, testo in un
grotesco caldo. Tutto è parquet, lino, intonaco, ulivo. Il sito è chiaro di giorno e si
«accende» di sera. Perché: è quello che le foto mostrano davvero (beige, rovere, luce calda
laterale) ed è ospitalità familiare, non vetrina.

**B — «Milano razionale».** Grigio cemento, griglia a filetti visibili, grottesco largo in
maiuscolo, un accento vermiglio. Più "design hotel", più freddo. Scartata: nelle foto il cemento
è caldo e c'è sempre una luce color miele, il vermiglio non esiste da nessuna parte, e
renderebbe l'hotel uguale a cento altri alberghi milanesi di design. Il cemento lisciato resta
come materiale (ristorante, congressi), non come identità.

---

## 1. Idea creativa e tono

**Idea in una frase:** *arrivi da Milano, posi la valigia, accendi la luce: ogni stanza del
Cosmo si illumina quando la guardi.*

Cosa deve far sentire: sollievo e accoglienza, «qui qualcuno si occupa di te», e allo stesso
tempo ordine e precisione (è anche un centro congressi da 900 persone).

**Tono:**
- ospitalità italiana, calda, contemporanea; una famiglia imprenditoriale che ti apre la porta,
  non un concierge in guanti bianchi;
- sicuro ma non pomposo: frasi brevi, concrete, mai «esperienza esclusiva»;
- NON un resort di lusso generico (niente nero e oro, niente serif sottilissimo in maiuscolo,
  niente drone su piscina infinita);
- NON il look di Davide: niente fondo scuro come base, niente lime, niente etichette mono
  tutte maiuscole stile terminale, niente film d'apertura con wormhole. Questo sito è chiaro,
  di carta e di luce calda. Il lime e il `#080b0e` sono vietati qui.

**Simbolo ricorrente (il «segno» del sito):** l'**arco**. Le finestre alte ad arco della sala
ristorante e dei congressi diventano la cornice di ogni diorama, di ogni immagine e dei pannelli.
Secondo segno: il **cerchio di luce** (l'alone della lampada) usato come unico effetto decorativo.

---

## 2. Palette

Tre livelli: primitivi (valori), ruoli (a cosa servono), usi (dove si applicano). Il codice
legge SOLO i ruoli (`--bg`, `--text`...). I primitivi non si usano mai direttamente nei
componenti. I due «mondi» (giorno e sera) hanno gli stessi nomi di ruolo e cambiano valore.

### 2.1 Primitivi

| Famiglia | Token | Esadecimale | Da dove viene |
|---|---|---|---|
| Sabbia (carta, intonaco, lino) | `sabbia-50` | `#FAF6EE` | lenzuola e tende sotto luce |
| | `sabbia-100` | `#F2EBDD` | pareti chiare delle camere |
| | `sabbia-200` | `#E6DAC3` | tende beige, testiere |
| | `sabbia-300` | `#D3C3A3` | intonaco beige delle camere Classic |
| | `sabbia-400` | `#B9A57E` | solo fill e disegni, mai testo |
| Rovere (parquet) | `rovere-300` | `#D8B27C` | listoni al sole |
| | `rovere-500` | `#C08F52` | parquet in ombra media |
| | `rovere-700` | `#8E6232` | tavoli, scrivanie |
| Ulivo (il tronco della hall) | `ulivo-600` | `#8A4F12` | legno del tronco, link |
| | `ulivo-800` | `#5A3A1B` | ombre del tronco |
| Cemento lisciato | `cemento-100` | `#DAD5CB` | pavimento hall |
| | `cemento-300` | `#B9B2A5` | pavimento ristorante |
| | `cemento-500` | `#8C8578` | pilastri, travi |
| Inchiostro (testo, bruno caldo) | `inchiostro-900` | `#2B2218` | testo principale |
| | `inchiostro-700` | `#5E5242` | testo secondario |
| | `inchiostro-500` | `#766850` | testo terziario |
| | `inchiostro-400` | `#8C7B5E` | bordi dei campi |
| Pianta (verde del ficus e dell'ulivo in vaso) | `pianta-900` | `#223626` | pressed/hover del verde |
| | `pianta-800` | `#2C4330` | **colore di marca strutturale** |
| | `pianta-600` | `#4F6B45` | foglie nei diorami |
| | `pianta-300` | `#A9BC95` | foglie chiare, disegni |
| | `pianta-100` | `#DDE5D0` | sfondo di etichette «ok» |
| Miele (luce delle abat-jour) | `miele-300` | `#F7D9A2` | alone, fondo evidenziatori |
| | `miele-400` | `#F7C46B` | hover del pulsante |
| | `miele-500` | `#F0A640` | **accento unico: la luce, l'azione** |
| | `miele-glow` | `#F2B25C` | miele sul fondo sera |
| Sera (la sezione scura) | `sera-950` | `#1C160F` | sfondo sera, espresso caldo |
| | `sera-900` | `#2A2217` | superfici sera |
| | `sera-500` | `#7A6A50` | bordi sera |
| | `sera-200` | `#BFB197` | testo secondario sera |
| | `sera-50` | `#F3E9D6` | testo sera |
| Stati | `errore` | `#A63A22` | argilla, non rosso semaforo |
| | `successo` | `#2F6B3A` | |

Regola dei due accenti: **un solo accento, il miele.** Il verde `pianta-800` è struttura
(testo grande, pulsanti pieni, icone), non accento. Il miele non appare mai come testo su fondo
chiaro (1,9:1: non passa).

### 2.2 Ruoli (modalità chiara = default)

| Ruolo | Valore | Uso |
|---|---|---|
| `--bg` | `sabbia-50` `#FAF6EE` | fondo pagina |
| `--bg-alt` | `sabbia-100` `#F2EBDD` | fasce alternate |
| `--bg-sunk` | `sabbia-200` `#E6DAC3` | campi, riquadri incassati, piante |
| `--surface` | `sabbia-50` `#FAF6EE` | le schede stanno sullo stesso fondo e si distinguono per bordo, non per bianco (niente `#FFFFFF`) |
| `--text` | `inchiostro-900` `#2B2218` | testo |
| `--text-muted` | `inchiostro-700` `#5E5242` | testo secondario |
| `--text-subtle` | `inchiostro-500` `#766850` | didascalie, solo ≥ 14 px su `--bg`/`--bg-alt` |
| `--border` | `sabbia-300` `#D3C3A3` | filetti decorativi (1 px) |
| `--border-strong` | `inchiostro-400` `#8C7B5E` | bordo di campi e controlli (≥ 3:1) |
| `--brand` | `pianta-800` `#2C4330` | pulsante pieno, icone, titoli piccoli |
| `--brand-press` | `pianta-900` `#223626` | hover e pressed del verde |
| `--on-brand` | `sabbia-50` `#FAF6EE` | testo sul verde |
| `--action` | `miele-500` `#F0A640` | pulsante «Prenota» e punti caldi |
| `--action-hover` | `miele-400` `#F7C46B` | |
| `--on-action` | `inchiostro-900` `#2B2218` | testo sul miele |
| `--link` | `ulivo-600` `#8A4F12` | link nel testo, sottolineati |
| `--focus` | `pianta-800` `#2C4330` | anello focus 2 px + offset 2 px |
| `--danger` / `--ok` | `errore` / `successo` | sempre con icona e testo, mai solo colore |

### 2.3 Sera (sezione scura, non tutta la pagina)

Si applica con `data-tono="sera"` su una sezione o su un diorama. Stessi nomi di ruolo:

| Ruolo | Valore |
|---|---|
| `--bg` | `sera-950` `#1C160F` |
| `--bg-alt` / `--surface` | `sera-900` `#2A2217` |
| `--text` | `sera-50` `#F3E9D6` |
| `--text-muted` | `sera-200` `#BFB197` |
| `--border` | `#3A3022` (decorativo) |
| `--border-strong` | `sera-500` `#7A6A50` |
| `--brand` | `sera-50` (il verde sparisce, il testo chiaro prende il suo posto) |
| `--action` | `miele-glow` `#F2B25C`, testo sopra `inchiostro-900` |
| `--link` | `miele-glow` |
| `--focus` | `miele-glow` |

**Dove c'è la sera:** (1) la sezione *Cosmo Grill & Lounge* e il piede del sito; (2) ogni
diorama quando l'utente porta il cursore giorno→sera; (3) lo sfondo del pannello prenotazione
**mai**: la prenotazione è sempre chiara, per leggibilità. La transizione giorno→sera è un
crossfade di 600 ms sulla sola sezione, non sull'intera pagina.

### 2.4 Contrasti dichiarati (WCAG 2.x, calcolati)

Soglie: testo normale ≥ 4,5:1 (AA), testo grande (≥ 24 px o ≥ 19 px grassetto) ≥ 3:1,
componenti non testuali ≥ 3:1.

| Coppia (testo / sfondo) | Rapporto | Esito |
|---|---|---|
| `--text` `#2B2218` su `--bg` `#FAF6EE` | 14,49 | AAA |
| `--text` su `--bg-alt` `#F2EBDD` | 13,16 | AAA |
| `--text` su `--bg-sunk` `#E6DAC3` | 11,29 | AAA |
| `--text-muted` `#5E5242` su `--bg` | 7,05 | AAA |
| `--text-muted` su `--bg-sunk` | 5,50 | AA |
| `--text-subtle` `#766850` su `--bg` | 5,04 | AA |
| `--text-subtle` su `--bg-alt` | 4,58 | AA (limite: non usarlo su `--bg-sunk`) |
| `--on-brand` `#FAF6EE` su `--brand` `#2C4330` | 9,98 | AAA |
| `--on-brand` su `--brand-press` `#223626` | 12,00 | AAA |
| `--on-action` `#2B2218` su `--action` `#F0A640` | 7,61 | AAA |
| `--on-action` su `--action-hover` `#F7C46B` | 9,71 | AAA |
| `--link` `#8A4F12` su `--bg` | 6,07 | AA |
| `--link` su `--bg-sunk` | 4,73 | AA |
| `--brand` su `--bg-sunk` (icone/titoli) | 7,77 | AAA |
| `errore` `#A63A22` su `--bg` | 5,99 | AA |
| `successo` `#2F6B3A` su `--bg` | 5,93 | AA |
| `--border-strong` `#8C7B5E` su `--bg` (componente) | 3,81 | ≥ 3 ok |
| Sera: `--text` `#F3E9D6` su `#1C160F` | 14,89 | AAA |
| Sera: `--text` su `#2A2217` | 13,02 | AAA |
| Sera: `--text-muted` `#BFB197` su `#1C160F` | 8,50 | AAA |
| Sera: `--text-muted` su `#2A2217` | 7,43 | AAA |
| Sera: `miele-glow` `#F2B25C` su `#1C160F` | 9,65 | AAA |
| Sera: `--border-strong` `#7A6A50` su `#1C160F` | 3,42 | ≥ 3 ok |
| `miele-500` su `--bg` (solo componente, mai testo) | 1,90 | NON passa: sempre con bordo `inchiostro-900` 2 px |

**Testo su immagine/diorama:** mai direttamente. Sempre su un pannello pieno `--bg` o
`sera-950` all'88% o più, oppure su una fascia sfumata `sera-950` 0→80% di almeno 40% dell'altezza,
con contrasto del testo ≥ 4,5:1 verificato sul punto peggiore (la zona più chiara dietro). Se il
diorama cambia luce (slider giorno/sera) il testo non cambia.

---

## 3. Tipografia

Due famiglie, entrambe Google Fonts, caricate con `next/font/google` (self-hosting
automatico, niente richieste a Google a runtime), `display: swap`, solo subset `latin`.

| Ruolo | Famiglia | Perché |
|---|---|---|
| Titoli | **Fraunces** (variabile; assi `opsz`, `SOFT`; `WONK` 0) | serif morbido con terminali tondi: ricorda i contorni dell'ulivo e le pieghe dei paralumi; più caldo e meno «lusso freddo» di un Didone o di un Cormorant |
| Testo ed etichette | **Hanken Grotesk** (variabile 400–700) | grottesco neutro e caldo, ottime cifre (orari, m², capienze), accenti italiani corretti |

Impostazioni di Fraunces: `font-variation-settings: "SOFT" 60, "WONK" 0;` e `font-optical-sizing: auto`.
Corsivo di Fraunces SOLO per una parola per titolo al massimo (es. *ulivo*): carica il solo
file corsivo se serve. Budget font totale: **≤ 180 KB woff2** (se Fraunces con assi supera,
rimuovere `SOFT` fisso a 60 e usare l'istanza statica 400/500).

### 3.1 Scala fluida (360 → 1440 px)

| Token | `clamp()` | A 390 px | A 1440 px | Peso | Interlinea | Tracking |
|---|---|---|---|---|---|---|
| `--t-display` | `clamp(2.75rem, 1.6rem + 5.6vw, 6.5rem)` | ≈ 47 px | 104 px | Fraunces 400 | 1,02 | −0,02em |
| `--t-h1` | `clamp(2.25rem, 1.5rem + 3.4vw, 4.5rem)` | ≈ 37 px | 72 px | Fraunces 400 | 1,06 | −0,015em |
| `--t-h2` | `clamp(1.75rem, 1.3rem + 2vw, 3rem)` | ≈ 29 px | 48 px | Fraunces 400 | 1,12 | −0,01em |
| `--t-h3` | `clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)` | ≈ 24 px | 28 px | Fraunces 500 | 1,2 | 0 |
| `--t-lead` | `clamp(1.125rem, 1.07rem + 0.25vw, 1.25rem)` | 18 px | 20 px | Hanken 400 | 1,5 | 0 |
| `--t-body` | `1rem` | 16 px | 16 px | Hanken 400 | 1,55 | 0 |
| `--t-small` | `0.875rem` | 14 px | 14 px | Hanken 400 | 1,45 | +0,005em |
| `--t-label` | `0.75rem` | 12 px | 12 px | Hanken 600, **maiuscoletto** (`text-transform: uppercase`) | 1,3 | +0,12em |
| `--t-num` | `clamp(2.5rem, 1.8rem + 3vw, 4rem)` | ≈ 40 px | 64 px | Fraunces 400, cifre tabulari (`tnum`) | 1 | −0,02em |

Regole:
- il corpo del testo non scende sotto 16 px (anche per evitare lo zoom automatico di iOS nei campi);
- l'etichetta `label` solo per 1–3 parole (es. «PIANO TERRA»), mai per frasi;
- lunghezza riga 60–72 caratteri (`max-width: 65ch`) nei paragrafi;
- titoli a sinistra, mai centrati su più di due righe; allineamento centrato solo per un
  numero o una frase corta;
- nessuna maiuscola completa nei titoli; nessun titolo in grassetto sopra 500;
- numeri veri (m², posti, 201) in `--t-num`: sono il «volto» del sito, perché sono i fatti.

---

## 4. Griglia, spazi, forme

### 4.1 Griglia

| Larghezza | Colonne | Margine laterale | Gutter | Contenitore |
|---|---|---|---|---|
| < 600 px | 4 | 16 px (+ `env(safe-area-inset-*)`) | 16 px | fluido |
| 600–1023 px | 8 | 32 px | 24 px | fluido |
| ≥ 1024 px | 12 | 48 px | 24 px | max 1280 px centrato; diorami e fasce a tutta larghezza |

Breakpoint: 600 · 1024 · 1440. Niente layout che richiede scroll orizzontale della pagina.
La griglia è **asimmetrica di proposito**: testo su 5–6 colonne, diorama su 7–8, e il diorama
sfonda il margine di un lato. Vietate tre colonne identiche di feature.

### 4.2 Spaziatura (scala a passi fissi, base 4 px)

`--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 24 · `--s-6` 32 · `--s-7` 48 ·
`--s-8` 64 · `--s-9` 96 · `--s-10` 144.
Padding verticale di sezione: `--s-8` su telefono, `--s-9` tablet, `--s-10` desktop. Niente
valori fuori scala (nessun 10, 18, 22 px).

### 4.3 Raggi

| Token | Valore | Uso |
|---|---|---|
| `--r-1` | 4 px | chip, tag, campi piccoli |
| `--r-2` | 10 px | campi, pulsanti (non pillola: il pulsante è «rettangolo morbido») |
| `--r-3` | 20 px | pannelli, schede |
| `--r-arco` | `999px 999px 0 0` | **cornice ad arco**: diorami, immagini, pannello camera |
| `--r-pill` | 999 px | solo hotspot, chip filtro, pillola «Prenota» mobile |

### 4.4 Ombre e bordi

Il sito è quasi piatto: si separa con **bordi e fondi alternati**, non con ombre.
- `--sh-1` (solo pannelli flottanti: barra prenotazione, tooltip hotspot):
  `0 1px 0 rgba(43,34,24,.06), 0 8px 24px -8px rgba(43,34,24,.22)`: ombra color inchiostro, mai nera pura.
- `--sh-2` (solo il bottom sheet su telefono): `0 -12px 32px -12px rgba(43,34,24,.28)`.
- Nessun'altra ombra. Nessuna ombra su più di 2 elementi visibili insieme.
- Bordi: `1px solid var(--border)` (decorativi), `1.5px solid var(--border-strong)` (campi),
  `2px` per focus. Filetti sottili (1 px `--border`) per dividere sezioni: sono la «linea di luce»
  del sito.

### 4.5 Componenti chiave

**Pulsanti** (altezza minima 48 px, area tocco ≥ 44×44; padding orizzontale `--s-5`; `--r-2`;
Hanken 600 16 px, tracking +0,01em)
- *Primario «Prenota»*: fondo `--action`, testo `--on-action`, bordo 0; hover `--action-hover`;
  pressed: scala 0,98 e `miele-500` +8% più scuro. **Uno solo per schermata visibile.** È l'unico
  elemento miele pieno della pagina: così il miele resta «la luce» e non una decorazione.
- *Pieno verde*: fondo `--brand`, testo `--on-brand`: azioni importanti ma non di prenotazione
  («Richiedi proposta», «Scopri la camera»).
- *Contorno*: bordo 1.5 px `--text`, testo `--text`, fondo trasparente; hover riempie `--bg-sunk`.
- *Testo con freccia*: link sottolineato 1.5 px `--link`, offset 4 px.
- Stato disabilitato: fondo `--bg-sunk`, testo `--text-subtle`, nessun miele; mai solo opacità.
- Nessun riflesso di luce o magnetismo sui pulsanti (quello è lo stile del portfolio di Davide).

**Chip** (scelte «Coppia / Famiglia / Lavoro», filtri sala, giorno/sera): altezza 40 px (area di
tocco 44 con margine), `--r-pill`, bordo `--border-strong`; selezionato: fondo `--brand`, testo
`--on-brand`, con **icona di spunta** (non solo colore). Gruppo = `radiogroup` con frecce da tastiera.

**Schede camera** (non tutte uguali!)
- Tre tipi, tre forme: *Classic* arco stretto e alto (portrait), *Suite* arco largo (landscape)
  che occupa più colonne, *Family* due archi affiancati (le due camere comunicanti, a ricordo
  della pianta). Dentro ogni arco, il diorama.
- Struttura: arco col diorama · nome in `--t-h3` · m² in `--t-num` · 3 dati veri
  (letti, ospiti, bagni) come testo con icona 24 px · «Esplora la camera» (verde pieno) +
  «Prenota» solo nella barra, non in ogni scheda.
- Niente ombra, niente bianco puro: bordo `--border`, fondo `--bg`.
- Sul telefono: una scheda per volta, snap orizzontale con la successiva che spunta per 12%.

**Barra prenotazione**
- *Desktop (≥ 1024):* barra fissa in basso al centro, larghezza `min(960px, 100% - 96px)`,
  altezza 72 px, `--sh-1`, fondo `--bg`, `--r-3`. Campi: Arrivo · Partenza · Camere · Adulti ·
  Bambini + pulsante «Cerca» (miele). Compare dopo l'hero (non sopra: lì c'è già il CTA grande).
- *Telefono:* niente barra. Pillola fissa «Prenota» 56 px in basso a destra
  (`bottom: max(16px, env(safe-area-inset-bottom))`) che apre un **bottom sheet** a tutta
  larghezza, altezza ≤ 88 dvh, `--sh-2`, `--r-3` in alto, handle di 40×4 px. Campi da 48 px,
  font 16 px. Sempre su fondo chiaro.
- Le date e i campi sono controlli nativi o ARIA corretti; il «Cerca» apre il motore
  VerticalBooking in nuova scheda con i valori scelti (come da BRIEF). Nessun prezzo mostrato.
- Dietro la barra, mai `backdrop-filter` (regola dei telefoni): fondo pieno.

**Hotspot 3D**
- Sono **bottoni HTML** posizionati dalla proiezione della scena, non oggetti del canvas:
  accessibili da tastiera e screen reader (`<button aria-label="Letto matrimoniale 160 cm">`).
- Aspetto: punto da 14 px `miele-500` con bordo 2 px `inchiostro-900` e alone `miele-300`;
  area di tocco 44×44 px. Su tono sera: bordo `sera-950`, alone `miele-glow` 30%.
- Al tocco: pillola-etichetta (`--r-pill`, fondo `--bg`, `--sh-1`) con 1 riga (nome) + 1 riga
  (dato vero); mai più di un'etichetta aperta alla volta.
- Pulsazione: 1 ciclo di 1,6 s all'ingresso nella vista, poi fermo. Con `prefers-reduced-motion`:
  nessuna pulsazione.
- Ogni diorama ha anche l'**elenco testuale** equivalente degli hotspot sotto o a lato (per
  tastiera, lettori di schermo e per chi non carica il 3D).

---

## 5. Diorami 3D (camere, hall, ristorante, sala congressi)

### 5.1 Decisione: «morbido stilizzato», non realistico

**Stile scelto: stilizzato materico a poligoni morbidi** (aspetto di plastilina e carta
colorata ben illuminata): volumi semplici con **smussi da 1–3 cm** che catturano la luce,
normali lisce, colori piatti ma non uniformi (variazione di tono per vertice), niente
texture fotografiche, niente riflessi.

Perché:
1. **iPhone.** Safari chiude la pagina per memoria grafica (lezione del portfolio). Una scena
   fotorealistica chiede texture PBR da 2K e ombre in tempo reale: impossibile da tenere a 48+ fps
   su telefono medio, e il realismo a metà finisce nella «valle del perturbante».
2. **Verità.** Non abbiamo foto utilizzabili né il rilievo: un modello «fotografico» sarebbe una
   copia imprecisa. Uno stilizzato dichiara di essere una ricostruzione e non promette dettagli
   che non conosciamo (il numero di cuscini non è un dato).
3. **Identità.** Una casa da bambola illuminata è in linea con «casa accesa» e distingue il sito
   dai 3D finto-realistici. La coerenza con le illustrazioni 2D (§6) è totale.
4. **Fatti veri nei volumi:** le dimensioni (22 m², 44 m², 25×20 m, h 4,22 m, 13 sale, platea
   500) sono **in scala vera**; i dettagli decorativi no. Il sito non inventa niente: dove una
   cosa è ricostruita a occhio dalle foto (poltroncina, stampe) resta generica.

### 5.2 Palette dei materiali (colore base, sRGB)

| Materiale | Colore | Note |
|---|---|---|
| Parquet rovere | `#C99A5B` (varia ±6% per listone, 12 toni) | listoni larghi 9 cm, giunti con una trama 256² tileabile |
| Lino/lenzuola | `#F4EFE6` | + cuscini `#9B9283` (grigio-tortora) |
| Intonaco camere | `#D9CBB0` (sera: `#6B5D47`) | pareti con gradiente di occlusione agli angoli |
| Testiere/pouf | `#C8B896` | imbottito, smusso 3 cm |
| Tende | `#CBB892` pesante + velo `#F2ECDD` (alpha 0,55) | massimo 4 piani trasparenti per scena |
| Ottone/metallo caldo | `#B8923F` | tiranti, piedi dei tavolini; nessuna riflessione |
| Alluminio forato (sedie ristorante) | `#B9BDBE` | sedia: 120 triangoli |
| Cemento lisciato | `#BDB6A8` (hall `#DAD5CB`) | con leggera nuvola di tono |
| Pilastri ristorante | `#6B5642` | bruno scuro opaco |
| Pilastri sala congressi | `#C9A862` | colore oro/travertino delle foto |
| Moquette sala | `#C9BCA3` | sedie `#D2BEA8` |
| Tronco d'ulivo | `#8A4F12` → `#5A3A1B` | gradiente per vertice, 6–8k triangoli, il pezzo più «scolpito» |
| Foglie | `#4F6B45` / `#A9BC95` | ficus e ulivi in vaso: 6–10 piani-foglia sagomati |
| Paralume | `#F2C27A` | emissivo; pieghe in 12 lati |
| Vetro/lucernario | trasparente `#DCE9EE` alpha 0,25 | 1 solo materiale di vetro per scena |

### 5.3 Luci (nessuna ombra in tempo reale)

- **Key calda:** 1 luce direzionale `#FFD9A0`, intensità 1,6, angolo basso (come il sole
  d'angolo nella hall). Nessuna shadow map.
- **Riempimento:** `HemisphereLight` cielo `#E8EEF2`, terra `#C9A878`, intensità 0,7.
- **Lampade (le abat-jour):** nessuna luce reale. Materiale emissivo `#F2C27A` + uno
  *sprite* additivo a gradiente radiale (256², condiviso) con raggio ≈ 90 cm: l'«alone». In più
  1 PointLight `#FFB867` solo nelle scene in cui serve davvero a illuminare il letto; massimo 2
  luci reali + 1 emisferica per scena.
- **Giorno→sera (slider):** si interpolano solo tre valori: colore/intensità della key
  (alba `#FFC89A` → giorno `#FFF1DC` → sera `#FFB867` a intensità 0,5), colore dell'emissivo
  della finestra (cielo → `#3A4A66`), e opacità degli aloni delle lampade (0 → 1). Zero ricalcoli
  di geometria. In «sera» le pareti usano la variante scura dell'intonaco.
- **Vietato:** HDRI / environment map, bloom a schermo intero (post-processing), riflessioni.

### 5.4 Ombre finte

- **Contact shadows:** un quad piatto sotto ogni oggetto appoggiato (letto, tavoli, sedie
  raggruppate in un'unica ombra per fila) con **una sola texture 128×128** a gradiente radiale,
  colore `#3A2A18` alpha 0,35, sfumata 20–30 cm oltre l'ingombro. Si può muovere un po' con la
  key per «seguire» la luce (spostamento 2 cm), niente di più.
- **Occlusione ambientale cotta nei vertici** (colore del vertice scurito agli angoli muro-
  pavimento, sotto il letto, dietro le tende): niente texture di lightmap.
- **Raggio di sole del lucernario nella hall:** 1 piano inclinato con texture a strisce 256×64
  additivo, opacità 0,18, non ombra.

### 5.5 Budget (per diorama; vale come limite, non obiettivo)

| Voce | Camera | Hall (hero) | Ristorante | Sala congressi |
|---|---|---|---|---|
| Triangoli totali | ≤ 30.000 | ≤ 60.000 | ≤ 45.000 | ≤ 50.000 |
| Draw call | ≤ 40 | ≤ 60 | ≤ 50 | ≤ 40 (sedie/tavoli **instanziati**) |
| Texture | ≤ 3 | ≤ 4 | ≤ 4 | ≤ 3 |
| Lato max texture | 1024 (1 sola) + resto ≤ 512 | 1024 (2 al massimo) | 1024 | 512 |
| Memoria GPU texture | ≤ 12 MB | ≤ 16 MB | ≤ 14 MB | ≤ 8 MB |
| Download aggiuntivo | ≤ 250 KB | ≤ 400 KB | ≤ 300 KB | ≤ 200 KB |

Regole comuni:
- **Geometria procedurale in codice** (box smussati, estrusioni, cilindri, rivoluzioni):
  niente `.glb` salvo il tronco d'ulivo; se si usa un `.glb`, compresso con meshopt/Draco,
  ≤ 300 KB, texture KTX2/WebP.
- **Sedie della sala (fino a 500):** `InstancedMesh`, sedia da ≤ 64 triangoli (come blocco
  smussato con spalliera), una draw call. Quando cambia la disposizione, si animano solo le
  matrici (transform), non si ricreano le geometrie.
- Materiali `MeshLambertMaterial` o `MeshBasicMaterial` con colori per vertice. `MeshStandardMaterial`
  solo per ≤ 3 oggetti-eroe (tronco d'ulivo, ottone) e solo su desktop.
- **DPR:** massimo 1,5 sul telefono, 2 su desktop; canvas mai oltre 1,3 megapixel sul telefono.
  `antialias` attivo solo se DPR < 1,5.
- **Un solo canvas WebGL vivo per volta** (iOS ha limiti stretti sui contesti): quando la sezione
  esce dalla vista (IntersectionObserver) il canvas si smonta o si ferma; quando rientra si
  riprende. `frameloop="demand"` quando nessuno anima o trascina.
- **Qualità adattiva:** si parte da «media» (DPR 1,5 sul telefono), si scende di un gradino
  (1,25 → 1,0) **solo** se la misura scende sotto 48 fps per 1 s continuo. Mai partire in «lite»:
  Davide lo trova lento. Prima del primo frame, un **poster SVG/CSS** della stessa scena
  (stesso punto di vista, stesse tinte) evita il vuoto e fa da ripiego senza WebGL.
- Telecamera: prospettica a 35–40° di FOV (non grandangolo), orbita limitata (±35° orizzontale,
  10°–35° verticale), zoom bloccato, inerzia con smorzamento: nessuna rotazione infinita.
- Con `prefers-reduced-motion`: niente auto-rotazione, niente transizioni tra camere
  automatiche; l'orbita resta a richiesta dell'utente.

---

## 6. Immagini, illustrazioni, icone

**Niente foto stock. Niente foto del sito vecchio** (decisione già presa nel BRIEF). Se in futuro
il cliente fornisce foto con licenza, si aggiungono in cornici ad arco, con didascalia e
trattamento colore neutro, senza filtri.

- **Pianta e sezioni in scala vera:** disegni SVG a tratto 1,5 px `--text`, riempimenti
  `sabbia-200`/`sabbia-300`, quote scritte in Hanken 12 px. Le misure dichiarate (22 m², 44 m²,
  25×20 m, h 4,22 m) compaiono sulle piante; si disegna solo ciò che il brief sa (ad es. la
  Family = due Classic comunicanti).
- **Illustrazioni (ambienti, ritratti di dettaglio):** stesso linguaggio dei diorami: forme
  piatte arrotondate, 5–6 colori dalla palette, un solo punto di luce miele, tratto interno
  assente o solo 1 px `ulivo-800`. Soggetti consentiti: il tronco d'ulivo, il lucernario, una
  abat-jour, una sedia in alluminio forato, il tram 31. Non servono persone; se ci sono, di
  schiena e senza volto.
- **Stampe incorniciate (quadretti nelle camere):** pattern astratti generati (cerchi, rami,
  linee) in `sabbia-400` e `ulivo-600`: niente riproduzioni di opere reali.
- **Icone:** set proprio, griglia 24 px, tratto 1,5 px, terminali e giunzioni arrotondati,
  angoli interni a 2 px, solo `currentColor`. Circa 24 icone: letto, bagno (vasca/doccia),
  scrivania, Wi-Fi, TV, clima, cassaforte, caffè, parcheggio, accessibilità, sauna, bagno turco,
  fitness, tram, metro, aereo, treno, auto, telefono, mail, orologio, mappa, calendario, persone.
  Provvisoriamente si può usare Lucide (licenza ISC) a `strokeWidth={1.5}` finché il set proprio
  non c'è: da segnalare nel codice, e mai emoji.
- **Sfondi:** nessun gradiente. Fondi pieni sabbia; al massimo una **macchia di luce** (un cerchio
  radiale `miele-300` al 35% → trasparente, raggio 60–80 vw) per sezione, statica.
  Niente rumore/grana a tutto schermo (costa un layer composito).
- Testi alternativi (`alt`) descrittivi in italiano per ogni illustrazione e diorama.

---

## 7. Movimento (indirizzi per il motion designer)

- Durate: micro 160 ms (hover, press) · transizioni 240 ms · ingressi 480 ms · scena/sera 600 ms ·
  massimo assoluto 800 ms (esclusi i movimenti legati allo scroll).
- Easing: ingresso `cubic-bezier(.2,.7,.2,1)`; uscita `cubic-bezier(.4,0,1,1)`; nessun rimbalzo
  elastico, nessuno «spring» visibile.
- Si anima solo `transform` e `opacity` (più il colore dell'emissivo e delle luci nel 3D).
  Mai `width/height/top/left` né filtri (`blur`) né `backdrop-filter` su touch.
- **NON si anima:** il testo del corpo (appare con fade 240 ms al massimo, mai per lettera),
  il pulsante «Prenota» e la barra prenotazione, i campi del modulo, le capienze nella tabella
  sale, qualsiasi cosa che l'utente sta leggendo o compilando.
- Il movimento con lo scroll serve a **mostrare l'hotel** (entrare nella hall, passare alle
  camere, la giornata al ristorante), non a decorare. Ogni valore di scena = funzione pura di un
  solo numero `p` 0→1 (regola dei film di Davide, vale qui).
- `prefers-reduced-motion`: niente parallasse, niente pulsazioni; le sezioni compaiono già
  nel loro stato finale; la sera scatta con crossfade di 200 ms.
- Niente cursore personalizzato (nell'hotel è inutile e sul telefono non esiste).
- Niente pre-loader a tutta pagina: il poster SVG compare subito.

---

## 8. Regole d'oro: cosa NON fare (vincolanti)

1. **Niente gradienti viola/blu/neon**, né su fondo bianco né su scuro. Gradienti ammessi solo
   come fascia di scurimento sotto il testo su diorama (§2.4) e l'alone radiale miele.
2. **Niente carte tutte uguali con ombra morbida** e niente righe di tre «feature» identiche
   con icona-cerchio-titolo-testo. Le schede camera hanno forme diverse (§4.5); i fatti si
   mostrano come numeri grandi e piante, non come griglia di card.
3. **Niente testo direttamente su immagine o diorama** senza pannello pieno o fascia con
   contrasto ≥ 4,5:1 verificato (§2.4). Niente testo che si muove su una scena 3D.
4. **Niente nero e oro «lusso»**, niente serif in maiuscolo sottilissimo, niente effetto
   «spa» (pietre, bambù, onde). È un hotel italiano familiare vicino a Milano, non un resort.
5. **Niente lime, niente fondo `#080b0e`, niente tipografia mono maiuscola, niente film
   wormhole**: sono il portfolio di Davide. Qui il fondo base è sabbia.
6. **Niente emoji al posto delle icone** e niente icone di librerie diverse mescolate.
7. **Niente stelle, punteggi, premi, recensioni, percentuali di soddisfazione, prezzi, «ultime
   camere disponibili» o contatori di scarsità**: sono vietati dal BRIEF (dati inventati).
   Vale anche per «migliori tariffe garantite»: solo se il cliente lo conferma.
8. **Niente `backdrop-filter`, niente `will-change` diffuso, niente più di un canvas WebGL
   attivo**, niente WebGL fuori dalla vista (lezioni iPhone del STUDIO).
9. **Niente foto stock, niente foto del sito vecchio, niente immagini «generate» che
   imitano foto**: il linguaggio è un solo, il diorama/illustrazione.
10. **Niente più di un pulsante miele pieno per schermata** e niente miele come testo su fondo
    chiaro (1,9:1). Il miele è la luce: se è dappertutto non illumina niente.
11. **Niente informazioni solo nel colore o solo nell'hover**: ogni stato ha icona o testo; ogni
    interazione 3D ha un equivalente testuale e da tastiera.
12. **Niente carosello automatico e niente scroll-jacking che blocchi l'utente**: lo scroll
    è sempre quello nativo; ogni sequenza animata si può saltare e rivedere.
13. **Niente carattere sotto 12 px, niente corpo sotto 16 px, niente area di tocco sotto
    44×44 px**.

---

## 9. Pagina «mood»: tre riferimenti verificati

**Come li ho verificati:** ho letto la scheda di ciascun sito su Awwwards (riconoscimento, data,
studio, palette e tecnologie dichiarati). **Non ho aperto né visto i siti stessi**: quindi
descrivo con certezza solo ciò che è scritto nelle schede, e segno separatamente la mia
inferenza. Tutti e tre sono *Site of the Day* nel 2026.

1. **Explore Primland** — explore.ownprimland.com. Awwwards Site of the Day, 4 febbraio 2026,
   voto 7,35. Realizzato da Outpost con Ingamana e altri. Palette dichiarata: verde bosco
   `#456A4B` e crema `#FFFBE7`. Elementi 3D e WebGL con asset fatti in Blender, GSAP, commutatore
   di stagioni che cambia la scena e mappa interattiva. Categorie: hotel/ristorazione, lusso,
   storytelling, 3D.
   *Cosa prendere:* l'idea di un ambiente 3D che **cambia luce con un solo controllo**
   (il nostro giorno→sera) e la palette a due colori caldi. *Cosa NON prendere:* la portata
   (è un'intera proprietà all'aperto; noi abbiamo quattro stanze, quindi budget molto più
   piccoli).
2. **Son Daven** — sondaven.com. Awwwards Site of the Day, 5 giugno 2026, voto 7,62 (creatività
   8,15). Studio The First The Last. Destinazione nei Carpazi che fonde cultura locale,
   architettura contemporanea e ospitalità. Palette dichiarata: taupe caldo `#A89474` e bruno
   scuro `#2C2824`. Webflow, GSAP e WebGL; layout con illustrazioni e informazioni, microinterazioni,
   scorrimento narrativo.
   *Cosa prendere:* **taupe/sabbia caldo come colore base** di un sito di ospitalità e
   l'abbinamento illustrazione + informazione (le nostre piante in scala). *Cosa NON prendere:*
   il fondo scuro come base e il tono da «destinazione esclusiva».
3. **White Desert** — white-desert.com. Awwwards Site of the Day, 11 settembre 2026, voto 7,31
   (contenuto 7,74; Developer Award). Studio Malvah. Compagnia di spedizioni di lusso in
   Antartide. Palette dichiarata: blu notte `#1F2A44` e crema `#E9E7E1`. Next.js, GSAP,
   Contentful; gallerie video, pagine di itinerario, schede dei campi, menu animato.
   *Cosa prendere:* **ordine e chiarezza di un prodotto complesso** (itinerari, campi,
   alloggi) con una palette ridottissima: lo stesso problema del nostro configuratore sale e
   delle camere. È anche lo stack che usiamo (Next.js). *Cosa NON prendere:* il registro
   «spedizione di lusso» e la fotografia drammatica.

**Inferenza mia, non verificata:** che i tre usino spazi vuoti generosi e poche famiglie di
colore; la scheda Awwwards non lo dice, e non ho visto le pagine. Se serve, un controllo con
screenshot dei tre siti è un passo da fare prima di fissare il motion.

**Un riferimento negativo da chiedere a Davide:** il brief chiede 2–3 riferimenti che gli
piacciono e uno che detesta. Non li ho: i due da chiedere sono questi. Finché non rispondono,
il «no» di default è il look scuro/lime del suo portfolio, che qui è vietato (§1 e §8).

---

## 10. Decisioni da portare agli altri agenti

- **UX/copy:** i fatti si mostrano come numeri grandi e piante (`--t-num`), non come card; ogni
  diorama ha lista testuale degli hotspot; il pulsante miele è uno per schermata.
- **Motion:** durate 160/240/480/600, easing unico; si anima transform/opacity; niente cursore
  speciale, niente loader; il «giorno→sera» è lo spettacolo principale, il resto è sobrio.
- **Frontend:** token a tre livelli in CSS custom properties, solo i ruoli nei componenti;
  `data-tono="sera"` per la sezione scura; font via `next/font`; `clamp()` della scala §3.1.
- **3D:** stilizzato morbido, geometria procedurale, budget §5.5, un canvas vivo per volta,
  niente ombre in tempo reale, poster SVG come ripiego.
- **QA:** verificare i contrasti §2.4 sui valori reali, test su iPhone reale, misurare fps
  (soglia 48) e aree di tocco ≥ 44 px.
- **Aperto con Davide/cliente:** logo e colori ufficiali (il verde `#2C4330` e il miele
  `#F0A640` si adattano), orari di ristorante e lounge, riferimenti graditi/detestati.
