/**
 * Generatore delle disposizioni della sala congressi (UX 7.2, MOTION 5.2-5.3). FUNZIONI PURE e
 * DETERMINISTICHE: niente `Math.random`, niente `three`, niente DOM. Stessa scelta, stesso disegno.
 * Si usano dalla scena (`scenes/congress/build.ts`), dalla pagina (per sapere quante sedie ci sono)
 * e dai test (`tests/unit/congress-layout.test.ts`).
 *
 * SISTEMA DI COORDINATE (metri). La sala è un rettangolo centrato nell'origine:
 *   x = lato corto (`larghezza`), z = lato lungo (`profondita`), y = verso l'alto.
 * Il palco sta sul lato corto a z NEGATIVO (lontano dalla camera, che guarda da z positivo).
 * `dims` di `CongressHall` è «larghezza × profondità» come pubblicato: se la larghezza supera la
 * profondità la sala si ruota di 90° (`ruotata: true`) così il palco sta sempre sul lato corto
 * (MOTION 5.2). Resta lo stesso rettangolo: cambiano solo gli assi.
 *
 * Una sedia guarda verso -z con `rotY = 0`. Per guardare nella direzione (dx, dz):
 * `rotY = atan2(-dx, -dz)`. Una matrice scritta con `scriviMatrice` ruota di `rotY` attorno a Y.
 *
 * FORMATO. Sedie, tavoli e pannelli sono `Float32Array` con passo 4: `[x, z, rotY, scala]` per
 * istanza, pronti per `morfaMatrici`. La scala è uniforme (1 = misure nominali).
 *
 * ADATTAMENTO (`fit`, MOTION 5.2). Se i passi nominali non bastano a far stare `n` sedie nella
 * sala, TUTTI i passi e gli oggetti si riducono insieme (scala 1 -> 0,6, a passi dell'1%). Se
 * nemmeno a 0,6 ci stanno, resta il disegno più fitto possibile e `sporge` vale true (il test
 * segnala la sala).
 */

import { easeIn } from "../motion";
import type { CongressHall, Disposizione } from "../../content/types";

/* ───────────────────────── Costanti ───────────────────────── */

/** Floats per istanza: x, z, rotY, scala. */
export const STRIDE = 4;
/** Istanze massime dei buffer della scena (MOTION 5.1: 520 sedie, 120 tavoli, 120 pannelli). */
export const MAX_SEDIE = 520;
export const MAX_TAVOLI = 120;
export const MAX_PANNELLI = 120;
/** Scala minima di sedie e passi (UX 7.2: «fino al 60%»). */
export const SCALA_MIN = 0.6;
/**
 * Se a scala 1 le sedie stanno con i passi nominali, i passi si allargano fino a questo fattore
 * (0,5 -> 0,625 m e 0,9 -> 1,125 m in platea) finché la disposizione sta ancora nella sala: così
 * 500 sedie in 500 m² non restano ammassate davanti al palco con metà sala vuota. Mai le sedie.
 */
export const ESPANSIONE_MAX = 1.25;

/** Tempi (ms) dei tre movimenti della scena (MOTION 5.3: sedie 720, pareti 600; UX 7.2: sala 480). */
export const DURATE = { sedie: 720, stanza: 480, pareti: 600 } as const;
/** Quota della durata in cui parte l'ultima sedia: l'ultima parte a 240 ms e dura 480 ms. */
export const SFALSAMENTO = 0.33;
/** Salto della sedia mentre si sposta (m). */
export const SALTO = 0.22;

/** Misure nominali degli oggetti (m). La scena costruisce le geometrie con questi numeri. */
export const OGGETTI = {
  sedia: { larghezza: 0.46, profondita: 0.5, altezzaSeduta: 0.45, altezzaSchienale: 0.92 },
  tavoloRettangolare: { lunghezza: 1.8, profondita: 0.6, altezza: 0.74 },
  tavoloTondo: { diametro: 1.8, altezza: 0.74 },
  pannello: { larghezza: 1.2, spessore: 0.1 },
} as const;

const PI = Math.PI;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ───────────────────────── Telaio e palco ───────────────────────── */

export type Telaio = {
  /** Lato corto (asse x). */
  larghezza: number;
  /** Lato lungo (asse z). */
  profondita: number;
  /** true se `dims` aveva larghezza > profondità e gli assi sono stati scambiati. */
  ruotata: boolean;
};

export function telaio(dims: readonly [number, number]): Telaio {
  const [w, d] = dims;
  return w > d
    ? { larghezza: d, profondita: w, ruotata: true }
    : { larghezza: w, profondita: d, ruotata: false };
}

/** Profondità del palco: il 12% della profondità, fra 0,9 e 3,2 m (MOTION 5.2). */
export function profonditaPalco(profondita: number): number {
  return clamp(0.12 * profondita, 0.9, 3.2);
}

export type Palco = { larghezza: number; profondita: number; xCentro: number; zCentro: number };

export function palco(t: Telaio): Palco {
  const p = profonditaPalco(t.profondita);
  return {
    larghezza: Math.min(t.larghezza - 0.8, 14),
    profondita: p,
    xCentro: 0,
    zCentro: -t.profondita / 2 + p / 2,
  };
}

/* ───────────────────────── Tipi del disegno ───────────────────────── */

export type TipoTavoli = "nessuno" | "rettangolari" | "tondi";

export type Disegno = {
  disposizione: Disposizione;
  larghezza: number;
  profondita: number;
  ruotata: boolean;
  /** Numero di sedie disegnate. */
  n: number;
  /** `[x, z, rotY, scala] x n`. */
  sedie: Float32Array;
  nTavoli: number;
  /** `[x, z, rotY, scala] x nTavoli`. */
  tavoli: Float32Array;
  tipoTavoli: TipoTavoli;
  palco: Palco;
  /** Scala applicata a sedie, tavoli e passi (1 = nominale). */
  scala: number;
  /** scala < 1. */
  ridotta: boolean;
  /**
   * Fattore (1..ESPANSIONE_MAX) di cui i PASSI (non gli oggetti) sono stati allargati per occupare la
   * sala quando i passi nominali la lasciano mezza vuota (Costellazioni: 500 sedie in 500 m²). 1 = nominali.
   */
  espansione: number;
  /** true se nemmeno a SCALA_MIN le sedie stanno dentro la sala. */
  sporge: boolean;
};

