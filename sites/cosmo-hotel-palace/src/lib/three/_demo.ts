/*
 * ESEMPIO / SCENA DI PROVA del runtime 3D (modulo 5). Non è una scena del sito.
 * Si tiene come modello per i moduli 8, 9, 10: mostra come una scena
 *   - usa OrbitRig per vaiA / ruota / update / proietta / resize,
 *   - crea tutto dentro un `Risorse` (dispose completo),
 *   - usa materiali procedurali, luci finte, ombre di contatto e InstancedMesh,
 *   - è una funzione di (luce, progresso, vista): `setLuce(t)` e `setProgresso(p)`.
 *
 * Il modulo si importa SOLO con `import()` dentro `SceneDef.costruisci` (vedi zz-3d/page.tsx),
 * così `three` non finisce nel JS iniziale.
 */

import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
} from "three";
import { OrbitRig } from "../../components/scene/CameraRig";
import type { Qualita, SceneContext, SceneHandle, Posizione3D, SceneDef } from "../../content/types";
import { creaIstanze, impostaConteggio, morfaIstanze, scriviMatrice, segnaAggiornate } from "./instancing";
import { LuciBase, campionaColore, campionaScalare, creaAloni, type StopColore, type StopScalare } from "./lights";
import {
  COLORI,
  Risorse,
  coloraVertici,
  matIntonaco,
  matLambert,
  matLino,
  matOttone,
  matParquet,
} from "./materials";
import { creaOmbraContatto, creaOmbreIstanziate, scriviOmbra } from "./shadows";

export const DEMO_LIMITI: SceneDef["limiti"] = { az: [-35, 35], pol: [55, 80] };
export const DEMO_VISTA = { az: 0, pol: 65, dist: 9 } as const;

/** Punti 3D usati dagli hotspot della pagina di prova. */
export const DEMO_PUNTI = {
  lampada: [1.62, 1.05, -2.3] as Posizione3D,
  letto: [0.3, 0.62, -1.3] as Posizione3D,
};

/* Tabelle di luce: 0 = giorno, 1 = sera (DESIGN 5.3, MOTION 4.5) */
const KEY_COL: StopColore[] = [[0, "#FFF1DC"], [1, "#FFB867"]];
const KEY_INT: StopScalare[] = [[0, 1.6], [1, 0.5]];
const HEMI_INT: StopScalare[] = [[0, 0.7], [1, 0.35]];
const FINESTRA: StopColore[] = [[0, "#CFE3EE"], [1, "#3A4A66"]];
const PARETE: StopColore[] = [[0, COLORI.intonaco], [1, COLORI.intonacoSera]];
const SFONDO: StopColore[] = [[0, "#EDE5D3"], [1, "#1C160F"]];
const ALONE: StopScalare[] = [[0, 0], [0.55, 0], [0.95, 1], [1, 1]];
const PUNTO: StopScalare[] = [[0, 0], [0.6, 0], [1, 1.2]];
const LAMPADA: StopScalare[] = [[0, 0.35], [1, 1]];

const ease = (t: number) => t * t * (3 - 2 * t);

