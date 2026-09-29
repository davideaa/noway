import { ChartFrame, type Tabella } from "@/components/charts/Frame";
import { Histogram } from "@/components/charts/Histogram";
import { LineChart, type Marcatore } from "@/components/charts/Line";
import { BacktestTag, Reveal, RiskNote, SceneHeader, TableScroll, Term } from "@/components/site/ui";
import { D, IDS, MESI, META, PORT, ULTIMO_MESE, type Id } from "@/lib/dati";
import { R, int, it, meseIt, meseLungo, signed } from "@/lib/format";

/**
 * COPY.md v2, 3.4: correlazione dei risultati mensili su 93 mesi, con in piu'
 * (da data/derivati.json) la curva combinata a pari rischio, l'intervallo delle
 * correlazioni, i dieci mesi peggiori e il bootstrap del portafoglio. "Pari
 * rischio" = 1 R per operazione per ciascuna strategia: e' un'ipotesi
 * dichiarata, non una scelta di pesi gia' presa.
 */
const PAROLE: Record<string, string> = {
  "oro-nasdaq": "praticamente indipendenti",
  "oro-usdjpy": "praticamente indipendenti",
  "nasdaq-usdjpy": "leggermente opposte, ma il margine di errore copre anche lo zero",
};

export function Portafoglio() {
  const nMesi = MESI.length;
  const xMax = nMesi - 1;
  const anni = MESI.map((m, i) => ({ m, i })).filter(({ m }) => m.endsWith("-01")).map(({ m, i }) => ({ x: i, label: m.slice(0, 4) }));
  const tot = PORT.stats;
  const b = PORT.bootstrap_dd;
  const ddMensile = Math.max(...PORT.drawdown_mensile);
  const fine = (id: Id | "totale") => PORT.curva_mensile[id][xMax];
  const iUsd = MESI.indexOf(D.usdjpy.fuori_da);
  const iOro = MESI.indexOf(D.oro.fuori_da);
  const nTuttePeggiori = PORT.mesi_peggiori.filter((r) => IDS.every((id) => r[id] < 0)).length;
  const marcatori: Marcatore[] = [
    { x: iUsd, label: `fuori campione USDJPY (${meseIt(D.usdjpy.fuori_da)})`, breve: "f.c. USDJPY", riga: 1, basso: true },
    { x: iOro, label: `fuori campione oro e Nasdaq (${meseIt(D.oro.fuori_da)})`, breve: "f.c. oro, Nasdaq", riga: 0, basso: true },
  ];
  const anniLista = Object.keys(PORT.per_anno).sort();
  const tabCurva: Tabella = {
    didascalia: "Risultato per anno, in R, a pari rischio (backtest)",
    intestazioni: ["Anno", "Oro", "Nasdaq", "USDJPY", "Tutte e tre"],
    righe: anniLista.map((a) => [a === ULTIMO_MESE.slice(0, 4) ? `${a} (parziale)` : a, ...IDS.map((id) => R(D[id].per_anno[a])), R(PORT.per_anno[a])]),
  };
  const tabBoot: Tabella = {
    didascalia: `Drawdown massimo del portafoglio in ${int(b.campioni)} sequenze rimescolate a blocchi di ${b.blocco} (backtest, pari rischio)`,
    intestazioni: ["Misura", "Drawdown in R"],
    righe: [
      ["Backtest (sequenza storica, operazione per operazione)", it(b.storico, 1) + " R"],
      ["Mediana (50° percentile)", it(b.p50, 1) + " R"],
      ["90° percentile", it(b.p90, 1) + " R"],
      ["95° percentile", it(b.p95, 1) + " R"],
      ["99° percentile", it(b.p99, 1) + " R"],
      ["Caso peggiore simulato", it(b.max, 1) + " R"],
    ],
  };

  return (
    <section id="portafoglio" data-scene className="scene" aria-labelledby="portafoglio-t">
      <div className="wrap">
        <SceneHeader n="05" label="Portafoglio" id="portafoglio-t" title={["Tre strategie che", "non perdono negli stessi mesi"]} />

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
              <TableScroll label="Correlazione dei risultati mensili fra le tre strategie, con intervallo (backtest, 93 mesi)">
                <table className="dtable">
                  <caption>
                    Correlazione dei risultati mensili su {nMesi} mesi, {meseIt(MESI[0])} – {meseIt(ULTIMO_MESE)} (backtest)
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Coppia</th>
                      <th scope="col" className="r">
                        <Term id="tip-corr" tip="Quanto i risultati mensili di due strategie si muovono insieme: +1 sempre insieme, 0 indipendenti, −1 opposti. Su 93 mesi il margine di errore è circa ±0,2.">
                          Correlazione
                        </Term>
                      </th>
                      <th scope="col" className="r">Intervallo al 95%</th>
                      <th scope="col">In parole</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PORT.correlazioni.map((c) => (
                      <tr key={c.id}>
                        <th scope="row">
                          {META[c.a].nome} – {META[c.b].nome}
                        </th>
                        <td className="r">{signed(c.r, 2)}</td>
                        <td className="r">
                          da {signed(c.lo, 2)} a {signed(c.hi, 2)}
                        </td>
                        <td>{PAROLE[c.id]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
              <p className="t-sec">
                L’intervallo è quello al 95% (trasformazione di Fisher su {nMesi} mesi). Tutti e tre contengono lo zero:
                nessuna correlazione è distinguibile da zero.
              </p>
              <RiskNote />
            </Reveal>
          </div>
        </div>

        {/* ---------- curva combinata a pari rischio ---------- */}
        <Reveal className="mt-12 md:mt-16">
          <ChartFrame
            id="port-curva"
            titolo="Le tre curve sovrapposte e la loro somma, in R, mese per mese"
            sotto={`A pari rischio: 1 R per operazione per ciascuna strategia. Somma a fine periodo ${R(tot.somma_R)} su ${int(tot.n)} operazioni; drawdown della somma ${it(tot.dd_max_R, 1)} R operazione per operazione (${it(ddMensile, 1)} R sui mesi).`}
            descrizione={`Grafico a linee, backtest ${MESI[0].slice(0, 4)}–${ULTIMO_MESE.slice(0, 4)}: risultato cumulato in R, mese per mese, di oro (${R(fine("oro"))} su ${int(D.oro.n)} operazioni), Nasdaq (${R(fine("nasdaq"))} su ${int(D.nasdaq.n)}) e USDJPY (${R(fine("usdjpy"))} su ${int(D.usdjpy.n)}), e della loro somma a pari rischio (${R(fine("totale"))}). Le curve non salgono in linea retta: l'oro ha il calo più profondo, ${it(D.oro.periodi.tutto.dd_max_R, 1)} R; la somma cala al massimo di ${it(tot.dd_max_R, 1)} R.`}
            legenda={[
              { nome: `Tutte e tre, somma (${R(fine("totale"))})`, colore: "var(--ink)" },
              { nome: `Oro (${R(fine("oro"))})`, colore: META.oro.colore },
              { nome: `Nasdaq (${R(fine("nasdaq"))})`, colore: META.nasdaq.colore },
              { nome: `USDJPY (${R(fine("usdjpy"))}), tratteggiata`, colore: META.usdjpy.colore, tratteggio: true },
            ]}
            tabella={tabCurva}
            nota={
              <p>
                La somma a pari rischio è un’ipotesi dichiarata, non una scelta di pesi già presa: quando i pesi delle tre
                strategie saranno decisi, questa curva cambierà. Resta in R, con la scritta “backtest”, e con il suo
                drawdown accanto.
              </p>
            }
          >
            <LineChart
              xMax={xMax}
              xTicks={anni}
              xClass="chart__x--anni"
              altezza={300}
              marcatori={marcatori}
              serie={[
                { id: "oro", punti: PORT.curva_mensile.oro.map((y, i) => [i, y]), colore: META.oro.colore, larghezza: 1.5 },
                { id: "nasdaq", punti: PORT.curva_mensile.nasdaq.map((y, i) => [i, y]), colore: META.nasdaq.colore, larghezza: 1.5 },
                { id: "usdjpy", punti: PORT.curva_mensile.usdjpy.map((y, i) => [i, y]), colore: META.usdjpy.colore, larghezza: 1.5, tratteggio: true },
                { id: "totale", punti: PORT.curva_mensile.totale.map((y, i) => [i, y]), colore: "var(--ink)", larghezza: 2.5, fine: R(fine("totale")) },
              ]}
            />
          </ChartFrame>
        </Reveal>

        {/* ---------- mesi peggiori e mesi tutti in perdita ---------- */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:mt-16 md:gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <h3 className="t-h2 lg:sticky lg:top-24">I dieci mesi peggiori della somma, e cosa facevano le tre</h3>
          </Reveal>
          <div className="space-y-4 lg:col-span-8">
            <Reveal i={1} className="space-y-3">
              <BacktestTag />
              <TableScroll label="I dieci mesi peggiori del portafoglio a pari rischio e il risultato di ciascuna strategia (backtest, in R)">
                <table className="dtable">
                  <caption>I dieci mesi peggiori della somma a pari rischio, in R (backtest, {nMesi} mesi)</caption>
                  <thead>
                    <tr>
                      <th scope="col">Mese</th>
                      <th scope="col" className="r">Tutte e tre</th>
                      <th scope="col" className="r">Oro</th>
                      <th scope="col" className="r">Nasdaq</th>
                      <th scope="col" className="r">USDJPY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PORT.mesi_peggiori.map((r) => (
                      <tr key={r.mese}>
                        <th scope="row">{meseLungo(r.mese)}</th>
                        <td className="r text-bad">{R(r.totale)}</td>
                        {IDS.map((id) => (
                          <td key={id} className={`r${r[id] < 0 ? " text-bad" : ""}`}>
                            {R(r[id])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </Reveal>
            <Reveal i={2} className="prose">
              <ul className="ticks">
                <li>
                  <strong>
                    {PORT.mesi_tutte_negative.n === 6 ? "Sei" : PORT.mesi_tutte_negative.n} mesi su {nMesi} hanno perso tutte e tre insieme
                  </strong>{" "}
                  ({PORT.mesi_tutte_negative.mesi.map(meseLungo).join(", ")}). In {PORT.mesi_tutte_positive.n} mesi su {nMesi} hanno
                  guadagnato tutte e tre. Nei restanti {nMesi - PORT.mesi_tutte_negative.n - PORT.mesi_tutte_positive.n} mesi almeno una
                  compensava, in parte, le altre.
                </li>
                <li>
                  La somma a pari rischio ha chiuso in perdita {PORT.mesi_negativi} mesi su {nMesi} (oro {D.oro.mesi_negativi}, Nasdaq{" "}
                  {D.nasdaq.mesi_negativi}, USDJPY {D.usdjpy.mesi_negativi}). Nel mese peggiore, {meseLungo(PORT.mesi_peggiori[0].mese)}, la
                  somma ha perso {it(PORT.mesi_peggiori[0].totale, 1)} R. Dei dieci mesi peggiori, in {nTuttePeggiori} hanno perso tutte e
                  tre; negli altri {10 - nTuttePeggiori} almeno una era in utile.
                </li>
              </ul>
            </Reveal>
          </div>
        </div>

        {/* ---------- come leggerla ---------- */}
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
                  <strong>{nMesi} mesi sono pochi per una correlazione.</strong> Con {nMesi} osservazioni il margine di errore è
                  largo, all’incirca ±0,2 intorno al valore misurato (gli intervalli nella tabella). Vuol dire che nessuno
                  dei tre numeri si distingue davvero dallo zero, e che nemmeno il −0,15 fra Nasdaq e USDJPY è una
                  compensazione dimostrata. La lettura onesta è: “non sembrano muoversi insieme”, non “si proteggono a
                  vicenda”.
                </li>
                <li>
                  <strong>Le correlazioni cambiano nei momenti peggiori.</strong> Una correlazione media su sette anni
                  non dice cosa succede in un mese di panico, quando molti mercati si muovono insieme. La tabella dei mesi
                  peggiori serve a questo.
                </li>
                <li>
                  Il portafoglio non è “più sicuro” delle sue parti: è meno esposto al caso in cui una sola strategia
                  smette di funzionare. USDJPY, con il suo fuori campione debole, è l’esempio concreto di perché serve.
                </li>
              </ul>
            </Reveal>
          </div>
        </div>

        {/* ---------- bootstrap del portafoglio ---------- */}
        <Reveal className="mt-12 md:mt-16">
          <ChartFrame
            id="port-boot"
            titolo="Quanto può scendere la somma delle tre, secondo il bootstrap a blocchi"
            sotto={`Le ${int(tot.n)} operazioni di tutte e tre, a pari rischio, rimescolate ${int(b.campioni)} volte a blocchi di ${b.blocco} consecutive.`}
            descrizione={`Istogramma, backtest: distribuzione del drawdown massimo del portafoglio a pari rischio in ${int(b.campioni)} sequenze rimescolate a blocchi di ${b.blocco}. Mediana ${it(b.p50, 1)} R, 90° percentile ${it(b.p90, 1)} R, 95° ${it(b.p95, 1)} R, 99° ${it(b.p99, 1)} R. Il drawdown della sequenza storica, ${it(b.storico, 1)} R, sta al ${it(b.percentile_storico, 0)}° percentile.`}
            unita="R (asse verticale: % dei campioni)"
            tabella={tabBoot}
            nota={
              <>
                <p>
                  <strong>Cosa significa.</strong> In 9 sequenze su 10 il drawdown della somma è rimasto sotto{" "}
                  <b className="text-bad">{it(b.p90, 1)} R</b>; in 1 su 100 ha superato {it(b.p99, 1)} R. Sono somme di R
                  delle tre strategie insieme: a rischio 1% per operazione per ciascuna, {it(b.p90, 1)} R sono circa il{" "}
                  {it(b.p90, 0)}% dal massimo (senza composto); a 0,5%, circa il {it(b.p90 / 2, 0)}%. Il drawdown storico della
                  somma ({it(b.storico, 1)} R) sta al {it(b.percentile_storico, 0)}° percentile.
                </p>
                <p>
                  I blocchi sono presi sulla sequenza di tutte e tre insieme, nell’ordine del file: dentro un blocco le
                  operazioni delle tre strategie restano vicine come lo erano davvero, quindi il rimescolamento conserva
                  anche i mesi in cui perdevano insieme.
                </p>
              </>
            }
          >
            <Histogram b={b} colore="var(--ink)" />
          </ChartFrame>
        </Reveal>
      </div>
    </section>
  );
}
