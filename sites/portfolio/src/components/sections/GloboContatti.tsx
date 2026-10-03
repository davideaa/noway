"use client";

import { useEffect, useRef } from "react";
import { Globo } from "@/components/film/Globo";

/**
 * Il pianeta della sezione Contatti (Davide): compare quando si arriva a
 * "Hai un dubbio?", sparisce appena si torna su (o si scende all'avviso).
 * La classe .is-in sulla sezione accende il disegno (Globo) e la dissolvenza (CSS).
 */
export function GloboContatti() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    const sezione = el?.closest("section") as HTMLElement | null;
    if (!el || !sezione) return;
    const io = new IntersectionObserver(
      ([e]) => {
        // dentro quando la sezione occupa almeno un terzo dello schermo
        const quota = e.intersectionRect.height / Math.max(1, window.innerHeight);
        sezione.classList.toggle("is-in", e.isIntersecting && quota > 0.33);
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    io.observe(sezione);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="contatti-globo">
      <Globo interattivo />
      <p className="contatti-globo__hint mono" aria-hidden="true">
        Trascina per farlo girare
      </p>
    </div>
  );
}
