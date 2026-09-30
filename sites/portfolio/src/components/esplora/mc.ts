/**
 * SIMULATORE MONTE CARLO: il calcolo (nella pagina, a pezzi, senza worker:
 * nell'anteprima di Claude la pagina gira in un riquadro protetto che non
 * lascia partire i worker, e il simulatore restava fermo su "Calcolo in corso").
 *
 * Davide: chi guarda sceglie la discesa massima che accetta e la strategia (o
 * tutte e tre insieme); il simulatore trova il rischio per operazione di
 * ciascuna perche', nel 95% delle simulazioni, la discesa resti entro quel
 * limite; i rischi si arrotondano SEMPRE per eccesso a passi dello 0,10%.
 *
 * I quattro metodi sono quelli di tools/montecarlo.py (la ricerca), sulle
 * operazioni in ordine di tempo della scelta:
 *   permutazione  stesse operazioni, ordine diverso
 *   bootstrap     ripescate con rimpiazzo, una per una
 *   blocchi       ripescate a blocchi di 20 (le serie di perdite restano)
 *   rimozione     tolta un'operazione su dieci a caso
 * Il limite vale per il PEGGIORE dei quattro (il 95° percentile di ognuno).
 * Orizzonte: tante operazioni quante lo storico (circa 7 anni e 9 mesi).
 *
 * Divisione del rischio fra le strategie: in proporzione inversa alla discesa
 * tipica di ciascuna da sola (95° percentile in R del bootstrap a blocchi): chi
 * scende di piu' rischia meno. Nessun peso scelto guardando i guadagni: il fuori
 * campione e' gia' speso, un'ottimizzazione sui rendimenti sarebbe solo
 * adattamento al passato. Un solo fattore alza o abbassa tutti i rischi insieme
 * (bisezione) finche' la discesa al 95% del metodo peggiore tocca il limite.
 *
 * Il ventaglio del grafico usa il bootstrap a blocchi (il metodo a cui la
 * ricerca crede: non spezza le serie di perdite), con i rischi arrotondati.
 */
export const N = 500; // simulazioni per metodo
const BLOCCO = 20;
const PCT = 0.95;
const PASSO = 0.001; // 0,10%
export const METODI = ["permutazione", "bootstrap", "blocchi", "rimozione"] as const;
export type MetodoId = (typeof METODI)[number];
const PUNTI = 140; // punti del ventaglio lungo l'orizzonte

export type Metodo = { chiave: MetodoId; p50: number; p95: number; oltre: number };
export type Ventaglio = {
  /** una riga per percentile: 5, 25, 50, 75, 95 — valori in % rispetto al capitale iniziale */
  p: Record<"p5" | "p25" | "p50" | "p75" | "p95", Float32Array>;
  /** alcune simulazioni intere, per vederle */
  campioni: Float32Array[];
  /** lo storico vero, in ordine */
  storico: Float32Array;
};
export type Esito = {
  esatti: number[];
  rischi: number[];
  metodi: Metodo[];
  p95: number;
  peggiore: MetodoId;
  oltre: number;
  storicoDD: number;
  n: number;
  ventaglio: Ventaglio;
  /** discese massime delle simulazioni del metodo peggiore (per l'istogramma) */
  discese: Float32Array;
};

/* generatore con seme: a parita' di scelte, stesso risultato */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blocchiIdx(n: number, rnd: () => number) {
  const idx = new Uint16Array(n);
  let k = 0;
  while (k < n) {
    const s = Math.floor(rnd() * n);
    for (let j = 0; j < BLOCCO && k < n; j++) idx[k++] = (s + j) % n;
  }
  return idx;
}

