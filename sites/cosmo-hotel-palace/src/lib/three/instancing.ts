/*
 * Aiuti per InstancedMesh (DESIGN 5.5: sedie e tavoli della sala, 500 sedie in una draw call).
 * Si scrivono le matrici a mano (traslazione + rotazione Y + scala), senza Matrix4/Vector3 per
 * istanza: nessuna allocazione nei tween. Per animare: calcolare le istanze, poi
 * `segnaAggiornate(mesh)` una volta sola.
 */

import { DynamicDrawUsage, InstancedMesh, type BufferGeometry, type Color, type Material } from "three";

/** InstancedMesh pronto all'uso: `count` 0, buffer dinamico, senza culling (la sfera si calcola male). */
export function creaIstanze(geom: BufferGeometry, mat: Material | Material[], max: number): InstancedMesh {
  const m = new InstancedMesh(geom, mat, max);
  m.instanceMatrix.setUsage(DynamicDrawUsage);
  m.count = 0;
  m.frustumCulled = false;
  return m;
}

/**
 * Scrive la matrice dell'istanza `i` in `arr` (column-major, 16 float per istanza):
 * scala (sx, sy, sz) poi rotazione attorno a Y poi traslazione (x, y, z).
 * `scala = 0` nasconde l'istanza senza cambiare `count`.
 */
export function scriviMatrice(
  arr: Float32Array,
  i: number,
  x: number,
  y: number,
  z: number,
  rotY = 0,
  sx = 1,
  sy = sx,
  sz = sx,
): void {
  const c = Math.cos(rotY);
  const s = Math.sin(rotY);
  const o = i * 16;
  arr[o] = c * sx;
  arr[o + 1] = 0;
  arr[o + 2] = -s * sx;
  arr[o + 3] = 0;
  arr[o + 4] = 0;
  arr[o + 5] = sy;
  arr[o + 6] = 0;
  arr[o + 7] = 0;
  arr[o + 8] = s * sz;
  arr[o + 9] = 0;
  arr[o + 10] = c * sz;
  arr[o + 11] = 0;
  arr[o + 12] = x;
  arr[o + 13] = y;
  arr[o + 14] = z;
  arr[o + 15] = 1;
}

/** Come `scriviMatrice` ma sul mesh e senza passare l'array. Non segna l'aggiornamento. */
export function scriviIstanza(
  mesh: InstancedMesh,
  i: number,
  x: number,
  y: number,
  z: number,
  rotY = 0,
  scala = 1,
): void {
  scriviMatrice(mesh.instanceMatrix.array as Float32Array, i, x, y, z, rotY, scala);
}

/** Quante istanze si disegnano (le altre restano nel buffer, non costano nulla). */
export function impostaConteggio(mesh: InstancedMesh, n: number): void {
  mesh.count = Math.max(0, Math.min(n, mesh.instanceMatrix.count));
}

/** Da chiamare una volta dopo aver scritto tutte le istanze di un frame. */
export function segnaAggiornate(mesh: InstancedMesh): void {
  mesh.instanceMatrix.needsUpdate = true;
}

/** Colore per istanza. Crea il buffer `instanceColor` alla prima chiamata. */
export function scriviColoreIstanza(mesh: InstancedMesh, i: number, colore: Color): void {
  mesh.setColorAt(i, colore);
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

/* ───────────────────────── Matematica per i tween ───────────────────────── */

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Interpola due angoli (radianti) per la via più corta. */
export function lerpAngolo(a: number, b: number, t: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  else if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

/**
 * Interpola `n` istanze fra due stati `[x, z, rotY, scala]` x n (Float32Array) e scrive le matrici,
 * con ritardo per istanza (`sfalsamento` 0..1: l'ultima parte quando le prime sono già arrivate)
 * e un piccolo salto `hop` in metri. Stessi `k`, stesso risultato (MOTION 5.3).
 * `ease` mappa 0..1 -> 0..1 per istanza.
 */
export function morfaIstanze(
  mesh: InstancedMesh,
  k: number,
  da: Float32Array,
  a: Float32Array,
  n: number,
  ease: (t: number) => number,
  { sfalsamento = 0.33, hop = 0.22, y = 0 }: { sfalsamento?: number; hop?: number; y?: number } = {},
): void {
  const arr = mesh.instanceMatrix.array as Float32Array;
  const denom = 1 - sfalsamento;
  for (let i = 0; i < n; i++) {
    const r = (k - (n > 1 ? i / (n - 1) : 0) * sfalsamento) / denom;
    const t = ease(r < 0 ? 0 : r > 1 ? 1 : r);
    const s = lerp(da[4 * i + 3], a[4 * i + 3], t);
    scriviMatrice(
      arr,
      i,
      lerp(da[4 * i], a[4 * i], t),
      s > 0.01 ? y + Math.sin(Math.PI * t) * hop : y,
      lerp(da[4 * i + 1], a[4 * i + 1], t),
      lerpAngolo(da[4 * i + 2], a[4 * i + 2], t),
      s,
    );
  }
  mesh.instanceMatrix.needsUpdate = true;
}
