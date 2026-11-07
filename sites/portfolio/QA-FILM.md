# QA — home "film a scroll" e /dettagli

Data: 29 settembre 2026. Ambiente: Chromium 1194 headless (playwright-core 1.56), **rendering software SwiftShader**
(~4 fotogrammi al secondo a 1440×900: niente fps né giudizi di fluidità), 4 core. Lighthouse 11.7.1 con throttling
simulato. Nessun file in `src/` toccato, nessun commit.
Prove (PNG, JSON, script) in `/tmp/claude-0/-home-user-noway/52786d54-bd01-5973-a6c5-0756dc1690f6/scratchpad/qa-film/`
(sotto: `qa-film/`).

**Su quale build.** Il server `next start` sulla 3312 era morto all'inizio del QA. Ho avviato il mio sulla 3399 con la
`.next` presente (BUILD_ID `j-8K5LT…`, più recente di tutti i sorgenti): su questa girano i controlli 1–5 del film.
Alle 10:38 la `.next` è stata riscritta da un'altra sessione con `EXPORT_STATIC=1` (vedi A1): ho rifatto
`npm run build` normale (BUILD_ID `JoqUS7E…`) e su quello girano i controlli 7–11 e /dettagli. I sorgenti del film
(`src/components/film/*`) non sono cambiati fra le due build; sono cambiati solo `robots.ts`, `sitemap.ts`, `next.config.ts`.
**Attenzione:** dalle 10:54 in poi, a test finiti, nell'albero di lavoro sono comparse modifiche non committate a
`Film.tsx`, `FilmTopBar.tsx`, `page.tsx`, `site.ts`, `RiskBar.tsx`, `Avviso.tsx`, `next.config.ts` e tre file nuovi
(`FilmDataPanel.tsx`, `MagneticCta.tsx`, `player.ts`). **Questo QA vale per i sorgenti al commit `af833e3`**, non
per quelle modifiche: B1–B4 e C1–C2 vanno ricontrollati sul codice nuovo prima di chiuderli.

---

## A. Blocca la pubblicazione

### A1. Dopo `EXPORT_STATIC=1 next build`, la `.next` contiene la build "export" e `next start` serve /dettagli rotta
- **Dove:** `next.config.ts` (commit `af833e3`), `.next/required-server-files.json`.
- **Cosa succede:** l'export statico scrive comunque in `.next` (il file di configurazione salvato riporta
  `trailingSlash: true, output: "export", assetPrefix: "./", distDir: ".next"`). Se poi si lancia `next start` su
  quella cartella: `/dettagli` → 308 → `/dettagli/`, e la pagina cerca CSS, font e JS in `/dettagli/_next/...` →
  **tutti 404**: /dettagli esce senza stile e senza JavaScript; nella home i prefetch RSC (`__next._tree.txt`) vanno in 404.
- **Come riprodurre:** `EXPORT_STATIC=1 npm run build && npm run start`, aprire `/dettagli`.
- **Prova:** output di `qa-film/dbg_req.cjs` (28 richieste 404/ERR_ABORTED su `/dettagli/`), `qa-film/server-3399.log`.
- **Correzione:** nell'export usare davvero un'altra cartella (Next 16 ignora `distDir` per la build intermedia:
  meglio eseguire l'export in una copia/worktree, oppure far seguire all'export un `next build` normale prima di
  qualunque `next start`/deploy), e nel processo di deploy verificare che `required-server-files.json` non abbia
  `output: "export"`.
- **Ruolo:** chi fa il deploy / front-end (config).

### A2. Come nel QA precedente: senza `NEXT_PUBLIC_SITE_URL` niente canonical, sitemap vuota, niente `og:url`/`og:image`
- Verificato di nuovo su entrambe le pagine: `canonical` assente, `sitemap.xml` con `<urlset>` vuoto, `robots.txt`
  senza riga `Sitemap:`, `og:title/description/locale/type` presenti, immagine assente. Il codice è già pronto: è una
  variabile da impostare **prima** della build. Le voci legali mancanti (titolare, diciture) restano come da DA-COMPLETARE.
- **Ruolo:** deploy + Davide.

---

## B. Da correggere

### B1. ONE RULE violata da uno stato nascosto: `fog.near` scende e non risale mai
- **Dove:** `src/components/film/FilmCanvas.tsx`, `CameraRig`, riga 508:
  `fog.near = Math.min(fog.near, fog.far * 0.5);`
