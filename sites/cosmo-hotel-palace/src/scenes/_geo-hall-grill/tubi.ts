/*
 * Tubi "loftati": una sezione circolare deformata che scorre lungo una curva (Catmull-Rom),
 * con raggio variabile, torsione delle scanalature, nodi e cavità. È ciò con cui si scolpisce
 * il tronco d'ulivo (0 kB di asset) e si disegnano i rami secchi e gli steli dei ficus.
 */

import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, Uint16BufferAttribute, Uint32BufferAttribute, Vector3 } from "three";

export type OpzTubo = {
  /** Punti della curva (metri). */
  punti: ReadonlyArray<readonly [number, number, number]>;
  /** Raggio base a `u` (0..1 lungo la curva). */
  raggio: (u: number) => number;
  /** Lati della sezione. */
  lati: number;
  /** Anelli lungo la curva. */
  anelli: number;
  /**
   * Deformazione della superficie: moltiplicatore del raggio (≈ 1) e "scurezza" 0..1 (per il colore).
   * `p` è la posizione già sulla superficie (senza deformazione), `th` l'angolo, `u` il parametro.
   */
  deforma?: (p: Vector3, th: number, u: number, out: { r: number; buio: number }) => void;
  /** Colore del vertice. */
  colore: (p: Vector3, u: number, th: number, buio: number, out: Color) => Color;
  /** Chiude la punta con una calotta tondeggiante negli ultimi `punta` (frazione di u). */
  punta?: number;
  /** Tipo di curva: 'centripetal' evita i cappi. */
  tensione?: number;
};

/** Costruisce il tubo come geometria indicizzata con normali lisce e colori per vertice. */
export function creaTubo(o: OpzTubo): BufferGeometry {
  const curva = new CatmullRomCurve3(
    o.punti.map((q) => new Vector3(q[0], q[1], q[2])),
    false,
    "centripetal",
    o.tensione ?? 0.5,
  );
  const R = o.anelli;
  const S = o.lati;
  const frames = curva.computeFrenetFrames(R - 1, false);
  const pos = new Float32Array(R * S * 3);
  const col = new Float32Array(R * S * 3);
  const c = new Color();
  const out = { r: 1, buio: 0 };
  const P = new Vector3();
  const q = new Vector3();
  const punta = o.punta ?? 0.1;
  for (let i = 0; i < R; i++) {
    const u = i / (R - 1);
    curva.getPointAt(u, P);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    let r0 = o.raggio(u);
    if (punta > 0 && u > 1 - punta) {
      const k = (u - (1 - punta)) / punta;
      r0 *= Math.sqrt(Math.max(0, 1 - k * k)) * 0.97 + 0.03;
    }
    for (let j = 0; j < S; j++) {
      const th = (j / S) * Math.PI * 2;
      const ct = Math.cos(th);
      const st = Math.sin(th);
      q.set(P.x + r0 * (ct * N.x + st * B.x), P.y + r0 * (ct * N.y + st * B.y), P.z + r0 * (ct * N.z + st * B.z));
      out.r = 1;
      out.buio = 0;
      if (o.deforma) o.deforma(q, th, u, out);
      const rr = r0 * out.r;
      const k = (i * S + j) * 3;
      pos[k] = P.x + rr * (ct * N.x + st * B.x);
      pos[k + 1] = P.y + rr * (ct * N.y + st * B.y);
      pos[k + 2] = P.z + rr * (ct * N.z + st * B.z);
      q.set(pos[k], pos[k + 1], pos[k + 2]);
      o.colore(q, u, th, out.buio, c);
      col[k] = c.r;
      col[k + 1] = c.g;
      col[k + 2] = c.b;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < R - 1; i++) {
    for (let j = 0; j < S; j++) {
      const j1 = (j + 1) % S;
      const a = i * S + j;
      const b = i * S + j1;
      const c1 = (i + 1) * S + j;
      const d = (i + 1) * S + j1;
      idx.push(a, c1, b, b, c1, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  g.setIndex(R * S > 65535 ? new Uint32BufferAttribute(idx, 1) : new Uint16BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}
