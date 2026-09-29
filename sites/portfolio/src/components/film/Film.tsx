"use client";

/**
 * Il film a scroll: una traccia di 2200vh, UNA stage sticky, UN canvas.
 * Qui vive l'unico ciclo rAF che scrive `film.p` (state.ts), muove lo scroll
 * quando il play e' acceso, smussa l'input del puntatore e aggiorna gli overlay
 * DOM per lettera, la barra alta, la torcia e il cursore. React non
 * ri-renderizza mai dallo scroll: l'unico setState e' la scelta iniziale
 * film / fallback (WebGL si' o no) e il tasto Riproduci/Pausa.
 *
 * V = F(p) + G(t) + H(m): F e' lo scroll, G il respiro (solo tempo, mai la
 * camera), H il puntatore smussato ALL'INGRESSO (qui, con dt), poi usato in
 * modo puro dalla scena. Mai un lerp dentro la scena.
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMotionPrefs } from "@/components/motion/MotionPrefs";
import { buttonVariants } from "@/components/ui/button";
import { FILM_CTA, FILM_END, FILM_H1, FILM_PHRASE_A, FILM_PHRASE_B, FILM_S2, FILM_S3, FILM_S3_WORDS, FILM_SUB } from "@/lib/site";
import { MagneticCta } from "./MagneticCta";
import type { Palette } from "./FilmCanvas";
import { FilmFallback } from "./FilmFallback";
import { FilmTopBar } from "./FilmTopBar";
import { player, ui } from "./player";
import {
  OVERLAY_WINDOWS,
  actAxis,
  clamp01,
  computeGates,
  currentAct,
  easeOutCubic,
  entryDecay,
  entryDecaySlope,
  film,
  hairlinePulse,
  limeInFrame,
  playSecondsPerUnit,
  smoothstep,
  wormGate,
} from "./state";

const FilmCanvas = dynamic(() => import("./FilmCanvas"), { ssr: false });

/**
 * Ingresso automatico: p sale da 0 a ENTRY in ENTRY_MS, poi parte il play.
 * Il tempo dell'ingresso e' ACCUMULATO per fotogramma con dt limitato a 50 ms
 * (QA-FILM B3: il primo fotogramma blocca il thread per il bake e la
 * compilazione degli shader; con il tempo di parete la rampa veniva mangiata),
 * e parte solo dopo il secondo fotogramma disegnato. In pausa non avanza (B4).
 */
const ENTRY = 0.06;
const ENTRY_MS = 1200; // la figura si compone in poco piu' di un secondo, poi il play parte da solo
const ENTRY_DT_MAX = 0.05;
/** Partenza dolce del play (ms) e frenata sull'ultimo tratto. */
const PLAY_EASE_MS = 500;
/** Sfalsamento tra le lettere (0 = tutte insieme). */
const STAGGER = 0.7;
const BLUR_PX = 9;
/** Costanti di tempo dello smussamento dell'input (s): scena, torcia, anello del cursore. */
const TAU_SCENE = 0.15;
const TAU_TORCH = 0.12;
const TAU_RING = 0.06;

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

/**
 * Testo diviso per lettera (parole intere: mai a capo dentro una parola).
 * `--w` e `--i` (indice di parola e di lettera) servono all'entrata E5 del
 * titolo: a fuoco da dietro, sfalsata per parola (oltre 40 lettere lo
 * sfalsamento per lettera farebbe atterrare la coda dopo 1 s).
 */