- **Perché:** `Math.min` con il valore corrente rende `near` monotono decrescente. Dopo essere arrivati in fondo
  (p ≥ ~0,93, `fogFar` sotto 36) `near` passa da 18 a 1,75 e ci resta: tornando indietro la nebbia inizia a
  1,75 unità dalla camera invece che a 18, e il fotogramma non è più lo stesso.
- **Come riprodurre (misurato, tempo congelato con `?film-debug=1&film-t=5`, pagina fresca per ogni p):**
  screenshot a p salendo, poi 0,9 → 0,97 → 1,0 → ritorno allo stesso p, confronto pixel.

  | p | rumore (stesso p, due volte) | dopo aver toccato p=1,0: pixel cambiati >4/255 | massimo |
  |---|---|---|---|
  | 0,30 | 0 pixel | **3,89 %** (42 793) | 11/255 |
  | 0,50 | 0 pixel | **3,74 %** (41 183) | 11/255 |
  | 0,75 | 0 pixel | **5,70 %** (62 688), 2,88 % sopra 12/255 | 22/255 |

  Andando solo fino a 0,9 e tornando la cornice è **identica al pixel** (0 differenze a p 0,3 e 0,6): il resto della
  scena rispetta la regola.
- **Prova:** `qa-film/fog-p0.75-A-prima.png` / `fog-p0.75-B-dopo-p1.png` / `fog-p0.75-diff.png` (tutta la stanza
  cambia), `qa-film/t1b_fog.json`, `qa-film/t1_scrub.json`.
- **Gravità:** a occhio è sottile (poche unità su 255), ma è esattamente il tipo di stato che il brief vieta e la
  correzione è una riga.
- **Correzione:** `fog.near = Math.min(18, fog.far * 0.5)` (costante di partenza, non il valore corrente), o
  meglio una funzione `fogNear(p)` accanto a `fogFar(p)` in `state.ts`.
- **Ruolo:** front-end (scena).
- **Grep di stato nascosto nel resto:** nessun `useState`, `lerp`, `damp`, `spring` dentro i `useFrame`
  (`FilmCanvas.tsx` riga 315 `tmp.copy(gold).lerp(dim, lime)` è un mix puro di due colori, non un inseguimento).
  `cameraPose` non legge il mouse: il bersaglio della camera dipende solo da `sp`.

