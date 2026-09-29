import { TriangleAlert } from "lucide-react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Blocco che entra verso l'interno (translateZ + opacity) una volta sola. `i` = ordine tra fratelli (max 5). */
export function Reveal({
  children,
  className,
  i = 0,
  as = "div",
  variant,
}: {
  children: ReactNode;
  className?: string;
  i?: number;
  as?: ElementType;
  variant?: "scene" | "monitor";
}) {
  // @types/react 19.3 da' ai tag "vuoti" children: never, e l'unione di tutti i tag
  // diventa `never`. I tag usati qui (div, section, li, p) accettano tutti
  // className, style e children: si tipizza come "div".
  const Tag = as as "div";
  return (
    <Tag
      className={cn("reveal", variant && `reveal--${variant}`, className)}
      style={{ "--i": i } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Intestazione di scena: eyebrow "NN - ETICHETTA" + h2 su due righe (ink / mut2). */
export function SceneHeader({
  n,
  label,
  id,
  title,
}: {
  n: string;
  label: string;
  id: string;
  title: [string, string?];
}) {
  return (
    <Reveal variant="scene" className="mb-8 md:mb-12">
      <p className="eyebrow">
        <b>{n}</b> &mdash; {label}
      </p>
      <h2 id={id} className="t-scene mt-4 max-w-[22ch] md:max-w-[26ch]">
        <span>{title[0]}</span>
        {title[1] && <span>{title[1]}</span>}
      </h2>
    </Reveal>
  );
}

/** Etichetta su ogni grafico o tabella di risultati (COPY.md, microcopy). */
export function BacktestTag({ children = "Backtest · non è un risultato reale" }: { children?: ReactNode }) {
  return <span className="tag">{children}</span>;
}

/**
 * Il rischio sta sempre accanto alla cifra (DESIGN.md sez. 12, regola 1).
 * Numeri da COPY.md v2 / data/strategie.json: drawdown massimo del backtest in R
 * (una sola sequenza) e perdite consecutive. Il bootstrap sulla misura piu'
 * recente non e' ancora stato fatto: si dice.
 */
export function RiskNote() {
  return (
    <p className="risknote">
      <TriangleAlert size={16} strokeWidth={1.6} aria-hidden />
      <span>
        <b>Rischio accanto:</b> drawdown massimo del backtest, in R, su una sola sequenza: oro{" "}
        <b>27,5 R</b> (14 perdite di fila), Nasdaq <b>13,7 R</b> (7), USDJPY <b>14,0 R</b> (8). A rischio 1% per
        operazione, 27,5 R vuol dire circa il 27% dal massimo. Il drawdown vero, con il bootstrap, sulla misura più
        recente non è ancora stato calcolato. Vedi{" "}
        <a href="#rischio" className="textlink">
          Il rischio
        </a>
        .
      </span>
    </p>
  );
}

/** Tabella larga: scorre di lato dentro il proprio riquadro, mai la pagina. */
export function TableScroll({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <p className="hint-scroll">Scorri di lato per vedere tutte le colonne.</p>
      <div className="tscroll" role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
    </div>
  );
}

/** Termine con spiegazione, raggiungibile anche da tastiera. */
export function Term({ children, tip, id }: { children: ReactNode; tip: string; id: string }) {
  return (
    <span className="term" tabIndex={0} aria-describedby={id}>
      {children}
      <span role="tooltip" id={id}>
        {tip}
      </span>
    </span>
  );
}
