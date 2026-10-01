/*
 * Il tronco d'ulivo (MOTION 3.7): scultura procedurale, 0 kB di asset. Non è una rivoluzione con
 * rumore ma un insieme di tubi loftati lungo curve, ciascuno con scanalature che si avvitano
 * (la torsione tipica del legno d'ulivo), nodi (gonfiori) e cavità (rientranze scure):
 *   - fusto principale con la base che si apre in cinque radici sul pavimento;
 *   - un braccio lungo che pende a sinistra e si divide in due rametti;
 *   - un fusto centrale più spesso, con un anello (un foro vero) fra il fusto e un ramo ricurvo;
 *   - cavità sul fusto e sul ramo centrale.
 * Colore per vertice: #5A3A1B alla base -> #8A4F12 in alto, più scuro nelle scanalature e nelle cavità.
 * Triangoli: vedi il rapporto (misurati con renderer.info). Costruzione: pochi ms.
 */

import { BufferGeometry, Color } from "three";
import { Fusione } from "../_geo-hall-grill/fusione";
import { fbm3 } from "../_geo-hall-grill/rumore";
import { creaTubo, type OpzTubo } from "../_geo-hall-grill/tubi";

type Nodo = { p: readonly [number, number, number]; r: number; h: number };
type Cavita = { p: readonly [number, number, number]; r: number; prof: number };

const CHIARO = new Color("#9A5B1A");
const SCURO = new Color("#5A3A1B");
const SBIANCATO = new Color("#B98A4E");

const NODI: Nodo[] = [
  { p: [0.05, 0.85, 0.38], r: 0.38, h: 0.2 },
  { p: [-0.2, 1.95, 0.12], r: 0.3, h: 0.14 },
  { p: [0.2, 2.75, -0.22], r: 0.26, h: 0.12 },
  { p: [-0.85, 3.7, 0.2], r: 0.24, h: 0.15 },
  { p: [0.64, 3.95, -0.1], r: 0.28, h: 0.13 },
  { p: [1.45, 4.35, 0.12], r: 0.2, h: 0.12 },
  { p: [-1.3, 4.6, 0.12], r: 0.2, h: 0.1 },
  { p: [0.5, 0.35, -0.5], r: 0.4, h: 0.16 },
];
const CAVITA: Cavita[] = [
  { p: [0.02, 1.5, 0.46], r: 0.3, prof: 0.55 },
  { p: [0.62, 4.25, 0.3], r: 0.17, prof: 0.4 },
  { p: [-0.1, 2.5, -0.38], r: 0.22, prof: 0.4 },
];

const s2 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Parte = {
  punti: ReadonlyArray<readonly [number, number, number]>;
  r0: number;
  r1: number;
  /** Profilo del raggio (sostituisce r0 -> r1). */
  profilo?: (u: number) => number;
  /** Svasatura della base (stelo e radici). */
  flare?: number;
  lati: number;
  anelli: number;
  fase: number;
  giri: number;
  punta?: number;
  /** Il ramo nasce dentro un altro tubo: l'inizio si restringe. */
  innesto?: boolean;
  /** Quanto le scanalature sono marcate (0..1). */
  ruvido?: number;
};

function parte(f: Fusione, p: Parte, det: number): void {
  const lati = Math.max(7, Math.round(p.lati * det));
  const anelli = Math.max(6, Math.round(p.anelli * det));
  const ruv = p.ruvido ?? 1;
  const opz: OpzTubo = {
    punti: p.punti,
    lati,
    anelli,
    punta: p.punta ?? 0.12,
    // l'attacco dei rami (taper iniziale) sta nascosto dentro il fusto: niente bocche aperte
    raggio: (u) =>
      (p.profilo ? p.profilo(u) : p.r0 + (p.r1 - p.r0) * Math.pow(u, 0.85)) *
      (1 + (p.flare ?? 0) * Math.exp(-u * 8)) *
      (p.innesto ? 0.45 + 0.55 * s2(0, 0.16, u) : 1),
    deforma: (q, th, u, out) => {
      // torsione: la fase delle scanalature gira lungo il fusto (legno strizzato, tipico dell'ulivo)
      const fi = u * p.giri * Math.PI * 2 + p.fase;
      // lobi larghi e sezione ovale che ruota con il fusto
      const lobi = Math.sin(3 * th + fi);
      const ovale = Math.cos(2 * (th - fi * 0.6));
      // fenditure sottili e profonde che si avvitano
      const cr = Math.pow(Math.max(0, Math.sin(7 * th - 1.6 * fi + 1.3 * (fbm3(q.x * 2, q.y * 1.2, q.z * 2, 8) - 0.5))), 5);
      const cr2 = Math.pow(Math.max(0, Math.sin(11 * th + 1.1 * fi + 2)), 8);
      const n = fbm3(q.x * 1.1, q.y * 1.1, q.z * 1.1, 3) - 0.5;
      const n2 = fbm3(q.x * 3.4, q.y * 2.2, q.z * 3.4, 12) - 0.5;
      let r = 1 + ruv * (0.13 * lobi + 0.12 * ovale - 0.16 * cr - 0.07 * cr2 + 0.34 * n + 0.1 * n2);
      let buio = ruv * (cr * 0.95 + cr2 * 0.5 + Math.max(0, -lobi) * 0.28) + Math.max(0, -n) * 0.5;
      for (const k of NODI) {
        const dx = q.x - k.p[0];
        const dy = q.y - k.p[1];
        const dz = q.z - k.p[2];
        const e = Math.exp(-(dx * dx + dy * dy + dz * dz) / (k.r * k.r));
        r += k.h * e;
        buio -= 0.25 * e;
      }
      for (const c of CAVITA) {
        const dx = q.x - c.p[0];
        const dy = q.y - c.p[1];
        const dz = q.z - c.p[2];
        const d2 = (dx * dx + dy * dy * 0.7 + dz * dz) / (c.r * c.r);
        const e = Math.exp(-d2 * 1.4);
        r -= c.prof * e;
        buio += 1.1 * Math.exp(-d2 * 2.2);
      }
      out.r = Math.max(0.4, r);
      out.buio = Math.min(1, Math.max(0, buio));
    },
    colore: (q, _u, _th, buio, out) => {
      const alto = s2(0, 5.4, q.y);
      out.copy(SCURO).lerp(CHIARO, 0.2 + alto * 0.8);
      // venature lunghe e chiare, zone sbiancate dal sole sui rilievi
      const vena = fbm3(q.x * 5, q.y * 0.8, q.z * 5, 11);
      out.lerp(SBIANCATO, Math.max(0, vena - 0.5) * 1.5 * (0.35 + alto));
      const tono = 0.8 + 0.4 * fbm3(q.x * 2.2 + 3, q.y * 1.1, q.z * 2.2, 7);
      out.multiplyScalar(tono * (1 - 0.82 * buio) * (1.08 - 0.3 * buio));
      return out;
    },
  };
  f.aggiungi(creaTubo(opz), null);
}

