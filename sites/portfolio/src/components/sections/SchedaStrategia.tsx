import type { ReactNode } from "react";
import { ChartFrame, type Cella, type Tabella } from "@/components/charts/Frame";
import { Heatmap } from "@/components/charts/Heatmap";
import { Histogram } from "@/components/charts/Histogram";
import { LineChart } from "@/components/charts/Line";
import { YearBars } from "@/components/charts/YearBars";
import { BacktestTag, Reveal, TableScroll } from "@/components/site/ui";
import { ANNO_PARZIALE, D, MESI_OPS, META, ULTIMO_MESE, annoLabel, primiIndiciAnno, type Id, type Periodo } from "@/lib/dati";
import { MESI_LUNGHI, R, int, it, meseIt, meseLungo, mesePrima, signed } from "@/lib/format";

/**
 * La scheda completa di una strategia: regole (o la riga onesta), i numeri di
 * COPY.md, la tabella dentro / fuori campione / tutto, sei grafici (curva,
 * drawdown, media mobile su 250 operazioni, barre per anno, mappa mensile,
 * bootstrap del drawdown) e i numeri scomodi. Tutto da data/derivati.json,
 * che e' verificato contro data/strategie.json a ogni build dello script.
 */
export type Testi = {
  mercato: string;
  regole?: ReactNode;
  numeri: string;
  fuori: ReactNode;
  scomodi: ReactNode;
  anni: string;
};

const RIGHE: { label: string; f: (p: Periodo) => string; bad?: boolean }[] = [
  { label: "Operazioni", f: (p) => int(p.n) },
  { label: "R per operazione", f: (p) => signed(p.R_per_op, 4) + " R" },
  { label: "Somma dei risultati", f: (p) => R(p.somma_R) },
  { label: "t-statistica", f: (p) => it(p.t, 2) },
  { label: "Deviazione standard", f: (p) => it(p.dev_std, 2) + " R" },
  { label: "Operazioni in utile", f: (p) => it(p.vinte_pct, 1) + " %" },
  { label: "Drawdown massimo del backtest", f: (p) => it(p.dd_max_R, 1) + " R", bad: true },
  { label: "Perdite consecutive massime", f: (p) => String(p.perdite_consecutive_max), bad: true },
  { label: "Anno migliore", f: (p) => `${annoLabel(p.anno_migliore.anno)} (${R(p.anno_migliore.R)})` },
  { label: "Anno peggiore", f: (p) => `${annoLabel(p.anno_peggiore.anno)} (${R(p.anno_peggiore.R)})`, bad: true },
];

