"use client";

/*
 * La vista «Pianta» (UX 5.2): FloorPlan (SVG, non serve il 3D) con gli stessi punti del diorama.
 * I punti sono i bottoni del runtime (`Hotspot`) posti in percentuale sopra il disegno, con la stessa
 * pillola e lo stesso stato (`controller.hotspotAperto`) del 3D e dell'elenco testuale: una sola alla
 * volta, Esc o secondo tocco la chiude, un tocco fuori la chiude.
 * Sopra il disegno, nella curva dell'arco, i m² veri (FloorPlan senza la sua etichetta).
 */
import { useEffect } from "react";
import { FloorPlan } from "@/components/art/FloorPlan";
import { Hotspot } from "@/components/scene/Hotspot";
import { useControllerValue, type SceneController } from "@/components/scene/SceneCanvas";
import { roomById } from "@/content/rooms";
import type { RoomId, Tono } from "@/content/types";
import { PIANTA_DIM, PIANTA_PUNTI } from "./pianta-punti";
import { testiCamere } from "./testi";
import s from "./rooms.module.css";

type Props = { tipo: RoomId; controller: SceneController; tono: Tono };

/** «22 m²», «44 m²» e, per la Family, «22 + 22 m²» (superfici vere: BRIEF, UX 5.1). */
function testoMq(tipo: RoomId): string {
  const r = roomById(tipo);
  const parti = "mqParti" in r ? (r.mqParti as readonly number[]) : null;
  return parti ? `${parti.join(" + ")} m²` : `${r.mq} m²`;
}

export function PlanView({ tipo, controller, tono }: Props) {
  const aperto = useControllerValue(controller, "hotspot", (c) => c.hotspotAperto);
  const { w, h } = PIANTA_DIM[tipo];
  const punti = PIANTA_PUNTI[tipo];
  const lista = controller.hotspotVisibili();

  // un tocco fuori da un punto chiude la pillola (come nel livello 3D)
  useEffect(() => {
    if (!aperto) return;
    const fuori = (e: PointerEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest("[data-hs]")) return;
      controller.apriHotspot(null);
    };
    document.addEventListener("pointerdown", fuori);
    return () => document.removeEventListener("pointerdown", fuori);
  }, [aperto, controller]);

  return (
    <div className={s.pianta}>
      <p className={s.pianteMq} aria-hidden="true">
        {testoMq(tipo)}
      </p>
      <div className={s.pianteDisegno} data-tipo={tipo} style={{ aspectRatio: `${w} / ${h}` }}>
        <FloorPlan tipo={tipo} tono={tono} decorativo={false} etichetta={false} />
        <div className={s.pianteLivello} role="group" aria-label={testiCamere.ariaPuntiPianta}>
          {lista.map((hs) => {
            const p = punti[hs.id];
            if (!p) return null;
            const fx = p[0] / w;
            const fy = p[1] / h;
            return (
              <div key={hs.id} className={s.puntoPianta} style={{ left: `${fx * 100}%`, top: `${fy * 100}%` }}>
                <Hotspot
                  h={hs}
                  aperto={aperto === hs.id}
                  rif={(el) => {
                    if (!el) return;
                    // visibile subito; la pillola si apre dal lato con più spazio
                    el.dataset.on = "1";
                    el.dataset.lato = fx > 0.5 ? "sx" : "dx";
                    el.dataset.sotto = fy < 0.34 ? "1" : "0";
                    el.style.setProperty("--pill-max", "220px");
                  }}
                  onAttiva={(x) => controller.apriHotspot(aperto === x.id ? null : x.id)}
                  onChiudi={() => controller.apriHotspot(null)}
                  onFocusTastiera={(x) => controller.apriHotspot(x.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
