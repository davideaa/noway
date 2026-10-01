/*
 * Materiali procedurali (DESIGN 5.1-5.2): parquet, lino, intonaco, cemento, moquette, ottone.
 * Nessuna texture fotografica e nessun file scaricato: le texture si disegnano a runtime su un
 * canvas 2D (256² il parquet, 128² le più piccole, 512² le più grandi). Colori in sRGB come in DESIGN;
 * three li converte nello spazio lineare. Materiali Lambert (DESIGN: Standard solo per <= 3 oggetti
 * "eroe" e solo su desktop: l'ottone a livello `high`).
 *
 * Tutto ciò che si crea va in un `Risorse`: `risorse.dispose()` libera geometrie, materiali e
 * texture della scena (MOTION 2.2: dopo 10 cambi di scena `renderer.info.memory` torna a zero).
 * Le texture CONDIVISE (alone, ombra, raggio) hanno `userData.shared` e le libera solo lo Stage.
 */

import {
  CanvasTexture,
  Color,
  type BufferGeometry,
  type Material,
  type Mesh,
  type Object3D,
  MeshLambertMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
  Float32BufferAttribute,
} from "three";
import type { Qualita } from "../../content/types";

/* ───────────────────────── Colori di DESIGN 5.2 ───────────────────────── */

export const COLORI = {
  parquet: "#C99A5B",
  lino: "#F4EFE6",
  cuscini: "#9B9283",
  intonaco: "#D9CBB0",
  intonacoSera: "#6B5D47",
  testiera: "#C8B896",
  tende: "#CBB892",
  velo: "#F2ECDD",
  ottone: "#B8923F",
  alluminio: "#B9BDBE",
  cemento: "#BDB6A8",
  cementoHall: "#DAD5CB",
  pilastriRistorante: "#6B5642",
  pilastriSala: "#C9A862",
  moquette: "#C9BCA3",
  sediaSala: "#D2BEA8",
  ulivoChiaro: "#8A4F12",
  ulivoScuro: "#5A3A1B",
  fogliaScura: "#4F6B45",
  fogliaChiara: "#A9BC95",
  paralume: "#F2C27A",
  vetro: "#DCE9EE",
  ombra: "#3A2A18",
} as const;

/* ───────────────────────── Risorse: dispose completo ───────────────────────── */

type Eliminabile = { dispose(): void };

const eCondiviso = (o: unknown): boolean =>
  typeof o === "object" && o !== null && (o as { userData?: { shared?: boolean } }).userData?.shared === true;

/**
 * Raccoglie ciò che una scena crea. `dispose()` libera tutto, tranne le risorse condivise.
 * `texture(chiave, crea)` memorizza una texture di base per scena (più materiali con ripetizioni
 * diverse la clonano: i cloni condividono i dati e la memoria GPU).
 */
export class Risorse {
  private oggetti = new Set<Eliminabile>();
  private basi = new Map<string, Texture>();

  add<T extends Eliminabile>(o: T): T {
    if (!eCondiviso(o)) this.oggetti.add(o);
    return o;
  }

  texture(chiave: string, crea: () => Texture): Texture {
    let t = this.basi.get(chiave);
    if (!t) {
      t = this.add(crea());
      this.basi.set(chiave, t);
    }
    return t;
  }

  dispose(): void {
    for (const o of this.oggetti) o.dispose();
    this.oggetti.clear();
    this.basi.clear();
  }
}

const SLOT_TEXTURE = [
  "map",
  "alphaMap",
  "emissiveMap",
  "lightMap",
  "aoMap",
  "normalMap",
  "bumpMap",
  "roughnessMap",
  "metalnessMap",
] as const;

/**
 * Rete di sicurezza: libera geometrie, materiali e texture di un albero. Salta ciò che è condiviso.
 * Lo Stage la chiama dopo `handle.dispose()`, così una scena distratta non lascia nulla.
 */
