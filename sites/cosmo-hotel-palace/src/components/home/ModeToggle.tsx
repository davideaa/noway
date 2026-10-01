"use client";

/*
 * «Come viaggi?  Per lavoro | Per piacere» (COPY sez. 1, UX 4.2).
 * Due chip uniti (radiogroup con frecce da tastiera). Parte da «Per piacere», che è l'ordine di
 * base: la pagina NON si riordina al caricamento, solo dopo il clic (vedi lib/home/cambia-modo.ts).
 */

import { useId, useSyncExternalStore } from "react";
import { Segmented } from "@/components/ui/segmented";
import { copy } from "@/content/copy";
import { cambiaModoViaggio } from "@/lib/home/cambia-modo";
import { leggiModo, modoServer, sottoscriviModo, type ModoViaggio } from "@/lib/home/scene-order";
import { cn } from "@/lib/utils";
import s from "./hero.module.css";

/** Il modo scelto, per chi deve reagire (es. il consigliere camere). Sul server: «piacere». */
export function useModoViaggio(): ModoViaggio {
  return useSyncExternalStore(sottoscriviModo, leggiModo, modoServer);
}

export function ModeToggle({ className }: { className?: string }) {
  const modo = useModoViaggio();
  const etichetta = useId();
  const c = copy.hero.comeViaggi;
  return (
    <div className={cn(s.modo, className)}>
      <span id={etichetta} className={s.modoEtichetta}>
        {c.etichetta}
      </span>
      <Segmented
        aria-labelledby={etichetta}
        value={modo}
        onValueChange={(v) => void cambiaModoViaggio(v as ModoViaggio)}
        options={[
          { value: "lavoro", label: c.lavoro },
          { value: "piacere", label: c.piacere },
        ]}
      />
    </div>
  );
}
