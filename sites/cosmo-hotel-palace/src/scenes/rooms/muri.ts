/*
 * Pareti a piano singolo (solo la faccia interna): dal di fuori si vedono "attraverso" (taglio da
 * casa di bambola, MOTION 4.1), quindi la camera si legge da qualunque azimut dell'orbita.
 * Un tappo sul bordo superiore e ai lati dà loro lo spessore di 14 cm.
 */

import { Acc, type Col, type Fattore, piano } from "./geo";

export const SPESSORE = 0.14;

export type Apertura = { u0: number; u1: number; v0: number; v1: number };

export type OpzMuro = {
  /** "x": parete lungo x a z = pos. "z": parete lungo z a x = pos. */
  asse: "x" | "z";
  pos: number;
  da: number;
  a: number;
  /** quota di partenza (default 0) e di arrivo */
  v0?: number;
  v1: number;
  /** verso della normale (la faccia visibile) lungo l'asse perpendicolare */
  dir: 1 | -1;
  aperture?: readonly Apertura[];
  c?: Col;
  ao: Fattore;
  /** tappi: sopra e alle due estremità (default tutti) */
  tappi?: { su?: boolean; da?: boolean; a?: boolean };
};

const PASSO = 0.45;

export function muro(a: Acc, o: OpzMuro): void {
  const v0 = o.v0 ?? 0;
  const c = o.c ?? "#ffffff";
  const rect = (u0: number, u1: number, va: number, vb: number) => {
    if (u1 - u0 < 1e-4 || vb - va < 1e-4) return;
    // un filo di sovrapposizione: niente crepe fra i pezzi
    const e = 0.004;
    u0 -= e;
    u1 += e;
    va -= e;
    vb += e;
    const g = piano(u1 - u0, vb - va, Math.max(1, Math.ceil((u1 - u0) / PASSO)), Math.max(1, Math.ceil((vb - va) / PASSO)));
    const pu = (u0 + u1) / 2;
    const pv = (va + vb) / 2;
    if (o.asse === "x") a.add("parete", g, { p: [pu, pv, o.pos], ry: o.dir === 1 ? 0 : Math.PI, c, ao: o.ao });
    else a.add("parete", g, { p: [o.pos, pv, pu], ry: o.dir === 1 ? Math.PI / 2 : -Math.PI / 2, c, ao: o.ao });
  };
  const ap = [...(o.aperture ?? [])].sort((p, q) => p.u0 - q.u0);
  let u = o.da;
  for (const x of ap) {
    rect(u, x.u0, v0, o.v1);
    rect(x.u0, x.u1, v0, x.v0);
    rect(x.u0, x.u1, x.v1, o.v1);
    u = x.u1;
  }
  rect(u, o.a, v0, o.v1);

  // tappi: il muro è spesso 14 cm "dietro" la faccia visibile
  const t = o.tappi ?? {};
  const dietro = -o.dir * (SPESSORE / 2);
  const len = o.a - o.da;
  const mid = (o.da + o.a) / 2;
  if (t.su !== false) {
    if (o.asse === "x") a.box("parete", [len, 0.03, SPESSORE], [mid, o.v1, o.pos + dietro], "#ffffff", { ao: false });
    else a.box("parete", [SPESSORE, 0.03, len], [o.pos + dietro, o.v1, mid], "#ffffff", { ao: false });
  }
  const alt = o.v1 - v0;
  for (const [attivo, u1, verso] of [
    [t.da !== false, o.da, -1],
    [t.a !== false, o.a, 1],
  ] as const) {
    if (!attivo) continue;
    const uu = u1 + verso * 0.005;
    if (o.asse === "x") a.box("parete", [0.01, alt, SPESSORE], [uu, v0, o.pos + dietro], "#F4F0E8", { ao: false });
    else a.box("parete", [SPESSORE, alt, 0.01], [o.pos + dietro, v0, uu], "#F4F0E8", { ao: false });
  }
}
