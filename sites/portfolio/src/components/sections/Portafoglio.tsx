import { BacktestTag, Reveal, RiskNote, SceneHeader, TableScroll } from "@/components/site/ui";

const COPPIE = [
  { coppia: "Oro – Nasdaq", corr: "+0,05", parole: "praticamente indipendenti" },
  { coppia: "Oro – USDJPY", corr: "−0,06", parole: "praticamente indipendenti" },
  { coppia: "Nasdaq – USDJPY", corr: "−0,15", parole: "leggermente opposte, ma il margine di errore copre anche lo zero" },
];

/**
 * COPY.md v2, 3.4 (nuova): correlazione dei risultati mensili, 93 mesi, da
 * data/strategie.json. Niente curva unica con percentuali annue: i pesi delle
 * tre strategie non sono nei file ([DA COMPLETARE], omesso).
 */
export function Portafoglio() {
  return (
    <section id="portafoglio" data-scene className="scene" aria-labelledby="portafoglio-t">
      <div className="wrap">
        <SceneHeader
          n="04"
          label="Portafoglio"
          id="portafoglio-t"
          title={["Tre strategie che", "non perdono negli stessi mesi"]}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <Reveal className="prose lg:col-span-5">
            <p className="t-lead">
              Mettere insieme tre strategie serve a una cosa sola: che i mesi cattivi dell’una non coincidano con quelli
              delle altre. Non è garantito. Si misura con la correlazione dei risultati mensili: un numero fra −1 e +1.
              Vicino a +1, le due strategie guadagnano e perdono negli stessi mesi. Vicino a 0, ognuna va per conto suo.
              Sotto zero, quando una perde l’altra tende a guadagnare.
            </p>
          </Reveal>

          <div className="space-y-3 lg:col-span-7">
            <Reveal i={1} className="space-y-3">
              <BacktestTag />
              <TableScroll label="Correlazione dei risultati mensili fra le tre strategie (backtest, 93 mesi)">
                <table className="dtable dtable--narrow">
                  <caption>Correlazione dei risultati mensili su 93 mesi, 2019.01–2026.09 (backtest)</caption>
                  <thead>
                    <tr>
                      <th scope="col">Coppia</th>
                      <th scope="col" className="r">Correlazione mensile</th>
                      <th scope="col">In parole</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COPPIE.map((c) => (
                      <tr key={c.coppia}>
                        <th scope="row">{c.coppia}</th>
                        <td className="r">{c.corr}</td>
                        <td>{c.parole}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
              <RiskNote />
            </Reveal>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:mt-16 md:gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <h3 className="t-h2 lg:sticky lg:top-24">Come leggerla, con la cautela dovuta</h3>
          </Reveal>
          <div className="prose space-y-6 lg:col-span-8">
            <Reveal i={1}>
              <ul className="ticks">
                <li>
                  Tutte e tre le correlazioni sono vicine a zero. È quello che si vuole da un portafoglio: nessuna coppia
                  tende a perdere insieme.
                </li>
                <li>
                  <strong>93 mesi sono pochi per una correlazione.</strong> Con 93 osservazioni il margine di errore è
                  largo, all’incirca ±0,2 intorno al valore misurato. Vuol dire che nessuno dei tre numeri si distingue
                  davvero dallo zero, e che nemmeno il −0,15 fra Nasdaq e USDJPY è una compensazione dimostrata. La
                  lettura onesta è: “non sembrano muoversi insieme”, non “si proteggono a vicenda”.
                </li>
                <li>
                  <strong>Le correlazioni cambiano nei momenti peggiori.</strong> Una correlazione media su sette anni
                  non dice cosa succede in un mese di panico, quando molti mercati si muovono insieme. Il conteggio qui
                  sotto serve a questo.
                </li>
                <li>
                  <strong>Sei mesi su 93 hanno perso tutte e tre insieme</strong> (marzo e aprile 2019, agosto 2022,
                  aprile e giugno 2023, giugno 2025). In 24 mesi su 93 hanno guadagnato tutte e tre. Nei restanti 63 mesi
                  almeno una compensava, in parte, le altre.
                </li>
                <li>
                  Il portafoglio non è “più sicuro” delle sue parti: è meno esposto al caso in cui una sola strategia
                  smette di funzionare. USDJPY, con il suo fuori campione debole, è l’esempio concreto di perché serve.
                </li>
              </ul>
            </Reveal>
            <Reveal i={2} className="callout">
              <p>
                <strong>Cosa non c’è in questa sezione, di proposito:</strong> una curva unica del portafoglio con
                percentuali annue. Sommare le tre strategie richiede di scegliere quanto rischio dare a ciascuna, e quella
                scelta non è ancora stata fatta. Quando ci sarà, la curva sarà in R, con la scritta “backtest”, e accanto
                il drawdown.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