export function costruisciDemo(ctx: SceneContext): SceneHandle {
  const r = new Risorse();
  const scena = new Scene();
  const radice = new Group();
  scena.add(radice);

  const camera = new PerspectiveCamera(38, ctx.larghezza / ctx.altezza, 0.1, 60);
  const rig = new OrbitRig({
    camera,
    limiti: DEMO_LIMITI,
    vistaIniziale: DEMO_VISTA,
    bersaglio: [0, 1, -0.4],
    reducedMotion: ctx.reducedMotion,
    larghezza: ctx.larghezza,
    altezza: ctx.altezza,
  });

  /* ---- luci: 1 direzionale + 1 emisferica + 1 PointLight sempre presente ---- */
  const luci = new LuciBase({ keyDirezione: [0.45, 0.7, 0.55], puntoPosizione: [1.4, 1.5, -2.0], puntoDistanza: 7 });
  scena.add(luci.gruppo);

  /* ---- pavimento in parquet (4 x 5,5 m) ---- */
  const L = 4;
  const P = 5.5;
  const H = 2.7;
  const pavimento = new Mesh(r.add(new PlaneGeometry(L, P).rotateX(-Math.PI / 2)), matParquet(r, L, P));
  radice.add(pavimento);

  /* ---- 2 pareti di fondo in intonaco, con occlusione cotta (angolo e pavimento) ---- */
  const matParete = matIntonaco(r, "giorno", true);
  const fondoGeom = r.add(new PlaneGeometry(L, H, 8, 6));
  coloraVertici(fondoGeom, "#ffffff", (x, y) => {
    const yw = y + H / 2;
    const dAngolo = x + L / 2; // distanza dall'angolo sinistro
    return 1 - 0.24 * Math.exp(-yw / 0.45) - 0.2 * Math.exp(-dAngolo / 0.5);
  });
  const fondo = new Mesh(fondoGeom, matParete);
  fondo.position.set(0, H / 2, -P / 2);
  const latoGeom = r.add(new PlaneGeometry(P, H, 10, 6).rotateY(Math.PI / 2));
  // dopo rotateY il piano sta nel piano YZ: la coordinata lungo il lato è `z` (0 all'angolo in fondo)
  coloraVertici(latoGeom, "#ffffff", (_x, y, z) => {
    const yw = y + H / 2;
    const dAngolo = z + P / 2; // 0 al fondo (z = -P/2)
    return 1 - 0.24 * Math.exp(-yw / 0.45) - 0.2 * Math.exp(-dAngolo / 0.5);
  });
  const lato = new Mesh(latoGeom, matParete);
  lato.position.set(-L / 2, H / 2, 0);
  radice.add(fondo, lato);

  /* ---- finestra: emissivo che segue la luce ---- */
  const matFinestra = r.add(new MeshBasicMaterial({ color: FINESTRA[0][1] }));
  const finestra = new Mesh(r.add(new PlaneGeometry(1.3, 1.2)), matFinestra);
  finestra.position.set(-0.5, 1.55, -P / 2 + 0.01);
  radice.add(finestra);

  /* ---- letto: lino + testiera ottone/legno + 2 cuscini istanziati ---- */
  const matLinoLetto = matLino(r, 3);
  const letto = new Mesh(r.add(new BoxGeometry(1.6, 0.45, 2.0)), matLinoLetto);
  letto.position.set(0.3, 0.225, -1.65);
  const testiera = new Mesh(r.add(new BoxGeometry(1.7, 0.9, 0.12)), matLambert(COLORI.testiera));
  testiera.position.set(0.3, 0.45, -P / 2 + 0.08);
  radice.add(letto, testiera);

  const cuscini = creaIstanze(r.add(new BoxGeometry(0.62, 0.14, 0.4)), matLambert(COLORI.cuscini), 2);
  scriviMatrice(cuscini.instanceMatrix.array as Float32Array, 0, -0.1, 0.52, -2.35, 0.06);
  scriviMatrice(cuscini.instanceMatrix.array as Float32Array, 1, 0.7, 0.52, -2.35, -0.05);
  impostaConteggio(cuscini, 2);
  segnaAggiornate(cuscini);
  radice.add(cuscini);

  /* ---- 3 pouf istanziati che il progresso p sposta (morfaIstanze) + le loro ombre ---- */
  const pouf = creaIstanze(r.add(new CylinderGeometry(0.28, 0.3, 0.38, 20)), matLambert(COLORI.testiera), 3);
  const ombrePouf = creaOmbreIstanziate(3);
  const da = new Float32Array([-1.2, 1.2, 0, 1, -0.5, 1.7, 0.5, 1, 0.3, 1.2, 0, 1]);
  const a = new Float32Array([-1.2, 0.2, 0, 1, -0.4, 0.6, 1, 1, 0.5, 1.9, 0, 1]);
  const scriviPouf = (p: number) => {
    morfaIstanze(pouf, p, da, a, 3, ease, { sfalsamento: 0.4, hop: 0.12, y: 0.19 });
    for (let i = 0; i < 3; i++) {
      const t = Math.min(1, Math.max(0, (p - (i / 2) * 0.4) / 0.6));
      const e = ease(t);
      scriviOmbra(ombrePouf, i, da[4 * i] + (a[4 * i] - da[4 * i]) * e, da[4 * i + 1] + (a[4 * i + 1] - da[4 * i + 1]) * e, 0.56, 0.56);
    }
  };
  impostaConteggio(pouf, 3);
  impostaConteggio(ombrePouf, 3);
  scriviPouf(0);
  radice.add(pouf, ombrePouf);

  /* ---- comodino + lampada (ottone, paralume emissivo, alone additivo) ---- */
  const matOtt = matOttone(r, ctx.qualita);
  const comodino = new Mesh(r.add(new BoxGeometry(0.45, 0.5, 0.4)), matLambert(COLORI.testiera));
  comodino.position.set(1.62, 0.25, -2.45);
  const stelo = new Mesh(r.add(new CylinderGeometry(0.025, 0.04, 0.34, 12)), matOtt);
  stelo.position.set(1.62, 0.67, -2.45);
  const matParalume = r.add(new MeshLambertMaterial({ color: COLORI.paralume, emissive: COLORI.paralume, emissiveIntensity: 0.35, side: DoubleSide }));
  const paralume = new Mesh(r.add(new ConeGeometry(0.2, 0.26, 12, 1, true).translate(0, 0.13, 0)), matParalume);
  paralume.position.set(1.62, 0.84, -2.45);
  radice.add(comodino, stelo, paralume);
  const aloni = creaAloni(r, [[1.62, 0.97, -2.45]], { raggio: 0.9 });
  radice.add(aloni.gruppo);

  /* ---- ombre di contatto: letto, comodino ---- */
  const ombre = new Group();
  ombre.add(
    creaOmbraContatto(0.3, -1.65, 1.6, 2.0),
    creaOmbraContatto(1.62, -2.45, 0.45, 0.4, { margine: 0.15 }),
  );
  radice.add(ombre);

  /* ---- la luce è una funzione di t (0 giorno, 1 sera) ---- */
  const c1 = new Color();
  const c2 = new Color();
  let t = 0;
  const applicaLuce = () => {
    luci.setKey(campionaColore(KEY_COL, t, c1), campionaScalare(KEY_INT, t));
    luci.setHemi(campionaScalare(HEMI_INT, t));
    matFinestra.color.copy(campionaColore(FINESTRA, t, c2));
    matParete.color.copy(campionaColore(PARETE, t, c2));
    (scena.background as Color).copy(campionaColore(SFONDO, t, c2));
    matParalume.emissiveIntensity = campionaScalare(LAMPADA, t);
    aloni.setOpacita(campionaScalare(ALONE, t));
    luci.setPunto(spentoPuntuale ? 0 : campionaScalare(PUNTO, t));
  };
  let spentoPuntuale = ctx.qualita === "lite1" || ctx.qualita === "lite2";
  scena.background = new Color(SFONDO[0][1]);
  applicaLuce();

  return {
    scena,
    camera,
    radice,
    setLuce(v) {
      t = v;
      applicaLuce();
    },
    setProgresso(p) {
      scriviPouf(p);
    },
    vaiA: (v, istantaneo) => rig.vaiA(v, istantaneo),
    ruota: (g) => rig.ruota(g),
    proietta: (p, out) => rig.proietta(p, out),
    update: (dt) => rig.update(dt),
    setQualita(q: Qualita) {
      spentoPuntuale = q === "lite1" || q === "lite2";
      applicaLuce();
    },
    resize: (w, h) => rig.resize(w, h),
    dispose() {
      r.dispose();
      scena.clear();
    },
  };
}
