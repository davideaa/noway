/*
 * Hall: la scena 3D (three). Si importa SOLO da `def.ts` con `import()`.
 *
 * Ipotesi dichiarata (DESIGN 5.1): un volume alto e luminoso, ricostruito a occhio dalla foto di
 * riferimento, in scala stilizzata (le misure della hall non sono note, DESIGN 5.1 punto 2):
 *   18 x 14 m in pianta, soffitto a 8,4 m, lucernario a falde in vetro su un pozzo di luce,
 *   facciata vetrata con porta girevole, due finestre ad arco con tende, una parete di tende,
 *   vetrate verticali sul lato destro, banco, divanetti, ficus in vaso, e al centro la scultura
 *   di tronco d'ulivo (procedurale). Tutto cotto in poche mesh a colori per vertice.
 *
 * Luce: `setLuce(t)` (0 alba · 1/3 mattina · 2/3 pomeriggio · 1 sera) muove il sole, il colore
 * del cielo, la macchia di sole sul pavimento (la proiezione vera del lucernario), il raggio
 * finto e gli aloni delle lampade. `setProgresso(p)` guida la camera e gira la porta.
 */

import {
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Path,
  AdditiveBlending,
  Uint16BufferAttribute,
} from "three";
import type { Qualita, SceneContext, SceneHandle } from "../../content/types";
import { LuciBase, campionaColore, campionaScalare, type StopColore, type StopScalare } from "../../lib/three/lights";
import { Risorse, disegna, prng } from "../../lib/three/materials";
import { creaOmbreIstanziate, scriviOmbra } from "../../lib/three/shadows";
import { barra, muro, poligono, tendaGeom, type Apertura } from "../_geo-hall-grill/architettura";
import { Fusione, mat, scatolaSmussata } from "../_geo-hall-grill/fusione";
import { AloniFusi, Chiazza, PozzeLuce, RaggioSole, smoothstep } from "../_geo-hall-grill/luce";
import { fbm3 } from "../_geo-hall-grill/rumore";
import { aggiungiPianta } from "../_geo-hall-grill/vegetazione";
import { CameraHall, TRONCO_POS } from "./camera";
import { TRONCO_INGOMBRO, costruisciTronco } from "./tronco";

/* ───────────────────────── Misure (m, stilizzate) ───────────────────────── */

const X0 = -9;
const X1 = 9;
const Z0 = -7; // parete di fondo
const Z1 = 7; // facciata con l'ingresso
const H = 8.4; // soffitto
const SP = 0.45; // spessore dei muri
/** Lucernario: apertura nel soffitto e tetto a falde sopra. */
const SKY = { cx: 0.6, cz: -2.4, w: 8, d: 6, quotaGronda: 9.7, quotaColmo: 11.5 } as const;
const PORTA = { x: 2.85, r: 1.12 } as const;
const VERTICALI_X = [-3.2, 0, 3.2]; // vetrate verticali sulla parete destra (z)

/* ───────────────────────── Tabelle di luce (MOTION 3.4) ───────────────────────── */

const KEY_COL: StopColore[] = [[0, "#FFC89A"], [1 / 3, "#FFF1DC"], [2 / 3, "#FFE3BC"], [1, "#FFB867"]];
const KEY_INT: StopScalare[] = [[0, 1.1], [1 / 3, 1.6], [2 / 3, 1.5], [1, 0.5]];
const HEMI_INT: StopScalare[] = [[0, 0.7], [1 / 3, 0.7], [2 / 3, 0.68], [1, 0.52]];
const HEMI_CIELO: StopColore[] = [[0, "#F9DCC6"], [1 / 3, "#E8EEF2"], [2 / 3, "#F4EADA"], [1, "#6E7EA2"]];
const CIELO_ORIZZONTE: StopColore[] = [[0, "#F6C9A6"], [1 / 3, "#D6E6EE"], [2 / 3, "#E4ECEF"], [1, "#3A4A66"]];
const CIELO_ZENIT: StopColore[] = [[0, "#A9BFD6"], [1 / 3, "#7FA9CC"], [2 / 3, "#8FB4D2"], [1, "#161D31"]];
const PARETE: StopColore[] = [[0, "#DAD5CB"], [2 / 3, "#DAD5CB"], [1, "#7E6F58"]];
const VETRO: StopColore[] = [[0, "#E8EDEE"], [2 / 3, "#DCE9EE"], [1, "#56688A"]];
const ALONE: StopScalare[] = [[0, 0], [0.62, 0], [0.667, 0.15], [0.95, 1], [1, 1]];
const LAMPADA: StopScalare[] = [[0, 0.3], [0.6, 0.3], [1, 1]];
const POZZE: StopScalare[] = [[0, 0], [0.7, 0], [0.97, 0.9], [1, 0.9]];
const TENDA_LUCE: StopScalare[] = [[0, 0.1], [1 / 3, 0.22], [2 / 3, 0.2], [0.9, 0.04], [1, 0]];

/** Esposizione: i valori di DESIGN 5.3 sono relativi; con i colori chiari della hall bruciano a 1,0. */
const ESPOSIZIONE_KEY = 0.62;
const ESPOSIZIONE_HEMI = 0.8;

/** Sole (MOTION 3.4), con la componente z ridotta: la macchia cade fra lucernario e tronco. */
export function sole(h: number): { dir: [number, number, number]; sinEl: number } {
  const el = ((6 + 56 * Math.sin(Math.PI * h)) * Math.PI) / 180;
  const az = ((-75 + 150 * h) * Math.PI) / 180;
  const x = Math.sin(az) * Math.cos(el);
  const y = Math.sin(el);
  const z = 0.4 * Math.cos(az) * Math.cos(el);
  const l = Math.hypot(x, y, z);
  return { dir: [x / l, y / l, z / l], sinEl: Math.sin(el) };
}

/* ───────────────────────── Geometria di supporto ───────────────────────── */

/** Contorno di un'apertura nel mondo (per la proiezione del sole), N punti. */
function contornoRett(cx: number, cz: number, w: number, d: number, y: number): [number, number, number][] {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  const pts: [number, number, number][] = [];
  const k = 3;
  for (let i = 0; i < k; i++) pts.push([x0 + (w * i) / k, y, z0]);
  for (let i = 0; i < k; i++) pts.push([x1, y, z0 + (d * i) / k]);
  for (let i = 0; i < k; i++) pts.push([x1 - (w * i) / k, y, z1]);
  for (let i = 0; i < k; i++) pts.push([x0, y, z1 - (d * i) / k]);
  return pts;
}

