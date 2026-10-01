/*
 * Scena 3D delle camere (MOTION 4, DESIGN 5): UN'unica scena `costruisciRooms(tipo)` che compone
 * i moduli A / twin / soggiorno. `cambiaTipo` li fa entrare e uscire (<= 720 ms) senza ricostruire
 * il resto; se invece il controller chiede una scena nuova, questa si costruisce da zero (poche
 * decine di millisecondi) e `dispose` libera tutto.
 *
 * Come nel modello (_demo.ts): tutto in un `Risorse`, nessuna luce aggiunta o tolta, la luce è
 * una funzione di t, la camera è un `OrbitRig`. Il punto guardato si sposta traslando la radice
 * della scena (così si riusa OrbitRig, che orbita sempre attorno all'origine).
 */

import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  type Material,
} from "three";
import { OrbitRig } from "../../components/scene/CameraRig";
import type { Hotspot, Posizione3D, Proiezione, Qualita, RoomId, SceneContext, SceneDef, SceneHandle, VistaCamera } from "../../content/types";
import { LuciBase, campionaColore, campionaScalare, texturaAlone, type StopColore, type StopScalare } from "../../lib/three/lights";
import { COLORI, Risorse, matParquet } from "../../lib/three/materials";
import { texturaOmbra } from "../../lib/three/shadows";
import { ease, clampf } from "./geo";
import {
  DIVANO_ALZA,
  DIVANO_SCORRI,
  PORTA_COM_APERTA,
  moduloCamera,
  moduloSoggiorno,
} from "./moduli";
import type { Ctx, Modulo } from "./tipi";
import { CENTRO, LIMITI_ORBITA, PASSO_MODULI, SECONDO_MODULO, SOTTO_VISTE, VISTA_INIZIALE } from "./viste";

export type RoomsHandle = SceneHandle & {
  readonly tipo: RoomId;
  /** Cambia composizione dentro la stessa scena: i moduli scorrono (<= 720 ms). Istantaneo con `true` o con movimento ridotto. */
  cambiaTipo(tipo: RoomId, istantaneo?: boolean): void;
};

/* Tabelle di luce: 0 = giorno, 1 = sera (DESIGN 5.3, MOTION 4.5) */
const KEY_COL: StopColore[] = [[0, "#FFF1DC"], [1, "#FFB867"]];
const KEY_INT: StopScalare[] = [[0, 0.98], [1, 0.42]];
const HEMI_INT: StopScalare[] = [[0, 0.62], [1, 0.32]];
const TENDA_EMISSIVO: StopScalare[] = [[0, 0.42], [1, 0.08]];
const FINESTRA: StopColore[] = [[0, "#CFE3EE"], [1, "#3A4A66"]];
const PARETE: StopColore[] = [[0, COLORI.intonaco], [1, COLORI.intonacoSera]];
const VELO: StopColore[] = [[0, "#FFFFFF"], [1, "#8F887C"]];
const SFONDO: StopColore[] = [[0, "#F2EBDD"], [1, "#1C160F"]];
const PUNTO: StopScalare[] = [[0, 0], [0.5, 0], [1, 1.4]];
const LAMPADA: StopScalare[] = [[0, 0.3], [1, 1]];
const SOLE: StopScalare[] = [[0, 1], [0.4, 0.1], [0.55, 0]];
/** direzione verso il sole: dalla finestra a sinistra, alto, un po' davanti */
const SOLE_DIR: Posizione3D = [-0.38, 0.62, 0.68];

const DUR_MODULO = 0.48;
const DUR_SCALA = 0.24;
const DUR_PIUMINO = 0.48;
const DUR_DIVANO = 0.48;
const DUR_CULLA = 0.24;

type Tw = { chiave: string; t: number; d: number; f: (k: number) => void; fine?: () => void };

