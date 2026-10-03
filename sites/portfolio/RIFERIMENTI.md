# RIFERIMENTI — tre siti osservati, e cosa ne portiamo nel film

Data: 2026-09-29. Autore: motion designer. Perimetro: solo questo file (niente `src/`, niente `DESIGN.md`/`MOTION.md`).

Che cosa è: l'osservazione di shaders.com, horizonx.so e vividsites.app fatta **dalla pagina renderizzata**
(Chromium 1194 reale via playwright-core, `getComputedStyle`, screenshot, video, diff tra pixel), non dal loro
codice sorgente. Non è stato copiato codice: i frammenti e i prompt-specifica qui sotto sono ricostruzioni nostre,
scritte per il nostro stack (Next.js 16, Tailwind 4, Framer Motion 13, ShaderGradient/three via @react-three/fiber,
CSS 3D, canvas 2D con proiezione a mano come nel simulatore di Davide).

Dove scrivo **misurato** ho un numero letto dal browser. Dove scrivo **stima** l'ho dedotto dai frame o dall'esperienza:
va preso come ipotesi ragionata, non come fatto.

## 0. Come ho osservato, e i limiti (da leggere prima dei numeri)

- Viewport 1440×900 (desktop) e 390×844 (telefono, `isMobile` + touch). Per ogni home: screenshot all'arrivo,
  4 frame ogni 200 ms, dopo 3 s, a 8 punti di scroll (0/10/25/40/55/70/85/100%) con 3 frame ravvicinati ciascuno,
  8 posizioni del mouse con passi intermedi (`page.mouse.move`, `steps: 12`), scroll graduale con la rotellina,
  hover sui primi bottoni, video `recordVideo` dell'intera sessione.
- Misure: colori e font più usati (dagli elementi visibili con testo), titoli, raggi, `transition` e `animation`
  dichiarate, `@keyframes` leggibili, `position: sticky/fixed`, canvas e loro contesto, video, listener registrati
  su `window/document/body` (via CDP), percentuale di pixel cambiati fra frame (soglia 24/255).
- **Limiti duri di questo ambiente, che cambiano cosa si è potuto vedere:**
  1. **Niente WebGPU** (`navigator.gpu` assente). shaders.com è una libreria **WebGPU**: le sue anteprime live
     e l'editor nell'hero sono usciti **neri**. Di shaders.com ho visto layout, testi, CSS, poster JPEG e i
     videoclip WebM (che partono solo nella versione telefono).
  2. **Niente H.264**: i video `.mp4` (tutta la home di vividsites, le anteprime di horizonx) non si decodificano:
     restano fermi sul poster o neri. Il WebM/VP9 sì.
  3. **Rendering software (SwiftShader)**: gli fps qui non dicono nulla sugli fps reali. Il "frame identici consecutivi"
     che riporto misura solo *se* qualcosa si muove a riposo, non quanto è fluido.
  4. La rete passa da un proxy: le richieste le ha fatte Node e il browser ha ricevuto le risposte (nessuna
     verifica TLS disattivata). Pesi in kB = byte ricevuti, non compressi.
- **Paywall**: nessuno aggirato. Le sezioni "Pro/Premium/Unlock" sono descritte per quello che mostrano da fuori.
- Percorsi: screenshot, video e `measure.json` in
  `/tmp/claude-0/-home-user-noway/52786d54-bd01-5973-a6c5-0756dc1690f6/scratchpad/refs/<sito>/{desktop,mobile}/`,
  template in `.../refs/<sito>/templates/<nome>/` (`video.webm`, `1-arrivo.png`, `2-dopo-mouse.png`,
  `3-dopo-scroll.png`, frame `m-p*.png`, `s-w*.png`, `note.json`).
- Contesto nostro tenuto presente: `DESIGN.md` (palette nero-lime, Manrope + IBM Plex Mono, easing unico
  `cubic-bezier(.2,.7,.2,1)`), `MOTION.md` (solo `transform`/`opacity`, mai `translateY` d'ingresso, niente scroll
  catturato, niente Lenis) e `SPEC-FILM.md` (ONE RULE: tutto funzione pura di `p`; ingresso automatico come offset che
  decade; due accenti che non condividono un fotogramma).

---

## 1. shaders.com

### 1.1 Cosa fa, in cinque righe

Sito-prodotto di una libreria WebGPU (Nuxt). Fondo quasi nero neutro, tipografia Geist grande e stretta, tanto
JetBrains Mono per i nomi dei componenti. L'hero non è un'immagine: è **l'editor stesso** (pannello livelli a
sinistra, tela al centro con una macchia di gradiente "blob" + testo con piano riflettente, pannello colori a
destra). Sotto, righe di chip `<Component />` che scorrono in marquee in direzioni alternate, poi una griglia di
preset con poster e lucchetto (Pro). Il movimento è calmo: luce che corre lungo filetti, marquee lentissimi, hover
di 150 ms. Nessuno scroll catturato, nessun parallasse.

### 1.2 Token misurati (desktop; telefono dove diverso)

| Token | Valore misurato | Note |
|---|---|---|
| Sfondo pagina | `#0f0f10` | `body`; `color-scheme` dark |
| Superfici | `#1f1f20` (carte, ×619), `#141414` | bordi tenui, niente ombre grigie |
| Testo | `#ffffff` titoli; `#d3daf0` corpo; `#73798d` secondario; `#494d5b` spento | il corpo è un bianco leggermente freddo |
| Colori di codice | `#6bdfff` (ciano) e `#ffcb6b` (ambra) nei chip mono | sono "sintassi", non accento di marca |
| Accento di marca | nessuno pieno: bottone primario **bianco** su nero (`#fff` → `#d3daf0` in hover) | |
| Font | Geist 400/500 (600 raro); JetBrains Mono 400 (1747 nodi su 1900) | |
| H1 | 74 px / 74 px, peso 500, tracking −3,7 px (−0,05 em); telefono 40 px | |
| H2 | 36 / 39,6 px, −1,8 px; telefono 28 px | |
| H3 | 20 / 26 px, −1 px; nomi preset 16 / 24 px | |
| Corpo | 16 px | |
| Raggi | **4 px** dominante (×603), 5, 10, 14, pillola | |
| Transizioni | colori `.15s cubic-bezier(.4,0,.2,1)` (default Tailwind, ×58); `all .4s cubic-bezier(.16,1,.3,1)` (×10); `border-color .5s` stessa curva | curva "expo-out" per le carte |
| Animazioni | `rfb-*`/`rfl-*` 9,3–9,8 s lineari, una volta (luce sui filetti); `row-left/right` 130–240 s lineari infinite (marquee) | |
| Sticky/fixed | nessuno su desktop; header sticky su telefono | |
| Canvas | 7 su desktop (WebGL riportato dal browser, ma la libreria è WebGPU: qui neri), `dpr` **0,21–0,44** cioè renderizzano a bassa risoluzione e ingrandiscono | trucco di costo da tenere |
| Video | 33 `.webm` (demo dei preset), `loop`, non autoplay: partono in vista/hover | |
| Cursore | `cursor: url(cursor.svg) 4 2` su tutto il body: cursore personalizzato **statico** (immagine), non un elemento che insegue | costo zero |
| Altezza pagina | 10,7 schermate (desktop), 13 (telefono) | |
| Peso ricevuto | 28,6 MB desktop (16,5 MB JPEG, 8,4 MB JS); **164 MB** telefono (127 MB di WebM) | fuori da ogni budget nostro |
| Listener | `mousemove` ×2 su window, `scroll` ×4, nessun `pointermove` | il mouse serve allo shader (uniform), non al DOM |
| Riposo | desktop: 0 % pixel cambiati (WebGPU assente); telefono: 0,09 % ogni ~70 ms (i clip WebM girano) | |
| Mouse | 0 % su tutti gli 8 punti, nessun transform cambiato | in questo ambiente il puntatore non muove nulla |
| Intro | nessuna: pagina già completa al primo frame (DOM pronto a 3 s) | |

### 1.3 Effetti osservati

