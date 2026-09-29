"use client";

/**
 * Il film a scroll: una traccia di 2200vh, UNA stage sticky, UN canvas.
 * Qui vive l'unico ciclo rAF che scrive `film.p` (state.ts) e aggiorna gli
 * overlay DOM per lettera. React non ri-renderizza mai dallo scroll: l'unico
 * setState e' la scelta iniziale film / fallback (WebGL si' o no).
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMotionPrefs } from "@/components/motion/MotionPrefs";
import { buttonVariants } from "@/components/ui/button";
import { EMAIL_SHOWN, FILM_H1, FILM_PHRASE_A, FILM_PHRASE_B, MAILTO_LOWER } from "@/lib/site";
import type { Palette } from "./FilmCanvas";
import { FilmFallback } from "./FilmFallback";
import { OVERLAY_WINDOWS, actAxis, clamp01, computeGates, easeOutCubic, film, smoothstep } from "./state";

const FilmCanvas = dynamic(() => import("./FilmCanvas"), { ssr: false });

/** Ingresso automatico: p sale da 0 a ENTRY in ENTRY_MS, poi lo scroll comanda. */
const ENTRY = 0.06;
const ENTRY_MS = 2500;
/** Sfalsamento tra le lettere (0 = tutte insieme). */
const STAGGER = 0.7;
const BLUR_PX = 9;

