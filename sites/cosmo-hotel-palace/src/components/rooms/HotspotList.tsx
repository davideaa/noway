"use client";

/*
 * «Punti della camera» (UX 5.2, 11.3): il testo equivalente del diorama, SEMPRE visibile.
 * Una riga per punto, titolo e didascalia di COPY; ogni riga è un bottone che porta la camera sul
 * punto (in 3D), apre la pillola e lascia il focus sulla riga. Funziona anche in Pianta e,
 * senza JavaScript, resta il testo. I punti sono 7 (Classic), 6 (Family), 8 (Suite).
 */
import { HotspotList as ElencoScena } from "@/components/scene/HotspotLayer";
import { copy } from "@/content/copy";
import type { RoomId } from "@/content/types";
import { useRoomStage } from "./stage-context";
import s from "./rooms.module.css";

export function HotspotList({ tipo, className }: { tipo: RoomId; className?: string }) {
  const { controllerDi } = useRoomStage();
  return (
    <section className={`${s.punti} ${className ?? ""}`} aria-labelledby={`punti-${tipo}`}>
      <h2 id={`punti-${tipo}`} className="t-h3">
        {copy.camere.puntiTitolo}
      </h2>
      <ElencoScena controller={controllerDi(tipo)} titolo={copy.camere.puntiTitolo} />
    </section>
  );
}
