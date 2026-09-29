"use client";

/**
 * Sfondo dell'hero: fallback CSS sempre presente (e' anche l'immagine mostrata
 * mentre lo shader carica, quindi nessun salto), shader caricato dopo il primo
 * disegno solo se il dispositivo puo', smontato quando l'hero esce dallo schermo.
 * Velo e reticolo sono CSS: garantiscono il contrasto del testo.
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useMotionPrefs } from "./MotionPrefs";

const ShaderLayer = dynamic(() => import("./ShaderLayer"), { ssr: false });

export function HeroBackground() {
  const { canAnimate, paused, reportSlow } = useMotionPrefs();
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false); // primo disegno + pagina caricata
  const [visible, setVisible] = useState(true); // l'hero e' ancora a schermo

  // Dopo il primo disegno e a pagina caricata, quando il browser e' libero.
  useEffect(() => {
    let cancelled = false;
    let idle = 0;
    let timer = 0;
    const go = () => {
      if (!cancelled) setReady(true);
    };
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(go, { timeout: 2500 });
      else timer = window.setTimeout(go, 800);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (idle) window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  // Un solo canvas WebGL alla volta: si smonta quando l'hero esce.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const mountShader = ready && visible && canAnimate && !paused;

  return (
    <div ref={rootRef} className="hero__bg" aria-hidden="true">
      <div className="hero__fallback" />
      {mountShader && <ShaderLayer onSlow={reportSlow} />}
      <div className="hero__veil" />
      <div className="hero__reticle" />
      <div className="hero__fade" />
    </div>
  );
}
