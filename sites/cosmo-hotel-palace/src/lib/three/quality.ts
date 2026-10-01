/*
 * Qualità adattiva (MOTION 9, DESIGN 5.5, UX 11.2). NESSUN import di `three` (sta nel JS iniziale).
 *
 * Regole che questo file fa rispettare:
 *  - telefono e tablet partono SEMPRE da `mid`; il desktop da `high`;
 *  - si scende di un gradino solo se la media su 60 frame resta sopra la soglia per 1 s continuo
 *    (soglia = max(20,8 ms, 1,25 x vsync): così un iPhone in risparmio energia, che iOS limita a
 *    30 fps, o uno schermo a 120 Hz non scendono per errore);
 *  - si misura solo mentre c'è movimento (a riposo il loop è fermo);
 *  - mai "lite" per sospetto: si parte da `lite1` solo con risparmio dati dichiarato;
 *  - nessuna risalita automatica; il livello appreso vale per la sessione (sessionStorage, try/catch);
 *  - al massimo 2 discese a visita; `lite2` ancora lento per 3 s di movimento -> poster.
 */

import type { Qualita } from "../../content/types";
import { safeSession } from "../safe-storage";

export const LIVELLI = ["high", "mid", "lite1", "lite2"] as const satisfies readonly Qualita[];

/** Il livello oltre `lite2`: niente WebGL, si resta sul poster SVG. */
export type LivelloStage = Qualita | "poster";

export type SpecLivello = {
  /** DPR massimo del livello. */
  dprMax: number;
  /** Tetto di fps durante i movimenti (0 = nessun tetto, segue il vsync). */
  fpsMax: number;
  /** PointLight spento (alone ed emissivo al suo posto). Lo applica la scena in `setQualita`. */
  pointLightSpento: boolean;
  /** Oggetti `lod: "small"` nascosti. Lo applica la scena in `setQualita`. */
  nascondiPiccoli: boolean;
};

export const SPEC: Readonly<Record<Qualita, SpecLivello>> = {
  high: { dprMax: 2, fpsMax: 0, pointLightSpento: false, nascondiPiccoli: false },
  mid: { dprMax: 1.5, fpsMax: 0, pointLightSpento: false, nascondiPiccoli: false },
  lite1: { dprMax: 1.25, fpsMax: 0, pointLightSpento: true, nascondiPiccoli: true },
  lite2: { dprMax: 1, fpsMax: 30, pointLightSpento: true, nascondiPiccoli: true },
};

/** Megapixel massimi del canvas: 1,3 sul telefono (DESIGN 5.5), 2,4 su desktop (MOTION 9.1). */
export const MEGAPIXEL_TOUCH = 1.3;
export const MEGAPIXEL_DESKTOP = 2.4;

/** DPR effettivo = min(dpr dispositivo, dpr del livello, radice(MP max / area)). */
export function dprEffettivo(
  livello: Qualita,
  larghezza: number,
  altezza: number,
  dprDispositivo: number,
  touch: boolean,
): number {
  const area = Math.max(1, larghezza * altezza);
  const mp = (touch ? MEGAPIXEL_TOUCH : MEGAPIXEL_DESKTOP) * 1e6;
  const d = Math.min(dprDispositivo || 1, SPEC[livello].dprMax, Math.sqrt(mp / area));
  return Math.max(0.5, Math.round(d * 100) / 100);
}

/** MSAA solo se il DPR è sotto 1,5: oltre, i pixel sono già fitti e costerebbe 4x di memoria. */
export const usaAntialias = (dpr: number): boolean => dpr < 1.5;

/* ───────────────────────── Livello di partenza e memoria della sessione ───────────────────────── */

const CHIAVE = "cosmo.3d.livello";

const ordine = (q: Qualita): number => LIVELLI.indexOf(q);

export function livelloRicordato(): Qualita | null {
  const v = safeSession.get(CHIAVE);
  return v && (LIVELLI as readonly string[]).includes(v) ? (v as Qualita) : null;
}

export function ricordaLivello(q: Qualita): void {
  safeSession.set(CHIAVE, q);
}

/**
 * Livello da cui si parte: `mid` su touch, `high` su desktop; `lite1` solo con risparmio dati.
 * Se in questa sessione si è già scesi, si riparte da lì (mai più in alto del livello appreso).
 */
export function livelloIniziale(touch: boolean, risparmioDati: boolean): Qualita {
  const base: Qualita = risparmioDati ? "lite1" : touch ? "mid" : "high";
  const ricordato = livelloRicordato();
  return ricordato && ordine(ricordato) > ordine(base) ? ricordato : base;
}

/** Gradino sotto, o `null` se `lite2` è già l'ultimo. */
export function scendi(q: Qualita): Qualita | null {
  return LIVELLI[ordine(q) + 1] ?? null;
}

/* ───────────────────────── Misura del vsync ───────────────────────── */

const VSYNC_NOTI = [8.33, 16.67, 33.33];

