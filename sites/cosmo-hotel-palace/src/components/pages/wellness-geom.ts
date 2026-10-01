/*
 * Geometria dell'illustrazione isometrica del 6° piano (components/art/PosterWellness.tsx), ripetuta
 * qui per posare i punti-bottone e l'evidenziazione delle tappe sopra l'SVG. Se il poster cambia
 * proporzioni (viewBox 800 × 560, iso(35, 322, 160), cabine 3,4 m), cambiano solo queste costanti.
 * Misure stilizzate, non rilievi: nessun dato del cliente.
 */

export const VB = { w: 800, h: 560 } as const;

const K = 35;
const OX = 322;
const OY = 160;
const CB = 3.4; // lato di una cabina
const TX = CB + 0.25; // inizio del bagno turco
const LX = 13;
const LY = 8;

type P3 = readonly [number, number, number];

/** Isometrica del poster: stessa formula di `iso()` in art/proj.tsx. */
export const proietta = ([x, y, z]: P3): [number, number] => [OX + (x - y) * 0.866 * K, OY + (x + y) * 0.5 * K - z * K];

/** Posizione in percentuale del riquadro (per `left`/`top`). */
export const percento = (p: P3): { x: number; y: number } => {
  const [px, py] = proietta(p);
  return { x: (px / VB.w) * 100, y: (py / VB.h) * 100 };
};

export type TappaId = "sauna" | "turco" | "attrezzi";

/** Contorno (inviluppo convesso) di una scatola nello spazio, proiettato. */
function scatola(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): string {
  const pts: [number, number][] = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) pts.push(proietta([x, y, z]));
  return hull(pts)
    .map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`)
    .join("L");
}

function hull(points: [number, number][]): [number, number][] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: [number, number][] = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Aree di ogni tappa (path SVG, una o più parti): la parte NON evidenziata si schiarisce. */
export const AREE: Record<TappaId, string[]> = {
  sauna: [`M${scatola(-0.15, -0.15, 0, CB + 0.1, CB + 0.1, 2.7)}Z`],
  turco: [`M${scatola(TX - 0.1, -0.15, 0, TX + CB + 0.1, CB + 0.1, 2.7)}Z`],
  // sala attrezzi: a destra delle cabine e tutta la fascia davanti
  attrezzi: [
    `M${scatola(TX + CB + 0.1, -0.15, 0, LX + 0.15, CB + 0.4, 3.4)}Z`,
    `M${scatola(-0.15, CB + 0.1, 0, LX + 0.15, LY + 0.15, 2.8)}Z`,
  ],
};

export type Punto = { id: string; pos: P3 };

/** Dove sta ogni punto dell'illustrazione (i testi sono in content/hotspots/wellness.ts). */
export const PUNTI: Record<string, { pos: P3; tappa: TappaId }> = {
  sauna: { pos: [1.7, 1.5, 1.3], tappa: "sauna" },
  turco: { pos: [5.4, 1.5, 1.5], tappa: "turco" },
  "tapis-roulant": { pos: [8.4, 1.3, 1.1], tappa: "attrezzi" },
  cyclette: { pos: [11.9, 1.2, 1.0], tappa: "attrezzi" },
  macchine: { pos: [5.0, 5.6, 1.4], tappa: "attrezzi" },
};
