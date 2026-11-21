# QA — home del sito (build `next start` sulla porta 3222)

Data: 29 settembre 2026. Ambiente: Chromium 1194 headless via playwright-core, **rendering software (SwiftShader)**:
gli fps e i tempi di CPU di qui non valgono per telefoni e PC veri. Lighthouse 12 (throttling simulato).
Nessun file in `src/` è stato toccato. Prove (screenshot e JSON) in
`/tmp/claude-0/-home-user-noway/52786d54-bd01-5973-a6c5-0756dc1690f6/scratchpad/qa/` (sotto: `qa/`).

Regole del progetto verificate: nessun `[DA COMPLETARE]` visibile (0 occorrenze nell'HTML); nessun nome o numero
del prodotto commerciale di partenza (cercati "Gold Momentum", "QUANT_LAB", "798", "7,3 anni", "33%": 0);
ogni tabella o fascia di risultati ha l'etichetta "Backtest · non è un risultato reale" (12 occorrenze) e il
riquadro "Rischio accanto" (4); nessun `translateY` di ingresso nel codice (solo `translateZ`, `rotateX`, `scale`,
`opacity`); scroll mai catturato; nessun contatore che sale.

---

## A. Blocca la pubblicazione

### A1. Senza `NEXT_PUBLIC_SITE_URL` il sito esce senza canonical, sitemap, Open Graph image e URL nel JSON-LD
- **Dove:** `<head>`, `/robots.txt`, `/sitemap.xml`, JSON-LD.
- **Come riprodurre:** `curl http://localhost:3222/ | grep -c canonical` → 0; `curl /sitemap.xml` → `<urlset>` vuoto;
  `curl /robots.txt` → nessuna riga `Sitemap:`; nell'HTML mancano `og:url`, `og:image`, `twitter:image`
  (`twitter:card` = `summary`); il JSON-LD ha `WebSite`/`WebPage` senza `url` né `@id`.
- **Prova:** `qa/e_seo.json`.
- **Cosa c'è già e va bene:** `title` (58 caratteri, come COPY.md), `meta description` (147), `lang="it"`,
  un solo `h1`, gerarchia h1>h2>h3 senza salti, `og:title/description/site_name/locale/type`, `theme-color`,
  icone SVG + apple-touch-icon (200), JSON-LD valido (JSON.parse ok). Lighthouse SEO 100/100 (il canonical per
  Lighthouse è facoltativo, per questo non lo segnala).
- **Correzione:** impostare `NEXT_PUBLIC_SITE_URL=https://dominio` **prima** di `npm run build` (README).
  Il codice è già pronto (`src/lib/site.ts`, `layout.tsx`, `robots.ts`, `sitemap.ts`, `page.tsx`). Aggiungere
  al processo di deploy un controllo che fallisca se la variabile manca. Rigenerare `public/og.png` con le font vere
  (DA-COMPLETARE 7c).
- **Ruolo:** chi fa il deploy (variabile) + Davide (URL definitivo).

### A2. Voci legali e titolare assenti (già in DA-COMPLETARE 1-3): confermato in pagina
- **Dove:** sezione Avviso e footer.
- **Prova:** `qa/page-text.txt`: "Titolare" 0 occorrenze, "©" 0, nessuna sesta voce dell'avviso. Nessun testo
  segnaposto visibile (bene).
- **Correzione:** come da DA-COMPLETARE. Non è un difetto del codice: è un dato che manca.
- **Ruolo:** Davide + professionista.

---

## B. Da correggere

### B1. Scena "Strategie": nella dissolvenza tra i due livelli i testi si sovrappongono e non si leggono
- **Dove:** `src/components/motion/StrategyFlythrough.tsx` (funzione `Layer`, mappa di opacità) — scena 03.
- **Come riprodurre:** fermarsi con lo scroll tra il 42% e il 53% dell'altezza della scena (`.zscene`, 360svh):
  su un telefono da 844 px è una finestra di circa 330 px di scroll. Misure (uguali a 360/390/768/1440,
  `qa/a3_zscene.json`):

  | progresso | livello 01 (ROTTURA) | livello 02 (RITRACCIAMENTO) | leggibilità |
  |---|---|---|---|
  | 0,30 | opacità 1, z ≈ +17 | opacità 0,22, z ≈ −480, dietro | ok: il 02 sta dietro la scheda 01 (fondo al 94%) |
  | 0,40 | opacità 0,99, z ≈ +120 | opacità 0,67 | quasi ok, il 02 traspare appena |
  | **0,45** | **opacità 0,64, z ≈ +263, davanti** | **opacità 0,90, z ≈ −258** | **illeggibile: due testi intrecciati** |
  | **0,50** | **opacità 0,29, z ≈ +403, davanti** | opacità 1 | testo 01 fantasma sopra il 02 |
  | 0,55 | opacità 0 | opacità 1 | ok |

  Il punto è che il livello uscente è **più vicino alla camera** (z positivo), quindi con `preserve-3d` viene
  disegnato **sopra** quello entrante: nessuno sfondo della scheda 02 può coprirlo. Il parent aveva letto
  "01 dietro 02"; in realtà è 01 davanti, ingrandito (scala 1,36 a p 0,45) e semitrasparente.
- **Prova:** `qa/w390-strategie-p045.png`, `qa/w1440-strategie-p045.png`, `qa/w390-strategie-p05.png`
  (illeggibili); `qa/w1440-strategie-p03.png` (ok, per confronto). Serie completa `w{360,390,768,1440}-strategie-p*.png`.
- **Gravità:** da correggere, non bloccante: la finestra è breve e chi scorre veloce la attraversa, ma chi si
  ferma lì (fine di un flick sul telefono, rotellina lenta) vede un pasticcio di testo.
- **Correzione suggerita:** far sparire il livello uscente **prima** che l'entrante superi ~0,2 di opacità, e far
  entrare il nuovo solo quando il vecchio è già a zero. Per esempio, in `Layer`:
  opacità `piecewise(z, [-1700, -700, -220, 80, 200], [0, 0, 1, 1, 0])` al posto di
  `[-1700, -900, -160, 120, 520] → [0, 0.22, 1, 1, 0]`, e/o `FOCUS_STEP` da 0,37 a ~0,45 con `PLATEAU` 0,12
  (così le due finestre di visibilità non si toccano). Verificare poi che a p ≈ 0,45 una sola scheda sia > 0,2.
- **Ruolo:** motion designer + front-end.

### B2. Tastiera: il focus finisce su elementi invisibili o coperti dalla barra fissa del rischio
- **Dove:** `src/components/motion/RevealObserver.tsx` (rootMargin `-8%`, threshold 0,12), `globals.css`
  (`scroll-padding-top` c'è, `scroll-padding-bottom` no), `.riskbar` sticky.
- **Come riprodurre (desktop 1440×900):** caricare, premere Tab 17 volte: il focus arriva a `summary`
  "Lo stesso test, a tre gambe". Il browser lo scorre al bordo basso della finestra (bottom 892 px, barra del
  rischio da 854 px): resta **sotto la barra** e il suo blocco `.reveal` **non riceve mai `.in`** (dopo 1,5 s
  opacità ancora 0). Il focus è su qualcosa che non si vede, e l'anello di focus non si vede perché il genitore è a
  opacità 0.
- **Come riprodurre (telefono 390×844):** Tab fino alla regione tabella "Portafoglio a tre gambe e a due gambe"
  (bottom 845 px, barra da 773 px) e al link "Il rischio" subito dopo (bottom 844): visibili ma tagliati dalla
  barra del rischio (71 px).
- **Prova:** `qa/kb-issue-w1440-2-SUMMARY.png` (il punto del focus è vuoto), `qa/kb-issue-w390-2-DIV.png`
  (anello di focus tagliato dalla barra), `qa/b3_focus_wait.json`.
- **Correzione suggerita:** (1) `html { scroll-padding-bottom: calc(var(--riskbar-h) + var(--sp-4)) }` con
  `--riskbar-h` 72 px sotto 950 px e 48 px sopra (o misurata con un `ResizeObserver` che scrive la variabile);
  (2) in `RevealObserver` aggiungere `document.addEventListener('focusin', e => e.target.closest('.reveal')?.classList.add('in'))`,
  così un blocco raggiunto da tastiera entra subito; in alternativa `rootMargin: '0px'`.
- **Ruolo:** front-end (accessibilità).

### B3. Due landmark con lo stesso nome "Avviso sul rischio"
- **Dove:** `RiskBar.tsx` (`role="region" aria-label="Avviso sul rischio"`) e `Avviso.tsx`
  (`section aria-labelledby` → h2 "Avviso sul rischio").
- **Prova:** axe-core, violazione `landmark-unique` (moderate) a 1440 e 390: `qa/c_axe.json`. È l'**unica**
  violazione axe (regole wcag2a/aa, 2.1, 2.2, best-practice) su tutta la pagina con tutti i blocchi rivelati e i
  `details` aperti.
- **Correzione:** `aria-label="Avviso breve sul rischio"` sulla barra (o togliere `role="region"` e lasciare
  il solo `<p>`).
- **Ruolo:** front-end.

### B4. "Copia l'indirizzo": il messaggio di errore esce grigio, non rosso (e "Indirizzo copiato" non è verde)
- **Dove:** `src/components/site/CopyEmail.tsx` riga 35: `className="t-note … text-bad|text-ok"`.
- **Perché:** `.t-note` in `globals.css` sta **fuori da ogni `@layer`** e imposta `color: var(--mut)`; le utility
  Tailwind stanno in `@layer utilities`, quindi perdono sempre contro una regola non a layer, a prescindere
  dall'ordine. (Altrove il problema è stato evitato con `text-ink!` e `text-oro!`.)
- **Come riprodurre:** in Contatti premere "Copia l'indirizzo" con gli appunti negati: il testo
  "Non è stato possibile copiare…" ha `color: rgb(147,159,169)` (= `--mut`), atteso `--bad` `#fa8c82`.
- **Prova:** `qa/kb-copy-err.png`, `qa/b2_tabs.json` → `statusColorErr`. Il flusso funziona: `qa/kb-copy-ok.png`
  ("Indirizzo copiato", appunti = `portfolioalgomanager21@gmail.com`, `role=status aria-live=polite`, si
  azzera dopo 4 s; messaggio d'errore corretto quando `writeText` fallisce).
- **Correzione:** `text-bad!` / `text-ok!` in quel `className`, oppure spostare `.t-note`, `.t-sec`, `.eyebrow`,
  ecc. dentro `@layer components` in `globals.css` (più pulito, vale per tutto il sito).
- **Ruolo:** front-end.

### B5. Tabella 22% / 47% sul telefono: la colonna "Come leggerlo" resta fuori schermo
- **Dove:** `Metodo.tsx`, regola 2, punto 3 (`.dtable` ha `min-width: 520px`).
- **Verifica del punto 12 di DA-COMPLETARE (esito: conforme):** la tabella ha sopra l'etichetta "BACKTEST · NON È
  UN RISULTATO REALE" (12 px mono), caption "Simulazione a rischio 1,05%, fuori campione", intestazione di colonna
  "Annuo (backtest)", e subito sotto il riquadro "Rischio accanto: a rischio 1,05% per operazione… drawdown sotto il
  35% (99° percentile: 49%)". Cifre 14 px, riquadro 14 px: stessa dimensione, nessuna cifra grande.
  Prova: `qa/w1440-tabella-22-47.png`, `qa/w390-tabella-22-47.png`.
- **Il difetto:** a 390 px la tabella scorre di lato (520 px in 324 disponibili) e la terza colonna, che è
  proprio la qualifica dei due numeri ("pulito" / "contaminato dalla scelta a posteriori"), non si vede senza
  scorrere. C'è la scritta "Scorri di lato", ma il visitatore vede 22% e 47% senza la loro chiave di lettura.
- **Correzione:** per questa tabella (3 colonne, testi corti) togliere il `min-width` (o portarlo a 320 px) e
  lasciare andare a capo la terza colonna; oppure mettere "Come leggerlo" sotto il nome del portafoglio.
- **Ruolo:** front-end + UX.

---

## C. Migliorie

### C1. Prestazioni: numeri veri (Lighthouse 12, throttling simulato, CPU di questo container)
| | Mobile | Desktop |
|---|---:|---:|
| Performance / Accessibilità / Best practice / SEO | **84** / 100 / 100 / 100 | **68** / 100 / 100 / 100 |
| FCP | 0,9 s | 0,3 s |
| LCP | **2,9 s** | 0,6 s |
| TBT | 440 ms | **910 ms** |
| CLS | 0 | 0,002 |
| Speed Index | 2,2 s | 2,0 s |
| Peso trasferito totale | 285 KiB | 564 KiB |
| di cui JS | 201 kB (7 file) | 479 kB (8 file: + three.js 279 kB) |
| font | 45 kB (2 woff2) | 45 kB |
| CSS | 10 kB | 10 kB |

Report completi: `qa/lh-mobile.report.html`, `qa/lh-desktop.report.html` (+ `.json`).
- **Budget di DESIGN.md/MOTION.md rispettati:** prima schermata senza shader 285 KiB < 350 kB; font 45 kB < 100 kB;
  JS iniziale 201 kB ≈ obiettivo 250 kB; CLS 0; lo shader (chunk `1y6idm75_58z9.js`, 279 kB gzip) parte a
  ~3,3 s, dopo il primo disegno, solo su desktop (su mobile emulato il sito si mette in "lite" e non lo carica).
- **Cosa pesa:** su desktop il parsing di three.js costa 910 ms di TBT (bootup 1,3 s). Non blocca la prima
  lettura (arriva dopo 3 s) ma chi interagisce in quella finestra lo sente. Su mobile il TBT 440 ms viene dal
  bundle principale (React + Framer Motion). `unused-javascript`: 87 KiB (mobile) / 208 KiB (desktop).
- **Elemento LCP sbagliato:** Lighthouse registra come LCP **il paragrafo della barra del rischio**, non l'h1,
  perché l'h1 entra con `enter-z` da opacità 0 per 1,2 s (+60 ms) e Chrome non lo conta finché è trasparente.
  L'LCP simulato mobile è 2,9 s contro FCP 0,9 s ("da migliorare" per Google, soglia 2,5 s).
- **Suggerimenti:** per l'h1 animare solo `transform` (opacità da 1) o durata ≤ 500 ms → LCP ≈ FCP;
  `LazyMotion` di Framer per ridurre il bundle iniziale (previsto in DESIGN.md 11, non fatto); valutare se
  caricare three.js solo dopo il primo scroll o dopo `requestIdleCallback` con `timeout` più lungo.
- **Ruolo:** front-end (prestazioni) + motion designer per l'h1.
- **INP: non misurabile in laboratorio.** Proxy: `max-potential-fid` 220 ms (mobile) / 910 ms (desktop).

### C2. Console: avviso `THREE.Clock: This module has been deprecated` ripetuto (3-9 volte)
- Viene da ShaderGradient (già noto in MOTION.md). Si ripete a ogni rimontaggio dello shader (esce/rientra
  l'hero). Nessun errore, nessuna richiesta fallita, nessun 404 (a 360/390/768/1024/1440). `qa/a_responsive.json`.
- **Ruolo:** front-end (filtrare o aspettare aggiornamento della libreria).

### C3. Barra del rischio sul telefono: 71 px su due righe + header 64 px = 135 px sempre occupati (16% dello schermo a 844)
- Prova: `qa/w390-ingresso.png`, `qa/b_keyboard.json` → `mobileRiskbar`. Il testo completo è richiesto da COPY.md;
  si può proporre a Davide una riga unica sotto 600 px ("Backtest, non risultati reali. Alto rischio. Non è
  consulenza. Leggi l'avviso") o ridurre il padding.
- **Ruolo:** copy + UX.

### C4. Email in Contatti spezzata a metà parola sul telefono
- `break-all` produce "portfolioalgomanager21@gmai / l.com" a 390 px (`qa/w390-contatti.png`). Usare
  `overflow-wrap: anywhere` e corpo 18 px sotto 600 px, o spezzare prima della chiocciola.
- **Ruolo:** front-end.

### C5. Menu su telefono: dettagli
- Funziona da tastiera: Enter/Spazio apre (`aria-expanded`, `aria-label` cambia in "Chiudi il menu"), Tab entra
  nelle 5 voci (48 px), Esc chiude e il focus resta sul bottone, Enter su una voce porta a `#metodo` (titolo sotto
  l'header, a 161 px) e chiude. Prova: `qa/kb-menu-open.png`, `qa/b_keyboard.json`.
- Migliorie: il tocco fuori dal menu non lo chiude; senza JavaScript il bottone c'è ma è morto (già in
  DA-COMPLETARE): meglio nasconderlo con `html:not(.js)` e mostrare i link, o usare un `<details>`.
- **Ruolo:** front-end.

### C6. Testi aggiunti che non stanno in COPY.md
- "Le barre vanno da 0% a 50% di drawdown." (Rischio), "Nota di lettura: 1 R è il rischio corso… Tutti i
  numeri di questa sezione sono backtest." (Scartate), il testo del riquadro "Rischio accanto: …", "Altri
  strumenti: in preparazione", "In preparazione". Sono coerenti e non introducono numeri di risultato nuovi
  (`qa/g_copy` → i soli numeri "in più" sono numeri di scena 01-08, l'esempio del glossario 100 €/+2 R/+200 €
  che sta in COPY.md sez. 6, e lo 0-50% della scala delle barre). Vanno riportati in COPY.md perché resti la fonte.
- I 12 blocchi campionati (h1, sottotitolo, barra fissa, Metodo regola 1, ROTTURA testo e regole, Rischio lettura,
  Avviso voce 3, Contatti, Monitoraggio, Scartate scheda 2, footer riga 1) sono **identici** a COPY.md.
  Parole da evitare (COPY.md sez. 1): nessuna (l'unico "guadagni" è nel glossario "guadagni totali diviso…").
- **Ruolo:** copywriter.

### C7. Piccolezze
- `Hero.tsx`: due `Reveal` con `i={4}` (nota + fascia numeri): stesso ritardo, voluto o refuso.
- `/favicon.ico` → 404 (Chromium non lo chiede perché c'è `<link rel=icon>`, altri agenti sì).
- Lo shader non parte mai su telefoni con ≤ 4 core o `pointer: coarse` (regola "lite"): qui su 390/768 emulati
  non è mai stato visto, quindi shader e tasto Pausa **su telefono non sono verificati**.
- Nel primo screenshot del menu (`qa/kb-menu-open.png`) l'header appariva spostato di ~75 px verso il basso:
  **non riprodotto** (ripetendo gli stessi 8 Tab: header a 0, `visualViewport.offsetTop` 0,
  `qa/kb-mobile-after-tabs.png`). Lo attribuisco all'emulazione, non al sito.

---

## D. Cosa è stato controllato e risulta a posto

- **Scroll orizzontale, sovrapposizioni, testi tagliati** a 360×740, 390×844, 768×1024, 1024×768, 1440×900:
  `scrollWidth` = larghezza finestra a 25 posizioni per larghezza; nessun elemento fuori dal bordo destro/sinistro
  (esclusi i livelli 3D e le cornici, che escono per costruzione); nessun elemento di testo con `overflow` che lo
  tronchi (fuori dalle tabelle scorrevoli, che hanno la scritta "Scorri di lato" visibile sotto 950 px).
  Screenshot per scena: `qa/w{360,390,768,1024,1440}-{ingresso,metodo,strategie,scartate,rischio,monitoraggio,contatti,avviso}.png`
  e `*-full.png`. Header a 768: marchio + "Scrivi via email" + menu, tutto dentro (`qa/w768-ingresso.png`).
- **Console:** nessun errore, nessuna eccezione, nessuna richiesta fallita (vedi C2 per l'unico avviso).
- **Tastiera:** 32 stop su desktop, 26 su telefono, **tutti** con anello di focus visibile (`outline 2px` lime,
  `:focus-visible` vero) — `qa/b2_tabs.json`, `qa/kb-focus-cta.png`. Skip link "Vai al contenuto" è il primo
  stop e compare (`qa/b2_tabs.json`). Tooltip "fuori campione" si apre col focus da tastiera (`qa/kb-tooltip.png`).
  `details/summary` si aprono con Enter. Tasto **Pausa** (desktop): Enter → `aria-pressed=true`, testo
  "Riprendi animazione", canvas WebGL smontato; entrambi i tasti (hero e footer) cambiano insieme; Spazio →
  riparte (`qa/kb-pause-pressed.png`). Link **"Leggi l'avviso completo"**: raggiungibile, Enter porta a `#avviso`
  con la sezione a 80 px (sotto l'header di 65) e il titolo a 208 px (`qa/kb-avviso-target.png`). Le eccezioni
  sono in B2.
- **Contrasto AA (misurato sui pixel, testo nascosto, 3 campioni nel tempo con lo shader acceso a 1440; fallback
  statico a 390):** h1 sopra lo shader 13,2:1 (peggior pixel), sottotitolo 13,2, eyebrow grigio su chip 5,1,
  etichette `--mut` nelle schede-cifra 6,75-6,80, tag "Backtest" 9,95, "Rischio accanto" 15,5 / rosso 7,5,
  barra del rischio 15,5 e link 14,2, voci del menu desktop `--mut` 7,2, contatore "01 / 08" 7,1, bottone
  lime 13,97. `qa/c2_contrast.json`, `qa/contrast-*-bg.png`. Su superfici piene axe non trova violazioni
  (`--mut` 7,30 su bg, 6,79 su surf, 6,37 su surf2 come in DESIGN.md); i 18-22 casi "incomplete" di axe sono i testi
  sopra gradiente, coperti dalla misura a pixel. Nota: sopra lo shader ci sono anche testi da 12-14 px, ma tutti su
  chip/schede `--surf` al 92-94%: compatibile con la regola di DESIGN.md sez. 8.
- **`prefers-reduced-motion`** (390 e 1440): al caricamento 0 blocchi nascosti su 64, hero senza transform,
  nessun canvas, nessun tasto Pausa (giusto: non c'è nulla da fermare), scena Strategie in colonna statica
  (`.zstage` static, cornici nascoste), `scroll-behavior: auto`. `qa/rm-w390-strategie.png`, `qa/rm-*-full.png`,
  `qa/d_static.json`.
- **Senza JavaScript** (390 e 1440): tutto il contenuto visibile, versione statica della scena, nessun
  elemento a opacità 0 dopo l'animazione CSS dell'hero (1,2 s, in Z, consentita), niente menu (vedi C5).
  `qa/nojs-w390-hero.png`, `qa/nojs-*-full.png`.
- **Schermo basso 740×360:** versione statica attiva (`max-height: 560px`). `qa/landscape-740x360-strategie.png`.
- **Accessibilità semantica:** landmark `header/nav×2 (etichettati)/main/footer`, 8 `section` con
  `aria-labelledby`, tabelle con `caption`, `th scope`, barre-dato `aria-hidden` con i numeri accanto, icone
  `aria-hidden`, nomi accessibili corretti (h2 su due righe letto "Si decide prima, si misura dopo"; voci del menu
  "Metodo 02"). Lighthouse accessibilità 100 in entrambe le modalità.
- **Numeri e regole di contenuto:** tabelle e fascia dell'hero con etichetta backtest + rischio accanto;
  schede "Scartate" con tag backtest (tranne "Rischio adattivo", che non ha cifre) e nota di lettura sull'R;
  drawdown accanto al 22%/47% (B5 solo per l'impaginazione sul telefono).

---

## E. Cosa NON ho potuto misurare (da non dare per passato)

- Fluidità (fps) e batteria su GPU e telefoni veri; Safari/iOS (sticky + `preserve-3d` + `svh`); lo shader e il
  tasto Pausa **su telefono** (qui il telefono emulato cade sempre nel fallback "lite").
- INP reale (Lighthouse dà solo TBT/max-FID); tempi su rete reale; CDN/compressione del server di produzione.
- Lettore di schermo vero (VoiceOver/NVDA): controllati solo albero ARIA, nomi accessibili e axe.
- Resa dell'immagine social sulle piattaforme (og:image non è collegata senza URL) e correttezza legale dei testi.
- Aspetto dello shader a occhio rispetto al fallback (colori medi simili nei pixel, non giudicato esteticamente).
- Stampa, zoom 200-400%, tema chiaro forzato, Windows High Contrast.
