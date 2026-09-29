"use client";
/* eslint-disable react-hooks/immutability -- three.js e' imperativo: gli oggetti
   della scena (materiali, buffer, camera) si scrivono ogni frame dentro useFrame
   come funzione pura di p. E' il disegno del film, non un effetto collaterale. */

/**
 * UN canvas, UNA scena, sei atti. Ogni useFrame legge `film` (state.ts) e scrive
 * la scena come funzione pura di p (+ il respiro G(t) e il puntatore H(m), gia'
 * smussato all'ingresso): niente state, niente molle. L'ordine dei useFrame e'
 * per priorita' (negativa = prima), il post chain ha priorita' 1 e disegna lui
 * (R3F non disegna piu' da solo).
 *
 * Costi dichiarati (desktop): figura 1 draw call istanziato (40k), gabbia 1,
 * stanza 3 shell + 1 nube di particelle (900 segmenti), fili 1 (LineSegments2),
 * orizzonte 1; post: bloom (5 mip) + lente/frangia (1 pass, 15 tap al picco,
 * SPENTO a riposo) + vignette + output + grana.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";
import { buildBeads } from "./plate";
import {
  FIRE_END,
  RELEASE_END,
  STRANDS,
  TAUT_END,
  cameraPose,
  clamp01,
  figureGate,
  film,
  fogFar,
  fringeAmount,
  horizonGate,
  latticeBuild,
  lensAmount,
  limeInFrame,
  mix,
  roomGate,
  smoothstep,
  speedNorm,
  spine,
  strandAnchor,
  wormGate,
  type Pose,
} from "./state";

export type Palette = {
  field: string;
  lime: string;
  gold: string;
  bone: string;
  boneDim: string;
};

/** La figura: 14 unita' di altezza, centrata in (0, 9, 0). */
const FIG_C = new THREE.Vector3(0, 9, 0);
const FIG_H = 14;
/** Conteggio dichiarato: ~40k desktop, ridotto su telefono. */
const BEADS_DESKTOP = 40000;
const BEADS_MOBILE = 14000;
const BEAD_R = 0.5; // raggio della geometria; la scala per perla lo porta a ~0.06-0.12
const BEAD_SCALE = 0.13;
/** Segmenti per filo: meno su telefono, MAI meno fili. */
const SEG_DESKTOP = 28;
const SEG_MOBILE = 12;
/** Particelle del wormhole: meno su telefono. */
const DUST_DESKTOP = 900;
const DUST_MOBILE = 350;
/** Guadagno del bone dei fili: sopra la soglia di bloom (1.15) in spazio lineare. */
const STRAND_GAIN = 1.5;
const LIME_HUE = 82 / 360;

/* --------------------------------------------------------------------------
   FIGURA: nuvola di perle istanziate, ombreggiatura bake in instanceColor.
   E4: respiro G(t) a tre frequenze incommensurabili (non si ripete a vista),
   che si calma con p (il moto appartiene all'ingresso, nel corridoio c'e' gia'
   lo swing); inclinazione H(m) dal puntatore smussato, attorno al proprio
   centro (traslazione compensativa). Una matrice per frame: le perle sono ferme.
   -------------------------------------------------------------------------- */
