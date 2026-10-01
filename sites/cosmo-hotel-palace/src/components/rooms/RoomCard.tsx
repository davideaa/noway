"use client";

/*
 * Schede camera dell'hub (DESIGN 4.5, UX 5.1): tre tipi, tre forme. La Classic è un arco stretto e
 * alto, la Suite un arco largo, la Family due archi affiancati (le due camere comunicanti). Poster
 * SVG, nome in --t-h3, m² in --t-num e tre dati veri (ospiti, letti, bagni) con icona. L'intera
 * scheda è un link (il pulsante «Esplora la camera» si estende sull'area). Niente ombra, niente prezzo.
 * La scheda scelta dal consigliere ha il bordo da 2 px, la spunta e «Consigliata per te».
 * Telefono: binario con aggancio, la scheda successiva spunta per il 12%.
 */
import Link from "next/link";
import { Icon } from "@/components/art/Icons";
import { PosterRoom } from "@/components/art/PosterRoom";
import { Button } from "@/components/ui/button";
import { copy } from "@/content/copy";
import { roomById, roomIds } from "@/content/rooms";
import type { RoomId } from "@/content/types";
import { useConsigliata } from "./Advisor";
import s from "./rooms.module.css";

export function RoomCard({ tipo }: { tipo: RoomId }) {
  const r = roomById(tipo);
  const consigliata = useConsigliata() === tipo;
  const parti = "mqParti" in r ? (r.mqParti as readonly number[]) : null;
  const titoloId = `scheda-${tipo}`;
  return (
    <article className={s.scheda} data-tipo={tipo} data-consigliata={consigliata ? "1" : "0"} aria-labelledby={titoloId}>
      <div className={s.schedaPoster}>
        <PosterRoom tipo={tipo} arco decorativo={false} />
      </div>
      <div className={s.schedaCorpo}>
        <p className={s.schedaBadge} data-visibile={consigliata ? "1" : "0"}>
          {consigliata ? (
            <>
              <Icon nome="spunta" size={20} aria-hidden="true" />
              <span>{copy.camere.consigliataPerTe}</span>
            </>
          ) : null}
        </p>
        <h3 id={titoloId} className="t-h3">
          {r.nome}
        </h3>
        <p className={`t-num ${s.mq}`}>
          {r.mq}
          <span className={s.mqUnita}> m²</span>
          {parti ? <span className={s.mqParti}>{parti.join(" + ")} m²</span> : null}
        </p>
        <ul className={s.schedaDati}>
          <li>
            <Icon nome="persone" size={24} aria-hidden="true" />
            <span>{r.confronto.ospiti}</span>
          </li>
          <li>
            <Icon nome="letto" size={24} aria-hidden="true" />
            <span>{r.confronto.letti}</span>
          </li>
          <li>
            <Icon nome="bagno" size={24} aria-hidden="true" />
            <span>{r.confronto.bagni}</span>
          </li>
        </ul>
        <Button asChild variant="brand" className={s.schedaLink}>
          <Link href={`/camere/${r.slug}/`}>
            {copy.camere.esploraCamera}
            <span className="sr-only">: {r.nome}</span>
          </Link>
        </Button>
      </div>
    </article>
  );
}

/** Le tre schede: binario sul telefono, griglia 3 + 5 + 4 colonne dal desktop (UX 10). */
export function RoomCards({ className }: { className?: string }) {
  return (
    <ul className={`${s.schede} ${className ?? ""}`}>
      {roomIds.map((id) => (
        <li key={id} className={s.schedaVoce} data-tipo={id}>
          <RoomCard tipo={id} />
        </li>
      ))}
    </ul>
  );
}
