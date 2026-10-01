/*
 * Arredi e dettagli dei moduli (coordinate del modulo, vedi struttura.ts).
 * Ogni funzione scrive in un `Acc`; le parti che si muovono ricevono un `Acc` proprio le cui
 * coordinate sono locali al pivot.
 */

import { cerchio, pieghe, tenda, tornio, piano, Acc, type V3 } from "./geo";
import { muro } from "./muri";
import {
  aoMobili,
  BAGNO,
  HX,
  HZ,
  HW,
  PORTA_BAGNO,
  telaioPorta,
} from "./struttura";
import { K } from "./tipi";

/* ───────────────────────── Letto, comodini, lampade ───────────────────────── */

export const LETTO_X = 0.05;

/** Pannello d'intonaco dietro il letto (le «pareti sabbia con pannello»). */
export function pannello(a: Acc, cx: number, larghezza = 3.3): void {
  a.rbox("parete", [larghezza, 1.95, 0.035], [cx, 0.2, -HZ + 0.0175], "#F2EEE6", 0.008, 1, { ao: false });
  // due filetti verticali: il pannello si legge come rivestimento
  for (const dx of [-larghezza / 2 + 0.04, larghezza / 2 - 0.04]) {
    a.box("parete", [0.012, 1.95, 0.012], [cx + dx, 0.2, -HZ + 0.04], "#E4DDCB", { ao: false });
  }
}

/** Tre stampe incorniciate sopra il letto (pattern astratti: cerchi, rami, linee). */
export function stampe(a: Acc, cx: number, yc = 1.72): void {
  const z = -HZ + 0.05;
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * 0.54;
    a.rbox("solido", [0.38, 0.5, 0.03], [x, yc - 0.25, z], K.cornice, 0.006, 1, { ao: false });
    a.box("solido", [0.31, 0.43, 0.01], [x, yc - 0.215, z + 0.016], K.passepartout, { ao: false });
    const zz = z + 0.024;
    const arte = { ao: false as const, piccolo: true };
    if (i === 0) {
      a.add("solido", cerchio(0.095, 18), { p: [x, yc, zz], c: K.stampaChiara, ...arte });
      a.add("solido", cerchio(0.04, 14), { p: [x + 0.035, yc - 0.045, zz + 0.002], c: K.stampaScura, ...arte });
    } else if (i === 1) {
      for (const [dx, h] of [[-0.06, 0.2], [0, 0.28], [0.06, 0.16]] as const) {
        a.box("solido", [0.01, h, 0.004], [x + dx, yc - 0.12, zz], K.stampaScura, { ...arte });
        a.add("solido", cerchio(0.026, 10), { p: [x + dx, yc - 0.12 + h, zz + 0.002], c: K.stampaChiara, ...arte });
      }
    } else {
      for (let k = 0; k < 4; k++) {
        a.box("solido", [0.2 - k * 0.03, 0.012, 0.004], [x, yc - 0.19 + k * 0.05, zz], k % 2 ? K.stampaChiara : K.stampaScura, { ...arte });
      }
      a.add("solido", cerchio(0.05, 14), { p: [x, yc + 0.07, zz], c: K.stampaChiara, ...arte });
    }
  }
}

/** Comodino tondo con piedistallo in ottone e abat-jour a pieghe. Restituisce il centro dell'alone. */
export function comodino(a: Acc, x: number, z: number, conLampada = true): V3 {
  a.cil("solido", 0.225, 0.225, 0.03, [x, 0.52, z], K.crema, 26, { ao: false });
  a.cil("solido", 0.02, 0.02, 0.52, [x, 0, z], K.ottone, 10);
  a.cil("solido", 0.15, 0.17, 0.025, [x, 0, z], K.ottone, 20);
  if (!conLampada) return [x, 0.9, z];
  // lampada: piede in ceramica e paralume
  a.add("solido", tornio([[0.0, 0], [0.05, 0], [0.055, 0.04], [0.03, 0.14], [0.022, 0.24]], 12), { p: [x, 0.55, z], c: K.crema, ao: false });
  a.add("luce", pieghe(0.105, 0.165, 0.25, 12, 0.1), { p: [x, 0.72, z], c: "#F2C27A", ao: false });
  // piccolo vaso con fiori sul comodino non c'è: resta pulito per far leggere la luce
  return [x, 0.86, z];
}

