/**
 * SIMULATORE MONTE CARLO: il calcolo (nella pagina, a pezzi, senza worker:
 * nell'anteprima di Claude la pagina gira in un riquadro protetto che non
 * lascia partire i worker).
 *
 * Davide: chi guarda sceglie capitale, discesa massima accettata, strategia (o
 * tutte e tre), anni, e su quali dati simulare (tutto, senza l'anno migliore,
 * solo 2019–2023, solo 2024–2026); il simulatore trova il rischio per
 * operazione di ciascuna perche', nel 95% delle simulazioni, la discesa resti
 * entro il limite sugli anni scelti; i rischi si arrotondano SEMPRE per eccesso
 * a passi dello 0,10%. Poi mostra cosa aspettarsi, a rischio composto, a rischio
 * fisso e in R.
 *
 * Dati: periodi di calendario uguali per tutte e tre (cosi' il rimescolamento
 * mette insieme operazioni dello stesso arco di tempo):
 *   tutto     2019.01–2026.09
 *   dentro    2019.01–2023.12  (gli anni dell'ottimizzazione di XAUUSD e Nasdaq; USDJPY fino al 2022)
 *   fuori     2024.01–2026.09  (fuori campione per tutte e tre)
 *   senza     tutto, ma senza l'anno migliore di ciascuna strategia (per somma di R)
 *
 * I quattro metodi sono quelli di tools/montecarlo.py (la ricerca), su
 * sequenze lunghe quanto gli anni scelti (operazioni all'anno x anni):
 *   permutazione  stesse operazioni, ordine diverso (senza rimpiazzo)
 *   bootstrap     ripescate con rimpiazzo, una per una
 *   blocchi       ripescate a blocchi di 20 (le serie di perdite restano)
 *   rimozione     un tratto vero, in ordine, con un'operazione su dieci tolta
 * Il limite vale per il PEGGIORE dei quattro (il 95° percentile di ognuno).
 *
 * Divisione del rischio fra le strategie: in proporzione inversa alla discesa
 * tipica di ciascuna da sola (95° percentile in R del bootstrap a blocchi): chi
 * scende di piu' rischia meno. Nessun peso scelto guardando i guadagni (il fuori
 * campione e' gia' speso). Un solo fattore alza o abbassa tutti i rischi insieme
 * (bisezione) finche' la discesa al 95% del metodo peggiore tocca il limite.
 * I rischi si calcolano sempre a rischio composto.
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
export type Periodo = "tutto" | "fuori" | "dentro" | "senza";
export type Misura = "composto" | "fisso" | "R";
export const MISURE: Misura[] = ["composto", "fisso", "R"];
const NCAMPIONI = 60;

export type Metodo = { chiave: MetodoId; p50: number; p95: number; oltre: number };
/** per ogni misura: percentili mese per mese, alcune simulazioni intere, lo storico */
export type Serie = {
  p5: Float32Array;
  p25: Float32Array;
  p50: Float32Array;
  p75: Float32Array;
  p95: Float32Array;
  campioni: Float32Array[];
  /** lo storico vero dei dati scelti (NaN dove i dati finiscono prima degli anni scelti) */
  storico: Float32Array;
  /** quota di simulazioni che finiscono sotto zero */
  perdita: number;
};
/** le discese da aspettarsi sugli anni scelti (simulazioni a blocchi), nella misura */
export type Discese = {
  /** discesa massima tipica (mediana) e al 95%: % dal punto piu' alto (in R per R) */
  p50: number;
  p95: number;
  /** quante volte, in media, si scende oltre la soglia (10% o 10 R) prima di tornare al massimo */
  volte: number;
  soglia: number;
};
export type Esito = {
  esatti: number[];
  rischi: number[];
  metodi: Metodo[];
  p95: number;
  peggiore: MetodoId;
  oltre: number;
  /** discese massime delle simulazioni del metodo peggiore */
  discese: Float32Array;
  /** valori in %: composto e fisso rispetto al capitale iniziale; R in R */
  serie: Record<Misura, Serie>;
  anni: number;
  /** anni di dati usati (per avvisare se si simula oltre) */
  anniDati: number;
  nOrizzonte: number;
  nDati: number;
  /** l'anno tolto per ogni strategia (solo "senza") */
  tolti: (string | null)[];
  attese: Record<Misura, Discese>;
};

