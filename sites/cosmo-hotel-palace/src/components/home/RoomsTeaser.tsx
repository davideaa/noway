"use client";

/*
 * Scena 3 — Camere (UX 4.3, DESIGN 4.5). Tre schede ad arco con tre forme diverse: Classic arco
 * stretto e alto, Suite arco largo, Family due archi affiancati. Dentro, il poster della camera
 * (PosterRoom). Le schede sono link alle pagine delle camere. Sopra, un consigliere compatto
 * «Chi viaggia?»: la scelta evidenzia la scheda consigliata (anello verde + spunta + testo, mai
 * solo colore) e sul telefono la porta al centro del binario.
 *
 * «Per lavoro» (interruttore della hero) parte con «Lavoro» già scelto: la Suite.
 * Senza JavaScript: le schede sono link con il poster e i dati veri; il consigliere non c'è e
 * compare il link «Vedi le tre camere».
 */

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { PosterRoom } from "@/components/art/PosterRoom";
import { Icon } from "@/components/art/Icons";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { announce } from "@/lib/a11y";
import { copy, fmt } from "@/content/copy";
import { copyHome } from "@/content/copy-home";
import { consigliere, consigliereOrdine, roomById, type ChiViaggia } from "@/content/rooms";
import type { RoomId } from "@/content/types";
import { getPrefersReducedMotion } from "@/lib/motion";
import { LineReveal, Reveal } from "./Fx";
import { useModoViaggio } from "./ModeToggle";
import s from "./rooms.module.css";
import h from "./home.module.css";

/** Ordine sulla pagina: Classic (3 colonne), Suite (5), Family (4). */
const ORDINE: readonly RoomId[] = ["classic", "suite", "family"];

/** Geometria dei poster (stessi valori di PosterRoom): serve all'anello di evidenza. */
const GEO: Record<RoomId, { w: number; h: number; archi: 1 | 2 }> = {
  classic: { w: 360, h: 440, archi: 1 },
  suite: { w: 760, h: 440, archi: 1 },
  family: { w: 760, h: 440, archi: 2 },
};
const GAP_FAMILY = 40;

