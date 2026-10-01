/*
 * Posizione dei punti della camera sulla pianta (UX 5.2: «gli hotspot sono gli stessi»).
 * Coordinate nello spazio del viewBox di FloorPlan: la scala è 40 unità = 1 m, una camera da
 * 22 m² è 216 × 164 con l'origine in (16, 44) e, nelle piante doppie, la seconda camera parte da
 * x = 232. Il disegno di FloorPlan è indicativo (non conosciamo le misure vere) e lo sono anche
 * questi punti: indicano la zona, non una quota. Per gli oggetti che la pianta non disegna
 * (TV, minibar, cassaforte, clima) il punto sta sul lato della stanza dove li mette il 3D.
 */
import type { RoomId } from "@/content/types";

/** Dimensioni del viewBox di FloorPlan per tipo (vedi FloorPlan.tsx: CW, CH, MARG, TOP). */
export const PIANTA_DIM: Record<RoomId, { w: number; h: number }> = {
  classic: { w: 248, h: 240 },
  family: { w: 464, h: 240 },
  suite: { w: 464, h: 240 },
};

export const PIANTA_PUNTI: Record<RoomId, Readonly<Record<string, readonly [number, number]>>> = {
  classic: {
    letto: [118, 92],
    bagno: [58, 166],
    finestra: [199, 58],
    tv: [209, 112],
    minibar: [209, 142],
    cassaforte: [209, 172],
    clima: [86, 62],
  },
  family: {
    "porta-comunicante": [232, 156],
    "letto-matrimoniale": [118, 96],
    "letti-singoli": [360, 96],
    "bagno-1": [58, 166],
    "bagno-2": [274, 166],
    extra: [364, 168],
  },
  suite: {
    "ingresso-soggiorno": [132, 198],
    "ingresso-camera": [348, 198],
    "divano-letto": [150, 72],
    scrivania: [52, 70],
    letto: [360, 96],
    "coffee-maker": [206, 124],
    bagni: [58, 166],
    dotazioni: [432, 156],
  },
};
