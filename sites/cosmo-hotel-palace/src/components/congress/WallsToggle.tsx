"use client";

/*
 * «Dividi la sala» / «Riunisci la sala» (UX 7.2, `aria-pressed`). Solo sulle sale con pareti mobili
 * (Costellazioni 8, Divinità 5): per le altre il pulsante non c'è. Due stati soltanto: unita, oppure
 * divisa in fino a {k} parti uguali, uno schema indicativo. Nessuna capienza per le parti.
 */

import { Chip } from "@/components/ui/chip";
import { copy, fmt } from "@/content/copy";
import { announce } from "@/lib/a11y";
import { useCongresso } from "./CongressState";
import { testi } from "./testi";

const pareti = copy.congressi.configuratore.pareti;

export function WallsToggle() {
  const c = useCongresso();
  const k = c.hall.divisibleInto;
  if (!k) return null;
  return (
    <Chip
      pressed={c.divisa}
      onClick={() => {
        const nuovo = !c.divisa;
        c.setDivisa(nuovo);
        announce(nuovo ? fmt(pareti.annuncio, { k }) : testi.salaUnita);
      }}
    >
      {c.divisa ? pareti.riunisci : pareti.dividi}
    </Chip>
  );
}
