"use client";

import { ExternalLink, Maximize2 } from "lucide-react";
import { useRef } from "react";
import { buttonVariants } from "@/components/ui/button";

/**
 * Il simulatore di Davide (public/simulatore/index.html, non si modifica)
 * incorporato a tutta larghezza, caricato solo quando si avvicina (lazy).
 * "Apri a schermo intero" usa la Fullscreen API sull'iframe; dove non c'e'
 * (o senza JavaScript) resta il link che lo apre in una nuova scheda.
 */
export function SimulatorFrame({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
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
        <button type="button" className={buttonVariants({ variant: "outline" })} onClick={schermoIntero}>
          <Maximize2 size={16} strokeWidth={1.6} aria-hidden />
          Apri a schermo intero
        </button>
        <a href={src} target="_blank" rel="noopener" className="chip-btn no-underline">
          <ExternalLink size={16} strokeWidth={1.6} aria-hidden />
          Apri in una nuova scheda
        </a>
      </div>
      <iframe ref={ref} src={src} title={title} loading="lazy" className="sim__frame" allowFullScreen />
    </div>
  );
}
