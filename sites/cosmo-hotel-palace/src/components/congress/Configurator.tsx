"use client";

/*
 * Configuratore di sale (UX 7, COPY 8.2). Tre passi visibili in una pagina sola:
 * 1. Scegli la sala · 2. Scegli la disposizione · 3. Chiedi una proposta.
 *
 * Scena: due viste, «3D» e «Pianta». Sotto 600 px parte la Pianta (500 sedie si leggono meglio
 * dall'alto su 360 px e il motore 3D non si scarica nemmeno finché non lo si chiede); da 600 px in
 * su parte il 3D. Senza WebGL resta solo la Pianta. Tutte e due le viste sono nell'HTML fin dal
 * primo byte (poster e pianta), la scelta fra le due la fa il CSS (`data-modo`): nessun salto.
 * Sul telefono la scena resta fissata in alto mentre si scorrono i chip: le sedie che si
 * muovono si vedono mentre si sceglie.
 */

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { CameraRig } from "@/components/scene/CameraRig";
import { SceneFrame } from "@/components/scene/SceneFrame";
import { useStatoScena } from "@/components/scene/SceneCanvas";
import { PosterCongress } from "@/components/art/PosterCongress";
import { copy } from "@/content/copy";
import { rilevaWebGL } from "@/lib/three/support";
import { ariaSala } from "@/scenes/congress/def";
import { AttendeesField } from "./AttendeesField";
import { useCongresso, type Vista } from "./CongressState";
import { DispositionChips } from "./DispositionChips";
import { FindHall } from "./FindHall";
import { HallPicker, HallPickerTrigger } from "./HallPicker";
import { HallPlan } from "./HallPlan";
import { ResultLine } from "./ResultLine";
import { WallsToggle } from "./WallsToggle";
import { testi } from "./testi";
import s from "./congress.module.css";

const cfg = copy.congressi.configuratore;

const nessunAscolto = () => () => {};

/** WebGL2 disponibile? Il server dice sì (poster pronto); il browser lo verifica una volta (in cache). */
function useWebGL(): boolean {
  return useSyncExternalStore(
    nessunAscolto,
    () => rilevaWebGL().ok,
    () => true,
  );
}

/** Schermo da 600 px in su (soglia di UX 7.2 per partire in 3D). */
function useLargo(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(min-width: 600px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 600px)").matches,
    () => true,
  );
}

export function Configurator() {
  const c = useCongresso();
  const webgl = useWebGL();
  const largo = useLargo();
  const stato = useStatoScena(c.controller);
  const senza3D = !webgl || stato === "fallback";

  const modo: "auto" | Vista = senza3D ? "pianta" : (c.stato.vista ?? "auto");
  const effettiva: Vista = modo === "auto" ? (largo ? "3d" : "pianta") : modo;

  const aria = ariaSala({ sala: c.hall.id, disposizione: c.disposizione, ospiti: c.ospitiNum, divisa: c.divisa });
  const banchetto = c.disposizione === "banchetto" && !c.divisa;
  const notaDisegno = c.divisa ? "" : `${banchetto ? cfg.scena.notaBanchetto : cfg.scena.notaDisposizione}. `;

  const usa = () => c.scorriA("richiesta", { focus: "richiesta-riepilogo" });

  return (
    <section className={`${s.sezione} ${s.sezioneConfig}`} aria-labelledby="configura-titolo">
      {/* l'ancora sta sul contenitore, sotto il padding della sezione: i salti arrivano dritti al titolo */}
      <div className="wrap" id="configura">
        <header className={s.testata}>
          <h2 id="configura-titolo" className="t-h2" tabIndex={-1}>
            {cfg.titolo}
          </h2>
          <p className="t-lead">{cfg.sottotitolo}</p>
        </header>

        {/* senza JavaScript: l'illustrazione della sala (poster) e il testo; la tabella e il modulo sono più sotto */}
        <noscript>
          <div className={s.senzaJs}>
            <p>{testi.senzaJs}</p>
            <PosterCongress tono="giorno" decorativo={false} className={s.senzaJsPoster} />
          </div>
        </noscript>
        <noscript>
          <style>{"[data-cfg-js]{display:none !important}"}</style>
        </noscript>

        <div data-cfg-js="" className={s.interattivo}>
          <FindHall />

          <div id="configura-strumento" className={s.griglia}>
            {/* passo 1 */}
            <div className={s.colSala}>
              <div className={s.colSalaInterna}>
                <h3 className={s.passo}>{cfg.passi.sala}</h3>
                <div className={s.soloTelefono}>
                  <HallPickerTrigger />
                </div>
                <div className={s.soloDesktop}>
                  <HallPicker idPrefix="inline" />
                </div>
              </div>
            </div>

            {/* scena + passi 2 e 3 */}
            <div className={s.colScena}>
              <div className={s.scenaFissa}>
                <div className={s.scenaBox} data-modo={modo}>
                  <div className={s.paneScena}>
                    <SceneFrame
                      def={c.def}
                      controller={c.controller}
                      className={s.figura}
                      elenco={false}
                      mostraNota={false}
                      controlli={false}
                      tono="giorno"
                    />
                  </div>
                  <div className={s.panePianta}>
                    <HallPlan
                      hall={c.hall}
                      disposizione={c.disposizione}
                      ospiti={c.ospitiNum}
                      divisa={c.divisa}
                      aria={aria}
                    />
                  </div>
                  {/* ◀ ▶ e «Ripristina vista» sopra la scena, in basso a sinistra (a destra c'è la pillola di prenotazione) */}
                  {effettiva === "3d" && !senza3D && (
                    <CameraRig
                      controller={c.controller}
                      className={s.rig}
                      etichette={{
                        sinistra: testi.vista.ruotaSinistra,
                        destra: testi.vista.ruotaDestra,
                        ripristina: testi.vista.ripristina,
                      }}
                    />
                  )}
                </div>

                <div className={s.barraScena}>
                  <Segmented
                    aria-label={testi.vista.aria}
                    options={[
                      {
                        value: "3d",
                        label: testi.vista.tre_d,
                        disabled: senza3D,
                        disabledReason: senza3D ? copy.servizio.fallback3D : undefined,
                      },
                      { value: "pianta", label: testi.vista.pianta },
                    ]}
                    value={effettiva}
                    onValueChange={(v) => c.setVista(v as Vista)}
                  />
                  <WallsToggle />
                </div>
              </div>

              <p className={s.notaScena}>
                {effettiva === "pianta" ? `${testi.vista.palcoASinistra} ` : ""}
                {notaDisegno}
                {c.def.nota}
                {effettiva === "3d" && !senza3D && <span id={`${c.def.id}-istruzioni`}> {testi.vista.istruzioni}</span>}
              </p>
              {effettiva === "pianta" && !c.divisa && (
                <ul className={s.legenda} aria-hidden="true">
                  <li>
                    <i className={s.legPalco} /> {testi.vista.legenda.palco}
                  </li>
                  <li>
                    <i className={s.legSedia} /> {testi.vista.legenda.sedia}
                  </li>
                  {c.disposizione !== "platea" && (
                    <li>
                      <i className={s.legTavolo} /> {testi.vista.legenda.tavolo}
                    </li>
                  )}
                </ul>
              )}

              <div className={s.controlli}>
                <h3 className={s.passo}>{cfg.passi.disposizione}</h3>
                <DispositionChips />
                <AttendeesField />
                <ResultLine />
                <div className={s.usa}>
                  <h3 className={s.passo}>{cfg.passi.proposta}</h3>
                  <Button variant="brand" size="md" onClick={usa} className={s.usaPulsante}>
                    {cfg.pulsanti.usa}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
