# MOTION — piano del movimento

Stato: piano + un prototipo verificato (una scena). Tutto il resto è progetto, non ancora costruito.
Dove scrivo "misurato" ho un numero ottenuto qui. Dove scrivo "non misurato" non ho nessun dato: non va letto come "va bene".

## 1. Concetto

**Entrare nel portafoglio**: la camera avanza lungo l'asse Z e le strategie sono livelli messi uno dietro l'altro, che vengono incontro, restano a fuoco, poi passano oltre. Niente scivola dall'alto o dal basso: si va dentro, non giù.

Un'idea forte per schermata. Il resto sta fermo.

## 2. Scena per scena

Easing unico del sito: `cubic-bezier(.2, .7, .2, 1)`. È lo stesso dell'artifact di Davide (l'ho letto nel suo `<style>`), quindi il movimento resta coerente col riferimento. Mai `linear` sull'interfaccia. Le scene legate allo scroll non hanno una durata: seguono il dito. Le altre stanno nei limiti 150–250 ms (microinterazioni) e 400–700 ms (ingressi di sezione).

### Atto 1 — Hero + tre strategie (un solo palco "sticky", verificato nel prototipo)

Un contenitore alto 420svh con dentro un palco `sticky` alto 100svh. `perspective: 1000px` sul palco. Lo scroll (`useScroll` + `useTransform` di Framer Motion) sposta la camera: ogni elemento ha un `z` (translateZ) che dipende dal progresso.

| Elemento | Cosa fa | Quando (progresso 0–1) | Tecnica | Perché |
|---|---|---|---|---|
| Titolo hero "Entra nel portafoglio" | Si allontana verso il fondo (`z` da 0 a -700) e sfuma | 0 → 0,12 | `z` + opacity | Dice "stiamo entrando": il titolo resta indietro invece di salire |
| Cornici a tunnel (7) | Vengono incontro alla camera, ricomincia il giro in fondo | Tutto l'atto | `z` + opacity, solo bordi | Dà il senso di velocità e profondità con costo quasi zero |
| Livello 01 Oro | Arriva da lontano, a fuoco, poi passa oltre la camera | A fuoco a 0,22 | `z` + opacity | Prima strategia |
| Livello 02 Nasdaq | Idem | A fuoco a 0,49 | idem | Seconda |
| Livello 03 USDJPY | Idem | A fuoco a 0,76 | idem | Terza |
| Barra di avanzamento | Cresce da sinistra | Tutto l'atto | `scaleX`, origine sinistra | Dice quanto manca, senza layout |

