/*
 * Annunci per i lettori di schermo (UX 12: aria-live per i cambi di luce, di
 * camera, di capienza; COPY: «Il motore di prenotazione si è aperto in una nuova
 * scheda.»). Il layout rende due regioni vuote fin dal primo HTML (#a11y-polite,
 * #a11y-assertive); se mancano (test, pagine isolate) vengono create al volo.
 *
 * Regole d'uso: annunciare solo al cambio di stato, mai a ogni tick; «polite»
 * per tutto, «assertive» solo per errori che bloccano.
 */

export type Politeness = "polite" | "assertive";

const IDS: Record<Politeness, string> = {
  polite: "a11y-polite",
  assertive: "a11y-assertive",
};

const timers: Partial<Record<Politeness, ReturnType<typeof setTimeout>>> = {};
// Lo stesso testo due volte di fila non verrebbe riletto: si alterna un carattere invisibile.
const toggles: Record<Politeness, boolean> = { polite: false, assertive: false };

function region(politeness: Politeness): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let el = document.getElementById(IDS[politeness]);
  if (!el) {
    el = document.createElement("div");
    el.id = IDS[politeness];
    el.className = "sr-only";
    el.setAttribute("role", politeness === "polite" ? "status" : "alert");
    el.setAttribute("aria-live", politeness);
    el.setAttribute("aria-atomic", "true");
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Annuncia `message` ai lettori di schermo. Non fa nulla sul server.
 * Il testo resta nella regione per `clearAfterMs` (default 5 s), poi viene svuotata.
 */
export function announce(
  message: string,
  { politeness = "polite", clearAfterMs = 5000 }: { politeness?: Politeness; clearAfterMs?: number } = {},
): void {
  const el = region(politeness);
  if (!el) return;
  clearTimeout(timers[politeness]);
  toggles[politeness] = !toggles[politeness];
  // svuota e riscrive nel frame dopo: il lettore rileva il cambio anche a testo uguale
  el.textContent = "";
  const text = toggles[politeness] ? message : `${message} `;
  requestAnimationFrame(() => {
    el.textContent = text;
  });
  timers[politeness] = setTimeout(() => {
    el.textContent = "";
  }, clearAfterMs);
}

/** Svuota subito entrambe le regioni (es. al cambio pagina). */
export function clearAnnouncements(): void {
  for (const p of ["polite", "assertive"] as const) {
    clearTimeout(timers[p]);
    const el = typeof document === "undefined" ? null : document.getElementById(IDS[p]);
    if (el) el.textContent = "";
  }
}
