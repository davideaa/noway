# Portfolio Algo Manager — sito vetrina (nome provvisorio)

Home = film a scroll su una sola tela (`/`, vedi `SPEC-FILM.md`); contenuti onesti in `/dettagli`. In italiano. Next.js 16 + Tailwind 4 + shadcn (base-ui) + Framer Motion + ShaderGradient.

## Documenti di progetto

- `DESIGN.md` — token, contrasti, regole di stile (fonte unica dello stile)
- `MOTION.md` — movimento verso l'interno lungo Z, mai dal basso
- `COPY.md` — testi (le righe `> Fonte:` e le note per Davide non vanno mostrate)
- `SPEC-FILM.md` — il brief del film a scroll e il suo adattamento
- `DA-COMPLETARE.md` — cosa manca prima di pubblicare
- `data/` — operazioni e statistiche del portafoglio; `scripts/plate.py` ne ricava la forma della figura del film
- `assets/` — kit di brand (marchio, icone); `public/` — favicon, icone, immagine social

## Comandi

```bash
npm run dev     # sviluppo
npm run lint
npm run build && npm start
```

Variabile opzionale, da impostare **prima della build** quando l'URL e' deciso:

```bash
NEXT_PUBLIC_SITE_URL=https://esempio.it npm run build
```

Serve per canonical, `sitemap.xml`, `robots.txt`, `og:image` e JSON-LD. Senza, quei campi vengono omessi.

## Dove si cambia lo stile

Tutto in `:root` di `src/app/globals.css`: colori, spaziature, raggi, tempi, distanza in profondita' delle entrate
(`--z-from`, `--rx-from`) e numeri dello shader (`--shader-*`). Nessun altro file ha valori di stile scritti a mano.

## Struttura

- `src/app/page.tsx` — il film (`src/components/film/`: `Film.tsx` traccia + overlay, `FilmCanvas.tsx` scena R3F, `state.ts` la funzione pura di p, `plate.ts` la figura); `layout.tsx` — font, metadata, barra fissa del rischio
- `src/app/dettagli/` — la pagina con le otto scene, header e footer
- `src/components/sections/` — una scena per file (Hero, Metodo, Strategie, Scartate, Rischio, Monitoraggio, Contatti, Avviso)
- `src/components/motion/` — `HeroScene` (recede in Z), `HeroBackground` + `ShaderLayer` (shader caricato dopo il primo
  disegno, smontato quando l'hero esce), `StrategyFlythrough` (volo attraverso i livelli), `RevealObserver`, `MotionPrefs`
- Reduced-motion, senza JavaScript e schermi bassi (< 560 px di altezza): versione statica, stesso contenuto, solo CSS.
