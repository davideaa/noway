/*
 * sessionStorage / localStorage che non lanciano mai (UX 3.3, MOTION 9.2).
 * L'accesso a window.sessionStorage può dare errore (finestra privata, cookie
 * bloccati, quota piena, anteprime): ogni lettura e scrittura è in try/catch.
 * Se lo storage non c'è, i valori restano in memoria per la visita: nel sito
 * statico il layout resta montato fra una pagina e l'altra, quindi lo stato
 * (date, ospiti) sopravvive comunque al cambio pagina (WCAG 3.3.7).
 * Mai usare lo storage per ciò che deve per forza persistere o arrivare a un server.
 */

type Kind = "session" | "local";

export type SafeStorage = {
  get(key: string): string | null;
  set(key: string, value: string): boolean;
  remove(key: string): void;
  getJSON<T>(key: string, fallback: T): T;
  setJSON(key: string, value: unknown): boolean;
};

function backend(kind: Kind): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const s = kind === "session" ? window.sessionStorage : window.localStorage;
    // alcuni browser espongono l'oggetto ma lanciano alla prima scrittura
    const probe = "__cosmo_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function createSafeStorage(kind: Kind): SafeStorage {
  const memory = new Map<string, string>();
  // la prova di scrittura si fa una volta sola (poi il risultato è ricordato)
  let cached: Storage | null | undefined;
  const store = (): Storage | null => {
    if (cached === undefined) {
      cached = backend(kind);
      // sul server non si memorizza il "no": al client si riprova
      if (cached === null && typeof window === "undefined") cached = undefined;
    }
    return cached ?? null;
  };

  const api: SafeStorage = {
    get(key) {
      try {
        const s = store();
        if (s) {
          const v = s.getItem(key);
          if (v !== null) return v;
        }
      } catch {
        /* si ripiega sulla memoria */
      }
      return memory.has(key) ? (memory.get(key) as string) : null;
    },
    set(key, value) {
      memory.set(key, value);
      try {
        const s = store();
        if (!s) return false;
        s.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      memory.delete(key);
      try {
        store()?.removeItem(key);
      } catch {
        /* niente da fare */
      }
    },
    getJSON<T>(key: string, fallback: T): T {
      const raw = api.get(key);
      if (raw === null) return fallback;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    },
    setJSON(key, value) {
      try {
        return api.set(key, JSON.stringify(value));
      } catch {
        return false;
      }
    },
  };
  return api;
}

/** Per la visita: stato della prenotazione, livello di qualità 3D appreso. */
export const safeSession = createSafeStorage("session");
/** Solo comodità del singolo visitatore (mai stato che serve altrove). */
export const safeLocal = createSafeStorage("local");
