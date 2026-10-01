"use client";

/*
 * Confronto fra le camere (UX 5.1, COPY 3.2).
 *  - da 600 px: tabella a tre colonne, intestazioni `scope="col"`, etichette di riga `scope="row"`,
 *    sotto una riga di pulsanti «Cerca {nome}»;
 *  - sotto i 600 px non si scorre di lato: si scelgono due camere (due chip fra tre, di partenza
 *    Classic e Suite) e le righe diventano coppie «etichetta sopra, due valori sotto».
 * Sotto, le piante a scala comune (FloorPlan «confronto»): la Classic è metà della Suite e della
 * Family. Si scrivono solo i m² veri; nessuna quota in metri.
 */
import { useState } from "react";
import { FloorPlan } from "@/components/art/FloorPlan";
import { Chip } from "@/components/ui/chip";
import { copy, fmt } from "@/content/copy";
import { roomById, roomIds } from "@/content/rooms";
import type { RoomId } from "@/content/types";
import { ChooseRoomButton } from "./ChooseRoomButton";
import { testiCamere } from "./testi";
import s from "./rooms.module.css";

const RIGHE = ["superficie", "letti", "ospiti", "ambienti", "bagni", "extra"] as const;
type Riga = (typeof RIGHE)[number];

const valore = (id: RoomId, riga: Riga): string => roomById(id).confronto[riga] ?? "—";

export function Compare({ className }: { className?: string }) {
  const c = copy.camere.confronto;
  // [la scelta meno recente, la più recente]: scegliere una terza camera toglie la meno recente
  const [coppia, setCoppia] = useState<readonly [RoomId, RoomId]>(["classic", "suite"]);
  const scegli = (id: RoomId) => {
    if (coppia.includes(id)) return;
    setCoppia([coppia[1], id]);
  };
  const due = roomIds.filter((id) => coppia.includes(id));

  return (
    <section id="confronto" className={`${s.confronto} ${className ?? ""}`} aria-labelledby="confronto-titolo">
      <h2 id="confronto-titolo" className="t-h2">
        {c.titolo}
      </h2>

      {/* ───── telefono: due camere a scelta ───── */}
      <div className={s.coppie}>
        <p id="scegli-due" className={s.coppieSotto}>
          {c.scegliDue}
        </p>
        <div role="group" aria-labelledby="scegli-due" className={s.coppieChip}>
          {roomIds.map((id) => (
            <Chip key={id} pressed={coppia.includes(id)} onClick={() => scegli(id)}>
              {roomById(id).nomeBreve}
            </Chip>
          ))}
        </div>
        <div className={s.coppieGriglia} role="table" aria-label={c.titolo}>
          <div role="row" className={s.coppieTesta}>
            <span role="columnheader" className="sr-only">
              {testiCamere.caratteristica}
            </span>
            {due.map((id) => (
              <span key={id} role="columnheader" className={s.coppieNome}>
                {roomById(id).nomeBreve}
              </span>
            ))}
          </div>
          {RIGHE.map((riga) => (
            <div key={riga} role="row" className={s.coppieRiga}>
              <span role="rowheader" className={s.coppieEtichetta}>
                {c.righe[riga]}
              </span>
              {due.map((id) => (
                <span key={id} role="cell" className={s.coppieValore}>
                  {valore(id, riga)}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className={s.coppieAzioni}>
          {due.map((id) => (
            <ChooseRoomButton key={id} tipo={id} full>
              {fmt(c.cerca, { nome: roomById(id).nomeBreve })}
            </ChooseRoomButton>
          ))}
        </div>
      </div>

      {/* ───── da 600 px: tabella a tre colonne ───── */}
      <table className={s.tabella}>
        <thead>
          <tr>
            <td>
              <span className="sr-only">{testiCamere.caratteristica}</span>
            </td>
            {roomIds.map((id) => (
              <th key={id} scope="col">
                {roomById(id).nomeBreve}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RIGHE.map((riga) => (
            <tr key={riga}>
              <th scope="row">{c.righe[riga]}</th>
              {roomIds.map((id) => (
                <td key={id}>{valore(id, riga)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            {roomIds.map((id) => (
              <td key={id}>
                <ChooseRoomButton tipo={id} full>
                  {fmt(c.cerca, { nome: roomById(id).nomeBreve })}
                </ChooseRoomButton>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>

      {/* ───── piante a scala comune ───── */}
      <figure className={s.piantaConfronto}>
        <div className={s.piantaConfrontoSvg}>
          <FloorPlan tipo="confronto" decorativo={false} />
        </div>
        <figcaption>{c.proporzioni}</figcaption>
      </figure>
    </section>
  );
}
