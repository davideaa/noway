"use client";

/**
 * Il film a scroll: una traccia di 2200vh, UNA stage sticky, UN canvas.
 * Qui vive l'unico ciclo rAF che scrive `film.p` (state.ts), muove lo scroll
 * quando il play e' acceso, smussa l'input del puntatore e aggiorna gli overlay
 * DOM per lettera, la barra alta e la torcia. React non
 * ri-renderizza mai dallo scroll: l'unico setState e' la scelta iniziale
 * film / fallback (WebGL si' o no) e il tasto Riproduci/Pausa.
 *
 * V = F(p) + G(t) + H(m): F e' lo scroll, G il respiro (solo tempo, mai la
 * camera), H il puntatore smussato ALL'INGRESSO (qui, con dt), poi usato in
 * modo puro dalla scena. Mai un lerp dentro la scena.
 */
import { Play } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMotionPrefs } from "@/components/motion/MotionPrefs";
import { buttonVariants } from "@/components/ui/button";
import { FILM_CTA, FILM_END, FILM_H1, FILM_PHRASE_A, FILM_S2, FILM_S5, FILM_S6_PRE, FILM_S3, FILM_S3_WORDS, FILM_SUB, SITE_NAME } from "@/lib/site";
import { Globo } from "./Globo";
import { MagneticCta } from "./MagneticCta";
import { bakeFan, fanParams } from "./bake";
import type { Palette } from "./FilmCanvas";
import { FilmFallback } from "./FilmFallback";
import { FilmTopBar } from "./FilmTopBar";
import { player, ui } from "./player";
import { PROFILES, boot, diag, installErrorCapture, probeWebGL, quality, readSignals } from "./quality";
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
/** Costanti di tempo dello smussamento dell'input (s): scena, torcia. */
const TAU_SCENE = 0.15;
const TAU_TORCH = 0.12;

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

/**
 * Tap semplice (touch o click): sotto questo spostamento NON e' un input che
 * ferma il play. Il tempo non serve a distinguere: senza movimento (anche una
 * pressione lunga) la pagina non scorre e il play non si ferma mai.
 */
const TAP_PX = 10;
/**
 * Misura degli fps per quality.adjust: si SALTA il primo secondo di play (il
 * telefono sta ancora compilando shader e scaricando chunk: un calo li' e'
 * normale, e una volta preso per buono abbassava il livello per sempre), poi
 * si misura per 3 s.
 */
const FPS_WARMUP_MS = 1000;
const FPS_WINDOW_MS = 3000;
/** Durata dell'entrata nel pianeta prima di andare ai dettagli (ms). */
const ENTRA_MS = 1300;
/** Se il film non e' pronto entro questo tempo, il caricamento lo dice invece di restare muto. */
const SLOW_BOOT_MS = 12000;

/**
 * Testo diviso per lettera (parole intere: mai a capo dentro una parola).
 * `--w` e `--i` (indice di parola e di lettera) servono all'entrata E5 del
 * titolo: a fuoco da dietro, sfalsata per parola (oltre 40 lettere lo
 * sfalsamento per lettera farebbe atterrare la coda dopo 1 s).
 */
