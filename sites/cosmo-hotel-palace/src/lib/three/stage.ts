/*
 * Lo Stage: UN renderer WebGL, UN canvas, per tutta la visita (DECISIONI 1, MOTION 2.2).
 *
 * Il canvas passa da uno slot (`SceneFrame`) all'altro con `append`; la scena dello slot che lo
 * lascia viene liberata per intero; quella del nuovo slot si costruisce con `def.costruisci(ctx)`
 * mentre il poster è ancora visibile. Il loop è A RICHIESTA: si disegna solo se qualcosa si muove,
 * se l'utente agisce o se cambia la luce. A riposo: 0 frame, 0 GPU.
 *
 * Questo file importa `three` ed è caricato SOLO con `import()` dal coordinatore (SceneCanvas).
 */

import { WebGLRenderer } from "three";
import type { Qualita, SceneContext, SceneHandle } from "../../content/types";
import type {
  MotivoFallback,
  SlotHost,
} from "../../components/scene/SceneCanvas";
import { liberaCondivise, disposeAlbero } from "./materials";
import {
  DURATA_LENTO_LITE2_MS,
  DURATA_LENTO_MS,
  FrameMeter,
  MAX_DISCESE,
  SPEC,
  dprEffettivo,
  limiteLentoMs,
  limitePosterMs,
  livelloIniziale,
  misuraVsync,
  ricordaLivello,
  scendi,
  usaAntialias,
} from "./quality";
import { liberaOmbre } from "./shadows";
import { getPrefersReducedMotion, isTouch, parametroQA, risparmioDati } from "./support";

/** Gradi per ◀ ▶ da tastiera con il focus sul canvas (UX 5.2: 10). */
const PASSO_FRECCE = 10;
/** Dopo quanto una pagina nascosta smonta la scena e porta il canvas a 1x1 (MOTION 2.2). */
const NASCOSTA_MS = 20_000;
/** Tempo massimo di attesa della compilazione degli shader prima del primo frame. */
const COMPILA_MAX_MS = 3000;

export type Diagnostica = {
  livello: Qualita;
  dpr: number;
  larghezza: number;
  altezza: number;
  chiamate: number;
  triangoli: number;
  geometrie: number;
  texture: number;
  mediaMs: number;
  vsyncMs: number;
  discese: number;
  contesti: number;
  slot: string | null;
};

export class Stage {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: WebGLRenderer;
  /** true = niente più 3D in questa visita (lentezza, contesto perso due volte, errore grave). */
  bloccato = false;
  /** Il coordinatore ci si registra: avvisa tutti gli slot quando si resta sul poster. */
  suBloccoGlobale: ((motivo: MotivoFallback) => void) | null = null;

  private host: SlotHost | null = null;
  private handle: SceneHandle | null = null;
  private livello: Qualita;
  private readonly touch = isTouch();
  private reduced = getPrefersReducedMotion();
  private vsync = 16.67;
  private discese = 0;
  private readonly meter: FrameMeter;
  private raf = 0;
  private continuo = false;
  private ultimoTs = 0;
  private ultimoRender = 0;
  private w = 1;
  private h = 1;
  private dpr = 1;
  private ro: ResizeObserver | null = null;
  private epoca = 0;
  private contestiPersi = 0;
  private perso = false;
  private sospeso: SlotHost | null = null;
  private timerNascosta: ReturnType<typeof setTimeout> | 0 = 0;
  private riquadro: HTMLElement | null = null;
  private mqRidotto: MediaQueryList | null = null;
  private readonly ascoltatori: Array<() => void> = [];

  constructor() {
    this.livello = livelloIniziale(this.touch, risparmioDati());

    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;outline-offset:-4px";
    this.canvas = canvas;

    const dprStima = Math.min(window.devicePixelRatio || 1, SPEC[this.livello].dprMax);
    this.renderer = new WebGLRenderer({
      canvas,
      // MSAA solo se il DPR è sotto 1,5 (DESIGN 5.5): si decide una volta, alla creazione
      antialias: usaAntialias(dprStima),
      alpha: false,
      stencil: false,
      powerPreference: "default",
      failIfMajorPerformanceCaveat: parametroQA() !== "forza",
    });

    this.meter = new FrameMeter({
      limiteMs: () => (this.livello === "lite2" ? limitePosterMs(this.vsync) : limiteLentoMs(this.vsync)),
      durataMs: () => (this.livello === "lite2" ? DURATA_LENTO_LITE2_MS : DURATA_LENTO_MS),
      alLento: () => this.scendiDiLivello(),
    });

    void misuraVsync().then((ms) => {
      this.vsync = ms;
    });

    this.collegaEventi();
    this.collegaInput();
    if (new URLSearchParams(location.search).get("perf") === "1") this.avviaRiquadro();
  }