### B2. Atto 6: i bottoni compaiono nitidi mentre le loro didascalie sono ancora sfocate, e il bottone lime sta sopra la stanza oro
- **Dove:** `Film.tsx` (ciclo rAF: la rampa di opacità si applica solo alle `.film-l`, non a `.film-cta` e
  `.film-mail`), `state.ts` `OVERLAY_WINDOWS[5]` (p 0,88..0,96), `limeInFrame` (non considera l'atto 6).
- **Come riprodurre:** p = 0,90 (`?film-debug=1&film-p=0.9`).
- **Cosa si vede:** "Vedi i dettagli" (lime pieno) e "Scrivi via email" già al 100 % dal momento in cui l'overlay
  diventa `visible` (p ≈ 0,88), le due frasi sopra ancora a metà blur; sotto, la frase B dell'atto 5 che sta
  ancora uscendo sfocata; dietro, la stanza **oro** ancora accesa (la nebbia si chiude solo verso p 0,95).
  Campionamento colori a p 0,90: **5 646 pixel lime** (tutti nel riquadro del bottone, x 578–709 y 399–442) e
  **29 228 pixel oro** nello stesso fotogramma. È l'unica co-presenza reale trovata (vedi D).
- **Prova:** `qa-film/color-p0.90.png`, `qa-film/t5_colors.json`.
- **Correzione:** applicare la stessa `total` (wIn·(1−wOut)) come `opacity` a `.film-cta` e `.film-mail`
  (o all'intero `.film-end`), con `pointer-events` solo sopra ~0,5; e spostare l'inizio della finestra dei contatti a
  p ≈ 0,94, oppure far spegnere l'oro della stanza con `gates[5]` (in `Room`: `lerp(dim, max(lime, gates[5]))`).
- **Ruolo:** motion designer + front-end.

### B3. L'ingresso automatico viene "mangiato" dal primo fotogramma: p salta invece di salire
- **Dove:** `Film.tsx`: `entryT0` è impostato in `onCreated` del Canvas, prima del bake dei 40 000 istanziati e della
  compilazione degli shader (bloom, LineMaterial); la rampa è su tempo di parete.
- **Misurato (1440, senza scroll, dalla navigazione):** p = 0 a 0,5 / 1,0 s; fotogramma 19 a 2,82 s con p = 0,008;
  fotogramma 20 **3 ms dopo** con p = 0,059 (il thread è rimasto bloccato ~1,7 s fra i due); poi 0,0588 a 3–4 s e
  0,06 a 4,25 s. In pratica la figura non "arriva": appare già a p ≈ 0,06.
- **Caveat:** qui il blocco è di 1,7 s per il rendering software; su una GPU vera sarà di 100–400 ms, quindi il
  salto sarà più piccolo ma c'è (la rampa `easeOutCubic` è ripida all'inizio: 300 ms persi = 33 % della corsa).
- **Prova:** `qa-film/t3_entry.json` (`samples`).
- **Correzione:** far partire `entryT0` al primo `useFrame` **dopo** il bake (es. `onReady` chiamato dal
  `useFrame` di `Post` alla seconda esecuzione), oppure far avanzare l'ingresso con un `dt` per fotogramma limitato a
  ~50 ms invece del tempo di parete.
- **Ruolo:** front-end (scena).

### B4. Sui telefoni classificati "lite" il tasto Pausa sparisce, ma il film continua a muoversi da solo
- **Dove:** `PauseButton.tsx` (`if (!canAnimate) return null`), `MotionPrefs.tsx` (`lite` = telefono con ≤ 4 core
  o ≤ 4 GB o Save-Data). Il film **non** usa `lite`: `Film.tsx` legge solo `reduced` e `paused`.
- **Misurato:** a 360, 390 e 768 px con touch (questo container ha 4 core) `.film-top__pause` non esiste, mentre il
  canvas gira con float della figura (`sin(t·0.6)·0.22`, continuo) e grana animata. WCAG 2.2.2 chiede un comando per
  fermare movimento che dura più di 5 s.
- **Prova:** `qa-film/t8_mobile.json` (`pause: false` in tutte e tre), `qa-film/mob-w390-p0-titolo.png` (barra alta
  senza Pausa).
- **Nota:** su desktop il tasto c'è e funziona (Invio → `aria-pressed=true`, "Riprendi animazione", `film.paused`
  true; Spazio riparte: `qa-film/kb-w1440-pausa-premuta.png`). In pausa però l'ingresso automatico continua
  (`entry` controlla solo `film.reduced`).
- **Correzione:** nel film mostrare Pausa quando `!reduced` (indipendentemente da `lite`), e in pausa azzerare anche
  `entry`. Se si vuole un "lite" per il film, va disegnato (meno perle, niente bloom), non ereditato dallo shader.
- **Ruolo:** front-end (accessibilità).

---

## C. Migliorie

### C1. Cambio di marcia secco a scrollP = 0,12, dove finisce il decadimento dell'ingresso
- Misurato con la rotellina a passi di 120 px: Δp per passo **0,00317** fino a scrollP 0,12, poi **0,00635**
  (esattamente il doppio) da un passo all'altro. Nessun salto di p (monotono), ma la velocità della camera raddoppia
  di colpo nel tratto lineare verso la figura. `off = entry·(1 − clamp01(scrollP/0.12))` è lineare: basta uno
  smoothstep (o portare il decadimento a 0,2) per togliere lo spigolo. Prova: `qa-film/t3_entry.json` (`steps`).
- **Ruolo:** motion designer.

### C2. Buco scuro fra i fili e la valle (p ≈ 0,535–0,575, sp 0,65–0,70)
- L'ultimo filo muore a sp 0,669, la frase B esce a sp 0,65, ma la stanza torna oro solo a sp 0,70
  (`limeInFrame` fili: 0,66..0,70) e la camera è ancora nel tratto dritto: per ~800 px di scroll si vedono solo
  linee grigie quasi nere. Prova: `qa-film/color-p0.55.png`. Legare la coda di `limeInFrame` all'ultimo impulso lime
  (sp ≈ 0,58) o iniziare la discesa prima.
- **Ruolo:** motion designer.