/* generatore con seme */
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

function blocchiIdx(n: number, len: number, rnd: () => number) {
  const idx = new Uint16Array(len);
  let k = 0;
  while (k < len) {
    const s = Math.floor(rnd() * n);
    for (let j = 0; j < BLOCCO && k < len; j++) idx[k++] = (s + j) % n;
  }
  return idx;
}

/* percorsi di indici lunghi `len` (l'orizzonte) su un campione di `n` operazioni */
function percorsi(n: number, len: number, seme: number) {
  const out = {} as Record<MetodoId, Uint16Array[]>;
  METODI.forEach((m, mi) => {
    const rnd = rng(seme * 131 + mi * 7919 + n + len * 3);
    const list: Uint16Array[] = [];
    for (let p = 0; p < N; p++) {
      let idx: Uint16Array;
      if (m === "permutazione") {
        idx = new Uint16Array(len);
        const perm = new Uint16Array(n);
        let k = 0;
        while (k < len) {
          for (let i = 0; i < n; i++) perm[i] = i;
          for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            const t = perm[i];
            perm[i] = perm[j];
            perm[j] = t;
          }
          for (let i = 0; i < n && k < len; i++) idx[k++] = perm[i];
        }
      } else if (m === "bootstrap") {
        idx = new Uint16Array(len);
        for (let i = 0; i < len; i++) idx[i] = Math.floor(rnd() * n);
      } else if (m === "blocchi") {
        idx = blocchiIdx(n, len, rnd);
      } else {
        const s = Math.floor(rnd() * n);
        const tmp: number[] = [];
        for (let i = 0; i < len; i++) if (rnd() > 0.1) tmp.push((s + i) % n);
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

/* il percorso nelle tre misure, a tappe mensili: composto e fisso in %, R in R */
function curve3(idx: ArrayLike<number>, len: number, rw: Float64Array, R: number[], punti: number) {
  const c = new Float32Array(punti).fill(NaN);
  const f = new Float32Array(punti).fill(NaN);
  const r = new Float32Array(punti).fill(NaN);
  c[0] = 0;
  f[0] = 0;
  r[0] = 0;
  let cap = 1;
  let fis = 0;
  let sr = 0;
  let prossimo = 1;
  const n = idx.length;
  for (let i = 0; i < n; i++) {
    const x = idx[i];
    cap *= 1 + rw[x];
    if (cap < 0) cap = 0;
    fis += rw[x];
    sr += R[x];
    // la tappa dipende dalla posizione nell'orizzonte (len), non nel percorso: la rimozione e' piu' corta
    const pos = ((i + 1) / n) * (n / len) * (punti - 1);
    while (prossimo <= Math.round(pos) && prossimo < punti) {
      c[prossimo] = (cap - 1) * 100;
      f[prossimo] = fis * 100;
      r[prossimo] = sr;
      prossimo++;
    }
  }
  return { c, f, r };
}

function percentili(curve: Float32Array[], punti: number) {
  const mk = () => new Float32Array(punti);
  const p = { p5: mk(), p25: mk(), p50: mk(), p75: mk(), p95: mk() };
  const col = new Float64Array(curve.length);
  for (let j = 0; j < punti; j++) {
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
  return p;
}

const pausa = () => new Promise<void>((r) => setTimeout(r, 0));

/** i mesi (indici) dei dati scelti, e le operazioni tenute */
function filtra(
  opz: { r: ArrayLike<number>; s: ArrayLike<number>; m: ArrayLike<number>; mesi: string[]; on: boolean[]; periodo: Periodo },
) {
  const { mesi, on, periodo } = opz;
  const i2024 = mesi.indexOf("2024-01");
  const nStrat = on.length;
  const tolti: (string | null)[] = new Array(nStrat).fill(null);
  if (periodo === "senza") {
    for (let k = 0; k < nStrat; k++) {
      if (!on[k]) continue;
      const somma = new Map<string, number>();
      for (let i = 0; i < opz.r.length; i++)
        if (opz.s[i] === k) {
          const a = mesi[opz.m[i]].slice(0, 4);
          somma.set(a, (somma.get(a) ?? 0) + opz.r[i]);
        }
      let best: string | null = null;
      somma.forEach((v, a) => {
        if (best === null || v > (somma.get(best) ?? -Infinity)) best = a;
      });
      tolti[k] = best;
    }
  }
  const tiene = (i: number) => {
    const k = opz.s[i];
    if (!on[k]) return false;
    const mi = opz.m[i];
    if (periodo === "fuori") return mi >= i2024;
    if (periodo === "dentro") return mi < i2024;
    if (periodo === "senza") return mesi[mi].slice(0, 4) !== tolti[k];
    return true;
  };
  // mesi di dati per ogni strategia (per le operazioni all'anno)
  const mesiDi = (k: number) => {
    let tot = 0;
    for (let mi = 0; mi < mesi.length; mi++) {
      if (periodo === "fuori" && mi < i2024) continue;
      if (periodo === "dentro" && mi >= i2024) continue;
      if (periodo === "senza" && mesi[mi].slice(0, 4) === tolti[k]) continue;
      tot++;
    }
    return tot;
  };
  const R: number[] = [];
  const S: number[] = [];
  for (let i = 0; i < opz.r.length; i++)
    if (tiene(i)) {
      R.push(opz.r[i]);
      S.push(opz.s[i]);
    }
  return { R, S, tolti, mesiDi };
}

/**
 * Tutto il calcolo, a pezzi (una pausa dopo ogni passo pesante: la pagina resta viva).
 * `fermo()` vero = e' partito un altro calcolo, questo si abbandona.
 */
export async function simula(
  opz: {
    r: ArrayLike<number>;
    s: ArrayLike<number>;
    m: ArrayLike<number>;
    mesi: string[];
    on: boolean[];
    limite: number;
    anni: number;
    periodo: Periodo;
    seme: number;
  },
  avanzamento: (x: number) => void,
  fermo: () => boolean,
): Promise<Esito | null> {
  const { on, limite, seme, anni } = opz;
  const { R, S, tolti, mesiDi } = filtra(opz);
  const n = R.length;
  const nStrat = on.length;

  // operazioni all'anno di ogni strategia, e lunghezza dell'orizzonte
  const perAnno = on.map((o, k) => {
    if (!o) return 0;
    const nk = S.filter((x) => x === k).length;
    return nk / (mesiDi(k) / 12);
  });
  const len = Math.max(20, Math.round(perAnno.reduce((a, b) => a + b, 0) * anni));
  const mesiUsati = Math.max(...on.map((o, k) => (o ? mesiDi(k) : 0)));
  avanzamento(0.03);
  await pausa();
  if (fermo()) return null;
  const P = percorsi(n, len, seme);
  avanzamento(0.1);
  await pausa();
  if (fermo()) return null;

  // 1) peso di ogni strategia: inverso della sua discesa al 95% in R (blocchi, da sola, sugli stessi anni)
  const peso = on.map(() => 0);
  for (let k = 0; k < nStrat; k++) {
    if (!on[k]) continue;
    const rk = R.filter((_, i) => S[i] === k);
    const rnd = rng(99 + k + seme * 17);
    const lk = Math.max(20, Math.round(perAnno[k] * anni));
    const dds = new Float64Array(N);
    for (let p = 0; p < N; p++) dds[p] = ddR(blocchiIdx(rk.length, lk, rnd), rk);
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
    avanzamento(0.12 + Math.min(0.72, passi * 0.034));
    await pausa();
    return v;
  };
  let lo = 0;
  let hi = 0.005;
  while ((await f(hi)) < limite && hi < 0.25) {
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
  avanzamento(0.9);
  await pausa();
  if (fermo()) return null;

  // 4) il ventaglio (blocchi) nelle tre misure, mese per mese, e lo storico
  const punti = Math.round(anni * 12) + 1;
  const cc: Float32Array[] = [];
  const ff: Float32Array[] = [];
  const rr: Float32Array[] = [];
  for (const idx of P.blocchi) {
    const k3 = curve3(idx, len, rwFin, R, punti);
    cc.push(k3.c);
    ff.push(k3.f);
    rr.push(k3.r);
  }
  // lo storico vero: le operazioni dei dati scelti in ordine, per quanto bastano
  const nSto = Math.min(n, len);
  const sto = curve3(Uint16Array.from({ length: nSto }, (_, i) => i), len, rwFin, R, punti);
  const fa = (curve: Float32Array[], storico: Float32Array): Serie => {
    let sotto = 0;
    for (const c of curve) if (c[punti - 1] < 0) sotto++;
    return { ...percentili(curve, punti), campioni: curve.slice(0, NCAMPIONI), storico, perdita: sotto / curve.length };
  };
  const serie = { composto: fa(cc, sto.c), fisso: fa(ff, sto.f), R: fa(rr, sto.r) };

  // le discese da aspettarsi, operazione per operazione, nelle tre misure
  const dd = { composto: [] as number[], fisso: [] as number[], R: [] as number[] };
  const volte = { composto: 0, fisso: 0, R: 0 };
  const SOGLIA = { composto: 0.1, fisso: 0.1, R: 10 };
  for (const idx of P.blocchi) {
    let c = 1;
    let pc = 1;
    let f = 1;
    let pf = 1;
    let r = 0;
    let pr = 0;
    let dc = 0;
    let df = 0;
    let dr = 0;
    const dentro = { composto: false, fisso: false, R: false };
    for (let i = 0; i < idx.length; i++) {
      const x = idx[i];
      c *= 1 + rwFin[x];
      f += rwFin[x];
      r += R[x];
      if (c > pc) {
        pc = c;
        dentro.composto = false;
      }
      if (f > pf) {
        pf = f;
        dentro.fisso = false;
      }
      if (r > pr) {
        pr = r;
        dentro.R = false;
      }
      const ec = 1 - c / pc;
      const ef = 1 - f / pf;
      const er = pr - r;
      if (ec > dc) dc = ec;
      if (ef > df) df = ef;
      if (er > dr) dr = er;
      // una discesa oltre la soglia conta una volta, finche' non si torna al massimo
      if (!dentro.composto && ec > SOGLIA.composto) {
        dentro.composto = true;
        volte.composto++;
      }
      if (!dentro.fisso && ef > SOGLIA.fisso) {
        dentro.fisso = true;
        volte.fisso++;
      }
      if (!dentro.R && er > SOGLIA.R) {
        dentro.R = true;
        volte.R++;
      }
    }
    dd.composto.push(dc * 100);
    dd.fisso.push(df * 100);
    dd.R.push(dr);
  }
  const attesa = (k: Misura): Discese => ({
    p50: quantile(dd[k], 0.5),
    p95: quantile(dd[k], PCT),
    volte: volte[k] / P.blocchi.length,
    soglia: k === "R" ? SOGLIA.R : SOGLIA[k] * 100,
  });
  const attese = { composto: attesa("composto"), fisso: attesa("fisso"), R: attesa("R") };
  avanzamento(1);

  return {
    esatti,
    rischi,
    metodi: stat.map(({ chiave, p50, p95, oltre }) => ({ chiave, p50, p95, oltre })),
    p95: pg.p95,
    peggiore: pg.chiave,
    oltre: pg.oltre,
    discese: Float32Array.from(pg.dds),
    serie,
    anni,
    anniDati: mesiUsati / 12,
    nOrizzonte: len,
    nDati: n,
    tolti,
    attese,
  };
}

/**
 * I BENCHMARK nel simulatore (Davide): l'andamento VERO degli indici S&P 500 e
 * Nasdaq-100 dal 1° gennaio 2019, per gli anni scelti (1 anno = 2019, 2 anni =
 * 2019–2020, … 7 anni = 2019–2025), come se il capitale fosse stato investito
 * il primo giorno. Niente rimescolamento: e' quello che e' successo davvero.
 * Valori in % rispetto all'inizio, a fine mese (stessa griglia del ventaglio).
 */
export function benchmarkStorico(etf: { nome: string; c: number[]; n: number[] }[], mesi: string[], anni: number) {
  const punti = Math.round(anni * 12) + 1;
  return etf.map((e) => {
    const v = new Float32Array(punti).fill(NaN);
    v[0] = 0;
    let acc = 0;
    for (let k = 1; k < punti && k - 1 < e.n.length; k++) {
      acc += e.n[k - 1];
      v[k] = (e.c[acc] / e.c[0] - 1) * 100; // c[0] = chiusura del 31/12/2018
    }
    const ultimo = Math.min(punti - 1, e.n.length);
    return { nome: e.nome, v, fino: mesi[ultimo - 1] };
  });
}
