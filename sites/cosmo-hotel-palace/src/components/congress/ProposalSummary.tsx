"use client";

/*
 * Scheda sopra il modulo (UX 7.3): «La tua configurazione: {sala} · {disposizione} · fino a {n}
 * persone.» e il link «Modifica» che riporta al configuratore. «Usa questa configurazione» sposta qui
 * il focus (`#richiesta-riepilogo`), così chi usa la tastiera o un lettore di schermo sa dov'è arrivato.
 * Con la sala divisa non si scrive nessuna capienza.
 */

import { copy, fmt } from "@/content/copy";
import { etichettaDisposizione } from "@/lib/congress/availability";
import { useCongresso } from "./CongressState";
import { testi } from "./testi";
import s from "./congress.module.css";

export function ProposalSummary() {
  const c = useCongresso();
  const k = c.hall.divisibleInto;
  const testo =
    c.divisa && k
      ? fmt(testi.riepilogoDivisa, { sala: c.hall.name, k })
      : fmt(copy.congressi.modulo.riepilogoConfigurazione, {
          sala: c.hall.name,
          disposizione: etichettaDisposizione(c.disposizione),
          n: c.capienza,
        });
  return (
    <div className={s.riepilogo}>
      <p id="richiesta-riepilogo" tabIndex={-1} className={s.riepilogoTesto}>
        {testo}
      </p>
      <a
        href="#configura"
        className={s.riepilogoModifica}
        onClick={(e) => {
          e.preventDefault();
          c.scorriA("configura", { focus: "configura-titolo" });
        }}
      >
        {copy.congressi.modulo.modifica}
      </a>
    </div>
  );
}
