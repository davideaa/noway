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
export type PlayerState = { playing: boolean; paused: boolean; reason: string };

let snap: PlayerState = { playing: false, paused: false, reason: "non ancora partito" };
const listeners = new Set<() => void>();
/** il play e' partito almeno una volta (da solo o a mano): il tasto grande dice "Riprendi" */
let everPlayed = false;

function set(playing: boolean, paused: boolean, reason: string) {
  if (snap.playing === playing && snap.paused === paused && snap.reason === reason) return;
  // nuovo oggetto: useSyncExternalStore confronta per identita'
  snap = { playing, paused, reason };
  listeners.forEach((l) => l());
}

export const player = {
  get playing() {
    return snap.playing;
  },
  get paused() {
    return snap.paused;
  },
  /** perche' e' fermo (diagnostica): "rotellina", "touchmove", "tasti", "scroll", "barra", "tasto Pausa", "fine corsa" */
  get reason() {
    return snap.reason;
  },
  get everPlayed() {
    return everPlayed;
  },
  snapshot: () => snap,
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  /** Play: riparte da dove si e'. */
  play: () => {
    everPlayed = true;
    set(true, false, "");
  },
  /** Pausa esplicita: ferma il play E il respiro. */
  pause: (reason = "tasto Pausa") => set(false, true, reason),
  /**
   * Input dell'utente o fine corsa: il play si ferma, il respiro continua.
   * Un TAP semplice (touch o click, < 10 px e < 300 ms) NON arriva qui: solo
   * movimento vero (touchmove, rotellina, tasti, scroll, barra).
   */
  interrupt: (reason = "input") => {
    if (snap.playing) set(false, false, reason);
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
  /** la barra e' trascinata: il ciclo non le scrive il valore */
  dragging: boolean;
  /** richiesta di scroll dalla barra (p): il ciclo la esegue */
  seekTo: number | null;
  /** il tasto grande "Riprendi" (in basso al centro, quando il play e' fermo) */
  resume: HTMLElement | null;
  /** lo stato di caricamento: barra sottile + percentuale mono */
  loader: HTMLElement | null;
  loaderBar: HTMLElement | null;
  loaderText: HTMLElement | null;
  /** il pannello ?diag=1 */
  diag: HTMLElement | null;
  /** riga dei numeri nel finale (anteprima) */
  stat: HTMLElement | null;
} = {
  top: null,
  bar: null,
  counter: null,
  pulse: null,
  torch: null,
  dragging: false,
  seekTo: null,
  resume: null,
  loader: null,
  loaderBar: null,
  loaderText: null,
  diag: null,
  stat: null,
};
