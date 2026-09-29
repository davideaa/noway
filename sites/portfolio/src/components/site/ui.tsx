import { TriangleAlert } from "lucide-react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Blocco che entra verso l'interno (translateZ + opacity) una volta sola. `i` = ordine tra fratelli (max 5). */
export function Reveal({
  children,
  className,
  i = 0,
  as: Tag = "div",
  variant,
}: {
  children: ReactNode;
  className?: string;
  i?: number;
  as?: ElementType;
  variant?: "scene" | "monitor";
}) {
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

/** Il rischio sta sempre accanto alla cifra (DESIGN.md sez. 12, regola 1). */
export function RiskNote({ level = "0.70" }: { level?: "0.70" | "1.05" }) {
  const t = level === "0.70" ? { r: "0,70%", d90: "26%", d99: "35%" } : { r: "1,05%", d90: "35%", d99: "49%" };
  return (
    <p className="risknote">
      <TriangleAlert size={16} strokeWidth={1.6} aria-hidden />
      <span>
        <b>Rischio accanto:</b> a rischio {t.r} per operazione, nel 90% degli scenari simulati il drawdown resta sotto il{" "}
        {t.d90} (99° percentile: {t.d99}). Vedi{" "}
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
