/*
 * I tre moduli composti (MOTION 4.1): A = camera da 22 m² (Classic), "twin" = seconda camera della
 * Family (due letti singoli, porta comunicante, culla su richiesta), "soggiorno" = ambiente
 * della Suite (divano letto, ampia scrivania, coffee maker). I moduli B si disegnano come A e si
 * specchiano (`spazio.scale.x = -1`): finestra e ingresso restano sul lato esterno.
 */

import { Group, Mesh, PlaneGeometry } from "three";
import { creaAloni, type Aloni } from "../../lib/three/lights";
import {
  antaComunicante,
  armadio,
  bagno,
  clima,
  CERNIERA,
  comodino,
  consolle,
  culla,
  fiori,
  pianta,
  poltrona,
  finestra,
  LETTO_X,
  lettoMatrimoniale,
  lettoSingolo,
  pannello,
  portaIngresso,
  scrivaniaSx,
  sedia,
  stampe,
} from "./arredo";
import { Acc, ombreGeom, pieghe, tornio, type V3 } from "./geo";
import { muro } from "./muri";
import {
  aoLocale,
  aoMobili,
  aoPareti,
  HX,
  HZ,
  HW,
  H_BASSO,
  PORTA_COM,
  pavimento,
  struttura,
  telaioPorta,
  type CfgStruttura,
} from "./struttura";
import { K, type Ctx, type Modulo, type Parti } from "./tipi";

export type TipoModulo = "classic" | "twin" | "soggiorno";

/** Quanto scorre il sedile del divano letto e di quanto si alza (m). */
export const DIVANO_SCORRI = 0.8;
export const DIVANO_ALZA = 0.17;
export const PORTA_COM_APERTA = (100 * Math.PI) / 180;

type Base = {
  gruppo: Group;
  spazio: Group;
  a: Acc;
  parti: Parti;
  piccoli: Mesh[];
  aloni: Aloni[];
  ombre: Array<[number, number, number, number, number?]>;
};

function nuovo(c: Ctx, specchiato: boolean, cfg: CfgStruttura): Base {
  const gruppo = new Group();
  const spazio = new Group();
  if (specchiato) spazio.scale.x = -1;
  gruppo.add(spazio);
  const a = new Acc(aoMobili);
  struttura(a, cfg);
  spazio.add(pavimento(c, cfg));
  return { gruppo, spazio, a, parti: {}, piccoli: [], aloni: [], ombre: [] };
}

/** Pivot posizionato in `spazio`, con un Acc proprio nelle sue coordinate locali. */
function pivot(c: Ctx, b: Base, pos: V3, riempi: (m: Acc) => void, ao = false): Group {
  const g = new Group();
  g.position.set(...pos);
  const m = new Acc(ao ? aoLocale : () => 1);
  riempi(m);
  b.piccoli.push(...m.costruisci(c.mat, c.r, g));
  b.spazio.add(g);
  return g;
}

