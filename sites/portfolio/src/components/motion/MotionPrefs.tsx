"use client";

/**
 * Preferenze di movimento condivise: decide quando lo shader dell'hero puo'
 * girare e tiene lo stato del tasto "Pausa animazione".
 *
 * Le soglie qui sotto sono ipotesi (MOTION.md sez. 3, DESIGN.md sez. 11):
 * non sono state tarate su telefoni veri. Si cambiano a tentativi.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/** Telefoni "deboli": sotto queste soglie si usa il fallback statico. */
const WEAK_MAX_CORES = 4;
const WEAK_MAX_MEMORY_GB = 4;
const PHONE_QUERY = "(max-width: 820px) and (pointer: coarse)";

type Prefs = {
  /** true se l'utente ha chiesto meno movimento */
  reduced: boolean;
  /** true su dispositivi da fallback statico (risparmio dati, telefono debole, niente WebGL) */
  lite: boolean;
  /** l'utente ha premuto "Pausa animazione" */
  paused: boolean;
  setPaused: (v: boolean) => void;
  /** lo shader e' sceso sotto ~40 fps: fallback statico e non si riprova */
  slow: boolean;
  reportSlow: () => void;
  /** lo shader puo' girare (non serve che stia girando adesso) */
  canAnimate: boolean;
};

const Ctx = createContext<Prefs>({
  reduced: false,
  lite: true,
  paused: false,
  setPaused: () => {},
  slow: false,
  reportSlow: () => {},
  canAnimate: false,
});

export const useMotionPrefs = () => useContext(Ctx);

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let liteCache: boolean | undefined;
function computeLite(): boolean {
  if (liteCache !== undefined) return liteCache;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  let lite = false;
  if (nav.connection?.saveData) lite = true;
  const phone = window.matchMedia(PHONE_QUERY).matches;
  if (phone) {
    if (nav.deviceMemory !== undefined && nav.deviceMemory <= WEAK_MAX_MEMORY_GB) lite = true;
    if (nav.hardwareConcurrency && nav.hardwareConcurrency <= WEAK_MAX_CORES) lite = true;
  }
  if (!lite) {
    try {
      const c = document.createElement("canvas");
      const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
      if (!gl) lite = true;
      else gl.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      lite = true;
    }
  }
  liteCache = lite;
  return lite;
}
const noopSubscribe = () => () => {};

export function MotionPrefsProvider({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  // Lato server e durante l'idratazione: lite = true (nessuno shader). Poi il valore vero.
  const lite = useSyncExternalStore(noopSubscribe, computeLite, () => true);
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(false);
  const reportSlow = useCallback(() => setSlow(true), []);

  const value = useMemo<Prefs>(
    () => ({
      reduced,
      lite,
      paused,
      setPaused,
      slow,
      reportSlow,
      canAnimate: !reduced && !lite && !slow,
    }),
    [reduced, lite, paused, slow, reportSlow],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
