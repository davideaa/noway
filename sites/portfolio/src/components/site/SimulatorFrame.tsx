"use client";

import { ExternalLink, Maximize2, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";

/**
 * Il simulatore di Davide (public/simulatore/index.html, non si modifica).
 * NON si carica da solo: e' un'app da 1,7 MB con 10.000 simulazioni e i suoi
 * canvas, e incorporata in questa pagina faceva crollare Safari su iPhone
 * ("Si e' verificato ripetutamente un errore"). Quindi: su desktop un tasto
 * "Carica il simulatore qui" monta l'iframe; su touch si apre in una scheda
 * a parte (piu' memoria, e a schermo intero si usa meglio).
 */
export function SimulatorFrame({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0);
  }, []);
  const schermoIntero = () => {
    const el = ref.current;
    if (el && typeof el.requestFullscreen === "function") {
      el.requestFullscreen().catch(() => window.open(src, "_blank", "noopener"));
    } else {
      window.open(src, "_blank", "noopener");
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {!loaded && !touch && (
          <button type="button" className={buttonVariants()} onClick={() => setLoaded(true)}>
            <Play size={16} strokeWidth={1.6} aria-hidden />
            Carica il simulatore qui
          </button>
        )}
        {loaded && (
          <button type="button" className={buttonVariants({ variant: "outline" })} onClick={schermoIntero}>
            <Maximize2 size={16} strokeWidth={1.6} aria-hidden />
            Apri a schermo intero
          </button>
        )}
        <a href={src} target="_blank" rel="noopener" className={touch ? buttonVariants() : "chip-btn no-underline"}>
          <ExternalLink size={16} strokeWidth={1.6} aria-hidden />
          Apri in una nuova scheda
        </a>
      </div>
      {touch && !loaded && (
        <p className="t-note">Su telefono e tablet il simulatore si apre in una scheda a parte: e&apos; pesante e a schermo intero si usa meglio.</p>
      )}
      {loaded && <iframe ref={ref} src={src} title={title} className="sim__frame" allowFullScreen />}
    </div>
  );
}