function Figure() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const beads = useMemo(() => {
    const count = film.mobile ? BEADS_MOBILE : BEADS_DESKTOP;
    // larghezza della plate: piu' stretta su schermo verticale (resta nell'inquadratura)
    const width = Math.min(24, Math.max(10, FIG_H * film.aspect * 1.25));
    return buildBeads(count, width, FIG_H, LIME_HUE);
  }, []);
  const geo = useMemo(() => new THREE.SphereGeometry(BEAD_R, 8, 6), []);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: true }),
    [],
  );
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );

  // Bake UNA volta: matrici (in coordinate mondo, centro incluso) e colore ombreggiato.
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m || !beads.count) return;
    const mat4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < beads.count; i++) {
      pos.set(beads.pos[i * 3] + FIG_C.x, beads.pos[i * 3 + 1] + FIG_C.y, beads.pos[i * 3 + 2] + FIG_C.z);
      const s = beads.scale[i] * BEAD_SCALE;
      scl.set(s, s, s);
      mat4.compose(pos, q, scl);
      m.setMatrixAt(i, mat4);
      c.setRGB(beads.col[i * 3], beads.col[i * 3 + 1], beads.col[i * 3 + 2], THREE.SRGBColorSpace);
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [beads]);

  const rot = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const cv = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const g = figureGate(film.sp);
    m.visible = g > 0.002;
    if (!m.visible) return;
    const still = film.reduced || film.paused;
    // G(t): tre frequenze, ampiezze del 2,5% di una figura di 14 unita'; si calma con p
    const calm = 1 / (1 + film.p * 4);
    const t = film.t;
    const floatY = still ? 0 : 0.35 * Math.sin(t * 0.9) * calm;
    const gy = still ? 0 : 0.04 * Math.sin(t * 0.37) * calm;
    const gz = still ? 0 : 0.015 * Math.sin(t * 0.61 + 1.3) * calm;
    // H(m): +-8 / +-10 gradi dal puntatore gia' smussato (zero su touch e reduced)
    const tiltX = film.reduced ? 0 : -film.my * 0.14;
    const tiltY = film.reduced ? 0 : film.mx * 0.18;
    const s = 1 + (1 - g) * 0.3; // passando attraverso, si apre
    rot.set(tiltX, tiltY + gy, gz);
    m.rotation.copy(rot);
    m.scale.setScalar(s);
    // traslazione compensativa: il perno resta al centro della figura, non all'origine
    cv.copy(FIG_C).applyEuler(rot).multiplyScalar(s);
    m.position.set(FIG_C.x - cv.x, FIG_C.y - cv.y + floatY, FIG_C.z - cv.z);
    mat.opacity = g;
  }, -1);

  if (!beads.count) return null;
  return <instancedMesh ref={ref} args={[geo, mat, beads.count]} frustumCulled={false} />;
}

/* --------------------------------------------------------------------------
   GABBIA: coppie di vertici non indicizzate, random CONDIVISO per coppia,
   parametro di estremo: ogni segmento si disegna dal proprio capo quando lo
   scalare di costruzione supera la sua soglia sfalsata. UNO scalare la tesse
   e la stesse.
   -------------------------------------------------------------------------- */
const LATTICE_VERT = /* glsl */ `
  attribute vec3 aOther;
  attribute float aRand;
  attribute float aEnd;
  uniform float uBuild;
  uniform float uFogNear;
  uniform float uFogFar;
  varying float vA;
  void main() {
    float th = aRand * 0.72;
    float l = clamp((uBuild - th) / 0.28, 0.0, 1.0);
    vec3 p = aEnd > 0.5 ? mix(aOther, position, l) : position;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float fog = smoothstep(uFogNear, uFogFar, -mv.z);
    vA = smoothstep(0.0, 0.12, l) * (1.0 - fog);
    gl_Position = projectionMatrix * mv;
  }
`;
const LATTICE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vA;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity * vA);
  }
