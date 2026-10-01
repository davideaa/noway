/**
 * Disponibilità delle disposizioni per sala (UX 7.1-7.2). FUNZIONI PURE, nessun import di three
 * né di React: si usano nel configuratore (pagina) e nei test (`node --test`).
 *
 * Regola unica: una disposizione c'è se `hall.cap[disposizione] !== null` (il «-» della tabella
 * di COPY sez. 15). Nessuna capienza si calcola o si corregge: si legge dalla tabella, anche dove
 * i dati sono incoerenti (annotati `DA CONFERMARE` in `content/congress-halls.ts`).
 */

import { congressHalls, DISPOSIZIONI } from "../../content/congress-halls";
import { copy, fmt } from "../../content/copy";
import type { CongressHall, Disposizione } from "../../content/types";

export { DISPOSIZIONI };

/** Sala che UX 7.2 mette come scelta iniziale del configuratore. */
export const SALA_INIZIALE_ID = "costellazioni";
/** Sala che la scena 3D mostra di partenza e che il teaser della home usa (MOTION 5.4). */
export const SALA_SCENA_ID = "sole-plenaria";

export type Ordine = "capienza" | "superficie";
export type FiltroPiano = "tutte" | 0 | -1;

/** Tutte le sale, nell'ordine della tabella. */
export function elencoSale(): readonly CongressHall[] {
  return congressHalls;
}

/** La sala con quell'id; `undefined` per un id mancante o sconosciuto (link profondo non valido). */
export function trovaSala(id: string | null | undefined): CongressHall | undefined {
  if (!id) return undefined;
  return congressHalls.find((h) => h.id === id);
}

/** `true` se `valore` è una delle quattro disposizioni (per leggere `?disp=` dal link profondo). */
export function eDisposizione(valore: unknown): valore is Disposizione {
  return typeof valore === "string" && (DISPOSIZIONI as readonly string[]).includes(valore);
}

/** Etichetta di COPY («Banchi di scuola»). */
export function etichettaDisposizione(d: Disposizione): string {
  return copy.congressi.configuratore.disposizioni[d].etichetta;
}

/** Capienza della tabella, o `null` se la disposizione non è indicata per la sala. */
export function capienza(hall: CongressHall, d: Disposizione): number | null {
  return hall.cap[d];
}

/** Disposizioni indicate per la sala, nell'ordine fisso platea, banchi, ferro, banchetto. */
export function disposizioniDisponibili(hall: CongressHall): Disposizione[] {
  return DISPOSIZIONI.filter((d) => hall.cap[d] !== null);
}

export function eDisponibile(hall: CongressHall, d: Disposizione): boolean {
  return hall.cap[d] !== null;
}

/** Capienza più alta fra quelle indicate («fino a»). Serve a ordinare e all'etichetta di riga. */
export function capienzaMassima(hall: CongressHall): number {
  let max = 0;
  for (const d of DISPOSIZIONI) {
    const c = hall.cap[d];
    if (c !== null && c > max) max = c;
  }
  return max;
}

/** «Platea», «Platea e Banchetto», «Platea, Banchi di scuola e Banchetto». */
export function elencoEtichette(ds: readonly Disposizione[]): string {
  const e = ds.map(etichettaDisposizione);
  if (e.length <= 1) return e.join("");
  return `${e.slice(0, -1).join(", ")} e ${e[e.length - 1]}`;
}

export type Disponibilita = {
  disposizione: Disposizione;
  disponibile: boolean;
  /** Capienza della tabella; `null` se non indicata (il chip mostra il trattino). */
  capienza: number | null;
  /**
   * Perché non c'è, già scritto (COPY: «Questa disposizione non è indicata per {sala}. Prova con
   * {disposizioni}.»). `null` se la disposizione c'è. Va sotto i chip e si annuncia (aria-live).
   */
  motivo: string | null;
};

export function disponibilita(hall: CongressHall, d: Disposizione): Disponibilita {
  const cap = hall.cap[d];
  if (cap !== null) return { disposizione: d, disponibile: true, capienza: cap, motivo: null };
  return {
    disposizione: d,
    disponibile: false,
    capienza: null,
    motivo: fmt(copy.congressi.configuratore.disposizioneNonPrevista, {
      sala: hall.name,
      disposizioni: elencoEtichette(disposizioniDisponibili(hall)),
    }),
  };
}

/** Le quattro disponibilità nell'ordine dei chip. */
export function tutteLeDisponibilita(hall: CongressHall): Disponibilita[] {
  return DISPOSIZIONI.map((d) => disponibilita(hall, d));
}

export type DisposizioneEffettiva = {
  disposizione: Disposizione;
  /** true se si è dovuto ripiegare sulla platea. */
  ripiego: boolean;
  /** «{Sala} non ha {disposizione}: ti mostro Platea.» se `ripiego`, altrimenti `null`. */
  avviso: string | null;
};

/**
 * Cambiando sala, se la disposizione scelta non c'è si passa a «Platea» e si dice perché (UX 7.2).
 * La platea c'è in tutte le 25 righe; se un domani mancasse, si prende la prima disponibile.
 */
export function disposizioneEffettiva(hall: CongressHall, richiesta: Disposizione): DisposizioneEffettiva {
  if (hall.cap[richiesta] !== null) return { disposizione: richiesta, ripiego: false, avviso: null };
  const ripiego: Disposizione = hall.cap.platea !== null ? "platea" : (disposizioniDisponibili(hall)[0] ?? "platea");
  return {
    disposizione: ripiego,
    ripiego: true,
    avviso: fmt(copy.congressi.configuratore.disposizioneRipiego, {
      sala: hall.name,
      disposizione: etichettaDisposizione(richiesta),
    }),
  };
}

/** `true` se i partecipanti superano la capienza della tabella (avviso non bloccante, COPY 8.3). */
export function oltreCapienza(hall: CongressHall, d: Disposizione, ospiti: number | null | undefined): boolean {
  const cap = hall.cap[d];
  if (cap === null || ospiti === null || ospiti === undefined || !Number.isFinite(ospiti)) return false;
  return ospiti > cap;
}

/* ---------------------------- elenco: filtro e ordine ---------------------------- */

/** Filtra per piano e ordina (capienza o superficie, decrescente; a parità resta l'ordine della tabella). */
export function saleOrdinate(
  { piano = "tutte", ordine = "capienza" }: { piano?: FiltroPiano; ordine?: Ordine } = {},
): CongressHall[] {
  const chiave = (h: CongressHall) => (ordine === "capienza" ? capienzaMassima(h) : h.areaM2);
  return congressHalls
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => piano === "tutte" || h.floor === piano)
    .sort((a, b) => chiave(b.h) - chiave(a.h) || a.i - b.i)
    .map(({ h }) => h);
}

/* ---------------------------- «Trova la sala» ---------------------------- */

/**
 * Sale la cui capienza per `d` basta per `n` persone, dalla più piccola (per capienza, poi per
 * superficie, poi ordine della tabella). La prima è «la sala più piccola adatta».
 * Per i mini-selettori della home («Trova la sala»). `n` non valido: lista vuota.
 */
export function saleAdatte(n: number, d: Disposizione): CongressHall[] {
  if (!Number.isFinite(n) || n <= 0) return [];
  return congressHalls
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => {
      const c = h.cap[d];
      return c !== null && c >= n;
    })
    .sort((a, b) => (a.h.cap[d] as number) - (b.h.cap[d] as number) || a.h.areaM2 - b.h.areaM2 || a.i - b.i)
    .map(({ h }) => h);
}
