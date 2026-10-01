"use client";

/*
 * Scena 4 — Il Cosmo a 2 km da Milano (UX 4.3, MOTION 6.4, DECISIONI 8).
 * Diagramma verso Milano (RouteMap), non una mappa: nessun tempo, nessuna distanza, nessun terzo.
 * Mentre la scena attraversa lo schermo (p da 0 a 1) il tracciato si disegna e il tram 31 corre da
 * una tappa all'altra; la tappa attuale si evidenzia nell'elenco con numero pieno e peso del testo,
 * non solo con il colore. L'elenco numerato delle cinque tappe è SEMPRE in pagina e le tappe si
 * possono toccare (la pagina scorre fino a quel punto).
 *
 * Movimento ridotto e senza JavaScript: percorso già disegnato, tappa 1 attiva, tutte le tappe visibili.
 *
 * Il tracciato si muove scrivendo attributi SVG (dash e transform) sull'illustrazione di
 * components/art/RouteMap, che resta sua: qui si leggono solo i suoi aggancio (`data-route`,
 * `data-stop`, `data-route-tram`).
 */

import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { RouteMap } from "@/components/art/RouteMap";
import { Button } from "@/components/ui/button";
import { copy } from "@/content/copy";
import { copyHome } from "@/content/copy-home";
import { clamp01, getPrefersReducedMotion } from "@/lib/motion";
import { useScrollDraw } from "@/lib/motion-fx";
import { LineReveal, Reveal } from "./Fx";
import s from "./route.module.css";
import h from "./home.module.css";

/** Posizione di ogni tappa nel disegno (360 × 580): è la stessa tabella di RouteMap. */
const STOP: ReadonlyArray<readonly [number, number]> = [
  [130, 100],
  [130, 178],
  [160, 262],
  [200, 352],
  [222, 486],
];

/** Con quale frazione dello scroll della scena il tram arriva in fondo: l'ultimo tratto resta fermo a Milano. */
const FINE_CORSA = 0.9;

type Modello = {
  tram: SVGPathElement;
  metro: SVGPathElement;
  metroBase: SVGPathElement | null;
  marker: SVGGElement | null;
  stops: (SVGGElement | null)[];
  /** punti lungo il percorso (x, y) e lunghezza cumulata */
  pts: [number, number][];
  cum: number[];
  tot: number;
  /** posizione s (0..1) di ogni tappa */
  sStop: number[];
  /** intervalli di s in cui si disegnano il tram e la metro */
  tramS: [number, number];
  metroS: [number, number];
};

function costruisciModello(box: HTMLElement): Modello | null {
  const tram = box.querySelector<SVGPathElement>('[data-route="tram"]');
  const metro = box.querySelector<SVGPathElement>('[data-route="metro"]');
  if (!tram || !metro) return null;
  const pts: [number, number][] = [
    [STOP[0][0], STOP[0][1]],
    [130, 124],
  ];
  const iTram0 = pts.length;
  const campiona = (p: SVGPathElement, n: number) => {
    const L = p.getTotalLength();
    for (let i = 0; i <= n; i++) {
      const q = p.getPointAtLength((L * i) / n);
      pts.push([q.x, q.y]);
    }
  };
  campiona(tram, 40);
  const iTram1 = pts.length - 1;
  const iMetro0 = pts.length;
  campiona(metro, 20);
  const iMetro1 = pts.length - 1;
  pts.push([STOP[4][0], STOP[4][1]]);

  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const tot = cum[cum.length - 1];
  const sStop = STOP.map(([x, y]) => {
    let mi = 0;
    let md = Infinity;
    pts.forEach(([px, py], i) => {
      const d = Math.hypot(px - x, py - y);
      if (d < md) {
        md = d;
        mi = i;
      }
    });
    return cum[mi] / tot;
  });
  return {
    tram,
    metro,
    metroBase: metro.previousElementSibling instanceof SVGPathElement ? metro.previousElementSibling : null,
    marker: box.querySelector<SVGGElement>("[data-route-tram]"),
    stops: STOP.map((_, i) => box.querySelector<SVGGElement>(`[data-stop="${i + 1}"]`)),
    pts,
    cum,
    tot,
    sStop,
    tramS: [cum[iTram0] / tot, cum[iTram1] / tot],
    metroS: [cum[iMetro0] / tot, cum[iMetro1] / tot],
  };
}

function puntoA(m: Modello, s: number): [number, number] {
  const L = clamp01(s) * m.tot;
  let lo = 0;
  let hi = m.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (m.cum[mid] <= L) lo = mid;
    else hi = mid;
  }
  const span = m.cum[hi] - m.cum[lo] || 1;
  const t = (L - m.cum[lo]) / span;
  return [m.pts[lo][0] + (m.pts[hi][0] - m.pts[lo][0]) * t, m.pts[lo][1] + (m.pts[hi][1] - m.pts[lo][1]) * t];
}

