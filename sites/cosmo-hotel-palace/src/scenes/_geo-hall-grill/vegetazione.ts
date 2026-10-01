/*
 * Piante stilizzate (DESIGN 5.2): fusto sottile e chioma a grumi lisci color foglia, in vaso.
 * Tutto cuocibile in una `Fusione` (una draw call per tutte le piante di una scena).
 */

import { Color, CylinderGeometry, IcosahedronGeometry, LatheGeometry, Vector2 } from "three";
import { Fusione, mat } from "./fusione";
import { caso, fbm3 } from "./rumore";
import { creaTubo } from "./tubi";

const SCURA = new Color("#4F6B45");
const CHIARA = new Color("#A9BC95");
const FUSTO = new Color("#6A4A2E");

export type OpzPianta = {
  x: number;
  z: number;
  /** Altezza totale (m). */
  h: number;
  /** Colore del vaso. */
  vaso?: string;
  /** Diametro del vaso (m). */
  dVaso?: number;
  seme?: number;
  /** 1 = chioma piena (8 grumi), 0,6 = ridotta. */
  dettaglio?: number;
  /** Senza vaso (alberi esterni). */
  senzaVaso?: boolean;
};

/** Chioma: grumi (icosaedri smussati e deformati) con colore per vertice. */
function chioma(f: Fusione, cx: number, cy: number, cz: number, raggio: number, n: number, seme: number): void {
  for (let i = 0; i < n; i++) {
    const a = caso(i, seme) * Math.PI * 2;
    const rr = i === 0 ? 0 : raggio * (0.45 + 0.35 * caso(i + 40, seme));
    const px = cx + Math.cos(a) * rr;
    const pz = cz + Math.sin(a) * rr;
    const py = cy + (i === 0 ? raggio * 0.35 : (caso(i + 80, seme) - 0.35) * raggio * 0.9);
    const r = raggio * (i === 0 ? 0.78 : 0.5 + 0.22 * caso(i + 120, seme));
    const g = new IcosahedronGeometry(r, 1);
    f.aggiungi(
      g,
      (x, y, z, nx, ny, nz, out) => {
        const n3 = fbm3(x * 2.4, y * 2.4, z * 2.4, seme + 9);
        const k = 0.3 + 0.45 * (ny * 0.5 + 0.5) + 0.35 * (n3 - 0.5);
        return out.copy(SCURA).lerp(CHIARA, Math.min(1, Math.max(0, k)));
      },
      mat(px, py, pz, caso(i + 5, seme) * 6, [1, 0.82, 1]),
    );
  }
}

export function aggiungiPianta(f: Fusione, o: OpzPianta): void {
  const seme = o.seme ?? 1;
  const det = o.dettaglio ?? 1;
  const dV = o.dVaso ?? 0.7;
  let baseY = 0;
  if (!o.senzaVaso) {
    const hV = dV * 0.85;
    const profilo = [
      new Vector2(0.001, 0),
      new Vector2(dV * 0.42, 0),
      new Vector2(dV * 0.5, hV * 0.12),
      new Vector2(dV * 0.5, hV * 0.9),
      new Vector2(dV * 0.54, hV),
      new Vector2(dV * 0.46, hV),
      new Vector2(dV * 0.44, hV * 0.93),
      new Vector2(0.001, hV * 0.93),
    ];
    f.aggiungi(new LatheGeometry(profilo, 16), o.vaso ?? "#E8E1D2", mat(o.x, 0, o.z), (x, y) => 0.8 + 0.2 * Math.min(1, y / (hV * 0.9)));
    // terra
    f.aggiungi(new CylinderGeometry(dV * 0.43, dV * 0.43, 0.02, 14), "#4A3A2A", mat(o.x, hV * 0.9, o.z));
    baseY = hV * 0.93;
  }
  const hFusto = o.h - baseY;
  const lean = (caso(1, seme) - 0.5) * 0.3;
  f.aggiungi(
    creaTubo({
      punti: [[0, baseY - 0.02, 0], [lean * 0.4, baseY + hFusto * 0.35, 0.02], [lean, baseY + hFusto * 0.65, -0.02], [lean * 1.2, baseY + hFusto * 0.9, 0]],
      raggio: (u) => 0.075 - 0.04 * u,
      lati: Math.max(5, Math.round(7 * det)),
      anelli: Math.max(5, Math.round(9 * det)),
      punta: 0,
      colore: (_q, u, _th, _b, out) => out.copy(FUSTO).multiplyScalar(0.85 + 0.3 * (1 - u)),
    }),
    null,
    mat(o.x, 0, o.z),
  );
  const rC = Math.min(0.95, 0.3 + o.h * 0.17);
  chioma(f, o.x + lean * 1.1, baseY + hFusto * 0.78, o.z, rC, Math.max(4, Math.round(8 * det)), seme);
}
