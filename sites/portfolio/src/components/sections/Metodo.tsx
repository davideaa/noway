import { BacktestTag, Reveal, RiskNote, SceneHeader, TableScroll, Term } from "@/components/site/ui";

const GLOSSARIO: [string, string][] = [
  ["XAUUSD", "il prezzo dell’oro in dollari."],
  ["Trend following", "seguire il movimento del prezzo invece di scommettere sul suo ritorno."],
  ["Backtest", "simulazione di una strategia sui dati del passato. Non è un risultato reale."],
  [
    "R",
    "l’unità di misura dei risultati. 1 R è il rischio corso in quell’operazione: se in un’operazione si rischiano 100 €, +2 R vuol dire +200 €. Rende i risultati confrontabili qualunque sia il rischio scelto.",
  ],
  ["ATR", "l’ampiezza media dei movimenti recenti del prezzo. Serve a misurare stop e distanze in modo che si adattino alla volatilità."],
  ["Trailing", "un’uscita che segue il prezzo e si avvicina quando l’operazione va bene."],
  ["Profit factor", "guadagni totali diviso perdite totali. Sopra 1 si è in utile."],
  ["Guadagno medio per operazione", "il risultato medio in R."],
  ["Drawdown", "la perdita massima dal picco più alto del conto."],
  ["Bootstrap a blocchi", "simulazione che rimescola le operazioni a blocchi di 20 consecutive, mantenendo le serie di perdite."],
  ["Fuori campione", "dati tenuti chiusi durante la costruzione e usati una sola volta per verificare."],
  ["Plateau", "una zona di valori vicini che rende bene tutta, al contrario di un picco isolato."],
  ["Swap", "il costo (o il ricavo) di tenere una posizione aperta da un giorno all’altro."],
  ["t-statistica", "misura di quanto un risultato si distingue dal caso. Più è alta, meno è probabile che sia fortuna."],
  ["Correlazione", "un numero fra −1 e +1 che dice quanto due serie di risultati si muovono insieme. Vicino a 0, ognuna va per conto suo."],
];

