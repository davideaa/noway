/*
 * Cosmo Grill & Lounge: la scena 3D (three). Si importa SOLO da `def.ts` con `import()`.
 *
 * Ipotesi dichiarata (DESIGN 5.1, ricostruita a occhio dalla foto): una sala di 18 x 17 m alta 4,6 m,
 * cemento lisciato, travi scure e canalizzazioni a vista, pilastri bruni, tre finestre ad arco con
 * veli bianchi sul lato sinistro (parete ocra), due specchi con cornice scura e rami secchi a destra,
 * 30 tavoli bianchi con sedie in alluminio forato e lampade ad abat-jour color miele. La camera sta
 * dentro la sala, all'altezza di chi è in piedi (come nella foto), e orbita di ±35°.
 * Tavoli, sedie, lampade e dettagli sono `InstancedMesh`; il resto è fuso in poche mesh.
 *
 * Luce: `setLuce(t)` 0 mattina · 1/3 pranzo · 2/3 aperitivo · 1 sera. Il sole entra dalle finestre
 * come proiezione vera dell'arco sul pavimento; alla sera il sole non c'è e le lampade sono
 * l'unica luce (alone, pozze sul pavimento, un PointLight sempre presente).
 */

import {
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
} from "three";
import { OrbitRig } from "../../components/scene/CameraRig";
import type { Qualita, SceneContext, SceneHandle } from "../../content/types";
import {
  LuciBase,
  campionaColore,
  campionaScalare,
  direzioneSole,
  type StopColore,
  type StopScalare,
} from "../../lib/three/lights";
import { Risorse, disegna, texturaCemento } from "../../lib/three/materials";
import { creaOmbreIstanziate, scriviOmbra } from "../../lib/three/shadows";
import { creaIstanze, impostaConteggio, scriviMatrice, segnaAggiornate } from "../../lib/three/instancing";
import { finestraArco, muro, tendaGeom, type Apertura } from "../_geo-hall-grill/architettura";
import { Fusione, mat, scatolaSmussata } from "../_geo-hall-grill/fusione";
import { AloniFusi, Chiazza, PozzeLuce, smoothstep } from "../_geo-hall-grill/luce";
import { caso, fbm3 } from "../_geo-hall-grill/rumore";
import { creaTubo } from "../_geo-hall-grill/tubi";
import { aggiungiPianta } from "../_geo-hall-grill/vegetazione";
import { GRILL_LIMITI } from "./limiti";

/* ───────────────────────── Misure (m, stilizzate) ───────────────────────── */

const X0 = -9;
const X1 = 9;
const Z0 = -6.5; // parete di fondo
const Z1 = 10.5; // fondo sala dalla parte della camera (la camera sta dentro, come nella foto)
const H = 4.6;
const SP = 0.4;
const FINESTRE_Z = [-4.3, -0.4, 3.5, 7.4];
const FIN = { w: 2.3, y0: 0.4, yMolla: 2.9 } as const;
const PILASTRI_LATO_Z = [-6.2, -2.35, 1.55, 5.45, 9.35];
const PILASTRI_INT: [number, number][] = [[-2.8, -3.25], [2.8, -3.25], [-2.8, 2.15], [2.8, 2.15]];
const MIRINO = [0, 1.15, -0.6] as const;

/* ───────────────────────── Tabelle di luce (MOTION 6.2) ───────────────────────── */

const KEY_COL: StopColore[] = [[0, "#E8F0F5"], [1 / 3, "#FFF4E0"], [2 / 3, "#FFC27A"], [1, "#FFB867"]];
// alla sera il sole non c'è: la key resta come un riverbero debole (le lampade sono l'unica luce)
const KEY_INT: StopScalare[] = [[0, 1.3], [1 / 3, 1.7], [2 / 3, 1.0], [0.9, 0.2], [1, 0.14]];
const HEMI_INT: StopScalare[] = [[0, 0.66], [1 / 3, 0.72], [2 / 3, 0.5], [1, 0.26]];
const HEMI_CIELO: StopColore[] = [[0, "#E8EEF2"], [1 / 3, "#F4F1EA"], [2 / 3, "#F7D5B0"], [1, "#5C6A8C"]];
const VETRATA_ORIZZ: StopColore[] = [[0, "#CFE0EA"], [1 / 3, "#DCEAF0"], [2 / 3, "#F2B77A"], [1, "#3A4A66"]];
const VETRATA_ZENIT: StopColore[] = [[0, "#9DBBD3"], [1 / 3, "#8FB4D4"], [2 / 3, "#B8B7C4"], [1, "#141B2E"]];
const SOLE_EL: StopScalare[] = [[0, 20], [1 / 3, 60], [2 / 3, 12], [1, 6]];
const SOLE_AZ: StopScalare[] = [[0, -78], [1 / 3, -55], [2 / 3, 82], [1, 90]];
const SPECCHIO: StopColore[] = [[0, "#7E7B72"], [2 / 3, "#7E7B72"], [1, "#2E2A26"]];
const PARETE: StopColore[] = [[0, "#FFFFFF"], [2 / 3, "#FFFFFF"], [1, "#BFB19B"]];
const ALONE: StopScalare[] = [[0, 0], [0.5, 0], [2 / 3, 0.6], [1, 1]];
const POZZE: StopScalare[] = [[0, 0], [0.55, 0], [2 / 3, 0.45], [1, 1]];
const LAMPADA: StopScalare[] = [[0, 0.22], [0.5, 0.22], [2 / 3, 0.7], [1, 1]];
const PUNTO: StopScalare[] = [[0, 0], [0.55, 0], [2 / 3, 0.6], [1, 1.2]];
const SOLE_PATCH: StopScalare[] = [[0, 0.5], [1 / 3, 0.55], [0.5, 0.2], [2 / 3, 0]];

