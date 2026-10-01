/* Tipi e colori condivisi dai moduli delle camere (importa three solo come tipi). */

import type { Group, Material, Mesh } from "three";
import type { Aloni } from "../../lib/three/lights";
import type { Risorse } from "../../lib/three/materials";

export type Ctx = {
  r: Risorse;
  mat: Record<string, Material>;
  /** `true` con prefers-reduced-motion: gli stati "aperti" partono già aperti. */
  ridotto: boolean;
};

/** Parti che si muovono (MOTION 4.3-4.4). Ogni pivot sta nel gruppo del suo modulo. */
export type Parti = {
  /** Metà piedi del piumino: `rotation.x` da 0 (chiuso) a -PI (rimboccato). */
  piumino?: Group;
  /** Porta comunicante: `rotation.y` da 0 a ~100 gradi. */
  portaCom?: Group;
  consolle?: Group;
  armadio?: Group;
  /** Culla: `scale` da 0,001 a 1. */
  culla?: Group;
  sedile?: Group;
  schienale?: Group;
};

export type Modulo = {
  /** Gruppo che si sposta (scorre) e che contiene tutto, anche lo specchio. */
  gruppo: Group;
  piccoli: Mesh[];
  aloni: Aloni[];
  parti: Parti;
};

/** Colori (DESIGN 5.2 e palette). */
export const K = {
  rovereC: "#D8B27C",
  rovereM: "#C08F52",
  rovereS: "#8E6232",
  testiera: "#C8B896",
  letto: "#BEAE8E",
  lino: "#F4EFE6",
  lenzuolo: "#F8F4EC",
  cuscino: "#9B9283",
  tortora: "#B3A894",
  ottone: "#B8923F",
  porcellana: "#F7F3EA",
  crema: "#EFE6D2",
  telaio: "#E9DFC8",
  porta: "#B58A55",
  portaScura: "#A67B47",
  cemento: "#B9B2A5",
  nero: "#2B2218",
  schermo: "#3B352E",
  cornice: "#8E6232",
  passepartout: "#FAF6EE",
  stampaChiara: "#B9A57E",
  stampaScura: "#8A4F12",
  foglia: "#4F6B45",
  foglia2: "#A9BC95",
  rosa: "#D98E91",
  vetro: "#DCE9EE",
} as const;