export type IngressoLayout = {
  /** Metri, larghezza × profondità come pubblicato (`CongressHall.dims`). */
  dims: readonly [number, number];
  disposizione: Disposizione;
  /** Capienza della tabella per quella disposizione: il tetto. */
  capienza: number;
  /** Partecipanti richiesti. `null`/non valido/<= 0: si disegna la capienza. */
  ospiti?: number | null;
};

/** Quante sedie si disegnano: `min(ospiti, capienza)`, oppure la capienza se non c'è un numero valido. */
export function numeroSedie(capienza: number, ospiti?: number | null): number {
  const cap = Math.max(0, Math.floor(capienza));
  if (ospiti === null || ospiti === undefined || !Number.isFinite(ospiti) || ospiti <= 0) return cap;
  return Math.max(1, Math.min(Math.floor(ospiti), cap));
}

/* ───────────────────────── Aiuti per costruire ───────────────────────── */

/** Accumula istanze `[x, z, rotY, scala]`. */
class Lista {
  private v: number[] = [];
  push(x: number, z: number, rot: number, s: number): void {
    this.v.push(x, z, rot, s);
  }
  get n(): number {
    return this.v.length / STRIDE;
  }
  array(): Float32Array {
    return Float32Array.from(this.v);
  }
}

type Provato = { sedie: Lista; tavoli: Lista; tipo: TipoTavoli };

/** Colonne x di una riga con `na` corridoi (0, 1 o 2), centrate in 0. Passo fra colonne `passo`, corridoio `extra` in più. */
function colonneX(c: number, passo: number, extra: number, na: number): number[] {
  const gruppi = na === 0 ? [c] : na === 1 ? [c / 2, c / 2] : [Math.round(c / 3), c - 2 * Math.round(c / 3), Math.round(c / 3)];
  const xs: number[] = [];
  let x = 0;
  gruppi.forEach((g, gi) => {
    for (let j = 0; j < g; j++) {
      xs.push(x);
      x += passo;
    }
    if (gi < gruppi.length - 1) x += extra;
  });
  const centro = (xs[0] + xs[xs.length - 1]) / 2;
  return xs.map((v) => v - centro);
}

/** Corridoi in una riga di `c` posti: nessuno sotto 12 colonne, uno da 12, due da 24. */
const corridoiPer = (c: number) => (c >= 24 ? 2 : c >= 12 ? 1 : 0);

type Griglia = { punti: Array<[number, number]>; colonne: number; righe: number };

/**
 * `T` posti su file di `c` colonne (c scelto fra quelli che stanno in `Wc` x `righeMax`, il più
 * vicino alla forma della sala). Le file partono da `z0` e distano `pz`. L'ultima fila, se parziale,
 * è centrata (si riempiono le colonne più vicine al centro). `null` se non ci sta.
 */
function griglia(
  T: number,
  Wc: number,
  righeMax: number,
  px: number,
  pz: number,
  extra: number,
  z0: number,
  Dc: number,
): Griglia | null {
  if (T <= 0) return { punti: [], colonne: 0, righe: 0 };
  if (righeMax < 1) return null;
  const forma = Math.log((Wc + px) / (Math.max(Dc, 0) + pz));
  let migliore = -1;
  let costo = Infinity;
  for (let c = 1; c <= T; c++) {
    const na = corridoiPer(c);
    if (na === 1 && c % 2 === 1) continue;
    const span = (c - 1) * px + na * extra;
    if (span > Wc + 1e-9) break;
    const r = Math.ceil(T / c);
    if (r > righeMax) continue;
    const k = Math.abs(Math.log((c * px) / (r * pz)) - forma);
    if (k < costo - 1e-12) {
      costo = k;
      migliore = c;
    }
  }
  if (migliore < 0) return null;
  const c = migliore;
  const xs = colonneX(c, px, extra, corridoiPer(c));
  const r = Math.ceil(T / c);
  const punti: Array<[number, number]> = [];
  for (let i = 0; i < r; i++) {
    const z = z0 + i * pz;
    if (i < r - 1 || T - (r - 1) * c === c) {
      for (const x of xs) punti.push([x, z]);
    } else {
      const m = T - (r - 1) * c;
      const idx = xs
        .map((x, j) => ({ x, j }))
        .sort((a, b) => Math.abs(a.x) - Math.abs(b.x) || a.x - b.x)
        .slice(0, m)
        .sort((a, b) => a.j - b.j);
      for (const { x } of idx) punti.push([x, z]);
    }
  }
  return { punti, colonne: c, righe: r };
}

/* ───────────────────────── Platea ───────────────────────── */

function provaPlatea(n: number, A: number, B: number, pal: number, s: number, e = 1): Provato | null {
  const px = 0.5 * s * e;
  const pz = 0.9 * s * e;
  const extra = 1.2 * s;
  const lat = 0.45 * s;
  const zA = -B / 2 + pal + 1.2 * s;
  const zB = B / 2 - 0.55 * s;
  const Wc = A - 2 * lat;
  const righeMax = Math.floor((zB - zA) / pz + 1e-9) + 1;
  const g = griglia(n, Wc, righeMax, px, pz, extra, zA, zB - zA);
  if (!g) return null;
  const sedie = new Lista();
  for (const [x, z] of g.punti) sedie.push(x, z, 0, s);
  return { sedie, tavoli: new Lista(), tipo: "nessuno" };
}

/* ───────────────────────── Banchi di scuola ───────────────────────── */

