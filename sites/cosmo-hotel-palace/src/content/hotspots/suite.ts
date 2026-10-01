/** Hotspot della Suite (COPY sez. 3.5). 8 punti. */
import type { Hotspot } from "../types";

export const suiteHotspots = [
  // TARARE nel modulo scena: pos e vista sono segnaposto.
  { id: "ingresso-soggiorno", titolo: "Primo ingresso", dato: "Dal soggiorno si entra senza passare dalla camera.", pos: [0, 0, 0], vista: { az: 15, pol: 65, dist: 10 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "ingresso-camera", titolo: "Secondo ingresso", dato: "La camera ha il suo ingresso separato.", pos: [0, 0, 0], vista: { az: -15, pol: 65, dist: 10 }, visibileIn: "sempre" },
  // TARARE nel modulo scena. Il divano diventa letto (MOTION 4.4).
  { id: "divano-letto", titolo: "Divano letto", dato: "Per rilassarsi, o per dormire in più.", pos: [0, 0, 0], vista: { az: 20, pol: 65, dist: 8.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "scrivania", titolo: "Scrivania", dato: "Ampia: ci si lavora e si fanno piccole riunioni.", pos: [0, 0, 0], vista: { az: 25, pol: 65, dist: 8.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "letto", titolo: "Camera matrimoniale", dato: "Letto matrimoniale e armadio.", pos: [0, 0, 0], vista: { az: -15, pol: 65, dist: 8.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "coffee-maker", titolo: "Coffee maker", dato: "Con prodotti selezionati.", pos: [0, 0, 0], vista: { az: 10, pol: 70, dist: 8.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "bagni", titolo: "Due bagni separati", dato: "Con vasca o doccia.", pos: [0, 0, 0], vista: { az: -25, pol: 65, dist: 10 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "dotazioni", titolo: "Accappatoio e pantofole", dato: "Più stirapantaloni e cassaforte.", pos: [0, 0, 0], vista: { az: -5, pol: 70, dist: 8.5 }, visibileIn: "sempre" },
] as const satisfies readonly Hotspot[];
