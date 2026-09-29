"use client";

/**
 * UN canvas, UNA scena, sei atti. Ogni useFrame legge `film` (state.ts) e scrive
 * la scena come funzione pura di p: niente state, niente molle. L'ordine dei
 * useFrame e' per priorita' (negativa = prima), il post chain ha priorita' 1 e
 * disegna lui (R3F non disegna piu' da solo).
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
  horizonGate,
  latticeBuild,
  limeInFrame,
  mix,
  roomGate,
  smoothstep,
  strandAnchor,
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
/** Guadagno del bone dei fili: sopra la soglia di bloom (1.15) in spazio lineare. */
const STRAND_GAIN = 1.5;
const LIME_HUE = 82 / 360;

/* --------------------------------------------------------------------------
   FIGURA: nuvola di perle istanziate, ombreggiatura bake in instanceColor
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
    // idle: float di tutta la figura (solo tempo, mai la camera) + tilt dal cursore
    const floatY = still ? 0 : Math.sin(film.t * 0.6) * 0.22;
    const tiltX = film.reduced ? 0 : -film.my * 0.12;
    const tiltY = film.reduced ? 0 : film.mx * 0.18;
    const s = 1 + (1 - g) * 0.3; // passando attraverso, si apre
    rot.set(tiltX, tiltY, 0);
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
   STANZA: tre cilindri wireframe annidati (r 9 / 13.95 / 19.8), asse lungo -Z,
   camera dentro. Deriva 0.055 / -0.03 / 0.014: la shell lontana CONTROruota,
   altrimenti le tre si leggono come un solo tubo. Niente pavimento: dove
   starebbe, c'e' la nebbia. Il colore e' oro SOLO quando il lime non e' in scena.
   -------------------------------------------------------------------------- */
const ROOM = [
  { r: 9, drift: 0.055 },
  { r: 13.95, drift: -0.03 },
  { r: 19.8, drift: 0.014 },
];
const ROOM_Z0 = 8;
const ROOM_Z1 = -262;

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
        pts.push(Math.cos(t) * r, Math.sin(t) * r, z, Math.cos(t) * r, Math.sin(t) * r, z - step);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

function Room({ palette }: { palette: Palette }) {
  const group = useRef<THREE.Group>(null!);
  const shells = useMemo(
    () =>
      ROOM.map((s) => ({
        geo: ringsGeometry(s.r),
        mat: new THREE.LineBasicMaterial({ color: palette.gold, transparent: true, opacity: 0.22, depthWrite: false, fog: true }),
        drift: s.drift,
      })),
    [palette.gold],
  );
  const gold = useMemo(() => new THREE.Color(palette.gold), [palette.gold]);
  const dim = useMemo(() => new THREE.Color(palette.boneDim), [palette.boneDim]);
  const tmp = useMemo(() => new THREE.Color(), []);
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
    // parallasse dal mouse: SOLO posizione
    g.position.set(FIG_C.x + film.mx * 0.8 * par, FIG_C.y + film.my * 0.5 * par, 0);
    g.children.forEach((child, i) => {
      child.rotation.z = shells[i].drift * film.sp * 40;
      const m = shells[i].mat;
      m.color.copy(tmp);
      m.opacity = 0.22 * gate;
    });
  }, -1);

  return (
    <group ref={group}>
      {shells.map((s, i) => (
        <lineSegments key={i} args={[s.geo, s.mat]} frustumCulled={false} />
      ))}
    </group>
  );
}

/* --------------------------------------------------------------------------
   ORIZZONTE: UNA barra sottile, lontana, sopra la soglia di bloom (atto 5).
   -------------------------------------------------------------------------- */
function Horizon({ palette }: { palette: Palette }) {
  const mat = useMemo(() => {
    const c = new THREE.Color(palette.bone).multiplyScalar(1.6);
    return new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, fog: false, depthWrite: false, toneMapped: true });
  }, [palette.bone]);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const g = horizonGate(film.sp, film.p);
    mat.opacity = g;
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
   -------------------------------------------------------------------------- */
function Strands({ palette }: { palette: Palette }) {
  const size = useThree((s) => s.size);
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
  const ref = useRef<LineSegments2>(null!);

  useFrame(() => {
    const posAttr = geo.attributes.instanceStart as THREE.InterleavedBufferAttribute;
    const colAttr = geo.attributes.instanceColorStart as THREE.InterleavedBufferAttribute;
    const P = posAttr.data.array as Float32Array;
    const C = colAttr.data.array as Float32Array;
    const sp = film.sp;
    cameraPose(sp, film.aspect, film.reduced, pose);
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
          P[o + e * 3] = mix(nx, tx, u) + px * w;
          P[o + e * 3 + 1] = mix(ny, ty, u) - sag * su;
          P[o + e * 3 + 2] = mix(nz, tz, u) + pz * w;
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
   chiude per il wipe.
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
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.far = fogFar(film.p);
      fog.near = Math.min(fog.near, fog.far * 0.5);
    }
  }, -2);
  return null;
}

/* --------------------------------------------------------------------------
   POST CHAIN: bloom -> vignette -> OutputPass (tone map) -> grana.
   La grana DOPO il tone map, in spazio display. Vignette darkness 1.0 e NON
   di piu' (sopra, prima del tone map su target float, i canali negativi
   tornano positivi per canale e gli angoli virano). Falloff con offset 1.3.
   -------------------------------------------------------------------------- */
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
    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms.offset.value = 1.3;
    vignette.uniforms.darkness.value = 1.0;
    composer.addPass(vignette);
    composer.addPass(new OutputPass());
    const grain = new ShaderPass(GRAIN);
    composer.addPass(grain);
    return { composer, bloom, grain };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);
  useEffect(() => {
    chain.composer.setPixelRatio(dpr);
    chain.composer.setSize(size.width, size.height);
    chain.bloom.setSize(size.width, size.height);
    chain.grain.uniforms.res.value.set(size.width * dpr, size.height * dpr);
  }, [chain, size.width, size.height, dpr]);
  useEffect(() => () => chain.composer.dispose(), [chain]);
  useFrame(() => {
    // grana ferma con meno movimento o in pausa; altrimenti vive di tempo
    chain.grain.uniforms.time.value = film.reduced || film.paused ? 0.37 : film.t;
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
