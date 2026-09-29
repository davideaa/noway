import type { Bootstrap } from "@/lib/dati";
import { it } from "@/lib/format";
import { niceTicks } from "./scale";

/**
 * Distribuzione del drawdown massimo dal bootstrap a blocchi: barre da 1 R in
 * SVG (preserveAspectRatio none), percentili e drawdown storico come righe
 * verticali con etichetta HTML. Asse verticale in percento dei campioni.
 */
export function Histogram({ b, colore }: { b: Bootstrap; colore: string }) {
  const c = b.istogramma.conteggi;
  const tetto = b.istogramma.da + c.length * b.istogramma.passo;
  const maxc = Math.max(...c) || 1;
  const maxPct = (maxc / b.campioni) * 100;
  const yTicks = niceTicks(0, maxPct, 4);
  const yTop = yTicks[yTicks.length - 1];
  const xTicks = niceTicks(0, tetto, 6).filter((t) => t <= tetto);
  const xp = (v: number) => (v / tetto) * 100;
  const w = 100 / c.length;
  const gap = Math.min(0.35, w * 0.18);
  // due righe alternate: cosi' 90° e 95°, spesso vicini, non si coprono nemmeno a 390 px
  const perc: { k: string; v: number; riga: number }[] = [
    { k: "50°", v: b.p50, riga: 0 },
    { k: "90°", v: b.p90, riga: 1 },
    { k: "95°", v: b.p95, riga: 0 },
    { k: "99°", v: b.p99, riga: 1 },
  ];
  return (
    <div className="chart__body chart__body--hist">
      <div className="chart__y" aria-hidden="true">
        {yTicks.map((t) => (
          <span key={t} style={{ top: `${100 - (t / yTop) * 100}%` }}>
            {it(t, 0)}%
          </span>
        ))}
      </div>
      <div className="chart__plot" style={{ color: colore }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {yTicks.map((t) => (
            <line key={t} className={t === 0 ? "chart__zero" : "chart__grid"} x1="0" x2="100" y1={100 - (t / yTop) * 100} y2={100 - (t / yTop) * 100} />
          ))}
          {c.map((n, i) => {
            if (!n) return null;
            const h = ((n / b.campioni) * 100 * 100) / yTop;
            return <rect key={i} x={i * w + gap / 2} y={100 - h} width={w - gap} height={h} fill="var(--mut)" fillOpacity="0.55" />;
          })}
          {perc.map((p) => (
            <line key={p.k} className="chart__marker" x1={xp(p.v)} x2={xp(p.v)} y1="0" y2="100" />
          ))}
          <line className="chart__hist-storico" x1={xp(b.storico)} x2={xp(b.storico)} y1="0" y2="100" />
        </svg>
        {perc.map((p) => (
          <span key={p.k} className={`chart__marker-label chart__marker-label--r${p.riga}`} style={{ left: `${xp(p.v)}%` }} aria-hidden="true">
            {p.k} {it(p.v, 0)}
          </span>
        ))}
        <span className="chart__end chart__end--hist" style={{ left: `${xp(b.storico)}%`, borderColor: colore }} aria-hidden="true">
          backtest {it(b.storico, 1)}
        </span>
      </div>
      <div className="chart__x chart__x--anni" aria-hidden="true">
        {xTicks.map((t, i) => {
          const x = xp(t);
          const cls = x < 4 ? " is-first" : x > 96 ? " is-last" : "";
          return (
            <span key={t} className={`chart__xtick${cls}`} style={{ left: `${x}%` }}>
              {it(t, 0)}
              {i === xTicks.length - 1 ? " R" : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}