function provaBanchi(n: number, A: number, B: number, pal: number, s: number, e = 1): Provato | null {
  const T = Math.ceil(n / 2);
  const px = 1.95 * s * e;
  const pz = 1.4 * s * e;
  const extra = 1.0 * s;
  const lat = 1.05 * s;
  const z0 = -B / 2 + pal + 1.3 * s;
  const zB = B / 2 - 1.07 * s;
  const Wc = A - 2 * lat;
  const righeMax = Math.floor((zB - z0) / pz + 1e-9) + 1;
  const g = griglia(T, Wc, righeMax, px, pz, extra, z0, zB - z0);
  if (!g) return null;
  const sedie = new Lista();
  const tavoli = new Lista();
  let rimaste = n;
  for (const [x, z] of g.punti) {
    tavoli.push(x, z, 0, s);
    sedie.push(x - 0.45 * s, z + 0.62 * s, 0, s);
    rimaste--;
    if (rimaste > 0) {
      sedie.push(x + 0.45 * s, z + 0.62 * s, 0, s);
      rimaste--;
    }
  }
  return { sedie, tavoli, tipo: "rettangolari" };
}

/* ───────────────────────── Ferro di cavallo ───────────────────────── */

/** Un anello a U: `tb` tavoli sulla base, `ta` per braccio, linea dei tavoli a `zb`. */
type Anello = { tb: number; ta: number; zb: number };

/**
 * Tavoli di un anello nell'ordine di riempimento (simmetrico): prima la base dal centro in fuori,
 * poi le braccia dall'angolo verso l'apertura, una coppia (sinistra, destra) per volta.
 * Ogni tavolo ha 3 sedie sul lato esterno (passo 0,6 m); `n` è il numero di sedie da mettere.
 */
function riempiAnello(a: Anello, n: number, s: number, sedie: Lista, tavoli: Lista): void {
  const tl = 1.8 * s;
  const h = (a.tb * tl) / 2 - 0.3 * s; // semilarghezza della linea dei tavoli (i bracci stanno a x = ±h)
  type T = { x: number; z: number; rot: number; sx: number; sz: number; fx: number; fz: number; rotSedia: number };
  const lista: T[] = [];
  // base: tavoli lungo x a z = zb, sedie a +z guardano -z
  const xb = Array.from({ length: a.tb }, (_, j) => -(a.tb * tl) / 2 + (j + 0.5) * tl);
  [...xb]
    .sort((p, q) => Math.abs(p) - Math.abs(q) || p - q)
    .forEach((x) => lista.push({ x, z: a.zb, rot: 0, sx: 1, sz: 0, fx: 0, fz: 0.6 * s, rotSedia: 0 }));
  // braccia: dal tavolo accanto all'angolo verso l'apertura
  for (let j = 0; j < a.ta; j++) {
    const z = a.zb - 0.3 * s - (j + 0.5) * tl;
    lista.push({ x: -h, z, rot: PI / 2, sx: 0, sz: 1, fx: -0.6 * s, fz: 0, rotSedia: -PI / 2 });
    lista.push({ x: h, z, rot: PI / 2, sx: 0, sz: 1, fx: 0.6 * s, fz: 0, rotSedia: PI / 2 });
  }
  // sedie per tavolo: 3, con 2 o 1 sull'ultimo
  const posa = (t: T, m: number) => {
    if (m <= 0) return;
    tavoli.push(t.x, t.z, t.rot, s);
    const offs = m >= 3 ? [-1, 0, 1] : m === 2 ? [-0.5, 0.5] : [0];
    for (const o of offs) {
      // lungo l'asse del tavolo: x per la base, z per le braccia
      const along = o * 0.6 * s;
      sedie.push(t.x + t.fx + (t.sx ? along : 0), t.z + t.fz + (t.sz ? along : 0), t.rotSedia, s);
    }
  };
  let rimaste = n;
  // base: dal centro in fuori
  for (let j = 0; j < a.tb && rimaste > 0; j++) {
    const m = Math.min(3, rimaste);
    posa(lista[j], m);
    rimaste -= m;
  }
  // braccia: una coppia (sinistra, destra) per volta; sull'ultima coppia le sedie si dividono
  // a metà, così i due bracci hanno sempre lo stesso numero di tavoli (al più una sedia di differenza)
  for (let j = 0; j < a.ta && rimaste > 0; j++) {
    const sin = lista[a.tb + 2 * j];
    const des = lista[a.tb + 2 * j + 1];
    const [ms, md] = rimaste >= 6 ? [3, 3] : [Math.ceil(rimaste / 2), Math.floor(rimaste / 2)];
    posa(sin, ms);
    posa(des, md);
    rimaste -= ms + md;
  }
}

function provaFerro(n: number, A: number, B: number, pal: number, s: number): Provato | null {
  const tl = 1.8 * s;
  const lat = 0.25 * s;
  const fuori = 0.85 * s; // sedia: 0,6 + mezza sedia 0,25
  const zEnd = -B / 2 + pal + 1.0 * s;
  const hMax = A / 2 - lat - fuori;
  const Tb = Math.floor((2 * hMax + 0.6 * s) / tl + 1e-9);
  const zbMax = B / 2 - lat - fuori;
  const Ta = Math.floor((zbMax - 0.3 * s - zEnd) / tl + 1e-9);
  if (Tb < 1 || Ta < 0) return null;
  const cap = (tb: number, ta: number) => 3 * (tb + 2 * ta);
  const sedie = new Lista();
  const tavoli = new Lista();
  const zbDi = (ta: number) => zEnd + 0.3 * s + ta * tl;

  // una sola U, ridotta al necessario (ancorata al palco)
  if (cap(Tb, Ta) >= n) {
    for (let tb = 1; tb <= Tb; tb++) {
      const ta = Ta === 0 ? 0 : Math.min(Ta, Math.max(0, Math.round((tb * Ta) / Tb)));
      if (cap(tb, ta) >= n) {
        riempiAnello({ tb, ta, zb: zbDi(ta) }, n, s, sedie, tavoli);
        return { sedie, tavoli, tipo: "rettangolari" };
      }
    }
  }
  // U concentriche a 1,8 m (= un tavolo) una dall'altra, dalla più esterna
  let resto = n;
  for (let r = 0; resto > 0; r++) {
    const tb = Tb - 2 * r;
    const ta = Ta - r;
    if (tb < 1 || ta < 0) return null;
    const c = Math.min(resto, cap(tb, ta));
    riempiAnello({ tb, ta, zb: zbDi(ta) }, c, s, sedie, tavoli);
    resto -= c;
  }
  return { sedie, tavoli, tipo: "rettangolari" };
}

