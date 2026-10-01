/*
 * Architettura procedurale comune a hall e ristorante: muri con aperture (ExtrudeGeometry di una
 * sagoma con fori), profili d'acciaio fra due punti, poligoni di vetro, finestre ad arco, tendaggi.
 * Tutto confluisce in `Fusione` (poche draw call, colori per vertice).
 */

import {
  BoxGeometry,
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Matrix4,
  Path,
  PlaneGeometry,
  Quaternion,
  Shape,
  Vector3,
} from "three";
import { Fusione } from "./fusione";
import { fbm3 } from "./rumore";

export type Apertura =
  | { tipo: "arco"; s: number; w: number; y0: number; yMolla: number }
  | { tipo: "rett"; s: number; w: number; y0: number; y1: number };

/**
 * Muro con aperture (ExtrudeGeometry di una sagoma con fori), faccia interna sul piano `fisso`,
 * spessore verso l'esterno. `asse` = direzione del muro ('x': muro a z = fisso; 'z': muro a x = fisso).
 * `ni` = verso della normale interna (+1/-1 lungo l'altro asse). `s` delle aperture = coordinata
 * mondo lungo l'asse. Restituisce la geometria già nel mondo.
 */
export function muro(
  asse: "x" | "z",
  fisso: number,
  ni: 1 | -1,
  da: number,
  a: number,
  alto: number,
  aperture: readonly Apertura[],
  spessore: number,
): BufferGeometry {
  const mezzo = (da + a) / 2;
  const up = new Vector3(0, 1, 0);
  const fuori = asse === "x" ? new Vector3(0, 0, -ni) : new Vector3(-ni, 0, 0);
  const u = new Vector3().crossVectors(up, fuori); // asse locale x
  const centro = asse === "x" ? new Vector3(mezzo, 0, fisso) : new Vector3(fisso, 0, mezzo);
  const m = new Matrix4().makeBasis(u, up, fuori).setPosition(centro);
  const lungo = asse === "x" ? new Vector3(1, 0, 0) : new Vector3(0, 0, 1);
  const sg = u.dot(lungo); // ±1: verso dell'asse locale rispetto alle coordinate mondo
  const lx = (s: number) => (s - mezzo) * sg;
  const w = a - da;
  const forma = new Shape();
  forma.moveTo(-w / 2, 0);
  forma.lineTo(w / 2, 0);
  forma.lineTo(w / 2, alto);
  forma.lineTo(-w / 2, alto);
  forma.lineTo(-w / 2, 0);
  for (const ap of aperture) {
    const p = new Path();
    const cx = lx(ap.s);
    if (ap.tipo === "arco") {
      p.moveTo(cx - ap.w / 2, ap.y0);
      p.lineTo(cx + ap.w / 2, ap.y0);
      p.lineTo(cx + ap.w / 2, ap.yMolla);
      p.absarc(cx, ap.yMolla, ap.w / 2, 0, Math.PI, false);
      p.lineTo(cx - ap.w / 2, ap.y0);
    } else {
      p.moveTo(cx - ap.w / 2, ap.y0);
      p.lineTo(cx + ap.w / 2, ap.y0);
      p.lineTo(cx + ap.w / 2, ap.y1);
      p.lineTo(cx - ap.w / 2, ap.y1);
      p.lineTo(cx - ap.w / 2, ap.y0);
    }
    forma.holes.push(p);
  }
  const g = new ExtrudeGeometry(forma, { depth: spessore, bevelEnabled: false, curveSegments: 12 });
  g.applyMatrix4(m);
  return g;
}

const _u = new BoxGeometry(1, 1, 1);
const _q = new Quaternion();
const _z = new Vector3(0, 0, 1);

/** Barra (profilo) fra due punti, sezione quadrata `t`. */
export function barra(
  f: Fusione,
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
  colore: string | number,
  tinta?: (x: number, y: number, z: number, nx: number, ny: number, nz: number) => number,
): void {
  const d = new Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = d.length();
  if (len < 1e-4) return;
  _q.setFromUnitVectors(_z, d.normalize());
  const m = new Matrix4().compose(new Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), _q, new Vector3(t, t, len));
  f.aggiungi(_u, colore, m, tinta);
}

/** Poligono convesso (ventaglio) a facce doppie, per vetri. */
export function poligono(f: Fusione, pts: ReadonlyArray<readonly [number, number, number]>, colore: string | number): void {
  const pos: number[] = [];
  const idx: number[] = [];
  for (const p of pts) pos.push(p[0], p[1], p[2]);
  for (let i = 1; i < pts.length - 1; i++) idx.push(0, i, i + 1);
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  f.aggiungi(g, colore);
  g.dispose();
}


/**
 * Finestra ad arco nello spazio locale (x lungo il muro, y in alto, z uscente) trasformata da `m`:
 * vetro (poligono), montante centrale, traverso, contorno ad arco. `acc` = profili, `vetri` = vetro.
 */
export function finestraArco(
  acc: Fusione,
  vetri: Fusione,
  m: Matrix4,
  w: number,
  y0: number,
  yMolla: number,
  colore: string | number,
): void {
  const P = (x: number, y: number): [number, number, number] => {
    const v = new Vector3(x, y, 0).applyMatrix4(m);
    return [v.x, v.y, v.z];
  };
  const nA = 10;
  const pts: [number, number, number][] = [P(-w / 2, y0), P(w / 2, y0)];
  for (let i = 0; i <= nA; i++) {
    const a = (i / nA) * Math.PI;
    pts.push(P((w / 2) * Math.cos(a), yMolla + (w / 2) * Math.sin(a)));
  }
  poligono(vetri, pts, 0xffffff);
  barra(acc, P(0, y0), P(0, yMolla + w / 2), 0.05, colore);
  barra(acc, P(-w / 2, yMolla - 0.9), P(w / 2, yMolla - 0.9), 0.05, colore);
  for (let i = 0; i < nA; i++) {
    const a0 = (i / nA) * Math.PI;
    const a1 = ((i + 1) / nA) * Math.PI;
    barra(acc, P((w / 2) * Math.cos(a0), yMolla + (w / 2) * Math.sin(a0)), P((w / 2) * Math.cos(a1), yMolla + (w / 2) * Math.sin(a1)), 0.07, colore);
  }
  barra(acc, P(-w / 2, y0), P(-w / 2, yMolla), 0.07, colore);
  barra(acc, P(w / 2, y0), P(w / 2, yMolla), 0.07, colore);
}

/** Tendaggio: piano con pieghe verticali (seno + rumore). Restituisce la geometria in locale. */
export function tendaGeom(w: number, h: number, passo: number, ampiezza: number, seme: number): PlaneGeometry {
  const nx = Math.max(8, Math.round(w / 0.1));
  const g = new PlaneGeometry(w, h, nx, 6);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const piega = Math.sin((x / passo) * Math.PI * 2 + y * 0.18 + seme) * ampiezza * (0.55 + 0.45 * (1 - (y + h / 2) / h));
    pos.setZ(i, piega + (fbm3(x * 1.2, y * 0.4, seme, 6) - 0.5) * 0.05);
  }
  g.computeVertexNormals();
  return g;
}