### C3. Peso e prestazioni (numeri veri, laboratorio)
| | Home mobile | Home desktop | /dettagli mobile | /dettagli desktop |
|---|---:|---:|---:|---:|
| Lighthouse Perf / A11y / BP / SEO | **62** / 100 / 100 / 100 | **67** / 100 / 100 / 100 | **89** / 100 / 100 / 100 | **65** / 100 / 100 / 100 |
| FCP / LCP | 0,8 s / **3,1 s** | 0,2 s / 0,8 s | 1,0 s / **3,4 s** | 0,3 s / 0,8 s |
| TBT | **3 700 ms** | 1 600 ms | 180 ms | 1 190 ms |
| CLS | 0 | 0,002 | 0 | 0,002 |
| Trasferito (gzip) | 575 KB | 575 KB | 293 KB | 577 KB |
| di cui JS | **490 KB** (14 file; three.js 240 KB) | 490 KB | 203 KB | 486 KB |

- Dal browser senza throttling (CDP, byte codificati): home 575,4 KB totali, JS 490,5 KB, CSS 11,6 KB, font 44,5 KB;
  LCP = **l'h1 del film** a 404 ms (desktop) / 152 ms (mobile), CLS 0,0016 / 0. Su /dettagli l'LCP è ancora il
  paragrafo della barra del rischio (l'h1 entra da opacità 0), come nel QA precedente.
- **Il film carica gli stessi 490 KB di JS anche sul telefono**: non esiste una via "lite" per il film (vedi B4).
  Il TBT mobile simulato di 3,7 s è tutto parsing/avvio di three + bake delle perle. Valutare: caricare `FilmCanvas`
  dopo il primo disegno dell'h1 (già `ssr:false`, ma parte subito), meno perle sotto 820 px (già 14 000), bake in
  due fotogrammi.
- Report: `qa-film/lh-home-mobile.report.html`, `lh-home-desktop`, `lh-dettagli-mobile`, `lh-dettagli-desktop`
  (+ `.json`), `qa-film/t11_weight.json`. **INP non misurabile** in laboratorio (proxy: max-potential-FID 2,5 s
  mobile / 1,5 s desktop sulla home).
- **Ruolo:** front-end (prestazioni).

### C4. Titolo sopra la figura
- A 1440 la riga "algoritmiche," e a 390 "Tre strategie" attraversano la coda lime della figura: si legge grazie
  al `text-shadow`, ma è bianco su verde chiaro. Prova: `qa-film/smoke-1440-p0.05.png`, `qa-film/mob-w390-p0-titolo.png`.
  Alternative: figura spostata a destra sotto 600 px, o titolo un po' più in basso.
- **Ruolo:** design.

### C5. Piccolezze del film
- `pointermove` non filtra `pointerType`: su telefono il dito che scorre sposta `mx/my` e fa scattare tilt e
  parallasse a ogni tocco. Non l'ho potuto misurare (l'emulazione touch non genera `pointermove` nei miei test):
  filtrare `e.pointerType === "mouse"`.
- Il filo in fase RELEASE a 1440 appare tratteggiato (onda a zig-zag di 28 segmenti + additivo, visto quasi di
  taglio): `qa-film/reduced-w1440-p0.41-fili.png`, bordo destro. Da guardare su GPU vera.
- Dopo l'ingresso, tornare in cima dà p = 0,06, non 0: il primo fotogramma non si rivede più. Coerente con
  l'eccezione dichiarata in SPEC-FILM, lo segnalo perché il brief vende proprio "scrub indietro = stesso fotogramma".
- Console home: un solo avviso `THREE.Clock: This module has been deprecated` (R3F). Nessun errore, nessun 404
  sulla build corretta.
- `qa-film/t2_gates.json`: gli overlay entrano 0,03–0,05 di sp dopo il gate del proprio atto e escono prima:
  giusto. La sovrapposizione 5→6 è di 0,022 di sp perché per costruzione corre su p (0,80–0,94 di p = 0,136).

### C6. /dettagli
- La tabella del drawdown (sezione Rischio) ha l'etichetta "Backtest" ma **non** il riquadro "Rischio accanto"
  (le altre tre sì). È la sezione del rischio stesso: decidere se la regola vale anche qui.
- A 390 tre tabelle su quattro scorrono di lato (578, 582 e 513 px in 356), con la scritta "Scorri di lato";
  quella delle correlazioni (`dtable--narrow`) sta dentro (335 px). La tabella 22 % / 47 % **non esiste più**.
