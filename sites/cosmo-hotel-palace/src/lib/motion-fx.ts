"use client";

/*
 * Effetti di scroll riusabili (MOTION 8, UX 11.1). Qui ci sono gli HOOK; i componenti che li
 * usano (<Reveal>, <LineReveal>, <CountUp>) stanno in components/home/Fx.tsx e gli stili in
 * motion-fx.css (importato da questo file: chi usa gli hook ha già gli stili).
 *
 * CRITERIO PER NON ANIMARE (si applica da solo, dentro gli hook: chi li usa non deve ricordarselo)
 *   1. prefers-reduced-motion: niente movimento. Il contenuto è già nello stato finale.
 *   2. L'elemento è già nel primo schermo quando la pagina si monta (o è già stato scorso):
 *      compare subito, senza effetto. Mai un effetto sull'LCP, mai un titolo che si muove mentre
 *      lo si sta leggendo.
 *   3. Il browser non ha IntersectionObserver: si mostra, non si nasconde.
 *   4. Senza JavaScript non c'è nessuno stato nascosto: tutto parte visibile; si nasconde solo
 *      dopo che l'hook ha deciso di animare (classe html.fx-ready).
 *   Da non usare, per scelta di chi scrive le pagine: h1, paragrafi lunghi, capienze e numeri di
 *   dati che servono a decidere (m², capienze delle sale), moduli, più di ~12 elementi insieme,
 *   titoli su una scena 3D. Il contatore è l'unica eccezione al «solo transform e opacity».
 *
 * Tutto è funzione della posizione di scroll o un singolo passaggio «una volta sola»: nessun
 * loop, nessun will-change.
 */

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { clamp01, easeIn, getPrefersReducedMotion } from "@/lib/motion";
import "./motion-fx.css";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ───────────────────────── Criterio comune ───────────────────────── */

const haIO = () => typeof IntersectionObserver !== "undefined";

/** L'elemento è già (o è già stato) nel primo schermo: sopra il 90% dell'altezza della finestra. */
function giaVisibile(el: Element): boolean {
  return el.getBoundingClientRect().top < window.innerHeight * 0.9;
}

/** true se vale la pena animare questo elemento (vedi «criterio» in testa al file). */
export function devoAnimare(el: Element): boolean {
  return !getPrefersReducedMotion() && haIO() && !giaVisibile(el);
}

let fxProntoPianificato = false;

/**
 * Attiva gli stati nascosti (html.fx-ready). Si fa UNA volta, in un microtask: dopo che tutti gli
 * effetti del montaggio hanno deciso cosa mostrare subito (data-in), così la classe non invalida gli
 * stili fra una lettura di layout e l'altra (un solo ricalcolo invece di uno per elemento).
 */
function fxPronto(): void {
  if (fxProntoPianificato) return;
  fxProntoPianificato = true;
  queueMicrotask(() => document.documentElement.classList.add("fx-ready"));
}

/* ───────────────────────── Rivelazione (useReveal) ───────────────────────── */

let ioRivela: IntersectionObserver | null = null;

function osservaRivelazione(el: Element): void {
  ioRivela ??= new IntersectionObserver(
    (voci) => {
      for (const v of voci) {
        if (!v.isIntersecting) continue;
        v.target.setAttribute("data-in", "");
        ioRivela?.unobserve(v.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
  );
  ioRivela.observe(el);
}

/**
 * Marca l'elemento con `data-in` quando entra in vista (una volta sola). La classe `.fx-reveal`
 * (o `.fx-lines`) fa il resto. Se non c'è da animare, `data-in` c'è subito e non cambia nulla.
 */
export function useReveal<T extends HTMLElement>(ref: RefObject<T | null>): void {
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!devoAnimare(el)) {
      el.setAttribute("data-in", "");
      return;
    }
    osservaRivelazione(el);
    fxPronto();
    return () => ioRivela?.unobserve(el);
  }, [ref]);
}

/* ───────────────────────── Titoli per riga (useLineSplit) ───────────────────────── */