function Letters({ text }: { text: string }) {
  // "\n" = a capo voluto; l'indice di parola (--w) continua fra le righe per lo sfalsamento
  let wi = 0;
  const lines = text.split("\n").map((line) =>
    line.split(" ").map((w, k, all) => ({ w, id: wi++, last: k === all.length - 1 })),
  );
  return (
    <span aria-hidden="true">
      {lines.map((words, li) => (
        <span key={li}>
          {li > 0 ? <br /> : null}
          {words.map(({ w, id, last }) => (
            <span key={id}>
              <span className="film-w">
                {Array.from(w).map((ch, ci) => (
                  <span key={ci} className="film-l" style={{ "--w": id, "--i": ci } as React.CSSProperties}>
                    {ch}
                  </span>
                ))}
              </span>
              {/* lo spazio sta FUORI dall'inline-block, altrimenti viene tolto in fondo alla parola */}
              {last ? null : " "}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

type Ov = {
  el: HTMLElement;
  /** unita' animate: lettere (alta/media) o parole (lite) — vedi Profile.perLetter */
  letters: HTMLElement[];
  words: HTMLElement[];
  /** unita' in uso ora: lettere, parole o il blocco intero (le altre si ripuliscono al cambio) */
  mode: "letter" | "word" | "whole";
  key: string;
  whole: boolean;
  stagger: number;
};
const ovMode = (d: { perLetter: boolean; perWord: boolean }): Ov["mode"] => (d.perLetter ? "letter" : d.perWord ? "word" : "whole");
type Client = { mode: "ssr" | "film" | "fallback"; palette: Palette | null; diag: boolean };

/**
 * Scelta iniziale, UNA volta e fuori da React: WebGL si' (film) o no (fallback);
 * il LIVELLO di qualita' (quality.ts) dai segnali del dispositivo; e il bake
 * della figura parte SUBITO, in un worker, mentre il chunk di three scarica.
 */
const SSR: Client = { mode: "ssr", palette: null, diag: false };
let clientCache: Client | undefined;
function getClient(): Client {
  if (!clientCache) {
    film.mobile = window.matchMedia("(max-width: 820px)").matches;
    film.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const probe = probeWebGL();
    const isDiag = new URLSearchParams(window.location.search).get("diag") === "1";
    diag.on = isDiag;
    boot.t0 = performance.now();
    if (probe.ok) {
      quality.init(probe, readSignals(window.location.search));
      bakeFan(fanParams(quality.profile, film.aspect)).catch(() => {});
      boot.set("chunk", 0.05);
      clientCache = { mode: "film", palette: readPalette(), diag: isDiag };
    } else clientCache = { mode: "fallback", palette: null, diag: isDiag };
  }
  return clientCache;
}

/** Il testo della diagnostica (?diag=1): quello che Davide incolla. */
function diagText(extra: { entry: number; autoStarted: boolean; measuring: boolean; expectedY: number }) {
  const q = quality;
  const sg = q.signals;
  const ms = (v: number | null) => (v === null ? "—" : `${v.toFixed(0)} ms`);
  const st = player.playing ? "play" : player.paused ? "pausa" : "fermo";
  const lines = [
    `qualita: ${q.tier} — ${q.reason}`,
    `renderer: ${q.probe.renderer || "?"}${q.probe.vendor ? ` · ${q.probe.vendor}` : ""} · webgl${q.probe.webgl2 ? 2 : 1}`,
    `dpr: schermo ${window.devicePixelRatio} · canvas ${Math.min(window.devicePixelRatio, PROFILES[q.tier].dpr)}`,
    `fps: ${diag.fpsNow.toFixed(0)} ora · ${diag.fpsAvg.toFixed(0)} media${q.fpsMeasured !== null ? ` · finestra 1-4 s: ${q.fpsMeasured.toFixed(0)}` : extra.measuring ? " · misura in corso" : ""}`,
    `bake: ${ms(boot.bakeMs)} (${boot.bakeWhere || "—"}) · compile: ${ms(boot.compileMs)} · primo frame: ${ms(boot.firstFrameMs)} · pronto: ${ms(boot.readyMs)}`,
    `p: ${film.p.toFixed(3)} · sp ${film.sp.toFixed(3)} · atto ${currentAct(film.gates)} · ingresso ${extra.entry.toFixed(2)} s · autoplay ${extra.autoStarted ? "partito" : "no"}`,
    `player: ${st}${player.reason ? ` (${player.reason})` : ""} · fase boot: ${boot.stage} · scroll ${Math.round(window.scrollY)}${extra.expectedY >= 0 ? ` (atteso ${extra.expectedY})` : ""}`,
    `schermo: ${window.innerWidth}x${window.innerHeight} · touch ${sg?.touch ? "si" : "no"} · core ${sg?.cores ?? "?"} · mem ${sg?.memoryGB ?? "?"} GB · mobile ${film.mobile ? "si" : "no"} · reduced ${film.reduced ? "si" : "no"}`,
    `ua: ${navigator.userAgent}`,
    `errori: ${diag.errors.length ? diag.errors.join(" | ") : "nessuno"}`,
  ];
  return lines.join("\n");
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
const noopSubscribe = () => () => {};

/** Pannello ?diag=1: mono, in alto a destra; il ciclo lo riscrive, il tasto copia il testo. */
function DiagPanel({ textRef }: { textRef: React.RefObject<() => string> }) {
  const [copied, setCopied] = useState<"" | "ok" | "no">("");
  return (
    <div className="film-diag" data-film-controls>
      <pre className="film-diag__txt mono" ref={(el) => void (ui.diag = el)} />
      <button
        type="button"
        className="film-diag__copy mono"
        onClick={async () => {
          const ok = await copyText(textRef.current());
          setCopied(ok ? "ok" : "no");
          window.setTimeout(() => setCopied(""), 1600);
        }}
      >
        {copied === "ok" ? "Copiato" : copied === "no" ? "Copia fallita: seleziona il testo" : "Copia diagnostica"}
      </button>
    </div>
  );
}

export function Film() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();
  const { mode, palette, diag: diagOn } = useSyncExternalStore(noopSubscribe, getClient, () => SSR);
  /** true dal secondo fotogramma disegnato dal canvas (bake e shader gia' fatti) */
  const ready = useRef(false);
  /** ms (performance.now) in cui il canvas e' diventato pronto */
  const readyAt = useRef(0);
  /** il testo della diagnostica, per il tasto "Copia" (lo compone il ciclo) */
  const diagTextRef = useRef<() => string>(() => "");
  /** secondi d'ingresso accumulati (dt limitato, fermo in pausa) */
  const entryS = useRef(0);
  // Il canvas (three.js, ~240 kB) si monta dopo il primo disegno dell'h1: LCP e
  // TBT non aspettano il film (QA-FILM C3). Un solo setState, una volta.
  const [canvasOn, setCanvasOn] = useState(false);

  /* ENTRARE NEL PIANETA (Davide): al clic su "Esplora il portfolio" le scritte svaniscono,
     il pianeta con il logo viene incontro fino a entrarci dentro, un lampo si chiude nel
     fondo del sito, e solo allora si va ai dettagli. Nell'anteprima di Claude il clic lo
     prende prima lo script dell'anteprima: per questo la stessa funzione e' anche su window. */
  const finale = useRef<HTMLDivElement>(null);
  const entra = useCallback((vai: () => void) => {
    const el = finale.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return vai();
    el.classList.add("is-entra");
    window.setTimeout(vai, ENTRA_MS);
  }, []);
  useEffect(() => {
    const w = window as unknown as { __transizione?: (vai: () => void) => void; __transizioneReset?: () => void };
    const via = () => finale.current?.classList.remove("is-entra");
    w.__transizione = entra;
    w.__transizioneReset = via;
    // tornando indietro col browser la pagina puo' riaprirsi dalla cache: non deve restare "dentro"
    window.addEventListener("pageshow", via);
    return () => {
      delete w.__transizione;
      delete w.__transizioneReset;
      window.removeEventListener("pageshow", via);
    };
  }, [entra]);
  const onVai = (e: React.MouseEvent) => {
    const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || !/dettagli/.test(a.getAttribute("href") || "")) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const href = a.href;
    entra(() => window.location.assign(href));
  };
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

  // Lo stato di caricamento: barra sottile + percentuale, scritti dal boot (quality.ts), mai per frame.
  useEffect(() => {
    if (mode !== "film") return;
    const paint = () => {
      const el = ui.loader;
      if (!el) return;
      if (boot.stage === "ready") {
        el.classList.add("is-done");
        return;
      }
      if (ui.loaderBar) ui.loaderBar.style.transform = `scaleX(${boot.progress.toFixed(3)})`;
      if (ui.loaderText)
        ui.loaderText.textContent =
          boot.stage === "error" ? "il film non riesce a partire · scorri per continuare" : `caricamento ${Math.round(boot.progress * 100)}%`;
    };
    paint();
    const un = boot.subscribe(paint);
    const slow = window.setTimeout(() => {
      if (boot.stage !== "ready" && ui.loaderText) ui.loaderText.textContent = "il film fatica a partire · scorri per continuare";
    }, SLOW_BOOT_MS);
    return () => {
      un();
      window.clearTimeout(slow);
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
      const words = Array.from(el.querySelectorAll<HTMLElement>(".film-w"));
      // data-stagger: sfalsamento maggiore (S3: le tre parole si accendono in sequenza)
      return {
        el,
        letters,
        words,
        mode: ovMode(quality.dom),
        key: "",
        whole: el.hasAttribute("data-ov-whole"),
        stagger: Number(el.dataset.stagger || STAGGER),
      };
    });
    // Touch o livello lite: un layer per PAROLA e niente blur (globals.css, html.film-lite);
    // eco: blocchi interi, niente ombra del testo (html.film-eco). Il livello puo' scendere
    // UNA volta a runtime: si segue con le stesse classi.
    const applyTierClass = () => {
      const cl = document.documentElement.classList;
      cl.toggle("film-lite", !quality.dom.perLetter);
      cl.toggle("film-eco", quality.tier === "eco");
    };
    applyTierClass();
    const unsubTier = quality.subscribe(applyTierClass);

    // Se la pagina si apre gia' scrollata (ricarica a meta'), niente ingresso e niente play automatico.
    const rect0 = track.getBoundingClientRect();
    const startedScrolled = -rect0.top > 2;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    /* ---------------- input del puntatore: si smussa QUI, e solo qui ---------------- */
    const ptr = { x: 0, y: 0, in: 0, sx: 0, sy: 0, sin: 0, tx: 0, ty: 0, seen: false };
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
        ptr.sx = ptr.tx = ptr.x;
        ptr.sy = ptr.ty = ptr.y;
      }
    };
    const onLeave = () => void (ptr.in = 0);
    /* ---------------- geometria dello scroll: misurata UNA volta e su resize, mai per frame ----------------
       (niente getBoundingClientRect / offsetHeight nel ciclo: su telefono, con la barra degli
       indirizzi che cambia altezza, ogni lettura di layout dopo uno scrollTo e' un layout thrash) */
    let trackTop = 0;
    let scrollLen = 1;
    const measure = () => {
      trackTop = track.getBoundingClientRect().top + window.scrollY;
      scrollLen = Math.max(1, track.offsetHeight - window.innerHeight);
      film.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    };
    measure();
    const onResize = () => measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure()) : null;
    ro?.observe(track);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    // lo scroll programmatico deve essere istantaneo: html ha scroll-behavior: smooth, e uno
    // scroll animato verrebbe letto come input dell'utente. Si spegne per la durata del film.
    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    html.classList.add("film-on"); // overscroll-behavior: none (niente pull-to-refresh sopra il play)

    /* ---------------- il play: interrotto da MOVIMENTO dell'utente, mai da un tap ----------------
       Un tap semplice (touch o click: < 10 px, < 300 ms) non ferma niente: su telefono un tocco
       per "vedere se risponde" lasciava il film fermo e sembrava bloccato. Fermano il play:
       touchmove vero, rotellina, tasti, scroll non nostro (scrollbar, gesture), barra. */
    let expectedY = -1;
    // Al (ri)avvio del play l'atteso si azzera: gli eventi scroll sono consegnati all'inizio del
    // fotogramma, PRIMA del rAF, e uno scroll gia' in coda (il fling appena finito, lo
    // scroll-into-view del tasto premuto) confrontato con l'atteso del play precedente
    // fermava "Riprendi" all'istante. Il primo fotogramma di play riparte dalla posizione vera.
    const unPlayer = player.subscribe(() => {
      if (player.playing) expectedY = -1;
    });
    const isControl = (e: Event) => !!(e.target as Element | null)?.closest?.("[data-film-controls]");
    const onWheel = (e: Event) => {
      if (!isControl(e)) player.interrupt("rotellina");
    };
    const touch = { x: 0, y: 0, t: 0, on: false };
    const onTouchStart = (e: TouchEvent) => {
      if (isControl(e) || e.touches.length !== 1) return;
      touch.x = e.touches[0].clientX;
      touch.y = e.touches[0].clientY;
      touch.t = performance.now();
      touch.on = true;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch.on || !e.touches.length) return;
      const dx = e.touches[0].clientX - touch.x;
      const dy = e.touches[0].clientY - touch.y;
      if (dx * dx + dy * dy >= TAP_PX * TAP_PX) {
        touch.on = false;
        player.interrupt("touchmove");
      }
    };
    const onTouchEnd = () => {
      // tap (< 10 px, < 300 ms) o pressione lunga senza movimento: nessun effetto sul play
      touch.on = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (isControl(e)) return;
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"].includes(e.key)) player.interrupt("tasti");
    };
    // Scroll non nostro (scrollbar, gesture del touchpad senza wheel, tasti del browser).
    // ATTENZIONE: su dispositivi veri lo scroll e' composito e `window.scrollY` puo' leggere in
    // ritardo di un fotogramma rispetto al nostro scrollTo: con tolleranza 3 px il play si fermava
    // da solo appena partito. Regole: (1) qualsiasi evento scroll entro 250 ms da un nostro
    // scrollTo e' nostro; (2) oltre, serve una differenza grande (>= 48 px o 3 fotogrammi di
    // corsa) per DUE eventi consecutivi prima di fermare.
    let ourScrollAt = -1;
    let farCount = 0;
    const onScroll = () => {
      if (!player.playing || expectedY < 0) return;
      const now = performance.now();
      if (ourScrollAt >= 0 && now - ourScrollAt < 250) {
        farCount = 0;
        return;
      }
      const tol = Math.max(48, Math.abs(lastStepPx) * 3);
      if (Math.abs(window.scrollY - expectedY) > tol) {
        if (++farCount >= 2) {
          farCount = 0;
          player.interrupt("scroll");
        }
      } else farCount = 0;
    };
    // Trascinare la barra di scorrimento del browser (mousedown fuori dall'area della pagina).
    const onMouseDown = (e: MouseEvent) => {
      if (player.playing && e.clientX >= document.documentElement.clientWidth) player.interrupt("barra di scorrimento");
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    const unErrors = installErrorCapture();

    let raf = 0;
    let last = 0;
    let playT0 = 0;
    let wasPlaying = false;
    let autoStarted = false;
    let pill = false;
    let actShown = 0;
    let pulseKey = "";
    let navOutKey = "";
    let resumeShown: boolean | null = null;
    let resumeLabel = "";
    let fpsEma = 0;
    let measureT0 = -1;
    let allFrames = 0;
    let allSeconds = 0;
    let diagAt = 0;
    let lastStepPx = 0;
    const setScrollP = (s: number) => {
      const y = trackTop + clamp01(s) * scrollLen;
      if (expectedY >= 0) lastStepPx = Math.round(y) - expectedY;
      expectedY = Math.round(y);
      ourScrollAt = performance.now();
      try {
        html.scrollTo({ top: y, behavior: "instant" });
      } catch {
        html.scrollTop = y;
      }
    };

    const loop = (now: number) => {
      const rawDt = last ? (now - last) / 1000 : 1 / 60;
      const dt = Math.min(0.1, rawDt);
      last = now;

      /* --- fps: istantanei (EMA) e media; fra 1 e 4 s di play decidono il livello (una volta, solo in giu') --- */
      if (rawDt > 0 && rawDt < 0.5 && !document.hidden) {
        fpsEma += (1 / rawDt - fpsEma) * Math.min(1, rawDt * 4);
        if (ready.current) {
          allFrames++;
          allSeconds += rawDt;
        }
        if (!quality.settled) {
          if (measureT0 < 0) {
            // parte con il play; se il play non parte (reduced, pagina aperta a meta') 3 s dopo il ready
            if (player.playing || (ready.current && now - readyAt.current > 3000)) measureT0 = now;
          } else if (now - measureT0 >= FPS_WARMUP_MS) {
            diag.frames++;
            diag.seconds += rawDt;
            if (now - measureT0 >= FPS_WARMUP_MS + FPS_WINDOW_MS && diag.seconds > 0.5) quality.adjust(diag.frames / diag.seconds);
          }
        }
      }
      diag.fpsNow = fpsEma;
      diag.fpsAvg = allSeconds > 0 ? allFrames / allSeconds : 0;

      /* --- smussamento dell'input (H(m)): esponenziale con dt, identico a 30 e 120 fps --- */
      const k = 1 - Math.exp(-dt / TAU_SCENE);
      const kt = 1 - Math.exp(-dt / TAU_TORCH);
      const inT = finePointer && !film.reduced ? ptr.in : 0;
      ptr.sin += (inT - ptr.sin) * k;
      ptr.sx += (ptr.x - ptr.sx) * k;
      ptr.sy += (ptr.y - ptr.sy) * k;
      ptr.tx += (ptr.x - ptr.tx) * kt;
      ptr.ty += (ptr.y - ptr.ty) * kt;
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
        const s0 = clamp01((window.scrollY - trackTop) / scrollLen);
        // dp/dscrollP: finche' l'ingresso decade, p sale meno dello scroll (mai sotto 0.55)
        const gain = 1 + entryNow * entryDecaySlope(s0);
        const pNow = clamp01(s0 + entryNow * entryDecay(s0));
        const ease = smoothstep(0, 1, (now - playT0) / PLAY_EASE_MS) * (0.3 + 0.7 * (1 - smoothstep(0.96, 1, pNow)));
        // Tempo REALE per il play: `dt` e' tagliato a 0,1 s per la scena, ma se il telefono
        // disegna a 6-8 fps il film andrebbe al 60-80 % della velocita' (Davide su iPhone:
        // "come in slow"). Il cap a 0,5 s serve solo per il ritorno da una scheda nascosta.
        const playDt = Math.min(0.5, rawDt);
        const dp = (playDt / playSecondsPerUnit(pNow)) * ease;
        film.playT += playDt;
        const s1 = s0 + dp / Math.max(0.5, gain);
        if (s1 >= 1) {
          setScrollP(1);
          player.interrupt("fine corsa");
        } else setScrollP(s1);
      }
      wasPlaying = playing;
      film.playing = playing;
      film.paused = player.paused;

      /* --- p: funzione della posizione di scroll (+ l'ingresso che decade); nessuna lettura di layout --- */
      const scrollP = clamp01((window.scrollY - trackTop) / scrollLen);
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
        const dom = quality.dom;
        const blurOn = !film.reduced && dom.blur;
        const mode = ov.whole ? "whole" : ovMode(dom);
        if (ov.mode !== mode) {
          // il livello e' sceso a runtime: le unita' di prima restano com'erano (opacita' compresa), si ripuliscono
          ov.mode = mode;
          for (const el of [...ov.letters, ...ov.words]) {
            el.style.opacity = "";
            el.style.filter = "";
            el.style.transform = "";
          }
        }
        if (mode === "whole") {
          // il pannello dei dati: entra intero (front-to-back non ha senso su una tabella)
          const blur = blurOn ? (1 - wIn) * BLUR_PX : 0;
          ov.el.style.opacity = wIn.toFixed(3);
          ov.el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
          ov.el.style.transform = `translate3d(0,0,0) scale(${(0.96 + 0.04 * wIn).toFixed(4)})`;
          continue;
        }
        const units = mode === "letter" ? ov.letters : ov.words;
        const n = units.length || 1;
        const stagger = ov.stagger;
        for (let i = 0; i < n; i++) {
          const L = units[i];
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

      /* --- torcia (E2): solo puntatore fine (il cursore e' quello di sistema, Davide: niente anello), mai reduced; DOM fisso, solo transform/opacity --- */
      if (ui.torch) {
        // lime: si spegne dove comanda l'oro (stanza), a meta' nel wormhole (li' la luce e' dei fili:
        // la foschia verde al centro della v2 era questa), del tutto nel wipe
        const a = ptr.sin * 0.9 * limeInFrame(film.sp) * (1 - 0.5 * wormGate(film.sp)) * (1 - smoothstep(0.94, 1, p));
        if (a > 0.005) {
          ui.torch.style.opacity = a.toFixed(3);
          ui.torch.style.transform = `translate3d(${(ptr.tx - 320).toFixed(1)}px,${(ptr.ty - 320).toFixed(1)}px,0)`;
        } else if (ui.torch.style.opacity !== "0") ui.torch.style.opacity = "0";
      }
      /* --- il tasto grande "Riprendi": quando il play e' fermo il film non deve sembrare bloccato --- */
      if (ui.resume) {
        const idle = !player.playing && (player.everPlayed || startedScrolled || film.reduced);
        const want = ready.current && idle && !noAuto && pin === null && p < 0.985 && film.gates[5] < 0.5;
        if (want !== resumeShown) {
          resumeShown = want;
          ui.resume.classList.toggle("is-on", want);
          ui.resume.setAttribute("aria-hidden", want ? "false" : "true");
          ui.resume.tabIndex = want ? 0 : -1;
        }
        const label = player.everPlayed ? "Riprendi" : "Riproduci";
        if (want && label !== resumeLabel) {
          resumeLabel = label;
          const t = ui.resume.querySelector(".film-resume__label");
          if (t) t.textContent = label;
          ui.resume.setAttribute("aria-label", `${label} il film da qui`);
        }
      }

      /* --- diagnostica (?diag=1): testo riscritto 4 volte al secondo --- */
      if (ui.diag && now - diagAt > 250) {
        diagAt = now;
        ui.diag.textContent = diagText({ entry: entryS.current, autoStarted, measuring: measureT0 >= 0 && !quality.settled, expectedY });
      }
      raf = requestAnimationFrame(loop);
    };
    diagTextRef.current = () => diagText({ entry: entryS.current, autoStarted, measuring: measureT0 >= 0 && !quality.settled, expectedY });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousedown", onMouseDown);
      unErrors();
      unPlayer();
      html.style.scrollBehavior = prevBehavior;
      html.classList.remove("film-on");
      html.classList.remove("film-lite");
      unsubTier();
      player.interrupt("smontato");
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
                if (ready.current) return; // un abbassamento di livello rimonta il post: non e' un nuovo avvio
                ready.current = true;
                readyAt.current = performance.now();
                boot.readyMs = readyAt.current - boot.t0;
                boot.set("ready", 1);
              }}
            />
          )}
          {/* Caricamento: barra sottile lime + percentuale mono, in basso al centro; sparisce al primo fotogramma pieno.
              Solo con JS (html.js): senza JS non c'e' nulla da aspettare. */}
          <div className="film-load" aria-live="polite" ref={(el) => void (ui.loader = el)}>
            <span className="film-load__track" aria-hidden="true">
              <span className="film-load__bar" ref={(el) => void (ui.loaderBar = el)} />
            </span>
            <span className="film-load__txt mono" ref={(el) => void (ui.loaderText = el)}>
              caricamento
            </span>
          </div>
          {/* Il tasto grande quando il play e' fermo (tap, touchmove, Pausa): il film non deve sembrare bloccato */}
          <button
            type="button"
            className="film-resume"
            data-film-controls
            data-cursor="link"
            aria-hidden="true"
            tabIndex={-1}
            ref={(el) => void (ui.resume = el)}
            onClick={() => player.play()}
          >
            <Play size={22} strokeWidth={1.8} aria-hidden />
            <span className="film-resume__label">Riprendi</span>
          </button>
          {diagOn && <DiagPanel textRef={diagTextRef} />}

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
            <p className="film-line film-line--wide" aria-label={FILM_S5.replace("\n", " ")}>
              <Letters text={FILM_S5} />
            </p>
          </div>
          <div className="film-ov film-ov--low" data-ov="5">
            <p className="film-line" aria-label={FILM_PHRASE_A}>
              <Letters text={FILM_PHRASE_A} />
            </p>
          </div>
          <div className="film-ov film-ov--low film-ov--name" data-ov="6">
            <p className="film-line film-line--pre" aria-label={`${FILM_S6_PRE} ${SITE_NAME}`}>
              <Letters text={FILM_S6_PRE} />
            </p>
            <p className="film-line film-line--name" aria-hidden="true">
              <Letters text={SITE_NAME} />
            </p>
          </div>
          {/* Atto 6: la camera si ferma sulla schermata finale: un titolo e UN bottone (-> /dettagli). Davide: nient'altro. */}
          <div className="film-ov film-ov--end" data-ov="7" data-ov-whole data-transizione ref={finale} onClickCapture={onVai}>
            <div className="film-varco" aria-hidden="true" />
            {/* il finale (Davide): la Terra in 3D che gira con il nostro logo davanti e il nome, poi la frase e il bottone */}
            <div className="film-emblema">
              <Globo />
              <p className="film-emblema__nome" aria-label={SITE_NAME}>
                <span className="film-emblema__p">PORTFOLIO</span>
                <span className="film-emblema__sub">ALGO MANAGER</span>
              </p>
            </div>
            <div className="film-end">
              <h2 className="film-line film-line--end">{FILM_END}</h2>
              {/* navigazione piena: il film (WebGL, 20-40k perle, bloom) va liberato del tutto prima di /dettagli, su iPhone la somma crashava Safari */}
              <MagneticCta href="/dettagli/" reload className={`${buttonVariants()} film-end__cta`}>
                {FILM_CTA}
              </MagneticCta>
            </div>
          </div>
        </div>
      </div>
      {/* E2 torcia: layer fisso fuori dalla stage (un antenato con transform romperebbe il fixed) */}
      <div className="film-torch" aria-hidden="true" ref={(el) => void (ui.torch = el)} />
    </>
  );
}