/** Palette del canvas letta dai token in :root (DESIGN.md: nessuna seconda lista). */
function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const get = (n: string) => cs.getPropertyValue(n).trim();
  return {
    field: get("--film-field"),
    lime: get("--film-accent-figure"),
    gold: get("--film-accent-room"),
    bone: get("--film-type"),
    boneDim: get("--film-neutral-line"),
  };
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Testo diviso per lettera (parole intere: mai a capo dentro una parola). */
function Letters({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <span aria-hidden="true">
      {words.map((w, wi) => (
        <span key={wi} className="film-w">
          {Array.from(w).map((ch, ci) => (
            <span key={ci} className="film-l">
              {ch}
            </span>
          ))}
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

type Ov = { el: HTMLElement; letters: HTMLElement[]; key: string };

export function Film() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { reduced, paused } = useMotionPrefs();
  const [mode, setMode] = useState<"ssr" | "film" | "fallback">("ssr");
  const [palette, setPalette] = useState<Palette | null>(null);
  const entryT0 = useRef(0);

  useEffect(() => {
    film.reduced = reduced;
    film.paused = paused;
  }, [reduced, paused]);

  // Scelta iniziale (una volta): WebGL o fallback. Non dipende dallo scroll.
  useEffect(() => {
    film.mobile = window.matchMedia("(max-width: 820px)").matches;
    film.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    if (!hasWebGL()) {
      setMode("fallback");
      return;
    }
    setPalette(readPalette());
    setMode("film");
  }, []);

  // Il ciclo: legge lo scroll, scrive `film`, aggiorna gli overlay. Mai React.
  useEffect(() => {
    if (mode !== "film") return;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const debug =
      process.env.NODE_ENV !== "production" || window.location.search.includes("film-debug");
    const pinRaw = debug ? new URLSearchParams(window.location.search).get("film-p") : null;
    const pin = pinRaw !== null && pinRaw !== "" ? clamp01(Number(pinRaw)) : null;
    if (debug) (window as unknown as { __film: typeof film }).__film = film;

    const ovs: Ov[] = Array.from(stage.querySelectorAll<HTMLElement>("[data-ov]")).map((el) => ({
      el,
      letters: Array.from(el.querySelectorAll<HTMLElement>(".film-l")),
      key: "",
    }));

    // Se la pagina si apre gia' scrollata (ricarica a meta'), niente ingresso.
    const rect0 = track.getBoundingClientRect();
    const startedScrolled = -rect0.top > 2;

    const onMove = (e: PointerEvent) => {
      film.mx = (e.clientX / window.innerWidth) * 2 - 1;
      film.my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onResize = () => {
      film.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);

    let raf = 0;
    const loop = (now: number) => {
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollP = clamp01(-rect.top / Math.max(1, rect.height - vh));
      // Ingresso: offset che sale in 2,5 s e DECADE con lo scroll (zero da scrollP 0.12).
      // Con meno movimento o senza canvas pronto, niente ingresso.
      let entry = 0;
      if (!film.reduced && !startedScrolled && entryT0.current > 0) {
        entry = ENTRY * easeOutCubic((now - entryT0.current) / ENTRY_MS);
      }
      const off = entry * (1 - clamp01(scrollP / 0.12));
      const p = pin ?? clamp01(scrollP + off);
      film.scrollP = scrollP;
      film.p = p;
      film.sp = actAxis(p);
      film.t = now / 1000;
      film.frame++;
      computeGates(p, film.sp, film.gates);

      for (let j = 0; j < ovs.length; j++) {
        const w = OVERLAY_WINDOWS[j];
        if (!w) continue;
        const v = w.axis === "sp" ? film.sp : p;
        const wIn = smoothstep(w.in0, w.in1, v);
        const wOut = smoothstep(w.out0, w.out1, v);
        const total = wIn * (1 - wOut);
        const ov = ovs[j];
        // chiave quantizzata: si scrive il DOM solo quando cambia qualcosa
        const key = total < 0.01 ? "off" : `${Math.round(wIn * 200)}:${Math.round(wOut * 200)}`;
        if (key === ov.key) continue;
        ov.key = key;
        if (key === "off") {
          ov.el.style.visibility = "hidden";
          continue;
        }
        ov.el.style.visibility = "visible";
        const n = ov.letters.length || 1;
        const blurOn = !film.reduced;
        for (let i = 0; i < n; i++) {
          const L = ov.letters[i];
          if (!L) break;
          // chiusura che arriva FRONT-TO-BACK (prime lettere prima), risolvendosi dal blur
          const ei = clamp01(wIn * (1 + STAGGER) - (i / n) * STAGGER);
          // apertura che se ne va BACK-TO-FRONT (ultime lettere prima), sfocando
          const xi = clamp01(wOut * (1 + STAGGER) - ((n - 1 - i) / n) * STAGGER);
          const op = ei * (1 - xi);
          const blur = blurOn ? (1 - ei) * BLUR_PX + xi * BLUR_PX : 0;
          const sc = 0.94 + 0.06 * ei + 0.08 * xi;
          L.style.opacity = op.toFixed(3);
          L.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
          L.style.transform = `translate3d(0,0,0) scale(${sc.toFixed(4)})`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, [mode]);

  if (mode === "fallback") return <FilmFallback />;

  return (
    <div className="film-track" ref={trackRef}>
      <div className="film-stage" ref={stageRef}>
        {mode === "film" && palette && (
          <FilmCanvas
            palette={palette}
            onReady={() => {
              if (!entryT0.current) entryT0.current = performance.now();
            }}
          />
        )}

        {/* Overlay: assoluti, pointer-events none, finestre sull'ASSE DEGLI ATTI. */}
        <div className="film-ov film-ov--title" data-ov="0" style={{ visibility: "visible" }}>
          <h1 className="film-h1" aria-label={FILM_H1}>
            <Letters text={FILM_H1} />
          </h1>
        </div>
        <div className="film-ov film-ov--low" data-ov="1">
          <p className="film-line" aria-label={FILM_PHRASE_A}>
            <Letters text={FILM_PHRASE_A} />
          </p>
        </div>
        <div className="film-ov film-ov--low" data-ov="2">
          <p className="film-line" aria-label={FILM_PHRASE_B}>
            <Letters text={FILM_PHRASE_B} />
          </p>
        </div>
        <div className="film-ov film-ov--low" data-ov="3">
          <p className="film-line" aria-label={FILM_PHRASE_A}>
            <Letters text={FILM_PHRASE_A} />
          </p>
        </div>
        <div className="film-ov film-ov--low" data-ov="4">
          <p className="film-line" aria-label={FILM_PHRASE_B}>
            <Letters text={FILM_PHRASE_B} />
          </p>
        </div>
        <div className="film-ov film-ov--end" data-ov="5">
          <div className="film-end">
            <p className="film-line film-line--s" aria-label={FILM_PHRASE_A}>
              <Letters text={FILM_PHRASE_A} />
            </p>
            <p className="film-line film-line--s film-line--mute" aria-label={FILM_PHRASE_B}>
              <Letters text={FILM_PHRASE_B} />
            </p>
            <div className="film-cta">
              <Link href="/dettagli" className={buttonVariants()}>
                Vedi i dettagli
              </Link>
              <a href={MAILTO_LOWER} className={buttonVariants({ variant: "outline" })} aria-label={`Scrivi via email a ${EMAIL_SHOWN}`}>
                Scrivi via email
              </a>
            </div>
            <p className="film-mail mono">{EMAIL_SHOWN}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
