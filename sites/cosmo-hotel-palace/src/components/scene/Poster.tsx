"use client";

/*
 * Il poster SVG: stato iniziale (LCP, senza JavaScript), di riserva (senza WebGL, contesto perso,
 * lentezza) e degli slot che non hanno il canvas. Resta SEMPRE nel DOM; quando il canvas è pronto
 * sfuma (CSS) e viene nascosto agli screen reader, che trovano il canvas `role="img"`.
 * Il poster lo disegna il modulo 6: qui lo si mette nel riquadro, a tutta area.
 */

import type { SceneDef } from "@/content/types";
import type { StatoScena } from "./SceneCanvas";
import s from "./scene.module.css";

export function Poster({ def, stato }: { def: SceneDef; stato: StatoScena }) {
  const nascosto = stato === "pronta";
  return (
    <div
      className={s.poster}
      role="img"
      aria-label={def.aria}
      aria-hidden={nascosto ? true : undefined}
      data-poster={def.id}
    >
      {def.poster}
    </div>
  );
}