  /* ───────────────────────── Slot ───────────────────────── */

  /**
   * Il canvas va in questo slot: la scena precedente (se c'è) si libera, la nuova si costruisce,
   * si compila, si disegna il primo frame e il poster sfuma. Idempotente per lo stesso slot.
   */
  async mostra(host: SlotHost): Promise<void> {
    if (this.bloccato) {
      host.controller.impostaStato("fallback", "lento");
      return;
    }
    if (this.host === host && this.handle) {
      if (this.canvas.parentElement !== host.slot) host.slot.append(this.canvas);
      this.wake();
      return;
    }
    const mio = ++this.epoca;
    this.liberaScena();
    this.host = host;
    this.sospeso = null;
    this.configuraCanvas(host);
    host.slot.append(this.canvas);
    this.osserva(host.slot);
    this.misura();

    const ctx: SceneContext = {
      renderer: this.renderer,
      canvas: this.canvas,
      larghezza: this.w,
      altezza: this.h,
      dpr: this.dpr,
      qualita: this.livello,
      touch: this.touch,
      reducedMotion: this.reduced,
      richiediFrame: () => this.wake(),
    };

    let handle: SceneHandle;
    try {
      handle = await host.def.costruisci(ctx);
    } catch (e) {
      console.error(`[3D] costruisci("${host.def.id}") non riuscita`, e);
      if (mio === this.epoca) {
        this.liberaScena();
        host.controller.impostaStato("fallback", "errore");
      }
      return;
    }
    if (mio !== this.epoca) {
      // nel frattempo lo slot ha ceduto il canvas: la scena nata tardi si libera subito
      this.distruggi(handle);
      return;
    }

    this.handle = handle;
    host.controller.svegliaStage = () => this.wake();
    host.controller.collega(handle);
    handle.resize(this.w, this.h, this.dpr);

    // shader compilati mentre il poster è ancora visibile (niente scatto al primo frame)
    try {
      await Promise.race([
        this.renderer.compileAsync(handle.scena, handle.camera),
        new Promise<void>((r) => setTimeout(r, COMPILA_MAX_MS)),
      ]);
    } catch {
      /* si compila al primo render */
    }
    if (mio !== this.epoca || this.perso) return;

    this.ultimoTs = performance.now();
    this.disegna();
    host.controller.impostaStato("pronta");
    this.meter.azzera();
    this.wake();
  }

  /** Lo slot esce dalla vista (o si smonta): scena liberata, canvas staccato, poster di nuovo vivo. */
  rilascia(host: SlotHost): void {
    if (this.host !== host && this.sospeso !== host) return;
    this.epoca++;
    this.sospeso = null;
    this.liberaScena();
  }

  /* ───────────────────────── Loop a richiesta ───────────────────────── */

  /** Sveglia il loop. Si chiama dopo ogni cambio di stato (luce, p, vista, input, resize). */
  wake(): void {
    if (this.raf || !this.handle || this.perso || document.hidden) return;
    this.raf = requestAnimationFrame(this.frame);
  }

  private readonly frame = (ora: number): void => {
    this.raf = 0;
    const handle = this.handle;
    if (!handle || this.perso || document.hidden) {
      this.continuo = false;
      return;
    }
    const consecutivo = this.continuo;
    this.continuo = false;

    // lite 2: tetto a 30 fps durante i movimenti (un frame sì e uno no)
    const tetto = SPEC[this.livello].fpsMax;
    if (tetto && consecutivo && ora - this.ultimoRender < (1000 / tetto) * 0.8) {
      this.continuo = true;
      this.raf = requestAnimationFrame(this.frame);
      return;
    }

    const dtMs = consecutivo ? ora - this.ultimoTs : 1000 / 60;
    this.ultimoTs = ora;
    const dt = Math.min(Math.max(dtMs / 1000, 0.001), 0.05);

    let inMovimento = false;
    try {
      inMovimento = handle.update(dt);
      this.disegna();
    } catch (e) {
      console.error("[3D] errore nel frame", e);
      this.bloccaPoster("errore");
      return;
    }
    this.ultimoRender = ora;
    // si misura solo se animava e se il frame precedente era consecutivo (altrimenti dt è un'attesa)
    this.meter.tick(dtMs, ora, inMovimento && consecutivo);

    if (inMovimento) {
      this.continuo = true;
      if (!this.raf) this.raf = requestAnimationFrame(this.frame);
    }
  };

