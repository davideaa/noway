"use client";

/**
 * FLUIDO AL MOUSE (/dettagli). Davide ha chiesto l'effetto dell'hero di
 * shaders.com: il puntatore mescola un fluido morbido, lucido, che poi si
 * dissolve. Qui e' scritto da zero, nei colori del sito (lime, verde, oro).
 *
 * Come funziona: simulazione di fluido incomprimibile a griglia ("stable
 * fluids") in WebGL2, tutta su GPU.
 *   velocita' (RG) e colore (RGBA) si trasportano da soli lungo la velocita'
 *   (advection); i vortici si rinforzano (vorticity confinement); la pressione
 *   si risolve con 20 iterazioni di Jacobi e si toglie dal campo, cosi' il
 *   fluido non si comprime. Ogni movimento del mouse aggiunge una "spinta" e
 *   una macchia di colore gaussiana nel punto del puntatore.
 *   A schermo: il colore, con un'ombreggiatura presa dal gradiente di
 *   luminosita' (da' il volume) e un riflesso speculare (la lucentezza).
 *
 * Costi e limiti:
 *   - solo puntatore fine (mouse/penna): su telefono non c'e' mouse, e dopo i
 *     crash di Safari su /dettagli la pagina resta senza WebGL su touch;
 *   - mai con meno movimento, mai in pausa ("Pausa animazione"), mai sui
 *     dispositivi deboli (MotionPrefs.lite);
 *   - griglia 128 (velocita') e 512 (colore) sul lato corto: il morbido del
 *     riferimento viene proprio dalla bassa risoluzione filtrata;
 *   - il ciclo si FERMA 5 s dopo l'ultimo movimento (niente GPU a vuoto) e
 *     riparte al primo movimento; si ferma anche a scheda nascosta.
 * La tela sta dietro a tutto (z-index -1, fissa): i testi restano sopra.
 */
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useMotionPrefs } from "./MotionPrefs";

/* ---------------- parametri (da tarare a occhio) ---------------- */
const SIM_RES = 128;
const DYE_RES = 256;
const PRESSURE_ITER = 20;
const PRESSURE_KEEP = 0.8;
const CURL = 4;
/** dissipazione per secondo: il colore svanisce in ~3 s, il moto un po' prima */
const VEL_DISS = 0.5;
const DYE_DISS = 1.1;
/** raggio della macchia (in unita' uv^2 dell'altezza): grande = morbido come nel riferimento */
const SPLAT_RADIUS = 0.018;
const SPLAT_FORCE = 4200;
/** colore aggiunto per movimento: il fluido si accumula dove il mouse insiste */
const DYE_AMOUNT = 0.32;
/**
 * Luminosita' massima a schermo: piena nell'intestazione (come nel riferimento),
 * piu' tenue scendendo nella pagina, dove ci sono testi e tabelle da leggere.
 */
const GAIN_TOP = 0.92;
const GAIN_READ = 0.45;
/** stop del ciclo dopo l'ultimo movimento */
const IDLE_MS = 5000;
/** risoluzione della tela rispetto ai pixel CSS: il contenuto e' morbido, basta meno */
const CANVAS_SCALE = 0.75;

/**
 * Tavolozza del sito, lungo la quale il colore scorre man mano che il mouse si
 * muove: la scia diventa una sfumatura, come quella viola-blu del riferimento.
 * Verde -> lime (--acc) -> lime chiaro -> oro (--st-oro). Niente verdi scuri:
 * mescolati facevano "marmo" fangoso.
 */
const PALETTE: [number, number, number][] = [
  [0x6f / 255, 0xc0 / 255, 0x3a / 255],
  [0xc8 / 255, 0xfa / 255, 0x72 / 255],
  [0xee / 255, 0xff / 255, 0xb0 / 255],
  [0xe5 / 255, 0xb9 / 255, 0x66 / 255],
];
function paletteAt(t: number, out: [number, number, number]) {
  // andata e ritorno lungo la tavolozza (niente salto oro -> verde scuro)
  const u = 1 - Math.abs(((t % 2) + 2) % 2 - 1); // 0..1..0
  const x = u * (PALETTE.length - 1);
  const i = Math.min(PALETTE.length - 2, Math.floor(x));
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  for (let k = 0; k < 3; k++) out[k] = PALETTE[i][k] + (PALETTE[i + 1][k] - PALETTE[i][k]) * s;
  return out;
}

