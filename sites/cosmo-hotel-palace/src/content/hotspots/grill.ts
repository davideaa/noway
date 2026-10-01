/** Hotspot del Cosmo Grill & Lounge (COPY sez. 6). 6 punti, sempre visibili (MOTION 6.2). */
import type { Hotspot } from "../types";

export const grillHotspots = [
  // TARARE nel modulo scena: pos e vista sono segnaposto.
  { id: "soffitto", titolo: "Travi e canalizzazioni a vista", dato: "Un ambiente contemporaneo, con struttura a vista.", pos: [0, 0, 0], vista: { az: 0, pol: 55, dist: 9 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "lampade", titolo: "Lampade color miele", dato: "Abat-jour color miele sopra i tavoli.", pos: [0, 0, 0], vista: { az: 10, pol: 65, dist: 8 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "tavoli-sedie", titolo: "Tavoli bianchi, sedie forate", dato: "Sedie in alluminio forato.", pos: [0, 0, 0], vista: { az: 0, pol: 70, dist: 7 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "specchi", titolo: "Specchi con cornice scura", dato: "Raddoppiano la sala.", pos: [0, 0, 0], vista: { az: -20, pol: 75, dist: 8 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "rami", titolo: "Rami secchi", dato: "Un tocco naturale, senza fiori finti.", pos: [0, 0, 0], vista: { az: 20, pol: 75, dist: 8 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "pareti", titolo: "Cemento lisciato", dato: "Superfici in cemento lisciato.", pos: [0, 0, 0], vista: { az: -30, pol: 75, dist: 9 }, visibileIn: "sempre" },
] as const satisfies readonly Hotspot[];