`;

function Lattice({ palette }: { palette: Palette }) {
  const { geo, mat } = useMemo(() => {
    const W = 27;
    const H = 17;
    const D = 7;
    const nx = 8;
    const ny = 5;
    const nz = 2;
    const pts: number[] = [];
    const other: number[] = [];
    const rnd: number[] = [];
    const end: number[] = [];
    let seed = 11;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const seg = (a: number[], b: number[]) => {
      const r = rand();
      pts.push(...a, ...b);
      other.push(...b, ...a);
      rnd.push(r, r);
      end.push(0, 1);
    };
    const X = (i: number) => -W / 2 + (W * i) / nx;
    const Y = (j: number) => FIG_C.y - H / 2 + (H * j) / ny;
    const Z = (k: number) => -D / 2 + (D * k) / nz;
    for (let j = 0; j <= ny; j++)
      for (let k = 0; k <= nz; k++) for (let i = 0; i < nx; i++) seg([X(i), Y(j), Z(k)], [X(i + 1), Y(j), Z(k)]);
    for (let i = 0; i <= nx; i++)
      for (let k = 0; k <= nz; k++) for (let j = 0; j < ny; j++) seg([X(i), Y(j), Z(k)], [X(i), Y(j + 1), Z(k)]);
    for (let i = 0; i <= nx; i++)
      for (let j = 0; j <= ny; j++) for (let k = 0; k < nz; k++) seg([X(i), Y(j), Z(k)], [X(i), Y(j), Z(k + 1)]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    geo.setAttribute("aOther", new THREE.Float32BufferAttribute(other, 3));
    geo.setAttribute("aRand", new THREE.Float32BufferAttribute(rnd, 1));
    geo.setAttribute("aEnd", new THREE.Float32BufferAttribute(end, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: LATTICE_VERT,
      fragmentShader: LATTICE_FRAG,
      uniforms: {
        uBuild: { value: 0 },
        uColor: { value: new THREE.Color(palette.lime) },
        uOpacity: { value: 0.55 },
        uFogNear: { value: 20 },
        uFogFar: { value: 95 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo, mat };
  }, [palette.lime]);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  const ref = useRef<THREE.LineSegments>(null!);
  useFrame(() => {
    const b = latticeBuild(film.sp);
    mat.uniforms.uBuild.value = b;
    mat.uniforms.uFogFar.value = fogFar(film.p);
    if (ref.current) ref.current.visible = b > 0.001;
  }, -1);
  return <lineSegments ref={ref} args={[geo, mat]} frustumCulled={false} />;
}

/* --------------------------------------------------------------------------
   STANZA -> WORMHOLE: tre cilindri wireframe annidati (r 9 / 13.95 / 19.8),
   asse lungo -Z, camera dentro. Deriva 0.055 / -0.03 / 0.014: la shell lontana
   CONTROruota. Niente pavimento: dove starebbe, c'e' la nebbia.
   Nel wormhole (atti 2-3) le shell si TORCONO a elica lungo Z con la velocita'
   della camera (dz/dsp analitica: niente stato), le longitudinali diventano
   eliche; bande luminose scorrono verso la camera (sopra la soglia di bloom);
   un respiro radiale G(t) piccolissimo. Tutto nel vertex shader, funzione di
   (p, t): la geometria non si tocca mai. Il colore e' oro SOLO quando il lime
   non e' in scena.
   -------------------------------------------------------------------------- */
const ROOM = [
  { r: 9, drift: 0.055 },
  { r: 13.95, drift: -0.03 },
  { r: 19.8, drift: 0.014 },
];
const ROOM_Z0 = 8;
const ROOM_Z1 = -262;

const SHELL_VERT = /* glsl */ `
  uniform float uTwist;     // rad per unita' di z, relativo alla camera
  uniform float uCamZ;
  uniform float uBandPhase; // fase delle bande (funzione di camZ)
  uniform float uWorm;      // gate del wormhole 0..1
  uniform float uBreath;    // G(t): respiro radiale
  uniform float uFogNear;
  uniform float uFogFar;
  varying float vBand;
  varying float vFog;
  void main() {
    float dz = position.z - uCamZ;
    float a = uTwist * dz;
    float c = cos(a), s = sin(a);
    vec2 xy = vec2(position.x * c - position.y * s, position.x * s + position.y * c);
    xy *= 1.0 + 0.03 * uWorm * sin(position.z * 0.11 + uBreath);
    vec3 p = vec3(xy, position.z);
    float band = pow(0.5 + 0.5 * sin(position.z * 0.45 + uBandPhase), 14.0);
    vBand = band * uWorm;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vFog = smoothstep(uFogNear, uFogFar, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const SHELL_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vBand;
  varying float vFog;
  void main() {
    // le bande vanno sopra la soglia di bloom (1.15): e' il post a farle brillare
    vec3 col = uColor * (1.0 + 1.6 * vBand);
    gl_FragColor = vec4(col, uOpacity * (1.0 + 1.2 * vBand) * (1.0 - vFog));
  }
`;

function ringsGeometry(r: number) {
  const step = 6;
  const around = 48;
  const longs = 24;
  const pts: number[] = [];
  const n = Math.round((ROOM_Z0 - ROOM_Z1) / step);
  for (let zi = 0; zi <= n; zi++) {
    const z = ROOM_Z0 - zi * step;
    for (let a = 0; a < around; a++) {
      const t0 = (a / around) * Math.PI * 2;
      const t1 = ((a + 1) / around) * Math.PI * 2;
      pts.push(Math.cos(t0) * r, Math.sin(t0) * r, z, Math.cos(t1) * r, Math.sin(t1) * r, z);
    }
    if (zi < n)
      for (let a = 0; a < longs; a++) {
        const t = (a / longs) * Math.PI * 2;
        // le longitudinali sono spezzate in 3 per lasciarsi torcere a elica
        for (let k = 0; k < 3; k++) {
          const za = z - (step * k) / 3;
          const zb = z - (step * (k + 1)) / 3;
          pts.push(Math.cos(t) * r, Math.sin(t) * r, za, Math.cos(t) * r, Math.sin(t) * r, zb);
        }
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

function makeShellMaterial(color: string) {
  return new THREE.ShaderMaterial({
    vertexShader: SHELL_VERT,
    fragmentShader: SHELL_FRAG,
    uniforms: {
      uTwist: { value: 0 },
      uCamZ: { value: 0 },
      uBandPhase: { value: 0 },
      uWorm: { value: 0 },
      uBreath: { value: 0 },
      uFogNear: { value: 18 },
      uFogFar: { value: 95 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0.22 },
    },
    transparent: true,
    depthWrite: false,
  });
}

/* Particelle: segmenti (punto + scia) distribuiti in un cilindro attorno all'asse.
   z = f(camZ, p, t) nel vertex shader: fisse nel mondo piu' una corrente verso
   la camera proporzionale al gate; la SCIA si allunga con la velocita' della
   spina (derivata analitica). Nessuno stato: scrub avanti = scrub indietro. */
const DUST_VERT = /* glsl */ `
  attribute vec3 aSeed;   // z0 (0..span), raggio, angolo
  attribute float aEnd;   // 0 = punto, 1 = coda della scia
  uniform float uCamZ;
  uniform float uSpan;
  uniform float uFollow;  // 1 = ferme nel mondo; >1 = scorrono verso la camera
  uniform float uFlow;    // G(t): deriva lenta
  uniform float uStreak;  // lunghezza della scia (velocita')
  uniform float uFogFar;
  varying float vA;
  void main() {
    float u = mod(aSeed.x + uCamZ * uFollow + uFlow, uSpan);
    float z = uCamZ + 0.12 * uSpan - u + aEnd * uStreak;
    vec3 p = vec3(cos(aSeed.z) * aSeed.y, sin(aSeed.z) * aSeed.y, z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float fog = smoothstep(uFogFar * 0.25, uFogFar, -mv.z);
    float k = u / uSpan;
    vA = smoothstep(0.0, 0.08, k) * (1.0 - smoothstep(0.6, 1.0, k)) * (1.0 - fog) * (1.0 - 0.75 * aEnd);
    gl_Position = projectionMatrix * mv;
  }
`;
const DUST_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vA;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity * vA);
  }
`;
const DUST_SPAN = 120;

function Dust({ palette }: { palette: Palette }) {
  const { geo, mat } = useMemo(() => {
    const n = film.mobile ? DUST_MOBILE : DUST_DESKTOP;
    const seed = new Float32Array(n * 2 * 3);
    const end = new Float32Array(n * 2);
    let s = 23;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    for (let i = 0; i < n; i++) {
      const z0 = rand() * DUST_SPAN;
      const r = 1.5 + Math.sqrt(rand()) * 16.5;
      const th = rand() * Math.PI * 2;
      for (let e = 0; e < 2; e++) {
        const o = (i * 2 + e) * 3;
        seed[o] = z0;
        seed[o + 1] = r;
        seed[o + 2] = th;
        end[i * 2 + e] = e;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 2 * 3), 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
    geo.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      uniforms: {
        uCamZ: { value: 0 },
        uSpan: { value: DUST_SPAN },
        uFollow: { value: 1 },
        uFlow: { value: 0 },
        uStreak: { value: 0 },
        uFogFar: { value: 95 },
        uColor: { value: new THREE.Color(palette.gold) },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo, mat };
  }, [palette.gold]);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  const ref = useRef<THREE.LineSegments>(null!);
  const gold = useMemo(() => new THREE.Color(palette.gold).multiplyScalar(0.9), [palette.gold]);
  const lime = useMemo(() => new THREE.Color(palette.lime).lerp(new THREE.Color(palette.bone), 0.45).multiplyScalar(0.9), [palette.lime, palette.bone]);
  const cam = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);
  useFrame(() => {
    const worm = wormGate(film.sp);
    const on = worm > 0.002;
    if (ref.current) ref.current.visible = on;
    if (!on) return;
    spine(film.sp, cam);
    const speed = speedNorm(film.sp);
    const still = film.reduced || film.paused;
    const u = mat.uniforms;
    u.uCamZ.value = cam.z;
    u.uFollow.value = 1 + 0.8 * worm;
    u.uFlow.value = still ? 0 : -film.t * 0.6;
    u.uStreak.value = film.reduced ? 0 : (0.3 + 9 * speed * speed) * worm;
    u.uFogFar.value = fogFar(film.p);
    u.uOpacity.value = 0.55 * worm;
    // bone/lime nella fase dei fili, oro nella stanza: mai i due insieme
    (u.uColor.value as THREE.Color).copy(gold).lerp(lime, limeInFrame(film.sp));
  }, -1);
  return <lineSegments ref={ref} args={[geo, mat]} frustumCulled={false} />;
}

function Room({ palette }: { palette: Palette }) {
  const group = useRef<THREE.Group>(null!);
  const shells = useMemo(
    () =>
      ROOM.map((s) => ({
        geo: ringsGeometry(s.r),
        mat: makeShellMaterial(palette.gold),
        drift: s.drift,
      })),
    [palette.gold],
  );
  const gold = useMemo(() => new THREE.Color(palette.gold), [palette.gold]);
  const dim = useMemo(() => new THREE.Color(palette.boneDim), [palette.boneDim]);
  const tmp = useMemo(() => new THREE.Color(), []);
  const cam = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);
  useEffect(
    () => () => {
      shells.forEach((s) => {
        s.geo.dispose();
        s.mat.dispose();
      });
    },
    [shells],
  );

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const gate = roomGate(film.sp);
    g.visible = gate > 0.002;
    if (!g.visible) return;
    const lime = limeInFrame(film.sp);
    tmp.copy(gold).lerp(dim, lime);
    const par = film.reduced ? 0 : 1;
    // parallasse dal puntatore (gia' smussato): SOLO posizione
    g.position.set(FIG_C.x + film.mx * 0.8 * par, FIG_C.y + film.my * 0.5 * par, 0);
    spine(film.sp, cam);
    const worm = wormGate(film.sp);
    const speed = speedNorm(film.sp);
    const still = film.reduced || film.paused;
    const fog = fogFar(film.p);
    g.children.forEach((child, i) => {
      if (i >= shells.length) return;
      child.rotation.z = shells[i].drift * film.sp * 40;
      const u = shells[i].mat.uniforms;
      (u.uColor.value as THREE.Color).copy(tmp);
      u.uOpacity.value = 0.22 * gate;
      // torsione: cresce con la velocita', segno alterno per shell (contro-elica)
      u.uTwist.value = film.reduced ? 0 : (i % 2 ? -1 : 1) * 0.022 * worm * (0.25 + 0.75 * speed);
      u.uCamZ.value = cam.z;
      // bande verso la camera: fase = camZ * k (k > 0), 1.3x la velocita' della camera
      u.uBandPhase.value = cam.z * 0.14 + i * 2.1;
      u.uWorm.value = worm;
      u.uBreath.value = still ? 0 : film.t * 0.7;
      u.uFogFar.value = fog;
    });
  }, -1);

  return (
    <group ref={group}>
      {shells.map((s, i) => (
        <lineSegments key={i} args={[s.geo, s.mat]} frustumCulled={false} />
      ))}
      <Dust palette={palette} />
    </group>
  );
}

