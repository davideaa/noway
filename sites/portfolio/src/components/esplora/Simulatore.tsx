"use client";

/**
 * SIMULATORE MONTE CARLO (Davide). Si sceglie tutto: capitale iniziale,
 * strategia (o tutte e tre, consigliato), discesa massima accettata, anni, e su
 * quali dati simulare. Al clic su "Avvia la simulazione" si apre sotto lo
 * spazio della simulazione e il grafico SI COSTRUISCE davanti a chi guarda (le
 * simulazioni avanzano fino alla fine in qualche secondo); poi si legge
 * passando sopra, con i valori scritti sulle linee. Sotto: gli scenari (5%,
 * mediana, 95%), anno per anno, la discesa di ogni simulazione, i metodi.
 * La misura (rischio composto, fisso, R) e il capitale cambiano la lettura
 * subito, senza rifare la simulazione. Metodo e ipotesi: mc.ts.
 */
import { ArrowLeft, ChevronDown, CircleHelp, FastForward, Info, Play, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Id } from "@/lib/dati";
import type { EsploraData } from "@/lib/esplora";
import { int, it, signed } from "@/lib/format";
import { benchmarkMediane, N, simula, type Esito, type MetodoId, type Misura, type Periodo } from "./mc";
import { DisceseChart, formato, GraficoMC, type Bench } from "./SimCharts";

type Scelta = "tutte" | Id;
type Param = { scelta: Scelta; limite: number; anni: number; periodo: Periodo };
type Run = { e: Esito; p: Param; giro: number; bench: (Bench & { tolto: string | null })[] };
/** i due benchmark, in colori diversi da quelli delle strategie */
const COLORI_BENCH = ["#f3efe2", "#4fd1c5"];

const METODI: Record<MetodoId, { nome: string; cosa: string }> = {
  permutazione: { nome: "Rimescolamento", cosa: "Stesse operazioni, in un ordine diverso: l’ordine è stato fortunato?" },
  bootstrap: { nome: "Ripescaggio", cosa: "Operazioni ripescate a caso, anche due volte la stessa: il campione è stato fortunato?" },
  blocchi: { nome: "Ripescaggio a blocchi", cosa: "Come sopra, ma a blocchi di 20 di fila: le serie di perdite restano intere." },
  rimozione: { nome: "Senza un’operazione su dieci", cosa: "Un tratto vero, in ordine, con un’operazione su dieci tolta: dipende da poche operazioni fortunate?" },
};

const PERIODI: { v: Periodo; t: string; sub: string; tag?: string }[] = [
  {
    v: "senza",
    t: "Scenario prudente",
    sub: "A ogni strategia si toglie il suo anno migliore: il meno ottimista, la base su cui ragionare. Se poi va meglio, tanto meglio.",
    tag: "consigliato",
  },
  { v: "tutto", t: "Tutto, 2019–2026", sub: "Tutte le operazioni, 7 anni e 9 mesi." },
  { v: "dentro", t: "Solo 2019–2023", sub: "Gli anni su cui le strategie sono state ottimizzate: lì i risultati sono gonfiati per costruzione." },
  { v: "fuori", t: "Solo 2024–2026", sub: "Fuori campione: dati mai visti durante l’ottimizzazione. È stato un periodo molto favorevole." },
];
const MISURE: { v: Misura; t: string }[] = [
  { v: "composto", t: "Rischio composto" },
  { v: "fisso", t: "Rischio fisso" },
  { v: "R", t: "In R" },
];
const CAPITALI = [1000, 10000, 50000, 100000];

const pc = (x: number, d = 1) => it(x * 100, d);
const stesso = (a: Param, b: Param) => a.scelta === b.scelta && a.limite === b.limite && a.anni === b.anni && a.periodo === b.periodo;

function Aiuto({ id, label, aperto, onToggle }: { id: string; label: string; aperto: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="xp-help" aria-expanded={aperto} aria-controls={id} aria-label={label} onClick={onToggle}>
      <CircleHelp size={16} strokeWidth={1.8} aria-hidden />
    </button>
  );
}

/**
 * "Spiegazione del risultato" (Davide): perche' i numeri sono un'approssimazione.
 * Simulazione su migliaia di casi (non cio' che e' successo una volta sola), costi
 * che cambiano da broker a broker (ridurre i guadagni di circa il 15–20%),
 * strategie algoritmiche che nel tempo vanno aggiornate o cambiate.
 */