/* ───────────────────────── Banchetto ───────────────────────── */

const POSTI_TAVOLO = 10;

function provaBanchetto(n: number, A: number, B: number, pal: number, s: number, e = 1): Provato | null {
  const T = Math.ceil(n / POSTI_TAVOLO);
  const p = 3.2 * s * e;
  const passoRiga = 0.866 * p;
  const rc = 1.2 * s; // raggio delle sedie dal centro del tavolo
  const ro = 1.43 * s; // ingombro esterno (sedia compresa)
  const xMax = A / 2 - ro - 0.1 * s;
  const zA = -B / 2 + pal + 0.4 * s + ro;
  const zB = B / 2 - ro - 0.1 * s;
  const Wc = 2 * xMax;
  const Dc = zB - zA;
  if (Wc < 0 || Dc < 0) return null;
  const righeMax = Math.floor(Dc / passoRiga + 1e-9) + 1;
  const forma = Math.log((Wc + p) / (Dc + passoRiga));
  let migliore = -1;
  let costo = Infinity;
  for (let c = 1; c <= T; c++) {
    const r = Math.ceil(T / c);
    const larghezza = (c - 1) * p + (r > 1 && c > 0 ? p / 2 : 0);
    if (larghezza > Wc + 1e-9) break;
    if (r > righeMax) continue;
    const k = Math.abs(Math.log((c * p) / (r * passoRiga)) - forma);
    if (k < costo - 1e-12) {
      costo = k;
      migliore = c;
    }
  }
  if (migliore < 0) return null;
  const c = migliore;
  const r = Math.ceil(T / c);
  // posizioni dei tavoli: file sfalsate di mezzo passo, centrate nel loro insieme
  const centri: Array<[number, number]> = [];
  for (let i = 0; i < r; i++) {
    const nInRiga = i < r - 1 ? c : T - (r - 1) * c;
    const sfalsa = i % 2 === 1 ? p / 2 : 0;
    // colonne della riga piena
    const xs = Array.from({ length: c }, (_, j) => j * p + sfalsa);
    let scelte = xs;
    if (nInRiga < c) {
      // ultima riga parziale: i tavoli più vicini al centro della sala
      const centro = ((c - 1) * p + (r > 1 ? p / 2 : 0)) / 2;
      scelte = xs
        .map((x, j) => ({ x, j }))
        .sort((a, b) => Math.abs(a.x - centro) - Math.abs(b.x - centro) || a.x - b.x)
        .slice(0, nInRiga)
        .sort((a, b) => a.j - b.j)
        .map((q) => q.x);
    }
    for (const x of scelte) centri.push([x, zA + i * passoRiga]);
  }
  // centra l'insieme su x = 0 (usa la larghezza reale della riga piena)
  const xmin = Math.min(...centri.map((q) => q[0]));
  const xmax = Math.max(...centri.map((q) => q[0]));
  const dx = (xmin + xmax) / 2;
  const sedie = new Lista();
  const tavoli = new Lista();
  let rimaste = n;
  for (const [cx0, cz] of centri) {
    const cx = cx0 - dx;
    tavoli.push(cx, cz, 0, s);
    const m = Math.min(POSTI_TAVOLO, rimaste);
    // 10 posti a 36°, mai esattamente sul lato del palco; con meno ospiti si siedono dal lato del palco
    const posti = Array.from({ length: POSTI_TAVOLO }, (_, k) => -PI / 2 + (k + 0.5) * ((2 * PI) / POSTI_TAVOLO));
    const ordine = posti
      .map((a, k) => ({ a, k, d: Math.abs(Math.atan2(Math.sin(a + PI / 2), Math.cos(a + PI / 2))) }))
      .sort((u, v) => u.d - v.d || u.k - v.k)
      .slice(0, m)
      .sort((u, v) => u.k - v.k);
    for (const { a } of ordine) {
      sedie.push(cx + rc * Math.cos(a), cz + rc * Math.sin(a), Math.atan2(Math.cos(a), Math.sin(a)), s);
    }
    rimaste -= m;
  }
  return { sedie, tavoli, tipo: "tondi" };
}

/* ───────────────────────── Ingresso principale ───────────────────────── */

const PROVE: Record<Disposizione, (n: number, A: number, B: number, pal: number, s: number, e?: number) => Provato | null> = {
  platea: provaPlatea,
  banchi: provaBanchi,
  ferro: (n, A, B, pal, s) => provaFerro(n, A, B, pal, s),
  banchetto: provaBanchetto,
};

/**
 * Disegno di una disposizione in una sala di `dims` metri con `n = min(ospiti, capienza)` sedie.
 * Prova le scale da 1 a 0,6 a passi dell'1% e prende la prima che sta. Se nessuna sta, restituisce
 * il disegno a scala 0,6 con i vincoli sulla profondità allentati (`sporge: true`).
 */
