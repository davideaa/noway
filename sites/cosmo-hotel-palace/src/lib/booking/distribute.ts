/*
 * Ripartizione degli ospiti per camera (UX 6.5). Funzione pura.
 *
 * Bilanciata: ogni camera riceve la parte intera, il resto va alle prime camere
 * (3 camere, 4 adulti -> 2, 1, 1). Il sito vecchio divide per arrotondamento e con
 * 3 camere e 4 adulti darebbe 2, 2, 0: una camera senza adulti. Qui no.
 * Gli adulti e i bambini si ripartiscono ciascuno per conto proprio.
 *
 * Se le camere sono più degli adulti, qualche camera resta a 0 adulti: è un caso che
 * `validateBooking` blocca prima di costruire il link.
 */

export type OspitiCamera = { adulti: number; bambini: number };

/** Divide `totale` in `parti` quote intere differenti al massimo di 1; il resto alle prime. */
export function splitEven(totale: number, parti: number): number[] {
  const n = Math.max(1, Math.floor(parti));
  const t = Math.max(0, Math.floor(totale));
  const base = Math.floor(t / n);
  const resto = t % n;
  return Array.from({ length: n }, (_, i) => base + (i < resto ? 1 : 0));
}

/** Elenco di {adulti, bambini}, una voce per camera (indice 0 = camera 1). */
export function distribuisci(camere: number, adulti: number, bambini: number): OspitiCamera[] {
  const a = splitEven(adulti, camere);
  const b = splitEven(bambini, camere);
  return a.map((x, i) => ({ adulti: x, bambini: b[i] }));
}
