/*
 * Luce finta riutilizzata da hall e ristorante (DESIGN 5.3-5.4, MOTION 3.4 e 6.2). Nessuna ombra
 * in tempo reale, nessuna environment map:
 *  - `Chiazza`: la proiezione esatta di un'apertura (lucernario, finestra ad arco) sul pavimento
 *    lungo la direzione del sole, con il bordo morbido (alfa per vertice). Si muove come una meridiana.
 *  - `RaggioSole`: due piani incrociati dal lucernario alla chiazza, con la texture a fasci.
 *  - `AloniFusi`: TUTTI gli aloni delle lampade in un solo mesh (una draw call, non uno sprite l'uno).
 *    I quadrati guardano +z, cioè la camera frontale: l'alone è simmetrico e a ±35° non si nota.
 *  - `PozzeLuce`: macchie di luce additive sul pavimento sotto le lampade (la sera).
 * Solo `position`, `color`, `opacity` cambiano: nessun ricalcolo di geometria pesante.
 */

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  Uint16BufferAttribute,
  type Texture,
} from "three";
import type { Posizione3D } from "../../content/types";
import { texturaAlone } from "../../lib/three/lights";
import { Risorse, disegna, texturaCondivisa } from "../../lib/three/materials";

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export { ss as smoothstep };

/* ───────────────────────── Chiazza di sole ───────────────────────── */

export type LimitiPiano = { x: readonly [number, number]; z: readonly [number, number] };

/**
 * Ombra-luce di un'apertura sul pavimento. `contorno` = N punti del bordo dell'apertura nello spazio
 * del mondo (anche a quote diverse). Per ogni sole (`dir` = verso il sole) il contorno scende lungo
 * -dir fino a y = `yPiano`; il bordo sfuma con l'alfa per vertice.
 */
export class Chiazza {
  readonly mesh: Mesh;
  private readonly N: number;
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private readonly mat: MeshBasicMaterial;
  private readonly geom: BufferGeometry;
  private readonly tmp: Float32Array;

  constructor(
    r: Risorse,
    private readonly contorno: ReadonlyArray<readonly [number, number, number]>,
    colore: string | number = "#FFE2B0",
  ) {
    const N = (this.N = contorno.length);
    // vertici: centroide (0), anello interno (1..N), anello esterno (N+1..2N)
    const V = 1 + 2 * N;
    this.pos = new Float32Array(V * 3);
    this.col = new Float32Array(V * 4);
    this.tmp = new Float32Array(N * 2);
    const idx: number[] = [];
    for (let i = 0; i < N; i++) {
      const a = 1 + i;
      const b = 1 + ((i + 1) % N);
      idx.push(0, a, b); // ventaglio interno
      const a2 = 1 + N + i;
      const b2 = 1 + N + ((i + 1) % N);
      idx.push(a, a2, b, b, a2, b2); // bordo morbido
    }
    const g = (this.geom = r.add(new BufferGeometry()));
    g.setAttribute("position", new BufferAttribute(this.pos, 3).setUsage(35048));
    const ca = new BufferAttribute(this.col, 4);
    g.setAttribute("color", ca);
    g.setIndex(new Uint16BufferAttribute(idx, 1));
    g.boundingSphere = null;
    for (let i = 0; i < V; i++) {
      const esterno = i > N;
      this.col[i * 4] = 1;
      this.col[i * 4 + 1] = 1;
      this.col[i * 4 + 2] = 1;
      this.col[i * 4 + 3] = esterno ? 0 : 1;
    }
    this.mat = r.add(
      new MeshBasicMaterial({
        color: colore,
        vertexColors: true,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        opacity: 0,
      }),
    );
    this.mesh = new Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.mesh.visible = false;
  }

  /** Centro della chiazza sul piano (ultimo calcolo), utile al raggio. */
  readonly centro = { x: 0, z: 0 };

