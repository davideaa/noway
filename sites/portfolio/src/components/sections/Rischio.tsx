import { BacktestTag, Reveal, SceneHeader, TableScroll } from "@/components/site/ui";

const DD_MAX = 50; // scala delle barre: 0-50%

const RIGHE = [
  { rischio: "0,70%", nota: "impostazione di partenza dell’EA", p90: 26, p99: 35 },
  { rischio: "1,05%", nota: "", p90: 35, p99: 49 },
];

export function Rischio() {
  return (
    <section id="rischio" data-scene className="scene" aria-labelledby="rischio-t">
      <div className="wrap">
        <SceneHeader n="05" label="Rischio" id="rischio-t" title={["Il rischio vero,", "non quello del backtest"]} />

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
                Per questo il drawdown si stima con un bootstrap a blocchi da 20: le operazioni vengono rimescolate a
                blocchi di 20 consecutive, così le serie di perdite restano intere. Si ripete migliaia di volte e si
                guarda la distribuzione, non il caso fortunato.
              </p>
            </Reveal>
          </div>

          <div className="space-y-6 lg:col-span-7">
            <Reveal i={1} className="space-y-3">
              <BacktestTag />
              <TableScroll label="Drawdown simulato per rischio per operazione (bootstrap a blocchi, backtest)">
                <table className="dtable">
                  <caption>Tabella (simulazione bootstrap a blocchi, XAUUSD.p)</caption>
                  <thead>
                    <tr>
                      <th scope="col">Rischio per operazione</th>
                      <th scope="col" className="r">Drawdown: 90% degli scenari sotto</th>
                      <th scope="col" className="r">99° percentile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RIGHE.map((r) => (
                      <tr key={r.rischio}>
                        <th scope="row">
                          <span className="mono text-base">{r.rischio}</span>
                          {r.nota && <span className="t-note block">({r.nota})</span>}
                        </th>
                        <td className="r">
                          <span className="block text-base">{r.p90}%</span>
                          <span className="bar mt-2" aria-hidden="true">
                            <i className="neg" style={{ left: 0, width: `${(r.p90 / DD_MAX) * 100}%` }} />
                          </span>
                        </td>
                        <td className="r">
                          <span className="block text-base">{r.p99}%</span>
                          <span className="bar mt-2" aria-hidden="true">
                            <i className="neg" style={{ left: 0, width: `${(r.p99 / DD_MAX) * 100}%` }} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
              <p className="t-note">Le barre vanno da 0% a 50% di drawdown.</p>
            </Reveal>
            <Reveal i={2} className="prose space-y-4">
              <p>
                Lettura: più rischio per operazione, più drawdown. Da 0,70% a 1,05% il 90° percentile passa dal 26% al
                35%. Il rischio per operazione è una scelta di chi opera, non una proprietà del sistema.
              </p>
              <p>
                Un riscontro: su <span className="mono">.s</span> a 0,70%, il drawdown vero del backtest (18,20%) è
                caduto esattamente sulla mediana simulata (18,2%). Nessun percorso fortunato.
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
                <strong>Costi.</strong> Lo swap (il costo di tenere aperta la posizione) è il costo maggiore, cinque volte
                le commissioni: −85 $ a lotto sulle operazioni long, +45 $ sulle short. È già compreso nei numeri. Il
                sistema smette di funzionare a 3 volte i costi attuali.
              </li>
              <li>
                <strong>Anni e mesi fermi.</strong> Vedi sopra: 14 mesi con oro fermo in perdita, e anni interi a
                pareggiare.
              </li>
              <li>
                <strong>Un solo regime.</strong> Sette anni sono un campione ampio di operazioni, non di regimi di
                mercato. Come sarebbe andata nell’oro degli anni 2011–2018 non è verificabile.
              </li>
              <li>
                <strong>Esecuzione reale.</strong> Spread e slittamenti veri possono essere peggiori di quelli simulati.
                Nessun backtest lo può dire.
              </li>
              <li>
                <strong>Statistica.</strong> Il portafoglio è probabilmente reale, non certamente reale. La t è sotto la
                soglia inizialmente richiesta, e sono state provate 272 configurazioni.
              </li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
