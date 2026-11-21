"use client";

/**
 * Grafico interattivo delle pagine strategia: una o due linee per operazione,
 * area sotto la linea principale, fascia "fuori campione", cursore che segue il
 * puntatore (o il dito) e mostra mese e valore. SVG a larghezza del contenitore.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { riduci, tacche } from "./calc";

export type Serie = { v: number[]; colore: string; nome: string; tratteggio?: boolean };

export function Chart({
  serie,
  mesiOp,
  fmt,
  fmtAsse,
  fuoriDa,
  altezza = 280,
  modo = "ultimo",
  area = "sopra",
  titolo,
}: {
  serie: Serie[];
  /** etichetta del mese per ogni operazione ("gen 2024") */
  mesiOp: string[];
  fmt: (v: number) => string;
  fmtAsse: (v: number) => string;
  /** indice della prima operazione fuori campione (fascia chiara), o null */
  fuoriDa: number | null;
  altezza?: number;
  modo?: "ultimo" | "min";
  area?: "sopra" | "sotto";
  titolo: string;
}) {
  const box = useRef<HTMLElement>(null);
  const [W, setW] = useState(1000);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = altezza;
  const narrow = W < 560;
  const PAD = { l: narrow ? 52 : 64, r: 12, t: 14, b: 30 };
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const n = serie[0]?.v.length ?? 0;

  const g = useMemo(() => {
    let lo = 0;
    let hi = 0;
    for (const s of serie)
      for (const y of s.v) {
        if (y < lo) lo = y;
        if (y > hi) hi = y;
      }
    if (hi === lo) hi = lo + 1;
    const padY = (hi - lo) * 0.06;
    lo -= area === "sotto" ? padY : lo < 0 ? padY : 0;
    hi += padY;
    const x = (i: number) => PAD.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - PAD.l - PAD.r));
    const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
    const paths = serie.map((s) => {
      const pts = riduci(s.v, 700, modo);
      return pts.map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(1)},${y(p.y).toFixed(1)}`).join("");
    });
    const base = y(area === "sotto" ? 0 : Math.max(lo, Math.min(0, hi)));
    const first = riduci(serie[0]?.v ?? [], 700, modo);
    const areaPath = first.length
      ? `M${x(first[0].i).toFixed(1)},${base.toFixed(1)}` +
        first.map((p) => `L${x(p.i).toFixed(1)},${y(p.y).toFixed(1)}`).join("") +
        `L${x(first[first.length - 1].i).toFixed(1)},${base.toFixed(1)}Z`
      : "";
    const ticks = tacche(lo, hi, 5);
    // anni sull'asse x: prima operazione di ogni anno
    const anni: { i: number; a: string }[] = [];
    let ultimo = "";
    mesiOp.forEach((ml, i) => {
      const a = ml.slice(-4);
      if (a !== ultimo) {
        anni.push({ i, a: W < 560 ? "’" + a.slice(2) : a });
        ultimo = a;
      }
    });
    return { x, y, paths, areaPath, ticks, anni, base };
  }, [serie, mesiOp, n, H, W, modo, area, PAD.l, PAD.r, PAD.t, PAD.b]);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || n === 0) return;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const hi = hover;
  const main = serie[0];
  return (
    <figure className="xp-chart" ref={box}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={titolo}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        width={W}
        height={H}
      >
        <defs>
          <linearGradient id={`xp-fill-${titolo.length}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={main?.colore ?? "var(--acc)"} stopOpacity={area === "sotto" ? 0.05 : 0.28} />
            <stop offset="1" stopColor={main?.colore ?? "var(--acc)"} stopOpacity={area === "sotto" ? 0.3 : 0} />
          </linearGradient>
        </defs>
        {fuoriDa !== null && fuoriDa > 0 && fuoriDa < n && (
          <g>
            <rect x={g.x(fuoriDa)} y={PAD.t} width={W - PAD.r - g.x(fuoriDa)} height={H - PAD.t - PAD.b} className="xp-chart__oos" />
            <text x={g.x(fuoriDa) + 8} y={PAD.t + 14} className="xp-chart__oos-t">
              fuori campione
            </text>
          </g>
        )}
        {g.ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={g.y(t)} y2={g.y(t)} className={t === 0 ? "xp-chart__zero" : "xp-chart__grid"} />
            <text x={PAD.l - 8} y={g.y(t) + 4} textAnchor="end" className="xp-chart__tick">
              {fmtAsse(t)}
            </text>
          </g>
        ))}
        {g.anni.map((a) => (
          <text key={a.a} x={g.x(a.i)} y={H - 8} className="xp-chart__tick" textAnchor="start">
            {a.a}
          </text>
        ))}
        {g.areaPath && <path d={g.areaPath} fill={`url(#xp-fill-${titolo.length})`} />}
        {g.paths.map((d, k) => (
          <path
            key={k}
            d={d}
            fill="none"
            stroke={serie[k].colore}
            strokeWidth={k === 0 ? 2.2 : 1.6}
            strokeDasharray={serie[k].tratteggio ? "6 5" : undefined}
            vectorEffect="non-scaling-stroke"
            opacity={k === 0 ? 1 : 0.75}
          />
        ))}
        {hi !== null && (
          <g>
            <line x1={g.x(hi)} x2={g.x(hi)} y1={PAD.t} y2={H - PAD.b} className="xp-chart__cursor" vectorEffect="non-scaling-stroke" />
            {serie.map((s, k) => (
              <circle key={k} cx={g.x(hi)} cy={g.y(s.v[hi])} r={4} fill={s.colore} className="xp-chart__dot" />
            ))}
          </g>
        )}
      </svg>
      <figcaption className="xp-chart__read mono" aria-live="off">
        {hi !== null ? (
          <>
            <span className="xp-chart__when">
              {mesiOp[hi]} · operazione {hi + 1}
            </span>
            {serie.map((s, k) => (
              <span key={k} className="xp-chart__val">
                <i style={{ background: s.colore }} aria-hidden="true" />
                {s.nome} <b>{fmt(s.v[hi])}</b>
              </span>
            ))}
          </>
        ) : (
          <>
            <span className="xp-chart__when">Passa sopra il grafico (o toccalo) per leggere ogni punto</span>
            {serie.map((s, k) => (
              <span key={k} className="xp-chart__val">
                <i style={{ background: s.colore }} aria-hidden="true" />
                {s.nome} <b>{fmt(s.v[s.v.length - 1] ?? 0)}</b>
              </span>
            ))}
          </>
        )}
      </figcaption>
    </figure>
  );
}
