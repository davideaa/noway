"use client";

/*
 * Riga risultato (UX 7.2): «{Sala}, {disposizione}: fino a {n} persone.» con la capienza VERA della
 * tabella, i dati della sala, la nota fissa sulle capienze e, se serve, l'avviso «oltre la capienza»
 * (non blocca). Sulla sala divisa non c'è nessuna capienza: solo il testo di COPY.
 *
 * L'annuncio ai lettori di schermo è uno solo, con 400 ms di attesa (MOTION 5.3), e si fa con
 * `announce()`; il testo visibile non è una regione live, così scrivere i partecipanti cifra per
 * cifra non produce una raffica di letture. Il numero non si anima: cambia di colpo.
 */

import { useEffect, useRef } from "react";
import { Status } from "@/components/ui/status";
import { copy, fmt } from "@/content/copy";
import { announce } from "@/lib/a11y";
import { oltreCapienza } from "@/lib/congress/availability";
import { etichettaMin, datiSala, rigaRisultato, testi } from "./testi";
import { useCongresso } from "./CongressState";
import s from "./congress.module.css";

const r = copy.congressi.configuratore;

export function ResultLine() {
  const c = useCongresso();
  const k = c.hall.divisibleInto;
  const divisa = c.divisa && !!k;
  const oltre = !divisa && oltreCapienza(c.hall, c.disposizione, c.ospitiNum);

  const principale = divisa
    ? fmt(r.pareti.risultatoDivisa, { sala: c.hall.name, k: k as number })
    : rigaRisultato(c.hall, c.disposizione, c.capienza);
  const avviso = oltre
    ? fmt(copy.congressi.modulo.errori.ospitiOltreCapienza, {
        n: c.ospitiNum as number,
        disp: etichettaMin(c.disposizione),
        sala: c.hall.name,
      })
    : null;

  // un solo annuncio, 400 ms dopo l'ultimo cambio; non alla prima apertura della pagina
  const primo = useRef(true);
  const nota = c.stato.avviso; // ripiego su Platea o disposizione non indicata (sotto i chip)
  const testoAnnuncio = `${nota ? `${nota} ` : ""}${principale}${avviso ? ` ${avviso}` : ""}`;
  useEffect(() => {
    if (primo.current) {
      primo.current = false;
      return;
    }
    const t = setTimeout(() => announce(testoAnnuncio), 400);
    return () => clearTimeout(t);
  }, [testoAnnuncio]);

  return (
    <div className={s.risultato}>
      <p className={s.risultatoRiga} key={principale}>
        {principale}
      </p>
      <p className={s.risultatoDati}>{datiSala(c.hall)}</p>
      {divisa ? (
        <p className={s.risultatoDati}>{testi.salaDivisaSenzaSedie}</p>
      ) : (
        k && <p className={s.risultatoDati}>{fmt(r.risultato.divisibile, { k })}</p>
      )}
      {avviso && (
        <Status tone="neutral" role="none" className={s.avvisoOltre}>
          <p>{avviso}</p>
        </Status>
      )}
      <p className={s.notaPiccola}>
        {r.risultato.notaMisure} {r.risultato.notaCapienze}
      </p>
    </div>
  );
}