/* ---------------- shader ---------------- */
const VERT = `#version 300 es
precision highp float;
in vec2 aPos;
uniform vec2 uTexel;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;
const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
`;
const FRAG_SPLAT =
  HEAD +
  `uniform sampler2D uTarget; uniform float uAspect; uniform vec3 uColor; uniform vec2 uPoint; uniform float uRadius;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 s = exp(-dot(p, p) / uRadius) * uColor;
  o = vec4(texture(uTarget, vUv).xyz + s, 1.0);
}`;
const FRAG_ADVECT =
  HEAD +
  `uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 uSimTexel; uniform float uDt; uniform float uDiss;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uSimTexel;
  o = texture(uSource, coord) / (1.0 + uDiss * uDt);
}`;
const FRAG_CURL =
  HEAD +
  `uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;
const FRAG_VORTICITY =
  HEAD +
  `uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float uCurlK; uniform float uDt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f /= length(f) + 0.0001;
  f *= uCurlK * C;
  f.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + f * uDt;
  o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`;
const FRAG_DIVERGENCE =
  HEAD +
  `uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;
const FRAG_SCALE =
  HEAD +
  `uniform sampler2D uTex; uniform float uValue;
void main() { o = uValue * texture(uTex, vUv); }`;
const FRAG_PRESSURE =
  HEAD +
  `uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float d = texture(uDivergence, vUv).x;
  o = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
}`;
const FRAG_GRADIENT =
  HEAD +
  `uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  o = vec4(v, 0.0, 1.0);
}`;
/* A schermo: saturazione morbida, volume dal gradiente di luminosita', riflesso lucido. */
const FRAG_DISPLAY =
  HEAD +
  `uniform sampler2D uDye; uniform vec2 uTexel; uniform float uGain;
void main() {
  vec3 c = texture(uDye, vUv).rgb;
  // vicini a 2,5 texel: il rilievo segue le forme grandi, non il rumore fine
  vec2 ox = vec2(uTexel.x * 2.5, 0.0);
  vec2 oy = vec2(0.0, uTexel.y * 2.5);
  float lL = length(texture(uDye, vUv - ox).rgb);
  float lR = length(texture(uDye, vUv + ox).rgb);
  float lT = length(texture(uDye, vUv + oy).rgb);
  float lB = length(texture(uDye, vUv - oy).rgb);
  vec3 n = normalize(vec3(lR - lL, lT - lB, length(uTexel) * 14.0));
  float diffuse = clamp(dot(n, vec3(0.0, 0.0, 1.0)) + 0.72, 0.72, 1.0);
  vec3 h = normalize(normalize(vec3(-0.35, 0.55, 0.75)) + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, h), 0.0), 36.0);
  // saturazione morbida SUL MASSIMO, non per canale: il lime resta lime anche pieno
  // (per canale i colori forti sbiadivano verso il bianco, i deboli verso l'oliva)
  float m = max(c.r, max(c.g, c.b));
  c *= (1.0 - exp(-m * 1.8)) / max(m, 1e-4);
  float a = max(c.r, max(c.g, c.b));
  c = c * diffuse + spec * 0.45 * a * vec3(1.0, 1.0, 0.92);
  a = max(a, max(c.r, max(c.g, c.b)));
  o = vec4(min(c, vec3(a)) * uGain, a * uGain);
}`;

/* ---------------- WebGL: programmi e framebuffer ---------------- */
type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
type FBO = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number; tx: number; ty: number };
type DFBO = { read: FBO; write: FBO; swap: () => void; w: number; h: number; tx: number; ty: number };

