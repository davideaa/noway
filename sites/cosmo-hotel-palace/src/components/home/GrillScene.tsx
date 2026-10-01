"use client";

/*
 * Scena 5 — Cosmo Grill & Lounge, la giornata (UX 4.3, MOTION 6.2). Sezione in tono SERA per tutta
 * la durata (fondo e testi fissi: contrasto costante); cambia solo la luce dentro l'arco.
 *
 * Desktop ≥ 1024 e movimento normale: la scena resta fissata per 140 svh e lo scroll (p) è la luce:
 * 0 mattina · 1/3 pranzo · 2/3 aperitivo · 1 sera. Il cursore «Momento della giornata» è la stessa
 * cosa (trascinarlo scorre la pagina). Il testo del momento cambia con una dissolvenza di 240 ms,
 * con isteresi ai confini (non sfarfalla) ed è letto una volta sola da chi usa uno screen reader.
 * Telefono e movimento ridotto: nessuna scena fissata; il cursore cambia la luce direttamente
 * (600 ms, 200 ms con movimento ridotto) e parte dalla sera.
 *
 * Senza JavaScript/WebGL: il poster della sera e i quattro momenti, uno sotto l'altro.
 * «Prenota un tavolo» (ContactChoice del modulo 7) apre due link (telefono, email): non c'è prenotazione
 * online dei tavoli.
 */

import Link from "next/link";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { CameraRig } from "@/components/scene/CameraRig";
import { useSceneController } from "@/components/scene/SceneCanvas";
import { SceneFrame } from "@/components/scene/SceneFrame";
import { Button } from "@/components/ui/button";
import { ContactChoice } from "@/components/shell/ContactChoice";
import { copy } from "@/content/copy";
import { copyHome } from "@/content/copy-home";
import { grillHotspots } from "@/content/hotspots/grill";
import { announce } from "@/lib/a11y";
import {
  scorriAProgresso,
  tappaDaProgresso,
  useScenaFissata,
  useScenaFissataProgress,
} from "@/lib/motion-fx";
import { grillDef } from "@/scenes/grill/def";
import { StopSlider } from "./StopSlider";
import { useLuce } from "./useLuce";
import s from "./grill.module.css";

/** Confini dei quattro momenti (MOTION 6.2): cambia a 0,17 / 0,50 / 0,83, e torna indietro 0,03 più in là. */
const SOGLIE = [0.17, 0.5, 0.83] as const;

const nessunAbbonamento = () => () => {};

export function GrillScene() {
  const ref = useRef<HTMLElement>(null);
  const ctrl = useSceneController(grillDef);
  const fissata = useScenaFissata();
  const js = useSyncExternalStore(nessunAbbonamento, () => true, () => false);
  const [momento, setMomento] = useState(3); // si parte dalla sera (come il poster)
  const r = copy.ristorazione;

  const { valore, scrub, vai } = useLuce(ctrl, 1, (v) => setMomento((prima) => tappaDaProgresso(v, SOGLIE, prima)));

  /* ── desktop con scena fissata: la luce è p ── */
  useScenaFissataProgress(ref, {
    onProgress: (p, attiva) => {
      if (attiva) scrub(p);
    },
  });

  /* ── cursore ── */
  const tappe = r.cursore.valori;
  const suValore = useCallback(
    (v: number) => {
      // con la scena fissata il cursore sposta la pagina (un solo numero, p); altrimenti agisce sulla luce
      if (fissata && ref.current) scorriAProgresso(ref.current, v);
      else scrub(v);
    },
    [fissata, scrub],
  );
  const suTappa = useCallback(
    (i: number) => {
      const v = i / (tappe.length - 1);
      if (fissata && ref.current) scorriAProgresso(ref.current, v, true);
      else vai(v);
      announce(r.cursore.ariaSlider.replace("{valore}", tappe[i]));
    },
    [fissata, tappe, vai, r.cursore.ariaSlider],
  );

  return (
    <section
      id="grill"
      ref={ref}
      className={s.grill}
      data-scena="grill"
      data-tono="sera"
      data-sticky=""
      data-js={js ? "1" : undefined}
      aria-labelledby="grill-titolo"
    >
      <div className={s.stage}>
        <div className={`wrap ${s.grid}`}>
          <header className={s.testa}>
            <h2 id="grill-titolo" className={s.h2}>
              {r.h1}
            </h2>
            <p className={`t-lead ${s.sotto}`}>{r.sottotitolo}</p>
          </header>

          <div className={s.scena}>
            <div className={s.arcoBox}>
              <SceneFrame
                def={grillDef}
                controller={ctrl}
                tono="sera"
                className={s.arco}
                elenco={false}
                mostraNota={false}
              />
            </div>
            <div className={s.controlli}>
              <CameraRig
                controller={ctrl}
                passo={15}
                etichette={{
                  sinistra: copyHome.hero.ruotaSinistra,
                  destra: copyHome.hero.ruotaDestra,
                  ripristina: copyHome.hero.ripristina,
                }}
              />
              <p className={s.nota}>{r.nota}</p>
            </div>
            <StopSlider
              etichetta={r.cursore.etichetta}
              tappe={tappe}
              valore={valore}
              onValore={suValore}
              onTappa={suTappa}
              tappaAttiva={momento}
              descrittoDa="grill-aiuto-luce"
            />
            <p id="grill-aiuto-luce" className="sr-only">
              {copyHome.grill.aiutoLuce}
            </p>
          </div>

          <div className={s.dettagli}>
            {/* i quattro momenti: con JS uno solo, in dissolvenza; senza, tutti in elenco */}
            <div className={s.pannelli}>
              {r.momenti.map((m, i) => (
                <div
                  key={m.id}
                  className={s.pannello}
                  data-attivo={i === momento ? "1" : "0"}
                  aria-hidden={js ? true : undefined}
                >
                  <h3 className={s.momentoTitolo}>
                    <span className={s.momentoNome}>{m.valore}</span>
                    {m.titolo}
                  </h3>
                  <p className={s.momentoTesto}>{m.testo}</p>
                </div>
              ))}
            </div>
            {js ? (
              <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {r.momenti[momento].valore}: {r.momenti[momento].titolo}. {r.momenti[momento].testo}
              </div>
            ) : null}

            <p className={s.orari}>{r.orariRipiego}</p>

            <div className={s.azioni}>
              {/* «Prenota un tavolo»: apre telefono ed email (nessuna prenotazione online dei tavoli) */}
              <ContactChoice label={r.prenotaTavolo} size="lg" />
              <Button asChild variant="outline" size="lg">
                <Link href="/centro-congressi/#richiesta">{r.organizzaEvento}</Link>
              </Button>
            </div>

            <details className={s.punti}>
              <summary>{copyHome.grill.puntiTitolo}</summary>
              <ul aria-label={copyHome.grill.puntiAria}>
                {grillHotspots.map((h) => (
                  <li key={h.id}>
                    <strong>{h.titolo}</strong> {h.dato}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
