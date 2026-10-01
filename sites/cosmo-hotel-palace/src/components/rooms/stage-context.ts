"use client";

/* Contesto del riquadro delle camere: separato da RoomStageHost per evitare import circolari. */
import { createContext, useContext } from "react";
import type { SceneController } from "@/components/scene/SceneCanvas";
import type { RoomId } from "@/content/types";

export type VistaCamera = "3d" | "pianta";

export type RoomStageValue = {
  /** La camera della pagina, `null` sull'hub. */
  tipo: RoomId | null;
  controllerDi: (tipo: RoomId) => SceneController;
  /** Vista EFFETTIVA: senza 3D è sempre la pianta. */
  vista: VistaCamera;
  setVista: (v: VistaCamera) => void;
  /** La luce scelta (vale per le tre camere). */
  sera: boolean;
  setSera: (sera: boolean) => void;
  /** Il 3D non è disponibile (niente WebGL, scena lenta, errore): la pianta è l'unica vista. */
  senza3D: boolean;
};

export const RoomStageContext = createContext<RoomStageValue | null>(null);

export function useRoomStage(): RoomStageValue {
  const v = useContext(RoomStageContext);
  if (!v) throw new Error("useRoomStage: manca <RoomStageHost> (app/camere/layout.tsx).");
  return v;
}
