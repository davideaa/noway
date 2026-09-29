/**
 * La plate della figura: disegnata su un canvas 2D (nessun ritratto), poi
 * campionata via getImageData. Curva mediana del capitale in primo piano
 * (somma cumulata in R del portafoglio vero) e fascio di traiettorie del
 * bootstrap a blocchi intorno. Dati precalcolati in plate-data.ts
 * (scripts/plate.py): solo la FORMA, nessun numero.
 *
 * Restituisce posizioni, scala e colore GIA' ombreggiato (bake una volta sola,
 * mai per frame): la normale di forma e' l'offset della perla dall'ASSE DELLA
 * FIGURA, non dall'origine del mondo, altrimenti la nuvola si appiattisce.
 */
import { PLATE_CURVES, PLATE_POINTS } from "./plate-data";

export type Beads = {
  count: number;
  /** xyz per perla, centrate sul centro della figura */
  pos: Float32Array;
  /** scala per perla */
  scale: Float32Array;
  /** rgb per perla (0..1, lineare-ish, gia' con la luce) */
  col: Float32Array;
};

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

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hue2rgb(p: number, q: number, t: number) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * REMAP della tinta verso l'accento: ruota la tinta campionata verso `targetHue`
 * lungo l'arco piu' corto, con `pull` (0.85), e TIENE la luminosita' propria.
 * Sotto S 0.12 non si tocca: sono le luci speculari, tingerle costa l'unico
 * quasi-bianco della figura. Rimappare tiene il modellato; sostituire il colore
 * appiattisce 40.000 perle in una sagoma sola.
 */
export function remapHue(r: number, g: number, b: number, targetHue: number, pull = 0.85): [number, number, number] {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (s < 0.12) return [r, g, b];
  let d = targetHue - h;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  let nh = h + d * pull;
  if (nh < 0) nh += 1;
  if (nh > 1) nh -= 1;
  return hslToRgb(nh, s, l);
}

const decode = (row: string) => row.split(",").map((v) => Number(v) / 4095);

/**
 * Disegna la plate e campiona `count` perle dentro un riquadro `width` x `height`
 * (unita' mondo) centrato sull'origine. `accentHue` = tinta 0..1 verso cui
 * rimappare (lime).
 */
export function buildBeads(count: number, width: number, height: number, accentHue: number, seed = 7): Beads {
  const W = 360;
  const H = Math.round((W * height) / width);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rand = mulberry(seed);
  const empty: Beads = { count: 0, pos: new Float32Array(0), scale: new Float32Array(0), col: new Float32Array(0) };
  if (!ctx) return empty;

  const curves = PLATE_CURVES.map(decode);
  const pad = 0.08;
  const toX = (i: number) => pad * W + (i / (PLATE_POINTS - 1)) * (1 - 2 * pad) * W;
  const toY = (v: number) => H - (pad * H + v * (1 - 2 * pad) * H);
  const stroke = (c: number[], lw: number, style: string, alpha: number) => {
    ctx.beginPath();
    ctx.lineWidth = lw;
    ctx.strokeStyle = style;
    ctx.globalAlpha = alpha;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    c.forEach((v, i) => (i ? ctx.lineTo(toX(i), toY(v)) : ctx.moveTo(toX(i), toY(v))));
    ctx.stroke();
  };

  // Fascio: tinte diverse (oliva, teal, giallo-verde) e luminosita' diverse,
  // cosi' il remap ha un modellato da tenere. Le traiettorie piu' lontane
  // dalla mediana sono piu' scure e piu' sottili.
  const median = curves[0];
  const fan = curves.slice(1);
  fan.forEach((c, k) => {
    const dist = c.reduce((acc, v, i) => acc + Math.abs(v - median[i]), 0) / c.length;
    const far = Math.min(1, dist * 6);
    const hue = 70 + (k % 7) * 9 + far * 40; // 70..170 gradi
    const light = 52 - far * 24;
    stroke(c, 1.6 + (1 - far) * 1.2, `hsl(${hue} 60% ${light}%)`, 0.5 + (1 - far) * 0.35);
  });
  // Mediana: alone largo tenue + tratto pieno chiaro + filo quasi bianco (la speculare).
  stroke(median, 16, "hsl(86 70% 55%)", 0.22);
  stroke(median, 6.5, "hsl(84 85% 72%)", 0.95);
  stroke(median, 2.2, "hsl(80 30% 94%)", 0.9);

  const img = ctx.getImageData(0, 0, W, H).data;
  const idx: number[] = [];
  const wsum: number[] = [];
  let acc = 0;
  for (let i = 0; i < W * H; i++) {
    const a = img[i * 4 + 3];
    if (a > 28) {
      idx.push(i);
      acc += a;
      wsum.push(acc);
    }
  }
  if (!idx.length) return empty;

  const pos = new Float32Array(count * 3);
  const scale = new Float32Array(count);
  const col = new Float32Array(count * 3);
  const lx = 0.42;
  const ly = 0.72;
  const lz = 0.55;
  const ln = Math.hypot(lx, ly, lz);
  const pick = (u: number) => {
    // ricerca binaria sulla cumulata dei pesi (alpha)
    let lo = 0;
    let hi = wsum.length - 1;
    const target = u * acc;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (wsum[m] < target) lo = m + 1;
      else hi = m;
    }
    return lo;
  };
  for (let n = 0; n < count; n++) {
    const k = pick(rand());
    const i = idx[k];
    const px = (i % W) + rand() - 0.5;
    const py = Math.floor(i / W) + rand() - 0.5;
    const a = img[i * 4 + 3] / 255;
    const x = (px / W - 0.5) * width;
    const y = (0.5 - py / H) * height;
    const thick = 0.25 + 1.1 * a * a;
    const z = (rand() - 0.5) * thick;
    pos[n * 3] = x;
    pos[n * 3 + 1] = y;
    pos[n * 3 + 2] = z;
    scale[n] = 0.55 + rand() * 0.75 + a * 0.35;

    // normale di forma: offset dall'asse della figura (y schiacciato), mai dall'origine del mondo
    let nx = x;
    let ny = y * 0.15;
    let nz = z * 6 + (rand() - 0.5) * 0.4;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl;
    ny /= nl;
    nz /= nl;
    const ndl = Math.max(0, (nx * lx + ny * ly + nz * lz) / ln);
    const shade = 0.42 + 0.62 * ndl + 0.25 * Math.pow(ndl, 8);

    const [r, g, b] = remapHue(img[i * 4] / 255, img[i * 4 + 1] / 255, img[i * 4 + 2] / 255, accentHue);
    col[n * 3] = r * shade;
    col[n * 3 + 1] = g * shade;
    col[n * 3 + 2] = b * shade;
  }
  return { count, pos, scale, col };
}