**S1 — Luce che corre lungo i filetti ("ruled flow")** (misurato nei `@keyframes`)
- Cosa: sui separatori a righe sottili, una striscia luminosa passa da sinistra a destra (o dall'alto in basso) una
  volta sola: `mask-position-x` da −38 cqw a 100 cqw, con opacità 0→1 al 2,5 % e 1→0 verso il 17 % della durata,
  durata 9,3–9,8 s, `linear`, `iteration 1`. Diverse varianti (`v06…v011`) hanno tempi leggermente diversi: le
  strisce non sono sincronizzate.
- Direzione: orizzontale/verticale lungo la linea, non entra né esce dallo schermo.
- Tecnica probabile: DOM + `mask-image` animata via `@keyframes` (nessun JS, nessun canvas).
- Come rifarlo da noi: la nostra "linea di luce" sul bordo alto del pannello (DESIGN.md §6) può *scorrere* invece
  che stare ferma. Si anima `transform`, non la maschera (più leggero):
  ```css
  .fil { position: relative; height: 1px; background: var(--line); overflow: hidden; }
  .fil::after {
    content: ""; position: absolute; inset: 0; width: 38%;
    background: linear-gradient(90deg, transparent, var(--acc), transparent);
    transform: translateX(-100%); opacity: 0;
    animation: fil-luce 9.5s linear 1 both; animation-delay: var(--fil-delay, 0s);
  }
  @keyframes fil-luce { 0% { transform: translateX(-100%); opacity: 0 } 3% { opacity: 1 }
    16% { opacity: 1 } 18%, 100% { transform: translateX(360%); opacity: 0 } }
  @media (prefers-reduced-motion: reduce) { .fil::after { animation: none } }
  ```
- Costo: nullo (compositor). Compatibile con "verso l'interno": sì, è un movimento *sulla* superficie, non un
  ingresso dal basso.

**S2 — Marquee di chip in direzioni alternate** (misurato)
- Cosa: 8 righe di chip `<Nome />`, `translateX` continuo, 130–240 s per giro, righe pari a sinistra e dispari a
  destra, `linear infinite`. Le righe lontane dal cursore sono più spente (opacità per riga).
- Come rifarlo: solo se avessimo un elenco lungo da mostrare (le 272 configurazioni scartate?). `translateX` di un
  contenitore duplicato, `will-change: transform` solo su quelle righe. Lo sconsiglio: è decorazione, e MOTION.md
  vieta più di un'idea forte per schermata.
- Costo: basso ma continuo (8 layer in movimento). Compatibile: neutro (laterale). **Non lo prendiamo.**

**S3 — L'editor come hero: blob di gradiente + vetro + piano riflettente** (visto nel clip WebM su telefono)
- Cosa: una macchia di gradiente morbida (rosa/viola/arancio) su nero, un testo grande "ship magic" e il suo riflesso
  sfumato sotto, cornice da app con maniglie di selezione. È il loro ShaderGradient.
- Come rifarlo: è già il nostro `ShaderGradient` (DESIGN.md §8), con i vincoli di luminosità già misurati. Il
  riflesso del testo si fa in CSS con `-webkit-box-reflect` (solo WebKit/Blink) o con un secondo `<span aria-hidden>`
  ruotato `scaleY(-1)` e mascherato: 0 kB.
  ```tsx
  <h1 className="riflesso" data-testo="Entra nel portafoglio">Entra nel portafoglio</h1>
  /* .riflesso::after { content: attr(data-testo); position:absolute; left:0; top:100%;
     transform: scaleY(-1) translateZ(0); opacity:.18;
     mask-image: linear-gradient(to top, #000 0%, transparent 55%); } */
  ```
- Costo: lo shader è già a budget (~290 kB gzip, caricato dopo). Compatibile: sì, è fermo.

**S4 — Anteprime che rendono a bassa risoluzione** (misurato: `dpr` 0,21–0,44)
- Cosa: i canvas hanno buffer da 1/5 a 1/2 della dimensione CSS. Lo sfondo sfocato non ne soffre.
- Come rifarlo: `pixelDensity={0.5}` sul `ShaderGradientCanvas` (il nostro `--shader-pixel-phone` è già 0,7;
  anche il desktop può scendere sotto 1). Costo: **riduce** il costo di 4×. Compatibile: sì.

**S5 — Curva "expo-out" `.4s cubic-bezier(.16,1,.3,1)`** per hover delle carte (misurato)
- È più "scattante" della nostra `cubic-bezier(.2,.7,.2,1)`. Non la adottiamo come easing unico (DESIGN.md ne
  vuole uno solo), ma è il riferimento per le *microinterazioni* del cursore (vedi piano).

**S6 — Bande diagonali a 45° come separatori** (visto negli screenshot; tecnica = stima)
- `repeating-linear-gradient(45deg, var(--line) 0 1px, transparent 1px 9px)` su fasce alte 40–60 px. 0 kB, fermo.
  Da noi potrebbe segnare il passaggio fra atti nella versione statica (`/dettagli`).

### 1.4 Cosa NON prenderemmo da shaders.com

- Il peso: 28 MB desktop, 164 MB telefono. Il nostro budget sopra la piega è 350 kB.
- Il bianco come colore del bottone primario: da noi il segnale è il lime (`--acc`), un solo accento.
- Le 8 righe di marquee: rumore continuo, contro "un'idea forte per schermata".
- Il grigio neutro `#0f0f10`: il nostro nero tiene la tinta dell'accento (`#080b0e`, verde-blu), come chiede
  SPEC-FILM.md ("a red black, not a neutral one", da noi un nero-verde).
- WebGPU: non è un'opzione per noi (copertura Safari/Android ancora parziale; il nostro stack è WebGL via three).

---

## 2. horizonx.so

### 2.1 Cosa fa, in cinque righe

Vetrina a tema **chiaro** (bianco, Inter nera, pillole) di una libreria a pagamento (Svelte + GSAP). Hero: titolo che
entra **lettera per lettera dal basso con una piccola rotazione**, sotto un ventaglio di 5 carte inclinate (±14°)
che si scambiano di posto nel tempo. Poi griglie di carte con anteprima video su hover e un alone colorato dietro
ogni carta, tutto in pillole e raggi 30 px. Barra di navigazione fissa che diventa una pillola di vetro smerigliato
appena si scorre. Marquee di recensioni (55 s). Le anteprime sono `.mp4` (qui nere): il movimento "vero" della
libreria sta nei singoli template (vedi §5).

### 2.2 Token misurati

| Token | Valore misurato | Note |
|---|---|---|
| Sfondo pagina | `#ffffff` | tema chiaro; carte scure `#0a0a0a`, velo `rgba(8,6,18,.55)` |
| Testo | `#171717`; secondario `rgba(23,23,23,.6–.7)`; su scuro `rgba(255,255,255,.72)` | |
| Superfici | `rgba(23,23,23,.06)` (chip), `rgba(255,255,255,.9)` (vetro), `#fafafa` | |
| Font | Inter 400 (509) / 500 (216) / 600 (183) / 700 (53) | una sola famiglia |
| H1 | 56 / 58,8 px, peso 700, tracking −2,8 px (−0,05 em) | |
| H2 | 40 / 46 px, 600, −1,6 px; telefono 22 px | |
| H3 (carte) | 17 / 23,4 px, 600 | |
| Raggi | **pillola** dominante (×121), 30 px (×69), 16, 12, 24 | molto tondo |
| Transizioni | `opacity .45s ease-out, transform .2s ease` (×18, carte); `all .3s cubic-bezier(.4,0,.2,1)`; bottoni `.2s cubic-bezier(.16,1,.3,1)` su bg/bordo/ombra/transform/scale; **`transform .4s cubic-bezier(.34,1.56,.64,1)`** (rimbalzo, ventaglio) | |
| Animazioni | `hero-char-rise` 0,85 s e 0,7 s `cubic-bezier(.16,1,.3,1)` (per lettera: `translateY(var(--rise)) rotate(var(--rot))` → 0, opacità 0→1); `hero-fade-scale` 1,1 s e 0,8 s (`scale(var(--from-scale))` → 1); `reviews-marquee` 55 s; `nav-progress-shimmer`; `skeleton-pulse` 2 s | |
| Sticky/fixed | `nav` fixed 1216×58 a `top: .75rem`, z 40; popup "docs" fisso in basso a destra | |
| Canvas | 1 WebGL 1440×845 assoluto nell'hero, `dpr` 1 (`stars.js`): su bianco non ho visto cosa disegna | |
| Video | 18 `.mp4` (blob), loop, partono su hover: qui neri | |
| Hover bottone | "Sign up": `scale(1.035)` in `.2s ease-out`; CTA nere: solo opacità | |
| Altezza | 11,6 schermate desktop, **28,4** telefono | |
| Peso | 37,7 MB (21,6 MB mp4, 9,7 MB PNG) | |
| Listener | `mousemove` ×1, `wheel` ×1, `scroll` ×5, `pointerover` ×1; nessun elemento con listener di puntatore | |
| Riposo | 6 frame su 7 identici (solo il ventaglio cambia ogni tanto) | |
| Mouse | 6–10 % di pixel cambiati, ma i transform cambiati sono le carte del ventaglio che **ruotano nel tempo** (stessa delta anche nel test di scroll) + il popup docs che compare: **non** ho prove di parallasse col mouse in home | |
| Intro | 10,5 % di pixel cambiati nei primi 200 ms, poi fermo: l'ingresso per lettera dura < 1 s | |

### 2.3 Effetti osservati

**H1 — Titolo che entra lettera per lettera** (misurato nei keyframes)
- Cosa: ogni carattere è uno `<span>`; parte con `opacity 0`, `translateY(var(--rise))` e `rotate(var(--rot))`
  (valori per lettera, stima: 0,4–0,8 em e ±3–6°), arriva a 0 in 0,85 s (prima riga) / 0,7 s (seconda),
  `cubic-bezier(.16,1,.3,1)`, scaglionato (stima 18–25 ms per lettera).
- **Non compatibile così com'è**: sale dal basso. Versione compatibile, stesso ritmo ma **lungo Z**: le lettere
  arrivano da dietro (`translateZ(−120px)` → 0) e si mettono a fuoco (`filter: blur(6px)` → 0: l'unico caso in
  cui ammetto il blur, perché dura 0,7 s, una volta sola, su testo, ed è la "messa a fuoco" prevista da
  SPEC-FILM.md per le chiusure). In Framer Motion:
  ```tsx
  const lettere = Array.from(titolo);
  <h1 aria-label={titolo} style={{ perspective: 1200 }}>
    {lettere.map((c, i) => (
      <m.span key={i} aria-hidden style={{ display: "inline-block", willChange: "transform, opacity, filter" }}
        initial={{ opacity: 0, z: -140, filter: "blur(6px)" }}
        animate={{ opacity: 1, z: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 0.15 + i * 0.022 }}>
        {c === " " ? " " : c}
      </m.span>))}
  </h1>
  ```
  Con `prefers-reduced-motion`: `initial` = stato finale (usare `useReducedMotion()`).
- Costo: 20–40 layer promossi per < 1 s, poi si toglie `will-change`. Trascurabile.

**H2 — Comparsa a scala ("fade-scale")** (misurato: `scale(var(--from-scale))` → 1, 1,1 s)
- È compatibile: uno `scale` da 0,96 è un `translateZ` percepito. Da noi è già previsto per il Monitor (MOTION.md
  atto 3). Nessuna modifica.

**H3 — Ventaglio di carte con rimbalzo** (misurato: `rotate` ±14,08° = `matrix(.97, .243, …)`, `transform .4s
cubic-bezier(.34,1.56,.64,1)`)
- Cosa: 5 carte a ventaglio, la carta attiva sale al centro, le altre si aprono con overshoot del 56 %.
- Come rifarlo: le nostre due strategie come due "carte" a ventaglio nell'atto 3? No: il ventaglio è laterale e
  il rimbalzo contraddice l'easing unico. **Non lo prendiamo**; teniamo il volo in Z già costruito.

**H4 — Nav che diventa pillola di vetro allo scroll** (misurato: `fixed`, `backdrop-filter` presente; soglia = stima
~40 px di scroll)
- Come rifarlo: `backdrop-filter: blur(20px)` costa su telefono; DESIGN.md già prevede blur 20 px sul rail. Si può
  attivare la classe solo oltre la soglia con un `IntersectionObserver` su un sentinella alto 1 px in cima
  (zero listener di scroll). Compatibile: sì (non è un ingresso). Costo: un layer con blur solo quando serve.

**H5 — Alone colorato dietro ogni carta** (misurato: `.card-glow-mesh`, opacità 0,069, `translateY(−63px)`)
- Cosa: dietro ogni anteprima un blob dei colori dell'anteprima, opacità ~7 %, che rende ogni carta "tinta".
- Come rifarlo: DESIGN.md §6 lo prevede già ("alone col colore della strategia"): `box-shadow` colorata **statica**,
  oppure un `::before` con `radial-gradient(var(--st-oro) …)` a opacità 0,08. In hover si alza a 0,14 con
  transizione di `opacity` (mai animare il `box-shadow`). Costo nullo.

**H6 — Anteprima video su hover** (misurato: 18 video loop non autoplay)
- Da noi non ci sono video. L'equivalente onesto è il **grafico che si anima solo quando la carta è a fuoco**
  (canvas 2D con `requestAnimationFrame` avviato/fermato da `IntersectionObserver`).

### 2.4 Cosa NON prenderemmo da horizonx.so

- Il tema chiaro e la pillola ovunque: il nostro è scuro, raggi 4/8/14.
- Il `translateY` + `rotate` per lettera (sale dal basso) e il rimbalzo `1.56`.
- Il popup "docs" fisso e la barra "20 % off" con conto alla rovescia: rumore commerciale.
- 21 MB di mp4 in home.

---

## 3. vividsites.app

### 3.1 Cosa fa, in cinque righe

Catalogo di 227 prompt "cinematografici" (Next.js App Router + **Lenis** + cursore personalizzato). Fondo nero
`#08080a`, Onest 500 e JetBrains Mono per le etichette, raggi 8. Hero: **video di seta dorata a tutta larghezza**
in una cornice arrotondata, titolo che si mette a fuoco (`translateY 18px + blur 8px` → 0, 0,7 s), CTA a pillola
bianca con freccia. Sotto, la griglia: ogni carta è un video che parte su hover, con un **cursore-anello con punto**
che diventa "Copy"/"FREE" sopra le carte, e una comparsa a scaglioni `opacity + translate .6s` con esattamente il
nostro easing `cubic-bezier(.2,.7,.2,1)`. Tutto il resto è glass (nav sticky sfocata) e pillole. È il sito che più
somiglia, per intenzione, a quello che vuole Davide, ed è la fonte del brief "Brand New Day" (SPEC-FILM.md).

### 3.2 Token misurati

| Token | Valore misurato | Note |
|---|---|---|
| Sfondo pagina | `#08080a` | quasi identico al nostro `#080b0e`, ma neutro |
| Superfici | `#101013` (carte ×231), `rgba(8,8,10,.66)` (vetro ×227), `rgba(255,255,255,.043/.06)` (filetti pieni) | |
| Testo | `#f4f4f5`; secondario `#7c7c84`, `#a6a6ad`; spento `#61616a` | |
| Accento | verde `#4ade80` solo per punto "live" e badge FREE; CTA bianca `#f4f4f5` su nero | accento come *stato*, non come marca |
| Font | Onest 500 (477 nodi) / 400 / 450; JetBrains Mono 400 (458) per categorie e contatori | |
| H1 | 46 / 47,4 px, peso 500, tracking −1,56 px (−0,034 em); seconda parte del titolo in grigio; telefono 40 px | firma "due toni" come la nostra |
| H2 | 28 / 28 px, −0,95 px | |
| H3 (carte) | 14 / 14 px | |
| Raggi | **8 px** dominante (×912), 6, pillola (×272), 12 | |
| Transizioni | `opacity .25s cubic-bezier(.2,0,0,1)` (×454, dissolvenza video); **`opacity, translate .6s ease / cubic-bezier(.2,.7,.2,1)`** (×229, comparsa carte); `background-color .18s`; CTA `transform .3s cubic-bezier(.22,.68,.32,1)` (hover: `translateY(−1px)` misurato) | |
| Animazioni | `prEnter` .7s `cubic-bezier(.22,.68,.32,1)`: `opacity 0, translateY(18px), blur(8px)` → `none`; `luxSweep` (`translateX(120%)`, luce che attraversa la CTA); `glowShift` (`background-position 300%`, gradiente che scorre); `livePing` (anello `scale .35→1.2`, opacità →0); `blinkDot` 1,2 s; `cardIn` (`translateY 14px + scale .985`); `sheetIn` | |
| Sticky/fixed | header sticky 72 px (pillola di vetro); layer `fixed inset-0 z-120 pointer-events-none` = il cursore, nascosto con `@media (pointer: coarse)` | |
| Cursore | `cursor: none` su body; `html.has-cursor`; anello `.spot-ring` ~44 px + punto `.spot-face` che seguono il mouse; sopra una carta compaiono "Copy" e il badge FREE | |
| Scroll | **Lenis** attivo (`html.lenis`) | contro le nostre regole |
| Canvas | nessuno | il "3D" è tutto video |
| Video | hero `hero-silk.mp4` 1501×370 autoplay loop; 188 video di carta (mp4, su hover) | |
| Altezza | 19,3 schermate | |
| Peso | **223 MB** (214 MB di mp4 caricati tutti insieme); telefono 8 MB | |
| Listener | `pointermove` ×3, `mousemove` ×2, `wheel` ×3, `touchmove` ×3 su window | il cursore e Lenis |
| Riposo | 7/7 frame identici (mp4 non decodificati qui) | |
| Mouse | 0–2,7 % di pixel cambiati: cambia solo il cursore-anello e il badge della carta sotto | nessun parallasse di scena |
| Intro | 10,5 % nei primi 200 ms (video/poster + `prEnter`), poi fermo | |

### 3.3 Effetti osservati

**V1 — Cursore-anello con punto, che "diventa" un'azione sopra le carte** (misurato: `.spot-ring`/`.spot-face`,
layer fixed z-120, `cursor: none`, nascosto su `pointer: coarse`)
- Cosa: un anello sottile (~44 px, bordo 1 px bianco al 60 %) e un punto (~6 px) seguono il mouse; sopra una carta
  l'anello si allarga e compare l'etichetta "Copy". Il punto arriva subito, l'anello con un po' di ritardo (stima:
  molla morbida, 150–250 ms).
