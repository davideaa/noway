"use client";

/**
 * Le due strategie come livelli messi uno dietro l'altro lungo Z: la camera
 * avanza con lo scroll, ogni livello arriva da lontano, resta fermo a fuoco
 * (plateau di lettura), poi passa oltre la camera. Nessun translateY, nessuno
 * scroll catturato: la pagina scorre normalmente, il movimento e' legato alla
 * posizione. Si animano solo transform (translateZ) e opacity.
 *
 * Origine: prototipo ZoomInScene (MOTION.md, atto 1), adattato a 2 livelli e
 * con un plateau di lettura per il testo.
 * Versione statica (reduced-motion, senza JS, schermi bassi): solo CSS in
 * globals.css, stesso DOM, livelli uno sotto l'altro.
 */
import { useScroll, useTransform, type MotionValue } from "framer-motion";
import { motion as m } from "framer-motion";
import { Children, useRef, type ReactNode } from "react";
import { useMotionPrefs } from "./MotionPrefs";

const FRAMES_FULL = 7;
const FRAMES_LITE = 3; // "modo lite": meno cornici
const FRAME_SPAN = 3640; // profondita' totale del tunnel
const FRAME_TRAVEL = 3400; // quanta strada fanno le cornici in tutto lo scroll

const FOCUS_START = 0.25; // progresso a cui il livello 0 e' a fuoco
const FOCUS_STEP = 0.45; // distanza (in progresso) tra due livelli (QA B1: le finestre non si toccano)
const PLATEAU = 0.12; // mezza ampiezza del plateau di lettura (z quasi fermo)

/** interpolazione lineare a tratti */
function piecewise(x: number, xs: number[], ys: number[]) {
  if (x <= xs[0]) return ys[0];
  for (let k = 1; k < xs.length; k++) {
    if (x <= xs[k]) return ys[k - 1] + ((x - xs[k - 1]) / (xs[k] - xs[k - 1])) * (ys[k] - ys[k - 1]);
  }
  return ys[ys.length - 1];
}

/** z del livello i in funzione del progresso: lento nel plateau, veloce fuori */
function layerZ(p: number, i: number) {
  const d = p - (FOCUS_START + i * FOCUS_STEP);
  return piecewise(d, [-0.5, -PLATEAU, PLATEAU, 0.5], [-1700, -40, 40, 1100]);
}

function Layer({ i, progress, children }: { i: number; progress: MotionValue<number>; children: ReactNode }) {
  const z = useTransform(progress, (p) => layerZ(p, i));
  const opacity = useTransform(progress, (p) => {
    const start = piecewise(p, [0, 0.1], [0, 1]); // i livelli restano spenti all'inizio
    // QA B1: il livello uscente (z > 0, davanti alla camera) deve essere a zero prima che
    // l'entrante superi ~0,2, altrimenti i due testi si intrecciano (preserve-3d lo disegna sopra).
    return start * piecewise(layerZ(p, i), [-1700, -700, -220, 80, 200], [0, 0, 1, 1, 0]);
  });
  return (
    <m.div className="zlayer" style={{ z, opacity }}>
      {children}
    </m.div>
  );
}

function Frame({ i, count, progress }: { i: number; count: number; progress: MotionValue<number> }) {
  const z = useTransform(progress, (p) => {
    const raw = (i * FRAME_SPAN) / count - p * FRAME_TRAVEL;
    return -(((raw % FRAME_SPAN) + FRAME_SPAN) % FRAME_SPAN) + 500;
  });
  const opacity = useTransform(z, [-2600, -1400, 0, 350, 520], [0, 0.18, 0.28, 0.1, 0]);
  return <m.div aria-hidden="true" className="zframe" style={{ z, opacity }} />;
}

export function StrategyFlythrough({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { lite } = useMotionPrefs();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const items = Children.toArray(children);
  const frames = lite ? FRAMES_LITE : FRAMES_FULL;

  return (
    <div ref={ref} className="zscene" role="group" aria-label={label}>
      <div className="zstage">
        <div className="zpersp">
          {Array.from({ length: frames }, (_, k) => (
            <Frame key={k} i={k} count={frames} progress={scrollYProgress} />
          ))}
          {items.map((node, i) => (
            <Layer key={i} i={i} progress={scrollYProgress}>
              {node}
            </Layer>
          ))}
        </div>
        <m.div aria-hidden="true" className="zbar" style={{ scaleX: scrollYProgress }} />
      </div>
    </div>
  );
}