function percorsi(n: number, seme: number) {
  const out = {} as Record<MetodoId, Uint16Array[]>;
  METODI.forEach((m, mi) => {
    const rnd = rng(seme * 131 + mi * 7919 + n);
    const list: Uint16Array[] = [];
    for (let p = 0; p < N; p++) {
      let idx: Uint16Array;
      if (m === "permutazione") {
        idx = new Uint16Array(n);
        for (let i = 0; i < n; i++) idx[i] = i;
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          const t = idx[i];
          idx[i] = idx[j];
          idx[j] = t;
        }
      } else if (m === "bootstrap") {
        idx = new Uint16Array(n);
        for (let i = 0; i < n; i++) idx[i] = Math.floor(rnd() * n);
      } else if (m === "blocchi") {
        idx = blocchiIdx(n, rnd);
      } else {
        const tmp: number[] = [];
        for (let i = 0; i < n; i++) if (rnd() > 0.1) tmp.push(i);
        idx = Uint16Array.from(tmp);
      }
      list.push(idx);
    }
    out[m] = list;
  });
  return out;
}

export function quantile(v: ArrayLike<number>, q: number) {
  const a = Float64Array.from(v).sort();
  const k = (a.length - 1) * q;
  const lo = Math.floor(k);
  const hi = Math.min(lo + 1, a.length - 1);
  return a[lo] + (a[hi] - a[lo]) * (k - lo);
}

/* discesa massima (frazione) a rischio composto; rw[i] = rischio della sua strategia x R */
function ddPercorso(idx: Uint16Array, rw: Float64Array, k: number) {
  let cap = 1;
  let picco = 1;
  let dd = 0;
  for (let i = 0; i < idx.length; i++) {
    cap *= 1 + k * rw[idx[i]];
    if (cap <= 0) return 1;
    if (cap > picco) picco = cap;
    else {
      const d = 1 - cap / picco;
      if (d > dd) dd = d;
    }
  }
  return dd;
}

/* discesa massima in R (somma semplice), per il peso di ogni strategia */
function ddR(idx: Uint16Array, r: number[]) {
  let acc = 0;
  let picco = 0;
  let dd = 0;
  for (let i = 0; i < idx.length; i++) {
    acc += r[idx[i]];
    if (acc > picco) picco = acc;
    else if (picco - acc > dd) dd = picco - acc;
  }
  return dd;
}

type Stat = Metodo & { dds: Float64Array };
function valuta(P: Record<MetodoId, Uint16Array[]>, rw: Float64Array, k: number, limite: number): Stat[] {
  return METODI.map((m) => {
    const dds = Float64Array.from(P[m], (idx) => ddPercorso(idx, rw, k));
    let oltre = 0;
    for (const d of dds) if (d > limite + 1e-12) oltre++;
    return { chiave: m, p50: quantile(dds, 0.5), p95: quantile(dds, PCT), oltre: oltre / dds.length, dds };
  });
}
const peggiore = (st: Stat[]) => st.reduce((a, b) => (b.p95 > a.p95 ? b : a));

/* il capitale lungo il percorso, in PUNTI tappe, in % rispetto all'inizio */
function curvaPunti(idx: Uint16Array, rw: Float64Array) {
  const out = new Float32Array(PUNTI);
  const n = idx.length;
  let cap = 1;
  let prossimo = 0;
  out[0] = 0;
  for (let i = 0; i < n; i++) {
    cap *= 1 + rw[idx[i]];
    if (cap < 0) cap = 0;
    const j = Math.round(((i + 1) / n) * (PUNTI - 1));
    while (prossimo < j) {
      prossimo++;
      out[prossimo] = (cap - 1) * 100;
    }
  }
  return out;
}

const pausa = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Tutto il calcolo, a pezzi (una pausa dopo ogni passo pesante: la pagina resta viva).
 * `fermo()` vero = e' partito un altro calcolo, questo si abbandona.
 */
