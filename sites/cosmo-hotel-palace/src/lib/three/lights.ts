/*
 * Luci finte (DESIGN 5.3): niente ombre in tempo reale, niente environment map.
 *  - luci REALI: 1 direzionale (key) + 1 emisferica + 1 PointLight che esiste sempre
 *    (intensità 0 di giorno): aggiungere o togliere luci a runtime ricompila gli shader
 *    e su telefono dà uno scatto di 50-200 ms;
 *  - lampade: emissivo + alone additivo (sprite con la texture radiale condivisa);
 *  - raggio di sole del lucernario: un piano additivo con texture a strisce.
 *
 * Intensità: i valori sono quelli di DESIGN 5.3 ("unità legacy"). three >= r155 misura le luci in
 * unità fisiche e a parità di numero risulta più scuro di un fattore pi: qui si moltiplica per pi,
 * così 1,6 di DESIGN vale 1,6. Un solo posto, `LUCE_K`.
 */

import {
  AdditiveBlending,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PointLight,
  Sprite,
  SpriteMaterial,
  type Texture,
} from "three";
import type { Posizione3D } from "../../content/types";
import { COLORI, Risorse, disegna, texturaCondivisa } from "./materials";

export const LUCE_K = Math.PI;

/* ───────────────────────── Campionamento di tabelle di luce ───────────────────────── */

export type StopScalare = readonly [t: number, valore: number];
export type StopColore = readonly [t: number, colore: string | number];

const ss = (t: number) => t * t * (3 - 2 * t);

function trova(stops: ReadonlyArray<readonly [number, unknown]>, t: number): [number, number, number] {
  if (t <= stops[0][0]) return [0, 0, 0];
  const ultimo = stops.length - 1;
  if (t >= stops[ultimo][0]) return [ultimo, ultimo, 0];
  let i = 0;
  while (t > stops[i + 1][0]) i++;
  return [i, i + 1, ss((t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]))];
}

/** Valore a `t` fra i punti chiave, interpolato con smoothstep (stesso `t`, stesso valore). */
export function campionaScalare(stops: readonly StopScalare[], t: number): number {
  const [a, b, k] = trova(stops, t);
  return stops[a][1] + (stops[b][1] - stops[a][1]) * k;
}

const tmpA = new Color();
const tmpB = new Color();

/** Colore a `t`, interpolato nello spazio lineare (`Color.lerpColors`). Scrive in `out`. */
export function campionaColore(stops: readonly StopColore[], t: number, out: Color): Color {
  const [a, b, k] = trova(stops, t);
  return out.lerpColors(tmpA.set(stops[a][1]), tmpB.set(stops[b][1]), k);
}

/** Direzione verso il sole (vettore unitario) da elevazione e azimut in gradi. az 0 = frontale (+z). */
export function direzioneSole(elevazioneGradi: number, azimutGradi: number): Posizione3D {
  const e = (elevazioneGradi * Math.PI) / 180;
  const a = (azimutGradi * Math.PI) / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
}

/* ───────────────────────── Le tre luci reali ───────────────────────── */

export type OpzLuci = {
  keyColore?: string | number;
  keyIntensita?: number;
  /** Direzione VERSO il sole (non serve normalizzarla). Default: sole d'angolo, basso. */
  keyDirezione?: Posizione3D;
  hemiCielo?: string | number;
  hemiTerra?: string | number;
  hemiIntensita?: number;
  puntoColore?: string | number;
  puntoPosizione?: Posizione3D;
  /** Raggio d'azione del PointLight in metri (0 = infinito). */
  puntoDistanza?: number;
};

/** key `#FFD9A0` 1,6 · emisferica `#E8EEF2`/`#C9A878` 0,7 · PointLight `#FFB867` a 0 (DESIGN 5.3). */
export class LuciBase {
  readonly gruppo = new Group();
  readonly key: DirectionalLight;
  readonly hemi: HemisphereLight;
  /** Sempre presente, intensità 0 di giorno: non si aggiunge né si toglie. */
  readonly punto: PointLight;

  constructor(o: OpzLuci = {}) {
    this.key = new DirectionalLight(o.keyColore ?? "#FFD9A0", (o.keyIntensita ?? 1.6) * LUCE_K);
    const d = o.keyDirezione ?? [0.5, 0.7, 0.55];
    this.key.position.set(d[0] * 20, d[1] * 20, d[2] * 20);
    this.hemi = new HemisphereLight(
      o.hemiCielo ?? "#E8EEF2",
      o.hemiTerra ?? "#C9A878",
      (o.hemiIntensita ?? 0.7) * LUCE_K,
    );
    this.punto = new PointLight(o.puntoColore ?? "#FFB867", 0, o.puntoDistanza ?? 0, 1);
    const pp = o.puntoPosizione ?? [0, 2, 0];
    this.punto.position.set(pp[0], pp[1], pp[2]);
    this.gruppo.add(this.key, this.hemi, this.punto);
  }

