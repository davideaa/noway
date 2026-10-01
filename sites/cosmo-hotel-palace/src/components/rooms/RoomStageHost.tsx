"use client";

/*
 * RoomStageHost: il cuore di `/camere/` (UX 5.2, MOTION 4). Sta nel layout `app/camere/layout.tsx`
 * e quindi RESTA MONTATO quando si passa da Classic a Family a Suite (e all'hub). Tiene:
 *
 *   - un SceneController per camera (nessun `three`: sono solo stato) e il contesto che le altre
 *     parti della pagina (controlli, elenco dei punti) leggono con `useRoomStage()`;
 *   - la scelta Giorno|Sera (vale per le tre camere) e 3D|Pianta;
 *   - la barra delle tre tab (link veri, TabsNav) e il riquadro con il diorama ad arco.
 *
 * Il canvas WebGL è UNO per tutta la visita (lib/three/stage): cambiando tab lo slot cambia
 * controller, lo Stage libera la scena vecchia e costruisce la nuova (poche decine di ms), mentre
 * il poster SVG fa da ponte. Sull'hub (`/camere/`) non si rende né il riquadro né le tab.
 *
 * Senza JavaScript restano il poster, la didascalia, i testi e l'elenco dei punti (il layout
 * rende tutto nell'HTML statico, per ogni camera: il segmento è noto a build).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { SceneFrame } from "@/components/scene/SceneFrame";
import { SceneController, useStatoScena } from "@/components/scene/SceneCanvas";
import { TabsNav } from "@/components/ui/tabs-nav";
import { copy, fmt } from "@/content/copy";
import { roomBySlug, rooms, roomIds } from "@/content/rooms";
import type { RoomId } from "@/content/types";
import { announce } from "@/lib/a11y";
import { roomsDef } from "@/scenes/rooms";
import { PlanView } from "./PlanView";
import { RoomControls } from "./RoomControls";
import { RoomStageContext, useRoomStage, type RoomStageValue, type VistaCamera } from "./stage-context";
import s from "./rooms.module.css";

/** Etichetta breve delle tab: «Classic», «Family», «Suite». */
const etichetta = (nomeBreve: string): string => nomeBreve.split(" ")[0];

export function RoomStageHost({ children }: { children: ReactNode }) {
  const segmento = useSelectedLayoutSegment();
  const room = segmento ? roomBySlug(segmento) : undefined;
  const tipo: RoomId | null = room?.id ?? null;

  // un controller per camera: stato desiderato (luce, vista, hotspot) che sopravvive ai cambi di tab
  const [controllers] = useState<Record<RoomId, SceneController>>(() => ({
    classic: new SceneController(roomsDef("classic")),
    family: new SceneController(roomsDef("family")),
    suite: new SceneController(roomsDef("suite")),
  }));
  const controllerDi = useCallback((t: RoomId) => controllers[t], [controllers]);
  const controller = tipo ? controllers[tipo] : null;

  const [vistaScelta, setVistaScelta] = useState<VistaCamera>("3d");
  const [sera, setSeraStato] = useState(false);
  const [senza3D, setSenza3D] = useState(false);

  // se il riquadro dice «niente 3D» (WebGL assente, scena lenta, errore) la pianta diventa l'unica vista
  const stato = useStatoScena(controllers[tipo ?? "classic"]);
  if (tipo && stato === "fallback" && !senza3D) setSenza3D(true);
  const vista: VistaCamera = senza3D ? "pianta" : vistaScelta;

  // cambiando camera, la nuova scena nasce con la luce già scelta (senza dissolvenza)
  const seraRif = useRef(sera);
  useEffect(() => {
    seraRif.current = sera;
  });
  useEffect(() => {
    controller?.setLuce(seraRif.current ? 1 : 0);
  }, [controller]);

  const setSera = useCallback(
    (v: boolean) => {
      setSeraStato(v);
      if (controller) controller.animaLuce(v ? 1 : 0);
      announce(fmt(copy.camere.controlli.giornoSera.aria, { valore: v ? "sera" : "giorno" }));
    },
    [controller],
  );

  const setVista = useCallback(
    (v: VistaCamera) => {
      if (v === "3d" && senza3D) return;
      setVistaScelta(v);
      // la pillola aperta non segue il cambio di vista
      controller?.apriHotspot(null);
    },
    [controller, senza3D],
  );

  const valore = useMemo<RoomStageValue>(
    () => ({ tipo, controllerDi, vista, setVista, sera, setSera, senza3D }),
    [tipo, controllerDi, vista, setVista, sera, setSera, senza3D],
  );

  return (
    <RoomStageContext.Provider value={valore}>
      <div className={room ? `wrap ${s.room}` : undefined} data-room={room ? room.id : "hub"}>
        {room && controller ? (
          <>
            <RoomTabs corrente={room.id} />
            <Stage tipo={room.id} controller={controller} />
          </>
        ) : null}
        {children}
      </div>
    </RoomStageContext.Provider>
  );
}

/* ───────────────────────── Tab: tre link veri ───────────────────────── */

function RoomTabs({ corrente }: { corrente: RoomId }) {
  return (
    <TabsNav
      aria-label={copy.nav.ariaTipiCamera}
      className={s.tabs}
      items={roomIds.map((id) => {
        const r = rooms.find((x) => x.id === id)!;
        return { href: `/camere/${r.slug}/`, label: etichetta(r.nomeBreve), current: id === corrente };
      })}
    />
  );
}

/* ───────────────────────── Il riquadro ad arco ───────────────────────── */

function Stage({ tipo, controller }: { tipo: RoomId; controller: SceneController }) {
  const { vista, sera } = useRoomStage();
  const tono = sera ? "sera" : "giorno";
  return (
    <div className={s.stage}>
      <div className={s.arco} data-tono={tono} data-vista={vista} data-tipo={tipo}>
        {vista === "3d" ? (
          <SceneFrame
            def={controller.def}
            controller={controller}
            className={s.figura}
            controlli={false}
            elenco={false}
            mostraNota={false}
          />
        ) : (
          <PlanView tipo={tipo} controller={controller} tono={tono} />
        )}
      </div>

      <RoomControls tipo={tipo} controller={controller} />

      <div className={s.didascalia}>
        {vista === "3d" ? (
          <>
            <p>{copy.camere.notaDiorama}</p>
            <p>{copy.camere.comandi}</p>
            <p className={s.soloTastiera}>{copy.camere.comandiTastiera}</p>
          </>
        ) : (
          <>
            <p>{copy.camere.confronto.proporzioni}</p>
            <p>{copy.camere.comandi.split(" · ").at(-1)}</p>
          </>
        )}
      </div>
    </div>
  );
}
