"use client";

/*
 * Il 6° piano (UX 8 `/wellness/`, DECISIONI 3, MOTION 6.3): l'illustrazione isometrica (PosterWellness,
 * SVG, nessun canvas) con i cinque punti come bottoni sopra l'SVG, e il percorso in tre tappe. Toccare
 * una tappa schiarisce il resto del piano e lascia in luce quella zona: è il «porta la camera sulla zona»
 * di UX, fatto in 2D. Toccare un punto apre la sua pillola (una sola alla volta; Esc o secondo tocco la
 * chiude; resta aperta anche con il mouse sopra, WCAG 1.4.13).
 *
 * Senza JavaScript restano il poster, le tre tappe con i loro testi e l'elenco dei punti (HTML del
 * server): i punti-bottone sono solo con JS (SoloJs) e le tappe diventano un elenco normale.
 * Movimento: solo `opacity` (240 ms; 200 ms con movimento ridotto grazie ai token).
 */

import { useId, useState } from "react";
import { PosterWellness } from "@/components/art/PosterWellness";
import { copy, fmt } from "@/content/copy";
import { copyPagine } from "@/content/copy-pagine";
import { wellnessHotspots } from "@/content/hotspots/wellness";
import { announce } from "@/lib/a11y";
import { AREE, PUNTI, VB, percento, type TappaId } from "./wellness-geom";
import { IconaPunto } from "./IconaPunto";
import { SoloJs } from "./SoloJs";
import s from "./plan.module.css";

const t = copyPagine.wellness;

export function WellnessPlan() {
  const [tappa, setTappa] = useState<TappaId | null>(null);
  const [aperto, setAperto] = useState<string | null>(null);
  const maschera = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const scegli = (id: TappaId) => {
    const nuova = tappa === id ? null : id;
    setTappa(nuova);
    const nome = copy.wellness.tappe.find((x) => x.id === id)?.titolo ?? "";
    announce(nuova ? fmt(t.tappaVisibile, { tappa: nome }) : t.tuttoIlPiano);
  };

  return (
    <div
      className={s.scheda}
      onKeyDown={(e) => {
        if (e.key === "Escape" && aperto) setAperto(null);
      }}
    >
      <figure className={s.figura}>
        <div className={s.quadro} data-tappa={tappa ?? ""}>
          <PosterWellness decorativo={false} titolo={copy.wellness.ariaIllustrazione} />

          {/* schiarisce tutto tranne la tappa scelta (maschera: bianco = si schiarisce) */}
          <svg className={s.velo} viewBox={`0 0 ${VB.w} ${VB.h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs>
              <mask id={maschera}>
                <rect width={VB.w} height={VB.h} fill="white" />
                {tappa && AREE[tappa].map((d) => <path key={d} d={d} fill="black" />)}
              </mask>
            </defs>
            <rect width={VB.w} height={VB.h} fill="var(--bg)" mask={`url(#${maschera})`} />
          </svg>

          <SoloJs>
            <div className={s.punti} role="group" aria-label={t.ariaPunti}>
              {wellnessHotspots.map((h) => {
                const p = PUNTI[h.id];
                if (!p) return null;
                const { x, y } = percento(p.pos);
                const aperta = aperto === h.id;
                const pillId = `wp-${h.id}`;
                return (
                  <div
                    key={h.id}
                    className={s.punto}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    data-aperto={aperta ? "1" : "0"}
                    data-lato={x > 58 ? "sx" : "dx"}
                    data-sotto={y < 36 ? "1" : "0"}
                    data-fuori={tappa && tappa !== p.tappa ? "1" : "0"}
                  >
                    <button
                      type="button"
                      className={s.pulsante}
                      aria-label={fmt(copy.hotspot.aria, { titolo: h.titolo })}
                      aria-expanded={aperta}
                      aria-controls={pillId}
                      onClick={() => setAperto(aperta ? null : h.id)}
                      onFocus={(e) => {
                        if (e.currentTarget.matches(":focus-visible")) setAperto(h.id);
                      }}
                    >
                      <span className={s.alone} aria-hidden="true" />
                      <span className={s.dot} aria-hidden="true" />
                    </button>
                    <div id={pillId} className={s.pillola}>
                      <span className={s.pillTitolo}>{h.titolo}</span>
                      <span className={s.pillDato}>{h.dato}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SoloJs>
        </div>
        <figcaption className={s.nota}>{copy.wellness.nota}</figcaption>
      </figure>

      <div className={s.percorso}>
        <h2 className="t-h2">{t.percorsoTitolo}</h2>
        <SoloJs>
          <p className={s.aiuto}>{t.percorsoAiuto}</p>
        </SoloJs>
        <ol className={s.filo}>
          {copy.wellness.tappe.map((x, i) => {
            const attiva = tappa === x.id;
            return (
              <li key={x.id} className={s.passo} data-attiva={attiva ? "1" : "0"}>
                <span className={s.nodo} aria-hidden="true">
                  {i + 1}
                </span>
                {/* senza JS è solo testo; con JS il pulsante evidenzia la zona */}
                <div className={s.passoCorpo}>
                  <span className={s.passoTitolo}>
                    <IconaPunto id={x.id === "attrezzi" ? "macchine" : x.id} size={22} />
                    {x.titolo}
                  </span>
                  <span className={s.passoTesto}>{x.testo}</span>
                </div>
                <SoloJs>
                  <button
                    type="button"
                    className={s.passoBtn}
                    aria-pressed={attiva}
                    aria-label={x.titolo}
                    onClick={() => scegli(x.id)}
                  />
                </SoloJs>
              </li>
            );
          })}
        </ol>
        {tappa && (
          <SoloJs>
            <button type="button" className={s.tutto} onClick={() => scegli(tappa)}>
              {t.tuttoIlPiano}
            </button>
          </SoloJs>
        )}
      </div>
    </div>
  );
}
