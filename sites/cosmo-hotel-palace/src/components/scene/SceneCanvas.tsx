"use client";

/*
 * SceneCanvas: lo "slot" dove il canvas unico atterra, più il coordinatore che decide
 * QUALE slot lo ha (MOTION 2.2) e il SceneController, cioè il ponte fra React e lo Stage.
 *
 * Questo file sta nel JS INIZIALE: non importa `three` (solo `import type`). Il motore
 * (`@/lib/three/stage`) si scarica con `import()` quando uno slot entra in vista, dopo `load` e
 * l'idle (o al primo gesto), oppure al clic su «Carica la vista 3D».
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type {
  ConfigurazioneSala,
  Hotspot,
  OpzioniConfigurazione,
  Posizione3D,
  Proiezione,
  SceneDef,
  SceneHandle,
  VistaCamera,
} from "@/content/types";
import { announce } from "@/lib/a11y";
import { DURATION, clamp01, easeIn, getPrefersReducedMotion } from "@/lib/motion";
import { rilevaWebGL, richiedeCaricoManuale } from "@/lib/three/support";
import type { MotivoNoWebGL } from "@/lib/three/support";
import type { Stage } from "@/lib/three/stage";

/* ───────────────────────── SceneController ───────────────────────── */

/**
 * poster       il 3D non c'è (non ancora in vista, o lo slot ha ceduto il canvas a un altro)
 * caricamento  slot scelto: si scarica il motore o si costruisce la scena
 * pronta       il canvas è vivo (il poster sfuma)
 * manuale      risparmio dati: serve il clic su «Carica la vista 3D»
 * fallback     niente 3D su questo dispositivo/visita (vedi `motivo`)
 */
export type StatoScena = "poster" | "caricamento" | "pronta" | "manuale" | "fallback";
export type MotivoFallback = MotivoNoWebGL | "lento" | "contesto-perso" | "errore";
export type Argomento = "stato" | "luce" | "hotspot" | "vista";

export type Dimensioni = { larghezza: number; altezza: number };

/**
 * Stato "desiderato" di una scena: luce, progresso, vista, hotspot aperto. Esiste prima della
 * scena 3D e sopravvive ai suoi smontaggi: quando lo Stage costruisce la scena, il controller
 * le riapplica tutto (stessi numeri, stesso fotogramma: MOTION 2.1).
 */
export class SceneController {
  readonly def: SceneDef;
  luce = 0;
  progresso = 0;
  vistaRichiesta: VistaCamera | null = null;
  stato: StatoScena = "poster";
  motivo: MotivoFallback | null = null;
  hotspotAperto: string | null = null;
  /** true dopo che l'utente (o un hotspot) ha mosso la camera: serve a «Ripristina vista». */
  vistaModificata = false;
  dimensioni: Dimensioni = { larghezza: 0, altezza: 0 };
  /**
   * Ultima configurazione chiesta alla scena della sala congressi (modulo 10), oppure null.
   * Come luce e progresso, esiste prima della scena e le viene riapplicata alla costruzione.
   */
  configurazione: ConfigurazioneSala | null = null;
  private opzioniConfigurazione: OpzioniConfigurazione | undefined;
  /** La scena viva, oppure null. Solo lo Stage la scrive. */
  handle: SceneHandle | null = null;
  /** Sveglia il loop a richiesta dello Stage. Solo lo Stage la scrive. */
  svegliaStage: (() => void) | null = null;

  private ascolti: Record<Argomento, Set<() => void>> = {
    stato: new Set(),
    luce: new Set(),
    hotspot: new Set(),
    vista: new Set(),
  };
  private frame = new Set<() => void>();
  private rafLuce = 0;

  constructor(def: SceneDef) {
    this.def = def;
  }

  /* ---- sottoscrizioni (per useSyncExternalStore e per il livello hotspot) ---- */

  subscribe(arg: Argomento, fn: () => void): () => void {
    this.ascolti[arg].add(fn);
    return () => this.ascolti[arg].delete(fn);
  }

  private notifica(arg: Argomento): void {
    for (const fn of this.ascolti[arg]) fn();
  }

  /** Chiamata dallo Stage dopo ogni fotogramma disegnato: gli hotspot si riposizionano qui. */
  onFrame(fn: () => void): () => void {
    this.frame.add(fn);
    return () => this.frame.delete(fn);
  }

  emettiFrame(): void {
    for (const fn of this.frame) fn();
  }

  /* ---- stato (lo scrivono Stage e coordinatore) ---- */

