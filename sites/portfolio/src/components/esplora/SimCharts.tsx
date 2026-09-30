"use client";

/**
 * I grafici del simulatore Monte Carlo (SVG, larghezza vera del contenitore).
 *
 * GraficoMC (Davide): alla partenza il grafico SI COSTRUISCE davanti a chi
 * guarda: in qualche secondo le simulazioni avanzano da sinistra a destra fino
 * alla fine, con una testina che porta con se' i valori del 95%, della mediana
 * e del 5%. Finita la costruzione, passando sopra (o toccando) ogni linea mostra
 * il suo valore SUL GRAFICO: etichette accanto alle linee e guide tratteggiate
 * fino all'asse. Fasce 5–95% e 25–75%, mediana, simulazioni intere, storico vero.
 *
 * DisceseChart: la discesa massima di ogni simulazione, con il limite scelto e il 95%.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { int, it } from "@/lib/format";
import { tacche } from "./calc";
import type { Misura, Serie } from "./mc";

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
const eur = (x: number) => `${int(Math.round(x))} €`;

/** valore mostrato: in € (dal capitale iniziale) per le due misure in %, in R per R */
export function formato(misura: Misura, capitale: number) {
  const u = (v: number) => (misura === "R" ? v : capitale * (1 + v / 100));
  const lungo = (v: number) => (misura === "R" ? `${sgn(v, 1)} R` : `${eur(u(v))} · ${sgn(v, 0)}%`);
  /** sull'asse; `corto` (telefono): 35k € invece di 35.000 € */
  const asse = (x: number, corto = false) =>
    misura === "R"
      ? `${sgn(x, 0)} R`
      : x >= 1e6
        ? `${it(x / 1e6, 1)} mln €`
        : corto && Math.abs(x) >= 1000
          ? `${it(x / 1000, x % 1000 ? 1 : 0)}k €`
          : eur(x);
  return { u, lungo, asse };
}

const DURATA = 6500; // ms della costruzione
const LINEE = [
  { k: "p95", t: "95%", forte: false },
  { k: "p75", t: "75%", forte: false },
  { k: "p50", t: "mediana", forte: true },
  { k: "p25", t: "25%", forte: false },
  { k: "p5", t: "5%", forte: false },
] as const;

const annoMesi = (m: number) => {
  const a = Math.floor(m / 12);
  const r = m % 12;
  if (!a) return `${r} ${r === 1 ? "mese" : "mesi"}`;
  return `${a} ${a === 1 ? "anno" : "anni"}${r ? ` e ${r} ${r === 1 ? "mese" : "mesi"}` : ""}`;
};

