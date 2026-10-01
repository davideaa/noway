"use client";

/*
 * Il «cursore luce» di una scena (hero: giorno, ristorante: momento della giornata) come stato React:
 *   - `valore` 0..1 è ciò che mostra il cursore;
 *   - `scrub(v)` segue il dito o lo scroll: nessuna animazione, il numero è già continuo;
 *   - `vai(v)` per tocco su una tappa o tastiera: porta la luce a v in 600 ms con la curva di ingresso
 *     (200 ms con movimento ridotto), poi si ferma. La scena riceve ogni valore intermedio.
 * La luce vera la applica il SceneController (`setLuce`), che la ricorda anche prima che il 3D esista.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { SceneController } from "@/components/scene/SceneCanvas";
import { DURATION, clamp01, easeIn, getPrefersReducedMotion } from "@/lib/motion";

export function useLuce(ctrl: SceneController, iniziale: number, quando?: (v: number) => void) {
  const [valore, setValore] = useState(iniziale);
  const corrente = useRef(iniziale);
  const raf = useRef(0);
  const cb = useRef(quando);
  useEffect(() => {
    cb.current = quando;
  });

  const imposta = useCallback(
    (v: number) => {
      const x = clamp01(v);
      corrente.current = x;
      setValore(x);
      ctrl.setLuce(x);
      cb.current?.(x);
    },
    [ctrl],
  );

  // la scena riceve il valore di partenza (la sua luce di default è 0 = alba/mattina)
  useEffect(() => {
    ctrl.setLuce(iniziale);
    cb.current?.(iniziale);
    // solo al montaggio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const scrub = useCallback(
    (v: number) => {
      cancelAnimationFrame(raf.current);
      imposta(v);
    },
    [imposta],
  );

  const vai = useCallback(
    (a: number) => {
      cancelAnimationFrame(raf.current);
      const da = corrente.current;
      const durata = getPrefersReducedMotion() ? DURATION.reduced : DURATION.scene;
      if (Math.abs(a - da) < 1e-4) return imposta(a);
      const t0 = performance.now();
      const passo = (ora: number) => {
        const k = clamp01((ora - t0) / durata);
        imposta(da + (a - da) * easeIn(k));
        if (k < 1) raf.current = requestAnimationFrame(passo);
      };
      raf.current = requestAnimationFrame(passo);
    },
    [imposta],
  );

  return { valore, scrub, vai, imposta };
}