  impostaStato(stato: StatoScena, motivo: MotivoFallback | null = null): void {
    if (this.stato === stato && this.motivo === motivo) return;
    this.stato = stato;
    this.motivo = motivo;
    this.notifica("stato");
  }

  /** Lo Stage ha costruito (o distrutto) la scena: si riapplica tutto lo stato desiderato. */
  collega(handle: SceneHandle | null): void {
    this.handle = handle;
    if (!handle) return;
    // la configurazione va prima di tutto il resto, senza tween: la scena nasce già nello stato giusto
    if (this.configurazione) {
      handle.configura?.(this.configurazione, { ...this.opzioniConfigurazione, istantaneo: true });
    }
    handle.setLuce(this.luce);
    handle.setProgresso(this.progresso);
    handle.vaiA(this.vistaRichiesta, true);
  }

  private sveglia(): void {
    this.svegliaStage?.();
  }

  /* ---- comandi (pagine, pulsanti, hotspot) ---- */

  /** Luce 0..1 (vedi `SceneHandle.setLuce`). Si può chiamare prima che la scena esista. */
  setLuce(t: number): void {
    const v = clamp01(t);
    const eraSera = this.sera;
    this.luce = v;
    this.handle?.setLuce(v);
    this.sveglia();
    if (eraSera !== this.sera) this.notifica("luce");
  }

  /** Porta la luce a `a` con la curva di ingresso: 600 ms (200 ms con movimento ridotto). */
  animaLuce(a: number, durataMs: number = DURATION.scene): void {
    cancelAnimationFrame(this.rafLuce);
    const da = this.luce;
    const durata = getPrefersReducedMotion() ? DURATION.reduced : durataMs;
    if (durata <= 0 || Math.abs(a - da) < 1e-4) return void this.setLuce(a);
    const t0 = performance.now();
    const passo = (ora: number) => {
      const k = clamp01((ora - t0) / durata);
      this.setLuce(da + (a - da) * easeIn(k));
      if (k < 1) this.rafLuce = requestAnimationFrame(passo);
    };
    this.rafLuce = requestAnimationFrame(passo);
  }

  /** true se la luce è nella metà "sera" (>= 0,5). Decide quali hotspot `visibileIn` si vedono. */
  get sera(): boolean {
    return this.luce >= 0.5;
  }

  /**
   * Scena della sala congressi (modulo 10): sala, disposizione, partecipanti, pareti. Si può chiamare
   * prima che la scena esista. Senza `opzioni.k` la scena anima da sola (720 ms); con `k` la guida
   * `setProgresso(k)`. Le altre scene non hanno `configura` e la ignorano.
   */
  configura(config: ConfigurazioneSala, opzioni?: OpzioniConfigurazione): void {
    this.configurazione = config;
    this.opzioniConfigurazione = opzioni;
    this.handle?.configura?.(config, opzioni);
    this.sveglia();
  }

  /** Avanzamento 0..1 (scroll della scena fissata, tappa, tween). */
  setProgresso(p: number): void {
    this.progresso = clamp01(p);
    this.handle?.setProgresso(this.progresso);
    this.sveglia();
  }

  /** Porta la camera su una posa. `null` = vista di partenza. */
  vaiA(vista: VistaCamera | null, istantaneo = false): void {
    this.vistaRichiesta = vista;
    this.handle?.vaiA(vista, istantaneo);
    this.segnaVistaModificata(vista !== null);
    this.sveglia();
  }

  /** Pulsanti ◀ ▶ (15 gradi), frecce (10), trascinamento. Positivo = verso destra. */
  ruota(gradi: number): void {
    this.handle?.ruota(gradi);
    this.segnaVistaModificata(true);
    this.sveglia();
  }

  /** «Ripristina vista». */
  ripristinaVista(): void {
    this.vaiA(null);
    this.apriHotspot(null);
  }

  segnaVistaModificata(v: boolean): void {
    if (this.vistaModificata === v) return;
    this.vistaModificata = v;
    this.notifica("vista");
  }

  /**
   * Apre (o chiude, con `null`) la pillola di un hotspot. Con `muovi` la camera va sulla sua
   * vista. Un solo hotspot aperto alla volta. Annuncia titolo e dato ai lettori di schermo.
   */
  apriHotspot(id: string | null, { muovi = false }: { muovi?: boolean } = {}): void {
    if (id !== this.hotspotAperto) {
      this.hotspotAperto = id;
      this.notifica("hotspot");
      const h = id ? this.def.hotspots.find((x) => x.id === id) : undefined;
      if (h) announce(`${h.titolo}. ${h.dato}`);
    }
    if (id && muovi) {
      const h = this.def.hotspots.find((x) => x.id === id);
      if (h) this.vaiA(h.vista);
    }
  }