/** Il contorno degli archi (stessa forma del ritaglio del poster) per l'anello della scheda consigliata. */
function AnelloArco({ tipo }: { tipo: RoomId }) {
  const { w, h, archi } = GEO[tipo];
  const gap = archi === 2 ? GAP_FAMILY : 0;
  const aw = (w - gap * (archi - 1)) / archi;
  const r = aw / 2;
  const d = Array.from({ length: archi }, (_, i) => {
    const x = i * (aw + gap);
    return `M${x} ${h}V${r}A${r} ${r} 0 0 1 ${x + aw} ${r}V${h}`;
  }).join("");
  return (
    <svg className={s.anello} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function SchedaCamera({ id, consigliata }: { id: RoomId; consigliata: boolean }) {
  const r = roomById(id);
  const { w, h } = GEO[id];
  return (
    <article className={s.scheda} data-camera={id} data-consigliata={consigliata ? "1" : undefined}>
      <div className={s.arcoCella}>
        <p className={s.consigliata} aria-hidden={consigliata ? undefined : true} data-on={consigliata ? "1" : "0"}>
          <Icon nome="spunta" size={18} />
          {copy.camere.consigliataPerTe}
        </p>
        <div className={s.arco} style={{ aspectRatio: `${w} / ${h}` }}>
          <PosterRoom tipo={id} arco decorativo={false} />
          <AnelloArco tipo={id} />
        </div>
      </div>

      <div className={s.info}>
        <h3 className={s.nome}>{r.nome}</h3>
        <p className={s.mq}>
          <span className={s.mqNum}>{r.mq}</span> m²
        </p>
        <ul className={s.dati}>
          <li>
            <Icon nome="letto" size={24} />
            <span>
              <span className="sr-only">{copyHome.camere.datoLetti}: </span>
              {r.confronto.letti}
            </span>
          </li>
          <li>
            <Icon nome="persone" size={24} />
            <span>
              <span className="sr-only">{copyHome.camere.datoOspiti}: </span>
              {r.confronto.ospiti}
            </span>
          </li>
          <li>
            <Icon nome="bagno" size={24} />
            <span>
              <span className="sr-only">{copyHome.camere.datoBagni}: </span>
              {r.confronto.bagni}
            </span>
          </li>
        </ul>
        {/* un solo link per scheda: il suo ::after copre tutta la scheda (poster compreso) */}
        <Button asChild variant="brand" size="md" className={s.vai}>
          <Link href={`/camere/${r.slug}/`} className={s.stira}>
            {copy.camere.esploraCamera}
            <span className="sr-only">: {r.nome}</span>
          </Link>
        </Button>
      </div>
    </article>
  );
}

const nessunAbbonamento = () => () => {};

export function RoomsTeaser() {
  const modo = useModoViaggio();
  const [scelta, setScelta] = useState<ChiViaggia | null>(null);
  const binario = useRef<HTMLDivElement>(null);
  // il consigliere esiste solo con JavaScript (UX 4.3): lato server e durante l'idratazione non si rende
  const attivo = useSyncExternalStore(nessunAbbonamento, () => true, () => false);

  // «Per lavoro» parte con «Lavoro» già scelto; una scelta dell'utente vale più del modo
  const effettiva: ChiViaggia | null = scelta ?? (modo === "lavoro" ? "lavoro" : null);
  const consiglio = effettiva ? consigliere[effettiva] : null;
  const risposta = effettiva ? copy.camere.consigliere.risposte[effettiva] : null;

  const scegli = (v: string) => {
    const k = v as ChiViaggia;
    setScelta(k);
    const camera = consigliere[k].camera;
    const r = copy.camere.consigliere.risposte[k];
    announce(`${copy.camere.consigliataPerTe}: ${r.camera} ${r.testo}`);
    // sul telefono la scheda consigliata va al centro del binario
    const el = binario.current?.querySelector<HTMLElement>(`[data-camera="${camera}"]`);
    el?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: getPrefersReducedMotion() ? "instant" : "smooth",
    });
  };

  return (
    <section id="camere" data-scena="camere" aria-labelledby="camere-titolo" className={s.sezione}>
      <span className={`fx-plx ${h.alone} ${s.alone}`} aria-hidden="true" />
      <div className="wrap">
        <header className={s.testa}>
          <LineReveal as="h2" id="camere-titolo" className={s.h2}>
            {copy.camere.h1}
          </LineReveal>
          <Reveal as="p" className={`t-lead ${s.sotto}`} i={1}>
            {copy.camere.sottotitolo}
          </Reveal>
        </header>

        <div className={s.consigliere}>
          {attivo ? (
            <>
              <div className={s.consigliereRiga}>
                <p id="chi-viaggia" className={s.consigliereTitolo}>
                  {copy.camere.consigliere.titolo}
                </p>
                <ChipGroup
                  aria-labelledby="chi-viaggia"
                  value={effettiva ?? ""}
                  onValueChange={scegli}
                  options={consigliereOrdine.map((k) => ({
                    value: k,
                    label: copy.camere.consigliere.opzioni[k],
                  }))}
                />
              </div>
              <div className={s.risposta} aria-live="polite">
                {risposta && consiglio ? (
                  <p>
                    <strong>
                      {copy.camere.consigliataPerTe}: {risposta.camera}
                    </strong>{" "}
                    {risposta.testo}{" "}
                    <Link className={s.vediLink} href={`/camere/${roomById(consiglio.camera).slug}/`}>
                      {fmt(copy.camere.consigliere.vedi, { camera: roomById(consiglio.camera).nome })}
                    </Link>
                    <span className={s.chiusura}> {copy.camere.consigliere.chiusura}</span>
                  </p>
                ) : (
                  <p className={s.chiusura}>{copy.camere.consigliere.sottotitolo}</p>
                )}
              </div>
            </>
          ) : null}
          <noscript>
            <Button asChild variant="outline" size="md">
              <Link href="/camere/">{copy.camere.vediTreCamere}</Link>
            </Button>
          </noscript>
        </div>
      </div>

      <div
        ref={binario}
        className={`wrap ${s.binarioWrap}`}
        role="region"
        aria-label={copyHome.camere.ariaBinario}
        tabIndex={0}
      >
        <div className={s.binario}>
          {ORDINE.map((id) => (
            <SchedaCamera key={id} id={id} consigliata={consiglio?.camera === id} />
          ))}
        </div>
      </div>

      <div className="wrap">
        <Reveal className={s.piede}>
          <Button asChild variant="outline" size="md">
            <Link href="/camere/">{copy.azioni.vediCamere}</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