export function disposeAlbero(radice: Object3D): void {
  radice.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry && !eCondiviso(m.geometry)) (m.geometry as BufferGeometry).dispose();
    const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
    for (const mat of mats as Material[]) {
      if (eCondiviso(mat)) continue;
      for (const k of SLOT_TEXTURE) {
        const t = (mat as unknown as Record<string, Texture | null | undefined>)[k];
        if (t && !eCondiviso(t)) t.dispose();
      }
      mat.dispose();
    }
    // InstancedMesh: libera il buffer delle matrici
    const im = o as Mesh & { isInstancedMesh?: boolean; dispose?: () => void };
    if (im.isInstancedMesh && typeof im.dispose === "function") im.dispose();
  });
}

/* ───────────────────────── Texture condivise ───────────────────────── */

const condivise = new Map<string, Texture>();

/**
 * Texture creata una volta per visita e condivisa fra scene (alone, ombra, raggio).
 * NON va liberata dalle scene. `liberaCondivise()` la chiama lo Stage allo smontaggio totale.
 */
export function texturaCondivisa(chiave: string, crea: () => Texture): Texture {
  let t = condivise.get(chiave);
  if (!t) {
    t = crea();
    t.userData.shared = true;
    condivise.set(chiave, t);
  }
  return t;
}

export function liberaCondivise(): void {
  for (const t of condivise.values()) t.dispose();
  condivise.clear();
}

/* ───────────────────────── Disegno su canvas ───────────────────────── */

/** Generatore pseudo-casuale deterministico: stessa scelta, stesso disegno. */
export function prng(seme: number): () => number {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nuovoCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas 2D non disponibile");
  return [c, ctx];
}

/** Texture da un canvas, ripetibile, in sRGB. */
export function texturaDaCanvas(c: HTMLCanvasElement, ripeti = true): CanvasTexture {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  if (ripeti) t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 4; // three lo limita a ciò che la GPU consente
  return t;
}

/** Disegna su un canvas `w x h` e lo restituisce come texture. */
export function disegna(
  w: number,
  h: number,
  fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  ripeti = true,
): CanvasTexture {
  const [c, ctx] = nuovoCanvas(w, h);
  fn(ctx, w, h);
  return texturaDaCanvas(c, ripeti);
}

const ss = (t: number) => t * t * (3 - 2 * t);

/**
 * Rumore di valore PERIODICO (si ripete senza cuciture) a due ottave, in 0..1.
 * `celle` = lato del reticolo della prima ottava (la seconda ne ha 4 volte tanto).
 */
function rumorePeriodico(lato: number, celle: number, seme: number): Float32Array {
  const rnd = prng(seme);
  const ottava = (n: number): Float32Array => {
    const r = new Float32Array(n * n);
    for (let i = 0; i < r.length; i++) r[i] = rnd();
    return r;
  };
  const a = ottava(celle);
  const nb = celle * 4;
  const b = ottava(nb);
  const out = new Float32Array(lato * lato);
  const campiona = (r: Float32Array, n: number, x: number, y: number): number => {
    const u = (x / lato) * n;
    const v = (y / lato) * n;
    const i = Math.floor(u);
    const j = Math.floor(v);
    const fx = ss(u - i);
    const fy = ss(v - j);
    const i1 = (i + 1) % n;
    const j1 = (j + 1) % n;
    const i0 = i % n;
    const j0 = j % n;
    const top = r[j0 * n + i0] * (1 - fx) + r[j0 * n + i1] * fx;
    const bot = r[j1 * n + i0] * (1 - fx) + r[j1 * n + i1] * fx;
    return top * (1 - fy) + bot * fy;
  };
  for (let y = 0; y < lato; y++) {
    for (let x = 0; x < lato; x++) {
      out[y * lato + x] = campiona(a, celle, x, y) * 0.7 + campiona(b, nb, x, y) * 0.3;
    }
  }
  return out;
}