  /** Proietta un punto 3D sul riquadro. Senza scena viva: `visibile = false`. */
  proietta(pos: Posizione3D, out: Proiezione): void {
    if (this.handle) this.handle.proietta(pos, out);
    else out.visibile = false;
  }

  /** «Carica la vista 3D»: dà il consenso e fa ripartire il coordinatore. */
  richiedi3D(): void {
    consentiCaricoManuale();
  }

  hotspotVisibili(): readonly Hotspot[] {
    return this.def.hotspots.filter(
      (h) => !h.visibileIn || h.visibileIn === "sempre" || (h.visibileIn === "sera") === this.sera,
    );
  }
}

/**
 * Crea il controller una volta sola per il componente (per le pagine che pilotano la scena da fuori:
 * `c.setLuce(t)`, `c.setProgresso(p)`, `c.vaiA(...)`). `def` deve essere stabile (costante di modulo).
 */
export function useSceneController(def: SceneDef): SceneController {
  const [c] = useState(() => new SceneController(def));
  return c;
}

/** Legge un valore dal controller e si aggiorna solo quando cambia quell'argomento. */
export function useControllerValue<T extends string | number | boolean | null>(
  c: SceneController,
  arg: Argomento,
  leggi: (c: SceneController) => T,
): T {
  const sub = useCallback((fn: () => void) => c.subscribe(arg, fn), [c, arg]);
  return useSyncExternalStore(
    sub,
    () => leggi(c),
    () => leggi(c),
  );
}

export const useStatoScena = (c: SceneController): StatoScena =>
  useControllerValue(c, "stato", (x) => x.stato);

/* ───────────────────────── Coordinatore (modulo, senza three) ───────────────────────── */

/** Cosa lo Stage deve sapere di uno slot. */
export type SlotHost = {
  readonly controller: SceneController;
  readonly def: SceneDef;
  /** Dove si appende il canvas. */
  readonly slot: HTMLElement;
  /** Trascinamento e tastiera attivi (false per la hero guidata dallo scroll). */
  readonly interattiva: boolean;
};

type Reg = { host: SlotHost; vicino: boolean };

const regs = new Map<Element, Reg>();
let io: IntersectionObserver | null = null;
let stageP: Promise<Stage> | null = null;
let stage: Stage | null = null;
let corrente: Reg | null = null;
let consenso = false;
let timerRilascio: ReturnType<typeof setTimeout> | 0 = 0;
let avvio: Promise<void> | null = null;

/** Dopo `load` + idle (max 1,5 s), o subito al primo gesto: mai nel percorso critico (MOTION 2.2). */
function avvioPermesso(): Promise<void> {
  avvio ??= new Promise<void>((risolvi) => {
    let fatto = false;
    const eventi = ["pointerdown", "scroll", "keydown", "touchstart"] as const;
    const via = () => {
      if (fatto) return;
      fatto = true;
      for (const e of eventi) window.removeEventListener(e, via);
      risolvi();
    };
    const dopoLoad = () => {
      if (typeof requestIdleCallback === "function") requestIdleCallback(via, { timeout: 1500 });
      else setTimeout(via, 200);
    };
    for (const e of eventi) window.addEventListener(e, via, { passive: true });
    if (document.readyState === "complete") dopoLoad();
    else window.addEventListener("load", dopoLoad, { once: true });
  });
  return avvio;
}

function caricaStage(): Promise<Stage> {
  stageP ??= import("@/lib/three/stage")
    .then((m) => {
      const s = m.ottieniStage();
      s.suBloccoGlobale = (motivo) => {
        for (const r of regs.values()) r.host.controller.impostaStato("fallback", motivo);
      };
      stage = s;
      return s;
    })
    .catch((e) => {
      stageP = null;
      throw e;
    });
  return stageP;
}