/**
 * Letto matrimoniale 160 cm: testiera imbottita, base, materasso, piumino in due metà
 * (la seconda, `mov`, ruota attorno alla cerniera a metà letto), cuscini bianchi e tortora.
 * `mov` è nelle coordinate del pivot: origine = cerniera (bx, 0.58, -0.72).
 */
export const CERNIERA: V3 = [LETTO_X, 0.58, -0.72];

export function lettoMatrimoniale(a: Acc, mov: Acc, bx = LETTO_X): void {
  // testiera
  a.rbox("solido", [1.96, 1.0, 0.11], [bx, 0.26, -HZ + 0.07], K.testiera, 0.04, 2);
  // base imbottita (il "sommier" della foto) e zoccolo scuro che la fa sembrare sospesa
  a.rbox("solido", [1.74, 0.28, 2.02], [bx, 0.06, -0.93], K.letto, 0.035, 1);
  a.box("solido", [1.5, 0.06, 1.8], [bx, 0, -0.95], "#4a3a28", { ao: false });
  // materasso con il lenzuolo
  a.rbox("solido", [1.66, 0.18, 1.96], [bx, 0.34, -0.93], K.lenzuolo, 0.06, 2);
  // metà testa del piumino (ferma)
  a.rbox("solido", [1.82, 0.22, 0.68], [bx, 0.37, -1.06], K.lino, 0.05, 2);
  // metà piedi (si apre): locale al pivot
  mov.rbox("solido", [1.82, 0.22, 0.78], [0, -0.21, 0.39], K.lino, 0.05, 2, { ao: false });
  // runner tortora sul fondo del piumino
  mov.rbox("solido", [1.84, 0.235, 0.28], [0, -0.215, 0.62], K.cuscino, 0.04, 2, { ao: false });
  // cuscini bianchi appoggiati alla testiera
  for (const dx of [-0.42, 0.42]) {
    a.rbox("solido", [0.66, 0.46, 0.15], [bx + dx, 0.52, -1.84], K.lino, 0.06, 2, { r: [-0.26, 0, 0] });
    a.rbox("solido", [0.66, 0.13, 0.4], [bx + dx, 0.5, -1.5], K.lenzuolo, 0.05, 2);
  }
  // cuscini decorativi tortora
  for (const dx of [-0.34, 0.34]) {
    a.rbox("solido", [0.44, 0.3, 0.1], [bx + dx, 0.55, -1.47], K.cuscino, 0.04, 2, { r: [-0.95, 0, dx > 0 ? -0.1 : 0.1] });
  }
}

/** Letto singolo da 90 cm con testiera (la camera con due letti). */
export function lettoSingolo(a: Acc, x: number): void {
  a.rbox("solido", [1.04, 1.0, 0.11], [x, 0.26, -HZ + 0.07], K.testiera, 0.04, 2);
  a.rbox("solido", [0.96, 0.28, 2.0], [x, 0.06, -0.94], K.letto, 0.035, 1);
  a.box("solido", [0.76, 0.06, 1.8], [x, 0, -0.95], "#4a3a28", { ao: false });
  a.rbox("solido", [0.9, 0.18, 1.94], [x, 0.34, -0.94], K.lenzuolo, 0.06, 2);
  a.rbox("solido", [1.0, 0.22, 1.2], [x, 0.37, -0.62], K.lino, 0.05, 2);
  a.rbox("solido", [1.02, 0.235, 0.26], [x, 0.375, -0.2], K.cuscino, 0.04, 2);
  a.rbox("solido", [0.64, 0.42, 0.14], [x, 0.52, -1.84], K.lino, 0.06, 2, { r: [-0.26, 0, 0] });
}

/* ───────────────────────── Finestra e tende ───────────────────────── */

export type OpzFinestra = {
  /** muro su cui sta: "sx" (x = -2,7, guarda +x) oppure "fondo" (z = -2,05, guarda +z) */
  muro: "sx" | "fondo";
  /** centro lungo il muro e larghezza/quote dell'apertura */
  c: number;
  w: number;
  y0: number;
  y1: number;
  /** larghezza dei due pannelli di tenda (sinistro, destro guardando la parete) */
  pannelli?: readonly [number, number];
};