export function layout(ingresso: IngressoLayout): Disegno {
  const t = telaio(ingresso.dims);
  const n = numeroSedie(ingresso.capienza, ingresso.ospiti);
  const pal = palco(t);
  const prova = PROVE[ingresso.disposizione];
  const base = {
    disposizione: ingresso.disposizione,
    larghezza: t.larghezza,
    profondita: t.profondita,
    ruotata: t.ruotata,
    palco: pal,
  };
  const chiudi = (r: Provato, scala: number, sporge: boolean, espansione = 1): Disegno => ({
    ...base,
    n: r.sedie.n,
    sedie: r.sedie.array(),
    nTavoli: r.tavoli.n,
    tavoli: r.tavoli.array(),
    tipoTavoli: r.tipo,
    scala,
    ridotta: scala < 1 - 1e-9,
    espansione,
    sporge,
  });
  if (n === 0) {
    return chiudi({ sedie: new Lista(), tavoli: new Lista(), tipo: "nessuno" }, 1, false);
  }
  for (let i = 0; i <= 40; i++) {
    const s = Math.round((1 - i * 0.01) * 100) / 100;
    const r = prova(n, t.larghezza, t.profondita, pal.profondita, s);
    if (r) {
      if (s === 1 && ingresso.disposizione !== "ferro") {
        // sta coi passi nominali: si allargano finché sta ancora (passi dell'1%)
        for (let e = ESPANSIONE_MAX; e > 1.0001; e = Math.round((e - 0.01) * 100) / 100) {
          const larga = prova(n, t.larghezza, t.profondita, pal.profondita, 1, e);
          if (larga) return chiudi(larga, 1, false, e);
        }
      }
      return chiudi(r, s, false);
    }
  }
  // ultima spiaggia: sala "infinitamente" profonda a scala minima; il disegno esce dalla sala
  const r = prova(n, t.larghezza, t.profondita + 400, pal.profondita, SCALA_MIN);
  const fallback = r ?? { sedie: new Lista(), tavoli: new Lista(), tipo: "nessuno" as const };
  return chiudi(fallback, SCALA_MIN, true);
}

/**
 * Come `layout`, dai dati della sala. `null` se la disposizione non è indicata per la sala
 * (cap `null`): in quel caso il disegno non cambia (MOTION 5.2).
 */
export function layoutSala(hall: CongressHall, disposizione: Disposizione, ospiti?: number | null): Disegno | null {
  const cap = hall.cap[disposizione];
  if (cap === null) return null;
  return layout({ dims: hall.dims, disposizione, capienza: cap, ospiti });
}

/** Disegno senza sedie né tavoli (sala divisa da pareti mobili: nessuna capienza inventata). */
export function layoutVuoto(hall: CongressHall, disposizione: Disposizione): Disegno {
  const t = telaio(hall.dims);
  return {
    disposizione,
    larghezza: t.larghezza,
    profondita: t.profondita,
    ruotata: t.ruotata,
    n: 0,
    sedie: new Float32Array(0),
    nTavoli: 0,
    tavoli: new Float32Array(0),
    tipoTavoli: "nessuno",
    palco: palco(t),
    scala: 1,
    ridotta: false,
    espansione: 1,
    sporge: false,
  };
}

/* ───────────────────────── Controlli di qualità (usati dai test) ───────────────────────── */

export type Controllo = {
  /** Sedie con una parte fuori dal rettangolo della sala. */
  fuori: number;
  /** Distanza minima fra i centri di due sedie (m); `Infinity` con meno di due sedie. */
  distanzaMinima: number;
  /** Tavoli con una parte fuori dalla sala. */
  tavoliFuori: number;
  /** Sedie il cui centro cade dentro l'ingombro di un tavolo. */
  sedieSuTavoli: number;
  /** Sedie che sono anche sopra il palco (davanti al suo bordo). */
  sedieSulPalco: number;
};

/**
 * Verifica un disegno: nessuna sedia o tavolo fuori dalla sala (con l'ingombro vero), distanze
 * fra le sedie, nessuna sedia dentro un tavolo, nessuna sedia sul palco.
 */
export function controllaDisegno(d: Disegno): Controllo {
  const m = (Math.max(OGGETTI.sedia.larghezza, OGGETTI.sedia.profondita) / 2) * d.scala;
  let fuori = 0;
  let minimo = Infinity;
  let sedieSuTavoli = 0;
  let sedieSulPalco = 0;
  const bordoPalco = -d.profondita / 2 + d.palco.profondita;
  const lato = (v: number, meta: number) => Math.abs(v) + m > meta + 1e-6;
  for (let i = 0; i < d.n; i++) {
    const x = d.sedie[STRIDE * i];
    const z = d.sedie[STRIDE * i + 1];
    if (lato(x, d.larghezza / 2) || lato(z, d.profondita / 2)) fuori++;
    if (z - m < bordoPalco - 1e-6) sedieSulPalco++;
    for (let j = i + 1; j < d.n; j++) {
      const dist = Math.hypot(x - d.sedie[STRIDE * j], z - d.sedie[STRIDE * j + 1]);
      if (dist < minimo) minimo = dist;
    }
    for (let q = 0; q < d.nTavoli; q++) {
      const tx = d.tavoli[STRIDE * q];
      const tz = d.tavoli[STRIDE * q + 1];
      const rot = d.tavoli[STRIDE * q + 2];
      const ts = d.tavoli[STRIDE * q + 3];
      // coordinate della sedia nel riferimento del tavolo (inverso della rotazione Y)
      const dx = x - tx;
      const dz = z - tz;
      const lx = Math.cos(rot) * dx - Math.sin(rot) * dz;
      const lz = Math.sin(rot) * dx + Math.cos(rot) * dz;
      const dentro =
        d.tipoTavoli === "tondi"
          ? Math.hypot(dx, dz) < (OGGETTI.tavoloTondo.diametro / 2) * ts
          : Math.abs(lx) < (OGGETTI.tavoloRettangolare.lunghezza / 2) * ts &&
            Math.abs(lz) < (OGGETTI.tavoloRettangolare.profondita / 2) * ts;
      if (dentro) sedieSuTavoli++;
    }
  }
  let tavoliFuori = 0;
  for (let q = 0; q < d.nTavoli; q++) {
    const tx = d.tavoli[STRIDE * q];
    const tz = d.tavoli[STRIDE * q + 1];
    const rot = d.tavoli[STRIDE * q + 2];
    const ts = d.tavoli[STRIDE * q + 3];
    let ex: number;
    let ez: number;
    if (d.tipoTavoli === "tondi") {
      ex = ez = (OGGETTI.tavoloTondo.diametro / 2) * ts;
    } else {
      const hl = (OGGETTI.tavoloRettangolare.lunghezza / 2) * ts;
      const hp = (OGGETTI.tavoloRettangolare.profondita / 2) * ts;
      ex = Math.abs(Math.cos(rot)) * hl + Math.abs(Math.sin(rot)) * hp;
      ez = Math.abs(Math.sin(rot)) * hl + Math.abs(Math.cos(rot)) * hp;
    }
    if (Math.abs(tx) + ex > d.larghezza / 2 + 1e-6 || Math.abs(tz) + ez > d.profondita / 2 + 1e-6) tavoliFuori++;
  }
  return { fuori, distanzaMinima: minimo, tavoliFuori, sedieSuTavoli, sedieSulPalco };
}

