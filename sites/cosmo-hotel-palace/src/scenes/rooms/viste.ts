/*
 * Posizioni di riferimento delle tre composizioni (senza `three`: le importano sia la definizione
 * sia i contenuti). Mondo: x a destra, y in alto, z verso chi guarda; il modulo A è in (0, 0, 0)
 * e il secondo modulo (B) ha il centro a x = 5,4 (i due da 5,4 m affiancati).
 */

import type { RoomId, VistaCamera } from "../../content/types";

export const PASSO_MODULI = 5.4;

/** Punto guardato nella vista di partenza: il centro della composizione. */
export const CENTRO: Record<RoomId, readonly [number, number, number]> = {
  classic: [0, 1.0, -0.2],
  family: [PASSO_MODULI / 2, 1.0, -0.2],
  suite: [PASSO_MODULI / 2, 1.0, -0.2],
};

/** Vista di partenza (az 0 = frontale; i gradi sono quelli di VistaCamera). */
export const VISTA_INIZIALE: Record<RoomId, VistaCamera> = {
  classic: { az: 12, pol: 67, dist: 8.6 },
  family: { az: 12, pol: 66, dist: 14.5 },
  suite: { az: 12, pol: 66, dist: 14.5 },
};

/** Limiti d'orbita assoluti: ±35 gradi attorno alla vista di partenza. */
export const LIMITI_ORBITA = { az: [-23, 47], pol: [55, 80] } as const;

/** Quale secondo modulo ha ciascuna composizione. */
export const SECONDO_MODULO: Record<RoomId, "twin" | "soggiorno" | null> = {
  classic: null,
  family: "twin",
  suite: "soggiorno",
};

/**
 * Sotto-viste per i chip del telefono (UX 4.2: «Camera 1 / Camera 2», «Soggiorno / Camera»): portano
 * la camera su un modulo. Vanno passate a `controller.vaiA(vista)` così come sono (la scena
 * riconosce l'oggetto e sposta il punto guardato sul `centro`).
 */
export type SottoVista = { id: string; titolo: string; vista: VistaCamera; centro: readonly [number, number, number] };

const SUB = { az: 12, pol: 64 } as const;

export const SOTTO_VISTE: Record<RoomId, readonly SottoVista[]> = {
  classic: [],
  family: [
    { id: "camera-1", titolo: "Camera 1", vista: { ...SUB, dist: 6.8 }, centro: [0, 1.0, -0.3] },
    { id: "camera-2", titolo: "Camera 2", vista: { ...SUB, dist: 6.85 }, centro: [PASSO_MODULI, 1.0, -0.3] },
  ],
  suite: [
    { id: "soggiorno", titolo: "Soggiorno", vista: { ...SUB, dist: 6.8 }, centro: [PASSO_MODULI, 1.0, -0.3] },
    { id: "camera", titolo: "Camera", vista: { ...SUB, dist: 6.85 }, centro: [0, 1.0, -0.3] },
  ],
};