/**
 * Per un titolo reso come parole `.fx-w` (vedi <LineReveal>): dopo il caricamento dei font misura
 * a quale riga cade ogni parola e scrive `--l` (0, 1, 2…): il CSS sfalsa le righe di 80 ms.
 * Si rimisura se cambia la larghezza (non l'altezza: la barra di Safari). Poi rivela come useReveal.
 */
export function useLineSplit<T extends HTMLElement>(ref: RefObject<T | null>): void {
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!devoAnimare(el)) {
      el.setAttribute("data-in", "");
      return;
    }
    osservaRivelazione(el);
    fxPronto();

    let vivo = true;
    let larghezza = el.clientWidth;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // letture e scritture separate (nessun ricalcolo del layout per ogni parola)
    const misura = () => {
      const parole = el.querySelectorAll<HTMLElement>(".fx-w");
      const righe: number[] = [];
      let riga = -1;
      let topPrec = -1e9;
      parole.forEach((w) => {
        const top = w.offsetTop;
        if (Math.abs(top - topPrec) > 3) {
          riga++;
          topPrec = top;
        }
        righe.push(riga);
      });
      parole.forEach((w, i) => w.style.setProperty("--l", String(righe[i])));
    };
    // i font cambiano le righe: si misura appena sono pronti (il titolo è sotto la piega: nessuna fretta)
    const dopoFont = document.fonts?.ready ?? Promise.resolve();
    void dopoFont.then(() => {
      if (vivo) requestAnimationFrame(() => vivo && misura());
    });
    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (Math.abs(el.clientWidth - larghezza) < 1) return;
            larghezza = el.clientWidth;
            clearTimeout(timer);
            timer = setTimeout(misura, 150);
          });
    ro?.observe(el);

    return () => {
      vivo = false;
      clearTimeout(timer);
      ro?.disconnect();
      ioRivela?.unobserve(el);
    };
  }, [ref]);
}

/* ───────────────────────── Contatori (useCountUp) ───────────────────────── */

export type CountUpOptions = {
  /** Durata in ms (MOTION 8.3: 600). */
  durata?: number;
  /** Ritardo in ms, per sfalsare più contatori vicini (60 ms l'uno). */
  ritardo?: number;
  /** Come si scrive il numero (default: intero senza separatori). */
  formato?: (n: number) => string;
};

/**
 * Fa salire il numero da 0 a `a` quando l'elemento è visibile almeno al 60%, una volta sola.
 * Il valore FINALE è già nell'HTML (senza JS, con movimento ridotto, o se l'elemento è già in
 * vista al caricamento resta quello). Scrive solo il testo dell'elemento.
 */
export function useCountUp<T extends HTMLElement>(
  ref: RefObject<T | null>,
  a: number,
  { durata = 600, ritardo = 0, formato }: CountUpOptions = {},
): void {
  const fmt = useRef(formato);
  useEffect(() => {
    fmt.current = formato;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!devoAnimare(el)) return;
    const scrivi = (n: number) => {
      el.textContent = (fmt.current ?? String)(n);
    };
    scrivi(0);
    let raf = 0;
    let partito = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || partito) return;
        partito = true;
        io.disconnect();
        const t0 = performance.now() + ritardo;
        const passo = (ora: number) => {
          const k = clamp01((ora - t0) / durata);
          scrivi(Math.round(a * easeIn(k)));
          if (k < 1) raf = requestAnimationFrame(passo);
        };
        raf = requestAnimationFrame(passo);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      scrivi(a);
    };
  }, [ref, a, durata, ritardo]);
}

/* ───────────────────────── Filo che si disegna (useScrollDraw) ───────────────────────── */

