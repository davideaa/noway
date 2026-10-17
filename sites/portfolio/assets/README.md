# Kit di brand — Portfolio Algo Manager (nome provvisorio)

Tutto è SVG scritto a mano, con `viewBox`, senza dipendenze. I colori seguono `DESIGN.md` (sezione 4):
dove ha senso sono variabili CSS con ripiego esadecimale (`var(--acc, #c8fa72)`), così dentro il sito
seguono il `:root` di `globals.css` e fuori dal sito (in un `<img>`, in una mail) restano giusti da soli.
Le icone usano `currentColor`.

## Cosa c'è, dove

### `logo/` — marchio

Due concept diversi, entrambi ispirati alle tre barre inclinate del riferimento (tre elementi, slancio)
ma con un'altra geometria: nessuna barra, nessuno skew copiato.

| File | Cosa è |
|---|---|
| `confronto-concept.svg` | tavola con i due concept grande e piccolo, per decidere. Non va nel sito |
| **B — Profondità (consigliato)** | tre traiettorie che si assottigliano convergendo verso un punto in alto a destra. Tre strategie, un portafoglio; ed è la stessa idea del grafico 3D "Profondità" e dell'entrata lungo Z del sito. È un segno pieno, quindi regge bene anche a 16 px |
| `b-profondita-colore.svg` | 32×32, lime che sfuma verso `--acc-mid` in lontananza (la profondità), fondo trasparente |
| `b-profondita-mono.svg` | 32×32, `currentColor`: si colora dal contesto (in `--ink`, in `--mut`, nel colore di una strategia) |
| `b-profondita-su-scuro.svg` | 64×64, lime su quadrato `--surf` raggio 14 |
| `b-profondita-su-chiaro.svg` | 64×64, verde quasi nero (`--acc-ink`) su carta chiara. Su chiaro il lime non si vede: **mai lime su bianco** |
| `b-lockup-su-scuro.svg`, `b-lockup-su-chiaro.svg` | 360×64, marchio + nome + riga mono. Il testo è testo vivo (vedi limiti) |
| **A — Plateau** | una linea che sale e si appiattisce, sopra una base sottile: «si cerca un plateau, non un picco». Onesto e leggibile, ma legge come un grafico e somiglia a un'icona più che a un marchio |
| `a-plateau-colore.svg`, `a-plateau-mono.svg`, `a-plateau-su-scuro.svg` | stesse regole di B |

Uso nel sito: nel rail va `b-profondita-mono.svg` inline con `color: var(--acc)` (voce attiva) o `var(--mut)`.
Area libera intorno al marchio: almeno lo spessore della traiettoria più grossa (4,4 unità su 32, cioè ~14%).
Dimensione minima: 16 px, ma sotto i 24 px usare la geometria della favicon (meno convergenza), non quella a 32.

### `icons/` — 8 icone di sezione

24×24, tratto 1,6, capi e giunzioni tondi, `fill="none"`, `stroke="currentColor"`, `aria-hidden="true"`
(stesse regole di lucide-react a 1,6 previste da `DESIGN.md` sezione 10, quindi si mischiano senza stacco).

| File | Sezione | Segno |
|---|---|---|
| `metodo.svg` | Metodo | lista di criteri, tutti spuntati |
| `strategie.svg` | Strategie | tre nodi che convergono in uno (stesso concetto del marchio) |
| `rischio.svg` | Rischio | curva con un picco e la caduta, e una parentesi che ne misura l'altezza (il drawdown) |
| `monitor.svg` | Monitoraggio | schermo con la curva |
| `contatti.svg` | Contatti | busta |
| `avviso.svg` | Avviso | triangolo con punto esclamativo |
| `scartate.svg` | Scartate | curva interrotta da una croce, sopra la riga di base |
| `oro.svg` | Oro / XAUUSD | lingotto |

Accessibilità: le icone sono decorative (`aria-hidden`). Se un'icona compare senza testo accanto, va aggiunto
un `aria-label` sull'elemento che la contiene. Il colore non basta mai da solo (regola di `DESIGN.md`).

### `../public/` — file serviti dal sito

| File | Cosa è | Come usarlo |
|---|---|---|
| `favicon.svg` | 16×16, geometria semplificata (cunei più grossi, meno convergenza), quadrato `--surf` raggio 3,5. **Colori fissi**, niente variabili: i browser non le risolvono nelle favicon | `icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] }` nei `metadata` |
| `icon.svg` | 64×64, marchio completo su quadrato, per 32 px in su (segnalibri, PWA) | `icons.icon` con `sizes: "any"` |
| `apple-touch-icon.png` | 180×180, render di `icon.svg` | `icons.apple` |
| `og.svg` | 1200×630, marchio, eyebrow, nome provvisorio, sottotitolo sobrio, due righe di piede. Nessun numero di rendimento | sorgente |
| `og.png` | 1200×630, **render provvisorio** di `og.svg` (vedi limiti) | `openGraph.images` — i social non accettano SVG |

Nota per chi cura `src/`: c'è ancora `src/app/favicon.ico` di Next; finché esiste, i browser lo prendono
prima di `public/favicon.svg`. Va rimosso o sostituito (non l'ho toccato: fuori dal mio perimetro).

## Cosa ho verificato

- Tutti i 22 SVG aperti in Chromium (Playwright globale, browser in `/opt/pw-browsers`): nessun `parsererror`,
  nessun errore in console, dimensioni di rendering uguali al `viewBox`.
- Favicon a **16 px reali** su barra chiara e scura: le tre traiettorie restano distinte. A 16 px la geometria a 32
  (`icon.svg`) si impasta: per questo esistono due file.
- Icone a 24 px in `--mut` e a 48 px in lime, marchi a 32/64/128, mono in `--ink` e in `--st-oro`, OG a grandezza naturale.
- Contrasti: sono quelli di `DESIGN.md` (lime su `--surf` 15,18:1; `--acc-ink` su `#f1f4ee` ≈ 14:1 come `--acc` su `--acc-ink`).

## Cosa NON ho potuto fare

- **Font**: Manrope e IBM Plex Mono non sono installate in questo ambiente e non ho un file di font da cui
  ricavare i tracciati. Nei lockup e in `og.svg` il testo è `<text>` con ripiego (`Manrope, system-ui` /
  `'IBM Plex Mono', monospace`): dove Manrope c'è, viene usata; dove manca, si vede il carattere di sistema.
  `og.png` è stato renderizzato con DejaVu Sans: **va rigenerato** quando le font sono disponibili
  (o generato da Next con `opengraph-image.tsx` usando `og.svg` come guida). Il marchio è tracciato puro: quello è definitivo.
- **Niente foto, niente immagini generate**: Unsplash, Adobe, Canva, Figma e generatori non erano collegati e non li ho usati.
  Coerente con `DESIGN.md` (sezione 10: niente foto stock né illustrazioni figurative).
- **AVIF/WebP**: non servono, tutto è vettoriale; le uniche raster sono `og.png` e `apple-touch-icon.png`, richieste così dai social e da iOS.
- **Nome**: "Portfolio Algo Manager" è provvisorio (`COPY.md`). Il marchio non contiene lettere, quindi sopravvive a un cambio di nome; i lockup e l'OG vanno aggiornati.
- Le versioni **su chiaro** esistono per completezza (mail, documenti): il sito è solo scuro.
