/**
 * Controlli del modulo «Richiesta di proposta» (UX 7.3, COPY 8.3). Funzioni pure, senza DOM.
 * Ogni errore dice come rimediare. L'avviso «partecipanti oltre la capienza» NON è un errore
 * e non sta qui (è un messaggio di stato: `oltreCapienza` in `lib/congress/availability.ts`).
 */

import { copy } from "@/content/copy";

const err = copy.congressi.modulo.errori;

export type CampiModulo = {
  nome: string;
  email: string;
  telefono: string;
  ospiti: string;
  data: string;
  consenso: boolean;
};

export type ChiaveErrore = keyof CampiModulo;
export type ErroriModulo = Partial<Record<ChiaveErrore, string>>;

/** Ordine dei campi nel modulo: serve al riepilogo errori. */
export const ORDINE_CAMPI: readonly ChiaveErrore[] = ["nome", "email", "telefono", "data", "ospiti", "consenso"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFONO = /^\+?[0-9][0-9 ]*$/;
const DATA_COMPLETA = /^\s*(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\s*$/;

/** `oggi` = 'AAAA-MM-GG' (data di Roma). */
export function validaCampo(chiave: ChiaveErrore, v: CampiModulo, oggi: string): string | undefined {
  switch (chiave) {
    case "nome":
      return v.nome.trim() ? undefined : err.nomeVuoto;
    case "email": {
      const e = v.email.trim();
      if (!e) return err.emailVuota;
      return EMAIL.test(e) ? undefined : err.emailNonValida;
    }
    case "telefono": {
      const t = v.telefono.trim();
      if (!t) return undefined;
      const cifre = t.replace(/\D/g, "").length;
      return TELEFONO.test(t) && cifre >= 6 ? undefined : err.telefonoNonValido;
    }
    case "ospiti": {
      const o = v.ospiti.trim();
      if (!o) return undefined;
      return /^\d{1,5}$/.test(o) && Number(o) > 0 ? undefined : err.ospitiNonNumerico;
    }
    case "data": {
      // si controlla il passato solo se è una data completa gg/mm/aaaa (UX 7.3)
      const m = DATA_COMPLETA.exec(v.data);
      if (!m) return undefined;
      const [g, me, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const d = new Date(Date.UTC(a, me - 1, g));
      if (d.getUTCFullYear() !== a || d.getUTCMonth() !== me - 1 || d.getUTCDate() !== g) return undefined;
      const iso = `${String(a).padStart(4, "0")}-${String(me).padStart(2, "0")}-${String(g).padStart(2, "0")}`;
      return iso < oggi ? err.dataPassata : undefined;
    }
    case "consenso":
      return v.consenso ? undefined : err.consensoMancante;
  }
}

export function validaModulo(v: CampiModulo, oggi: string): ErroriModulo {
  const out: ErroriModulo = {};
  for (const k of ORDINE_CAMPI) {
    const e = validaCampo(k, v, oggi);
    if (e) out[k] = e;
  }
  return out;
}
