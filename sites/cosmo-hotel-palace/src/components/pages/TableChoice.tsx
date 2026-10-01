/*
 * «Prenota un tavolo» (UX 4.3 scena 5, COPY 6): un pulsante che apre due scelte da 48 px, telefono ed
 * email. Non c'è prenotazione online dei tavoli finché il cliente non la conferma. È una disclosure
 * nativa (<details>): funziona anche senza JavaScript e dice «aperto/chiuso» ai lettori di schermo.
 * Server component.
 */
import { buttonVariants } from "@/components/ui/button";
import { IconChevronDown } from "@/components/ui/icons";
import { Icon } from "@/components/art/Icons";
import { repartoById } from "@/content/contacts";
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";
import s from "./pages.module.css";

export function TableChoice({ className }: { className?: string }) {
  const r = repartoById("ristorante");
  return (
    <details className={cn("group/tavolo", s.tavolo, className)}>
      <summary
        className={cn(
          buttonVariants({ variant: "brand", size: "md" }),
          "cursor-pointer list-none [&::-webkit-details-marker]:hidden [&::marker]:hidden",
        )}
        data-focus-ring="double"
      >
        {copy.ristorazione.prenotaTavolo}
        <IconChevronDown size={20} className="transition-transform duration-(--d-micro) group-open/tavolo:rotate-180" />
      </summary>
      <div className={s.tavoloScelte}>
        <a className={cn(buttonVariants({ variant: "outline", size: "md" }), "justify-start")} href={`tel:${r.telHref}`}>
          <Icon nome="telefono" size={22} />
          {copy.ristorazione.chiama}
        </a>
        <a className={cn(buttonVariants({ variant: "outline", size: "md" }), "justify-start")} href={`mailto:${r.email}`}>
          <Icon nome="email" size={22} />
          {copy.ristorazione.scrivi}
        </a>
      </div>
    </details>
  );
}
