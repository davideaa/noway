/*
 * Fusione: accumula molte geometrie in UNA (posizioni, normali, colori per vertice, UV planari).
 * Serve a tenere basse le draw call (DESIGN 5.5): ogni arredo si "cuoce" in un solo mesh con colori
 * per vertice (DESIGN 5.1: tono variabile per vertice, occlusione cotta). Niente texture fotografiche.
 *
 * Contiene anche la scatola smussata (44 triangoli, smusso da 1-3 cm che cattura la luce).
 */

import {
  BufferGeometry,
  Color,
  Euler,
  Float32BufferAttribute,
  Matrix3,
  Matrix4,
  Quaternion,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  Vector3,
  type ColorRepresentation,
} from "three";

/** Moltiplicatore di luminosità del vertice, nello spazio dell'oggetto già trasformato. */
export type Tinta = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => number;

export type FunzioneColore = (x: number, y: number, z: number, nx: number, ny: number, nz: number, out: Color) => Color;

const _v = new Vector3();
const _n = new Vector3();
const _c = new Color();
const _nm = new Matrix3();

/** Matrice da posizione, rotazione (radianti, ordine YXZ) e scala. */
export function mat(
  x = 0,
  y = 0,
  z = 0,
  rotY = 0,
  scala: number | readonly [number, number, number] = 1,
  rotX = 0,
  rotZ = 0,
): Matrix4 {
  const s = typeof scala === "number" ? ([scala, scala, scala] as const) : scala;
  return new Matrix4().compose(
    new Vector3(x, y, z),
    new Quaternion().setFromEuler(new Euler(rotX, rotY, rotZ, "YXZ")),
    new Vector3(s[0], s[1], s[2]),
  );
}

export class Fusione {
  private p: number[] = [];
  private n: number[] = [];
  private c: number[] = [];
  private uv: number[] = [];
  private idx: number[] = [];
  private base = 0;
  /** Lato in metri coperto da una ripetizione di texture sulle UV planari. */
  constructor(private readonly latoUV = 3) {}

  get triangoli(): number {
    return this.idx.length / 3;
  }

  /**
   * Aggiunge `geom` trasformata da `m`, colorata con `colore` e, se data, `tinta`.
   * `colore` può anche essere una funzione che restituisce un colore per vertice.
   */
  aggiungi(
    geom: BufferGeometry,
    colore: ColorRepresentation | null | FunzioneColore,
    m?: Matrix4,
    tinta?: Tinta,
  ): this {
    const pos = geom.getAttribute("position");
    let nor = geom.getAttribute("normal");
    if (!nor) {
      geom.computeVertexNormals();
      nor = geom.getAttribute("normal");
    }
    if (m) _nm.getNormalMatrix(m);
    const dalla = colore === null ? geom.getAttribute("color") : null;
    const fisso = typeof colore === "function" || colore === null ? null : new Color(colore);
    const L = this.latoUV;
    for (let i = 0; i < pos.count; i++) {
      _v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      _n.set(nor.getX(i), nor.getY(i), nor.getZ(i));
      if (m) {
        _v.applyMatrix4(m);
        _n.applyMatrix3(_nm);
      }
      _n.normalize();
      this.p.push(_v.x, _v.y, _v.z);
      this.n.push(_n.x, _n.y, _n.z);
      const col = dalla
        ? _c.setRGB(dalla.getX(i), dalla.getY(i), dalla.getZ(i))
        : fisso
          ? _c.copy(fisso)
          : (colore as FunzioneColore)(_v.x, _v.y, _v.z, _n.x, _n.y, _n.z, _c);
      const f = tinta ? tinta(_v.x, _v.y, _v.z, _n.x, _n.y, _n.z) : 1;
      this.c.push(col.r * f, col.g * f, col.b * f);
      // UV planari secondo l'asse dominante della normale
      const ax = Math.abs(_n.x);
      const ay = Math.abs(_n.y);
      const az = Math.abs(_n.z);
      if (ay >= ax && ay >= az) this.uv.push(_v.x / L, _v.z / L);
      else if (ax >= az) this.uv.push(_v.z / L, _v.y / L);
      else this.uv.push(_v.x / L, _v.y / L);
    }
    const index = geom.index;
    if (index) for (let i = 0; i < index.count; i++) this.idx.push(index.getX(i) + this.base);
    else for (let i = 0; i < pos.count; i++) this.idx.push(i + this.base);
    this.base += pos.count;
    return this;
  }

