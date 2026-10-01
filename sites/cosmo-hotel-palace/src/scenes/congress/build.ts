/*
 * Scena 3D della sala congressi (MOTION 5, DESIGN 5, UX 7.2). Si importa SOLO con `import()` dentro
 * `SceneDef.costruisci` (vedi def.ts): `three` non finisce nel JS iniziale.
 *
 * Cosa c'è (tutto in codice, nessun file scaricato):
 *   - sala in scala vera (larghezza × profondità × altezza dalla tabella), vista dall'alto in prospettiva,
 *     senza parete davanti né soffitto pieno (casa di bambole); moquette 512²; pilastri color travertino;
 *     «soffitto a gesso» suggerito da velette con luce a strisce; finestre; palco, schermo, leggio;
 *   - sedie e tavoli con `InstancedMesh` (fino a 520 sedie in 1 draw call; 2 tipi di tavolo; ombre di
 *     contatto istanziate); pareti mobili come pannelli che scorrono (solo sale divisibili, due stati);
 *   - luce neutra e fissa (key #FFF1DC ×1,4 + emisferica 0,8): nessun giorno/sera, `setLuce` non fa nulla.
 *
 * LA SCENA È UNA FUNZIONE DEL TEMPO DI TRANSIZIONE. `configura(config)` fissa uno stato di partenza
 * (quello disegnato in quel momento, anche a metà tween) e uno di arrivo (il `layout` puro della nuova
 * configurazione); poi `t` (ms) avanza da solo (`update(dt)`) oppure lo guida l'esterno con
 * `configura(config, { k })` + `setProgresso(k)` (teaser in home). Ogni fotogramma si riscrive da
 * zero a partire da `t`: stessi numeri, stesso disegno, anche riavvolgendo (MOTION 2.1).
 *
 * Movimenti (lib/congress/layout.ts, `pianoTempi`):
 *   - sedie e tavoli: 720 ms, con ritardo per sedia (ultima parte a 240 ms), salto di 22 cm;
 *   - stanza (pareti perimetrali, pavimento, palco): 480 ms; la camera si assesta con l'inerzia di OrbitRig;
 *   - pareti mobili: 600 ms; «Dividi»: le sedie escono, a metà partono i pannelli; «Riunisci»: prima i
 *     pannelli si ritirano, a metà tornano le sedie. Sala divisa = niente sedie: nessuna capienza inventata.
 *   - `prefers-reduced-motion` (ctx.reducedMotion): ogni cambio è uno scatto.
 */

import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
} from "three";
import { OrbitRig } from "@/components/scene/CameraRig";
import { easeIn } from "@/lib/motion";
import type {
  CongressHall,
  ConfigurazioneSala,
  Disposizione,
  OpzioniConfigurazione,
  SceneContext,
  SceneHandle,
  VistaCamera,
} from "@/content/types";
import { disposizioneEffettiva, SALA_SCENA_ID, trovaSala } from "@/lib/congress/availability";
import {
  MAX_PANNELLI,
  MAX_SEDIE,
  MAX_TAVOLI,
  OGGETTI,
  STRIDE,
  SALTO,
  SPESSORE_MURO,
  accoppia,
  compatta,
  distanzaVista,
  faseAt,
  layoutSala,
  layoutVuoto,
  morfaMatrici,
  pianoTempi,
  scriviPannelli,
  schemaPareti,
  telaio,
  type Coppia,
  type Disegno,
  type Piano,
  type SchemaPareti,
} from "@/lib/congress/layout";
import { impostaConteggio, creaIstanze, scriviMatrice, segnaAggiornate } from "@/lib/three/instancing";
import { LuciBase } from "@/lib/three/lights";
import { COLORI, Risorse, coloraVertici, matIntonaco, matLambert, matMoquette } from "@/lib/three/materials";
import { creaOmbreIstanziate } from "@/lib/three/shadows";
import { CONFIGURAZIONE_INIZIALE, LIMITI_SALA, VISTA_SALA } from "./costanti";

const FOV = 38;
const BERSAGLIO = [0, 0.6, 0] as const;
const SFONDO = "#EAE3D4";
const COLORE_PANNELLI = "#D8CFBB";
const COLORE_GESSO = "#EFE9DB";
const COLORE_STRISCIA = "#FFF3D6";
const COLORE_PALCO = "#A89A82";
const COLORE_SLAB = "#BDB6A8";
const COLORE_TAVOLO_RET = "#EFE9DB";
const COLORE_TOVAGLIA = "#F6F1E6";
const COLORE_LEGGIO = "#6B5642";

