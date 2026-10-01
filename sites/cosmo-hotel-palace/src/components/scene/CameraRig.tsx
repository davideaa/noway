"use client";

/*
 * CameraRig: l'orbita, in due pezzi.
 *
 *  1. `OrbitRig` (classe, nessun import di `three`): la posa della camera come tre numeri
 *     (az, pol, dist) con limiti e smorzamento esponenziale. Lo usa OGNI scena per realizzare
 *     `vaiA`, `ruota`, `update`, `proietta` e `resize` di `SceneHandle` in poche righe.
 *     Lo Stage ci porta gli input (trascinamento, frecce); la scena non ascolta il mouse.
 *  2. `<CameraRig>` (componente): pulsanti ◀ ▶ e «Ripristina vista», a un solo tocco
 *     (UX 12: alternativa al trascinamento, WCAG 2.5.7).
 *
 * Scelta rispetto a `camera-controls`: vedi il rapporto del modulo 5 (misura in kB gz).
 * Qui basta l'orbita orizzontale con inerzia, zoom bloccato (DECISIONI 2), niente pan;
 * `touch-action` lo scrive lo Stage, quindi nessuna libreria può rimetterlo a `none`.
 *
 * Convenzione (come `VistaCamera`): az 0 = frontale alla scena, az positivo = la camera si
 * sposta verso +x (a destra, guardando la scena); pol 0 = dall'alto, 90 = orizzonte; dist in metri.
 * `limiti` sono ASSOLUTI nella stessa convenzione.
 */

import type { ReactNode } from "react";
import { copy } from "@/content/copy";
import type { Posizione3D, Proiezione, SceneDef, VistaCamera } from "@/content/types";
import { useControllerValue, type SceneController } from "./SceneCanvas";
import s from "./scene.module.css";

/* ───────────────────────── OrbitRig ───────────────────────── */

/** Ciò che serve da una `PerspectiveCamera` (la soddisfa strutturalmente, senza importare three). */
export type CameraLike = {
  position: { set(x: number, y: number, z: number): unknown };
  lookAt(x: number, y: number, z: number): void;
  updateMatrixWorld(force?: boolean): void;
  aspect: number;
  updateProjectionMatrix(): void;
  matrixWorldInverse: { elements: ArrayLike<number> };
  projectionMatrix: { elements: ArrayLike<number> };
};

export type OrbitConfig = {
  camera: CameraLike;
  limiti: SceneDef["limiti"];
  /** Posa di partenza: è anche quella a cui torna `vaiA(null)`. */
  vistaIniziale: VistaCamera;
  /** Punto guardato (default 0, 0, 0). */
  bersaglio?: Posizione3D;
  /** Limiti di distanza per `vaiA` (default da 0,5 a 1,5 volte quella iniziale). Lo zoom utente non c'è. */
  distanza?: readonly [number, number];
  /** `ctx.reducedMotion`: niente inerzia, `vaiA` istantaneo. */
  reducedMotion?: boolean;
  larghezza?: number;
  altezza?: number;
};

const RAD = Math.PI / 180;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** Costanti di tempo (s) dello smorzamento esponenziale. Più basso = più secco. */
const TAU_PROGRAMMATO = 0.12; // moti programmati (hotspot, preset): circa 0,4 s per assestarsi
const TAU_TRASCINO = 0.06; // sotto il dito e subito dopo: segue ma ammorbidisce
const TAU_RIDOTTO = 0.02; // prefers-reduced-motion: quasi senza inerzia (MOTION 1.2)
const FINESTRA_INPUT_MS = 150;

export class OrbitRig {
  /** Posa attuale (smorzata): gradi, gradi, metri. */
  az: number;
  pol: number;
  dist: number;

  private taz: number;
  private tpol: number;
  private tdist: number;
  private ultimoInput = -1e9;
  private w: number;
  private h: number;
  private readonly cfg: OrbitConfig;
  private readonly bx: number;
  private readonly by: number;
  private readonly bz: number;
  private readonly dmin: number;
  private readonly dmax: number;

