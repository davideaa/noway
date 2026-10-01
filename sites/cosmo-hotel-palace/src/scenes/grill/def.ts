/*
 * Cosmo Grill & Lounge: definizione SENZA `three`. La scena vera è in `build.ts`.
 *
 * Contratto (MOTION 6.2):
 *  - `controller.setLuce(t)`: 0 mattina · 1/3 pranzo · 2/3 aperitivo · 1 sera. Anche i dettagli
 *    (tazzine, calici, lumini) compaiono con `t`. Alla sera le lampade sono l'unica luce.
 *  - `setProgresso(p)`: nessun effetto (la giornata è tutta in `t`; la sezione sticky usa p == t).
 *  - Orbita: trascinamento, ◀ ▶ e frecce (az ±35° attorno alla posa iniziale), zoom bloccato.
 */

import { createElement } from "react";
import { PosterGrill } from "@/components/art/PosterGrill";
import { copy } from "@/content/copy";
import { grillHotspots } from "@/content/hotspots/grill";
import type { SceneDef } from "@/content/types";
import { GRILL_LIMITI } from "./limiti";

export const grillDef: SceneDef = {
  id: "grill",
  aria: copy.ristorazione.ariaDiorama,
  nota: copy.ristorazione.nota,
  poster: createElement(PosterGrill, { tono: "sera" }),
  hotspots: grillHotspots,
  limiti: GRILL_LIMITI,
  costruisci: async (ctx) => (await import("./build")).build(ctx),
};