function Spiegazione({ apri, onClose }: { apri: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (apri && !d.open) d.showModal();
    if (!apri && d.open) d.close();
  }, [apri]);
  return (
    <dialog
      ref={ref}
      className="xp-modal"
      aria-labelledby="xp-modal-t"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // clic fuori dal riquadro
      }}
    >
      <div className="xp-modal__in">
        <div className="xp-modal__head">
          <h3 id="xp-modal-t">Come leggere il risultato</h3>
          <button type="button" className="xp-modal__x" onClick={onClose} aria-label="Chiudi la spiegazione">
            <X size={18} aria-hidden />
          </button>
        </div>
        <ol className="xp-modal__list">
          <li>
            <b>È una simulazione, non una previsione.</b> Il simulatore prende le operazioni di backtest delle strategie (2019–2026) e le
            rimescola in migliaia di combinazioni diverse. Non mostra solo quello che è successo una volta, ma la gamma di quello che poteva
            succedere: per questo dice più di un singolo backtest. Resta però un’approssimazione, costruita sul passato.
          </li>
          <li>
            <b>I costi cambiano da broker a broker.</b> Commissioni, spread e costi di mantenimento (swap) dipendono da dove sono depositati i
            soldi, e possono essere più alti o più bassi di quelli del backtest. Per un’idea più realistica conviene ridurre i guadagni finali
            di circa il 15–20%: negli scenari trovi già anche il valore ridotto.
          </li>
          <li>
            <b>Le strategie possono cambiare.</b> Sono strategie algoritmiche: sfruttano un vantaggio statistico verificato sui dati passati e su
            anni mai usati per costruirle, ma nessun vantaggio dura per sempre. Può indebolirsi o sparire, domani come fra un anno o fra cinque.
            Per questo le strategie vengono controllate nel tempo e, quando serve, aggiornate o sostituite; gli eventuali aggiornamenti verranno
            comunicati.
          </li>
          <li>
            <b>Come usarli.</b> Anche se tutto va bene e le strategie mantengono il loro vantaggio, prendi questi numeri come un’indicazione di
            cosa aspettarsi, non come una promessa. Il futuro può andare peggio di ogni simulazione, e si può perdere denaro.
          </li>
        </ol>
        <button type="button" className="xp-go xp-go--sm" onClick={onClose}>
          Ho capito
        </button>
      </div>
    </dialog>
  );
}

