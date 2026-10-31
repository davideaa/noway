/**
 * Calcoli delle pagine strategia, tutti nel browser e tutti puri.
 *
 * Misure:
 *  - "R": somma dei risultati in R (1 R = quanto si perde se l'operazione va male);
 *  - "fisso": ogni operazione rischia la stessa cifra, calcolata sul capitale
 *    INIZIALE -> il risultato in % e' somma(R) x rischio;
 *  - "composto": ogni operazione rischia la stessa % del capitale DI QUEL
 *    MOMENTO -> capitale = prodotto(1 + rischio x R).
 * Drawdown: in R e a rischio fisso, discesa dal massimo precedente nella stessa
 * unita' (per il fisso: punti % del capitale iniziale); a rischio composto, %
 * persa dal massimo precedente.
 */
export type Misura = "R" | "fisso" | "composto";
export type Periodo = "tutto" | "dentro" | "fuori";

export type Ops = { r: number[]; m: number[]; s: number[]; fuori: boolean[] };

/** Il valore dopo ogni operazione, nella misura scelta. */
export function curva(r: number[], misura: Misura, rischio: number) {
  const v = new Array<number>(r.length);
  const dd = new Array<number>(r.length);
  let acc = 0;
  let cap = 1;
  let peak = 0;
  let peakCap = 1;
  for (let i = 0; i < r.length; i++) {
    if (misura === "composto") {
      cap *= 1 + rischio * r[i];
      if (cap > peakCap) peakCap = cap;
      v[i] = (cap - 1) * 100;
      dd[i] = (cap / peakCap - 1) * 100;
    } else {
      acc += r[i];
      const val = misura === "R" ? acc : acc * rischio * 100;
      if (val > peak) peak = val;
      v[i] = val;
      dd[i] = val - peak;
    }
  }
  return { v, dd };
}

/** Risultato di un gruppo di operazioni nella misura scelta (per gli anni, i periodi). */
export function totale(r: number[], misura: Misura, rischio: number) {
  if (misura === "composto") {
    let cap = 1;
    for (const x of r) cap *= 1 + rischio * x;
    return (cap - 1) * 100;
  }
  const s = r.reduce((a, b) => a + b, 0);
  return misura === "R" ? s : s * rischio * 100;
}

export function statistiche(r: number[]) {
  const n = r.length;
  let vinte = 0;
  let somma = 0;
  let serie = 0;
  let serieMax = 0;
  for (const x of r) {
    somma += x;
    if (x > 0) vinte++;
    if (x < 0) {
      serie++;
      if (serie > serieMax) serieMax = serie;
    } else serie = 0;
  }
  return { n, vinte: n ? (vinte / n) * 100 : 0, somma, media: n ? somma / n : 0, perditeDiFila: serieMax };
}

/** Somma per mese (indice del mese -> R). */
export function perMese(r: number[], m: number[]) {
  const out = new Map<number, number>();
  for (let i = 0; i < r.length; i++) out.set(m[i], (out.get(m[i]) ?? 0) + r[i]);
  return out;
}

/**
 * Il TEMPO: il periodo piu' lungo passato sotto il massimo precedente (in mesi,
 * dal mese del massimo al mese in cui viene superato; se non e' mai superato,
 * fino all'ultimo mese), e i mesi in utile.
 */
export function tempi(r: number[], m: number[], mesiTot: number) {
  let acc = 0;
  let peak = 0;
  let peakMese = m[0] ?? 0;
  let lungo = 0;
  let lungoDa = peakMese;
  let lungoA = peakMese;
  for (let i = 0; i < r.length; i++) {
    acc += r[i];
    if (acc > peak) {
      const durata = m[i] - peakMese;
      if (durata > lungo) {
        lungo = durata;
        lungoDa = peakMese;
        lungoA = m[i];
      }
      peak = acc;
      peakMese = m[i];
    }
  }
  const ultimo = m[m.length - 1] ?? 0;
  if (ultimo - peakMese > lungo) {
    lungo = ultimo - peakMese;
    lungoDa = peakMese;
    lungoA = ultimo;
  }
  const pm = perMese(r, m);
  let pos = 0;
  pm.forEach((v) => {
    if (v > 0) pos++;
  });
  return { recuperoMesi: lungo, recuperoDa: lungoDa, recuperoA: lungoA, mesiPositivi: pos, mesiAttivi: pm.size, mesiTot };
}

/** Riduce una serie lunga a ~max punti tenendo il minimo di ogni gruppo (per i drawdown) o l'ultimo (per le curve). */
export function riduci(v: number[], max: number, modo: "ultimo" | "min") {
  if (v.length <= max) return v.map((y, i) => ({ i, y }));
  const passo = v.length / max;
  const out: { i: number; y: number }[] = [];
  for (let k = 0; k < max; k++) {
    const a = Math.floor(k * passo);
    const b = Math.min(v.length, Math.floor((k + 1) * passo));
    if (modo === "ultimo") out.push({ i: b - 1, y: v[b - 1] });
    else {
      let j = a;
      for (let t = a; t < b; t++) if (v[t] < v[j]) j = t;
      out.push({ i: j, y: v[j] });
    }
  }
  return out;
}

/** Tacche "belle" per un asse (1, 2, 2,5, 5 x 10^k). */
export function tacche(min: number, max: number, quante = 5) {
  if (max === min) return [min];
  const span = max - min;
  const raw = span / quante;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  const step = (f < 1.5 ? 1 : f < 2.25 ? 2 : f < 3.5 ? 2.5 : f < 7.5 ? 5 : 10) * p;
  const out: number[] = [];
  for (let x = Math.ceil(min / step) * step; x <= max + step * 1e-9; x += step) out.push(Math.round(x / step) * step);
  return out;
}