function Letters({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <span aria-hidden="true">
      {words.map((w, wi) => (
        <span key={wi}>
          <span className="film-w">
            {Array.from(w).map((ch, ci) => (
              <span key={ci} className="film-l" style={{ "--w": wi, "--i": ci } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
          {/* lo spazio sta FUORI dall'inline-block, altrimenti viene tolto in fondo alla parola */}
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

type Ov = { el: HTMLElement; letters: HTMLElement[]; key: string; whole: boolean; stagger: number };
type Client = { mode: "ssr" | "film" | "fallback"; palette: Palette | null };

/** Scelta iniziale, UNA volta e fuori da React: WebGL si' (film) o no (fallback). */
const SSR: Client = { mode: "ssr", palette: null };
let clientCache: Client | undefined;
function getClient(): Client {
  if (!clientCache) {
    film.mobile = window.matchMedia("(max-width: 820px)").matches;
    film.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    clientCache = hasWebGL() ? { mode: "film", palette: readPalette() } : { mode: "fallback", palette: null };
  }
  return clientCache;
}
const noopSubscribe = () => () => {};

export function Film() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();
  const { mode, palette } = useSyncExternalStore(noopSubscribe, getClient, () => SSR);
  /** true dal secondo fotogramma disegnato dal canvas (bake e shader gia' fatti) */
  const ready = useRef(false);
  /** secondi d'ingresso accumulati (dt limitato, fermo in pausa) */
  const entryS = useRef(0);
  // Il canvas (three.js, ~240 kB) si monta dopo il primo disegno dell'h1: LCP e
  // TBT non aspettano il film (QA-FILM C3). Un solo setState, una volta.
  const [canvasOn, setCanvasOn] = useState(false);
  useEffect(() => {
    if (mode !== "film") return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setCanvasOn(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [mode]);

  useEffect(() => {
    film.reduced = reduced;
  }, [reduced]);

  // Il ciclo: legge lo scroll (o lo muove, in play), scrive `film`, aggiorna il DOM. Mai React.
  useEffect(() => {
    if (mode !== "film") return;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const debug =
      process.env.NODE_ENV !== "production" || window.location.search.includes("film-debug");
    const q = new URLSearchParams(window.location.search);
    const pinRaw = debug ? q.get("film-p") : null;
    const pin = pinRaw !== null && pinRaw !== "" ? clamp01(Number(pinRaw)) : null;
    // solo debug: congela il tempo (grana, float) per confrontare due fotogrammi allo stesso p
    const tRaw = debug ? q.get("film-t") : null;
    const tPin = tRaw !== null && tRaw !== "" ? Number(tRaw) : null;
    // solo debug: niente play automatico (test dello scrub)
    const noAuto = debug && q.get("film-noplay") === "1";
    if (debug) (window as unknown as { __film: typeof film }).__film = film;

    const ovs: Ov[] = Array.from(stage.querySelectorAll<HTMLElement>("[data-ov]")).map((el) => {
      const letters = Array.from(el.querySelectorAll<HTMLElement>(".film-l"));
      // data-stagger: sfalsamento maggiore (S3: le tre parole si accendono in sequenza)
      return { el, letters, key: "", whole: el.hasAttribute("data-ov-whole"), stagger: Number(el.dataset.stagger || STAGGER) };
    });

    // Se la pagina si apre gia' scrollata (ricarica a meta'), niente ingresso e niente play automatico.
    const rect0 = track.getBoundingClientRect();
    const startedScrolled = -rect0.top > 2;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    /* ---------------- input del puntatore: si smussa QUI, e solo qui ---------------- */
    const ptr = { x: 0, y: 0, in: 0, sx: 0, sy: 0, sin: 0, tx: 0, ty: 0, rx: 0, ry: 0, seen: false };
    let cursorState = "";
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") {
        ptr.in = 0; // touch: H(m) = 0, resta solo il respiro G(t)
        return;
      }
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.in = 1;
      if (!ptr.seen) {
        // primo evento: niente rincorsa dal centro
        ptr.seen = true;
        ptr.sx = ptr.tx = ptr.rx = ptr.x;
        ptr.sy = ptr.ty = ptr.ry = ptr.y;
      }
    };
    const onLeave = () => void (ptr.in = 0);
    const onOver = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.("[data-cursor], a, button, input") as HTMLElement | null;
      cursorState = t ? t.dataset.cursor || (t.tagName === "INPUT" ? "drag" : "link") : "";
    };
    const onResize = () => {
      film.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("resize", onResize);

    /* ---------------- il play: interrotto da QUALSIASI input dell'utente ---------------- */
    let expectedY = -1;
    const isControl = (e: Event) => !!(e.target as Element | null)?.closest?.("[data-film-controls]");
    const stopOnInput = (e: Event) => {
      if (isControl(e)) return;
      player.interrupt();
    };
    const onKey = (e: KeyboardEvent) => {
      if (isControl(e)) return;
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"].includes(e.key)) player.interrupt();
    };
    const onScroll = () => {
      // scroll non nostro (scrollbar, tasti, gesture): il play si ferma dov'e'
      if (player.playing && expectedY >= 0 && Math.abs(window.scrollY - expectedY) > 3) player.interrupt();
    };
    window.addEventListener("wheel", stopOnInput, { passive: true });
    window.addEventListener("touchstart", stopOnInput, { passive: true });
    window.addEventListener("pointerdown", stopOnInput, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    let last = 0;
    let playT0 = 0;
    let wasPlaying = false;
    let autoStarted = false;
    let pill = false;
    let actShown = 0;
    let pulseKey = "";
    let navOutKey = "";
    let cursorShown = "";
    const trackTop = () => track.getBoundingClientRect().top + window.scrollY;
    const scrollLen = () => Math.max(1, track.offsetHeight - window.innerHeight);
    const setScrollP = (s: number) => {
      const y = trackTop() + clamp01(s) * scrollLen();
      expectedY = Math.round(y);
      // "instant": html ha scroll-behavior: smooth, e uno scroll animato sarebbe letto come input dell'utente
      window.scrollTo({ top: y, behavior: "instant" });
    };

    const loop = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
      last = now;

      /* --- smussamento dell'input (H(m)): esponenziale con dt, identico a 30 e 120 fps --- */
      const k = 1 - Math.exp(-dt / TAU_SCENE);
      const kt = 1 - Math.exp(-dt / TAU_TORCH);
      const kr = 1 - Math.exp(-dt / TAU_RING);
      const inT = finePointer && !film.reduced ? ptr.in : 0;
      ptr.sin += (inT - ptr.sin) * k;
      ptr.sx += (ptr.x - ptr.sx) * k;
      ptr.sy += (ptr.y - ptr.sy) * k;
      ptr.tx += (ptr.x - ptr.tx) * kt;
      ptr.ty += (ptr.y - ptr.ty) * kt;
      ptr.rx += (ptr.x - ptr.rx) * kr;
      ptr.ry += (ptr.y - ptr.ry) * kr;
      film.mx = ((ptr.sx / window.innerWidth) * 2 - 1) * ptr.sin;
      film.my = ((ptr.sy / window.innerHeight) * 2 - 1) * ptr.sin;
      film.min = ptr.sin;

      /* --- ingresso: offset che sale in 2,5 s (tempo accumulato, fermo in pausa) e DECADE con lo scroll --- */
      const entryOn = !film.reduced && !startedScrolled && ready.current;
      if (entryOn && !player.paused && entryS.current < ENTRY_MS / 1000) entryS.current += Math.min(dt, ENTRY_DT_MAX);
      const entryNow = entryOn ? ENTRY * easeOutCubic(entryS.current / (ENTRY_MS / 1000)) : 0;
      const entryDone = entryOn && entryS.current >= ENTRY_MS / 1000;
      // play automatico: UNA volta, dopo l'ingresso; mai con meno movimento, mai se si e' aperti a meta'
      if (entryDone && !autoStarted && !noAuto && pin === null) {
        autoStarted = true;
        if (!player.paused) player.play();
      }

      /* --- richiesta dalla barra di avanzamento: e' un input dell'utente --- */
      if (ui.seekTo !== null) {
        setScrollP(ui.seekTo);
        ui.seekTo = null;
      }

      /* --- il play: muove lo SCROLL, mai p. p resta funzione della posizione della pagina --- */
      const playing = player.playing && pin === null;
      if (playing) {
        if (!wasPlaying) {
          playT0 = now;
          if (film.scrollP >= 0.995) setScrollP(0); // Play a fine corsa: si riparte dall'inizio
        }
        const rectNow = track.getBoundingClientRect();
        const s0 = clamp01(-rectNow.top / scrollLen());
        // dp/dscrollP: finche' l'ingresso decade, p sale meno dello scroll (mai sotto 0.55)
        const gain = 1 + entryNow * entryDecaySlope(s0);
        const pNow = clamp01(s0 + entryNow * entryDecay(s0));
        const ease = smoothstep(0, 1, (now - playT0) / PLAY_EASE_MS) * (0.3 + 0.7 * (1 - smoothstep(0.96, 1, pNow)));
        const dp = (dt / playSecondsPerUnit(pNow)) * ease;
        film.playT += dt;
        const s1 = s0 + dp / Math.max(0.5, gain);
        if (s1 >= 1) {
          setScrollP(1);
          player.interrupt();
        } else setScrollP(s1);
      }
      wasPlaying = playing;
      film.playing = playing;
      film.paused = player.paused;

      /* --- p: funzione della posizione di scroll (+ l'ingresso che decade) --- */
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollP = clamp01(-rect.top / Math.max(1, rect.height - vh));
      const off = entryNow * entryDecay(scrollP);
      const p = pin ?? clamp01(scrollP + off);
      film.scrollP = scrollP;
      film.p = p;
      film.sp = actAxis(p);
      film.t = tPin ?? now / 1000;
      film.frame++;
      computeGates(p, film.sp, film.gates);

      /* --- overlay: finestre sull'asse degli atti, per lettera (o intero per il pannello) --- */
      for (let j = 0; j < ovs.length; j++) {
        const w = OVERLAY_WINDOWS[j];
        if (!w) continue;
        const v = w.axis === "sp" ? film.sp : p;
        // quantizzati a 1/200: si scrive il DOM solo quando cambia qualcosa, e con i valori
        // QUANTIZZATI, cosi' lo stile e' funzione pura del gradino e non del lato da cui lo si raggiunge
        const wIn = Math.round(smoothstep(w.in0, w.in1, v) * 200) / 200;
        const wOut = Math.round(smoothstep(w.out0, w.out1, v) * 200) / 200;
        const total = wIn * (1 - wOut);
        const ov = ovs[j];
        const key = total < 0.01 ? "off" : `${wIn * 200}:${wOut * 200}`;
        if (key === ov.key) continue;
        ov.key = key;
        if (key === "off") {
          ov.el.style.visibility = "hidden";
          continue;
        }
        ov.el.style.visibility = "visible";
        const blurOn = !film.reduced;
        if (ov.whole) {
          // il pannello dei dati: entra intero (front-to-back non ha senso su una tabella)
          const blur = blurOn ? (1 - wIn) * BLUR_PX : 0;
          ov.el.style.opacity = wIn.toFixed(3);
          ov.el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
          ov.el.style.transform = `translate3d(0,0,0) scale(${(0.96 + 0.04 * wIn).toFixed(4)})`;
          continue;
        }
        const n = ov.letters.length || 1;
        const stagger = ov.stagger;
        for (let i = 0; i < n; i++) {
          const L = ov.letters[i];
          if (!L) break;
          // chiusura che arriva FRONT-TO-BACK (prime lettere prima), risolvendosi dal blur
          const ei = clamp01(wIn * (1 + stagger) - (i / n) * stagger);
          // apertura che se ne va BACK-TO-FRONT (ultime lettere prima), sfocando
          const xi = clamp01(wOut * (1 + stagger) - ((n - 1 - i) / n) * stagger);
          const op = ei * (1 - xi);
          const blur = blurOn ? (1 - ei) * BLUR_PX + xi * BLUR_PX : 0;
          const sc = 0.94 + 0.06 * ei + 0.08 * xi;
          L.style.opacity = op.toFixed(3);
          L.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
          L.style.transform = `translate3d(0,0,0) scale(${sc.toFixed(4)})`;
        }
      }

      /* --- barra alta (E9): pillola dopo sp 0.02 (una volta), contatore intero, avanzamento = p --- */
      const top = ui.top;
      if (top) {
        const wantPill = film.sp > 0.02;
        if (wantPill !== pill) {
          pill = wantPill;
          top.classList.toggle("is-pill", pill);
        }
        // uscita nel wipe: recede e si attenua, ma resta usabile (il tasto Pausa deve restare)
        const out = film.reduced ? 0 : smoothstep(0.9, 1, p);
        const nk = out.toFixed(2);
        if (nk !== navOutKey) {
          navOutKey = nk;
          top.style.setProperty("--nav-out", nk);
        }
      }
      if (ui.counter) {
        const act = currentAct(film.gates);
        if (act !== actShown) {
          actShown = act;
          ui.counter.textContent = `${act}/6`;
        }
      }
      if (ui.bar && !ui.dragging) {
        const v = Math.round(p * 1000);
        if (Number(ui.bar.value) !== v) {
          ui.bar.value = String(v);
          ui.bar.setAttribute("aria-valuetext", `${Math.round(p * 100)}%, atto ${actShown || 1} di 6`);
        }
      }
      // E6: la luce sul filetto agli snodi di atto, funzione di sp
      if (ui.pulse) {
        const pl = film.reduced ? { x: -1, a: 0 } : hairlinePulse(film.sp);
        const pk = `${pl.x.toFixed(3)}:${pl.a.toFixed(2)}`;
        if (pk !== pulseKey) {
          pulseKey = pk;
          ui.pulse.style.transform = `translate3d(${(pl.x * 100).toFixed(1)}%,0,0)`;
          ui.pulse.style.opacity = pl.a.toFixed(2);
        }
      }

      /* --- torcia (E2) e cursore (E3): solo puntatore fine, mai reduced; DOM fisso, solo transform/opacity --- */
      if (ui.torch) {
        // lime: si spegne dove comanda l'oro (stanza), a meta' nel wormhole (li' la luce e' dei fili:
        // la foschia verde al centro della v2 era questa), del tutto nel wipe
        const a = ptr.sin * 0.9 * limeInFrame(film.sp) * (1 - 0.5 * wormGate(film.sp)) * (1 - smoothstep(0.94, 1, p));
        if (a > 0.005) {
          ui.torch.style.opacity = a.toFixed(3);
          ui.torch.style.transform = `translate3d(${(ptr.tx - 320).toFixed(1)}px,${(ptr.ty - 320).toFixed(1)}px,0)`;
        } else if (ui.torch.style.opacity !== "0") ui.torch.style.opacity = "0";
      }
      if (ui.dot && ui.ring) {
        const show = ptr.sin > 0.02;
        if (show) {
          ui.dot.style.transform = `translate3d(${ptr.x.toFixed(1)}px,${ptr.y.toFixed(1)}px,0)`;
          ui.ring.style.transform = `translate3d(${ptr.rx.toFixed(1)}px,${ptr.ry.toFixed(1)}px,0)`;
        }
        const cs = show ? cursorState || "on" : "";
        if (cs !== cursorShown) {
          cursorShown = cs;
          ui.dot.dataset.state = cs;
          ui.ring.dataset.state = cs;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", stopOnInput);
      window.removeEventListener("touchstart", stopOnInput);
      window.removeEventListener("pointerdown", stopOnInput);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      player.interrupt();
    };
  }, [mode]);

  if (mode === "fallback")
    return (
      <>
        <FilmTopBar controls={false} />
        <FilmFallback />
      </>
    );

  return (
    <>
      <FilmTopBar controls={mode === "film"} />
      <div className="film-track" ref={trackRef}>
        <div className="film-stage" ref={stageRef}>
          {mode === "film" && palette && canvasOn && (
            <FilmCanvas
              palette={palette}
              onReady={() => {
                ready.current = true;
              }}
            />
          )}

          {/* Overlay: assoluti, pointer-events none, finestre sull'ASSE DEGLI ATTI.
              PROLOGO (S1-S3, brief di Davide): molto vuoto, testo bone, a fuoco da dietro, mai dal basso. */}
          <div className="film-ov film-ov--title" data-ov="0" style={{ visibility: "visible" }}>
            <h1 className="film-h1" aria-label={FILM_H1}>
              <Letters text={FILM_H1} />
            </h1>
            <p className="film-sub mono" aria-label={FILM_SUB}>
              <Letters text={FILM_SUB} />
            </p>
          </div>
          <div className="film-ov film-ov--pro" data-ov="1">
            <p className="film-line film-line--pro" aria-label={FILM_S2}>
              <Letters text={FILM_S2} />
            </p>
          </div>
          <div className="film-ov film-ov--pro" data-ov="2" data-stagger="1.4">
            <p className="film-steps mono" aria-label={FILM_S3_WORDS.join(", ")}>
              <Letters text={FILM_S3_WORDS.join(" → ")} />
            </p>
            <p className="film-line film-line--s film-line--pro" aria-label={FILM_S3}>
              <Letters text={FILM_S3} />
            </p>
          </div>
          {/* le due frasi ricorrenti degli atti 2-5 */}
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
          <div className="film-ov film-ov--low" data-ov="5">
            <p className="film-line" aria-label={FILM_PHRASE_A}>
              <Letters text={FILM_PHRASE_A} />
            </p>
          </div>
          <div className="film-ov film-ov--low" data-ov="6">
            <p className="film-line" aria-label={FILM_PHRASE_B}>
              <Letters text={FILM_PHRASE_B} />
            </p>
          </div>
          {/* Atto 6: la camera si ferma sulla schermata finale: un titolo, UN bottone (-> /dettagli), "Rivedi". */}
          <div className="film-ov film-ov--end" data-ov="7" data-ov-whole>
            <div className="film-end">
              <h2 className="film-line film-line--end">{FILM_END}</h2>
              <MagneticCta href="/dettagli" className={`${buttonVariants()} film-end__cta`}>
                {FILM_CTA}
              </MagneticCta>
              <button
                type="button"
                className="film-end__again"
                data-cursor="link"
                onClick={() => {
                  ui.seekTo = 0;
                  player.play();
                }}
              >
                Rivedi
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* E2 torcia ed E3 cursore: layer fissi fuori dalla stage (un antenato con transform romperebbe il fixed) */}
      <div className="film-torch" aria-hidden="true" ref={(el) => void (ui.torch = el)} />
      <div className="film-cursor film-cursor--dot" aria-hidden="true" ref={(el) => void (ui.dot = el)} />
      <div className="film-cursor film-cursor--ring" aria-hidden="true" ref={(el) => void (ui.ring = el)} />
    </>
  );
}
