/**
 * Hotspot del Wellness (COPY sez. 7). 5 punti.
 * DECISIONI 3: il wellness è un SVG isometrico, non 3D. `pos` e `vista` restano nel contratto
 * `Hotspot` ma qui non servono alla camera: il modulo wellness li può usare come coordinate
 * dell'SVG (x, y) o ignorarli. Gli orari 7:00-22:00 sono quelli del BRIEF.
 */
import type { Hotspot } from "../types";

export const wellnessHotspots = [
  // TARARE nel modulo scena: pos e vista sono segnaposto.
  { id: "sauna", titolo: "Sauna finlandese", dato: "Al sesto piano. Orario 7:00–22:00.", pos: [0, 0, 0], vista: { az: 0, pol: 55, dist: 8 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "turco", titolo: "Bagno turco", dato: "Al sesto piano. Orario 7:00–22:00.", pos: [0, 0, 0], vista: { az: 0, pol: 55, dist: 8 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "tapis-roulant", titolo: "Due tapis roulant", dato: "14 programmi di lavoro interattivi.", pos: [0, 0, 0], vista: { az: 0, pol: 55, dist: 8 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "cyclette", titolo: "Cyclette", dato: "Per pedalare senza uscire dall'hotel.", pos: [0, 0, 0], vista: { az: 0, pol: 55, dist: 8 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "macchine", titolo: "Chest press, pulldown, leg extension", dato: "Per allenare petto, schiena e gambe.", pos: [0, 0, 0], vista: { az: 0, pol: 55, dist: 8 }, visibileIn: "sempre" },
] as const satisfies readonly Hotspot[];
