/*
 * Guscio di un modulo da 22 m² (5,4 x 4,1 m, parete 2,7 m). Coordinate del modulo: x da -2,7 a 2,7
 * (sinistra-destra), z da -2,05 (parete di fondo) a 2,05 (davanti, aperto), y verso l'alto.
 *
 * Il modulo è disegnato SEMPRE nello stesso "spazio A": parete esterna a sinistra (finestra e
 * ingresso), bagno dietro la parete di fondo a destra, tramezzo comune a destra. I moduli B si
 * ottengono specchiando il gruppo (scale.x = -1): three inverte da solo il verso delle facce.
 */

import { Float32BufferAttribute, Mesh, PlaneGeometry } from "three";
import { type Acc, clampf, type Fattore } from "./geo";
import { muro, type Apertura } from "./muri";
import { K, type Ctx } from "./tipi";

export const HX = 2.7;
export const HZ = 2.05;
export const HW = 2.7;
/** Altezza del tramezzo "tagliato" davanti (casa di bambola). */
export const H_BASSO = 1.0;

export type CfgStruttura = {
  partizione: "nessuna" | "comunicante" | "muro";
  finestra: "sinistra" | "fondo";
};

/** Occlusione dei mobili: contatto con il pavimento e con le pareti di fondo/sinistra. */
export const aoLocale: Fattore = (_x, y) => clampf(1 - 0.32 * Math.exp(-Math.max(0, y) / 0.09), 0.55, 1);

export const aoMobili: Fattore = (x, y, z) =>
  clampf(1 - 0.32 * Math.exp(-Math.max(0, y) / 0.09) - 0.1 * Math.exp(-Math.max(0, z + HZ) / 0.3) - 0.08 * Math.exp(-Math.max(0, x + HX) / 0.3), 0.5, 1);

export function aoPareti(partizione: CfgStruttura["partizione"]): Fattore {
  return (x, y, z, nx, _ny, nz) => {
    let f = 1 - 0.2 * Math.exp(-Math.max(0, y) / 0.42);
    if (nz > 0.5) {
      f -= 0.14 * Math.exp(-Math.max(0, x + HX) / 0.5);
      if (partizione !== "nessuna") f -= 0.1 * Math.exp(-Math.max(0, HX - x) / 0.45);
    } else if (nx > 0.5) f -= 0.15 * Math.exp(-Math.max(0, z + HZ) / 0.5);
    else if (nx < -0.5) f -= 0.1 * Math.exp(-Math.max(0, z + HZ) / 0.5);
    // la parte alta della parete si alleggerisce appena
    f += 0.03 * clampf((y - 1.6) / 1.1, 0, 1);
    return clampf(f, 0.5, 1.04);
  };
}

/** Pavimento in parquet: piano con occlusione agli angoli (colori per vertice, materiale con mappa). */
export function pavimento(c: Ctx, cfg: CfgStruttura): Mesh {
  const g = c.r.add(new PlaneGeometry(2 * HX, 2 * HZ, 27, 21));
  g.rotateX(-Math.PI / 2);
  const pos = g.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let f = 1 - 0.3 * Math.exp(-(z + HZ) / 0.38) - 0.22 * Math.exp(-(x + HX) / 0.42);
    if (cfg.partizione !== "nessuna") f -= 0.2 * Math.exp(-(HX - x) / 0.38) * (z < -0.2 ? 1 : 0.55);
    // il bagno e la parete di fondo: l'angolo destro in fondo
    f -= 0.08 * Math.exp(-(HX - x) / 0.6) * Math.exp(-(z + HZ) / 0.6);
    const k = clampf(f, 0.55, 1);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
  }
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  const m = new Mesh(g, c.mat.pav);
  m.matrixAutoUpdate = false;
  m.updateMatrix();
  return m;
}

/* ───────────────────────── Aperture ───────────────────────── */

/** Bagno dietro la parete di fondo, a destra: x da 0,95 a 2,7, z da -3,95 a -2,05. */
export const BAGNO = { x0: 0.95, x1: HX, z0: -3.95, z1: -HZ } as const;
export const PORTA_BAGNO = { u0: 1.65, u1: 2.45 } as const;
export const PORTA_COM = { u0: -1.95, u1: -1.05 } as const;
export const PORTA_ING = { u0: 1.05, u1: 1.9 } as const;
export const FINESTRA_SX = { u0: -1.3, u1: 0.3, v0: 0.35, v1: 2.45 } as const;
export const FINESTRA_FONDO = { u0: -2.1, u1: -0.9, v0: 0.9, v1: 2.4 } as const;

