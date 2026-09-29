import { TriangleAlert } from "lucide-react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { D, PORT } from "@/lib/dati";
import { it } from "@/lib/format";
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
export function BacktestTag({ children = "Backtest · validato fuori campione" }: { children?: ReactNode }) {
  return <span className="tag">{children}</span>;
}

/**
 * Il rischio sta sempre accanto alla cifra (DESIGN.md sez. 12, regola 1).
 * Numeri da data/strategie.json (drawdown del backtest, perdite consecutive) e
 * da data/derivati.json (90° percentile del bootstrap a blocchi di 20).
 */
export function RiskNote() {
  const o = D.oro, n = D.nasdaq, u = D.usdjpy;
  return (
    <p className="risknote">
      <TriangleAlert size={16} strokeWidth={1.6} aria-hidden />
      <span>
        <b>Rischio accanto:</b> drawdown massimo del backtest, in R, su una sola sequenza: oro{" "}
        <b>{it(o.periodi.tutto.dd_max_R, 1)} R</b> ({o.periodi.tutto.perdite_consecutive_max} perdite di fila), Nasdaq{" "}
        <b>{it(n.periodi.tutto.dd_max_R, 1)} R</b> ({n.periodi.tutto.perdite_consecutive_max}), USDJPY{" "}
        <b>{it(u.periodi.tutto.dd_max_R, 1)} R</b> ({u.periodi.tutto.perdite_consecutive_max}). Con il bootstrap a blocchi di
        20, in una sequenza su dieci il drawdown supera: oro {it(o.bootstrap_dd.p90, 1)} R, Nasdaq {it(n.bootstrap_dd.p90, 1)} R,
        USDJPY {it(u.bootstrap_dd.p90, 1)} R; la somma a pari rischio {it(PORT.bootstrap_dd.p90, 1)} R. A rischio 1% per
        operazione, {it(o.bootstrap_dd.p90, 1)} R vuol dire circa il {it(o.bootstrap_dd.p90, 0)}% dal massimo. Vedi{" "}
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
