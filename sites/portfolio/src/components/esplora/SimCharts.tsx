"use client";

/**
 * I grafici del simulatore Monte Carlo (SVG, larghezza vera del contenitore):
 *  - Ventaglio: le simulazioni del capitale nel tempo, con la fascia 5–95%, la
 *    fascia 25–75%, la mediana, alcune simulazioni intere e lo storico vero.
 *  - Istogramma: la discesa massima di ogni simulazione, con il limite scelto
 *    e il punto del 95%.
 * Tutti e due si leggono passando sopra (o toccando).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { it } from "@/lib/format";
import type { Ventaglio } from "./mc";
import { tacche } from "./calc";

function useLarghezza<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [W, setW] = useState(900);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, W };
}

const sgn = (x: number, d = 0) => (x > 0 ? "+" : x < 0 ? "−" : "") + it(Math.abs(x), d);

export function VentaglioChart({ v, colore, anni, giro }: { v: Ventaglio; colore: string; anni: number; giro: number }) {
  const { ref, W } = useLarghezza<HTMLElement>();
  const narrow = W < 560;
  const H = narrow ? 300 : 380;
  const PL = narrow ? 50 : 64;
  const PR = 14;
  const PT = 18;
  const PB = 40;
  const svg = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const P = v.p.p50.length;

  const g = useMemo(() => {
    let lo = 0;
    let hi = 0;
    for (const arr of [v.p.p5, v.p.p95, v.storico])
      for (const y of arr) {
        if (y < lo) lo = y;
        if (y > hi) hi = y;
      }
    const pad = (hi - lo) * 0.06;
    lo -= pad;
    hi += pad;
    const x = (j: number) => PL + (j / (P - 1)) * (W - PL - PR);
    const y = (val: number) => PT + (1 - (val - lo) / (hi - lo)) * (H - PT - PB);
    const linea = (a: ArrayLike<number>) => Array.from(a, (val, j) => `${j ? "L" : "M"}${x(j).toFixed(1)},${y(val).toFixed(1)}`).join("");
    const fascia = (a: Float32Array, b: Float32Array) =>
      linea(b) + Array.from(a, (_, k) => a.length - 1 - k).map((j) => `L${x(j).toFixed(1)},${y(a[j]).toFixed(1)}`).join("") + "Z";
    const anniT: number[] = [];
    for (let a = 1; a <= Math.floor(anni); a++) anniT.push(a);
    return {
      x,
      y,
      b95: fascia(v.p.p5, v.p.p95),
      b75: fascia(v.p.p25, v.p.p75),
      med: linea(v.p.p50),
      sto: linea(v.storico),
      camp: v.campioni.map(linea),
      ticks: tacche(lo, hi, narrow ? 4 : 6),
      anniT,
    };
  }, [v, W, H, P, anni, narrow, PL, PR, PT, PB]);

  const onMove = (e: React.PointerEvent) => {
    const el = svg.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const j = Math.round(((px - PL) / (W - PL - PR)) * (P - 1));
    setHover(Math.max(0, Math.min(P - 1, j)));
  };
  const j = hover ?? P - 1;
  const quando = hover === null ? `dopo ${it(anni, 1)} anni` : `dopo ${it((j / (P - 1)) * anni, 1)} anni`;

  return (
    <figure className="xp-chart xp-fan" ref={ref}>
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label={`Ventaglio di ${v.campioni.length ? "500" : ""} simulazioni del capitale: in 90 casi su 100 finisce fra ${sgn(v.p.p5[P - 1])}% e ${sgn(v.p.p95[P - 1])}%, a metà dei casi ${sgn(v.p.p50[P - 1])}%`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id="xp-fan-clip">
            <rect x={PL} y={PT} width={W - PL - PR} height={H - PT - PB} />
          </clipPath>
        </defs>
        {g.ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={g.y(t)} y2={g.y(t)} className={t === 0 ? "xp-chart__zero" : "xp-chart__grid"} />
            <text x={PL - 8} y={g.y(t) + 4} textAnchor="end" className="xp-chart__tick">
              {sgn(t)}%
            </text>
          </g>
        ))}
        {g.anniT.map((a) => (
          <text key={a} x={g.x((a / anni) * (P - 1))} y={H - 22} textAnchor="middle" className="xp-chart__tick">
            {a}
          </text>
        ))}
        <text x={W - PR} y={H - 6} textAnchor="end" className="xp-chart__axis">
          anni dall’inizio →
        </text>
        <text x={PL} y={PT - 6} className="xp-chart__axis">
          ↑ capitale rispetto all’inizio
        </text>
        <g clipPath="url(#xp-fan-clip)">
          <path d={g.b95} fill={colore} opacity={0.13} />
          <path d={g.b75} fill={colore} opacity={0.22} />
          <g key={giro} className="xp-fan__camp">
            {g.camp.map((d, k) => (
              <path key={k} d={d} fill="none" stroke={colore} strokeWidth={1} opacity={0.22} vectorEffect="non-scaling-stroke" pathLength={1} style={{ animationDelay: `${(k % 12) * 45}ms` }} />
            ))}
          </g>
          <path d={g.sto} fill="none" stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="5 5" opacity={0.85} vectorEffect="non-scaling-stroke" />
          <path d={g.med} fill="none" stroke={colore} strokeWidth={2.6} vectorEffect="non-scaling-stroke" />
        </g>
        {hover !== null && (
          <g>
            <line x1={g.x(j)} x2={g.x(j)} y1={PT} y2={H - PB} className="xp-chart__cursor" />
            {(["p95", "p50", "p5"] as const).map((k) => (
              <circle key={k} cx={g.x(j)} cy={g.y(v.p[k][j])} r={k === "p50" ? 4.5 : 3.5} fill={colore} className="xp-chart__dot" />
            ))}
            <circle cx={g.x(j)} cy={g.y(v.storico[j])} r={3.5} fill="var(--ink)" className="xp-chart__dot" />
          </g>
        )}
      </svg>
      <figcaption className="xp-chart__read mono" aria-live="off">
        <span className="xp-chart__when">{hover === null ? `Alla fine, ${quando}` : quando}</span>
        <span className="xp-chart__val">
          <i style={{ background: colore, opacity: 0.45 }} aria-hidden="true" />
          5 casi su 100 sopra <b>{sgn(v.p.p95[j])}%</b>
        </span>
        <span className="xp-chart__val">
          <i style={{ background: colore }} aria-hidden="true" />
          metà dei casi <b>{sgn(v.p.p50[j])}%</b>
        </span>
        <span className="xp-chart__val">
          <i style={{ background: colore, opacity: 0.45 }} aria-hidden="true" />
          5 casi su 100 sotto <b>{sgn(v.p.p5[j])}%</b>
        </span>
        <span className="xp-chart__val">
          <i style={{ background: "var(--ink)" }} aria-hidden="true" />
          storico vero <b>{sgn(v.storico[j])}%</b>
        </span>
      </figcaption>
    </figure>
  );
}

export function DisceseChart({
  discese,
  limite,
  p95,
  colore,
}: {
  discese: Float32Array;
  limite: number;
  p95: number;
  colore: string;
}) {
  const { ref, W } = useLarghezza<HTMLElement>();
  const narrow = W < 560;
  const H = narrow ? 200 : 230;
  const PL = narrow ? 36 : 44;
  const PR = 14;
  const PT = 26;
  const PB = 40;
  const [hover, setHover] = useState<number | null>(null);

  const g = useMemo(() => {
    const max = Math.max(limite, p95, ...discese) * 100;
    const passo = max > 40 ? 2 : 1; // colonne da 1 punto (o 2 se le discese sono grandi)
    const nb = Math.ceil(max / passo) + 1;
    const conta = new Array<number>(nb).fill(0);
    for (const d of discese) conta[Math.min(nb - 1, Math.floor((d * 100) / passo))]++;
    const top = Math.max(...conta);
    const x = (pc: number) => PL + (pc / (nb * passo)) * (W - PL - PR);
    const y = (c: number) => PT + (1 - c / top) * (H - PT - PB);
    return { conta, passo, nb, x, y, top, ticksX: tacche(0, nb * passo, narrow ? 4 : 8) };
  }, [discese, limite, p95, W, H, narrow, PL, PR, PT, PB]);

  const bw = g.x(g.passo) - g.x(0);
  const lim = limite * 100;
  return (
    <figure className="xp-chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`Discesa massima di ${discese.length} simulazioni: il 95% resta sotto il ${it(p95 * 100, 1)}%`} onPointerLeave={() => setHover(null)}>
        {g.conta.map((c, b) => {
          const da = b * g.passo;
          const oltre = da + g.passo > lim + 1e-9;
          return (
            <rect
              key={b}
              x={g.x(da) + 1}
              y={g.y(c)}
              width={Math.max(1, bw - 2)}
              height={H - PB - g.y(c)}
              rx={2}
              fill={oltre ? "var(--bad)" : colore}
              opacity={hover === null || hover === b ? 0.85 : 0.4}
              onPointerEnter={() => setHover(b)}
              onPointerDown={() => setHover(b)}
            />
          );
        })}
        <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} className="xp-chart__zero" />
        {g.ticksX.map((t) => (
          <text key={t} x={g.x(t)} y={H - 22} textAnchor="middle" className="xp-chart__tick">
            {it(t, 0)}%
          </text>
        ))}
        <text x={W - PR} y={H - 6} textAnchor="end" className="xp-chart__axis">
          discesa massima di ogni simulazione →
        </text>
        <text x={PL} y={14} className="xp-chart__axis">
          ↑ quante simulazioni
        </text>
        <g className="xp-hist__mark">
          <line x1={g.x(lim)} x2={g.x(lim)} y1={PT - 4} y2={H - PB} stroke="var(--warn)" strokeWidth={1.5} strokeDasharray="4 4" />
          <text x={g.x(lim) + 5} y={PT + 8} className="xp-chart__tick" fill="var(--warn)">
            il tuo limite {it(lim, 0)}%
          </text>
          <line x1={g.x(p95 * 100)} x2={g.x(p95 * 100)} y1={PT + 14} y2={H - PB} stroke="var(--ink)" strokeWidth={1.5} />
          <text x={g.x(p95 * 100) + 5} y={PT + 26} className="xp-chart__tick">
            95%: {it(p95 * 100, 1)}%
          </text>
        </g>
      </svg>
      <figcaption className="xp-chart__read mono" aria-live="off">
        {hover === null ? (
          <span className="xp-chart__when">Passa sopra una colonna: quante simulazioni hanno avuto quella discesa</span>
        ) : (
          <span className="xp-chart__when">
            Discesa fra {it(hover * g.passo, 0)}% e {it((hover + 1) * g.passo, 0)}%: <b>{g.conta[hover]}</b> simulazioni su {discese.length}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