- Come rifarlo (Framer Motion, `useMotionValue` + `useSpring`, nessun re-render React):
  ```tsx
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 300, damping: 30 }), ry = useSpring(y, { stiffness: 300, damping: 30 });
  useEffect(() => { const f = (e: PointerEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("pointermove", f, { passive: true }); return () => window.removeEventListener("pointermove", f); }, []);
  return (<div aria-hidden className="pointer-events-none fixed inset-0 z-[120] hidden [@media(pointer:fine)]:block motion-reduce:hidden">
    <m.div className="cursore-punto" style={{ x, y }} />
    <m.div className="cursore-anello" style={{ x: rx, y: ry }} data-stato={stato /* "riposo" | "carta" | "link" */} />
  </div>);
  ```
  `.cursore-anello` 40 px, `translate(-50%,-50%)`, `border: 1px solid color-mix(in oklab, var(--acc) 70%, transparent)`,
  `mix-blend-mode: difference` **no** (sul nero non si vede): meglio bordo lime a opacità 0,7. Stato "carta":
  `scale(1.5)` in 180 ms. Il cursore di sistema resta visibile (non mettiamo `cursor: none`): accessibilità e zero
  rischio di "cursore sparito" su iframe/canvas.
- Costo: 2 layer compositi, un listener passivo. Compatibile: sì, non è un ingresso.
- Floors: nascosto su touch, con reduced-motion e da tastiera (focus visibile resta quello di DESIGN.md).

**V2 — Comparsa delle carte con il nostro stesso easing** (misurato: `opacity, translate .6s cubic-bezier(.2,.7,.2,1)`)
- Loro traslano (stima 12–16 px dal basso). Noi la stessa curva e durata ma su `translateZ(var(--z-from))`,
  come già scritto in DESIGN.md §9. Conferma che la scelta dell'easing è "di mercato".

**V3 — Messa a fuoco del titolo (`prEnter`)** (misurato: `translateY(18px) + blur(8px)` → 0, 0,7 s)
- La parte utile è il **blur che si risolve**; la traslazione va sostituita con Z (vedi H1). SPEC-FILM.md: "closings
  arrive front-to-back, resolving out of blur": è questo.