/* ───────────────────────── Geometrie ───────────────────────── */

type Parte = { g: BufferGeometry; colore: string };

/** Unisce più geometrie in una sola, con colore per vertice (una draw call, un materiale). */
function unisci(parti: Parte[]): BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const c = new Color();
  for (const { g, colore } of parti) {
    const ni = g.index ? g.toNonIndexed() : g;
    const p = ni.getAttribute("position");
    const n = ni.getAttribute("normal");
    c.set(colore);
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      col.push(c.r, c.g, c.b);
    }
    if (ni !== g) ni.dispose();
    g.dispose();
  }
  const out = new BufferGeometry();
  out.setAttribute("position", new Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  out.setAttribute("color", new Float32BufferAttribute(col, 3));
  return out;
}

/** Sedia: 48 triangoli (seduta 12 + schienale 12 + 4 gambe prismatiche aperte 24). Guarda verso -z. */
function geometriaSedia(): BufferGeometry {
  const s = OGGETTI.sedia;
  const gamba = (x: number, z: number): Parte => ({
    g: new CylinderGeometry(0.018, 0.018, 0.42, 3, 1, true).translate(x, 0.21, z),
    colore: COLORI.alluminio,
  });
  const dx = s.larghezza / 2 - 0.05;
  const dz = s.profondita / 2 - 0.05;
  return unisci([
    { g: new BoxGeometry(s.larghezza, 0.07, s.profondita).translate(0, s.altezzaSeduta - 0.035, 0), colore: COLORI.sediaSala },
    {
      g: new BoxGeometry(s.larghezza - 0.04, 0.42, 0.06).translate(0, s.altezzaSchienale - 0.21, s.profondita / 2 - 0.03),
      colore: COLORI.sediaSala,
    },
    gamba(-dx, -dz),
    gamba(dx, -dz),
    gamba(-dx, dz),
    gamba(dx, dz),
  ]);
}

/** Tavolo rettangolare 1,8 x 0,6 m (piano + 2 fianchi): 36 triangoli. */
function geometriaTavoloRet(): BufferGeometry {
  const t = OGGETTI.tavoloRettangolare;
  return unisci([
    { g: new BoxGeometry(t.lunghezza, 0.05, t.profondita).translate(0, t.altezza - 0.025, 0), colore: COLORE_TAVOLO_RET },
    { g: new BoxGeometry(0.05, t.altezza - 0.05, t.profondita - 0.1).translate(-t.lunghezza / 2 + 0.12, (t.altezza - 0.05) / 2, 0), colore: COLORI.alluminio },
    { g: new BoxGeometry(0.05, t.altezza - 0.05, t.profondita - 0.1).translate(t.lunghezza / 2 - 0.12, (t.altezza - 0.05) / 2, 0), colore: COLORI.alluminio },
  ]);
}

/** Tavolo tondo ø1,8 m con tovaglia fino a terra e un centrotavola in ottone: 12 lati. */
function geometriaTavoloTondo(): BufferGeometry {
  const t = OGGETTI.tavoloTondo;
  const r = t.diametro / 2;
  return unisci([
    { g: new CylinderGeometry(r, r * 0.97, t.altezza, 12, 1, true).translate(0, t.altezza / 2, 0), colore: COLORE_TOVAGLIA },
    { g: new CircleGeometry(r, 12).rotateX(-Math.PI / 2).translate(0, t.altezza, 0), colore: COLORE_TOVAGLIA },
    { g: new CylinderGeometry(0.1, 0.12, 0.22, 6).translate(0, t.altezza + 0.11, 0), colore: COLORI.ottone },
  ]);
}

/** Cubo unitario con la base a y = 0 (si scala per ottenere muri, pannelli, palco, pilastri). */
function cuboUnitario(): BoxGeometry {
  return new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
}

/* ───────────────────────── La scena ───────────────────────── */

type Stato = { hall: CongressHall; disp: Disposizione; ospiti: number | null; divisa: boolean };
type Stanza = { A: number; B: number; h: number };