  constructor(cfg: OrbitConfig) {
    this.cfg = cfg;
    const v = cfg.vistaIniziale;
    const [bx, by, bz] = cfg.bersaglio ?? [0, 0, 0];
    this.bx = bx;
    this.by = by;
    this.bz = bz;
    this.dmin = cfg.distanza?.[0] ?? v.dist * 0.5;
    this.dmax = cfg.distanza?.[1] ?? v.dist * 1.5;
    this.w = cfg.larghezza ?? 1;
    this.h = cfg.altezza ?? 1;
    this.az = this.taz = this.limitaAz(v.az);
    this.pol = this.tpol = this.limitaPol(v.pol);
    this.dist = this.tdist = clamp(v.dist, this.dmin, this.dmax);
    this.resize(this.w, this.h);
    this.applica();
  }

  private limitaAz = (a: number) => clamp(a, this.cfg.limiti.az[0], this.cfg.limiti.az[1]);
  private limitaPol = (p: number) => clamp(p, this.cfg.limiti.pol[0], this.cfg.limiti.pol[1]);

  /** Ruota l'orbita di `gradi` in azimut (positivo = verso destra). Rispetta `limiti.az`. */
  ruota(gradi: number): void {
    this.taz = this.limitaAz(this.taz + gradi);
    this.ultimoInput = performance.now();
  }

  /** Porta la camera su una posa (vincolata ai limiti). `null` = vista iniziale. */
  vaiA(vista: VistaCamera | null, istantaneo = false): void {
    const v = vista ?? this.cfg.vistaIniziale;
    this.taz = this.limitaAz(v.az);
    this.tpol = this.limitaPol(v.pol);
    this.tdist = clamp(v.dist, this.dmin, this.dmax);
    this.ultimoInput = -1e9;
    if (istantaneo || this.cfg.reducedMotion) {
      this.az = this.taz;
      this.pol = this.tpol;
      this.dist = this.tdist;
      this.applica();
    }
  }

  /** Posa a cui sta andando (utile a chi vuole leggere dove arriva la camera). */
  get destinazione(): VistaCamera {
    return { az: this.taz, pol: this.tpol, dist: this.tdist };
  }

  /**
   * Avanza di `dt` secondi. `true` se la camera è ancora in moto (loop a richiesta).
   * Nessuna allocazione.
   */
  update(dt: number): boolean {
    const daz = this.taz - this.az;
    const dpol = this.tpol - this.pol;
    const ddist = this.tdist - this.dist;
    if (Math.abs(daz) < 0.005 && Math.abs(dpol) < 0.005 && Math.abs(ddist) < 0.0005) {
      if (daz || dpol || ddist) {
        this.az = this.taz;
        this.pol = this.tpol;
        this.dist = this.tdist;
        this.applica();
      }
      return false;
    }
    const tau = this.cfg.reducedMotion
      ? TAU_RIDOTTO
      : performance.now() - this.ultimoInput < FINESTRA_INPUT_MS
        ? TAU_TRASCINO
        : TAU_PROGRAMMATO;
    const k = 1 - Math.exp(-Math.max(dt, 0) / tau);
    this.az += daz * k;
    this.pol += dpol * k;
    this.dist += ddist * k;
    this.applica();
    return true;
  }

  /** Scrive la posa sulla camera e ne aggiorna le matrici (servono a `proietta`). */
  applica(): void {
    const a = this.az * RAD;
    const p = this.pol * RAD;
    const sp = Math.sin(p);
    const c = this.cfg.camera;
    c.position.set(
      this.bx + this.dist * sp * Math.sin(a),
      this.by + this.dist * Math.cos(p),
      this.bz + this.dist * sp * Math.cos(a),
    );
    c.lookAt(this.bx, this.by, this.bz);
    c.updateMatrixWorld(true);
  }

  /** `SceneHandle.resize`: aspetto della camera e dimensioni per la proiezione. */
  resize(larghezza: number, altezza: number): void {
    this.w = Math.max(1, larghezza);
    this.h = Math.max(1, altezza);
    this.cfg.camera.aspect = this.w / this.h;
    this.cfg.camera.updateProjectionMatrix();
  }

