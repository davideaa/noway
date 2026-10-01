"use client";

/*
 * Controlli del diorama (UX 5.2), nell'ordine di tabulazione:
 *   1. Vista: «3D» · «Pianta»      (Segmented, radiogroup)
 *   2. Luce: «Giorno» · «Sera»     (Segmented; in Pianta sparisce ma lascia lo spazio: nessun salto)
 *   3. Ruota: ◀ ▶ e «Ripristina vista» (CameraRig del runtime 3D; solo in 3D)
 *   4. Telefono e tablet: chip di sotto-vista («Camera 1 / Camera 2», «Soggiorno / Camera»)
 * Tutti i bersagli sono alti almeno 44 px. Senza 3D disponibile il pulsante «3D» è aria-disabled e la
 * ragione è scritta sotto il gruppo.
 */
import { useState } from "react";
import { CameraRig } from "@/components/scene/CameraRig";
import { useControllerValue, type SceneController } from "@/components/scene/SceneCanvas";
import { Chip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { copy, fmt } from "@/content/copy";
import type { RoomId } from "@/content/types";
import { SOTTO_VISTE } from "@/scenes/rooms";
import { useRoomStage, type VistaCamera } from "./stage-context";
import { testiCamere } from "./testi";
import s from "./rooms.module.css";

type Props = { tipo: RoomId; controller: SceneController };

export function RoomControls({ tipo, controller }: Props) {
  const { vista, setVista, sera, setSera, senza3D } = useRoomStage();
  const c = copy.camere.controlli;
  const in3D = vista === "3d";

  return (
    <div className={s.controlli}>
      <div className={s.rigaVista}>
        <Segmented
          aria-label={testiCamere.ariaVista}
          value={vista}
          onValueChange={(v) => setVista(v as VistaCamera)}
          options={[
            {
              value: "3d",
              label: copy.camere.controlli.vista.tre_d,
              ariaLabel: fmt(copy.camere.controlli.vista.aria, { vista: copy.camere.controlli.vista.ariaVista3D }),
              disabled: senza3D,
              disabledReason: senza3D ? copy.camere.stati.fallback3D : undefined,
            },
            {
              value: "pianta",
              label: copy.camere.controlli.vista.pianta,
              ariaLabel: fmt(copy.camere.controlli.vista.aria, { vista: copy.camere.controlli.vista.ariaVistaPianta }),
            },
          ]}
        />
        {/* In Pianta la luce sparisce ma lascia il suo posto (UX 5.2): `visibility` toglie anche il focus */}
        <div className={s.luce} data-nascosto={in3D ? "0" : "1"}>
          <Segmented
            aria-label={fmt(c.giornoSera.aria, { valore: sera ? "sera" : "giorno" })}
            value={sera ? "sera" : "giorno"}
            onValueChange={(v) => setSera(v === "sera")}
            options={[
              { value: "giorno", label: c.giornoSera.giorno },
              { value: "sera", label: c.giornoSera.sera },
            ]}
          />
        </div>
      </div>

      <div className={s.rigaCamera} data-nascosto={in3D ? "0" : "1"}>
        <CameraRig controller={controller} className={s.rig} />
        <SottoViste key={tipo} tipo={tipo} controller={controller} />
      </div>
    </div>
  );
}

/** Scorciatoie verso un modulo della camera (UX 4.2 di MOTION): servono sul telefono, dove la stanza intera è piccola. */
function SottoViste({ tipo, controller }: Props) {
  const lista = SOTTO_VISTE[tipo];
  const [scelta, setScelta] = useState<string | null>(null);
  const modificata = useControllerValue(controller, "vista", (x) => x.vistaModificata);
  const aperto = useControllerValue(controller, "hotspot", (x) => x.hotspotAperto);
  if (lista.length === 0) return null;
  return (
    <div className={s.sotto} role="group" aria-label={testiCamere.ariaParteCamera}>
      {lista.map((sv) => {
        const attivo = scelta === sv.id && modificata && aperto === null;
        return (
          <Chip
            key={sv.id}
            pressed={attivo}
            onClick={() => {
              if (attivo) {
                setScelta(null);
                controller.ripristinaVista();
              } else {
                setScelta(sv.id);
                controller.apriHotspot(null);
                controller.vaiA(sv.vista);
              }
            }}
          >
            {sv.titolo}
          </Chip>
        );
      })}
    </div>
  );
}
