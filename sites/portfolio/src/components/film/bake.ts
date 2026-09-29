/**
 * Il bake della figura, fuori dal thread principale dove si puo':
 *  1. Web Worker (fan.worker.ts) con trasferimento dei buffer;
 *  2. altrimenti a FETTE sul thread principale: il generatore di plate.ts
 *     avanza per <= 8 ms a fotogramma (requestIdleCallback se c'e', se no rAF).
 * Parte appena si sa che il film si fara' (Film.tsx), in parallelo al
 * download del chunk di three: quando il canvas monta, spesso e' gia' pronto.
 * I tempi finiscono in `boot` (quality.ts) per la diagnostica.
 */
import { buildFanSteps, type Fan, type FanParams } from "./plate";
import { boot, type Profile } from "./quality";

const SLICE_MS = 8;

/** La figura: 11 unita' di altezza (fino a 22 di larghezza, 6 di profondita'). */
export const FIG_H = 11;
export const FIG_D = 6;

/** Parametri del bake dal livello di qualita' e dall'aspetto: piu' stretta su schermo verticale. */
export function fanParams(profile: Profile, aspect: number): FanParams {
  const width = Math.min(22, Math.max(10, FIG_H * aspect * 1.4));
  return { count: profile.beads, curves: profile.curves, width, height: FIG_H, depth: FIG_D };
}

let pending: Promise<Fan> | null = null;

/**
 * UNA figura per pagina: la prima chiamata (Film.tsx, appena si sa che il film
 * si fara') decide i parametri; le successive (il canvas, quando monta)
 * ricevono la stessa promessa.
 */
export function bakeFan(params: FanParams): Promise<Fan> {
  if (pending) return pending;
  const t0 = performance.now();
  boot.set("bake", 0.15);
  pending = bakeInWorker(params)
    .then((r) => {
      boot.bakeWhere = "worker";
      boot.bakeMs = performance.now() - t0;
      boot.set("bake", 0.55);
      return r;
    })
    .catch(() =>
      bakeInSlices(params).then((fan) => {
        boot.bakeWhere = "main";
        boot.bakeMs = performance.now() - t0;
        boot.set("bake", 0.55);
        return fan;
      }),
    );
  return pending;
}

function bakeInWorker(params: FanParams): Promise<Fan> {
  return new Promise((resolve, reject) => {
    if (typeof Worker === "undefined") return reject(new Error("no Worker"));
    let w: Worker;
    try {
      w = new Worker(new URL("./fan.worker.ts", import.meta.url));
    } catch (e) {
      return reject(e);
    }
    const done = (fn: () => void) => {
      w.terminate();
      fn();
    };
    // se il worker non risponde (chunk non servito, CSP): si ripiega senza aspettare per sempre
    const timer = window.setTimeout(() => done(() => reject(new Error("worker timeout"))), 6000);
    w.onmessage = (e: MessageEvent<{ fan: Fan; ms: number }>) => {
      window.clearTimeout(timer);
      done(() => resolve(e.data.fan));
    };
    w.onerror = (e) => {
      window.clearTimeout(timer);
      done(() => reject(e));
    };
    w.postMessage(params);
  });
}

type IdleWin = Window & { requestIdleCallback?: (cb: (d: { timeRemaining: () => number }) => void, o?: { timeout: number }) => number };

function bakeInSlices(params: FanParams): Promise<Fan> {
  const gen = buildFanSteps(params);
  const win = window as IdleWin;
  return new Promise((resolve) => {
    const step = () => {
      const t0 = performance.now();
      for (;;) {
        const r = gen.next();
        if (r.done) return resolve(r.value);
        boot.set("bake", 0.15 + 0.4 * r.value);
        if (performance.now() - t0 >= SLICE_MS) break;
      }
      if (win.requestIdleCallback) win.requestIdleCallback(step, { timeout: 50 });
      else requestAnimationFrame(step);
    };
    step();
  });
}
