"use client";

/*
 * SceneFrame: il riquadro completo di una scena 3D (UX 11.3):
 *
 *   <figure>
 *     <div viewport>  slot del canvas (role="img") · poster · stato · gruppo hotspot (role="group")
 *     [controlli ◀ ▶ · Ripristina vista]   (opzionale)
 *     <figcaption>    nota «Ricostruzione illustrativa, non una fotografia.»
 *     [elenco testuale degli hotspot]      (opzionale)
 *   </figure>
 *
 * Il poster è nell'HTML fin dal primo byte (LCP, nessun JS). Il canvas è UNO per tutta la visita
 * e arriva qui solo quando questo riquadro è il più visibile (vedi SceneCanvas).
 *
 * `def` e `controller` non possono arrivare da un Server Component (contengono funzioni):
 * il genitore deve essere un Client Component.
 */

import { useState, type CSSProperties, type ReactNode } from "react";
import type { SceneDef, Tono } from "@/content/types";
import { CameraRig, type EtichetteRig } from "./CameraRig";
import { HotspotLayer, HotspotList, type FiltroHotspot } from "./HotspotLayer";
import { Poster } from "./Poster";
import { SceneCanvas, SceneController, useStatoScena } from "./SceneCanvas";
import { SceneFallback } from "./SceneFallback";
import s from "./scene.module.css";

export type SceneFrameProps = {
  def: SceneDef;
  /** Per pilotare la scena da fuori (`useSceneController(def)`); altrimenti se ne crea uno. */
  controller?: SceneController;
  /** Rapporto del riquadro, es. "4 / 5". Senza: riempie il genitore (hero sticky). Evita il CLS. */
  aspect?: string;
  /** `data-tono` sul riquadro (DESIGN 2.3). */
  tono?: Tono;
  className?: string;
  /** Trascinamento e frecce ◀ ▶ sul canvas (default sì; false per la hero guidata dallo scroll). */
  interattiva?: boolean;
  /** Clic su un hotspot = camera sulla sua vista (default sì; la hero no). */
  muoviCameraAlClic?: boolean;
  filtroHotspot?: FiltroHotspot;
  /** Elenco testuale equivalente sotto la scena (default sì). `false` se la pagina ha il suo. */
  elenco?: boolean;
  /** aria-label dell'elenco, es. «Punti della camera». */
  titoloElenco?: string;
  /** Pulsanti ◀ ▶ e «Ripristina vista» sotto il riquadro. */
  controlli?: boolean | EtichetteRig;
  /** Mostra la nota della scena (default sì). */
  mostraNota?: boolean;
  /** Istruzioni brevi (COPY: «Trascina per ruotare · Tocca i punti per i dettagli»). */
  istruzioni?: ReactNode;
};

export function SceneFrame({
  def,
  controller,
  aspect,
  tono,
  className,
  interattiva = true,
  muoviCameraAlClic = true,
  filtroHotspot,
  elenco = true,
  titoloElenco,
  controlli = false,
  mostraNota = true,
  istruzioni,
}: SceneFrameProps) {
  const [proprio] = useState(() => (controller ? null : new SceneController(def)));
  const c = controller ?? (proprio as SceneController);
  const stato = useStatoScena(c);
  const stile: CSSProperties | undefined = aspect ? { aspectRatio: aspect } : undefined;
  const idIstruzioni = `${def.id}-istruzioni`;

  return (
    <figure
      className={`${s.frame} ${className ?? ""}`}
      data-stato={stato}
      data-tono={tono}
      data-focus-ring="double"
    >
      <div className={`${s.viewport} ${aspect ? "" : s.fill}`} style={stile}>
        <SceneCanvas controller={c} def={def} interattiva={interattiva} className={s.slot} />
        <Poster def={def} stato={stato} />
        <SceneFallback controller={c} />
        <HotspotLayer controller={c} muoviCamera={muoviCameraAlClic} filtro={filtroHotspot} />
      </div>
      {controlli && interattiva && (
        <CameraRig controller={c} etichette={typeof controlli === "object" ? controlli : undefined} />
      )}
      {mostraNota && <figcaption className={s.nota}>{def.nota}</figcaption>}
      {istruzioni && (
        <p className={s.istruzioni} id={idIstruzioni}>
          {istruzioni}
        </p>
      )}
      {elenco && <HotspotList controller={c} titolo={titoloElenco} muoviCamera={muoviCameraAlClic} />}
    </figure>
  );
}