/* --------------------------------------------------------------------------
   ORIZZONTE: UNA barra sottile, lontana, sopra la soglia di bloom (atto 5).
   E6: una luce la percorre UNA volta all'ingresso dell'atto (funzione di sp,
   finestra 0.04): stesso scroll, stessa fase.
   -------------------------------------------------------------------------- */
const HORIZON_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const HORIZON_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uPulseX;  // -1..1 lungo la barra; fuori = parcheggiata
  uniform float uPulseA;
  varying vec2 vUv;
  void main() {
    float x = vUv.x * 2.0 - 1.0;
    float d = x - uPulseX;
    float pulse = exp(-d * d / 0.004) * uPulseA;
    gl_FragColor = vec4(uColor * (1.0 + 1.4 * pulse), uOpacity);
  }
`;
function Horizon({ palette }: { palette: Palette }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: HORIZON_VERT,
        fragmentShader: HORIZON_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(palette.bone).multiplyScalar(1.6) },
          uOpacity: { value: 0 },
          uPulseX: { value: -2 },
          uPulseA: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      }),
    [palette.bone],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const g = horizonGate(film.sp, film.p);
    mat.uniforms.uOpacity.value = g;
    // la luce corre sulla barra fra sp 0.86 e 0.90: da -0.6 a +0.6 (il resto e' fuori inquadratura)
    const u = (film.sp - 0.86) / 0.04;
    const on = !film.reduced && u > 0 && u < 1;
    mat.uniforms.uPulseX.value = on ? -0.6 + 1.2 * u : -2;
    mat.uniforms.uPulseA.value = on ? Math.sin(Math.PI * u) : 0;
    if (ref.current) ref.current.visible = g > 0.002;
  }, -1);
  return (
    <mesh ref={ref} position={[0, FIG_C.y + 0.6, -200]} material={mat}>
      <planeGeometry args={[320, 0.09]} />
    </mesh>
  );
}

/* --------------------------------------------------------------------------
   I FILI: LineSegments2 (linee grasse, larghezza in pixel, resolution impostata).
   Un solo buffer interlacciato [x1,y1,z1,x2,y2,z2] scritto in place ogni frame,
   mai riallocato. Colore bone sopra soglia; l'impulso lime si MESCOLA (mix),
   non si somma. Blending additivo: il fade per filo vive nei colori dei vertici.
   E1: il campo si piega attorno al puntatore. Ogni vertice, in spazio camera,
   riceve una deflessione TANGENZIALE w*A*perp(d) (le linee CURVANO attorno al
   puntatore, non si aprono a buco), w = smoothstep(R,0,r)^2, R = 22% del lato
   corto dell'inquadratura a quella profondita'. Zero senza puntatore (touch,
   reduced): il termine collassa esattamente a zero. Costo: ~340 vertici x 2
   trasformazioni per frame.
   -------------------------------------------------------------------------- */
function Strands({ palette }: { palette: Palette }) {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const seg = film.mobile ? SEG_MOBILE : SEG_DESKTOP;
  const N = STRANDS.length * seg;
  const { geo, mat } = useMemo(() => {
    const geo = new LineSegmentsGeometry();
    geo.setPositions(new Float32Array(N * 6));
    geo.setColors(new Float32Array(N * 6));
    const mat = new LineMaterial({
      linewidth: 2.4,
      vertexColors: true,
      worldUnits: false,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      fog: true,
    });
    return { geo, mat };
  }, [N]);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  useEffect(() => {
    mat.resolution.set(size.width, size.height);
  }, [mat, size.width, size.height]);

  const bone = useMemo(() => new THREE.Color(palette.bone).multiplyScalar(STRAND_GAIN), [palette.bone]);
  const lime = useMemo(() => new THREE.Color(palette.lime).multiplyScalar(1.7), [palette.lime]);
  const pose = useMemo<Pose>(() => ({ x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, bank: 0 }), []);
  const anchor = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const ref = useRef<LineSegments2>(null!);

  useFrame(() => {
    const posAttr = geo.attributes.instanceStart as THREE.InterleavedBufferAttribute;
    const colAttr = geo.attributes.instanceColorStart as THREE.InterleavedBufferAttribute;
    const P = posAttr.data.array as Float32Array;
    const C = colAttr.data.array as Float32Array;
    const sp = film.sp;
    cameraPose(sp, film.aspect, film.reduced, pose);
    // E1: parametri del puntatore in spazio camera (la camera e' gia' posata: CameraRig ha priorita' -2)
    const bendOn = !film.reduced && film.min > 0.001;
    const tanH = Math.tan((camera.fov * Math.PI) / 360);
    const mx = film.mx;
    const my = film.my;
    let any = false;
    for (let k = 0; k < STRANDS.length; k++) {
      const s = STRANDS[k];
      const t = (sp - s.at) / s.span;
      const base = k * seg * 6;
      if (t <= 0 || t >= 1) {
        // filo spento: collassato e nero (additivo = assente)
        for (let i = 0; i < seg * 6; i++) {
          P[base + i] = 0;
          C[base + i] = 0;
        }
        continue;
      }
      any = true;
      strandAnchor(s, film.aspect, anchor);
      // capo vicino: sotto e a lato della camera, la segue (e' questo che regge l'arco)
      const nx = pose.x + s.side * 0.9;
      const ny = pose.y - 1.1;
      const nz = pose.z - 1.6;
      // FIRE: il capo libero corre fino all'ancora
      const fire = clamp01(t / FIRE_END);
      const fe = 1 - Math.pow(1 - fire, 3);
      const tx = mix(nx, anchor.x, fe);
      const ty = mix(ny, anchor.y, fe);
      const tz = mix(nz, anchor.z, fe);
      // TAUT: sag quasi zero; RELEASE: il sag cresce e un'onda lo percorre; FADE
      const rel = smoothstep(TAUT_END, RELEASE_END, t);
      const sag = 0.05 + 2.6 * rel;
      const wave = 0.55 * Math.sin(Math.PI * clamp01((t - TAUT_END) / (RELEASE_END - TAUT_END)));
      const alpha = smoothstep(0, 0.03, t) * (1 - smoothstep(RELEASE_END, 1, t));
      const impulse = 1 - smoothstep(0.1, 0.24, t);
      // perpendicolare (orizzontale) alla corda, per l'onda
      const dx = tx - nx;
      const dz = tz - nz;
      const dl = Math.hypot(dx, dz) || 1;
      const px = -dz / dl;
      const pz = dx / dl;
      const phase = (t - TAUT_END) * 14;
      for (let i = 0; i < seg; i++) {
        const o = base + i * 6;
        for (let e = 0; e < 2; e++) {
          const u = (i + e) / seg;
          const su = Math.sin(Math.PI * u);
          const w = wave * su * Math.sin(2 * Math.PI * (3 * u - phase));
          let X = mix(nx, tx, u) + px * w;
          let Y = mix(ny, ty, u) - sag * su;
          let Z = mix(nz, tz, u) + pz * w;
          if (bendOn && u > 0.02) {
            // in spazio camera: il puntatore alla profondita' del vertice
            v.set(X, Y, Z).applyMatrix4(camera.matrixWorldInverse);
            const depth = -v.z;
            if (depth > 0.5) {
              const hh = depth * tanH;
              const hw = hh * film.aspect;
              const ddx = v.x - mx * hw;
              const ddy = v.y + my * hh;
              const r = Math.hypot(ddx, ddy) || 1e-6;
              const R = 0.44 * Math.min(hw, hh);
              const wgt = smoothstep(R, 0, r);
              if (wgt > 0) {
                const A = 0.06 * hh * wgt * wgt * film.min * su;
                v.x += (-ddy / r) * A;
                v.y += (ddx / r) * A;
                v.applyMatrix4(camera.matrixWorld);
                X = v.x;
                Y = v.y;
                Z = v.z;
              }
            }
          }
          P[o + e * 3] = X;
          P[o + e * 3 + 1] = Y;
          P[o + e * 3 + 2] = Z;
          // impulso lime al capo che spara: MIX verso il lime, poi il fade nei colori
          const spot = Math.exp(-Math.pow((1 - u) * 4.5, 2)) * impulse;
          C[o + e * 3] = mix(bone.r, lime.r, spot) * alpha;
          C[o + e * 3 + 1] = mix(bone.g, lime.g, spot) * alpha;
          C[o + e * 3 + 2] = mix(bone.b, lime.b, spot) * alpha;
        }
      }
    }
    posAttr.data.needsUpdate = true;
    colAttr.data.needsUpdate = true;
    if (ref.current) ref.current.visible = any;
  }, -1);

  const line = useMemo(() => new LineSegments2(geo, mat), [geo, mat]);
  return <primitive object={line} ref={ref} frustumCulled={false} />;
}

/* --------------------------------------------------------------------------
   CAMERA: posa pura da state.ts; bank ruotando l'UP VECTOR attorno all'asse di
   vista (Rodrigues), mai un roll pieno; rotation.order 'YXZ'; nebbia che si
   apre nel wormhole e si chiude per il wipe. Aggiorna le matrici subito, cosi'
   i useFrame successivi (i fili, E1) vedono la posa di QUESTO frame.
   -------------------------------------------------------------------------- */
function CameraRig() {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const pose = useMemo<Pose>(() => ({ x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, bank: 0 }), []);
  const d = useMemo(() => new THREE.Vector3(), []);
  const up0 = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const cross = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    camera.rotation.order = "YXZ";
  }, [camera]);
  useFrame(() => {
    cameraPose(film.sp, film.aspect, film.reduced, pose);
    camera.position.set(pose.x, pose.y, pose.z);
    target.set(pose.tx, pose.ty, pose.tz);
    d.subVectors(target, camera.position).normalize();
    up0.set(0, 1, 0);
    if (Math.abs(d.dot(up0)) > 0.985) up0.set(0, 0, -1); // caso quasi verticale
    // Rodrigues: up' = up cos + (d x up) sin + d (d . up)(1 - cos)
    const c = Math.cos(pose.bank);
    const s = Math.sin(pose.bank);
    cross.crossVectors(d, up0);
    up.copy(up0)
      .multiplyScalar(c)
      .addScaledVector(cross, s)
      .addScaledVector(d, d.dot(up0) * (1 - c));
    camera.up.copy(up);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.far = fogFar(film.p);
      fog.near = Math.min(18, fog.far * 0.5);
    }
  }, -2);
  return null;
}

/* --------------------------------------------------------------------------
   POST CHAIN: bloom -> lente/frangia/smear -> vignette -> OutputPass (tone map) -> grana.
   La grana DOPO il tone map, in spazio display. Vignette darkness 1.0 e NON
   di piu' (sopra, prima del tone map su target float, i canali negativi
   tornano positivi per canale e gli angoli virano). Falloff con offset 1.3.
   LENTE (wormhole, E7): warp UV verso il centro (gaussiana, la luce si piega),
   frangia RGB radiale e smear radiale a 5 tap, tutti funzione di p SOLO nel
   picco di velocita'; a riposo il pass e' DISABILITATO (zero costo).
   -------------------------------------------------------------------------- */
const LENS = {
  uniforms: {
    tDiffuse: { value: null },
    uWarp: { value: 0 },
    uFringe: { value: 0 },
    uSmear: { value: 0 },
    uAspect: { value: 1.6 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uWarp;
    uniform float uFringe;
    uniform float uSmear;
    uniform float uAspect;
    varying vec2 vUv;
    void main() {
      vec2 c = vec2(0.5, 0.5);
      vec2 d = vUv - c;
      vec2 da = vec2(d.x * uAspect, d.y);
      float r = length(da);
      // lente: il centro si ingrandisce (si campiona piu' vicino al centro)
      float g = exp(-r * r / 0.18);
      vec2 uv = c + d * (1.0 - uWarp * g);
      vec3 acc = vec3(0.0);
      float wsum = 0.0;
      for (int i = -2; i <= 2; i++) {
        float fi = float(i);
        vec2 off = d * (fi * uSmear * 0.014 * r);
        float k = uFringe * r * 0.02;
        float w = 1.0 - 0.3 * abs(fi);
        acc.r += texture2D(tDiffuse, uv + off + d * k).r * w;
        acc.g += texture2D(tDiffuse, uv + off).g * w;
        acc.b += texture2D(tDiffuse, uv + off - d * k).b * w;
        wsum += w;
      }
      gl_FragColor = vec4(acc / wsum, 1.0);
    }
  `,
};
const GRAIN = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, amount: { value: 0.045 }, res: { value: new THREE.Vector2(1, 1) } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    uniform vec2 res;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float n = hash(vUv * res + fract(time) * 100.0) - 0.5;
      gl_FragColor = vec4(c.rgb + n * amount, c.a);
    }
  `,
};

function Post() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const chain = useMemo(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.55, 0.45, 1.15);
    (bloom.highPassUniforms as Record<string, THREE.IUniform>).smoothWidth.value = 0.35;
    composer.addPass(bloom);
    const lens = new ShaderPass(LENS);
    lens.enabled = false;
    composer.addPass(lens);
    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms.offset.value = 1.3;
    vignette.uniforms.darkness.value = 1.0;
    composer.addPass(vignette);
    composer.addPass(new OutputPass());
    const grain = new ShaderPass(GRAIN);
    composer.addPass(grain);
    return { composer, bloom, lens, grain };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);
  useEffect(() => {
    chain.composer.setPixelRatio(dpr);
    chain.composer.setSize(size.width, size.height);
    chain.bloom.setSize(size.width, size.height);
    chain.grain.uniforms.res.value.set(size.width * dpr, size.height * dpr);
    chain.lens.uniforms.uAspect.value = size.width / Math.max(1, size.height);
  }, [chain, size.width, size.height, dpr]);
  useEffect(() => () => chain.composer.dispose(), [chain]);
  useFrame(() => {
    // grana ferma con meno movimento o in pausa; altrimenti vive di tempo
    chain.grain.uniforms.time.value = film.reduced || film.paused ? 0.37 : film.t;
    // lente: funzione di sp; frangia e smear solo nel picco di velocita', mai su reduced
    const lensA = film.reduced ? 0 : lensAmount(film.sp);
    const fr = film.reduced ? 0 : fringeAmount(film.sp);
    const on = lensA > 0.002 || fr > 0.002;
    chain.lens.enabled = on;
    if (on) {
      chain.lens.uniforms.uWarp.value = 0.14 * lensA;
      chain.lens.uniforms.uFringe.value = fr;
      chain.lens.uniforms.uSmear.value = fr;
    }
    chain.composer.render();
  }, 1);
  return null;
}

/* -------------------------------------------------------------------------- */
export default function FilmCanvas({ palette, onReady }: { palette: Palette; onReady?: () => void }) {
  const portrait = film.aspect < 0.75;
  return (
    <Canvas
      dpr={[1, film.mobile ? 1 : 1.5]}
      camera={{ fov: portrait ? 64 : 50, near: 0.1, far: 400, position: [0, 9, 34] }}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" }}
      frameloop="always"
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.setClearColor(new THREE.Color(palette.field), 1);
        onReady?.();
      }}
    >
      <color attach="background" args={[palette.field]} />
      <fog attach="fog" args={[palette.field, 18, 95]} />
      <CameraRig />
      <Figure />
      <Lattice palette={palette} />
      <Room palette={palette} />
      <Strands palette={palette} />
      <Horizon palette={palette} />
      <Post />
    </Canvas>
  );
}
