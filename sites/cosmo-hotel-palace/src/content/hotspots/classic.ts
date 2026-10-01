/** Hotspot della Classic Double Room (COPY sez. 3.3). 7 punti. */
import type { Hotspot } from "../types";

export const classicHotspots = [
  { id: "letto", titolo: "Letto matrimoniale", dato: "160 cm, testiera imbottita.", pos: [0.05, 0.75, -0.9], vista: { az: 14, pol: 65, dist: 6.2 }, visibileIn: "sempre" },
  { id: "bagno", titolo: "Bagno", dato: "Con vasca o doccia, più un set di cortesia.", pos: [2.05, 1.1, -2.1], vista: { az: 10, pol: 62, dist: 4.4 }, visibileIn: "sempre" },
  { id: "finestra", titolo: "Luce", dato: "Camera luminosa e ariosa, con tende bianche.", pos: [-2.6, 1.5, -0.5], vista: { az: 40, pol: 68, dist: 6.0 }, visibileIn: "sempre" },
  { id: "tv", titolo: "TV satellitare", dato: "28 canali stranieri, Sky TV e Sky Sport.", pos: [-2.0, 1.4, -2.0], vista: { az: 16, pol: 68, dist: 4.8 }, visibileIn: "sempre" },
  { id: "minibar", titolo: "Minibar", dato: "Lo rifornisci di snack e bevande dal distributore self-service al piano.", pos: [-2.26, 0.45, -1.62], vista: { az: 8, pol: 57, dist: 4.0 }, visibileIn: "sempre" },
  { id: "cassaforte", titolo: "Cassaforte", dato: "Per documenti e oggetti di valore.", pos: [-1.67, 0.85, -1.83], vista: { az: 16, pol: 68, dist: 4.2 }, visibileIn: "sempre" },
  { id: "clima", titolo: "Climatizzazione", dato: "Regolabile da te.", pos: [-2.58, 2.42, 1.475], vista: { az: 34, pol: 66, dist: 5.2 }, visibileIn: "sempre" },
] as const satisfies readonly Hotspot[];
