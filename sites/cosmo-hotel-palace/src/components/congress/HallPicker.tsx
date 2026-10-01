"use client";

/*
 * Passo 1 · «Scegli la sala» (UX 7.2). L'elenco è un gruppo di radio NATIVI (frecce da tastiera già
 * corrette), una riga da 56 px per sala: nome, «{m²} m² · {dimensioni} m», «fino a {n}», e l'etichetta
 * «Divisibile» solo sulle due sale che hanno le pareti mobili. Sopra, due gruppi di chip: filtro per
 * piano (Tutte · Piano terra · Piano inferiore) e ordine (Capienza · Superficie).
 *
 * Se la sala scelta esce dal filtro resta scelta e compare fissata in cima («Sala scelta: …»): il
 * filtro non cambia mai la scelta. Nessun conteggio di sale (DECISIONI 7).
 *
 * Su telefono lo stesso elenco sta in un foglio (`<Sheet>`), aperto da `HallPickerTrigger`.
 */

import { useId, useRef, useState } from "react";
import { ChipGroup } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { IconChevronDown } from "@/components/ui/icons";
import { copy, fmt } from "@/content/copy";
import type { CongressHall } from "@/content/types";
import { capienzaMassima, saleOrdinate, type FiltroPiano, type Ordine } from "@/lib/congress/availability";
import { useCongresso } from "./CongressState";
import { misureSala, testi } from "./testi";
import s from "./congress.module.css";

const cfg = copy.congressi.configuratore;

const FILTRI = [
  { value: "tutte", label: cfg.filtri.tutte },
  { value: "0", label: cfg.filtri.piano0 },
  { value: "-1", label: cfg.filtri.pianoMeno1 },
];
const ORDINI = [
  { value: "capienza", label: cfg.ordina.capienza },
  { value: "superficie", label: cfg.ordina.superficie },
];

const filtroDaValore = (v: string): FiltroPiano => (v === "0" ? 0 : v === "-1" ? -1 : "tutte");
const valoreDaFiltro = (f: FiltroPiano): string => String(f);

function Riga({
  hall,
  gruppo,
  scelta,
  onScegli,
  fissata,
}: {
  hall: CongressHall;
  gruppo: string;
  scelta: boolean;
  onScegli: (id: string) => void;
  fissata?: boolean;
}) {
  const id = `${gruppo}-${hall.id}`;
  return (
    <div className={s.rigaSala} data-fissata={fissata ? "1" : undefined}>
      <input
        id={id}
        type="radio"
        name={gruppo}
        value={hall.id}
        checked={scelta}
        onChange={() => onScegli(hall.id)}
        className={s.rigaRadio}
      />
      <label htmlFor={id} className={s.rigaLabel}>
        <span className={s.rigaTesto}>
          <span className={s.rigaNome}>{hall.name}</span>
          <span className={s.rigaMeta}>{fmt(testi.elenco.misure, { mq: hall.areaM2, dims: misureSala(hall) })}</span>
        </span>
        <span className={s.rigaDestra}>
          <span className={s.rigaCap}>{fmt(testi.elenco.finoA, { n: capienzaMassima(hall) })}</span>
          {hall.divisibleInto ? <span className={s.etichetta}>{cfg.divisibile}</span> : null}
        </span>
      </label>
    </div>
  );
}

/** L'elenco con filtri e ordine. `onScelta` serve al foglio del telefono (si chiude scegliendo). */
export function HallPicker({ onScelta, idPrefix }: { onScelta?: () => void; idPrefix: string }) {
  const c = useCongresso();
  const titoloId = useId();
  const gruppo = `${idPrefix}-sala`;
  const sale = saleOrdinate({ piano: c.stato.filtro, ordine: c.stato.ordine as Ordine });
  const dentro = sale.some((h) => h.id === c.hall.id);

  const scegli = (id: string) => {
    c.scegliSala(id);
    onScelta?.();
  };

  return (
    <div className={s.picker}>
      <div className={s.pickerControlli}>
        <ChipGroup
          aria-label={cfg.passi.sala}
          options={FILTRI}
          value={valoreDaFiltro(c.stato.filtro)}
          onValueChange={(v) => c.setFiltro(filtroDaValore(v))}
        />
        <div className={s.ordina}>
          <span className={s.ordinaEtichetta} id={titoloId}>
            {cfg.ordina.etichetta}
          </span>
          <ChipGroup
            aria-labelledby={titoloId}
            options={ORDINI}
            value={c.stato.ordine}
            onValueChange={(v) => c.setOrdine(v as Ordine)}
          />
        </div>
      </div>
      <p className={s.elencoTitolo}>{cfg.elencoTitolo}</p>
      <div className={s.elenco} role="radiogroup" aria-label={testi.elenco.ariaGruppo}>
        {!dentro && (
          <>
            <p className={s.fissataTitolo}>{fmt(cfg.salaScelta, { sala: c.hall.name })}</p>
            <Riga hall={c.hall} gruppo={gruppo} scelta onScegli={scegli} fissata />
          </>
        )}
        {sale.map((h) => (
          <Riga key={h.id} hall={h} gruppo={gruppo} scelta={h.id === c.hall.id} onScegli={scegli} />
        ))}
      </div>
      <p className={s.notaPiccola}>{cfg.risultato.notaMisure}</p>
    </div>
  );
}

/** Telefono: pulsante con la sala corrente che apre il foglio con l'elenco. */
export function HallPickerTrigger() {
  const c = useCongresso();
  const [aperto, setAperto] = useState(false);
  const rif = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={rif}
        type="button"
        className={s.trigger}
        aria-haspopup="dialog"
        aria-expanded={aperto}
        onClick={() => setAperto(true)}
      >
        <span className={s.triggerTesto}>
          <span className={s.triggerAzione}>{cfg.pulsanti.cambiaSala}</span>
          <span className={s.triggerNome}>{c.hall.name}</span>
          <span className={s.rigaMeta}>{fmt(testi.elenco.misure, { mq: c.hall.areaM2, dims: misureSala(c.hall) })}</span>
        </span>
        <IconChevronDown size={24} />
      </button>
      <Sheet
        open={aperto}
        onOpenChange={setAperto}
        title={cfg.passi.sala}
        closeLabel={testi.elenco.chiudi}
        returnFocusRef={rif}
      >
        <HallPicker idPrefix="foglio" onScelta={() => setAperto(false)} />
      </Sheet>
    </>
  );
}
