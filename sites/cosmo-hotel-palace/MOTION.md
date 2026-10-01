# MOTION — Cosmo Hotel Palace

Versione 1 · 1 ottobre 2026 · motion designer
Fonti: `BRIEF.md`, `DESIGN.md` (vincolante), `COPY.md`, `sites/studio/STUDIO.md` sez. 3.
`UX.md` al momento della stesura è ancora il segnaposto: dove serviva una scelta di struttura ho assunto e l'ho scritto in 0.2. Se UX cambia l'ordine delle scene, cambiano solo le tabelle 2.3 e 7: le regole non cambiano.

**Come leggere.** Le sezioni 3–6 descrivono le scene una per una (cosa si muove, con quale `p`, easing, durata, cosa vede chi ha `prefers-reduced-motion` (RM), cosa succede su telefono). La 8 è il catalogo di effetti riusabili. La 9 è la qualità adattiva. La 10 sono i budget.

**Cosa è misurato e cosa no.** I pesi in kB gz della sezione 1.3 li ho **misurati** impacchettando le dipendenze del progetto con esbuild. Tutto il resto (fps, tempi di parsing, memoria su iPhone, supporto delle scroll-driven animations su Safari) è **stima o ipotesi da verificare su dispositivo reale**: la sezione 11 dice come.

---

## 0. Riassunto, assunzioni, conflitti

### 0.1 In una pagina
- Un'idea forte per schermata. L'idea del sito è **«accendi la luce»**: ogni ambiente si illumina quando lo guardi. Motivo ricorrente: l'**accensione** (alone delle lampade 0→1 in 480 ms). Lo spettacolo principale è **alba→sera nella hall**; il resto è sobrio.
- Lo scroll è sempre quello nativo. Le scene «fissate» usano `position: sticky` (nessuno scroll-jacking), si possono saltare e rivedere.
- Ogni valore di scena è funzione pura di un numero `p` (0→1). Dove l'utente ha un controllo suo (orbita, slider) vale la stessa regola: stato = numeri in ingresso, mai molle nascoste.
- Si anima solo `transform` e `opacity`. Eccezioni dichiarate: colori delle luci/materiali nel 3D (non toccano il DOM), e il testo dei numeri che salgono (sez. 8.3).
- **Un solo canvas WebGL per pagina, mai due** (sez. 2.2). Si parte sempre dal poster SVG; il 3D si accende dopo.
- Qualità adattiva misurata (sez. 9): si parte da «mid» sul telefono, si scende solo sotto 48 fps per 1 s, mai in «lite» per sospetto.

### 0.2 Assunzioni (perché UX.md è vuoto)
| # | Assunzione | Se è sbagliata |
|---|---|---|
| A1 | Ordine della home: Hero hall → Perché sceglierci → Camere → Centro Congressi → Cosmo Grill & Lounge (sera) → Wellness → Dintorni/percorso Milano → Prenota + Contatti + footer (sera). È l'ordine del BRIEF e di COPY. | Cambia solo la tabella 2.3. |
| A2 | Layout hero come in DESIGN 4.1: testo su 5–6 colonne in un pannello pieno, diorama ad arco su 7–8 colonne che sfonda il margine. Su telefono: arco in alto (circa 58 svh), pannello testo sotto. | Cambia solo la posizione dello stage. |
| A3 | «Come viaggi? Per lavoro / Per piacere» riordina le sezioni con `order` CSS (nessun rimontaggio). | Se UX lo toglie, sparisce 6.7. |
| A4 | Misure delle camere: Classic 4,0 × 5,5 m (= 22 m²); Family e Suite 8,0 × 5,5 m (= 44 m²). Sono proporzioni, non rilievi: i m² sono veri, le misure dei lati no. | Si cambia una costante `ROOM`. |
| A5 | Hall: dimensioni stilizzate (circa 12 × 14 m, lucernario 5 × 5 m a 8 m). Non abbiamo il rilievo. | Si cambia una costante `HALL`. |
| A6 | Pareti mobili: COPY lascia `[DA CONFERMARE]` le configurazioni. Uso Costellazioni 4 × 2 e Divinità 5 strisce come **illustrazione**, senza scrivere numeri per le sale parziali. | Si cambia `DIVISIONI`. |
| A7 | Il pulsante «Prenota»/barra: DESIGN 7 dice «non si anima». Lo leggo così: nessun effetto decorativo (pulsare, riflessi, magnetismo). Compare/scompare con un fade da 160 ms e il bottom sheet su telefono scorre in 240 ms (serve a capire cosa succede). | Se serve zero movimento: tolgo i due fade. |

### 0.3 Conflitti trovati tra i documenti (da portare all'art director / UX)
1. **Zoom diorami.** DESIGN 5.5: «zoom bloccato». COPY 3: «Pizzica per avvicinarti», «+ e − per lo zoom». Proposta: zoom **limitato** a ±15% (solo pizzico e tasti +/−), **la rotellina del mouse non zooma mai** (non si ruba lo scroll). Soddisfa tutti e due. Se l'art director preferisce zoom zero, tolgo il pizzico e la riga di COPY.
2. **Wellness 3D.** COPY 7 ha l'aria-label «Ricostruzione 3D…» e DESIGN 5.5 non dà un budget 3D al wellness. Proposta: il wellness è **illustrazione SVG isometrica** (0 canvas, 0 memoria grafica). Se UX/art director vogliono il 3D, serve un quinto budget e va ridiscusso il numero di scene 3D su iPhone. Da cambiare l'aria-label in «Illustrazione».
3. **Giornata del Grill.** COPY: a pranzo il Grill ospita eventi, non il pubblico. Il cursore «Mattina → Pranzo → Aperitivo → Sera» mostra la **luce della sala**, e il testo accanto (già in COPY) dice cosa c'è davvero. Il movimento non deve suggerire un servizio a pranzo: niente piatti serviti a pranzo, solo luce.
4. **Barra prenotazione «non si anima»** vs fade di comparsa: vedi A7.
5. **Lunghezza della home.** Le tre scene fissate valgono circa 620 svh di scroll su desktop (520 su telefono). È molto. Se UX lo trova troppo, la prima da accorciare è il Grill (240 → 180 svh).

---

## 1. Regole del movimento

### 1.1 Token (da copiare in `globals.css`)
```css
:root{
  --d-micro:160ms;  /* hover, press, fade di stato */
  --d-ui:240ms;     /* transizioni di interfaccia, bottom sheet, chip */
  --d-in:480ms;     /* ingressi, sedie, porte, letto */
  --d-scene:600ms;  /* giorno->sera, scena */
  /* massimo assoluto 800 ms, esclusi i movimenti legati allo scroll */
  --e-in:cubic-bezier(.2,.7,.2,1);   /* ingresso e cambio di stato */
  --e-out:cubic-bezier(.4,0,1,1);    /* uscita */
}
```
- In JS la stessa curva `(.2,.7,.2,1)` va implementata una volta sola (`lib/motion/bezier.ts`, circa 20 righe, risolutore di Newton) così CSS e 3D hanno lo stesso carattere.
- **Easing dei movimenti legati allo scroll (scrub): `linear`.** È l'unico caso in cui `linear` è giusto: il contenuto deve seguire il dito 1:1, un easing darebbe l'impressione di ritardo. Vale solo per `p → valore`. Il «carattere» sta nella funzione (smoothstep, tabelle a punti), non nel tempo.
- Niente rimbalzo, niente molla visibile, niente overshoot. L'inerzia dell'orbita è uno smorzamento esponenziale (camera-controls `smoothTime`), non una molla.
- Si usano `translate`/`translateY` 2D (non `translate3d`) per le cose piccole: su iOS ogni `translate3d` è un layer composito in più. `translate3d` solo sul contenitore dello stage.
- **Niente `will-change`** (regola iPhone). Il browser promuove da solo un elemento mentre la sua animazione gira.
- **Nessun loop infinito.** Ogni animazione a ciclo gira al massimo 5 s dopo l'ingresso in vista (`animation-iteration-count` finito), poi si ferma: è più leggero e rispetta WCAG 2.2.2 (pausa/stop per ciò che si muove da solo oltre 5 s).
- Niente cursore speciale, niente loader a pagina intera, niente smooth-scroll a libreria (Lenis e simili sono scroll-jacking: vietati).

### 1.2 Cosa fa chi ha `prefers-reduced-motion: reduce` (regola globale)
- Niente parallasse, niente scene fissate (la sezione torna alta quanto la sua scena, `--travel: 0`), niente scrub, niente pulsazioni, niente invito al trascinamento, niente loop.
- Le sezioni compaiono già nello stato finale. Il cambio giorno→sera, i chip, la disposizione delle sedie: **crossfade o salto da 200 ms**, mai movimenti.
- Il 3D non si ferma: l'orbita resta a richiesta dell'utente, **senza inerzia** (`smoothTime = 0.05`, `draggingSmoothTime = 0.01`). Nessuna auto-rotazione.
- In JS: `useReducedMotion()` con `matchMedia('(prefers-reduced-motion: reduce)')` e ascolto del cambio (si può cambiare a pagina aperta). Il CSS usa lo stesso media query: una sola fonte di verità per i due mondi è `html[data-rm]`, messo dall'hook.

### 1.3 Stack e costo (misurato)
Ordine di semplicità: CSS (transition, `@keyframes`, scroll-driven animations) → piccolo hook proprio → three.
| Strumento | Peso gz misurato | Decisione |
|---|---|---|
| CSS + hook `useSceneP`/`useReveal` propri | ≈ 1–2 kB (stima, codice di questo documento) | **Base di tutto** |
| `three` con le sole classi che usiamo (renderer, Lambert, istanze, texture da canvas, luci) | **135 kB** | Core del 3D |
| `three` intero | 189 kB | Evitare |
| `camera-controls` (orbita con inerzia) | **≈ 12 kB** + three | Usarlo: inerzia, limiti, `setLookAt` animato, `update()` che dice se si è mosso (perfetto per `demand`) |
| `@react-three/fiber` | **+57 kB, e trascina `three` intero**: totale misurato **248 kB** | Vedi 2.2: costa 100 kB in più del three puro |
| `three/examples/.../BufferGeometryUtils` (`mergeGeometries`) | ≈ 6 kB sul subset (62 kB misurati con tutto three dentro) | Serve a unire i mesh statici |
| GLTFLoader + Meshopt | ≈ 100 kB misurati (con three intero) | **Non usare**: il tronco d'ulivo si fa in codice (3.7) |
| `framer-motion` `LazyMotion`+`domAnimation`+`m` | **27,8 kB** (con `useScroll`+`useTransform`: 44,5 kB) | Non serve a questo piano. Se il frontend lo vuole per il bottom sheet, solo `LazyMotion`+`m`, mai nel percorso critico |
| GSAP + ScrollTrigger | non misurato (≈ 30–40 kB, stima) | **Non usare**: sticky + `--p` + scroll-driven CSS coprono tutto. Si riconsidera solo se serve una timeline orchestrata che non si riesce a scrivere come funzione di `p` |
| Lenis / smooth scroll | – | Vietato (scroll-jacking) |

