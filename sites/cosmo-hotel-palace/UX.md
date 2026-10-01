# UX — Cosmo Hotel Palace

Per chi costruisce il frontend (Next.js 16, export statico). Rispetta `DESIGN.md` (colori, font, forme, budget 3D) e usa i testi di `COPY.md`. Dove un testo manca, qui è scritto `NUOVO TESTO`: va passato al copy prima della pubblicazione. Dove ho cambiato qualcosa rispetto a COPY o DESIGN, è nella sezione 15, con la ragione.

Come è stato fatto: ho letto BRIEF, DESIGN e COPY per intero, il codice del widget di prenotazione del sito vecchio (`/tmp/cosmo-ref/home.html` e lo script `bundle.js` che ne costruisce il link) e la guida all'export statico di Next in `node_modules/next/dist/docs`. Non ho potuto aprire il motore VerticalBooking (sezione 6.6). Non ho usato Axe, il plugin Design né `design-skills`: non sono disponibili in questa sessione. Figma richiede autorizzazione. Nessuna schermata è stata provata: questo è un progetto, non un test.

---

## 0. Le decisioni in breve

1. Una sola azione principale per pagina (tabella 1). Il miele pieno è solo «Cerca disponibilità» (hero, barra, pannello, pagina Prenota). Tutti gli altri pulsanti importanti sono verdi.
2. Pagine vere: Home, Camere (hub + 3 pagine), Prenota, Ristorazione, Wellness, Centro Congressi, Come arrivare, Contatti, Privacy, 404. Dintorni, FAQ, Partner, Richiesta di proposta come pagina e inglese vengono dopo.
3. Il telefono è il progetto. Il desktop aggiunge: barra di prenotazione, due colonne, scorrimento legato alla camera nella hall.
4. Il 3D è sempre un di più. Ogni scena ha un poster SVG, una lista di testo equivalente e un uso senza JavaScript. Il testo (h1) è sempre l'elemento più grande caricato per primo, mai il canvas.
5. Un solo canvas WebGL vivo per volta. La home ne usa due (hall, ristorante) in momenti diversi. Le altre scene vivono nelle loro pagine.
6. Prenotazione: finestra propria, link vero (`<a target="_blank">`) costruito dai dati. I nomi dei parametri vengono dal codice del sito vecchio. Non sono provati sul motore vivo.
7. Il consigliere «Chi viaggia?», il confronto e la scelta camera non cambiano ciò che il motore mostra: preimpostano solo gli ospiti. Lo diciamo all'utente.
8. Il configuratore sale usa solo i numeri della tabella (sezione 15 di COPY). Dove una disposizione manca, il chip resta visibile con la ragione. Le pareti mobili hanno due soli stati (unita / divisa nel massimo dichiarato), senza capienze inventate per le parti.
9. Il modulo «Richiesta di proposta» non finge di inviare: apre una email precompilata e offre «Copia il testo».
10. Nessuna pinza per lo zoom nel 3D (resta lo zoom del browser). Rotazione con trascinamento, con pulsanti ◀ ▶ e frecce da tastiera.

---

## 1. Obiettivo del sito e azione principale per pagina

**Obiettivo del sito:** far capire in meno di un minuto che il Cosmo è un hotel vero, a 2 km da Milano, con camere per ogni viaggio e un Centro Congressi da 900 persone. Poi portare chi vuole dormire al motore di prenotazione, e chi vuole organizzare un evento alla richiesta di proposta.

Due tipi di visitatore, due uscite: **«Cerca disponibilità»** (viaggiatore) e **«Richiedi una proposta»** (organizzatore di eventi).

| Pagina | Domanda dell'utente | Azione principale (una sola) | Azioni secondarie |
|---|---|---|---|
| `/` Home | Che hotel è? Fa per me? | Cerca disponibilità | Esplora l'hotel (scorre), Vedi le camere, Scopri il Centro Congressi |
| `/camere/` | Quale camera mi serve? | Vedi la camera consigliata (dal consigliere) o scegline una | Confronta le tre |
| `/camere/{tipo}/` | Com'è questa camera? | Cerca la {camera} (apre la prenotazione) | Chiedi all'Ufficio Prenotazioni, Pianta, confronto |
| `/prenota/` | Come prenoto? | Cerca disponibilità | Chiama, Scrivi |
| `/ristorazione/` | Posso cenare lì? | Prenota un tavolo (chiama o scrivi) | Organizza un evento |
| `/wellness/` | C'è la sauna? Quando è aperta? | Cerca un soggiorno | Chiedi informazioni |
| `/centro-congressi/` | La mia riunione ci sta? | Configura la tua sala, poi Apri la email con la richiesta | Chiama l'Ufficio Eventi |
| `/come-arrivare/` | Come ci arrivo? | Indicazioni stradali | Copia l'indirizzo, Chiama |
| `/contatti/` | Chi chiamo? | Chiama il reparto giusto | Scrivi, social |
| `/privacy/` | Cosa fate dei miei dati? | (solo lettura) | Torna al modulo |

---

## 2. Mappa del sito e percorso

### 2.1 Pagina o sezione

| URL (con slash finale) | Tipo | Perché |
|---|---|---|
| `/` | Pagina, scorrimento lungo di 8 scene | È la vetrina: ogni scena rimanda alla sua pagina |
| `/camere/` | Pagina (hub) | Consigliere + confronto + tre schede. Non ha canvas |
| `/camere/classic-double-room/`, `/camere/family-room/`, `/camere/suite/` | 3 pagine, vissute come 3 tab | URL proprio per SEO e condivisione; il canvas resta montato nel passaggio fra le tre (sezione 5.1) |
| `/prenota/` | Pagina | Serve senza JavaScript e per chi arriva da un link «prenota» |
| `/ristorazione/` | Pagina | Scena 3D del ristorante e contatto |
| `/wellness/` | Pagina | Scena 3D e indicatore «aperto ora» |
| `/centro-congressi/` | Pagina con tre sezioni: presentazione, configuratore (`#configura`), modulo (`#richiesta`) | Configuratore e modulo si parlano: stanno sulla stessa pagina |
| `/come-arrivare/` | Pagina | Il percorso tram 31 → M5 è lo stesso componente della home |
| `/contatti/` | Pagina con sezioni: reparti, indirizzo, social, «Nel mondo Cosmo» | Il blocco Partner è una sezione qui, non una pagina |
| `/privacy/` | Pagina | Il modulo e la barra vi rimandano |
| `404` | Pagina | |

**Non si costruiscono ora** (fase 2): `/dintorni/` (filtri Milano/Monza/Como, itinerari), `/domande-frequenti/`, `/partner/`, `/centro-congressi/richiesta-di-proposta/` (è una sezione di `/centro-congressi/`), `/en/`. Il footer non linka pagine che non esistono: niente «Domande frequenti» finché non c'è. Il percorso «2 km da Milano» è nella home e in Come arrivare; gli itinerari «Un weekend da Cosmo» aspettano `/dintorni/`.

