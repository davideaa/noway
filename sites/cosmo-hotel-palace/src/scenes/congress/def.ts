/**
 * Definizione della scena della sala congressi (UX 14.1, MOTION 5). NESSUN import statico di
 * `three`: questo file sta nel JS iniziale della pagina; `costruisci` carica `./build` solo quando
 * la scena entra in vista (budget UX 13: motore + scena <= 460 KB, scena <= 200 KB).
 *
 * La scena è una FUNZIONE di (sala, disposizione, partecipanti, divisa): non ha stato proprio.
 * Si pilota con `SceneController.configura(config, opzioni?)` (che chiama `SceneHandle.configura`,
 * metodo aggiuntivo di questo modulo, vedi `content/types.ts`). Sala di partenza: Plenaria del Sole,
 * platea (è l'unica ampia con tutte e quattro le disposizioni: MOTION 5.4).
 */

import { createElement } from "react";
import { PosterCongress } from "@/components/art/PosterCongress";
import { copy, fmt } from "@/content/copy";
import type { ConfigurazioneSala, Disposizione, SceneDef } from "@/content/types";
import { etichettaDisposizione, trovaSala } from "@/lib/congress/availability";
import { numeroSedie } from "@/lib/congress/layout";
import { CONFIGURAZIONE_INIZIALE, LIMITI_SALA } from "./costanti";

export { CONFIGURAZIONE_INIZIALE, LIMITI_SALA, VISTA_SALA } from "./costanti";

/**
 * `aria-label` dinamico del canvas (COPY 8.2: «Pianta 3D della sala {sala}, disposizione
 * {disposizione}: {n} sedie in una sala di {superficie} metri quadri.»). Con `divisa` dice solo
 * che la sala è divisa, senza numeri di sedie. Per i `SceneDef` per-configurazione della pagina.
 */
export function ariaSala(config: ConfigurazioneSala): string {
  const hall = trovaSala(config.sala);
  if (!hall) return copy.congressi.configuratore.vuoto;
  const d: Disposizione = hall.cap[config.disposizione] === null ? "platea" : config.disposizione;
  if (config.divisa && hall.divisibleInto) {
    return fmt(copy.congressi.configuratore.pareti.risultatoDivisa, { sala: hall.name, k: hall.divisibleInto });
  }
  return fmt(copy.congressi.configuratore.scena.ariaCanvas, {
    sala: hall.name,
    disposizione: etichettaDisposizione(d).toLowerCase(),
    n: numeroSedie(hall.cap[d] ?? 0, config.ospiti),
    superficie: hall.areaM2,
  });
}

export const congressDef: SceneDef = {
  id: "sala-congressi",
  aria: ariaSala(CONFIGURAZIONE_INIZIALE),
  nota: copy.hero.nota,
  poster: createElement(PosterCongress, { tono: "giorno" }),
  hotspots: [],
  limiti: LIMITI_SALA,
  async costruisci(ctx) {
    const { costruisciSala } = await import("./build");
    return costruisciSala(ctx);
  },
};
