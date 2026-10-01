/*
 * Geometria procedurale delle camere (DESIGN 5.1: «morbido stilizzato», smussi da 1-3 cm).
 *
 * `Acc` raccoglie le geometrie per materiale, ne cuoce il colore nei vertici (colore base x
 * occlusione ambientale finta) e le fonde con `mergeGeometries`: a fine costruzione ogni modulo
 * ha poche mesh statiche (una per materiale), con `matrixAutoUpdate = false` (MOTION 4.1).
 * Niente texture: tutto è colore per vertice.
 */

import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Euler,
  Float32BufferAttribute,
  LatheGeometry,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  Vector2,
  Vector3,
  type Group,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Risorse } from "../../lib/three/materials";

export type V3 = readonly [number, number, number];
/** Moltiplicatore di colore in un punto (coordinate del modulo) con la sua normale. */
export type Fattore = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => number;
export type Col = string | number | Color;

export type OpzAdd = {
  /** Posizione del centro. */
  p?: V3;
  /** Rotazione Euler (rad). */
  r?: V3;
  /** Rotazione attorno a Y (rad), applicata dopo `r`. */
  ry?: number;
  s?: V3 | number;
  c?: Col;
  /** Moltiplicatore locale di colore (es. pieghe della tenda). */
  f?: Fattore;
  /** false = nessuna occlusione; funzione = occlusione propria (pareti). Default: quella dell'Acc. */
  ao?: false | Fattore;
  /** Oggetti piccoli: si nascondono ai livelli lite (SPEC.nascondiPiccoli). */
  piccolo?: boolean;
};

const _m = new Matrix4();
const _q = new Quaternion();
const _e = new Euler();
const _p = new Vector3();
const _s = new Vector3();
const _c = new Color();

export class Acc {
  private liste = new Map<string, BufferGeometry[]>();
  private pila: Matrix4[] = [];
  triangoli = 0;

  constructor(private readonly aoDefault: Fattore) {}

  /** Tutto ciò che si aggiunge dentro `fn` è prima trasformato da `t` (posizione + rotazione Y). */
  con(t: { p?: V3; ry?: number; s?: number }, fn: () => void): void {
    const m = new Matrix4().compose(
      _p.set(...(t.p ?? [0, 0, 0])),
      _q.setFromEuler(_e.set(0, t.ry ?? 0, 0)),
      _s.set(t.s ?? 1, t.s ?? 1, t.s ?? 1),
    );
    this.pila.push(m.clone());
    fn();
    this.pila.pop();
  }

  add(mat: string, g0: BufferGeometry, o: OpzAdd = {}): void {
    const g = g0.index ? g0.toNonIndexed() : g0;
    if (g !== g0) g0.dispose();
    g.deleteAttribute("uv");
    const sc = typeof o.s === "number" ? ([o.s, o.s, o.s] as const) : (o.s ?? ([1, 1, 1] as const));
    _e.set(o.r?.[0] ?? 0, o.r?.[1] ?? 0, o.r?.[2] ?? 0, "YXZ");
    if (o.ry) _e.y += o.ry;
    _m.compose(_p.set(...(o.p ?? [0, 0, 0])), _q.setFromEuler(_e), _s.set(sc[0], sc[1], sc[2]));
    // pila: la più recente è la più interna
    for (let i = this.pila.length - 1; i >= 0; i--) _m.premultiply(this.pila[i]);
    g.applyMatrix4(_m);

    const pos = g.getAttribute("position");
    const nor = g.getAttribute("normal");
    const pre = g.getAttribute("color");
    const base = _c.set(o.c ?? "#ffffff");
    const br = base.r;
    const bg = base.g;
    const bb = base.b;
    const aof = o.ao === false ? null : (o.ao ?? this.aoDefault);
    const out = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const nx = nor.getX(i);
      const ny = nor.getY(i);
      const nz = nor.getZ(i);
      let f = aof ? aof(x, y, z, nx, ny, nz) : 1;
      if (o.f) f *= o.f(x, y, z, nx, ny, nz);
      out[i * 3] = br * f * (pre ? pre.getX(i) : 1);
      out[i * 3 + 1] = bg * f * (pre ? pre.getY(i) : 1);
      out[i * 3 + 2] = bb * f * (pre ? pre.getZ(i) : 1);
    }
    g.setAttribute("color", new Float32BufferAttribute(out, 3));
    const chiave = `${mat}|${o.piccolo ? "p" : "g"}`;
    let l = this.liste.get(chiave);
    if (!l) this.liste.set(chiave, (l = []));
    l.push(g);
    this.triangoli += pos.count / 3;
  }

  /* ---- scorciatoie: la base poggia a `yb` ---- */

  box(mat: string, [w, h, d]: V3, [x, yb, z]: V3, c: Col, o: OpzAdd = {}): void {
    this.add(mat, new BoxGeometry(w, h, d), { ...o, p: [x, yb + h / 2, z], c });
  }

  /** Scatola smussata (raggio `r`, 1 segmento = 108 triangoli; `seg` 2 = 300). */
  rbox(mat: string, [w, h, d]: V3, [x, yb, z]: V3, c: Col, r = 0.015, seg = 1, o: OpzAdd = {}): void {
    this.add(mat, new RoundedBoxGeometry(w, h, d, seg, r), { ...o, p: [x, yb + h / 2, z], c });
  }

  cil(mat: string, rT: number, rB: number, h: number, [x, yb, z]: V3, c: Col, n = 14, o: OpzAdd = {}): void {
    this.add(mat, new CylinderGeometry(rT, rB, h, n, 1), { ...o, p: [x, yb + h / 2, z], c });
  }

  /** Cilindro con il centro in `p` (per quelli ruotati: aste, maniglie). */
  cilC(mat: string, rT: number, rB: number, h: number, p: V3, c: Col, n = 10, o: OpzAdd = {}): void {
    this.add(mat, new CylinderGeometry(rT, rB, h, n, 1), { ...o, p, c });
  }

  sfera(mat: string, r: number, [x, y, z]: V3, c: Col, o: OpzAdd = {}): void {
    this.add(mat, new SphereGeometry(r, 7, 5), { ...o, p: [x, y, z], c });
  }

  /** Fonde per materiale e crea le mesh dentro `gruppo`. Restituisce le mesh dei piccoli. */
  costruisci(materiali: Record<string, Material>, r: Risorse, gruppo: Group): Mesh[] {
    const piccoli: Mesh[] = [];
    for (const [chiave, l] of this.liste) {
      const [mat, tipo] = chiave.split("|");
      const m = materiali[mat];
      if (!m) throw new Error(`materiale sconosciuto: ${mat}`);
      const geom = r.add(mergeGeometries(l, false) as BufferGeometry);
      for (const g of l) g.dispose();
      const mesh = new Mesh(geom, m);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      if (mat === "velo") mesh.renderOrder = 2;
      if (tipo === "p") {
        mesh.userData.piccolo = true;
        piccoli.push(mesh);
      }
      gruppo.add(mesh);
    }
    this.liste.clear();
    return piccoli;
  }
}

