/** Scale e geometria dei grafici, calcolate in build (nessun conto nel browser). */

/** Tacche "pulite" (1, 2, 5 x 10^k) che coprono [min, max]. */
export function niceTicks(min: number, max: number, n = 5): number[] {
  if (max <= min) max = min + 1;
  const span = max - min;
  const raw = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const r = raw / mag;
  const step = (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

export type Dominio = { min: number; max: number; ticks: number[] };

/** Dominio verticale: tacche pulite, con lo zero dentro se richiesto. */
export function dominio(valori: number[], opts: { zero?: boolean; n?: number; pad?: number } = {}): Dominio {
  let min = Math.min(...valori);
  let max = Math.max(...valori);
  if (opts.zero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  const pad = opts.pad ?? 0.04;
  const span = max - min || 1;
  const ticks = niceTicks(min - span * pad, max + span * pad, opts.n ?? 5);
  return { min: ticks[0], max: ticks[ticks.length - 1], ticks };
}

/** y in percento dall'alto (0 = tetto, 100 = base). */
export const yPct = (v: number, d: Dominio) => ((d.max - v) / (d.max - d.min)) * 100;
/** x in percento da sinistra su [0, xMax]. */
export const xPct = (x: number, xMax: number) => (xMax ? (x / xMax) * 100 : 0);

const f2 = (v: number) => (Math.round(v * 100) / 100).toString();

/**
 * Semplificazione Ramer-Douglas-Peucker sui punti gia' in percento: le curve
 * hanno fino a 4.206 punti ma su schermo se ne distinguono molti meno. La
 * tolleranza e' in unita' di percento (0,2 = due pixel su 1000).
 */
export function semplifica(p: [number, number][], tol = 0.2): [number, number][] {
  if (p.length < 3) return p;
  const keep = new Uint8Array(p.length);
  keep[0] = keep[p.length - 1] = 1;
  const stack: [number, number][] = [[0, p.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = p[a];
    const [bx, by] = p[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1e-9;
    let worst = -1;
    let dmax = 0;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * p[i][0] - dx * p[i][1] + bx * ay - by * ax) / len;
      if (d > dmax) {
        dmax = d;
        worst = i;
      }
    }
    if (worst > 0 && dmax > tol) {
      keep[worst] = 1;
      stack.push([a, worst], [worst, b]);
    }
  }
  return p.filter((_, i) => keep[i]);
}

/** Path SVG "M x y L x y ..." in coordinate percento. */
export function pathLinea(p: [number, number][]) {
  return p.map(([x, y], i) => `${i ? "L" : "M"}${f2(x)} ${f2(y)}`).join("");
}

/** Path chiuso sulla riga y0 (area sotto o sopra la linea). */
export function pathArea(p: [number, number][], y0: number) {
  if (!p.length) return "";
  return `${pathLinea(p)}L${f2(p[p.length - 1][0])} ${f2(y0)}L${f2(p[0][0])} ${f2(y0)}Z`;
}