  aggiorna(dir: Posizione3D, yPiano: number, opacita: number, limiti: LimitiPiano, morbidezza = 0.12): void {
    const N = this.N;
    const pos = this.pos;
    const dy = Math.max(dir[1], 0.05);
    let cx = 0;
    let cz = 0;
    for (let i = 0; i < N; i++) {
      const c = this.contorno[i];
      const k = (c[1] - yPiano) / dy;
      const x = c[0] - dir[0] * k;
      const z = c[2] - dir[2] * k;
      this.tmp[i * 2] = x;
      this.tmp[i * 2 + 1] = z;
      cx += x;
      cz += z;
    }
    cx /= N;
    cz /= N;
    this.centro.x = cx;
    this.centro.z = cz;
    const y = yPiano + 0.012;
    const [x0, x1] = limiti.x;
    const [z0, z1] = limiti.z;
    const clampX = (v: number) => Math.min(x1, Math.max(x0, v));
    const clampZ = (v: number) => Math.min(z1, Math.max(z0, v));
    pos[0] = clampX(cx);
    pos[1] = y;
    pos[2] = clampZ(cz);
    for (let i = 0; i < N; i++) {
      const x = this.tmp[i * 2];
      const z = this.tmp[i * 2 + 1];
      const ki = (1 + i) * 3;
      pos[ki] = clampX(cx + (x - cx) * (1 - morbidezza));
      pos[ki + 1] = y;
      pos[ki + 2] = clampZ(cz + (z - cz) * (1 - morbidezza));
      const ke = (1 + N + i) * 3;
      pos[ke] = clampX(cx + (x - cx) * (1 + morbidezza));
      pos[ke + 1] = y;
      pos[ke + 2] = clampZ(cz + (z - cz) * (1 + morbidezza));
    }
    (this.geom.getAttribute("position") as BufferAttribute).needsUpdate = true;
    // più il centro esce dal pavimento, più la chiazza svanisce (non si schiaccia contro il bordo)
    const ex = Math.max(x0 - cx, cx - x1, 0);
    const ez = Math.max(z0 - cz, cz - z1, 0);
    const dentro = 1 - ss(0, 3.5, Math.hypot(ex, ez));
    this.mat.opacity = opacita * dentro;
    this.mesh.visible = this.mat.opacity > 0.004;
  }
}

/* ───────────────────────── Raggio volumetrico finto ───────────────────────── */

/** Fasci con bordi morbidi su tutti i lati: u = larghezza, v = lunghezza (fasci paralleli a v). */
export function texturaFasci(): Texture {
  return texturaCondivisa("fasci-hg", () =>
    disegna(
      128,
      128,
      (ctx, w, h) => {
        const img = ctx.createImageData(w, h);
        const fasci = [0.1, 0.19, 0.31, 0.43, 0.52, 0.66, 0.78, 0.89];
        const lar = [0.03, 0.05, 0.025, 0.06, 0.03, 0.045, 0.03, 0.04];
        for (let y = 0; y < h; y++) {
          const v = y / (h - 1);
          const lungo = ss(0, 0.22, v) * (1 - ss(0.7, 1, v));
          for (let x = 0; x < w; x++) {
            const u = x / (w - 1);
            const lat = ss(0, 0.16, u) * (1 - ss(0.84, 1, u));
            let f = 0.28;
            for (let k = 0; k < fasci.length; k++) f += Math.exp(-(((u - fasci[k]) / lar[k]) ** 2)) * 0.72;
            const a = Math.min(1, f) * lat * lungo;
            const i = (y * w + x) * 4;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
            img.data[i + 3] = Math.round(a * 255);
          }
        }
        ctx.putImageData(img, 0, 0);
      },
      false,
    ),
  );
}

/** Due piani incrociati dall'alto (`da`) alla chiazza (`a`): additivi, opacità ~0,18. */
export class RaggioSole {
  readonly mesh: Mesh;
  private readonly pos = new Float32Array(8 * 3);
  private readonly geom: BufferGeometry;
  private readonly mat: MeshBasicMaterial;

  constructor(r: Risorse, colore: string | number = "#FFE9C4") {
    const g = (this.geom = r.add(new BufferGeometry()));
    g.setAttribute("position", new BufferAttribute(this.pos, 3));
    g.setAttribute(
      "uv",
      new Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0], 2),
    );
    g.setIndex([0, 2, 1, 1, 2, 3, 4, 6, 5, 5, 6, 7]);
    this.mat = r.add(
      new MeshBasicMaterial({
        map: texturaFasci(),
        color: colore,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        opacity: 0,
      }),
    );
    this.mesh = new Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
    this.mesh.visible = false;
  }

  aggiorna(da: Posizione3D, a: Posizione3D, larghezzaSopra: number, larghezzaSotto: number, opacita: number): void {
    const ax = a[0] - da[0];
    const ay = a[1] - da[1];
    const az = a[2] - da[2];
    // perpendicolare 1: asse × Y (orizzontale); perpendicolare 2: asse × p1
    let p1x = -az;
    let p1y = 0;
    let p1z = ax;
    let l = Math.hypot(p1x, p1y, p1z);
    if (l < 1e-4) {
      p1x = 1;
      p1y = 0;
      p1z = 0;
      l = 1;
    }
    p1x /= l;
    p1y /= l;
    p1z /= l;
    // perpendicolare 2: asse × p1
    let p2x = ay * p1z - az * p1y;
    let p2y = az * p1x - ax * p1z;
    let p2z = ax * p1y - ay * p1x;
    l = Math.hypot(p2x, p2y, p2z) || 1;
    p2x /= l;
    p2y /= l;
    p2z /= l;
    const hs = larghezzaSopra / 2;
    const hb = larghezzaSotto / 2;
    const P = this.pos;
    const set = (k: number, bx: number, by: number, bz: number, sx: number, sy: number, sz: number, s: number) => {
      P[k * 3] = bx + sx * s;
      P[k * 3 + 1] = by + sy * s;
      P[k * 3 + 2] = bz + sz * s;
    };
    set(0, da[0], da[1], da[2], p1x, p1y, p1z, -hs);
    set(1, da[0], da[1], da[2], p1x, p1y, p1z, hs);
    set(2, a[0], a[1], a[2], p1x, p1y, p1z, -hb);
    set(3, a[0], a[1], a[2], p1x, p1y, p1z, hb);
    set(4, da[0], da[1], da[2], p2x, p2y, p2z, -hs);
    set(5, da[0], da[1], da[2], p2x, p2y, p2z, hs);
    set(6, a[0], a[1], a[2], p2x, p2y, p2z, -hb);
    set(7, a[0], a[1], a[2], p2x, p2y, p2z, hb);
    (this.geom.getAttribute("position") as BufferAttribute).needsUpdate = true;
    this.mat.opacity = opacita;
    this.mesh.visible = opacita > 0.004;
  }
}

