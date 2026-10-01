/**
 * Costanti della scena della sala congressi. Senza import di three né di React: le usano sia
 * `def.ts` (JS iniziale) sia `build.ts` (caricato a richiesta).
 */

import type { ConfigurazioneSala, SceneDef } from "@/content/types";
import { SALA_SCENA_ID } from "@/lib/congress/availability";

/** Configurazione di partenza della scena: Plenaria del Sole, platea, capienza della tabella, sala unita. */
export const CONFIGURAZIONE_INIZIALE: ConfigurazioneSala = {
  sala: SALA_SCENA_ID,
  disposizione: "platea",
  ospiti: null,
  divisa: false,
};

/**
 * Posa di partenza (gradi): azimut 0 = dal fondo della sala verso il palco; `pol` 40 = 50° di
 * elevazione (MOTION 5.1 «iso a 50°»). La distanza non è fissa: la calcola la scena per ogni sala.
 */
export const VISTA_SALA = { az: 0, pol: 40 } as const;

/** Orbita limitata: ±20° in azimut (MOTION 5.1), elevazione fra 30° e 60° (pol 55..30). Zoom bloccato. */
export const LIMITI_SALA: SceneDef["limiti"] = { az: [-20, 20], pol: [30, 55] };

