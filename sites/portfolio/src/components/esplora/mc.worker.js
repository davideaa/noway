/**
 * SIMULATORE MONTE CARLO (worker: il calcolo non blocca la pagina).
 *
 * Davide: "ognuno decide la discesa massima che accetta; nel 95% dei casi,
 * con i vari Monte Carlo tutti insieme, la discesa deve restare entro quel
 * limite; in base a quello e ai risultati delle strategie si settano i rischi
 * su ognuna, arrotondati a passi di 0,10".
 *
 * I quattro metodi sono quelli di tools/montecarlo.py (la ricerca), sulle
 * operazioni in ordine di tempo delle strategie scelte:
 *   permutazione  stesse operazioni, ordine diverso
 *   bootstrap     ripescate con rimpiazzo, una per una
 *   blocchi       ripescate a blocchi di 20 (le serie di perdite restano)
 *   rimozione     tolta un'operazione su dieci a caso
 * Il limite vale per il PEGGIORE dei quattro: il 95° percentile di ognuno deve
 * stare sotto. Orizzonte: tante operazioni quante lo storico (circa 7 anni e 9 mesi).
 *
 * Divisione del rischio fra le strategie: in proporzione inversa alla discesa
 * tipica di ciascuna da sola (95° percentile in R del bootstrap a blocchi):
 * chi scende di piu' rischia meno. Nessun peso scelto guardando i guadagni:
 * il fuori campione e' gia' speso, un'ottimizzazione sui rendimenti qui
 * sarebbe solo adattamento al passato.
 * Poi un solo fattore alza o abbassa tutti i rischi insieme (bisezione) finche'
 * la discesa al 95% del metodo peggiore tocca il limite. Infine l'arrotondamento
 * a passi dello 0,10% (per eccesso, come chiesto, o per difetto) e un'ultima
 * simulazione con i rischi arrotondati: quella e' la discesa che si mostra.
 *
 * Messaggio: { id, r: Float64Array, s: Uint8Array, on: boolean[], limite (0..1), giu: boolean }
 * Risposta:  { id, esatti[], rischi[], metodi[{ chiave, p50, p95, oltre }], p95, peggiore, storico, pesiR[] }
 */

const N = 500; // percorsi per metodo
const BLOCCO = 20;
const PCT = 0.95;
const PASSO = 0.001; // 0,10%
const METODI = ["permutazione", "bootstrap", "blocchi", "rimozione"];

/* generatore con seme: stessi numeri a ogni calcolo, il risultato non "balla" */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* percorsi di indici per ogni metodo (dipendono solo da quante operazioni ci sono) */
function percorsi(n) {
  const out = {};
  METODI.forEach((m, mi) => {
    const rnd = rng(1234 + mi * 7919 + n);
    const list = [];
    for (let p = 0; p < N; p++) {
      let idx;
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
        idx = new Uint16Array(n);
        let k = 0;
        while (k < n) {
          const s = Math.floor(rnd() * n);
          for (let j = 0; j < BLOCCO && k < n; j++) idx[k++] = (s + j) % n;
        }
      } else {
        const tmp = [];
        for (let i = 0; i < n; i++) if (rnd() > 0.1) tmp.push(i);
        idx = Uint16Array.from(tmp);
      }
      list.push(idx);
    }
    out[m] = list;
  });
  return out;
}

function quantile(v, q) {
  const a = Float64Array.from(v).sort();
  const k = (a.length - 1) * q;
  const lo = Math.floor(k);
  const hi = Math.min(lo + 1, a.length - 1);
  return a[lo] + (a[hi] - a[lo]) * (k - lo);
}

