"use client";

import { useEffect } from "react";

/**
 * Un solo IntersectionObserver per tutte le entrate `.reveal`.
 * Ogni blocco entra una volta sola, poi non si osserva piu'.
 * Lo stile (translateZ + opacity) e' tutto in globals.css.
 */
export function RevealObserver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const above = e.boundingClientRect.bottom < 0;
          if (e.isIntersecting || above) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    // QA B2: un blocco raggiunto da tastiera entra subito, anche se l'osservatore non l'ha ancora visto
    const onFocus = (e: FocusEvent) => {
      const block = (e.target as HTMLElement | null)?.closest?.(".reveal");
      if (block && !block.classList.contains("in")) {
        block.classList.add("in");
        io.unobserve(block);
      }
    };
    document.addEventListener("focusin", onFocus);
    return () => {
      io.disconnect();
      document.removeEventListener("focusin", onFocus);
    };
  }, []);
  return null;
}
