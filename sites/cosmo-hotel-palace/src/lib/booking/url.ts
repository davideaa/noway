/*
 * Il link verso il motore VerticalBooking (UX 6.5, DECISIONI 9). Funzione pura.
 *
 * Parametri aggiunti alla base, nell'ordine in cui li scrive il sito vecchio:
 *   gg mm aa  ggf mmf aaf  tot_camere tot_adulti tot_bambini
 *   adulti1 bambini1 adulti2 bambini2 ... (una coppia per camera)  notti_1
 * `lingua_int` è già nella base: non si ripete. Giorno e mese a 2 cifre, anno a 4.
 *
 * FALLBACK ONESTO. Se `verified` è false (ENGINE_PARAMS_VERIFIED, config.ts) il motore vivo non è
 * stato provato: si restituisce il link base con i soli id, senza date né ospiti, e
 * l'interfaccia lo dice («Scegli le date sul motore»). Lo stesso se lo stato non permette di
 * scrivere parametri sensati (date mancanti o non valide, partenza non dopo l'arrivo): il link
 * resta quello base, innocuo anche con il tasto centrale.
 *
 * Il tipo di camera (`state.camera`) NON ha un parametro noto sul motore (UX 6.6): non entra
 * nel link. Chi sceglie una camera preimposta solo gli ospiti.
 */
import type { BookingState } from "@/content/types";
import { ENGINE_BASE, ENGINE_PARAMS_VERIFIED } from "./config";
import { engineParts, nights } from "./dates";
import { distribuisci } from "./distribute";

/**
 * @param verified di norma ENGINE_PARAMS_VERIFIED; il secondo argomento esiste per i test e per
 *   provare il link completo prima di accendere l'interruttore.
 */
export function buildEngineUrl(state: BookingState, verified: boolean = ENGINE_PARAMS_VERIFIED): string {
  if (!verified) return ENGINE_BASE;

  const a = engineParts(state.arrivo);
  const p = engineParts(state.partenza);
  const n = nights(state.arrivo, state.partenza);
  if (!a || !p || n === null || n < 1) return ENGINE_BASE;

  const parts: Array<[string, string | number]> = [
    ["gg", a.gg],
    ["mm", a.mm],
    ["aa", a.aa],
    ["ggf", p.gg],
    ["mmf", p.mm],
    ["aaf", p.aa],
    ["tot_camere", state.camere],
    ["tot_adulti", state.adulti],
    ["tot_bambini", state.bambini],
  ];
  distribuisci(state.camere, state.adulti, state.bambini).forEach((c, i) => {
    parts.push([`adulti${i + 1}`, c.adulti], [`bambini${i + 1}`, c.bambini]);
  });
  parts.push(["notti_1", n]);

  // tutti i valori sono cifre: niente da codificare
  return `${ENGINE_BASE}&${parts.map(([k, v]) => `${k}=${v}`).join("&")}`;
}
