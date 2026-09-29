import { annoLabel } from "@/lib/dati";
import { R, it } from "@/lib/format";
import { dominio, yPct } from "./scale";

/**
 * Barre per anno, in R: HTML puro (altezze in percento). Positivo nel colore
 * della strategia, negativo in --bad; il valore sta sul cappello di ogni barra
 * (otto barre: si legge). Il 2026 e' parziale e lo dice.
 */
export function YearBars({ perAnno, colore }: { perAnno: Record<string, number>; colore: string }) {
  const anni = Object.keys(perAnno).sort();
  const dom = dominio(
    anni.map((a) => perAnno[a]),
    { zero: true, pad: 0.16 },
  );
  const base = yPct(0, dom);
  return (
    <div className="chart__body chart__body--bars">
      <div className="chart__y" aria-hidden="true">
        {dom.ticks.map((t) => (
          <span key={t} style={{ top: `${yPct(t, dom)}%` }}>
            {it(t, 0)}
          </span>
        ))}
      </div>
      <div className="chart__plot ybars" style={{ color: colore }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {dom.ticks.map((t) => (
            <line key={t} className={t === 0 ? "chart__zero" : "chart__grid"} x1="0" x2="100" y1={yPct(t, dom)} y2={yPct(t, dom)} />
          ))}
        </svg>
        <ul className="ybars__cols" aria-hidden="true">
          {anni.map((a) => {
            const v = perAnno[a];
            const top = v >= 0 ? yPct(v, dom) : base;
            const h = Math.abs(yPct(v, dom) - base);
            return (
              <li key={a} title={`${annoLabel(a)}: ${R(v)}`}>
                <span className={`ybars__bar${v < 0 ? " is-neg" : ""}`} style={{ top: `${top}%`, height: `${h}%` }} />
                <span className={`ybars__val${v < 0 ? " is-neg" : ""}`} style={{ top: `${v >= 0 ? top : top + h}%` }}>
                  {R(v)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="chart__x chart__x--cols" aria-hidden="true">
        {anni.map((a) => (
          <span key={a}>{a === annoLabel(a) ? a : `${a}*`}</span>
        ))}
      </div>
    </div>
  );
}
