/**
 * La figura del film: le SIMULAZIONI MONTE CARLO del portafoglio, come
 * ventaglio di perle in 3D. Curva 0 = somma cumulata in R del portafoglio
 * (la mediana, luminosa, al centro); curve 1..N = bootstrap a blocchi
 * (tools/montecarlo.py, stesso metodo), piu' sottili e piu' scure quanto piu'
 * stanno lontane dalla mediana. Tutte partono dallo STESSO punto e si aprono.
 * Dati precalcolati in plate-data.ts (scripts/plate.py): solo la FORMA,
 * nessun numero.
 *
 * Niente canvas: le perle si distribuiscono direttamente lungo le curve
 * (tubo sottile attorno alla polilinea), cosi' ogni perla sa a quale
 * traiettoria appartiene (k) e a che punto del percorso sta (u): e' quello che
 * permette il flusso G(t) lungo le traiettorie e l'accensione della piu'
 * vicina al puntatore H(m), tutto nel vertex shader (FilmCanvas: Figure).
 *
 * Colore e ombreggiatura sono bake UNA volta, mai per frame: la normale di
 * forma e' l'offset della perla dall'ASSE DELLA PROPRIA TRAIETTORIA (il tubo),
 * mai dall'origine del mondo, altrimenti la nuvola si appiattisce.
 */
import { PLATE_CURVES, PLATE_POINTS } from "./plate-data";

export type Fan = {
  count: number;
  /** numero di curve usate (mediana inclusa) */
  curves: number;
  /** xyz per perla, coordinate locali della figura (centro in 0) */
  pos: Float32Array;
  /** per perla: k (indice curva), u (0..1 lungo la traiettoria), seme, scala */
  info: Float32Array;
  /** rgb LINEARE per perla, gia' con la luce */
  col: Float32Array;
  /** y della mediana allo stesso u (per aprire il ventaglio attorno a lei) */
  med: Float32Array;
  /** campioni per curva (SAMPLES x xyz locali): la CPU li proietta per trovare la curva sotto il puntatore */
  samples: Float32Array;
};

export const FAN_SAMPLES = 10;

/** PRNG deterministico: due caricamenti danno la stessa figura. */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hue2rgb(p: number, q: number, t: number) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