export function SchedaStrategia({ id, testi }: { id: Id; testi: Testi }) {
  const m = META[id];
  const s = D[id];
  const mesiOps = MESI_OPS[id];
  const n = s.n;
  const k = s.indice_fuori;
  const anni = primiIndiciAnno(mesiOps);
  const { dentro, fuori, tutto } = s.periodi;
  const fuoriDa = meseIt(s.fuori_da);
  const annoDentroFine = mesePrima(s.fuori_da).slice(0, 4);
  const b = s.bootstrap_dd;

  // (a) curva cumulata: costruzione attenuata, fuori campione piena
  const curvaDentro = s.curva.slice(0, k).map((y, i) => [i, y] as [number, number]);
  const curvaFuori = s.curva.slice(k - 1).map((y, i) => [k - 1 + i, y] as [number, number]);
  // (b) drawdown operazione per operazione (negativo, verso il basso)
  const ddPunti = s.drawdown.map((d, i) => [i, -d] as [number, number]);
  let iDd = 0;
  s.drawdown.forEach((d, i) => {
    if (d > s.drawdown[iDd]) iDd = i;
  });
  // (c) media mobile di R su 250 operazioni
  const r0 = s.rolling.inizio ?? 0;
  const rollPunti = s.rolling.valori.map((v, i) => [r0 + i, v] as [number, number]);
  const rollMin = Math.min(...s.rolling.valori);
  const rollMax = Math.max(...s.rolling.valori);
  const rollNeg = s.rolling.valori.filter((v) => v < 0).length;

  // tabelle gemelle
  const anniLista = Object.keys(s.per_anno).sort();
  const cumFineAnno: Record<string, number> = {};
  const ddAnno: Record<string, number> = {};
  const rollFineAnno: Record<string, number | null> = {};
  anniLista.forEach((a) => {
    let last = -1;
    let dd = 0;
    mesiOps.forEach((mm, i) => {
      if (mm.startsWith(a)) {
        last = i;
        if (s.drawdown[i] > dd) dd = s.drawdown[i];
      }
    });
    cumFineAnno[a] = s.curva[last];
    ddAnno[a] = dd;
    rollFineAnno[a] = last >= r0 ? s.rolling.valori[last - r0] : null;
  });
  const tabCurva: Tabella = {
    didascalia: "Risultato dell'anno e cumulato a fine anno, in R (backtest)",
    intestazioni: ["Anno", "R dell'anno", "Cumulato a fine anno"],
    righe: anniLista.map((a) => [annoLabel(a), R(s.per_anno[a]), R(cumFineAnno[a])]),
  };
  const tabDd: Tabella = {
    didascalia: "Drawdown più profondo toccato in ogni anno, in R (backtest)",
    intestazioni: ["Anno", "Drawdown massimo nell'anno"],
    righe: anniLista.map((a) => [annoLabel(a), it(ddAnno[a], 1) + " R"]),
  };
  const tabRoll: Tabella = {
    didascalia: `Media di R sulle ultime ${s.rolling.finestra} operazioni, all'ultima operazione di ogni anno (backtest)`,
    intestazioni: ["Anno", "Media mobile a fine anno"],
    righe: anniLista.map((a) => [annoLabel(a), rollFineAnno[a] === null ? `meno di ${s.rolling.finestra} operazioni` : signed(rollFineAnno[a]!, 3) + " R"]),
  };
  const tabAnni: Tabella = {
    didascalia: "Risultato per anno, in R (backtest)",
    intestazioni: ["Anno", "R"],
    righe: anniLista.map((a) => [annoLabel(a), R(s.per_anno[a])]),
  };
  const mesiOrd = Object.keys(s.per_mese).sort();
  const tabMesi: Tabella = {
    didascalia: "Risultato di ogni mese, in R (backtest)",
    intestazioni: ["Anno", "gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
    righe: anniLista.map((a) => {
      const presenti = Array.from({ length: 12 }, (_, i) => `${a}-${String(i + 1).padStart(2, "0")}`).filter((ym) => mesiOrd.includes(ym));
      const celle: Cella[] = [annoLabel(a), ...presenti.map((ym) => signed(s.per_mese[ym], 1))];
      // l'anno parziale: una sola cella unita al posto dei mesi non ancora arrivati (COPY.md, microcopy)
      if (presenti.length < 12) celle.push({ v: `${a}: anno parziale, fino a ${MESI_LUNGHI[presenti.length - 1]}`, span: 12 - presenti.length });
      return celle;
    }),
  };
  const tabBoot: Tabella = {
    didascalia: `Drawdown massimo in ${int(b.campioni)} sequenze rimescolate a blocchi di ${b.blocco} (backtest)`,
    intestazioni: ["Misura", "Drawdown in R"],
    righe: [
      ["Backtest (sequenza storica)", it(b.storico, 1) + " R"],
      ["Mediana (50° percentile)", it(b.p50, 1) + " R"],
      ["90° percentile", it(b.p90, 1) + " R"],
      ["95° percentile", it(b.p95, 1) + " R"],
      ["99° percentile", it(b.p99, 1) + " R"],
      ["Caso peggiore simulato", it(b.max, 1) + " R"],
    ],
  };

  const pid = `sch-${id}`;
  return (
    <article className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12" aria-labelledby={pid}>
      <Reveal className="lg:col-span-3">
        <h3 id={pid} className="t-h2 lg:sticky lg:top-24">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: m.colore }} />
            {m.nome}
          </span>
          <span className="t-sec block font-normal">{testi.mercato}</span>
          <span className="t-note mt-2 block font-normal">
            Backtest {meseIt(mesiOps[0])} – {meseIt(ULTIMO_MESE)} · {int(n)} operazioni · fuori campione dal {fuoriDa}
          </span>
        </h3>
      </Reveal>

      <div className="space-y-6 lg:col-span-9">
        {/* regole (oro) o la riga onesta (Nasdaq, USDJPY) */}
        <Reveal className="prose space-y-4">
          {testi.regole ?? (
            <p>
              <strong>Regole di ingresso e uscita.</strong> Le regole di questa strategia sono descritte nel simulatore e
              non sono ancora riportate in questa pagina: qui ci sono i risultati, misurati con le stesse voci delle
              altre due.
            </p>
          )}
        </Reveal>
        <Reveal i={1} className="prose space-y-3">
          <BacktestTag />
          <p>
            <strong>I numeri (backtest):</strong> {testi.numeri}
          </p>
          <p>
            <strong>Dentro e fuori campione:</strong> {testi.fuori}
          </p>
        </Reveal>

        {/* tabella dentro / fuori / tutto */}
        <Reveal i={2} className="space-y-3">
          <TableScroll label={`${m.nome}: dentro campione, fuori campione e periodo intero (backtest, in R)`}>
            <table className="dtable">
              <caption>
                {m.nome}: periodo di costruzione, fuori campione e periodo intero (backtest). Il {ANNO_PARZIALE} è un anno
                parziale, fino a settembre.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Misura</th>
                  <th scope="col" className="r">
                    Costruzione {dentro.da.slice(0, 4)}–{annoDentroFine}
                  </th>
                  <th scope="col" className="r">
                    Fuori campione dal {fuoriDa}
                  </th>
                  <th scope="col" className="r">
                    Tutto {tutto.da.slice(0, 4)}–{tutto.a.slice(0, 4)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {RIGHE.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    {[dentro, fuori, tutto].map((p, i) => (
                      <td key={i} className={`r${r.bad ? " text-bad" : ""}`}>
                        {r.f(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <p className="t-sec">
            La t è somma dei risultati diviso (deviazione standard × radice del numero di operazioni), con la deviazione
            standard misurata sulle operazioni di quel periodo. Il drawdown “del backtest” è quello della sola sequenza
            storica, in R: la sua distribuzione vera è nell’ultimo grafico.
          </p>
        </Reveal>

        {/* grafici */}
        <div className="charts">
          <Reveal className="is-wide">
            <ChartFrame
              id={`${pid}-curva`}
              titolo={`${m.nome}: risultato cumulato in R, operazione per operazione`}
              sotto={`Periodo di costruzione attenuato, fuori campione (dal ${fuoriDa}) a colore pieno. Senza lisciature.`}
              descrizione={`Grafico a linee, backtest ${mesiOps[0].slice(0, 4)}–${ULTIMO_MESE.slice(0, 4)}: risultato cumulato in R di ${m.nome} su ${int(n)} operazioni, da 0 a ${R(tutto.somma_R)}. Periodo di costruzione ${R(dentro.somma_R)} su ${int(dentro.n)} operazioni; fuori campione dal ${meseLungo(s.fuori_da)} ${R(fuori.somma_R)} su ${int(fuori.n)}. La curva non sale in linea retta: il calo più profondo è ${it(tutto.dd_max_R, 1)} R.`}
              legenda={[
                { nome: `Periodo di costruzione (${dentro.da.slice(0, 4)}–${annoDentroFine}), attenuato`, colore: m.colore, opacita: 0.45 },
                { nome: `Fuori campione (dal ${fuoriDa})`, colore: m.colore },
              ]}
              tabella={tabCurva}
            >
              <LineChart
                xMax={n - 1}
                xTicks={anni}
                xClass="chart__x--anni"
                regioni={[{ da: k, a: n - 1, label: "fuori campione" }]}
                marcatori={[{ x: k }]}
                serie={[
                  { id: "dentro", punti: curvaDentro, colore: m.colore, opacita: 0.45 },
                  { id: "fuori", punti: curvaFuori, colore: m.colore, fine: R(tutto.somma_R) },
                ]}
              />
            </ChartFrame>
          </Reveal>

          <Reveal i={1}>
            <ChartFrame
              id={`${pid}-dd`}
              titolo={`${m.nome}: drawdown in R, operazione per operazione`}
              sotto="Distanza dal massimo precedente della curva. Zero = nuovo massimo."
              descrizione={`Grafico ad area, backtest: drawdown in R di ${m.nome} a ogni operazione. Il punto più profondo è ${it(tutto.dd_max_R, 1)} R, nel ${meseLungo(mesiOps[iDd])}. La serie di perdite consecutive più lunga è di ${tutto.perdite_consecutive_max} operazioni.`}
              tabella={tabDd}
              nota={
                <p>
                  Il punto più basso, {it(tutto.dd_max_R, 1)} R, è del {meseLungo(mesiOps[iDd])}. A rischio 1% per
                  operazione vale circa il {it(tutto.dd_max_R, 0)}% dal massimo, senza composto.
                </p>
              }
            >
              <LineChart
                xMax={n - 1}
                xTicks={anni}
                xClass="chart__x--anni"
                marcatori={[{ x: k, label: `fuori campione` }]}
                serie={[{ id: "dd", punti: ddPunti, colore: "var(--bad)", larghezza: 1.5, area: true }]}
                etichette={[{ x: iDd, y: -s.drawdown[iDd], testo: `−${it(s.drawdown[iDd], 1)} R`, colore: "var(--bad)", sotto: true }]}
              />
            </ChartFrame>
          </Reveal>

          <Reveal i={2}>
            <ChartFrame
              id={`${pid}-roll`}
              titolo={`${m.nome}: media di R sulle ultime ${s.rolling.finestra} operazioni`}
              sotto="Media mobile del risultato per operazione. Sotto la linea dello zero la strategia stava perdendo."
              descrizione={`Grafico a linee, backtest: media mobile di R su ${s.rolling.finestra} operazioni di ${m.nome}, dalla operazione ${int(r0 + 1)} in poi. Va da ${signed(rollMin, 3)} a ${signed(rollMax, 3)} R; è sotto zero in ${int(rollNeg)} finestre su ${int(s.rolling.valori.length)}. Media dell'intero periodo ${signed(tutto.R_per_op, 4)} R.`}
              tabella={tabRoll}
              nota={
                <p>
                  Sotto zero in {int(rollNeg)} finestre su {int(s.rolling.valori.length)}: sono i tratti in cui, guardando
                  le ultime {s.rolling.finestra} operazioni, il sistema sembrava non funzionare. Media dell’intero periodo:{" "}
                  {signed(tutto.R_per_op, 4)} R.
                </p>
              }
            >
              <LineChart
                xMax={n - 1}
                xTicks={anni}
                xClass="chart__x--anni"
                yFormat={(v) => it(v, 2)}
                marcatori={[{ x: k, label: `fuori campione` }]}
                serie={[{ id: "roll", punti: rollPunti, colore: m.colore, fine: signed(s.rolling.valori[s.rolling.valori.length - 1], 3) }]}
              />
            </ChartFrame>
          </Reveal>

          <Reveal i={3}>
            <ChartFrame
              id={`${pid}-anni`}
              titolo={`${m.nome}: risultato per anno in R`}
              sotto={`* ${ANNO_PARZIALE}: anno parziale, fino a settembre.`}
              descrizione={`Grafico a barre, backtest: risultato in R per anno di ${m.nome}. ${anniLista.map((a) => `${annoLabel(a)} ${R(s.per_anno[a])}`).join(", ")}.`}
              tabella={tabAnni}
            >
              <YearBars perAnno={s.per_anno} colore={m.colore} />
            </ChartFrame>
          </Reveal>

          <Reveal i={4}>
            <ChartFrame
              id={`${pid}-boot`}
              titolo={`${m.nome}: quanto può scendere, secondo il bootstrap a blocchi`}
              sotto={`Drawdown massimo in ${int(b.campioni)} sequenze rimescolate a blocchi di ${b.blocco} operazioni consecutive.`}
              descrizione={`Istogramma, backtest: distribuzione del drawdown massimo di ${m.nome} in ${int(b.campioni)} sequenze ottenute rimescolando le operazioni a blocchi di ${b.blocco}. Mediana ${it(b.p50, 1)} R, 90° percentile ${it(b.p90, 1)} R, 95° ${it(b.p95, 1)} R, 99° ${it(b.p99, 1)} R. Il drawdown della sequenza storica, ${it(b.storico, 1)} R, sta al ${it(b.percentile_storico, 0)}° percentile.`}
              unita="R (asse verticale: % dei campioni)"
              tabella={tabBoot}
              nota={
                <>
                  <p>
                    <strong>Cosa significa.</strong> Il backtest mostra un solo ordine delle operazioni. Qui le stesse
                    operazioni sono rimescolate {int(b.campioni)} volte a blocchi di {b.blocco} consecutive, così le serie
                    di perdite restano intere, e per ogni sequenza si misura il calo più profondo. Il 90° percentile,{" "}
                    <b className="text-bad">{it(b.p90, 1)} R</b>, vuol dire che in 9 sequenze su 10 il drawdown è
                    rimasto sotto quel valore; in 1 su 10 lo ha superato. Il drawdown storico ({it(b.storico, 1)} R) sta
                    al {it(b.percentile_storico, 0)}° percentile: {b.percentile_storico < 50 ? "la sequenza storica è stata più fortunata della metà di quelle possibili" : "non è stato un caso fortunato"}.
                  </p>
                  <p>
                    A rischio 1% per operazione, {it(b.p90, 1)} R sono circa il {it(b.p90, 0)}% dal massimo (senza composto); a
                    0,5%, circa il {it(b.p90 / 2, 0)}%. Il rischio per operazione lo sceglie chi opera.
                  </p>
                </>
              }
            >
              <Histogram b={b} colore={m.colore} />
            </ChartFrame>
          </Reveal>

          <Reveal className="is-wide">
            <ChartFrame
              id={`${pid}-mesi`}
              titolo={`${m.nome}: risultato di ogni mese in R`}
              sotto={`Anno per riga, mese per colonna. ${int(s.mesi_negativi)} mesi in perdita su ${int(mesiOrd.length)}. Mese peggiore ${meseLungo(s.mese_peggiore.mese)} (${R(s.mese_peggiore.R)}), migliore ${meseLungo(s.mese_migliore.mese)} (${R(s.mese_migliore.R)}).`}
              descrizione={`Mappa anno per mese, backtest: risultato mensile in R di ${m.nome} su ${int(mesiOrd.length)} mesi. ${int(s.mesi_negativi)} mesi in perdita. Mese peggiore ${meseLungo(s.mese_peggiore.mese)} con ${R(s.mese_peggiore.R)}, migliore ${meseLungo(s.mese_migliore.mese)} con ${R(s.mese_migliore.R)}. I valori sono nella tabella “Vedi i numeri”.`}
              tabella={tabMesi}
            >
              <Heatmap perMese={s.per_mese} ultimoMese={ULTIMO_MESE} />
            </ChartFrame>
          </Reveal>
        </div>

        <Reveal className="callout prose">
          <p>
            <strong>I numeri scomodi:</strong> {testi.scomodi}
          </p>
        </Reveal>
        <Reveal i={1}>
          <p className="t-sec">
            <strong className="text-ink">Per anno (backtest, in R):</strong> <span className="mono">{testi.anni}</span>
          </p>
        </Reveal>
      </div>
    </article>
  );
}
