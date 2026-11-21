/**
 * I dati di /dettagli, letti in build (server components): data/strategie.json
 * (statistiche del simulatore, fonte unica dei numeri secondo COPY.md) e
 * data/derivati.json (scritto da scripts/derivati.py dalle 4.206 operazioni:
 * curve, drawdown, medie mobili, bootstrap a blocchi). Niente di tutto questo
 * arriva nel bundle del browser: nel HTML ci sono solo i numeri gia' scritti e
 * gli SVG gia' disegnati.
 */
import derivati from "../../data/derivati.json";
import operazioni from "../../data/operazioni.json";
import strategie from "../../data/strategie.json";

export type Id = "oro" | "nasdaq" | "usdjpy";
export const IDS: Id[] = ["oro", "nasdaq", "usdjpy"];

export type Periodo = {
  da: string;
  a: string;
  n: number;
  somma_R: number;
  R_per_op: number;
  dev_std: number;
  t: number;
  vinte_pct: number;
  dd_max_R: number;
  perdite_consecutive_max: number;
  anno_migliore: { anno: string; R: number };
  anno_peggiore: { anno: string; R: number };
};

export type Bootstrap = {
  campioni: number;
  blocco: number;
  seme: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  storico: number;
  percentile_storico: number;
  istogramma: { da: number; passo: number; conteggi: number[] };
};

export type Scheda = {
  fuori_da: string;
  indice_fuori: number;
  n: number;
  periodi: { dentro: Periodo; fuori: Periodo; tutto: Periodo };
  curva: number[];
  drawdown: number[];
  rolling: { finestra: number; inizio: number | null; valori: number[] };
  per_anno: Record<string, number>;
  per_mese: Record<string, number>;
  mesi_negativi: number;
  mese_peggiore: { mese: string; R: number };
  mese_migliore: { mese: string; R: number };
  bootstrap_dd: Bootstrap;
};

export type Portafoglio = {
  nota: string;
  n: number;
  stats: Periodo;
  per_mese: Record<string, number>;
  per_anno: Record<string, number>;
  curva_mensile: Record<Id | "totale", number[]>;
  drawdown_mensile: number[];
  mesi_negativi: number;
  mesi_peggiori: ({ mese: string; totale: number } & Record<Id, number>)[];
  mesi_tutte_negative: { n: number; mesi: string[] };
  mesi_tutte_positive: { n: number; mesi: string[] };
  correlazioni: { id: string; a: Id; b: Id; r: number; lo: number; hi: number; n: number }[];
  bootstrap_dd: Bootstrap;
};

type Derivati = {
  operazioni: number;
  primo_mese: string;
  ultimo_mese: string;
  mesi: string[];
  bootstrap: { campioni: number; blocco: number; seme: number };
  strategie: Record<Id, Scheda>;
  portafoglio: Portafoglio;
  verifica: { contro: string; differenze: string[] };
};

export const DERIVATI = derivati as unknown as Derivati;
export const D = DERIVATI.strategie;
export const PORT = DERIVATI.portafoglio;
export const MESI = DERIVATI.mesi;
export const ULTIMO_MESE = DERIVATI.ultimo_mese;
export const PRIMO_MESE = DERIVATI.primo_mese;
export const ANNO_PARZIALE = ULTIMO_MESE.slice(0, 4); // il 2026 arriva a settembre

type StratJson = {
  tutto: { n: number; somma_R: number; R_per_op: number; dev_std: number; t: number; vinte_pct: number };
  dentro_campione: { n: number; somma_R: number; R_per_op: number; dev_std: number; t: number; vinte_pct: number };
  fuori_campione: { da: string; n: number; somma_R: number; R_per_op: number; dev_std: number; t: number; vinte_pct: number };
  per_anno_R: Record<string, number>;
  anno_migliore: string;
  anno_peggiore: string;
  max_drawdown_R_backtest: number;
  perdite_consecutive_max: number;
  per_mese_R: Record<string, number>;
  curva_R: number[];
};
export const S = strategie.strategie as unknown as Record<Id, StratJson>;
export const CORR_JSON = strategie.correlazione_mensile as Record<string, number>;

/** Identita' delle strategie: colore (token) + nome scritto, mai il colore da solo (DESIGN.md sez. 4). */
export const META: Record<Id, { nome: string; mercato: string; colore: string; n: string }> = {
  oro: { nome: "Oro", mercato: "XAUUSD", colore: "var(--st-oro)", n: "01" },
  nasdaq: { nome: "Nasdaq", mercato: "indice Nasdaq", colore: "var(--st-nas)", n: "02" },
  usdjpy: { nome: "USDJPY", mercato: "dollaro contro yen", colore: "var(--st-usdjpy)", n: "03" },
};

/** Etichetta anno: il 2026 e' parziale (COPY.md: si dice ogni volta che compare). */
export const annoLabel = (anno: string) => (anno === ANNO_PARZIALE ? `${anno} (parziale)` : anno);

/** Indice della prima operazione di ogni anno, per l'asse dei tempi dei grafici per operazione. */
export function primiIndiciAnno(mesiOps: string[]) {
  const out: { x: number; label: string }[] = [];
  let ultimo = "";
  mesiOps.forEach((m, i) => {
    const a = m.slice(0, 4);
    if (a !== ultimo) {
      out.push({ x: i, label: a });
      ultimo = a;
    }
  });
  return out;
}

/** Mese di ogni operazione, per strategia (asse dei tempi dei grafici per operazione). */
const OPS = operazioni as unknown as { ordine: Id[]; chi: number[]; mesi: string[] };
export const MESI_OPS: Record<Id, string[]> = { oro: [], nasdaq: [], usdjpy: [] };
OPS.chi.forEach((c, i) => MESI_OPS[OPS.ordine[c]].push(OPS.mesi[i]));
