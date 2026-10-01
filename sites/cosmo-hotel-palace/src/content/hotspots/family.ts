/** Hotspot della Family Room (COPY sez. 3.4). 6 punti. */
import type { Hotspot } from "../types";

export const familyHotspots = [
  { id: "porta-comunicante", titolo: "Porta tra le camere", dato: "Le due camere comunicano: i genitori restano vicini ai bambini.", pos: [2.7, 1.1, -1.5], vista: { az: -20, pol: 64, dist: 6.0 }, visibileIn: "sempre" },
  { id: "letto-matrimoniale", titolo: "Camera matrimoniale", dato: "Un letto matrimoniale.", pos: [0.05, 0.75, -0.9], vista: { az: 10, pol: 64, dist: 6.4 }, visibileIn: "sempre" },
  { id: "letti-singoli", titolo: "Camera con due letti singoli", dato: "Due letti singoli per i bambini.", pos: [5.13, 0.7, -0.95], vista: { az: 10, pol: 64, dist: 6.8 }, visibileIn: "sempre" },
  { id: "bagno-1", titolo: "Primo bagno", dato: "Con vasca o doccia.", pos: [2.05, 1.1, -2.1], vista: { az: -8, pol: 64, dist: 5.4 }, visibileIn: "sempre" },
  { id: "bagno-2", titolo: "Secondo bagno", dato: "Con vasca o doccia. Niente code al mattino.", pos: [3.35, 1.1, -2.1], vista: { az: 22, pol: 64, dist: 5.4 }, visibileIn: "sempre" },
  { id: "extra", titolo: "Letto extra o culla", dato: "Su richiesta si aggiunge un letto singolo o una culla.", pos: [3.7, 0.5, 0.45], vista: { az: 12, pol: 62, dist: 5.2 }, visibileIn: "sempre" },
] as const satisfies readonly Hotspot[];
