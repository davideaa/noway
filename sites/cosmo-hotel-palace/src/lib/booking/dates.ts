/*
 * Date della prenotazione (UX 6.1). Funzioni pure, senza React e senza fuso orario.
 *
 * Le date sono stringhe 'AAAA-MM-GG'. Non si usa MAI `new Date('AAAA-MM-GG')`: sarebbe
 * mezzanotte UTC e in alcuni fusi cadrebbe nel giorno prima. Si spezza la stringa e si
 * calcola con `Date.UTC`, che non conosce l'ora legale: le nottate sono sempre intere
 * anche attraverso il cambio dell'ora.
 */

export type Ymd = { y: number; m: number; d: number };

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

const MESI = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
] as const;

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** Spezza 'AAAA-MM-GG'. `null` se il formato è sbagliato o il giorno non esiste (31 novembre). */
export function parseIso(s: string): Ymd | null {
  const m = ISO.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1) return null;
  // il giorno esiste davvero? (si riconverte e si confronta)
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
  return { y, m: mo, d };
}

export function isValidIso(s: string): boolean {
  return parseIso(s) !== null;
}

export function toIso({ y, m, d }: Ymd): string {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

/** Giorni dall'epoca (numero intero). `null` se la data non è valida. */
export function dayNumber(s: string): number | null {
  const p = parseIso(s);
  return p ? Math.round(Date.UTC(p.y, p.m - 1, p.d) / DAY_MS) : null;
}

/** Aggiunge `n` giorni (anche negativi). `null` se la data di partenza non è valida. */
export function addDays(s: string, n: number): string | null {
  const dn = dayNumber(s);
  if (dn === null) return null;
  const t = new Date((dn + n) * DAY_MS);
  return toIso({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() });
}

/** < 0 se a precede b, 0 se uguali, > 0 se a segue b. `null` se una delle due non è valida. */
export function compareIso(a: string, b: string): number | null {
  const x = dayNumber(a);
  const y = dayNumber(b);
  return x === null || y === null ? null : x - y;
}

/**
 * Numero di notti fra arrivo e partenza (può essere 0 o negativo se la partenza non segue
 * l'arrivo: chi chiama decide). `null` se una delle due date non è valida.
 */
export function nights(arrivo: string, partenza: string): number | null {
  const a = dayNumber(arrivo);
  const p = dayNumber(partenza);
  return a === null || p === null ? null : p - a;
}

/**
 * Regola della partenza (UX 6.1): se vuota, non valida o non dopo l'arrivo, diventa
 * arrivo + 1. `moved` dice se è stata cambiata (da annunciare: «Partenza spostata a {data}.»).
 * Con un arrivo non valido non si tocca nulla.
 */
export function ensureDeparture(arrivo: string, partenza: string): { partenza: string; moved: boolean } {
  const a = dayNumber(arrivo);
  if (a === null) return { partenza, moved: false };
  const p = dayNumber(partenza);
  if (p !== null && p > a) return { partenza, moved: false };
  return { partenza: addDays(arrivo, 1) as string, moved: true };
}

/** Come lo vuole il motore: giorno e mese a 2 cifre, anno a 4 (UX 6.6). `null` se non valida. */
export function engineParts(s: string): { gg: string; mm: string; aa: string } | null {
  const p = parseIso(s);
  return p ? { gg: pad(p.d), mm: pad(p.m), aa: pad(p.y, 4) } : null;
}

/** «15 novembre 2026». Stringa vuota se la data non è valida. */
export function formatLong(s: string): string {
  const p = parseIso(s);
  return p ? `${p.d} ${MESI[p.m - 1]} ${p.y}` : "";
}