  private disegna(): void {
    const handle = this.handle;
    if (!handle) return;
    this.renderer.render(handle.scena, handle.camera);
    this.host?.controller.emettiFrame();
  }

  /* ───────────────────────── Dimensioni e qualità ───────────────────────── */

  private osserva(el: HTMLElement): void {
    this.ro?.disconnect();
    this.ro = new ResizeObserver(() => {
      if (this.misura()) {
        this.handle?.resize(this.w, this.h, this.dpr);
        this.wake();
      }
    });
    this.ro.observe(el);
  }

  /** Legge la dimensione dello slot e imposta pixel ratio e buffer. `true` se è cambiato qualcosa. */
  private misura(): boolean {
    const slot = this.host?.slot;
    if (!slot) return false;
    const w = Math.max(1, Math.round(slot.clientWidth));
    const h = Math.max(1, Math.round(slot.clientHeight));
    const dpr = dprEffettivo(this.livello, w, h, window.devicePixelRatio || 1, this.touch);
    if (w === this.w && h === this.h && dpr === this.dpr && this.canvas.width > 1) return false;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    if (this.host) this.host.controller.dimensioni = { larghezza: w, altezza: h };
    return true;
  }

  private impostaLivello(q: Qualita): void {
    this.livello = q;
    ricordaLivello(q);
    this.misura();
    this.handle?.setQualita(q);
    this.handle?.resize(this.w, this.h, this.dpr);
    this.meter.azzera();
    this.wake();
  }

  /** La media dei frame è rimasta sopra soglia per il tempo dovuto (quality.ts). */
  private scendiDiLivello(): void {
    if (this.livello === "lite2") return this.bloccaPoster("lento");
    const prossimo = scendi(this.livello);
    if (!prossimo || this.discese >= MAX_DISCESE) {
      this.meter.riposa(performance.now());
      return;
    }
    this.discese++;
    this.impostaLivello(prossimo);
    this.meter.riposa(performance.now());
  }

  /* ───────────────────────── Liberazione ───────────────────────── */

  private distruggi(handle: SceneHandle): void {
    try {
      handle.dispose();
    } catch (e) {
      console.error("[3D] dispose della scena", e);
    }
    // rete di sicurezza: libera ciò che la scena avesse dimenticato (le texture condivise restano)
    disposeAlbero(handle.scena);
  }

  /** Scena giù, canvas staccato, poster di nuovo visibile. Il renderer resta. */
  private liberaScena(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.continuo = false;
    this.ro?.disconnect();
    this.ro = null;
    const handle = this.handle;
    const host = this.host;
    this.handle = null;
    this.host = null;
    if (handle) this.distruggi(handle);
    if (host) {
      host.controller.collega(null);
      host.controller.svegliaStage = null;
      if (host.controller.stato !== "fallback") host.controller.impostaStato("poster");
    }
    this.canvas.remove();
    this.renderer.renderLists.dispose();
  }

  /** Ultimo ripiego: niente più 3D in questa visita, tutti gli slot restano sul poster. */
  private bloccaPoster(motivo: MotivoFallback): void {
    if (this.bloccato) return;
    this.bloccato = true;
    this.epoca++;
    this.liberaScena();
    this.suBloccoGlobale?.(motivo);
    this.scollega();
    try {
      this.renderer.dispose();
      if (!this.perso) this.renderer.forceContextLoss();
    } catch {
      /* già perso */
    }
  }

  /** Smontaggio totale (non serve nella visita normale: il layout resta montato). */
  dispose(): void {
    this.epoca++;
    this.liberaScena();
    this.scollega();
    this.riquadro?.remove();
    liberaCondivise();
    liberaOmbre();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  /* ───────────────────────── Eventi di pagina e del contesto ───────────────────────── */

  private ascolta<K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    tipo: K,
    fn: (e: HTMLElementEventMap[K]) => void,
    opz?: AddEventListenerOptions,
  ): void {
    el.addEventListener(tipo, fn, opz);
    this.ascoltatori.push(() => el.removeEventListener(tipo, fn));
  }

