"use client";

import { Pause, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { BrandMark } from "@/components/site/BrandMark";
import { EMAIL_SHOWN, MAILTO_LOWER, SITE_NAME } from "@/lib/site";
import { player, ui } from "./player";

/**
 * Barra alta del film (E9): trasparente all'inizio, pillola di vetro appena si
 * entra nel film (classe toggolata UNA volta dal ciclo, non React), contatore di
 * atto (intero, funzione dei gate), barra di avanzamento = p, filetto con la
 * luce agli snodi (E6, funzione di sp). UN solo controllo Riproduci / Pausa:
 * e' il play del film ED e' la pausa dell'animazione (WCAG 2.2.2).
 *
 * Costo: una superficie sfocata su desktop (solid su telefono: niente blur
 * sopra un canvas WebGL su iOS). Il ciclo scrive solo transform/opacity e il
 * valore della barra.
 */
export function FilmTopBar({ controls }: { controls: boolean }) {
  return (
    <header className="film-top" ref={(el) => void (ui.top = el)}>
      <div className="film-top__in">
        <Link href="/" className="film-top__brand" aria-label={`${SITE_NAME}, inizio`} data-cursor="link">
          <BrandMark />
          <span className="hidden text-sm font-semibold tracking-tight sm:block">{SITE_NAME}</span>
        </Link>
        <nav aria-label="Pagine" className="film-top__nav">
          {controls && <PlayControl />}
          <Link href="/dettagli" className="film-top__link" data-cursor="link">
            Dettagli
          </Link>
          <a href={MAILTO_LOWER} className="film-top__link film-top__link--mail" aria-label={`Scrivi via email a ${EMAIL_SHOWN}`} data-cursor="link">
            Scrivi via email
          </a>
        </nav>
        {controls && <ProgressBar />}
        <span className="film-top__hair" aria-hidden="true">
          <span className="film-top__pulse" ref={(el) => void (ui.pulse = el)} />
        </span>
      </div>
    </header>
  );
}

const SSR_SNAP = { playing: false, paused: false };

function PlayControl() {
  const s = useSyncExternalStore(player.subscribe, player.snapshot, () => SSR_SNAP);
  return (
    <span className="film-play" data-film-controls>
      <button
        type="button"
        className="film-play__btn"
        aria-pressed={s.playing}
        aria-label={s.playing ? "Pausa: ferma il film e le animazioni" : "Riproduci il film da qui"}
        onClick={player.toggle}
        data-cursor="link"
      >
        {s.playing ? <Pause size={16} strokeWidth={1.6} aria-hidden /> : <Play size={16} strokeWidth={1.6} aria-hidden />}
        <span className="film-play__label">{s.playing ? "Pausa" : "Riproduci"}</span>
      </button>
      <span className="film-play__act mono" ref={(el) => void (ui.counter = el)} aria-live="off">
        1/6
      </span>
    </span>
  );
}

/**
 * Barra di avanzamento = p (scritta dal ciclo). Trascinarla o usare le frecce
 * porta lo scroll a quel p e FERMA il play: e' un input dell'utente.
 */
function ProgressBar() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ui.bar = ref.current;
    return () => {
      ui.bar = null;
    };
  }, []);
  return (
    <input
      ref={ref}
      type="range"
      className="film-seek"
      min={0}
      max={1000}
      step={1}
      defaultValue={0}
      aria-label="Avanzamento del film"
      aria-valuetext="inizio"
      data-film-controls
      data-cursor="drag"
      onPointerDown={() => {
        ui.dragging = true;
        player.interrupt("barra");
      }}
      onPointerUp={() => void (ui.dragging = false)}
      onPointerCancel={() => void (ui.dragging = false)}
      onKeyDown={() => player.interrupt("barra")}
      onInput={(e) => {
        player.interrupt("barra");
        ui.seekTo = Number((e.target as HTMLInputElement).value) / 1000;
      }}
    />
  );
}
