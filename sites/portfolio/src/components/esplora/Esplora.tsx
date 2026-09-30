"use client";

/**
 * /dettagli come "selezione del personaggio" (Davide): quattro schede (Oro,
 * Nasdaq, USDJPY, Portafoglio). Col mouse sopra la scheda VIENE AVANTI (in
 * profondita', si inclina verso il puntatore e si illumina) e le altre
 * arretrano; al clic si stacca verso chi guarda e si apre la sua pagina, SOLO di
 * quella strategia, al posto di tutto il resto (non si scorre giu' a una
 * sezione). "Tutte le strategie" o il tasto indietro del browser tornano qui.
 * L'indirizzo porta #oro, #nasdaq, #usdjpy, #portafoglio: un link porta dritto
 * alla scheda giusta. Nella pagina di una strategia il fluido al mouse prende
 * il suo colore (oro ambra, Nasdaq blu, USDJPY viola; portafoglio verde).
 */
import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Id } from "@/lib/dati";
import type { EsploraData } from "@/lib/esplora";
import { it, signed } from "@/lib/format";
import { setFluidTint } from "@/components/motion/FluidCursor";
import { curva, statistiche, totale } from "./calc";
import { Vista } from "./Vista";

type Chi = Id | "port";
const HASH: Record<Chi, string> = { oro: "oro", nasdaq: "nasdaq", usdjpy: "usdjpy", port: "portafoglio" };
const daHash = (h: string): Chi | null => {
  const k = h.replace(/^#/, "");
  return (Object.keys(HASH) as Chi[]).find((c) => HASH[c] === k) ?? null;
};

function Mini({ v, colore }: { v: number[]; colore: string }) {
  const d = useMemo(() => {
    if (!v.length) return "";
    const step = Math.max(1, Math.floor(v.length / 120));
    const pts: number[] = [];
    for (let i = 0; i < v.length; i += step) pts.push(v[i]);
    pts.push(v[v.length - 1]);
    const lo = Math.min(0, ...pts);
    const hi = Math.max(...pts, lo + 1);
    return pts
      .map((y, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * 200).toFixed(1)},${(56 - ((y - lo) / (hi - lo)) * 52).toFixed(1)}`)
      .join("");
  }, [v]);
  return (
    <svg className="xp-mini" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
      <path d={d + "L200,60L0,60Z"} fill={colore} opacity="0.14" />
      <path d={d} fill="none" stroke={colore} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Scheda({
  chi,
  data,
  onPick,
  picking,
}: {
  chi: Chi;
  data: EsploraData;
  onPick: (c: Chi, el: HTMLElement) => void;
  picking: Chi | null;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const port = chi === "port";
  const colore = port ? "var(--acc)" : data.base[chi].colore;
  const r = useMemo(() => {
    if (port) return data.r;
    const k = data.ids.indexOf(chi);
    return data.r.filter((_, i) => data.s[i] === k);
  }, [data, chi, port]);
  const c = useMemo(() => curva(r, "composto", 0.01), [r]);
  const st = useMemo(() => statistiche(r), [r]);
  const comp = useMemo(() => totale(r, "composto", 0.01), [r]);
  const dd = useMemo(() => Math.min(...curva(r, "R", 0.01).dd), [r]);

  // inclinazione verso il puntatore (solo mouse): --rx / --ry in gradi, --gx / --gy per la luce
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width;
    const y = (e.clientY - b.top) / b.height;
    el.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  const nome = port ? "Portafoglio" : data.base[chi].nome;
  return (
    <button
      ref={ref}
      type="button"
      className={`xp-card${port ? " xp-card--port" : ""}${picking === chi ? " is-picked" : ""}${picking && picking !== chi ? " is-away" : ""}`}
      style={{ "--zc": colore } as React.CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={() => ref.current && onPick(chi, ref.current)}
      aria-label={`Apri ${nome}: ${signed(comp, 0)}% a rischio composto dell’1%, ${st.n} operazioni`}
    >
      <span className="xp-card__glow" aria-hidden="true" />
      <span className="xp-card__head">
        <span className="xp-card__name">
          <span className="xp-dot" aria-hidden="true" />
          {nome}
        </span>
        <span className="xp-card__mkt mono">{port ? "3 strategie" : data.base[chi].mercato}</span>
      </span>
      <span className="xp-card__tipo">{port ? "XAUUSD, Nasdaq e USDJPY insieme" : data.base[chi].tipo}</span>
      <Mini v={c.v} colore={colore} />
      <span className="xp-card__nums">
        <span>
          <b className="mono">{signed(comp, 0)}%</b>
          <small>rischio composto 1%</small>
        </span>
        <span>
          <b className="mono">{it(st.vinte, 0)}%</b>
          <small>operazioni vinte</small>
        </span>
        <span>
          <b className="mono">{it(dd, 1)} R</b>
          <small>discesa massima</small>
        </span>
      </span>
      <span className="xp-card__go">
        Scopri i risultati <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden />
      </span>
    </button>
  );
}

export function Esplora({ data, hero, rest }: { data: EsploraData; hero: ReactNode; rest: ReactNode }) {
  const [sel, setSel] = useState<Chi | null>(null);
  const [picking, setPicking] = useState<Chi | null>(null);
  const reduced = useRef(false);
  const tornando = useRef(false);
  // un'ancora della pagina (#avviso, #contatti) chiesta da dentro una scheda: ci si va dopo averla chiusa
  const vaiA = useRef<string | null>(null);

  // l'indirizzo decide la vista: #oro apre l'oro, niente (o altro) torna alle schede
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sync = (daEvento: boolean) => {
      const c = daHash(window.location.hash);
      setSel((prima) => {
        // si torna alle schede solo se prima c'era una scheda aperta (tasto indietro del browser)
        if (daEvento && !c && prima) {
          const h = window.location.hash.replace(/^#/, "");
          if (h && document.getElementById(h)) vaiA.current = h;
          else tornando.current = true;
        }
        return c;
      });
      setPicking(null);
    };
    sync(false);
    const onHash = () => sync(true);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // ogni cambio di vista riparte dall'alto (la vista e' una "pagina nuova");
  // tornando indietro si riparte dalle schede, non dall'intestazione
  useEffect(() => {
    if (sel) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    else if (vaiA.current) {
      const h = vaiA.current;
      vaiA.current = null;
      requestAnimationFrame(() => document.getElementById(h)?.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior }));
    } else if (tornando.current) {
      tornando.current = false;
      requestAnimationFrame(() =>
        document.getElementById("esplora")?.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior }),
      );
    }
  }, [sel]);

  // il fluido al mouse prende il colore della strategia aperta (portafoglio e schede: verde del sito)
  useEffect(() => {
    setFluidTint(sel === "oro" || sel === "nasdaq" || sel === "usdjpy" ? sel : "sito");
  }, [sel]);
  useEffect(() => () => setFluidTint("sito"), []);

  const pushed = useRef(false);
  const pick = useCallback((c: Chi) => {
    setPicking(c);
    window.setTimeout(
      () => {
        pushed.current = true;
        window.location.hash = HASH[c];
      },
      reduced.current ? 0 : 520,
    );
  }, []);

  const back = useCallback(() => {
    tornando.current = true;
    // arrivati dalla griglia: si torna indietro nella cronologia (come il tasto del browser);
    // arrivati da un link diretto (#oro): si pulisce l'indirizzo
    if (pushed.current) {
      pushed.current = false;
      history.back();
    } else {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      setSel(null);
    }
  }, []);

  return (
    <>
      <div hidden={sel !== null}>{hero}</div>
      {sel === null ? (
        <section id="esplora" data-scene className="scene xp" aria-labelledby="esplora-t">
          <div className="wrap">
            <p className="eyebrow">
              <b>02</b> &mdash; Le strategie
            </p>
            <h2 id="esplora-t" className="t-scene mt-4">
              <span>Scegline una.</span>
              <span>Guarda solo i suoi risultati.</span>
            </h2>
            <div className="xp-grid" data-picking={picking ? "1" : undefined}>
              {(["oro", "nasdaq", "usdjpy", "port"] as Chi[]).map((c) => (
                <Scheda key={c} chi={c} data={data} onPick={pick} picking={picking} />
              ))}
            </div>
            <p className="xp-hint mono">Backtest 2019–2026 · 4.206 operazioni · passa sopra una scheda e cliccala</p>
          </div>
        </section>
      ) : (
        <div className="wrap xp-view-wrap">
          <Vista key={sel} data={data} chi={sel} onBack={back} />
        </div>
      )}
      <div hidden={sel !== null}>{rest}</div>
    </>
  );
}
