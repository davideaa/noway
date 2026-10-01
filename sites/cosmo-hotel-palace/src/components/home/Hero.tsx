"use client";

/*
 * Scena 1 — Hero: la hall (UX 4.3, MOTION 3).
 *
 * Desktop ≥ 1024 e movimento normale: la scena resta FISSATA per 150 svh e lo scroll (p) porta la
 * camera dall'ingresso fino al tronco e al lucernario. Il cursore «Ora del giorno» è un controllo
 * a parte (alba → sera) e non muove la pagina. Telefono: niente scena fissata; una breve entrata
 * (2,4 s) parte una volta sola quando il 3D è pronto e si interrompe a un tocco o a uno scroll.
 * Movimento ridotto: la camera sta ferma dentro la hall, il cursore cambia solo la luce.
 *
 * Senza JavaScript o WebGL: h1, testi e pulsanti sono nell'HTML; il poster SVG della hall (giorno e
 * sera sovrapposti, con la dissolvenza guidata dal cursore) sostituisce il canvas; i quattro punti
 * della hall sono in un elenco di testo.
 */

import { createElement, useCallback, useEffect, useRef } from "react";
import { PosterHall } from "@/components/art/PosterHall";
import { CameraRig } from "@/components/scene/CameraRig";
import { useSceneController, useStatoScena } from "@/components/scene/SceneCanvas";
import { SceneFrame } from "@/components/scene/SceneFrame";
import { useBookingOptional } from "@/components/booking/BookingProvider";
import { Button } from "@/components/ui/button";
import { copy, copyPrenotazione } from "@/content/copy";
import { copyHome } from "@/content/copy-home";
import { hallHotspots } from "@/content/hotspots/hall";
import type { SceneDef } from "@/content/types";
import { ENGINE_BASE } from "@/lib/booking/config";
import { announce } from "@/lib/a11y";
import { clamp01, easeIn, getPrefersReducedMotion } from "@/lib/motion";
import { useScenaFissata, useScenaFissataProgress } from "@/lib/motion-fx";
import { HALL_FINESTRE_P, hallDef } from "@/scenes/hall/def";
import { ModeToggle } from "./ModeToggle";
import { StopSlider } from "./StopSlider";
import { useLuce } from "./useLuce";
import s from "./hero.module.css";

/** Luce di partenza: Mattina (la stessa del poster senza 3D). */
const LUCE_INIZIALE = 1 / 3;

/**
 * Poster della hero: la hall di giorno e la hall di sera sovrapposte. La sera sfuma con la
 * variabile CSS `--luce` (scritta dal cursore): senza WebGL il cursore funziona lo stesso.
 */
function PosterHero() {
  return (
    <div className={s.posterDuo}>
      <PosterHall tono="giorno" />
      <div className={s.posterSera}>
        <PosterHall tono="sera" />
      </div>
    </div>
  );
}

const heroDef: SceneDef = { ...hallDef, poster: createElement(PosterHero) };

const DURATA_ENTRATA_MS = 2400;

/**
 * Dove sta la camera quando non c'è lo scroll a guidarla (telefono, movimento ridotto): dentro la
 * hall, con il tronco, le vetrate e il lucernario nell'inquadratura. MOTION 3.6 propone 0,62
 * (P_RIPOSO): in un arco verticale stretto è troppo vicino al tronco, a 0,48 si vede la hall.
 */