Brutto da dire ma vero: **con r3f il 3D pesa circa 248 kB gz contro circa 147 kB (three + camera-controls) con three puro**. La differenza (~100 kB gz, parsing su un telefono economico stimato 150–300 ms) è il prezzo della comodità di React nel canvas. Raccomandazione: **three puro in uno `Stage` imperativo, React solo per l'HTML sopra** (hotspot, slider, chip). Funziona meglio anche con il canvas unico (2.2). Se il frontend preferisce r3f, tutte le regole qui valgono uguali (`frameloop="demand"`, `invalidate()`), e il budget JS della sez. 10 passa al valore r3f.

Scroll-driven animations CSS (`animation-timeline: view()/scroll()`): Chrome/Edge 115+, Safari 26+ (**da verificare su iPhone reale**, non lo do per scontato), Firefox da verificare. Regola: **dove il browser non le ha, l'effetto decorativo sparisce e resta lo stato finale** (`@supports not (animation-timeline: view())`). Le scene 3D non dipendono da questo: usano `useSceneP` (JS).

---

## 2. Architettura

### 2.1 La regola d'oro, applicata
```
scena = F(p)          // p ∈ [0,1], scroll dentro la scena fissata
scena = F(p_cam, p_luce)   // solo dove l'utente ha due controlli distinti (hero in RM, vedi 3.6)
```
- Niente stato dentro la scena, niente inseguimenti: stessi numeri in ingresso → stesso identico fotogramma, anche riavvolgendo.
- I **tween** (sera 600 ms, sedie 720 ms, camera 480 ms) non sono stato: sono un pilota che porta un numero `k` da 0 a 1; la scena resta `F(k)`.
- Dove la scena viene dal clic (configuratore, camere) `p` è il `k` del tween; dove viene dallo scroll è la posizione nella sezione fissata.

### 2.2 Lo Stage: un solo canvas, una sola volta
Problema iPhone: ogni contesto WebGL creato/distrutto consuma memoria e Safari ne limita il numero; lo smontaggio non libera in modo affidabile. DESIGN dice «un canvas vivo per volta», qui lo rendo più forte: **un solo `<canvas>` e un solo renderer per tutta la visita**.