/** Finestra con telaio, vetro luminoso, tenda beige pesante e velo bianco. Il centro del vetro è (0, y, -0.03) locale. */
export function finestra(a: Acc, o: OpzFinestra): void {
  const t = o.muro === "sx" ? { p: [-HX, 0, o.c] as V3, ry: Math.PI / 2 } : { p: [o.c, 0, -HZ] as V3, ry: 0 };
  const h = o.y1 - o.y0;
  const ym = (o.y0 + o.y1) / 2;
  const [pl, pr] = o.pannelli ?? [0.72, 0.72];
  a.con(t, () => {
    // vetro (emissivo: segue la luce giorno-sera)
    // il cielo si schiarisce verso il basso (orizzonte)
    a.add("vetro", piano(o.w + 0.04, h + 0.04, 1, 4), {
      p: [0, ym, -0.04],
      c: "#ffffff",
      ao: false,
      f: (_x, y) => 0.8 + 0.2 * Math.min(1, Math.max(0, 1 - (y - o.y0) / h)),
    });
    // telaio
    const T = { ao: false as const };
    a.box("solido", [o.w + 0.12, 0.06, 0.1], [0, o.y1 - 0.01, -0.02], K.telaio, T);
    a.box("solido", [o.w + 0.12, 0.06, 0.1], [0, o.y0 - 0.05, -0.02], K.telaio, T);
    for (const sx of [-1, 1]) a.box("solido", [0.06, h + 0.1, 0.1], [sx * (o.w / 2 + 0.03), o.y0 - 0.05, -0.02], K.telaio, T);
    a.box("solido", [0.04, h, 0.06], [0, o.y0, -0.01], K.telaio, T);
    a.box("solido", [o.w, 0.04, 0.06], [0, o.y0 + h * 0.72, -0.01], K.telaio, T);
    // davanzale
    a.box("solido", [o.w + 0.2, 0.035, 0.17], [0, o.y0 - 0.085, 0.06], K.telaio, T);
    // asta in ottone con due finali
    const yAsta = 2.62;
    const lAsta = o.w + pl + pr + 0.5;
    const cAsta = (pr - pl) / 2;
    a.cilC("solido", 0.014, 0.014, lAsta, [cAsta, yAsta, 0.11], K.ottone, 8, { r: [0, 0, Math.PI / 2], ao: false });
    for (const s of [-1, 1]) a.sfera("solido", 0.03, [cAsta + s * (lAsta / 2), yAsta, 0.11], K.ottone, { ao: false });
    // tenda pesante: due pannelli ai lati
    const hT = 2.6;
    a.add("tenda", tenda(pl, hT, Math.max(2, Math.round(pl / 0.17)), 0.05), {
      p: [-(o.w / 2 + pl / 2 - 0.08), hT / 2 + 0.02, 0.1],
      c: "#CBB892",
      ao: false,
    });
    a.add("tenda", tenda(pr, hT, Math.max(2, Math.round(pr / 0.17)), 0.05), {
      p: [o.w / 2 + pr / 2 - 0.08, hT / 2 + 0.02, 0.1],
      c: "#CBB892",
      ao: false,
    });
    // velo bianco davanti al vetro, leggero
    const hV = o.y1 - o.y0 + 0.5;
    a.add("velo", tenda(o.w + 0.1, hV, Math.max(3, Math.round(o.w / 0.15)), 0.025, 0.08), {
      p: [0, o.y0 - 0.2 + hV / 2, 0.035],
      c: "#F2ECDD",
      ao: false,
    });
  });
}

/* ───────────────────────── Scrivania e sedia ───────────────────────── */

