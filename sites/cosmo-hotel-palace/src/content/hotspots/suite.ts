/** Hotspot della Suite (COPY sez. 3.5). 8 punti. */
import type { Hotspot } from "../types";

export const suiteHotspots = [
  { id: "ingresso-soggiorno", titolo: "Primo ingresso", dato: "Dal soggiorno si entra senza passare dalla camera.", pos: [8.1, 1.1, 1.475], vista: { az: -22, pol: 66, dist: 5.6 }, visibileIn: "sempre" },
  { id: "ingresso-camera", titolo: "Secondo ingresso", dato: "La camera ha il suo ingresso separato.", pos: [-2.7, 1.1, 1.475], vista: { az: 40, pol: 66, dist: 5.6 }, visibileIn: "sempre" },
  { id: "divano-letto", titolo: "Divano letto", dato: "Per rilassarsi, o per dormire in più.", pos: [4.85, 0.6, -1.1], vista: { az: 10, pol: 63, dist: 6.0 }, visibileIn: "sempre" },
  { id: "scrivania", titolo: "Scrivania", dato: "Ampia: ci si lavora e si fanno piccole riunioni.", pos: [7.1, 0.85, -1.65], vista: { az: 6, pol: 64, dist: 5.4 }, visibileIn: "sempre" },
  { id: "letto", titolo: "Camera matrimoniale", dato: "Letto matrimoniale e armadio.", pos: [0.05, 0.75, -0.9], vista: { az: 12, pol: 64, dist: 6.4 }, visibileIn: "sempre" },
  { id: "coffee-maker", titolo: "Coffee maker", dato: "Con prodotti selezionati.", pos: [7.9, 0.95, -0.58], vista: { az: -24, pol: 66, dist: 4.6 }, visibileIn: "sempre" },
  { id: "bagni", titolo: "Due bagni separati", dato: "Con vasca o doccia.", pos: [2.7, 1.1, -2.2], vista: { az: 4, pol: 63, dist: 7.6 }, visibileIn: "sempre" },
  { id: "dotazioni", titolo: "Accappatoio e pantofole", dato: "Più stirapantaloni e cassaforte.", pos: [-2.6, 1.4, 1.475], vista: { az: 40, pol: 66, dist: 5.0 }, visibileIn: "sempre" },
] as const satisfies readonly Hotspot[];