export function costruisciRooms(tipoIniziale: RoomId, ctx: SceneContext, def: Pick<SceneDef, "hotspots" | "limiti">): RoomsHandle {
  const r = new Risorse();
  const scena = new Scene();
  const radice = new Group();
  scena.add(radice);
  scena.background = new Color(SFONDO[0][1]);
  let tipo = tipoIniziale;

  /* ---- materiali (uno per tipo: pochi draw call) ---- */
  const pav = matParquet(r, 5.4, 4.1);
  pav.vertexColors = true;
  pav.color.set("#EFE6D6");
  const parete = r.add(new MeshLambertMaterial({ color: COLORI.intonaco, vertexColors: true }));
  const luce = r.add(new MeshLambertMaterial({ vertexColors: true, emissive: COLORI.paralume, emissiveIntensity: LAMPADA[0][1], side: DoubleSide }));
  const vetro = r.add(new MeshBasicMaterial({ vertexColors: true, color: FINESTRA[0][1] }));
  const ombra = r.add(
    new MeshBasicMaterial({
      map: texturaOmbra(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: DoubleSide,
    }),
  );
  const sole = r.add(
    new MeshBasicMaterial({
      map: texturaAlone(),
      color: "#FFDDA6",
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0.34,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    }),
  );
  const mat: Record<string, Material> = {
    pav,
    parete,
    solido: r.add(new MeshLambertMaterial({ vertexColors: true })),
    tenda: r.add(new MeshLambertMaterial({ vertexColors: true, side: DoubleSide, emissive: "#CBB892", emissiveIntensity: TENDA_EMISSIVO[0][1] })),
    velo: r.add(new MeshLambertMaterial({ vertexColors: true, side: DoubleSide, transparent: true, opacity: 0.55, depthWrite: false, forceSinglePass: true })),
    luce,
    vetro,
    ombra,
    sole,
  };
  const c: Ctx = { r, mat, ridotto: ctx.reducedMotion };

  /* ---- camera e orbita (attorno all'origine; il punto guardato è la radice traslata) ---- */
  const camera = new PerspectiveCamera(36, ctx.larghezza / ctx.altezza, 0.1, 90);
  const vista0 = VISTA_INIZIALE[tipo];
  let aspetto = ctx.larghezza / Math.max(1, ctx.altezza);
  /** Più la cornice è stretta (telefono), più la camera si allontana per far stare le stanze in larghezza. */
  const fit = (): number => {
    const k = Math.max(1, 1.45 / aspetto);
    return k ** 0.8;
  };
  const rig = new OrbitRig({
    camera,
    limiti: def.limiti ?? LIMITI_ORBITA,
    vistaIniziale: { ...vista0, dist: vista0.dist * fit() },
    bersaglio: [0, 0, 0],
    distanza: [1.5, 90],
    reducedMotion: ctx.reducedMotion,
    larghezza: ctx.larghezza,
    altezza: ctx.altezza,
  });
  let distBase = vista0.dist;
  const fuoco = { x: CENTRO[tipo][0], y: CENTRO[tipo][1], z: CENTRO[tipo][2] };
  const fuocoT = { ...fuoco };
  const applicaFuoco = () => radice.position.set(-fuoco.x, -fuoco.y, -fuoco.z);
  applicaFuoco();

  /* ---- luci: 1 direzionale + 1 emisferica + 1 PointLight sempre presente ---- */
  const luci = new LuciBase({ hemiCielo: "#F1EBDD", hemiTerra: "#CDBFA6", keyDirezione: SOLE_DIR, puntoPosizione: [CENTRO[tipo][0], 1.9, -0.8], puntoDistanza: tipo === "classic" ? 7.5 : 11 });
  radice.add(luci.gruppo);

  /* ---- stato di luce, qualità e intro (dichiarato prima dei moduli: li usa `assicuraModulo`) ---- */
  const c1 = new Color();
  const c2 = new Color();
  let t = 0;
  let intro = c.ridotto ? 1 : 0;
  let introAvviata = c.ridotto;
  let qualita: Qualita = ctx.qualita;
  let puntoSpento = qualita === "lite1" || qualita === "lite2";

  /* ---- moduli ---- */
  const A = moduloCamera(c, "classic");
  radice.add(A.gruppo);
  let B: Modulo | null = null;
  let tipoB: "twin" | "soggiorno" | null = null;
  const extra: Partial<Record<"twin" | "soggiorno", Modulo>> = {};
  const piccoli = new Set<Mesh>(A.piccoli);
  const aloni = new Set<Modulo["aloni"][number]>(A.aloni);

  const DISTANZA_USCITA = 9;
  const posB = { x: PASSO_MODULI, y: 0 };
  const poniB = (m: Modulo | null, x: number, y: number) => m?.gruppo.position.set(x, y, 0);

  function assicuraModulo(t: "twin" | "soggiorno"): Modulo {
    let m = extra[t];
    if (!m) {
      m = t === "twin" ? moduloCamera(c, "twin") : moduloSoggiorno(c);
      extra[t] = m;
      for (const p of m.piccoli) piccoli.add(p);
      for (const a of m.aloni) aloni.add(a);
      m.gruppo.visible = false;
      radice.add(m.gruppo);
      applicaLuce();
      applicaQualita();
    }
    return m;
  }

  /* ---- tween ---- */
  const tws: Tw[] = [];
  const anima = (chiave: string, durS: number, ritardoS: number, f: (k: number) => void, fine?: () => void): void => {
    for (let i = tws.length - 1; i >= 0; i--) if (tws[i].chiave === chiave) tws.splice(i, 1);
    if (c.ridotto) {
      f(1);
      fine?.();
      ctx.richiediFrame();
      return;
    }
    tws.push({ chiave, t: -ritardoS, d: durS, f, fine });
    ctx.richiediFrame();
  };
  const verso = (da: number, a: number) => (k: number) => da + (a - da) * ease(k);

  /* ---- stato delle parti ---- */

  const piuminoA = (aperto: boolean, subito = false) => {
    const p = A.parti.piumino;
    if (!p) return;
    const da = p.rotation.x;
    const a = aperto ? -Math.PI : 0;
    if (subito) return void (p.rotation.x = a);
    anima("piumino", DUR_PIUMINO, 0, (k) => (p.rotation.x = verso(da, a)(k)));
  };
  const divanoA = (aperto: boolean, subito = false) => {
    const m = extra.soggiorno;
    const sed = m?.parti.sedile;
    const sch = m?.parti.schienale;
    if (!sed || !sch) return;
    const dz = sed.position.z;
    const dy = sed.position.y;
    const dr = sch.rotation.x;
    const az = aperto ? DIVANO_SCORRI : 0;
    const ay = aperto ? DIVANO_ALZA : 0;
    const ar = aperto ? Math.PI / 2 : 0;
    const f = (k: number) => {
      sed.position.z = dz + (az - dz) * k;
      sed.position.y = dy + (ay - dy) * k;
      sch.rotation.x = dr + (ar - dr) * k;
    };
    if (subito) return f(1);
    anima("divano", DUR_DIVANO, 0, (k) => f(ease(k)));
  };
  const cullaA = (presente: boolean, subito = false) => {
    const cu = extra.twin?.parti.culla;
    if (!cu) return;
    const da = cu.scale.x;
    const a = presente ? 1 : 0.001;
    const f = (k: number) => {
      cu.scale.setScalar(Math.max(0.001, da + (a - da) * k));
      cu.visible = cu.scale.x > 0.0015;
    };
    if (subito) return f(1);
    anima("culla", DUR_CULLA, 0, (k) => f(ease(k)));
  };
  const portaA = (aperta: boolean, ritardoS = 0, subito = false) => {
    const p = extra.twin?.parti.portaCom;
    if (!p) return;
    const da = p.rotation.y;
    const a = aperta ? PORTA_COM_APERTA : 0;
    if (subito) return void (p.rotation.y = a);
    anima("porta", 0.48, ritardoS, (k) => (p.rotation.y = verso(da, a)(k)));
  };
  /** Armadio (Suite) e console TV (Classic, Family) nel modulo A: l'uno compare, l'altro sparisce. */
  const arredoA = (suite: boolean, subito = false) => {
    for (const [g, visibile] of [
      [A.parti.armadio, suite],
      [A.parti.consolle, !suite],
    ] as const) {
      if (!g) continue;
      const da = g.visible ? g.scale.x : 0.001;
      const a = visibile ? 1 : 0.001;
      const f = (k: number) => {
        const s = Math.max(0.001, da + (a - da) * k);
        g.scale.setScalar(s);
        g.visible = s > 0.0015;
      };
      if (subito) f(1);
      else anima(visibile ? "arm-on" : "arm-off" + (g === A.parti.armadio ? "a" : "c"), DUR_SCALA, 0, (k) => f(ease(k)));
    }
  };

  /* ---- composizione iniziale ---- */
  const nuovoB = SECONDO_MODULO[tipo];
  if (nuovoB) {
    B = assicuraModulo(nuovoB);
    tipoB = nuovoB;
    B.gruppo.visible = true;
    poniB(B, posB.x, 0);
    if (nuovoB === "twin") portaA(true, 0, true);
  }
  arredoA(tipo === "suite", true);
  // piumino: chiuso all'ingresso (si apre 600 ms dopo il primo frame); in movimento ridotto parte già aperto
  piuminoA(c.ridotto, true);

  /* ---- la luce è una funzione di t (0 giorno, 1 sera) ---- */

  function applicaLuce() {
    luci.setKey(campionaColore(KEY_COL, t, c1), campionaScalare(KEY_INT, t));
    luci.setHemi(campionaScalare(HEMI_INT, t));
    vetro.color.copy(campionaColore(FINESTRA, t, c2));
    parete.color.copy(campionaColore(PARETE, t, c2));
    (scena.background as Color).copy(campionaColore(SFONDO, t, c2));
    (luce as MeshLambertMaterial).emissiveIntensity = campionaScalare(LAMPADA, t);
    (mat.tenda as MeshLambertMaterial).emissiveIntensity = campionaScalare(TENDA_EMISSIVO, t);
    (mat.velo as MeshLambertMaterial).color.copy(campionaColore(VELO, t, c2));
    sole.opacity = 0.34 * campionaScalare(SOLE, t);
    // gli aloni: un poco di giorno (l'accensione), pieni di sera
    const ss = clampf((t - 0.3) / 0.65, 0, 1);
    const op = Math.max(0.5 * intro * (1 - ss), ss * ss * (3 - 2 * ss));
    for (const a of aloni) a.setOpacita(op);
    luci.setPunto(puntoSpento ? 0 : campionaScalare(PUNTO, t));
  }
  function applicaQualita() {
    const nascondi = qualita === "lite1" || qualita === "lite2";
    for (const p of piccoli) p.visible = !nascondi;
  }
  applicaLuce();
  applicaQualita();

  /* ---- hotspot: vista -> effetto sulla scena ---- */
  const stessa = (a: VistaCamera, b: VistaCamera) => a === b || (a.az === b.az && a.pol === b.pol && a.dist === b.dist);
  const trovaHotspot = (v: VistaCamera | null): Hotspot | undefined =>
    v ? (def.hotspots.find((h) => h.vista === v) ?? def.hotspots.find((h) => stessa(h.vista, v))) : undefined;
  /** Dove guardare: il punto dell'hotspot, il centro di una sotto-vista dei chip, oppure il centro della composizione. */
  const fuocoDi = (v: VistaCamera | null, h: Hotspot | undefined): Posizione3D => {
    if (h) {
      // il punto guardato scivola un poco verso il centro della stanza: gli oggetti sui muri esterni non finiscono sul bordo
      const c0 = CENTRO[tipo];
      return [h.pos[0] * 0.72 + c0[0] * 0.28, h.pos[1] * 0.85 + c0[1] * 0.15, h.pos[2] * 0.72 + c0[2] * 0.28];
    }
    if (v) {
      for (const lista of Object.values(SOTTO_VISTE)) for (const s of lista) if (stessa(s.vista, v)) return s.centro;
    }
    return CENTRO[tipo];
  };

  const impostaFuoco = (p: Posizione3D, subito: boolean) => {
    fuocoT.x = p[0];
    fuocoT.y = p[1];
    fuocoT.z = p[2];
    if (subito || c.ridotto) {
      fuoco.x = fuocoT.x;
      fuoco.y = fuocoT.y;
      fuoco.z = fuocoT.z;
      applicaFuoco();
    }
  };

  function vaiA(v: VistaCamera | null, istantaneo = false) {
    const h = trovaHotspot(v);
    const base = v ?? VISTA_INIZIALE[tipo];
    distBase = base.dist;
    impostaFuoco(fuocoDi(v, h), istantaneo);
    rig.vaiA({ az: base.az, pol: base.pol, dist: base.dist * fit() }, istantaneo);
    // i dettagli "che si aprono"
    const id = h?.id;
    if (id === "letto" || id === "letto-matrimoniale") {
      if (!istantaneo && !c.ridotto) {
        const p = A.parti.piumino;
        if (p) p.rotation.x = 0; // si richiude e si riapre: «il letto si prepara»
        piuminoA(true);
      }
    }
    divanoA(id === "divano-letto", istantaneo);
    if (id === "extra") cullaA(true, istantaneo);
    else if (!v) cullaA(false, istantaneo);
    if (id === "porta-comunicante") portaA(true);
    ctx.richiediFrame();
  }

  /* ---- cambio di composizione ---- */
  function cambiaTipo(nuovo: RoomId, istantaneo = false) {
    if (nuovo === tipo) return;
    const subito = istantaneo || c.ridotto;
    const prima = tipoB;
    const dopo = SECONDO_MODULO[nuovo];
    const uscente = B;
    tipo = nuovo;

    if (prima !== dopo) {
      const entra = dopo ? assicuraModulo(dopo) : null;
      if (entra) {
        entra.gruppo.visible = true;
        // il modulo entra da destra (e, se ne esce un altro, dall'alto: non si compenetrano)
        if (!subito) poniB(entra, posB.x + DISTANZA_USCITA, uscente ? 3 : 0);
        else poniB(entra, posB.x, 0);
        if (dopo === "twin") portaA(false, 0, true);
      }
      B = entra;
      tipoB = dopo;
      if (!subito) {
        if (entra) {
          anima("entra", DUR_MODULO, 0, (k) => poniB(entra, posB.x + DISTANZA_USCITA * (1 - ease(k)), (uscente ? 3 : 0) * (1 - ease(k))));
          if (dopo === "twin") portaA(true, 0.24);
        }
        if (uscente) {
          anima("esce", DUR_MODULO, 0, (k) => poniB(uscente, posB.x + DISTANZA_USCITA * ease(k), (entra ? -3 : 0) * ease(k)), () => {
            if (B !== uscente) uscente.gruppo.visible = false;
          });
        }
      } else {
        if (uscente) uscente.gruppo.visible = false;
        if (dopo === "twin") portaA(true, 0, true);
      }
    }
    arredoA(nuovo === "suite", subito);
    if (nuovo !== "suite") divanoA(false, true);
    cullaA(false, true);
    luci.punto.position.set(CENTRO[nuovo][0], 1.9, -0.8);
    luci.punto.distance = nuovo === "classic" ? 7.5 : 11;
    vaiA(null, subito);
    ctx.richiediFrame();
  }

  /* ---- primo avvio: il piumino si prepara e le lampade si accendono ---- */
  const avviaIntro = () => {
    introAvviata = true;
    anima("intro-aloni", 0.48, 0.15, (k) => {
      intro = k;
      applicaLuce();
    });
    anima("intro-piumino", DUR_PIUMINO, 0.6, (k) => {
      const p = A.parti.piumino;
      if (p) p.rotation.x = -Math.PI * ease(k);
    });
  };

  /* ---- update: avanza i tween, il fuoco e la camera ---- */
  const tmp: [number, number, number] = [0, 0, 0];

  return {
    scena,
    camera,
    radice,
    get tipo() {
      return tipo;
    },
    cambiaTipo,
    setLuce(v) {
      t = v;
      applicaLuce();
    },
    setProgresso() {
      /* le camere non hanno un avanzamento: la luce e la vista bastano */
    },
    vaiA,
    ruota: (g) => rig.ruota(g),
    proietta(pos, out: Proiezione) {
      tmp[0] = pos[0] - fuoco.x;
      tmp[1] = pos[1] - fuoco.y;
      tmp[2] = pos[2] - fuoco.z;
      rig.proietta(tmp, out);
    },
    update(dt) {
      if (!introAvviata) {
        avviaIntro();
      }
      let moto = rig.update(dt);
      // il punto guardato scivola verso la destinazione
      const dx = fuocoT.x - fuoco.x;
      const dy = fuocoT.y - fuoco.y;
      const dz = fuocoT.z - fuoco.z;
      if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 0.002) {
        const k = 1 - Math.exp(-Math.max(dt, 0) / 0.13);
        fuoco.x += dx * k;
        fuoco.y += dy * k;
        fuoco.z += dz * k;
        applicaFuoco();
        moto = true;
      } else if (dx || dy || dz) {
        fuoco.x = fuocoT.x;
        fuoco.y = fuocoT.y;
        fuoco.z = fuocoT.z;
        applicaFuoco();
      }
      if (tws.length) {
        for (let i = tws.length - 1; i >= 0; i--) {
          const w = tws[i];
          w.t += dt;
          if (w.t < 0) continue;
          const k = clampf(w.t / w.d, 0, 1);
          w.f(k);
          if (k >= 1) {
            tws.splice(i, 1);
            w.fine?.();
          }
        }
        moto = true;
      }
      return moto;
    },
    setQualita(q: Qualita) {
      qualita = q;
      puntoSpento = q === "lite1" || q === "lite2";
      applicaLuce();
      applicaQualita();
    },
    resize(w, h) {
      rig.resize(w, h);
      aspetto = w / Math.max(1, h);
      const d = rig.destinazione;
      rig.vaiA({ az: d.az, pol: d.pol, dist: distBase * fit() }, true);
    },
    dispose() {
      r.dispose();
      scena.clear();
    },
  };
}