/** Scrivania in legno addossata al muro sinistro. `z0`..`z1` lungo il muro. */
export function scrivaniaSx(a: Acc, z0: number, z1: number, prof = 0.62): V3 {
  const L = z1 - z0;
  const zc = (z0 + z1) / 2;
  const xc = -HX + prof / 2 + 0.01;
  a.rbox("solido", [prof, 0.04, L], [xc, 0.72, zc], K.rovereM, 0.012, 1, { ao: false });
  for (const zz of [z0 + 0.04, z1 - 0.04]) a.rbox("solido", [prof - 0.04, 0.72, 0.04], [xc, 0, zz], K.rovereS, 0.008, 1);
  a.box("solido", [0.02, 0.4, L - 0.12], [-HX + 0.03, 0.3, zc], K.rovereS);
  return [xc, 0.78, zc];
}

/** Sedia imbottita con gambe in legno (rivolta verso `ry`). */
export function sedia(a: Acc, x: number, z: number, ry: number, colore: string = K.tortora): void {
  a.con({ p: [x, 0, z], ry }, () => {
    a.rbox("solido", [0.46, 0.07, 0.44], [0, 0.42, 0], colore, 0.025, 1);
    a.rbox("solido", [0.46, 0.4, 0.06], [0, 0.5, -0.21], colore, 0.025, 1, { r: [-0.1, 0, 0] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.cil("solido", 0.014, 0.012, 0.42, [sx * 0.19, 0, sz * 0.18], K.rovereS, 8);
    for (const sx of [-1, 1]) a.cilC("solido", 0.012, 0.012, 0.4, [sx * 0.2, 0.7, -0.21], K.rovereS, 8, { r: [-0.1, 0, 0] });
  });
}

/** Vasetto di fiori (piccolo): un tocco di colore come nelle foto. */
export function fiori(a: Acc, x: number, yb: number, z: number): void {
  a.cil("solido", 0.04, 0.035, 0.14, [x, yb, z], K.vetro, 10, { piccolo: true, ao: false });
  for (const [dx, dy, dz, c] of [
    [0, 0.26, 0, K.rosa],
    [0.05, 0.22, 0.02, K.rosa],
    [-0.04, 0.2, -0.02, "#F2D6D8"],
  ] as const) {
    a.cil("solido", 0.004, 0.004, dy - 0.04, [x + dx * 0.4, yb + 0.1, z + dz * 0.4], K.foglia, 5, { piccolo: true, ao: false });
    a.sfera("solido", 0.03, [x + dx, yb + dy + 0.1, z + dz], c, { piccolo: true, ao: false });
  }
}

/** Ficus in vaso: tronco sottile e foglie a ellisse in due toni di verde. */
export function pianta(a: Acc, x: number, z: number): void {
  const T = { ao: false as const };
  a.add("solido", tornio([[0, 0], [0.13, 0], [0.17, 0.05], [0.19, 0.3], [0.15, 0.32], [0, 0.3]], 14), { p: [x, 0, z], c: "#EDE3CF" });
  a.cil("solido", 0.14, 0.14, 0.02, [x, 0.29, z], "#4A3A28", 12, T);
  a.cil("solido", 0.013, 0.02, 0.7, [x, 0.3, z], K.rovereS, 6, T);
  // [dx, y, dz, rotazione, scala]
  const foglie: Array<[number, number, number, number, number]> = [
    [0.0, 1.12, 0.0, 0, 1.0],
    [0.22, 0.8, 0.02, 0.5, 1.1],
    [-0.21, 0.84, -0.04, 2.1, 1.1],
    [0.05, 0.74, 0.22, 3.8, 1.1],
    [-0.06, 0.72, -0.22, 5.2, 1.1],
    [0.26, 1.02, -0.07, 1.0, 1.0],
    [-0.25, 1.06, 0.08, 2.9, 1.0],
    [0.07, 1.2, 0.16, 4.4, 0.9],
    [-0.1, 1.16, -0.17, 0.4, 0.9],
    [0.14, 0.92, 0.18, 5.8, 1.0],
    [-0.15, 0.94, 0.17, 3.3, 1.0],
    [0.0, 0.95, -0.2, 1.7, 1.0],
  ];
  foglie.forEach(([dx, dy, dz, rot, sc], i) => {
    a.sfera("solido", 0.15 * sc, [x + dx, dy, z + dz], i % 3 === 0 ? "#7E9A66" : i % 3 === 1 ? "#5D7B4D" : "#6B8A58", {
      ...T,
      s: [1, 0.3, 0.55],
      r: [0.55, rot, 0.4],
    });
  });
}

/** Poltrona imbottita (rivolta secondo `ry`, davanti = +z locale). */
export function poltrona(a: Acc, x: number, z: number, ry: number): void {
  a.con({ p: [x, 0, z], ry }, () => {
    a.rbox("solido", [0.78, 0.3, 0.74], [0, 0.1, 0], K.tortora, 0.05, 1);
    a.rbox("solido", [0.78, 0.5, 0.16], [0, 0.34, -0.29], K.tortora, 0.06, 2);
    for (const sx of [-1, 1]) a.rbox("solido", [0.14, 0.3, 0.7], [sx * 0.32, 0.34, 0.02], K.tortora, 0.05, 1);
    a.rbox("solido", [0.5, 0.12, 0.54], [0, 0.4, 0.04], K.lino, 0.05, 2, { ao: false });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.cil("solido", 0.02, 0.016, 0.1, [sx * 0.32, 0, sz * 0.28], K.rovereS, 8);
  });
}

/* ───────────────────────── Console TV, minibar, cassaforte, clima ───────────────────────── */

/** Mobile basso con minibar a sinistra, cassaforte sopra a destra e TV a parete. Coordinate locali: origine al piede centrale contro il muro di fondo. */
export function consolle(a: Acc): void {
  const T = { ao: false as const };
  a.rbox("solido", [1.16, 0.62, 0.42], [0, 0.1, 0.21], K.rovereC, 0.015, 1);
  for (const sx of [-0.52, 0.52]) a.cil("solido", 0.015, 0.012, 0.1, [sx, 0, 0.08], K.ottone, 8, T);
  // minibar (sportello chiaro con maniglia)
  a.rbox("solido", [0.5, 0.48, 0.02], [-0.29, 0.17, 0.425], "#EDE6D6", 0.008, 1, T);
  a.box("solido", [0.015, 0.16, 0.02], [-0.07, 0.34, 0.45], K.ottone, T);
  // sportello di legno del vano cassaforte
  a.rbox("solido", [0.5, 0.48, 0.02], [0.29, 0.17, 0.425], K.rovereM, 0.008, 1, T);
  // cassaforte sul piano (con tastierino)
  a.rbox("solido", [0.34, 0.26, 0.3], [0.3, 0.72, 0.22], "#5E5242", 0.012, 1);
  a.box("solido", [0.09, 0.07, 0.01], [0.3, 0.9, 0.375], K.ottone, T);
  a.cilC("solido", 0.025, 0.025, 0.02, [0.38, 0.8, 0.375], K.ottone, 10, { ...T, r: [Math.PI / 2, 0, 0] });
  // TV a parete
  a.rbox("solido", [1.0, 0.58, 0.04], [-0.02, 1.12, 0.03], K.nero, 0.008, 1, T);
  a.box("solido", [0.94, 0.52, 0.006], [-0.02, 1.15, 0.054], K.schermo, T);
}

/** Armadio a due ante con maniglie in ottone (Suite). Origine al piede, contro il muro di fondo. */
export function armadio(a: Acc): void {
  const T = { ao: false as const };
  a.rbox("solido", [1.2, 2.2, 0.6], [0, 0, 0.3], "#CDB890", 0.02, 1);
  for (const sx of [-1, 1]) {
    a.rbox("solido", [0.57, 2.08, 0.02], [sx * 0.29, 0.06, 0.605], "#D8C6A2", 0.008, 1, T);
    a.box("solido", [0.016, 0.5, 0.02], [sx * 0.07, 0.95, 0.63], K.ottone, T);
  }
  a.box("solido", [1.2, 0.04, 0.6], [0, 2.2, 0.3], "#B9A57E", T);
}

/** Split del clima, bianco, sul muro sinistro sopra la porta. */
export function clima(a: Acc, z: number): V3 {
  a.rbox("solido", [0.22, 0.27, 0.95], [-HX + 0.12, 2.28, z], K.lino, 0.03, 1, { ao: false });
  a.box("solido", [0.2, 0.02, 0.78], [-HX + 0.16, 2.31, z], "#cfc6b4", { ao: false });
  return [-HX + 0.2, 2.42, z];
}

/* ───────────────────────── Porte ───────────────────────── */

/** Porta d'ingresso chiusa sul muro sinistro, con targhetta, maniglia e cornice. */
export function portaIngresso(a: Acc, u0: number, u1: number): V3 {
  const w = u1 - u0 - 0.04;
  const zc = (u0 + u1) / 2;
  telaioPorta(a, "z", -HX, u0, u1, 2.1, 1);
  a.rbox("solido", [0.045, 2.06, w], [-HX + 0.04, 0, zc], K.porta, 0.01, 1, { ao: false });
  // specchiature e maniglia
  a.box("solido", [0.012, 0.85, w - 0.2], [-HX + 0.07, 0.15, zc], K.portaScura, { ao: false });
  a.box("solido", [0.012, 0.85, w - 0.2], [-HX + 0.07, 1.1, zc], K.portaScura, { ao: false });
  a.cilC("solido", 0.012, 0.012, 0.13, [-HX + 0.085, 1.02, u0 + 0.11], K.ottone, 8, { ao: false, r: [Math.PI / 2, 0, 0], piccolo: true });
  a.box("solido", [0.012, 0.06, 0.12], [-HX + 0.07, 1.55, zc], K.ottone, { ao: false, piccolo: true });
  return [-HX + 0.1, 1.05, zc];
}

/** Anta della porta comunicante, nel pivot locale (cerniera sulla spalletta anteriore). */
export function antaComunicante(mov: Acc): void {
  const w = 0.86;
  mov.rbox("solido", [0.045, 2.06, w], [0, 0, -(w / 2 + 0.02)], K.porta, 0.01, 1, { ao: false });
  mov.box("solido", [0.1, 0.85, w - 0.2], [0, 0.15, -(w / 2 + 0.02)], K.portaScura, { ao: false });
  mov.box("solido", [0.1, 0.85, w - 0.2], [0, 1.1, -(w / 2 + 0.02)], K.portaScura, { ao: false });
  mov.cilC("solido", 0.012, 0.012, 0.13, [0, 1.02, -(w - 0.08)], K.ottone, 8, { ao: false, r: [Math.PI / 2, 0, 0] });
}

/* ───────────────────────── Bagno (dietro la parete di fondo) ───────────────────────── */

export function bagno(a: Acc, conTessuti = true): V3 {
  const { x0, x1, z0, z1 } = BAGNO;
  const ao = (x: number, y: number, z: number) =>
    Math.max(0.55, 1 - 0.18 * Math.exp(-Math.max(0, y) / 0.4) - 0.12 * Math.exp(-Math.max(0, z - z0) / 0.45));
  const chiaro = "#FFF8EC";
  // pareti interne e fianco esterno sinistro (così il blocco si legge anche da fuori)
  muro(a, { asse: "z", pos: x0, da: z0, a: z1, v1: HW, dir: 1, ao, c: chiaro, tappi: { su: true, da: true, a: false } });
  muro(a, { asse: "z", pos: x0, da: z0, a: z1, v1: HW, dir: -1, ao: () => 0.92, c: "#fff", tappi: { su: false, da: false, a: false } });
  muro(a, { asse: "x", pos: z0, da: x0, a: x1, v1: HW, dir: 1, ao, c: chiaro, tappi: { su: true, da: false, a: false } });
  muro(a, { asse: "z", pos: x1, da: z0, a: z1, v1: HW, dir: -1, ao, c: chiaro, tappi: { su: true, da: false, a: false } });
  // pavimento in piastrelle
  a.box("solido", [x1 - x0, 0.02, z1 - z0], [(x0 + x1) / 2, 0, (z0 + z1) / 2], "#D4CEC0", { ao: (x, _y, z) => Math.max(0.6, 1 - 0.3 * Math.exp(-Math.max(0, z - z0) / 0.4)) });
  // porta della camera verso il bagno: cornice, anta aperta verso l'interno
  telaioPorta(a, "x", -HZ, PORTA_BAGNO.u0, PORTA_BAGNO.u1, 2.1, 1);
  a.rbox("solido", [0.045, 2.06, 0.8], [PORTA_BAGNO.u1 - 0.04, 0, -HZ - 0.5], K.porta, 0.01, 1, { ao: false });
  a.cilC("solido", 0.012, 0.012, 0.1, [PORTA_BAGNO.u1 - 0.07, 1.02, -HZ - 0.2], K.ottone, 8, { ao: false, r: [Math.PI / 2, 0, 0], piccolo: true });
  // lavabo sul fondo, specchio e luce
  const xs = 1.85;
  a.rbox("solido", [0.72, 0.4, 0.42], [xs, 0.4, z0 + 0.23], K.rovereC, 0.012, 1);
  a.rbox("solido", [0.62, 0.1, 0.4], [xs, 0.8, z0 + 0.23], K.porcellana, 0.03, 1);
  a.cil("solido", 0.012, 0.012, 0.16, [xs, 0.9, z0 + 0.08], K.ottone, 8, { piccolo: true });
  a.box("solido", [0.012, 0.012, 0.1], [xs, 1.05, z0 + 0.12], K.ottone, { piccolo: true });
  a.box("solido", [0.74, 0.88, 0.014], [xs, 1.1, z0 + 0.012], K.vetro, { ao: false });
  a.box("solido", [0.78, 0.92, 0.012], [xs, 1.08, z0 + 0.005], K.telaio, { ao: false });
  a.box("luce", [0.5, 0.045, 0.045], [xs, 2.05, z0 + 0.06], "#FFE9C2", { ao: false });
  // vasca lungo il lato sinistro e wc a destra
  a.rbox("solido", [0.78, 0.52, 1.5], [1.42, 0.02, -3.1], K.porcellana, 0.05, 2);
  a.rbox("solido", [0.4, 0.4, 0.5], [2.46, 0.02, -3.2], K.porcellana, 0.04, 1);
  a.rbox("solido", [0.38, 0.4, 0.16], [2.46, 0.4, -3.52], K.porcellana, 0.03, 1);
  if (conTessuti) {
    a.cilC("solido", 0.01, 0.01, 0.5, [2.1, 1.3, z0 + 0.04], K.ottone, 6, { r: [0, 0, Math.PI / 2], piccolo: true });
    a.box("solido", [0.3, 0.62, 0.025], [2.1, 0.7, z0 + 0.04], "#EEE8DA", { piccolo: true });
  }
  return [xs, 1.95, z0 + 0.3];
}

/* ───────────────────────── Culla ───────────────────────── */

/** Culla con sbarre: origine al centro della base, a terra. */
export function culla(a: Acc): void {
  const w = 0.62;
  const l = 1.1;
  a.rbox("solido", [w - 0.06, 0.06, l - 0.06], [0, 0.2, 0], K.lino, 0.02, 1, { ao: false });
  a.rbox("solido", [w - 0.1, 0.03, l - 0.1], [0, 0.185, 0], K.rovereC, 0.008, 1, { ao: false });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    a.cil("solido", 0.02, 0.02, 0.92, [sx * (w / 2 - 0.02), 0, sz * (l / 2 - 0.02)], K.rovereC, 8, { ao: false });
  }
  for (const sx of [-1, 1]) {
    a.rbox("solido", [0.03, 0.035, l], [sx * (w / 2 - 0.02), 0.88, 0], K.rovereC, 0.01, 1, { ao: false });
    for (let i = 0; i < 8; i++) {
      a.box("solido", [0.012, 0.58, 0.012], [sx * (w / 2 - 0.02), 0.3, -l / 2 + 0.13 + i * ((l - 0.26) / 7)], K.rovereC, { ao: false });
    }
  }
  for (const sz of [-1, 1]) {
    a.rbox("solido", [w, 0.035, 0.03], [0, 0.88, sz * (l / 2 - 0.02)], K.rovereC, 0.01, 1, { ao: false });
    for (let i = 0; i < 4; i++) {
      a.box("solido", [0.012, 0.58, 0.012], [-w / 2 + 0.12 + i * ((w - 0.24) / 3), 0.3, sz * (l / 2 - 0.02)], K.rovereC, { ao: false });
    }
  }
  // copertina tortora arrotolata
  a.rbox("solido", [w - 0.12, 0.08, 0.4], [0, 0.23, 0.2], K.cuscino, 0.03, 1, { ao: false });
}

export { aoMobili, Acc };