  /** Key: colore, intensità (unità di DESIGN) e, se data, direzione verso il sole. */
  setKey(colore: Color, intensita: number, direzione?: Posizione3D): void {
    this.key.color.copy(colore);
    this.key.intensity = intensita * LUCE_K;
    if (direzione) this.key.position.set(direzione[0] * 20, direzione[1] * 20, direzione[2] * 20);
  }

  setHemi(intensita: number, cielo?: Color, terra?: Color): void {
    this.hemi.intensity = intensita * LUCE_K;
    if (cielo) this.hemi.color.copy(cielo);
    if (terra) this.hemi.groundColor.copy(terra);
  }

  /** Lo spegne del tutto con `0`: resta nella scena (nessuna ricompilazione). */
  setPunto(intensita: number): void {
    this.punto.intensity = intensita * LUCE_K;
  }
}

/* ───────────────────────── Aloni delle lampade ───────────────────────── */

/** Gradiente radiale 256², bianco al centro, condiviso da tutti gli aloni. */
export function texturaAlone(): Texture {
  return texturaCondivisa("alone", () =>
    disegna(
      256,
      256,
      (ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.2, "rgba(255,255,255,0.62)");
        g.addColorStop(0.5, "rgba(255,255,255,0.18)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      },
      false,
    ),
  );
}

export type Aloni = {
  gruppo: Group;
  /** 0..1: l'accensione. A 0 il gruppo non viene nemmeno disegnato. */
  setOpacita(v: number): void;
};

/**
 * Un alone additivo per ogni punto (raggio ~90 cm). Un solo materiale per tutti: `setOpacita`
 * li accende insieme. `transparent` resta sempre true (cambiarlo a runtime ricompila).
 */
export function creaAloni(
  r: Risorse,
  punti: readonly Posizione3D[],
  { raggio = 0.9, colore = COLORI.paralume }: { raggio?: number; colore?: string | number } = {},
): Aloni {
  const mat = r.add(
    new SpriteMaterial({
      map: texturaAlone(),
      color: colore,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0,
    }),
  );
  const gruppo = new Group();
  gruppo.visible = false;
  for (const p of punti) {
    const s = new Sprite(mat);
    s.position.set(p[0], p[1], p[2]);
    s.scale.set(raggio * 2, raggio * 2, 1);
    gruppo.add(s);
  }
  return {
    gruppo,
    setOpacita(v) {
      mat.opacity = v;
      gruppo.visible = v > 0.002;
    },
  };
}

/* ───────────────────────── Raggio di sole ───────────────────────── */

/** Strisce di luce 256x64: fasci verticali che sfumano ai bordi (DESIGN 5.4). */
export function texturaRaggio(): Texture {
  return texturaCondivisa("raggio", () =>
    disegna(
      256,
      64,
      (ctx, w, h) => {
        const orizz = ctx.createLinearGradient(0, 0, 0, h);
        orizz.addColorStop(0, "rgba(255,255,255,0)");
        orizz.addColorStop(0.5, "rgba(255,255,255,1)");
        orizz.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = orizz;
        ctx.fillRect(0, 0, w, h);
        // fasci: tagli scuri verticali di larghezza e opacità diverse
        ctx.globalCompositeOperation = "destination-out";
        const larghezze = [10, 22, 6, 30, 12, 18, 8];
        let x = 6;
        for (const lw of larghezze) {
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.fillRect(x, 0, lw, h);
          x += lw + 28;
        }
      },
      false,
    ),
  );
}

/**
 * Piano additivo per il raggio di sole (`opacity` ~0,18, non è un'ombra). Va orientato e
 * scalato dalla scena (dal lucernario alla macchia sul pavimento).
 */
export function creaRaggioSole(r: Risorse, colore: string | number = "#FFE9C4", opacita = 0.18): Mesh {
  const geom = r.add(new PlaneGeometry(1, 1));
  const mat = r.add(
    new MeshBasicMaterial({
      map: texturaRaggio(),
      color: colore,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: opacita,
    }),
  );
  const m = new Mesh(geom, mat);
  m.renderOrder = 3;
  return m;
}
