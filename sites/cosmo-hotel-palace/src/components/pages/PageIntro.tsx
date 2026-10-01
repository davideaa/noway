/*
 * Intestazione di pagina (modulo 14): eyebrow, UN solo h1, sottotitolo, poi quello che serve
 * (badge, pulsanti). Server component. L'h1 è sempre il primo elemento grande caricato (UX 4.1, 13).
 */
import type { ReactNode } from "react";
import s from "./pages.module.css";

type Props = {
  eyebrow?: string;
  titolo: string;
  /** Sottotitolo (COPY). */
  lead?: ReactNode;
  className?: string;
  /** Id dell'h1, per `aria-labelledby` della sezione. */
  id?: string;
  /** Subito sotto l'h1 (es. il badge «aperto ora»), prima del sottotitolo. */
  dopoTitolo?: ReactNode;
  children?: ReactNode;
};

export function PageIntro({ eyebrow, titolo, lead, className, id, dopoTitolo, children }: Props) {
  return (
    <header className={`${s.intro} ${className ?? ""}`}>
      {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
      <h1 id={id}>{titolo}</h1>
      {dopoTitolo}
      {lead && <p className={`t-lead ${s.lead}`}>{lead}</p>}
      {children}
    </header>
  );
}