function makeFluid(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;
  if (!gl.getExtension("EXT_color_buffer_float")) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const program = (frag: string, names: string[]): Prog => {
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
    const u: Prog["u"] = {};
    for (const n of ["uTexel", ...names]) u[n] = gl.getUniformLocation(p, n);
    return { p, u };
  };
  const P = {
    splat: program(FRAG_SPLAT, ["uTarget", "uAspect", "uColor", "uPoint", "uRadius"]),
    advect: program(FRAG_ADVECT, ["uVelocity", "uSource", "uSimTexel", "uDt", "uDiss"]),
    curl: program(FRAG_CURL, ["uVelocity"]),
    vort: program(FRAG_VORTICITY, ["uVelocity", "uCurl", "uCurlK", "uDt"]),
    div: program(FRAG_DIVERGENCE, ["uVelocity"]),
    scale: program(FRAG_SCALE, ["uTex", "uValue"]),
    press: program(FRAG_PRESSURE, ["uPressure", "uDivergence"]),
    grad: program(FRAG_GRADIENT, ["uPressure", "uVelocity"]),
    show: program(FRAG_DISPLAY, ["uDye", "uGain"]),
  };

  // quad a schermo intero
  const vb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const fbo = (w: number, h: number, internal: number, format: number, filter: number): FBO => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("fbo");
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb, w, h, tx: 1 / w, ty: 1 / h };
  };
  const dfbo = (w: number, h: number, internal: number, format: number, filter: number): DFBO => {
    const d: DFBO = {
      read: fbo(w, h, internal, format, filter),
      write: fbo(w, h, internal, format, filter),
      swap: () => {
        const t = d.read;
        d.read = d.write;
        d.write = t;
      },
      w,
      h,
      tx: 1 / w,
      ty: 1 / h,
    };
    return d;
  };
  const freeFbo = (f: FBO) => {
    gl.deleteTexture(f.tex);
    gl.deleteFramebuffer(f.fb);
  };

  const res = (base: number) => {
    const a = gl.drawingBufferWidth / Math.max(1, gl.drawingBufferHeight);
    return a >= 1 ? { w: Math.round(base * a), h: base } : { w: base, h: Math.round(base / a) };
  };

  let vel: DFBO, dye: DFBO, press: DFBO, div: FBO, curl: FBO;
  const alloc = () => {
    const s = res(SIM_RES);
    const d = res(DYE_RES);
    vel = dfbo(s.w, s.h, gl.RG16F, gl.RG, gl.LINEAR);
    dye = dfbo(d.w, d.h, gl.RGBA16F, gl.RGBA, gl.LINEAR);
    press = dfbo(s.w, s.h, gl.R16F, gl.RED, gl.NEAREST);
    div = fbo(s.w, s.h, gl.R16F, gl.RED, gl.NEAREST);
    curl = fbo(s.w, s.h, gl.R16F, gl.RED, gl.NEAREST);
  };
  const free = () => {
    for (const d of [vel, dye, press]) {
      if (!d) continue;
      freeFbo(d.read);
      freeFbo(d.write);
    }
    for (const f of [div, curl]) if (f) freeFbo(f);
  };
  alloc();

  const tex = (unit: number, t: WebGLTexture) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    return unit;
  };
  const bind = (pr: Prog, tx: number, ty: number) => {
    gl.useProgram(pr.p);
    gl.uniform2f(pr.u.uTexel, tx, ty);
  };
  const draw = (target: FBO | null) => {
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const aspect = () => gl.drawingBufferWidth / Math.max(1, gl.drawingBufferHeight);

  /** una spinta + una macchia di colore nel punto (x, y in 0..1, y verso l'alto) */
  const splat = (x: number, y: number, dx: number, dy: number, color: [number, number, number]) => {
    gl.disable(gl.BLEND);
    bind(P.splat, vel.tx, vel.ty);
    gl.uniform1i(P.splat.u.uTarget, tex(0, vel.read.tex));
    gl.uniform1f(P.splat.u.uAspect, aspect());
    gl.uniform2f(P.splat.u.uPoint, x, y);
    gl.uniform3f(P.splat.u.uColor, dx, dy, 0);
    gl.uniform1f(P.splat.u.uRadius, SPLAT_RADIUS * (aspect() > 1 ? aspect() : 1));
    draw(vel.write);
    vel.swap();
    bind(P.splat, dye.tx, dye.ty);
    gl.uniform1i(P.splat.u.uTarget, tex(0, dye.read.tex));
    gl.uniform3f(P.splat.u.uColor, color[0], color[1], color[2]);
    draw(dye.write);
    dye.swap();
  };

  const step = (dt: number) => {
    gl.disable(gl.BLEND);
    bind(P.curl, vel.tx, vel.ty);
    gl.uniform1i(P.curl.u.uVelocity, tex(0, vel.read.tex));
    draw(curl);

    bind(P.vort, vel.tx, vel.ty);
    gl.uniform1i(P.vort.u.uVelocity, tex(0, vel.read.tex));
    gl.uniform1i(P.vort.u.uCurl, tex(1, curl.tex));
    gl.uniform1f(P.vort.u.uCurlK, CURL);
    gl.uniform1f(P.vort.u.uDt, dt);
    draw(vel.write);
    vel.swap();

    bind(P.div, vel.tx, vel.ty);
    gl.uniform1i(P.div.u.uVelocity, tex(0, vel.read.tex));
    draw(div);

    bind(P.scale, vel.tx, vel.ty);
    gl.uniform1i(P.scale.u.uTex, tex(0, press.read.tex));
    gl.uniform1f(P.scale.u.uValue, PRESSURE_KEEP);
    draw(press.write);
    press.swap();

    bind(P.press, vel.tx, vel.ty);
    gl.uniform1i(P.press.u.uDivergence, tex(0, div.tex));
    for (let i = 0; i < PRESSURE_ITER; i++) {
      gl.uniform1i(P.press.u.uPressure, tex(1, press.read.tex));
      draw(press.write);
      press.swap();
    }

    bind(P.grad, vel.tx, vel.ty);
    gl.uniform1i(P.grad.u.uPressure, tex(0, press.read.tex));
    gl.uniform1i(P.grad.u.uVelocity, tex(1, vel.read.tex));
    draw(vel.write);
    vel.swap();

    bind(P.advect, vel.tx, vel.ty);
    gl.uniform2f(P.advect.u.uSimTexel, vel.tx, vel.ty);
    gl.uniform1f(P.advect.u.uDt, dt);
    gl.uniform1i(P.advect.u.uVelocity, tex(0, vel.read.tex));
    gl.uniform1i(P.advect.u.uSource, tex(0, vel.read.tex));
    gl.uniform1f(P.advect.u.uDiss, VEL_DISS);
    draw(vel.write);
    vel.swap();

    bind(P.advect, dye.tx, dye.ty);
    gl.uniform2f(P.advect.u.uSimTexel, vel.tx, vel.ty);
    gl.uniform1i(P.advect.u.uVelocity, tex(0, vel.read.tex));
    gl.uniform1i(P.advect.u.uSource, tex(1, dye.read.tex));
    gl.uniform1f(P.advect.u.uDiss, DYE_DISS);
    draw(dye.write);
    dye.swap();
  };

  const render = (gain: number) => {
    bind(P.show, dye.tx, dye.ty);
    gl.uniform1i(P.show.u.uDye, tex(0, dye.read.tex));
    gl.uniform1f(P.show.u.uGain, gain);
    draw(null);
  };

  const clearScreen = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  /** nuova dimensione della tela: si ricrea tutto (il fluido in corso si perde) */
  const resize = () => {
    free();
    alloc();
  };

  const destroy = () => {
    free();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };

  return { splat, step, render, clearScreen, resize, destroy, aspect };
}