export function GraficoMC({
  serie,
  misura,
  capitale,
  anni,
  colore,
  onFine,
  salta = false,
}: {
  serie: Serie;
  misura: Misura;
  capitale: number;
  anni: number;
  colore: string;
  onFine?: () => void;
  /** "Salta": la costruzione si mostra gia' finita */
  salta?: boolean;
}) {
  const { ref, W } = useLarghezza<HTMLElement>();
  const narrow = W < 640;
  const H = narrow ? 420 : 560;
  const PL = narrow ? 58 : 84;
  const PR = narrow ? 12 : 170;
  const PT = 34;
  const PB = 46;
  const svg = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  // il componente riparte da zero a ogni simulazione (key={giro} nel genitore)
  const [tCorsa, setT] = useState(() => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0));
  const t = salta ? 1 : tCorsa;
  const P = serie.p50.length;
  const F = useMemo(() => formato(misura, capitale), [misura, capitale]);

  // la costruzione: da 0 a 1 in DURATA ms (subito finita con meno movimento)
  const fine = useRef(onFine);
  useEffect(() => {
    fine.current = onFine;
  }, [onFine]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fine.current?.();
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const passo = (now: number) => {
      const x = Math.min(1, (now - t0) / DURATA);
      // parte svelta e rallenta verso la fine: si vedono le linee "arrivare"
      setT(1 - Math.pow(1 - x, 2.2));
      if (x < 1) raf = requestAnimationFrame(passo);
      else fine.current?.();
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, []);
  const finito = t >= 1;

  const g = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const arr of [serie.p5, serie.p95, serie.storico])
      for (const v of arr) {
        if (!Number.isFinite(v)) continue;
        const u = F.u(v);
        if (u < lo) lo = u;
        if (u > hi) hi = u;
      }
    const base = F.u(0);
    lo = Math.min(lo, base);
    hi = Math.max(hi, base);
    const pad = (hi - lo) * 0.07;
    lo -= pad;
    hi += pad;
    const x = (j: number) => PL + (j / (P - 1)) * (W - PL - PR);
    const y = (v: number) => PT + (1 - (F.u(v) - lo) / (hi - lo)) * (H - PT - PB);
    const yU = (u: number) => PT + (1 - (u - lo) / (hi - lo)) * (H - PT - PB);
    const linea = (a: ArrayLike<number>) => {
      let d = "";
      let su = false;
      for (let j = 0; j < a.length; j++) {
        if (!Number.isFinite(a[j])) {
          su = false;
          continue;
        }
        d += `${su ? "L" : "M"}${x(j).toFixed(1)},${y(a[j]).toFixed(1)}`;
        su = true;
      }
      return d;
    };
    const fascia = (a: Float32Array, b: Float32Array) =>
      linea(b) + Array.from(a, (_, k) => a.length - 1 - k).map((j) => `L${x(j).toFixed(1)},${y(a[j]).toFixed(1)}`).join("") + "Z";
    const anniT: number[] = [];
    for (let a = 1; a <= anni; a++) anniT.push(a);
    return {
      x,
      y,
      yU,
      base,
      b95: fascia(serie.p5, serie.p95),
      b75: fascia(serie.p25, serie.p75),
      linee: Object.fromEntries(LINEE.map((l) => [l.k, linea(serie[l.k])])) as Record<(typeof LINEE)[number]["k"], string>,
      sto: linea(serie.storico),
      camp: serie.campioni.map(linea),
      ticks: tacche(lo, hi, narrow ? 5 : 7),
      anniT,
    };
  }, [serie, W, H, P, anni, narrow, PL, PR, PT, PB, F]);

  const onMove = (e: React.PointerEvent) => {
    if (!finito) return;
    const el = svg.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const j = Math.round(((px - PL) / (W - PL - PR)) * (P - 1));
    setHover(Math.max(0, Math.min(P - 1, j)));
  };

  // la testina durante la costruzione, il cursore dopo
  const jTesta = Math.round(t * (P - 1));
  const j = !finito ? jTesta : (hover ?? P - 1);
  const mostraEtichette = !finito || hover !== null;
  const xClip = PL + t * (W - PL - PR);

  // etichette accanto alle linee, senza sovrapporsi (almeno 19 px fra una e l'altra)
  const etichette = (() => {
    const voci = [
      ...LINEE.filter((l) => finito || l.k === "p95" || l.k === "p50" || l.k === "p5").map((l) => ({
        k: l.k as string,
        t: l.t,
        v: serie[l.k][j],
        forte: l.forte,
        sto: false,
      })),
      ...(finito && Number.isFinite(serie.storico[j]) ? [{ k: "sto", t: "storico", v: serie.storico[j], forte: false, sto: true }] : []),
    ].map((e) => {
      const txt = F.lungo(e.v);
      return { ...e, txt, w: (e.t.length + txt.length + 1) * 7.1 + 18, y0: g.y(e.v), y: g.y(e.v) };
    });
    voci.sort((a, b) => a.y0 - b.y0);
    // sul bordo destro (a fine costruzione) le etichette sono su due righe: piu' spazio fra una e l'altra
    const gap = finito && hover === null ? 31 : 19;
    for (let i = 1; i < voci.length; i++) if (voci[i].y - voci[i - 1].y < gap) voci[i].y = voci[i - 1].y + gap;
    const over = voci.length ? voci[voci.length - 1].y - (H - PB - 6) : 0;
    if (over > 0) for (const v of voci) v.y -= over;
    return voci;
  })();
  const xj = g.x(j);
  const aSinistra = xj > PL + (W - PL - PR) * 0.62;
  // tutte le etichette dallo stesso lato: quello in cui ci sta la piu' larga
  const wMax = Math.max(0, ...etichette.map((e) => e.w));
  const lato = !aSinistra && xj + 10 + wMax <= W - 2 ? "dx" : xj - 10 - wMax >= 2 ? "sx" : "dx";
  const xChip = (w: number) => Math.max(2, Math.min(W - w - 2, lato === "dx" ? xj + 10 : xj - 10 - w));

  return (
    <figure className="xp-chart xp-mc" ref={ref}>
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label={`Simulazioni del capitale per ${anni} anni: a metà dei casi ${F.lungo(serie.p50[P - 1])}, in 5 casi su 100 sotto ${F.lungo(serie.p5[P - 1])}, in 5 su 100 sopra ${F.lungo(serie.p95[P - 1])}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
      >
        <defs>
          <clipPath id="xp-mc-clip">
            <rect x={PL} y={PT - 2} width={Math.max(0, xClip - PL)} height={H - PT - PB + 4} />
          </clipPath>
        </defs>
        {/* griglia e assi */}
        {g.ticks.map((u) => (
          <g key={u}>
            <line x1={PL} x2={W - PR} y1={g.yU(u)} y2={g.yU(u)} className="xp-chart__grid" />
            <text x={PL - 8} y={g.yU(u) + 4} textAnchor="end" className="xp-chart__tick">
              {F.asse(u, narrow)}
            </text>
          </g>
        ))}
        <line x1={PL} x2={W - PR} y1={g.yU(g.base)} y2={g.yU(g.base)} className="xp-chart__zero" />
        {!narrow && (
          <text x={W - PR - 4} y={g.yU(g.base) - 6} textAnchor="end" className="xp-chart__axis">
            {misura === "R" ? "0 R" : `capitale iniziale ${eur(capitale)}`}
          </text>
        )}
        {g.anniT.map((a) => (
          <g key={a}>
            <line x1={g.x(a * 12)} x2={g.x(a * 12)} y1={PT} y2={H - PB} className="xp-chart__grid" />
            <text x={g.x(a * 12)} y={H - PB + 18} textAnchor="middle" className="xp-chart__tick">
              {a === 1 ? "1 anno" : `${a} anni`}
            </text>
          </g>
        ))}
        <text x={PL} y={PT - 14} className="xp-chart__axis">
          ↑ {misura === "R" ? "risultato in R" : "capitale"}
        </text>
        <text x={W - PR} y={H - 6} textAnchor="end" className="xp-chart__axis">
          tempo →
        </text>

        {/* le simulazioni: tutto quello che e' a destra della testina non esiste ancora */}
        <g clipPath="url(#xp-mc-clip)">
          <path d={g.b95} fill={colore} opacity={0.12} />
          <path d={g.b75} fill={colore} opacity={0.2} />
          {g.camp.map((d, k) => (
            <path key={k} d={d} fill="none" stroke={colore} strokeWidth={1} opacity={0.2} />
          ))}
          {LINEE.filter((l) => !l.forte).map((l) => (
            <path key={l.k} d={g.linee[l.k]} fill="none" stroke={colore} strokeWidth={1.2} strokeDasharray="2 4" opacity={0.9} />
          ))}
          <path d={g.sto} fill="none" stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="6 5" opacity={0.85} />
          <path d={g.linee.p50} fill="none" stroke={colore} strokeWidth={3} />
        </g>

        {/* a fine costruzione: le etichette fisse sul bordo destro (solo schermi larghi) */}
        {finito && hover === null && !narrow && (
          <g className="xp-mc__end">
            {etichette.map((e) => (
              <g key={e.k} transform={`translate(${W - PR + 10},${e.y})`}>
                <line x1={-10} x2={-2} y1={e.y0 - e.y} y2={0} stroke={e.sto ? "var(--ink)" : colore} opacity={0.6} />
                <text x={0} y={-3} className={`xp-mc__lt${e.forte ? " is-strong" : ""}`} fill={e.sto ? "var(--ink)" : colore}>
                  {e.t}
                </text>
                <text x={0} y={11} className="xp-mc__lv">
                  {e.txt}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* testina (costruzione) o cursore (dopo): guida verticale, punti, guide orizzontali, etichette */}
        {mostraEtichette && (
          <g className="xp-mc__cur">
            <line x1={xj} x2={xj} y1={PT} y2={H - PB} className={finito ? "xp-chart__cursor" : "xp-mc__head"} stroke={finito ? undefined : colore} />
            <text x={xj} y={PT - 14} textAnchor={aSinistra ? "end" : "start"} dx={aSinistra ? -6 : 6} className="xp-mc__when">
              {j === 0 ? "inizio" : `dopo ${annoMesi(j)}`}
            </text>
            {etichette.map((e) => (
              <g key={e.k}>
                {finito && <line x1={PL} x2={xj} y1={e.y0} y2={e.y0} className="xp-mc__guide" stroke={e.sto ? "var(--ink)" : colore} />}
                <circle cx={xj} cy={e.y0} r={e.forte ? 5 : 3.5} fill={e.sto ? "var(--ink)" : colore} className="xp-chart__dot" />
                <g transform={`translate(${xChip(e.w)},${e.y})`}>
                  <rect
                    x={0}
                    y={-11}
                    width={e.w}
                    height={22}
                    rx={5}
                    className="xp-mc__chip"
                    stroke={e.sto ? "var(--ink)" : colore}
                  />
                  <text x={8} y={4} className={`xp-mc__cv${e.forte ? " is-strong" : ""}`}>
                    <tspan fill={e.sto ? "var(--ink)" : colore}>{e.t}</tspan>
                    <tspan dx={6}>{e.txt}</tspan>
                  </text>
                </g>
              </g>
            ))}
          </g>
        )}
      </svg>
      <figcaption className="xp-chart__read mono" aria-live="off">
        <span className="xp-chart__when">
          {!finito ? `Sto costruendo le simulazioni… ${annoMesi(jTesta)}` : hover === null ? `Alla fine, dopo ${annoMesi(P - 1)}` : `Dopo ${annoMesi(j)}`}
        </span>
        {finito && (
          <>
            <span className="xp-chart__val">
              <i style={{ background: colore, opacity: 0.45 }} aria-hidden="true" />
              95% <b>{F.lungo(serie.p95[j])}</b>
            </span>
            <span className="xp-chart__val">
              <i style={{ background: colore }} aria-hidden="true" />
              mediana <b>{F.lungo(serie.p50[j])}</b>
            </span>
            <span className="xp-chart__val">
              <i style={{ background: colore, opacity: 0.45 }} aria-hidden="true" />
              5% <b>{F.lungo(serie.p5[j])}</b>
            </span>
          </>
        )}
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
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`Discesa massima di ${discese.length} simulazioni: il 95% resta sotto il ${it(p95 * 100, 1)}%`} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}>
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