**V4 — Luce che attraversa la CTA (`luxSweep`) e gradiente che scorre sul bordo (`glowShift`)** (misurato)
- Cosa: sul bottone primario una striscia chiara passa da sinistra a destra (`translateX(120%)`, stima 1,2 s, una
  volta all'hover); il bordo ha un gradiente che scorre (`background-position` 0→300 %).
- Come rifarlo: solo la striscia, solo su hover della CTA principale, con `transform` (0 kB):
  ```css
  .cta { position: relative; overflow: hidden; }
  .cta::after { content:""; position:absolute; inset:0; width:40%;
    background: linear-gradient(100deg, transparent, rgb(255 255 255 / .35), transparent);
    transform: translateX(-130%); }
  .cta:hover::after { transition: transform .9s var(--ease); transform: translateX(330%); }
  ```
  `background-position` animato non è compositato: **niente glowShift**.
- Compatibile: sì. Costo: nullo.

**V5 — Hero video a tutta larghezza in cornice** (misurato: mp4 autoplay, cornice raggio ~12–16 px, velo scuro sotto
il testo)
- Da noi il posto dell'hero è dello shader + del grafico: **niente video** (peso, batteria, WCAG 2.2.2). La cornice
  arrotondata con velo `linear-gradient(to top, #080b0e 0%, transparent 60%)` invece sì: è lo "sfumo" già previsto.

**V6 — Nav pillola sticky in vetro, contatore `227 / 227` in mono** (misurato)
- Già coerente col nostro header (barra in alto, contatore di scena mono). Nessuna modifica.

**V7 — Lenis** (misurato: attivo)
- **Non lo prendiamo** (MOTION.md §2.4): ruba lo scroll, litiga con reduced-motion e tastiera. La "fluidità" che
  dà Lenis la otteniamo con lo smoothing del *valore* `p` dentro il film (vedi §6, "fluidità continua"), non
  toccando lo scroll del browser.

### 3.4 Cosa NON prenderemmo da vividsites.app

- 214 MB di video in una pagina; il video come materia del "3D".
- Lenis e `cursor: none` (nascondere il cursore di sistema).
- `background-position` animato, `box-shadow` animata (`boardLanded`).
- L'accento verde `#4ade80` acceso: il nostro lime è già deciso, e il verde-stato va accompagnato da testo.

---

## 4. Tabella riassuntiva dei tre (per l'art director)

| | shaders.com | horizonx.so | vividsites.app | Noi (DESIGN.md) |
|---|---|---|---|---|
| Fondo | `#0f0f10` neutro | bianco | `#08080a` neutro | `#080b0e` tinto (verde-blu) |
| Testo | `#fff` / `#d3daf0` / `#73798d` | `#171717` | `#f4f4f5` / `#7c7c84` | `#f1f4ee` / `#939fa9` |
| Accento | nessuno (bottone bianco) | nessuno (bottone nero) | verde-stato `#4ade80`, bottone bianco | lime `#c8fa72` unico |
| Sans | Geist 400/500 | Inter 400–700 | Onest 400/500 | Manrope 500/600 |
| Mono | JetBrains Mono | — | JetBrains Mono | IBM Plex Mono |
| H1 desktop | 74 px, 500, −0,05 em | 56 px, 700, −0,05 em | 46 px, 500, −0,034 em | 40–96 px fluido, 500, −0,045 em |
| Raggi | 4 dominante | pillola / 30 | 8 dominante | 4 / 8 / 14 |
| Easing tipico | `.4s (.16,1,.3,1)` | `(.16,1,.3,1)`, rimbalzo `(.34,1.56,.64,1)` | **`(.2,.7,.2,1)`** `.6s` | `(.2,.7,.2,1)` |
| Ingresso testo | nessuno | dal basso + rotazione, per lettera | dal basso + blur | **da dietro (Z)** |
| Scroll | nativo | nativo | Lenis | nativo, `p` smussato nel film |
| Cursore | immagine statica | sistema | anello + punto (JS) | sistema + anello lime (proposta) |
| Canvas | WebGPU (7) | WebGL (1) | nessuno (video) | 1 WebGL (film) + canvas 2D |
| Peso home | 28 MB / 164 MB | 38 MB | 223 MB / 8 MB | obiettivo 0,35 MB + shader 0,29 MB |

Proposte di palette/tipografia per l'art director (da §1–3, non decisioni):
1. Tenere il nero **tinto** (`#080b0e`) contro il nero neutro dei tre: è ciò che SPEC-FILM.md chiede e che li
   distingue da noi.
2. Il titolo a **due toni** (bianco + grigio) di vividsites coincide con la nostra "firma dei titoli" (`--ink` /
   `--mut2`): confermata.
3. Tracking dei display: i tre stanno fra −0,034 e −0,05 em; il nostro −0,045 em è nel mezzo. Peso 500 (non 700):
   due su tre lo usano, e Manrope 500 regge.
4. Raggi: i tre sono coerenti con **un** raggio dominante (4, pillola, 8). Noi ne abbiamo tre (4/8/14): va bene,
   ma il 14 delle carte è il più "morbido" del gruppo; se il tono deve essere tecnico, provare 8 sulle carte.
5. Un colore di **stato** separato dall'accento (vividsites usa verde per "live"): da noi `--ok` è uguale a `--acc`;
   DESIGN.md già impone icona/testo accanto. Nessun cambio, solo conferma.
6. La mono al servizio dei dati (JetBrains in due su tre, in **quantità**: 1747 nodi su shaders): la nostra Plex Mono
   può occupare più spazio (etichette, contatori, HUD del film), non solo le cifre.

---

## 5. Template e demo visti, sito per sito

Procedura per ogni pagina: 3 s fermi (6 frame a 500 ms), attesa rete, misure, 6 frame a riposo ("Riposo" = frame
identici consecutivi su 5: 5/5 = fermo, 0/5 = si muove da solo), 8 posizioni del mouse con passi (frame `m-p*-f0/f1`;
"Mouse" = massima % di pixel cambiati rispetto a prima), 14 tocchi di rotellina da 260 px (frame `s-w*`; "Scroll" =
% pixel cambiati fra 4 frame), video `video.webm` di tutta la sessione, `note.json`. Cartella:
`refs/<sito>/templates/<nome>/`. Promemoria: qui **niente WebGPU e niente H.264**, rendering software.

### 5.1 shaders.com — 12 pagine (galleria `/presets`, `/sections`, 3 `collection`)

Non esistono demo live aperte: ogni preset è un canvas **WebGPU** (nero qui) dentro la pagina del preset, con
"Unlock with Pro". Le uniche immagini reali sono i poster JPEG delle sezioni.

| Pagina | Caricamento | Mouse | Scroll | Canvas | Riposo | Paywall | Cosa ho visto |
|---|---|---|---|---|---|---|---|
| `/collection/voxel-shift` | 8,0 s, 23 MB | 0,4 % | 20/5/0/0 | 3 WebGL (1440×720 dpr 0,21; 1068×601 dpr 0,28; 1068×120) | 5/5 | "Unlock with Pro", 13 lucchetti | Tela nera 1068×601 (WebGPU assente), "Quick Edit", sidebar sticky h-dvh, "Similar collections" |
| `/collection/raindrops` | 9,5 s, 23 MB | 0,4 % | 31/5/0/0 | idem | 5/5 | idem | idem |
| `/collection/fluid-displacement` | 7,4 s, 22,5 MB | 0,4 % | 42/5/0/0 | idem | 5/5 | idem | idem |
| `/presets/backgrounds` | 8,7 s, 20 MB | 0,4 % | 50/37/33/26 | 2 WebGL | 5/5 | 67 lucchetti | Griglia "Pixel Shifts, Offsets, Data Cube…" con contatore "33 of 140"; anteprime nere |
| `/presets/logo-shaders` | 9,4 s, 18 MB | 0,4 % | 42/47/34/16 | 2 | 5/5 | 67 | idem |
| `/presets/image-effects` | 8,7 s, 21 MB | 0 % | 52/40/15/0 | 2 | 5/5 | 46 | idem |
| `/presets/gradient` | 9,5 s, 19 MB | 0,3 % | 46/45/67/34 | 2 | 5/5 | 73 | "36 of 100", poi la griglia sparisce dopo lo scroll (lazy WebGPU) |
| `/presets/vibrant` | 9,7 s, 20 MB | 0,9 % | 38/52/53/23 | 2 | 5/5 | 73 | idem |
| `/presets/geometric` | 9,9 s, 23 MB | 3,3 % (hover su chip filtro) | 47/42/49/29 | 2 | 5/5 | 70 | idem |
| `/sections` | 8,0 s, 16 MB | 0 % | 32/39/40/54 | 2 | 5/5 | 119 lucchetti | 59 sezioni con **poster JPEG** visibili: Glitch Rays Hero (raggi di luce su nero), Irradiance Logo Hero (gradiente viola-arancio + logo), Obsidian Hero (gemma nera), Hologram Studio Hero (chiaro), Particle Swarm Hero (sciame di punti), Electron Scan Hero (griglia esagonale scansionata), Polyhedron Footer, Voxel Logo CTA, Grid Shift Hero |
| `/updates/introducing-shaders-cli` | 7,1 s, 15 MB | 0 % | 6/7/6/4 | 2 | 5/5 | — | Articolo; l'hero dell'articolo è un video (statico qui) |
| `/framer` | 11 s, 3,7 MB | 0 % | 85/86/76/73 | 0 | 5/5 | — | Pagina plugin; 1 video; nessun canvas |

Lettura: shaders.com **non si può osservare in movimento da qui**. Quello che si porta a casa è nel §1.3 (luce sui
filetti, marquee, editor-hero, render a bassa risoluzione) e nei soggetti dei poster: raggi di luce, sciami di punti,
griglie scansionate, gemme nere: tutti temi "tecnici" coerenti col nostro.

### 5.2 horizonx.so — 12 pagine + 5 shader live (`/explore`, `/tools`, `/textures`, `/shaders`)

Tre tipi di pagina: **explore** = scheda prodotto Premium (video mp4 + carosello "peek-slide" di screenshot, testo
"Overview" molto dettagliato, nessuna demo live); **tools/shaders/textures** = **configuratori live** in WebGL o canvas
2D, aperti senza login (export dietro membership). Le seconde sono le uniche demo davvero osservate in movimento.

| Pagina | Caricamento | Mouse | Scroll | Canvas | Riposo | Paywall | Cosa fa (misurato + testo pubblico della pagina) |
|---|---|---|---|---|---|---|---|
| `/explore/crest-water-hero` | 5,5 s, 16 MB | 6,5 % (carosello che scorre da solo + popup) | 19/14/31/37 | 1 WebGL 1440×845 (hero sito, dpr 0,21) | 5/5 | Premium | Scheda: "carta di credito 3D su mare al tramonto, riflesso planare, la carta **si inclina verso il puntatore**, sheen in hover, **scia (wake) dove passa il mouse**", `?palette=`, reduced-motion rispettato. Demo = mp4 (nero qui) |
| `/explore/vigil` | 6,8 s, 11 MB | 25 % (carosello + popup) | 42/18/38/48 | 1 | 5/5 | Premium | "Passeggiata notturna in 5 capitoli in un castello three.js, Lenis, materiali PBR progressivi". Solo screenshot |
| `/explore/orvane-particle-hero` | 6,0 s, 29 MB | 7,3 % | 26/15/31/44 | 1 | 5/5 | Premium | "Busto scansionato in **150.000 particelle**, il cursore le **disperde lungo il suo percorso e poi tornano a posto**; griglia di misura; frase con blur per lettera; WebGL2 puro; point cloud cotto in un buffer da 1,8 MB; pausa a tab nascosta; fallback testo senza WebGL2" |
| `/explore/kai-rennard` | 5,9 s, 25 MB | 6,4 % | 20/20/35/61 | 1 | 5/5 | Premium | Portfolio pilota: "ritratto con **fluid reveal** interattivo, GSAP + Lenis" |
| `/tools/cobalt-sphere` | 12,3 s, 8,8 MB | 8,2 % | 5/5/6/6 | **1 WebGL 620×620, dpr 0,65** | **0/5** (2,3–3,9 % ogni ~850 ms) | export a pagamento | **Live**: sfera blu cobalto `#1734EE` con pieghe organiche che si muovono da sole (relief 0,08, folds 3,8, roughness 0,43), luce da studio, "drag to rotate". Il solo passaggio del mouse dà diff simili al moto a riposo: la rotazione è **su trascinamento**, non su hover |
| `/tools/fold-carousel` | 11,7 s, 5,3 MB | 1,4 % | 10/5/5/5 | 1 WebGL 745×873, dpr 1,93 | 4/5 | idem | **Live**: carosello WebGL, carta centrale piatta, le vicine "si piegano come porte" verso la lente, **smear a strisce + frangia spettrale (RGB) sui bordi**, settle speed 10,5, drag e rotellina |
| `/tools/crystal-cube` | 7,9 s, 8,6 MB | 1,7 % | 0 | 1 WebGL 664×498 dpr 1,45 | 5/5 | idem | **Live**: cubo di cristallo, rifrazione 1,52, dispersione 0,09, rotazione 0,16 rad/s (qui fermo: troppo pesante per SwiftShader) |
| `/tools/particle-galaxy` | 6,7 s, 4,8 MB | 3,5 % | 2/2/2/2 | 1 WebGL 664×374 | **0/5** | idem | **Live**: galassia di punti bianchi + blu `#4267FF`, rotazione lenta + turbolenza, tilt −23°, profondità 44 % |
| `/textures/tulip-study` | 8,7 s, 23 MB | 1,7 % | 0 | 1 **canvas 2D** 744×872 | 3/5 | export a pagamento | Filtro ASCII fotografico live (110 colonne, rampa caratteri, duotono) |
| `/textures/marble-signal` | 6,5 s, 14 MB | 2,7 % | 0 | 1 canvas 2D | 5/5 | idem | Dither ordinato (Bayer 2×2…8×8, halftone, grana) su una statua |
| `/textures/riso-glow-default-look` | 6,7 s, 4,3 MB | 11 % (slider) | 8/9/2/11 | 1 canvas 2D | **0/5** | idem | Halftone "riso" caldo con "animate plates": le lastre di inchiostro oscillano |
| `/shaders` (hub) | 5,9 s, 15 MB | 5,6 % | 50/0/0/0 | 0 | 5/5 | — | 11 shader con anteprima video; sidebar sticky |
| `/shaders/neural-noise-cursor` | 9,5 s, 6,3 MB | 4,3 % | 2/2/2/2 | 1 WebGL 744×872 dpr 1 | **0/5** (1–6 % ogni ~650 ms) | export | **Live, il più interessante**: filamenti verdi che scorrono in un campo profondo e **si piegano intorno al puntatore** (un "nodo" di curve segue il mouse: nei frame `m-p*` il nodo sta dove sta il puntatore, e resta al centro quando il mouse è fuori dal canvas). Parametri esposti: flow speed, noise scale, glow, **pointer influence, pointer radius**, edge fade, scroll colour shift |
| `/shaders/flowing-waves` | 10,9 s, 6,3 MB | 20,7 % | 18/17/15/13 | 1 WebGL | **0/5** (11–13 %) | export | **Live**: onde liquide bianco-argento su inchiostro `#171717`, distorsione di flusso, "center dimming 0,7". Cambia molto anche da fermo: il mouse qui non è distinguibile dal moto proprio |
| `/shaders/a-shader` | 26 s (lento), 5,9 MB | 12 % (cresce col tempo: è il moto proprio) | 0 | 1 WebGL | 0/5 ma 2–4 s per frame | export | Vetro scanalato animato; troppo pesante per il rendering software |
| `/shaders/gradient-dots` | 9,2 s, 6,3 MB | 6,1 % | 2/1/3/4 | 1 WebGL | 0/5 (0–5 %) | export | **Live**: griglia di punti (spacing 10, raggio 1,5) illuminata da campi di luce in movimento; shimmer 0 |
| `/shaders/old-television` | 7,2 s, 6,2 MB | **15,6 %** | 4/1/0/1 | 1 WebGL | 3/5 | export | **Live**: una **macchia di luminanza morbida che segue il puntatore** (pointer influence 0,3) su grana analogica 0,58, luce `#D4D4D4`, bloom spread 1. Nei frame la macchia si sposta verso l'ultimo punto del mouse dentro il canvas |

### 5.3 vividsites.app — 14 schede aperte (dialoghi della home)

Le carte **non sono link**: un clic apre un dialogo (`sheetIn`, sfondo sfocato) con il **video** del sito, i badge
Free/Premium, "Copy prompt" / "Deploy this site" / "View full prompt" (bloccato per i Premium) e i tag. **Non esiste
una demo live navigabile**: il "sito" è un mp4, che qui non si decodifica. Screenshot dei primi tre dialoghi in
`refs/vividsites/click-carta-{0,1,2}.png`, testi in `refs/vividsites/click-carte.json`. Nessun paywall aggirato: dei
Premium ho letto solo la riga di descrizione pubblica.

| # | Scheda | Categoria (mono) | Accesso | Descrizione pubblica | Osservabile qui |
|---|---|---|---|---|---|
| 0 | Brand New Day | Scroll Film | **Free** | "landing page built from one cinematic clip"; tag react, three.js, scroll film. È il brief di `SPEC-FILM.md` | poster: figura a punti rossa/blu dentro una gabbia wireframe, titolo per lettera |
| 1 | Plinth | Object Studio | Premium | "landing page from one clip" | poster: lettere "PLINTH" 3D su fondo arancio scuro |
| 2 | Massif | Mountain Guiding | Premium | idem | poster: montagna wireframe dorata |
| 3 | Murmur | Interface Studio | Premium | "**a full scroll film. One WebGL world, five acts that overlap instead of cut**" | poster: sfera di particelle bianca |
| 4 | Substrate | Materials Foundry | Premium | "a full scroll film. One WebGL world, five acts that overlap…" | poster scuro |
| 5 | Vesper | Automotive AI | Premium | "a hero section from one clip" | — |
| 6 | Aureum | Distillery | Premium | hero section | — |
| 7 | Apsis | Orbital Servicing | Premium | template | — |
| 8 | Enamel | Dental Clinic | Premium | landing page | — |
| 9 | Tencha | Matcha Room | Premium | landing page | — |
| 10 | Halo | Smart Ring | Premium | landing page | — |
| 11 | Char | Restaurant | Premium | landing page | — |
| 12 | Verve | Sparkling Energy | Premium | landing page | — |
| 13 | Glare | Eyewear | Premium | landing page | — |

Le pagine `/build`, `/guides`, `/playbook`, `/reviews`, `/custom`, `/create` esistono ma non contengono demo. In
`/#library` i filtri contano 15 Template, 99 Landing Page, 76 Hero, 29 "3D Section", 8 Background.

Lettura: vividsites vende **video + prompt**; la fluidità che si vede nelle anteprime è quella del video. Il valore per
noi è la *grammatica* (un mondo WebGL, atti che si sovrappongono, copy minimo) già assorbita in `SPEC-FILM.md`, più il
cursore e la comparsa delle carte (§3.3).

---

## 6. I dieci effetti più moderni e fluidi, come prompt-specifica

Criterio di scelta: (a) visto muoversi davvero (o misurato nei keyframes), (b) fluido per costruzione (compositor o
GPU, nessun layout), (c) compatibile con **verso l'interno** e con la **ONE RULE** del film (ogni valore = funzione
pura di `p`, più termini di tempo e di puntatore **limitati, a media zero, che non toccano mai il target della
camera**). Ogni scheda: riga italiana, poi il prompt-specifica in inglese tecnico, ricostruito dai frame e dalle
misure, **non** dal loro codice. I numeri senza "measured" sono stime ragionate.