const P_RIPOSO = 0.48;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const ctrl = useSceneController(heroDef);
  const stato = useStatoScena(ctrl);
  const fissata = useScenaFissata();
  const booking = useBookingOptional();
  /** true quando l'entrata è finita (o è stata interrotta): non si ripete. Non si segna all'avvio, così un rimontaggio a metà riparte. */
  const entrataFatta = useRef(false);

  const { valore, scrub, vai } = useLuce(ctrl, LUCE_INIZIALE, (v) => {
    ref.current?.style.setProperty("--luce", v.toFixed(3));
  });

  /* ── p dallo scroll (solo con la scena fissata) ── */
  useScenaFissataProgress(ref, {
    onProgress: (p, attiva) => {
      if (attiva) ctrl.setProgresso(p);
    },
  });

  /* ── senza scena fissata: camera a riposo, o breve entrata sul telefono ── */
  useEffect(() => {
    if (fissata || stato !== "pronta") return;
    if (getPrefersReducedMotion() || entrataFatta.current) {
      ctrl.setProgresso(P_RIPOSO);
      return;
    }
    let raf = 0;
    let finito = false;
    const t0 = performance.now();
    let interrotta = 0; // istante dell'interruzione
    let daP = 0;
    const passo = (ora: number) => {
      if (finito) return;
      if (interrotta) {
        // chiusura veloce verso la camera a riposo (360 ms), così la scena non resta a metà strada
        const k = clamp01((ora - interrotta) / 360);
        ctrl.setProgresso(daP + (P_RIPOSO - daP) * easeIn(k));
        if (k < 1) raf = requestAnimationFrame(passo);
        else entrataFatta.current = true;
        return;
      }
      const k = clamp01((ora - t0) / DURATA_ENTRATA_MS);
      ctrl.setProgresso(P_RIPOSO * easeIn(k));
      if (k < 1) raf = requestAnimationFrame(passo);
      else entrataFatta.current = true;
    };
    const interrompi = () => {
      if (interrotta || finito) return;
      daP = ctrl.progresso;
      interrotta = performance.now();
    };
    const eventi = ["pointerdown", "touchstart", "wheel", "keydown", "scroll"] as const;
    for (const e of eventi) window.addEventListener(e, interrompi, { once: true, passive: true });
    raf = requestAnimationFrame(passo);
    return () => {
      finito = true;
      cancelAnimationFrame(raf);
      for (const e of eventi) window.removeEventListener(e, interrompi);
    };
  }, [fissata, stato, ctrl]);

  /* ── cursore: tappe e annuncio ── */
  const tappe = copy.hero.luce.valori;
  const vaiATappa = useCallback(
    (i: number) => {
      vai(i / (tappe.length - 1));
      announce(copy.hero.luce.ariaSlider.replace("{valore}", tappe[i]));
    },
    [vai, tappe],
  );

  /* ── pulsante primario: apre il pannello di prenotazione; senza provider/JS è un link al motore ── */
  // (l'onClick va sul Button, non sul link: con `asChild` il Button riscrive l'onClick del figlio)
  const cerca = (
    <Button
      asChild
      variant="action"
      size="lg"
      onClick={(e) => {
        if (!booking) return;
        e.preventDefault();
        booking.openBooking();
      }}
    >
      <a
        href={ENGINE_BASE}
        {...(booking
          ? { "aria-haspopup": "dialog" as const }
          : { target: "_blank", rel: "noopener", "aria-label": copyPrenotazione.ariaCerca })}
        data-booking-hero-cta=""
      >
        {copy.hero.ctaPrimaria}
      </a>
    </Button>
  );

  return (
    <section
      id="hero"
      ref={ref}
      className={s.hero}
      data-scena="hero"
      data-booking-hero=""
      data-sticky=""
      aria-labelledby="hero-titolo"
    >
      <div className={s.stage}>
        <div className={`wrap ${s.grid}`}>
          <div className={s.testo}>
            <p className={`t-label ${s.eyebrow}`}>{copy.hero.eyebrow}</p>
            <h1 id="hero-titolo" className={s.h1}>
              {copy.hero.h1}
            </h1>
            <p className={`t-lead ${s.sotto}`}>{copy.hero.sottotitolo}</p>
            <div className={s.cta}>
              {cerca}
              <Button asChild variant="outline" size="lg">
                <a href="#perche">{copy.hero.ctaSecondaria}</a>
              </Button>
            </div>
            <ModeToggle className={s.modoDesktop} />
          </div>

          <div className={s.scena}>
            <div className={s.arcoBox}>
              <SceneFrame
                def={heroDef}
                controller={ctrl}
                className={s.arco}
                muoviCameraAlClic={false}
                filtroHotspot={(h, c) => {
                  // con la scena fissata gli hotspot compaiono nelle finestre di p (MOTION 3.5);
                  // altrimenti la camera è a riposo e si vedono tutti
                  const f = HALL_FINESTRE_P[h.id];
                  return !fissata || !f || (c.progresso >= f[0] && c.progresso <= f[1]);
                }}
                elenco={false}
                mostraNota={false}
              />
            </div>
            <div className={s.controlli}>
              <CameraRig
                controller={ctrl}
                passo={10}
                etichette={{
                  sinistra: copyHome.hero.ruotaSinistra,
                  destra: copyHome.hero.ruotaDestra,
                  ripristina: copyHome.hero.ripristina,
                }}
              />
              <p className={s.nota}>{copy.hero.nota}</p>
            </div>
            <StopSlider
              etichetta={copy.hero.luce.etichetta}
              tappe={tappe}
              valore={valore}
              onValore={scrub}
              onTappa={vaiATappa}
              descrittoDa="hero-aiuto-luce"
              className={s.slider}
            />
            <p id="hero-aiuto-luce" className="sr-only">
              {copyHome.hero.aiutoLuce} {copy.hero.istruzione} {copy.hero.istruzioneTastiera}
            </p>
            <noscript>
              <p className={s.nota}>
                {copy.hero.luce.etichetta}: {tappe.join(" · ")}.
              </p>
            </noscript>
          </div>

          <div className={s.coda}>
            <p className={s.corpo}>{copy.hero.corpo}</p>
            <ModeToggle className={s.modoTelefono} />
            <details className={s.punti}>
              <summary>{copyHome.hero.puntiTitolo}</summary>
              <ul aria-label={copyHome.hero.puntiAria}>
                {hallHotspots.map((h) => (
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

