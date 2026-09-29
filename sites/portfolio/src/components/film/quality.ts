/**
 * QUALITA' ADATTIVA del film: tre livelli (alta / media / lite) scelti UNA volta
 * all'avvio dai segnali del dispositivo, e al massimo ABBASSATI una volta a
 * runtime (media degli fps nei primi 2 s di play). Mai risaliti: niente
 * oscillazioni. Il livello e' una costante letta dai componenti al montaggio,
 * non stato per frame: la scena resta funzione pura di p.
 *
 * Segnali all'avvio:
 *  - renderer WebGL (WEBGL_debug_renderer_info): SwiftShader / llvmpipe /
 *    Intel HD / Mali-4xx -> lite (rendering software o GPU molto vecchia)
 *  - deviceMemory <= 4 GB o hardwareConcurrency <= 4 -> media
 *  - touch -> lite (telefoni e tablet: 20 s di WebGL a schermo intero, niente bloom)
 *  - ?quality=alta|media|lite forza il livello (per le prove di Davide)
 *
 * Qui vivono anche lo stato del CARICAMENTO (bake, compilazione, primo
 * fotogramma) e la DIAGNOSTICA (?diag=1), fuori da React: il ciclo li legge.
 */

export type Tier = "alta" | "media" | "lite";
export const TIERS: Tier[] = ["alta", "media", "lite"];

export type Profile = {
  /** limite del device pixel ratio */
  dpr: number;
  /** perle della figura (instanceCount: il bake e' mescolato, un prefisso e' un campione uniforme) */
  beads: number;
  /** traiettorie del ventaglio al bake (mediana inclusa) */
  curves: number;
  /** particelle del wormhole (0 = nessuna) */
  dust: number;
  /** post chain: completa / solo bloom / nessuna */
  post: "full" | "bloom" | "none";
  /** frangia RGB + smear (lente): solo in alta */
  fringe: boolean;
  /** segmenti per filo (mai meno fili) */
  seg: number;
  /** shell del tunnel */
  shells: number;
};

export const PROFILES: Record<Tier, Profile> = {
  alta: { dpr: 1.5, beads: 40000, curves: 49, dust: 900, post: "full", fringe: true, seg: 28, shells: 3 },
  media: { dpr: 1.25, beads: 20000, curves: 37, dust: 400, post: "bloom", fringe: false, seg: 20, shells: 3 },
  lite: { dpr: 1, beads: 5000, curves: 25, dust: 0, post: "none", fringe: false, seg: 12, shells: 2 },
};

export type Probe = { ok: boolean; renderer: string; vendor: string; webgl2: boolean };