### E1 — Campo di traiettorie che si piega intorno al puntatore (da `neural-noise-cursor`, horizonx)

*In italiano: le 42 traiettorie del nostro grafico "Profondità" scorrono da sole e si curvano dolcemente attorno al
mouse, come limatura vicino a una calamita; via il mouse, tornano dritte.*

```
EFFECT: pointer-bent trajectory field.
STACK: our existing 2D canvas with hand projection (scale = 1/(1 + rz*0.22), 42 paths, yaw -0.32 rad),
  drawn inside requestAnimationFrame, only while the canvas is on screen (IntersectionObserver). No library.
  Alternative for the film (act 3/4): the same displacement applied in the vertex stage of the fat-line strands
  (LineSegments2 / LineMaterial, @react-three/fiber, three r0.186 already installed).

THE ONE RULE OF THIS EFFECT:
  Every drawn point is a PURE FUNCTION of (path sample, p, t, m) where p = scroll progress, t = time in seconds,
  m = smoothed pointer in canvas space (mx, my in [0,1], plus mIn in {0,1}). No per-point velocity, no state.
  displaced = P + bend(P, m) + flow(P, t). Removing the pointer (mIn=0) collapses bend() to exactly zero.

GEOMETRY & NUMBERS:
  bend(P, m): d = P - M (screen space, after projection); r = |d|; R = 0.22 * min(canvasW, canvasH) (pointer radius:
    ~22% of the short side, measured impression on the reference: the knot is ~1/4 of the stage);
    w = smoothstep(R, 0, r)^2 (soft, zero outside R, zero slope at R so nothing "snaps" when entering the radius);
    tangential deflection, not radial: bend = w * A * perp(d)/r, A = 18 px * dpr (estimate). Tangential is what makes
    lines CURVE AROUND the pointer (the reference shows loops/whorls, not a hole); radial would push a bald spot.
  flow(P, t): advance each path's phase by 0.06 * t (paths already have a phase); amplitude 0 on the median curve
    (the lime line), so the data line never moves: only the bootstrap strands breathe.
  Pointer smoothing: m += (target - m) * (1 - exp(-dt / 0.12)). Time constant 120 ms: under ~80 ms it jitters with
    a 60 Hz mouse, over ~200 ms it feels rubbery. NOTE this smoothing is on the INPUT, outside the scene: allowed.
  Draw order: strands (0.20 alpha, 1 px), then median (1.6 px, --acc), then the head dot with a 12 px halo.
  Colour: strands --st-oro at 0.18-0.30 alpha over --bg; halo lime only on the median head. Two accents never in
    the same frame (SPEC-FILM): the field is GOLD (room), the median is LIME (figure).

MOUSE / TOUCH:
  Desktop: pointermove on the canvas's parent. Touch: mIn=0 (no hover on touch), the flow(t) term alone keeps it alive.
  Exit: on pointerleave set mIn target 0; the bend fades with the same 120 ms constant (no snap).

TRAPS:
  - Do NOT lerp the displaced points themselves (hysteresis: a moving pointer leaves trails that never resolve).
    Smooth only m, then recompute everything from scratch each frame.
  - Recomputing projection for 42 x ~400 points per frame is fine on desktop; on phone drop to 24 paths x 200
    samples, never drop the median.
  - Clear with fillRect of --bg, not clearRect over a transparent canvas: transparent canvases over the shader
    layer force expensive compositing.
  - Keep the head dot drawn AFTER the halo, and use globalCompositeOperation 'lighter' ONLY for the halo, then reset.
  - Devicepixel: canvas.width = cssW * min(dpr, 1.5) desktop, exactly 1 on phones; otherwise 3x pixels on iPhones.

FLOORS:
  prefers-reduced-motion: flow amplitude 0, bend amplitude 0, draw once (the graphic stays, the motion goes).
  No JS: the static PNG/SVG of the same chart (already the plan in MOTION.md).
  390 px: canvas width = container width (no fixed px), aspect 4:3, no horizontal overflow.
  Tab hidden: cancel the rAF (document.visibilitychange).
COST: 0 kB of library; CPU ~1-2 ms/frame desktop at 42 paths (estimate, unmeasured here: software renderer).
FILM ACT: 3 (Strategie, the strands) and 4 (Rischio, the drawdown valley) — the field is the room of those acts.
```