export function struttura(a: Acc, cfg: CfgStruttura): void {
  const ao = aoPareti(cfg.partizione);
  const PORTA_H = 2.1;

  // solaio (l'orlo che si vede davanti e ai lati)
  a.box("solido", [2 * HX, 0.24, 2 * HZ], [0, -0.25, 0], K.cemento, { ao: false, f: (_x, y) => 0.8 + 0.2 * clampf((y + 0.24) / 0.24, 0, 1) });

  /* ---- parete di fondo ---- */
  const aFondo: Apertura[] = [{ u0: PORTA_BAGNO.u0, u1: PORTA_BAGNO.u1, v0: 0, v1: PORTA_H }];
  if (cfg.finestra === "fondo") aFondo.push(FINESTRA_FONDO);
  muro(a, { asse: "x", pos: -HZ, da: -HX, a: HX, v1: HW, dir: 1, aperture: aFondo, ao });

  /* ---- parete di sinistra (esterna) ---- */
  const aSx: Apertura[] = [{ u0: PORTA_ING.u0, u1: PORTA_ING.u1, v0: 0, v1: PORTA_H }];
  if (cfg.finestra === "sinistra") aSx.push(FINESTRA_SX);
  muro(a, { asse: "z", pos: -HX, da: -HZ, a: HZ, v1: HW, dir: 1, aperture: aSx, ao });

  /* ---- tramezzo di destra: tutta altezza solo sul fondo, poi basso (taglio) ---- */
  if (cfg.partizione !== "nessuna") {
    const aPart: Apertura[] = cfg.partizione === "comunicante" ? [{ u0: PORTA_COM.u0, u1: PORTA_COM.u1, v0: 0, v1: PORTA_H }] : [];
    muro(a, { asse: "z", pos: HX, da: -HZ, a: -0.3, v1: HW, dir: -1, aperture: aPart, ao, tappi: { a: true } });
    muro(a, { asse: "z", pos: HX, da: -0.3, a: HZ, v1: H_BASSO, dir: -1, ao, tappi: { da: false } });
    // fianco del muro alto dove si abbassa (si vede dalla camera)
    a.box("parete", [0.14, HW - H_BASSO, 0.02], [HX + 0.07, H_BASSO, -0.3], "#F4F0E8", { ao: false });
  }

  /* ---- zoccolini ---- */
  const zoccoloX = (x0: number, x1: number) =>
    a.box("solido", [x1 - x0, 0.09, 0.025], [(x0 + x1) / 2, 0, -HZ + 0.013], K.rovereS, { ao: false });
  const zoccoloZ = (z0: number, z1: number) =>
    a.box("solido", [0.025, 0.09, z1 - z0], [-HX + 0.013, 0, (z0 + z1) / 2], K.rovereS, { ao: false });
  zoccoloX(-HX, PORTA_BAGNO.u0);
  zoccoloX(PORTA_BAGNO.u1, HX);
  zoccoloZ(-HZ, PORTA_ING.u0);
  zoccoloZ(PORTA_ING.u1, HZ);
}

/**
 * Cornice di una porta (montanti e architrave) sul lato della parete rivolto alla stanza
 * (`dir` = verso della normale della parete: 1 fondo e sinistra, -1 destra).
 */
export function telaioPorta(a: Acc, asse: "x" | "z", pos: number, u0: number, u1: number, h: number, dir: 1 | -1 = 1): void {
  const w = 0.06;
  const L = u1 - u0;
  const o = pos + dir * 0.02;
  const t = 0.1;
  if (asse === "x") {
    a.box("solido", [w, h, t], [u0 - w / 2 + 0.01, 0, o], K.telaio, { ao: false });
    a.box("solido", [w, h, t], [u1 + w / 2 - 0.01, 0, o], K.telaio, { ao: false });
    a.box("solido", [L + 2 * w, w, t], [(u0 + u1) / 2, h, o], K.telaio, { ao: false });
  } else {
    a.box("solido", [t, h, w], [o, 0, u0 - w / 2 + 0.01], K.telaio, { ao: false });
    a.box("solido", [t, h, w], [o, 0, u1 + w / 2 - 0.01], K.telaio, { ao: false });
    a.box("solido", [t, w, L + 2 * w], [o, h, (u0 + u1) / 2], K.telaio, { ao: false });
  }
}