  /**
   * `SceneHandle.proietta`: punto 3D -> pixel CSS nel riquadro. Scrive in `out`.
   * `visibile` = davanti alla camera e dentro il riquadro (con 5% di margine).
   * Matematica a mano su `matrixWorldInverse` e `projectionMatrix`: niente `Vector3`.
   */
  proietta(pos: Posizione3D, out: Proiezione): void {
    const m = this.cfg.camera.matrixWorldInverse.elements;
    const P = this.cfg.camera.projectionMatrix.elements;
    const [x, y, z] = pos;
    const vx = m[0] * x + m[4] * y + m[8] * z + m[12];
    const vy = m[1] * x + m[5] * y + m[9] * z + m[13];
    const vz = m[2] * x + m[6] * y + m[10] * z + m[14];
    const cx = P[0] * vx + P[4] * vy + P[8] * vz + P[12];
    const cy = P[1] * vx + P[5] * vy + P[9] * vz + P[13];
    const cz = P[2] * vx + P[6] * vy + P[10] * vz + P[14];
    const cw = P[3] * vx + P[7] * vy + P[11] * vz + P[15];
    if (cw <= 1e-6) {
      out.visibile = false;
      return;
    }
    const nx = cx / cw;
    const ny = cy / cw;
    const nz = cz / cw;
    out.x = (nx * 0.5 + 0.5) * this.w;
    out.y = (-ny * 0.5 + 0.5) * this.h;
    out.visibile = nz <= 1 && Math.abs(nx) <= 1.05 && Math.abs(ny) <= 1.05;
  }
}

/* ───────────────────────── Componente: ◀ ▶ e Ripristina ───────────────────────── */

export type EtichetteRig = {
  sinistra: string;
  destra: string;
  ripristina: string;
};

const ETICHETTE_CAMERA: EtichetteRig = {
  sinistra: copy.camere.controlli.ruotaSinistra,
  destra: copy.camere.controlli.ruotaDestra,
  ripristina: copy.camere.controlli.ripristinaVista,
};

type Props = {
  controller: SceneController;
  /** Passo dei pulsanti in gradi (UX 5.2: 15). */
  passo?: number;
  /** Testi (default: quelli della camera in COPY). Per hall e ristorante passare i propri. */
  etichette?: EtichetteRig;
  className?: string;
  children?: ReactNode;
};

/**
 * ◀ ▶ e «Ripristina vista». Bersagli da 44 px, distanti 8 px. «Ripristina vista» occupa
 * sempre il suo posto (nessun salto di layout) e compare solo dopo che la camera è stata mossa.
 * I pulsanti sono veri `<button>`: l'orbita non dipende dal trascinamento (WCAG 2.5.7).
 */
export function CameraRig({
  controller,
  passo = 15,
  etichette = ETICHETTE_CAMERA,
  className,
  children,
}: Props) {
  const modificata = useControllerValue(controller, "vista", (c) => c.vistaModificata);
  const attivi = useControllerValue(controller, "stato", (c) => c.stato === "pronta");
  return (
    <div className={`${s.rig} ${className ?? ""}`} data-attivi={attivi ? "1" : "0"}>
      <button
        type="button"
        className={s.rigBtn}
        aria-label={etichette.sinistra}
        disabled={!attivi}
        onClick={() => controller.ruota(-passo)}
      >
        <span aria-hidden="true">◀</span>
      </button>
      <button
        type="button"
        className={s.rigBtn}
        aria-label={etichette.destra}
        disabled={!attivi}
        onClick={() => controller.ruota(passo)}
      >
        <span aria-hidden="true">▶</span>
      </button>
      <button
        type="button"
        className={s.rigRipristina}
        data-visibile={modificata ? "1" : "0"}
        tabIndex={modificata ? 0 : -1}
        aria-hidden={modificata ? undefined : true}
        onClick={() => controller.ripristinaVista()}
      >
        {etichette.ripristina}
      </button>
      {children}
    </div>
  );
}