### E2 — Luminanza morbida che segue il puntatore (da `old-television`, horizonx)

*In italiano: una macchia di luce lime, molto sfumata, si sposta pigramente dove sta il mouse, sopra il nero. È la
"torcia" che dice al visitatore che la scena è viva. Costa zero.*

```
EFFECT: pointer-following soft luminance ("torch").
STACK: ONE DOM layer, position:fixed; inset:0; pointer-events:none; z-index below the text, above the shader.
  Framer Motion useMotionValue + useSpring on x/y; the glow is a radial-gradient painted once; only transform moves.
  No canvas, no shader uniform (ShaderGradient exposes no pointer uniform; do not fork it for this).

THE ONE RULE: glow position = spring(pointer), glow opacity = mIn * 0.9 * (1 - p_wipe). Nothing else reads it.

GEOMETRY & NUMBERS:
  Element: 640 x 640 px (phones: 360), background: radial-gradient(closest-side, color-mix(in oklab, var(--acc) 22%,
    transparent) 0%, transparent 70%). 22% lime at the centre is the ceiling: above ~30% the text --mut under it
    drops below 4.5:1 on --bg (DESIGN.md §8 measured that lime backgrounds kill --mut).
  Spring: stiffness 120, damping 24, mass 1 -> settles in ~0.45 s, no overshoot visible (the reference lags
    about 300-500 ms behind the pointer; pointer influence 0.3 on their panel).
  Idle drift when the pointer is still: none. (The reference blooms drift with noise; ours must not: a moving
    light under a table of numbers reads as a glitch.)
  Blend: mix-blend-mode: screen. On a near-black field screen ~= add, and it never darkens text.

MOUSE / TOUCH: pointermove on window (passive). pointer:coarse -> layer hidden. Leaving the window -> opacity 0 in 300 ms.
TRAPS:
  - filter: blur() on a 640 px element repaints every frame: paint the softness INTO the gradient instead.
  - Do not put the glow inside the sticky stage: a transform on an ancestor with perspective breaks the fixed layer.
  - z-order: under the text, over the shader/canvas; over the panels? No: panels are opaque --surf by design.
  - Keep will-change: transform ON this one element only.
FLOORS: reduced-motion -> hidden. Keyboard-only users never see it and lose nothing.
COST: one composited layer, one passive listener. 0 kB.
FILM ACT: all acts except 6 (Contatti/wipe): fade it out with p in the last 0.06 so the ending is still.
```

### E3 — Cursore anello + punto, che cambia stato sopra i bersagli (da vividsites; misurato)

*In italiano: un anellino lime segue il mouse con un filo di ritardo, un puntino sta esattamente sotto la freccia;
sopra un bottone l'anello si allarga; sopra un livello del film dice "apri". Il cursore di sistema resta.*

```
EFFECT: cursor ring + dot with target states.
STACK: two fixed <div>s, pointer-events:none, Framer Motion useMotionValue (dot, instant) + useSpring (ring).
  State from data-cursor attributes on targets (data-cursor="link" | "layer" | "drag"), read on pointerover via
  event delegation on document (one listener), never per element.

THE ONE RULE: dot = pointer; ring = spring(pointer); ring scale/label = f(state) with a 180 ms transition.
GEOMETRY & NUMBERS (measured on the reference: ring ~44 px, 1 px border, white ~60%; ours):
  dot 6 px, --acc, opacity 0.9. ring 40 px, border 1px solid color-mix(in oklab, var(--acc) 70%, transparent).
  ring spring: stiffness 300, damping 30 (settle ~180 ms; the reference lags a little less than E2, it must feel
    attached, not dragged). States: link -> scale 1.5, border 1.5 px; layer -> scale 2.2 + centered 12 px mono
    label "APRI" in --acc-ink on a --acc disc (this is the only place lime is a fill, 88 px, allowed as a control);
    drag -> ring becomes a 40x40 with two 6 px chevrons.
  Transition scale/opacity 180 ms var(--ease). Label swaps with opacity only.
TRAPS:
  - cursor:none on body is NOT used: system cursor stays (a11y, iframes, canvases, users with custom cursors).
  - mix-blend-mode: difference is invisible on near-black: use the lime border instead.
  - Do not read getBoundingClientRect on pointermove; states come from delegation, positions from the event.
  - Hide when the pointer leaves the window (pointerleave on document) or opacity stays stuck at the edge.
FLOORS: hidden under (pointer:coarse), under prefers-reduced-motion, and while a modal dialog is open.
COST: 2 layers, 1 listener. 0 kB. FILM ACT: all acts; the "layer" state appears in act 3 over the strategy panels.
```

### E4 — Moto proprio continuo dell'oggetto-eroe + inclinazione verso il puntatore (da `cobalt-sphere`, `particle-galaxy`)

*In italiano: la nuvola di punti del capitale non sta mai ferma del tutto: respira lentamente e si inclina di pochi
gradi verso il mouse, e torna dritta quando il mouse se ne va. Nessuno scroll richiesto: è la "fluidità continua"
che Davide chiede.*

```
EFFECT: idle float + cursor tilt on the instanced bead cloud (act 1 figure of SPEC-FILM).
STACK: @react-three/fiber, InstancedMesh (40k beads, r 0.5, 8x6), instanceColor baked once. Values written in
  useFrame from a plain mutable object {p, t, mx, my}; React never re-renders from any of them.

THE ONE RULE: group.rotation/position = F(p) + G(t) + H(m). G and H are bounded, zero-mean, and added to the
  FIGURE'S transform only, never to camera.lookAt. Scrubbing back to the same p reproduces F exactly; G and H are
  the only frame-to-frame difference, by design (the brief's own "idle float plus cursor tilt").
GEOMETRY & NUMBERS:
  G(t): y += 0.35 * sin(t * 0.9); rotation.y += 0.04 * sin(t * 0.37); rotation.z += 0.015 * sin(t * 0.61 + 1.3).
    Three incommensurate frequencies so the loop never visibly repeats (galaxy tool: "rotation speed" + "turbulence").
    Amplitudes in world units of a 14-unit figure: 0.35 = 2.5%: visible, not swaying.
  H(m): target tilt = (my - 0.5) * 0.14 rad on X, (mx - 0.5) * 0.18 rad on Y (+-8 / +-10 deg; the cobalt sphere
    turns more, but it is alone on screen; ours carries numbers next to it). Applied around the figure's own centre:
    translate(-c) rotate translate(+c), or the pivot drifts (the brief's "compensating translation").
  m smoothing: exponential, tau 0.15 s, computed from dt (clock.getDelta), so 30 fps and 120 fps feel identical.
  Speed of G scales with 1/(1+p*4) : the idle calms down as the camera flies (motion belongs to the intro, not to
    the corridor, where the swing already moves).
MOUSE / TOUCH: pointer on window, normalized to the canvas rect. Touch: H = 0, G stays. Drag-to-rotate: NO (the
  cobalt sphere does it, but a rotating data figure invites the reading "it is a toy").
TRAPS:
  - Lerp the pointer, never the rotation itself (double smoothing = mushy, and the second lerp is hidden state
    inside the scene).
  - camera.rotation.order = 'YXZ' (brief) or the tilt leaks roll.
  - Do not update instanceMatrix per bead for idle: transform the parent group (one matrix), the beads are static.
FLOORS: reduced-motion -> G = 0, H = 0 (figure stays, motion goes). DPR clamp 1 phone / 1.5 desktop. Tab hidden:
  frameloop="demand" and invalidate() only on input.
COST: negligible on top of the existing draw call (one matrix per frame). FILM ACT: 1 (Ingresso), fading by act 2.
```

### E5 — Titolo che si mette a fuoco da dietro, lettera per lettera (da `hero-char-rise` horizonx + `prEnter` vividsites)

*In italiano: le lettere del titolo arrivano da dietro, sfocate, e diventano nitide una dopo l'altra in meno di un
secondo. È la loro entrata "dal basso" tradotta nel nostro asse Z.*

