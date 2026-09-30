"use client";

/**
 * IL PIANETA DEL FINALE (Davide): "il mondo che gira con il nostro logo, in 3D,
 * come una sfera intera, non in 2D sottile". Una Terra a puntini (continenti
 * veri: globo-punti.json da scripts/globo.py, Natural Earth) che ruota su se
 * stessa piano, con l'atmosfera, due anelli in orbita che passano davanti e
 * dietro, archi luminosi fra le citta' e il logo davanti. Nei colori del sito.
 *
 * Canvas 2D: ogni puntino e' un punto della sfera ruotato e proiettato a ogni
 * fotogramma (quelli dietro si vedono appena, in trasparenza). Disegna solo
 * quando il finale e' visibile e la scheda e' in primo piano; appena il finale
 * compare, il pianeta "esce" dal centro del tunnel (da piccolo a pieno).
 * Con "meno movimento": fermo.
 *
 * Lo stesso pianeta torna nella sezione Contatti (Davide: "interattivo, che
 * gira, sulla destra, solo in quella sezione"): li' si accende quando la
 * sezione ha la classe .is-in e si puo' trascinare per farlo girare.
 */
import { useEffect, useRef } from "react";
import punti from "./globo-punti.json";
import logoGrande from "./logo-grande.webp";

const ACC: [number, number, number] = [200, 250, 114]; // --acc
const GIRO_S = 48; // secondi per un giro completo della Terra
const INCLINA = (-18 * Math.PI) / 180; // asse inclinato verso chi guarda
const USCITA_MS = 1600; // quanto dura l'uscita dal "buco nero"

/* citta' collegate dagli archi luminosi (lat, lon) */
const CITTA = {
  ny: [40.7, -74],
  londra: [51.5, -0.1],
  francoforte: [50.1, 8.7],
  dubai: [25.2, 55.3],
  mumbai: [19, 72.8],
  tokyo: [35.7, 139.7],
  singapore: [1.3, 103.8],
  sydney: [-33.9, 151.2],
  sanpaolo: [-23.5, -46.6],
  chicago: [41.9, -87.6],
  hongkong: [22.3, 114.2],
} as const;
const ARCHI: [keyof typeof CITTA, keyof typeof CITTA][] = [
  ["ny", "londra"],
  ["londra", "dubai"],
  ["francoforte", "mumbai"],
  ["tokyo", "singapore"],
  ["singapore", "sydney"],
  ["sanpaolo", "londra"],
  ["chicago", "tokyo"],
  ["hongkong", "dubai"],
  ["ny", "sanpaolo"],
];

const vettore = (lat: number, lon: number) => {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)] as const;
};

