/** Hotspot della Family Room (COPY sez. 3.4). 6 punti. */
import type { Hotspot } from "../types";

export const familyHotspots = [
  // TARARE nel modulo scena: pos e vista sono segnaposto.
  { id: "porta-comunicante", titolo: "Porta tra le camere", dato: "Le due camere comunicano: i genitori restano vicini ai bambini.", pos: [0, 0, 0], vista: { az: 0, pol: 65, dist: 12 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "letto-matrimoniale", titolo: "Camera matrimoniale", dato: "Un letto matrimoniale.", pos: [0, 0, 0], vista: { az: -15, pol: 65, dist: 8.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "letti-singoli", titolo: "Camera con due letti singoli", dato: "Due letti singoli per i bambini.", pos: [0, 0, 0], vista: { az: 15, pol: 65, dist: 8.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "bagno-1", titolo: "Primo bagno", dato: "Con vasca o doccia.", pos: [0, 0, 0], vista: { az: -20, pol: 65, dist: 8.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena
  { id: "bagno-2", titolo: "Secondo bagno", dato: "Con vasca o doccia. Niente code al mattino.", pos: [0, 0, 0], vista: { az: 20, pol: 65, dist: 8.5 }, visibileIn: "sempre" },
  // TARARE nel modulo scena. «Su richiesta»: la culla compare solo a richiesta dell'utente (MOTION 4.4).
  { id: "extra", titolo: "Letto extra o culla", dato: "Su richiesta si aggiunge un letto singolo o una culla.", pos: [0, 0, 0], vista: { az: 10, pol: 65, dist: 8.5 }, visibileIn: "sempre" },
] as const satisfies readonly Hotspot[];