/** Scrive tracciato, tram e tappe per una posizione s sul percorso. `disegno` = quanto è disegnato (0..1 di s). */
function applica(m: Modello, s: number, disegno: number) {
  const tratto = (p: SVGPathElement | null, [a, b]: [number, number]) => {
    if (!p) return;
    const f = clamp01((disegno - a) / (b - a));
    // pathLength=1 (RouteMap): una sola «matita» lunga 1 seguita da un vuoto di 2
    p.style.strokeDasharray = "1 2";
    p.style.strokeDashoffset = String(1 - f);
  };
  tratto(m.tram, m.tramS);
  tratto(m.metro, m.metroS);
  tratto(m.metroBase, m.metroS);
  if (m.marker) {
    const [x, y] = puntoA(m, s);
    m.marker.setAttribute("transform", `translate(${(x - 15).toFixed(1)} ${(y - 12).toFixed(1)})`);
  }
  m.stops.forEach((g, i) => {
    if (g) g.style.opacity = s >= m.sStop[i] - 0.004 ? "1" : "0.35";
  });
}

function tappaDa(m: Modello, s: number): number {
  let t = 0;
  m.sStop.forEach((v, i) => {
    if (s >= v - 0.004) t = i;
  });
  return t + 1;
}

export function RouteScene() {
  const grid = useRef<HTMLDivElement>(null);
  const mappa = useRef<HTMLDivElement>(null);
  const modello = useRef<Modello | null>(null);
  const stato = useRef({ s: 0, disegno: 1, scroll: false });
  const [attiva, setAttiva] = useState(1);
  const passi = copy.comeArrivare.percorso.passi;

  // il modello si costruisce dopo ogni disegno di RouteMap (React riscrive il transform del tram)
  useLayoutEffect(() => {
    if (!mappa.current) return;
    modello.current ??= costruisciModello(mappa.current);
    const m = modello.current;
    if (m && stato.current.scroll) applica(m, stato.current.s, stato.current.disegno);
    else if (m) applica(m, m.sStop[attiva - 1], 1);
  }, [attiva]);

  const suProgresso = useCallback((p: number, scroll: boolean) => {
    const m = modello.current ?? (mappa.current ? (modello.current = costruisciModello(mappa.current)) : null);
    if (!m) return;
    if (!scroll) {
      stato.current = { s: 0, disegno: 1, scroll: false };
      applica(m, 0, 1);
      setAttiva(1);
      return;
    }
    const s = clamp01(p / FINE_CORSA);
    stato.current = { s, disegno: s, scroll: true };
    applica(m, s, s);
    setAttiva(tappaDa(m, s));
  }, []);

  useScrollDraw(grid, { inizio: 0.78, fine: 0.4, property: null, onProgress: suProgresso });

  /** Un tocco su una tappa: la pagina scorre fino al punto in cui il tram ci arriva. */
  const vaiATappa = (i: number) => {
    const m = modello.current;
    if (!m) return;
    if (getPrefersReducedMotion() || !stato.current.scroll) {
      // senza scroll collegato: la tappa si evidenzia e basta
      stato.current = { s: 0, disegno: 1, scroll: false };
      applica(m, m.sStop[i], 1);
      setAttiva(i + 1);
      return;
    }
    const el = grid.current;
    if (!el) return;
    const vh = window.innerHeight;
    const inizio = 0.78;
    const fine = 0.4;
    const p = clamp01(m.sStop[i] * FINE_CORSA + 0.002);
    const h = el.offsetHeight;
    const top = vh * inizio - p * (vh * (inizio - fine) + h);
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - top, behavior: "smooth" });
  };

  return (
    <section id="milano" data-scena="milano" aria-labelledby="milano-titolo" className={s.sezione}>
      <span className={`fx-plx ${h.alone} ${s.alone}`} aria-hidden="true" />
      <div ref={grid} className={`wrap ${s.grid}`}>
        <div className={s.testo}>
          <LineReveal as="h2" id="milano-titolo" className={s.h2}>
            {copy.comeArrivare.percorso.titolo}
          </LineReveal>
          <Reveal as="p" className={`t-lead ${s.corpo}`} i={1}>
            {copy.comeArrivare.percorso.corpo}
          </Reveal>

          <ol className={s.tappe} aria-label={copyHome.percorso.ariaTappe}>
            {passi.map((t, i) => (
              <li key={t} className={s.tappa} data-attiva={i + 1 === attiva ? "1" : undefined}>
                <button
                  type="button"
                  className={s.tappaBtn}
                  aria-current={i + 1 === attiva ? "step" : undefined}
                  onClick={() => vaiATappa(i)}
                >
                  <span className={s.num} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={s.etichetta}>
                    <span className="sr-only">{i + 1}. </span>
                    {t}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <Reveal className={s.piede} i={2}>
            <Button asChild variant="brand" size="md">
              <Link href="/come-arrivare/">{copy.azioni.comeArrivare}</Link>
            </Button>
          </Reveal>
        </div>

        <div className={s.mappa} ref={mappa}>
          <RouteMap
            tono="giorno"
            tappa={attiva as 1 | 2 | 3 | 4 | 5}
            decorativo={false}
            titolo={copy.comeArrivare.percorso.ariaMappa}
          />
        </div>
      </div>
    </section>
  );
}
