/*
 * Configurazione del motore di prenotazione (DECISIONI 9, UX 6.5-6.6).
 * File senza dipendenze: si può leggere anche da Node (tests/unit).
 */

/**
 * Link base del motore VerticalBooking (BRIEF, UX 6.5). Contiene già `lingua_int`:
 * non si ripete fra i parametri aggiunti.
 */
export const ENGINE_BASE =
  "https://reservations.verticalbooking.com/premium/index2.html?id_albergo=146&dc=785&lingua_int=ita&id_stile=19500";

/**
 * Interruttore del «piano B» (UX 6.6).
 *
 * false = NON è stato provato che il motore vivo accetti e preimposti i parametri
 *   (gg, mm, aa, ggf, mmf, aaf, tot_camere, ...). I nomi dei parametri sono stati letti nel
 *   codice del sito vecchio, ma il comportamento del motore oggi non è stato verificato
 *   (Cloudflare blocca curl e WebFetch). Finché è false, `buildEngineUrl` restituisce il
 *   link base con i soli id, e l'interfaccia dice onestamente «Scegli le date sul motore».
 * true  = verificato con un browser vero: il link porta date e ospiti.
 *
 * Come verificare, prima di mettere true: aprire in un browser il link d'esempio di UX 6.5
 *   (`buildEngineUrl(stato, true)`, vedi tests/unit/booking-url.test.ts) e controllare che date
 *   e ospiti risultino preimpostati sul motore.
 *
 * Tipo `boolean` (non il letterale `false`): così i controlli `if (ENGINE_PARAMS_VERIFIED)`
 * non vengono segnalati come codice irraggiungibile.
 */
export const ENGINE_PARAMS_VERIFIED: boolean = false;

/** Limiti dei campi (UX 6.1, dal widget del sito vecchio). */
export const LIMITS = {
  camere: { min: 1, max: 4 },
  adulti: { min: 1, max: 4 },
  bambini: { min: 0, max: 4 },
  /** Ospiti massimi per camera (la Suite: 4). Serve solo all'avviso di capienza. */
  ospitiPerCamera: 4,
} as const;

/** Chiave in sessionStorage dello stato di prenotazione (UX 3.3, WCAG 3.3.7). */
export const STORAGE_KEY = "cosmo.prenotazione.v1";
