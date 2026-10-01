"use client";

/*
 * Il gesto «Per lavoro / Per piacere» (UX 4.2, MOTION 6.7):
 *   1. dissolvenza in uscita della pila di scene (160 ms; con prefers-reduced-motion: salto)
 *   2. riordino del DOM (flushSync: il DOM è già nuovo quando si torna qui)
 *   3. scroll, istantaneo, fino alla prima scena cambiata
 *   4. dissolvenza in entrata (240 ms) e annuncio aria-live (COPY sez. 1)
 *
 * Parte SOLO da un clic: nessuno chiama questa funzione al caricamento.
 */

import { flushSync } from "react-dom";
import { copy, fmt } from "@/content/copy";
import { announce } from "@/lib/a11y";
import { getPrefersReducedMotion } from "@/lib/motion";
import {
  ID_SEZIONE,
  impostaModo,
  leggiModo,
  primaScenaCambiata,
  type ModoViaggio,
} from "./scene-order";

const FADE_OUT_MS = 160;
const attesa = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let inCorso = false;

export async function cambiaModoViaggio(nuovo: ModoViaggio): Promise<void> {
  const vecchio = leggiModo();
  if (nuovo === vecchio || inCorso) return;
  inCorso = true;
  try {
    const pila = document.querySelector<HTMLElement>("[data-home-stack]");
    const ridotto = getPrefersReducedMotion();

    if (pila && !ridotto) {
      pila.dataset.fade = "out";
      await attesa(FADE_OUT_MS);
    }

    flushSync(() => impostaModo(nuovo));

    const prima = primaScenaCambiata(vecchio, nuovo);
    const el = prima ? document.getElementById(ID_SEZIONE[prima]) : null;
    // scroll-padding-top dell'html tiene conto dell'header
    el?.scrollIntoView({ block: "start", behavior: "instant" });

    if (pila && !ridotto) {
      // un frame con la pila ancora trasparente, poi la dissolvenza in entrata
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      pila.dataset.fade = "in";
      setTimeout(() => {
        if (pila.dataset.fade === "in") delete pila.dataset.fade;
      }, 300);
    }

    announce(fmt(copy.hero.comeViaggi.conferma, { tipo: nuovo === "lavoro" ? "lavoro" : "piacere" }));
  } finally {
    inCorso = false;
  }
}
