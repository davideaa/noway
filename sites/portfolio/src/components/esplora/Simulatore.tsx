"use client";

/**
 * SIMULATORE MONTE CARLO (Davide): chi guarda sceglie la discesa massima che
 * accetta (con il "?" che spiega cos'e'), le strategie da usare e come
 * arrotondare; il simulatore gli dice quanto rischiare su ognuna perche', nel
 * 95% delle simulazioni e con il peggiore dei quattro metodi, la discesa resti
 * entro quel limite. Il calcolo gira in un worker (mc.worker.js, dove sono
 * scritti metodo e ipotesi). Niente rendimenti: Davide non li vuole in vetrina.
 */
import { ArrowLeft, CircleHelp, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Id } from "@/lib/dati";
import type { EsploraData } from "@/lib/esplora";
import { it } from "@/lib/format";

type Metodo = { chiave: string; p50: number; p95: number; oltre: number };
type Esito = {
  id: number;
  esatti: number[];
  rischi: number[];
  metodi: Metodo[];
  p95: number;
  peggiore: string;
  oltre: number;
  storico: number;
  pesiR: number[];
  n: number;
};

const METODI: Record<string, { nome: string; cosa: string }> = {
  permutazione: { nome: "Rimescolamento", cosa: "Stesse operazioni, in un ordine diverso: l’ordine è stato fortunato?" },
  bootstrap: { nome: "Ripescaggio", cosa: "Operazioni ripescate a caso, anche due volte la stessa: il campione è stato fortunato?" },
  blocchi: { nome: "Ripescaggio a blocchi", cosa: "Come sopra, ma a blocchi di 20 di fila: le serie di perdite restano intere." },
  rimozione: { nome: "Senza un’operazione su dieci", cosa: "Tolta a caso un’operazione ogni dieci: dipende da poche operazioni fortunate?" },
};

const pc = (x: number, d = 1) => it(x * 100, d);

