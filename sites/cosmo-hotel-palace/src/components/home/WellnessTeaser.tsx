"use client";

/*
 * Scena 6 — Wellness (UX 4.3, MOTION 6.3, DECISIONI 3). Illustrazione SVG isometrica del sesto
 * piano (PosterWellness): nessun canvas. Il percorso è in tre tappe (sauna, bagno turco, sala
 * attrezzi), lungo un filo che si disegna con lo scroll; la tappa che passa dal centro dello
 * schermo si evidenzia nell'elenco (numero pieno + peso, mai solo colore) e il suo segnaposto si
 * accende sull'illustrazione. L'indicatore «aperto ora» (7:00–22:00, ora di Roma) si calcola dopo
 * il caricamento: nell'HTML c'è il testo fisso «Aperto tutti i giorni dalle 7:00 alle 22:00».
 *
 * Movimento ridotto e senza JavaScript: filo già disegnato, tutte le tappe leggibili, nessuna
 * animazione; la tappa 1 è quella evidenziata.
 */

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PosterWellness } from "@/components/art/PosterWellness";
import { Button } from "@/components/ui/button";
import { copy } from "@/content/copy";
import { copyHome } from "@/content/copy-home";
import { openStatus, type OpenState } from "@/lib/rome-time";
import { useScrollDraw } from "@/lib/motion-fx";
import { LineReveal, Reveal } from "./Fx";
import s from "./wellness.module.css";
import h from "./home.module.css";

/** Posizione dei tre segnaposto sull'illustrazione (viewBox 800 × 560, isometrica di PosterWellness). */
const SEGNAPOSTO = [
  { x: 322, y: 184 }, // sauna finlandese
  { x: 432, y: 248 }, // bagno turco
  { x: 549, y: 319 }, // sala attrezzi (tapis roulant)
] as const;

/* ───────────── «Aperto ora» ───────────── */

/** Si riaccende quando lo stato può cambiare (lib/rome-time: al massimo ogni 30 minuti). */
function sottoscriviOrario(avvisa: () => void) {
  let t: ReturnType<typeof setTimeout>;
  const arma = () => {
    t = setTimeout(() => {
      avvisa();
      arma();
    }, openStatus().msToNextChange);
  };
  arma();
  return () => clearTimeout(t);
}
const statoOra = (): OpenState => openStatus().state;
const statoServer = (): OpenState | null => null;

function testoStato(st: OpenState | null): string {
  const a = copy.wellness.aperto;
  switch (st) {
    case "aperto":
      return a.aperto;
    case "chiude-presto":
      return a.ultimaOra;
    case "chiuso-apre-oggi":
      return a.chiusoPrima;
    case "chiuso-riapre-domani":
      return a.chiusoDopo;
    default:
      return copy.wellness.orarioFisso; // nell'HTML statico: nessuna dipendenza dall'orologio
  }
}

function ApertoOra() {
  const st = useSyncExternalStore(sottoscriviOrario, statoOra, statoServer);
  const aperto = st === "aperto" || st === "chiude-presto";
  return (
    <div className={s.stato}>
      <p className={s.badge} data-stato={st ?? "fisso"}>
        <span className={s.punto} aria-hidden="true" data-aperto={aperto ? "1" : "0"} />
        {/* key: il testo cambia con una dissolvenza breve, solo se cambia lo stato */}
        <span key={st ?? "fisso"} className={s.badgeTesto}>
          {testoStato(st)}
        </span>
      </p>
      <p className={s.badgeNota}>{copy.wellness.aperto.nota}</p>
    </div>
  );
}

/* ───────────── Scena ───────────── */

export function WellnessTeaser() {
  const lista = useRef<HTMLOListElement>(null);
  const filo = useRef<HTMLDivElement>(null);
  const [attiva, setAttiva] = useState(0);
  const tappe = copy.wellness.tappe;

  useScrollDraw(filo, { inizio: 0.85, fine: 0.45 });

  // la tappa che attraversa la fascia centrale dello schermo è quella attiva
  useEffect(() => {
    const el = lista.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (voci) => {
        for (const v of voci) {
          if (v.isIntersecting) setAttiva(Number((v.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    el.querySelectorAll("[data-i]").forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, []);

  return (
    <section id="wellness" data-scena="wellness" aria-labelledby="wellness-titolo" className={s.sezione}>
      <span className={`fx-plx ${h.alone} ${s.alone}`} aria-hidden="true" />
      <div className={`wrap ${s.grid}`}>
        <header className={s.testa}>
          <LineReveal as="h2" id="wellness-titolo" className={s.h2}>
            {copy.wellness.h1}
          </LineReveal>
          <Reveal as="p" className={`t-lead ${s.intro}`} i={1}>
            {copyHome.wellness.intro}
          </Reveal>
          <Reveal i={2}>
            <ApertoOra />
          </Reveal>
        </header>

        <figure className={s.figura}>
          <div className={s.arco}>
            <PosterWellness decorativo={false} titolo={copy.wellness.ariaIllustrazione} />
            {/* segnaposto: seguono la tappa attiva; sono illustrazione, la voce vera è nell'elenco */}
            <div className={s.segnaposti} aria-hidden="true">
              {SEGNAPOSTO.map((p, i) => (
                <span
                  key={i}
                  className={s.segnaposto}
                  data-attivo={i === attiva ? "1" : "0"}
                  style={{ left: `${(p.x / 800) * 100}%`, top: `${(p.y / 560) * 100}%` }}
                >
                  <span className={s.segnapostoNum}>{i + 1}</span>
                  <span className={s.segnapostoEtichetta}>{tappe[i].titolo}</span>
                </span>
              ))}
            </div>
          </div>
          <figcaption className={s.nota}>{copy.wellness.nota}</figcaption>
        </figure>

        <div className={s.percorsoBox}>
          <div ref={filo} className={s.percorso}>
            <span className={`fx-thread ${s.filo}`} aria-hidden="true" />
            <ol ref={lista} className={s.tappe} aria-label={copyHome.wellness.ariaPassi}>
              {tappe.map((t, i) => (
                <li key={t.id} data-i={i} className={s.tappa} data-attiva={i === attiva ? "1" : undefined}>
                  <span className={s.nodo} aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className={s.tappaTesto}>
                    <h3 className={s.tappaTitolo}>
                      <span className="sr-only">{i + 1}. </span>
                      {t.titolo}
                    </h3>
                    <p>{t.testo}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Reveal className={s.piede} i={1}>
            <Button asChild variant="brand" size="md">
              <Link href="/wellness/">{copy.wellness.scopri}</Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