/** Sonda WebGL usa e getta: c'e'? e chi disegna (stringa del renderer)? */
export function probeWebGL(): Probe {
  const out: Probe = { ok: false, renderer: "", vendor: "", webgl2: false };
  try {
    const c = document.createElement("canvas");
    const gl2 = c.getContext("webgl2");
    const gl = (gl2 || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return out;
    out.ok = true;
    out.webgl2 = !!gl2;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (info) {
      out.renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || "");
      out.vendor = String(gl.getParameter(info.UNMASKED_VENDOR_WEBGL) || "");
    } else {
      out.renderer = String(gl.getParameter(gl.RENDERER) || "");
      out.vendor = String(gl.getParameter(gl.VENDOR) || "");
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    /* nessun WebGL: il fallback statico lo gestisce Film.tsx */
  }
  return out;
}

/** Renderer che dicono "software" o "GPU vecchia": lite senza discutere. */
const LITE_RENDERERS = /swiftshader|llvmpipe|softpipe|software|intel\(r\) hd graphics [2345]\d{3}|intel hd graphics [2345]\d{3}|mali-4\d\d|mali-t6[02]|adreno \(tm\) [23]\d\d|powervr sgx/i;

export type Signals = {
  renderer: string;
  memoryGB: number | null;
  cores: number | null;
  touch: boolean;
  forced: Tier | null;
};

export function readSignals(search: string): Signals {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const q = new URLSearchParams(search).get("quality");
  return {
    renderer: "",
    memoryGB: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    cores: typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : null,
    touch: window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0,
    forced: q === "alta" || q === "media" || q === "lite" ? q : null,
  };
}

/** La scelta iniziale, con il motivo in chiaro (finisce nella diagnostica). */
export function pickTier(s: Signals): { tier: Tier; reason: string } {
  if (s.forced) return { tier: s.forced, reason: `forzato da ?quality=${s.forced}` };
  if (s.renderer && LITE_RENDERERS.test(s.renderer)) return { tier: "lite", reason: `renderer "${s.renderer}"` };
  const why: string[] = [];
  let tier: Tier = "alta";
  if (s.memoryGB !== null && s.memoryGB <= 4) {
    tier = "media";
    why.push(`memoria ${s.memoryGB} GB`);
  }
  if (s.cores !== null && s.cores <= 4) {
    tier = "media";
    why.push(`${s.cores} core`);
  }
  if (s.touch && tier !== "lite") {
    tier = "lite";
    why.push("touch");
  }
  return { tier, reason: why.length ? why.join(", ") : "nessun segnale di limite" };
}

/* ---------------- lo store del livello: scelto una volta, abbassato al massimo una volta ---------------- */
type Listener = () => void;

export const quality = {
  tier: "media" as Tier,
  reason: "non ancora scelto",
  probe: { ok: false, renderer: "", vendor: "", webgl2: false } as Probe,
  signals: null as Signals | null,
  /** true dopo la correzione a runtime (o dopo che si e' deciso di non correggere): non si misura piu' */
  settled: false,
  /** ultima misura degli fps che ha deciso (o confermato) il livello */
  fpsMeasured: null as number | null,
  listeners: new Set<Listener>(),
  init(probe: Probe, signals: Signals) {
    signals.renderer = probe.renderer;
    const pick = pickTier(signals);
    quality.probe = probe;
    quality.signals = signals;
    quality.tier = pick.tier;
    quality.reason = pick.reason;
    return pick;
  },
  get profile(): Profile {
    return PROFILES[quality.tier];
  },
  subscribe(cb: Listener) {
    quality.listeners.add(cb);
    return () => {
      quality.listeners.delete(cb);
    };
  },
  snapshot: () => quality.tier,
  /**
   * Correzione a runtime, UNA volta: media mobile degli fps nei primi 2 s dopo
   * l'avvio del play. < 20 -> lite; < 30 -> un livello in meno. Mai su.
   */
  adjust(fpsAvg: number) {
    if (quality.settled) return;
    quality.settled = true;
    quality.fpsMeasured = fpsAvg;
    const i = TIERS.indexOf(quality.tier);
    let next = quality.tier;
    if (fpsAvg < 20) next = "lite";
    else if (fpsAvg < 30) next = TIERS[Math.min(TIERS.length - 1, i + 1)];
    if (next === quality.tier) {
      quality.reason += ` · confermato a runtime (${fpsAvg.toFixed(0)} fps)`;
      return;
    }
    quality.tier = next;
    quality.reason += ` · abbassato a runtime: ${fpsAvg.toFixed(0)} fps medi nei primi 2 s`;
    quality.listeners.forEach((l) => l());
  },
};

/* ---------------- il CARICAMENTO: fasi e tempi (performance.now), letti dal ciclo e dalla diagnostica ---------------- */
export type BootStage = "chunk" | "bake" | "compile" | "first" | "ready" | "error";

export const boot = {
  stage: "chunk" as BootStage,
  /** avanzamento 0..1 per la barra sottile */
  progress: 0,
  t0: 0,
  /** ms: bake della figura (worker o thread principale), dove e' girato */
  bakeMs: null as number | null,
  bakeWhere: "" as "" | "worker" | "main",
  /** ms: gl.compileAsync della scena + prima passata del post chain */
  compileMs: null as number | null,
  postMs: null as number | null,
  /** ms dal montaggio del canvas al primo fotogramma disegnato per intero */
  firstFrameMs: null as number | null,
  /** ms dal montaggio di Film al ready (ingresso che parte) */
  readyMs: null as number | null,
  listeners: new Set<Listener>(),
  set(stage: BootStage, progress: number) {
    boot.stage = stage;
    boot.progress = Math.max(boot.progress, progress);
    boot.listeners.forEach((l) => l());
  },
  subscribe(cb: Listener) {
    boot.listeners.add(cb);
    return () => {
      boot.listeners.delete(cb);
    };
  },
};

/* ---------------- DIAGNOSTICA (?diag=1): errori catturati e misure per Davide ---------------- */
export const diag = {
  on: false,
  errors: [] as string[],
  fpsNow: 0,
  fpsAvg: 0,
  /** finestra di misura del play: frame e secondi accumulati nei primi 2 s */
  frames: 0,
  seconds: 0,
  pushError(msg: string) {
    if (diag.errors.length >= 12) diag.errors.shift();
    diag.errors.push(msg);
  },
};

export function installErrorCapture() {
  const onErr = (e: ErrorEvent) => diag.pushError(`${e.message}${e.filename ? ` (${e.filename.split("/").pop()}:${e.lineno})` : ""}`);
  const onRej = (e: PromiseRejectionEvent) => diag.pushError(`promise: ${String((e.reason && (e.reason.message || e.reason)) || "?")}`);
  window.addEventListener("error", onErr);
  window.addEventListener("unhandledrejection", onRej);
  return () => {
    window.removeEventListener("error", onErr);
    window.removeEventListener("unhandledrejection", onRej);
  };
}