/* ───────────────────────── Morfologia: k -> matrici ───────────────────────── */

export type Coppia = {
  /** Numero di istanze (il massimo fra stato di partenza e di arrivo). */
  n: number;
  /** Stato di partenza e di arrivo, `[x, z, rotY, scala] x n`, già accoppiati per indice. */
  da: Float32Array;
  a: Float32Array;
};

function indiciOrdinati(arr: Float32Array): number[] {
  const n = arr.length / STRIDE;
  return Array.from({ length: n }, (_, i) => i).sort((p, q) => {
    const zp = Math.round(arr[STRIDE * p + 1] * 2);
    const zq = Math.round(arr[STRIDE * q + 1] * 2);
    return zp - zq || arr[STRIDE * p] - arr[STRIDE * q] || p - q;
  });
}

/**
 * Accoppia due insiemi di istanze (MOTION 5.3, con una correzione sul caso di numeri diversi).
 * Entrambi si ordinano per `(round(2z), x)`; l'insieme più piccolo si abbina a quello più grande
 * in proporzione (l'i-esimo dei `m` va al `floor((i + 0,5) · n / m)`-esimo dei `n`), così le sedie
 * non si ammassano nelle prime file e non si incrociano da un capo all'altro della sala.
 * Se l'arrivo ha più istanze, le in più escono dal `parcheggio` con scala 0 -> s; se ne ha meno,
 * le in meno spariscono sul posto (scala s -> 0). Le istanze di partenza con scala < 0,01 si
 * scartano (sono già invisibili). L'ordine del risultato (e quindi lo sfalsamento) è quello delle
 * posizioni di arrivo, dal palco verso il fondo.
 */
export function accoppia(da: Float32Array, a: Float32Array, parcheggio: readonly [number, number]): Coppia {
  const visibili: number[] = [];
  for (let i = 0; i < da.length / STRIDE; i++) if (da[STRIDE * i + 3] >= 0.01) visibili.push(i);
  const daV = new Float32Array(visibili.length * STRIDE);
  visibili.forEach((i, j) => daV.set(da.subarray(STRIDE * i, STRIDE * i + STRIDE), STRIDE * j));
  const od = indiciOrdinati(daV);
  const oa = indiciOrdinati(a);
  const nd = od.length;
  const na = oa.length;
  const n = Math.max(nd, na);

  type Voce = { d: number[]; a: number[] };
  const prendi = (arr: Float32Array, i: number) => Array.from(arr.subarray(STRIDE * i, STRIDE * i + STRIDE));
  const voci: Voce[] = [];
  const m = Math.min(nd, na);
  if (nd <= na) {
    // ogni sedia di partenza prende una sedia di arrivo; le restanti arrivano dal parcheggio
    const usato = new Array<boolean>(na).fill(false);
    for (let i = 0; i < nd; i++) {
      const j = Math.min(na - 1, Math.floor(((i + 0.5) * na) / Math.max(1, m)));
      usato[j] = true;
      voci.push({ d: prendi(daV, od[i]), a: prendi(a, oa[j]) });
    }
    for (let j = 0; j < na; j++) {
      if (usato[j]) continue;
      const arrivo = prendi(a, oa[j]);
      voci.push({ d: [parcheggio[0], parcheggio[1], arrivo[2], 0], a: arrivo });
    }
  } else {
    // ogni sedia di arrivo prende una sedia di partenza; le restanti spariscono sul posto
    const usato = new Array<boolean>(nd).fill(false);
    for (let j = 0; j < na; j++) {
      const i = Math.min(nd - 1, Math.floor(((j + 0.5) * nd) / Math.max(1, m)));
      usato[i] = true;
      voci.push({ d: prendi(daV, od[i]), a: prendi(a, oa[j]) });
    }
    for (let i = 0; i < nd; i++) {
      if (usato[i]) continue;
      const partenza = prendi(daV, od[i]);
      voci.push({ d: partenza, a: [partenza[0], partenza[1], partenza[2], 0] });
    }
  }
  // ordine dello sfalsamento: dal palco verso il fondo, secondo dove la sedia va a finire
  const chiave = (v: Voce) => (v.a[3] > 0 ? v.a : v.d);
  const ordine = voci
    .map((v, i) => ({ v, i }))
    .sort((p, q) => {
      const kp = chiave(p.v);
      const kq = chiave(q.v);
      return Math.round(kp[1] * 2) - Math.round(kq[1] * 2) || kp[0] - kq[0] || p.i - q.i;
    });
  const D = new Float32Array(n * STRIDE);
  const A = new Float32Array(n * STRIDE);
  ordine.forEach(({ v }, i) => {
    D.set(v.d, STRIDE * i);
    A.set(v.a, STRIDE * i);
  });
  return { n, da: D, a: A };
}

/**
 * Toglie dalla coppia le istanze che alla fine non si vedono (arrivo con scala 0): da usare quando
 * il tween è finito, per non disegnare sedie a scala 0 (triangoli sprecati). Lo stato a riposo
 * diventa sia partenza sia arrivo.
 */
export function compatta(c: Coppia): Coppia {
  let n = 0;
  for (let i = 0; i < c.n; i++) if (c.a[STRIDE * i + 3] >= 0.01) n++;
  const a = new Float32Array(n * STRIDE);
  let j = 0;
  for (let i = 0; i < c.n; i++) {
    if (c.a[STRIDE * i + 3] < 0.01) continue;
    a.set(c.a.subarray(STRIDE * i, STRIDE * i + STRIDE), STRIDE * j++);
  }
  return { n, da: a, a: a.slice() };
}

