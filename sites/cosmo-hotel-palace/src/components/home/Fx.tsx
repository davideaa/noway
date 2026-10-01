"use client";

/*
 * Componenti degli effetti di scroll (hook in lib/motion-fx.ts, criterio per non animare incluso).
 *
 *   <Reveal>       il contenuto compare (opacità + 12 px) quando entra in vista. `i` = sfalsamento (0-5).
 *   <LineReveal>   titolo h2/h3 che si rivela per riga. Il testo vero resta nel DOM, letto per intero.
 *   <CountUp>      numero che sale da 0 al valore, una volta, quando è visibile. Il valore finale è già
 *                  nell'HTML e c'è una copia per i lettori di schermo; la parte che sale è aria-hidden.
 */

import { useRef, type ComponentType, type CSSProperties, type ReactNode, type Ref } from "react";
import { useCountUp, useLineSplit, useReveal } from "@/lib/motion-fx";

/** Un tag HTML qualsiasi che accetta ref, className, style e figli. */
type TagProps = { ref?: Ref<HTMLElement>; className?: string; style?: CSSProperties; id?: string; children?: ReactNode };

type TagBlocco = "div" | "p" | "li" | "section" | "article" | "ul" | "ol" | "figure" | "span" | "dl";

export function Reveal({
  as = "div",
  i = 0,
  className,
  style,
  children,
}: {
  as?: TagBlocco;
  i?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  const Tag = as as unknown as ComponentType<TagProps>;
  return (
    <Tag
      ref={ref}
      className={className ? `fx-reveal ${className}` : "fx-reveal"}
      style={i ? ({ ...style, "--i": i } as CSSProperties) : style}
    >
      {children}
    </Tag>
  );
}

/** Titolo (h2/h3) che si rivela per riga. Solo testo semplice: lo spezza in parole. */
export function LineReveal({
  as = "h2",
  className,
  id,
  children,
}: {
  as?: "h2" | "h3";
  className?: string;
  id?: string;
  children: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useLineSplit(ref);
  const parole = children.split(" ");
  const Tag = as as unknown as ComponentType<TagProps>;
  return (
    <Tag ref={ref} id={id} className={className ? `fx-lines ${className}` : "fx-lines"}>
      {parole.map((p, k) => (
        <span key={k}>
          <span className="fx-w">
            <span>{p}</span>
          </span>
          {k < parole.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

/**
 * Numero che sale. `a` = valore finale; `prefisso`/`suffisso` restano fissi (es. «oltre » e « m²»).
 * `ritardo` in ms per sfalsare più contatori vicini (60 ms l'uno).
 */
export function CountUp({
  a,
  prefisso,
  suffisso,
  ritardo = 0,
  className,
}: {
  a: number;
  prefisso?: string;
  suffisso?: string;
  ritardo?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, a, { ritardo });
  const cifre = String(a).length;
  return (
    <span className={className}>
      <span className="sr-only">
        {prefisso}
        {a}
        {suffisso}
      </span>
      <span aria-hidden="true">
        {prefisso}
        {/* larghezza riservata: le cifre sono tabulari, il numero non sposta nulla mentre sale */}
        <span ref={ref} className="fx-count" style={{ minInlineSize: `${cifre}ch` }}>
          {a}
        </span>
        {suffisso}
      </span>
    </span>
  );
}
