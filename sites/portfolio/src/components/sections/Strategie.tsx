import { StrategyFlythrough } from "@/components/motion/StrategyFlythrough";
import { BacktestTag, Reveal, RiskNote, SceneHeader, TableScroll } from "@/components/site/ui";

/** Larghezza di una barra-dato divergente: scala da -2 a +5 R al mese, zero al 28,6%. */
const MIN = -2;
const MAX = 5;
const zeroPct = (-MIN / (MAX - MIN)) * 100;
function divergingBar(v: number) {
  const w = (Math.abs(v) / (MAX - MIN)) * 100;
  return v >= 0 ? { left: `${zeroPct}%`, width: `${w}%` } : { left: `${zeroPct - w}%`, width: `${w}%` };
}

const MESI: { nome: string; mesi: number; r: string; v: number; emph?: boolean }[] = [
  { nome: "Forte discesa (oltre −3%)", mesi: 8, r: "+2,15", v: 2.15 },
  { nome: "Discesa lenta (da −3% a −0,5%)", mesi: 23, r: "+1,57", v: 1.57 },
  { nome: "Fermo (±0,5%)", mesi: 14, r: "−1,54", v: -1.54, emph: true },
  { nome: "Salita lenta (da 0,5% a 3%)", mesi: 17, r: "+0,88", v: 0.88 },
  { nome: "Forte salita (oltre 3%)", mesi: 30, r: "+4,88", v: 4.88 },
];