/**
 * Misura il passo del display con `n` frame a vuoto e ne prende il primo quartile (robusto ai singhiozzi del main thread).
 * Se vicina a 8,3 / 16,7 / 33,3 ms (+-15%) si aggancia al valore noto. Se la pagina è nascosta i
 * frame non arrivano: dopo `timeoutMs` si usa 16,7.
 */
export function misuraVsync(n = 20, timeoutMs = 1500): Promise<number> {
  return new Promise((risolvi) => {
    if (typeof requestAnimationFrame !== "function") return risolvi(16.67);
    const t: number[] = [];
    let ultimo = 0;
    let finito = false;
    const fine = (v: number) => {
      if (finito) return;
      finito = true;
      clearTimeout(guardia);
      risolvi(v);
    };
    const guardia = setTimeout(() => fine(16.67), timeoutMs);
    const passo = (ora: number) => {
      if (finito) return;
      if (ultimo) t.push(ora - ultimo);
      ultimo = ora;
      if (t.length < n) return void requestAnimationFrame(passo);
      const s = [...t].sort((a, b) => a - b);
      // primo quartile: un main thread occupato (avvio della scena) allunga i frame, mai li accorcia
      const base = s[s.length >> 2];
      const noto = VSYNC_NOTI.find((v) => Math.abs(v - base) / v < 0.15);
      fine(noto ?? Math.min(Math.max(base, 4), 50));
    };
    requestAnimationFrame(passo);
  });
}

/* ───────────────────────── FrameMeter ───────────────────────── */

export type ConfigMeter = {
  /** Soglia in ms oltre la quale la media dei frame è "lenta". Letta a ogni tick (il vsync arriva dopo). */
  limiteMs: () => number;
  /** Quanto deve durare la lentezza continua, in ms. */
  durataMs: () => number;
  /** Chiamata quando la lentezza è durata abbastanza. */
  alLento: () => void;
  /** Pausa dopo ogni discesa (default 3000 ms). */
  treguaMs?: number;
};

const FINESTRA = 60;
const MIN_CAMPIONI = 30;
const FRAME_SCARTATI = 8;

/**
 * Media mobile su 60 frame, scartando i primi 8 dopo ogni azzeramento (compilazione shader).
 * I frame senza movimento o con pausa (> 100 ms) azzerano la serie: non misurano nulla.
 * Nessuna allocazione per frame.
 */
export class FrameMeter {
  private buf = new Float32Array(FINESTRA);
  private i = 0;
  private n = 0;
  private somma = 0;
  private lentoDa = 0;
  private salta = FRAME_SCARTATI;
  private tregua = 0;

  constructor(private cfg: ConfigMeter) {}

  /** Dopo ogni cambio di livello o di scena. */
  azzera(): void {
    this.i = 0;
    this.n = 0;
    this.somma = 0;
    this.lentoDa = 0;
    this.salta = FRAME_SCARTATI;
  }

  /** Dopo una discesa: tregua di 3 s in cui non si misura. */
  riposa(adesso: number): void {
    this.azzera();
    this.tregua = adesso + (this.cfg.treguaMs ?? 3000);
  }

  /** Media attuale in ms (0 se pochi campioni). Per il riquadro `?perf=1`. */
  get media(): number {
    return this.n ? this.somma / this.n : 0;
  }

  tick(dtMs: number, adesso: number, inMovimento: boolean): void {
    if (!inMovimento || dtMs > 100 || dtMs <= 0) {
      this.n = 0;
      this.i = 0;
      this.somma = 0;
      this.lentoDa = 0;
      return;
    }
    if (adesso < this.tregua) return;
    if (this.salta > 0) {
      this.salta--;
      return;
    }
    const k = this.i % FINESTRA;
    if (this.n === FINESTRA) this.somma -= this.buf[k];
    this.buf[k] = dtMs;
    this.somma += dtMs;
    this.i++;
    if (this.n < FINESTRA) this.n++;
    if (this.n < MIN_CAMPIONI) return;
    if (this.somma / this.n > this.cfg.limiteMs()) {
      if (!this.lentoDa) this.lentoDa = adesso;
      if (adesso - this.lentoDa >= this.cfg.durataMs()) {
        this.lentoDa = 0;
        this.cfg.alLento();
      }
    } else {
      this.lentoDa = 0;
    }
  }
}

/** 48 fps = 20,8 ms; mai sotto 1,25 x vsync (risparmio energia a 30 fps, schermi a 120 Hz). */
export const limiteLentoMs = (vsyncMs: number): number => Math.max(1000 / 48, 1.25 * vsyncMs);

/** `lite2` è già a tetto 30 fps: è "lento" solo se sta oltre ~36,7 ms (sotto 30 fps) o oltre 1,25 x vsync. */
export const limitePosterMs = (vsyncMs: number): number => Math.max((1000 / 30) * 1.1, 1.25 * vsyncMs);

export const DURATA_LENTO_MS = 1000;
export const DURATA_LENTO_LITE2_MS = 3000;
export const MAX_DISCESE = 2;