- A 1440 la console ha 8 avvisi `THREE.Clock` (ShaderGradient dell'hero, già noto), 0 errori; a 390 zero.
- **Ruolo:** copy/UX + front-end.

---

## D. Verificato e a posto (con i numeri)

**1. ONE RULE (scrub).** 1440, `film-t=5`: p 0,3 e 0,6 raggiunti salendo, poi 0,9 e ritorno → **0 pixel diversi**
(su 1 100 160). Con il tempo vivo il rumore di fondo (grana) è media 2,5 / max 12 su 255 e il ritorno da 0,9 sta
dentro quel rumore (media 2,55 / max 12). L'unica differenza reale è B1 (ritorno da 1,0).
Prove: `qa-film/scrub-t5-p0.3-*.png`, `scrub-t5-p0.6-*.png`, `scrub-live-*.png`, `t1_scrub.json`.

**2. Gate degli atti** (`window.__film.gates` a 40 valori di p, 1440; la copia locale della formula devia al massimo
0,0012 dai valori letti; nessun p con zero atti vivi su 1001 punti):

| p | sp | A1 A2 A3 A4 A5 A6 | vivi | overlay 0..5 (op. max) |
|---|---|---|---|---|
| 0,060 | 0,073 | 1 0 0 0 0 0 | 1 | 1 0 0 0 0 0 |
| 0,111 | 0,136 | 1 0 0 0 0 0 | 1 | 0,66 0 0 0 0 0 |
| 0,128 | 0,156 | 1 0,071 0 0 0 0 | 2 | 0,12 0 0 0 0 0 |
| 0,154 | 0,188 | 0,813 0,465 0 0 0 0 | 2 | 0 0 0 0 0 0 |
| 0,180 | 0,219 | 0,368 0,885 0 0 0 0 | 2 | 0 0,3 0 0 0 0 |
| 0,205 | 0,250 | 0,027 1 0 0 0 0 | 2 | 0 1 0 0 0 0 |
| 0,231–0,256 | 0,28–0,31 | 0 1 0 0 0 0 | 1 | 0 1 0 0 0 0 |
| 0,282 | 0,344 | 0 0,995 0,216 0 0 0 | 2 | 0 1 0 0 0 0 |
| 0,308 | 0,375 | 0 0,715 0,771 0 0 0 | 2 | 0 0,46 0 0 0 0 |
| 0,333 | 0,407 | 0 0,261 1 0 0 0 | 2 | 0 0 0 0 0 0 |
| 0,359 | 0,438 | 0 0,001 1 0 0 0 | 2 | 0 0 0,06 0 0 0 |
| 0,385–0,487 | 0,47–0,59 | 0 0 1 0 0 0 | 1 | 0 0 1 0 0 0 |
| 0,513 | 0,625 | 0 0 0,992 0,013 0 0 | 2 | 0 0 0,46 0 0 0 |
| 0,538 | 0,657 | 0 0 0,695 0,438 0 0 | 2 | 0 0 0 0 0 0 |
| 0,564 | 0,688 | 0 0 0,242 0,939 0 0 | 2 | 0 0 0 0 0 0 |
| 0,590 | 0,719 | 0 0 0 1 0 0 | 1 | 0 0 0 0 0 0 |
| 0,615–0,667 | 0,75–0,81 | 0 0 0 1 0 0 | 1 | 0 0 0 0,69→1 0 0 |
| 0,692 | 0,844 | 0 0 0 0,852 0,221 0 | 2 | 0 0 0 1 0 0 |
| 0,718 | 0,876 | 0 0 0 0,417 0,777 0 | 2 | 0 0 0 0,59 0 0 |
| 0,744 | 0,907 | 0 0 0 0,047 1 0 | 2 | 0 0 0 0 0,06 0 |
| 0,769–0,795 | 0,94–0,97 | 0 0 0 0 1 0 | 1 | 0 0 0 0 1 0 |
| 0,821 | 1 | 0 0 0 0 1 0,109 | 2 | 0 0 0 0 1 0 |
| 0,846 | 1 | 0 0 0 0 1 0,442 | 2 | 0 0 0 0 1 0 |
| 0,872 | 1 | 0 0 0 0 0,941 0,806 | 2 | 0 0 0 0 1 0 |
| 0,897 | 1 | 0 0 0 0 0,548 0,998 | 2 | 0 0 0 0 0,51 0,21 |
| 0,923 | 1 | 0 0 0 0 0,115 1 | 2 | 0 0 0 0 0 0,95 |
| 0,949–1 | 1 | 0 0 0 0 0 1 | 1 | 0 0 0 0 0 1 |

Sovrapposizioni (griglia fine, soglia 0,001): 1→2 sp 0,143–0,257 (**0,115**), 2→3 0,322–0,438 (**0,116**),
3→4 0,622–0,717 (**0,095**), 4→5 0,822–0,917 (**0,095**), 5→6 p 0,802–0,938. A ogni confine almeno due atti > 0.
Gli overlay stanno sull'asse sp (l'ultimo su p) e vivono dentro il proprio atto. Tabella completa in `qa-film/t2_gates.log`.