/* ───────────────────────── Build ───────────────────────── */

export function build(ctx: SceneContext): SceneHandle {
  const r = new Risorse();
  const scena = new Scene();
  const radice = new Group();
  scena.add(radice);
  const camera = new PerspectiveCamera(38, ctx.larghezza / ctx.altezza, 0.1, 260);
  const rig = new OrbitRig({
    camera,
    limiti: GRILL_LIMITI,
    vistaIniziale: { az: 0, pol: 82, dist: 10.8 },
    bersaglio: MIRINO,
    distanza: [5, 14],
    reducedMotion: ctx.reducedMotion,
    larghezza: ctx.larghezza,
    altezza: ctx.altezza,
  });
  /** In verticale (telefono) il campo orizzontale non scende sotto ~44°. */
  const adattaFov = (l: number, a: number) => {
    const asp = l / Math.max(1, a);
    const tv = Math.tan((38 * Math.PI) / 360);
    const minV = Math.tan((44 * Math.PI) / 360) / asp;
    camera.fov = (2 * Math.atan(Math.max(tv, minV)) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    rig.applica();
  };
  adattaFov(ctx.larghezza, ctx.altezza);
  let qualita: Qualita = ctx.qualita;
  const alta = () => qualita === "high";
  const lite = () => qualita === "lite1" || qualita === "lite2";

  const luci = new LuciBase({ keyDirezione: [0.5, 0.7, 0.4], puntoPosizione: [0, 3.5, -0.8], puntoDistanza: 15, hemiTerra: "#C9A878" });
  scena.add(luci.gruppo);

  const texCemento = r.texture("cemento", texturaCemento);

  /* ========== ARCHITETTURA ========== */
  const arch = new Fusione(4);
  const tintaSala = (x: number, y: number, z: number) => {
    const dx = Math.min(x - X0, X1 - x);
    const dz = Math.max(0, z - Z0);
    const angolo = Math.exp(-Math.max(0, dx) / 0.5) * 0.12 + Math.exp(-dz / 0.5) * 0.1;
    const terra = Math.exp(-Math.max(0, y) / 0.45) * 0.18;
    const sopra = Math.exp(-Math.max(0, H - y) / 0.6) * 0.14;
    return Math.max(0.5, 1 - angolo - terra - sopra) * (0.95 + 0.1 * fbm3(x * 0.45, y * 0.45, z * 0.45, 4));
  };
  const OCRA = new Color("#DBC38C");
  const CEMENTO = new Color("#C2BBAD");
  const colMuro = (x: number, _y: number, z: number, _a: number, _b: number, _c: number, out: Color) => out.copy(CEMENTO);
  const colOcra = (x: number, _y: number, z: number, _a: number, _b: number, _c: number, out: Color) => out.copy(OCRA);
  const colFondo = (x: number, _y: number, _z: number, _a: number, _b: number, _c: number, out: Color) =>
    out.copy(OCRA).lerp(CEMENTO, smoothstep(-2.0, -1.2, x));
  const aperSin: Apertura[] = FINESTRE_Z.map((s) => ({ tipo: "arco", s, w: FIN.w, y0: FIN.y0, yMolla: FIN.yMolla }));
  const muroFondo = muro("x", Z0, 1, X0, X1, H, [], SP);
  const muroSin = muro("z", X0, 1, Z0, Z1, H, aperSin, SP);
  const muroDes = muro("z", X1, -1, Z0, Z1, H, [], SP);
  arch.aggiungi(muroFondo, colFondo, undefined, tintaSala);
  arch.aggiungi(muroSin, colOcra, undefined, tintaSala);
  arch.aggiungi(muroDes, colMuro, undefined, tintaSala);
  for (const g of [muroFondo, muroSin, muroDes]) g.dispose();
  // soffitto (la faccia guarda in basso: dall'alto non si vede, così l'orbita non lo incontra mai)
  {
    const forma = new Shape();
    forma.moveTo(X0, Z0);
    forma.lineTo(X1, Z0);
    forma.lineTo(X1, Z1);
    forma.lineTo(X0, Z1);
    forma.lineTo(X0, Z0);
    const g = new ShapeGeometry(forma);
    g.rotateX(Math.PI / 2);
    g.translate(0, H, 0);
    arch.aggiungi(g, "#4A3A2E", undefined, (x, _y, z) => 0.8 + 0.2 * fbm3(x * 0.3, 0, z * 0.3, 8));
    g.dispose();
  }
  // pilastri scuri (#6B5642): lungo la parete delle finestre e quattro fra i tavoli
  const colPil = (_x: number, y: number, _z: number, _a: number, _b: number, _c: number, out: Color) => out.set("#6B5642").multiplyScalar(0.8 + 0.2 * smoothstep(0, 1.6, y));
  for (const z of PILASTRI_LATO_Z) arch.aggiungi(scatolaSmussata(0.8, H, 0.8, 0.03), colPil, mat(X0 + 0.4, H / 2, z));
  for (const [x, z] of PILASTRI_INT) arch.aggiungi(scatolaSmussata(0.62, H, 0.62, 0.03), colPil, mat(x, H / 2, z));
  // zoccolino scuro lungo le pareti
  arch.aggiungi(new BoxGeometry(X1 - X0, 0.12, 0.05), "#5B4E40", mat(0, 0.06, Z0 + 0.03));
  arch.aggiungi(new BoxGeometry(0.05, 0.12, Z1 - Z0), "#5B4E40", mat(X1 - 0.03, 0.06, (Z0 + Z1) / 2));
  // travi (scure) e condotte a vista (le canalizzazioni della foto)
  const colTrave = "#2F2722";
  for (const x of [-5.2, 0, 5.2]) arch.aggiungi(scatolaSmussata(0.5, 0.72, Z1 - Z0, 0.025), colTrave, mat(x, H - 0.36, (Z0 + Z1) / 2));
  for (const z of [-5, -1.6, 1.8, 5.2, 8.6]) arch.aggiungi(scatolaSmussata(X1 - X0, 0.42, 0.28, 0.02), colTrave, mat(0, H - 0.84, z));
  const colCondotta = (_x: number, y: number, _z: number, _a: number, _b: number, _c: number, out: Color) => out.set("#CDCBC4").multiplyScalar(0.72 + 0.28 * Math.max(0, Math.min(1, (y - 3.2) / 0.75)));
  const condotte: [number, number, number, number][] = [[-2.6, 3.62, 0.31, 0], [2.7, 3.7, 0.26, 0]];
  for (const [x, y, rad] of condotte.map((c) => [c[0], c[1], c[2]] as const)) {
    arch.aggiungi(new CylinderGeometry(rad, rad, Z1 - Z0 - 0.4, 22, 1).rotateX(Math.PI / 2), colCondotta, mat(x, y, (Z0 + Z1) / 2));
    for (let z = Z0 + 1.2; z < Z1 - 0.3; z += 1.9) arch.aggiungi(new CylinderGeometry(rad + 0.02, rad + 0.02, 0.07, 22, 1).rotateX(Math.PI / 2), "#8F8D86", mat(x, y, z));
    // staffe verso il soffitto
    for (let z = Z0 + 1.2; z < Z1 - 0.3; z += 3.8) arch.aggiungi(new BoxGeometry(0.04, H - 0.7 - y - rad, 0.04), "#2F2722", mat(x, (y + rad + H - 0.7) / 2, z));
  }
  arch.aggiungi(new CylinderGeometry(0.2, 0.2, X1 - X0 - 2, 18, 1).rotateZ(Math.PI / 2), colCondotta, mat(0, 3.95, -3.4));
  arch.aggiungi(scatolaSmussata(1.6, 0.34, 3.2, 0.02), "#A8A69F", mat(6.6, 3.95, 4.2)); // canale rettangolare
  // cavi dei lampadari verranno aggiunti dopo (posizioni dei tavoli)

  /* ========== PAVIMENTO ========== */
  const pavGeom = r.add(new PlaneGeometry(X1 - X0, Z1 - Z0, 36, 24).rotateX(-Math.PI / 2));
  pavGeom.translate(0, 0, (Z0 + Z1) / 2);
  {
    const pos = pavGeom.getAttribute("position");
    const uv = pavGeom.getAttribute("uv");
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dx = Math.min(x - X0, X1 - x);
      const dz = z - Z0;
      const f = (1 - 0.2 * Math.exp(-Math.max(0, dx) / 0.6) - 0.15 * Math.exp(-Math.max(0, dz) / 0.6)) * (0.94 + 0.12 * fbm3(x * 0.25, 0, z * 0.25, 2));
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = f;
      uv.setXY(i, x / 4, z / 4);
    }
    pavGeom.setAttribute("color", new BufferAttribute(col, 3));
  }
  const matPavL = r.add(new MeshLambertMaterial({ map: texCemento, vertexColors: true, color: "#B09A7E" }));
  const matPavP = r.add(new MeshPhongMaterial({ map: texCemento, vertexColors: true, specular: "#4A4238", shininess: 55, color: "#B09A7E" }));
  const pavimento = new Mesh(pavGeom, alta() ? matPavP : matPavL);
  radice.add(pavimento);

  const matArch = r.add(new MeshLambertMaterial({ map: texCemento, vertexColors: true, color: "#FFFFFF" }));
  radice.add(new Mesh(r.add(arch.costruisci()), matArch));

  /* ========== FINESTRE ad arco (profili + vetro) e VELI ========== */
  const acc = new Fusione();
  const vetri = new Fusione();
  const mLato = (z: number) => new Matrix4().makeRotationY(-Math.PI / 2).setPosition(X0 + 0.18, 0, z);
  for (const z of FINESTRE_Z) finestraArco(acc, vetri, mLato(z), FIN.w, FIN.y0, FIN.yMolla, "#2B2724");
  const matAcc = r.add(new MeshLambertMaterial({ vertexColors: true }));
  radice.add(new Mesh(r.add(acc.costruisci()), matAcc));
  const matVetro = r.add(new MeshBasicMaterial({ color: "#DCE9EE", transparent: true, opacity: 0.2, side: DoubleSide, depthWrite: false }));
  const vetriMesh = new Mesh(r.add(vetri.costruisci()), matVetro);
  vetriMesh.renderOrder = 1;
  radice.add(vetriMesh);
  // veli bianchi (trasparenti, un solo materiale)
  const veli = new Fusione();
  const colVelo = (_x: number, _y: number, _z: number, _a: number, _b: number, nz: number, out: Color) => out.setRGB(1, 1, 1).multiplyScalar(0.86 + 0.18 * (nz * 0.5 + 0.5));
  for (const z of FINESTRE_Z) {
    const g = tendaGeom(2.5, 4.4, 0.34, 0.06, z * 3);
    veli.aggiungi(g, colVelo, mat(X0 + 0.34, 2.45, z, Math.PI / 2));
    g.dispose();
    for (const e of [-1.45, 1.45]) {
      const gl = tendaGeom(0.55, 4.6, 0.22, 0.07, z + e);
      veli.aggiungi(gl, colVelo, mat(X0 + 0.38, 2.5, z + e, Math.PI / 2));
      gl.dispose();
    }
  }
  const matVelo = r.add(new MeshLambertMaterial({ vertexColors: true, color: "#F7F3E8", emissive: "#FFF1D6", emissiveIntensity: 0.18, side: DoubleSide, transparent: true, opacity: 0.74, depthWrite: false }));
  const veliMesh = new Mesh(r.add(veli.costruisci()), matVelo);
  veliMesh.renderOrder = 3;
  radice.add(veliMesh);

  /* ========== ESTERNO visto dalle finestre: cielo, prato, alberi ========== */
  const cieloGeom = r.add(new SphereGeometry(150, 24, 12));
  cieloGeom.setAttribute("color", new BufferAttribute(new Float32Array(cieloGeom.getAttribute("position").count * 3), 3));
  const matCielo = r.add(new MeshBasicMaterial({ vertexColors: true, side: BackSide, depthWrite: false, fog: false }));
  const cielo = new Mesh(cieloGeom, matCielo);
  cielo.renderOrder = -10;
  cielo.frustumCulled = false;
  scena.add(cielo);
  scena.background = new Color(VETRATA_ORIZZ[1][1]);
  const ext = new Fusione();
  {
    const prato = new PlaneGeometry(400, 400).rotateX(-Math.PI / 2);
    ext.aggiungi(prato, (x, _y, z, _a, _b, _c, out) => out.set("#8F9C73").multiplyScalar(0.9 + 0.2 * fbm3(x * 0.1, 0, z * 0.1, 3)), mat(0, -0.45, 0));
    prato.dispose();
    const marc = new BoxGeometry(14, 0.1, 40);
    ext.aggiungi(marc, "#CFC8B8", mat(X0 - SP - 7, -0.04, -1));
    marc.dispose();
  }
  const alberi: [number, number, number, number][] = [[-14, -8, 7, 21], [-17, -1, 8.5, 22], [-13, 5, 6.5, 23], [-22, -5, 9, 24], [-21, 7, 8, 25], [-30, 1, 10, 26], [-10, 14, 6, 27]];
  for (const [x, z, h, seme] of alberi) aggiungiPianta(ext, { x, z, h, seme, senzaVaso: true, dettaglio: qualita === "high" ? 0.7 : 0.5 });
  const matEst = r.add(new MeshLambertMaterial({ vertexColors: true }));
  radice.add(new Mesh(r.add(ext.costruisci()), matEst));

  /* ========== TAVOLI (24) e SEDIE: InstancedMesh ========== */
  const righeZ = [-4.6, -1.9, 0.8, 3.5, 6.2];
  const colonneX = [-7.0, -4.2, -1.4, 1.4, 4.2, 7.0];
  const tavoli: { x: number; z: number; sedie: number }[] = [];
  righeZ.forEach((z, j) =>
    colonneX.forEach((x, i) => {
      const k = j * colonneX.length + i;
      tavoli.push({ x: x + (caso(k, 1) - 0.5) * 0.18, z: z + (caso(k, 2) - 0.5) * 0.18, sedie: caso(k, 3) < 0.28 ? 2 : 4 });
    }),
  );
  // geometria di un tavolo (piano bianco, colonna e base in metallo); versione semplice senza smussi per mid/lite
  const costruisciTavolo = (semplice: boolean): BufferGeometry => {
    const f = new Fusione();
    if (semplice) f.aggiungi(new BoxGeometry(0.8, 0.035, 0.8), "#F4F1EA", mat(0, 0.74, 0));
    else f.aggiungi(scatolaSmussata(0.8, 0.035, 0.8, 0.01), "#F4F1EA", mat(0, 0.74, 0));
    f.aggiungi(new CylinderGeometry(0.03, 0.035, 0.72, 6), "#B9BDBE", mat(0, 0.36, 0));
    f.aggiungi(new CylinderGeometry(0.2, 0.22, 0.025, semplice ? 9 : 14), "#B9BDBE", mat(0, 0.0125, 0));
    return f.costruisci();
  };
  const matTavolo = r.add(new MeshLambertMaterial({ vertexColors: true }));
  const nTavoli = tavoli.length;
  let semplice = qualita !== "high";
  const meshTavoli = creaIstanze(r.add(costruisciTavolo(semplice)), matTavolo, nTavoli);
  const arrT = meshTavoli.instanceMatrix.array as Float32Array;
  tavoli.forEach((t, i) => scriviMatrice(arrT, i, t.x, 0, t.z, (caso(i, 4) - 0.5) * 0.2));
  impostaConteggio(meshTavoli, nTavoli);
  segnaAggiornate(meshTavoli);
  radice.add(meshTavoli);

  // sedia in alluminio forato (~136 triangoli): sedile, schienale, quattro gambe. Il forato è una texture 64².
  const texForato = r.add(
    disegna(64, 64, (c, w, h) => {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "rgba(70,74,78,0.55)";
      const n = 8;
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          c.beginPath();
          c.arc((i + 0.5 + (j % 2) * 0.5) * (w / n), (j + 0.5) * (h / n), 1.5, 0, Math.PI * 2);
          c.fill();
        }
    }),
  );
  const costruisciSedia = (semp: boolean): BufferGeometry => {
    const f = new Fusione(0.32);
    const AL = "#B9BDBE";
    if (semp) {
      f.aggiungi(new BoxGeometry(0.44, 0.035, 0.42), AL, mat(0, 0.46, 0.0));
      f.aggiungi(new BoxGeometry(0.42, 0.27, 0.025), AL, mat(0, 0.69, -0.2, 0, 1, -0.12));
    } else {
      f.aggiungi(scatolaSmussata(0.44, 0.035, 0.42, 0.008), AL, mat(0, 0.46, 0.0));
      f.aggiungi(scatolaSmussata(0.42, 0.27, 0.025, 0.006), AL, mat(0, 0.69, -0.2, 0, 1, -0.12));
    }
    for (const x of [-0.18, 0.18]) {
      f.aggiungi(new BoxGeometry(0.025, 0.46, 0.025), "#8E9396", mat(x, 0.23, 0.17));
      f.aggiungi(new BoxGeometry(0.025, 0.84, 0.025), "#8E9396", mat(x, 0.42, -0.2, 0, 1, -0.06));
    }
    return f.costruisci();
  };
  const matSedia = r.add(new MeshLambertMaterial({ map: texForato, vertexColors: true }));
  const sedieDef: { x: number; z: number; rot: number }[] = [];
  tavoli.forEach((t, i) => {
    const lati = t.sedie === 4 ? [0, 1, 2, 3] : caso(i, 5) < 0.5 ? [0, 2] : [1, 3];
    for (const l of lati) {
      const a = (l * Math.PI) / 2; // direzione dal tavolo alla sedia
      const d = 0.62 + (caso(i * 4 + l, 6) - 0.5) * 0.1;
      const x = t.x + Math.sin(a) * d;
      const z = t.z + Math.cos(a) * d;
      sedieDef.push({ x, z, rot: a + Math.PI + (caso(i * 4 + l, 7) - 0.5) * 0.3 });
    }
  });
  const meshSedie = creaIstanze(r.add(costruisciSedia(semplice)), matSedia, sedieDef.length);
  const arrS = meshSedie.instanceMatrix.array as Float32Array;
  sedieDef.forEach((s, i) => scriviMatrice(arrS, i, s.x, 0, s.z, s.rot));
  impostaConteggio(meshSedie, sedieDef.length);
  segnaAggiornate(meshSedie);
  radice.add(meshSedie);

  // ombre a contatto: una per tavolo (comprende le sedie)
  const ombre = creaOmbreIstanziate(nTavoli + 4);
  tavoli.forEach((t, i) => scriviOmbra(ombre, i, t.x, t.z, 1.7, 1.7, 0, 0.25));
  PILASTRI_INT.forEach(([x, z], i) => scriviOmbra(ombre, nTavoli + i, x, z, 0.62, 0.62, 0, 0.25));
  impostaConteggio(ombre, nTavoli + PILASTRI_INT.length);
  radice.add(ombre);

  /* ========== LAMPADE ad abat-jour miele (istanziate) e cavi ========== */
  const idxLampade = [1, 3, 4, 7, 9, 12, 14, 16, 19, 22, 24];
  const lampade = idxLampade.map((k, n) => ({
    x: tavoli[k].x + (caso(n, 8) - 0.5) * 0.3,
    z: tavoli[k].z + (caso(n, 9) - 0.5) * 0.3,
    y: 2.5 + caso(n, 10) * 0.7,
    s: 0.78 + caso(n, 11) * 0.22,
  }));
  const cavi = new Fusione();
  for (const l of lampade) cavi.aggiungi(new CylinderGeometry(0.006, 0.006, H - 0.7 - l.y, 4), "#1E1A17", mat(l.x, (H - 0.7 + l.y) / 2, l.z));
  radice.add(new Mesh(r.add(cavi.costruisci()), r.add(new MeshLambertMaterial({ vertexColors: true }))));
  const gShade = r.add(new CylinderGeometry(0.17, 0.3, 0.36, 16, 1, true));
  const matShade = r.add(new MeshLambertMaterial({ color: "#F2C27A", emissive: "#F2C27A", emissiveIntensity: 0.22, side: DoubleSide }));
  const meshLampade = creaIstanze(gShade, matShade, lampade.length);
  const arrL = meshLampade.instanceMatrix.array as Float32Array;
  lampade.forEach((l, i) => scriviMatrice(arrL, i, l.x, l.y, l.z, 0, l.s));
  impostaConteggio(meshLampade, lampade.length);
  segnaAggiornate(meshLampade);
  radice.add(meshLampade);

  /* ========== SPECCHI, RAMI SECCHI, PIANTE ========== */
  const arr = new Fusione();
  const specchi: { x: number; y: number; w: number; h: number }[] = [
    { x: 2.7, y: 2.05, w: 1.7, h: 1.7 },
    { x: 5.5, y: 1.95, w: 1.5, h: 1.9 },
  ];
  const COL_CORNICE = "#2A211B";
  for (const m of specchi) {
    const t = 0.12;
    arr.aggiungi(scatolaSmussata(m.w + 2 * t, t, 0.1, 0.012), COL_CORNICE, mat(m.x, m.y + m.h / 2 + t / 2, Z0 + 0.06));
    arr.aggiungi(scatolaSmussata(m.w + 2 * t, t, 0.1, 0.012), COL_CORNICE, mat(m.x, m.y - m.h / 2 - t / 2, Z0 + 0.06));
    arr.aggiungi(scatolaSmussata(t, m.h, 0.1, 0.012), COL_CORNICE, mat(m.x - m.w / 2 - t / 2, m.y, Z0 + 0.06));
    arr.aggiungi(scatolaSmussata(t, m.h, 0.1, 0.012), COL_CORNICE, mat(m.x + m.w / 2 + t / 2, m.y, Z0 + 0.06));
  }
  // rami secchi: tubi sottili che si biforcano (colore bruno grigiastro, punte più chiare)
  const ramo = (x0: number, y0: number, z0: number, dx: number, dy: number, dz: number, len: number, rad: number, prof: number, seme: number) => {
    const n = 4;
    const pts: [number, number, number][] = [];
    let x = x0;
    let y = y0;
    let z = z0;
    let ax = dx;
    let ay = dy;
    let az = dz;
    for (let i = 0; i <= n; i++) {
      pts.push([x, y, z]);
      ax += (caso(seme + i, 31) - 0.5) * 0.7;
      ay += (caso(seme + i, 32) - 0.5) * 0.6 - 0.05;
      az += (caso(seme + i, 33) - 0.5) * 0.2;
      const l = Math.hypot(ax, ay, az) || 1;
      x += (ax / l) * (len / n);
      y += (ay / l) * (len / n);
      z += (az / l) * (len / n);
    }
    const g = creaTubo({
      punti: pts,
      raggio: (u) => rad * (1 - 0.82 * u),
      lati: 6,
      anelli: 9,
      punta: 0.15,
      deforma: (q, _th, _u, out) => {
        out.r = 0.85 + 0.3 * fbm3(q.x * 6, q.y * 6, q.z * 6, 5);
      },
      colore: (_q, u, _th, _b, out) => out.set("#5E4B3A").lerp(new Color("#A58B6E"), u * 0.7),
    });
    arr.aggiungi(g, null);
    g.dispose();
    if (prof > 0) {
      const p = pts[3];
      ramo(p[0], p[1], p[2], ax * 0.8 + 0.5, ay + 0.3, az, len * 0.65, rad * 0.5, prof - 1, seme + 40);
      ramo(p[0], p[1], p[2], ax * 0.8 - 0.5, ay - 0.1, az, len * 0.55, rad * 0.45, prof - 1, seme + 80);
    }
  };
  const pr = qualita === "high" ? 2 : 1;
  ramo(7.4, 0.9, Z0 + 0.25, 0.1, 1, 0.06, 1.5, 0.035, pr, 1);
  ramo(7.6, 1.2, Z0 + 0.25, 0.8, 0.5, 0.06, 1.3, 0.03, pr, 11);
  ramo(7.2, 1.5, Z0 + 0.25, -0.6, 0.8, 0.06, 1.1, 0.03, 1, 21);
  ramo(8.2, 1.0, Z0 + 0.25, 0.1, 1, 0.06, 1.2, 0.03, pr, 31);
  const matArr = r.add(new MeshLambertMaterial({ vertexColors: true }));
  radice.add(new Mesh(r.add(arr.costruisci()), matArr));
  // specchi: superficie con gradiente e un lampo diagonale (nessun riflesso vero)
  const mir = new Fusione();
  for (const m of specchi) {
    const g = new PlaneGeometry(m.w, m.h, 4, 4);
    mir.aggiungi(g, (x, y, _z, _a, _b, _c, out) => out.set("#9A9A94").lerp(new Color("#C9C6BC"), smoothstep(-1, 1, (y - 2 + x * 0.6) / 1.2) * 0.6), mat(m.x, m.y, Z0 + 0.012));
    g.dispose();
  }
  const matSpecchio = r.add(new MeshBasicMaterial({ vertexColors: true, color: "#8E8B82" }));
  radice.add(new Mesh(r.add(mir.costruisci()), matSpecchio));
  const pia = new Fusione();
  aggiungiPianta(pia, { x: -8.1, z: -5.9, h: 2.8, vaso: "#7A624E", dVaso: 0.7, seme: 41, dettaglio: qualita === "high" ? 1 : 0.6 });
  aggiungiPianta(pia, { x: 8.2, z: 3.2, h: 2.2, vaso: "#7A624E", dVaso: 0.6, seme: 42, dettaglio: qualita === "high" ? 1 : 0.6 });
  const piante = new Mesh(r.add(pia.costruisci()), r.add(new MeshLambertMaterial({ vertexColors: true })));
  radice.add(piante);

  /* ========== DETTAGLI della giornata: tazzine, calici, lumini (scala 0 <-> 1) ========== */
  const posDettagli = [0, 2, 5, 6, 8, 10, 11, 13, 15, 16, 18, 20, 21, 23, 24, 27, 29];
  const gTazza = r.add(
    (() => {
      const f = new Fusione();
      f.aggiungi(new LatheGeometry([new Vector2(0.001, 0), new Vector2(0.03, 0), new Vector2(0.036, 0.055), new Vector2(0.031, 0.055), new Vector2(0.001, 0.008)], 8), "#FFFFFF");
      f.aggiungi(new CylinderGeometry(0.055, 0.055, 0.008, 10), "#F4F1EA", mat(0, -0.004, 0));
      return f.costruisci();
    })(),
  );
  const gCalice = r.add(
    (() => {
      const f = new Fusione();
      f.aggiungi(new LatheGeometry([new Vector2(0.001, 0), new Vector2(0.03, 0), new Vector2(0.004, 0.012), new Vector2(0.004, 0.09), new Vector2(0.03, 0.13), new Vector2(0.036, 0.19), new Vector2(0.026, 0.2)], 8), "#E3EEF2");
      return f.costruisci();
    })(),
  );
  const gLume = r.add(new CylinderGeometry(0.018, 0.018, 0.1, 8));
  const matTazza = r.add(new MeshLambertMaterial({ vertexColors: true }));
  const matCalice = r.add(new MeshLambertMaterial({ vertexColors: true, emissive: "#6B7A80", emissiveIntensity: 0.3 }));
  const matLume = r.add(new MeshBasicMaterial({ color: "#FFE2B0" }));
  const meshTazze = creaIstanze(gTazza, matTazza, posDettagli.length);
  const meshCalici = creaIstanze(gCalice, matCalice, posDettagli.length * 2);
  const meshLumi = creaIstanze(gLume, matLume, posDettagli.length);
  const scriviDettagli = (sTazza: number, sCalice: number, sLume: number) => {
    const aT = meshTazze.instanceMatrix.array as Float32Array;
    const aC = meshCalici.instanceMatrix.array as Float32Array;
    const aL = meshLumi.instanceMatrix.array as Float32Array;
    posDettagli.forEach((k, i) => {
      const t = tavoli[k];
      scriviMatrice(aT, i, t.x + 0.13, 0.758, t.z + 0.1, i, sTazza);
      scriviMatrice(aC, i * 2, t.x - 0.22, 0.758, t.z + 0.14, 0, sCalice);
      scriviMatrice(aC, i * 2 + 1, t.x + 0.2, 0.758, t.z - 0.2, 0, sCalice);
      scriviMatrice(aL, i, t.x, 0.805, t.z, 0, sLume);
    });
    segnaAggiornate(meshTazze);
    segnaAggiornate(meshCalici);
    segnaAggiornate(meshLumi);
  };
  impostaConteggio(meshTazze, posDettagli.length);
  impostaConteggio(meshCalici, posDettagli.length * 2);
  impostaConteggio(meshLumi, posDettagli.length);
  radice.add(meshTazze, meshCalici, meshLumi);

  /* ========== LUCE FINTA: chiazze di sole, aloni, pozze, riflessi negli specchi ========== */
  const chiazze = FINESTRE_Z.map((z) => {
    // contorno dell'apertura ad arco sul piano del muro
    const pts: [number, number, number][] = [[X0, FIN.y0, z - FIN.w / 2], [X0, FIN.y0, z + FIN.w / 2], [X0, FIN.yMolla, z + FIN.w / 2]];
    for (let i = 1; i < 9; i++) {
      const a = (i / 9) * Math.PI;
      pts.push([X0, FIN.yMolla + (FIN.w / 2) * Math.sin(a), z + (FIN.w / 2) * Math.cos(a)]);
    }
    pts.push([X0, FIN.yMolla, z - FIN.w / 2]);
    const c = new Chiazza(r, pts);
    radice.add(c.mesh);
    return c;
  });
  const puntiAloni = [
    ...lampade.map((l) => ({ pos: [l.x, l.y - 0.12, l.z + 0.3] as const, raggio: 1.15 * l.s })),
    ...[-5.2, 0, 5.2].flatMap((x) => [-4, -1, 2, 4.8].map((z) => ({ pos: [x, H - 0.8, z + 0.2] as const, raggio: 0.55, intensita: 0.75 }))),
    ...specchi.map((m) => ({ pos: [m.x - 0.15, m.y + 0.2, Z0 + 0.1] as const, raggio: 0.45, intensita: 0.6 })),
  ];
  const aloni = new AloniFusi(r, puntiAloni);
  radice.add(aloni.mesh);
  const pozze = new PozzeLuce(r, lampade.map((l) => ({ pos: [l.x, 0, l.z] as const, raggio: 1.9, intensita: 0.8 })), 0.014);
  radice.add(pozze.mesh);

  /* ========== la luce è una funzione di t ========== */
  const c1 = new Color();
  const c2 = new Color();
  const cz = new Color();
  let t = 0;
  let spentoPuntuale = lite();
  const applicaLuce = () => {
    const el = campionaScalare(SOLE_EL, t);
    const az = campionaScalare(SOLE_AZ, t);
    const dir = direzioneSole(el, az);
    luci.setKey(campionaColore(KEY_COL, t, c1), campionaScalare(KEY_INT, t), dir);
    luci.setHemi(campionaScalare(HEMI_INT, t), campionaColore(HEMI_CIELO, t, c2));
    luci.setPunto(spentoPuntuale ? 0 : campionaScalare(PUNTO, t));
    const orizz = campionaColore(VETRATA_ORIZZ, t, c1);
    const zenit = campionaColore(VETRATA_ZENIT, t, c2);
    (scena.background as Color).copy(orizz);
    const pos = cieloGeom.getAttribute("position");
    const col = cieloGeom.getAttribute("color") as BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const k = Math.pow(Math.min(1, Math.max(0, pos.getY(i) / 90)), 0.7);
      cz.copy(orizz).lerp(zenit, k);
      col.setXYZ(i, cz.r, cz.g, cz.b);
    }
    col.needsUpdate = true;
    matArch.color.copy(campionaColore(PARETE, t, c1));
    matSpecchio.color.copy(campionaColore(SPECCHIO, t, c1));
    matVelo.emissiveIntensity = 0.18 * (1 - smoothstep(0.55, 0.95, t));
    matVetro.opacity = 0.2 + 0.12 * smoothstep(0.7, 1, t);
    matShade.emissiveIntensity = campionaScalare(LAMPADA, t);
    aloni.setOpacita(campionaScalare(ALONE, t));
    pozze.setOpacita(campionaScalare(POZZE, t));
    // sole sul pavimento: l'arco di ogni finestra proiettato lungo la direzione del sole
    const sinEl = Math.sin((el * Math.PI) / 180);
    const daSinistra = smoothstep(-0.02, -0.3, dir[0]);
    const lum = campionaScalare(SOLE_PATCH, t) * smoothstep(0.1, 0.3, sinEl) * daSinistra * 0.55;
    for (const c of chiazze) c.aggiorna(dir, 0, lum, { x: [X0 + 0.2, X1 - 0.2], z: [Z0 + 0.2, Z1 - 0.1] }, 0.1);
    // dettagli della giornata
    scriviDettagli(1 - smoothstep(0.12, 0.3, t), smoothstep(0.5, 0.62, t), smoothstep(0.86, 0.96, t));
  };
  applicaLuce();

  const applicaQualita = () => {
    spentoPuntuale = lite();
    const nuovoSemplice = qualita !== "high";
    if (nuovoSemplice !== semplice) {
      semplice = nuovoSemplice;
      meshTavoli.geometry.dispose();
      meshTavoli.geometry = r.add(costruisciTavolo(semplice));
      meshSedie.geometry.dispose();
      meshSedie.geometry = r.add(costruisciSedia(semplice));
    }
    pavimento.material = alta() ? matPavP : matPavL;
    const piccoli = !lite();
    meshTazze.visible = piccoli;
    meshCalici.visible = piccoli;
    meshLumi.visible = piccoli;
    applicaLuce();
  };
  applicaQualita();

  return {
    scena,
    camera,
    radice,
    setLuce(v) {
      t = Math.min(1, Math.max(0, v));
      applicaLuce();
    },
    setProgresso() {
      /* la giornata è tutta in setLuce(t): nessun avanzamento separato */
    },
    vaiA: (v, istantaneo) => rig.vaiA(v, istantaneo),
    ruota: (g) => rig.ruota(g),
    proietta: (p, out) => rig.proietta(p, out),
    update: (dt) => rig.update(dt),
    setQualita(q) {
      qualita = q;
      applicaQualita();
    },
    resize(l, a) {
      rig.resize(l, a);
      adattaFov(l, a);
    },
    dispose() {
      r.dispose();
      scena.clear();
    },
  };
}