export type ScrollDrawOptions = {
  /** Custom property scritta sull'elemento (0..1). Default `--draw`. `null` = non scrivere nulla (se basta `onProgress`). */
  property?: string | null;
  /**
   * Quando comincia: 0 → l'elemento è entrato a questa frazione dell'altezza della finestra
   * (dall'alto). Default 0,8.
   */
  inizio?: number;
  /** Quando finisce: 1 → il fondo dell'elemento ha raggiunto questa frazione. Default 0,4. */
  fine?: number;
  /** Chiamata solo quando il valore cambia davvero. `scroll` è false con movimento ridotto (p = 1 fisso). */
  onProgress?: (p: number, scroll: boolean) => void;
};

/**
 * Scrive in una custom property (0..1) quanto un elemento è stato «attraversato» dallo scroll,
 * con un solo requestAnimationFrame per evento e senza rendering di React. Il CSS legge la
 * variabile: `.fx-thread` / `.fx-thread-x` scalano una linea, altro CSS può disegnare un tracciato.
 * Con movimento ridotto vale subito 1 (già disegnato). Senza JS la variabile manca e il CSS usa 1.
 */
export function useScrollDraw<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { property = "--draw", inizio = 0.8, fine = 0.4, onProgress }: ScrollDrawOptions = {},
): void {
  const cb = useRef(onProgress);
  useEffect(() => {
    cb.current = onProgress;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (getPrefersReducedMotion()) {
      if (property) el.style.setProperty(property, "1");
      cb.current?.(1, false);
      return;
    }
    let raf = 0;
    let ultimo = -1;
    let vivo = !haIO();

    const leggi = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp01((vh * inizio - r.top) / (vh * (inizio - fine) + r.height));
      if (Math.abs(p - ultimo) > 0.001 || (p !== ultimo && (p === 0 || p === 1))) {
        ultimo = p;
        // scrivere una variabile invalida gli stili di tutto il sottoalbero: solo se serve al CSS
        if (property) el.style.setProperty(property, p.toFixed(4));
        cb.current?.(p, true);
      }
    };
    const kick = () => {
      if (vivo && !raf) raf = requestAnimationFrame(leggi);
    };
    const io = haIO()
      ? new IntersectionObserver(
          ([e]) => {
            vivo = e.isIntersecting;
            if (!raf) raf = requestAnimationFrame(leggi); // una lettura anche all'uscita: resta 0 o 1
          },
          { rootMargin: "20% 0px" },
        )
      : null;
    io?.observe(el);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick, { passive: true });
    kick();
    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, property, inizio, fine]);
}

/* ───────────────────────── Parallasse leggera ───────────────────────── */

/**
 * Props per un elemento decorativo con parallasse: `<span {...parallasse(24)} />`. È CSS puro
 * (`.fx-plx`, animation-timeline: view(), sul compositor): niente JavaScript a ogni scroll. Parte
 * solo dove il browser sa farla e senza prefers-reduced-motion; altrove l'elemento sta fermo.
 * Criterio: solo illustrazioni decorative (macchie di luce, foglie), mai testo, pulsanti, hotspot o
 * diorami; al massimo due elementi per schermata. `profondita` in px (default 24 desktop, 14 telefono).
 */
export function parallasse(profondita?: number): { className: string; style?: Record<string, string> } {
  return profondita === undefined
    ? { className: "fx-plx" }
    : { className: "fx-plx", style: { "--depth": `${profondita}px` } };
}

/* ───────────────────────── Scena fissata (sticky) ───────────────────────── */

const MQ_STICKY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