  costruisci(): BufferGeometry {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(this.p, 3));
    g.setAttribute("normal", new Float32BufferAttribute(this.n, 3));
    g.setAttribute("color", new Float32BufferAttribute(this.c, 3));
    g.setAttribute("uv", new Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.base > 65535 ? new Uint32BufferAttribute(this.idx, 1) : new Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

/* ───────────────────────── Scatola smussata ───────────────────────── */

/**
 * Parallelepipedo con smusso piatto `c` (m) su tutti gli spigoli: 6 facce + 12 strisce + 8 angoli
 * = 44 triangoli, normali piatte (lo smusso prende la luce). Centrato nell'origine.
 */
export function scatolaSmussata(w: number, h: number, d: number, c = 0.015): BufferGeometry {
  const hh = [w / 2, h / 2, d / 2];
  const k = Math.min(c, hh[0] * 0.9, hh[1] * 0.9, hh[2] * 0.9);
  const pos: number[] = [];
  const nor: number[] = [];
  const a = new Vector3();
  const b = new Vector3();
  const cc = new Vector3();
  const nn = new Vector3();
  const tri = (p0: number[], p1: number[], p2: number[]) => {
    a.set(p0[0], p0[1], p0[2]);
    b.set(p1[0], p1[1], p1[2]);
    cc.set(p2[0], p2[1], p2[2]);
    nn.crossVectors(b.clone().sub(a), cc.clone().sub(a));
    const cen = a.clone().add(b).add(cc);
    const flip = nn.dot(cen) < 0;
    nn.normalize();
    if (flip) nn.negate();
    const t = flip ? [p0, p2, p1] : [p0, p1, p2];
    for (const q of t) {
      pos.push(q[0], q[1], q[2]);
      nor.push(nn.x, nn.y, nn.z);
    }
  };
  const quad = (p0: number[], p1: number[], p2: number[], p3: number[]) => {
    tri(p0, p1, p2);
    tri(p0, p2, p3);
  };
  const S = [-1, 1];
  // facce principali
  for (const s of S) {
    quad(
      [s * hh[0], hh[1] - k, hh[2] - k],
      [s * hh[0], -(hh[1] - k), hh[2] - k],
      [s * hh[0], -(hh[1] - k), -(hh[2] - k)],
      [s * hh[0], hh[1] - k, -(hh[2] - k)],
    );
    quad(
      [hh[0] - k, s * hh[1], hh[2] - k],
      [-(hh[0] - k), s * hh[1], hh[2] - k],
      [-(hh[0] - k), s * hh[1], -(hh[2] - k)],
      [hh[0] - k, s * hh[1], -(hh[2] - k)],
    );
    quad(
      [hh[0] - k, hh[1] - k, s * hh[2]],
      [-(hh[0] - k), hh[1] - k, s * hh[2]],
      [-(hh[0] - k), -(hh[1] - k), s * hh[2]],
      [hh[0] - k, -(hh[1] - k), s * hh[2]],
    );
  }
  // strisce di smusso: spigoli paralleli a z (x,y), a y (x,z), a x (y,z)
  for (const sx of S)
    for (const sy of S) {
      quad(
        [sx * hh[0], sy * (hh[1] - k), hh[2] - k],
        [sx * (hh[0] - k), sy * hh[1], hh[2] - k],
        [sx * (hh[0] - k), sy * hh[1], -(hh[2] - k)],
        [sx * hh[0], sy * (hh[1] - k), -(hh[2] - k)],
      );
      quad(
        [sx * hh[0], hh[1] - k, sy * (hh[2] - k)],
        [sx * (hh[0] - k), hh[1] - k, sy * hh[2]],
        [sx * (hh[0] - k), -(hh[1] - k), sy * hh[2]],
        [sx * hh[0], -(hh[1] - k), sy * (hh[2] - k)],
      );
      quad(
        [hh[0] - k, sx * hh[1], sy * (hh[2] - k)],
        [hh[0] - k, sx * (hh[1] - k), sy * hh[2]],
        [-(hh[0] - k), sx * (hh[1] - k), sy * hh[2]],
        [-(hh[0] - k), sx * hh[1], sy * (hh[2] - k)],
      );
    }
  // angoli
  for (const sx of S)
    for (const sy of S)
      for (const sz of S) {
        tri(
          [sx * hh[0], sy * (hh[1] - k), sz * (hh[2] - k)],
          [sx * (hh[0] - k), sy * hh[1], sz * (hh[2] - k)],
          [sx * (hh[0] - k), sy * (hh[1] - k), sz * hh[2]],
        );
      }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  return g;
}
