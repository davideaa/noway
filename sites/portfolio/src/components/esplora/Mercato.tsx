"use client";

/**
 * CONTRO IL MERCATO (Davide): la strategia (o il portafoglio) accanto a chi avesse
 * semplicemente comprato e tenuto l'S&P 500 o il Nasdaq-100, sugli stessi mesi,
 * per guadagno e per discesa. Un solo riquadro: grafico + tabella.
 *
 * Mercato: gli INDICI S&P 500 (^GSPC) e Nasdaq-100 (^NDX), chiusure giornaliere,
 * senza dividendi (Davide: gli indici veri, non gli ETF), da data/benchmark.json
 * (scripts/benchmark.py). La discesa del mercato si misura
 * giorno per giorno; quella della strategia operazione per operazione, sempre
 * come % persa dal punto piu' alto (anche a rischio fisso), cosi' si confrontano.
 * Il periodo segue la pagina (tutto / dentro / fuori campione); gli anni spenti
 * no: il mercato non si puo' "saltare", e il confronto usa mesi continui.
 */
import { useMemo, useState } from "react";
import type { EsploraData } from "@/lib/esplora";
import { it, meseIt, signed } from "@/lib/format";
import { Chart, type Serie } from "./Chart";

type Riga = { nome: string; colore: string; tot: number; anno: number; dd: number };

