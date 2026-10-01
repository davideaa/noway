"use client";

/*
 * Hook e funzioni di movimento (MOTION 1, 2.4; UX 11.1).
 * Regola: lo stato di una scena è funzione di un numero p in 0..1; qui si
 * legge/scrive quel numero senza far rieseguire il rendering di React.
 */

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

/* ───────────────────────── Costanti e funzioni pure ───────────────────────── */

/** Stesse durate dei token CSS --d-* (DESIGN 7). In millisecondi. */
export const DURATION = {
  micro: 160,
  ui: 240,
  in: 480,
  scene: 600,
  max: 800,
  /** dissolvenza di giorno/sera con prefers-reduced-motion */
  reduced: 200,
} as const;

/** Stesse curve dei token CSS --e-in / --e-out. */
export const EASE = {
  in: [0.2, 0.7, 0.2, 1],
  out: [0.4, 0, 1, 1],
} as const;

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Interpolazione dolce 0→1 (derivata nulla agli estremi). */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/**
 * Curva cubic-bezier come funzione t→valore (Newton + bisezione), uguale al CSS.
 * Serve al 3D perché abbia lo stesso "carattere" delle transizioni CSS.
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sy = (s: number) => ((ay * s + by) * s + cy) * s;
  const dx = (s: number) => (3 * ax * s + 2 * bx) * s + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(s) - x;
      if (Math.abs(err) < 1e-6) return sy(s);
      const d = dx(s);
      if (Math.abs(d) < 1e-6) break;
      s -= err / d;
    }
    // Newton non è bastato: bisezione
    let lo = 0;
    let hi = 1;
    s = x;
    for (let i = 0; i < 32; i++) {
      const v = sx(s);
      if (Math.abs(v - x) < 1e-6) break;
      if (x > v) lo = s;
      else hi = s;
      s = (hi - lo) / 2 + lo;
    }
    return sy(s);
  };
}

/** easeIn / easeOut di DESIGN 7, già pronte. */
export const easeIn = cubicBezier(...EASE.in);
export const easeOut = cubicBezier(...EASE.out);

/**
 * Avanzamento 0..1 di una scena fissata: `top` è la distanza dal bordo alto della
 * finestra al bordo alto del contenitore (getBoundingClientRect().top), `travel`
 * è altezza del contenitore meno altezza dello stage sticky. Funzione pura.
 */
export function scrollProgress(top: number, travel: number): number {
  return travel > 0 ? clamp01(-top / travel) : 0;
}

/* ───────────────────────── Movimento ridotto ───────────────────────── */

const RM_QUERY = "(prefers-reduced-motion: reduce)";

/** Lettura puntuale (fuori da React). Sul server: false. */
export function getPrefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(RM_QUERY).matches
  );
}

function syncRmAttribute(reduced: boolean) {
  // MOTION 1.2: html[data-rm] è la fonte unica per il CSS che non usa il media query
  const root = document.documentElement;
  if (reduced) root.setAttribute("data-rm", "");
  else root.removeAttribute("data-rm");
}

function subscribeRm(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(RM_QUERY);
  const handler = () => {
    syncRmAttribute(mq.matches);
    onChange();
  };
  syncRmAttribute(mq.matches);
  mq.addEventListener("change", handler); // si può cambiare a pagina aperta
  return () => mq.removeEventListener("change", handler);
}

/**
 * true se l'utente ha chiesto meno movimento. Ascolta anche il cambio a pagina
 * aperta e tiene `html[data-rm]` allineato. Nel primo HTML (server) vale false.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeRm, getPrefersReducedMotion, () => false);
}

/* ───────────────────────── useInView ───────────────────────── */

export type InViewOptions = {
  /** Margine attorno alla finestra, es. "30% 0px" per anticipare. Default "0px". */
  rootMargin?: string;
  /** Frazione visibile necessaria, 0..1. Default 0. */
  threshold?: number;
  /** Se true, resta true dopo la prima volta (ingressi che partono una volta sola). */
  once?: boolean;
};

/**
 * true mentre l'elemento è (quasi) in vista. Prima dell'idratazione vale false;
 * se il browser non ha IntersectionObserver vale true (meglio mostrare che nascondere).
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { rootMargin = "0px", threshold = 0, once = false }: InViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        // l'ultima voce è la più recente
        const e = entries[entries.length - 1];
        if (e.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold, once]);

  return inView;
}

/* ───────────────────────── useScrollProgress ───────────────────────── */

export type ScrollProgressOptions = {
  /** Custom property scritta sull'elemento. Default "--p". */
  property?: string;
  /** Elemento sticky di cui misurare l'altezza. Default: il primo figlio. */
  stage?: RefObject<HTMLElement | null>;
  /** Chiamata solo quando p cambia davvero (es. per muovere una scena 3D). */
  onProgress?: (p: number) => void;
  /** Margine con cui la scena è considerata "viva". Default "20% 0px". */
  rootMargin?: string;
};

/**
 * Scrive `--p` (0..1) sull'elemento mentre ci si scorre dentro, con un solo
 * requestAnimationFrame per scroll e SENZA far rieseguire il rendering di React.
 * Contenitore alto `100svh + travel`, figlio sticky alto 100svh: p = quanto del
 * "travel" è stato percorso. Usa `svh`, mai `vh`/`dvh`: con la barra di Safari
 * l'altezza cambierebbe mentre si scorre e p salterebbe (MOTION 2.3).
 *
 * Con prefers-reduced-motion il CSS mette `--travel: 0`: travel = 0 → p = 0 e la
 * scena resta ferma nel suo stato finale/iniziale deciso da chi la disegna.
 */
export function useScrollProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { property = "--p", stage, onProgress, rootMargin = "20% 0px" }: ScrollProgressOptions = {},
): void {
  // la callback più recente senza rifare la sottoscrizione a ogni render
  const cb = useRef(onProgress);
  useEffect(() => {
    cb.current = onProgress;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let last = -1;
    let live = false;

    const read = () => {
      raf = 0;
      const st = stage?.current ?? (el.firstElementChild as HTMLElement | null);
      const travel = el.offsetHeight - (st ? st.offsetHeight : 0);
      const p = scrollProgress(el.getBoundingClientRect().top, travel);
      if (Math.abs(p - last) > 0.0005 || (p !== last && (p === 0 || p === 1))) {
        last = p;
        el.style.setProperty(property, p.toFixed(4));
        cb.current?.(p);
      }
    };
    const kick = () => {
      if (live && !raf) raf = requestAnimationFrame(read);
    };

    if (typeof IntersectionObserver === "undefined") {
      live = true;
    }
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([e]) => {
              live = e.isIntersecting;
              // una lettura anche all'uscita: p resta 0 o 1 e non a 0,97
              if (!raf) raf = requestAnimationFrame(read);
            },
            { rootMargin },
          );
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
  }, [ref, stage, property, rootMargin]);
}