export function Simulatore({ data, onBack }: { data: EsploraData; onBack: () => void }) {
  const [limite, setLimite] = useState(20);
  const [on, setOn] = useState<boolean[]>(() => data.ids.map(() => true));
  const [giu, setGiu] = useState(false);
  const [aiuto, setAiuto] = useState(false);
  const [esito, setEsito] = useState<Esito | null>(null);
  const [calcolo, setCalcolo] = useState(true);
  const worker = useRef<Worker | null>(null);
  const ultimo = useRef(0);

  const r = useMemo(() => Float64Array.from(data.r), [data]);
  const s = useMemo(() => Uint8Array.from(data.s), [data]);

  useEffect(() => {
    const w = new Worker(new URL("./mc.worker.js", import.meta.url));
    w.onmessage = (e: MessageEvent<Esito>) => {
      if (e.data.id !== ultimo.current) return; // un risultato vecchio: ne e' gia' partito un altro
      setEsito(e.data);
      setCalcolo(false);
    };
    worker.current = w;
    return () => w.terminate();
  }, []);

  // si ricalcola a ogni scelta, con un attimo di attesa mentre si trascina il cursore
  useEffect(() => {
    const t = window.setTimeout(() => {
      const w = worker.current;
      if (!w) return;
      const id = ++ultimo.current;
      setCalcolo(true);
      w.postMessage({ id, r, s, on, limite: limite / 100, giu });
    }, 220);
    return () => window.clearTimeout(t);
  }, [r, s, on, limite, giu]);

  const toggle = (k: number) =>
    setOn((l) => (l[k] && l.filter(Boolean).length === 1 ? l : l.map((x, i) => (i === k ? !x : x))));

  const sopra = esito ? esito.p95 > limite / 100 + 1e-9 : false;

  return (
    <article className="xp-view xp-sim" style={{ "--zc": "var(--acc)" } as React.CSSProperties} aria-labelledby="xp-sim-t">
      <div className="xp-view__top">
        <button type="button" className="xp-back" onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={1.8} aria-hidden /> Tutte le strategie
        </button>
        <span className="xp-tag mono">Simulazione Monte Carlo · dati di backtest</span>
      </div>

      <header className="xp-view__head">
        <h2 id="xp-sim-t" className="xp-view__name">
          <span className="xp-dot" aria-hidden="true" />
          Simulatore Monte Carlo
        </h2>
        <p className="xp-view__frase">
          Scegli quanto sei disposto a perdere al massimo. Il simulatore rimescola migliaia di volte le operazioni delle strategie e ti
          dice quanto rischiare su ciascuna perché, in 95 casi su 100, la discesa resti entro quel limite.
        </p>
      </header>

      <section className="xp-block xp-sim__in" aria-label="Le tue scelte">
        <div className="xp-sim__lim">
          <div className="xp-sim__lab">
            <label htmlFor="xp-lim" className="xp-seg__l mono">
              Discesa massima che accetti
            </label>
            <button
              type="button"
              className="xp-help"
              aria-expanded={aiuto}
              aria-controls="xp-help-dd"
              aria-label="Che cos’è la discesa massima (drawdown)?"
              onClick={() => setAiuto((a) => !a)}
            >
              <CircleHelp size={16} strokeWidth={1.8} aria-hidden />
            </button>
          </div>
          <output htmlFor="xp-lim" className="xp-sim__val mono">
            {limite}%
          </output>
          <input
            id="xp-lim"
            type="range"
            min={5}
            max={50}
            step={1}
            value={limite}
            onChange={(e) => setLimite(Number(e.target.value))}
            aria-describedby={aiuto ? "xp-help-dd" : undefined}
          />
          <div className="xp-sim__scale mono" aria-hidden="true">
            <span>5%</span>
            <span>50%</span>
          </div>
          {aiuto && (
            <p id="xp-help-dd" className="xp-help__t">
              <b>Discesa massima (in inglese drawdown)</b>: quanto scende il conto dal suo punto più alto prima di tornare a salire. Se
              il conto arriva a 10.000 € e poi scende a 8.000 €, la discesa è del 20%. Qui scegli la discesa più grande che sei
              disposto a sopportare se investi in queste strategie.
            </p>
          )}
        </div>

        <div className="xp-sim__opts">
          <div className="xp-chips" role="group" aria-label="Strategie da usare">
            <span className="xp-seg__l mono">Strategie</span>
            {data.ids.map((id: Id, k: number) => (
              <button
                key={id}
                type="button"
                className="xp-chip"
                aria-pressed={on[k]}
                style={{ "--cc": data.base[id].colore } as React.CSSProperties}
                onClick={() => toggle(k)}
              >
                <i aria-hidden="true" />
                {data.base[id].nome}
              </button>
            ))}
          </div>
          <div className="xp-seg" role="group" aria-label="Arrotondamento del rischio">
            <span className="xp-seg__l mono">Arrotondamento</span>
            <div className="xp-seg__b">
              <button type="button" aria-pressed={!giu} onClick={() => setGiu(false)}>
                Per eccesso
              </button>
              <button type="button" aria-pressed={giu} onClick={() => setGiu(true)}>
                Per difetto
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={`xp-block xp-sim__out${calcolo ? " is-busy" : ""}`} aria-live="polite" aria-busy={calcolo}>
        <h3 className="xp-block__t">Quanto rischiare su ogni operazione</h3>
        {!esito ? (
          <p className="xp-sim__wait mono">Calcolo in corso…</p>
        ) : (
          <>
            <ul className="xp-sim__risks">
              {data.ids.map((id: Id, k: number) =>
                on[k] ? (
                  <li key={id} style={{ "--cc": data.base[id].colore } as React.CSSProperties}>
                    <span className="xp-sim__rn">
                      <i aria-hidden="true" />
                      {data.base[id].nome}
                    </span>
                    <b className="mono">{it(esito.rischi[k] * 100, 2)}%</b>
                    <small>
                      del capitale a operazione · calcolato {it(esito.esatti[k] * 100, 2)}%
                    </small>
                  </li>
                ) : null,
              )}
            </ul>

            <div className={`xp-sim__verdict${sopra ? " is-over" : ""}`}>
              <p>
                Con questi rischi, <b>in 95 simulazioni su 100 la discesa resta sotto il {pc(esito.p95)}%</b>
                {sopra ? (
                  <>
                    : <b>un po’ sopra il tuo limite del {limite}%</b>, perché l’arrotondamento per eccesso alza il rischio. Con
                    “Per difetto” resti sotto.
                  </>
                ) : (
                  <>, dentro il tuo limite del {limite}%.</>
                )}
              </p>
              <p className="t-sec">
                Nel metodo più severo superano il tuo limite {it(esito.oltre * 100, 0)} simulazioni su 100. Nello storico vero, in
                ordine, con questi rischi la discesa più grande è stata del {pc(esito.storico)}%.
              </p>
            </div>

            <div className="xp-sim__tab" role="table" aria-label="La discesa per ogni metodo Monte Carlo">
              <div role="row" className="xp-sim__tr xp-sim__th mono">
                <span role="columnheader">Metodo</span>
                <span role="columnheader">Discesa tipica</span>
                <span role="columnheader">In 95 casi su 100</span>
              </div>
              {esito.metodi.map((m) => (
                <div role="row" key={m.chiave} className={`xp-sim__tr${m.chiave === esito.peggiore ? " is-worst" : ""}`}>
                  <span role="cell">
                    <b>{METODI[m.chiave].nome}</b>
                    <small>{METODI[m.chiave].cosa}</small>
                  </span>
                  <span role="cell" className="mono">
                    {pc(m.p50)}%
                  </span>
                  <span role="cell" className="mono">
                    {pc(m.p95)}%{m.chiave === esito.peggiore ? " ◂" : ""}
                  </span>
                </div>
              ))}
            </div>
            <p className="xp-sim__foot mono">
              ◂ il metodo più severo: è quello che decide i rischi · {it(esito.n, 0)} operazioni per simulazione, 500 simulazioni per
              metodo
            </p>
          </>
        )}
      </section>

      <section className="xp-block" aria-labelledby="xp-sim-come">
        <h3 id="xp-sim-come" className="xp-block__t">
          Come funziona
        </h3>
        <div className="xp-explain">
          <div className="xp-ex">
            <h4>Monte Carlo</h4>
            <p>
              Il passato è successo una volta sola, in un ordine solo. Il simulatore lo rimescola in quattro modi diversi (la tabella
              sopra) e ogni volta misura la discesa più grande: così si vede quanto poteva andare peggio, non solo com’è andata.
            </p>
          </div>
          <div className="xp-ex">
            <h4>Il 95%</h4>
            <p>
              Per ogni metodo si guarda la discesa che viene superata solo in 5 simulazioni su 100, e si prende il metodo più severo. I
              rischi sono i più alti che tengono quella discesa entro il tuo limite.
            </p>
          </div>
          <div className="xp-ex">
            <h4>Rischi diversi</h4>
            <p>
              Ogni strategia rischia in proporzione inversa alle sue discese: chi scende di più rischia meno. Poi i rischi salgono o
              scendono tutti insieme fino al limite, e si arrotondano a passi di 0,10%.
            </p>
          </div>
          <div className="xp-ex">
            <h4>I limiti</h4>
            <p>
              Tutto parte da operazioni di backtest del 2019–2026, su un periodo lungo come lo storico. Il futuro può andare peggio di
              ogni simulazione: il limite scelto non è una garanzia.
            </p>
          </div>
        </div>
      </section>

      <p className="xp-risk">
        <TriangleAlert size={16} strokeWidth={1.6} aria-hidden />
        <span>
          Simulazioni su risultati di backtest su dati storici. Non garantiscono rendimenti futuri né che la discesa resti entro il
          limite. Il trading comporta un alto rischio di perdita.
        </span>
      </p>
      <button type="button" className="xp-back xp-back--end" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden /> Torna a tutte le strategie
      </button>
    </article>
  );
}
