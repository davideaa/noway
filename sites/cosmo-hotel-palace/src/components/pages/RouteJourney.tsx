"use client";

/*
 * «Da qui al centro di Milano» (UX 4.3 scena 4 e 8, MOTION 6.4, COPY 5.4/9): lo schema SVG (RouteMap) con
 * le cinque tappe e, accanto, l'elenco numerato. Nessun minuto, nessuna distanza, nessuna mappa
 * incorporata (DECISIONI 8): lo schema dice «non in scala».
 *
 * - L'elenco c'è sempre (HTML vero): è l'alternativa testuale. Toccare una tappa la evidenzia nello
 *   schema e porta lì il segnaposto del tram (480 ms, solo `transform`). La tappa attiva si vede con
 *   numero pieno + peso del testo, non solo con il colore (`aria-current="step"`).
 * - Il tracciato si disegna una volta sola quando entra in vista (stroke-dashoffset di un tratto
 *   corto). Con movimento ridotto o senza JavaScript è già disegnato e il tram è sulla tappa 1.
 */

import { useEffect, useRef, useState } from "react";
import { RouteMap } from "@/components/art/RouteMap";
import { copy, fmt } from "@/content/copy";
import { copyPagine } from "@/content/copy-pagine";
import { getPrefersReducedMotion } from "@/lib/motion";
import s from "./route.module.css";

type Tappa = 1 | 2 | 3 | 4 | 5;

/** Dove sta ogni tappa nello schema (stessi numeri di RouteMap: STOP). Il segnaposto è traslato di (-46, -11). */
const STOP: Record<Tappa, [number, number]> = { 1: [130, 100], 2: [130, 178], 3: [160, 262], 4: [200, 352], 5: [222, 486] };

export function RouteJourney() {
  const [tappa, setTappa] = useState<Tappa>(1);
  const quadro = useRef<HTMLDivElement>(null);
  const passi = copy.comeArrivare.percorso.passi;

  // il tram scivola sulla tappa scelta (la trasformazione CSS vince sull'attributo dell'SVG)
  useEffect(() => {
    const tram = quadro.current?.querySelector<SVGGElement>("[data-route-tram]");
    if (!tram) return;
    const [x, y] = STOP[tappa];
    tram.style.transform = `translate(${x - 46}px, ${y - 11}px)`;
  }, [tappa]);

  // il tracciato si disegna una volta, quando entra in vista
  useEffect(() => {
    const el = quadro.current;
    if (!el || getPrefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    el.dataset.disegno = "prima";
    const io = new IntersectionObserver(
      (voci) => {
        if (voci.some((v) => v.isIntersecting)) {
          el.dataset.disegno = "fatto";
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={s.percorso}>
      <div ref={quadro} className={s.quadro}>
        <RouteMap
          tappa={tappa}
          decorativo={false}
          titolo={copy.comeArrivare.percorso.ariaMappa}
        />
      </div>

      <div className={s.testo}>
        <h2 className="t-h2">{copy.comeArrivare.percorso.titolo}</h2>
        <p className={s.corpo}>{copy.comeArrivare.percorso.corpo}</p>
        <ol className={s.elenco} aria-label={copyPagine.comeArrivare.ariaPercorso}>
          {passi.map((nome, i) => {
            const n = (i + 1) as Tappa;
            const attiva = n === tappa;
            return (
              <li key={nome}>
                <button
                  type="button"
                  className={s.passo}
                  aria-current={attiva ? "step" : undefined}
                  onClick={() => setTappa(n)}
                >
                  <span className={s.numero} aria-hidden="true">
                    {n}
                  </span>
                  <span className={s.nome}>{nome}</span>
                  <span className="sr-only">
                    {`. ${fmt(copyPagine.comeArrivare.tappa, { n, tot: passi.length })}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