/* discesa massima (frazione) a rischio composto: rw[i] = rischio della sua strategia x R */
function ddPercorso(idx, rw, k) {
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
function ddR(idx, r) {
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

let cache = { key: "", P: null, R: null, S: null };

function prepara(r, s, on) {
  const key = on.map((x) => (x ? 1 : 0)).join("");
  if (cache.key === key) return cache;
  const R = [];
  const S = [];
  for (let i = 0; i < r.length; i++)
    if (on[s[i]]) {
      R.push(r[i]);
      S.push(s[i]);
    }
  cache = { key, P: percorsi(R.length), R: Float64Array.from(R), S: Uint8Array.from(S) };
  return cache;
}

/* le statistiche di tutti i metodi a un dato fattore k */
function valuta(P, rw, k, limite) {
  return METODI.map((m) => {
    const dds = P[m].map((idx) => ddPercorso(idx, rw, k));
    let oltre = 0;
    for (const d of dds) if (d > limite) oltre++;
    return { chiave: m, p50: quantile(dds, 0.5), p95: quantile(dds, PCT), oltre: oltre / dds.length };
  });
}
const peggiore = (st) => st.reduce((a, b) => (b.p95 > a.p95 ? b : a));

self.onmessage = (e) => {
  const { id, r, s, on, limite, giu } = e.data;
  const { P, R, S } = prepara(r, s, on);
  const nStrat = on.length;

  // 1) peso di ogni strategia: inverso della sua discesa al 95% in R (blocchi, da sola)
  const pesiR = new Array(nStrat).fill(0);
  const peso = new Array(nStrat).fill(0);
  for (let k = 0; k < nStrat; k++) {
    if (!on[k]) continue;
    const rk = [];
    for (let i = 0; i < R.length; i++) if (S[i] === k) rk.push(R[i]);
    const rnd = rng(99 + k);
    const n = rk.length;
    const dds = [];
    for (let p = 0; p < N; p++) {
      const idx = new Uint16Array(n);
      let q = 0;
      while (q < n) {
        const st = Math.floor(rnd() * n);
        for (let j = 0; j < BLOCCO && q < n; j++) idx[q++] = (st + j) % n;
      }
      dds.push(ddR(idx, rk));
    }
    pesiR[k] = quantile(dds, PCT);
    peso[k] = 1 / Math.max(pesiR[k], 1e-6);
  }
  const attivi = peso.filter((x) => x > 0).length;
  const media = peso.reduce((a, b) => a + b, 0) / attivi;
  for (let k = 0; k < nStrat; k++) peso[k] /= media; // media 1: k e' il rischio "medio"

  // 2) un solo fattore per tutti: bisezione sulla discesa al 95% del metodo peggiore
  const rwPer = (pesi) => {
    const rw = new Float64Array(R.length);
    for (let i = 0; i < R.length; i++) rw[i] = pesi[S[i]] * R[i];
    return rw;
  };
  const rw = rwPer(peso);
  const f = (k) => peggiore(valuta(P, rw, k, limite)).p95;
  let lo = 0;
  let hi = 0.005;
  while (f(hi) < limite && hi < 0.2) {
    lo = hi;
    hi *= 2;
  }
  for (let it = 0; it < 16; it++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < limite) lo = mid;
    else hi = mid;
  }
  const kEsatto = lo;
  const esatti = peso.map((w) => w * kEsatto);

  // 3) arrotondamento a passi dello 0,10% e simulazione finale con i rischi arrotondati
  const rischi = esatti.map((x, k) => {
    if (!on[k]) return 0;
    const n = x / PASSO;
    const q = giu ? Math.floor(n + 1e-9) : Math.ceil(n - 1e-9);
    return Math.max(1, q) * PASSO;
  });
  const rwFin = new Float64Array(R.length);
  for (let i = 0; i < R.length; i++) rwFin[i] = rischi[S[i]] * R[i];
  const metodi = valuta(P, rwFin, 1, limite);
  const pg = peggiore(metodi);

  // 4) lo storico vero, in ordine, con gli stessi rischi
  const tutti = new Uint16Array(R.length);
  for (let i = 0; i < R.length; i++) tutti[i] = i;
  const storico = ddPercorso(tutti, rwFin, 1);

  self.postMessage({ id, esatti, rischi, metodi, p95: pg.p95, peggiore: pg.chiave, oltre: pg.oltre, storico, pesiR, n: R.length });
};
