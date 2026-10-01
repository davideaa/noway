/** Hotspot della Classic Double Room (COPY sez. 3.3). 7 punti. */
import type { Hotspot } from "../types";

export const classicHotspots = [
  // TARARE nel modulo scena: pos e vista sono segnaposto.
  { id: "letto", titolo: "Letto matrimoniale", dato: "160 cm, testiera imbottita.", pos: [0, 0, 0], vista: { az: 0, pol: 65, dist: 7.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "bagno", titolo: "Bagno", dato: "Con vasca o doccia, più un set di cortesia.", pos: [0, 0, 0], vista: { az: 20, pol: 65, dist: 7.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "finestra", titolo: "Luce", dato: "Camera luminosa e ariosa, con tende bianche.", pos: [0, 0, 0], vista: { az: -20, pol: 70, dist: 7.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "tv", titolo: "TV satellitare", dato: "28 canali stranieri, Sky TV e Sky Sport.", pos: [0, 0, 0], vista: { az: -10, pol: 70, dist: 7.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "minibar", titolo: "Minibar", dato: "Lo rifornisci di snack e bevande dal distributore self-service al piano.", pos: [0, 0, 0], vista: { az: 10, pol: 70, dist: 7.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "cassaforte", titolo: "Cassaforte", dato: "Per documenti e oggetti di valore.", pos: [0, 0, 0], vista: { az: 15, pol: 70, dist: 7.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "clima", titolo: "Climatizzazione", dato: "Regolabile da te.", pos: [0, 0, 0], vista: { az: -15, pol: 70, dist: 7.5 }, visibileIn: "sempre" },
] as const satisfies readonly Hotspot[];
