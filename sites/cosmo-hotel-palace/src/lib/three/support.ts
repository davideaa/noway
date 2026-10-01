/*
 * Rilevamento di cosa può fare il dispositivo (MOTION 9.3, UX 13). NESSUN import di `three`:
 * questo file sta nel JS iniziale e decide se vale la pena scaricare il motore 3D.
 *
 * Parametri di prova (solo QA, mai nei link veri), letti da `?3d=`:
 *   ?3d=forza   salta il controllo del rendering software (serve a Chromium headless con SwiftShader)
 *   ?3d=poster  non carica mai il 3D (prova del ripiego)
 */

export type MotivoNoWebGL = "assente" | "software" | "forzato-poster";
export type SupportoWebGL = { ok: true } | { ok: false; motivo: MotivoNoWebGL };

export type ParametroQA = "forza" | "poster" | null;

export function parametroQA(): ParametroQA {
  try {
    const v = new URLSearchParams(window.location.search).get("3d");
    return v === "forza" || v === "poster" ? v : null;
  } catch {
    return null;
  }
}

let cache: SupportoWebGL | null = null;

/** Apre un contesto WebGL2 su un canvas usa-e-getta e lo rilascia subito (iOS limita i contesti). */
function sonda(failIfMajorPerformanceCaveat: boolean): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2", {
      failIfMajorPerformanceCaveat,
      antialias: false,
      depth: false,
      stencil: false,
      alpha: false,
    }) as WebGL2RenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * WebGL2 disponibile e non software? three non supporta più WebGL1, quindi senza WebGL2 si resta
 * sul poster. Il risultato è in cache per la visita. Solo nel browser.
 */
export function rilevaWebGL(): SupportoWebGL {
  if (cache) return cache;
  const qa = parametroQA();
  if (qa === "poster") return (cache = { ok: false, motivo: "forzato-poster" });
  if (typeof document === "undefined") return { ok: false, motivo: "assente" };
  if (qa === "forza") return (cache = sonda(false) ? { ok: true } : { ok: false, motivo: "assente" });
  if (sonda(true)) return (cache = { ok: true });
  // con il flag fallisce ma senza no: c'è un contesto, però software
  return (cache = sonda(false) ? { ok: false, motivo: "software" } : { ok: false, motivo: "assente" });
}

/**
 * Dispositivo a puntatore "grossolano" (telefono e tablet): orbita solo orizzontale,
 * `touch-action: pan-y`, livello di partenza `mid` (MOTION 9.1).
 */
export function isTouch(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

/** Memoria dichiarata (GB) sotto la quale il 3D parte solo su richiesta (UX 4.1: "poca memoria"). */
export const MEMORIA_MINIMA_GB = 1;

type NavigatoreEsteso = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

/**
 * Il 3D parte solo con «Carica la vista 3D»? Con risparmio dati (`saveData`,
 * `prefers-reduced-data`) o memoria dichiarata molto bassa (UX 4.1, UX 13).
 * Non dice mai "livello lite": quello si sceglie solo dopo una misura (MOTION 9.2).
 */
export function richiedeCaricoManuale(): boolean {
  try {
    const n = navigator as NavigatoreEsteso;
    if (n.connection?.saveData) return true;
    if (window.matchMedia("(prefers-reduced-data: reduce)").matches) return true;
    if (typeof n.deviceMemory === "number" && n.deviceMemory <= MEMORIA_MINIMA_GB) return true;
  } catch {
    /* nessun segnale: parte da solo */
  }
  return false;
}

/** Solo risparmio dati esplicito (decide il livello di partenza dopo il clic manuale). */
export function risparmioDati(): boolean {
  try {
    const n = navigator as NavigatoreEsteso;
    return (
      !!n.connection?.saveData || window.matchMedia("(prefers-reduced-data: reduce)").matches
    );
  } catch {
    return false;
  }
}

export { getPrefersReducedMotion } from "../motion";