**3. Ingresso.** Senza scroll p arriva a 0,0588 a 3 s e 0,06 a 4,25 s; con lo scroll p resta monotono, massimo Δp per
passo 0,00635 (nessun salto). Con `prefers-reduced-motion` o pagina aperta già scrollata: niente ingresso (p = 0 a 3 s).
Difetti in B3 e C1.

**4. Mouse** (1440, `film-t=5`, confronto pixel): figura a p 0,06 — centro vs alto-sinistra **3,53 %** di pixel
cambiati, vs basso-destra 4,04 % (rumore 0,30 %, tutto nelle lettere del titolo che stavano ancora entrando);
stanza a p 0,30 — **6,69 %** / 6,80 % (rumore 0 %), tutta la griglia si sposta. Il bersaglio della camera non dipende
dal mouse (per codice: `cameraPose(sp, aspect, reduced)`). Prove: `qa-film/mouse-*.png`, `t4_mouse.json`.

**5. Colori** (17 valori di p, pixel con S ≥ 0,35 e V ≥ 0,18, stage senza barre): lime 78–150 k px e oro **0** da
p 0,02 a 0,18; a p 0,20 (sp 0,244) 46 469 oro e **51 px** lime (coda della gabbia, invisibile); da 0,22 a 0,25 solo
oro; da 0,30 a 0,50 (fili) oro **0** e lime solo nell'impulso in punta (856 px a p 0,30); da 0,55 a 0,80 solo oro;
p 1,0 solo il bottone lime. Unica co-presenza vera: p 0,90 (B2). Prove: `qa-film/color-p*.png`, `t5_colors.json`.

**6. Post chain** (letto in `FilmCanvas.tsx` `Post`): `RenderPass → UnrealBloomPass(0.55, 0.45, 1.15)` con
`smoothWidth 0.35` → `ShaderPass(VignetteShader)` con `offset 1.3`, **`darkness 1.0`** → `OutputPass` → grana
(`ShaderPass` custom, dopo il tone map). L'`EffectComposer` di three 0.186 usa un target `HalfFloatType` e
`VignetteShader` fa ancora `mix(texel, vec3(1.0 - darkness), dot(uv,uv))`: con 1,0 non va in negativo. Ordine e valori
come da brief.

**7. Reduced-motion** (1440 e 390): `film.reduced` true, p = 0 dopo 3 s (niente ingresso), fili presenti e in tiro
(`qa-film/reduced-w1440-p0.344-filo-teso.png`, `reduced-w390-p0.344-filo-teso.png`, `reduced-*-p0.41-fili.png`),
zero lettere con `filter: blur`, swing/bank a zero per codice (`if (!reduced)` in `cameraPose`), grana ferma
(`time = 0.37`). **Senza WebGL** (getContext webgl → null): `.film-fallback` con h1, due frasi, nota, bottoni;
nessun canvas, nessun errore in console, nessuno scroll orizzontale; clic su "Vedi i dettagli" → `/dettagli`
(`qa-film/nowebgl-w1440.png`, `nowebgl-w390.png`).