function areaVisibile(el: Element): number {
  const r = el.getBoundingClientRect();
  const w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
  const h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Controllo sincrono (l'IntersectionObserver può essere in ritardo di un frame): slot a meno del 30% di schermo. */
function èVicino(el: Element): boolean {
  const r = el.getBoundingClientRect();
  const m = window.innerHeight * 0.3;
  return r.bottom > -m && r.top < window.innerHeight + m;
}

function scegli(vicini: Reg[]): Reg {
  let migliore = vicini[0];
  let punteggio = -1;
  for (const r of vicini) {
    // chi ha già il canvas parte avvantaggiato: niente andirivieni alla giunzione fra due scene
    const p = areaVisibile(r.host.slot) * (r === corrente ? 1.25 : 1);
    if (p > punteggio) {
      punteggio = p;
      migliore = r;
    }
  }
  return migliore;
}

function annullaRilascio(): void {
  if (timerRilascio) clearTimeout(timerRilascio);
  timerRilascio = 0;
}

/** Lo slot è uscito dalla vista: dopo 1,5 s il canvas si stacca e la scena si libera (MOTION 2.2). */
function programmaRilascio(): void {
  if (!corrente || timerRilascio) return;
  timerRilascio = setTimeout(() => {
    timerRilascio = 0;
    const r = corrente;
    if (!r) return;
    corrente = null;
    if (stage) stage.rilascia(r.host);
    else r.host.controller.impostaStato("poster");
  }, 1500);
}

function applicaFallback(vicini: Reg[], motivo: MotivoNoWebGL): void {
  for (const r of vicini) r.host.controller.impostaStato("fallback", motivo);
}

async function valuta(): Promise<void> {
  const vicini = [...regs.values()].filter((r) => r.vicino);
  if (!vicini.length) return programmaRilascio();
  annullaRilascio();

  const sup = rilevaWebGL();
  if (!sup.ok) return applicaFallback(vicini, sup.motivo);
  if (stage?.bloccato) return applicaFallback(vicini, "assente");

  const vincitore = scegli(vicini);
  if (corrente === vincitore) return;

  // gli altri vicini restano sul poster (identico: la giunzione non si vede)
  for (const r of vicini) {
    if (r !== vincitore && r.host.controller.stato === "manuale") r.host.controller.impostaStato("poster");
  }

  if (richiedeCaricoManuale() && !consenso) {
    vincitore.host.controller.impostaStato("manuale");
    return;
  }

  corrente = vincitore;
  const ctrl = vincitore.host.controller;
  if (ctrl.stato !== "pronta") ctrl.impostaStato("caricamento");
  try {
    await avvioPermesso();
    // nell'attesa lo slot può essere uscito dalla vista: allora il motore non si scarica
    if (corrente !== vincitore || !èVicino(vincitore.host.slot)) {
      if (corrente === vincitore) corrente = null;
      if (ctrl.stato === "caricamento") ctrl.impostaStato("poster");
      return;
    }
    const s = await caricaStage();
    if (corrente !== vincitore) return;
    await s.mostra(vincitore.host);
  } catch (e) {
    console.error("[3D] avvio non riuscito", e);
    if (corrente === vincitore) corrente = null;
    ctrl.impostaStato("fallback", "errore");
  }
}

function consentiCaricoManuale(): void {
  consenso = true;
  void valuta();
}

function osservatore(): IntersectionObserver | null {
  if (io || typeof IntersectionObserver === "undefined") return io;
  io = new IntersectionObserver(
    (voci) => {
      for (const v of voci) {
        const r = regs.get(v.target);
        if (r) r.vicino = v.isIntersecting;
      }
      void valuta();
    },
    // il motore si prepara quando lo slot è a ~30% di schermo (MOTION 2.2)
    { rootMargin: "30% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  return io;
}

function registra(host: SlotHost): () => void {
  const reg: Reg = { host, vicino: false };
  regs.set(host.slot, reg);
  const o = osservatore();
  if (o) o.observe(host.slot);
  else {
    // senza IntersectionObserver: meglio mostrare che nascondere (come useInView)
    reg.vicino = true;
    void valuta();
  }
  return () => {
    o?.unobserve(host.slot);
    regs.delete(host.slot);
    if (corrente === reg) {
      corrente = null;
      if (stage) stage.rilascia(host);
    }
    host.controller.impostaStato("poster");
    void valuta();
  };
}

/* ───────────────────────── Componente ───────────────────────── */

type Props = {
  controller: SceneController;
  def: SceneDef;
  interattiva?: boolean;
  className?: string;
};

/**
 * Lo slot: un `div` vuoto che riempie il riquadro. Quando il coordinatore lo sceglie, lo Stage
 * vi appende il canvas unico. Non ha figli React: nessun rischio che React tocchi il canvas.
 */
export function SceneCanvas({ controller, def, interattiva = true, className }: Props) {
  const rif = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const slot = rif.current;
    if (!slot) return;
    return registra({ controller, def, slot, interattiva });
  }, [controller, def, interattiva]);
  return <div ref={rif} className={className} data-stage-slot={def.id} />;
}
