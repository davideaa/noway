/**
 * Dati per la parte interattiva di /dettagli (le schede e le pagine delle
 * strategie). Si preparano in build dai JSON del repo e arrivano al browser
 * compatti: per ogni operazione solo il risultato in R, il mese (indice) e la
 * strategia (indice). Tutto il resto (curve in R, % a rischio fisso e composto,
 * drawdown, anni, tempi di recupero) si calcola nel browser, cosi' i comandi
 * (periodo, misura, rischio, anni accesi/spenti) rispondono subito.
 *
 * Cosa si mostra e cosa no (Davide): solo RISULTATI e su cosa si basa ogni
 * strategia in una riga (dal suo simulatore). Niente regole, niente prove
 * scartate, niente storia del metodo.
 */
import operazioni from "../../data/operazioni.json";
import { D, IDS, MESI, PORT, type Id } from "./dati";

export type Base = {
  nome: string;
  mercato: string;
  colore: string;
  /** su cosa si basa, in parole semplici (dal simulatore di Davide) */
  tipo: string;
  timeframe: string;
  /** una riga per chi non sa niente di trading */
  frase: string;
  /** indice del primo mese fuori campione */
  fuori: number;
  boot: { p50: number; p95: number; storico: number };
};

export type EsploraData = {
  mesi: string[];
  ids: Id[];
  /** per operazione, in ordine di tempo: risultato in R (3 decimali), mese (indice in mesi), strategia (indice in ids) */
  r: number[];
  m: number[];
  s: number[];
  base: Record<Id, Base>;
  port: {
    boot: { p50: number; p95: number; storico: number };
    corr: { a: Id; b: Id; r: number }[];
    tutteNeg: number;
    tuttePos: number;
    mesiComuni: number;
  };
};

const TESTI: Record<Id, Pick<Base, "nome" | "mercato" | "colore" | "tipo" | "timeframe" | "frase">> = {
  oro: {
    nome: "Oro",
    mercato: "XAUUSD",
    colore: "var(--st-oro)",
    tipo: "Segue il trend",
    timeframe: "grafico a 1 ora",
    frase:
      "Entra quando l’oro ha già preso una direzione e prova a seguirla finché dura. Poche operazioni, tenute più a lungo.",
  },
  nasdaq: {
    nome: "Nasdaq",
    mercato: "NAS100",
    colore: "var(--st-nas)",
    tipo: "Slancio all’apertura",
    timeframe: "grafico a 5 minuti",
    frase: "Lavora sull’indice delle grandi aziende tecnologiche americane, nelle ore in cui apre la borsa e il movimento è più forte.",
  },
  usdjpy: {
    nome: "USDJPY",
    mercato: "USDJPY",
    colore: "var(--st-usdjpy)",
    tipo: "Rottura con filtro",
    timeframe: "grafico a 30 minuti",
    frase: "Lavora sul cambio dollaro-yen quando il prezzo esce da una zona in cui era fermo. Chiude sempre entro 12 ore.",
  },
};

function boot(b: { p50: number; p95: number; storico: number }) {
  return { p50: b.p50, p95: b.p95, storico: b.storico };
}

export function esploraData(): EsploraData {
  const O = operazioni as unknown as { ordine: Id[]; chi: number[]; R: number[]; mesi: string[] };
  const mIdx = new Map(MESI.map((x, i) => [x, i]));
  const ids = IDS;
  const r = O.R.map((x) => Math.round(x * 1000) / 1000);
  const m = O.mesi.map((x) => mIdx.get(x) ?? 0);
  const s = O.chi.map((c) => ids.indexOf(O.ordine[c]));
  const base = {} as Record<Id, Base>;
  for (const id of ids) {
    base[id] = { ...TESTI[id], fuori: mIdx.get(D[id].fuori_da) ?? 0, boot: boot(D[id].bootstrap_dd) };
  }
  return {
    mesi: MESI,
    ids,
    r,
    m,
    s,
    base,
    port: {
      boot: boot(PORT.bootstrap_dd),
      corr: PORT.correlazioni.map((c) => ({ a: c.a, b: c.b, r: c.r })),
      tutteNeg: PORT.mesi_tutte_negative.n,
      tuttePos: PORT.mesi_tutte_positive.n,
      mesiComuni: PORT.correlazioni[0]?.n ?? MESI.length,
    },
  };
}