function subscribeSticky(onChange: () => void) {
  const mq = window.matchMedia(MQ_STICKY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * true quando le scene fissate sono attive: schermo ≥ 1024 px e movimento non ridotto. È la stessa
 * condizione dei CSS delle scene (`@media`): sotto, le scene sono alte quanto il loro contenuto e
 * i controlli agiscono direttamente. Sul server vale false (non si legge nel markup).
 */
export function useScenaFissata(): boolean {
  return useSyncExternalStore(
    subscribeSticky,
    () => window.matchMedia(MQ_STICKY).matches,
    () => false,
  );
}

/** Misure di una sezione fissata: figlio sticky e distanza percorribile. */
export function misuraScenaFissata(sezione: HTMLElement): { stickyTop: number; travel: number } {
  const stage = sezione.firstElementChild as HTMLElement | null;
  if (!stage) return { stickyTop: 0, travel: 0 };
  const top = parseFloat(getComputedStyle(stage).top);
  return {
    stickyTop: Number.isFinite(top) ? top : 0,
    // offsetHeight: stabile anche con la barra del browser che cambia (le altezze sono in svh)
    travel: Math.max(0, sezione.offsetHeight - stage.offsetHeight),
  };
}

/** p 0..1 della sezione fissata adesso. 0 se non c'è percorso (movimento ridotto, telefono). */
export function progressoScenaFissata(sezione: HTMLElement): number {
  const { stickyTop, travel } = misuraScenaFissata(sezione);
  if (travel < 2) return 0;
  return clamp01((stickyTop - sezione.getBoundingClientRect().top) / travel);
}

/** Porta la pagina al punto in cui la sezione fissata ha p = `p`. */
export function scorriAProgresso(sezione: HTMLElement, p: number, morbido = false): void {
  const { stickyTop, travel } = misuraScenaFissata(sezione);
  const dove = window.scrollY + sezione.getBoundingClientRect().top - stickyTop + clamp01(p) * travel;
  window.scrollTo({
    top: dove,
    behavior: morbido && !getPrefersReducedMotion() ? "smooth" : "instant",
  });
}

export type ScenaFissataOptions = {
  /** Chiamata solo quando p cambia davvero. `attiva` = la sezione ha un percorso (scene fissate attive). */
  onProgress: (p: number, attiva: boolean) => void;
  /** Custom property scritta sulla sezione (0..1), solo se un CSS la legge. Default: nessuna. */
  property?: string;
};

/**
 * Chiama `onProgress` con p della sezione fissata (primo figlio = stage sticky) e, se serve al CSS,
 * lo scrive in una custom property (`property`). La
 * differenza dall'hook base di lib/motion.ts: p parte quando lo stage SI ATTACCA (sticky top
 * incluso, per esempio sotto l'header), così slider e scroll coincidono al pixel.
 */
export function useScenaFissataProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { onProgress, property }: ScenaFissataOptions,
): void {
  const cb = useRef(onProgress);
  useEffect(() => {
    cb.current = onProgress;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let ultimo = -1;
    let vivo = !haIO();

    const leggi = () => {
      raf = 0;
      const { travel } = misuraScenaFissata(el);
      const p = progressoScenaFissata(el);
      if (Math.abs(p - ultimo) > 0.0005 || (p !== ultimo && (p === 0 || p === 1))) {
        ultimo = p;
        if (property) el.style.setProperty(property, p.toFixed(4));
        cb.current(p, travel >= 2);
      }
    };
    const kick = () => {
      if (vivo && !raf) raf = requestAnimationFrame(leggi);
    };
    const io = haIO()
      ? new IntersectionObserver(
          ([e]) => {
            vivo = e.isIntersecting;
            if (!raf) raf = requestAnimationFrame(leggi);
          },
          { rootMargin: "20% 0px" },
        )
      : null;
    io?.observe(el);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick, { passive: true });
    // un cambio di sticky/no sticky (rotazione, impostazione) rilegge subito
    const mq = window.matchMedia(MQ_STICKY);
    mq.addEventListener("change", kick);
    kick();
    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      mq.removeEventListener("change", kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, property]);
}

/**
 * Indice di tappa da p con isteresi (MOTION 8.4): non sfarfalla sul confine. `soglie` crescenti
 * (es. [0.17, 0.5, 0.83] per 4 tappe). Sale solo oltre soglia + banda, scende solo sotto soglia − banda.
 */
export function tappaDaProgresso(
  p: number,
  soglie: readonly number[],
  precedente: number | null,
  banda = 0.03,
): number {
  let i = precedente ?? soglie.filter((s) => p > s).length;
  while (i < soglie.length && p > soglie[i] + banda) i++;
  while (i > 0 && p < soglie[i - 1] - banda) i--;
  return i;
}
