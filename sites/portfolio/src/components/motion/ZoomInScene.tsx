"use client";

/**
 * PROTOTIPO - una sola scena "zoom verso l'interno".
 * La camera avanza lungo l'asse Z: tre livelli (le strategie) e alcune cornici
 * a tunnel vengono incontro, restano a fuoco un momento, poi passano oltre la camera.
 * Si animano solo transform (translateZ) e opacity. Niente translateY.
 *
 * prefers-reduced-motion: la scena animata viene nascosta via CSS (motion-reduce:hidden)
 * e compare una lista statica. Cosi non c'e' lampeggio di idratazione.
 */
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

type Layer = { id: string; nome: string; nota: string; colore: string };

const LAYERS: Layer[] = [
  { id: "01", nome: "Oro", nota: "XAUUSD", colore: "#e5b966" },
  { id: "02", nome: "Nasdaq", nota: "NAS100", colore: "#72baff" },
  { id: "03", nome: "USDJPY", nota: "USDJPY", colore: "#b59aff" },
];

const N = LAYERS.length;
const SPACING = 900; // distanza in px tra un livello e il successivo, lungo Z
const TRAVEL = SPACING * N; // 2700 px // quanta strada fa la camera in tutto lo scroll
const FRAMES = 7; // cornici del tunnel (solo bordi: costo quasi nullo)
const FRAME_SPACING = 520;

// Il livello i e' a fuoco (z = 0) quando progress = FOCUS_START + i * FOCUS_STEP.
// Il primo livello arriva dopo l'intro, cosi' i due non si sovrappongono.
const FOCUS_START = 0.22;
const FOCUS_STEP = 0.27;

/** z del livello i: 0 = a fuoco. La camera avanza con `progress`. */
function useLayerZ(progress: MotionValue<number>, i: number) {
  return useTransform(progress, (p) => (p - (FOCUS_START + i * FOCUS_STEP)) * TRAVEL);
}

/** interpolazione lineare a tratti (come useTransform con array, ma su piu' valori) */
function piecewise(x: number, xs: number[], ys: number[]) {
  if (x <= xs[0]) return ys[0];
  for (let k = 1; k < xs.length; k++) {
    if (x <= xs[k]) return ys[k - 1] + ((x - xs[k - 1]) / (xs[k] - xs[k - 1])) * (ys[k] - ys[k - 1]);
  }
  return ys[ys.length - 1];
}

function StrategyLayer({
  layer,
  i,
  progress,
}: {
  layer: Layer;
  i: number;
  progress: MotionValue<number>;
}) {
  const z = useLayerZ(progress, i);
  // lontano: quasi invisibile; a fuoco: pieno; oltre la camera: sparisce prima di z = perspective
  // il fattore "avvio" tiene i livelli spenti mentre c'e' ancora l'intro
  const opacity = useTransform([z, progress], ([zz, p]: number[]) => {
    const start = piecewise(p, [0, 0.1], [0, 1]);
    return start * piecewise(zz, [-1700, -900, -180, 180, 620], [0, 0.22, 1, 1, 0]);
  });
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center will-change-transform"
      style={{ z, opacity }}
    >
      <div
        className="w-[min(86vw,520px)] border bg-[#10151a]/90 p-6 font-mono"
        style={{ borderColor: layer.colore + "66" }}
      >
        <div className="flex items-center justify-between text-xs text-[#939fa9]">
          <span>LIVELLO {layer.id}</span>
          <span>{layer.nota}</span>
        </div>
        <h2
          className="mt-6 text-5xl font-medium tracking-tight sm:text-6xl"
          style={{ color: layer.colore }}
        >
          {layer.nome}
        </h2>
        <div className="mt-6 h-px w-full" style={{ background: layer.colore + "55" }} />
        <p className="mt-3 text-xs text-[#939fa9]">Prototipo: nessun dato reale qui.</p>
      </div>
    </motion.div>
  );
}

function TunnelFrame({ i, progress }: { i: number; progress: MotionValue<number> }) {
  // cornice j a distanza fissa davanti alla camera che si sposta con lo scroll
  const z = useTransform(progress, (p) => {
    const raw = i * FRAME_SPACING - p * TRAVEL * 1.0;
    // ricicla: le cornici che passano la camera ricompaiono in fondo
    const span = FRAMES * FRAME_SPACING;
    return -(((raw % span) + span) % span) + 500;
  });
  const opacity = useTransform(z, [-2600, -1400, 0, 350, 520], [0, 0.18, 0.28, 0.1, 0]);
  return (
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 border border-[#c8fa72]/40 will-change-transform"
      style={{ z, opacity }}
    />
  );
}

export function ZoomInScene() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);
  // il titolo iniziale si allontana verso il fondo della scena (indietro in Z), non verso il basso
  const introZ = useTransform(scrollYProgress, [0, 0.12], [0, -700]);
  const introOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  return (
    <>
      {/* Versione animata: nascosta se l'utente chiede meno movimento */}
      <div ref={ref} className="relative h-[420svh] motion-reduce:hidden">
        <div className="sticky top-0 h-svh overflow-hidden bg-[#080b0e]">
          <div
            className="absolute inset-0"
            style={{ perspective: "1000px", perspectiveOrigin: "50% 50%" }}
          >
            {/* preserve-3d non serve: ogni figlio e' un piano indipendente */}
            {Array.from({ length: FRAMES }, (_, k) => (
              <TunnelFrame key={k} i={k} progress={scrollYProgress} />
            ))}
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center will-change-transform"
              style={{ z: introZ, opacity: introOpacity }}
            >
              <p className="font-mono text-xs tracking-[0.3em] text-[#c8fa72]">ENTRA NEL PORTAFOGLIO</p>
              <p className="max-w-sm px-6 text-sm text-[#939fa9]">Scorri: la camera avanza, non scende.</p>
            </motion.div>
            {LAYERS.map((l, i) => (
              <StrategyLayer key={l.id} layer={l} i={i} progress={scrollYProgress} />
            ))}
          </div>
          {/* barra di avanzamento: scaleX, origine a sinistra */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-[#c8fa72]"
            style={{ scaleX: bar }}
          />
        </div>
      </div>

      {/* Versione statica per prefers-reduced-motion */}
      <div className="hidden bg-[#080b0e] px-4 py-16 motion-reduce:block">
        <p className="mb-8 text-center font-mono text-xs tracking-[0.3em] text-[#c8fa72]">
          ENTRA NEL PORTAFOGLIO
        </p>
        <div className="mx-auto flex max-w-[520px] flex-col gap-6">
          {LAYERS.map((l) => (
            <div key={l.id} className="border bg-[#10151a] p-6 font-mono" style={{ borderColor: l.colore + "66" }}>
              <div className="flex justify-between text-xs text-[#939fa9]">
                <span>LIVELLO {l.id}</span>
                <span>{l.nota}</span>
              </div>
              <h2 className="mt-4 text-4xl font-medium" style={{ color: l.colore }}>
                {l.nome}
              </h2>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