/** COPY.md v2, 3.2. Numeri da data/strategie.json (oro dentro/fuori campione). */
export function Metodo() {
  return (
    <section id="metodo" data-scene className="scene" aria-labelledby="metodo-t">
      <div className="wrap">
        <SceneHeader n="02" label="Metodo" id="metodo-t" title={["Si decide prima,", "si misura dopo"]} />

        <Reveal className="prose space-y-4">
          <p className="t-lead">
            Un backtest è facile da far uscire bene: basta provare abbastanza configurazioni e tenere la migliore. Per
            questo il lavoro segue tre regole. Non sono decorazione: sono il motivo per cui i numeri di questa pagina si
            possono discutere.
          </p>
          <p className="t-sec">
            I numeri di questa pagina vengono dalla misura più recente del portafoglio (settembre 2026). La ricerca
            documentata nel repo è una versione precedente del sistema oro.
          </p>
        </Reveal>

        <div className="mt-12 space-y-16 md:space-y-24">
          {/* ---------- Regola 1 ---------- */}
          <article className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12" aria-labelledby="m1">
            <Reveal className="lg:col-span-4">
              <h3 id="m1" className="t-h2 lg:sticky lg:top-24">
                1. I criteri si scrivono prima del test
              </h3>
            </Reveal>
            <div className="prose space-y-6 lg:col-span-8">
              <Reveal>
                <p>
                  Prima di ogni prova si annota cosa deve succedere perché sia considerata riuscita: guadagno medio
                  minimo, profit factor minimo, perdita massima ammessa. Poi si guarda il risultato. Se è scomodo, si
                  rispetta lo stesso.
                </p>
              </Reveal>
              <Reveal className="callout" i={1}>
                <p>
                  <em>Un esempio scomodo.</em> Per la strategia di ritracciamento sull’oro erano stati fissati tre
                  criteri: almeno 150 operazioni, profit factor almeno 1,20, t-statistica almeno 3,4. Su 192
                  configurazioni provate, <strong>nessuna</strong> li ha centrati tutti e tre. La strategia è stata
                  bocciata.
                </p>
              </Reveal>
              <Reveal i={2}>
                <p>
                  Poi è stata riaperta, e va detto come: la griglia di parametri aveva l’ottimo sul bordo, quindi non
                  aveva provato la zona giusta. Prima dell’estensione è stata scritta una regola di arresto (“se la t
                  resta sotto 2,5, la strategia è chiusa”). Dopo l’estensione la regola di arresto è stata superata, ma la
                  soglia iniziale di 3,4 no. La strategia è entrata nel portafoglio come candidata credibile, non come
                  caso chiuso.
                </p>
              </Reveal>
            </div>
          </article>

          {/* ---------- Regola 2 ---------- */}
          <article className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12" aria-labelledby="m2">
            <Reveal className="lg:col-span-4">
              <h3 id="m2" className="t-h2 lg:sticky lg:top-24">
                2. Il fuori campione si usa una volta sola
              </h3>
            </Reveal>
            <div className="prose space-y-6 lg:col-span-8">
              <Reveal>
                <p>
                  Una parte dei dati (per oro e Nasdaq dal 2024.01; per USDJPY dal 2023.01) è rimasta chiusa durante la
                  costruzione. È stata aperta <strong>una volta sola</strong>, con i criteri già scritti, senza
                  ottimizzare niente.
                </p>
              </Reveal>

              <Reveal i={1} className="space-y-3">
                <BacktestTag />
                <TableScroll label="Oro, dentro e fuori campione (backtest)">
                  <table className="dtable">
                    <caption>Oro, dentro e fuori campione (backtest)</caption>
                    <thead>
                      <tr>
                        <th scope="col">Misura</th>
                        <th scope="col" className="r">Periodo di costruzione (2019–2023)</th>
                        <th scope="col" className="r">Fuori campione (2024.01–2026.09)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">Operazioni</th>
                        <td className="r">715</td>
                        <td className="r">408</td>
                      </tr>
                      <tr>
                        <th scope="row">Guadagno medio per operazione</th>
                        <td className="r">+0,1134 R</td>
                        <td className="r">+0,2534 R</td>
                      </tr>
                      <tr>
                        <th scope="row">t-statistica</th>
                        <td className="r">1,86</td>
                        <td className="r">3,21</td>
                      </tr>
                      <tr>
                        <th scope="row">Operazioni in utile</th>
                        <td className="r">40,6%</td>
                        <td className="r">45,1%</td>
                      </tr>
                    </tbody>
                  </table>
                </TableScroll>
                <RiskNote />
              </Reveal>

              <Reveal i={2}>
                <p>
                  Il criterio dichiarato prima sul guadagno medio (almeno +0,050 R per operazione) è passato. Ma ci sono
                  quattro cose da leggere insieme a questa tabella.
                </p>
              </Reveal>

              <Reveal i={3}>
                <ol className="count space-y-4">
                  <li>
                    <strong>Va meglio fuori che dentro, e non è una buona notizia.</strong> Il guadagno medio fuori
                    campione è più del doppio di quello del periodo di costruzione. Il 2024–2026 è stato un periodo
                    eccezionale per l’oro: il numero da usare per il futuro è il più basso dei due, non il più alto.
                  </li>
                  <li>
                    <strong>
                      Quel{" "}
                      <Term
                        id="tip-fc"
                        tip="Dati tenuti chiusi durante la costruzione e usati una sola volta per la verifica."
                      >
                        fuori campione
                      </Term>{" "}
                      è già stato speso.
                    </strong>{" "}
                    Non c’è più nessun dato mai visto. Provare altre configurazioni sugli stessi anni peggiora la
                    statistica invece di migliorarla. Nella ricerca sull’oro sono state provate in totale 272
                    configurazioni.
                  </li>
                  <li>
                    <strong>Una scelta è stata fatta dopo aver guardato.</strong> Una terza strategia sull’oro (vedi
                    “Cosa è stato scartato”) è stata tolta dopo aver visto il fuori campione. Di solito questo contamina
                    il test. Il fuori campione dell’oro va quindi letto come una conferma parziale, non come una prova
                    pulita. Si decide con dati nuovi, non rianalizzando questi.
                  </li>
                  <li>
                    <strong>Il fuori campione, da solo, non dimostra niente.</strong> Il valore di quel test sta
                    nell’essere stato una prova sola, dichiarata prima.
                  </li>
                </ol>
              </Reveal>

              <Reveal i={4}>
                <p>
                  Lo stesso confronto per Nasdaq e USDJPY è nelle loro schede. Una delle due, USDJPY, fuori campione va{" "}
                  <strong>peggio</strong> che dentro: è il caso più importante da tenere d’occhio.
                </p>
              </Reveal>
            </div>
          </article>

          {/* ---------- Regola 3 ---------- */}
          <article className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12" aria-labelledby="m3">
            <Reveal className="lg:col-span-4">
              <h3 id="m3" className="t-h2 lg:sticky lg:top-24">
                3. Si cerca un plateau, non un picco
              </h3>
            </Reveal>
            <div className="prose space-y-6 lg:col-span-8">
              <Reveal>
                <p>
                  Se un valore rende e i suoi vicini no, è fortuna. Per ogni parametro si guarda la collina intorno al
                  valore scelto, non il punto più alto.
                </p>
              </Reveal>
              <Reveal i={1}>
                <ul className="ticks">
                  <li>
                    <strong>ROTTURA (oro):</strong> posizione nel range 0,91 con plateau 0,91–0,93; trailing con plateau
                    fra 3 e 6 ATR.
                  </li>
                  <li>
                    <strong>RITRACCIAMENTO (oro):</strong> media mobile a 30 periodi, collina fra 30 e 40.
                  </li>
                  <li>
                    <strong>Il caso opposto:</strong> nella prima prova del ritracciamento, cambiando il periodo della
                    media mobile il profitto saliva, crollava sotto zero, risaliva e saliva ancora. Un buco in mezzo a
                    due picchi è la firma del rumore, non di una struttura.
                  </li>
                  <li>
                    <strong>Se l’ottimo sta sul bordo, la griglia era sbagliata.</strong> È successo tre volte. Tutte e
                    tre le volte, estenderla ha cambiato la conclusione.
                  </li>
                  <li>
                    <strong>Meglio del secondo miglior valore, non del migliore.</strong> Nel ritracciamento
                    l’ottimizzazione voleva il margine di sicurezza dello stop a 0,05 ATR. È stato fissato a 0,10, apposta:
                    0,05 ATR sull’oro valgono poco più dello spread, e uno stop appoggiato esattamente sul minimo è dove
                    il mercato va a prendere gli stop. Costa una parte del profitto di backtest. Non si riabbassa.
                  </li>
                </ul>
              </Reveal>
            </div>
          </article>

          {/* ---------- Errori ---------- */}
          <article className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12" aria-labelledby="m4">
            <Reveal className="lg:col-span-4">
              <h3 id="m4" className="t-h2 lg:sticky lg:top-24">
                Gli errori, dichiarati
              </h3>
            </Reveal>
            <div className="prose space-y-6 lg:col-span-8">
              <Reveal>
                <p>Sono stati commessi errori e sono scritti. Correggerli ha prodotto i risultati migliori.</p>
              </Reveal>
              <Reveal i={1}>
                <ul className="ticks">
                  <li>
                    Il trailing (l’uscita che insegue il prezzo) era uguale allo stop e tagliava i vincitori. Allargato,
                    il risultato di una delle strategie originali è cambiato di un ordine di grandezza.
                  </li>
                  <li>
                    Le chiusure ereditavano l’etichetta sbagliata: il riepilogo per strategia era falso, anche se il
                    profitto totale no.
                  </li>
                  <li>
                    La deviazione standard dei risultati usata come stima all’inizio era più bassa di quella misurata
                    sulle operazioni. Le t calcolate con la stima erano ottimistiche. Nella misura più recente la
                    deviazione standard è 1,62 R sull’oro, 1,10 R sul Nasdaq, 1,04 R su USDJPY, ed è quella usata per
                    tutte le t di questa pagina.
                  </li>
                  <li>Una strategia (EMA cross) era stata scartata per un motivo sbagliato. Vedi sotto.</li>
                </ul>
              </Reveal>
              <Reveal i={2}>
                <p>
                  <a href="#scartate" className="chip-btn no-underline">
                    Guarda cosa è stato scartato
                  </a>
                </p>
              </Reveal>
            </div>
          </article>

          {/* ---------- Glossario ---------- */}
          <Reveal>
            <details className="disclosure">
              <summary>Parole tecniche</summary>
              <div className="disclosure__body">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                  {GLOSSARIO.map(([t, d]) => (
                    <div key={t}>
                      <dt className="mono text-sm text-acc">{t}</dt>
                      <dd className="t-sec">{d}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </details>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