/* ───────────────────────── Forme ───────────────────────── */

/** Tornio: profilo [raggio, y] dal basso verso l'alto. */
export function tornio(profilo: ReadonlyArray<readonly [number, number]>, n = 18): BufferGeometry {
  return new LatheGeometry(
    profilo.map(([r, y]) => new Vector2(r, y)),
    n,
  );
}

/** Disco/cerchio piatto che guarda +z. */
export const cerchio = (r: number, n = 14): BufferGeometry => new CircleGeometry(r, n);

/**
 * Paralume a pieghe (abat-jour): tronco di cono aperto con `n` pieghe, raggio che alterna
 * fra `r` e `r * (1 - fondo)`. Centrato a y = 0..h. Ombreggiatura piatta (faccette).
 */
export function pieghe(rT: number, rB: number, h: number, n = 12, fondo = 0.1): BufferGeometry {
  const pos: number[] = [];
  const N = n * 2;
  const ring = (i: number, y: number, r: number): [number, number, number] => {
    const rr = r * (i % 2 === 0 ? 1 : 1 - fondo);
    const a = (i / N) * Math.PI * 2;
    return [Math.cos(a) * rr, y, Math.sin(a) * rr];
  };
  for (let i = 0; i < N; i++) {
    const a0 = ring(i, h, rT);
    const a1 = ring(i + 1, h, rT);
    const b0 = ring(i, 0, rB);
    const b1 = ring(i + 1, 0, rB);
    pos.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * Tenda pesante: striscia verticale di larghezza `w` e altezza `h` (piano XY, centrata in 0,0)
 * con onde in z (`n` pieghe, ampiezza `amp`). Il colore dei vertici scurisce nelle valli.
 */
export function tenda(w: number, h: number, n: number, amp: number, valli = 0.22): BufferGeometry {
  const sx = n * 4;
  const g = new PlaneGeometry(w, h, sx, 2);
  const pos = g.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / w + 0.5;
    const fase = Math.cos(u * n * Math.PI * 2);
    pos.setZ(i, amp * fase);
    const y = pos.getY(i) / h + 0.5; // 0 in basso
    const k = 1 - valli * (0.5 - 0.5 * fase) - 0.08 * (1 - y);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
  }
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/** Piano suddiviso (`PlaneGeometry`) che guarda +z. */
export const piano = (w: number, h: number, sw: number, sh: number): BufferGeometry => new PlaneGeometry(w, h, sw, sh);

/* ───────────────────────── Occlusione ───────────────────────── */

export const clampf = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
export const smooth = (t: number): number => {
  const k = clampf(t, 0, 1);
  return k * k * (3 - 2 * k);
};
export const ease = smooth;

/**
 * Ombre di contatto (DESIGN 5.4): un quad piatto per ogni ingombro [x, z, larghezza, profondità, rotY],
 * con UV 0..1 per la texture radiale condivisa. Una sola geometria = una sola draw call.
 */
export function ombreGeom(
  voci: ReadonlyArray<readonly [number, number, number, number, number?]>,
  margine = 0.22,
  y = 0.006,
): BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  for (const [cx, cz, w, d, ry = 0] of voci) {
    const hw = w / 2 + margine;
    const hd = d / 2 + margine;
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    const P = (lx: number, lz: number): [number, number, number] => [cx + lx * c + lz * s, y, cz - lx * s + lz * c];
    const a = P(-hw, -hd);
    const b = P(-hw, hd);
    const cc = P(hw, hd);
    const dd = P(hw, -hd);
    pos.push(...a, ...b, ...cc, ...a, ...cc, ...dd);
    uv.push(0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
