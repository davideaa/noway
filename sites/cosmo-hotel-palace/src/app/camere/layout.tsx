/*
 * Layout di /camere/ (modulo 12, UX 5.2): tiene montati, per le tre pagine camera, la barra delle tab
 * e il riquadro con il diorama 3D. Il canvas WebGL è uno solo per tutta la visita e non si ricrea
 * cambiando tab (cambia lo slot, non il contesto); sull'hub non si disegna nulla di tutto questo.
 * Il BookingProvider lo monta già il layout di root.
 */
import type { ReactNode } from "react";
import { RoomStageHost } from "@/components/rooms/RoomStageHost";

export default function CamereLayout({ children }: { children: ReactNode }) {
  return <RoomStageHost>{children}</RoomStageHost>;
}