```
EFFECT: per-letter depth focus-in (replaces translateY rises).
STACK: Framer Motion 13, motion.span per letter, or pure CSS @keyframes with --i for the stagger (preferred: 0 JS).
MEASURED ON REFERENCES: horizonx 0.85 s / 0.7 s cubic-bezier(.16,1,.3,1), translateY(var(--rise)) rotate(var(--rot));
  vividsites 0.7 s cubic-bezier(.22,.68,.32,1), translateY(18px) + blur(8px) -> none. Stagger not measured (estimate
  18-25 ms/letter: the whole first line lands in <1 s).
THE ONE RULE (DOM overlays of the film): opacity/transform of each overlay = smoothstep window on the ACT axis sp,
  not on real p (brief). This per-letter entry is the OPENING of the title overlay in act 1: it plays on TIME once,
  because it is part of the auto-intro, then the overlay's exit is a pure function of sp (back-to-front, blurring).
GEOMETRY & NUMBERS:
  from: opacity 0, transform: translateZ(-140px) (our --z-from), filter: blur(6px); to: none.
  duration 700 ms, easing var(--ease) = cubic-bezier(.2,.7,.2,1), delay 150 ms + i * 22 ms, max 40 letters
  (beyond that, the tail lands after 1 s: split into words, stagger per word 60 ms).
  perspective 1200px on the h1 (our --persp). No rotateX on letters: rotation per letter reads as "fun", not "technical".
  Exit (closing) per SPEC-FILM: opacity 1->0, translateZ(0 -> +120px) (toward the camera = "we pass through the
  title"), blur 0 -> 4px, window 0.10 wide on sp, smoothstep.
TRAPS:
  - blur on 40 spans for 0.7 s is fine; blur that stays is not: force filter:none at the end (animation-fill-mode both
    with a final keyframe filter:none).
  - Wrap letters in inline-block spans with white-space: pre for spaces or the words collapse.
  - aria: the h1 keeps the whole string in aria-label; spans are aria-hidden.
  - will-change: transform, filter set only via the animation window (class toggled), not permanently.
FLOORS: reduced-motion -> no animation, final state immediately. No JS -> final state (CSS-only variant is the reason
  to prefer @keyframes here).
COST: 0 kB. FILM ACT: 1 opening; the same recipe for the two repeated phrases in acts 3 and 5.
```

### E6 — Luce che corre lungo i filetti dell'HUD (da `ruled-flow`, shaders.com; misurato)

*In italiano: le linee sottili dell'HUD (assi, cornici, il filo di avanzamento) ogni tanto sono percorse da una
striscia di luce lime, una volta sola ciascuna, mai tutte insieme.*

```
EFFECT: light pulse travelling along hairlines.
MEASURED: mask-position-x -38cqw -> 100cqw, opacity 0->1 by 2.5% and 1->0 by ~17% of a 9.3-9.8 s linear track,
  iteration 1, several variants with slightly different timings (unsynchronized).
STACK: CSS only; ::after with a gradient strip moved by transform (not mask-position, which repaints).
THE ONE RULE: In the film the pulse is triggered by sp crossing a threshold (act boundary), not by time: the same
  scroll position always shows the same pulse phase. Implementation: the strip's translateX = f(sp) over a 0.04
  window; outside the window it is parked off-screen with opacity 0.
GEOMETRY & NUMBERS: strip width 38% of the line, gradient transparent -> --acc -> transparent, travel from -100% to
  +360% (so it fully leaves both ends), opacity 1 only in the middle 80% of the travel. If time-based (static page):
  duration 9.5 s linear, delay per line = index * 1.3 s, one iteration, restart on re-entry via IntersectionObserver.
  Never on more than 2 lines at once.
TRAPS: overflow:hidden on the line; the strip must be a child with position:absolute, or it paints outside;
  linear is right here (a light on a wire does not ease), the exception to "never linear" is deliberate and only
  for a non-interface glow.
FLOORS: reduced-motion -> no strip (static line). COST: 0 kB, compositor only.
FILM ACT: 2 (Metodo: the grid room) and 5 (Monitor: the horizon bar), at act handoffs.
```

### E7 — Smear e frangia spettrale sul livello che passa oltre la camera (da `fold-carousel`, horizonx)

*In italiano: quando un livello (una strategia) ci passa accanto e sparisce dietro la camera, per un attimo si
"striscia" e i suoi bordi si separano nei tre colori, come in un obiettivo. Solo su desktop e solo per 0,1 di p.*

```
EFFECT: passing-layer motion smear + RGB fringe.
OBSERVED: fold carousel side cards "smeared into streaks with a spectral edge fringe" (their words), visible in
  frames as horizontal streaking and coloured edges on the folded cards.
STACK (DOM version, our StrategyFlythrough): the layer's own translateZ already produces the pass. Add, as PURE
  functions of layerZ(p): scaleX = 1 + 0.12 * k, where k = smoothstep(120, 520, z) (k rises only while the layer is
  between "in focus" and "gone"); two aria-hidden clones of the layer's border/title (no text content: the clones are
  the outline only) offset by +-3px * k in X, tinted with mix-blend-mode: screen in rgb(255,80,80) and rgb(80,160,255)
  at opacity 0.35 * k. That is the fringe. No filter:blur (compositor-unsafe); the stretch reads as blur at speed.
  Film version (r3f): a fullscreen post pass is NOT worth it (adds a render target); instead the LineMaterial
  strands get vertex-colour fringing: draw each strand 3 times at +-1.2 px screen offset with R/G/B tint, only while
  its local t is in RELEASE (0.55-0.80). Cost: 3x strands draw calls for 6 strands = nothing.
GEOMETRY & NUMBERS: k window 120..520 px of z (from the existing opacity table [-1700,-900,-160,120,520]); max
  stretch 12% (more reads as a glitch); fringe offset max 3 px (more separates into three legible copies).
TRAPS: the clones must be position:absolute; inset:0 inside the layer, or they shift layout; never fringe the text
  itself (unreadable, and a11y tools would see it three times).
FLOORS: reduced-motion -> k = 0 always; phones -> fringe off (2 fewer layers per strategy).
COST: 2 extra composited layers per strategy on desktop. FILM ACT: 3, the strands' RELEASE phase and the layer pass.
```

### E8 — Carta "tinta" con alone del proprio colore e contenuto che si sveglia a fuoco (da horizonx `card-glow-mesh` + anteprime su hover)

*In italiano: ogni pannello di strategia ha dietro un alone del suo colore (oro, lime); quando è a fuoco l'alone
sale un po' e il suo grafico comincia a muoversi; quando passa oltre, tutto si spegne.*

```
EFFECT: tinted halo + wake-on-focus.
MEASURED: .card-glow-mesh opacity 0.069, translateY(-63px) (a blurred colour mesh behind each card); card
  transitions opacity .45s ease-out + transform .2s; hover video plays.
STACK: CSS ::before radial-gradient halo (no box-shadow animation), opacity driven by Framer useTransform of
  layerZ(p) in the flythrough; the panel's chart canvas starts its rAF only when focus > 0.5 (IntersectionObserver
  is not enough here because the layer is always "in view": use the same focus scalar).
THE ONE RULE: halo opacity = 0.08 + 0.10 * focus(p); chart animation phase = t * focus(p) (so it freezes, never
  jumps, when focus drops); hover adds +0.04 to the halo with a 180 ms transition.
GEOMETRY & NUMBERS: halo = radial-gradient(60% 50% at 50% 30%, var(--st-oro) 0%, transparent 70%), 140% of the card
  size, behind the card, opacity 0.08 base (measured 0.069 on the reference: ours a touch higher on a darker field).
  Box-shadow (static, from DESIGN.md): 0 25px 75px -55px <strategy colour at 40%>.
  Focus scalar: 1 - smoothstep(0, 400, |z|) with z = layerZ(p) (plateau of +-40 px already exists: full focus there).
TRAPS: animating box-shadow = repaint; animate the ::before opacity instead. mix-blend-mode on the halo is
  unnecessary on black and costs a compositing group: plain alpha.
FLOORS: reduced-motion -> static halo at 0.12, chart static. COST: 0 kB. FILM ACT: 3 (strategy panels), 5 (monitor).
```

### E9 — Barra di navigazione che diventa pillola di vetro allo scroll, con avanzamento (horizonx, vividsites; misurato)

*In italiano: all'inizio la barra è trasparente sul nero; appena si entra nel film diventa una pillola di vetro
smerigliato con il contatore di atto e il filo di avanzamento. Sparisce (in Z) durante il wipe finale.*

```
EFFECT: glass pill nav + act counter + progress.
MEASURED: horizonx nav fixed 1216x58 at top .75rem, radius pill, backdrop blur (blurEls present); vividsites sticky
  72 px glass pill with mono counter "227 / 227".
STACK: our existing top bar. State "in film" = sp > 0.02, set via the same p object (a class toggle on a ref, not
  React state, once per crossing). backdrop-filter: blur(20px) saturate(1.1) on --surf at 78% alpha (DESIGN.md's
  #0b0f12e8), border 1px --line.
THE ONE RULE: pill alpha = smoothstep(0.00, 0.03, sp); progress bar scaleX = p; counter = 1 + floor(sp * 6)
  (an integer step function of sp: the film has six acts; text swaps with 200 ms opacity, never counts).
  Exit: translateZ(-300px) + opacity -> 0 over the wipe window (real p 0.90-1.0).
TRAPS: backdrop-filter on an element with will-change:transform creates a new stacking context per frame on some
  GPUs: keep the pill static in layout and move only its inner progress bar; toggle the blur class once, do not
  animate blur radius. On phones use a solid --surf2 instead of blur (blur on iOS Safari with a WebGL canvas
  underneath is the classic 20 fps trap).
FLOORS: reduced-motion -> pill always on, no transform exit. 390 px: counter and email button collapse (already).
COST: one blurred layer on desktop. FILM ACT: 2 -> 6.
```

### E10 — Bottone principale: sweep di luce + magnetismo leggero (da vividsites `luxSweep` + horizonx `scale 1.035`)

*In italiano: la CTA principale, all'hover, viene attraversata una volta da un riflesso e si sposta di pochi pixel
verso il mouse; al rilascio torna al suo posto con la curva del sito. È l'unico bottone che lo fa.*

```
EFFECT: light sweep + light magnetism on the primary CTA only.
MEASURED: vividsites luxSweep translateX(120%) and hover translateY(-1px), transform .3s cubic-bezier(.22,.68,.32,1);
  horizonx "Sign up" scale(1.035) .2s ease-out. Magnetism itself not measured on either: it is our proposal.
STACK: CSS for the sweep (E-V4 code in §3.3); Framer useMotionValue for the offset; one pointermove listener on the
  button only.
THE ONE RULE: offset = clamp(pointer - centre, +-r) * k with k = 0.18 while hovering, k = 0 otherwise (spring back:
  stiffness 260, damping 22); scale = 1 + 0.03 * hover. The sweep runs once per pointerenter (900 ms, var(--ease)).
GEOMETRY & NUMBERS: r = half the button size + 24 px capture margin; max travel = 0.18 * r (about 6-8 px on a 44 px
  button: felt, not seen). Anything above ~0.3 makes the label hard to hit for tremor users.
TRAPS: magnetism on a button that also moves the layout (margin) breaks the hit target: transform only, and the
  hit area is the untransformed box + the 24 px margin (use a padding wrapper). Never magnetize links in text.
FLOORS: reduced-motion -> no offset, no sweep, colour change only (200 ms). Touch -> none. Keyboard focus shows the
  DESIGN.md outline, unmoved.
COST: 0 kB. FILM ACT: 6 (Contatti) and the "Apri il simulatore" CTA in act 5. One button per screen.
```