export function Globo({ interattivo = false }: { interattivo?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const logo = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const ov = cv.closest("[data-ov]") as HTMLElement | null;
    // fuori dal film: si accende solo quando la sezione che lo contiene e' in vista (.is-in)
    const sezione = ov ? null : (cv.closest("[data-globo]") as HTMLElement | null);
    const fermo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // i puntini come vettori sulla sfera
    const n = punti.length / 2;
    const P = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = vettore(punti[i * 2] / 10, punti[i * 2 + 1] / 10);
      P[i * 3] = v[0];
      P[i * 3 + 1] = v[1];
      P[i * 3 + 2] = v[2];
    }
    // gli archi: punti lungo il cerchio massimo, sollevati a meta' strada
    const archi = ARCHI.map(([a, b]) => {
      const A = vettore(...(CITTA[a] as unknown as [number, number]));
      const B = vettore(...(CITTA[b] as unknown as [number, number]));
      const dot = Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]));
      const om = Math.acos(dot);
      const pts: number[] = [];
      const K = 48;
      for (let k = 0; k <= K; k++) {
        const t = k / K;
        const s1 = Math.sin((1 - t) * om) / Math.sin(om);
        const s2 = Math.sin(t * om) / Math.sin(om);
        const alza = 1 + 0.16 * om * Math.sin(Math.PI * t);
        pts.push((A[0] * s1 + B[0] * s2) * alza, (A[1] * s1 + B[1] * s2) * alza, (A[2] * s1 + B[2] * s2) * alza);
      }
      return pts;
    });

    let W = 0;
    let dpr = 1;
    const misura = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const lato = cv.clientWidth;
      W = Math.max(1, Math.round(lato * dpr));
      cv.width = W;
      cv.height = W;
    };
    misura();
    const ro = new ResizeObserver(misura);
    ro.observe(cv);

    const rgba = (a: number) => `rgba(${ACC[0]},${ACC[1]},${ACC[2]},${a.toFixed(3)})`;
    // ruota (angolo th attorno all'asse, poi inclinazione) e proietta
    let cosI = Math.cos(INCLINA);
    let sinI = Math.sin(INCLINA);

    let raf = 0;
    let visto = false;
    let t0Uscita = 0;
    let tPrec = performance.now();
    let th = 0;

    /* trascinare: il pianeta segue il dito o il mouse, poi rallenta e torna al suo giro */
    let presa: { id: number; x: number; t: number } | null = null;
    let spinta = 0; // radianti al secondo in piu' (o in meno) del giro normale
    let inclinaExtra = 0;
    let inclinaOra = 0;
    const giu = (e: PointerEvent) => {
      presa = { id: e.pointerId, x: e.clientX, t: performance.now() };
      spinta = 0;
      cv.setPointerCapture?.(e.pointerId);
      cv.classList.add("is-presa");
    };
    const muovi = (e: PointerEvent) => {
      // con il mouse sopra, il pianeta si piega appena verso il puntatore
      if (e.pointerType === "mouse") {
        const r = cv.getBoundingClientRect();
        inclinaExtra = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 0.35;
      }
      if (!presa || e.pointerId !== presa.id) return;
      const now = performance.now();
      const ang = ((e.clientX - presa.x) / Math.max(1, cv.clientWidth)) * Math.PI * 1.6;
      th += ang;
      spinta = spinta * 0.5 + (ang / Math.max(0.008, (now - presa.t) / 1000)) * 0.5;
      presa.x = e.clientX;
      presa.t = now;
    };
    const su = (e: PointerEvent) => {
      if (!presa || e.pointerId !== presa.id) return;
      presa = null;
      spinta = Math.max(-9, Math.min(9, spinta));
      cv.classList.remove("is-presa");
    };
    const via = () => void (inclinaExtra = 0);
    if (interattivo) {
      cv.addEventListener("pointerdown", giu);
      cv.addEventListener("pointermove", muovi);
      cv.addEventListener("pointerup", su);
      cv.addEventListener("pointercancel", su);
      cv.addEventListener("pointerleave", via);
    }

    const disegna = (now: number) => {
      raf = requestAnimationFrame(disegna);
      const vis = ov
        ? ov.style.visibility !== "hidden" && Number(ov.style.opacity || 1) > 0.02
        : !sezione || sezione.classList.contains("is-in");
      if (!vis || document.hidden) {
        visto = false;
        tPrec = now;
        return;
      }
      if (!visto) {
        visto = true;
        t0Uscita = now;
      }
      const dt = Math.min(0.1, (now - tPrec) / 1000);
      tPrec = now;
      if (!fermo && !presa) th += (dt * 2 * Math.PI) / GIRO_S;
      if (!presa && spinta !== 0) {
        th += spinta * dt;
        spinta *= Math.exp(-dt * 1.8);
        if (Math.abs(spinta) < 0.01) spinta = 0;
      }
      inclinaOra += (inclinaExtra - inclinaOra) * Math.min(1, dt * 4);

      // uscita dal buco nero: da piccolo a pieno, con un filo di rimbalzo
      const u = fermo ? 1 : Math.min(1, (now - t0Uscita) / USCITA_MS);
      const e = 1 - Math.pow(1 - u, 3);
      const scala = 0.08 + 0.92 * e;
      const c = W / 2;
      const R = W * 0.36 * scala;
      // il logo davanti esce insieme al pianeta, e respira appena
      if (logo.current) {
        const galla = fermo ? 0 : Math.sin(now / 1400) * 1.2;
        logo.current.style.transform = `translate(-50%, calc(-50% + ${galla.toFixed(2)}%)) scale(${scala.toFixed(3)})`;
        logo.current.style.opacity = Math.min(1, u * 1.6).toFixed(3);
      }
      ctx.clearRect(0, 0, W, W);
      ctx.globalAlpha = Math.min(1, u * 1.6);

      cosI = Math.cos(INCLINA + inclinaOra);
      sinI = Math.sin(INCLINA + inclinaOra);
      const cosT = Math.cos(th);
      const sinT = Math.sin(th);
      const proietta = (x: number, y: number, z: number) => {
        // rotazione attorno all'asse y (la Terra che gira)
        const x1 = x * cosT + z * sinT;
        const z1 = -x * sinT + z * cosT;
        // inclinazione attorno all'asse x
        const y2 = y * cosI - z1 * sinI;
        const z2 = y * sinI + z1 * cosI;
        return [c + x1 * R, c - y2 * R, z2] as const;
      };

      // atmosfera: alone largo dietro la sfera
      const alone = ctx.createRadialGradient(c, c, R * 0.85, c, c, R * 1.38); // entro il bordo del canvas: niente quadrato visibile
      alone.addColorStop(0, rgba(0.2));
      alone.addColorStop(0.35, rgba(0.07));
      alone.addColorStop(1, rgba(0));
      ctx.fillStyle = alone;
      ctx.fillRect(0, 0, W, W);

      // anelli in orbita: prima le meta' dietro
      // anelli: cerchi quasi di taglio (inclinati di "alza") e ruotati in diagonale ("storto"),
      // ellissi schiacciate come nel riferimento; la meta' dietro passa dietro alla sfera
      const anelli = [
        { r: 1.34, alza: 0.34, storto: 0.42, giro: 0.35, fase: 0 },
        { r: 1.22, alza: 0.5, storto: -0.62, giro: -0.22, fase: 2.1 },
      ];
      const puntiAnello = (a: (typeof anelli)[number]) => {
        const out: (readonly [number, number, number])[] = [];
        const K = 140;
        const ca = Math.cos(a.alza);
        const sa = Math.sin(a.alza);
        const cb = Math.cos(a.storto);
        const sb = Math.sin(a.storto);
        const rot = a.fase + (fermo ? 0 : now / 1000) * a.giro * 0.12;
        for (let k = 0; k <= K; k++) {
          const t = (k / K) * Math.PI * 2 + rot;
          const x = Math.cos(t) * a.r;
          const zp = Math.sin(t) * a.r;
          const y = zp * sa; // il piano si alza verso chi guarda
          const z = zp * ca;
          const x2 = x * cb - y * sb; // e si storce in diagonale
          const y2 = x * sb + y * cb;
          out.push([c + x2 * R, c - y2 * R, z] as const);
        }
        return out;
      };
      const tracciaAnello = (pts: (readonly [number, number, number])[], davanti: boolean) => {
        ctx.lineWidth = 1.3 * dpr;
        for (let k = 1; k < pts.length; k++) {
          const z = (pts[k][2] + pts[k - 1][2]) / 2;
          if (davanti !== z > 0) continue;
          ctx.strokeStyle = rgba(davanti ? 0.55 : 0.14);
          ctx.beginPath();
          ctx.moveTo(pts[k - 1][0], pts[k - 1][1]);
          ctx.lineTo(pts[k][0], pts[k][1]);
          ctx.stroke();
        }
      };
      const tracce = anelli.map(puntiAnello);
      for (const t of tracce) tracciaAnello(t, false);

      // la sfera: corpo scuro con il bordo in luce
      const corpo = ctx.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.1, c, c, R);
      corpo.addColorStop(0, "rgba(22,36,16,0.92)");
      corpo.addColorStop(0.7, "rgba(8,14,7,0.94)");
      corpo.addColorStop(1, "rgba(5,9,5,0.96)");
      ctx.fillStyle = corpo;
      ctx.beginPath();
      ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.fill();
      const bordo = ctx.createRadialGradient(c, c, R * 0.82, c, c, R * 1.02);
      bordo.addColorStop(0, rgba(0));
      bordo.addColorStop(0.85, rgba(0.16));
      bordo.addColorStop(1, rgba(0.5));
      ctx.fillStyle = bordo;
      ctx.beginPath();
      ctx.arc(c, c, R * 1.02, 0, Math.PI * 2);
      ctx.fill();

      // i continenti: puntini raggruppati per luminosita' (pochi cambi di colore)
      const LIV = 10;
      const gruppi: number[][] = Array.from({ length: LIV }, () => []);
      for (let i = 0; i < n; i++) {
        const [sx, sy, z] = proietta(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
        // davanti: pieni e piu' grandi verso il centro; dietro: appena visibili, in trasparenza
        const l = z > 0 ? Math.min(LIV - 1, 3 + Math.floor(z * (LIV - 3))) : z > -0.6 ? 1 : 0;
        const s = (z > 0 ? 0.9 + 1.5 * z : 0.8) * dpr * scala;
        gruppi[l].push(sx - s / 2, sy - s / 2, s);
      }
      for (let l = 0; l < LIV; l++) {
        const g = gruppi[l];
        if (!g.length) continue;
        ctx.fillStyle = rgba(l === 0 ? 0.05 : l === 1 ? 0.1 : 0.25 + (0.75 * (l - 2)) / (LIV - 3));
        ctx.beginPath();
        for (let k = 0; k < g.length; k += 3) ctx.rect(g[k], g[k + 1], g[k + 2], g[k + 2]);
        ctx.fill();
      }

      // archi fra le citta', con un impulso che viaggia
      ctx.lineCap = "round";
      archi.forEach((a, ai) => {
        const K = a.length / 3;
        const imp = ((now / 1000) * 0.22 + ai * 0.37) % 1.6;
        let prima: readonly [number, number, number] | null = null;
        for (let k = 0; k < K; k++) {
          const q = proietta(a[k * 3], a[k * 3 + 1], a[k * 3 + 2]);
          if (prima && q[2] > -0.05 && prima[2] > -0.05) {
            const d = Math.abs(k / K - imp);
            ctx.strokeStyle = rgba(0.35 + (d < 0.08 ? 0.6 * (1 - d / 0.08) : 0));
            ctx.lineWidth = (d < 0.08 ? 2.2 : 1.2) * dpr;
            ctx.beginPath();
            ctx.moveTo(prima[0], prima[1]);
            ctx.lineTo(q[0], q[1]);
            ctx.stroke();
          }
          prima = q;
        }
        // le citta': punti di luce quando sono davanti
        for (const k of [0, K - 1]) {
          const q = proietta(a[k * 3], a[k * 3 + 1], a[k * 3 + 2]);
          if (q[2] <= 0) continue;
          const rr = 7 * dpr * scala;
          const gl = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr);
          gl.addColorStop(0, "rgba(245,255,220,0.95)");
          gl.addColorStop(0.35, rgba(0.6));
          gl.addColorStop(1, rgba(0));
          ctx.fillStyle = gl;
          ctx.fillRect(q[0] - rr, q[1] - rr, rr * 2, rr * 2);
        }
      });

      // meta' davanti degli anelli, con due luci che ci corrono sopra
      for (const t of tracce) tracciaAnello(t, true);
      tracce.forEach((t, ti) => {
        for (const f of [0.18, 0.64]) {
          const q = t[Math.floor(((f + ti * 0.1) % 1) * (t.length - 1))];
          if (q[2] <= 0) continue;
          const rr = 9 * dpr * scala;
          const gl = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr);
          gl.addColorStop(0, "rgba(245,255,220,0.9)");
          gl.addColorStop(0.4, rgba(0.45));
          gl.addColorStop(1, rgba(0));
          ctx.fillStyle = gl;
          ctx.fillRect(q[0] - rr, q[1] - rr, rr * 2, rr * 2);
        }
      });
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(disegna);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener("pointerdown", giu);
      cv.removeEventListener("pointermove", muovi);
      cv.removeEventListener("pointerup", su);
      cv.removeEventListener("pointercancel", su);
      cv.removeEventListener("pointerleave", via);
    };
  }, [interattivo]);

  return (
    <div className={interattivo ? "globo globo--mano" : "globo"} aria-hidden="true">
      <canvas ref={canvas} className="globo__cv" />
      {/* eslint-disable-next-line @next/next/no-img-element -- esportazione statica, immagine gia' ridotta */}
      <img ref={logo} className="globo__logo" src={logoGrande.src} width={logoGrande.width} height={logoGrande.height} alt="" decoding="async" />
    </div>
  );
}