/** Occlusione cotta nella stanza: più scuro a terra, sotto il soffitto e negli angoli. */
function aoStanza(x: number, y: number, z: number): number {
  const dx = Math.min(x - X0, X1 - x);
  const dz = Math.min(z - Z0, Z1 - z);
  const angolo = Math.exp(-Math.max(0, Math.min(dx, dz)) / 0.55);
  const terra = Math.exp(-Math.max(0, y) / 0.5);
  const sopra = Math.exp(-Math.max(0, H - y) / 0.7);
  return Math.max(0.5, 1 - 0.2 * terra - 0.12 * sopra - 0.1 * angolo);
}

/* ───────────────────────── Build ───────────────────────── */

export function build(ctx: SceneContext): SceneHandle {
  const r = new Risorse();
  const scena = new Scene();
  const radice = new Group();
  scena.add(radice);
  const camera = new PerspectiveCamera(38, ctx.larghezza / ctx.altezza, 0.1, 260);
  const cam = new CameraHall({
    camera,
    larghezza: ctx.larghezza,
    altezza: ctx.altezza,
    reducedMotion: ctx.reducedMotion,
    limiti: { az: [-40, 40], pol: [60, 130] },
  });
  let qualita: Qualita = ctx.qualita;
  const alta = () => qualita === "high";
  const dettaglioTronco = () => (qualita === "high" ? 1 : qualita === "mid" ? 0.78 : 0.6);
  const piccoliVisibili = () => qualita === "high" || qualita === "mid";

  const luci = new LuciBase({ keyDirezione: [0.2, 0.9, 0.3], hemiIntensita: 0.7 });
  scena.add(luci.gruppo);

  /* ========== ARCHITETTURA (una mesh: muri, soffitto, pozzo di luce, colonne, cornici) ========== */
  const arch = new Fusione();
  const tintaStanza = (x: number, y: number, z: number) => aoStanza(x, y, z) * (0.97 + 0.06 * fbm3(x * 0.5, y * 0.5, z * 0.5, 4));
  const pareteBianca = "#FFFFFF";

  // aperture
  const arcoFondo = (s: number): Apertura => ({ tipo: "arco", s, w: 2.7, y0: 0.0, yMolla: 4.7 });
  const finFondo = [-5.6, -2.0];
  const muroFondo = muro("x", Z0, 1, X0, X1, H, finFondo.map(arcoFondo), SP);
  const muroDestro = muro("z", X1, -1, Z0, Z1, H, VERTICALI_X.map((s) => ({ tipo: "rett" as const, s, w: 1.25, y0: 0.5, y1: 6.6 })), SP);
  const muroSinistro = muro("z", X0, 1, Z0, Z1, H, [], SP);
  const muroFronte = muro("x", Z1, -1, X0, X1, H, [
    { tipo: "rett", s: 0, w: 8.8, y0: 0, y1: 7.5 },
    { tipo: "arco", s: -6.8, w: 2.3, y0: 0.5, yMolla: 4.2 },
    { tipo: "arco", s: 6.8, w: 2.3, y0: 0.5, yMolla: 4.2 },
  ], SP);
  for (const g of [muroFondo, muroDestro, muroSinistro, muroFronte]) {
    arch.aggiungi(g, pareteBianca, undefined, tintaStanza);
    g.dispose();
  }
  // soffitto con l'apertura del lucernario (la faccia guarda in basso)
  {
    const forma = new Shape();
    forma.moveTo(X0, Z0);
    forma.lineTo(X1, Z0);
    forma.lineTo(X1, Z1);
    forma.lineTo(X0, Z1);
    forma.lineTo(X0, Z0);
    const buco = new Path();
    const x0 = SKY.cx - SKY.w / 2;
    const x1 = SKY.cx + SKY.w / 2;
    const z0 = SKY.cz - SKY.d / 2;
    const z1 = SKY.cz + SKY.d / 2;
    buco.moveTo(x0, z0);
    buco.lineTo(x1, z0);
    buco.lineTo(x1, z1);
    buco.lineTo(x0, z1);
    buco.lineTo(x0, z0);
    forma.holes.push(buco);
    const g = new ShapeGeometry(forma);
    g.rotateX(Math.PI / 2);
    g.translate(0, H, 0);
    arch.aggiungi(g, "#F2EBDD", undefined, (x, y, z) => 0.82 + 0.18 * smoothstep(0, 6, Math.hypot(x - SKY.cx, z - SKY.cz) - 3));
    g.dispose();
    // pozzo di luce: 4 pareti interne dall'apertura alla gronda, più chiare verso l'alto
    const w = [
      [[x0, H, z0], [x1, H, z0], [x1, SKY.quotaGronda, z0], [x0, SKY.quotaGronda, z0]],
      [[x1, H, z0], [x1, H, z1], [x1, SKY.quotaGronda, z1], [x1, SKY.quotaGronda, z0]],
      [[x1, H, z1], [x0, H, z1], [x0, SKY.quotaGronda, z1], [x1, SKY.quotaGronda, z1]],
      [[x0, H, z1], [x0, H, z0], [x0, SKY.quotaGronda, z0], [x0, SKY.quotaGronda, z1]],
    ] as const;
    for (const q of w) {
      const pg = new BufferGeometry();
      pg.setAttribute("position", new Float32BufferAttribute(q.flat(), 3));
      pg.setIndex([0, 1, 2, 0, 2, 3]);
      pg.computeVertexNormals();
      arch.aggiungi(pg, "#FBF6EA", undefined, (_x, y) => 0.7 + 0.5 * smoothstep(H, SKY.quotaGronda, y));
      pg.dispose();
    }
  }
  // cornice e zoccolo esterni della facciata (architettura classica)
  arch.aggiungi(new BoxGeometry(X1 - X0 + 2 * SP + 0.5, 0.35, 0.7), "#EDE5D3", mat(0, H + 0.05, Z1 + 0.35));
  arch.aggiungi(new BoxGeometry(X1 - X0 + 2 * SP + 0.2, 0.5, 0.2), "#C9C0AC", mat(0, 0.25, Z1 + SP + 0.08));
  for (const x of [-8.6, -4.7, 4.7, 8.6]) arch.aggiungi(new BoxGeometry(0.5, H, 0.16), "#E4DCC8", mat(x, H / 2, Z1 + SP + 0.08));
  // pensilina sopra l'ingresso
  arch.aggiungi(scatolaSmussata(9.6, 0.3, 3.4, 0.04), "#EFE8D8", mat(0, 3.55, Z1 + SP + 1.5));
  // travi e condotte a vista (le canalizzazioni della foto)
  arch.aggiungi(scatolaSmussata(X1 - X0, 0.55, 0.6, 0.03), "#EAE2D2", mat(0, H - 0.3, 3.4));
  arch.aggiungi(scatolaSmussata(X1 - X0, 0.55, 0.6, 0.03), "#EAE2D2", mat(0, H - 0.3, -6.2));
  arch.aggiungi(new CylinderGeometry(0.34, 0.34, 8.4, 20, 1).rotateZ(Math.PI / 2), "#F3EFE6", mat(-4.6, H - 0.55, 1.0), (x, y) => 0.8 + 0.2 * Math.max(0, Math.min(1, (y - (H - 0.9)) / 0.7)));
  arch.aggiungi(new CylinderGeometry(0.26, 0.26, 8.4, 18, 1).rotateX(Math.PI / 2), "#EFEBE0", mat(-6.4, H - 0.5, -1.2));
  // porta girevole: cappello superiore e zoccolo
  arch.aggiungi(new CylinderGeometry(PORTA.r + 0.12, PORTA.r + 0.12, 0.2, 28), "#E7DFCD", mat(PORTA.x, 2.62, Z1 - 0.1));
  arch.aggiungi(new CylinderGeometry(PORTA.r + 0.08, PORTA.r + 0.08, 0.06, 28), "#B9B1A1", mat(PORTA.x, 0.03, Z1 - 0.1));
  // pilastro/lesene sulla parete di fondo, fra gli archi e ai lati
  for (const x of [-7.8, -3.8, -0.2]) arch.aggiungi(new BoxGeometry(0.5, H, 0.22), "#E2D9C5", mat(x, H / 2, Z0 + 0.11), (_x, y) => 0.8 + 0.2 * smoothstep(0, 3, y));
  const matArch = r.add(new MeshLambertMaterial({ vertexColors: true, color: PARETE[0][1] }));
  const archMesh = new Mesh(r.add(arch.costruisci()), matArch);
  radice.add(archMesh);

  /* ========== PAVIMENTO ========== */
  const texPav = r.add(
    disegna(512, 512, (c, w, h) => {
      const rnd = prng(77);
      const n = 4;
      const L = w / n;
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          const v = 0.965 + rnd() * 0.07;
          const g = Math.round(v * 236);
          c.fillStyle = `rgb(${g},${Math.round(g * 0.985)},${Math.round(g * 0.955)})`;
          c.fillRect(i * L, j * L, L, L);
          // vena morbida diagonale
          const gr = c.createLinearGradient(i * L, j * L, (i + 1) * L, (j + 1) * L);
          gr.addColorStop(0, "rgba(255,255,255,0.05)");
          gr.addColorStop(0.5, "rgba(120,100,70,0.045)");
          gr.addColorStop(1, "rgba(255,255,255,0.04)");
          c.fillStyle = gr;
          c.fillRect(i * L, j * L, L, L);
        }
      c.fillStyle = "rgba(110,98,78,0.38)";
      for (let k = 0; k <= n; k++) {
        c.fillRect(Math.min(w - 1.5, k * L - 0.75), 0, 1.5, h);
        c.fillRect(0, Math.min(h - 1.5, k * L - 0.75), w, 1.5);
      }
    }),
  );
  const pavGeom = r.add(new PlaneGeometry(X1 - X0, Z1 - Z0, 36, 28).rotateX(-Math.PI / 2));
  {
    const pos = pavGeom.getAttribute("position");
    const uv = pavGeom.getAttribute("uv");
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dx = Math.min(x - X0, X1 - x);
      const dz = Math.min(z - Z0, Z1 - z);
      const f = 1 - 0.2 * Math.exp(-Math.min(dx, dz) / 0.6);
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = f;
      uv.setXY(i, (x - X0) / 4.8, (z - Z0) / 4.8);
    }
    pavGeom.setAttribute("color", new BufferAttribute(col, 3));
  }
  texPav.repeat.set(1, 1);
  const matPavLambert = r.add(new MeshLambertMaterial({ map: texPav, vertexColors: true, color: "#DAD5CB" }));
  const matPavLucido = r.add(new MeshPhongMaterial({ map: texPav, vertexColors: true, color: "#DAD5CB", specular: "#3C3A36", shininess: 70 }));
  const pavimento = new Mesh(pavGeom, alta() ? matPavLucido : matPavLambert);
  radice.add(pavimento);

  /* ========== STRUTTURE IN ACCIAIO (telai, montanti, tetto) e VETRI ========== */
  const acc = new Fusione();
  const COL_ACC = "#3B4046";
  const vetri = new Fusione();
  // -- tetto a falde del lucernario
  {
    const x0 = SKY.cx - SKY.w / 2;
    const x1 = SKY.cx + SKY.w / 2;
    const z0 = SKY.cz - SKY.d / 2;
    const z1 = SKY.cz + SKY.d / 2;
    const yg = SKY.quotaGronda;
    const yc = SKY.quotaColmo;
    const c1: [number, number, number] = [SKY.cx - 1.6, yc, SKY.cz];
    const c2: [number, number, number] = [SKY.cx + 1.6, yc, SKY.cz];
    const A: [number, number, number] = [x0, yg, z0];
    const B: [number, number, number] = [x1, yg, z0];
    const C: [number, number, number] = [x1, yg, z1];
    const D: [number, number, number] = [x0, yg, z1];
    poligono(vetri, [A, B, c2, c1], 0xffffff); // falda di fondo
    poligono(vetri, [D, C, c2, c1], 0xffffff); // falda frontale
    poligono(vetri, [A, D, c1], 0xffffff); // spioventi corti
    poligono(vetri, [B, C, c2], 0xffffff);
    const T = 0.1;
    // gronda, colmo, costoloni d'angolo
    for (const [p, q] of [[A, B], [B, C], [C, D], [D, A], [c1, c2], [A, c1], [D, c1], [B, c2], [C, c2]] as const) barra(acc, p, q, T, COL_ACC);
    // travetti sulle falde lunghe: ogni ~1,3 m
    const nT = 5;
    for (let i = 1; i < nT; i++) {
      const k = i / nT;
      const xa = x0 + (x1 - x0) * k;
      const xr = Math.min(c2[0], Math.max(c1[0], xa));
      barra(acc, [xa, yg, z0], [xr, yc, SKY.cz], 0.07, COL_ACC);
      barra(acc, [xa, yg, z1], [xr, yc, SKY.cz], 0.07, COL_ACC);
    }
    // correnti orizzontali a metà falda
    for (const k of [0.34, 0.67]) {
      const y = yg + (yc - yg) * k;
      const zz = (1 - k) * (z1 - SKY.cz);
      const zb = SKY.cz - zz;
      const zf = SKY.cz + zz;
      const xa = x0 + (c1[0] - x0) * k;
      const xb = x1 + (c2[0] - x1) * k;
      barra(acc, [xa, y, zb], [xb, y, zb], 0.05, COL_ACC);
      barra(acc, [xa, y, zf], [xb, y, zf], 0.05, COL_ACC);
    }
    // montanti del pozzo (cornice dell'apertura sul soffitto)
    for (const [p, q] of [[[x0, H, z0], [x1, H, z0]], [[x1, H, z0], [x1, H, z1]], [[x1, H, z1], [x0, H, z1]], [[x0, H, z1], [x0, H, z0]]] as const) barra(acc, p, q, 0.12, "#D8D0BD");
  }
  // tiranti d'acciaio della pensilina (dal bordo anteriore alla facciata)
  for (const x of [-4.5, 4.5]) barra(acc, [x, 3.5, Z1 + SP + 3.1], [x, 5.9, Z1 + SP + 0.05], 0.05, COL_ACC);
  // -- facciata vetrata: telaio, montanti, traversi
  {
    const zf = Z1 + 0.12;
    const xa = -4.4;
    const xb = 4.4;
    const yt = 7.5;
    for (let x = xa; x <= xb + 0.01; x += 1.1) {
      if (Math.abs(x) < 1.2) {
        barra(acc, [x, 2.65, zf], [x, yt, zf], 0.07, COL_ACC); // sopra la porta scorrevole libera
        continue;
      }
      if (Math.abs(x - PORTA.x) < PORTA.r + 0.15) {
        barra(acc, [x, 2.75, zf], [x, yt, zf], 0.07, COL_ACC);
        continue;
      }
      barra(acc, [x, 0.05, zf], [x, yt, zf], 0.07, COL_ACC);
    }
    for (const y of [2.7, 4.6, 6.2, yt]) barra(acc, [xa, y, zf], [xb, y, zf], 0.07, COL_ACC);
    barra(acc, [xa, 0.05, zf], [xb, 0.05, zf], 0.09, COL_ACC);
    // porte scorrevoli centrali: due ante con telaio
    for (const s of [-1, 1]) {
      const cx = s * 0.55;
      barra(acc, [cx - 0.5, 0.05, zf + 0.02], [cx - 0.5, 2.6, zf + 0.02], 0.06, COL_ACC);
      barra(acc, [cx + 0.5, 0.05, zf + 0.02], [cx + 0.5, 2.6, zf + 0.02], 0.06, COL_ACC);
      barra(acc, [cx - 0.5, 2.6, zf + 0.02], [cx + 0.5, 2.6, zf + 0.02], 0.06, COL_ACC);
    }
    poligono(vetri, [[xa, 0, zf], [xb, 0, zf], [xb, yt, zf], [xa, yt, zf]], 0xffffff);
    // finestre ad arco della facciata e del fondo: vetro con montante e traverso
    const arcoVetro = (cx: number, z: number, w: number, y0: number, yMolla: number, ver: "z+" | "z-") => {
      const k = ver === "z+" ? 0.02 : -0.02;
      const pts: [number, number, number][] = [[cx - w / 2, y0, z + k], [cx + w / 2, y0, z + k]];
      const nA = 10;
      for (let i = 0; i <= nA; i++) {
        const a = (i / nA) * Math.PI;
        pts.push([cx + (w / 2) * Math.cos(a), yMolla + (w / 2) * Math.sin(a), z + k]);
      }
      poligono(vetri, pts, 0xffffff);
      barra(acc, [cx, y0, z + k], [cx, yMolla + w / 2, z + k], 0.05, COL_ACC);
      barra(acc, [cx - w / 2, yMolla - 0.9, z + k], [cx + w / 2, yMolla - 0.9, z + k], 0.05, COL_ACC);
      for (let i = 0; i < nA; i++) {
        const a0 = (i / nA) * Math.PI;
        const a1 = ((i + 1) / nA) * Math.PI;
        barra(acc, [cx + (w / 2) * Math.cos(a0), yMolla + (w / 2) * Math.sin(a0), z + k], [cx + (w / 2) * Math.cos(a1), yMolla + (w / 2) * Math.sin(a1), z + k], 0.07, COL_ACC);
      }
      barra(acc, [cx - w / 2, y0, z + k], [cx - w / 2, yMolla, z + k], 0.07, COL_ACC);
      barra(acc, [cx + w / 2, y0, z + k], [cx + w / 2, yMolla, z + k], 0.07, COL_ACC);
    };
    for (const s of finFondo) arcoVetro(s, Z0 - 0.05, 2.7, 0, 4.7, "z-");
    for (const s of [-6.8, 6.8]) arcoVetro(s, Z1 + 0.1, 2.3, 0.5, 4.2, "z+");
    // vetrate verticali a destra
    for (const s of VERTICALI_X) {
      const x = X1 + 0.12;
      poligono(vetri, [[x, 0.5, s - 0.625], [x, 0.5, s + 0.625], [x, 6.6, s + 0.625], [x, 6.6, s - 0.625]], 0xffffff);
      barra(acc, [x, 0.5, s], [x, 6.6, s], 0.06, COL_ACC);
      for (const y of [2.4, 4.5]) barra(acc, [x, y, s - 0.625], [x, y, s + 0.625], 0.06, COL_ACC);
      for (const e of [-0.625, 0.625]) barra(acc, [x, 0.5, s + e], [x, 6.6, s + e], 0.08, COL_ACC);
      barra(acc, [x, 0.5, s - 0.625], [x, 0.5, s + 0.625], 0.08, COL_ACC);
      barra(acc, [x, 6.6, s - 0.625], [x, 6.6, s + 0.625], 0.08, COL_ACC);
    }
  }
  // -- porta girevole: tamburo di vetro (fisso) e ante (girano con p)
  const pz = Z1 - 0.1;
  {
    const tamb = new CylinderGeometry(PORTA.r, PORTA.r, 2.6, 28, 1, true);
    vetri.aggiungi(tamb, 0xffffff, mat(PORTA.x, 1.3, pz));
    tamb.dispose();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      barra(acc, [PORTA.x + Math.cos(a) * PORTA.r, 0.05, pz + Math.sin(a) * PORTA.r], [PORTA.x + Math.cos(a) * PORTA.r, 2.6, pz + Math.sin(a) * PORTA.r], 0.06, COL_ACC);
    }
  }
  const matAcc = r.add(new MeshLambertMaterial({ vertexColors: true }));
  radice.add(new Mesh(r.add(acc.costruisci()), matAcc));
  const matVetro = r.add(
    new MeshBasicMaterial({ color: VETRO[0][1], transparent: true, opacity: 0.26, side: DoubleSide, depthWrite: false }),
  );
  const vetriMesh = new Mesh(r.add(vetri.costruisci()), matVetro);
  vetriMesh.renderOrder = 1;
  radice.add(vetriMesh);
  // ante della girevole
  const ante = new Group();
  ante.position.set(PORTA.x, 0, pz);
  {
    const fa = new Fusione();
    const fv = new Fusione();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const ex = Math.cos(a) * (PORTA.r - 0.04);
      const ez = Math.sin(a) * (PORTA.r - 0.04);
      barra(fa, [0, 0.06, 0], [0, 2.5, 0], 0.09, "#9A9588");
      barra(fa, [ex, 0.06, ez], [ex, 2.5, ez], 0.07, COL_ACC);
      barra(fa, [0, 0.1, 0], [ex, 0.1, ez], 0.06, COL_ACC);
      barra(fa, [0, 2.45, 0], [ex, 2.45, ez], 0.06, COL_ACC);
      poligono(fv, [[0, 0.1, 0], [ex, 0.1, ez], [ex, 2.45, ez], [0, 2.45, 0]], 0xffffff);
    }
    ante.add(new Mesh(r.add(fa.costruisci()), matAcc));
    const mv = new Mesh(r.add(fv.costruisci()), matVetro);
    mv.renderOrder = 1;
    ante.add(mv);
  }
  radice.add(ante);

  /* ========== ESTERNO: cielo, terreno, alberi, vasi ========== */
  const cieloGeom = r.add(new SphereGeometry(150, 24, 12));
  {
    const n = cieloGeom.getAttribute("position").count;
    cieloGeom.setAttribute("color", new BufferAttribute(new Float32Array(n * 3), 3));
  }
  const matCielo = r.add(new MeshBasicMaterial({ vertexColors: true, side: BackSide, depthWrite: false, fog: false }));
  const cielo = new Mesh(cieloGeom, matCielo);
  cielo.renderOrder = -10;
  cielo.frustumCulled = false;
  scena.add(cielo);
  scena.background = new Color(CIELO_ORIZZONTE[1][1]);
  const ext = new Fusione();
  {
    const pav = new PlaneGeometry(60, 40).rotateX(-Math.PI / 2);
    ext.aggiungi(pav, (x, y, z, _a, _b, _c, out) => out.set("#D3CCBC").multiplyScalar(0.94 + 0.08 * fbm3(x * 0.3, 0, z * 0.3, 2)), mat(0, -0.01, Z1 + SP + 20));
    pav.dispose();
    const pavDietro = new PlaneGeometry(90, 40).rotateX(-Math.PI / 2);
    ext.aggiungi(pavDietro, (x, _y, z, _a, _b, _c, out) => out.set("#9AA67A").multiplyScalar(0.9 + 0.2 * fbm3(x * 0.2, 0, z * 0.2, 5)), mat(0, -0.02, Z0 - SP - 19));
    pavDietro.dispose();
    const prato = new PlaneGeometry(400, 400).rotateX(-Math.PI / 2);
    ext.aggiungi(prato, "#8F9C73", mat(0, -0.08, 0));
    prato.dispose();
    // vialetto di ghiaia davanti alla facciata, bordi
    const cord = new BoxGeometry(60, 0.12, 0.3);
    ext.aggiungi(cord, "#BDB5A3", mat(0, 0.02, Z1 + SP + 14));
    cord.dispose();
  }
  const detEst = qualita === "lite1" || qualita === "lite2" ? 0.5 : 0.7;
  const alberi: [number, number, number, number][] = [
    [-14, 17, 6.5, 3], [13, 19, 7.2, 4], [-22, 24, 8, 5], [21, 26, 7, 6], [-6, 31, 8.5, 7], [7, 34, 9, 8],
    [-16, -13, 8, 9], [-5, -16, 7, 10], [6, -14, 8.5, 11], [15, -17, 7.5, 12], [-26, -9, 9, 13], [25, -6, 8.5, 14], [0, -24, 10, 15],
  ];
  for (const [x, z, h, seme] of alberi) aggiungiPianta(ext, { x, z, h, seme, senzaVaso: true, dettaglio: detEst });
  // due grandi vasi con ficus ai lati dell'ingresso
  for (const x of [-5.9, 5.9]) aggiungiPianta(ext, { x, z: Z1 + SP + 1.4, h: 3.4, vaso: "#9A6B4A", dVaso: 1.0, seme: 20 + x, dettaglio: 0.85 });
  const matEst = r.add(new MeshLambertMaterial({ vertexColors: true }));
  radice.add(new Mesh(r.add(ext.costruisci()), matEst));

  /* ========== TENDE BIANCHE ========== */
  const tende = new Fusione();
  const colTenda = (_x: number, y: number, _z: number, nx: number, _ny: number, nz: number, out: Color) => out.setRGB(1, 1, 1).multiplyScalar(0.84 + 0.2 * (nz * 0.5 + 0.5) - 0.0 * nx);
  // due tende a velo davanti agli archi di fondo
  for (const s of finFondo) {
    const g = tendaGeom(2.9, 5.6, 0.3, 0.07, s);
    tende.aggiungi(g, colTenda, mat(s, 3.05, Z0 + 0.22));
    g.dispose();
    // tendaggi laterali raccolti
    for (const e of [-1.7, 1.7]) {
      const gl = tendaGeom(0.8, 6.4, 0.2, 0.1, e + s);
      tende.aggiungi(gl, colTenda, mat(s + e, 3.4, Z0 + 0.3));
      gl.dispose();
    }
  }
  // parete di tende sul lato sinistro
  {
    const g = tendaGeom(9.5, 6.6, 0.45, 0.16, 3);
    tende.aggiungi(g, colTenda, mat(X0 + 0.32, 3.6, 0.6, Math.PI / 2));
    g.dispose();
  }
  const matTenda = r.add(
    new MeshLambertMaterial({ vertexColors: true, color: "#F7F2E6", emissive: "#FFF1D6", emissiveIntensity: 0.2, side: DoubleSide, transparent: true, opacity: 0.8, depthWrite: false }),
  );
  const tendeMesh = new Mesh(r.add(tende.costruisci()), matTenda);
  tendeMesh.renderOrder = 3;
  radice.add(tendeMesh);

  /* ========== ARREDI: banco, divanetti, tavolini, lampade (mesh unica a colori per vertice) ========== */
  const arr = new Fusione();
  const luceLampada: [number, number, number][] = [];
  const COL_LEGNO = "#6B4A2F";
  const COL_TESSUTO = "#CDBB98";
  const COL_LINO = "#EDE7DA";
  // banco accoglienza (sul fondo a destra)
  {
    const cx = 5.3;
    const cz = -5.15;
    arr.aggiungi(scatolaSmussata(5.4, 1.05, 0.95, 0.03), "#E9E2D2", mat(cx, 0.525, cz), (_x, y) => 0.88 + 0.12 * smoothstep(0, 1, y));
    arr.aggiungi(scatolaSmussata(5.6, 0.08, 1.12, 0.02), "#4A3C2F", mat(cx, 1.09, cz + 0.02));
    arr.aggiungi(scatolaSmussata(5.1, 0.16, 0.04, 0.01), COL_LEGNO, mat(cx, 0.45, cz + 0.49));
    arr.aggiungi(scatolaSmussata(5.1, 0.03, 0.05, 0.005), "#B8923F", mat(cx, 0.76, cz + 0.49));
    // quinta dietro il banco
    arr.aggiungi(scatolaSmussata(5.8, 2.6, 0.18, 0.02), "#C9BDA5", mat(cx, 1.3, Z0 + 0.45), (_x, y) => 0.8 + 0.2 * smoothstep(0, 2.5, y));
    // lampada da banco
    arr.aggiungi(new CylinderGeometry(0.07, 0.09, 0.03, 12), "#B8923F", mat(2.95, 1.14, cz));
    arr.aggiungi(new CylinderGeometry(0.012, 0.012, 0.3, 6), "#B8923F", mat(2.95, 1.3, cz));
    luceLampada.push([2.95, 1.62, cz]);
  }
  // divanetti vicino agli archi di fondo
  const divano = (x: number, z: number, rot: number, larg = 1.8, col = COL_TESSUTO) => {
    const m = (lx: number, ly: number, lz: number) => {
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      return mat(x + lx * c + lz * s, ly, z - lx * s + lz * c, rot);
    };
    arr.aggiungi(scatolaSmussata(larg, 0.28, 0.82, 0.04), col, m(0, 0.4, 0));
    arr.aggiungi(scatolaSmussata(larg - 0.28, 0.14, 0.7, 0.04), COL_LINO, m(0, 0.6, 0.03));
    arr.aggiungi(scatolaSmussata(larg, 0.5, 0.18, 0.04), col, m(0, 0.78, -0.32));
    for (const e of [-1, 1]) arr.aggiungi(scatolaSmussata(0.17, 0.46, 0.82, 0.04), col, m(e * (larg / 2 - 0.085), 0.62, 0));
    for (const e of [-1, 1]) for (const f of [-1, 1]) arr.aggiungi(new CylinderGeometry(0.03, 0.025, 0.16, 6), COL_LEGNO, m(e * (larg / 2 - 0.1), 0.08, f * 0.3));
  };
  divano(-6.3, -5.55, 0, 1.9);
  divano(-3.8, -5.55, 0, 1.5);
  divano(6.3, 3.4, Math.PI / 2 + 0.2, 1.7, "#BFAE8C");
  divano(6.3, 0.6, Math.PI / 2 - 0.2, 1.7, "#BFAE8C");
  // tavolini e comodini con lampada
  const tavolino = (x: number, z: number, d: number, h: number, col: string) => {
    arr.aggiungi(new CylinderGeometry(d / 2, d / 2, 0.04, 20), col, mat(x, h, z));
    arr.aggiungi(new CylinderGeometry(0.03, 0.04, h - 0.03, 8), "#B8923F", mat(x, (h - 0.03) / 2, z));
    arr.aggiungi(new CylinderGeometry(d * 0.32, d * 0.34, 0.025, 16), "#B8923F", mat(x, 0.0125, z));
  };
  tavolino(-5.05, -4.35, 0.9, 0.42, "#E8E2D3");
  tavolino(4.7, 2.0, 0.8, 0.42, "#E8E2D3");
  tavolino(-4.85, -5.95, 0.42, 0.55, "#E8E2D3");
  luceLampada.push([-4.85, 1.0, -5.95]);
  arr.aggiungi(new CylinderGeometry(0.012, 0.012, 0.3, 6), "#B8923F", mat(-4.85, 0.72, -5.95));
  // lampada a stelo accanto ai divanetti di destra
  arr.aggiungi(new CylinderGeometry(0.16, 0.18, 0.03, 14), "#3B4046", mat(7.9, 0.015, 2.0));
  arr.aggiungi(new CylinderGeometry(0.012, 0.012, 1.5, 6), "#3B4046", mat(7.9, 0.75, 2.0));
  luceLampada.push([7.9, 1.72, 2.0]);
  // tappeto sotto il gruppo di destra
  arr.aggiungi(new BoxGeometry(3.2, 0.012, 3.8), "#CBBFA7", mat(5.9, 0.007, 2.0));
  // faretti a soffitto (tutti gli apparecchi fissi)
  const faretti: [number, number][] = [[-7, 1.6], [-7, -3.2], [-4.2, 4.2], [4.2, 4.2], [7.2, -2.4], [7.2, 4.8], [-7.2, 5.4]];
  for (const [x, z] of faretti) arr.aggiungi(new CylinderGeometry(0.09, 0.09, 0.06, 10), "#2F3438", mat(x, H - 0.02, z));
  // il tronco poggia su un lieve piano di appoggio (non si vede): niente
  const matArr = r.add(new MeshLambertMaterial({ vertexColors: true }));
  const arredi = new Mesh(r.add(arr.costruisci()), matArr);
  radice.add(arredi);

  // paralumi emissivi (miele)
  const shade = new Fusione();
  for (const p of luceLampada) {
    const g = new CylinderGeometry(0.13, 0.21, 0.28, 14, 1, true);
    shade.aggiungi(g, "#F2C27A", mat(p[0], p[1] - 0.06, p[2]));
    g.dispose();
  }
  const matShade = r.add(new MeshLambertMaterial({ vertexColors: true, color: "#F2C27A", emissive: "#F2C27A", emissiveIntensity: 0.3, side: DoubleSide }));
  const paralumi = new Mesh(r.add(shade.costruisci()), matShade);
  radice.add(paralumi);

  /* ========== PIANTE interne ========== */
  const pia = new Fusione();
  const detPiante = qualita === "lite1" || qualita === "lite2" ? 0.6 : 1;
  aggiungiPianta(pia, { x: 7.7, z: 4.9, h: 3.5, vaso: "#E8E1D2", dVaso: 0.9, seme: 31, dettaglio: detPiante });
  aggiungiPianta(pia, { x: -7.7, z: 5.0, h: 3.0, vaso: "#E8E1D2", dVaso: 0.8, seme: 32, dettaglio: detPiante });
  aggiungiPianta(pia, { x: -2.2, z: -6.1, h: 2.3, vaso: "#E8E1D2", dVaso: 0.65, seme: 33, dettaglio: detPiante });
  aggiungiPianta(pia, { x: 8.2, z: -5.9, h: 2.6, vaso: "#E8E1D2", dVaso: 0.7, seme: 34, dettaglio: detPiante });
  aggiungiPianta(pia, { x: -8.1, z: -6.2, h: 2.1, vaso: "#E8E1D2", dVaso: 0.6, seme: 35, dettaglio: detPiante });
  const matPia = r.add(new MeshLambertMaterial({ vertexColors: true }));
  const piante = new Mesh(r.add(pia.costruisci()), matPia);
  radice.add(piante);

  /* ========== IL TRONCO D'ULIVO ========== */
  const matTroncoL = r.add(new MeshLambertMaterial({ vertexColors: true }));
  const matTroncoS = r.add(new MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0 }));
  let dettaglioCorrente = dettaglioTronco();
  const troncoMesh = new Mesh(r.add(costruisciTronco(dettaglioCorrente)), alta() ? matTroncoS : matTroncoL);
  troncoMesh.position.set(TRONCO_POS[0], 0, TRONCO_POS[2]);
  troncoMesh.rotation.y = 0.5;
  radice.add(troncoMesh);

  /* ========== OMBRE A CONTATTO (una sola draw call) ========== */
  const ombre = creaOmbreIstanziate(14);
  const ombreDef: [number, number, number, number, number?][] = [
    [TRONCO_POS[0] + 0.1, TRONCO_POS[2], TRONCO_INGOMBRO.x * 1.15, TRONCO_INGOMBRO.z * 1.1], // 0: tronco (si sposta col sole)
    [5.3, -5.15, 5.4, 0.95],
    [-6.3, -5.55, 1.9, 0.82],
    [-3.8, -5.55, 1.5, 0.82],
    [6.3, 3.4, 0.82, 1.7],
    [6.3, 0.6, 0.82, 1.7],
    [-5.05, -4.35, 0.9, 0.9],
    [4.7, 2.0, 0.8, 0.8],
    [7.7, 4.9, 0.9, 0.9],
    [-7.7, 5.0, 0.8, 0.8],
    [-2.2, -6.1, 0.65, 0.65],
    [8.2, -5.9, 0.7, 0.7],
    [-8.1, -6.2, 0.6, 0.6],
  ];
  ombreDef.forEach((o, i) => scriviOmbra(ombre, i, o[0], o[1], o[2], o[3], 0, i === 0 ? 0.55 : 0.2));
  ombre.count = ombreDef.length;
  radice.add(ombre);

  /* ========== LUCE FINTA: macchia di sole, raggio, aloni, pozze, riflesso della facciata ========== */
  const contornoSky = contornoRett(SKY.cx, SKY.cz, SKY.w, SKY.d, H);
  const chiazza = new Chiazza(r, contornoSky);
  radice.add(chiazza.mesh);
  const raggio = new RaggioSole(r);
  radice.add(raggio.mesh);
  const puntiAloni = [
    ...luceLampada.map((p) => ({ pos: [p[0], p[1] - 0.02, p[2] + 0.25] as const, raggio: 0.95 })),
    ...faretti.map(([x, z]) => ({ pos: [x, H - 0.4, z + 0.3] as const, raggio: 0.7, intensita: 0.8 })),
    { pos: [TRONCO_POS[0] + 0.1, 0.9, TRONCO_POS[2] + 0.6] as const, raggio: 1.6, intensita: 0.4 },
  ];
  const aloni = new AloniFusi(r, puntiAloni);
  radice.add(aloni.mesh);
  const pozze = new PozzeLuce(
    r,
    [
      ...faretti.map(([x, z]) => ({ pos: [x, 0, z] as const, raggio: 1.5, intensita: 0.8 })),
      { pos: [-4.85, 0, -5.95] as const, raggio: 1.5, intensita: 0.7 },
      { pos: [7.9, 0, 2.0] as const, raggio: 1.7, intensita: 0.7 },
      { pos: [2.95, 0, -4.6] as const, raggio: 1.3, intensita: 0.6 },
      { pos: [TRONCO_POS[0], 0, TRONCO_POS[2]] as const, raggio: 2.4, intensita: 0.7 },
    ],
    0.014,
  );
  radice.add(pozze.mesh);
  // riflesso della facciata luminosa sul pavimento lucido: striscia con alfa per vertice
  const riflGeom = r.add(new BufferGeometry());
  riflGeom.setAttribute("position", new Float32BufferAttribute([-4.4, 0.016, Z1 - 0.1, 4.4, 0.016, Z1 - 0.1, -4.4, 0.016, Z1 - 6, 4.4, 0.016, Z1 - 6], 3));
  riflGeom.setAttribute("color", new Float32BufferAttribute([1, 1, 1, 0.55, 1, 1, 1, 0.55, 1, 1, 1, 0, 1, 1, 1, 0], 4));
  riflGeom.setIndex(new Uint16BufferAttribute([0, 2, 1, 1, 2, 3], 1));
  const matRifl = r.add(new MeshBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0.2, side: DoubleSide, color: "#EAF1F4" }));
  const rifl = new Mesh(riflGeom, matRifl);
  rifl.renderOrder = 2;
  radice.add(rifl);

  /* ========== la luce è una funzione di t ========== */
  const c1 = new Color();
  const c2 = new Color();
  const cz = new Color();
  let t = 0;
  let p = 0;
  const applicaLuce = () => {
    const s = sole(t);
    luci.setKey(campionaColore(KEY_COL, t, c1), campionaScalare(KEY_INT, t) * ESPOSIZIONE_KEY, s.dir);
    luci.setHemi(campionaScalare(HEMI_INT, t) * ESPOSIZIONE_HEMI, campionaColore(HEMI_CIELO, t, c2));
    const orizz = campionaColore(CIELO_ORIZZONTE, t, c1);
    const zenit = campionaColore(CIELO_ZENIT, t, c2);
    (scena.background as Color).copy(orizz);
    // gradiente del cielo: orizzonte sotto, zenit sopra
    const pos = cieloGeom.getAttribute("position");
    const col = cieloGeom.getAttribute("color") as BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const k = Math.min(1, Math.max(0, pos.getY(i) / 90));
      const kk = Math.pow(k, 0.7);
      cz.copy(orizz).lerp(zenit, kk);
      col.setXYZ(i, cz.r, cz.g, cz.b);
    }
    col.needsUpdate = true;
    matArch.color.copy(campionaColore(PARETE, t, c1));
    matVetro.color.copy(campionaColore(VETRO, t, c1));
    matVetro.opacity = 0.26 + 0.1 * smoothstep(0.8, 1, t);
    matTenda.emissiveIntensity = campionaScalare(TENDA_LUCE, t);
    matShade.emissiveIntensity = campionaScalare(LAMPADA, t);
    aloni.setOpacita(campionaScalare(ALONE, t));
    pozze.setOpacita(campionaScalare(POZZE, t));
    // macchia di sole: proiezione esatta del lucernario sul pavimento + raggio dal lucernario
    const lum = 0.24 * smoothstep(0.12, 0.35, s.sinEl);
    chiazza.aggiorna(s.dir, 0, lum, { x: [X0 + 0.15, X1 - 0.15], z: [Z0 + 0.15, Z1 - 0.15] });
    const op = 0.2 * Math.pow(Math.sin(Math.PI * t), 0.7) * smoothstep(0.1, 0.3, s.sinEl);
    const ch = chiazza.mesh.visible ? chiazza.centro : { x: SKY.cx, z: SKY.cz };
    raggio.aggiorna([SKY.cx, SKY.quotaGronda + 0.4, SKY.cz], [ch.x, 0.05, ch.z], SKY.w * 0.62, SKY.w * 0.72, op);
    // riflesso della facciata e ombra del tronco che segue il sole (2 cm)
    matRifl.opacity = 0.22 * Math.max(0, 1 - smoothstep(0.7, 1, t) * 0.9) * smoothstep(0, 0.3, t + 0.15);
    const n = Math.hypot(s.dir[0], s.dir[2]) || 1;
    scriviOmbra(ombre, 0, TRONCO_POS[0] + 0.1 - (s.dir[0] / n) * 0.02, TRONCO_POS[2] - (s.dir[2] / n) * 0.02, TRONCO_INGOMBRO.x * 1.15, TRONCO_INGOMBRO.z * 1.1, 0, 0.55);
  };

  const applicaP = () => {
    cam.setP(p);
    const e = Math.min(1, Math.max(0, (p - 0.06) / 0.54));
    ante.rotation.y = e * e * (3 - 2 * e) * Math.PI * 0.75;
  };

  const applicaQualita = () => {
    const nuovo = dettaglioTronco();
    if (nuovo !== dettaglioCorrente) {
      dettaglioCorrente = nuovo;
      troncoMesh.geometry.dispose();
      troncoMesh.geometry = r.add(costruisciTronco(nuovo));
    }
    troncoMesh.material = alta() ? matTroncoS : matTroncoL;
    pavimento.material = alta() ? matPavLucido : matPavLambert;
    piante.visible = true;
    paralumi.visible = true;
    arredi.visible = true;
    // gli oggetti piccoli (lod: small) spariscono solo nei livelli lite
    rifl.visible = piccoliVisibili();
  };
  applicaQualita();
  applicaLuce();
  applicaP();

  return {
    scena,
    camera,
    radice,
    setLuce(v) {
      t = Math.min(1, Math.max(0, v));
      applicaLuce();
    },
    setProgresso(v) {
      p = Math.min(1, Math.max(0, v));
      applicaP();
    },
    vaiA: (v, istantaneo) => cam.vaiA(v, istantaneo),
    ruota: (g) => cam.ruota(g),
    proietta: (pos, out) => cam.proietta(pos, out),
    update: (dt) => cam.update(dt),
    setQualita(q) {
      qualita = q;
      applicaQualita();
    },
    resize: (w, h) => cam.resize(w, h),
    dispose() {
      r.dispose();
      scena.clear();
    },
  };
}
