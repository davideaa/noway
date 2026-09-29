import { SimulatorFrame } from "@/components/site/SimulatorFrame";
import { BacktestTag, Reveal, SceneHeader } from "@/components/site/ui";
import { DERIVATI } from "@/lib/dati";
import { int } from "@/lib/format";

/**
 * Il simulatore incorporato. E' un file autonomo di Davide (public/simulatore/
 * index.html): qui non si tocca. La nota sulla dicitura "DATI REALI" viene da
 * DA-COMPLETARE.md, punto 15: e' scritta in pagina perche' chi legge non
 * scambi un backtest per un risultato reale.
 */
export function Simulatore() {
  return (
    <section id="simulatore" data-scene className="scene" aria-labelledby="simulatore-t">
      <div className="wrap">
        <SceneHeader n="06" label="Simulatore" id="simulatore-t" title={["Le stesse operazioni,", "rimescolate davanti a te"]} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <Reveal className="prose space-y-4 lg:col-span-7">
            <p className="t-lead">
              Il simulatore parte dalle stesse {int(DERIVATI.operazioni)} operazioni di backtest di questa pagina e le
              rimescola per mostrare quanti percorsi diversi possono uscire dalla stessa storia. Si può cambiare il rischio
              per operazione e vedere cosa succede al drawdown.
            </p>
            <p className="t-sec">
              È uno strumento separato, con una sua grafica. Le cifre che mostra sono in percentuale del conto e dipendono
              dal rischio scelto: i numeri di riferimento restano quelli in R di questa pagina.
            </p>
          </Reveal>
          <Reveal i={1} className="space-y-3 lg:col-span-5">
            <BacktestTag />
            <p className="callout">
              <strong>Nota di lettura.</strong> Dentro il simulatore compare la dicitura «DATI REALI · 10.000 possibili
              futuri». Va letta come «dati del backtest, 10.000 sequenze simulate»: in questo lavoro non ci sono ancora
              risultati reali, e la dicitura è in revisione.
            </p>
          </Reveal>
        </div>
        <Reveal className="mt-8">
          <SimulatorFrame src="/simulatore/" title="Simulatore del portafoglio: le operazioni di backtest rimescolate" />
        </Reveal>
      </div>
    </section>
  );
}
