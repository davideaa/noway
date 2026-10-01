/*
 * Camera della hall: due modi che si fondono.
 *  1. Guidata da `p` (hero, MOTION 3.2): dall'esterno dell'ingresso, attraverso la porta, fino al
 *     tronco, poi lo sguardo sale al lucernario. Più uno «sguardo intorno» di ±35° (`ruota`).
 *  2. Su una vista di hotspot (`vaiA`): in piedi a `dist` metri dal tronco, `az` gradi attorno a lui,
 *     beccheggio `pol - 90` (pol > 90 guarda in su). `vaiA(null)` torna al modo 1.
 * La posa è sempre una funzione di numeri (p, yaw, vista): stessi numeri, stesso fotogramma.
 * Nessun import di three: usa solo la forma di PerspectiveCamera che serve.
 */

import { OrbitRig, type CameraLike } from "../../components/scene/CameraRig";
import type { Posizione3D, Proiezione, VistaCamera } from "../../content/types";

const RAD = Math.PI / 180;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const sss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** Centro del tronco (m): le viste di hotspot girano attorno a questo punto. */
export const TRONCO_POS = [-1.0, 0, -0.8] as const;
const OCCHI = 1.58;

export type PosaCamera = { ex: number; ey: number; ez: number; tx: number; ty: number; tz: number; fov: number };

/** Posa guidata dallo scroll. Tutti i numeri si tarano a occhio con la scena vera (MOTION 3.2). */
export function posaDaP(p: number, out: PosaCamera): PosaCamera {
  const enter = sss(0.06, 0.6, p);
  const look = sss(0.6, 0.92, p);
  const ez = 27 - 21.4 * enter - 0.4 * look; // 27 → 5,6 → 5,2 m
  const ex = -0.5 * enter;
  const ey = 1.9 - 0.32 * enter; // alla soglia gli occhi sono a 1,58 m
  const pitch = (7 - 6 * enter + 31 * look) * RAD; // su di 7° (si vede tutta la facciata) → 1° → 32°
  const yaw = -5 * RAD * enter;
  const d = 10;
  out.ex = ex;
  out.ey = ey;
  out.ez = ez;
  out.tx = ex + Math.sin(yaw) * Math.cos(pitch) * d;
  out.ty = ey + Math.sin(pitch) * d;
  out.tz = ez - Math.cos(yaw) * Math.cos(pitch) * d;
  out.fov = 36 + 4 * enter;
  return out;
}

export type ConfigCameraHall = {
  camera: CameraLike & { fov: number; position: { x: number; y: number; z: number } };
  larghezza: number;
  altezza: number;
  reducedMotion: boolean;
  limiti: { az: readonly [number, number]; pol: readonly [number, number] };
};

export class CameraHall {
  private p = 0;
  /** Sguardo intorno (gradi), smorzato verso `tyaw`. */
  private yaw = 0;
  private tyaw = 0;
  /** Peso del modo «vista di hotspot» (0..1) e suo bersaglio. */
  private w = 0;
  private tw = 0;
  private az = 0;
  private pol = 90;
  private dist = 6;
  private taz = 0;
  private tpol = 90;
  private tdist = 6;
  private aspect: number;
  private readonly pa: PosaCamera = { ex: 0, ey: 0, ez: 0, tx: 0, ty: 0, tz: 0, fov: 38 };
  /** Usato solo per `proietta` (legge le matrici della camera). */
  private readonly proiettore: OrbitRig;
  vistaAttiva = false;

  constructor(private readonly cfg: ConfigCameraHall) {
    this.aspect = cfg.larghezza / Math.max(1, cfg.altezza);
    this.proiettore = new OrbitRig({
      camera: cfg.camera,
      limiti: cfg.limiti,
      vistaIniziale: { az: 0, pol: 90, dist: 5 },
      reducedMotion: cfg.reducedMotion,
      larghezza: cfg.larghezza,
      altezza: cfg.altezza,
    });
    this.applica();
  }

  setP(p: number): void {
    this.p = clamp(p, 0, 1);
    this.applica();
  }