/* ---------------- componente ---------------- */
function subscribeFine(cb: () => void) {
  const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getFine = () => window.matchMedia("(pointer: fine) and (hover: hover)").matches;
const getFineServer = () => false;

export function FluidCursor() {
  const { reduced, paused, lite } = useMotionPrefs();
  const fine = useSyncExternalStore(subscribeFine, getFine, getFineServer);
  const on = fine && !reduced && !paused && !lite;
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!on || !canvas) return;

    const size = () => {
      canvas.width = Math.max(1, Math.round(window.innerWidth * CANVAS_SCALE));
      canvas.height = Math.max(1, Math.round(window.innerHeight * CANVAS_SCALE));
    };
    size();
    let fluid: ReturnType<typeof makeFluid> = null;
    try {
      fluid = makeFluid(canvas);
    } catch {
      fluid = null;
    }
    if (!fluid) return;
    const F = fluid;

    let raf = 0;
    let running = false;
    let last = 0;
    let lastInput = performance.now();
    let hue = Math.random() * 2;
    const col: [number, number, number] = [0, 0, 0];
    const ptr = { x: -1, y: -1, has: false };
    const queue: { x: number; y: number; dx: number; dy: number; c: [number, number, number] }[] = [];

    const frame = (now: number) => {
      const dt = Math.min(1 / 30, last ? (now - last) / 1000 : 1 / 60);
      last = now;
      while (queue.length) {
        const s = queue.shift()!;
        F.splat(s.x, s.y, s.dx, s.dy, s.c);
      }
      F.step(dt);
      // piena nell'intestazione, piu' tenue dove si legge
      const k = Math.min(1, Math.max(0, (window.scrollY - window.innerHeight * 0.3) / (window.innerHeight * 0.7)));
      F.render(GAIN_TOP + (GAIN_READ - GAIN_TOP) * k * k * (3 - 2 * k));
      if (now - lastInput > IDLE_MS) {
        running = false;
        F.clearScreen();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      lastInput = performance.now();
      if (running || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const x = e.clientX / window.innerWidth;
      const y = 1 - e.clientY / window.innerHeight;
      if (!ptr.has) {
        ptr.x = x;
        ptr.y = y;
        ptr.has = true;
        return;
      }
      let dx = x - ptr.x;
      let dy = y - ptr.y;
      ptr.x = x;
      ptr.y = y;
      if (dx === 0 && dy === 0) return;
      const a = F.aspect();
      if (a < 1) dx *= a;
      if (a > 1) dy /= a;
      // il colore scorre lungo la tavolozza con la strada fatta: la scia e' una sfumatura
      hue += Math.hypot(dx, dy) * 1.2;
      paletteAt(hue, col);
      queue.push({ x, y, dx: dx * SPLAT_FORCE, dy: dy * SPLAT_FORCE, c: [col[0] * DYE_AMOUNT, col[1] * DYE_AMOUNT, col[2] * DYE_AMOUNT] });
      wake();
    };
    const onLeave = () => {
      ptr.has = false;
    };
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
      }
    };
    let resizeT = 0;
    const onResize = () => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(() => {
        size();
        F.resize();
        F.clearScreen();
      }, 200);
    };

    // all'arrivo, se si e' in cima alla pagina: una prima macchia a destra del titolo,
    // cosi' l'effetto si vede prima ancora di muovere il mouse (poi svanisce da solo)
    if (window.scrollY < window.innerHeight * 0.5) {
      for (let i = 0; i < 5; i++) {
        const ang = Math.random() * Math.PI * 2;
        paletteAt(i * 0.35 + 0.4, col);
        queue.push({
          x: 0.62 + Math.random() * 0.25,
          y: 0.55 + Math.random() * 0.3,
          dx: Math.cos(ang) * 900,
          dy: Math.sin(ang) * 900,
          c: [col[0] * 0.5, col[1] * 0.5, col[2] * 0.5],
        });
      }
      wake();
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeT);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      F.destroy();
    };
  }, [on]);

  if (!on) return null;
  return <canvas ref={ref} className="fluid-cursor" aria-hidden="true" />;
}