/** Il tronco, con la base appoggiata in (0, 0, 0). `det` = 1 high, 0,78 mid, 0,6 lite. */
export function costruisciTronco(det: number): BufferGeometry {
  const f = new Fusione();
  // fusto principale: sale per tutta l'altezza e diventa il fusto centrale (un solo tubo, niente giunti)
  parte(
    f,
    {
      punti: [[0, -0.1, 0], [0.05, 0.7, 0.02], [-0.12, 1.5, 0.08], [0.1, 2.3, -0.04], [0.34, 3.1, -0.04], [0.62, 3.9, -0.1], [0.52, 4.6, -0.05], [0.78, 5.2, 0.05], [0.7, 5.8, 0]],
      r0: 0.5, r1: 0.1, profilo: (u) => 0.1 + 0.37 * Math.pow(1 - s2(0.22, 1, u), 1.15), flare: 0.5,
      lati: 44, anelli: 110, fase: 0, giri: 1.5,
    },
    det,
  );
  // braccio lungo a sinistra
  parte(
    f,
    {
      punti: [[0.05, 2.3, 0], [-0.35, 3.0, 0.08], [-0.85, 3.7, 0.18], [-1.2, 4.4, 0.12], [-1.55, 5.0, 0.2], [-2.0, 5.5, 0.28]],
      r0: 0.29, r1: 0.1, lati: 28, anelli: 52, fase: 2, giri: 0.9, innesto: true,
    },
    det,
  );
  // l'anello: ramo ricurvo che rientra nel fusto centrale, con il foro in mezzo
  parte(
    f,
    {
      punti: [[0.55, 3.45, -0.1], [1.15, 3.8, 0.05], [1.5, 4.35, 0.1], [1.25, 4.9, 0.08], [0.68, 5.0, -0.02]],
      r0: 0.14, r1: 0.12, lati: 16, anelli: 30, fase: 1, giri: 0.7, punta: 0, ruvido: 0.7, innesto: true,
    },
    det,
  );
  // rametti
  parte(f, { punti: [[-1.4, 4.75, 0.2], [-1.05, 5.4, 0.15], [-0.75, 5.95, 0.1]], r0: 0.1, r1: 0.05, punta: 0.3, lati: 9, anelli: 12, fase: 3, giri: 0.5, ruvido: 0.6, innesto: true }, det);
  parte(f, { punti: [[-1.8, 5.25, 0.26], [-2.45, 5.65, 0.32], [-2.95, 6.1, 0.3]], r0: 0.09, r1: 0.045, punta: 0.3, lati: 9, anelli: 12, fase: 5, giri: 0.5, ruvido: 0.6, innesto: true }, det);
  parte(f, { punti: [[0.74, 5.1, 0.05], [1.2, 5.5, 0.12], [1.5, 5.9, 0.1]], r0: 0.1, r1: 0.05, punta: 0.3, lati: 9, anelli: 12, fase: 6, giri: 0.5, ruvido: 0.6, innesto: true }, det);
  // radici sul pavimento
  const angoli = [20, 88, 150, 214, 292];
  angoli.forEach((a, i) => {
    const r = (a * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    const len = 1.35 + (i % 3) * 0.3;
    parte(
      f,
      {
        punti: [[0.25 * c, 0.7, 0.25 * s], [0.65 * c, 0.3, 0.65 * s + 0.05], [len * 0.7 * c, 0.12, len * 0.7 * s - 0.05], [len * c, 0.05, len * s]],
        r0: 0.3, r1: 0.08, lati: 16, anelli: 18, fase: i * 1.3, giri: 0.6, ruvido: 0.8, innesto: true,
      },
      det,
    );
  });
  return f.costruisci();
}

/** Ingombro per l'ombra a contatto (m): metà larghezza x, metà z. */
export const TRONCO_INGOMBRO = { x: 1.9, z: 1.7 } as const;