  /** Vista di un hotspot (az/pol/dist relativi al tronco) oppure `null` = guidata da p. */
  vaiA(v: VistaCamera | null, istantaneo = false): void {
    if (v) {
      this.taz = clamp(v.az, this.cfg.limiti.az[0], this.cfg.limiti.az[1]);
      this.tpol = clamp(v.pol, this.cfg.limiti.pol[0], this.cfg.limiti.pol[1]);
      this.tdist = clamp(v.dist, 2, 14);
      if (!this.vistaAttiva) {
        // parte dalla posa attuale: stessa direzione orizzontale dello sguardo a p
        this.az = this.taz * 0;
        this.pol = 90;
        this.dist = 7;
      }
      this.tw = 1;
      this.vistaAttiva = true;
    } else {
      this.tw = 0;
      this.tyaw = 0;
    }
    if (istantaneo || this.cfg.reducedMotion) {
      this.w = this.tw;
      this.az = this.taz;
      this.pol = this.tpol;
      this.dist = this.tdist;
      this.yaw = this.tyaw;
      if (!v) this.vistaAttiva = false;
    }
    this.applica();
  }

  ruota(gradi: number): void {
    if (this.tw > 0.5) this.taz = clamp(this.taz + gradi, this.cfg.limiti.az[0], this.cfg.limiti.az[1]);
    else this.tyaw = clamp(this.tyaw + gradi, -35, 35);
    if (this.cfg.reducedMotion) {
      this.az = this.taz;
      this.yaw = this.tyaw;
      this.applica();
    }
  }

  resize(l: number, a: number): void {
    this.aspect = l / Math.max(1, a);
    this.proiettore.resize(l, a);
    this.applica();
  }

  /** Avanza lo smorzamento. `true` finché qualcosa si muove. */
  update(dt: number): boolean {
    const k = 1 - Math.exp(-Math.max(dt, 0) / (this.cfg.reducedMotion ? 0.02 : 0.14));
    let mosso = false;
    const passo = (a: number, b: number, eps: number): number => {
      const d = b - a;
      if (Math.abs(d) < eps) {
        if (d) mosso = true;
        return b;
      }
      mosso = true;
      return a + d * k;
    };
    this.w = passo(this.w, this.tw, 0.002);
    this.az = passo(this.az, this.taz, 0.01);
    this.pol = passo(this.pol, this.tpol, 0.01);
    this.dist = passo(this.dist, this.tdist, 0.002);
    this.yaw = passo(this.yaw, this.tyaw, 0.01);
    if (mosso) this.applica();
    if (this.tw === 0 && this.w === 0) this.vistaAttiva = false;
    return mosso;
  }

  /** Scrive la posa sulla camera: fonde il modo guidato da p e quello della vista. */
  applica(): void {
    const c = this.cfg.camera;
    const a = posaDaP(this.p, this.pa);
    let ex = a.ex;
    let ey = a.ey;
    let ez = a.ez;
    let tx = a.tx;
    let ty = a.ty;
    let tz = a.tz;
    // sguardo intorno: ruota il bersaglio attorno alla verticale passante per gli occhi
    if (this.yaw) {
      const y = this.yaw * RAD;
      const dx = tx - ex;
      const dz = tz - ez;
      tx = ex + dx * Math.cos(y) + dz * Math.sin(y);
      tz = ez - dx * Math.sin(y) + dz * Math.cos(y);
    }
    if (this.w > 0) {
      const az = this.az * RAD;
      const pit = (this.pol - 90) * RAD;
      const ox = TRONCO_POS[0] + this.dist * Math.sin(az);
      const oz = TRONCO_POS[2] + this.dist * Math.cos(az);
      const oy = OCCHI;
      const d = 10;
      const tox = ox - Math.sin(az) * Math.cos(pit) * d;
      const toz = oz - Math.cos(az) * Math.cos(pit) * d;
      const toy = oy + Math.sin(pit) * d;
      const w = this.w * this.w * (3 - 2 * this.w);
      ex += (ox - ex) * w;
      ey += (oy - ey) * w;
      ez += (oz - ez) * w;
      tx += (tox - tx) * w;
      ty += (toy - ty) * w;
      tz += (toz - tz) * w;
    }
    c.position.set(ex, ey, ez);
    c.lookAt(tx, ty, tz);
    // in verticale (telefono) il campo orizzontale non scende sotto ~46°
    const tv = Math.tan((a.fov * RAD) / 2);
    const minV = Math.tan((46 * RAD) / 2) / this.aspect;
    c.fov = (2 * Math.atan(Math.max(tv, minV))) / RAD;
    c.updateProjectionMatrix();
    c.updateMatrixWorld(true);
  }

  proietta(pos: Posizione3D, out: Proiezione): void {
    this.proiettore.proietta(pos, out);
  }
}
