/*
 * Scheda tecnica (UX 5.2): i m² veri in grande, gli ospiti, i letti, gli ambienti, i bagni e la
 * dotazione di COPY, poi i pulsanti. Nessun prezzo, nessuna disponibilità, nessun numero inventato:
 * tutto viene da content/rooms.ts. Server component; il pulsante principale è un componente client.
 * Su desktop sta nella colonna destra e, se lo schermo è abbastanza alto, resta fisso (sticky).
 */
import Link from "next/link";
import { Icon, type IconName } from "@/components/art/Icons";
import { Button } from "@/components/ui/button";
import { repartoById } from "@/content/contacts";
import { copy } from "@/content/copy";
import { roomById } from "@/content/rooms";
import type { RoomId } from "@/content/types";
import { ChooseRoomButton } from "./ChooseRoomButton";
import { testiCamere } from "./testi";
import s from "./rooms.module.css";

/** Il secondo pulsante di ogni camera (COPY 3.3-3.5): scrivere o telefonare all'Ufficio Prenotazioni. */
function ctaSecondaria(tipo: RoomId): string {
  const p = repartoById("prenotazioni");
  if (tipo === "family") {
    // COPY 3.4: email a info@ con oggetto precompilato
    return `mailto:${p.email}?subject=${encodeURIComponent("Richiesta culla/letto extra")}`;
  }
  if (tipo === "suite") return `tel:${p.telHref}`; // «Parla con l'Ufficio Prenotazioni»
  return `mailto:${p.email}`;
}

export function SpecSheet({ tipo, className }: { tipo: RoomId; className?: string }) {
  const r = roomById(tipo);
  const righe = copy.camere.confronto.righe;
  const dati: { id: string; icona: IconName; etichetta: string; valore: string }[] = [
    { id: "ospiti", icona: "persone", etichetta: righe.ospiti, valore: r.confronto.ospiti },
    { id: "letti", icona: "letto", etichetta: righe.letti, valore: r.confronto.letti },
    { id: "ambienti", icona: "divano", etichetta: righe.ambienti, valore: r.confronto.ambienti },
    { id: "bagni", icona: "bagno", etichetta: righe.bagni, valore: r.confronto.bagni },
  ];
  const parti = "mqParti" in r ? (r.mqParti as readonly number[]) : null;
  return (
    <section className={`${s.spec} ${className ?? ""}`} aria-labelledby={`spec-${tipo}`}>
      <h2 id={`spec-${tipo}`} className="t-h3">
        {copy.camere.schedaTecnicaTitolo}
      </h2>

      <p className={`t-num ${s.mq}`}>
        <span className="sr-only">{righe.superficie}: </span>
        {r.mq}
        <span className={s.mqUnita}> m²</span>
        {parti ? <span className={s.mqParti}>{parti.join(" + ")} m²</span> : null}
      </p>

      <dl className={s.dati}>
        {dati.map((d) => (
          <div key={d.id} className={s.dato}>
            <dt>
              <Icon nome={d.icona} size={24} aria-hidden="true" />
              <span>{d.etichetta}</span>
            </dt>
            <dd>{d.valore}</dd>
          </div>
        ))}
      </dl>

      <div className={s.azioni}>
        <ChooseRoomButton tipo={tipo} full>
          {r.cta}
        </ChooseRoomButton>
        <Button asChild variant="outline" full>
          <a href={ctaSecondaria(tipo)}>{r.ctaSecondaria}</a>
        </Button>
      </div>

      <h3 className={s.dotazioniTitolo}>{testiCamere.dotazioni}</h3>
      <ul className={s.dotazioni}>
        {r.dotazioni.map((d) => (
          <li key={d}>
            <Icon nome="spunta" size={20} aria-hidden="true" />
            <span>{d}</span>
          </li>
        ))}
        {r.confronto.extra && tipo === "family" ? (
          <li>
            <Icon nome="spunta" size={20} aria-hidden="true" />
            <span>{r.confronto.extra}</span>
          </li>
        ) : null}
      </ul>

      <Button asChild variant="link" arrow>
        <Link href="/camere/">{copy.camere.vediTreCamere}</Link>
      </Button>
    </section>
  );
}
