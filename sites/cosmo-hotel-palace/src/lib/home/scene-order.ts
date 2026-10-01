/*
 * Ordine delle scene della home (UX 4.2) e interruttore «Come viaggi?» (COPY sez. 1).
 *
 * Qui NON c'è DOM né React: solo dati, funzioni pure e un piccolo store con sottoscrizione
 * (si legge con useSyncExternalStore). Il riordino vero lo fa il componente <SceneStack> cambiando
 * l'ordine dei figli nel DOM (non con CSS: l'ordine di tabulazione deve coincidere con quello visivo).
 *
 * Regola: il modo di partenza è SEMPRE «piacere» (l'ordine di base) e non si legge da nessun
 * posto al caricamento: niente salti di layout. Cambia solo dopo il clic dell'utente. Lo stato
 * vive in memoria per la sessione della pagina, non si salva.
 */

export type SceneId =
  | "hero"
  | "perche"
  | "camere"
  | "milano"
  | "grill"
  | "wellness"
  | "congressi"
  | "prenota";

export type ModoViaggio = "piacere" | "lavoro";

/** Ordine di base («Per piacere») e ordine «Per lavoro» (UX 4.2). Hero e chiusura non si muovono. */
export const ORDINE: Readonly<Record<ModoViaggio, readonly SceneId[]>> = {
  piacere: ["hero", "perche", "camere", "milano", "grill", "wellness", "congressi", "prenota"],
  lavoro: ["hero", "perche", "congressi", "camere", "milano", "grill", "wellness", "prenota"],
};

/** `id` HTML di ogni scena (ancora, navigatore di scena, hash). */
export const ID_SEZIONE: Readonly<Record<SceneId, string>> = {
  hero: "hero",
  perche: "perche",
  camere: "camere",
  milano: "milano",
  grill: "grill",
  wellness: "wellness",
  congressi: "congressi",
  prenota: "prenota",
};

/** Etichette brevi per il navigatore di scena (≥ 1024 px, lo monta il modulo 7). */
export const ETICHETTA_SCENA: Readonly<Record<SceneId, string>> = {
  hero: "La hall",
  perche: "Perché sceglierci",
  camere: "Camere",
  milano: "A 2 km da Milano",
  grill: "Cosmo Grill & Lounge",
  wellness: "Wellness",
  congressi: "Centro Congressi",
  prenota: "Prenota",
};

/** La prima scena (dalla cima) che in `a` sta in una posizione diversa da `da`. `null` se uguali. */
export function primaScenaCambiata(da: ModoViaggio, a: ModoViaggio): SceneId | null {
  const x = ORDINE[da];
  const y = ORDINE[a];
  for (let i = 0; i < y.length; i++) if (x[i] !== y[i]) return y[i];
  return null;
}

/* ───────────────────────── Store del modo ───────────────────────── */

let modo: ModoViaggio = "piacere";
const ascoltatori = new Set<() => void>();

export const leggiModo = (): ModoViaggio => modo;
export const modoServer = (): ModoViaggio => "piacere";

export function sottoscriviModo(fn: () => void): () => void {
  ascoltatori.add(fn);
  return () => {
    ascoltatori.delete(fn);
  };
}

/** Scrive il modo e avvisa chi ascolta. Si chiama solo da un gesto dell'utente (vedi cambia-modo.ts). */
export function impostaModo(nuovo: ModoViaggio): void {
  if (nuovo === modo) return;
  modo = nuovo;
  ascoltatori.forEach((fn) => fn());
}
