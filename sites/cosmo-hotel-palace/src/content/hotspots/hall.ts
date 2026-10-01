/**
 * Hotspot della hall (COPY sez. 1). Titolo e didascalia come in COPY.
 * aria-label di ogni punto: copy.hotspot.aria con {titolo}.
 * Finestre di `p` in cui ogni punto è visibile: MOTION 3.5 (le gestisce la scena, non questo file).
 */
import type { Hotspot } from "../types";

export const hallHotspots = [
  // TARARE nel modulo scena: pos e vista sono segnaposto.
  { id: "lucernario", titolo: "Il lucernario", dato: "La luce entra dall'alto e arriva fino in hall.", pos: [0, 0, 0], vista: { az: 0, pol: 40, dist: 6 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "tronco-ulivo", titolo: "Il tronco d'ulivo", dato: "Una scultura di tronco d'ulivo accoglie chi entra.", pos: [0, 0, 0], vista: { az: 0, pol: 75, dist: 5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "vetrate", titolo: "Le vetrate", dato: "Grandi vetrate: gli spazi sono luminosi anche nelle ore più grigie.", pos: [0, 0, 0], vista: { az: -25, pol: 80, dist: 7 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "tende", titolo: "Le tende bianche", dato: "Tende bianche, toni neutri, nessun eccesso.", pos: [0, 0, 0], vista: { az: 25, pol: 80, dist: 7 }, visibileIn: "sempre" },
] as const satisfies readonly Hotspot[];