export async function simula(
  opz: { r: ArrayLike<number>; s: ArrayLike<number>; on: boolean[]; limite: number; seme: number },
  avanzamento: (x: number) => void,
  fermo: () => boolean,
): Promise<Esito | null> {
  const { on, limite, seme } = opz;
  const R: number[] = [];
  const S: number[] = [];
  for (let i = 0; i < opz.r.length; i++)
    if (on[opz.s[i]]) {
      R.push(opz.r[i]);
      S.push(opz.s[i]);
    }
  const n = R.length;
  avanzamento(0.02);
  await pausa();
  if (fermo()) return null;
  const P = percorsi(n, seme);
  avanzamento(0.1);
  await pausa();
  if (fermo()) return null;

  // 1) peso di ogni strategia: inverso della sua discesa al 95% in R (blocchi, da sola)
  const peso = on.map(() => 0);
  for (let k = 0; k < on.length; k++) {
    if (!on[k]) continue;
    const rk = R.filter((_, i) => S[i] === k);
    const rnd = rng(99 + k + seme * 17);
    const dds = new Float64Array(N);
    for (let p = 0; p < N; p++) dds[p] = ddR(blocchiIdx(rk.length, rnd), rk);
    peso[k] = 1 / Math.max(quantile(dds, PCT), 1e-6);
  }
  const attivi = peso.filter((x) => x > 0).length;
  const media = peso.reduce((a, b) => a + b, 0) / attivi;
  for (let k = 0; k < peso.length; k++) peso[k] /= media;

  // 2) un solo fattore per tutti: bisezione sulla discesa al 95% del metodo peggiore
  const rw = Float64Array.from(R, (x, i) => peso[S[i]] * x);
  let passi = 0;
  const f = async (k: number) => {
    const v = peggiore(valuta(P, rw, k, limite)).p95;
    passi++;
    avanzamento(0.12 + Math.min(0.75, passi * 0.035));
    await pausa();
    return v;
  };
  let lo = 0;
  let hi = 0.005;
  while ((await f(hi)) < limite && hi < 0.2) {
    if (fermo()) return null;
    lo = hi;
    hi *= 2;
  }
  for (let it = 0; it < 15; it++) {
    if (fermo()) return null;
    const mid = (lo + hi) / 2;
    if ((await f(mid)) < limite) lo = mid;
    else hi = mid;
  }
  const esatti = peso.map((w) => w * lo);

  // 3) arrotondamento per eccesso a passi dello 0,10%, e verifica con i rischi arrotondati
  const rischi = esatti.map((x, k) => (on[k] ? Math.max(1, Math.ceil(x / PASSO - 1e-9)) * PASSO : 0));
  const rwFin = Float64Array.from(R, (x, i) => rischi[S[i]] * x);
  const stat = valuta(P, rwFin, 1, limite);
  const pg = peggiore(stat);
  avanzamento(0.92);
  await pausa();
  if (fermo()) return null;

  // 4) il ventaglio (blocchi) e lo storico vero
  const curve = P.blocchi.map((idx) => curvaPunti(idx, rwFin));
  const col = new Float64Array(curve.length);
  const mk = () => new Float32Array(PUNTI);
  const p = { p5: mk(), p25: mk(), p50: mk(), p75: mk(), p95: mk() };
  for (let j = 0; j < PUNTI; j++) {
    for (let c = 0; c < curve.length; c++) col[c] = curve[c][j];
    const a = Float64Array.from(col).sort();
    const q = (x: number) => {
      const t = (a.length - 1) * x;
      const l = Math.floor(t);
      const h = Math.min(l + 1, a.length - 1);
      return a[l] + (a[h] - a[l]) * (t - l);
    };
    p.p5[j] = q(0.05);
    p.p25[j] = q(0.25);
    p.p50[j] = q(0.5);
    p.p75[j] = q(0.75);
    p.p95[j] = q(0.95);
  }
  const tutti = Uint16Array.from({ length: n }, (_, i) => i);
  const storico = curvaPunti(tutti, rwFin);
  const storicoDD = ddPercorso(tutti, rwFin, 1);
  avanzamento(1);

  return {
    esatti,
    rischi,
    metodi: stat.map(({ chiave, p50, p95, oltre }) => ({ chiave, p50, p95, oltre })),
    p95: pg.p95,
    peggiore: pg.chiave,
    oltre: pg.oltre,
    storicoDD,
    n,
    ventaglio: { p, campioni: curve.slice(0, 36), storico },
    discese: Float32Array.from(pg.dds),
  };
}
