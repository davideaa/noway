"use client";

/**
 * SIMULATORE MONTE CARLO (Davide): chi guarda sceglie la strategia (o tutte e
 * tre insieme, consigliato) e la discesa massima che accetta; il simulatore
 * trova quanto rischiare su ciascuna perche', in 95 simulazioni su 100 e con il
 * piu' severo dei quattro metodi, la discesa resti entro quel limite (rischi
 * arrotondati per eccesso a passi dello 0,10%). Mostra il ventaglio delle
 * simulazioni (fasce 5–95% e 25–75%, mediana, storico vero), l'istogramma
 * delle discese e la tabella dei metodi. Si ricalcola a ogni scelta; "Avvia la
 * simulazione" rifa' tutto con estrazioni nuove. Metodo e ipotesi: mc.ts.
 */
import { ArrowLeft, CircleHelp, Play, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Id } from "@/lib/dati";
import type { EsploraData } from "@/lib/esplora";
import { it, signed } from "@/lib/format";
import { N, simula, type Esito, type MetodoId } from "./mc";
import { DisceseChart, VentaglioChart } from "./SimCharts";

type Scelta = "tutte" | Id;

const METODI: Record<MetodoId, { nome: string; cosa: string }> = {
  permutazione: { nome: "Rimescolamento", cosa: "Stesse operazioni, in un ordine diverso: l’ordine è stato fortunato?" },
  bootstrap: { nome: "Ripescaggio", cosa: "Operazioni ripescate a caso, anche due volte la stessa: il campione è stato fortunato?" },
  blocchi: { nome: "Ripescaggio a blocchi", cosa: "Come sopra, ma a blocchi di 20 di fila: le serie di perdite restano intere." },
  rimozione: { nome: "Senza un’operazione su dieci", cosa: "Tolta a caso un’operazione ogni dieci: dipende da poche operazioni fortunate?" },
};

const pc = (x: number, d = 1) => it(x * 100, d);

