# DECISIONI — risolvono i conflitti fra BRIEF, DESIGN, UX, COPY, MOTION

Ordine di autorità quando due documenti si contraddicono: **questo file > BRIEF > UX > DESIGN > MOTION > COPY** (COPY solo per i testi).
Tutti gli sviluppatori leggono questo file per primo.

1. **Three.js puro, non react-three-fiber.** Le scene 3D sono costruite in modo imperativo dentro `SceneDef.costruisci(ctx)` (UX 14.1) con `three` (importazioni a sottoinsieme, `import { … } from "three"`). Un solo renderer, un solo canvas, un solo contesto WebGL per visita, spostato fra gli "slot" (MOTION). `@react-three/fiber` e `@shadergradient/react` non si usano: tolti da `package.json` quando nessun file li importa (verifica con grep, poi `npm uninstall`). `camera-controls` si può usare per l'orbita.
2. **Zoom 3D: bloccato**, come DESIGN 5.5 e UX 11.4. Niente pinza, niente rotella, niente ±. Si ruota (trascinamento, ◀ ▶, frecce) e si toccano gli hotspot. (MOTION proponeva ±15%: scartato.)
3. **Wellness: SVG isometrico** (come MOTION), non 3D. Niente canvas per il wellness.
4. **Pulsante miele:** bordo 2 px `inchiostro-900` sulla pillola telefono e sui miele sopra contenuto variabile; senza bordo nella barra su fondo uniforme (UX 15.1). Tono sera: fondo `sera-50`, testo `sera-950` (UX 15.2). Focus: anello doppio 2 px `--focus` + alone 2 px `--bg` (UX 15.4).
5. **Barra/pillola prenotazione:** compare e sparisce con un fade ≤160 ms (si ammette l'animazione di comparsa; si rispetta reduced-motion).
6. **Scene fissate (sticky) nella home:** al massimo ~500 svh in totale. Se servono di più, si accorciano le scene meno importanti, non l'hero.
7. **Numero di sale:** nessun conteggio «13 sale» né «25 sale» visibile finché il cliente non chiarisce (UX 0.8). Le capienze sono solo quelle della tabella COPY sez. 15.
8. **Mappa:** nessuna mappa incorporata, nessuna terza parte, nessun cookie. Diagramma SVG per «come arrivare».
9. **Motore di prenotazione:** `buildEngineUrl` usa i parametri letti da UX 6 (`gg, mm, aa, ggf, mmf, aaf, tot_camere, tot_adulti, tot_bambini, adultiN, bambiniN, notti_1`). Interruttore `ENGINE_PARAMS_VERIFIED=false` in `lib/booking/config.ts`: finché è false, il link apre il motore con i soli id e una nota onesta «Scegli le date sul motore» (UX 6). Non si afferma mai di aver controllato la disponibilità.
10. **Niente foto dell'hotel** nel repo e niente `<img>` verso `image-tc.galaxy.tf`. Tutto procedurale/SVG.
11. **Niente invii finti:** il modulo congressi apre `mailto:` precompilato e offre «Copia il testo». `HAS_BACKEND=false`.
12. **Testi nuovi** (segnati `NUOVO TESTO` in UX 15): chi li usa li scrive in italiano seguendo il tono di COPY e li aggiunge in `content/copy.ts` con commento `// NUOVO TESTO`.
13. **Next 16:** leggere `node_modules/next/dist/docs/` prima di toccare routing, metadata, export. `output: 'export'`, `trailingSlash: true`, immagini non ottimizzate.
14. **Git:** ogni agente lavora solo nei file del proprio modulo (UX 14). Non fare `git commit`/`push`: lo fa il coordinatore. Non installare dipendenze nuove senza dirlo nel rapporto finale.
15. **Verifica:** ogni modulo termina con `npx tsc --noEmit` e `npx eslint` sui propri file puliti. Se il modulo è visibile, prova con Playwright (Chromium in `/opt/pw-browsers`, `executablePath: '/opt/pw-browsers/chromium'`) e guarda lo screenshot a 390 e 1440 px. Dichiara cosa NON hai verificato.
