/**
 * Il PLAY del film. Vive fuori da React e fuori dalla scena.
 *
 * Il play non tocca `p` direttamente: muove lo SCROLL della pagina
 * (window.scrollTo dentro il ciclo rAF di Film.tsx), cosi' p resta la
 * posizione di scroll e lo scrub a mano resta reversibile (ONE RULE).
 * Qualsiasi input dell'utente (rotellina, touch, tasti, scrollbar, barra di
 * avanzamento) lo interrompe senza salti: il film resta dov'e'.
 *
 * Tre condizioni, UN tasto:
 *   playing        il ciclo scorre la pagina; il tasto dice "Pausa"
 *   fermo          (dopo un input dell'utente) lo scroll comanda; il tasto dice "Riproduci"
 *   paused         Pausa premuta: anche il respiro G(t) e la grana si fermano (WCAG 2.2.2)
 */
export type PlayerState = { playing: boolean; paused: boolean };

let snap: PlayerState = { playing: false, paused: false };
const listeners = new Set<() => void>();

function set(playing: boolean, paused: boolean) {
  if (snap.playing === playing && snap.paused === paused) return;
  // nuovo oggetto: useSyncExternalStore confronta per identita'
  snap = { playing, paused };
  listeners.forEach((l) => l());
}

export const player = {
  get playing() {
    return snap.playing;
  },
  get paused() {
    return snap.paused;
  },
  snapshot: () => snap,
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  /** Play: riparte da dove si e'. */
  play: () => set(true, false),
  /** Pausa esplicita: ferma il play E il respiro. */
  pause: () => set(false, true),
  /** Input dell'utente o fine corsa: il play si ferma, il respiro continua. */
  interrupt: () => {
    if (snap.playing) set(false, false);
  },
  toggle: () => (snap.playing ? player.pause() : player.play()),
};

/**
 * Elementi DOM che il ciclo scrive ogni frame (mai React): la barra alta
 * (pillola, contatore, avanzamento, filetto), la torcia, il cursore.
 * Si registrano nei propri effect; il ciclo li legge se ci sono.
 */
export const ui: {
  top: HTMLElement | null;
  bar: HTMLInputElement | null;
  counter: HTMLElement | null;
  pulse: HTMLElement | null;
  torch: HTMLElement | null;
  dot: HTMLElement | null;
  ring: HTMLElement | null;
  /** la barra e' trascinata: il ciclo non le scrive il valore */
  dragging: boolean;
  /** richiesta di scroll dalla barra (p): il ciclo la esegue */
  seekTo: number | null;
} = { top: null, bar: null, counter: null, pulse: null, torch: null, dot: null, ring: null, dragging: false, seekTo: null };