function LayerCard({
  n,
  title,
  frame,
  children,
  rules,
}: {
  n: string;
  title: string;
  frame: string;
  children: React.ReactNode;
  rules: string[];
}) {
  return (
    <article className="zcard" aria-labelledby={`strat-${n}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">
          <b>Livello {n}</b>
        </p>
        <p className="eyebrow inline-flex items-center gap-2 text-oro!">
          <span aria-hidden className="inline-block size-2 rounded-full bg-oro" />
          XAUUSD · oro
        </p>
      </div>
      <h3 id={`strat-${n}`} className="mt-4 text-2xl font-medium tracking-[-0.04em] text-oro">
        {title} <span className="text-ink">· {frame}</span>
      </h3>
      <p className="mt-4 text-[15px] leading-[1.6] text-ink md:text-base">{children}</p>
      <ul className="ticks mt-4 text-sm text-ink">
        {rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </article>
  );
}

export function Strategie() {
  return (
    <section id="strategie" data-scene className="scene" aria-labelledby="strategie-t">
      <div className="wrap">
        <SceneHeader n="03" label="Strategie" id="strategie-t" title={["Due strategie,", "due orizzonti"]} />
        <div className="prose space-y-4">
          <Reveal>
            <p className="t-lead">
              Sono entrambe trend following: entrano quando il prezzo si muove in una direzione e ci restano finché il
              movimento regge. Non hanno un obiettivo di guadagno fisso (nessun take profit): un’uscita a obiettivo fisso
              è stata provata e peggiorava ogni configurazione. Quando il prezzo va bene, un’uscita che lo insegue (il
              trailing) lo lascia correre.
            </p>
          </Reveal>
          <Reveal i={1}>
            <p>
              Non si vince spesso: circa 42 operazioni su 100 chiudono in utile. Il conto torna perché le vincenti,
              lasciate correre, pesano più delle perdenti.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Volo attraverso i due livelli: la camera avanza lungo Z con lo scroll */}
      <div className="mt-12 md:mt-16">
        <StrategyFlythrough label="Le due strategie, un livello ciascuna">
          <LayerCard
            n="01"
            title="ROTTURA"
            frame="grafico M30"
            rules={[
              "Stop iniziale: 2,0 ATR (l’ATR è l’ampiezza media dei movimenti recenti).",
              "Nessun take profit.",
              "Trailing a 4,0 ATR, attivato quando l’operazione è a +1R.",
            ]}
          >
            Il prezzo chiude oltre il massimo (o sotto il minimo) delle ultime 60 barre da 30 minuti ed è già al bordo
            del proprio intervallo delle ultime 480 barre. Entra nella direzione dello sfondamento.
          </LayerCard>
          <LayerCard
            n="02"
            title="RITRACCIAMENTO"
            frame="grafico H4"
            rules={[
              "Stop sotto il minimo del ritracciamento, più un margine di 0,10 ATR.",
              "Nessun take profit.",
              "Trailing a 1,5 ATR, attivato a +1R. Attesa di 3 barre dopo un ingresso.",
            ]}
          >
            Il trend è stabilito (prezzo sopra la media mobile a 30 periodi, con la media inclinata). Il prezzo ritraccia
            di almeno 1 ATR dal massimo delle ultime 20 barre, poi riparte chiudendo sopra il massimo della barra
            precedente.
          </LayerCard>
        </StrategyFlythrough>
      </div>

      <div className="wrap mt-12 space-y-16 md:mt-16 md:space-y-24">
        {/* ---------- Tabella dei numeri ---------- */}
        <div className="space-y-6">
          <Reveal className="space-y-3">
            <BacktestTag>Backtest · non è un risultato reale</BacktestTag>
            <p className="t-sec">Backtest, 2019.01–2026.09, tick reali, ritardo 103 ms.</p>
          </Reveal>
          <Reveal i={1}>
            <TableScroll label="Operazioni, vincenti e profit factor per strategia e conto (backtest)">
              <table className="dtable">
                <caption className="sr-only">Numeri per strategia e conto</caption>
                <thead>
                  <tr>
                    <th scope="col">Strategia e conto</th>
                    <th scope="col" className="r">Operazioni</th>
                    <th scope="col" className="r">Vincenti</th>
                    <th scope="col" className="r">Profit factor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><th scope="row">ROTTURA, conto <span className="mono">.p</span></th><td className="r">567</td><td className="r">37,0%</td><td className="r">1,40</td></tr>
                  <tr><th scope="row">ROTTURA, conto <span className="mono">.s</span></th><td className="r">572</td><td className="r">36,5%</td><td className="r">1,35</td></tr>
                  <tr><th scope="row">RITRACCIAMENTO, conto <span className="mono">.p</span></th><td className="r">555</td><td className="r">47,7%</td><td className="r">1,25</td></tr>
                  <tr><th scope="row">RITRACCIAMENTO, conto <span className="mono">.s</span></th><td className="r">551</td><td className="r">47,7%</td><td className="r">1,22</td></tr>
                  <tr className="emph"><th scope="row">Insieme, conto <span className="mono">.p</span></th><td className="r">1.122</td><td className="r">42,3%</td><td className="r">1,33</td></tr>
                  <tr className="emph"><th scope="row">Insieme, conto <span className="mono">.s</span></th><td className="r">1.123</td><td className="r">42,0%</td><td className="r">1,30</td></tr>
                </tbody>
              </table>
            </TableScroll>
          </Reveal>
          <Reveal i={2} className="prose space-y-4">
            <p>
              Guadagno medio per operazione: +0,1710 R su <span className="mono">.p</span>, +0,1494 R su{" "}
              <span className="mono">.s</span>. Totale: 191,9 R su <span className="mono">.p</span>, 167,7 R su{" "}
              <span className="mono">.s</span>.
            </p>
            <RiskNote level="0.70" />
            <p>
              <strong>
                Come leggere <span className="mono">.p</span> e <span className="mono">.s</span>:
              </strong>{" "}
              sono due tipi di conto dello stesso broker (demo), con lo stesso oro ma costi diversi. Su{" "}
              <span className="mono">.p</span> le commissioni sono 7,03 $ a lotto; su <span className="mono">.s</span>{" "}
              sono zero, perché tutto è nello spread. Lo spread più largo di <span className="mono">.s</span> costa il
              13% del vantaggio. Non è una prova indipendente (stesso broker, stesso sottostante), ma mostra che il
              risultato non dipende da un solo listino.
            </p>
          </Reveal>
        </div>

        {/* ---------- Quando funziona ---------- */}
        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <h3 className="t-h2 lg:sticky lg:top-24">Cosa dice il mercato: quando funziona e quando no</h3>
          </Reveal>
          <div className="space-y-6 lg:col-span-8">
            <Reveal className="prose">
              <p>
                Il nemico non è la direzione: è l’immobilità. Nei mesi in cui l’oro sta fermo (±0,5%), le strategie
                perdono. Guadagnano anche quando l’oro scende: a produrre sono soprattutto le operazioni al ribasso.
              </p>
            </Reveal>
            <Reveal i={1} className="space-y-3">
              <BacktestTag />
              <TableScroll label="Risultato in R al mese secondo il movimento dell'oro (backtest)">
                <table className="dtable">
                  <caption className="sr-only">R al mese secondo il movimento dell’oro nel mese</caption>
                  <thead>
                    <tr>
                      <th scope="col">Cosa fa l’oro nel mese</th>
                      <th scope="col" className="r">Mesi</th>
                      <th scope="col" className="r">R al mese</th>
                      <th scope="col" aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {MESI.map((r) => (
                      <tr key={r.nome} className={r.emph ? "emph" : undefined}>
                        <th scope="row">{r.nome}</th>
                        <td className="r">{r.mesi}</td>
                        <td className={`r ${r.v < 0 ? "text-bad" : ""}`}>{r.r}</td>
                        <td aria-hidden="true" className="align-middle">
                          <span className="bar">
                            <u style={{ left: `${zeroPct}%` }} />
                            <i className={r.v < 0 ? "neg" : undefined} style={divergingBar(r.v)} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
              <RiskNote level="0.70" />
            </Reveal>
            <Reveal i={2} className="prose">
              <p>
                Due anni su sette, 2022 e 2024, il sistema ha lavorato a vuoto: 675 operazioni per il 9% del risultato.
                Chi lo guarda deve essere pronto a vederlo pareggiare per un anno intero.
              </p>
            </Reveal>
          </div>
        </div>

        {/* ---------- Strumenti ---------- */}
        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <h3 className="t-h2 lg:sticky lg:top-24">Su quali strumenti</h3>
          </Reveal>
          <Reveal i={1} className="prose space-y-4 lg:col-span-8">
            <p>
              Il lavoro documentato in questa pagina riguarda <strong>solo l’oro (XAUUSD)</strong>.
            </p>
            <p className="callout">
              <strong>Altri strumenti: in preparazione.</strong> Finché non ci sono numeri misurati e verificati, per
              altri strumenti non compare nessun risultato.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