/* ───────────────────────── Aloni fusi in una draw call ───────────────────────── */

export type PuntoAlone = { pos: Posizione3D; raggio: number; intensita?: number };

/**
 * Quadrati additivi con l'alone condiviso, tutti nello stesso mesh. Il colore per vertice porta
 * l'intensità relativa di ogni alone; `setOpacita` accende tutto insieme.
 */
export class AloniFusi {
  readonly mesh: Mesh;
  private readonly mat: MeshBasicMaterial;

  constructor(r: Risorse, punti: readonly PuntoAlone[], colore: string | number = "#F2C27A") {
    const n = punti.length;
    const pos = new Float32Array(n * 12);
    const col = new Float32Array(n * 12);
    const uv = new Float32Array(n * 8);
    const idx: number[] = [];
    punti.forEach((p, i) => {
      const [x, y, z] = p.pos;
      const h = p.raggio;
      const k = i * 12;
      pos.set([x - h, y + h, z, x + h, y + h, z, x - h, y - h, z, x + h, y - h, z], k);
      const w = p.intensita ?? 1;
      for (let j = 0; j < 4; j++) col.set([w, w, w], k + j * 3);
      uv.set([0, 1, 1, 1, 0, 0, 1, 0], i * 8);
      const b = i * 4;
      idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    });
    const g = r.add(new BufferGeometry());
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new Float32BufferAttribute(col, 3));
    g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
    g.setIndex(new Uint16BufferAttribute(idx, 1));
    this.mat = r.add(
      new MeshBasicMaterial({
        map: texturaAlone(),
        color: new Color(colore),
        vertexColors: true,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        opacity: 0,
      }),
    );
    this.mesh = new Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
    this.mesh.visible = false;
  }

  setOpacita(v: number): void {
    this.mat.opacity = v;
    this.mesh.visible = v > 0.003;
  }
}

/** Macchie di luce sul pavimento (quadrati orizzontali con l'alone), una draw call. */
export class PozzeLuce {
  readonly mesh: Mesh;
  private readonly mat: MeshBasicMaterial;

  constructor(r: Risorse, punti: readonly PuntoAlone[], y = 0.014, colore: string | number = "#FFB867") {
    const n = punti.length;
    const pos = new Float32Array(n * 12);
    const col = new Float32Array(n * 12);
    const uv = new Float32Array(n * 8);
    const idx: number[] = [];
    punti.forEach((p, i) => {
      const [x, , z] = p.pos;
      const h = p.raggio;
      const k = i * 12;
      pos.set([x - h, y, z - h, x + h, y, z - h, x - h, y, z + h, x + h, y, z + h], k);
      const w = p.intensita ?? 1;
      for (let j = 0; j < 4; j++) col.set([w, w, w], k + j * 3);
      uv.set([0, 1, 1, 1, 0, 0, 1, 0], i * 8);
      const b = i * 4;
      idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    });
    const g = r.add(new BufferGeometry());
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new Float32BufferAttribute(col, 3));
    g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
    g.setIndex(new Uint16BufferAttribute(idx, 1));
    this.mat = r.add(
      new MeshBasicMaterial({
        map: texturaAlone(),
        color: new Color(colore),
        vertexColors: true,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        opacity: 0,
        side: DoubleSide,
      }),
    );
    this.mesh = new Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.mesh.visible = false;
  }

  setOpacita(v: number): void {
    this.mat.opacity = v;
    this.mesh.visible = v > 0.003;
  }
}