export function Simulatore({ data, onBack }: { data: EsploraData; onBack: () => void }) {
  const [scelta, setScelta] = useState<Scelta>("tutte");
  const [limite, setLimite] = useState(20);
  const [aiuto, setAiuto] = useState(false);
  const [seme, setSeme] = useState(1);
  const [esito, setEsito] = useState<{ e: Esito; scelta: Scelta; limite: number; giro: number } | null>(null);
  const [avanz, setAvanz] = useState(0);
  const [calcolo, setCalcolo] = useState(true);
  const giro = useRef(0);

  // a ogni scelta si ricalcola (un attimo di attesa mentre si trascina il cursore);
  // un calcolo nuovo fa abbandonare quello vecchio
  useEffect(() => {
    const mio = ++giro.current;
    const fermo = () => giro.current !== mio;
    const on = data.ids.map((id) => scelta === "tutte" || scelta === id);
    const t = window.setTimeout(async () => {
      setCalcolo(true);
      setAvanz(0);
      const e = await simula({ r: data.r, s: data.s, on, limite: limite / 100, seme }, (x) => !fermo() && setAvanz(x), fermo);
      if (!e || fermo()) return;
      setEsito({ e, scelta, limite, giro: mio });
      setCalcolo(false);
    }, 250);
    return () => window.clearTimeout(t);
  }, [data, scelta, limite, seme]);

  const colore = scelta === "tutte" ? "var(--acc)" : data.base[scelta].colore;
  const anni = data.mesi.length / 12;
  const E = esito?.e;
  const sopra = E && esito ? E.p95 > esito.limite / 100 + 1e-9 : false;
  const corrMax = Math.max(...data.port.corr.map((c) => Math.abs(c.r)));

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
          Scegli la strategia e quanto sei disposto a perdere al massimo. Il simulatore rimescola migliaia di volte le operazioni e ti dice
          quanto rischiare su ognuna perché, in 95 casi su 100, la discesa resti entro quel limite.
        </p>
      </header>

      <section className="xp-block xp-sim__in" aria-label="Le tue scelte">
        <div className="xp-sim__col">
          <p className="xp-seg__l mono" id="xp-sim-q1">
            1 · Su cosa investire
          </p>
          <div className="xp-pick" role="radiogroup" aria-labelledby="xp-sim-q1">
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
        </div>

        <div className="xp-sim__col">
          <div className="xp-sim__lab">
            <label htmlFor="xp-lim" className="xp-seg__l mono">
              2 · Discesa massima che accetti
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
          <input id="xp-lim" type="range" min={5} max={50} step={1} value={limite} onChange={(e) => setLimite(Number(e.target.value))} />
          <div className="xp-sim__scale mono" aria-hidden="true">
            <span>5%</span>
            <span>50%</span>
          </div>
          <p className="xp-sim__hint">
            La <b>discesa massima</b> (in inglese <i>drawdown</i>) è quanto scende il conto dal suo punto più alto prima di risalire.
          </p>
          {aiuto && (
            <p id="xp-help-dd" className="xp-help__t">
              Esempio: il conto arriva a 10.000 € e poi scende fino a 8.000 € prima di risalire: la discesa è del 20%. Qui scegli la
              discesa più grande che sei disposto a sopportare se investi in queste strategie. Più è alta, più puoi rischiare a ogni
              operazione, e più il conto può crescere, ma anche scendere.
            </p>
          )}
          <button type="button" className="xp-go" onClick={() => setSeme((x) => x + 1)} disabled={calcolo}>
            <Play size={16} strokeWidth={2} aria-hidden />
            {calcolo ? "Simulazione in corso…" : "Avvia la simulazione"}
          </button>
          <div className={`xp-prog${calcolo ? " is-on" : ""}`} aria-hidden="true">
            <i style={{ transform: `scaleX(${avanz})` }} />
          </div>
          <p className="xp-sim__hint mono">Si ricalcola da solo a ogni scelta · il tasto rifà tutto con {N * 4} nuove simulazioni</p>
        </div>
          <div className="xp-why">
            <b>Perché tutte e tre insieme è consigliato.</b> Sono tre mercati diversi (XAUUSD, Nasdaq, USDJPY) e tre modi diversi di
            lavorare (seguire il trend, lo slancio dell’apertura, la rottura). Perdono in momenti diversi: la loro correlazione mensile non
            supera {it(corrMax, 2)} in valore assoluto, e nello storico tutte e tre in perdita nello stesso mese è successo{" "}
            {data.port.tutteNeg} volte su {data.port.mesiComuni}. Le perdite di una sono spesso coperte dalle altre: ognuna rischia un po’
            meno che da sola, ma a parità di discesa il conto cresce di più e in modo più regolare. Prova: stesso limite, prima una
            strategia sola e poi tutte e tre, e guarda il ventaglio.
          </div>
      </section>

      {!E || !esito ? (
        <section className="xp-block" aria-live="polite">
          <p className="xp-sim__wait mono">Simulazione in corso… {Math.round(avanz * 100)}%</p>
        </section>
      ) : (
        <div className={`xp-sim__res${calcolo ? " is-busy" : ""}`} aria-busy={calcolo}>
          <section className="xp-block" aria-labelledby="xp-sim-r" aria-live="polite">
            <h3 id="xp-sim-r" className="xp-block__t">
              Quanto rischiare su ogni operazione
            </h3>
            <ul className="xp-sim__risks">
              {data.ids.map((id: Id, k: number) =>
                esito.scelta === "tutte" || esito.scelta === id ? (
                  <li key={id} style={{ "--cc": data.base[id].colore } as React.CSSProperties}>
                    <span className="xp-sim__rn">
                      <i aria-hidden="true" />
                      {data.base[id].nome}
                    </span>
                    <b className="mono">{it(E.rischi[k] * 100, 2)}%</b>
                    <small>del capitale a operazione · calcolato {it(E.esatti[k] * 100, 2)}%, arrotondato per eccesso</small>
                  </li>
                ) : null,
              )}
            </ul>
            <div className={`xp-sim__verdict${sopra ? " is-over" : ""}`}>
              <p>
                Con questi rischi, <b>in 95 simulazioni su 100 la discesa resta sotto il {pc(E.p95)}%</b>
                {sopra ? (
                  <>
                    . È un po’ sopra il tuo limite del {esito.limite}% perché i rischi sono arrotondati per eccesso, a passi dello 0,10%.
                  </>
                ) : (
                  <>: dentro il tuo limite del {esito.limite}%.</>
                )}
              </p>
              <p className="t-sec">
                Nel metodo più severo superano il {esito.limite}% {it(E.oltre * 100, 0)} simulazioni su 100. Nello storico vero, in
                ordine, con questi rischi la discesa più grande è stata del {pc(E.storicoDD)}%.
              </p>
            </div>
          </section>

          <section className="xp-block" aria-labelledby="xp-sim-f">
            <h3 id="xp-sim-f" className="xp-block__t">
              {N} futuri possibili
            </h3>
            <p className="xp-block__s">
              Ogni linea sottile è una simulazione: le stesse operazioni ripescate a blocchi, con i rischi qui sopra. La fascia chiara
              contiene 90 simulazioni su 100 (dal 5% al 95%), quella più scura la metà centrale; la linea piena è la mediana, quella
              tratteggiata è com’è andata davvero. Passa sopra il grafico per leggere ogni momento.
            </p>
            <VentaglioChart v={E.ventaglio} colore={colore} anni={anni} giro={esito.giro} />
            <ul className="xp-legend mono" aria-hidden="true">
              <li>
                <i style={{ background: colore, opacity: 0.25 }} /> 5–95%
              </li>
              <li>
                <i style={{ background: colore, opacity: 0.5 }} /> 25–75%
              </li>
              <li>
                <i style={{ background: colore }} className="is-line" /> mediana
              </li>
              <li>
                <i className="is-dash" /> storico vero
              </li>
            </ul>
          </section>

          <section className="xp-block" aria-labelledby="xp-sim-h">
            <h3 id="xp-sim-h" className="xp-block__t">
              La discesa di ogni simulazione
            </h3>
            <p className="xp-block__s">
              Quanto è sceso il conto, al peggio, in ognuna delle {N} simulazioni del metodo più severo ({METODI[E.peggiore].nome.toLowerCase()}). In rosso quelle
              oltre il tuo limite.
            </p>
            <DisceseChart discese={E.discese} limite={esito.limite / 100} p95={E.p95} colore={colore} />
          </section>

          <section className="xp-block" aria-labelledby="xp-sim-m">
            <h3 id="xp-sim-m" className="xp-block__t">
              I quattro metodi
            </h3>
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
              ◂ il metodo più severo: è quello che decide i rischi · {it(E.n, 0)} operazioni per simulazione, {N} simulazioni per metodo
              · mediana finale {signed(E.ventaglio.p.p50[E.ventaglio.p.p50.length - 1], 0)}%
            </p>
          </section>
        </div>
      )}

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
              Ogni strategia rischia in proporzione inversa alle sue discese: chi scende di più rischia meno. Poi i rischi salgono tutti
              insieme fino al limite, e si arrotondano per eccesso a passi dello 0,10%.
            </p>
          </div>
          <div className="xp-ex">
            <h4>I limiti</h4>
            <p>
              Tutto parte da operazioni di backtest del 2019–2026, su un periodo lungo come lo storico. Sul 2019–2023 le strategie sono
              state ottimizzate, quindi lì i risultati sono gonfiati per costruzione. Il futuro può andare peggio di ogni simulazione: il
              limite scelto non è una garanzia.
            </p>
          </div>
        </div>
      </section>

      <p className="xp-risk">
        <TriangleAlert size={16} strokeWidth={1.6} aria-hidden />
        <span>
          Simulazioni su risultati di backtest su dati storici. Non garantiscono rendimenti futuri né che la discesa resti entro il limite.
          Il trading comporta un alto rischio di perdita.
        </span>
      </p>
      <button type="button" className="xp-back xp-back--end" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden /> Torna a tutte le strategie
      </button>
    </article>
  );
}
