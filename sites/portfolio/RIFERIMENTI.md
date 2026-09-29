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

*(in compilazione: il crawl è in corso)*

## 6. I dieci effetti più moderni e fluidi, come prompt-specifica

*(in compilazione)*

## 7. Piano di adozione nel film

*(in compilazione)*