- `Stage` (singleton nel layout root, che in Next resta montato durante la navigazione interna): crea il canvas **una volta**, al primo slot che si avvicina.
- Ogni scena 3D ha uno **slot** nel DOM: `<div data-stage-slot="hall">` con dentro il **poster SVG** (stesso punto di vista, stesse tinte).
- `IntersectionObserver` con `rootMargin: '30% 0px'` su tutti gli slot. Lo Stage assegna il canvas allo slot con la maggiore area visibile: `slot.append(canvas)`, `renderer.setSize(w, h, false)`, `scene.init()`, e poi il poster fa **crossfade 480 ms** (`opacity`) sopra al canvas e passa a `visibility:hidden`. Il poster **resta nel DOM**: serve se il contesto va perso.
- Se due slot sono visibili insieme (giunzione tra scene) il canvas sta in quello più visibile; l'altro mostra il poster. Il poster è identico, la giunzione non si nota.
- Quando lo slot esce: `scene.dispose()` (geometrie, materiali, texture **tutte**; si tengono solo le texture condivise: alone, ombra) e il canvas viene staccato. Test di QA: dopo 10 cambi di scena `renderer.info.memory.geometries` e `.textures` tornano al valore di partenza.
- `visibilitychange`: pagina nascosta = loop fermo; nascosta da più di 20 s = scena smontata e canvas a 1×1 px (si libera memoria grafica quando si apre il motore di prenotazione in un'altra scheda). Al ritorno si ricostruisce.
- `webglcontextlost`: `preventDefault()`, poster di nuovo visibile subito, tentativo di ripristino al `webglcontextrestored`. Due perdite nella stessa visita = si resta sul poster.
- **Da verificare su iPhone reale:** che riposizionare lo stesso canvas con `append` mantenga il contesto (per le specifiche sì). Piano B se non regge: stesso Stage, ma canvas ricreato a ogni cambio di scena (sempre uno solo vivo).
- Boot: `next/dynamic(() => import('@/3d/stage'), { ssr: false })` dentro un Client Component (in Server Component non è ammesso). Parte con `requestIdleCallback(…, { timeout: 1500 })` dopo l'evento `load`, e subito al primo scroll o tocco. Prima: solo poster.

Loop **a richiesta**:
```ts
let raf = 0
const wake = () => { if (!raf) raf = requestAnimationFrame(frame) }        // r3f: invalidate()
function frame(now: number) {
  raf = 0
  const dt = Math.min((now - last) / 1000, 0.05); last = now
  const moving = scene.update(dt)          // true se qualcosa è ancora in moto
  renderer.render(scene.root, scene.camera)
  meter.tick(dt * 1000, now, moving)       // la qualità si misura SOLO se animava (sez. 9)
  if (moving) wake()
}
// svegliano il loop: scroll di p, pointer su canvas, tween, resize, cambio sera/stanza
```

### 2.3 Mappa della home
| # | Scena | Tipo | Scroll fisso (desktop / telefono) | Slot 3D |
|---|---|---|---|---|
| H0 | Hero: la hall, alba→sera | sticky, `p` | 180 svh / 160 svh | `hall` |
| H1 | Perché sceglierci | ingressi + stato | nessuno | no (SVG) |
| H2 | Camere: diorama + chip Classic/Family/Suite | clic (tween), non fissata | nessuno | `rooms` |
| H3 | Centro Congressi: le sedie si dispongono | sticky, `p` | 200 / 160 svh | `sala` |
| H4 | Cosmo Grill & Lounge: una giornata | sticky, `p` | 240 / 200 svh | `grill` |
| H5 | Wellness: il 6° piano | scroll-timeline CSS | nessuno | no (SVG) |
| H6 | Da qui a Milano + Weekend | scroll-timeline CSS + rail | nessuno | no (SVG) |
| H7 | Prenota + contatti + footer sera | accensione | nessuno | no |

Contenitore fissato (`StickyScene`, 8.4): altezza `calc(100svh + var(--travel))`, figlio `position: sticky; top: 0; height: 100svh`. Si usa **`svh`**, mai `vh`/`dvh` (su iPhone la barra degli indirizzi cambierebbe l'altezza mentre si scorre e `p` salterebbe).

### 2.4 Hook base: `useSceneP`
```ts
// scrive --p (0..1) sul contenitore senza render React; chiama onP solo se cambia
export function useSceneP(ref: RefObject<HTMLElement | null>, onP?: (p: number) => void) {
  useEffect(() => {
    const el = ref.current; if (!el) return
    const stick = el.firstElementChild as HTMLElement          // il figlio sticky = altezza viewport "svh"
    let raf = 0, last = -1, live = false
    const read = () => {
      raf = 0
      const travel = el.offsetHeight - stick.offsetHeight      // stabile anche con la barra di Safari
      const p = travel > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / travel)) : 0
      if (Math.abs(p - last) > 0.0005) { last = p; el.style.setProperty('--p', p.toFixed(4)); onP?.(p) }
    }
    const kick = () => { if (live && !raf) raf = requestAnimationFrame(read) }
    const io = new IntersectionObserver(([e]) => { live = e.isIntersecting; kick() }, { rootMargin: '20% 0px' })
    io.observe(el); addEventListener('scroll', kick, { passive: true })
    return () => { io.disconnect(); removeEventListener('scroll', kick); cancelAnimationFrame(raf) }
  }, [])
}
```
In CSS gli elementi leggono `--p`: `transform: translateX(calc(var(--p) * 100%))`. Le cose non-3D si scrivono come funzione di `--p` e non hanno bisogno di React.

---

## 3. Hero: entrare nella hall (alba→sera)

**Idea in una frase:** scorri e **entri** nella hall; mentre entri **passa il giorno** sotto il lucernario. Lo slider «Ora del giorno» e lo scroll sono **la stessa cosa**: lo slider muove la pagina (3.3). Un solo numero `p`.

### 3.1 Struttura
- Contenitore `StickyScene`, `--travel: 180svh` (telefono 160svh). Dentro, lo stage: arco col canvas, pannello testo pieno (h1, sottotitolo, CTA, slider). **Il testo non si muove e non si anima** (LCP, DESIGN 8.3: niente testo che si muove su una scena 3D).
- Prima del primo frame: **poster SVG inline nell'HTML** (nessuna richiesta, è l'LCP insieme al testo). Il poster è il fotogramma `p = 0` (alba, vista dalla soglia).
- `p` si divide così: `0–0,06` tenuta sulla soglia · `0,06–0,60` entrata · `0,60–0,92` sguardo al lucernario · `0,92–1` tenuta sulla sera (si legge la scena prima di uscire).
- Pulsante «Esplora l'hotel» = scroll nativo alla scena H1 (`behavior: smooth`, `auto` in RM). È anche il modo di **saltare** l'intro. Pulsante pausa (COPY): ferma pulsazioni e invito (sono le sole cose a tempo).

### 3.2 Camera: funzione di `p`
```ts
const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const sss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t*t*t*(t*(t*6-15)+10) }  // smootherstep

export function cameraHall(p: number) {
  const enter = sss(0.06, 0.60, p), look = sss(0.60, 0.92, p)
  return {
    z:     10.0 - 4.0 * enter - 0.4 * look,     // 10,0 → 6,0 → 5,6 m
    y:     1.55 - 0.05 * enter,                 // altezza occhi
    pitch: -1 + 5 * enter + 30 * look,          // gradi: -1 → +4 → +34 (guarda in su)
    fov:   38 + 2 * enter,                      // 38 → 40: si allarga appena, niente dolly-zoom
  }
}
```
Valori da **tarare a occhio con la scena vera** (le misure della hall sono stilizzate, A5). Servono a fissare la struttura: arrivo con il lucernario in alto e la corona del tronco in basso nell'inquadratura.

**Sguardo intorno** (non è `p`: è l'utente): su puntatore fine, offset di camera `±6°` di imbardata e `±3°` di beccheggio che segue il mouse con smorzamento (`smoothTime 0.3`), sommato alla camera di `p`. Su touch: **nessuno** (niente giroscopio: iOS chiede un permesso e non serve). In RM: spento. Da tastiera (COPY: «frecce per ruotare»): ±2° a pressione, stesso smorzamento.

### 3.3 Slider = scroll
- `<input type="range" min="0" max="1" step="0.001">`, aria come in COPY (`Ora del giorno nella hall: {valore}…`), 4 tacche a `0 · 1/3 · 2/3 · 1` = Alba · Mattina · Pomeriggio · Sera.
- Il cursore (thumb) si posiziona con `transform: translateX(calc(var(--p) * var(--track)))`, senza React.
- Mentre l'utente trascina lo slider: `input` → `scrollTo({ top: sectionTop + v * travel, behavior: 'instant' })`: la pagina segue il dito 1:1. Finché il puntatore è sullo slider il sincronismo `p → slider` è sospeso (evita il ciclo). Un clic su una tacca fa lo stesso con `smooth` (`auto` in RM).
- Tastiera: frecce = ±1/12 di `p`, PageUp/PageDown = salto alla tacca successiva. Il valore letto dallo screen reader è l'etichetta (COPY), non il numero.

### 3.4 La luce: funzione di `h = p`
Quattro punti chiave; fra l'uno e l'altro si interpola con `smoothstep` (colori in spazio lineare, `Color.lerpColors`). Alba/Giorno/Sera dai valori di DESIGN 5.3; **Pomeriggio e le intensità dell'alba sono una mia proposta da tarare**.
| `h` | Momento | Key (colore · intensità) | Sole: elevazione | Cielo nella vetrata | Emisferica | Parete | Aloni lampade |
|---|---|---|---|---|---|---|---|
| 0 | Alba | `#FFC89A` · 1,1 | 6° (da sinistra) | `#F6C9A6` | 0,55 | `#D9CBB0` | 0 |
| 1/3 | Mattina | `#FFF1DC` · 1,6 | ≈ 45° | `#D6E6EE` | 0,70 | `#D9CBB0` | 0 |
| 2/3 | Pomeriggio | `#FFE3BC` · 1,5 | ≈ 45° (da destra) | `#E4ECEF` | 0,68 | `#D9CBB0` | 0,15 |
| 1 | Sera | `#FFB867` · 0,5 | 6° (da destra) | `#3A4A66` | 0,35 | `#6B5D47` | 1 |

```ts
// luce.ts: PURA. Stessa h, stesso risultato.
export function sun(h: number) {
  const el = (6 + 56 * Math.sin(Math.PI * h)) * Math.PI / 180      // 6° agli estremi, 62° a mezzogiorno
  const az = (-75 + 150 * h) * Math.PI / 180                       // attraversa la hall da sinistra a destra
  return { dir: [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)], el }
}
// applicazione (a ogni cambio di p, poi wake()):
key.position.set(...sun(h).dir.map(v => v * 20));  key.color.copy(sampleColor(h, 'key')); key.intensity = sample(h, 'keyI')
hemi.intensity = sample(h, 'hemi');  sky.color.copy(sampleColor(h, 'sky'))     // emissivo della vetrata
wall.color.copy(sampleColor(h, 'wall'))                                        // moltiplica l'occlusione cotta nei vertici
halos.forEach(m => m.opacity = ss(0.62, 0.95, h))                              // l'«accensione»
```
**Falsi che seguono la luce (nessuna ombra vera, DESIGN 5.4):**
- **Macchia di sole sul pavimento:** 1 quad con texture morbida, `position = skylight.xz − dir.xz / dir.y · H` (H = altezza del lucernario), scalato in lunghezza di `1 / max(sin(el), 0.25)`, opacità `0,35 · ss(0.12, 0.35, sin(el))`. Si sposta per tutta la hall come una meridiana. Solo `position/scale/opacity`.
- **Raggio dal lucernario:** 1 piano con texture a strisce 256×64, additivo, opacità `0,18 · sin(πh)^0,7`, orientato dal centro del lucernario alla macchia.
- **Ombra a contatto del tronco** (DESIGN 5.4): si sposta di 2 cm seguendo il sole. Nient'altro.
- **Alone di accensione:** quad additivo con la texture radiale condivisa, raggio ≈ 90 cm, sulle lampade. In sera sono l'unica fonte «piena»: è lo stacco visivo più forte della scena.
- **Luci reali: 1 direzionale + 1 emisferica.** Nessun PointLight nell'hero (non serve). Le luci non si aggiungono né tolgono a runtime (ricompilano gli shader: scatto di 50–200 ms su telefono): se un PointLight esiste, resta sempre acceso con intensità 0.

### 3.5 Hotspot (HTML, DESIGN 4.5)
4 bottoni, COPY 1: Lucernario, Tronco d'ulivo, Vetrate, Tende. Posizionati dalla proiezione (4.6). Visibili solo in una finestra di `p` (così non si affollano):
| Hotspot | Finestra di `p` |
|---|---|
| Vetrate | 0,10 – 0,60 |
| Tende | 0,30 – 0,80 |
| Tronco d'ulivo | 0,30 – 0,95 |
| Lucernario | 0,62 – 1,00 |
Ingresso/uscita: `opacity` 160 ms (cambia una classe, non uno stile ogni frame). Pulsazione: 1 ciclo da 1,6 s (DESIGN) alla prima comparsa, poi fermi; in RM nessuna. Al clic: pillola-etichetta (fade 160 ms); **la camera dell'hero non si muove** (è di `p`, non va in conflitto con lo scroll).

### 3.6 RM, touch, fallback
- **RM:** niente scena fissata (`--travel: 0`, hero alto 100 svh); camera ferma a `p_cam = 0,62` (la hall vista da dentro, lucernario in alto); luce al valore dello slider (`p_luce`), che in RM **non muove la pagina** ma cambia solo `p_luce`; cambio di luce con crossfade 200 ms (il 3D interpola `p_luce` in 200 ms); testo COPY «Animazione ridotta. Usa lo slider per cambiare la luce.» Niente sguardo intorno automatico, niente pulsazioni.
- **Touch/iPhone:** `touch-action: pan-y` sul canvas (lo scroll verticale è della pagina); canvas ≤ 1,3 megapixel e DPR ≤ 1,5; **nessun MSAA** (antialias solo se DPR < 1,5, DESIGN); tronco a bassa risoluzione (28 segmenti invece di 48, circa 5k triangoli invece di 7k); macchia di sole e raggio sì, alone sì; massimo 4 hotspot visibili; nessuno sguardo intorno; `--travel: 160svh`.
- **Senza WebGL / lite estremo:** il poster SVG è vivo: lo stesso `luce.ts` scrive 5 variabili CSS (`--sky --wall --glow --sun-x --sun-o`) sul `<svg>`, il gruppo «camera» fa `scale(1 → 1,25)` con `p`. Stessa funzione di `p`, solo disegnata in 2D. Costa un ridisegno di un SVG ≤ 8 kB per frame di scroll (stima circa 1 ms, **da misurare**).

### 3.7 Il tronco d'ulivo (il pezzo «scolpito»)
**In codice, non un `.glb`**: un solido di rivoluzione (`LatheGeometry`, 48 segmenti, 24 anelli) con spostamento deterministico (rumore a semi fissi) per le nodosità e torsione lenta lungo l'asse, due rami come 2 `TubeGeometry` corte; colore per vertice `#8A4F12 → #5A3A1B` (chiaro in alto, scuro alla base). Circa 7k triangoli, **0 kB di download**, costruzione stimata 5–15 ms (da misurare). Un `.glb` con meshopt costerebbe circa 100 kB di decoder più il file (misurato) per un pezzo che nessuno confronta con l'originale. Se il cliente vuole il tronco «vero», si fa dopo, con una scansione.
Il materiale è Lambert: `MeshStandardMaterial` (DESIGN ammette ≤ 3 oggetti-eroe solo su desktop) è un'opzione per il solo tronco in livello «high»: aggiunge un riflesso lieve ma non cambia la lettura.

---

## 4. Camere: il diorama (home H2, `/camere/`, `/camere/<tipo>/`)

Un solo componente `RoomDiorama`, tre pose di partenza. La home ne mostra uno dentro un arco; `/camere/` aggiunge «Chi viaggia?» e il confronto; le tre pagine partono già sul tipo giusto.

### 4.1 Come è fatta la scena (una sola, tre varianti)
- **Casa da bambola, senza muro davanti e senza soffitto**: pavimento + 2 pareti di fondo + (Family/Suite) il modulo B. L'orbita è limitata a ±35°, quindi le pareti di fronte non servono mai: si risparmia geometria e si vede dentro.
- Moduli (proporzioni, A4): **A** = camera da 4,0 × 5,5 m con bagno in un angolo; **B-twin** (due letti singoli + bagno); **B-soggiorno** (divano letto, scrivania, 2° ingresso).
  - **Classic** = A. **Family** = A + B-twin con porta comunicante. **Suite** = A (con armadio) + B-soggiorno, due ingressi.
  Rispecchia i fatti veri di BRIEF: «Family = due Classic comunicanti», «Suite = due ambienti con ingressi separati».
- Tutto è geometria procedurale (box smussati, cilindri, estrusioni), **fusa per materiale** con `mergeGeometries` in poche mesh statiche con `matrixAutoUpdate = false`. Parti mobili (porta, piumino, divano, culla) = mesh a parte.
- Materiali Lambert, colori per vertice con occlusione cotta (angoli, sotto il letto). Parquet: texture 256² tileabile **generata a runtime con canvas 2D** (0 kB). Stampe incorniciate: un atlante 512² generato (cerchi, rami, linee).
- Luci: 1 direzionale + 1 emisferica + **1 PointLight sempre presente** (intensità 0 di giorno, 1,2 di sera; non si aggiunge né toglie). Lampade: emissivo + alone sprite. Finestra: emissivo.
- Budget: ≤ 28k triangoli (limite 30k), ≤ 36 draw call, 3 texture. Dettaglio in 10.

### 4.2 Orbita con inerzia (camera-controls)
```ts
CameraControls.install({ THREE: { Vector2, Vector3, Vector4, Quaternion, Matrix4, Spherical, Box3, Sphere, Raycaster, MathUtils } }) // solo il subset
const c = new CameraControls(camera, canvas)
c.minAzimuthAngle = az0 - rad(35); c.maxAzimuthAngle = az0 + rad(35)
c.minPolarAngle = rad(55); c.maxPolarAngle = rad(80)            // elevazione 10°–35° (DESIGN)
c.minDistance = d0 * 0.85;  c.maxDistance = d0 * 1.15           // zoom limitato, vedi 0.3 punto 1
c.mouseButtons.wheel = CameraControls.ACTION.NONE               // la rotellina non zooma mai: è dello scroll
c.touches.one = CameraControls.ACTION.TOUCH_ROTATE; c.touches.two = CameraControls.ACTION.TOUCH_DOLLY
c.smoothTime = 0.18          // moti programmati (preset, hotspot): ~0,5 s per assestarsi, da misurare
c.draggingSmoothTime = 0.10  // inerzia sotto il dito
canvas.style.touchAction = 'pan-y'                              // dopo OGNI connect(): la libreria lo reimposta a 'none'
// loop a richiesta:
useFrame((_, dt) => { if (c.update(Math.min(dt, 0.05)) || tween.active) invalidate() })
c.addEventListener('controlstart', invalidate)
```
- **Touch:** `pan-y` lascia lo scroll verticale alla pagina (altrimenti il diorama intrappola il dito e non si può più scorrere). Conseguenza: **sul telefono si ruota in orizzontale** (imbardata); l'elevazione resta a 24°. Per vedere dall'alto c'è «Pianta».
- Tastiera (COPY): `←/→` imbardata ±5°, `↑/↓` elevazione ±3°, `+/−` zoom nel limite, `Tab` fra gli hotspot; il canvas ha `tabindex="0"`, `role="group"`, etichetta di COPY.
- **Invito al trascinamento:** la prima volta che il diorama entra ≥ 60% in vista, e solo se non c'è RM, la camera fa imbardata di +6° e torna (800 ms totali, `--e-in`); si ferma al primo input dell'utente. Una volta per visita.
- Inquadratura per stanza (`ROOM[tipo]`), e **chip di sotto-vista sul telefono**: nel telefono (arco verticale, circa 4:5) un modulo da 8 m verrebbe piccolo. Quindi Family e Suite hanno due chip «Camera 1 / Camera 2» e «Soggiorno / Camera» che fanno `setLookAt` (480 ms, `smoothTime 0.18`) tra i due moduli. Raccontano anche «due ambienti». Su desktop la stanza intera sta in vista e i chip sono scorciatoie.

### 4.3 Cambio Classic ↔ Family ↔ Suite (≤ 720 ms)
Un tween `k` (`0→1`, `--d-in`) per ogni cambio. Si muovono **solo `position`, `rotation` e `scale`**. Niente trasparenza (costerebbe overdraw e ordinamento): il modulo entra **da fuori inquadratura** e l'arco lo ritaglia.
| Passaggio | Cosa si muove (tempi dall'inizio) |
|---|---|
| Classic → Family | `0–480 ms` modulo B-twin scorre da x = +14 m a +4 m · contemporaneamente camera: bersaglio verso x = +2 m, distanza 8,5 → 15 m · `240–720 ms` la **porta comunicante** ruota 0 → −100° (si «apre» sul perché del nome) |
| Family → Suite | `0–480 ms` B-twin esce a destra mentre B-soggiorno entra da destra · armadio compare in A (scala 0 → 1 in 240 ms) · camera quasi ferma |
| Suite → Classic | B esce a destra, camera torna a 8,5 m |
In RM: salto con **crossfade da 200 ms** del solo canvas (si copre con il poster, poi si scopre) invece dei movimenti.

### 4.4 Hotspot (HTML) e dettagli «che si aprono»
- Posizione: ogni frame in cui la camera si è mossa, **prima si leggono tutti i punti, poi si scrivono tutti i `transform`** (nessuna lettura di layout nel loop; le dimensioni si leggono con `ResizeObserver`):
```ts
const v = new Vector3()
function place(a: Hotspot, cam: Camera, W: number, H: number) {
  v.copy(a.anchor).project(cam)                                          // -1..1
  const facing = a.normal.dot(camDir) < -0.15                            // dà le spalle? si nasconde
  const on = facing && v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05
  a.el.style.transform = `translate(${(v.x * .5 + .5) * W}px, ${(-v.y * .5 + .5) * H}px)`
  if (on !== a.on) { a.on = on; a.el.dataset.on = on ? '1' : '0' }      // opacity 160 ms in CSS
}
```
  Niente raycast per l'occlusione (costo e jitter): la regola `facing` basta con la camera limitata a ±35°.
- **Clic su un hotspot:** apre la pillola (160 ms) e porta la camera a una **posa di dettaglio** (`setLookAt`, 480 ms, distanza −10%, vincolata ai limiti). Un solo hotspot aperto alla volta. In RM: la camera salta in 0 ms. Ogni hotspot ha la riga nell'**elenco testuale** equivalente (DESIGN): il click sul testo fa la stessa cosa.
- **Il dettaglio memorabile, uno per tipo, tutti veri e leggeri** (nessuna texture, 1–3 mesh in più):
  - **Classic, «il letto si prepara»:** il piumino è 2 box con cerniera a metà letto; il mezzo piedi ruota di −180° attorno alla cerniera (480 ms, `--e-in`) e scopre il lenzuolo. Parte una volta, 600 ms dopo che la stanza entra in vista; l'hotspot «Letto matrimoniale 160 cm» lo richiude/riapre. In RM: parte già aperto.
  - **Suite, «il divano diventa letto»:** la seduta scorre in avanti di 0,9 m e lo schienale ruota fino a piatto (480 ms). Hotspot «Divano letto». È un fatto vero (BRIEF: divano letto).
  - **Family, «la culla arriva»:** l'hotspot «Letto extra o culla» fa crescere una culla (`scale 0,001 → 1`, 240 ms, dal pavimento). COPY: è «su richiesta», quindi l'etichetta lo dice.

### 4.5 Giorno ↔ Sera
- Chip `Giorno | Sera` (DESIGN 2.3: la sera del diorama). Tween `s` 0→1 in **600 ms**, `--e-in`; in RM 200 ms.
- Funzione pura `roomLight(s)`: key `#FFF1DC`×1,6 → `#FFB867`×0,5 · emisferica 0,7 → 0,35 · emissivo finestra `#CFE3EE → #3A4A66` · parete `#D9CBB0 → #6B5D47` · alone lampade 0 → 1 · PointLight 0 → 1,2 · le ombre a contatto restano.
- Contorno ad arco HTML: due strati (giorno e sera) a crossfade `opacity` 600 ms. **Il testo non cambia mai colore** e sta fuori dal canvas su pannello pieno (DESIGN 2.4).
- Quando la stanza entra in vista la prima volta: alone delle lampade 0 → 1 in 480 ms con la luce ancora «giorno» (l'accensione: il motivo del sito).

### 4.6 Pianta (chip `3D | Pianta`)
Camera a 90° (480 ms), le pareti si abbassano a 12% (`scale.y`, con il perno in basso), le quote SVG (m² veri, DESIGN 6) compaiono con `opacity` 240 ms. È lo stesso canvas: nessun SVG da mantenere in due versioni. Con il poster (senza WebGL) la pianta è SVG statica.

### 4.7 Perché regge 60 fps su iPhone (e cosa non è garantito)
1. **Un solo canvas, un solo renderer** (2.2), `frameloop` a richiesta: a riposo 0 frame, 0 GPU, niente calore.
2. DPR ≤ 1,5 sul telefono, canvas ≤ 1,3 MP; MSAA solo se DPR < 1,5. Memoria dei buffer a 1,3 MP: circa 5 MB colore + 5 MB profondità (stima: 4 byte/pixel).
3. Niente ombre in tempo reale, niente environment map, niente post-processing. Luci reali ≤ 2 + emisferica. **Luci finte**: emissivo, aloni additivi, ombre a contatto (quad con texture 128² condivisa), occlusione cotta nei vertici.
4. Mesh statiche fuse per materiale; ripetizioni (cuscini, cornici, lampade, foglie) **istanziate**; `matrixAutoUpdate = false` su tutto ciò che non si muove.
5. Materiali Lambert; `compileAsync` della scena **mentre il poster è ancora visibile**; mai aggiungere/togliere luci o cambiare `transparent` a runtime (ricompila).
6. Calcoli per frame solo se qualcosa si è mosso: matrici hotspot, tween attivi. Nessuna allocazione nel loop (vettori riusati).
7. Modalità poster di riserva (sez. 9).
**Non garantito:** i 60 fps su un iPhone specifico. Il piano li rende plausibili; la prova è un test su dispositivo reale (sez. 11). Se l'iPhone ha il «risparmio energia» attivo, iOS limita a 30 fps da solo (sez. 9.2): non è un difetto della scena.

### 4.8 RM e touch (riepilogo camere)
RM: nessun invito, nessuna inerzia, nessun movimento di moduli (salto + crossfade 200 ms), piumino già aperto, hotspot senza pulsazione, camera dei preset istantanea. Touch: rotazione orizzontale, `pan-y`, chip di sotto-vista, DPR 1,5, nessun MSAA.

---

## 5. Centro Congressi: il configuratore

Dati: la tabella 15 di COPY (25 sale, 4 disposizioni, «−» dove non prevista). Le capienze **vengono dalla tabella, mai dal disegno**: il disegno mostra esattamente `n` sedie, `n` = capienza scritta.

### 5.1 Meccanica
- **`InstancedMesh` di sedie**, dimensionato a **520** istanze (max reale: 500 della platea Costellazioni). Sedia ≤ 64 triangoli (DESIGN): seduta + schienale, 2 box smussati ≈ 24 triangoli. Totale sedie ≈ 12k triangoli, **1 draw call**.
- **Ombre:** un secondo `InstancedMesh` di quad piatti (2 triangoli) con la texture ombra 128² condivisa, scritto nello stesso ciclo (1 draw call).
- **Tavoli:** 2 `InstancedMesh` separati (tondo ø1,8 m a 12 lati per il banchetto; rettangolo 1,8 × 0,6 per i banchi e il ferro di cavallo), 120 istanze max.
- **Pareti mobili:** 1 `InstancedMesh` di pannelli (1,2 m × h 4,22 m × 0,10 m, h vera), 120 istanze max.
- Pareti perimetrali: 4 box che si **ridimensionano con `scale`** quando cambia sala (nessuna geometria nuova). Pavimento: 1 quad scalato. Altezza vera della sala: 4,22 m (3,4 / 3,1 al piano inferiore, dalla tabella).
- Luce neutra e fissa: key `#FFF1DC`×1,4 + emisferica 0,8. Nessun giorno/sera. Moquette: 1 texture 512² generata.
- Camera: iso a 50° di elevazione, orbita ±20° (solo su puntatore fine; su touch fissa), `fit(sala)` = distanza calcolata sulla diagonale della sala; cambia con tween di 480 ms insieme al resto.

### 5.2 Le disposizioni: generatore puro
`layout(sala, disposizione) → { seats: Float32Array [x, z, rotY]×n, tables: …, n }`. Deterministico (nessun `Math.random`: stessa scelta, stesso disegno). Punti essenziali:
- **Platea:** palco sul lato corto (12% della profondità), corridoio centrale 1,2 m se ≥ 12 colonne, passo sedia 0,5 m, passo fila 0,9 m. Colonne = `ceil(sqrt(n · W / (D' · k)))` con `k = 0,5/0,9`; ultima fila parziale centrata.
- **Banchi di scuola:** `n/2` banchi 1,8 × 0,6 m, 2 sedie per banco, file rivolte al relatore.
- **Ferro di cavallo:** tavoli a U aperta verso il relatore, sedie sul lato esterno; se la U singola non basta per `n` (capita: 188 sedie nella Plenaria del Sole), si aggiungono **U concentriche** a 1,8 m una dall'altra. È **illustrativo**, e la nota «Disposizione illustrativa» sta accanto al disegno.
- **Banchetto:** `ceil(n/10)` tavoli tondi, 10 sedie ciascuno (l'ultimo ne ha meno), griglia sfalsata a 3,2 m.
- `fit()`: se l'ingombro supera la sala, **tutti i passi si riducono insieme** (minimo 0,6 del nominale). Se ancora non basta, resta il disegno più fitto possibile e la nota. **Test automatico richiesto (QA/frontend):** per tutte le 25 sale × le disposizioni ammesse, nessuna sedia fuori dalla sala, nessuna coppia a meno di 0,35 m.
- Disposizione non ammessa («−»): il pulsante è disabilitato con il testo di COPY; il disegno non cambia.

### 5.3 L'animazione: le sedie si dispongono (≤ 720 ms)
Un tween `k` 0→1 in **720 ms** (`--e-in`), con ritardo per sedia (stagger): ultima sedia parte a 240 ms e dura 480 ms. **Dentro il limite di 800 ms.** Ogni sedia compie un piccolo salto (0,22 m) mentre si sposta. Le sedie in più (da 188 a 400) escono dal «parcheggio» accanto alla porta con `scale 0 → 1`; quelle in meno rientrano e spariscono (`scale → 0`).
```ts
// morph(k): funzione pura di k. from/to: [x,z,rot,s]×N, già ACCOPPIATI per vicinanza (ordine per riga, colonna)
const STAGGER = 0.33
function morph(k: number, from: Float32Array, to: Float32Array, mesh: InstancedMesh, hop = 0.22) {
  const a = mesh.instanceMatrix.array as Float32Array
  for (let i = 0; i < N; i++) {
    const t = ease(clamp((k - (i / N) * STAGGER) / (1 - STAGGER), 0, 1))   // ease = bezier(.2,.7,.2,1)
    const s = lerp(from[4*i+3], to[4*i+3], t)
    const y = s > 0.01 ? Math.sin(Math.PI * t) * hop : 0
    writeMatrix(a, i, lerp(from[4*i], to[4*i], t), y, lerp(from[4*i+1], to[4*i+1], t),
                lerpAngle(from[4*i+2], to[4*i+2], t), s)                   // traslazione + rotY + scala uniforme, a mano
  }
  mesh.instanceMatrix.needsUpdate = true                                    // ~32 kB per frame, solo durante il tween
}
```
- **Accoppiamento from/to:** ordinare entrambi gli insiemi per `(round(z), x)` e abbinare per indice. Evita sedie che si incrociano da un capo all'altro.
- Costo: 520 matrici a mano ≈ 0,1 ms su desktop, stimato 0,5 ms su telefono (**da misurare**), per 720 ms al massimo. A riposo: nessun frame.
- **Il numero:** «fino a {n} persone» (aria-live) **non sale a contatore**: DESIGN vieta di animare le capienze. Si aggiorna con un crossfade da 160 ms **a fine tween** e viene annunciato una volta sola (con debounce di 400 ms).
- **Pareti mobili:** «Dividi la sala» (`aria-pressed`) → un tween `w` 0→1 in 600 ms. Ogni pannello scorre dalla posizione «a pacchetto» (accatastato contro il muro) alla sua posizione sul binario, con ritardo di 60 ms ogni pannello lungo la parete (`t_j = clamp((w·T − j·0,06)/…)`). Costellazioni 4 × 2: 3 pareti da 20 m + 1 da 25 m ≈ 71 pannelli; Divinità: 4 pareti da 17,2 m ≈ 58 pannelli (A6, `[DA CONFERMARE]`). Quando le pareti si chiudono le sedie si **ridistribuiscono per sala** (stesso `layout`, stesse regole) con un nuovo tween di 720 ms in sequenza: totale 1,3 s, ma in due gesti distinti. Non si scrive nessuna capienza per le sale parziali.
- In RM: tutti i movimenti diventano **un salto con crossfade del canvas da 200 ms**.

### 5.4 Home H3: il teaser fissato
Sala **Plenaria del Sole** (18,5 × 17,5 m: è l'unica ampia con tutte e quattro le disposizioni, Costellazioni ne ha due sole). `--travel` 200 svh (160 telefono). Stessa `morph`, ma con `k` che viene da `p`:
| `p` | Cosa succede | Chip attivo e numero (dalla tabella) |
|---|---|---|
| 0 – 0,08 | Pareti salgono (`scale.y` 0 → 1): sala vuota | – |
| 0,10 – 0,25 | Platea: le sedie entrano a file | Platea · 400 |
| 0,30 – 0,45 | Banchi di scuola | Banchi di scuola · 188 |
| 0,50 – 0,65 | Ferro di cavallo | Ferro di cavallo · 188 |
| 0,70 – 0,85 | Banchetto: compaiono i tavoli tondi | Banchetto · 300 |
| 0,85 – 1 | Tenuta; compare «Configura la tua sala» | – |
La riga con i 4 chip (HTML, a sinistra, fuori dal canvas) evidenzia la disposizione corrente con un cambio di `opacity` a 160 ms e **permette il clic**: porta a `/centro-congressi/` con la disposizione scelta. Il numero cambia con crossfade, non conta. In RM: nessuna scena fissata; resta il disegno «Platea» fisso e i 4 chip cambiano disposizione con salto/crossfade 200 ms.
Le **pareti mobili** non stanno nel teaser perché la Plenaria del Sole non è dichiarata divisibile nei dati: si vedono nella pagina, su Costellazioni e Divinità.

### 5.5 Touch e budget
Touch: camera fissa (nessuna orbita), `pan-y`; chip e pulsanti da 44 px. Triangoli ≈ 12k sedie + 1k ombre + 3k tavoli + 1,4k pannelli + 1k sala ≈ **18k** (limite 50k); draw call ≈ **10–14** (limite 40); texture 2 (moquette 512², ombra 128²) ≈ 1,5 MB (limite 8 MB).

---

## 6. Le altre scene

### 6.1 Perché sceglierci (H1) — 7 fatti, niente card identiche
- Numeri grandi in `--t-num`. **Contatore** (8.3) su 2, 201, 900, 200: 600 ms, ease-out, una volta, sfalsati di 60 ms. «Wi-Fi gratuito», «Senza barriere», «Una famiglia» non sono numeri: entrano con `reveal`.
- Il dettaglio al tocco (COPY): **un solo pannello** sotto l'elenco, a altezza riservata (nessun CLS), che cambia testo con crossfade 160 ms fuori / 240 ms dentro. Accanto: **uno schema SVG in sezione dell'hotel** con 7 zone; la zona attiva passa a `opacity 1` con bordo, le altre a 0,35, 240 ms. È l'unico «movimento» della scena: dice dove sta la cosa.
- RM: contatori già al valore finale, crossfade a 200 ms. Touch: identico (è SVG).

### 6.2 Cosmo Grill & Lounge (H4 e `/ristorazione/`): la giornata
**Sezione in tono sera** (DESIGN 2.3) per tutta la durata: sfondo e pannelli di testo fissi e pieni → contrasto costante. Cambia solo la **luce dentro l'arco**.
- `--travel` 240 svh (200 telefono). `p` 0 → 1 con i momenti a `0 · 1/3 · 2/3 · 1`: Mattina, Pranzo, Aperitivo, Sera. Il cursore «Momento della giornata» (COPY) è, come in 3.3, un controllo che sposta la pagina. Il testo di fianco è **a pannelli**: 4 pannelli a crossfade (240 ms) con isteresi (cambia a `p = 0,17 / 0,50 / 0,83`, e torna indietro a `±0,03` di distanza, per non sfarfallare al confine).
- Luce, tabella a 4 punti (stessa tecnica di 3.4, proposta da tarare):
| Momento | Key (colore · intensità) | Sole | Vetrata | Aloni lampade | PointLight |
|---|---|---|---|---|---|
| Mattina | `#E8F0F5` · 1,3 | 20° da sinistra | `#CFE0EA` | 0 | 0 |
| Pranzo | `#FFF4E0` · 1,7 | 60° | `#DCEAF0` | 0 | 0 |
| Aperitivo | `#FFC27A` · 1,0 | 12° da destra | `#F2B77A` | 0,6 | 0,6 |
| Sera | `#FFB867` · 0,5 | – | `#3A4A66` | 1 | 1,2 |
- Le abat-jour color miele (8–12, **istanziate**) sono l'accensione. Sedie in alluminio forato: 120 triangoli (DESIGN), **istanziate** (circa 40). Tavoli bianchi istanziati. Travi e canalizzazioni: mesh fuse.
- **Dettagli di scena** a `scale 0↔1` per finestre di `p` (≈ 6–12 istanze ciascuno, < 40 triangoli): tazzine al mattino, calici all'aperitivo, calici e lume a sera. **Niente piatti a pranzo** (0.3 punto 3). Sono illustrativi: la nota «Ricostruzione illustrativa» resta.
- Hotspot da COPY (6): sempre visibili; pulsano una volta.
- RM: sezione non fissata, luce **fissa su «Sera»** (la scena più riconoscibile del posto, DESIGN 2.3) con il cursore che cambia la luce in crossfade 200 ms. Touch: ≤ 35k triangoli, DPR 1,5, aloni sì, PointLight sempre presente.

### 6.3 Wellness (H5 e `/wellness/`) — illustrazione SVG isometrica
- **0 canvas.** Un SVG unico (≈ 10 kB) con la pianta isometrica del 6° piano e 3 gruppi: sauna finlandese (cabina in listelli di legno), bagno turco (cabina piastrellata), sala attrezzi (2 tapis roulant, cyclette, macchine). Niente pietre, bambù, onde (DESIGN 8.4).
- Layout: a sinistra il **filo** verticale con 3 tappe (COPY 7) e i testi; a destra l'SVG sticky.
- **Filo che si disegna:** `scaleY` 0 → 1 con `animation-timeline: view()` (8.6), e i 3 nodi si accendono a soglie di `p` (CSS, `animation-range`).
- **Gruppo attivo:** un `IntersectionObserver` sulla riga del testo che passa il centro (`rootMargin: '-45% 0px -45% 0px'`) dice quale tappa è attiva; il suo gruppo va a `opacity 1 / translateY 0`, gli altri a `opacity 0 / translateY 12px`, **480 ms**. Un solo cambio discreto, nessuno scrub.
- **Micro-vita, 3 cicli e si ferma (≤ 5 s):** 3 sbuffi di vapore al turco (`translateY` −14 px + `opacity`, 1,6 s, sfalsati), nastro dei tapis roulant (`translateX` di 1 passo, 1,5 s, lineare perché è meccanico), ruota della cyclette (`rotate`, 1,5 s). Partono quando il gruppo diventa attivo. Massimo 5 elementi in moto.
- **«Aperto ora»** (COPY): calcolato **dopo il montaggio** con l'ora di Roma. L'HTML statico mostra «Aperto tutti i giorni dalle 7:00 alle 22:00» (e riserva l'altezza della riga), poi il testo cambia con un fade 160 ms **solo se cambia lo stato**; nessun lampeggio.
- RM: nessun filo animato, nessun vapore, il gruppo attivo cambia con crossfade 200 ms (o si mostrano tutte e 3 le tappe affiancate). Touch: identico; non c'è nulla di pesante.
- Se UX/art director vogliono il 3D, vedi 0.3 punto 2.

### 6.4 Da qui a Milano (H6, `/come-arrivare/`, `/dintorni/`) — il percorso
**Non è una mappa geografica.** COPY: niente coordinate, niente minuti, solo «2 km» e «poche fermate». Quindi un **diagramma di linea** (stile metropolitana) in SVG, retto: **orizzontale su desktop, verticale su telefono**. Passi (COPY 5.4): `Cosmo Hotel Palace · Tram 31, a pochi passi · Poche fermate · Metro M5, fermata Bignami · Milano`.
- **La linea si disegna:** un `<div>` o `<rect>` da 3 px con `scaleX`/`scaleY` 0 → 1, `animation-timeline: view()`, `animation-range: entry 15% contain 60%`. Solo `transform`: compositor, nessuna ripittura. (Un tracciato curvo con `stroke-dashoffset` sarebbe ripittura: lo evito e lo dichiaro.)
- **Il tram che avanza:** un marcatore (sagoma del 31) che si sposta con `translate: calc(var(--p) * var(--lx)) calc(var(--p) * var(--ly))`, `--lx/--ly` messi dal media query. Al passaggio del marcatore, ogni tappa fa `opacity 0,35 → 1` e la sua etichetta `translateY(6px → 0)` (range con `--n`). Il passo «Poche fermate» è una linea **tratteggiata senza numero di fermate** (non sappiamo quante: non si disegnano 3 pallini).
- **Arrivo:** a `p > 0,9` compare la sagoma di Milano come fila di archi (DESIGN: l'arco è il segno), `opacity` 480 ms. Niente Duomo disegnato dettagliato: è un riferimento reale, resta generico.
- **Alternativa testuale sempre presente** (COPY 5.4): l'elenco numerato dei 5 passi, vero HTML.
- RM / senza scroll-timeline: tutto già disegnato, marcatore sull'arrivo. Touch: identico.
- `/come-arrivare/`: se c'è una mappa incorporata (iframe di terzi), **si carica al clic su «Mostra la mappa»** (peso e privacy: un iframe di mappe costa centinaia di kB e cookie), nessuna animazione. Se la mappa non carica: testo di ripiego di COPY.

### 6.5 Dintorni — «Un weekend da Cosmo»
- Rail orizzontale con `scroll-snap` nativo (8.7): **nessuna libreria, nessun carosello automatico**. Barra di avanzamento con `scroll-timeline` dello scroller. Su desktop frecce `‹ ›` che fanno `scrollBy` (smooth, auto in RM).
- Filtri `Tutto / Milano / Monza / Como`: le schede fuori filtro fanno `opacity` → 0 in 160 ms, poi `hidden`, poi le altre entrano in 240 ms. **Nessuna animazione di layout** (niente FLIP: costa e fa saltare).
- Schede: `reveal` all'ingresso (una volta). Niente parallasse sulle schede.

### 6.6 Prenota, contatti, footer (H7)
- **Prenotazione** (barra desktop, pillola e bottom sheet su telefono): vedi A7. Sheet: `translateY(100% → 0)` 240 ms `--e-in`, uscita 160 ms `--e-out`; velo (`opacity`) 240 ms. **Trascinamento per chiudere:** il foglio segue il dito 1:1 senza easing; al rilascio, se > 30% o con velocità sufficiente, finisce da solo in ≤ 240 ms, altrimenti torna su. Focus trap e `Esc`. Nessun `backdrop-filter`: fondo pieno. Le scelte di data: popover che entra con `opacity` + `translateY(6px)` in 160 ms. Errori: fade 160 ms, **nessuno shake**.
- **Contatti:** solo `reveal` di titoli e righe. «Copia l'indirizzo»: messaggio `Indirizzo copiato.` (aria-live) con fade 240 ms, resta 2,4 s, fade 160 ms.
- **Footer in sera:** fondo `sera-950` pieno **sempre** (contrasto fisso). L'accensione è il solo movimento: un alone miele radiale (`opacity` 0 → 1, 600 ms, `--e-in`) quando il footer entra a metà vista, una volta. RM: già acceso.
- **Domande frequenti:** `<details>`; la freccia ruota 160 ms; il contenuto compare con `opacity` 160 ms. **Niente animazione di altezza** (è layout).
- **Menu telefono:** pannello `translateX(100% → 0)` 240 ms. Il link «Vai al contenuto» non ha animazioni.

### 6.7 «Come viaggi?» (se resta, A3)
`order` CSS sulle sezioni (nessun rimontaggio; lo Stage continua a osservare gli slot). Gesto: `main` fade-out 160 ms → cambio di `order` + `scrollTo` all'inizio della prima sezione riordinata (`instant`) → fade-in 240 ms. RM: salto. Annuncio aria-live di COPY.

---

## 7. Pagina per pagina

| Pagina | Cosa si muove | `p` / trigger | Canvas | RM | Touch |
|---|---|---|---|---|---|
| `/` | Le 8 scene della 2.3 | sticky H0, H3, H4; resto scroll-timeline | `hall`, `rooms`, `sala`, `grill`, uno per volta | senza scene fissate, tutto in stato finale, crossfade 200 ms | `pan-y`, DPR 1,5, scene fissate più corte |
| `/camere/` | Diorama grande + chip Classic/Family/Suite; «Chi viaggia?» seleziona il chip e muove la camera (480 ms); tabella di confronto **ferma** (DESIGN: non si animano i dati); rail di schede su telefono | clic (`k`) | `rooms` | salti/crossfade | chip di sotto-vista |
| `/camere/classic-double-room/`, `/family-room/`, `/suite/` | Diorama sul tipo giusto, dettaglio memorabile (4.4), pianta, giorno/sera | clic | `rooms` | idem | idem |
| `/prenota/` | Nessuna animazione di scena. Solo i fade di 160 ms su popover ed errori. h1 e widget fermi | – | no | – | – |
| `/ristorazione/` | Pagina intera in tono sera. In cima la scena fissata del Grill (6.2, `--travel` 200 svh), poi testi, hotspot-elenco e contatti | sticky `p` | `grill` | luce fissa su Sera, niente scena fissata | DPR 1,5 |
| `/wellness/` | 6.3 | scroll-timeline + IO | no | statico | uguale |
| `/centro-congressi/` | Configuratore (5): clic → tween 720 ms; pareti mobili; modulo sotto con riepilogo che si aggiorna con crossfade 160 ms | clic | `sala` | salto + crossfade 200 ms | camera fissa |
| `/centro-congressi/richiesta-di-proposta/` | Nessuna animazione; errori fade 160 ms; nessuna scena | – | no | – | – |
| `/come-arrivare/` | Diagramma di linea (6.4); «Indirizzo copiato.» | scroll-timeline | no | statico | – |
| `/dintorni/` | Rail + filtri (6.5); percorso Milano (6.4) | scroll nativo + timeline | no | – | – |
| `/contatti/` | Solo `reveal` e messaggio di copia | – | no | – | – |
| `/domande-frequenti/`, `/partner/`, `/privacy/` | Solo freccia delle FAQ; **nient'altro** (testo da leggere) | – | no | – | – |

---

## 8. Catalogo: 8 effetti riusabili

Regola per tutti: l'effetto parte **una volta** (tranne gli scrub) e **mai sul primo schermo** (LCP e CLS). Se l'elemento è già in vista al caricamento, compare senza animazione. Tutti sono `transform`/`opacity`, tranne il contatore (testo).

### 8.1 `useReveal` — comparsa all'ingresso
`useReveal(root: RefObject<HTMLElement>, opts?: { threshold?: number })` · classe `.reveal` · `style="--i:2"` per lo sfalsamento (60 ms, massimo 5).
```css
html.reveal-ready .reveal:not([data-in]){opacity:0;transform:translateY(12px)}
.reveal{transition:opacity var(--d-in) var(--e-in),transform var(--d-in) var(--e-in);transition-delay:calc(var(--i,0)*60ms)}
html[data-rm] .reveal{transition:none}   /* e: html[data-rm] .reveal:not([data-in]){opacity:1;transform:none} */
```
```ts
// useLayoutEffect: marca subito data-in su ciò che è già nel primo schermo, poi html.reveal-ready; IO per il resto
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).dataset.in = ''; io.unobserve(e.target) } }),
  { threshold: 0.2, rootMargin: '0px 0px -8% 0px' })
```
Senza JS tutto resta visibile (lo stato nascosto esiste solo con `html.reveal-ready`).
**NON animare:** primo schermo; `h1`; paragrafi lunghi (DESIGN: il corpo al massimo fade 240 ms, mai per lettera); tabelle di dati, moduli, capienze; più di 12 elementi alla volta (si rivelano il blocco, non ogni riga).

### 8.2 `<LineReveal>` — titoli che si rivelano per riga
`<LineReveal as="h2">Testo</LineReveal>` (solo `h2`/`h3` sotto il primo schermo, massimo 6 per pagina). Il testo vero resta nel DOM e viene letto per intero; le righe sono `aria-hidden`.
```css
.line{display:block;overflow:clip;padding-bottom:.12em;margin-bottom:-.12em}   /* i discendenti non vengono tagliati */
.line>span{display:block;transform:translateY(105%);transition:transform var(--d-in) var(--e-in);transition-delay:calc(var(--l)*80ms)}
[data-in] .line>span{transform:none}
```
Le righe si calcolano **dopo `document.fonts.ready`** (altrimenti il cambio di font ridisegna le righe) e si ricalcolano su `resize` con debounce 150 ms, ignorando i cambi di sola altezza (la barra di Safari). Costo: un passaggio di lettura del layout per titolo.
**NON animare:** `h1` dell'hero (LCP), titoli già in vista, titoli in tono sera sopra il canvas, qualunque testo che l'utente sta leggendo.

### 8.3 `<CountUp>` — numeri che salgono
`<CountUp to={201} dur={600} />`. Il valore finale è nell'HTML (senza JS è giusto); lo span animato è `aria-hidden` e c'è una copia visibile solo allo screen reader con il valore finale. Larghezza riservata con le cifre tabulari (`tnum`) e `min-width: Nch` per non spostare nulla.
```ts
// una volta, quando entra in vista; rAF; 600 ms, ease-out
const v = Math.round(to * easeOut(t));   el.textContent = fmt(v)
```
È l'**unica eccezione al «solo transform/opacity»**: cambia testo (ridisegna solo quel numero). Costo trascurabile su 4 numeri.
**NON animare:** capienze e tabelle del configuratore, m² delle camere, numeri di telefono, qualunque cosa vicina a un prezzo o a un modulo; più di 4 contatori per schermata; in RM mostra subito il valore.

### 8.4 `<StickyScene>` + `useSceneP` — scena fissata
`<StickyScene travel="180svh" travelMobile="160svh" onP={fn}>…</StickyScene>`: scrive `--p` (2.4), espone `stage` discreto con isteresi `hysteresis(p, [0.17, 0.5, 0.83], 0.03)`, e include il link «Salta questa scena» (primo elemento focalizzabile, visibile al focus) che porta alla scena dopo. In RM: `--travel: 0`.
**NON usare:** se la scena si capisce in un'occhiata (non serve un percorso); per testo da leggere; più di tre volte per home; mai due scene fissate di fila senza almeno una sezione normale in mezzo (l'utente perde il ritmo: oggi H3 e H4 sono adiacenti, vedi 0.3 punto 5).

### 8.5 `.plx` — parallasse leggera (solo decorativa)
```css
@supports (animation-timeline: view()){ @media (prefers-reduced-motion:no-preference){
  .plx{animation:plx linear both;animation-timeline:view()}
  @keyframes plx{from{transform:translateY(calc(var(--depth,24px)*-1))}to{transform:translateY(var(--depth,24px))}}
}}
```
`--depth`: 24 px desktop, 14 px telefono. Gira sul compositor: niente ritardo anche con l'inerzia di iOS (una versione in JS sul telefono sarebbe in ritardo di un frame e a scatti). Senza supporto: nessuna parallasse.
**NON animare:** testo, bottoni, hotspot, il diorama, cornici ad arco con contenuto informativo. Solo illustrazioni decorative (macchia di luce, foglie). Massimo 2 elementi con `.plx` in un viewport.

### 8.6 `.thread` / `.node` — il filo che si disegna
```css
.thread{transform-origin:top;transform:scaleY(1)}          /* di default è intero */
@supports (animation-timeline: view()){ @media (prefers-reduced-motion:no-preference){
  .thread{transform:scaleY(0);animation:thread linear both;animation-timeline:view();animation-range:entry 10% cover 60%}
  @keyframes thread{to{transform:scaleY(1)}}
  .node{opacity:.35;animation:on linear both;animation-timeline:view();animation-range:cover calc(10% + var(--n)*12%) cover calc(20% + var(--n)*12%)}
  @keyframes on{to{opacity:1}}
}}
```
Usi: wellness (6.3), percorso Milano (6.4, con `scaleX` su desktop), avanzamento del rail (6.5). Una linea da 2 px = layer tiny. Perché non `stroke-dashoffset`: è ripittura, non compositor.
**NON animare:** se unisce meno di 3 tappe; se il filo cade su testo da leggere (non attraversa il testo).

### 8.7 `.rail` — scorrimento orizzontale nativo
```css
.rail{display:flex;gap:var(--s-4);overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none}
.rail>*{flex:0 0 min(86%,420px);scroll-snap-align:start}
.rail-wrap{timeline-scope:--rail} .rail{scroll-timeline:--rail inline}
.rail-bar{transform-origin:left;animation:bar linear both;animation-timeline:--rail} @keyframes bar{from{transform:scaleX(.08)}to{transform:scaleX(1)}}
```
Usi: schede camera su telefono (una per volta con la successiva visibile per il 12%), weekend (6.5). Se mancano le timeline, la barra resta piena.
**NON usare:** per contenuti che devono essere confrontati insieme (la tabella delle camere resta una tabella, con scroll orizzontale annunciato come in COPY); nessuno scorrimento automatico.

### 8.8 `<Segmented>` — cursore dei chip
Chip a **colonne di larghezza uguale**, così il cursore è puro CSS: `transform: translateX(calc(var(--i) * 100%))`, `width: calc(100% / var(--n))`, 240 ms. Usi: `Giorno | Sera`, `3D | Pianta`, `Per lavoro | Per piacere`, filtri. È un `radiogroup` (frecce da tastiera). Selezionato = fondo `--brand` **e** spunta (DESIGN: non solo colore).
**NON animare:** il cambio di contenuto sotto: avviene con crossfade 160/240, mai con scorrimenti.

### 8.9 Quando NON animare (regola generale)
Non si anima ciò che l'utente sta leggendo o compilando (DESIGN 7), ciò che è l'LCP, ciò che porta un dato (capienze, m², prezzi, orari), ciò che non cambia significato se è fermo. Chiedersi: *se tolgo il movimento, l'utente perde un'informazione?* Se no, e non è «l'accensione», si toglie. In dubbio: fermo.

---

## 9. Qualità adattiva e fallback

### 9.1 Livelli
| Livello | Chi parte da qui | DPR massimo (e megapixel) | MSAA | Luci | Altro |
|---|---|---|---|---|---|
| **high** | desktop con puntatore fine | 2 (≤ 2,4 MP) | solo se DPR < 1,5 | key + emisferica + PointLight dove serve | sguardo intorno, ombre a contatto che seguono la luce, tronco Standard opzionale |
| **mid** | **telefono e tablet, sempre** | 1,5 (≤ **1,3 MP** sul telefono) | no | idem | niente Standard |
| **lite 1** | solo dopo misura lenta | 1,25 | no | PointLight a 0 fisso (alone e emissivo al suo posto) | oggetti `lod:'small'` nascosti |
| **lite 2** | solo dopo altra misura lenta | 1,0 | no | idem | **tetto a 30 fps** durante i movimenti (un frame sì e uno no) |
| **poster** | ultimo ripiego | – | – | – | niente WebGL, scena 2D (3.6) |
DPR effettivo: `min(devicePixelRatio, dprLivello, sqrt(maxMP·1e6 / (w·h)))`.

### 9.2 Quando si scende
- **Si misura solo mentre c'è movimento** (drag, tween, scroll di `p`): a riposo il loop è fermo e il tempo fra frame sarebbe enorme. Si scartano i primi 8 frame dopo l'avvio o dopo un cambio di livello (compilazione shader).
- **Soglia:** media su 60 frame **≥ 20,8 ms (cioè < 48 fps)** per **1 secondo continuo** → un gradino giù. Dopo ogni discesa 3 s di tregua; al massimo 2 discese a visita.
- **Schermi a 120 Hz e risparmio energia:** prima dell'avvio si misura il vsync del dispositivo con 20 `requestAnimationFrame` a vuoto (`base`: 8,3 / 16,7 / 33,3 ms). La soglia diventa `max(20,8; 1,25·base)`. Così **l'iPhone in risparmio energia (iOS limita a 30 fps)** non scende per errore a «lite» (scendere non servirebbe: il limite lo mette il sistema).
- **Mai in lite per sospetto.** Si parte da «mid» sul telefono anche con poca memoria dichiarata (Davide lo trova lento). Si parte da «lite 1» solo con `navigator.connection.saveData` o `prefers-reduced-data`.
- **Nessuna risalita automatica** (evita oscillazioni): il livello appreso si ricorda per la sessione (`sessionStorage`, dentro `try/catch`) e vale per le scene seguenti.
```ts
export class FrameMeter {
  private b = new Float32Array(60); private i = 0; private n = 0; private slow = 0; private skip = 8
  constructor(private base: number, private down: () => void) {}
  reset() { this.n = 0; this.slow = 0; this.skip = 8 }                       // dopo ogni cambio di livello o scena
  tick(dtMs: number, now: number, animating: boolean) {
    if (!animating || dtMs > 100) { this.n = 0; this.slow = 0; return }       // frame fermi o pausa: non contano
    if (this.skip > 0) { this.skip--; return }
    this.b[this.i++ % 60] = dtMs; this.n = Math.min(this.n + 1, 60)
    if (this.n < 30) return
    const avg = this.b.reduce((s, v) => s + v, 0) / 60
    const limit = Math.max(20.8, this.base * 1.25)
    if (avg > limit) { this.slow ||= now; if (now - this.slow >= 1000) { this.reset(); this.down() } }
    else this.slow = 0
  }
}
```

### 9.3 Quando si va sul poster (nessun WebGL)
- Niente WebGL2 (three non supporta più WebGL1) o `failIfMajorPerformanceCaveat` (rendering software).
- Contesto perso due volte nella stessa visita.
- «lite 2» ancora sotto i 30 fps per 3 s di movimento.
- Con `saveData` / `prefers-reduced-data` si parte da «lite 1» (non dal poster): il poster si sceglie solo se manca WebGL o se «lite 2» non regge.

### 9.4 I poster SVG
- Uno per scena (`hall`, `rooms` ×3 tipi, `sala`, `grill`), **stesso punto di vista e stesse tinte** del 3D alla posa iniziale. Peso ≤ 8 kB gz ciascuno (~ 40 forme). Il poster della hero è **inline nell'HTML** (LCP). Gli altri sono file caricati con lo slot.
- Disegnati con variabili CSS (`--sky --wall --glow …`): così **lo stesso `luce.ts` li colora** (3.6). Lo slider e i chip funzionano anche senza 3D.
- Sono lo stato iniziale, quello di riserva, quello degli slot non attivi e quello per chi ha il JS spento. Mai un rettangolo vuoto, mai un loader.
- Stesso rapporto di forma del canvas (`aspect-ratio` in CSS) → nessun CLS.

---

## 10. Budget

### 10.1 JS (kB gz)
| Cosa | Obiettivo | Nota |
|---|---|---|
| Pagine senza 3D (`/prenota/`, `/contatti/`, `/privacy/`, FAQ, richiesta di proposta) | **≤ 110 kB** JS iniziale | React + Next + hook di movimento (≈ 2 kB); **da verificare con l'output di `next build`**, non l'ho misurato |
| Core 3D (Stage + three subset + camera-controls + mergeGeometries) | **≤ 150 kB** (three puro) · **≤ 250 kB** (r3f) | Misurati: three subset 135, camera-controls ≈ 12, r3f totale 248 |
| Scena `hall` (codice proprio) | ≤ 14 kB | stima, non misurata |
| Scena `rooms` | ≤ 18 kB | include 3 varianti e hotspot |
| Scena `sala` (layout + morph) | ≤ 12 kB | |
| Scena `grill` | ≤ 12 kB | |
| Effetti del catalogo | ≤ 3 kB in tutto | CSS compreso |
Il chunk 3D si carica **dopo `load`** e dopo l'idle, mai nel percorso critico; la home scarica core + `hall` all'inizio (≈ 165 kB con three puro) e le altre scene quando lo slot si avvicina (`rootMargin 100%` per precaricare).

### 10.2 Geometria e texture (DESIGN 5.5 è il limite; questi sono gli obiettivi)
| Scena | Triangoli | Draw call | Texture (generate a runtime, 0 kB scaricati) | Memoria texture | Download extra |
|---|---|---|---|---|---|
| hall | ≤ 45k (limite 60k) | ≤ 45 | cemento 512², alone 128², ombra 128², strisce 256×64 | ≈ 1,6 MB | 0 |
| rooms | ≤ 28k (limite 30k) | ≤ 36 | parquet 256², atlante stampe 512², alone, ombra | ≈ 2,1 MB | 0 |
| sala | ≤ 20k (limite 50k) | ≤ 14 | moquette 512², ombra 128² | ≈ 1,5 MB | 0 |
| grill | ≤ 35k (limite 45k) | ≤ 40 | cemento 512², legno 256², alone, ombra | ≈ 2 MB | 0 |
Calcolo memoria: una texture RGBA 512² con mipmap pesa circa 1,4 MB (512·512·4·1,33). I buffer del canvas a 1,3 MP pesano circa 10 MB (colore + profondità), **da sommare** (e ×4 con MSAA, che infatti si spegne dal DPR 1,5 in su). Tutto sotto i limiti di DESIGN con margine.
Scena `hall`, ripartizione di riferimento: tronco 7k (5k su telefono), lucernario e telaio 1k, pavimento e pareti 4k, pilastri 3k, piante 6k, tende 3k, divani/arredi 8k, lampade 2k, falsi di luce 0,1k.

### 10.3 Layer compositi e movimento
- **Telefono: ≤ 10 layer compositi contemporanei; desktop ≤ 14** (da contare in DevTools «Layers»/Safari «Layers»). Conto tipico hero su telefono: canvas 1, contenitore sticky 1, header 1, pillola Prenota 1, ≤ 4 hotspot visibili = 8.
- Nessun `will-change`, nessun `backdrop-filter`, nessuna grana a schermo intero. Scena fissata = 1 layer.
- Sezioni lontane sotto il primo schermo: `content-visibility: auto; contain-intrinsic-size: auto 800px` (esclusi gli slot e le scene fissate).
- Animazioni a ciclo contemporanee ≤ 5 (6.3).

### 10.4 Lighthouse (mobile, profilo predefinito)
| Pagina | Performance | LCP | TBT | CLS | INP |
|---|---|---|---|---|---|
| Home | **≥ 85** | ≤ 2,5 s | ≤ 200 ms | ≤ 0,05 | ≤ 200 ms |
| Pagine con 3D (camere, congressi, ristorazione) | ≥ 85 | ≤ 2,5 s | ≤ 200 ms | ≤ 0,05 | ≤ 200 ms |
| Pagine senza 3D | **≥ 95** | ≤ 2,0 s | ≤ 100 ms | ≤ 0,02 | ≤ 200 ms |
Accessibilità ≥ 95, Best Practices ≥ 95, SEO ≥ 95 su tutte.
Onesto: il 3D non entra nell'LCP (il candidato è il titolo e il poster inline), ma il suo avvio pesa sul **TBT**. Se il TBT supera i 200 ms, l'avvio del 3D si sposta al primo input o a 2 s dopo `load`. Il prezzo: sul telefono il canvas compare circa 1–2 s dopo il poster (stima). CLS: ogni canvas ha un box con `aspect-ratio` e un poster dentro; `--travel` in `svh`; contatori a larghezza riservata; hotspot in posizione assoluta; LineReveal dopo `fonts.ready`.

---

## 11. Come si verifica (QA) e cosa NON è verificato

**Non verificato (tutto ciò che segue è ipotesi finché non è provato):**
- fps reali su un iPhone e su un Android economico; tempo di parsing del chunk 3D;
- che `append` del canvas tra slot mantenga il contesto su Safari;
- supporto delle scroll-driven animations su Safari 26 e Firefox;
- che `camera-controls` non riporti `touch-action` a `none` dopo `connect`;
- i valori numerici di camera, luce e tempi (3.2, 3.4, 6.2) sono proposte da tarare con la scena vera;
- la fedeltà delle misure di hall e camere (A4, A5).

**Protocollo (qa-performance):**
1. `?perf=1` mostra un riquadro con `renderer.info` (calls, triangles, geometries, textures), il livello attuale, la media dei frame e il `base` del vsync.
2. iPhone reale, Safari, **risparmio energia acceso e spento**; Android di fascia media; desktop. Tre cicli su ogni scena. Registrare fps, livello di arrivo, tempo al primo frame 3D.
3. Memoria: Web Inspector di Safari (Timeline → memoria grafica) durante 10 passaggi di scena; nessuna crescita (2.2).
4. RM acceso/spento a pagina aperta; nessun movimento in più in RM; tutto raggiungibile da tastiera.
5. Layout: CLS reale con Lighthouse e con un traccia manuale; hero e camere con barra di Safari che appare/scompare: `p` non deve saltare.
6. Layer: conteggio in DevTools durante hero, congressi, grill.
7. Test unitario del generatore sale (5.2) e del blocco `luce.ts` (stessa `h` ⇒ stessi valori; `h=0` e `h=1` uguali ai valori di tabella).

---

## 12. Cose da non animare e decisioni per gli altri

**Non si anima, mai:** il corpo del testo (al massimo fade 240 ms), `h1`, pulsante/barra «Prenota» (A7), campi dei moduli, capienze e tabelle, numeri di telefono, ciò che l'utente sta leggendo o compilando; il cursore; il testo sopra una scena 3D; più di un'idea forte per schermata.

**Per il frontend:** token 1.1; `html[data-rm]` e `html.reveal-ready`; struttura suggerita `src/lib/motion/{bezier,math,useSceneP,useReveal,useReducedMotion,quality}.ts`, `src/3d/{stage,luce,sale-layout}.ts`, `src/3d/scenes/{hall,rooms,sala,grill}.ts`, `src/3d/posters/*.svg`; three puro raccomandato (1.3); `dynamic(..., { ssr: false })` solo dentro Client Component; leggere `node_modules/next/dist/docs/` prima di scrivere (`<ViewTransition>` esiste in Next 16, ma **non usarlo su pagine con il canvas**: il canvas persistente non si può «morfizzare» e lo snapshot costa; le transizioni tra pagine restano il crossfade di 160/240 ms su `main`).
**Per UX:** confermare ordine della home (A1), lunghezza delle scene fissate (0.3 punto 5), se «Come viaggi?» resta (A3), se serve davvero lo zoom (0.3 punto 1).
**Per l'art director:** zoom limitato (0.3 punto 1), wellness SVG invece di 3D (0.3 punto 2), accensione come motivo (0.1), regola «`linear` solo per lo scrub».
**Per il 3D:** budget della sez. 10; luci a numero fisso; geometria procedurale; test del generatore sedie.
**Per QA:** sez. 11.