export function Mercato({
  data,
  r,
  m,
  rischio,
  composto,
  nome,
  colore,
}: {
  data: EsploraData;
  /** operazioni del periodo scelto, in ordine (R e mese) */
  r: number[];
  m: number[];
  rischio: number;
  composto: boolean;
  nome: string;
  colore: string;
}) {
  const calc = useMemo(() => {
    if (!m.length) return null;
    const m0 = m[0];
    const m1 = m[m.length - 1];
    const mesi = m1 - m0 + 1;
    const anni = mesi / 12;

    // strategia: valore a fine mese e discesa (% dal massimo) operazione per operazione
    const v = new Array<number>(mesi + 1).fill(0);
    let cap = 1;
    let picco = 1;
    let dd = 0;
    let k = 0;
    for (let j = 0; j < mesi; j++) {
      while (k < r.length && m[k] === m0 + j) {
        cap = composto ? cap * (1 + rischio * r[k]) : cap + rischio * r[k];
        if (cap > picco) picco = cap;
        else dd = Math.max(dd, 1 - cap / picco);
        k++;
      }
      v[j + 1] = (cap - 1) * 100;
    }
    const riga = (nomeR: string, col: string, tot: number, ddR: number): Riga => ({
      nome: nomeR,
      colore: col,
      tot,
      anno: (Math.pow(Math.max(0, 1 + tot / 100), 1 / anni) - 1) * 100,
      dd: ddR * 100,
    });
    const righe: Riga[] = [riga(nome, colore, v[mesi], dd)];
    const serie: Serie[] = [{ v, colore, nome }];

    // mercato: indice del giorno di fine mese, base = fine del mese prima di m0
    const colori = ["var(--ink)", "var(--mut)"];
    data.bench.etf.forEach((e, i) => {
      const fine: number[] = [];
      let acc = 0;
      for (const n of e.n) {
        acc += n;
        fine.push(acc); // c[0] e' la base (31/12/2018): la fine del mese j e' c[fine[j]]
      }
      const b0 = m0 === 0 ? 0 : fine[m0 - 1];
      const b1 = fine[m1];
      const vb = new Array<number>(mesi + 1).fill(0);
      for (let j = 0; j < mesi; j++) vb[j + 1] = (e.c[fine[m0 + j]] / e.c[b0] - 1) * 100;
      let pk = e.c[b0];
      let ddb = 0;
      for (let d = b0; d <= b1; d++) {
        if (e.c[d] > pk) pk = e.c[d];
        else ddb = Math.max(ddb, 1 - e.c[d] / pk);
      }
      righe.push(riga(e.nome, colori[i] ?? "var(--mut)", vb[mesi], ddb));
      serie.push({ v: vb, colore: colori[i] ?? "var(--mut)", nome: e.nome, tratteggio: i === 0 });
    });

    const etichette = [`inizio ${meseIt(data.mesi[m0])}`, ...Array.from({ length: mesi }, (_, j) => meseIt(data.mesi[m0 + j]))];
    return { serie, righe, etichette, da: meseIt(data.mesi[m0]), a: meseIt(data.mesi[m1]) };
  }, [data, r, m, rischio, composto, nome, colore]);

  // scala: quando una curva e' molto piu' grande delle altre, la normale schiaccia il mercato su una riga piatta;
  // in scala logaritmica (log2 del capitale) la stessa pendenza e' la stessa crescita in percentuale
  const [scelta, setScelta] = useState<"auto" | "lin" | "log">("auto");
  const fin = calc ? calc.righe.map((x) => 1 + x.tot / 100) : [1];
  const auto = Math.max(...fin) > 3 * Math.max(1, ...fin.slice(1));
  const log = scelta === "log" || (scelta === "auto" && auto);
  const serieV = useMemo(
    () => (!calc ? [] : log ? calc.serie.map((x) => ({ ...x, v: x.v.map((y) => Math.log2(Math.max(1e-6, 1 + y / 100))) })) : calc.serie),
    [calc, log],
  );

  if (!calc) return null;
  const ultimo = data.bench.etf[0]?.ultimo ?? "";
  const rT = it(rischio * 100, rischio * 100 < 1 ? 1 : 0).replace(",0", "");

  return (
    <section className="xp-block" aria-labelledby="xp-mkt">
      <h3 id="xp-mkt" className="xp-block__t">
        Contro il mercato
      </h3>
      <p className="xp-block__s">
        Stessi mesi ({calc.da} – {calc.a}): {nome} rischiando il {rT}% a operazione ({composto ? "rischio composto" : "rischio fisso"}), contro
        l’andamento degli indici S&amp;P 500 e Nasdaq-100 (come se si fossero comprati e tenuti). Guarda sia quanto rende sia quanto
        scende.
      </p>
      <div className="xp-seg xp-mkt__scala" role="group" aria-label="Scala del grafico">
        <span className="xp-seg__l mono">Scala</span>
        <div className="xp-seg__b">
          <button type="button" aria-pressed={!log} onClick={() => setScelta("lin")}>
            Normale
          </button>
          <button type="button" aria-pressed={log} onClick={() => setScelta("log")}>
            Logaritmica
          </button>
        </div>
      </div>
      {log && (
        <p className="xp-sim__hint">
          Scala logaritmica: le righe segnano il capitale moltiplicato (×1 è la partenza) e la stessa pendenza vuol dire la stessa crescita in
          percentuale. Serve a vedere insieme curve molto diverse; con “Normale” le più piccole diventano quasi piatte.
        </p>
      )}
      <Chart
        key={log ? "log" : "lin"}
        serie={serieV}
        mesiOp={calc.etichette}
        fmt={(x) => signed(log ? (Math.pow(2, x) - 1) * 100 : x, 1) + " %"}
        fmtAsse={(x) => (log ? `×${it(Math.pow(2, x), Math.pow(2, x) < 10 && x % 1 !== 0 ? 1 : 0)}` : it(x, 0) + "%")}
        fuoriDa={null}
        titolo={`${nome} contro S&P 500 e Nasdaq-100`}
        altezza={280}
      />
      <div className="xp-sim__tab xp-mkt-tab" role="table" aria-label="Confronto con il mercato">
        <div role="row" className="xp-sim__tr xp-sim__th mono">
          <span role="columnheader">Investimento</span>
          <span role="columnheader">Guadagno</span>
          <span role="columnheader">All’anno</span>
          <span role="columnheader">Discesa massima</span>
          <span role="columnheader">Guadagno per 1% di discesa</span>
        </div>
        {calc.righe.map((x, i) => (
          <div role="row" key={x.nome} className={`xp-sim__tr${i === 0 ? " is-worst" : ""}`}>
            <span role="cell" className="xp-mkt__n">
              <i style={{ background: x.colore }} aria-hidden="true" />
              <b>{x.nome}</b>
            </span>
            <span role="cell" className="mono">
              {signed(x.tot, 0)}%
            </span>
            <span role="cell" className="mono">
              {signed(x.anno, 1)}%
            </span>
            <span role="cell" className="mono xp-mkt__dd">
              −{it(x.dd, 1)}%
            </span>
            <span role="cell" className="mono">
              {x.dd > 0 ? it(x.tot / x.dd, 1) : "—"}
            </span>
          </div>
        ))}
      </div>
      <p className="xp-note">
        Da leggere con attenzione: la strategia è un backtest, senza i costi del broker (circa −15/20% sui guadagni); il mercato sono prezzi
        veri. E la strategia dipende dal rischio scelto: con il doppio del rischio, guadagni e discese all’incirca raddoppiano (cambialo in alto).
        La colonna a destra mette insieme le due cose: quanto si è guadagnato per ogni punto di discesa sopportato. Indici S&amp;P 500 e
        Nasdaq-100, chiusure giornaliere ufficiali senza dividendi, fino al {ultimo.split("-").reverse().join("/")} (fonte Yahoo Finance).
      </p>
    </section>
  );
}