I redirect 301 del sito vecchio (COPY 14.1) non si fanno in `next.config` (l'export statico non li supporta): vanno nel file dell'hosting, ancora da decidere.

### 2.2 Percorso tipico

- **Viaggiatore (telefono):** annuncio o ricerca → Home → hero → scorre Camere → «Chi viaggia?» → `/camere/suite/` → ruota la camera → «Cerca la Suite» → foglio prenotazione (date e ospiti) → «Cerca disponibilità» → motore VerticalBooking in nuova scheda.
- **Organizzatore (desktop):** ricerca «centro congressi Milano nord» → `/centro-congressi/` → «Configura la tua sala» → sala + disposizione + partecipanti → «Usa questa configurazione» → modulo precompilato → email all'Ufficio Eventi.
- **Chi vuole solo il telefono:** da qualunque pagina il footer e il menu hanno «Chiama +39 02 617771» nello stesso posto (WCAG 3.2.6).

---

## 3. Navigazione, barra in alto, prenotazione

### 3.1 Barra in alto (header)

- Sempre su fondo pieno `--bg` con filetto 1 px sotto. Mai trasparente sopra il 3D: il testo non va mai su una scena.
- Altezza 56 px (< 1024), 72 px (≥ 1024). Nome «Cosmo Hotel Palace» in Fraunces come segno (il logo ufficiale non c'è: `DA CONFERMARE`). Il nome è un link alla home.
- **Desktop ≥ 1024:** voci `Camere · Congressi · Ristorante · Wellness · Contatti` + pulsante «Prenota» verde pieno (non miele: il miele è nella barra in basso e nell'hero). La voce della pagina corrente ha `aria-current="page"` e filetto sotto. Le voci della sezione Camere restano evidenziate su tutte e tre le sotto-pagine.
- **Telefono:** nome a sinistra, pulsante «Menu» a destra (44×44 minimo, testo + icona). Nessun «Prenota» in alto: c'è la pillola in basso.
- **Comportamento allo scorrimento:** scende di 80 px → si nasconde (translateY, 240 ms); risale appena si scorre verso l'alto o quando un elemento al suo interno prende il focus. Con `prefers-reduced-motion` resta sempre visibile e non anima. Tutte le barre fisse sono compensate con `scroll-padding-top: 72px` e `scroll-padding-bottom: 96px` (WCAG 2.4.11: il focus non finisce mai sotto una barra).
- Skip link «Vai al contenuto» è il primo elemento tabulabile.

### 3.2 Menu del telefono

```
┌──────────────────────────────┐
│ Cosmo Hotel Palace   [Chiudi]│  56
├──────────────────────────────┤
│ Camere                    →  │  riga 64 px, Fraunces h3
│ Centro Congressi          →  │
│ Cosmo Grill & Lounge      →  │
│ Wellness                  →  │
│ Contatti                  →  │
├──────────────────────────────┤
│ [Chiama +39 02 617771]       │  verde pieno, 48
│ [Scrivi a info@…]            │  contorno, 48
│ Come arrivare · Privacy      │  link
└──────────────────────────────┘
```
`<dialog>` modale (`showModal()`), fondo `--bg` pieno. Si chiude con Esc, «Chiudi», cambio pagina. Il focus va sul primo link all'apertura e torna sul pulsante «Menu» alla chiusura. Etichette del menu: `NUOVO TESTO` («Menu», «Chiudi il menu»).

### 3.3 Barra di prenotazione e pannello

Un solo stato condiviso (`BookingProvider`): date, camere, adulti, bambini e «camera scelta» sopravvivono al cambio pagina (sessionStorage, con `try/catch`; WCAG 3.3.7).

| Dove | Desktop ≥ 1024 | Telefono / tablet < 1024 |
|---|---|---|
| Forma | Barra fissa in basso al centro, 72 px, `min(960px, 100% − 96px)`, `--sh-1` | Pillola «Prenota» 56 px in basso a destra, apre il foglio |
| Quando compare | Dopo l'hero della home; su tutte le altre pagine subito | Home: quando il pulsante «Cerca disponibilità» dell'hero esce dallo schermo. Altre pagine: subito |
| Dove NON compare | `/centro-congressi/` (lì l'azione è la proposta) | idem |
| Chiusura/riduzione | Nessuna: è sempre la stessa | Il foglio si chiude con ✕, Esc, tocco fuori, trascinando la maniglia |
| Sopra il footer | Si nasconde quando il footer è in vista (ha già il suo pulsante) | idem |

- Il corpo della pagina riserva `padding-bottom` uguale all'altezza della barra o della pillola + 16 px, così non copre mai l'ultimo contenuto.
- Nella barra il primo elemento, quando c'è una camera scelta, è un segno «Camera: Family Room ✕» (toglie la scelta).
- Sul telefono la pillola ha bordo `inchiostro-900` 2 px (così si staglia su qualunque contenuto).
- Su `/centro-congressi/` il telefono mostra, nello stesso posto, una pillola verde «Richiedi proposta» che porta a `#richiesta`.

---

## 4. Home — scene a scorrimento

### 4.1 Regole comuni

- Scorrimento sempre nativo. Nessun scroll-jacking, nessun carosello automatico. Ogni movimento legato allo scroll è funzione di un solo numero `p` (0→1) ed è reversibile.
- Ogni scena è una `<section>` con `h2` (l'hero ha l'h1) e un attributo `id`. Con lo scroll la scena in vista aggiorna l'hash con `history.replaceState` (non `pushState`: il tasto Indietro non deve passare dieci tappe).
- Solo desktop ≥ 1024: navigatore di scena (elenco verticale fisso a destra, 8 voci, etichette visibili al focus o al passaggio). Sul telefono non c'è.
- Un solo canvas vivo per volta. Il canvas si monta quando la scena è entro il 25% di viewport, si smonta (dispose + perdita del contesto) quando è a più di un viewport di distanza. Hero e ristorante sono separati da almeno tre scene senza WebGL.
- Con `saveData` attivo o poca memoria: il poster resta e compare il pulsante «Carica la vista 3D» (`NUOVO TESTO`). Il 3D si carica solo al tocco.
- Stato senza JavaScript: tutto il testo è nell'HTML. Le scene mostrano il poster SVG, i selettori sono sostituiti dalla lista dei valori (tutti visibili), i «fatti» sono `<details>` aperti, il riordino «Come viaggi?» non c'è. Il pulsante di prenotazione diventa un link normale al motore.

### 4.2 Ordine delle scene

| Posizione | «Per piacere» (e ordine di base) | «Per lavoro» |
|---|---|---|
| 1 | Hero — La hall | Hero |
| 2 | Perché sceglierci | Perché sceglierci |
| 3 | Camere | Centro Congressi |
| 4 | Il Cosmo a 2 km da Milano | Camere (consigliere già su «Lavoro») |
| 5 | Cosmo Grill & Lounge | Il Cosmo a 2 km da Milano |
| 6 | Wellness | Cosmo Grill & Lounge |
| 7 | Centro Congressi | Wellness |
| 8 | Chiusura: prenota e contatti | Chiusura |

Il riordino si fa cambiando l'ordine nel DOM, non con CSS (l'ordine di tabulazione deve coincidere con quello visivo). Parte solo dal clic dell'utente, non da un valore salvato al caricamento: niente salti di layout (CLS). Dopo il clic: dissolvenza 240 ms, scroll fino alla prima scena cambiata, annuncio aria-live (testo di COPY sez. 1). Lo stato dura la sessione, non si salva.

### 4.3 Scene, una per una

**Scena 1 — Hero: la hall.** *Scopo: «Che posto è e dov'è?»*
- Contenuto (COPY sez. 1): eyebrow «A 2 km da Milano», h1, sottotitolo, corpo breve, pulsanti «Cerca disponibilità» (miele) e «Esplora l'hotel» (contorno), interruttore «Come viaggi?» (due chip: Per lavoro / Per piacere), diorama della hall con 4 hotspot, slider «Ora del giorno», nota «Ricostruzione illustrativa, non una fotografia.».
- Interazione: trascina per guardarti intorno (±35° in orizzontale), ◀ ▶ per ruotare, slider a 4 posizioni (Alba · Mattina · Pomeriggio · Sera) con cambio luce di 600 ms, hotspot Lucernario, Tronco d'ulivo, Vetrate, Tende. Una breve entrata della camera nella hall (2,4 s) parte una volta sola quando il canvas entra in vista; toccare o scorrere la interrompe. Desktop: la camera avanza anche con lo scroll (la scena resta fissa per 200 vh e `p` guida l'avanzamento dalla porta al lucernario). Telefono: niente scena fissa; solo la breve entrata.
- Telefono: ordine verticale fisso: eyebrow → h1 → sottotitolo → pulsanti → diorama ad arco (altezza `min(62svh, 520px)`) → slider → nota → «Come viaggi?». Il testo viene prima così h1 e pulsante sono visibili senza scorrere su 360×640. Il canvas ha `touch-action: pan-y`: lo scorrimento verticale è sempre della pagina.
- Senza WebGL/JS: poster SVG della hall alla luce «Mattina», 4 voci di testo al posto degli hotspot, i 4 momenti della luce in lista.

**Scena 2 — Perché sceglierci.** *Scopo: «Posso fidarmi, cosa c'è di vero?»*
- Contenuto: i 7 fatti di COPY sez. 2. Ognuno è una riga con numero grande (`--t-num`) + riga breve; il dettaglio è dentro. Nessuna griglia di card uguali.
- Interazione: ogni riga è un `<details name="fatti">` (apertura esclusiva, funziona anche senza JS). Aprendo, accanto compare la piccola illustrazione del fatto (alt in COPY sez. 2).
- Telefono: elenco verticale a tutta larghezza, riga di almeno 64 px. Desktop: elenco a sinistra (5–6 colonne), illustrazione a destra che cambia.
- Il testo introduttivo «Tocca una scheda per vedere dove si trova nell'hotel» diventa «Tocca una scheda per i dettagli.» (`NUOVO TESTO`): la posizione nell'hotel non è nota per la maggior parte dei fatti.

**Scena 3 — Camere.** *Scopo: «Dove dormo?»*
- Contenuto: tre schede ad arco con forme diverse (Classic arco stretto e alto, Suite arco largo, Family due archi), «Chi viaggia?» compatto (4 chip), pulsante «Vedi le camere».
- Interazione: scegliendo un chip, la scheda consigliata si evidenzia (bordo 2 px + segno di spunta + testo «Consigliata per te»); sul telefono la scheda si porta al centro del binario. «Lavoro» e «Quattro adulti» consigliano la Suite.
- Telefono: binario orizzontale con aggancio, la scheda successiva spunta per il 12%. Il binario ha `tabindex="0"`, `role="region"`, nome accessibile; ogni scheda è un link, quindi con Tab il binario scorre da solo. Desktop ≥ 1024: tre schede affiancate in 12 colonne (3 + 5 + 4). Tablet 768: Classic e Suite su una riga, Family sotto.
- Senza WebGL/JS: le schede sono link con poster SVG e dati veri; il consigliere non c'è (compare il link «Vedi le tre camere»).

**Scena 4 — Il Cosmo a 2 km da Milano.** *Scopo: «Sono lontano da Milano?»*
- Contenuto: COPY sez. 5.4. Percorso disegnato in SVG con 5 tappe: Cosmo Hotel Palace · Tram 31, a pochi passi · Poche fermate · Metro M5, fermata Bignami · Milano. Nessun minuto scritto. L'elenco numerato delle 5 tappe è sempre in pagina (non solo per screen reader).
- Interazione: scorrendo, `p` disegna il tracciato e porta il tram da una tappa all'altra; la tappa attiva si evidenzia nell'elenco (non solo con il colore: numero pieno + peso del testo). Si può toccare una tappa. Pulsante «Come arrivare» → `/come-arrivare/`.
- Telefono: percorso verticale, elenco a destra. Desktop: percorso a sinistra, testo a destra.
- Reduced motion / senza JS: percorso già disegnato, tappa 1 attiva, tutte le didascalie visibili.

**Scena 5 — Cosmo Grill & Lounge** (tono sera). *Scopo: «Posso cenare lì anche se non dormo?»*
- Contenuto: COPY sez. 6: diorama del ristorante, slider «Momento della giornata» a 4 posizioni (Mattina · Pranzo · Aperitivo · Sera), titolo + testo per momento, orari con il ripiego di COPY, «Prenota un tavolo», «Organizza un evento».
- Interazione: la luce cambia in 600 ms; il testo cambia con dissolvenza di 240 ms ed è in `aria-live="polite"`. Hotspot: 6 (soffitto, lampade, tavoli e sedie, specchi, rami, pareti).
- «Prenota un tavolo» è un pulsante che apre (`aria-expanded`) due link di 48 px: «Chiama +39 02 617771» e «Scrivi a info@cosmohotelpalace.it» (componente `ContactChoice`). Non c'è prenotazione online dei tavoli finché il cliente non lo conferma.
- Telefono: diorama, poi slider, poi testo (il testo non sta mai sulla scena). Nel tono sera il «pieno verde» diventa fondo `sera-50` con testo `sera-950`.
- Senza WebGL/JS: poster alla luce «Sera» e i 4 momenti come elenco.

**Scena 6 — Wellness.** *Scopo: «C'è sauna e palestra? Quando?»*
- Contenuto: percorso del 6° piano in 3 tappe (Sauna finlandese, Bagno turco, Sala attrezzi) con i testi di COPY sez. 7, badge «Aperto ora · chiude alle 22:00», pulsante «Scopri il Wellness» (verde) → `/wellness/`. Illustrazione SVG, nessun canvas.
- Interazione: i 3 passi sono un elenco con evidenziazione allo scorrimento. Il badge si calcola sull'ora di Roma dopo il caricamento (nell'HTML c'è il testo fisso «Aperto tutti i giorni dalle 7:00 alle 22:00»).
- Telefono: elenco verticale. Desktop: illustrazione + elenco.

**Scena 7 — Centro Congressi.** *Scopo: «La mia riunione ci sta?»*
- Contenuto: numeri grandi (oltre 900 m², fino a 900 persone, 200 posti auto gratuiti, 2 piani), le tre sotto-schede di COPY 8.1 come elenco (non card uguali), e il mini-selettore «Trova la sala».
- Mini-selettore (`NUOVO TESTO`): un campo «Quanti partecipanti?» (numerico) + 4 chip disposizione. Risultato in una riga: «{n} persone a {disposizione}: la sala più piccola adatta è {sala} (fino a {c}). Altre {k} sale vanno bene.» Esempio di prova: 120 persone a platea → 8 sale adatte, la più piccola è Piccola Fortuna (170). Oltre la capienza massima di una sala singola (500 a platea, 450 a banchetto): «Il Centro Congressi ospita fino a 900 persone. Scrivi all'Ufficio Eventi per capire come.» Il pulsante «Configura la tua sala» porta a `/centro-congressi/?n=120&disp=platea#configura`.
- Senza JS: numeri, sotto-schede, link alla pagina.

**Scena 8 — Chiusura: prenota e contatti.** *Scopo: «Ok, e adesso?»*
- Contenuto: il modulo di prenotazione grande (stesso componente di `/prenota/`, con «Cerca disponibilità» miele — unico miele visibile lì), «Preferisci parlare con qualcuno?» (Chiama / Scrivi), poi il footer (tono sera).
- La barra/pillola si nasconde qui (c'è il modulo).

### 4.4 Wireframe hero telefono (390 × 844)

```
┌────────────────────────┐ 56  header (Menu)
│ A 2 KM DA MILANO       │
│ Lo stile italiano      │  h1 ≈ 37–47 px
│ dell'ospitalità, alle  │
│ porte di Milano.       │
│ Cosmo Hotel Palace è…  │  sottotitolo 18 px
│ [Cerca disponibilità]  │  miele 48, a tutta larghezza
│ [Esplora l'hotel]      │  contorno 48
│ ╭──────────────────╮   │
│ │   (hall 3D)      │   │  arco, 62svh max
│ │ ●lucernario      │   │
│ ╰──────────────────╯   │
│ Ora del giorno: Mattina│
│ ○────●───────○────○    │  slider, riga alta 48
│ Ricostruzione illustr… │
│ Come viaggi? (Lavoro)(Piacere)
└────────────────────────┘
```

---

## 5. Camere

### 5.1 Hub `/camere/` (senza canvas)

Ordine: h1 «Camere e suite» + sottotitolo + corpo (COPY sez. 3) → «Chi viaggia?» → le tre schede ad arco (poster SVG, nome, m² in `--t-num`, 3 dati: letti, ospiti, bagni) → «Le tre camere a confronto» → i comuni (Wi-Fi, TV, clima, ecc.).

**Consigliere «Chi viaggia?»**: gruppo di 4 chip (radiogroup, frecce da tastiera): Una coppia → Classic · Una famiglia → Family · Lavoro → Suite · Quattro adulti → Suite. Risposta in una scheda sotto i chip (aria-live polite): nome, 3 dati, frase di chiusura di COPY, pulsanti «Vedi {camera}» (verde) e «Confronta le tre» (contorno, scorre alla tabella). La scelta preimposta gli ospiti del foglio prenotazione: coppia 2 adulti, famiglia 2 adulti + 2 bambini, lavoro 2 adulti, quattro adulti 4 adulti. Si può non rispondere: nessun passaggio obbligato.

**Confronto affiancato**:
- ≥ 600 px: tabella a tre colonne con prima colonna di etichette, righe di COPY 3.2, intestazioni di colonna `scope="col"`, etichette di riga `scope="row"`. Sotto, una riga di pulsanti «Cerca {nome}».
- < 600 px: non si scorre di lato. L'utente sceglie quali due camere confrontare (due chip fra tre; di partenza Classic e Suite) e le righe diventano coppie «etichetta sopra, due valori sotto». `NUOVO TESTO`: «Scegli due camere da confrontare.»
- Sotto la tabella: **piante a scala comune** (SVG): la Classic occupa metà dell'area della Suite e della Family; la Family è due Classic con la porta comunicante. Si scrive solo ciò che è noto (22 m², 44 m², per la Family 22 + 22 m²). Nessuna quota in metri sui lati: non le conosciamo. Nota: «Proporzioni indicative. Le superfici totali sono quelle reali.» (`NUOVO TESTO`)

### 5.2 Pagina camera `/camere/{tipo}/` (il diorama)

Uno schermo, un solo compito: capire la camera e decidere. Struttura:

```
Telefono 390                                  Desktop ≥1024
┌───────────────────────┐                    ┌─────────────────────┬──────────────┐
│ header                │                    │ header                                │
│ [Classic][Family][Suite] tab (link)        │ [Classic][Family][Suite]              │
│ h1 + sottotitolo      │                    │ ╭───────────────╮   │ h1, sottotit.│
│ ╭───────────────────╮ │                    │ │ diorama (7 col)│   │ m² · letti · │
│ │ diorama ad arco   │ │                    │ │               │   │ ospiti       │
│ │  ●letto  ●finestra│ │                    │ ╰───────────────╯   │ [Cerca la…]  │
│ ╰───────────────────╯ │                    │ [3D|Pianta] [Giorno|Sera] [◀][▶]    │ (sticky)     │
│ [ 3D | Pianta ]       │                    │ Punti della camera (elenco)          │              │
│ [Giorno|Sera] [◀] [▶] │                    └─────────────────────┴──────────────┘
│ Ripristina vista      │
│ Caption (72 px fissi) │
│ Punti della camera    │  elenco: ogni riga è un bottone
│ Scheda tecnica        │
│ [Cerca la Classic…]   │  verde
│ [Chiedi all'Ufficio…] │
└───────────────────────┘
```

**Le tre pagine sono tre tab.** La barra «Classic · Family · Suite» sono link veri (`<nav aria-label="Tipi di camera">`, `aria-current="page"`). Il canvas vive nel layout `src/app/camere/layout.tsx` e si mostra solo sulle tre sotto-pagine: cambiando tab cambia URL, il canvas non si ricrea, la scena si dissolve in 240 ms (nessun nuovo contesto WebGL: è la regola degli iPhone). Ogni pagina ha comunque nell'HTML il suo h1, la sua scheda tecnica e la sua lista di hotspot.

**Controlli** (tutti ≥ 44 px, in quest'ordine di tabulazione dopo la tab dei tipi):
1. **Vista: «3D» · «Pianta»** (radiogroup a due voci, aria-label di COPY).
2. **Luce: «Giorno» · «Sera»** (radiogroup a due voci, dissolvenza 600 ms; solo in 3D. In Pianta il controllo sparisce ma lascia lo spazio, niente salto). La scelta vale per tutte e tre le camere e per la sessione.
3. **Ruota: ◀ ▶** (pulsanti, passo 15°, `aria-label` «Ruota la camera a sinistra/destra»). Con il focus sul riquadro 3D le frecce ← → ruotano di 10°. Trascinamento con il dito/mouse in orizzontale (±35°). L'inclinazione verticale non si controlla col dito (resta ferma a una vista buona per ogni camera); si cambia solo toccando un hotspot.
4. **Ripristina vista**: compare solo dopo che l'utente ha mosso la camera. Alta 48 px, nello stesso posto (spazio riservato).
5. **Hotspot** (bottoni HTML proiettati, sezione 11.3). Toccando un hotspot la camera si porta su una vista pronta per quel punto e si apre una pillola con titolo + dato di COPY. Una pillola aperta alla volta; Esc o secondo tocco la chiude.

**Pianta (SVG).** Stesse sagome del 3D, in scala. Mostra m² totale e, per la Family, 22 + 22 m². Gli hotspot sono gli stessi, come `<g role="button" tabindex="0">` con area di tocco 44 px, e aprono la stessa pillola. Zero numeri inventati.

**Lista «Punti della camera».** È il testo equivalente del 3D (obbligatoria, sempre visibile): una riga per hotspot con titolo e didascalia di COPY. Ogni riga è un bottone: porta la camera sul punto, apre la pillola, sposta il focus sulla riga stessa. Hotspot Classic 7, Family 6, Suite 8 (COPY 3.3–3.5).

**Scheda tecnica**: numeri grandi (m², ospiti, letti, bagni) + elenco dotazioni di COPY. Su desktop sta nella colonna destra fissa insieme al pulsante principale.

**Stati del diorama:** caricamento = poster SVG con la riga «Stiamo preparando la scena…» (aria-live polite); pronto = dissolvenza poster → canvas 240 ms; senza WebGL o lento = «La vista 3D non è disponibile su questo dispositivo. Ecco la versione semplificata.», si apre la Pianta e il pulsante «3D» ha `aria-disabled="true"` con la ragione scritta accanto.

### 5.3 Flusso fino a «Prenota questa camera»

1. L'utente preme «Cerca la {camera}» (verde, pagina) o la pillola «Prenota».
2. Si apre il foglio (telefono) / il pannello si accende nella barra (desktop) con: segno «Camera: {nome} ✕» e riga «Hai scelto: {camera}. Aggiungi le date per cercare.» (COPY 4.6). Ospiti preimpostati: Classic 2 adulti · Family 2 adulti + 2 bambini · Suite 2 adulti. Il focus va su «Arrivo».
3. Date → ospiti → «Cerca disponibilità» (miele) → il motore si apre in una nuova scheda.
4. **Il motore non ha un parametro conosciuto per il tipo di camera** (sezione 6.6): la scelta camera preimposta solo gli ospiti. Il foglio lo dice sotto il pulsante: «Sul motore cerca la {camera} tra le camere disponibili.» (`NUOVO TESTO`).

---

## 6. Prenotazione

### 6.1 Campi

| Campo | Controllo | Valori | Note |
|---|---|---|---|
| Arrivo | `<input type="date">` nativo, 48 px | da oggi (ora di Roma) | `min` = oggi |
| Partenza | `<input type="date">` nativo | arrivo + 1 in poi | se vuota o ≤ arrivo, si imposta arrivo + 1 e lo si annuncia («Partenza spostata a {data}.», `NUOVO TESTO`) |
| Camere | stepper − valore + | 1–4 | |
| Adulti | stepper | 1–4 | |
| Bambini | stepper | 0–4 | nessun campo età (6.5) |

Scelta del controllo data: nativo su tutte le piattaforme. Sul telefono è il selettore del sistema (accessibile e noto); sul desktop il clic su tutto il campo chiama `showPicker()` (in `try/catch`). Così si evita un calendario fatto in casa da rendere accessibile. Le date si leggono spezzando la stringa `AAAA-MM-GG`, mai con `new Date('AAAA-MM-GG')` (fuso orario). «Oggi» si calcola con `Intl.DateTimeFormat` in `Europe/Rome`.

Riepilogo sempre visibile (aria-live polite, solo al cambio): «{n} notti, dal {data} al {data}.» · «{n} camere · {a} adulti · {b} bambini» (singolari in COPY 4.2). Aiuto sotto Arrivo: «Scegli prima l'arrivo, poi la partenza.» L'aiuto sugli adulti («Dai 18 anni») non si mostra (non confermato).

### 6.2 Validazioni

Si controlla alla pressione di «Cerca disponibilità», non mentre si scrive. Poi si ricontrolla ogni campo errato quando l'utente lo lascia. Il pulsante **non è mai disattivato** (un pulsante disattivato non spiega perché).

| Regola | Tipo | Testo |
|---|---|---|
| Arrivo vuoto | blocca | COPY 4.3 «Scegli la data di arrivo per continuare.» |
| Partenza vuota | blocca | «Scegli anche la data di partenza.» |
| Partenza ≤ arrivo | blocca | «La partenza deve essere dopo l'arrivo. Scegli un'altra data.» |
| Arrivo nel passato | blocca | «Questa data è già passata. Scegli da oggi in avanti.» |
| Adulti < 1 | blocca | «Serve almeno un adulto.» (non può succedere con lo stepper: serve per lo stato ripristinato) |
| Camere > adulti | blocca | «Ogni camera ha bisogno di almeno un adulto: aggiungi adulti o riduci le camere.» (`NUOVO TESTO`; evita camere senza adulti nel link) |
| Ospiti > camere × 4 | avviso, non blocca | «Il motore verifica la capienza delle camere.» (ripiego di COPY 4.3; 4 è il massimo di ogni camera: la Suite) |
| Numero massimo notti | non si implementa | non è noto |

Errori: riepilogo in cima al foglio/pannello (`role="alert"` una volta, poi focus sul primo campo errato), testo sotto il campo collegato con `aria-describedby`, `aria-invalid="true"`, icona + testo (mai solo colore, `--danger`).

### 6.3 Stati

| Stato | Come si vede |
|---|---|
| Pronto | «Cerca disponibilità» miele |
| Con errori | riepilogo + campi segnati; il pulsante resta attivo |
| Apertura | al clic: pulsante `aria-busy`, testo «Stiamo aprendo il motore di prenotazione…» per 1,5 s |
| Aperto | aria-live: «Il motore di prenotazione si è aperto in una nuova scheda.» |
| Offline | se `navigator.onLine === false` al clic, non si apre: «Non riusciamo a raggiungere il motore di prenotazione. Riprova tra poco, oppure chiama +39 02 617771.» |
| Nuova scheda bloccata | non può succedere: il pulsante è un vero link `<a>` (sezione 6.4) |
| Senza JavaScript | `/prenota/` mostra il link semplice «Apri il motore di prenotazione», telefono e email |

Sempre visibili sotto il widget: la nota «Il sito non mostra prezzi né disponibilità…» e la riga sul motore esterno (COPY 4.1, 12). Il claim «migliori tariffe garantite» non si mostra finché il cliente non lo conferma.

### 6.4 Bottom sheet (telefono)

- `<dialog>` aperto con `showModal()`: focus intrappolato, sfondo inerte, Esc chiude. Titolo «Il tuo soggiorno» (`aria-labelledby`). Chiusura con `aria-label` di COPY 4.1.
- Altezza ≤ 88 dvh, fondo `--bg` pieno (mai sera, mai trasparente), `--r-3` in alto, `--sh-2`, maniglia 40×4 px. La maniglia ha un'area di tocco di 44 px e permette il trascinamento verso il basso per chiudere; il resto del foglio scorre senza chiudersi. Il trascinamento ha sempre l'alternativa del pulsante ✕ da 44×44 (WCAG 2.5.7).
- Il pulsante «Cerca disponibilità» sta in un piede fisso nel foglio, sempre visibile sopra la tastiera. I campi hanno testo da 16 px (niente zoom di iOS) e altezza 48 px.
- Entrata: traslazione dal basso 240 ms. Con `prefers-reduced-motion`: compare subito.
- Alla chiusura il focus torna sulla pillola «Prenota» (o sul pulsante che l'ha aperto).
- `overscroll-behavior: contain`; altezza calcolata con `dvh` e, se serve, con `visualViewport`, perché la tastiera su telefono non copra il campo attivo.

### 6.5 Come si compone il link verso VerticalBooking

Il «Cerca disponibilità» è un `<a href target="_blank" rel="noopener">` il cui `href` si aggiorna a ogni modifica. Nessun `window.open`: con `noopener` `window.open` restituisce sempre `null`, quindi non si saprebbe mai se la scheda è stata bloccata. Se il modulo non è valido, il clic fa `preventDefault()` e mostra gli errori; mentre non è valido l'`href` è il link base (il clic con il tasto centrale apre comunque qualcosa di innocuo).

Base (dal BRIEF): `https://reservations.verticalbooking.com/premium/index2.html?id_albergo=146&dc=785&lingua_int=ita&id_stile=19500`

Parametri aggiunti, nell'ordine in cui li scrive il sito vecchio:

| Parametro | Valore |
|---|---|
| `gg`, `mm`, `aa` | giorno (2 cifre), mese (2 cifre), anno (4 cifre) di arrivo |
| `ggf`, `mmf`, `aaf` | idem, partenza |
| `tot_camere`, `tot_adulti`, `tot_bambini` | totali |
| `adulti1…N`, `bambini1…N` | ospiti per camera |
| `notti_1` | numero di notti |

Ripartizione per camera: bilanciata, il resto alle prime camere (3 camere, 4 adulti → 2, 1, 1). Il sito vecchio usa una divisione per arrotondamento che con 3 camere e 4 adulti darebbe 2, 2, 0: una camera senza adulti. Per questo noi usiamo la ripartizione bilanciata (e la validazione «camere ≤ adulti»). `lingua_int` è già nella base: non si ripete.

Esempi (`buildEngineUrl` deve produrli, vanno nei test):
- 15–17 novembre 2026, 1 camera, 2 adulti, 0 bambini:
  `…&id_stile=19500&gg=15&mm=11&aa=2026&ggf=17&mmf=11&aaf=2026&tot_camere=1&tot_adulti=2&tot_bambini=0&adulti1=2&bambini1=0&notti_1=2`
- Stesse date, 2 camere, 3 adulti, 1 bambino: `…&tot_camere=2&tot_adulti=3&tot_bambini=1&adulti1=2&bambini1=1&adulti2=1&bambini2=0&notti_1=2`

Funzione pura, senza React: `buildEngineUrl(state): string` e `validateBooking(state, today): Errors` in `src/lib/booking/`.

### 6.6 Cosa funziona e cosa è solo un'ipotesi (verifica)

**Letto nel codice del sito vecchio (verificato come testo, non come comportamento):**
- Il widget del sito vecchio dichiara `data-bm-booking-engine-provider-id="35"` e `data-bm-booking-mask-url` uguale al nostro link base. Nel suo `bundle.js` (scaricato da `cosmohotelpalace.it`) la voce 35 della tabella dei motori è quella che scrive `gg, mm, aa, ggf, mmf, aaf, tot_camere, tot_adulti, tot_bambini, adultiN, bambiniN, notti_1` e, se ci sono, `lingua_int`, `stNbambM` (età dei bambini) e `generic_codice` (codice promozionale). Le date sono scritte con anno a 4 cifre, mese e giorno a 2 cifre.
- Il sito vecchio apre il motore in una nuova scheda (`target=_blank`).
- La maschera del sito vecchio non chiede le età dei bambini, solo il numero.

**Non verificato (ipotesi):**
- Che il motore vivo accetti e preimposti davvero quei parametri oggi. Non ho potuto provarlo: `curl` e `WebFetch` ricevono un HTTP 403 con `cf-mitigated: challenge` («Just a moment…», sfida Cloudflare); in questa sessione non c'è un browser (Chromium non installato). La prova è la prima cosa da fare con un browser vero: aprire il link d'esempio e controllare che date e ospiti siano preimpostati.
- Che il motore chieda le età dei bambini. Non le chiediamo (come il sito vecchio); il parametro `stNbambM` esiste e si può aggiungere dopo.
- Un parametro per scegliere il tipo di camera: non c'è nel codice letto. Quindi non si promette.
- Limiti del motore (notti massime, soggiorno minimo, età dei bambini, data massima in avanti): sconosciuti. Non si validano.
- Codice promozionale: il parametro esiste (`generic_codice`); nessun campo ora (non è in COPY).

Piano B se i parametri non funzionano: il pulsante apre il link base e il foglio mostra il testo di COPY 4.4: «Il motore si apre con la sua ricerca. Inserisci di nuovo le date.» Si accende con un solo interruttore (`ENGINE_PARAMS_VERIFIED` in `src/lib/booking/config.ts`).

---

## 7. Configuratore sale congressi

### 7.1 Modello dati

Fonte unica: `src/content/congress-halls.ts`, copiata riga per riga dalla tabella di COPY sezione 15 (25 righe: 16 al piano terra, 9 al piano inferiore). Nessun valore calcolato, nessuna capienza dedotta.

```ts
type Disposition = 'platea' | 'banchi' | 'ferro' | 'banchetto';
type CongressHall = {
  id: string;                 // 'costellazioni', 'sole-plenaria', …
  name: string;               // come in COPY (con «Plenaria del Sole»)
  floor: 0 | -1;              // 0 = piano terra, -1 = piano inferiore
  dims: [number, number];     // metri, larghezza × profondità (usate solo per il disegno)
  areaM2: number;             // come pubblicato (può non coincidere con dims)
  heightM: number;            // 4.22 | 3.4 | 3.1
  cap: Record<Disposition, number | null>;  // null = «-» nella tabella
  divisibleInto?: number;     // solo costellazioni: 8, divinita: 5
};
```

Regole derivate (tutte in `src/lib/congress/availability.ts`, puro e testato):
- `available(hall) = disposizioni con cap !== null`. Per tutte le 25 righe la platea e il banchetto ci sono.
- `maxCap(hall) = max di cap non nulle` (per ordinare e per «fino a»).
- Ordina per capienza = `maxCap`; per superficie = `areaM2`. Ordine iniziale: capienza decrescente.
- Le dimensioni non si ricalcolano in m²: si mostrano i m² pubblicati. Esempi dove non tornano: Oro Plenaria 7,1×18,5 = 131 contro 147; Stella d'Oro 78 contro 91; Stella 50 contro 55 (domanda aperta 4 di COPY). La nota «Superfici e dimensioni come pubblicate» compare accanto ai dati della sala.
- Nell'interfaccia non si scrive il numero «13 sale» vicino all'elenco di 25 voci: l'elenco si intitola «Le sale e le loro misure».

### 7.2 Schermo e interazione

Tre passi visibili in una sola pagina (non un wizard che nasconde): «1. Scegli la sala · 2. Scegli la disposizione · 3. Chiedi una proposta».

```
Telefono 390                       Desktop ≥1024
┌──────────────────────┐          ┌──────────────┬───────────────────────────┐
│ 1. Scegli la sala    │          │ 1. Sala      │ ╭───────────────────────╮ │
│ [Plenaria delle      │          │ [Tutte|Terra|│ │  scena (3D / Pianta)  │ │
│  Costellazioni ▾]    │ foglio   │  Inferiore]  │ ╰───────────────────────╯ │
│  500 m² · 25×20 m    │ con elenco│ [Capienza|   │ [3D|Pianta] [Dividi sala] │
│ ╭──────────────────╮ │          │  Superficie] │ 2. Disposizione           │
│ │ Pianta (default) │ │          │ ○ Costellaz. │ (Platea 500)(Banchi —)    │
│ ╰──────────────────╯ │          │ ○ Divinità   │ (Ferro —)(Banchetto 450)  │
│ [3D | Pianta]        │          │ ○ Sole…      │ Quanti partecipanti? [__] │
│ 2. Disposizione      │          │ … (scorre)   │ Risultato (aria-live)     │
│ (Platea) (Banchi)    │          │              │ [Usa questa configuraz.]  │
│ (Ferro)  (Banchetto) │          └──────────────┴───────────────────────────┘
│ Partecipanti [   ]   │
│ Risultato…           │
├──────────────────────┤ barra fissa nel riquadro
│ Costellaz. · Platea  │
│ [Usa questa config.] │ verde, 48
└──────────────────────┘
```

**Scelta sala.** Elenco come gruppo di bottoni radio (`<input type="radio">` nativi con etichetta a riga di 56 px: frecce da tastiera già corrette). Ogni riga: nome, «{m²} m² · {dimensioni} m», «fino a {maxCap}», etichetta «Divisibile» solo sulle due sale. Filtri (chip, radiogroup): Tutte · Piano terra · Piano inferiore. Ordina per (chip): Capienza · Superficie. Se la sala scelta esce dal filtro, resta scelta e compare fissata in cima («Sala scelta: …»); il filtro non cambia mai la scelta. Telefono: l'elenco sta in un foglio (`<dialog>`) aperto da un pulsante che mostra la sala corrente; si chiude scegliendo. Sala iniziale: Plenaria delle Costellazioni. Stato vuoto: «Scegli una sala per vedere come si dispone.»

**Scelta disposizione.** Quattro chip (radiogroup) con etichetta di COPY 8.2 e, sotto l'etichetta, la capienza per la sala corrente. L'aiuto di una riga della disposizione scelta è sempre scritto sotto i chip.

**Quando una disposizione non c'è per la sala (cap = null):**
- Il chip resta visibile, segnato da un trattino al posto del numero, con `aria-disabled="true"` (non `disabled`: così resta raggiungibile e spiegabile) e un'icona di divieto: non solo colore.
- Toccarlo non lo seleziona: sotto i chip compare, e viene annunciato, il testo di COPY: «Questa disposizione non è indicata per {sala}. Prova con {disposizioni disponibili}.»
- Se la disposizione scelta non c'è nella sala che l'utente sceglie dopo, si passa a «Platea» e si dice: «{Sala} non ha {disposizione}: ti mostro Platea.» (`NUOVO TESTO`).
- Succede per Costellazioni e Divinità (niente banchi di scuola né ferro di cavallo).

**Partecipanti** (facoltativo, numero): «Quanti partecipanti?». Se supera la capienza della sala e disposizione scelte compare un avviso non bloccante (testo di COPY 8.3, «Per {n} persone…»). Accanto, un indicatore «{n} su {capienza}» in testo, con una barra sottile che non è l'unica informazione. Il valore va nel modulo (non lo si riscrive).

**Pareti mobili.** Solo su Costellazioni e Divinità: pulsante «Dividi la sala» / «Riunisci la sala» (`aria-pressed`). Due stati soltanto: sala unita; divisa in {k} parti uguali (k = 8 per Costellazioni, 5 per Divinità, i soli numeri dichiarati). Le parti sono uno schema indicativo: nota fissa «Schema indicativo. Le sale reali hanno misure diverse: le trovi nell'elenco.» (`NUOVO TESTO`). Quando è divisa le sedie spariscono e il risultato dice «{Sala} divisa in fino a {k} sale con pareti mobili. Le capienze delle singole sale sono nell'elenco.» (`NUOVO TESTO`): nessuna capienza inventata per le parti. Per le altre sale il pulsante non c'è. Quali righe sono combinazioni di altre è una domanda aperta (COPY).

**Scena.** Due viste: «3D» · «Pianta». Predefinita: Pianta sotto 600 px (500 sedie si leggono meglio in pianta su 360 px), 3D da 600 px in su. Senza WebGL: solo Pianta. La disposizione è un'illustrazione: le sedie sono tante quante la capienza indicata. Platea = file con corridoi davanti a un palco; banchi di scuola = tavoli da due; ferro di cavallo = tavoli a U; banchetto = tavoli rotondi (illustrazione da 10 posti, numero non dichiarato dall'hotel: la nota lo dice «Tavoli rotondi: disposizione illustrativa»). Il generatore (`src/lib/congress/layout.ts`) deve far stare tutte le sedie nelle dimensioni della sala; un test lo verifica per tutte le 25 sale e tutte le disposizioni dichiarate (se non ci stanno, la sedia si rimpicciolisce fino al 60% e il test segnala la sala). Cambiando disposizione, le sedie si spostano in 480 ms animando solo le matrici (`InstancedMesh`); chi ha `prefers-reduced-motion` vede lo scatto. Il numero della capienza non si anima: cambia di colpo.

**Risultato (aria-live polite, atomico):** «{Sala}, {disposizione}: fino a {n} persone.» + «{m²} m² · {dimensioni} m · altezza {h} m · {piano}» + nota fissa di COPY («Capienze indicative…»). Alternativa testuale della scena: la stessa riga, più `aria-label` dinamico di COPY 8.2 sul canvas.

**Link profondo (da home):** `?sala=…&disp=…&n=…` letto lato client (`useSearchParams` dentro `Suspense`, obbligatorio nell'export statico). Valori non validi si ignorano.

### 7.3 «Usa questa configurazione» e il modulo

1. Il pulsante scrive sala, disposizione, partecipanti nello stato condiviso e porta a `#richiesta` (istantaneo se reduced-motion), spostando il focus sul titolo del riepilogo.
2. Sopra il modulo: scheda «La tua configurazione: {sala} · {disposizione} · fino a {n} persone» + «Modifica» (torna a `#configura`).
3. Il modulo (COPY 8.3) ha «Sala» e «Disposizione» come select, già compilate e modificabili, e restano allineate al configuratore in entrambe le direzioni.

**Modulo, in breve.** Obbligatori: Nome e cognome, Email, Consenso privacy (link a `/privacy/`). Facoltativi: Azienda, Telefono, Tipo di evento (select a 6 voci), Data o periodo (testo libero: `NUOVO TESTO` come esempio «12/03/2027 o marzo 2027»; si controlla il passato solo se è una data completa gg/mm/aaaa), Numero di partecipanti, Sala, Disposizione, Camere per gli ospiti, Altro da sapere. Errori e testi: COPY 8.3. Controllo alla pressione del pulsante, poi per campo all'uscita. Riepilogo errori in cima con focus e `aria-live` («Ci sono {n} campi da controllare.», link ai campi). L'avviso «partecipanti oltre la capienza» è un messaggio di stato, non blocca.

**Invio finto: no.** Finché non c'è un backend (flag `HAS_BACKEND = false` in `src/lib/congress/config.ts`):
- il pulsante principale si chiama «Apri la email con la richiesta» (`NUOVO TESTO`; «Invia la richiesta» di COPY torna quando c'è un invio vero);
- al clic, se valido: `mailto:events@cosmohotelpalace.it?subject=Richiesta di proposta · {sala} · {disposizione}&body=…` (campi su righe separate, `encodeURIComponent`, a capo `%0D%0A`; il messaggio libero si taglia a 1000 caratteri perché i `mailto` lunghi falliscono) e si mostra il testo di COPY «Si apre la tua email con la richiesta già scritta. Premi Invia per mandarla.»;
- sotto compaiono «Copia il testo della richiesta» (conferma «Testo copiato.») e l'indirizzo events@, per chi non ha un programma di posta;
- non si mostra mai «Richiesta inviata»; il pulsante secondario «Preferisci scrivere? Apri una email» sparisce (sarebbe lo stesso) e resta «Chiama l'Ufficio Eventi».
Stati del modulo: normale, errore, aperto (dopo il clic), nessuno stato «invio in corso» finché non c'è un backend.

---

## 8. Altre pagine

**`/ristorazione/`** — h1, introduzione, orari (ripiego di COPY), la scena della scena 5 della home con più spazio: slider «Momento della giornata», 6 hotspot e lista, testo per momento, «Prenota un tavolo» (`ContactChoice`), «Organizza un evento» → `/centro-congressi/#richiesta`. Tono sera nella sezione della scena; il resto è sabbia.

**`/wellness/`** — h1, sottotitolo, badge «aperto ora» subito sotto l'h1, scena 3D con tre tappe selezionabili («Sauna finlandese» · «Bagno turco» · «Sala attrezzi»: tre chip che portano la camera sulla zona), 5 hotspot e lista, accesso e condizioni (ripiego di COPY), «Cerca un soggiorno» (verde: apre la prenotazione) e «Chiedi informazioni» (mailto info@).
Badge «aperto ora»: ora di Roma (`Intl`, funziona con ora legale), stati di COPY 7: Aperto · Chiuso, apre alle 7:00 · Chiuso, riapre domani alle 7:00 · Aperto, chiude tra poco (dalle 21:00 alle 22:00). Si ricalcola con un timer al prossimo cambio e quando la scheda torna visibile. Si annuncia (`role="status"`) solo quando cambia stato, mai ogni minuto. Con icona + testo.

**`/come-arrivare/`** — h1, indirizzo, il percorso della scena 4, i cinque blocchi di COPY 9 (auto, tram e metro, treno, aereo, fiere) tutti aperti, pulsanti «Indicazioni stradali» (link a Google Maps con l'indirizzo: `https://www.google.com/maps/search/?api=1&query=…`, senza coordinate che non abbiamo), «Copia l'indirizzo» («Indirizzo copiato.»), «Chiama l'hotel». **Non c'è una mappa incorporata**: niente terze parti, niente consenso da chiedere, niente peso. Il percorso SVG e l'indirizzo scritto la sostituiscono; le frasi COPY sulla mappa non caricata non servono.

**`/contatti/`** — quattro righe reparto (Prenotazioni, Eventi, Commerciale, Ristorante): nome, «per cosa», due pulsanti da 48 px «Chiama» e «Scrivi» (`tel:` e `mailto:`, aria-label di COPY 10). Telefono: righe impilate; desktop: quattro colonne. Poi indirizzo, social (nuova scheda dichiarata nel nome accessibile) e «Nel mondo Cosmo» (ripiego senza la parola «gruppo»). Nessun orario degli uffici.

**`/prenota/`** — h1, sottotitolo, il modulo grande (stesso componente del foglio, in pagina), nota, «Preferisci parlare con qualcuno?».

**`/privacy/`** — testo lungo a 65 caratteri per riga, titoli h2. Il corpo è il testo dell'informativa quando il cliente lo manda; ora il segnaposto di COPY 12 con `DA CONFERMARE` ben visibile.

**Footer** (tono sera, COPY 11): 4 colonne su desktop, impilato su telefono, solo link a pagine esistenti, riga legale (CIN), «Torna su» (aria-label COPY). Nessun banner cookie ora: la fase 1 usa solo memoria tecnica (sessionStorage) e nessun tracciamento. Se si aggiunge un tracciamento, il banner di COPY 12 diventa obbligatorio prima (decisione del cliente).

---

## 9. Componenti e stati

Convenzioni: focus = anello 2 px `--focus` con distanza 2 px; sopra le scene 3D e sul miele = anello doppio (2 px `--focus` + alone 2 px `--bg`), così si vede su qualunque sfondo. Hover solo dove c'è un puntatore (`@media (hover: hover)`). Un'informazione non sta mai solo nel colore (sempre icona o testo). Area di tocco ≥ 44×44 per tutto.

| Componente | Normale | Hover | Focus | Attivo / scelto | Disabilitato | Errore | Caricamento |
|---|---|---|---|---|---|---|---|
| **Pulsante miele** (Cerca disponibilità) | fondo `--action`, testo `--on-action`, bordo 2 px `inchiostro-900` sul telefono, 48 px | `--action-hover` | anello doppio | scala 0,98 | non esiste: si usa errore | — (gli errori stanno nei campi) | `aria-busy`, testo «Stiamo aprendo…», niente rotellina che gira per sempre |
| **Pulsante verde** | `--brand`/`--on-brand` | `--brand-press` | anello | scala 0,98 | fondo `--bg-sunk`, testo `--text-subtle`, `aria-disabled` + ragione scritta | — | testo cambia, `aria-busy` |
| **Contorno** | bordo 1,5 px `--text` | fondo `--bg-sunk` | anello | scala 0,98 | come verde | — | — |
| **Link con freccia** | sottolineato `--link` | spessore 2 px | anello | — | — | — | — |
| **Chip / radio a pillola** (consigliere, filtri, disposizioni, tipi) | bordo `--border-strong`, 40 px (tocco 44) | fondo `--bg-sunk` | anello | fondo `--brand`, testo `--on-brand`, **spunta** | `aria-disabled`, trattino, icona divieto, ragione scritta | — | — |
| **Segmented a 2 voci** (3D/Pianta, Giorno/Sera) | come chip, unito | idem | anello | idem | `aria-disabled` + ragione (3D non disponibile) | — | — |
| **Stepper** (camere, adulti, bambini) | − valore +, bottoni 48×48, valore in testo | fondo `--bg-sunk` | anello | — | − al minimo, + al massimo: `aria-disabled` | — | — |
| **Campo data/testo/select** | 48 px, bordo 1,5 px `--border-strong`, etichetta sopra sempre visibile | bordo `--text` | anello + bordo `--brand` | — | fondo `--bg-sunk` | bordo `--danger` 2 px + icona + testo sotto, `aria-invalid` | — |
| **Casella consenso** | 24 px visibile in area di tocco 44 | — | anello | spunta | — | testo errore sotto | — |
| **Slider a 4 posizioni** (`<input type=range>`) | traccia alta 44 px, valore a parole sotto (`aria-valuetext`) | — | anello sul cursore | — | — | — | — |
| **Hotspot** | punto 14 px miele con bordo `inchiostro-900` 2 px e alone, tocco 44 | alone più grande | anello doppio | pillola aperta, `aria-expanded` | nascosto (`hidden`) se dietro un oggetto | — | invisibile finché la scena non è pronta |
| **Pillola hotspot** | titolo + dato, `--bg`, `--sh-1` | resta (non sparisce al passaggio del mouse) | — | si chiude con Esc o secondo tocco | — | — | — |
| **Riga elenco** (hotspot, sala) | 56 px, titolo + dato | fondo `--bg-sunk` | anello | segno + fondo `--bg-alt` | — | — | — |
| **Scheda camera** | arco + dati + «Esplora la camera» | bordo `--text` | anello sulla scheda (è un link) | consigliata: bordo 2 px + «Consigliata per te» + spunta | — | — | poster SVG |
| **Voce di menu** | testo, riga 64 px | sottolineatura | anello | pagina corrente: `aria-current`, filetto | — | — | — |
| **Foglio / pannello** | fondo `--bg` | — | focus intrappolato | — | — | riepilogo errori in cima | caricamento del contenuto: non c'è |
| **Barra prenotazione** | sezione 3.3 | — | anello su ogni campo | — | — | riepilogo sopra la barra | «Stiamo aprendo…» |
| **Riquadro scena** (`SceneFrame`) | poster SVG | — | il riquadro prende il focus per le frecce | — | senza WebGL: pianta + testo | «La vista 3D non è disponibile…» | «Stiamo preparando la scena…» |
| **Dettaglio fatto** (`<details>`) | riga con numero grande | fondo `--bg-alt` | anello | aperto: segno − | — | — | — |
| **Badge aperto/chiuso** | icona + testo | — | — | — | — | — | all'inizio: testo fisso senza stato |
| **Stato / avviso** (`role=status`) | icona + testo | — | — | — | — | tono errore con icona | — |

---

## 10. Telefono e schermi larghi

Griglia di DESIGN: 4 colonne e margine 16 px sotto 600 px; 8 colonne e 32 px a 600–1023; 12 colonne e 48 px da 1024, contenitore 1280 px, diorami a pieno bordo. Larghezza minima supportata: 320 px (nessun scroll orizzontale; WCAG 1.4.10).

| Elemento | 360 | 390 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|
| Header | 56, nome + Menu | idem | idem | 72, voci in riga + Prenota | idem, più aria |
| Prenotazione | pillola + foglio | idem | pillola + foglio | barra fissa | barra, 960 px |
| Hero | testo, poi arco 62 svh | idem | testo + arco a due colonne | scorrimento con avanzamento nella hall | idem, diorama sfonda il margine destro |
| Fatti | elenco a una colonna | idem | elenco + illustrazione | idem | idem |
| Schede camera | binario con aggancio | idem | Classic + Suite, Family sotto | 3 + 5 + 4 colonne | idem |
| Pagina camera | tutto in colonna; elenco hotspot sotto | idem | diorama a tutta larghezza, controlli sotto | diorama 7 col + colonna fissa 5 col | idem |
| Confronto camere | due camere a scelta | idem | tre colonne | tre colonne | idem |
| Configuratore | pianta, elenco in foglio, barra fissa in fondo | idem | scena + chip, elenco a lato (4 col) | elenco 4 + scena 8 | idem |
| Contatti | righe impilate, 2 pulsanti a tutta larghezza | idem | 2 colonne | 4 colonne | idem |
| Footer | impilato | idem | 2 colonne | 4 colonne | idem |

- Pulsanti a tutta larghezza sul telefono quando sono soli in riga; affiancati solo se entrambi ≥ 44 px di altezza e ≥ 120 px di larghezza.
- Zone sicure: `env(safe-area-inset-*)` su pillola, foglio, menu, barra del configuratore.
- Nessun testo sotto 12 px, nessun corpo sotto 16 px. Campi a 16 px.
- Da 1440 in su il contenitore non cresce oltre i 1280 px: i diorami restano a pieno bordo.
- Orientamento orizzontale sul telefono: diorami limitati a `70svh`; il foglio prenotazione a `88dvh` scorre.
- Zoom del testo al 200%: nessuna perdita di contenuto né di funzioni; altezze mai fisse sui contenitori di testo.

---

## 11. Movimento, 3D, alternative

### 11.1 Movimento
Durate e curve di DESIGN sezione 7. Si animano solo `transform` e opacità. Non si anima: testo del corpo, pulsante e barra di prenotazione, campi, capienze. Nessun `backdrop-filter`, nessun `will-change` fisso.

**`prefers-reduced-motion: reduce`:** niente entrata nella hall, niente avanzamento con lo scroll (la camera sta ferma), niente tracciato animato (disegnato), niente scorrimento morbido (`scroll-behavior: auto`), niente pulsazione degli hotspot, le sezioni compaiono già nel loro stato finale, giorno/sera e momenti della giornata cambiano con dissolvenza di 200 ms, le sedie scattano. L'orbita resta, a richiesta dell'utente. Si ascolta anche il cambio dell'impostazione mentre la pagina è aperta.

### 11.2 Qualità e carico
Parte da «media» (DPR 1,5 sul telefono, 2 su desktop). Scende di un gradino solo sotto i 48 fps per 1 s continuo. Non si parte mai in «lite». `frameloop="demand"` quando nessuno anima o trascina. Il modulo 3D si importa in modo dinamico (`next/dynamic`, `ssr: false` dentro un componente client) solo quando la scena è in vista; il poster resta fino al primo fotogramma.

### 11.3 Hotspot e alternativa testuale
- Gli hotspot sono bottoni HTML in un livello sopra il canvas, **non dentro** l'elemento con `role="img"` (i figli di `role="img"` sono presentazionali e i bottoni sparirebbero per gli screen reader). Struttura: `<figure>` → canvas con `role="img"` e `aria-label` di COPY → `<div role="group" aria-label="Punti della scena">` con i bottoni → `<figcaption>` con la nota «Ricostruzione illustrativa, non una fotografia.».
- Ogni hotspot ha una vista pronta (angolo, inclinazione, distanza) e si nasconde quando è dietro a un oggetto o dalla parte opposta rispetto alla camera. Chi usa la lista (tastiera, screen reader) arriva lo stesso: la lista porta la camera sulla vista giusta, poi il bottone compare.
- Ogni scena 3D ha tre livelli: 3D (se c'è WebGL) → poster SVG + pianta → testo (lista dei punti, scheda tecnica). Nessuna informazione sta solo nel 3D.
- Nessuna rotazione automatica, nessun movimento continuo: il pulsante «Metti in pausa l'animazione» di COPY non serve e non si costruisce.

### 11.4 Controlli e testi da correggere
Il testo visibile dei comandi diventa: «Trascina per ruotare · Tocca i punti per i dettagli» e per tastiera «Frecce per ruotare, Tab per passare da un punto all'altro.» (`NUOVO TESTO`; vedi sezione 15).

---

## 12. Accessibilità (WCAG 2.2 AA)

Contrasti: valori già calcolati in `DESIGN.md` 2.4; il frontend li verifica sui valori reali.

| Punto | Requisito |
|---|---|
| Struttura | `lang="it"`, un solo h1, h1→h2→h3 senza salti, punti di riferimento `header`, `nav` (con nome), `main`, `footer`; skip link «Vai al contenuto» |
| Tastiera | tutto si usa senza mouse; ordine di tabulazione = ordine visivo; nessuna trappola (l'unica è il foglio/menu modale, che si chiude con Esc); nel configuratore le sale sono radio nativi |
| Focus | sempre visibile (anello 2 px, doppio sopra scene e miele); non coperto da barre fisse (2.4.11, `scroll-padding`) |
| Bersagli | ≥ 44×44 (supera il 24 px di 2.5.8); distanza fra bersagli vicini ≥ 8 px |
| Trascinamento | rotazione e foglio hanno alternative a un solo tocco (2.5.7): pulsanti ◀ ▶, ✕, elenco hotspot |
| Date | `type="date"` nativo con etichetta visibile; riepilogo notti annunciato; messaggi di errore con rimedio (3.3.1, 3.3.3) |
| Moduli | ogni campo ha `<label>` visibile; obbligatori segnati con testo («obbligatorio»), non solo con asterisco; errori con `aria-describedby`; riepilogo errori con focus; autocompletamento (`autocomplete="name"`, `email`, `tel`, `organization`) (1.3.5) |
| Dati non riscritti | date e ospiti, sala e disposizione restano fra pagine e passi (3.3.7) |
| Aiuto coerente | telefono e email sempre nello stesso posto: menu e footer (3.2.6) |
| 3D | `role="img"` con `aria-label`; hotspot come bottoni fuori dall'elemento `img`; lista testuale equivalente; nota che è una ricostruzione; `aria-live` per i cambi di luce, di camera, di capienza |
| Hover/focus | le pillole degli hotspot compaiono al tocco e al focus, si chiudono con Esc, restano se il mouse ci va sopra (1.4.13) |
| Movimento | `prefers-reduced-motion` ovunque (11.1); nessun lampeggio; nessuna animazione automatica oltre i 5 s |
| Colore | mai solo colore (spunta nei chip, icona negli errori, trattino nelle disposizioni, numero e peso nelle tappe) |
| Testo | ridimensionabile al 200%, riflusso a 320 px (1.4.10), spaziatura del testo modificabile (1.4.12) |
| Alternative | `alt` descrittivo italiano per ogni illustrazione e diorama; `alt=""` per le decorazioni |
| Link esterni | nome accessibile dice «si apre in una nuova scheda» (COPY 10) |
| Tabelle | confronto camere con `th scope`; sul telefono non si scorre di lato |
| Hotel «senza barriere» | la pagina non può essere meno accessibile del messaggio: questa sezione è un requisito di accettazione, non un consiglio |

**Prova prima della consegna:** tastiera su ogni pagina; VoiceOver su iPhone e NVDA; zoom 200% e 320 px; `prefers-reduced-motion`; senza JavaScript; senza WebGL (disattivato dalle impostazioni del browser); Axe o Lighthouse a cura del QA, perché in questa sessione Axe non c'è.

---

## 13. Budget di prestazioni per pagina

Misure su telefono medio, rete 4G lenta simulata. «JS iniziale» = JavaScript compresso (gzip) caricato prima dell'interazione, senza il 3D. Tutte le pagine: LCP ≤ 2,5 s con l'h1 come elemento più grande (mai il canvas), CLS ≤ 0,05, INP ≤ 200 ms, nessuna attività lunga > 50 ms durante lo scorrimento, 48 fps o più nelle scene (qualità adattiva). Font ≤ 180 KB in tutto. CSS ≤ 25 KB. Nessuna immagine raster; SVG in pagina ≤ 40 KB a pagina.

| Pagina | JS iniziale | HTML | 3D (si scarica solo quando la scena è in vista) | Prima visita (HTML+CSS+JS+font, senza 3D) |
|---|---|---|---|---|
| Home | ≤ 140 KB | ≤ 60 KB | motore ≤ 260 KB + hall ≤ 400 KB; poi ristorante ≤ 300 KB (il motore è già in cache) | ≤ 420 KB |
| Camere (hub) | ≤ 110 KB | ≤ 45 KB | nessuno | ≤ 360 KB |
| Camera (tipo) | ≤ 125 KB | ≤ 40 KB | motore ≤ 260 KB + scena ≤ 250 KB | ≤ 380 KB |
| Centro Congressi | ≤ 135 KB | ≤ 50 KB | motore ≤ 260 KB + scena ≤ 200 KB; dati sale ≤ 6 KB | ≤ 400 KB |
| Ristorazione | ≤ 115 KB | ≤ 40 KB | motore ≤ 260 KB + scena ≤ 300 KB | ≤ 370 KB |
| Wellness | ≤ 115 KB | ≤ 40 KB | motore ≤ 260 KB + scena ≤ 250 KB (da definire) | ≤ 370 KB |
| Prenota | ≤ 105 KB | ≤ 30 KB | nessuno | ≤ 340 KB |
| Come arrivare | ≤ 95 KB | ≤ 35 KB | nessuno | ≤ 330 KB |
| Contatti | ≤ 95 KB | ≤ 35 KB | nessuno | ≤ 330 KB |
| Privacy, 404 | ≤ 80 KB | ≤ 30 KB | nessuno | ≤ 310 KB |

Altre regole: memoria grafica ≤ 16 MB per scena; un solo canvas per volta; il 3D non parte con `saveData` (compare «Carica la vista 3D»); precaricamento del motore 3D solo dopo che la pagina è ferma (`requestIdleCallback`) e solo se la scena è a meno di due schermi; se un budget è superato, si taglia il 3D prima del testo. Un controllo automatico di dimensioni nello script di QA (modulo 15) fa fallire la build se si superano i budget.

---

## 14. Moduli di lavoro

Regola: ogni modulo possiede i suoi file e non modifica quelli degli altri; i contratti (tipi) stanno nel modulo 1 e nel 2. Ordine consigliato: onda A = 1 e 2 (contratti, mezza giornata) → onda B = 3, 4, 5, 6 → onda C = 7, 8, 9, 10 → onda D = 11, 12, 13 → onda E = 14.

| # | Modulo | File previsti (`src/…`) | Input → output | Dipende da |
|---|---|---|---|---|
| 1 | **Fondamenta** | `app/layout.tsx`, `app/globals.css` (esistente: ripulire), `styles/tokens.css` (token a tre livelli di DESIGN, `data-tono="sera"`), `lib/motion.ts` (`usePrefersReducedMotion`, `useInView`, `useScrollProgress`), `lib/safe-storage.ts` (sessionStorage con `try/catch`), `lib/rome-time.ts`, `lib/a11y.ts` (annunci aria-live) | niente → token, font (`next/font`), provider, hook | — |
| 2 | **Contenuti e tipi** | `content/rooms.ts`, `content/congress-halls.ts` (25 righe, sezione 7.1), `content/facts.ts`, `content/hotspots/{hall,classic,family,suite,grill,wellness}.ts`, `content/contacts.ts`, `content/copy.ts` (stringhe di COPY con chiavi) | COPY → oggetti tipizzati; nessuna interfaccia | — |
| 3 | **Componenti base** | `components/ui/{button,chip,segmented,stepper,field,details,status,sheet,dialog,range,tabs-nav}.tsx` (si parte da `button.tsx` esistente) | token → componenti con tutti gli stati della sezione 9 | 1 |
| 4 | **Prenotazione** | `lib/booking/{url,validate,dates,distribute,config}.ts` (puri), `components/booking/{BookingProvider,BookingBar,BookingPill,BookingSheet,BookingForm,RoomHint}.tsx`, `app/prenota/page.tsx` | stato `{arrivo, partenza, camere, adulti, bambini, camera?}` → link, errori, apertura | 1, 3 |
| 5 | **Runtime 3D** | `components/scene/{SceneFrame,SceneCanvas,CameraRig,HotspotLayer,Hotspot,Poster,SceneFallback}.tsx`, `lib/three/{support,quality,materials,lights,shadows,instancing}.ts` | `SceneDef` (sezione 14.1) → riquadro con poster, canvas, hotspot, lista | 1, 3 |
| 6 | **Poster e illustrazioni** | `components/art/{PosterHall,PosterRoom,PosterGrill,PosterWellness,PosterCongress,RouteMap,FloorPlan,FactIcons,Icons}.tsx` | tono giorno/sera → SVG con alt | 1, 2 |
| 7 | **Struttura del sito** | `components/shell/{Header,NavLinks,MenuDialog,Footer,SkipLink,SceneNavigator,ContactChoice}.tsx` | percorso corrente → navigazione | 1, 3, 4 |
| 8 | **Scene 3D: hall e ristorante** | `scenes/hall/*`, `scenes/grill/*` (geometria in codice, luci di DESIGN 5.3, curva giorno→sera) | `t` 0..1 (luce), `p` 0..1 (avanzamento) → `SceneDef` | 5, 6 |
| 9 | **Scene 3D: camere e wellness** | `scenes/rooms/{classic,family,suite}/*`, `scenes/wellness/*` | luce 0|1, tappa → `SceneDef` | 5, 6 |
| 10 | **Scena 3D e logica sala congressi** | `lib/congress/{availability,layout,mailto,config}.ts` (puri e testati), `scenes/congress/*` (`InstancedMesh`, pareti) | `{sala, disposizione, divisa}` → matrici delle sedie + dati di pianta | 2, 5 |
| 11 | **Home** | `app/page.tsx`, `components/home/{Hero,WhyUs,RoomsTeaser,RouteScene,GrillScene,WellnessTeaser,CongressTeaser,Closing,ModeToggle}.tsx`, `lib/home/scene-order.ts` | contenuti + scene → pagina con 8 scene e riordino | 3, 4, 6, 7, 8 |
| 12 | **Camere** | `app/camere/{layout,page}.tsx`, `app/camere/[slug]/page.tsx` (`generateStaticParams`, `dynamicParams = false`), `components/rooms/{RoomStageHost,RoomControls,HotspotList,Advisor,Compare,RoomCard,SpecSheet}.tsx` | contenuti camere + scene → hub e 3 pagine con canvas condiviso | 3, 4, 6, 9 |
| 13 | **Congressi (pagina)** | `app/centro-congressi/page.tsx`, `components/congress/{Configurator,HallPicker,DispositionChips,AttendeesField,ResultLine,WallsToggle,ProposalForm,ProposalSummary,FindHall}.tsx` | `CongressHall[]` + scena → configuratore + modulo `mailto` | 3, 7, 10 |
| 14 | **Ristorazione, Wellness, Arrivare, Contatti, Privacy, 404** | `app/{ristorazione,wellness,come-arrivare,contatti,privacy}/page.tsx`, `app/not-found.tsx`, `components/wellness/OpenNowBadge.tsx`, `components/contact/{DepartmentRow,CopyAddress}.tsx` | contenuti → pagine | 3, 6, 7, 8, 9 |
| 15 | **SEO e statico** | `next.config.ts` (`output: 'export'`, `trailingSlash: true`), `app/{sitemap,robots}.ts`, `lib/seo/{metadata,jsonld}.tsx` (titoli, descrizioni, Hotel, HotelRoom, BreadcrumbList da COPY 14; senza `petsAllowed`) | COPY 14 → metadati per pagina | 2 |
| 16 | **Qualità** | `tests/unit/{booking-url,booking-validate,congress-availability,congress-layout}.test.ts`, `tests/e2e/*.spec.ts` (5 larghezze, 5 pagine chiave, senza JS, senza WebGL, reduced-motion), `scripts/budget.mjs` | tutto → verde/rosso | tutti |

### 14.1 Contratti da fissare nelle onde A e B

```ts
// lib/booking
type BookingState = { arrivo: string; partenza: string; // 'AAAA-MM-GG' o ''
  camere: 1|2|3|4; adulti: 1|2|3|4; bambini: 0|1|2|3|4; camera?: 'classic'|'family'|'suite' };
buildEngineUrl(s: BookingState): string        // esempi in 6.5 nei test
validateBooking(s: BookingState, oggi: string): Record<string, string>   // chiave = campo, valore = testo

// components/scene
type Hotspot = { id: string; titolo: string; dato: string; vista: { az: number; pol: number; dist: number };
                 pos: [number, number, number]; visibileIn?: 'giorno'|'sera'|'sempre' };
type SceneDef = { id: string; aria: string; nota: string; poster: React.ReactNode; hotspots: Hotspot[];
                  limiti: { az: [number, number]; pol: [number, number] };
                  costruisci(ctx: SceneContext): SceneHandle };   // handle.setLuce(t), setProgresso(p), dispose()
```

---

## 15. Segnalazioni

### All'art director (`DESIGN.md`)
1. **Pulsanti miele senza bordo (4.5) e «sempre con bordo 2 px» (2.4).** Le due righe si contraddicono. Decisione presa: bordo 2 px `inchiostro-900` sulla pillola telefono e sui pulsanti miele sopra contenuto variabile; senza bordo nella barra su fondo uniforme.
2. **Tono sera e «pieno verde» (2.3).** In sera `--brand` è chiaro e `--on-brand` non è definito. Decisione presa: fondo `sera-50`, testo `sera-950` (contrasto ≈ 14,9). Da confermare.
3. **Zoom del 3D.** Zoom bloccato (5.5) è giusto; resta quello del browser. Vedi COPY sotto.
4. **Focus sopra le scene.** Un anello `--focus` verde scuro non è garantito su parquet, pareti o sera. Decisione presa: anello doppio (2 px `--focus` + alone 2 px `--bg`).
5. **Pillola «Prenota» in basso a destra copre i controlli del diorama** se questi stanno a destra. Decisione presa: i controlli stanno a sinistra e al centro e la pagina riserva 88 px in basso. Nessun cambio al design.

### Al copywriter (`COPY.md`)
1. **«Pizzica per avvicinarti» e «+ e −» (sez. 3)**: tolti, vedi 11.4. Nuovo: «Trascina per ruotare · Tocca i punti per i dettagli».
2. **«Tocca una scheda per vedere dove si trova nell'hotel» (sez. 2)**: diventa «Tocca una scheda per i dettagli.»
3. **Tabella di confronto con scorrimento laterale (3.2)**: sul telefono sostituita da «scegli due camere». Aria-label dello scorrimento non serve; serve «Scegli due camere da confrontare.»
4. **Pulsante «Metti in pausa l'animazione» (1)**: non serve, nessuna animazione continua.
5. **«Invia la richiesta» finché non c'è backend (8.3)**: il pulsante si chiama «Apri la email con la richiesta». Testi nuovi: «Copia il testo della richiesta», «Testo copiato.», esempio per «Data o periodo».
6. **Mappa non caricata, alt mappa, coordinate (9)**: non servono, niente mappa incorporata.
7. **«13 sale» (sez. 2, 8.1, SEO) contro 25 righe in tabella (domanda aperta 4).** Se l'elenco di 25 sale è visibile, «13 sale» sembra sbagliato. Finché il cliente non risolve, il configuratore non mostra conteggi.
8. **Testi nuovi da scrivere** (tutti segnati `NUOVO TESTO` sopra): etichette del menu; «Camera: {nome} ✕»; «Partenza spostata a {data}.»; «Ogni camera ha bisogno di almeno un adulto…»; «Sul motore cerca la {camera} tra le camere disponibili.»; «Scegli due camere da confrontare.»; «Proporzioni indicative…»; «{Sala} non ha {disposizione}: ti mostro Platea.»; «Schema indicativo…»; testo della sala divisa; «Tavoli rotondi: disposizione illustrativa»; mini-selettore «Trova la sala»; «Carica la vista 3D».

### Cose da sapere, non verificate
- Il motore di prenotazione non è stato aperto (sezione 6.6): i nomi dei parametri vengono dal codice del sito vecchio, il comportamento è da provare con un browser.
- Nessuna schermata è stata provata né misurata: contrasti, budget e frame rate sono requisiti, non risultati.
- Axe, plugin Design e `design-skills` non disponibili; Figma non autorizzato.
- Non so quali righe della tabella sale siano combinazioni di altre: per questo le pareti mobili hanno due soli stati e uno schema indicativo.
- Il sito vecchio e il brief non danno: orari di Grill e Lounge, orari degli uffici, condizioni del wellness, età dei bambini nel motore, limite di notti, hosting, dominio, logo. Dove servono, i ripieghi di COPY sono già usati.