**8. Telefono** (360×740, 390×844, 768×1024, più 1024×768): `scrollWidth` = larghezza a 12 posizioni di p, nessun
testo degli overlay sopra la barra alta o sotto la barra del rischio; barra del rischio sempre visibile (390: 773–844,
due righe, 71 px); a p = 1 i due bottoni sono a 424–468 px (390) / 371–415 (360), 44 px alti, `elementFromPoint` al
centro restituisce il bottone stesso, "Vedi i dettagli" → `/dettagli`, `mailto:portfolioalgomanager21@gmail.com?…`
in minuscolo. Prove: `qa-film/mob-w390-*.png`, `mob-w360-p1-contatti.png`, `home-1024-*.png`, `t8_mobile.json`.

**9. Tastiera.** Ordine 1440: "Vai al contenuto" → marchio → **Pausa** → Dettagli → Scrivi via email → "Leggi
l'avviso completo" (barra) → fine; tutti con anello `outline 2px` lime e `:focus-visible` vero. I bottoni dell'ultimo
atto **non** sono raggiungibili a p 0,3 (`visibility:hidden`) e lo diventano a p = 1 (Tab: Dettagli → Scrivi → Vedi i
dettagli; Invio → `/dettagli`). Prove: `qa-film/kb-w1440-focus-pausa.png`, `kb-w1440-focus-vedi-dettagli.png`,
`kb-w1440-pausa-premuta.png`, `kb-w390-*.png`, `t9_keyboard.json`.

**10. /dettagli** (1440 e 390): 0 `[DA COMPLETARE]` nel testo visibile; 0 occorrenze di `2,61`, `22 %`, `47 %`,
`1,30`, `1,36`, `159`, `1.795`, nomi/cifre del prodotto commerciale; 4 tabelle, tutte con etichetta "Backtest · non è
un risultato reale" prima (15 etichette in pagina) e 3 con "Rischio accanto" dopo (C6); nav desktop e menu mobile con
`#portafoglio` e sezione `id="portafoglio"` presente; volo Strategie a progresso 0,42 / 0,45 / 0,50 / 0,53: **un solo
livello sopra 0,2** (opacità 0 / 1 / 0) — la sovrapposizione del QA precedente è risolta
(`qa-film/dett-*-strategie-p0.45.png`); Tab su 31 (desktop) e 26 (telefono) stop con scroll istantaneo: nessun focus
sotto la barra del rischio o sotto l'header, tutti i blocchi `.reveal` raggiunti sono visibili (unica eccezione
tecnica: a 390 la regione della tabella riassuntiva è alta 825 px, più dello schermo); landmark unici ("Avviso breve
sul rischio" nella barra, "Avviso sul rischio" nella sezione); tasto copia: errore in `rgb(250,140,130)` = `--bad`,
"Indirizzo copiato" in `rgb(200,250,114)` = `--ok`, appunti = `portfolioalgomanager21@gmail.com`; **axe 0
violazioni** (wcag2a/aa, 2.1, 2.2, best-practice; 18–20 "incomplete" di contrasto su fondi con gradiente, come prima);
console 0 errori; `title` "Tre strategie algoritmiche: metodo, numeri e rischio", description 147 caratteri, `lang=it`,
un h1, JSON-LD `WebPage` valido. Prove: `qa-film/t10_dettagli.json`, `t10c_dettagli.json`, `dett-*.png`.
Nota di metodo: una prima passata di axe e di Tab dava 85 violazioni di contrasto e opacità 0,5–0,8: erano le
transizioni `.reveal` (850 ms) ancora in corso; ripetuto con attese di 1,1 s e 2,5 s → zero.

**11. SEO home:** `title` 58 caratteri, description 147, `lang=it`, un solo h1 (`aria-label` con il testo intero,
lettere `aria-hidden`), JSON-LD `WebSite`+`WebPage` valido, `theme-color`, icone. Lighthouse SEO 100. Manca solo ciò
che dipende dall'URL (A2).

---

## E. Cosa NON ho potuto misurare

- Fluidità, fps, riscaldamento e batteria su GPU vere e telefoni veri (qui SwiftShader a ~4 fps): la dimensione
  reale del salto di B3, l'aspetto del filo tratteggiato (C5), il bloom e la grana a occhio.
- Il comportamento del tilt con il dito (C5) e il tasto Pausa su telefoni con più di 4 core (qui `lite` scatta sempre).
- INP reale; rete e CDN di produzione; Safari/iOS (sticky 100svh + backdrop-filter + WebGL2).
- Lettore di schermo vero (controllati solo albero ARIA, nomi e axe).
- Resa dell'immagine social e correttezza legale dei testi.
