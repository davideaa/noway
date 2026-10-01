"use client";

/*
 * «Una giornata al Grill & Lounge» (UX 4.3 scena 5 e 8, MOTION 6.2): la scena 3D del ristorante,
 * un cursore a quattro posizioni (Mattina · Pranzo · Aperitivo · Sera) che muove la luce con
 * `setLuce` (600 ms; 200 ms con movimento ridotto) e, accanto, il testo del momento.
 *
 * - Parte da «Sera»: è la luce del poster (UX 4.3: «poster alla luce Sera»), così il passaggio dal
 *   poster al 3D non si vede.
 * - Il pranzo NON è un servizio per tutti: il testo di COPY lo dice e rimanda all'Ufficio Eventi.
 *   Nella scena non ci sono piatti a pranzo, solo luce (MOTION 0.3 punto 3).
 * - Senza JavaScript: poster «Sera» + i quattro momenti come elenco (`<noscript>`), e il cursore,
 *   che non funzionerebbe, sparisce (SoloJs).
 * - Il testo del momento è in `aria-live="polite"`: cambia con una dissolvenza di 240 ms.
 */

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { CameraRig } from "@/components/scene/CameraRig";
import { HotspotList } from "@/components/scene/HotspotLayer";
import { useSceneController } from "@/components/scene/SceneCanvas";
import { SceneFrame } from "@/components/scene/SceneFrame";
import { Button } from "@/components/ui/button";
import { Range } from "@/components/ui/range";
import { copy } from "@/content/copy";
import { copyPagine } from "@/content/copy-pagine";
import { grillDef } from "@/scenes/grill/def";
import { SoloJs } from "./SoloJs";
import { TableChoice } from "./TableChoice";
import s from "./grill.module.css";

const MOMENTI = copy.ristorazione.momenti;
const ULTIMO = MOMENTI.length - 1;
/** La luce di ogni momento: 0 · 1/3 · 2/3 · 1 (SceneHandle.setLuce). */
const luceDi = (i: number) => i / ULTIMO;

export function GrillDay() {
  const c = useSceneController(grillDef);
  const [i, setI] = useState(ULTIMO);
  const aiutoId = useId();
  const momento = MOMENTI[i];

  // la luce di partenza è «Sera», come il poster; la scena nasce già così (SceneController.collega)
  useEffect(() => {
    c.setLuce(luceDi(ULTIMO));
  }, [c]);

  return (
    <section className={s.sera} data-tono="sera" aria-labelledby="giornata-titolo">
      <div className="wrap">
        <div className={s.griglia}>
          <div className={s.scenaCol}>
            <div className={s.arco}>
              <SceneFrame
                def={grillDef}
                controller={c}
                tono="sera"
                className={s.cornice}
                elenco={false}
                mostraNota={false}
              />
            </div>
            <SoloJs>
              <CameraRig controller={c} etichette={copyPagine.ristorazione.rig} />
            </SoloJs>
            <p className={s.nota}>{grillDef.nota}</p>
            <SoloJs>
              <p className={s.istruzioni}>
                {copy.camere.comandi}. {copy.camere.comandiTastiera}
              </p>
            </SoloJs>
          </div>

          <div className={s.testoCol}>
            <h2 id="giornata-titolo">{copyPagine.ristorazione.giornataTitolo}</h2>
            <SoloJs>
              <p className={s.intro}>{copyPagine.ristorazione.giornataIntro}</p>
            </SoloJs>

            <SoloJs>
              <div className={s.cursore}>
                <Range
                  label={copy.ristorazione.cursore.etichetta}
                  min={0}
                  max={ULTIMO}
                  step={1}
                  value={i}
                  valueLabels={[...copy.ristorazione.cursore.valori]}
                  marks={[...copy.ristorazione.cursore.valori]}
                  aria-describedby={aiutoId}
                  onValueChange={(n) => {
                    setI(n);
                    c.animaLuce(luceDi(n));
                  }}
                />
                <p id={aiutoId} className="sr-only">
                  {copyPagine.ristorazione.ariaCursoreAiuto}
                </p>
              </div>
            </SoloJs>

            <SoloJs>
              <div className={s.momento} aria-live="polite" aria-atomic="true">
                <div key={momento.id} className={s.momentoTesto} data-momento={momento.id}>
                  <h3>{momento.titolo}</h3>
                  <p>{momento.testo}</p>
                  {momento.id === "pranzo" && (
                    <Button asChild variant="link" arrow>
                      <Link href="/centro-congressi/#richiesta">{copyPagine.ristorazione.scriviEventi}</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SoloJs>

            <noscript>
              <ol className={s.senzaJs}>
                {MOMENTI.map((m) => (
                  <li key={m.id}>
                    <strong>
                      {m.valore} · {m.titolo}
                    </strong>
                    <p>{m.testo}</p>
                  </li>
                ))}
              </ol>
            </noscript>

            <div className={s.azioni}>
              <TableChoice />
              <Button asChild variant="outline" arrow>
                <Link href="/centro-congressi/#richiesta">{copy.ristorazione.organizzaEvento}</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className={s.punti}>
          <HotspotList controller={c} titolo={copyPagine.ristorazione.elencoPunti} />
        </div>
      </div>
    </section>
  );
}
