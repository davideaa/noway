/**
 * Proiezioni 3D → 2D e pezzi base per disegnare scatole (modulo 6).
 * Server-side, nessun JS al client: le funzioni girano solo mentre si genera l'SVG.
 * Convenzione: x lungo la parete di fondo di destra, y lungo quella di sinistra, z in alto;
 * la telecamera sta dalla parte di +x +y, quindi di ogni scatola si vedono il piano
 * superiore, la faccia +y (a sinistra, in luce) e la faccia +x (a destra, in ombra).
 */
import { Fragment } from "react";

export type V3 = readonly [number, number, number];
export type Proj = (x: number, y: number, z: number) => readonly [number, number];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/**
 * Prospettiva. La telecamera sta a distanza `d` dal punto `t`, ad azimut `az` (gradi dall'asse +x
 * verso +y) e elevazione `el`. `k` = pixel per metro nel punto `t`, che finisce in (cx, cy).
 */
export function persp(t: V3, az: number, el: number, d: number, k: number, cx: number, cy: number): Proj {
  const a = (az * Math.PI) / 180;
  const e = (el * Math.PI) / 180;
  const c: V3 = [t[0] + d * Math.cos(a) * Math.cos(e), t[1] + d * Math.sin(a) * Math.cos(e), t[2] + d * Math.sin(e)];
  const f = norm(sub(t, c));
  const r = norm(cross([0, 0, 1], f)); // specchiato: +x va a destra
  let u = cross(r, f);
  if (u[2] < 0) u = [-u[0], -u[1], -u[2]];
  const F = k * d;
  return (x, y, z) => {
    const p = sub([x, y, z], c);
    const dd = dot(p, f);
    return [cx + (F * dot(p, r)) / dd, cy - (F * dot(p, u)) / dd];
  };
}

/** Isometrica (proiezione parallela a 30°): per il wellness. `k` pixel per metro. */
export function iso(k: number, ox: number, oy: number): Proj {
  return (x, y, z) => [ox + (x - y) * 0.866 * k, oy + (x + y) * 0.5 * k - z * k];
}

type Pt = readonly [number, number, number];
export type Mat = readonly [string, string, string]; // classi: [sopra, faccia +y, faccia +x]

export function kit(P: Proj) {
  const s = (x: number, y: number, z: number) => P(x, y, z).map((n) => Math.round(n)).join(" ");
  const d = (...p: Pt[]) => "M" + p.map((q) => s(q[0], q[1], q[2])).join("L") + "Z";
  const quad = (c: string, ...p: Pt[]) => {
    const q = d(...p);
    return <path key={c + q} className={c} d={q} />;
  };
  /** Scatola: dx, dy, dz sono le misure. */
  const box = (m: Mat, x: number, y: number, z: number, dx: number, dy: number, dz: number) => (
    <Fragment key={`${x},${y},${z},${dx},${dy},${dz}`}>
      <path className={m[1]} d={d([x, y + dy, z + dz], [x + dx, y + dy, z + dz], [x + dx, y + dy, z], [x, y + dy, z])} />
      <path className={m[2]} d={d([x + dx, y, z + dz], [x + dx, y + dy, z + dz], [x + dx, y + dy, z], [x + dx, y, z])} />
      <path className={m[0]} d={d([x, y, z + dz], [x + dx, y, z + dz], [x + dx, y + dy, z + dz], [x, y + dy, z + dz])} />
    </Fragment>
  );
  /** Piano sul muro y = `y` (parete di destra). */
  const wy = (c: string, y: number, x0: number, x1: number, z0: number, z1: number) =>
    quad(c, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]);
  /** Piano sul muro x = `x` (parete di sinistra). */
  const wx = (c: string, x: number, y0: number, y1: number, z0: number, z1: number) =>
    quad(c, [x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]);
  /** Linea spezzata (stroke, senza riempimento). */
  const line = (stroke: string, w: number, ...p: Pt[]) => {
    const q = "M" + p.map((r) => s(r[0], r[1], r[2])).join("L");
    return <path key={stroke + q} d={q} fill="none" stroke={stroke} strokeWidth={w} />;
  };
  return { P, s, d, quad, box, wy, wx, line };
}
