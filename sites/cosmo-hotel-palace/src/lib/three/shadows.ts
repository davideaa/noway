/*
 * Ombre di contatto (DESIGN 5.4): un quad piatto sotto ogni oggetto appoggiato, con UNA sola
 * texture 128² a gradiente radiale (`#3A2A18`, alpha 0,35, sfumata 20-30 cm oltre l'ingombro).
 * Geometria e materiale sono condivisi da tutte le ombre: costano una texture e, per le ombre
 * singole, una draw call ciascuna (per sedie e tavoli si usa `creaOmbreIstanziate`: una sola).
 * Nessuna shadow map. Seguono la key di appena 2 cm.
 */

import { DoubleSide, InstancedMesh, Mesh, MeshBasicMaterial, PlaneGeometry, type Object3D, type Texture } from "three";
import { COLORI, disegna, texturaCondivisa } from "./materials";
import { scriviMatrice } from "./instancing";

/** Quanto l'ombra esce oltre l'ingombro dell'oggetto (m). */
export const MARGINE_OMBRA = 0.25;
/** Spostamento massimo dell'ombra che segue la luce (m). */
export const SEGUI_LUCE_M = 0.02;

const ALPHA = 0.35;

/** Texture dell'ombra 128²: centro pieno, bordo che sfuma. Condivisa. */
export function texturaOmbra(): Texture {
  return texturaCondivisa("ombra", () =>
    disegna(
      128,
      128,
      (ctx, w, h) => {
        const n = parseInt(COLORI.ombra.slice(1), 16);
        const rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, `rgba(${rgb},${ALPHA})`);
        g.addColorStop(0.45, `rgba(${rgb},${ALPHA * 0.9})`);
        g.addColorStop(0.75, `rgba(${rgb},${ALPHA * 0.35})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      },
      false,
    ),
  );
}

let geomCondivisa: PlaneGeometry | null = null;
let matCondiviso: MeshBasicMaterial | null = null;

/** Quad 1x1 già disteso sul pavimento (piano XZ). Condiviso da tutte le ombre. */
function geometria(): PlaneGeometry {
  if (!geomCondivisa) {
    geomCondivisa = new PlaneGeometry(1, 1);
    geomCondivisa.rotateX(-Math.PI / 2);
    geomCondivisa.userData.shared = true;
  }
  return geomCondivisa;
}

function materiale(): MeshBasicMaterial {
  if (!matCondiviso) {
    matCondiviso = new MeshBasicMaterial({
      map: texturaOmbra(),
      transparent: true,
      depthWrite: false,
      // niente z-fighting con il pavimento, senza sollevare il quad
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: DoubleSide,
    });
    matCondiviso.userData.shared = true;
  }
  return matCondiviso;
}

/** Libera geometria e materiale condivisi delle ombre (solo allo smontaggio totale dello Stage). */
export function liberaOmbre(): void {
  geomCondivisa?.dispose();
  matCondiviso?.dispose();
  geomCondivisa = null;
  matCondiviso = null;
}

export type OpzOmbra = {
  /** Altezza del pavimento (default 0,005: appena sopra). */
  y?: number;
  rotY?: number;
  margine?: number;
};

/**
 * Ombra di contatto sotto un oggetto che occupa `larghezza x profondita` metri, centrata in (x, z).
 * `userData.base` ricorda la posizione per `seguiLuce`.
 */
export function creaOmbraContatto(
  x: number,
  z: number,
  larghezza: number,
  profondita: number,
  { y = 0.005, rotY = 0, margine = MARGINE_OMBRA }: OpzOmbra = {},
): Mesh {
  const m = new Mesh(geometria(), materiale());
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  m.scale.set(larghezza + margine * 2, 1, profondita + margine * 2);
  m.renderOrder = 1;
  m.userData.base = [x, z];
  return m;
}

/**
 * Un solo InstancedMesh di ombre (una draw call per tutte le sedie di una fila, i tavoli, ecc.).
 * Si scrive con `scriviOmbra`. `max` istanze; `count` parte da 0.
 */
export function creaOmbreIstanziate(max: number, y = 0.005): InstancedMesh {
  const m = new InstancedMesh(geometria(), materiale(), max);
  m.count = 0;
  m.position.y = y;
  m.frustumCulled = false;
  m.renderOrder = 1;
  return m;
}

/** Scrive l'ombra `i`: centro (x, z), ingombro, rotazione. */
export function scriviOmbra(
  mesh: InstancedMesh,
  i: number,
  x: number,
  z: number,
  larghezza: number,
  profondita: number,
  rotY = 0,
  margine = MARGINE_OMBRA,
): void {
  scriviMatrice(mesh.instanceMatrix.array as Float32Array, i, x, 0, z, rotY, larghezza + margine * 2, 1, profondita + margine * 2);
  mesh.instanceMatrix.needsUpdate = true;
}

/**
 * Sposta le ombre di contatto di `gruppo` di al massimo 2 cm, in senso opposto alla luce
 * (`dir` = direzione verso il sole). Niente di più: è un'illusione, non un'ombra.
 */
export function seguiLuce(gruppo: Object3D, dir: readonly [number, number, number]): void {
  const n = Math.hypot(dir[0], dir[2]) || 1;
  const dx = (-dir[0] / n) * SEGUI_LUCE_M;
  const dz = (-dir[2] / n) * SEGUI_LUCE_M;
  gruppo.traverse((o) => {
    const b = o.userData.base as [number, number] | undefined;
    if (b) o.position.set(b[0] + dx, o.position.y, b[1] + dz);
  });
}