/** h in gradi, s e l 0..1 -> sRGB 0..1 */
function hslToRgb(hDeg: number, s: number, l: number): [number, number, number] {
  const h = (((hDeg % 360) + 360) % 360) / 360;
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

const srgbToLinear = (c: number) => (c < 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

const decode = (row: string) => row.split(",").map((v) => Number(v) / 4095);

/**
 * Costruisce il ventaglio dentro un riquadro `width` x `height` x `depth`
 * (unita' mondo) centrato sull'origine, con `count` perle su `curves` curve
 * (mediana + le prime curves-1 del bootstrap). Le tinte del fascio stanno fra
 * 70 e 110 gradi (lime e dintorni: coerenti con l'accento della figura), la
 * mediana ha un cuore quasi bianco (la speculare) e un mantello lime chiaro.
 */
export function buildFan(count: number, curves: number, width: number, height: number, depth: number, seed = 7): Fan {
  const all = PLATE_CURVES.map(decode);
  const K = Math.max(2, Math.min(curves, all.length));
  const rand = mulberry(seed);
  const median = all[0];
  const N = PLATE_POINTS;

  // quanto ogni traiettoria sta lontana dalla mediana (0 = vicina, 1 = lontana): colore, spessore, numero di perle
  const far = new Float32Array(K);
  for (let k = 1; k < K; k++) {
    let d = 0;
    for (let i = 0; i < N; i++) d += Math.abs(all[k][i] - median[i]);
    far[k] = Math.min(1, (d / N) * 6);
  }
  // profondita' per curva: la mediana davanti al centro, il fascio distribuito in z (deterministico)
  const zk = new Float32Array(K);
  for (let k = 1; k < K; k++) zk[k] = (rand() - 0.5) * depth;

  const toX = (u: number) => (u - 0.5) * width;
  const toY = (v: number) => (v - 0.5) * height;
  const sample = (c: number[], u: number) => {
    const f = u * (N - 1);
    const i = Math.min(N - 2, Math.floor(f));
    const t = f - i;
    return c[i] + (c[i + 1] - c[i]) * t;
  };

  // ripartizione delle perle: la mediana e' il 22% (cuore luminoso), il resto in parti uguali
  const nMed = Math.round(count * 0.22);
  const nEach = Math.floor((count - nMed) / (K - 1));
  const total = nMed + nEach * (K - 1);
  const pos = new Float32Array(total * 3);
  const info = new Float32Array(total * 4);
  const col = new Float32Array(total * 3);
  const med = new Float32Array(total);

  const lx = 0.42;
  const ly = 0.72;
  const lz = 0.55;
  const ln = Math.hypot(lx, ly, lz);
  let n = 0;
  const put = (k: number, u: number, x: number, y: number, z: number, rho: number, theta: number, size: number, rgb: [number, number, number]) => {
    const oy = Math.sin(theta) * rho;
    const oz = Math.cos(theta) * rho;
    pos[n * 3] = x;
    pos[n * 3 + 1] = y + oy;
    pos[n * 3 + 2] = z + oz;
    info[n * 4] = k;
    info[n * 4 + 1] = u;
    info[n * 4 + 2] = rand();
    info[n * 4 + 3] = size;
    med[n] = toY(sample(median, u));
    // normale di forma: dal tubo della traiettoria (y, z), con un po' di x casuale
    let nx = (rand() - 0.5) * 0.5;
    let ny = Math.sin(theta);
    let nz = Math.cos(theta) + 0.6;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl;
    ny /= nl;
    nz /= nl;
    const ndl = Math.max(0, (nx * lx + ny * ly + nz * lz) / ln);
    const shade = 0.42 + 0.62 * ndl + 0.25 * Math.pow(ndl, 8);
    col[n * 3] = srgbToLinear(rgb[0]) * shade;
    col[n * 3 + 1] = srgbToLinear(rgb[1]) * shade;
    col[n * 3 + 2] = srgbToLinear(rgb[2]) * shade;
    n++;
  };

  // MEDIANA: tubo r 0.22; cuore quasi bianco, mantello lime chiaro; perle piu' grandi
  const rMed = 0.22;
  for (let i = 0; i < nMed; i++) {
    const u = rand();
    const q = Math.pow(rand(), 0.6);
    const rho = q * rMed;
    const theta = rand() * Math.PI * 2;
    const core = 1 - q; // 1 al centro
    const rgb = hslToRgb(82 - 2 * core, 0.85 - 0.55 * core, 0.7 + 0.25 * core);
    put(0, u, toX(u), toY(sample(median, u)), 0, rho, theta, 0.6 + rand() * 0.55 + core * 0.35, rgb);
  }
  // FASCIO: tubi sottili; piu' lontani dalla mediana = piu' scuri, piu' sottili, piu' piccoli
  for (let k = 1; k < K; k++) {
    const f = far[k];
    const hue = 70 + (k % 7) * 6 + f * 40;
    const light = 0.52 - f * 0.26;
    const rgb = hslToRgb(hue, 0.62, light);
    const rk = 0.11 - f * 0.05;
    const size = 0.42 + (1 - f) * 0.3;
    for (let i = 0; i < nEach; i++) {
      const u = rand();
      const rho = Math.sqrt(rand()) * rk;
      const theta = rand() * Math.PI * 2;
      put(k, u, toX(u), toY(sample(all[k], u)), zk[k], rho, theta, size + rand() * 0.25, rgb);
    }
  }

  const samples = new Float32Array(K * FAN_SAMPLES * 3);
  for (let k = 0; k < K; k++)
    for (let s = 0; s < FAN_SAMPLES; s++) {
      const u = (s + 0.5) / FAN_SAMPLES;
      const o = (k * FAN_SAMPLES + s) * 3;
      samples[o] = toX(u);
      samples[o + 1] = toY(sample(all[k], u));
      samples[o + 2] = k ? zk[k] : 0;
    }

  return { count: total, curves: K, pos, info, col, med, samples };
}
