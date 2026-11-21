"use client";

/**
 * LA PAGINA DI UNA STRATEGIA (o del portafoglio): solo risultati, spiegati a chi
 * non sa niente di trading. Comandi: periodo (tutto / dentro / fuori campione),
 * misura (R / % a rischio fisso / % a rischio composto), rischio per operazione,
 * anni accesi e spenti (e, nel portafoglio, strategie accese e spente).
 */
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import type { Id } from "@/lib/dati";
import type { EsploraData } from "@/lib/esplora";
import { it, meseIt, signed } from "@/lib/format";
import { Chart, type Serie } from "./Chart";
import { curva, statistiche, tempi, totale, type Misura, type Periodo } from "./calc";
import { Mercato } from "./Mercato";

const RISCHI = [0.005, 0.01, 0.02];
const pct = (x: number) => it(x * 100, x * 100 < 1 ? 1 : 0).replace(",0", "");

function Seg<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { v: T; t: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`xp-seg${disabled ? " is-off" : ""}`} role="group" aria-label={label}>
      <span className="xp-seg__l mono">{label}</span>
      <div className="xp-seg__b">
        {options.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            aria-pressed={value === o.v}
            disabled={disabled}
            onClick={() => onChange(o.v)}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Vista({ data, chi, onBack }: { data: EsploraData; chi: Id | "port"; onBack: () => void }) {
  const port = chi === "port";
  const [periodo, setPeriodo] = useState<Periodo>("tutto");
  const [misura, setMisura] = useState<Misura>("composto");
  const [rischio, setRischio] = useState(0.01);
  const [anniOff, setAnniOff] = useState<string[]>([]);
  const [stratOff, setStratOff] = useState<Id[]>([]);
  // "Confronto con benchmark" (Davide): lo stesso grafico con S&P 500 e Nasdaq-100 accanto
  const [bench, setBench] = useState(false);

  const colore = port ? "var(--acc)" : data.base[chi].colore;
  const nome = port ? "Portafoglio" : data.base[chi].nome;

  /* le operazioni di questa pagina, prima dei filtri di periodo e anni */
  const baseOps = useMemo(() => {
    const r: number[] = [];
    const m: number[] = [];
    const s: number[] = [];
    const fuori: boolean[] = [];
    for (let i = 0; i < data.r.length; i++) {
      const id = data.ids[data.s[i]];
      if (port ? stratOff.includes(id) : id !== chi) continue;
      r.push(data.r[i]);
      m.push(data.m[i]);
      s.push(data.s[i]);
      fuori.push(data.m[i] >= data.base[id].fuori);
    }
    return { r, m, s, fuori };
  }, [data, chi, port, stratOff]);

  const anni = useMemo(() => Array.from(new Set(baseOps.m.map((x) => data.mesi[x].slice(0, 4)))).sort(), [baseOps, data.mesi]);

  /* filtri: periodo e anni */
  const ops = useMemo(() => {
    const r: number[] = [];
    const m: number[] = [];
    const fuori: boolean[] = [];
    for (let i = 0; i < baseOps.r.length; i++) {
      if (periodo === "dentro" && baseOps.fuori[i]) continue;
      if (periodo === "fuori" && !baseOps.fuori[i]) continue;
      if (anniOff.includes(data.mesi[baseOps.m[i]].slice(0, 4))) continue;
      r.push(baseOps.r[i]);
      m.push(baseOps.m[i]);
      fuori.push(baseOps.fuori[i]);
    }
    return { r, m, fuori };
  }, [baseOps, periodo, anniOff, data.mesi]);

  /* per il confronto col mercato: il periodo scelto, senza il filtro anni (il mercato non salta gli anni) */
  const mercatoOps = useMemo(() => {
    const r: number[] = [];
    const m: number[] = [];
    for (let i = 0; i < baseOps.r.length; i++) {
      if (periodo === "dentro" && baseOps.fuori[i]) continue;
      if (periodo === "fuori" && !baseOps.fuori[i]) continue;
      r.push(baseOps.r[i]);
      m.push(baseOps.m[i]);
    }
    return { r, m };
  }, [baseOps, periodo]);

  const c = useMemo(() => curva(ops.r, misura, rischio), [ops, misura, rischio]);
  const altra = useMemo(
    () => (misura === "R" ? null : curva(ops.r, misura === "fisso" ? "composto" : "fisso", rischio)),
    [ops, misura, rischio],
  );
  const st = useMemo(() => statistiche(ops.r), [ops]);
  const tm = useMemo(() => tempi(ops.r, ops.m, data.mesi.length), [ops, data.mesi.length]);
  const mesiOp = useMemo(() => ops.m.map((x) => meseIt(data.mesi[x])), [ops, data.mesi]);
  const fuoriDa = !port && periodo === "tutto" ? ops.fuori.indexOf(true) : null;

  const unita = misura === "R" ? " R" : " %";
  const fmt = (v: number) => signed(v, 1) + unita;
  const fmtAsse = (v: number) => it(v, Math.abs(v) < 10 && v % 1 !== 0 ? 1 : 0) + (misura === "R" ? "" : "%");
  const ddMax = c.dd.length ? Math.min(...c.dd) : 0;
  const finale = c.v.length ? c.v[c.v.length - 1] : 0;

  /* anni: risultato di ciascuno nella misura scelta (sul periodo scelto, senza il filtro anni) */
  const perAnno = useMemo(() => {
    const out: Record<string, number> = {};
    for (const a of anni) {
      const rr: number[] = [];
      for (let i = 0; i < baseOps.r.length; i++) {
        if (periodo === "dentro" && baseOps.fuori[i]) continue;
        if (periodo === "fuori" && !baseOps.fuori[i]) continue;
        if (data.mesi[baseOps.m[i]].slice(0, 4) === a) rr.push(baseOps.r[i]);
      }
      out[a] = rr.length ? totale(rr, misura, rischio) : 0;
    }
    return out;
  }, [anni, baseOps, periodo, misura, rischio, data.mesi]);
  const anniVisibili = anni.filter((a) => {
    // un anno senza operazioni nel periodo scelto non si mostra
    for (let i = 0; i < baseOps.r.length; i++) {
      if (periodo === "dentro" && baseOps.fuori[i]) continue;
      if (periodo === "fuori" && !baseOps.fuori[i]) continue;
      if (data.mesi[baseOps.m[i]].slice(0, 4) === a) return true;
    }
    return false;
  });
  const attivi = anniVisibili.filter((a) => !anniOff.includes(a));
  const migliore = attivi.reduce((b, a) => (b === "" || perAnno[a] > perAnno[b] ? a : b), "");
  const peggiore = attivi.reduce((b, a) => (b === "" || perAnno[a] < perAnno[b] ? a : b), "");
  const maxAbs = Math.max(1e-9, ...anniVisibili.map((a) => Math.abs(perAnno[a])));

  /* dentro contro fuori campione (sulle operazioni di questa pagina, anni accesi) */
  const confronto = useMemo(() => {
    const blocco = (sel: (f: boolean) => boolean) => {
      const rr: number[] = [];
      const mm: number[] = [];
      for (let i = 0; i < baseOps.r.length; i++) {
        if (!sel(baseOps.fuori[i])) continue;
        if (anniOff.includes(data.mesi[baseOps.m[i]].slice(0, 4))) continue;
        rr.push(baseOps.r[i]);
        mm.push(baseOps.m[i]);
      }
      const s = statistiche(rr);
      const mesi = new Set(mm).size;
      return { ...s, comp: totale(rr, "composto", rischio), mesi, daA: mm.length ? `${meseIt(data.mesi[mm[0]])} – ${meseIt(data.mesi[mm[mm.length - 1]])}` : "—" };
    };
    return { dentro: blocco((f) => !f), fuori: blocco((f) => f) };
  }, [baseOps, anniOff, rischio, data.mesi]);

  const serie: Serie[] = [{ v: c.v, colore, nome: misura === "R" ? "Risultato in R" : misura === "fisso" ? "Rischio fisso" : "Rischio composto" }];
  if (altra) serie.push({ v: altra.v, colore: "var(--mut)", nome: misura === "fisso" ? "Rischio composto" : "Rischio fisso", tratteggio: true });
  const serieDD: Serie[] = [{ v: c.dd, colore: "var(--bad)", nome: "Sotto il massimo" }];

  const boot = port ? data.port.boot : data.base[chi].boot;
  const bootMis = (x: number) => (misura === "R" ? x : misura === "fisso" ? x * rischio * 100 : (Math.pow(1 - rischio, x) - 1) * -100);

  const toggleAnno = (a: string) => setAnniOff((l) => (l.includes(a) ? l.filter((x) => x !== a) : [...l, a]));
  const toggleStrat = (id: Id) =>
    setStratOff((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= data.ids.length - 1 ? l : [...l, id]));

  const rischioT = pct(rischio);

  return (
    <article className="xp-view" style={{ "--zc": colore } as React.CSSProperties} aria-labelledby="xp-view-t">
      <div className="xp-view__top">
        <button type="button" className="xp-back" onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={1.8} aria-hidden /> Tutte le strategie
        </button>
        <span className="xp-tag mono">Backtest · validato fuori campione</span>
      </div>

      <header className="xp-view__head">
        <h2 id="xp-view-t" className="xp-view__name">
          <span className="xp-dot" aria-hidden="true" />
          {nome}
        </h2>
        {port ? (
          <p className="xp-view__frase">
            Le tre strategie insieme, operazione dopo operazione. Guadagnano in momenti diversi: quando una è ferma o perde, spesso
            un’altra lavora. Qui puoi accenderle e spegnerle.
          </p>
        ) : (
          <>
            <p className="xp-view__meta mono">
              {data.base[chi].mercato} · {data.base[chi].tipo} · {data.base[chi].timeframe}
            </p>
            <p className="xp-view__frase">{data.base[chi].frase}</p>
          </>
        )}
      </header>

      <div className="xp-controls">
        <Seg<Periodo>
          label="Periodo"
          value={periodo}
          onChange={setPeriodo}
          options={[
            { v: "tutto", t: "Tutto" },
            { v: "dentro", t: "Dentro campione" },
            { v: "fuori", t: "Fuori campione" },
          ]}
        />
        <Seg<Misura>
          label="Misura"
          value={misura}
          onChange={setMisura}
          options={[
            { v: "R", t: "In R" },
            { v: "fisso", t: "% rischio fisso" },
            { v: "composto", t: "% rischio composto" },
          ]}
        />
        <Seg<number>
          label="Rischio per operazione"
          value={rischio}
          onChange={setRischio}
          disabled={misura === "R"}
          options={RISCHI.map((x) => ({ v: x, t: pct(x) + "%" }))}
        />
      </div>

      {port && (
        <div className="xp-chips" role="group" aria-label="Strategie nel portafoglio">
          <span className="xp-seg__l mono">Strategie</span>
          {data.ids.map((id) => (
            <button
              key={id}
              type="button"
              className="xp-chip"
              aria-pressed={!stratOff.includes(id)}
              style={{ "--cc": data.base[id].colore } as React.CSSProperties}
              onClick={() => toggleStrat(id)}
            >
              <i aria-hidden="true" />
              {data.base[id].nome}
            </button>
          ))}
        </div>
      )}

      <dl className="xp-kpis">
        <div>
          <dt>Risultato</dt>
          <dd className={finale >= 0 ? "is-up" : "is-down"}>{fmt(finale)}</dd>
          <small>{misura === "R" ? "somma delle operazioni" : `rischiando il ${rischioT}% a operazione`}</small>
        </div>
        <div>
          <dt>Discesa massima</dt>
          <dd className="is-down">{fmt(ddMax)}</dd>
          <small>{misura === "composto" ? "dal punto più alto" : misura === "fisso" ? "del capitale iniziale" : "dal punto più alto"}</small>
        </div>
        <div>
          <dt>Operazioni</dt>
          <dd>{st.n.toLocaleString("it-IT")}</dd>
          <small>vinte il {it(st.vinte, 0)}%</small>
        </div>
        <div>
          <dt>Perdite di fila</dt>
          <dd>{st.perditeDiFila}</dd>
          <small>la serie peggiore</small>
        </div>
      </dl>

      <section className="xp-block" aria-labelledby="xp-c1">
        <div className="xp-block__head">
          <h3 id="xp-c1" className="xp-block__t">
            {bench ? "Confronto con benchmark" : "Come è cresciuto il capitale"}
          </h3>
          <div className="xp-seg" role="group" aria-label="Cosa mostra il grafico">
            <div className="xp-seg__b">
              <button type="button" aria-pressed={!bench} onClick={() => setBench(false)}>
                {nome}
              </button>
              <button type="button" aria-pressed={bench} onClick={() => setBench(true)}>
                Confronto con benchmark
              </button>
            </div>
          </div>
        </div>
        {bench ? (
          <Mercato
            data={data}
            r={mercatoOps.r}
            m={mercatoOps.m}
            rischio={rischio}
            composto={misura !== "fisso"}
            nome={nome}
            colore={colore}
            incorporato
          />
        ) : (
          <>
            <p className="xp-block__s">
              {misura === "R"
                ? "Ogni punto è la somma dei risultati fino a quel momento, in R."
                : `Partendo da 100, rischiando il ${rischioT}% a operazione. La linea tratteggiata è l’altro modo di rischiare, per confronto.`}
            </p>
            <Chart serie={serie} mesiOp={mesiOp} fmt={fmt} fmtAsse={fmtAsse} fuoriDa={fuoriDa} titolo={`Curva di ${nome}`} />
          </>
        )}
      </section>

      <section className="xp-block" aria-labelledby="xp-c2">
        <h3 id="xp-c2" className="xp-block__t">Le discese (drawdown)</h3>
        <p className="xp-block__s">
          Quanto si era sotto il punto più alto raggiunto prima. Zero vuol dire “nuovo massimo”. Il punto più basso è il momento peggiore
          che si sarebbe vissuto.
        </p>
        <Chart
          serie={serieDD}
          mesiOp={mesiOp}
          fmt={fmt}
          fmtAsse={fmtAsse}
          fuoriDa={fuoriDa}
          altezza={200}
          modo="min"
          area="sotto"
          titolo={`Drawdown di ${nome}`}
        />
      </section>


      <section className="xp-block" aria-labelledby="xp-c3">
        <h3 id="xp-c3" className="xp-block__t">Anno per anno</h3>
        <p className="xp-block__s">Tocca un anno per toglierlo dal calcolo (e rimetterlo). Tutti i numeri della pagina si aggiornano.</p>
        <div className="xp-years" role="group" aria-label="Anni">
          {anniVisibili.map((a) => {
            const v = perAnno[a];
            const off = anniOff.includes(a);
            const h = (Math.abs(v) / maxAbs) * 100;
            return (
              <button
                key={a}
                type="button"
                className={`xp-year${off ? " is-off" : ""}${a === migliore ? " is-best" : ""}${a === peggiore ? " is-worst" : ""}`}
                aria-pressed={!off}
                aria-label={`${a}: ${fmt(v)}${off ? ", escluso" : ""}`}
                onClick={() => toggleAnno(a)}
              >
                <span className="xp-year__v mono">{fmt(v)}</span>
                <span className="xp-year__bar">
                  <span className={v >= 0 ? "up" : "down"} style={{ height: `${Math.max(2, h / 2)}%` }} />
                </span>
                <span className="xp-year__a mono">{a === data.mesi[data.mesi.length - 1].slice(0, 4) ? `${a}*` : a}</span>
              </button>
            );
          })}
        </div>
        <p className="xp-note">
          {migliore && (
            <>
              Anno migliore <b>{migliore}</b> ({fmt(perAnno[migliore])}), anno peggiore <b>{peggiore}</b> ({fmt(perAnno[peggiore])}).{" "}
            </>
          )}
          * {data.mesi[data.mesi.length - 1].slice(0, 4)} fino a {meseIt(data.mesi[data.mesi.length - 1])}.
        </p>
      </section>

      <section className="xp-block" aria-labelledby="xp-c4">
        <h3 id="xp-c4" className="xp-block__t">Dentro e fuori campione</h3>
        <p className="xp-block__s">
          “Dentro campione” sono gli anni usati per costruire la strategia. “Fuori campione” sono anni che la strategia non aveva mai visto:
          servono a verificare che funzioni anche su dati nuovi. Se regge fuori campione, il risultato è più credibile.
        </p>
        <div className="xp-vs">
          {(["dentro", "fuori"] as const).map((k) => {
            const b = confronto[k];
            return (
              <div key={k} className={`xp-vs__col${k === "fuori" ? " is-oos" : ""}`}>
                <p className="xp-vs__h">
                  {k === "dentro" ? "Dentro campione" : "Fuori campione"} <span className="mono">{b.daA}</span>
                </p>
                <dl>
                  <div>
                    <dt>Operazioni</dt>
                    <dd className="mono">{b.n.toLocaleString("it-IT")}</dd>
                  </div>
                  <div>
                    <dt>Vinte</dt>
                    <dd className="mono">{it(b.vinte, 1)}%</dd>
                  </div>
                  <div>
                    <dt>Media per operazione</dt>
                    <dd className="mono">{signed(b.media, 3)} R</dd>
                  </div>
                  <div>
                    <dt>Somma</dt>
                    <dd className="mono">{signed(b.somma, 1)} R</dd>
                  </div>
                  <div>
                    <dt>Rischio composto al {rischioT}%</dt>
                    <dd className="mono">{signed(b.comp, 1)}%</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </section>

      <section className="xp-block" aria-labelledby="xp-c5">
        <h3 id="xp-c5" className="xp-block__t">Come leggere questi numeri</h3>
        <div className="xp-explain">
          <div className="xp-ex">
            <h4>Cos’è R</h4>
            <p>
              R è l’unità di rischio: <b>1 R è quanto si perde se un’operazione va male</b>. Un’operazione a +2 R ha guadagnato il doppio di
              quanto rischiava. Misurare in R rende i risultati uguali per chi investe 1.000 o 100.000 euro.
            </p>
          </div>
          <div className="xp-ex">
            <h4>Rischio fisso e rischio composto</h4>
            <p>
              <b>Fisso</b>: ogni operazione rischia sempre la stessa cifra, calcolata sul capitale di partenza. La crescita è una retta: più
              prudente e facile da leggere, ma il guadagno accumulato non lavora.
            </p>
            <p>
              <b>Composto</b>: ogni operazione rischia la stessa percentuale del capitale di quel momento. Quando si guadagna si rischia un
              po’ di più, quando si perde un po’ di meno. Su molti anni moltiplica il risultato, ma le serie di perdite pesano di più in euro.
              In questa pagina: <b>{fmtCmp(totale(ops.r, "fisso", rischio))}</b> a rischio fisso contro{" "}
              <b>{fmtCmp(totale(ops.r, "composto", rischio))}</b> a rischio composto.
            </p>
          </div>
          <div className="xp-ex">
            <h4>Il drawdown</h4>
            <p>
              È la discesa dal punto più alto al punto più basso successivo: quanto si sarebbe perso nel momento peggiore. Nel backtest la
              discesa più grande è stata <b>{fmt(ddMax)}</b>.
            </p>
            <p>
              Il passato è una sola sequenza. Mescolando le stesse operazioni in 10.000 ordini diversi, nel 95% dei casi la discesa massima
              non supera <b>{signed(-bootMis(boot.p95), 1).replace("+", "")}
              {unita}</b>
              {misura === "R" ? "" : ` (rischiando il ${rischioT}%)`}: è il numero da tenere a mente, non quello del backtest.
            </p>
          </div>
          <div className="xp-ex">
            <h4>Il tempo</h4>
            <p>
              I guadagni non arrivano in linea retta. Il periodo più lungo passato sotto il massimo precedente è durato{" "}
              <b>{tm.recuperoMesi} mesi</b>
              {tm.recuperoMesi > 0 && (
                <>
                  {" "}
                  ({meseIt(data.mesi[tm.recuperoDa])} – {meseIt(data.mesi[tm.recuperoA])})
                </>
              )}
              . Mesi in utile: <b>{tm.mesiPositivi}</b> su {tm.mesiAttivi}.
            </p>
            <p>
              <b>A favore</b>: con il tempo il vantaggio statistico emerge, e a rischio composto si moltiplica. <b>Contro</b>: servono anni, e
              bisogna reggere i mesi negativi senza cambiare le regole. I professionisti giudicano una strategia su più anni, non su un mese, e
              guardano soprattutto quanto dura e quanto è profonda la discesa peggiore.
            </p>
          </div>
        </div>
      </section>

      {port && (
        <section className="xp-block" aria-labelledby="xp-c6">
          <h3 id="xp-c6" className="xp-block__t">Quanto si muovono insieme</h3>
          <p className="xp-block__s">
            La correlazione va da −1 (sempre opposte) a +1 (sempre uguali). Vicino a zero vuol dire che si muovono per conto loro: è quello che
            rende utile metterle insieme.
          </p>
          <dl className="xp-corr">
            {data.port.corr.map((k) => (
              <div key={k.a + k.b}>
                <dt>
                  {data.base[k.a].nome} – {data.base[k.b].nome}
                </dt>
                <dd className="mono">{signed(k.r, 2)}</dd>
              </div>
            ))}
          </dl>
          <p className="xp-note">
            Mesi con tutte e tre in perdita: <b>{data.port.tutteNeg}</b> su {data.port.mesiComuni}. Tutte e tre in utile:{" "}
            <b>{data.port.tuttePos}</b>.
          </p>
        </section>
      )}

      <p className="xp-risk">
        <TriangleAlert size={16} strokeWidth={1.6} aria-hidden />
        <span>
          Risultati di backtest su dati storici, validati fuori campione. Non garantiscono rendimenti futuri. Il trading comporta un alto
          rischio di perdita.
        </span>
      </p>
      <button type="button" className="xp-back xp-back--end" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden /> Torna a tutte le strategie
      </button>
    </article>
  );
}

function fmtCmp(v: number) {
  return signed(v, 0) + "%";
}
