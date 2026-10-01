/*
 * Hall (hero della home): definizione SENZA `three` (resta nel JS iniziale insieme al poster).
 * La scena vera sta in `build.ts` e si scarica solo quando la sezione è in vista.
 *
 * Contratto con la pagina hero (MOTION 3):
 *  - `controller.setProgresso(p)`: la camera va dall'esterno dell'ingresso (p 0) al tronco d'ulivo
 *    e poi guarda il lucernario (p 1). `p` è la stessa cosa dello scroll.
 *  - `controller.setLuce(t)`: 0 alba · 1/3 mattina · 2/3 pomeriggio · 1 sera.
 *  - `vaiA(vista)`: in questa scena `vista` è relativa al tronco: `az` = rotazione attorno al tronco
 *    (0 = dalla porta), `pol` = beccheggio (90 = orizzontale, > 90 guarda in su), `dist` = metri dal tronco.
 *    `ruota(g)` ruota lo sguardo sul posto di ±35° (la scena è guidata da `p`, non c'è orbita libera).
 */

import { createElement } from "react";
import { PosterHall } from "@/components/art/PosterHall";
import { copy } from "@/content/copy";
import { hallHotspots } from "@/content/hotspots/hall";
import type { SceneDef } from "@/content/types";

/** Finestre di `p` in cui ogni hotspot si mostra (MOTION 3.5). Le usa la pagina con `filtroHotspot`. */
export const HALL_FINESTRE_P: Readonly<Record<string, readonly [number, number]>> = {
  vetrate: [0.1, 0.6],
  tende: [0.3, 0.8],
  "tronco-ulivo": [0.3, 0.95],
  lucernario: [0.62, 1],
};

/** Posa della camera a riposo (RM, MOTION 3.6: «la hall vista da dentro»). */
export const HALL_P_RIPOSO = 0.62;

export const hallDef: SceneDef = {
  id: "hall",
  aria: copy.hero.ariaDiorama,
  nota: copy.hero.nota,
  poster: createElement(PosterHall, {}),
  hotspots: hallHotspots,
  limiti: { az: [-40, 40], pol: [60, 130] },
  costruisci: async (ctx) => (await import("./build")).build(ctx),
};