/** Nuvola di tono quasi bianca (0,92..1): moltiplica il `color` del materiale (intonaco, cemento, moquette). */
function texturaNuvola(lato: number, celle: number, seme: number, profondita: number, grana = 0): Texture {
  return disegna(lato, lato, (ctx) => {
    const n = rumorePeriodico(lato, celle, seme);
    const img = ctx.createImageData(lato, lato);
    const rnd = prng(seme + 7);
    for (let i = 0; i < n.length; i++) {
      const g = 1 - profondita + n[i] * profondita + (grana ? (rnd() - 0.5) * grana : 0);
      const v = Math.max(0, Math.min(255, Math.round(g * 255)));
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
}

/* ───────────────────────── Le texture ───────────────────────── */

/** Lato in metri coperto da una piastrella di parquet: 8 listoni da 9 cm. */
export const PARQUET_PIASTRELLA_M = 0.72;

/** Parquet rovere 256², ripetibile: 8 file x 32 px, 12 toni (+-6%), giunti sfalsati, venature. */
export function texturaParquet(): Texture {
  const L = 256;
  const FILE = 8;
  const H = L / FILE;
  return disegna(L, L, (ctx) => {
    const rnd = prng(2026);
    const base = new Color(COLORI.parquet);
    ctx.fillStyle = COLORI.parquet;
    ctx.fillRect(0, 0, L, L);
    for (let r = 0; r < FILE; r++) {
      // listoni di lunghezza variabile la cui somma fa esattamente L: la fila si chiude su se stessa
      const lunghezze: number[] = [];
      let resto = L;
      while (resto > 0) {
        const l = resto < 130 ? resto : Math.min(resto - 50, 90 + Math.floor(rnd() * 90));
        lunghezze.push(l);
        resto -= l;
      }
      let x = -Math.floor(rnd() * L);
      for (const l of lunghezze) {
        const tono = Math.floor(rnd() * 12); // 12 toni
        const f = 1 + (tono / 11 - 0.5) * 0.12; // +-6%
        const c = base.clone().multiplyScalar(f);
        const css = `#${c.getHexString()}`;
        for (const dx of [-L, 0, L]) {
          const xx = x + dx;
          if (xx + l < 0 || xx > L) continue;
          ctx.fillStyle = css;
          ctx.fillRect(xx, r * H, l, H);
          // venature: poche linee sottili, chiare e scure
          for (let k = 0; k < 4; k++) {
            ctx.fillStyle = rnd() < 0.5 ? "rgba(90,50,10,0.10)" : "rgba(255,235,200,0.10)";
            ctx.fillRect(xx, r * H + 3 + rnd() * (H - 7), l, 1);
          }
          // giunto fra listoni (testa)
          ctx.fillStyle = "rgba(60,35,10,0.38)";
          ctx.fillRect(xx, r * H, 1, H);
        }
        x += l;
      }
      // giunto fra le file
      ctx.fillStyle = "rgba(60,35,10,0.32)";
      ctx.fillRect(0, r * H + H - 1, L, 1);
    }
  });
}

/** Lino/lenzuola 128²: trama sottile quasi bianca (il colore sta nel materiale). */
export function texturaLino(): Texture {
  const L = 128;
  return disegna(L, L, (ctx) => {
    const rnd = prng(11);
    const img = ctx.createImageData(L, L);
    const fili = new Float32Array(L);
    const trama = new Float32Array(L);
    for (let i = 0; i < L; i++) {
      fili[i] = rnd();
      trama[i] = rnd();
    }
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        const g = 0.955 + (fili[x] * 0.5 + trama[y] * 0.5 - 0.5) * 0.06 + (rnd() - 0.5) * 0.02;
        const v = Math.round(Math.min(1, g) * 255);
        const k = (y * L + x) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = v;
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

/** Intonaco 256²: nuvola morbida, +-4% di tono. */
export const texturaIntonaco = (): Texture => texturaNuvola(256, 4, 5, 0.08);
/** Cemento lisciato 512²: nuvola un po' più marcata. */
export const texturaCemento = (): Texture => texturaNuvola(512, 4, 9, 0.14);
/** Moquette 512²: nuvola leggera con grana fine. */
export const texturaMoquette = (): Texture => texturaNuvola(512, 8, 13, 0.06, 0.05);

/* ───────────────────────── Fabbriche di materiali ───────────────────────── */

type OpzMateriale = { vertexColors?: boolean };

/** Lambert a tinta unita (il caso più comune; `vertexColors` per l'occlusione cotta). */
export function matLambert(
  colore: string | number | Color,
  { vertexColors = false }: OpzMateriale = {},
): MeshLambertMaterial {
  return new MeshLambertMaterial({ color: colore, vertexColors });
}

function clonaRipetuta(base: Texture, rx: number, ry: number): Texture {
  const t = base.clone();
  t.repeat.set(rx, ry);
  return t;
}

/** Parquet su un piano di `larghezzaM x profonditaM` metri (le UV vanno da 0 a 1, come PlaneGeometry). */
export function matParquet(r: Risorse, larghezzaM: number, profonditaM: number): MeshLambertMaterial {
  const base = r.texture("parquet", texturaParquet);
  const map = r.add(clonaRipetuta(base, larghezzaM / PARQUET_PIASTRELLA_M, profonditaM / PARQUET_PIASTRELLA_M));
  return r.add(new MeshLambertMaterial({ map }));
}

/** Lino per lenzuola e divani: `ripetizioni` volte la trama sulle UV. */
export function matLino(r: Risorse, ripetizioni = 4): MeshLambertMaterial {
  const map = r.add(clonaRipetuta(r.texture("lino", texturaLino), ripetizioni, ripetizioni));
  return r.add(new MeshLambertMaterial({ map, color: COLORI.lino }));
}

/**
 * Intonaco delle pareti. Il colore sta nel materiale (`material.color`): giorno `#D9CBB0`,
 * sera `#6B5D47` (si interpola con `Color.lerpColors`, nessun ricalcolo di geometria).
 */
export function matIntonaco(r: Risorse, tono: "giorno" | "sera" = "giorno", vertexColors = false): MeshLambertMaterial {
  const map = r.add(clonaRipetuta(r.texture("intonaco", texturaIntonaco), 2, 2));
  return r.add(
    new MeshLambertMaterial({ map, color: tono === "sera" ? COLORI.intonacoSera : COLORI.intonaco, vertexColors }),
  );
}

/** Cemento lisciato (hall: `#DAD5CB`, ristorante: `#BDB6A8`). */
export function matCemento(r: Risorse, hall = false, ripetizioni = 3): MeshLambertMaterial {
  const map = r.add(clonaRipetuta(r.texture("cemento", texturaCemento), ripetizioni, ripetizioni));
  return r.add(new MeshLambertMaterial({ map, color: hall ? COLORI.cementoHall : COLORI.cemento }));
}

/** Moquette della sala congressi. */
export function matMoquette(r: Risorse, ripetizioni = 6): MeshLambertMaterial {
  const map = r.add(clonaRipetuta(r.texture("moquette", texturaMoquette), ripetizioni, ripetizioni));
  return r.add(new MeshLambertMaterial({ map, color: COLORI.moquette }));
}

/**
 * Ottone/metallo caldo `#B8923F`, nessuna riflessione: Lambert. Solo a livello `high` su desktop,
 * per un oggetto "eroe", un Standard appena metallico (DESIGN 5.5).
 */
export function matOttone(r: Risorse, qualita: Qualita = "mid"): MeshLambertMaterial | MeshStandardMaterial {
  if (qualita === "high") {
    return r.add(new MeshStandardMaterial({ color: COLORI.ottone, metalness: 0.35, roughness: 0.55 }));
  }
  return r.add(new MeshLambertMaterial({ color: COLORI.ottone }));
}

/* ───────────────────────── Occlusione cotta nei vertici ───────────────────────── */

/**
 * Scrive l'attributo `color` di `geom`: `base` moltiplicato per `fattore(x, y, z, nx, ny, nz)`
 * (0..1.2). Serve all'occlusione agli angoli muro-pavimento e a sfumare la sommità dei volumi
 * (DESIGN 5.4: niente lightmap). Il materiale va creato con `vertexColors: true`.
 * Funziona sulle coordinate locali della geometria.
 */
export function coloraVertici(
  geom: BufferGeometry,
  base: string | number | Color,
  fattore: (x: number, y: number, z: number, nx: number, ny: number, nz: number) => number,
): void {
  const pos = geom.getAttribute("position");
  const nor = geom.getAttribute("normal");
  const c = new Color(base);
  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const f = fattore(
      pos.getX(i),
      pos.getY(i),
      pos.getZ(i),
      nor ? nor.getX(i) : 0,
      nor ? nor.getY(i) : 1,
      nor ? nor.getZ(i) : 0,
    );
    out[i * 3] = c.r * f;
    out[i * 3 + 1] = c.g * f;
    out[i * 3 + 2] = c.b * f;
  }
  geom.setAttribute("color", new Float32BufferAttribute(out, 3));
}
