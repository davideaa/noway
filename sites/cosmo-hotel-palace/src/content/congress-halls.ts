/**
 * Sale del Centro Congressi: 25 righe copiate dalla tabella di COPY.md sez. 15
 * (16 al piano terra, 9 al piano inferiore). Fonte originale: tabella del sito vecchio.
 *
 * REGOLE (UX 7.1, DECISIONI 7):
 * - I numeri sono quelli pubblicati. Nessun valore è calcolato, corretto o dedotto.
 * - `dims` serve solo al disegno; `areaM2` è il valore pubblicato e può non coincidere.
 * - `null` = «-» nella tabella (disposizione non indicata).
 * - Nessun conteggio di sale va mostrato accanto all'elenco (non «13», non «25»).
 * - Dove i dati sono incoerenti c'è `nota` e un commento `// DA CONFERMARE`.
 *   Il confronto dims × m² è stato fatto fuori dal codice, solo per segnalare: soglia 5%.
 *
 * Verifica contro COPY.md: `node scripts/check-content.mjs`.
 */
import type { CongressHall, Disposizione } from "./types";

export const DISPOSIZIONI = ["platea", "banchi", "ferro", "banchetto"] as const satisfies readonly Disposizione[];

export const congressHalls = [
  /* ---------------------------- Piano terra (0) ---------------------------- */
  { id: "costellazioni", name: "Plenaria delle Costellazioni", floor: 0, dims: [25, 20], areaM2: 500, heightM: 4.22, cap: { platea: 500, banchi: null, ferro: null, banchetto: 450 }, divisibleInto: 8 },
  { id: "sole-plenaria", name: "Plenaria del Sole", floor: 0, dims: [18.5, 17.5], areaM2: 325, heightM: 4.22, cap: { platea: 400, banchi: 188, ferro: 188, banchetto: 300 } },
  // DA CONFERMARE: 7,1 × 18,5 = 131 m², pubblicati 147 (+12%).
  { id: "oro-plenaria", name: "Oro Plenaria", floor: 0, dims: [7.1, 18.5], areaM2: 147, heightM: 4.22, cap: { platea: 180, banchi: 70, ferro: 70, banchetto: 140 }, nota: "Dimensioni e superficie non tornano: 7,1 × 18,5 m = circa 131 m², pubblicati 147 m²." },
  // DA CONFERMARE: 7,2 × 18,5 = 133 m², pubblicati 145 (+9%).
  { id: "argento-plenaria", name: "Argento Plenaria", floor: 0, dims: [7.2, 18.5], areaM2: 145, heightM: 4.22, cap: { platea: 180, banchi: 70, ferro: 70, banchetto: 140 }, nota: "Dimensioni e superficie non tornano: 7,2 × 18,5 m = circa 133 m², pubblicati 145 m²." },
  { id: "sole-d-oro", name: "Sole d'Oro", floor: 0, dims: [11.2, 8.2], areaM2: 92, heightM: 4.22, cap: { platea: 100, banchi: 60, ferro: 60, banchetto: 80 } },
  { id: "luna-d-argento", name: "Luna d'Argento", floor: 0, dims: [11.2, 8.2], areaM2: 92, heightM: 4.22, cap: { platea: 100, banchi: 60, ferro: 60, banchetto: 80 } },
  // DA CONFERMARE: 7,1 × 11 = 78 m², pubblicati 91 (+17%).
  { id: "stella-d-oro", name: "Stella d'Oro", floor: 0, dims: [7.1, 11], areaM2: 91, heightM: 4.22, cap: { platea: 100, banchi: 58, ferro: 58, banchetto: 80 }, nota: "Dimensioni e superficie non tornano: 7,1 × 11 m = circa 78 m², pubblicati 91 m²." },
  // DA CONFERMARE: 11 × 7,4 = 81 m², pubblicati 87 (+7%).
  { id: "cometa-d-argento", name: "Cometa d'Argento", floor: 0, dims: [11, 7.4], areaM2: 87, heightM: 4.22, cap: { platea: 100, banchi: 55, ferro: 55, banchetto: 80 }, nota: "Dimensioni e superficie non tornano: 11 × 7,4 m = circa 81 m², pubblicati 87 m²." },
  { id: "luna", name: "Luna", floor: 0, dims: [6.6, 8.5], areaM2: 58, heightM: 4.22, cap: { platea: 60, banchi: 35, ferro: 35, banchetto: 50 } },
  { id: "sole", name: "Sole", floor: 0, dims: [6.4, 8.9], areaM2: 56, heightM: 4.22, cap: { platea: 60, banchi: 35, ferro: 35, banchetto: 50 } },
  // DA CONFERMARE: 7,1 × 7,1 = 50 m², pubblicati 55 (+9%).
  { id: "stella", name: "Stella", floor: 0, dims: [7.1, 7.1], areaM2: 55, heightM: 4.22, cap: { platea: 60, banchi: 22, ferro: 22, banchetto: 40 }, nota: "Dimensioni e superficie non tornano: 7,1 × 7,1 m = circa 50 m², pubblicati 55 m²." },
  { id: "cometa", name: "Cometa", floor: 0, dims: [7.2, 7.4], areaM2: 53, heightM: 4.22, cap: { platea: 60, banchi: 22, ferro: 22, banchetto: 40 } },
  // DA CONFERMARE: 7,1 × 4,8 = 34 m², pubblicati 36 (+6%).
  { id: "oro", name: "Oro", floor: 0, dims: [7.1, 4.8], areaM2: 36, heightM: 4.22, cap: { platea: 40, banchi: 18, ferro: 18, banchetto: 30 }, nota: "Dimensioni e superficie non tornano: 7,1 × 4,8 m = circa 34 m², pubblicati 36 m²." },
  { id: "argento", name: "Argento", floor: 0, dims: [4.6, 7.4], areaM2: 34, heightM: 4.22, cap: { platea: 40, banchi: 18, ferro: 18, banchetto: 30 } },
  // DA CONFERMARE: 7,8 × 3,7 = 29 m², pubblicati 31 (+7%); inoltre la platea (29) è inferiore al banchetto (30),
  // unico caso su 25 righe in cui succede (altrove la platea è sempre >= banchetto).
  { id: "lingotto", name: "Lingotto", floor: 0, dims: [7.8, 3.7], areaM2: 31, heightM: 4.22, cap: { platea: 29, banchi: 15, ferro: 15, banchetto: 30 }, nota: "Dimensioni e superficie non tornano (7,8 × 3,7 m = circa 29 m², pubblicati 31 m²). Platea 29 minore del banchetto 30: unico caso nella tabella." },
  { id: "pepita", name: "Pepita", floor: 0, dims: [5, 4], areaM2: 20, heightM: 4.22, cap: { platea: 15, banchi: 10, ferro: 10, banchetto: 10 } },

  /* -------------------------- Piano inferiore (-1) -------------------------- */
  // DA CONFERMARE: il testo del sito vecchio dice «Plenaria delle Divinità da 400 mq» e «fino a 400 persone»;
  // la tabella dà 440 m², platea 440, banchetto 400. Qui si usa la tabella (COPY sez. 15).
  { id: "divinita", name: "Plenaria delle Divinità", floor: -1, dims: [25.3, 17.2], areaM2: 440, heightM: 3.4, cap: { platea: 440, banchi: null, ferro: null, banchetto: 400 }, divisibleInto: 5, nota: "Il testo del sito vecchio e il brief dicono 400 mq e fino a 400 persone; la tabella dà 440 m², platea 440, banchetto 400." },
  { id: "fortuna-plenaria", name: "Plenaria Fortuna", floor: -1, dims: [21.2, 13.6], areaM2: 300, heightM: 3.1, cap: { platea: 320, banchi: 160, ferro: 160, banchetto: 280 } },
  { id: "grande-fortuna", name: "Grande Fortuna", floor: -1, dims: [15.4, 13.6], areaM2: 210, heightM: 3.4, cap: { platea: 200, banchi: 100, ferro: 100, banchetto: 180 } },
  { id: "piccola-fortuna", name: "Piccola Fortuna", floor: -1, dims: [13.5, 13.6], areaM2: 180, heightM: 3.4, cap: { platea: 170, banchi: 85, ferro: 85, banchetto: 160 } },
  { id: "fortuna", name: "Fortuna", floor: -1, dims: [7.7, 13.6], areaM2: 105, heightM: 3.4, cap: { platea: 110, banchi: 55, ferro: 55, banchetto: 90 } },
  { id: "musicante", name: "Musicante", floor: -1, dims: [7.7, 13.6], areaM2: 105, heightM: 3.4, cap: { platea: 110, banchi: 55, ferro: 55, banchetto: 90 } },
  { id: "prosperita", name: "Prosperità", floor: -1, dims: [5.8, 13.6], areaM2: 80, heightM: 3.4, cap: { platea: 80, banchi: 40, ferro: 40, banchetto: 70 } },
  // DA CONFERMARE: 4,5 × 8 = 36 m², pubblicati 40 (+11%).
  { id: "saggio", name: "Saggio", floor: -1, dims: [4.5, 8], areaM2: 40, heightM: 3.1, cap: { platea: 36, banchi: 15, ferro: 15, banchetto: 30 }, nota: "Dimensioni e superficie non tornano: 4,5 × 8 m = 36 m², pubblicati 40 m²." },
  // DA CONFERMARE: 4,7 × 5,6 = 26 m², pubblicati 24 (-9%).
  { id: "fiori", name: "Fiori", floor: -1, dims: [4.7, 5.6], areaM2: 24, heightM: 3.1, cap: { platea: 20, banchi: 12, ferro: 12, banchetto: 15 }, nota: "Dimensioni e superficie non tornano: 4,7 × 5,6 m = circa 26 m², pubblicati 24 m²." },
] as const satisfies readonly CongressHall[];

export type HallId = (typeof congressHalls)[number]["id"];

/**
 * DA CONFERMARE: quali righe sono sale singole e quali combinazioni di altre sale
 * (COPY sez. 15 e domanda aperta 4). Finché non si sa, le pareti mobili hanno due soli stati
 * (UX 7.2) e solo `costellazioni` (8) e `divinita` (5) sono dichiarate divisibili.
 */
export const SALE_DIVISIBILI = ["costellazioni", "divinita"] as const satisfies readonly HallId[];
