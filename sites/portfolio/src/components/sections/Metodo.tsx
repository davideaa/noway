import { Check } from "lucide-react";
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
];

function Esito() {
  return (
    <span className="inline-flex items-center gap-2 text-ok">
      <Check size={16} strokeWidth={1.6} aria-hidden />
      passa
    </span>
  );
}

export function Metodo() {
  return (
    <section id="metodo" data-scene className="scene" aria-labelledby="metodo-t">
      <div className="wrap">
        <SceneHeader n="02" label="Metodo" id="metodo-t" title={["Si decide prima,", "si misura dopo"]} />

        <Reveal className="prose">
          <p className="t-lead">
            Un backtest è facile da far uscire bene: basta provare abbastanza configurazioni e tenere la migliore. Per
            questo il lavoro segue tre regole. Non sono decorazione: sono il motivo per cui i numeri di questa pagina si
            possono discutere.
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
                  <em>Un esempio scomodo.</em> Per la strategia di ritracciamento erano stati fissati tre criteri: almeno
                  150 operazioni, profit factor almeno 1,20, t-statistica almeno 3,4. Su 192 configurazioni provate,{" "}
                  <strong>nessuna</strong> li ha centrati tutti e tre. La migliore arrivava a una t di 1,61. La strategia è
                  stata bocciata.
                </p>
              </Reveal>
              <Reveal i={2}>
                <p>
                  Poi è stata riaperta, e va detto come: la griglia di parametri aveva l’ottimo sul bordo, quindi non
                  aveva provato la zona giusta. Prima dell’estensione è stata scritta una regola di arresto (“se la t
                  resta sotto 2,5, la strategia è chiusa”). Dopo l’estensione la t è salita a 2,61. Resta sotto la soglia
                  iniziale di 3,4: la strategia è dentro il portafoglio come candidata credibile, non come caso chiuso.
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
                  Una parte dei dati (2024.01–2026.09) è rimasta chiusa durante tutta la costruzione. È stata aperta{" "}
                  <strong>una volta sola</strong>, con i criteri già scritti, senza ottimizzare niente.
                </p>
              </Reveal>

              <Reveal i={1} className="space-y-3">
                <BacktestTag />
                <TableScroll label="Criteri dichiarati prima del test e risultato ottenuto (backtest)">
                  <table className="dtable">
                    <caption>Fuori campione 2024.01–2026.09: criteri dichiarati prima, risultato ottenuto</caption>
                    <thead>
                      <tr>
                        <th scope="col">Criterio (dichiarato prima)</th>
                        <th scope="col" className="r">Soglia</th>
                        <th scope="col" className="r">Ottenuto</th>
                        <th scope="col">Esito</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">Guadagno medio per operazione</th>
                        <td className="r">≥ +0,050 R</td>
                        <td className="r">+0,2554 R</td>
                        <td><Esito /></td>
                      </tr>
                      <tr>
                        <th scope="row">Profit factor</th>
                        <td className="r">≥ 1,10</td>
                        <td className="r">1,526</td>
                        <td><Esito /></td>
                      </tr>
                      <tr>
                        <th scope="row">Perdita massima (a rischio 0,60%)</th>
                        <td className="r">≤ 27,4%</td>
                        <td className="r">8,26%</td>
                        <td><Esito /></td>
                      </tr>
                    </tbody>
                  </table>
                </TableScroll>
              </Reveal>

              <Reveal i={2}>
                <p>Tre criteri su tre. Ma ci sono quattro cose da leggere insieme a questa tabella.</p>
              </Reveal>

              <Reveal i={3}>
                <ol className="count space-y-4">
                  <li>
                    <strong>Va meglio fuori che dentro, e non è una buona notizia.</strong> Nel periodo di costruzione
                    (2019–2023) il guadagno medio è +0,1219 R con profit factor 1,23. Fuori campione è +0,2554 R con
                    profit factor 1,53. Il 2024–2026 è stato un periodo eccezionale per l’oro: il numero da usare per il
                    futuro è il più basso dei due, non il più alto.
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
                    statistica invece di migliorarla. In totale sono state provate 272 configurazioni.
                  </li>
                  <li>
                    <strong>Una scelta è stata fatta dopo aver guardato.</strong> Una terza strategia (vedi “Cosa è
                    stato scartato”) è stata tolta dopo aver visto il fuori campione. Di solito questo invalida il test.
                    Per questo esistono due numeri, tenuti separati:
                    <div className="mt-4 space-y-3">
                      <BacktestTag />
                      <TableScroll label="Portafoglio a tre gambe e a due gambe, simulazione a rischio 1,05% (backtest)">
                        <table className="dtable">
                          <caption>Simulazione a rischio 1,05%, fuori campione</caption>
                          <thead>
                            <tr>
                              <th scope="col">Portafoglio</th>
                              <th scope="col" className="r">Annuo (backtest)</th>
                              <th scope="col">Come leggerlo</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <th scope="row">Portafoglio a tre gambe</th>
                              <td className="r">22%</td>
                              <td>pulito: nessuna scelta fatta guardandolo</td>
                            </tr>
                            <tr>
                              <th scope="row">Portafoglio a due gambe (quello attuale)</th>
                              <td className="r">47%</td>
                              <td>contaminato dalla scelta a posteriori</td>
                            </tr>
                          </tbody>
                        </table>
                      </TableScroll>
                      <RiskNote level="1.05" />
                      <p>
                        Il valore vero sta in mezzo, più vicino al primo. Si decide con dati nuovi, non rianalizzando
                        questi. Sono percentuali di simulazione, non un obiettivo.
                      </p>
                    </div>
                  </li>
                  <li>
                    <strong>Il fuori campione, da solo, non dimostra niente.</strong> Il valore di quel test sta
                    nell’essere stato una prova sola, dichiarata prima.
                  </li>
                </ol>
              </Reveal>

              <Reveal i={4}>
                <details className="disclosure">
                  <summary>Lo stesso test, a tre gambe</summary>
                  <div className="disclosure__body prose space-y-3">
                    <BacktestTag />
                    <p>
                      Sulla versione a tre gambe, unica con la verifica fuori campione non contaminata: 891 operazioni,
                      guadagno medio +0,0618 R (soglia +0,050), profit factor 1,123 (soglia 1,10), perdita massima 10,85%
                      (soglia 27,4%). Passa tutti e tre i criteri, ma di poco sul guadagno medio. Il risultato è arrivato
                      al 24° percentile di quanto simulato: sotto la mediana, dentro la parte centrale. La t del solo
                      fuori campione è 1,39. Il guadagno medio in campione era +0,0953 R: l’edge si è ridotto di circa un
                      terzo, come ci si aspetta da parametri scelti guardando il primo periodo.
                    </p>
                  </div>
                </details>
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
                    <strong>ROTTURA:</strong> posizione nel range 0,91 con plateau 0,91–0,93; trailing con plateau fra 3
                    e 6 ATR.
                  </li>
                  <li>
                    <strong>RITRACCIAMENTO:</strong> media mobile a 30 periodi, collina fra 30 e 40.
                  </li>
                  <li>
                    <strong>Il caso opposto:</strong> nella prima prova del ritracciamento il profitto mediano rispetto
                    alla media mobile faceva così: 567 (periodo 30), −68 (60), 176 (90), 643 (120). Un buco in mezzo a
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
                    il mercato va a prendere gli stop. Costa circa il 16% del profitto di backtest. Non si riabbassa.
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
                    una delle strategie originali è passata da 6 a 98 punti R.
                  </li>
                  <li>
                    Le chiusure ereditavano l’etichetta sbagliata: il riepilogo per strategia era falso, anche se il
                    profitto totale no.
                  </li>
                  <li>
                    La deviazione standard usata come stima (1,26 R) era più bassa di quella misurata (1,45 R). Le t
                    calcolate prima vanno abbassate del 15% circa.
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
