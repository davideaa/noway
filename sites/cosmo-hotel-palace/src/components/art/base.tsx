/**
 * Base comune dei poster e delle illustrazioni (modulo 6).
 * Server Component, nessun JS. Colori SOLO via var() dei token (tokens.css).
 *
 * Come funziona il tono: ogni poster dichiara una tavolozza per «giorno» e una per «sera»,
 * cioè un elenco di variabili locali (--w, --f, …) che puntano ai token. La tavolozza scelta
 * è scritta come `style` sull'<svg>; le forme la leggono con le classi di art.css (class="w"
 * = fill var(--w)) o con stroke="var(--w)". Il tono è una prop, non dipende dal contesto:
 * serve per il crossfade (due poster sovrapposti) e per il poster «sera» della sezione Grill.
 */
import { useId, type ReactNode } from "react";
import type { Tono } from "@/content/types";
import "./art.css";

export type { Tono };

export type ArtProps = {
  /** Luce del poster. Default: giorno. */
  tono?: Tono;
  /**
   * true (default): immagine decorativa, nascosta ai lettori di schermo, nessun <title>.
   * false: ha <title> e aria-labelledby (il testo è `titolo`, o l'alt di default del poster).
   */
  decorativo?: boolean;
  /** Testo alternativo; vale solo con decorativo={false}. */
  titolo?: string;
  className?: string;
  /** Ritaglia il poster in un arco (il segno del sito). Default: false, ci pensa la cornice. */
  arco?: boolean;
};

export type Palette = Record<string, string>;
export type Tavolozze = Record<Tono, Palette>;

type Props = Pick<ArtProps, "decorativo" | "titolo" | "className" | "arco"> & {
  w: number;
  h: number;
  tono: Tono;
  tavolozze: Tavolozze;
  /** Alt di default se decorativo={false} e `titolo` manca. */
  alt: string;
  /** Numero di archi (con `arco`): 2 per i due archi affiancati della Family. */
  archi?: number;
  /** Spazio fra gli archi, in unità del viewBox. */
  gap?: number;
  /** `slice` (default): se la cornice ha un altro rapporto, ritaglia invece di lasciare bande. */
  fit?: "slice" | "meet";
  /** Funzione che riceve l'id univoco (per gradienti e <use>) e restituisce le forme. */
  children: (id: string) => ReactNode;
};

/** Cerchio di luce: unico gradiente ammesso (DESIGN 6 «macchia di luce»). */
export function Alone({ id, cx, cy, r, op = 1 }: { id: string; cx: number; cy: number; r: number; op?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={`url(#${id}h)`} opacity={op} />;
}

export function ArtSvg({ w, h, tono, tavolozze, alt, decorativo = true, titolo, className, arco, archi = 1, gap = 0, fit = "slice", children }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const tid = `${uid}title`;
  const a11y = decorativo
    ? ({ "aria-hidden": true, focusable: "false" } as const)
    : ({ role: "img", "aria-labelledby": tid } as const);
  const aw = (w - gap * (archi - 1)) / archi; // larghezza di un arco
  const r = aw / 2;
  const vars = Object.fromEntries(Object.entries(tavolozze[tono]).map(([k, val]) => [`--${k}`, val])) as React.CSSProperties;
  const archPath = Array.from({ length: archi }, (_, i) => {
    const x = i * (aw + gap);
    return `M${x} ${h}V${r}A${r} ${r} 0 0 1 ${x + aw} ${r}V${h}Z`;
  }).join("");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      preserveAspectRatio={`xMidYMid ${fit}`}
      className={className ? `art ${className}` : "art"}
      style={{ width: "100%", height: "auto", ...vars }}
      {...a11y}
    >
      {!decorativo && <title id={tid}>{titolo ?? alt}</title>}
      <defs>
        {/* alone: miele-300 → trasparente. In sera il centro è più caldo. */}
        <radialGradient id={`${uid}h`}>
          <stop offset="0" stopColor="var(--miele-300)" stopOpacity={tono === "sera" ? 0.75 : 0.5} />
          <stop offset="1" stopColor="var(--miele-300)" stopOpacity="0" />
        </radialGradient>
        {arco && (
          <clipPath id={`${uid}a`}>
            <path d={archPath} />
          </clipPath>
        )}
      </defs>
      <g clipPath={arco ? `url(#${uid}a)` : undefined}>{children(uid)}</g>
    </svg>
  );
}