/** Ombre di contatto del modulo (un solo mesh) e macchia di sole dalla finestra. */
function chiudi(c: Ctx, b: Base, sole?: { x: number; z: number; w: number; d: number }): Modulo {
  b.piccoli.push(...b.a.costruisci(c.mat, c.r, b.spazio));
  if (b.ombre.length) {
    const ombra = new Mesh(c.r.add(ombreGeom(b.ombre)), c.mat.ombra);
    ombra.renderOrder = 1;
    ombra.matrixAutoUpdate = false;
    ombra.updateMatrix();
    b.spazio.add(ombra);
  }
  if (sole) {
    const g = c.r.add(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
    const m = new Mesh(g, c.mat.sole);
    m.position.set(sole.x, 0.012, sole.z);
    m.scale.set(sole.w, 1, sole.d);
    m.renderOrder = 1;
    m.updateMatrix();
    m.matrixAutoUpdate = false;
    b.spazio.add(m);
  }
  for (const al of b.aloni) b.spazio.add(al.gruppo);
  return { gruppo: b.gruppo, piccoli: b.piccoli, aloni: b.aloni, parti: b.parti };
}

/** Ombra sotto un oggetto che sta in un pivot (in coordinate locali del pivot). */
function ombraPivot(c: Ctx, g: Group, voci: Array<[number, number, number, number, number?]>): void {
  const m = new Mesh(c.r.add(ombreGeom(voci)), c.mat.ombra);
  m.renderOrder = 1;
  m.matrixAutoUpdate = false;
  m.updateMatrix();
  g.add(m);
}

/* ───────────────────────── A e twin ───────────────────────── */

export function moduloCamera(c: Ctx, tipo: "classic" | "twin"): Modulo {
  const twin = tipo === "twin";
  const b = nuovo(c, twin, { partizione: twin ? "comunicante" : "nessuna", finestra: "sinistra" });
  const { a, spazio } = b;
  const lampade: V3[] = [];

  /* finestra, scrivania, sedia, ingresso, clima, bagno */
  finestra(a, { muro: "sx", c: -0.5, w: 1.6, y0: 0.35, y1: 2.45, pannelli: [0.7, 0.62] });
  scrivaniaSx(a, -1.2, 0.2);
  sedia(a, -1.6, -0.5, -Math.PI / 2 + 0.12);
  fiori(a, -2.5, 0.76, 0.0);
  portaIngresso(a, 1.05, 1.9);
  clima(a, 1.475);
  pianta(a, -2.3, 0.66);
  b.ombre.push([-2.3, 0.66, 0.34, 0.34]);
  const bagnoPt = bagno(a);
  b.ombre.push([-2.3, -0.5, 0.62, 1.4], [-1.6, -0.5, 0.5, 0.5]);

  if (!twin) {
    const bx = LETTO_X;
    pannello(a, bx, 3.2);
    stampe(a, bx);
    const mov = new Acc(() => 1);
    lettoMatrimoniale(a, mov, bx);
    // tappeto sotto il letto e panca ai piedi: riempiono il davanti della camera
    a.box("solido", [2.9, 0.014, 2.3], [bx, 0, 0.12], "#D9CFB8", { ao: false });
    a.rbox("solido", [1.3, 0.42, 0.4], [bx, 0.0, 0.5], K.cuscino, 0.04, 2);
    b.ombre.push([bx, 0.5, 1.3, 0.4]);
    lampade.push(comodino(a, bx - 1.2, -HZ + 0.27), comodino(a, bx + 1.2, -HZ + 0.27));
    b.ombre.push([bx, -0.93, 1.74, 2.02, 0], [bx - 1.2, -HZ + 0.27, 0.45, 0.45], [bx + 1.2, -HZ + 0.27, 0.45, 0.45]);
    // il piumino: metà piedi con la cerniera a metà letto
    const piumino = new Group();
    piumino.position.set(...CERNIERA);
    b.piccoli.push(...mov.costruisci(c.mat, c.r, piumino));
    spazio.add(piumino);
    b.parti.piumino = piumino;
    // TV, minibar e cassaforte (Classic e Family) contro il muro di fondo
    const cons = pivot(c, b, [-1.97, 0, -HZ], (m) => consolle(m), true);
    b.parti.consolle = cons;
    // armadio (Suite): a parte, sparisce nelle altre camere. Un'unica ombra serve a entrambi.
    const arm = pivot(c, b, [-2.0, 0, -HZ], (m) => armadio(m), true);
    b.ombre.push([-1.98, -HZ + 0.27, 1.16, 0.5]);
    b.parti.armadio = arm;
    arm.add(dotazioniSuite(c, b));
    arm.visible = false;
  } else {
    const xs = [-0.47, 1.02];
    pannello(a, 0.1, 3.0);
    stampe(a, 0.28);
    for (const x of xs) lettoSingolo(a, x);
    a.box("solido", [2.9, 0.014, 2.3], [0.28, 0, 0.12], "#D9CFB8", { ao: false });
    lampade.push(comodino(a, -1.215, -HZ + 0.27), comodino(a, 0.275, -HZ + 0.27));
    b.ombre.push([xs[0], -0.94, 0.96, 2.0], [xs[1], -0.94, 0.96, 2.0], [-1.215, -HZ + 0.27, 0.45, 0.45], [0.275, -HZ + 0.27, 0.45, 0.45]);
    const cons = pivot(c, b, [-1.97, 0, -HZ], (m) => consolle(m), true);
    b.ombre.push([-1.97, -HZ + 0.21, 1.16, 0.42]);
    b.parti.consolle = cons;
    // porta comunicante: telaio nel tramezzo e anta con cerniera sulla spalletta anteriore
    telaioPorta(a, "z", HX, PORTA_COM.u0, PORTA_COM.u1, 2.1, -1);
    const porta = pivot(c, b, [HX - 0.04, 0, PORTA_COM.u1], (m) => antaComunicante(m));
    porta.rotation.y = PORTA_COM_APERTA;
    b.parti.portaCom = porta;
    // culla su richiesta
    const cu = pivot(c, b, [1.7, 0, 0.45], (m) => culla(m));
    ombraPivot(c, cu, [[0, 0, 0.62, 1.1]]);
    cu.visible = false;
    cu.scale.setScalar(0.001);
    b.parti.culla = cu;
  }

  const al = creaAloni(c.r, lampade, { raggio: 0.95 });
  const alBagno = creaAloni(c.r, [bagnoPt], { raggio: 0.8, colore: "#FFE2B0" });
  b.aloni.push(al, alBagno);
  if (twin) facciaPartizione(c, b, true);
  return chiudi(c, b, { x: -1.5, z: -0.3, w: 3.0, d: 2.0 });
}

/**
 * Accappatoio appeso alla porta d'ingresso e pantofole accanto al letto (solo Suite): vivono
 * dentro il gruppo dell'armadio (origine = piede dell'armadio, x -2,0, z -2,05 nello spazio A).
 */
function dotazioniSuite(c: Ctx, b: Base): Group {
  const g = new Group();
  const m = new Acc(() => 1);
  const lx = -HX + 0.09 + 2.0; // x locale della faccia interna dell'anta d'ingresso
  const lz = 1.475 + HZ;
  m.rbox("solido", [0.06, 0.88, 0.3], [lx, 0.98, lz], "#F4F1EA", 0.03, 1);
  m.rbox("solido", [0.065, 0.05, 0.31], [lx, 1.2, lz], "#CFC6B4", 0.015, 1);
  m.cilC("solido", 0.011, 0.011, 0.07, [lx - 0.03, 1.9, lz], K.ottone, 6, { piccolo: true, r: [0, 0, Math.PI / 2] });
  m.rbox("solido", [0.1, 0.045, 0.27], [0.95, 0, 3.15], "#E7DFCF", 0.02, 1, { piccolo: true });
  m.rbox("solido", [0.1, 0.045, 0.27], [1.1, 0, 3.12], "#E7DFCF", 0.02, 1, { piccolo: true });
  b.piccoli.push(...m.costruisci(c.mat, c.r, g));
  return g;
}

/* ───────────────────────── Soggiorno della Suite ───────────────────────── */

export const SOFA_X = 0.55;

export function moduloSoggiorno(c: Ctx): Modulo {
  const b = nuovo(c, true, { partizione: "muro", finestra: "fondo" });
  const { a } = b;
  const lampade: V3[] = [];

  /* finestra sul fondo con la scrivania sotto */
  finestra(a, { muro: "fondo", c: -1.5, w: 1.2, y0: 0.9, y1: 2.4, pannelli: [0.45, 0.5] });
  const zD = -HZ + 0.42;
  a.rbox("solido", [1.75, 0.045, 0.82], [-1.725, 0.71, zD], K.rovereM, 0.012, 1, { ao: false });
  for (const x of [-2.6, -0.86]) a.rbox("solido", [0.04, 0.71, 0.74], [x, 0, zD], K.rovereS, 0.008, 1);
  a.box("solido", [1.62, 0.36, 0.02], [-1.725, 0.3, -HZ + 0.1], K.rovereS);
  sedia(a, -1.7, -0.95, Math.PI, K.tortora);
  // lampada da scrivania, computer, fiori
  a.add("solido", tornio([[0, 0], [0.05, 0], [0.055, 0.04], [0.03, 0.14], [0.022, 0.24]], 12), { p: [-1.0, 0.755, zD + 0.05], c: K.crema, ao: false });
  a.add("luce", pieghe(0.105, 0.165, 0.25, 12, 0.1), { p: [-1.0, 0.92, zD + 0.05], c: "#F2C27A", ao: false });
  lampade.push([-1.0, 1.06, zD + 0.05]);
  a.rbox("solido", [0.34, 0.015, 0.24], [-1.75, 0.755, zD + 0.12], "#B9BDBE", 0.006, 1, { piccolo: true, ao: false });
  a.rbox("solido", [0.34, 0.23, 0.012], [-1.75, 0.76, zD - 0.0], "#3B352E", 0.006, 1, { piccolo: true, ao: false, r: [-0.25, 0, 0] });
  fiori(a, -2.4, 0.755, zD + 0.1);
  b.ombre.push([-1.725, zD, 1.75, 0.82], [-1.7, -0.95, 0.5, 0.5]);

  /* parete di destra del fondo: pannello e stampe sopra il divano */
  pannello(a, SOFA_X, 2.2);
  stampe(a, SOFA_X, 1.68);
  portaIngresso(a, 1.05, 1.9);
  pianta(a, -2.3, 0.78);
  b.ombre.push([-2.3, 0.78, 0.34, 0.34]);
  poltrona(a, 1.75, 0.25, -Math.PI / 2 - 0.15);
  b.ombre.push([1.75, 0.25, 0.8, 0.8]);
  const bagnoPt = bagno(a, false);

  /* divano letto: base e braccioli fermi, sedile e schienale mobili */
  const sofa = K.tortora;
  a.rbox("solido", [1.9, 0.38, 1.05], [SOFA_X, 0.04, -1.475], "#A89E8A", 0.03, 1);
  for (const dx of [-0.85, 0.85]) a.rbox("solido", [0.2, 0.7, 1.05], [SOFA_X + dx, 0.04, -1.475], sofa, 0.05, 2);
  const sedile = pivot(c, b, [0, 0, 0], (m) => {
    m.rbox("solido", [1.5, 0.16, 0.9], [SOFA_X, 0.38, -1.3], K.lino, 0.05, 2, { ao: false });
    for (const dx of [-0.45, 0.45]) {
      m.rbox("solido", [0.42, 0.34, 0.11], [SOFA_X + dx, 0.54, -1.52], K.cuscino, 0.04, 2, { r: [-0.55, 0, dx > 0 ? -0.08 : 0.08], ao: false });
    }
  });
  const schienale = pivot(c, b, [SOFA_X, 0.52, -1.75], (m) => {
    m.rbox("solido", [1.5, 0.75, 0.2], [0, 0, -0.1], K.lino, 0.06, 2, { ao: false });
  });
  b.parti.sedile = sedile;
  b.parti.schienale = schienale;
  b.ombre.push([SOFA_X, -1.475, 1.9, 1.05]);

  /* tappeto e tavolino davanti al divano */
  a.box("solido", [2.7, 0.014, 1.7], [0.45, 0, -0.55], "#D3C7AD", { ao: false });
  a.cil("solido", 0.36, 0.36, 0.03, [0.35, 0.34, 0.1], K.rovereC, 24, { ao: false });
  a.cil("solido", 0.022, 0.022, 0.34, [0.35, 0, 0.1], K.ottone, 8);
  a.cil("solido", 0.2, 0.22, 0.02, [0.35, 0, 0.1], K.ottone, 18);
  b.ombre.push([0.35, 0.1, 0.72, 0.72]);

  /* credenza con coffee maker e TV sul muro esterno (sinistro dello spazio A) */
  const sbX = -HX + 0.22;
  const faccia = -HX + 0.435;
  a.rbox("solido", [0.42, 0.78, 1.3], [sbX, 0.0, -0.2], K.rovereC, 0.015, 1);
  a.box("solido", [0.01, 0.62, 0.01], [faccia, 0.08, -0.2], "#a67b47", { ao: false });
  for (const dz of [-0.28, -0.12]) a.box("solido", [0.012, 0.1, 0.012], [faccia + 0.005, 0.4, dz], K.ottone, { ao: false, piccolo: true });
  a.rbox("solido", [0.2, 0.34, 0.26], [sbX, 0.78, -0.58], K.nero, 0.02, 1, { ao: false });
  a.box("solido", [0.2, 0.03, 0.2], [sbX, 1.12, -0.58], "#B9BDBE", { ao: false, piccolo: true });
  a.rbox("solido", [0.32, 0.02, 0.46], [sbX, 0.78, -0.02], K.rovereS, 0.006, 1, { ao: false });
  for (const dz of [-0.12, 0.0]) a.cil("solido", 0.04, 0.035, 0.07, [sbX, 0.8, dz], K.porcellana, 10, { piccolo: true });
  for (const [dz, col] of [[0.2, K.ottone], [0.28, K.crema], [0.36, K.foglia]] as const) {
    a.cil("solido", 0.03, 0.03, 0.09, [sbX + 0.05, 0.78, dz], col, 10, { piccolo: true });
  }
  a.rbox("solido", [0.04, 0.58, 1.0], [-HX + 0.035, 1.12, -0.2], K.nero, 0.008, 1, { ao: false });
  a.box("solido", [0.006, 0.52, 0.94], [-HX + 0.058, 1.15, -0.2], K.schermo, { ao: false });
  b.ombre.push([sbX, -0.2, 0.42, 1.3]);

  const al = creaAloni(c.r, lampade, { raggio: 0.95 });
  const alBagno = creaAloni(c.r, [bagnoPt], { raggio: 0.8, colore: "#FFE2B0" });
  b.aloni.push(al, alBagno);

  // tramezzo visto dal lato della camera: lo fa il gruppo non specchiato
  facciaPartizione(c, b, false);
  return chiudi(c, b, { x: -1.7, z: -0.7, w: 2.2, d: 1.4 });
}

/**
 * Faccia del tramezzo rivolta verso la camera A (non specchiata): sta nel gruppo del modulo B,
 * quindi scorre con lui. Il piano è lungo il bordo sinistro del modulo (x locale = -2,7).
 */
export function facciaPartizione(c: Ctx, b: Base, comunicante: boolean): void {
  const a = new Acc(aoMobili);
  const ao = aoPareti("muro");
  const aper = comunicante ? [{ u0: PORTA_COM.u0, u1: PORTA_COM.u1, v0: 0, v1: 2.1 }] : [];
  muro(a, { asse: "z", pos: -HX, da: -HZ, a: -0.3, v1: HW, dir: -1, aperture: aper, ao, tappi: { su: false, da: false, a: false } });
  muro(a, { asse: "z", pos: -HX, da: -0.3, a: HZ, v1: H_BASSO, dir: -1, ao, tappi: { su: false, da: false, a: false } });
  if (comunicante) telaioPorta(a, "z", -HX, PORTA_COM.u0, PORTA_COM.u1, 2.1, -1);
  b.piccoli.push(...a.costruisci(c.mat, c.r, b.gruppo));
}
