"use client";

/*
 * Stati del riquadro sopra il poster (UX 5.2):
 *  - caricamento: «Stiamo preparando la scena…» (aria-live polite; compare solo se l'attesa dura)
 *  - fallback:    «La vista 3D non è disponibile su questo dispositivo. Ecco la versione semplificata.»
 *  - manuale:     pulsante «Carica la vista 3D» (risparmio dati o poca memoria)
 * La regione `role="status"` esiste sempre (anche vuota): i lettori di schermo annunciano il cambio.
 */

import { copy } from "@/content/copy";
import { useStatoScena, type SceneController } from "./SceneCanvas";
import s from "./scene.module.css";

export function SceneFallback({ controller }: { controller: SceneController }) {
  const stato = useStatoScena(controller);
  const testo =
    stato === "caricamento"
      ? copy.servizio.caricamento3D
      : stato === "fallback"
        ? copy.servizio.fallback3D
        : "";
  return (
    <div className={s.stato}>
      <p className={s.statoTesto} role="status" aria-live="polite">
        {testo}
      </p>
      {stato === "manuale" && (
        <button type="button" className={s.carica} onClick={() => controller.richiedi3D()}>
          {copy.azioni.caricaVista3D}
        </button>
      )}
    </div>
  );
}
