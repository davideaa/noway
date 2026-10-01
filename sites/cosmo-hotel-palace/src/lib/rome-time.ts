/*
 * Ora a Roma, per l'indicatore «aperto ora» (COPY sez. 7, UX 8: 7:00–22:00 tutti i giorni).
 * Funzioni pure: si passa la data (`now`), così si testano senza orologio vero.
 * Usa Intl con il fuso Europe/Rome: l'ora legale è gestita dal browser.
 * I testi dell'indicatore NON sono qui (stanno in content/copy.ts, modulo 2):
 * qui c'è solo lo stato.
 */

export const ROME_TZ = "Europe/Rome";

/** Orario del wellness (e riferimento dell'indicatore): ore intere, ora di Roma. */
export const OPENING = { open: 7, close: 22, closingSoonFrom: 21 } as const;

export type RomeParts = {
  year: number;
  month: number; // 1–12
  day: number;
  /** 0 = domenica … 6 = sabato */
  weekday: number;
  hour: number; // 0–23
  minute: number;
  second: number;
};

// Il formatter è costoso da creare: uno solo per modulo.
let fmt: Intl.DateTimeFormat | undefined;
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Le componenti di data e ora a Roma per un istante. */
export function romeParts(now: Date = new Date()): RomeParts {
  fmt ??= new Intl.DateTimeFormat("en-GB", {
    timeZone: ROME_TZ,
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  const get: Record<string, string> = {};
  for (const p of fmt.formatToParts(now)) get[p.type] = p.value;
  return {
    year: Number(get.year),
    month: Number(get.month),
    day: Number(get.day),
    weekday: WEEKDAYS[get.weekday] ?? 0,
    hour: Number(get.hour) % 24, // alcuni motori scrivono "24" a mezzanotte
    minute: Number(get.minute),
    second: Number(get.second),
  };
}

export type OpenState =
  /** dalle 7:00 alle 21:00 */
  | "aperto"
  /** dalle 21:00 alle 22:00: «chiude tra poco» */
  | "chiude-presto"
  /** prima delle 7:00: «apre alle 7:00» */
  | "chiuso-apre-oggi"
  /** dalle 22:00 a mezzanotte: «riapre domani alle 7:00» */
  | "chiuso-riapre-domani";

export type OpenStatus = {
  state: OpenState;
  isOpen: boolean;
  /**
   * Millisecondi fino al prossimo momento in cui lo stato può cambiare, calcolati
   * sull'orologio a muro di Roma e limitati a 30 minuti: nelle notti del cambio
   * ora legale l'orologio a muro salta di un'ora, e così il timer si ricontrolla
   * comunque presto. Chi lo usa: setTimeout(ricalcola, msToNextChange).
   */
  msToNextChange: number;
};

const SECOND = 1000;
const HOUR = 3600 * SECOND;
const MAX_RECHECK = 30 * 60 * SECOND;

/** Stato di apertura all'istante `now`, secondo l'ora di Roma. */
export function openStatus(now: Date = new Date(), hours = OPENING): OpenStatus {
  const { hour, minute, second } = romeParts(now);
  const sod = (hour * 3600 + minute * 60 + second) * SECOND; // millisecondi dall'inizio del giorno

  let state: OpenState;
  let next: number; // millisecondo del giorno del prossimo cambio
  if (hour < hours.open) {
    state = "chiuso-apre-oggi";
    next = hours.open * HOUR;
  } else if (hour < hours.closingSoonFrom) {
    state = "aperto";
    next = hours.closingSoonFrom * HOUR;
  } else if (hour < hours.close) {
    state = "chiude-presto";
    next = hours.close * HOUR;
  } else {
    state = "chiuso-riapre-domani";
    next = 24 * HOUR; // a mezzanotte il testo passa a «apre alle 7:00»
  }
  return {
    state,
    isOpen: state === "aperto" || state === "chiude-presto",
    msToNextChange: Math.min(Math.max(next - sod, SECOND), MAX_RECHECK),
  };
}

/** 'AAAA-MM-GG' di oggi a Roma (per validare le date della prenotazione, modulo 4). */
export function romeToday(now: Date = new Date()): string {
  const { year, month, day } = romeParts(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}