Valori del prototipo: distanza tra livelli 900 px, camera che percorre 2700 px, opacità dei livelli `[-1700, -900, -180, 180, 620] → [0, .22, 1, 1, 0]` sull'asse Z. I livelli restano spenti finché l'intro non è finita (altrimenti si sovrappongono: l'ho visto in screenshot e corretto). Il livello che passa vicino alla camera compare enorme e sfocato dall'opacità bassa ai bordi dello schermo: è voluto, è il "ci passo attraverso".

Dentro ogni livello, quando è a fuoco (progresso vicino al suo centro): i numeri della strategia compaiono in 200 ms solo con opacity, nessun conteggio che corre (tabular-nums, larghezza fissa, zero layout shift). Il bottone "Apri livello" ha hover di 180 ms con `scale(1.02)`. I numeri veri vengono da `COPY.md`, non da qui.

### Atto 2 — Rischio ("i livelli si aprono")

Il palco dell'atto 1 finisce con l'ultimo livello che passa oltre la camera; la sezione Rischio è già lì "sotto", quindi non c'è taglio netto.

- Ingresso sezione: `translateZ(-400px) → 0` + opacity 0→1, 600 ms, easing sito, una volta sola (`whileInView`, `amount ~0.3`). Tecnica: Framer Motion, perché è un evento, non un legame con lo scroll.
- Grafico "Profondità": dal riferimento di Davide. Lì è un canvas 2D con proiezione fatta a mano: `scale = 1/(1 + rz*.22)`, 42 traiettorie separate in profondità, rotazione (`yaw`) di partenza -0,32 rad, trascinabile fino a ±0,75, e legata allo scroll (varia tra circa -0,50 e -0,02 mentre il grafico attraversa lo schermo). Lo riprendo così: la camera "gira" un po' mentre scorri. Redraw solo quando il canvas è visibile, un frame alla volta (`requestAnimationFrame`, come fa già lui).
- Su telefono: 42 → meno traiettorie (numero da decidere dopo misura), niente trascinamento (nel riferimento è già disattivato al tocco), nessun redraw continuo.
- Onestà: il redraw di un canvas non è `transform`/`opacity`: è una pittura. Va bene perché è isolato in un elemento solo, ma è il punto più caro dell'atto 2 e non l'ho misurato.

### Atto 3 — Monitor

- "Si accende": `scale .96 → 1` + `translateZ(-200px → 0)` + opacity, 500 ms, una volta.
- Aggiornamento dei valori: calo di opacità 1 → .4 → 1 in 200 ms. Nessun movimento, nessun conteggio. Il riquadro ha dimensioni fisse.
- Perché: un monitor che si muove troppo sembra finto. Qui il movimento deve solo dire "dato aggiornato".

### Atto 4 — Contatti

La camera si ferma. Le cornici del tunnel smettono di scorrere (ultimo stato, fermo) e restano come cornice. Il bottone di contatto: hover 180 ms, `scale(1.03)`, e anello che appare con opacity. Nient'altro. Un finale quieto rende più forte l'ingresso.

### Sfondo — ShaderGradient (vedi sezione 4)

Fisso dietro tutto, lento, scuro, con velo CSS sopra. Non si lega allo scroll: la profondità la fanno i livelli DOM, lo sfondo resta calmo. Perché: aggiornare le proprietà del gradiente a ogni frame di scroll costringe React a ridisegnare e pesa.

### Strumenti, in ordine

1. CSS 3D + `transition` per hover e piccoli stati.
2. Framer Motion `useScroll`/`useTransform`/`whileInView` per tutte le scene di sopra (già installato, v13.4.5).
3. **GSAP + ScrollTrigger: non installato e non previsto.** Si aggiunge solo se serve una sequenza con più timeline sincronizzate e scrub che Framer non regge. Peso non misurato: misurarlo prima di decidere.
4. **Lenis: no.** Ruba il controllo dello scroll, va in conflitto con `prefers-reduced-motion` e con la lettura da tastiera/lettore di schermo, e non serve a nessuna scena di sopra. Se lo scroll sembra a scatti, prima si guarda perché.
5. Three.js diretto: no. Già presente solo perché lo usa ShaderGradient.

## 3. Regole

- Si animano solo `transform` (incluso `translateZ`, `scale`) e `opacity`. Mai `top/left/width/height`, mai `filter: blur` animato, mai `box-shadow` animato.
- Niente `translateY` di ingresso. Il riferimento di Davide ha ancora `.reveal-card` con `translateY(70px)` e `rotateX(5deg)`: da NON riportare. `enter-scene` (perspective 1400px, rotateX 9deg, scale .93, 1,2 s) è più vicino all'idea ma inclina: usare `translateZ` puro dove possibile.
- Nessun layout shift: palchi e contenitori a dimensione fissa (`svh`), font dei numeri `tabular-nums`, immagini con dimensioni dichiarate. **Misurato** sul prototipo: CLS 0, nessuno scroll orizzontale a 390 px.
- `will-change: transform` solo sugli elementi del palco attivo, non su tutta la pagina.
- **`prefers-reduced-motion`** (obbligatorio): la scena animata viene nascosta via CSS (`motion-reduce:hidden`) e compare una versione statica in colonna (livelli uno sotto l'altro, senza sticky, senza transform). Fatto via CSS e non via JS, così non c'è lampeggio all'idratazione. **Verificato** con screenshot in emulazione reduced-motion. Per lo sfondo: `animate="off"` oppure un gradiente CSS statico.
- Fallback telefoni deboli, "modo lite": niente ShaderGradient (gradiente CSS radiale al suo posto), 3 cornici invece di 7, canvas del grafico con meno traiettorie e senza redraw da scroll. Come si decide (proposta, **non testata su telefoni veri**): `prefers-reduced-motion`, poi `hardwareConcurrency <= 4`, `deviceMemory <= 4` (esiste solo su Chromium, non su Safari), `saveData`, e una piccola misura dei frame nei primi 500 ms: sotto circa 40 fps si passa a lite. Le soglie sono ipotesi da tarare.
- Sfondo pesante caricato dopo il primo disegno (`dynamic import`, senza SSR), mai bloccante per il testo.
- Tab nascosta: nessun lavoro (Framer e rAF si fermano da soli; il canvas WebGL va messo in pausa).

### Budget di peso

Misurato (build di produzione, JS gzip, compreso il runtime di Next e React):

| Pagina | JS gzip |
|---|---|
| Home del template (`/`) | ~178 kB |
| Pagina prototipo zoom (`/lab-zoom`, con Framer Motion) | ~216 kB, cioè circa +38 kB (la differenza include Framer; la home di partenza potrebbe cambiare) |
| Pagina di prova ShaderGradient | ~455 kB, di cui un solo pezzo con Three.js ~283 kB, cioè circa +240 kB |

Obiettivo proposto (non è una misura): sopra la piega restare vicini ai 250 kB gzip senza sfondo WebGL; lo sfondo WebGL arriva dopo, solo su dispositivi non lite.

**Non misurato**: fps e batteria su telefono economico, memoria GPU, LCP e INP reali, comportamento su Safari/iOS (sticky + 3D transform lì va provato), sensazione di fluidità con la rotellina o il dito. Il Chromium qui gira in software (swiftshader), quindi gli fps di qui non dicono nulla sui telefoni.

## 4. ShaderGradient come sfondo, senza colori bruciati

Fatti verificati (nel pacchetto installato, v2.4.20, e con un test in Chromium headless):

- I default del pacchetto sono `color1 #ff5005`, `color2 #dbba95`, `color3 #d0bce1`, `brightness 1.2`, `lightType 3d`, `grain on`. Con questi il test qui esce **arancio-rosso molto saturo e pieno di grana**: è il "giallo/caldo bruciato" che Davide ha visto (non ho una spiegazione certa del perché il pastello degli altri due colori non si veda).
- Con luce `3d` la luminosità è una luce ambiente di intensità `brightness × π`: alzare `brightness` schiaccia tutto verso il bianco/saturo. Nel pannello del sito il range è 0,1–3.
- Test con palette scura (`#05080b`, `#12303a`, `#2b2350`), grana spenta: `brightness 0.8` esce scuro, blu-verde, usabile; `brightness 0.4` esce quasi nero. Il valore giusto sta quindi tra i due: da provare 0,5–0,7 (non testati).
- `lightType="env"` usa un file HDR (`city`/`dawn`/`lobby`) scaricato a runtime da `envBasePath`. Nel mio test la scena non è partita (canvas assente): non so se è colpa della rete di questo ambiente. Per essere sicuri: scaricare il file `.hdr` in `public/` e passare `envBasePath`. Fino ad allora usare `3d`.

Cosa regolare, in quest'ordine, un valore alla volta:

1. **Colori**: scuri e poco saturi (luminosità bassa). Mai un colore pieno.
2. **`brightness`**: scendere da 1,2 (partire da 0,8, poi 0,6).
3. **`grain`**: `off` (o alzare `grainBlending`: non testato).
4. **`uSpeed`**: basso (nel test 0,2; effetto sulla resa non confrontato con altri valori), sfondo lento.
5. **`pixelDensity={1}`** sul canvas: costa meno, lo sfondo è sfocato comunque.
6. **Velo CSS** sopra il canvas (gradiente da `#080b0e` opaco a trasparente): garantisce il contrasto del testo qualunque cosa faccia lo shader. Non costa nulla.
7. `reflection`, `uStrength`, `uDensity`: non testati, toccare solo dopo i punti 1–3.

Usare `ShaderGradientCanvas` con `lazyLoad` (il valore predefinito nel codice è attivo), `pointerEvents="none"`, posizione fissa dietro i contenuti. Compare in console l'avviso "THREE.Clock deprecated": innocuo, viene dalla libreria.

## 5. Componenti Cult UI

**Non ho potuto leggere la documentazione.** `cult-ui.com/docs` e la pagina `text-animate` hanno risposto 429 (due tentativi). La pagina GitHub del repo non elenca componenti. Quello che segue viene solo dai titoli e dai riassunti di una ricerca web, senza aver aperto le pagine, quindi è **da verificare** prima di installare qualsiasi cosa:

| Componente (nome visto nei risultati) | Uso ipotizzato | Stato |
|---|---|---|
| TextAnimate | Testo hero. Attenzione: le varianti citate ("Fade In Up", "Whip In Up") salgono dal basso, contro l'indicazione di Davide: usare solo varianti senza spostamento verticale | da verificare |
| Expandable Card | "Livelli che si aprono" nell'atto 2 | da verificare (nome solo da riassunto) |
| Animated Number | Numeri del monitor. Controllare che non cambi la larghezza | da verificare (nome solo da riassunto) |
| Dynamic Island | Pillola di stato nel monitor | da verificare |
| Morph Surface | Forse per il contatto | da verificare |
| Dock, Bg Animate Button, Shift Card | Nessun uso chiaro | da verificare, probabilmente no |

Scrolltide (`scrolltide.co`) si è aperto: è una libreria a pagamento di prompt/template (95 template, 26 componenti, 55 shader, 18 sezioni, 14 schermate; 239 dollari una tantum, secondo la pagina). Cita Framer Motion, GSAP, Three.js e Lenis. L'ho usato solo come conferma di direzione (scroll con profondità), non ne ho copiato nulla. Non ho visto i template dentro: dietro pagamento.

## 6. Cose da non fare

- Niente reveal `translateY` da sotto o da sopra, nemmeno "piccolo" (24 px inclusi).
- Niente animazioni di `width`, `height`, `top`, `left`, `margin`, e niente `blur` o `box-shadow` animati.
- Niente più di un'idea forte per schermata: mentre i livelli avanzano, il resto è fermo.
- Niente numeri che "corrono" fino al valore (falsano la lettura e possono spostare il layout).
- Niente Lenis o scroll rubato. Niente `scroll-snap` forzato sul palco.
- Niente ShaderGradient con i colori di default, niente grana sopra il testo.
- Niente effetti che nascondono i contenuti se il JavaScript non parte: la versione statica deve esistere sempre.
- Niente installazione di libreria nuova (GSAP, Lenis, Cult UI) senza aver misurato il peso e senza una scena che non si può fare senza.
- Niente cifre di performance delle strategie scritte a mano nel codice del movimento: vengono da `COPY.md`.

## Prototipo

- Componente: `src/components/motion/ZoomInScene.tsx`
- Pagina di prova (non indicizzata): `src/app/lab-zoom/page.tsx`. Da cancellare o spostare quando la scena entra nel sito vero.

**Verificato**: `next build` senza errori; nessun errore in console; CLS 0; nessuno scroll orizzontale a 390 px; screenshot a sei punti di scroll su desktop (1280×800) e due su telefono (390×844): l'intro si allontana, i tre livelli arrivano e passano oltre la camera; versione reduced-motion statica corretta.
**Non verificato**: fps reali, Safari/iOS, telefoni veri, tastiera e lettore di schermo sulla versione statica, comportamento con la rotellina in rapida sequenza.

Nota trovata per strada, fuori dal movimento: in `src/app/globals.css` la riga `--font-sans: var(--font-sans)` è circolare, quindi il testo senza `font-mono` esce in Times New Roman (verificato con `getComputedStyle`). Va corretta dall'agente del design.
