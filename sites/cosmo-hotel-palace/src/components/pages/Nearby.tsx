"use client";

/*
 * «Nei dintorni» (COPY 5, BRIEF): i luoghi da vedere, raggruppati Milano · Monza · Como, con il filtro
 * `Tutto · Milano · Monza · Como` (UX 8 / COPY 5; aria-label `Filtra i luoghi per zona: {zona}`).
 * Nessuna distanza e nessun tempo (COPY: DA CONFERMARE), nessun link (sono riferimenti, non offerte).
 * Senza JavaScript: tutti i gruppi visibili e i filtri nascosti (SoloJs). Il filtro non anima il layout
 * (MOTION 6.5: niente FLIP): i gruppi fuori filtro spariscono, gli altri restano.
 * Il cambio di filtro si annuncia ai lettori di schermo una volta.
 */

import { useState } from "react";
import { ChipGroup } from "@/components/ui/chip";
import { copyPagine } from "@/content/copy-pagine";
import { fmt } from "@/content/copy";
import { dintorni, type ZonaId } from "@/content/dintorni";
import { announce } from "@/lib/a11y";
import { SoloJs } from "./SoloJs";
import s from "./nearby.module.css";

type Filtro = "tutto" | ZonaId;
const t = copyPagine.comeArrivare.dintorni;

export function Nearby() {
  const [filtro, setFiltro] = useState<Filtro>("tutto");

  const opzioni = (["tutto", "milano", "monza", "como"] as const).map((v) => ({
    value: v,
    label: t.filtri[v],
    ariaLabel: fmt(t.ariaFiltro, { zona: t.filtri[v] }),
  }));

  const cambia = (v: string) => {
    const f = v as Filtro;
    setFiltro(f);
    const n = dintorni.filter((z) => f === "tutto" || z.id === f).reduce((tot, z) => tot + z.luoghi.length, 0);
    announce(fmt(t.annuncio, { zona: t.filtri[f], n }));
  };

  return (
    <div className={s.nearby}>
      <SoloJs>
        <ChipGroup
          options={opzioni}
          value={filtro}
          onValueChange={cambia}
          aria-label={t.ariaGruppo}
          className={s.filtri}
        />
      </SoloJs>

      <div className={s.gruppi} data-filtro={filtro}>
        {dintorni.map((z) => (
          <section key={z.id} className={s.gruppo} hidden={filtro !== "tutto" && filtro !== z.id} aria-labelledby={`zona-${z.id}`}>
            <h3 id={`zona-${z.id}`} className={s.zona}>
              {z.titolo}
            </h3>
            <ul className={s.luoghi}>
              {z.luoghi.map((l) => (
                <li key={l.nome} className={s.luogo}>
                  <p className={s.nome}>{l.nome}</p>
                  <p className={s.testo}>{l.testo}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