### Riserve (viste, utili, ma non tra i dieci)

- **Render a bassa risoluzione** (shaders.com, dpr 0,21–0,44): `pixelDensity 0.5` sul nostro shader e `dpr` 1 sul
  canvas 2D dei telefoni. È un risparmio, non un effetto: va fatto e basta.
- **Riflesso del titolo** sotto la "superficie" (editor-hero di shaders.com): per il titolo dell'atto 1, `scaleY(-1)`
  mascherato al 18 %. Solo se il titolo poggia visivamente su un piano (la stanza dell'atto 2 ha il "thin horizon
  bar": lì ha senso).
- **Dither/ASCII come texture** (textures horizonx): potrebbe diventare la grana della plate della figura (la nuvola
  di punti campionata da una plate ditherata dà punti più "quantizzati" e tecnici). Da provare nel bake, non a runtime.
- **Particelle disperse dal cursore che tornano a posto** (Orvane, 150k punti): lo stesso principio di E1 applicato
  alle perle della figura: `offset = w(r) * A * perp(d)` sui vertici via attributo + uniform del puntatore in un
  `onBeforeCompile`. Più caro (shader custom); tenuto come **fase 2** se E4 non basta.

---

## 7. Piano di adozione nel film

Obiettivi dichiarati da Davide: **ingresso automatico all'apertura**, **interattività col mouse ovunque**, **fluidità
continua**, **movimento verso l'interno**. Vincolo: la ONE RULE di `SPEC-FILM.md` (tutto funzione pura di `p`; il
DOM sull'asse degli atti `sp`; due accenti mai nello stesso fotogramma; floors non negoziabili).

### 7.1 Come stanno insieme ONE RULE, tempo e mouse (da fissare prima di scrivere codice)

Ogni valore della scena è `V = F(p) + G(t) + H(m)` con:
- `F(p)`: la camera, i keyframe, le finestre degli overlay, i fili. **Solo** questa parte muove la camera e il suo
  target. Scrub avanti/indietro → stesso fotogramma.
- `G(t)`: respiro a media zero (E4, la deriva della stanza, il flusso delle traiettorie E1). Ampiezze piccole,
  frequenze incommensurabili, mai sul target della camera. **Questa è la "fluidità continua"**: la pagina vive
  anche da ferma, senza rubare lo scroll (niente Lenis).
- `H(m)`: il puntatore, **smussato all'ingresso** (costante di tempo 120–150 ms, calcolata con `dt`), poi usato in
  modo puro. Inclina la figura (E4), piega il campo (E1), sposta la torcia (E2), guida il cursore (E3). Zero su
  touch, zero con reduced-motion.
- Trappola da scrivere nel codice come commento: **si smussa solo l'input `m`, mai un valore di scena**; un
  secondo lerp dentro la scena è stato nascosto e crea isteresi (scrub all'indietro ≠ scrub in avanti).

**Ingresso automatico** (l'unica eccezione, come deciso in SPEC-FILM): `p_eff = clamp01(p_scroll + off)`, con
`off = min(off_t, off_p)`, `off_t = 0.06 · smoothstep(0, 1, t / 2.5 s)`, `off_p = 0.06 · max(0, 1 − p_scroll / 0.12)`.
Perché così: a `t = 0` vale 0 (si parte fermi davanti allo schermo); dopo 2,5 s vale 0,06 (siamo entrati); quando
l'utente scorre, `off` scende linearmente e `p_eff` continua a **salire** (derivata ≥ 0,5: mai un passo indietro);
scrub a `p_scroll = 0` dopo l'intro → `p_eff = 0.06`, il fotogramma post-intro, coerente. Con reduced-motion `off_t`
è 0,06 dal primo frame (nessuna auto-riproduzione). Nessuno stato dentro la scena: `t` e `p_scroll` sono i due
scalari scritti nell'oggetto condiviso una volta per frame.

**La sequenza d'ingresso**, dai frame di Davide (`esempio/00-arrivo.png` → `play-3.png`): atto 0 = davanti a uno
schermo con il grafico (piano `PlaneGeometry` con `CanvasTexture` del grafico "Profondità", cornice sottile, alone
lime sotto); `p_eff` 0 → 0,06: la camera avanza (leg LINEARE, come chiede il brief per le partenze) fino ad
attraversare il piano; il piano sfuma (`opacity = 1 − smoothstep(0.03, 0.06, p)`) e dietro ci sono già le
traiettorie in 3D (le stesse curve, estruse in profondità) che convergono al punto di fuga; l'HUD DOM (data
`2026-09`, capitale `328.232 €`, "capitale mediano nel percorso") è una **funzione di `sp`**: indice della serie
= `floor(sp · N)`, valore = `serie[indice]`, `tabular-nums`, larghezza fissa. Non è un contatore che sale: è la
lettura della serie nel punto in cui siamo (compatibile con "mai contatori"). Le cifre vengono da `COPY.md`/docs,
non dal codice.

### 7.2 Quali prompt-specifica, in quale atto, in che ordine di costruzione

| Ordine | Effetto | Atto del film | Perché prima | Fallback / floor |
|---|---|---|---|---|
| 1 | **Ingresso automatico** (§7.1) + **E5** titolo a fuoco da dietro | 0 → 1 (Ingresso) | È la richiesta n. 1 di Davide ed è la cosa che rende il sito "non statico" nei primi 3 s | reduced-motion: fotogramma post-intro statico, titolo già nitido |
| 2 | **E4** respiro + inclinazione della figura | 1 (Ingresso), sfuma entro l'atto 2 | Fluidità continua a costo zero; usa la figura già prevista dal brief | touch: solo respiro; reduced: fermo |
| 3 | **E2** torcia lime + **E3** cursore anello | tutti (spenti nel wipe) | Interattività "ovunque" con due layer DOM, senza toccare la scena | pointer:coarse e reduced: nascosti |
| 4 | **E1** campo che si piega al puntatore | 3 (Strategie) e 4 (Rischio) | È l'effetto più vicino ai dati: il visitatore "tocca" le traiettorie. Sul canvas 2D esistente, poi sui fili `LineSegments2` | telefono: 24 tracce, nessun bend; reduced: disegno statico |
| 5 | **E8** alone tinto + sveglia a fuoco, **E9** nav a pillola | 3 (pannelli), 2 → 6 (nav) | Struttura e orientamento; poco costo | telefono: nav senza blur |
| 6 | **E6** luce sui filetti agli snodi di atto, **E10** CTA con sweep e magnetismo | 2 e 5 (E6); 5 e 6 (E10) | Rifiniture: si fanno quando il resto è misurato | reduced: niente |
| 7 (opzionale) | **E7** smear + frangia sul livello che passa | 3 | Solo desktop, solo dopo aver misurato gli fps di 1–6 | telefono/reduced: off |

Regole di cantiere che vengono dai tre siti e dai nostri documenti:
- **Un solo canvas WebGL** in pagina (il film). Il grafico "Profondità" resta canvas 2D finché non entra nel film
  come `CanvasTexture`; mai due contesti GL vivi insieme (horizonx ne ha uno per tool e sta a 5–12 s di caricamento).
- **DPR**: 1 su telefono, 1,5 desktop (brief); `pixelDensity 0.5` per lo sfondo sfocato (lezione shaders.com).
- **Peso**: i tre siti stanno fra 28 e 223 MB per la home. Noi: prima schermata ≤ 350 kB gzip senza film, film in
  chunk separato dopo il primo disegno; niente video, niente mp4, niente HDR remoti.
- **Accenti**: lime alla figura e ai fili, oro alla stanza (E1 campo oro, E2 torcia lime: la torcia si spegne
  nell'atto 2, la stanza, dove l'oro comanda; si riaccende nell'atto 3 sui pannelli lime). Da verificare con lo
  screenshot a ogni confine: mai i due insieme.
- **Misurare prima di aggiungere**: dopo i passi 1–4, screenshot a 8 punti di `p` in avanti e indietro (devono
  coincidere a meno di `G(t)`), CLS 0, nessuno scroll orizzontale a 390 px, fps su un telefono vero (qui non si può).

### 7.3 Proposte per l'art director (palette e tipografia), riassunte

1. Nero **tinto** confermato (`#080b0e`): i tre riferimenti sono neutri, il brief chiede un nero che tiene la tinta.
2. Titolo a **due toni** confermato (vividsites fa lo stesso); peso 500, tracking −0,045 em: nel mezzo del gruppo.
3. **Più mono**: etichette dell'HUD, contatore di atto, data e capitale in IBM Plex Mono 12–14 px maiuscolo con
   +0,13 em; è ciò che rende "strumento" shaders.com e vividsites.
4. Raggi: valutare **8 px** sulle carte del film (oggi 14) per un tono più tecnico; 4 e pillola restano.
5. Un **colore di stato** distinto dall'accento non serve: `--ok` = lime con icona/testo, come già scritto. Il verde
   `#4ade80` di vividsites non si importa.
6. Cursore: anello lime al 70 %, punto lime 6 px, cursore di sistema visibile. Nessun `cursor: none`.

### 7.4 Cosa non abbiamo potuto verificare (e va fatto su una macchina vera)

- Tutto shaders.com in movimento (WebGPU) e tutte le anteprime mp4 (vividsites, horizonx explore): qui poster o nero.
- Fps reali di E1/E4/E7 su telefono economico e su Safari/iOS (sticky + 3D + blur).
- Il magnetismo di E10 e lo stagger di E5: valori proposti, non misurati sui riferimenti.
- I file di questa osservazione (screenshot, video, `measure.json`, `note.json`) sono nello scratchpad indicato in §0:
  non fanno parte del repository e vanno copiati altrove se servono dopo la sessione.
