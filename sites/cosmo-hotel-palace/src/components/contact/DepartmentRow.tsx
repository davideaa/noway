/*
 * Un reparto (UX 8 `/contatti/`, COPY 10): nome, «per cosa», telefono ed email scritti, e due pulsanti da
 * 48 px, «Chiama» (`tel:`) e «Scrivi» (`mailto:`), con gli aria-label di COPY («Chiama {reparto} al
 * {numero}», «Scrivi a {reparto}: {email}»). Nessun orario degli uffici (DA CONFERMARE).
 * Server component: i link sono link veri, funzionano senza JavaScript.
 */
import { Icon } from "@/components/art/Icons";
import { Button } from "@/components/ui/button";
import type { Reparto } from "@/content/contacts";
import { copy, fmt } from "@/content/copy";
import { copyPagine } from "@/content/copy-pagine";
import s from "./contact.module.css";

type Props = {
  reparto: Reparto;
  /** Livello del titolo (default 3: sotto un h2 «I reparti»). */
  titolo?: "h2" | "h3";
  className?: string;
};

export function DepartmentRow({ reparto: r, titolo: Titolo = "h3", className }: Props) {
  return (
    <article className={`${s.reparto} ${className ?? ""}`} data-reparto={r.id}>
      <Titolo className={s.nome}>{r.nome}</Titolo>
      <p className={s.perCosa}>{r.perCosa}</p>
      <dl className={s.recapiti}>
        <div>
          <dt>
            <Icon nome="telefono" size={20} />
            <span className="sr-only">{copyPagine.contatti.telefono}</span>
          </dt>
          <dd>{r.telefono}</dd>
        </div>
        <div>
          <dt>
            <Icon nome="email" size={20} />
            <span className="sr-only">{copyPagine.contatti.email}</span>
          </dt>
          <dd>{r.email}</dd>
        </div>
      </dl>
      <div className={s.azioni}>
        <Button asChild variant="brand" size="md">
          <a href={`tel:${r.telHref}`} aria-label={fmt(copy.contatti.ariaChiama, { reparto: r.nome, numero: r.telefono })}>
            {copy.contatti.chiama}
          </a>
        </Button>
        <Button asChild variant="outline" size="md">
          <a href={`mailto:${r.email}`} aria-label={fmt(copy.contatti.ariaScrivi, { reparto: r.nome, email: r.email })}>
            {copy.contatti.scrivi}
          </a>
        </Button>
      </div>
    </article>
  );
}