  private scollega(): void {
    for (const off of this.ascoltatori.splice(0)) off();
    document.removeEventListener("visibilitychange", this.altaVisibilita);
    this.mqRidotto?.removeEventListener("change", this.altaRiduzione);
    this.ro?.disconnect();
  }

  private collegaEventi(): void {
    const c = this.canvas;
    c.addEventListener("webglcontextlost", (e) => {
      // senza preventDefault il browser non tenta il ripristino
      e.preventDefault();
      this.perso = true;
      this.contestiPersi++;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      const ctrl = this.host?.controller;
      if (this.contestiPersi >= 2) {
        this.bloccaPoster("contesto-perso");
      } else {
        // poster subito visibile; il ripristino riporta il canvas
        ctrl?.impostaStato("poster");
      }
    });
    c.addEventListener("webglcontextrestored", () => {
      // three ha già reinizializzato lo stato GL; geometrie e texture si ricaricano da sole al render
      this.perso = false;
      if (this.handle && this.host) {
        this.handle.resize(this.w, this.h, this.dpr);
        this.disegna();
        this.host.controller.impostaStato("pronta");
        this.meter.azzera();
        this.wake();
      }
    });
    document.addEventListener("visibilitychange", this.altaVisibilita);

    if (typeof window.matchMedia === "function") {
      this.mqRidotto = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.mqRidotto.addEventListener("change", this.altaRiduzione);
    }
  }

  private readonly altaVisibilita = (): void => {
    if (document.hidden) {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.continuo = false;
      if (this.timerNascosta) clearTimeout(this.timerNascosta);
      // nascosta a lungo (es. si apre il motore di prenotazione in un'altra scheda): memoria libera
      this.timerNascosta = setTimeout(() => {
        this.timerNascosta = 0;
        const host = this.host;
        if (!host) return;
        this.epoca++;
        this.liberaScena();
        this.sospeso = host;
        host.controller.impostaStato("poster");
        this.renderer.setSize(1, 1, false);
        this.w = this.h = 1;
        this.canvas.width = 1;
        this.canvas.height = 1;
      }, NASCOSTA_MS);
    } else {
      if (this.timerNascosta) clearTimeout(this.timerNascosta);
      this.timerNascosta = 0;
      const host = this.sospeso;
      if (host && !this.bloccato) {
        this.sospeso = null;
        void this.mostra(host);
      } else {
        this.wake();
      }
    }
  };

  /** Il visitatore cambia "riduci movimento" a pagina aperta: la scena si ricostruisce con il nuovo valore. */
  private readonly altaRiduzione = (e: MediaQueryListEvent): void => {
    this.reduced = e.matches;
    const host = this.host;
    if (!host || this.bloccato) return;
    this.epoca++;
    this.liberaScena();
    void this.mostra(host);
  };

  /* ───────────────────────── Canvas: ruolo, tastiera, trascinamento ───────────────────────── */

  private configuraCanvas(host: SlotHost): void {
    const c = this.canvas;
    c.setAttribute("role", "img");
    c.setAttribute("aria-label", host.def.aria);
    const istr = document.getElementById(`${host.def.id}-istruzioni`);
    if (istr) c.setAttribute("aria-describedby", istr.id);
    else c.removeAttribute("aria-describedby");
    if (host.interattiva) {
      c.tabIndex = 0;
      // lo scroll verticale resta della pagina; il trascinamento orizzontale è nostro
      c.style.touchAction = "pan-y";
      c.style.cursor = "grab";
    } else {
      c.removeAttribute("tabindex");
      c.style.touchAction = "auto";
      c.style.cursor = "";
    }
  }

  /** Gradi di azimut per pixel: trascinare l'80% della larghezza percorre tutto l'arco concesso. */
  private gradiPerPixel(): number {
    const az = this.host?.def.limiti.az;
    if (!az) return 0;
    return (az[1] - az[0]) / Math.max(1, this.w * 0.8);
  }