const VUOTO = new Float32Array(0);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function costruisciSala(ctx: SceneContext): SceneHandle {
  const r = new Risorse();
  const scena = new Scene();
  const radice = new Group();
  scena.add(radice);
  scena.background = new Color(SFONDO);

  const camera = new PerspectiveCamera(FOV, ctx.larghezza / ctx.altezza, 0.1, 250);
  let aspetto = ctx.larghezza / Math.max(1, ctx.altezza);
  // su touch l'elevazione è fissa: si trascina solo in orizzontale (UX 12, MOTION 4.8)
  const limiti: typeof LIMITI_SALA = ctx.touch ? { az: LIMITI_SALA.az, pol: [VISTA_SALA.pol, VISTA_SALA.pol] } : LIMITI_SALA;
  const rig = new OrbitRig({
    camera,
    limiti,
    vistaIniziale: { az: VISTA_SALA.az, pol: VISTA_SALA.pol, dist: 30 },
    bersaglio: BERSAGLIO,
    distanza: [3, 220],
    reducedMotion: ctx.reducedMotion,
    larghezza: ctx.larghezza,
    altezza: ctx.altezza,
  });

  /* ---- luce: neutra e fissa ---- */
  const luci = new LuciBase({
    keyColore: "#FFF1DC",
    // MOTION 5.1 dice 1,4 + 0,8, ma su un piano orizzontale la somma (1,4·cos + 0,8 ≈ 2) sovraespone
    // moquette, tavoli e velette (misurato negli screenshot): qui 0,7 + 0,55 ≈ 1,1 sul piano.
    keyIntensita: 0.7,
    keyDirezione: [0.35, 0.95, 0.55],
    hemiIntensita: 0.55,
  });
  scena.add(luci.gruppo);

  /* ---- materiali ---- */
  const matMoq = matMoquette(r, 1);
  const matMuro = matIntonaco(r, "giorno", true);
  const matGesso = r.add(new MeshLambertMaterial({ color: COLORE_GESSO }));
  const matStriscia = r.add(new MeshBasicMaterial({ color: COLORE_STRISCIA }));
  const matPilastri = matLambert(COLORI.pilastriSala);
  r.add(matPilastri);
  const matVetro = r.add(new MeshBasicMaterial({ color: COLORI.vetro }));
  const matSlab = r.add(new MeshLambertMaterial({ color: COLORE_SLAB }));
  const matPalco = r.add(new MeshLambertMaterial({ color: COLORE_PALCO }));
  const matSchermo = r.add(new MeshBasicMaterial({ color: "#F7F4EC" }));
  const matCornice = r.add(new MeshLambertMaterial({ color: "#3A342C" }));
  const matLeggio = r.add(new MeshLambertMaterial({ color: COLORE_LEGGIO }));
  const matOggetti = r.add(new MeshLambertMaterial({ vertexColors: true }));
  const matPannelli = r.add(new MeshLambertMaterial({ color: COLORE_PANNELLI }));

  /* ---- geometrie condivise ---- */
  const cubo = r.add(cuboUnitario());
  const muroGeom = r.add(cuboUnitario());
  // occlusione cotta: il muro si scurisce verso il pavimento (y unitario 0..1)
  coloraVertici(muroGeom, "#ffffff", (_x, y) => 1 - 0.2 * Math.exp(-y / 0.1));

  /* ---- pavimento: lastra, moquette ---- */
  const slab = new Mesh(cubo, matSlab);
  slab.position.y = -0.2;
  const pavimento = new Mesh(r.add(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), matMoq);
  pavimento.position.y = 0.002;
  radice.add(slab, pavimento);

  /* ---- elementi istanziati della sala: muri, veletta, strisce, pilastri, finestre ---- */
  const muri = creaIstanze(muroGeom, matMuro, 3);
  const velette = creaIstanze(cubo, matGesso, 3);
  const strisce = creaIstanze(cubo, matStriscia, 3);
  const pilastri = creaIstanze(cubo, matPilastri, 16);
  const finestre = creaIstanze(r.add(new PlaneGeometry(1, 1).translate(0, 0.5, 0)), matVetro, 24);
  radice.add(muri, velette, strisce, pilastri, finestre);

  /* ---- palco, schermo, leggio ---- */
  const palcoMesh = new Mesh(cubo, matPalco);
  const cornice = new Mesh(cubo, matCornice);
  const schermo = new Mesh(cubo, matSchermo);
  const leggio = new Mesh(cubo, matLeggio);
  radice.add(palcoMesh, cornice, schermo, leggio);

  /* ---- sedie, tavoli, ombre, pannelli ---- */
  const sedie = creaIstanze(r.add(geometriaSedia()), matOggetti, MAX_SEDIE);
  const tavoliRet = creaIstanze(r.add(geometriaTavoloRet()), matOggetti, MAX_TAVOLI);
  const tavoliTondi = creaIstanze(r.add(geometriaTavoloTondo()), matOggetti, MAX_TAVOLI);
  const ombreSedie = creaOmbreIstanziate(MAX_SEDIE);
  const ombreTavoli = creaOmbreIstanziate(MAX_TAVOLI * 2);
  const pannelli = creaIstanze(r.add(cuboUnitario()), matPannelli, MAX_PANNELLI);
  radice.add(ombreSedie, ombreTavoli, sedie, tavoliRet, tavoliTondi, pannelli);

  /* ───────────── stato della transizione ───────────── */

  let stato: Stato | null = null;
  let stanzaDa: Stanza = { A: 10, B: 10, h: 4 };
  let stanzaA: Stanza = { A: 10, B: 10, h: 4 };
  let coppiaSedie: Coppia = accoppia(VUOTO, VUOTO, [0, 0]);
  let coppiaRet: Coppia = coppiaSedie;
  let coppiaTondi: Coppia = coppiaSedie;
  let schema: SchemaPareti | null = null;
  let w0 = 0;
  let w1 = 0;
  let wCorrente = 0;
  let piano: Piano = pianoTempi({ cambiaDivisa: false, dividendo: false });
  let t = 0;
  let manuale = false;
  let stanzaCorrente: Stanza = stanzaA;
  let compattato = false;

  /** Stato attualmente disegnato di un InstancedMesh: `[x, z, rotY, scala]` delle istanze visibili. */
  const leggiIstanze = (mesh: InstancedMesh): Float32Array => {
    const m = mesh.instanceMatrix.array as Float32Array;
    const n = mesh.count;
    const out = new Float32Array(n * STRIDE);
    for (let i = 0; i < n; i++) {
      const o = 16 * i;
      const s = Math.hypot(m[o], m[o + 2]);
      out[STRIDE * i] = m[o + 12];
      out[STRIDE * i + 1] = m[o + 14];
      out[STRIDE * i + 2] = Math.atan2(-m[o + 2], m[o]);
      out[STRIDE * i + 3] = s;
    }
    return out;
  };

  const frameDi = (hall: CongressHall): Stanza => {
    const tl = telaio(hall.dims);
    return { A: tl.larghezza, B: tl.profondita, h: hall.heightM };
  };

  /**
   * Distanza della camera che inquadra tutta la sala all'azimut `az` (esatta, vedi `distanzaVista`).
   * Durante l'orbita si ricalcola a ogni passo (`ruota`): la sala resta sempre intera nel riquadro
   * senza lasciare un margine enorme a riposo.
   */
  const distanzaPer = (s: Stanza, pol: number, az: number): number =>
    // si inquadra anche lo spessore dei muri (SPESSORE_MURO per lato) e la lastra del pavimento
    distanzaVista(s.A + 2 * SPESSORE_MURO, s.B + 2 * SPESSORE_MURO, s.h + 0.3, { az, pol, fov: FOV, aspetto, riempimento: 0.97, bersaglio: BERSAGLIO });
  const vistaFit = (s: Stanza, az: number, pol: number): VistaCamera => ({ az, pol, dist: distanzaPer(s, pol, az) });
  /** Elevazione di partenza: più ripida nelle sale piccole, dove i muri alti coprirebbero le sedie. */
  const polPer = (s: Stanza): number => {
    const m = Math.max(s.A, s.B);
    const p = m <= 9 ? 31 : m <= 14 ? 36 : VISTA_SALA.pol;
    return Math.min(limiti.pol[1], Math.max(limiti.pol[0], p));
  };

  /* ───────────── scrittura di un fotogramma, funzione di t ───────────── */

  function aggiornaStanza(s: Stanza): void {
    const { A, B, h } = s;
    stanzaCorrente = s;
    pavimento.scale.set(A, 1, B);
    slab.scale.set(A + 1.4, 0.2, B + 1.4);
    slab.position.z = -0.0;
    const rep = matMoq.map;
    if (rep) rep.repeat.set(A / 3.6, B / 3.6);

    // muri: fondo e due laterali (davanti niente: casa di bambole)
    const mm = muri.instanceMatrix.array as Float32Array;
    const sp = SPESSORE_MURO; // i muri contengono le tasche dei pannelli e il retro dei pilastri
    scriviMatrice(mm, 0, 0, 0, -B / 2 - sp / 2, 0, A + 2 * sp, h, sp);
    scriviMatrice(mm, 1, -A / 2 - sp / 2, 0, -sp / 2, 0, sp, h, B + sp);
    scriviMatrice(mm, 2, A / 2 + sp / 2, 0, -sp / 2, 0, sp, h, B + sp);
    impostaConteggio(muri, 3);
    segnaAggiornate(muri);

    // soffitto a gesso suggerito: veletta lungo i tre muri + striscia di luce sul bordo interno
    const vv = velette.instanceMatrix.array as Float32Array;
    const ss = strisce.instanceMatrix.array as Float32Array;
    const larg = Math.min(1.1, Math.max(0.3, 0.1 * Math.min(A, B))); // nelle sale piccole la veletta non copre le sedie
    scriviMatrice(vv, 0, 0, h - 0.3, -B / 2 + larg / 2, 0, A, 0.3, larg);
    scriviMatrice(vv, 1, -A / 2 + larg / 2, h - 0.301, 0, 0, larg, 0.299, B);
    scriviMatrice(vv, 2, A / 2 - larg / 2, h - 0.301, 0, 0, larg, 0.299, B);
    scriviMatrice(ss, 0, 0, h - 0.33, -B / 2 + larg, 0, Math.max(0.1, A - 2 * larg), 0.03, 0.1);
    scriviMatrice(ss, 1, -A / 2 + larg, h - 0.33, 0, 0, 0.1, 0.03, Math.max(0.1, B - larg));
    scriviMatrice(ss, 2, A / 2 - larg, h - 0.33, 0, 0, 0.1, 0.03, Math.max(0.1, B - larg));
    impostaConteggio(velette, 3);
    impostaConteggio(strisce, 3);
    segnaAggiornate(velette);
    segnaAggiornate(strisce);

    // pilastri (pilastri a muro, sporgono 15 cm) e finestre fra un pilastro e l'altro
    const np = Math.max(0, Math.floor(B / 6));
    const pp = pilastri.instanceMatrix.array as Float32Array;
    const ff = finestre.instanceMatrix.array as Float32Array;
    let ip = 0;
    let iw = 0;
    const passo = B / (np + 1);
    const wFin = Math.min(3.2, passo - 1.4);
    const hFin = Math.min(2.4, h - 1.5);
    for (const lato of [-1, 1]) {
      for (let i = 1; i <= np; i++) {
        scriviMatrice(pp, ip++, lato * (A / 2 + 0.2), 0, -B / 2 + i * passo, 0, 0.7, h - 0.3, 0.7);
      }
      if (wFin >= 1 && hFin > 0.5) {
        for (let i = 0; i <= np; i++) {
          scriviMatrice(ff, iw++, lato * (A / 2 - 0.004), 0.9, -B / 2 + (i + 0.5) * passo, lato < 0 ? Math.PI / 2 : -Math.PI / 2, wFin, hFin, 1);
        }
      }
    }
    impostaConteggio(pilastri, ip);
    impostaConteggio(finestre, iw);
    segnaAggiornate(pilastri);
    segnaAggiornate(finestre);

    // palco, schermo, leggio (sul lato z negativo)
    const pd = Math.min(3.2, Math.max(0.9, 0.12 * B));
    const pw = Math.min(A - 0.8, 14);
    palcoMesh.scale.set(pw, 0.35, pd);
    palcoMesh.position.set(0, 0, -B / 2 + pd / 2);
    const sw = Math.min(A * 0.5, 7.5);
    const sh = Math.min(sw * 0.5625, Math.max(1, h - 1.9));
    schermo.scale.set(sw, sh, 0.05);
    schermo.position.set(0, 1.15, -B / 2 + 0.09);
    cornice.scale.set(sw + 0.18, sh + 0.18, 0.05);
    cornice.position.set(0, 1.06, -B / 2 + 0.05);
    leggio.scale.set(0.55, 1.0, 0.45);
    leggio.position.set(-Math.min(pw / 2 - 0.5, A * 0.28), 0.35, -B / 2 + pd * 0.55);
  }

  /** Scrive ombre di contatto sotto gli oggetti istanziati, leggendo le loro matrici attuali. */
  function scriviOmbre(): void {
    const arr = ombreSedie.instanceMatrix.array as Float32Array;
    const m = sedie.instanceMatrix.array as Float32Array;
    const n = sedie.count;
    for (let i = 0; i < n; i++) {
      const o = 16 * i;
      const s = Math.hypot(m[o], m[o + 2]);
      scriviMatrice(arr, i, m[o + 12], 0, m[o + 14], Math.atan2(-m[o + 2], m[o]), (OGGETTI.sedia.larghezza + 0.14) * s, 1, (OGGETTI.sedia.profondita + 0.14) * s);
    }
    impostaConteggio(ombreSedie, n);
    segnaAggiornate(ombreSedie);

    const at = ombreTavoli.instanceMatrix.array as Float32Array;
    let k = 0;
    const mr = tavoliRet.instanceMatrix.array as Float32Array;
    for (let i = 0; i < tavoliRet.count; i++) {
      const o = 16 * i;
      const s = Math.hypot(mr[o], mr[o + 2]);
      scriviMatrice(at, k++, mr[o + 12], 0, mr[o + 14], Math.atan2(-mr[o + 2], mr[o]), (OGGETTI.tavoloRettangolare.lunghezza + 0.5) * s, 1, (OGGETTI.tavoloRettangolare.profondita + 0.5) * s);
    }
    const mt = tavoliTondi.instanceMatrix.array as Float32Array;
    for (let i = 0; i < tavoliTondi.count; i++) {
      const o = 16 * i;
      const s = Math.hypot(mt[o], mt[o + 2]);
      scriviMatrice(at, k++, mt[o + 12], 0, mt[o + 14], 0, (OGGETTI.tavoloTondo.diametro + 0.6) * s, 1, (OGGETTI.tavoloTondo.diametro + 0.6) * s);
    }
    impostaConteggio(ombreTavoli, k);
    segnaAggiornate(ombreTavoli);
  }

  /** Riscrive tutta la scena al tempo `tt` (ms) della transizione. */
  function scrivi(tt: number): void {
    const fs = faseAt(tt, piano.sedie);
    const fr = easeIn(faseAt(tt, piano.stanza));
    const stanza: Stanza = {
      A: lerp(stanzaDa.A, stanzaA.A, fr),
      B: lerp(stanzaDa.B, stanzaA.B, fr),
      h: lerp(stanzaDa.h, stanzaA.h, fr),
    };
    aggiornaStanza(stanza);

    // a tween finito (e solo se lo guida il tempo) le istanze invisibili si tolgono dal disegno
    if (!manuale && fs >= 1 && !compattato) {
      coppiaSedie = compatta(coppiaSedie);
      coppiaRet = compatta(coppiaRet);
      coppiaTondi = compatta(coppiaTondi);
      compattato = true;
    }
    morfaMatrici(fs, coppiaSedie, sedie.instanceMatrix.array as Float32Array, { salto: SALTO });
    impostaConteggio(sedie, coppiaSedie.n);
    segnaAggiornate(sedie);
    morfaMatrici(fs, coppiaRet, tavoliRet.instanceMatrix.array as Float32Array, { salto: 0 });
    impostaConteggio(tavoliRet, coppiaRet.n);
    segnaAggiornate(tavoliRet);
    morfaMatrici(fs, coppiaTondi, tavoliTondi.instanceMatrix.array as Float32Array, { salto: 0 });
    impostaConteggio(tavoliTondi, coppiaTondi.n);
    segnaAggiornate(tavoliTondi);
    scriviOmbre();

    wCorrente = lerp(w0, w1, faseAt(tt, piano.pareti));
    if (schema) {
      const n = scriviPannelli(pannelli.instanceMatrix.array as Float32Array, wCorrente, schema, stanza.A, stanza.B, stanza.h);
      impostaConteggio(pannelli, n);
    } else {
      impostaConteggio(pannelli, 0);
    }
    segnaAggiornate(pannelli);
  }

  /* ───────────── configura ───────────── */

  function configura(c: ConfigurazioneSala, opz: OpzioniConfigurazione = {}): void {
    const hall = trovaSala(c.sala) ?? stato?.hall ?? (trovaSala(SALA_SCENA_ID) as CongressHall);
    const disp = disposizioneEffettiva(hall, c.disposizione).disposizione;
    const divisa = c.divisa && hall.divisibleInto !== undefined;
    const nuovo: Stato = { hall, disp, ospiti: c.ospiti, divisa };
    const salaCambiata = !stato || stato.hall.id !== hall.id;
    const divisaCambiata = !!stato && !salaCambiata && stato.divisa !== divisa;

    // stato di partenza = ciò che si vede ora (anche a metà di un tween)
    const partenza = {
      sedie: leggiIstanze(sedie),
      ret: leggiIstanze(tavoliRet),
      tondi: leggiIstanze(tavoliTondi),
    };
    stanzaDa = stato ? stanzaCorrente : frameDi(hall);
    stanzaA = frameDi(hall);

    const dis: Disegno = divisa ? layoutVuoto(hall, disp) : (layoutSala(hall, disp, c.ospiti) as Disegno);
    const parcheggio: readonly [number, number] = [stanzaA.A / 2 - 0.6, stanzaA.B / 2 - 0.5];
    coppiaSedie = accoppia(partenza.sedie, dis.sedie, parcheggio);
    coppiaRet = accoppia(partenza.ret, dis.tipoTavoli === "rettangolari" ? dis.tavoli : VUOTO, parcheggio);
    coppiaTondi = accoppia(partenza.tondi, dis.tipoTavoli === "tondi" ? dis.tavoli : VUOTO, parcheggio);
    compattato = false;

    // pareti mobili: due stati; se la sala cambia i pannelli saltano nel nuovo stato
    schema = hall.divisibleInto ? schemaPareti(hall.divisibleInto, stanzaA.A, stanzaA.B) : null;
    w1 = divisa ? 1 : 0;
    w0 = divisaCambiata ? wCorrente : w1;
    piano = pianoTempi({ cambiaDivisa: divisaCambiata, dividendo: divisa });

    stato = nuovo;
    // camera: la distanza segue la sala; l'orbita scelta dall'utente resta
    const d = rig.destinazione;
    rig.vaiA(vistaFit(stanzaA, d.az, salaCambiata ? polPer(stanzaA) : d.pol), !!opz.istantaneo || !salaCambiata);

    if (opz.k !== undefined) {
      manuale = true;
      t = Math.min(1, Math.max(0, opz.k)) * piano.totale;
    } else {
      manuale = false;
      t = opz.istantaneo || ctx.reducedMotion ? piano.totale : 0;
    }
    scrivi(t);
    ctx.richiediFrame();
  }

  configura(CONFIGURAZIONE_INIZIALE, { istantaneo: true });
  rig.vaiA(vistaFit(stanzaA, VISTA_SALA.az, polPer(stanzaA)), true);

  return {
    scena,
    camera,
    radice,
    setLuce() {
      /* luce neutra e fissa: nessun giorno/sera (MOTION 5.1) */
    },
    setProgresso(p) {
      if (!manuale) return;
      t = Math.min(1, Math.max(0, p)) * piano.totale;
      scrivi(t);
    },
    configura,
    vaiA(vista, istantaneo) {
      if (vista === null) {
        rig.vaiA(vistaFit(stanzaA, VISTA_SALA.az, polPer(stanzaA)), istantaneo);
      } else {
        rig.vaiA(vista, istantaneo);
      }
    },
    ruota(g) {
      // la distanza segue l'azimut: prima si riporta la distanza per l'azimut di arrivo, poi si ruota
      const d = rig.destinazione;
      const az = Math.min(limiti.az[1], Math.max(limiti.az[0], d.az + g));
      rig.vaiA({ az: d.az, pol: d.pol, dist: distanzaPer(stanzaA, d.pol, az) });
      rig.ruota(g);
    },
    proietta: (p, out) => rig.proietta(p, out),
    update(dt) {
      let inMovimento = rig.update(dt);
      if (!manuale && t < piano.totale) {
        t = Math.min(piano.totale, t + dt * 1000);
        scrivi(t);
        if (t < piano.totale) inMovimento = true;
      }
      return inMovimento;
    },
    setQualita() {
      /* una sola qualità: le ombre di contatto costano una draw call e restano */
    },
    resize(w, h) {
      rig.resize(w, h);
      aspetto = w / Math.max(1, h);
      const d = rig.destinazione;
      rig.vaiA(vistaFit(stanzaA, d.az, d.pol), true);
    },
    dispose() {
      for (const m of [muri, velette, strisce, pilastri, finestre, sedie, tavoliRet, tavoliTondi, ombreSedie, ombreTavoli, pannelli]) {
        m.dispose();
      }
      r.dispose();
      scena.clear();
    },
  };
}
