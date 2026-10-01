"use client";

/*
 * Passo 2 · «Scegli la disposizione» (UX 7.2). Quattro chip in un radiogroup, ognuno con la capienza
 * della sala corrente sotto l'etichetta. Dove la tabella ha il trattino la disposizione NON sparisce:
 *  - il chip resta visibile, con trattino al posto del numero, icona di divieto e bordo tratteggiato
 *    (non solo colore);
 *  - è `aria-disabled` e non `disabled`: resta raggiungibile con le frecce e si può spiegare;
 *  - toccarlo non lo sceglie: sotto i chip compare, e viene annunciato, la ragione (COPY 8.2:
 *    «Questa disposizione non è indicata per {sala}. Prova con {disposizioni}.»).
 * Se la disposizione scelta non c'è nella sala scelta dopo, si passa a Platea e si dice (stato).
 * L'aiuto di una riga della disposizione scelta sta sempre sotto i chip.
 */

import { useId, useRef } from "react";
import { IconBan, IconCheck } from "@/components/ui/icons";
import { copy, fmt } from "@/content/copy";
import type { Disposizione } from "@/content/types";
import {
  DISPOSIZIONI,
  disponibilita,
  disposizioniDisponibili,
  elencoEtichette,
  etichettaDisposizione,
} from "@/lib/congress/availability";
import { useCongresso } from "./CongressState";
import { elencoE, testi } from "./testi";
import s from "./congress.module.css";

const cfg = copy.congressi.configuratore;

export function DispositionChips() {
  const c = useCongresso();
  const baseId = useId();
  const rif = useRef<(HTMLButtonElement | null)[]>([]);
  const dispo = DISPOSIZIONI.map((d) => disponibilita(c.hall, d));
  const mancanti = dispo.filter((d) => !d.disponibile);
  const motivoId = `${baseId}-motivo`;
  const avviso = c.stato.avviso;

  // L'avviso (ripiego su Platea, disposizione non indicata) lo annuncia la riga risultato, insieme al
  // resto, con un solo annuncio: due annunci a pochi ms l'uno dall'altro si coprirebbero a vicenda.

  // ragione sempre visibile: una frase sola, anche se le disposizioni mancanti sono due
  const motivoFisso =
    mancanti.length === 0
      ? null
      : mancanti.length === 1
        ? (mancanti[0].motivo as string)
        : fmt(testi.nonIndicatePiu, {
            elenco: elencoE(mancanti.map((m) => etichettaDisposizione(m.disposizione))),
            sala: c.hall.name,
            disposizioni: elencoEtichette(disposizioniDisponibili(c.hall)),
          });

  const sposta = (da: number, passo: 1 | -1 | "inizio" | "fine") => {
    const n = DISPOSIZIONI.length;
    const a = passo === "inizio" ? 0 : passo === "fine" ? n - 1 : (da + passo + n) % n;
    rif.current[a]?.focus();
    const d = DISPOSIZIONI[a];
    if (dispo[a].disponibile) c.scegliDisposizione(d);
    else c.scegliDisposizioneNonIndicata(d);
  };

  const tasto = (e: React.KeyboardEvent, i: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        sposta(i, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        sposta(i, -1);
        break;
      case "Home":
        sposta(i, "inizio");
        break;
      case "End":
        sposta(i, "fine");
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const scelto = DISPOSIZIONI.indexOf(c.disposizione);

  return (
    <div className={s.disposizioni}>
      <div role="radiogroup" aria-label={cfg.passi.disposizione} className={s.chipGriglia}>
        {dispo.map((d, i) => {
          const attivo = d.disposizione === c.disposizione;
          const spento = !d.disponibile;
          return (
            <button
              key={d.disposizione}
              ref={(el) => {
                rif.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={attivo}
              aria-disabled={spento || undefined}
              aria-describedby={spento ? motivoId : undefined}
              tabIndex={i === scelto ? 0 : -1}
              data-state={attivo ? "on" : "off"}
              className={s.chipDisp}
              onClick={() => (spento ? c.scegliDisposizioneNonIndicata(d.disposizione) : c.scegliDisposizione(d.disposizione))}
              onKeyDown={(e) => tasto(e, i)}
            >
              <span className={s.chipDispTesto}>
                <span className={s.chipDispEtichetta}>{etichettaDisposizione(d.disposizione)}</span>
                <span className={s.chipDispCap}>
                  {spento ? testi.nonIndicata : fmt(testi.finoA, { n: d.capienza ?? 0 })}
                </span>
              </span>
              <span className={s.chipDispIcona}>
                {attivo ? <IconCheck size={20} /> : spento ? <IconBan size={20} /> : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* ragione e avvisi: un solo paragrafo, sempre al suo posto */}
      <p id={motivoId} className={s.motivo} data-attivo={avviso ? "1" : undefined}>
        {avviso ?? motivoFisso ?? ""}
      </p>
      <p className={s.aiuto}>{c.divisa ? testi.capienzeSalaUnita : cfg.disposizioni[c.disposizione as Disposizione].aiuto}</p>
    </div>
  );
}