function lerpAngolo(a: number, b: number, t: number): number {
  let d = (b - a) % (PI * 2);
  if (d > PI) d -= PI * 2;
  else if (d < -PI) d += PI * 2;
  return a + d * t;
}

/** Scrive la matrice 4x4 (column-major) di un'istanza: scala (sx, sy, sz), rotazione Y, traslazione. */
export function scriviMatrice(
  arr: Float32Array,
  i: number,
  x: number,
  y: number,
  z: number,
  rotY: number,
  sx: number,
  sy = sx,
  sz = sx,
): void {
  // stessa matematica di lib/three/instancing.ts (che importa three: qui no, per restare pura)
  const c = Math.cos(rotY);
  const s = Math.sin(rotY);
  const o = i * 16;
  arr[o] = c * sx;
  arr[o + 1] = 0;
  arr[o + 2] = -s * sx;
  arr[o + 3] = 0;
  arr[o + 4] = 0;
  arr[o + 5] = sy;
  arr[o + 6] = 0;
  arr[o + 7] = 0;
  arr[o + 8] = s * sz;
  arr[o + 9] = 0;
  arr[o + 10] = c * sz;
  arr[o + 11] = 0;
  arr[o + 12] = x;
  arr[o + 13] = y;
  arr[o + 14] = z;
  arr[o + 15] = 1;
}

/** Avanzamento 0..1 della sedia `i` di `n` al tempo `k`: parte in ritardo `i/(n-1) * SFALSAMENTO`, poi ease. */
export function avanzamentoIstanza(k: number, i: number, n: number, sfalsamento = SFALSAMENTO): number {
  const r = (k - (n > 1 ? i / (n - 1) : 0) * sfalsamento) / (1 - sfalsamento);
  return easeIn(r < 0 ? 0 : r > 1 ? 1 : r);
}

/**
 * LA MORFOLOGIA: funzione pura di `k` (0..1). Per ogni istanza interpola posizione, rotazione e
 * scala fra `da` e `a` con ritardo per istanza (stagger) e un salto di `salto` metri a metà strada
 * (solo se visibile). Scrive `16 x n` float in `out` (matrici column-major per `InstancedMesh`).
 * `y` è la quota di base. Stessi argomenti, stesso risultato.
 */
export function morfaMatrici(
  k: number,
  c: Coppia,
  out: Float32Array,
  { salto = SALTO, y = 0, sfalsamento = SFALSAMENTO }: { salto?: number; y?: number; sfalsamento?: number } = {},
): void {
  const { n, da, a } = c;
  for (let i = 0; i < n; i++) {
    const t = avanzamentoIstanza(k, i, n, sfalsamento);
    const o = STRIDE * i;
    const s = lerp(da[o + 3], a[o + 3], t);
    scriviMatrice(
      out,
      i,
      lerp(da[o], a[o], t),
      s > 0.01 ? y + Math.sin(PI * t) * salto : y,
      lerp(da[o + 1], a[o + 1], t),
      lerpAngolo(da[o + 2], a[o + 2], t),
      s,
    );
  }
}

/* ───────────────────────── Tempi della transizione ───────────────────────── */

export type Fase = readonly [inizio: number, durata: number];
export type Piano = { stanza: Fase; sedie: Fase; pareti: Fase; totale: number };

/**
 * Tempi (ms) di una transizione. Cambio di sala o disposizione: stanza 480, sedie 720 insieme.
 * «Dividi»: prima le sedie escono (720), le pareti partono a metà (360). «Riunisci»: prima le
 * pareti si ritirano (600), le sedie rientrano a 360. Due gesti distinti ma sovrapposti.
 */
export function pianoTempi({ cambiaDivisa, dividendo }: { cambiaDivisa: boolean; dividendo: boolean }): Piano {
  const stanza: Fase = [0, DURATE.stanza];
  if (!cambiaDivisa) {
    return { stanza, sedie: [0, DURATE.sedie], pareti: [0, 0], totale: DURATE.sedie };
  }
  const sedie: Fase = dividendo ? [0, DURATE.sedie] : [360, DURATE.sedie];
  const pareti: Fase = dividendo ? [360, DURATE.pareti] : [0, DURATE.pareti];
  const totale = Math.max(sedie[0] + sedie[1], pareti[0] + pareti[1], stanza[1]);
  return { stanza, sedie, pareti, totale };
}

/** 0..1 di una fase al tempo `t` (ms). Una fase di durata 0 vale 1. */
export function faseAt(t: number, [inizio, durata]: Fase): number {
  return durata <= 0 ? 1 : clamp((t - inizio) / durata, 0, 1);
}

/* ───────────────────────── Pareti mobili (due stati) ───────────────────────── */

export type Segmento = {
  /** Asse lungo cui corre la parete: 'x' (lunga quanto la larghezza) o 'z' (lunga quanto la profondità). */
  asse: "x" | "z";
  /** Posizione sull'altro asse come frazione 0..1 del lato (0 = lato z/x negativo). */
  frazione: number;
  /** Numero di pannelli del segmento (fissato sul telaio di arrivo, costante durante i tween). */
  pannelli: number;
};

export type SchemaPareti = { parti: number; segmenti: Segmento[]; pannelli: number };

/**
 * Schema INDICATIVO delle pareti mobili (UX 7.2): la sala si divide in `parti` parti UGUALI.
 * 8 -> 4 x 2 (3 pareti da larghezza + 1 da profondità), 5 -> 5 x 1 (4 pareti): sono gli unici
 * numeri dichiarati (Costellazioni 8, Divinità 5). Le sale reali hanno misure diverse: nessuna
 * capienza per le parti.
 */
