/*
 * Rumore deterministico (nessun Math.random): stessa scena, stessi numeri, a ogni visita.
 * Usato per il tronco d'ulivo, le foglie, le macchie di tono. Solo matematica, nessun import.
 */

/** Hash intero 3D -> 0..1. */
function hash(ix: number, iy: number, iz: number, seme: number): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(iz, 2147483647) + Math.imul(seme, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

const lisc = (t: number) => t * t * (3 - 2 * t);

/** Rumore di valore 3D, 0..1. */
export function rumore3(x: number, y: number, z: number, seme = 1): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = lisc(x - ix);
  const fy = lisc(y - iy);
  const fz = lisc(z - iz);
  const c = (a: number, b: number, d: number) => hash(ix + a, iy + b, iz + d, seme);
  const x00 = c(0, 0, 0) + (c(1, 0, 0) - c(0, 0, 0)) * fx;
  const x10 = c(0, 1, 0) + (c(1, 1, 0) - c(0, 1, 0)) * fx;
  const x01 = c(0, 0, 1) + (c(1, 0, 1) - c(0, 0, 1)) * fx;
  const x11 = c(0, 1, 1) + (c(1, 1, 1) - c(0, 1, 1)) * fx;
  const y0 = x00 + (x10 - x00) * fy;
  const y1 = x01 + (x11 - x01) * fy;
  return y0 + (y1 - y0) * fz;
}

/** Due ottave (0..1). */
export function fbm3(x: number, y: number, z: number, seme = 1): number {
  return rumore3(x, y, z, seme) * 0.65 + rumore3(x * 2.1 + 7.3, y * 2.1 + 1.7, z * 2.1 + 4.1, seme + 5) * 0.35;
}

/** Numero pseudo-casuale 0..1 da un indice intero (per sparpagliare istanze). */
export function caso(i: number, seme = 0): number {
  return hash(i, seme * 31 + 7, 13, seme + 3);
}