export function Simulatore({ data, onBack }: { data: EsploraData; onBack: () => void }) {
  const [capitale, setCapitale] = useState(10000);
  const [capTxt, setCapTxt] = useState("10000");
  const [scelta, setScelta] = useState<Scelta>("tutte");
  const [limite, setLimite] = useState(20);
  const [anni, setAnni] = useState(3);
  const [periodo, setPeriodo] = useState<Periodo>("senza");
  const [misura, setMisura] = useState<Misura>("composto");
  const [aiuto, setAiuto] = useState({ dd: false, misura: false, perche: false });
  const [run, setRun] = useState<Run | null>(null);
  const [stato, setStato] = useState<"fermo" | "calcolo" | "costruzione" | "pronto">("fermo");
  const [avanz, setAvanz] = useState(0);
  const [salta, setSalta] = useState(false);
  const [confronto, setConfronto] = useState(false);
  const [spiega, setSpiega] = useState(false);
  const giro = useRef(0);
  const stage = useRef<HTMLElement>(null);
  const grafico = useRef<HTMLDivElement>(null);

  const param: Param = { scelta, limite, anni, periodo };
  const cambiato = run !== null && !stesso(run.p, param);

  const avvia = async () => {
    const mio = ++giro.current;
    const fermo = () => giro.current !== mio;
    const p = { ...param };
    setStato("calcolo");
    setAvanz(0);
    setSalta(false);
    const on = data.ids.map((id) => p.scelta === "tutte" || p.scelta === id);
    const e = await simula(
      { r: data.r, s: data.s, m: data.m, mesi: data.mesi, on, limite: p.limite / 100, anni: p.anni, periodo: p.periodo, seme: mio },
      (x) => !fermo() && setAvanz(x),
      fermo,
    );
    if (!e || fermo()) return;
    const bench = benchmarkMediane(data.bench.etf, data.mesi, p.periodo, p.anni, mio).map((b, i) => ({
      nome: `Benchmark ${b.nome}`,
      colore: COLORI_BENCH[i] ?? "var(--mut)",
      v: b.v,
      tolto: b.tolto,
    }));
    setRun({ e, p, giro: mio, bench });
    setStato("costruzione");
  };

  // al clic si va allo spazio della simulazione: il grafico si costruisce davanti a chi guarda
  // prima allo spazio (si vede il calcolo), poi al grafico appena comincia a costruirsi
  useEffect(() => {
    if (stato !== "calcolo" && stato !== "costruzione") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = stato === "calcolo" ? stage.current : grafico.current;
    el?.scrollIntoView({ block: stato === "calcolo" ? "start" : "center", behavior: reduced ? "auto" : "smooth" });
  }, [stato]);

  const setCap = (v: number) => {
    const x = Math.min(10_000_000, Math.max(100, Math.round(v)));
    setCapitale(x);
    setCapTxt(String(x));
  };

  const colore = scelta === "tutte" ? "var(--acc)" : data.base[scelta].colore;
  const coloreRun = run ? (run.p.scelta === "tutte" ? "var(--acc)" : data.base[run.p.scelta].colore) : colore;
  const corrMax = Math.max(...data.port.corr.map((c) => Math.abs(c.r)));
  const F = formato(misura, capitale);
  const E = run?.e;
  const S = E?.serie[misura];
  const L = S ? S.p50.length - 1 : 0;
  const medioAnno = (v: number, a: number) =>
    misura === "composto" ? `${signed((Math.pow(Math.max(0, 1 + v / 100), 1 / a) - 1) * 100, 1)}% all’anno` : misura === "fisso" ? `${signed(v / a, 1)}% all’anno` : `${signed(v / a, 1)} R all’anno`;
  // i guadagni ridotti del 15–20% per i costi del broker (Davide); una perdita i costi la peggiorano soltanto
  const netto = (v: number) => {
    if (v <= 0) return "con i costi del broker: un po’ peggio";
    if (misura === "R") return `con i costi del broker: ${signed(v * 0.8, 0)}–${signed(v * 0.85, 0)} R`;
    return `con i costi del broker (−15/20%): ${int(Math.round(F.u(v * 0.8)))}–${int(Math.round(F.u(v * 0.85)))} €`;
  };
  const sopra = E && run ? E.p95 > run.p.limite / 100 + 1e-9 : false;
  const A = E ? E.attese[misura] : { p50: 0, p95: 0, volte: 0, soglia: 10 };
  // in % dal punto piu' alto del conto (non dal capitale iniziale: niente euro, sarebbero sbagliati)
  const ddTxt = (x: number) => (misura === "R" ? `−${it(x, 1)} R` : `−${it(x, 1)}%`);
  const nomeScelta = (s: Scelta) => (s === "tutte" ? "tutte e tre" : data.base[s].nome);

  const opzioni: { v: Scelta; t: string; sub: string; c: string }[] = [
    { v: "tutte", t: "Tutte e tre", sub: "consigliato", c: "var(--acc)" },
    ...data.ids.map((id) => ({ v: id as Scelta, t: data.base[id].nome, sub: data.base[id].tipo, c: data.base[id].colore })),
  ];

  return (
    <article className="xp-view xp-sim" style={{ "--zc": colore } as React.CSSProperties} aria-labelledby="xp-sim-t">
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
          Scegli quanto investire, su cosa, per quanti anni e quanto sei disposto a perdere al massimo. Il simulatore crea migliaia di futuri
          possibili rimescolando le operazioni vere, e ti dice quanto rischiare e cosa aspettarti.
        </p>
      </header>

      {/* ---------------- LE SCELTE ---------------- */}
      <section className="xp-block xp-sim__in" aria-label="Le tue scelte">
        <div className="xp-sim__col">
          <div className="xp-field">
            <label htmlFor="xp-cap" className="xp-seg__l mono">
              1 · Capitale iniziale
            </label>
            <div className="xp-cap">
              <input
                id="xp-cap"
                inputMode="numeric"
                value={capTxt}
                onChange={(e) => {
                  const t = e.target.value.replace(/[^\d]/g, "");
                  setCapTxt(t);
                  if (t) setCapitale(Math.min(10_000_000, Math.max(100, Number(t))));
                }}
                onBlur={() => setCap(capitale)}
                aria-describedby="xp-cap-h"
              />
              <span aria-hidden="true">€</span>
            </div>
            <div className="xp-quick" role="group" aria-label="Capitali veloci">
              {CAPITALI.map((c) => (
                <button key={c} type="button" aria-pressed={capitale === c} onClick={() => setCap(c)}>
                  {int(c)} €
                </button>
              ))}
            </div>
            <p id="xp-cap-h" className="xp-sim__hint">
              Serve per leggere i risultati in euro. Non cambia i rischi: si ragiona in percentuale.
            </p>
          </div>

          <div className="xp-field">
            <p className="xp-seg__l mono" id="xp-sim-q2">
              2 · Su cosa investire
            </p>
            <div className="xp-pick" role="radiogroup" aria-labelledby="xp-sim-q2">
              {opzioni.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={scelta === o.v}
                  className={`xp-pick__o${o.v === "tutte" ? " xp-pick__o--all" : ""}`}
                  style={{ "--cc": o.c } as React.CSSProperties}
                  onClick={() => setScelta(o.v)}
                >
                  <span className="xp-pick__t">
                    <i aria-hidden="true" />
                    {o.t}
                  </span>
                  <small>{o.sub}</small>
                </button>
              ))}
            </div>
            <div className="xp-why">
              <p>
                <b>Consigliato: tutte e tre.</b> Tre mercati e tre modi di lavorare diversi: le perdite di una sono spesso coperte dalle altre.{" "}
                <button type="button" className="xp-more-l" aria-expanded={aiuto.perche} onClick={() => setAiuto((a) => ({ ...a, perche: !a.perche }))}>
                  Perché? <ChevronDown size={14} aria-hidden />
                </button>
              </p>
              {aiuto.perche && (
                <p className="xp-why__more">
                  XAUUSD, Nasdaq e USDJPY sono mercati diversi, e le strategie lavorano in modi diversi (seguire il trend, lo slancio
                  dell’apertura, la rottura). La loro correlazione mensile non supera {it(corrMax, 2)} in valore assoluto, e nello storico tutte e
                  tre in perdita nello stesso mese è successo {data.port.tutteNeg} volte su {data.port.mesiComuni}. Così ognuna rischia un po’ meno
                  che da sola, ma a parità di discesa il conto cresce di più e in modo più regolare. Prova: stesse scelte, prima una strategia
                  sola e poi tutte e tre.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="xp-sim__col">
          <div className="xp-field">
            <div className="xp-sim__lab">
              <label htmlFor="xp-lim" className="xp-seg__l mono">
                3 · Discesa massima che accetti
              </label>
              <Aiuto id="xp-help-dd" label="Che cos’è la discesa massima (drawdown)?" aperto={aiuto.dd} onToggle={() => setAiuto((a) => ({ ...a, dd: !a.dd }))} />
            </div>
            <div className="xp-sim__valrow">
              <output htmlFor="xp-lim" className="xp-sim__val mono">
                {limite}%
              </output>
              <span className="xp-sim__eur mono">= {int(Math.round((capitale * limite) / 100))} € dal punto più alto</span>
            </div>
            <input id="xp-lim" type="range" min={5} max={50} step={1} value={limite} onChange={(e) => setLimite(Number(e.target.value))} />
            <p className="xp-sim__hint">
              La <b>discesa massima</b> (<i>drawdown</i>) è quanto scende il conto dal suo punto più alto prima di risalire.
            </p>
            {aiuto.dd && (
              <p id="xp-help-dd" className="xp-help__t">
                Esempio: il conto arriva a 10.000 € e poi scende fino a 8.000 € prima di risalire: la discesa è del 20%. Qui scegli la discesa
                più grande che sei disposto a sopportare. Il simulatore sceglie i rischi perché in 95 simulazioni su 100 non venga superata
                negli anni scelti. Più è alta, più si rischia a ogni operazione: il conto può crescere di più, ma anche scendere di più.
              </p>
            )}
          </div>

          <div className="xp-field">
            <p className="xp-seg__l mono" id="xp-sim-q4">
              4 · Per quanti anni
            </p>
            <div className="xp-seg__b xp-years-seg" role="radiogroup" aria-labelledby="xp-sim-q4">
              {[1, 2, 3, 4, 5, 6, 7].map((a) => (
                <button key={a} type="button" role="radio" aria-checked={anni === a} onClick={() => setAnni(a)}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="xp-field">
            <p className="xp-seg__l mono" id="xp-sim-q5">
              5 · Scenario (su quali dati)
            </p>
            <div className="xp-periodi" role="radiogroup" aria-labelledby="xp-sim-q5">
              {PERIODI.map((o) => (
                <button key={o.v} type="button" role="radio" aria-checked={periodo === o.v} className="xp-periodo" onClick={() => setPeriodo(o.v)}>
                  <span className="xp-periodo__t">
                    {o.t}
                    {o.tag && <em className="mono">{o.tag}</em>}
                  </span>
                  <small>{o.sub}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="xp-sim__go">
          <div className="xp-sim__gorow">
            <button type="button" className="xp-go" onClick={avvia} disabled={stato === "calcolo"}>
              <Play size={18} strokeWidth={2} aria-hidden />
              {stato === "calcolo" ? `Simulazione in corso… ${Math.round(avanz * 100)}%` : run ? "Avvia di nuovo la simulazione" : "Avvia la simulazione"}
            </button>
            <button type="button" className="xp-explain-b" onClick={() => setSpiega(true)}>
              <Info size={18} strokeWidth={1.8} aria-hidden />
              Spiegazione del risultato
            </button>
          </div>
          <p className="xp-sim__hint mono">
            {N * 4} simulazioni · {nomeScelta(scelta)} · discesa {limite}% · {anni} {anni === 1 ? "anno" : "anni"} · {PERIODI.find((x) => x.v === periodo)?.t.toLowerCase()}
          </p>
        </div>
      </section>

      {/* ---------------- LO SPAZIO DELLA SIMULAZIONE (si apre al clic) ---------------- */}
      {stato !== "fermo" && (
        <section ref={stage} className={`xp-block xp-stage${cambiato ? " is-stale" : ""}`} aria-labelledby="xp-stage-t" style={{ "--zc": coloreRun } as React.CSSProperties}>
          <div className="xp-stage__head">
            <div>
              <h3 id="xp-stage-t" className="xp-block__t">
                {stato === "calcolo" ? "Sto creando i futuri possibili…" : `${N} futuri possibili`}
              </h3>
              {run && (
                <p className="xp-stage__sum mono">
                  {int(capitale)} € · {nomeScelta(run.p.scelta)} · discesa {run.p.limite}% · {run.p.anni} {run.p.anni === 1 ? "anno" : "anni"} ·{" "}
                  {PERIODI.find((x) => x.v === run.p.periodo)?.t.toLowerCase()}
                </p>
              )}
            </div>
            {run && (
              <div className="xp-stage__show">
                <div className="xp-seg" role="group" aria-label="Cosa mostra il grafico">
                  <span className="xp-seg__l mono">Grafico</span>
                  <div className="xp-seg__b">
                    <button type="button" aria-pressed={!confronto || misura === "R"} onClick={() => setConfronto(false)}>
                      Simulazioni
                    </button>
                    <button
                      type="button"
                      aria-pressed={confronto && misura !== "R"}
                      disabled={misura === "R"}
                      title={misura === "R" ? "Il confronto si fa in euro e in percentuale: scegli rischio composto o fisso" : undefined}
                      onClick={() => setConfronto(true)}
                    >
                      Confronto con benchmark
                    </button>
                  </div>
                </div>
                <button type="button" className="xp-explain-b xp-explain-b--sm" onClick={() => setSpiega(true)}>
                  <Info size={15} strokeWidth={1.8} aria-hidden />
                  Spiegazione del risultato
                </button>
                <div className="xp-seg" role="group" aria-label="Come leggere i risultati">
                  <span className="xp-seg__l mono">
                    Mostra
                    <Aiuto id="xp-help-mis" label="Differenza fra rischio composto, fisso e R" aperto={aiuto.misura} onToggle={() => setAiuto((a) => ({ ...a, misura: !a.misura }))} />
                  </span>
                  <div className="xp-seg__b">
                    {MISURE.map((m) => (
                      <button key={m.v} type="button" aria-pressed={misura === m.v} onClick={() => setMisura(m.v)}>
                        {m.t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          {aiuto.misura && run && (
            <div id="xp-help-mis" className="xp-help__t xp-help__t--wide">
              <p>
                <b>Rischio composto</b>: ogni operazione rischia la stessa percentuale del capitale di quel momento. Quando il conto cresce
                crescono anche le operazioni (l’interesse composto): si va più lontano, ma anche le discese pesano di più in euro.
              </p>
              <p>
                <b>Rischio fisso</b>: ogni operazione rischia sempre la stessa cifra, calcolata sul capitale iniziale. Il conto cresce in linea
                retta: più lento, più facile da reggere.
              </p>
              <p>
                <b>In R</b>: il risultato di ogni operazione diviso quanto rischiava (1 R = la perdita se va male). Non dipende né dal capitale
                né dal rischio scelto: è la misura “pura” delle strategie.
              </p>
            </div>
          )}

          {stato === "calcolo" && (
            <div className="xp-stage__wait" aria-live="polite">
              <p className="mono">
                Rimescolo le operazioni in quattro modi e cerco i rischi giusti per la tua discesa… {Math.round(avanz * 100)}%
              </p>
              <div className="xp-prog is-on xp-prog--big" aria-hidden="true">
                <i style={{ transform: `scaleX(${avanz})` }} />
              </div>
            </div>
          )}

          {run && E && S && (
            <>
              {cambiato && (
                <div className="xp-stale" role="status">
                  <span>Hai cambiato le scelte: questa è ancora la simulazione di prima.</span>
                  <button type="button" className="xp-go xp-go--sm" onClick={avvia} disabled={stato === "calcolo"}>
                    <Play size={15} strokeWidth={2} aria-hidden /> Rifai la simulazione
                  </button>
                </div>
              )}

              <ul className="xp-sim__risks xp-sim__risks--row">
                {data.ids.map((id: Id, k: number) =>
                  run.p.scelta === "tutte" || run.p.scelta === id ? (
                    <li key={id} style={{ "--cc": data.base[id].colore } as React.CSSProperties}>
                      <span className="xp-sim__rn">
                        <i aria-hidden="true" />
                        {data.base[id].nome}
                      </span>
                      <b className="mono">{it(E.rischi[k] * 100, 2)}%</b>
                      <small>
                        a operazione{misura !== "R" ? ` · ${int(Math.round(capitale * E.rischi[k]))} €` : ""}
                        <span className="xp-hide-s">
                          {" "}
                          · calcolato {it(E.esatti[k] * 100, 2)}%{E.tolti[k] ? ` · senza il ${E.tolti[k]}` : ""}
                        </span>
                      </small>
                    </li>
                  ) : null,
                )}
              </ul>

              <div className="xp-stage__chart" ref={grafico}>
                <GraficoMC
                  key={`${run.giro}`}
                  serie={S}
                  misura={misura}
                  capitale={capitale}
                  anni={run.p.anni}
                  colore={coloreRun}
                  salta={salta}
                  confronto={confronto && misura !== "R"}
                  bench={run.bench}
                  nome={run.p.scelta === "tutte" ? "Strategie" : data.base[run.p.scelta].nome}
                  onFine={() => setStato((s) => (s === "costruzione" ? "pronto" : s))}
                />
                {stato === "costruzione" && !salta && (
                  <button type="button" className="xp-skip mono" onClick={() => setSalta(true)}>
                    <FastForward size={14} aria-hidden /> Salta
                  </button>
                )}
              </div>
              {confronto && misura !== "R" ? (
                <>
                  <ul className="xp-legend mono" aria-hidden="true">
                    <li>
                      <i style={{ background: coloreRun }} className="is-line" /> mediana delle strategie
                    </li>
                    {run.bench.map((b) => (
                      <li key={b.nome}>
                        <i style={{ background: b.colore }} className="is-line" /> {b.nome}
                      </li>
                    ))}
                  </ul>
                  <p className="xp-sim__hint">
                    Benchmark (indici di riferimento): S&amp;P 500 e Nasdaq-100 simulati con lo stesso metodo, ripescando a blocchi di 3 mesi i
                    loro rendimenti mensili sugli stessi dati scelti
                    {run.p.periodo === "senza"
                      ? `, anche loro senza l’anno migliore (${run.bench.map((b) => `${b.nome.replace("Benchmark ", "")} ${b.tolto}`).join(", ")})`
                      : ""}
                    . Si confrontano le mediane: il caso tipico di ognuno. Gli indici sono senza dividendi e senza costi; le strategie senza i
                    costi del broker.
                  </p>
                </>
              ) : (
                <ul className="xp-legend mono" aria-hidden="true">
                  <li>
                    <i style={{ background: coloreRun, opacity: 0.3 }} /> 90 casi su 100 (dal 5% al 95%)
                  </li>
                  <li>
                    <i style={{ background: coloreRun }} className="is-line" /> mediana (il caso tipico)
                  </li>
                  <li>linee sottili: singole simulazioni</li>
                </ul>
              )}
              {E.anni > E.anniDati + 0.01 && (
                <p className="xp-sim__hint">
                  Stai simulando {E.anni} anni con {it(E.anniDati, 1)} anni di dati: le operazioni vengono ripescate più volte.
                </p>
              )}

              {(stato === "pronto" || salta) && (
                <div className="xp-stage__after">
                  <div className="xp-scen" role="list" aria-label="Scenari alla fine">
                    {(
                      [
                        { k: "p5", t: "Se va male", sub: "5 simulazioni su 100 vanno peggio" },
                        { k: "p50", t: "Caso tipico", sub: "metà vanno meglio, metà peggio" },
                        { k: "p95", t: "Se va bene", sub: "5 simulazioni su 100 vanno meglio" },
                      ] as const
                    ).map((sc) => (
                      <div key={sc.k} role="listitem" className={`xp-scen__c${sc.k === "p50" ? " is-mid" : ""}`}>
                        <span className="xp-seg__l mono">{sc.t}</span>
                        <b className="mono">{misura === "R" ? F.lungo(S[sc.k][L]) : `${int(Math.round(F.u(S[sc.k][L])))} €`}</b>
                        {misura !== "R" && <span className="xp-scen__pct mono">{signed(S[sc.k][L], 0)}% in {run.p.anni} {run.p.anni === 1 ? "anno" : "anni"}</span>}
                        <span className="xp-scen__avg">{medioAnno(S[sc.k][L], run.p.anni)}</span>
                        <span className="xp-scen__net">{netto(S[sc.k][L])}</span>
                        <small>{sc.sub}</small>
                      </div>
                    ))}
                  </div>
                  <p className="xp-sim__hint">
                    Finisce sotto il capitale iniziale: <b>{it(S.perdita * 100, 0)} simulazioni su 100</b>. I risultati sono
                    un’approssimazione:{" "}
                    <button type="button" className="xp-more-l" onClick={() => setSpiega(true)}>
                      leggi perché
                    </button>
                    .
                  </p>

                  <div className="xp-dd-att" role="list" aria-label="Le discese da aspettarsi">
                    <p className="xp-seg__l mono">Le discese da aspettarsi in {run.p.anni} {run.p.anni === 1 ? "anno" : "anni"}</p>
                    <div role="listitem">
                      <b className="mono">{ddTxt(A.p50)}</b>
                      <span>la discesa più grande, di solito</span>
                    </div>
                    <div role="listitem">
                      <b className="mono">{ddTxt(A.p95)}</b>
                      <span>la discesa più grande, in 95 casi su 100 non oltre</span>
                    </div>
                    <div role="listitem">
                      <b className="mono">{it(A.volte, 1)}</b>
                      <span>
                        volte, in media, il conto scende di oltre {misura === "R" ? `${A.soglia} R` : `il ${A.soglia}%`} prima di tornare al suo
                        massimo
                      </span>
                    </div>
                  </div>

                  <div className={`xp-sim__verdict${sopra ? " is-over" : ""}`}>
                    <p>
                      Con questi rischi, <b>in 95 simulazioni su 100 la discesa resta sotto il {pc(E.p95)}%</b>
                      {sopra ? (
                        <>. È un po’ sopra il tuo limite del {run.p.limite}% perché i rischi sono arrotondati per eccesso, a passi dello 0,10%.</>
                      ) : (
                        <>: dentro il tuo limite del {run.p.limite}%.</>
                      )}
                    </p>
                    <p className="t-sec">Nel metodo più severo superano il {run.p.limite}% {it(E.oltre * 100, 0)} simulazioni su 100.</p>
                  </div>

                  {run.p.anni > 1 && (
                    <div className="xp-sim__tab xp-anni-tab" role="table" aria-label="Anno per anno">
                      <div role="row" className="xp-sim__tr xp-sim__th mono">
                        <span role="columnheader">Dopo</span>
                        <span role="columnheader">Se va male (5%)</span>
                        <span role="columnheader">Tipico</span>
                        <span role="columnheader">Se va bene (95%)</span>
                      </div>
                      {Array.from({ length: run.p.anni }, (_, i) => i + 1).map((a) => (
                        <div role="row" key={a} className="xp-sim__tr">
                          <span role="cell">
                            <b>
                              {a} {a === 1 ? "anno" : "anni"}
                            </b>
                          </span>
                          {(["p5", "p50", "p95"] as const).map((k) => (
                            <span role="cell" key={k} className="mono">
                              {F.lungo(S[k][a * 12])}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  <details className="xp-det">
                    <summary>
                      La discesa di ogni simulazione e i quattro metodi <ChevronDown size={16} aria-hidden />
                    </summary>
                    <p className="xp-block__s">
                      Quanto è sceso il conto, al peggio, in ognuna delle {N} simulazioni del metodo più severo ({METODI[E.peggiore].nome.toLowerCase()}), a
                      rischio composto. In rosso quelle oltre il tuo limite.
                    </p>
                    <DisceseChart discese={E.discese} limite={run.p.limite / 100} p95={E.p95} colore={coloreRun} />
                    <div className="xp-sim__tab" role="table" aria-label="La discesa per ogni metodo Monte Carlo">
                      <div role="row" className="xp-sim__tr xp-sim__th mono">
                        <span role="columnheader">Metodo</span>
                        <span role="columnheader">Discesa tipica</span>
                        <span role="columnheader">In 95 casi su 100</span>
                      </div>
                      {E.metodi.map((m) => (
                        <div role="row" key={m.chiave} className={`xp-sim__tr${m.chiave === E.peggiore ? " is-worst" : ""}`}>
                          <span role="cell">
                            <b>{METODI[m.chiave].nome}</b>
                            <small>{METODI[m.chiave].cosa}</small>
                          </span>
                          <span role="cell" className="mono">
                            {pc(m.p50)}%
                          </span>
                          <span role="cell" className="mono">
                            {pc(m.p95)}%{m.chiave === E.peggiore ? " ◂" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="xp-sim__foot mono">
                      ◂ il metodo più severo: è quello che decide i rischi · {int(E.nOrizzonte)} operazioni per simulazione ({E.anni}{" "}
                      {E.anni === 1 ? "anno" : "anni"}) · {int(E.nDati)} operazioni nei dati scelti · {N} simulazioni per metodo
                    </p>
                  </details>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section className="xp-block" aria-labelledby="xp-sim-come">
        <h3 id="xp-sim-come" className="xp-block__t">
          Come funziona
        </h3>
        <div className="xp-explain">
          <div className="xp-ex">
            <h4>Monte Carlo</h4>
            <p>
              Il passato è successo una volta sola, in un ordine solo. Il simulatore lo rimescola in quattro modi diversi e crea migliaia di
              futuri possibili: così si vede quanto poteva andare meglio o peggio, non solo com’è andata.
            </p>
          </div>
          <div className="xp-ex">
            <h4>Il 95%</h4>
            <p>
              Per ogni metodo si guarda la discesa che viene superata solo in 5 simulazioni su 100, e si prende il metodo più severo. I rischi
              sono i più alti che tengono quella discesa entro il tuo limite, negli anni scelti.
            </p>
          </div>
          <div className="xp-ex">
            <h4>Rischi diversi</h4>
            <p>
              Ogni strategia rischia in proporzione inversa alle sue discese: chi scende di più rischia meno. Poi i rischi salgono tutti insieme
              fino al limite, e si arrotondano per eccesso a passi dello 0,10%.
            </p>
          </div>
          <div className="xp-ex">
            <h4>I limiti</h4>
            <p>
              Tutto parte da operazioni di backtest 2019–2026. Sul 2019–2023 le strategie sono state ottimizzate, e il 2024–2026 è stato molto
              favorevole: per questo la scelta iniziale toglie a ognuna il suo anno migliore. Il futuro può andare peggio di ogni simulazione.
            </p>
          </div>
        </div>
      </section>

      <p className="xp-risk">
        <TriangleAlert size={16} strokeWidth={1.6} aria-hidden />
        <span>
          Simulazioni su risultati di backtest su dati storici. Non garantiscono rendimenti futuri né che la discesa resti entro il limite. Il
          trading comporta un alto rischio di perdita.
        </span>
      </p>
      <button type="button" className="xp-back xp-back--end" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden /> Torna a tutte le strategie
      </button>
      <Spiegazione apri={spiega} onClose={() => setSpiega(false)} />
    </article>
  );
}
