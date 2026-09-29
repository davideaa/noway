import type { CSSProperties } from "react";
import { it } from "@/lib/format";
import { dominio, pathArea, pathLinea, semplifica, xPct, yPct, type Dominio } from "./scale";

/**
 * Grafico a linee disegnato in build. Le forme stanno in un SVG con
 * preserveAspectRatio="none" (coordinate in percento, tratto non scalato), le
 * scritte sono HTML posizionato in percento: cosi' un solo disegno resta
 * leggibile da 390 a 1440 px senza rimpicciolire il testo.
 */
export type Serie = {
  id: string;
  /** punti [x, y] in unita' dati */
  punti: [number, number][];
  colore: string;
  larghezza?: number;
  opacita?: number;
  tratteggio?: boolean;
  /** riempimento fino allo zero (ombra al 12%) */
  area?: boolean;
  /** etichetta sull'ultimo punto */
  fine?: string;
};

export type Tacca = { x: number; label: string };
export type Regione = { da: number; a: number; label?: string };
/** `breve` sostituisce `label` sotto i 600 px; `basso` mette l'etichetta in fondo al disegno */
export type Marcatore = { x: number; label?: string; breve?: string; riga?: 0 | 1; basso?: boolean };
export type Etichetta = { x: number; y: number; testo: string; colore?: string; sotto?: boolean };

export function LineChart({
  serie,
  xMax,
  xTicks,
  zero = true,
  regioni = [],
  marcatori = [],
  yDominio,
  yFormat = (v) => it(v, 0),
  altezza,
  className,
  xClass,
  etichette = [],
}: {
  serie: Serie[];
  xMax: number;
  xTicks: Tacca[];
  zero?: boolean;
  regioni?: Regione[];
  marcatori?: Marcatore[];
  yDominio?: Dominio;
  yFormat?: (v: number) => string;
  altezza?: number;
  className?: string;
  /** classe della riga delle tacche x (es. chart__x--anni: un anno si' e uno no sotto i 600 px) */
  xClass?: string;
  /** etichette puntuali (es. il punto di drawdown massimo) */
  etichette?: Etichetta[];
}) {
  const tutti = serie.flatMap((s) => s.punti.map((p) => p[1]));
  const dom = yDominio ?? dominio(tutti, { zero });
  const y0 = yPct(0, dom);
  const style = altezza ? ({ "--chart-h": `${altezza}px` } as CSSProperties) : undefined;

  return (
    <div className={`chart__body${className ? ` ${className}` : ""}`} style={style}>
      <div className="chart__y" aria-hidden="true">
        {dom.ticks.map((t) => (
          <span key={t} style={{ top: `${yPct(t, dom)}%` }}>
            {yFormat(t)}
          </span>
        ))}
      </div>
      <div className="chart__plot">
        {regioni.map((r, i) => (
          <span
            key={i}
            className="chart__region"
            style={{ left: `${xPct(r.da, xMax)}%`, width: `${xPct(r.a, xMax) - xPct(r.da, xMax)}%` }}
            aria-hidden="true"
          />
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {dom.ticks.map((t) => (
            <line key={t} className={t === 0 ? "chart__zero" : "chart__grid"} x1="0" x2="100" y1={yPct(t, dom)} y2={yPct(t, dom)} />
          ))}
          {marcatori.map((m, i) => (
            <line key={i} className="chart__marker" x1={xPct(m.x, xMax)} x2={xPct(m.x, xMax)} y1="0" y2="100" />
          ))}
          {serie.map((s) => {
            const pts = semplifica(s.punti.map(([x, y]) => [xPct(x, xMax), yPct(y, dom)] as [number, number]));
            return (
              <g key={s.id} style={{ color: s.colore }} opacity={s.opacita ?? 1}>
                {s.area && <path d={pathArea(pts, y0)} fill="currentColor" fillOpacity="0.12" stroke="none" />}
                <path
                  d={pathLinea(pts)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={s.larghezza ?? 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={s.tratteggio ? "6 4" : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
        {marcatori.map(
          (m, i) =>
            m.label && (
              <span
                key={i}
                className={`chart__marker-label chart__marker-label--r${m.riga ?? 0}${xPct(m.x, xMax) > 55 ? " is-right" : " is-left"}${m.basso ? " is-basso" : ""}`}
                style={{ left: `${xPct(m.x, xMax)}%` }}
                aria-hidden="true"
              >
                {m.breve ? (
                  <>
                    <span className="chart__lungo">{m.label}</span>
                    <span className="chart__breve">{m.breve}</span>
                  </>
                ) : (
                  m.label
                )}
              </span>
            ),
        )}
        {regioni.map(
          (r, i) =>
            r.label && (
              <span key={i} className="chart__region-label" style={{ left: `${xPct(r.da, xMax)}%` }} aria-hidden="true">
                {r.label}
              </span>
            ),
        )}
        {etichette.map((e, i) => (
          <span
            key={i}
            className={`chart__end chart__end--pt${e.sotto ? " is-sotto" : ""}`}
            style={{ left: `${xPct(e.x, xMax)}%`, top: `${yPct(e.y, dom)}%`, borderColor: e.colore ?? "var(--line3)" }}
            aria-hidden="true"
          >
            {e.testo}
          </span>
        ))}
        {serie.map((s) => {
          if (!s.fine || !s.punti.length) return null;
          const [x, y] = s.punti[s.punti.length - 1];
          return (
            <span
              key={s.id}
              className="chart__end"
              style={{ left: `${xPct(x, xMax)}%`, top: `${yPct(y, dom)}%`, borderColor: s.colore }}
              aria-hidden="true"
            >
              {s.fine}
            </span>
          );
        })}
      </div>
      <div className={`chart__x${xClass ? ` ${xClass}` : ""}`} aria-hidden="true">
        {xTicks.map((t) => {
          const x = xPct(t.x, xMax);
          const cls = x < 4 ? " is-first" : x > 96 ? " is-last" : "";
          return (
            <span key={`${t.x}-${t.label}`} className={`chart__xtick${cls}`} style={{ left: `${x}%` }}>
              {t.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
