/*
 * Scena 3D delle camere (modulo 9). `roomsDef(tipo)` restituisce la SceneDef della Classic, della
 * Family o della Suite: stesso codice, stessa scena (`./build`), solo la composizione cambia.
 * Questo file NON importa `three`: `costruisci` scarica `./build` quando serve (MOTION 2.2).
 *
 *   const def = roomsDef("family");            // costante per tipo: sempre la stessa SceneDef
 *   <SceneFrame def={def} controller={…} />
 *
 * Il canvas è unico e condiviso: cambiando camera dalla UI il controller chiede una scena nuova
 * (nuovo `def`), che si costruisce in poche decine di ms e libera tutto con `dispose`. Se la UI
 * vuole invece far scorrere i moduli dentro la stessa scena può chiamare, sulla scena viva,
 * `(controller.handle as RoomsHandle).cambiaTipo("suite")` (entrata/uscita in <= 720 ms).
 */

import { PosterRoom } from "@/components/art/PosterRoom";
import { copy } from "@/content/copy";
import { classicHotspots } from "@/content/hotspots/classic";
import { familyHotspots } from "@/content/hotspots/family";
import { suiteHotspots } from "@/content/hotspots/suite";
import { roomById } from "@/content/rooms";
import type { Hotspot, RoomId, SceneDef } from "@/content/types";
import { LIMITI_ORBITA } from "./viste";
import type { RoomsHandle } from "./build";

export type { RoomsHandle };
export { VISTA_INIZIALE, LIMITI_ORBITA, SOTTO_VISTE } from "./viste";
export type { SottoVista } from "./viste";

const HOTSPOT: Record<RoomId, readonly Hotspot[]> = {
  classic: classicHotspots,
  family: familyHotspots,
  suite: suiteHotspots,
};

const cache = new Map<RoomId, SceneDef>();

function crea(tipo: RoomId): SceneDef {
  const room = roomById(tipo);
  const hotspots = HOTSPOT[tipo];
  const limiti: SceneDef["limiti"] = { az: LIMITI_ORBITA.az, pol: LIMITI_ORBITA.pol };
  return {
    id: room.sceneId,
    aria: room.ariaDiorama,
    nota: copy.camere.notaDiorama,
    poster: <PosterRoom tipo={tipo} />,
    hotspots,
    limiti,
    async costruisci(ctx) {
      const { costruisciRooms } = await import("./build");
      return costruisciRooms(tipo, ctx, { hotspots, limiti });
    },
  };
}

/** SceneDef della camera `tipo` (sempre lo stesso oggetto per lo stesso tipo). */
export function roomsDef(tipo: RoomId): SceneDef {
  let d = cache.get(tipo);
  if (!d) cache.set(tipo, (d = crea(tipo)));
  return d;
}
