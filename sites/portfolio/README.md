# Portfolio Algo Manager — sito vetrina (nome provvisorio)

Home a scroll cinematografico, in italiano. Next.js 16 + Tailwind 4 + shadcn (base-ui) + Framer Motion + ShaderGradient.

## Documenti di progetto

- `DESIGN.md` — token, contrasti, regole di stile (fonte unica dello stile)
- `MOTION.md` — movimento verso l'interno lungo Z, mai dal basso
- `COPY.md` — testi (le righe `> Fonte:` e le note per Davide non vanno mostrate)
- `DA-COMPLETARE.md` — cosa manca prima di pubblicare
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

- `src/app/page.tsx` — compone le scene; `layout.tsx` — font, metadata, barra fissa del rischio, footer
- `src/components/sections/` — una scena per file (Hero, Metodo, Strategie, Scartate, Rischio, Monitoraggio, Contatti, Avviso)
- `src/components/motion/` — `HeroScene` (recede in Z), `HeroBackground` + `ShaderLayer` (shader caricato dopo il primo
  disegno, smontato quando l'hero esce), `StrategyFlythrough` (volo attraverso i livelli), `RevealObserver`, `MotionPrefs`
- Reduced-motion, senza JavaScript e schermi bassi (< 560 px di altezza): versione statica, stesso contenuto, solo CSS.
