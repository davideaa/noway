"use client";

/*
 * HotspotLayer: i bottoni sopra il canvas, posizionati proiettando i punti 3D (MOTION 4.4).
 * A ogni frame disegnato dallo Stage si scrivono SOLO `transform` e due attributi `data-*`;
 * nessuna lettura di layout (le dimensioni le dà lo Stage via ResizeObserver) e nessun
 * render di React. `HotspotList` è l'elenco testuale equivalente (UX 11.3: nessuna
 * informazione sta solo nel 3D).
 */

import { useEffect, useRef } from "react";
import { copy } from "@/content/copy";
import type { Hotspot as HotspotDef, Proiezione } from "@/content/types";
import { Hotspot } from "./Hotspot";
import { useControllerValue, type SceneController } from "./SceneCanvas";
import s from "./scene.module.css";

/** Decide se un hotspot è visibile in questo momento (es. finestre di `p` della hero, MOTION 3.5). */
export type FiltroHotspot = (h: HotspotDef, c: SceneController) => boolean;

type Props = {
  controller: SceneController;
  /** Un clic porta la camera sulla vista dell'hotspot (default sì; la hero guidata da `p` no). */
  muoviCamera?: boolean;
  filtro?: FiltroHotspot;
  /** aria-label del gruppo (default COPY: «Punti della scena»). */
  etichetta?: string;
};

type Stato = { x: number; y: number; on: boolean; lato: string; larg: number; sotto: boolean; pulsato: boolean };

export function HotspotLayer({
  controller,
  muoviCamera = true,
  filtro,
  etichetta = copy.sito.ariaPuntiScena,
}: Props) {
  const sera = useControllerValue(controller, "luce", (c) => c.sera);
  const aperto = useControllerValue(controller, "hotspot", (c) => c.hotspotAperto);
  const elementi = useRef(new Map<string, HTMLDivElement>());
  // `sera` entra nel calcolo: cambia la lista, non il controller
  const visibili = controller.hotspotVisibili();
  const chiave = visibili.map((h) => h.id).join("|");
  const filtroRif = useRef(filtro);
  useEffect(() => {
    filtroRif.current = filtro;
  });

  useEffect(() => {
    const lista = controller.hotspotVisibili();
    const stati = new Map<string, Stato>();
    for (const h of lista) {
      stati.set(h.id, { x: NaN, y: NaN, on: false, lato: "", larg: 0, sotto: false, pulsato: false });
    }
    const p: Proiezione = { x: 0, y: 0, visibile: false };

    const aggiorna = () => {
      const W = controller.dimensioni.larghezza;
      for (const h of lista) {
        const el = elementi.current.get(h.id);
        const st = stati.get(h.id);
        if (!el || !st) continue;
        controller.proietta(h.pos, p);
        const f = filtroRif.current;
        const on = controller.handle !== null && p.visibile && (!f || f(h, controller));
        if (on) {
          // mezzo pixel basta: così non si riscrive lo stile quando nulla si è mosso
          const x = Math.round(p.x * 2) / 2;
          const y = Math.round(p.y * 2) / 2;
          if (x !== st.x || y !== st.y) {
            st.x = x;
            st.y = y;
            el.style.transform = `translate(${x}px, ${y}px)`;
          }
          // la pillola si apre dal lato con più spazio e non esce mai dal riquadro (max 240 px)
          const destra = W - x;
          const lato = destra >= 250 || destra >= x ? "dx" : "sx";
          const larg = Math.max(120, Math.min(240, Math.floor(((lato === "dx" ? destra : x) - 8) / 10) * 10));
          if (lato !== st.lato) {
            st.lato = lato;
            el.dataset.lato = lato;
          }
          if (larg !== st.larg) {
            st.larg = larg;
            el.style.setProperty("--pill-max", `${larg}px`);
          }
          const sotto = y < 96;
          if (sotto !== st.sotto) {
            st.sotto = sotto;
            el.dataset.sotto = sotto ? "1" : "0";
          }
        }
        if (on !== st.on) {
          st.on = on;
          el.dataset.on = on ? "1" : "0";
          if (on && !st.pulsato) {
            st.pulsato = true;
            el.dataset.pulsa = "1"; // un solo ciclo alla prima comparsa
          }
        }
      }
    };

    aggiorna();
    const offFrame = controller.onFrame(aggiorna);
    const offStato = controller.subscribe("stato", aggiorna);
    return () => {
      offFrame();
      offStato();
    };
    // `chiave` = elenco degli hotspot visibili (cambia con giorno/sera)
  }, [controller, chiave]);

  // clic fuori da un hotspot (sul canvas, sulla pagina) chiude la pillola
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
    <div className={s.layer} role="group" aria-label={etichetta} data-sera={sera ? "1" : "0"}>
      {visibili.map((h) => (
        <Hotspot
          key={h.id}
          h={h}
          aperto={aperto === h.id}
          rif={(el) => {
            if (el) elementi.current.set(h.id, el);
            else elementi.current.delete(h.id);
          }}
          onAttiva={(x) => controller.apriHotspot(aperto === x.id ? null : x.id, { muovi: muoviCamera })}
          onChiudi={() => controller.apriHotspot(null)}
          onFocusTastiera={(x) => controller.apriHotspot(x.id)}
        />
      ))}
    </div>
  );
}

/* ───────────────────────── Elenco testuale equivalente ───────────────────────── */

type PropsElenco = {
  controller: SceneController;
  /** aria-label dell'elenco, es. «Punti della camera» (COPY). */
  titolo?: string;
  muoviCamera?: boolean;
  className?: string;
};

/**
 * Una riga per hotspot (titolo e dato di COPY). Ogni riga è un bottone: apre la pillola, porta
 * la camera sul punto e lascia il focus dov'è, cioè sulla riga. Funziona anche senza 3D.
 */
export function HotspotList({
  controller,
  titolo = copy.sito.ariaPuntiScena,
  muoviCamera = true,
  className,
}: PropsElenco) {
  useControllerValue(controller, "luce", (c) => c.sera);
  const aperto = useControllerValue(controller, "hotspot", (c) => c.hotspotAperto);
  return (
    <ul className={`${s.elenco} ${className ?? ""}`} aria-label={titolo}>
      {controller.hotspotVisibili().map((h) => (
        <li key={h.id}>
          <button
            type="button"
            className={s.elencoBtn}
            aria-pressed={aperto === h.id}
            onClick={() => controller.apriHotspot(aperto === h.id ? null : h.id, { muovi: muoviCamera })}
          >
            <span className={s.elencoTitolo}>{h.titolo}</span>
            <span className={s.elencoDato}>{h.dato}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
