import { BacktestTag, Reveal, SceneHeader, TableScroll } from "@/components/site/ui";

const DD_MAX = 30; // scala delle barre: 0-30 R

const RIGHE = [
  { nome: "Oro (XAUUSD)", dd: 27.5, ddTxt: "27,5 R", serie: 14 },
  { nome: "Nasdaq", dd: 13.7, ddTxt: "13,7 R", serie: 7 },
  { nome: "USDJPY", dd: 14.0, ddTxt: "14,0 R", serie: 8 },
];

/**
 * COPY.md v2, 3.6. Il bootstrap a blocchi sulla misura piu' recente non e' ancora
 * stato eseguito ([DA COMPLETARE]): lo si dice, non si mette un numero vecchio.
 */
export function Rischio() {
  return (
    <section id="rischio" data-scene className="scene" aria-labelledby="rischio-t">
      <div className="wrap">
        <SceneHeader n="07" label="Rischio" id="rischio-t" title={["Il rischio vero,", "non quello del backtest"]} />

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
                <strong>Non ancora disponibile:</strong> il bootstrap sulla misura più recente delle tre strategie (90° e
                99° percentile del drawdown per un rischio per operazione dichiarato). Lo strumento esiste; il risultato
                sarà pubblicato qui quando ci sarà, con la scritta “backtest”.
              </p>
            </Reveal>
          </div>

          <div className="space-y-6 lg:col-span-7">
            <Reveal i={1} className="space-y-3">
              <BacktestTag />
              <TableScroll label="Drawdown massimo del backtest e perdite consecutive per strategia (backtest, in R)">
                <table className="dtable">
                  <caption>Il drawdown del backtest, in R (una sola sequenza, quella storica)</caption>
                  <thead>
                    <tr>
                      <th scope="col">Strategia</th>
                      <th scope="col" className="r">Drawdown massimo del backtest</th>
                      <th scope="col" className="r">Perdite consecutive massime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RIGHE.map((r) => (
                      <tr key={r.nome}>
                        <th scope="row">{r.nome}</th>
                        <td className="r">
                          <span className="block text-base">{r.ddTxt}</span>
                          <span className="bar mt-2" aria-hidden="true">
                            <i className="neg" style={{ left: 0, width: `${(r.dd / DD_MAX) * 100}%` }} />
                          </span>
                        </td>
                        <td className="r">
                          <span className="block text-base">{r.serie}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
              <p className="t-note">Le barre vanno da 0 a 30 R.</p>
            </Reveal>
            <Reveal i={2} className="prose space-y-4">
              <p>
                Lettura: “27,5 R” vuol dire che, rischiando 1% del conto per operazione, nel punto peggiore della
                simulazione l’oro era sotto di circa il 27% dal suo massimo, senza contare l’interesse composto. Con 0,5%
                per operazione, circa il 14%. Il rischio per operazione è una scelta di chi opera, non una proprietà del
                sistema.
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