export function schemaPareti(parti: number, larghezza: number, profondita: number): SchemaPareti {
  let corto = Math.floor(Math.sqrt(parti));
  while (corto > 1 && parti % corto !== 0) corto--;
  const lungo = parti / corto;
  const segmenti: Segmento[] = [];
  for (let j = 1; j < lungo; j++) {
    segmenti.push({ asse: "x", frazione: j / lungo, pannelli: Math.ceil(larghezza / OGGETTI.pannello.larghezza) });
  }
  for (let j = 1; j < corto; j++) {
    segmenti.push({ asse: "z", frazione: j / corto, pannelli: Math.ceil(profondita / OGGETTI.pannello.larghezza) });
  }
  return { parti, segmenti, pannelli: segmenti.reduce((s, g) => s + g.pannelli, 0) };
}

/** Spessore dei muri perimetrali (m): le tasche dei pannelli stanno lì dentro. */
export const SPESSORE_MURO = 0.6;

/**
 * Matrici dei pannelli per `w` in 0..1. A `w = 0` (sala unita) i pannelli sono ritirati a
 * pacchetto nella tasca del muro perimetrale, oltre la faccia interna: non si vedono. Con `w`
 * crescente escono dalla tasca (ruotati di 90°, di taglio), scorrono lungo il binario e si
 * raddrizzano arrivando; a `w = 1` (sala divisa) sono allineati e senza buchi. Il pannello più
 * lontano dalla tasca parte per primo (ritardo fino al 40% di `w`), come in un binario vero.
 * Le pareti lungo x sono ritirate nel muro laterale, quelle lungo z nel muro del palco.
 * Funzione pura di `w`. `out` ha 16 x pannelli float; restituisce quanti pannelli ha scritto.
 */
export function scriviPannelli(
  out: Float32Array,
  w: number,
  schema: SchemaPareti,
  larghezza: number,
  profondita: number,
  altezza: number,
): number {
  let i = 0;
  const sp = OGGETTI.pannello.spessore;
  for (const g of schema.segmenti) {
    const L = g.asse === "x" ? larghezza : profondita;
    const n = g.pannelli;
    const lp = L / n;
    const passo = Math.min(0.03, (SPESSORE_MURO - 0.12) / n);
    const centro = g.asse === "x" ? -profondita / 2 + g.frazione * profondita : -larghezza / 2 + g.frazione * larghezza;
    for (let j = 0; j < n; j++) {
      const uBinario = -L / 2 + (j + 0.5) * lp;
      // il pannello più lontano (j grande) sta davanti nella tasca, così esce per primo
      const uPacco = -L / 2 - (0.06 + (n - 1 - j) * passo);
      const lontananza = Math.min(1, Math.abs(uBinario - uPacco) / (L + SPESSORE_MURO));
      const wp = clamp((w - (1 - lontananza) * 0.4) / 0.6, 0, 1);
      const u = lerp(uPacco, uBinario, easeIn(clamp(wp / 0.7, 0, 1)));
      const rot = (g.asse === "x" ? 0 : PI / 2) + lerp(PI / 2, 0, easeIn(clamp((wp - 0.3) / 0.7, 0, 1)));
      const x = g.asse === "x" ? u : centro;
      const z = g.asse === "x" ? centro : u;
      scriviMatrice(out, i++, x, 0, z, rot, lp, altezza - 0.02, sp);
    }
  }
  return i;
}

/* ───────────────────────── Camera: distanza che inquadra la sala ───────────────────────── */

/**
 * Distanza della camera (m) per cui il parallelepipedo della sala (A x h x B, centrato in x e z,
 * con il pavimento a y = 0) sta dentro l'inquadratura, vista da `az`/`pol` (gradi, stessa
 * convenzione di `VistaCamera`: pol 0 = dall'alto) guardando `bersaglio`. Esatta per ogni angolo:
 * per ogni angolo del parallelepipedo si cerca la distanza minima per cui la sua proiezione resta
 * entro `riempimento` (0..1) della metà dell'inquadratura. `fov` verticale in gradi.
 */
export function distanzaVista(
  larghezza: number,
  profondita: number,
  altezza: number,
  {
    az,
    pol,
    fov,
    aspetto,
    riempimento = 0.9,
    bersaglio = [0, 0.6, 0],
  }: { az: number; pol: number; fov: number; aspetto: number; riempimento?: number; bersaglio?: readonly [number, number, number] },
): number {
  const a = (az * PI) / 180;
  const p = (pol * PI) / 180;
  // direzione dal bersaglio alla camera, destra e su della camera
  const dir = [Math.sin(p) * Math.sin(a), Math.cos(p), Math.sin(p) * Math.cos(a)];
  const su0 = [0, 1, 0];
  // right = normalize(cross(-dir, su0)) = normalize(cross(su0, dir))
  let rx = su0[1] * dir[2] - su0[2] * dir[1];
  let ry = su0[2] * dir[0] - su0[0] * dir[2];
  let rz = su0[0] * dir[1] - su0[1] * dir[0];
  const rl = Math.hypot(rx, ry, rz) || 1;
  rx /= rl;
  ry /= rl;
  rz /= rl;
  // up = cross(dir, right)
  const ux = dir[1] * rz - dir[2] * ry;
  const uy = dir[2] * rx - dir[0] * rz;
  const uz = dir[0] * ry - dir[1] * rx;
  const tv = Math.tan((fov * PI) / 360);
  const th = tv * aspetto;
  let D = 0;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (const y of [0, altezza]) {
        const cx = (sx * larghezza) / 2 - bersaglio[0];
        const cy = y - bersaglio[1];
        const cz = (sz * profondita) / 2 - bersaglio[2];
        const xv = cx * rx + cy * ry + cz * rz;
        const yv = cx * ux + cy * uy + cz * uz;
        const dv = -(cx * dir[0] + cy * dir[1] + cz * dir[2]); // profondità aggiunta rispetto al bersaglio
        D = Math.max(D, Math.abs(xv) / (riempimento * th) - dv, Math.abs(yv) / (riempimento * tv) - dv);
      }
    }
  }
  return D;
}
