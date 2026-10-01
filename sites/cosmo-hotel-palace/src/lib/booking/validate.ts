/*
 * Validazione della prenotazione (UX 6.2). Funzioni pure.
 *
 * Si chiama alla pressione di «Cerca disponibilità», mai mentre si scrive. Il pulsante non è
 * mai disattivato. Le chiavi del risultato sono i campi; il valore è il testo (da `copy`).
 * Un oggetto vuoto = valido.
 *
 * Non si implementano: numero massimo di notti, soggiorno minimo, età dei bambini (non noti).
 */
import { copy, copyPrenotazione, fmt } from "@/content/copy";
import type { BookingState } from "@/content/types";
import { LIMITS } from "./config";
import { compareIso, isValidIso, nights } from "./dates";

export type BookingField = "arrivo" | "partenza" | "camere" | "adulti";
export type BookingErrors = Partial<Record<BookingField, string>>;

/** Ordine visivo dei campi: serve a dire quale errore viene prima (focus, riepilogo). */
export const FIELD_ORDER: readonly BookingField[] = ["arrivo", "partenza", "camere", "adulti"];

/**
 * @param oggi 'AAAA-MM-GG' di oggi a Roma (`romeToday()`). Se vuota (server) non si controlla il passato.
 */
export function validateBooking(state: BookingState, oggi: string): BookingErrors {
  const e = copy.prenota.errori;
  const errors: BookingErrors = {};

  const arrivoOk = isValidIso(state.arrivo);
  if (!arrivoOk) {
    errors.arrivo = e.arrivoMancante;
  } else if (isValidIso(oggi) && (compareIso(state.arrivo, oggi) as number) < 0) {
    errors.arrivo = e.arrivoPassato;
  }

  if (!isValidIso(state.partenza)) {
    errors.partenza = e.partenzaMancante;
  } else if (arrivoOk && (nights(state.arrivo, state.partenza) as number) < 1) {
    errors.partenza = e.partenzaNonDopo;
  }

  if (!(state.adulti >= LIMITS.adulti.min)) {
    errors.adulti = e.nessunAdulto;
  } else if (state.camere > state.adulti) {
    // evita camere senza adulti nel link (UX 6.5)
    errors.camere = e.cameraSenzaAdulto;
  }

  return errors;
}

export function isValid(errors: BookingErrors): boolean {
  return Object.keys(errors).length === 0;
}

/** Il primo campo errato nell'ordine visivo, o `null`. */
export function firstInvalid(errors: BookingErrors): BookingField | null {
  return FIELD_ORDER.find((f) => errors[f] !== undefined) ?? null;
}

/**
 * Avviso che NON blocca (UX 6.2): più ospiti dei posti (4 per camera, il massimo, la Suite).
 * Ripiego di COPY 4.3: la regola vera di capienza del motore non è nota.
 */
export function capienzaAvviso(state: BookingState): string | null {
  return state.adulti + state.bambini > state.camere * LIMITS.ospitiPerCamera
    ? copy.prenota.errori.capienzaAvviso
    : null;
}

/** «Ci sono 2 campi da controllare.» / «C'è 1 campo da controllare.» */
export function riepilogoErrori(n: number): string {
  return n === 1 ? copyPrenotazione.riepilogoUno : fmt(copy.prenota.errori.riepilogo, { n });
}
