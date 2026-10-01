/**
 * Hotspot della hall (COPY sez. 1). Titolo e didascalia come in COPY.
 * aria-label di ogni punto: copy.hotspot.aria con {titolo}.
 * Finestre di `p` in cui ogni punto è visibile: MOTION 3.5 (le gestisce la scena, non questo file).
 */
import type { Hotspot } from "../types";

export const hallHotspots = [
  // pos/vista tarati nel modulo 8 sulla scena vera. In hall `vista` è relativa al tronco (az attorno a lui, pol 90 = orizzontale, > 90 guarda in su).
  { id: "lucernario", titolo: "Il lucernario", dato: "La luce entra dall'alto e arriva fino in hall.", pos: [0.6, 9.4, -2.4], vista: { az: 0, pol: 128, dist: 5 }, visibileIn: "sempre" },
  { id: "tronco-ulivo", titolo: "Il tronco d'ulivo", dato: "Una scultura di tronco d'ulivo accoglie chi entra.", pos: [-0.9, 3.1, -0.8], vista: { az: 0, pol: 104, dist: 6 }, visibileIn: "sempre" },
  { id: "vetrate", titolo: "Le vetrate", dato: "Grandi vetrate: gli spazi sono luminosi anche nelle ore più grigie.", pos: [0, 4.2, 6.95], vista: { az: 0, pol: 95, dist: 6 }, visibileIn: "sempre" },
  { id: "tende", titolo: "Le tende bianche", dato: "Tende bianche, toni neutri, nessun eccesso.", pos: [-5.6, 3.4, -6.55], vista: { az: -25, pol: 96, dist: 6 }, visibileIn: "sempre" },
] as const satisfies readonly Hotspot[];
