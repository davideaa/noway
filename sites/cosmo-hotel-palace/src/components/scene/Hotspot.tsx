"use client";

/*
 * Un hotspot: bottone HTML da 44 px con puntino da 14 px e pillola-etichetta (DESIGN 4.5, UX 11.3).
 * Il `transform` del contenitore lo scrive HotspotLayer a ogni frame, senza render di React.
 * Il bottone non sta dentro l'elemento con `role="img"` (i figli di role=img sarebbero
 * presentazionali): vive nel livello `role="group"` sopra il canvas.
 */

import type { Ref } from "react";
import { copy, fmt } from "@/content/copy";
import type { Hotspot as HotspotDef } from "@/content/types";
import s from "./scene.module.css";

type Props = {
  h: HotspotDef;
  aperto: boolean;
  /** Per ref: HotspotLayer lo usa per scrivere transform e data-*. */
  rif: Ref<HTMLDivElement>;
  /** Clic, tocco, Invio, Spazio. */
  onAttiva: (h: HotspotDef) => void;
  /** Esc con il focus sul bottone. */
  onChiudi: () => void;
  /** Il focus arriva da tastiera: la pillola si apre (WCAG 1.4.13), la camera non si muove. */
  onFocusTastiera: (h: HotspotDef) => void;
};

export function Hotspot({ h, aperto, rif, onAttiva, onChiudi, onFocusTastiera }: Props) {
  const pillId = `hs-pill-${h.id}`;
  return (
    <div
      ref={rif}
      className={s.hs}
      data-on="0"
      data-aperto={aperto ? "1" : "0"}
      data-hs={h.id}
      onKeyDown={(e) => {
        if (e.key === "Escape" && aperto) {
          e.stopPropagation();
          onChiudi();
        }
      }}
    >
      <button
        type="button"
        className={s.hsBtn}
        aria-label={fmt(copy.hotspot.aria, { titolo: h.titolo })}
        aria-expanded={aperto}
        aria-controls={pillId}
        onClick={() => onAttiva(h)}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) onFocusTastiera(h);
        }}
      >
        <span className={s.halo} aria-hidden="true" />
        <span className={s.dot} aria-hidden="true" />
      </button>
      <div id={pillId} className={s.pill}>
        <span className={s.pillTitolo}>{h.titolo}</span>
        <span className={s.pillDato}>{h.dato}</span>
      </div>
    </div>
  );
}
