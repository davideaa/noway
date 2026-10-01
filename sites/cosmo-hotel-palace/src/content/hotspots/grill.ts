/** Hotspot del Cosmo Grill & Lounge (COPY sez. 6). 6 punti, sempre visibili (MOTION 6.2). */
import type { Hotspot } from "../types";

export const grillHotspots = [
  // pos/vista tarati nel modulo 8 sulla scena vera (orbita attorno a [0, 1,15, -0,6]).
  { id: "soffitto", titolo: "Travi e canalizzazioni a vista", dato: "Un ambiente contemporaneo, con struttura a vista.", pos: [0, 4.0, -2.2], vista: { az: 0, pol: 78, dist: 10 }, visibileIn: "sempre" },
  { id: "lampade", titolo: "Lampade color miele", dato: "Abat-jour color miele sopra i tavoli.", pos: [1.4, 2.9, -4.6], vista: { az: 10, pol: 80, dist: 9 }, visibileIn: "sempre" },
  { id: "tavoli-sedie", titolo: "Tavoli bianchi, sedie forate", dato: "Sedie in alluminio forato.", pos: [-1.4, 0.85, -1.9], vista: { az: 0, pol: 78, dist: 7.5 }, visibileIn: "sempre" },
  { id: "specchi", titolo: "Specchi con cornice scura", dato: "Raddoppiano la sala.", pos: [2.7, 2.05, -6.4], vista: { az: -20, pol: 82, dist: 10.5 }, visibileIn: "sempre" },
  { id: "rami", titolo: "Rami secchi", dato: "Un tocco naturale, senza fiori finti.", pos: [7.5, 1.8, -6.3], vista: { az: -25, pol: 82, dist: 10 }, visibileIn: "sempre" },
  { id: "pareti", titolo: "Cemento lisciato", dato: "Superfici in cemento lisciato.", pos: [8.9, 2.0, -1.0], vista: { az: -30, pol: 82, dist: 10 }, visibileIn: "sempre" },
] as const satisfies readonly Hotspot[];
