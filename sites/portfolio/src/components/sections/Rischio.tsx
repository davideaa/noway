import { BacktestTag, Reveal, SceneHeader, TableScroll } from "@/components/site/ui";
import { D, IDS, META, PORT } from "@/lib/dati";
import { int, it } from "@/lib/format";

/**
 * COPY.md v2, 3.6. Il drawdown del backtest e, dal bootstrap a blocchi di 20
 * (data/derivati.json, stessa logica di tools/montecarlo.py), la distribuzione
 * del drawdown per ogni strategia e per la somma a pari rischio. Le barre
 * sono in scala unica (0 - tetto della tabella), con il numero accanto.
 */
export function Rischio() {
  const righe = [
    ...IDS.map((id) => ({ nome: id === "oro" ? "Oro (XAUUSD)" : META[id].nome, p: D[id].periodi.tutto, b: D[id].bootstrap_dd })),
    { nome: "Tutte e tre, a pari rischio", p: PORT.stats, b: PORT.bootstrap_dd },
  ];
  const tetto = Math.ceil(Math.max(...righe.map((r) => r.b.p99)) / 10) * 10;
  const oro = D.oro;
  const nb = int(oro.bootstrap_dd.campioni);
  return (
    <section id="rischio" data-scene className="scene" aria-labelledby="rischio-t">
      <div className="wrap">
        <SceneHeader n="08" label="Rischio" id="rischio-t" title={["Il rischio vero,", "non quello del backtest"]} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="prose space-y-4 lg:col-span-5">
            <Reveal>
              <p className="t-lead">
                Il drawdown è la perdita massima dal picco più alto del conto. Un backtest ne mostra uno solo: quello di
                un solo ordine possibile delle operazioni. In un altro ordine il drawdown sarebbe diverso, e le perdite
                arrivano in serie.
              </p>
            </Reveal>
            <Reveal i={1}>
              <p>
                <strong>Perché non basta.</strong> Quattordici perdite di fila sull’oro sono già successe nel backtest; in
                un altro ordine delle stesse operazioni potrebbero essere di più. Per questo il drawdown vero si stima
                con un bootstrap a blocchi da 20: le operazioni vengono rimescolate a blocchi di 20 consecutive, così le
                serie di perdite restano intere. Si ripete migliaia di volte e si guarda la distribuzione, non il caso
                fortunato.
              </p>
            </Reveal>
            <Reveal i={2}>
              <p className="callout">
                <strong>Il risultato, sulla misura più recente:</strong> {nb} sequenze per strategia, blocchi di 20. Per
                l’oro il drawdown del backtest è {it(oro.periodi.tutto.dd_max_R, 1)} R, ma in una sequenza su dieci supera{" "}
                <b className="text-bad">{it(oro.bootstrap_dd.p90, 1)} R</b> e in una su cento {it(oro.bootstrap_dd.p99, 1)} R.
                La distribuzione completa di ciascuna strategia è nella sua scheda; quella della somma è nel Portafoglio.
              </p>
            </Reveal>
          </div>

          <div className="space-y-6 lg:col-span-7">
            <Reveal i={1} className="space-y-3">
              <BacktestTag />
              <TableScroll label="Drawdown del backtest, perdite consecutive e percentili del bootstrap a blocchi, per strategia e per la somma (backtest, in R)">
                <table className="dtable">
                  <caption>Il drawdown in R: la sequenza storica e i percentili del bootstrap a blocchi di 20 ({nb} sequenze)</caption>
                  <thead>
                    <tr>
                      <th scope="col">Strategia</th>
                      <th scope="col" className="r">Backtest</th>
                      <th scope="col" className="r">Perdite di fila</th>
                      <th scope="col" className="r">Mediana</th>
                      <th scope="col" className="r">90°</th>
                      <th scope="col" className="r">99°</th>
                    </tr>
                  </thead>
                  <tbody>
                    {righe.map((r) => (
                      <tr key={r.nome} className={r.nome.startsWith("Tutte") ? "emph" : undefined}>
                        <th scope="row">{r.nome}</th>
                        <td className="r">
                          <span className="block">{it(r.p.dd_max_R, 1)} R</span>
                          <span className="bar mt-2" aria-hidden="true">
                            <i className="neg" style={{ left: 0, width: `${(r.p.dd_max_R / tetto) * 100}%` }} />
                          </span>
                        </td>
                        <td className="r">{r.p.perdite_consecutive_max}</td>
                        <td className="r">{it(r.b.p50, 1)} R</td>
                        <td className="r text-bad">
                          <span className="block">{it(r.b.p90, 1)} R</span>
                          <span className="bar mt-2" aria-hidden="true">
                            <i className="neg" style={{ left: 0, width: `${(r.b.p90 / tetto) * 100}%` }} />
                          </span>
                        </td>
                        <td className="r text-bad">{it(r.b.p99, 1)} R</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
              <p className="t-note">
                Le barre vanno da 0 a {tetto} R. “Tutte e tre” è la somma a pari rischio (1 R per operazione per ciascuna).
              </p>
            </Reveal>
            <Reveal i={2} className="prose space-y-4">
              <p>
                Lettura: “{it(oro.periodi.tutto.dd_max_R, 1)} R” vuol dire che, rischiando 1% del conto per operazione, nel
                punto peggiore della simulazione l’oro era sotto di circa il {it(oro.periodi.tutto.dd_max_R, 0)}% dal suo
                massimo, senza contare l’interesse composto. Con 0,5% per operazione, circa il{" "}
                {it(oro.periodi.tutto.dd_max_R / 2, 0)}%. Il 90° percentile del bootstrap, {it(oro.bootstrap_dd.p90, 1)} R, è
                il numero con cui prepararsi: a 1% circa il {it(oro.bootstrap_dd.p90, 0)}%, a 0,5% circa il{" "}
                {it(oro.bootstrap_dd.p90 / 2, 0)}%. Il rischio per operazione è una scelta di chi opera, non una proprietà
                del sistema.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:mt-24 md:gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <h3 className="t-h2 lg:sticky lg:top-24">Cosa può andare storto</h3>
          </Reveal>
          <Reveal i={1} className="prose lg:col-span-8">
            <ul className="ticks">
              <li>
                <strong>Costi.</strong> Spread, commissioni e swap (il costo di tenere aperta la posizione) mangiano una
                parte del vantaggio, e sull’oro lo swap è il costo maggiore.
              </li>
              <li>
                <strong>Anni e mesi fermi.</strong> L’oro ha 40 mesi in perdita su 93, un anno chiuso in perdita (2021) e
                uno quasi a zero (2024). USDJPY è a +1,4 R nei nove mesi del 2026. Sono nello storico: capiteranno di
                nuovo.
              </li>
              <li>
                <strong>Una strategia con conferma debole.</strong> USDJPY fuori campione ha t 1,48 e un guadagno medio
                meno della metà di quello dentro. Se il calo è strutturale e non temporaneo, il portafoglio ha due gambe,
                non tre.
              </li>
              <li>
                <strong>Un solo regime.</strong> Sette anni sono un campione ampio di operazioni, non di regimi di
                mercato. Come sarebbe andata negli anni prima del 2019 non è verificabile con questi dati.
              </li>
              <li>
                <strong>Correlazioni non garantite.</strong> Le tre strategie non hanno perso insieme che in 6 mesi su 93.
                Non è una promessa: nei mesi di panico i mercati tendono a muoversi insieme più del solito.
              </li>
              <li>
                <strong>Esecuzione reale.</strong> Spread e slittamenti veri possono essere peggiori di quelli simulati.
                Nessun backtest lo può dire.
              </li>
              <li>
                <strong>Statistica.</strong> Il portafoglio è probabilmente reale, non certamente reale. Le t sono fra 3,3
                e 4,1 sull’intero periodo, ma i parametri sono stati scelti guardando una parte di quei dati, e il fuori
                campione è già stato speso.
              </li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
