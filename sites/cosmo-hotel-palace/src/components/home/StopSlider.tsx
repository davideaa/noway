"use client";

/*
 * Cursore continuo con quattro tappe (hero: Alba · Mattina · Pomeriggio · Sera; ristorante:
 * Mattina · Pranzo · Aperitivo · Sera). È un <input type="range"> NATIVO: tastiera, tocco e lettori
 * di schermo funzionano da soli. Differenze dal <Range> di components/ui:
 *   - il valore è continuo (0..1): la luce può stare fra due tappe, e può seguire lo scroll;
 *   - le frecce, Pagina su/giù, Home e Fine saltano alla tappa precedente/successiva (`onTappa`),
 *     non di un centesimo;
 *   - le quattro etichette sotto la traccia sono bersagli da 44 px: un tocco porta a quella tappa.
 * Chi lo usa decide cosa significa «andare a una tappa» (animare la luce, scorrere la pagina).
 */

import { useId, type CSSProperties, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import range from "@/components/ui/range.module.css";
import s from "./home.module.css";

export type StopSliderProps = {
  /** Etichetta visibile sopra il cursore (es. «Ora del giorno»). */
  etichetta: string;
  /** Le tappe, a 0, 1/3, 2/3, 1. */
  tappe: readonly string[];
  /** Valore 0..1 mostrato dal cursore. */
  valore: number;
  /** Trascinamento: valore continuo 0..1. */
  onValore: (v: number) => void;
  /** Tocco su un'etichetta, frecce, Home/Fine: tappa 0..n-1. */
  onTappa: (indice: number) => void;
  /** Tappa da mostrare come attuale, se deve seguire una regola diversa dalla più vicina (isteresi). */
  tappaAttiva?: number;
  /** Id di un testo di aiuto (letto dopo il valore). */
  descrittoDa?: string;
  className?: string;
};

export const tappaPiuVicina = (v: number, n: number): number => Math.round(Math.min(1, Math.max(0, v)) * (n - 1));

export function StopSlider({ etichetta, tappe, valore, onValore, onTappa, tappaAttiva, descrittoDa, className }: StopSliderProps) {
  const id = useId();
  const n = tappe.length;
  const attiva = tappaAttiva ?? tappaPiuVicina(valore, n);
  const pct = valore * 100;

  const tasti = (e: KeyboardEvent<HTMLInputElement>) => {
    const pos = valore * (n - 1);
    let t: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
      case "PageUp":
        t = Math.min(n - 1, Math.floor(pos + 0.02) + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
      case "PageDown":
        t = Math.max(0, Math.ceil(pos - 0.02) - 1);
        break;
      case "Home":
        t = 0;
        break;
      case "End":
        t = n - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    onTappa(t);
  };

  return (
    <div className={cn(s.stopSlider, className)}>
      <div className={s.stopRiga}>
        <label htmlFor={id} className={s.stopEtichetta}>
          {etichetta}
        </label>
        <span aria-hidden="true" className={s.stopValore}>
          {tappe[attiva]}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step="any"
        value={valore}
        className={range.range}
        style={{ "--p": `${pct}%` } as CSSProperties}
        aria-valuetext={tappe[attiva]}
        aria-describedby={descrittoDa}
        onChange={(e) => onValore(Number(e.target.value))}
        onKeyDown={tasti}
      />
      <ul aria-hidden="true" className={s.stopMarche}>
        {tappe.map((t, i) => (
          <li
            key={t}
            className={s.stopMarca}
            data-attiva={i === attiva ? "1" : undefined}
            style={{ "--f": i / (n - 1) } as CSSProperties}
          >
            <button type="button" tabIndex={-1} onClick={() => onTappa(i)}>
              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