  private collegaInput(): void {
    const c = this.canvas;
    let id = -1;
    let x0 = 0;
    let xUltimo = 0;
    let tUltimo = 0;
    let v = 0; // gradi al secondo
    let trascina = false;

    this.ascolta(c, "pointerdown", (e) => {
      if (!this.host?.interattiva || !this.handle) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      id = e.pointerId;
      x0 = xUltimo = e.clientX;
      tUltimo = e.timeStamp;
      v = 0;
      trascina = false;
      try {
        c.setPointerCapture(id);
      } catch {
        /* il puntatore è già finito */
      }
    });

    this.ascolta(c, "pointermove", (e) => {
      if (e.pointerId !== id || !this.host) return;
      if (!trascina) {
        if (Math.abs(e.clientX - x0) < 4) return; // sotto soglia è un tocco, non un trascinamento
        trascina = true;
        c.style.cursor = "grabbing";
        xUltimo = e.clientX;
        tUltimo = e.timeStamp;
        return;
      }
      const gradi = -(e.clientX - xUltimo) * this.gradiPerPixel();
      const dt = (e.timeStamp - tUltimo) / 1000;
      xUltimo = e.clientX;
      tUltimo = e.timeStamp;
      if (dt > 0) v = v * 0.6 + (gradi / dt) * 0.4;
      this.host.controller.ruota(gradi);
    });

    const fine = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      c.style.cursor = this.host?.interattiva ? "grab" : "";
      // inerzia: un ultimo tratto proporzionale alla velocità, che la camera percorre smorzata
      if (trascina && !this.reduced && this.host && e.timeStamp - tUltimo < 80) {
        this.host.controller.ruota(Math.max(-40, Math.min(40, v * 0.15)));
      }
      trascina = false;
    };
    this.ascolta(c, "pointerup", fine);
    this.ascolta(c, "pointercancel", fine);

    // tastiera: ◀ ▶ ruotano di 10 gradi, Esc chiude la pillola aperta (UX 5.2, 12)
    this.ascolta(c, "keydown", (e) => {
      const host = this.host;
      if (!host?.interattiva || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft") host.controller.ruota(-PASSO_FRECCE);
      else if (e.key === "ArrowRight") host.controller.ruota(PASSO_FRECCE);
      else if (e.key === "Escape" && host.controller.hotspotAperto) host.controller.apriHotspot(null);
      else return;
      e.preventDefault();
    });
    // la rotellina NON zooma e non viene intercettata: scorre la pagina (DECISIONI 2)
  }

  /* ───────────────────────── Diagnostica (?perf=1) ───────────────────────── */

  diagnostica(): Diagnostica {
    const i = this.renderer.info;
    return {
      livello: this.livello,
      dpr: this.dpr,
      larghezza: this.w,
      altezza: this.h,
      chiamate: i.render.calls,
      triangoli: i.render.triangles,
      geometrie: i.memory.geometries,
      texture: i.memory.textures,
      mediaMs: Math.round(this.meter.media * 10) / 10,
      vsyncMs: Math.round(this.vsync * 10) / 10,
      discese: this.discese,
      contesti: this.contestiPersi,
      slot: this.host?.def.id ?? null,
    };
  }

  private avviaRiquadro(): void {
    (window as unknown as { __cosmo3d?: Stage }).__cosmo3d = this;
    const el = document.createElement("pre");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText =
      "position:fixed;left:8px;bottom:8px;z-index:9999;margin:0;padding:6px 8px;font:11px/1.3 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.72);pointer-events:none;border-radius:4px";
    document.body.append(el);
    this.riquadro = el;
    const id = setInterval(() => {
      if (!el.isConnected) return clearInterval(id);
      const d = this.diagnostica();
      el.textContent =
        `3D ${d.livello} dpr ${d.dpr} ${d.larghezza}x${d.altezza}\n` +
        `calls ${d.chiamate} tri ${d.triangoli} geo ${d.geometrie} tex ${d.texture}\n` +
        `media ${d.mediaMs} ms vsync ${d.vsyncMs} ms discese ${d.discese} slot ${d.slot ?? "-"}`;
    }, 500);
  }
}

let istanza: Stage | null = null;

/** Lo Stage della visita: si crea al primo uso. Lancia se il browser non dà un contesto WebGL2. */
export function ottieniStage(): Stage {
  istanza ??= new Stage();
  return istanza;
}
